# Matrix Chat Ecosystem

A community-focused, self-hosted **Matrix chat ecosystem**: Synapse homeserver + Matrix Authentication Service (MAS) + web clients (Element & Cinny) + admin UIs + nginx reverse proxy + Postgres + optional ntfy push.

This repo is not a new homeserver implementation — it **assembles upstream projects** into a single deployable setup using Docker Compose, with practical configuration and notes for offline/isolated environments.

## What’s included

| Service | Purpose |
| --- | --- |
| Synapse | Matrix homeserver |
| MAS (Matrix Authentication Service) | Login/registration/OIDC (next-gen auth) |
| Element Web | Main web client |
| Cinny | Alternative lightweight web client |
| FluffyChat Web | Alternative Flutter-based web client |
| Synapse Admin | Admin dashboard for Synapse |
| MAS Admin | Admin UI for MAS (users, tokens, sessions) |
| nginx | Reverse proxy + routing (+ TLS in production) |
| Postgres | Database backend (creates `matrix` + `mas`) |
| ntfy (optional) | Self-hosted UnifiedPush provider (useful where FCM is unreliable/blocked) |

## Example URLs (production)

You can host these on one domain or split them — this is only a typical mapping:

| Service | Example |
| --- | --- |
| Chat (Element Web) | `https://chat.example.com` |
| Matrix API | `https://matrix.example.com` |
| Auth (MAS account page) | `https://auth.example.com` |
| Push (ntfy) | `https://push.example.com` |
| MAS Admin Panel | `https://matrix.example.com/mas-admin/` |
| Synapse Admin Dashboard | `https://matrix.example.com/synapse-admin/` |

Configure the actual domains/paths in the nginx + Synapse + MAS configs.

## Quick start (local)

This repo includes a local override compose file for running on `localhost`:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Local access:

- Element: `http://localhost`
- Synapse API (direct): `http://localhost:8008`
- Synapse Admin (via nginx): `http://localhost/synapse-admin/`

## First-time setup

### 1) Create local config files

> **⚠️ Required before first run.**  
> All real config files are gitignored and **not present** in the repository.  
> The stack will not start correctly until every file below exists with your actual values.  
> Each `*.example` file is a template — copy it, then fill in your domains and secrets.

```bash
cp .env.example .env
cp synapse/homeserver.yaml.example synapse/homeserver.yaml
cp mas/config.yaml.example mas/config.yaml
cp ntfy/server.yml.example ntfy/server.yml
cp nginx/default.conf.example nginx/default.conf
cp element/config.json.example element/config.json
cp element/home.html.example element/home.html
cp element/welcome.html.example element/welcome.html
cp cinny/config.json.example cinny/config.json
cp fluffychat/config.json.example fluffychat/config.json
cp synapse-admin/config.json.example synapse-admin/config.json
```

Replace every occurrence of `example.com` with your actual domain across all copied files, then edit:

- `.env` (Postgres credentials, domain vars)
- `synapse/homeserver.yaml` (server name, public_baseurl, MAS integration, push settings)
- `mas/config.yaml` (public_base, clients, policy)
- `nginx/default.conf` (domains/routes) or `nginx/local.conf` (local)
- `element/config.json`, `element/home.html`, `element/welcome.html` (homeserver URL, branding)
- `cinny/config.json`, `fluffychat/config.json`, `synapse-admin/config.json` (homeserver URL)
- `ntfy/server.yml` (push base URL)

### 2) Start the stack

```bash
mkdir -p synapse-data
docker compose up -d --build
```

Linux hosts may need to ensure the Synapse data directory is writable by the container UID.

## Offline / isolated deployments

If your target host has limited/no outbound internet, do the heavy lifting on a connected machine and transfer artifacts.

- Docker image preload/export/import: [docs/offline-docker-images.md](docs/offline-docker-images.md)
- SSL (Certbot DNS challenge) + deploy to server: [docs/offline-ssl.md](docs/offline-ssl.md)
- Registry mirror notes: [docs/offline-docker-mirrors.md](docs/offline-docker-mirrors.md)

## Common operations

```bash
docker compose ps
docker compose logs -f synapse
docker compose logs -f mas

docker compose restart
docker compose down
```

## User management (via MAS)

Registration is handled by MAS (not Synapse). Synapse registration is typically disabled when using MAS.

### Create a registration token

```bash
# Single-use token
docker compose exec mas mas-cli manage create-registration-token --uses 1

# Multi-use token
docker compose exec mas mas-cli manage create-registration-token --uses 10

# Unlimited uses
docker compose exec mas mas-cli manage create-registration-token
```

Share an invite link like:

```text
https://chat.example.com/#/register?registration_token=TOKEN_HERE
```

### Other useful commands

```bash
docker compose exec mas mas-cli manage list-users
docker compose exec mas mas-cli manage promote-admin USERNAME
docker compose exec mas mas-cli manage lock-user USERNAME
docker compose exec mas mas-cli manage set-password USERNAME
```

### Create a Synapse admin user (for Synapse Admin UI)

```bash
docker compose exec synapse register_new_matrix_user \
  -c /config/homeserver.yaml \
  -u admin -p YourStrongPassword --admin \
  http://localhost:8008
```

Then open your Synapse Admin URL (for example `https://matrix.example.com/synapse-admin/`) and log in with your homeserver base URL.

## Push notifications (UnifiedPush via ntfy)

This stack includes a self-hosted [ntfy](https://ntfy.sh) service as a **UnifiedPush** provider — a privacy-friendly push notification alternative to Google FCM, useful anywhere FCM is unreliable or blocked.

**Full setup guide:** [docs/ntfy-push-notifications.md](docs/ntfy-push-notifications.md)

Covers:
- Required `synapse/homeserver.yaml` changes (`ip_range_whitelist`)
- Required nginx proxy block for the push subdomain
- First-run access control (`ntfy access everyone 'up*' read-write`)
- Android ntfy client install links (Play Store, F-Droid, APK) and setting the default server
- FluffyChat: verifying the push server URL in notification settings
- Element X: setting the notification provider to ntfy
- `.well-known` auto-discovery advertisement
- Troubleshooting table

## Admin panels

- MAS Admin Panel: served by nginx at `/mas-admin/`
- Synapse Admin: served by nginx at `/synapse-admin/`

Rebuild MAS Admin after changing its source or build-time environment:

```bash
docker compose build mas-admin
docker compose up -d mas-admin
```

## Health check

```bash
docker compose exec mas mas-cli doctor
```

## Repo layout

```text
.
├── docker-compose.yml
├── docker-compose.local.yml
├── .env.example
├── artifacts/
│   ├── docker-images/          # image tarballs for offline transfer (gitignored)
│   └── docker-archives/        # optional archive storage (gitignored)
├── docs/
├── nginx/
├── synapse/
├── mas/
├── mas-admin/
├── element/
├── cinny/
├── fluffychat/
├── synapse-admin/
├── postgres/
└── ntfy/
```

## Credits / upstream projects

This ecosystem is built from upstream components (Synapse, MAS, Element, Cinny, ntfy, nginx, Postgres, Synapse Admin). Each component is licensed and maintained by its respective authors — see their repositories and licenses for details.
