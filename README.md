# Mamood Chat — Matrix Server

Private Matrix chat server for mamood.ir using Synapse + Element Web + MAS.

## URLs

| Service | URL |
|---|---|
| Chat (Element Web) | https://chat.mamood.ir |
| Matrix API | https://matrix.mamood.ir |
| Auth (MAS account page) | https://auth.mamood.ir |
| Synapse Admin Dashboard | http://matrix.mamood.ir:8080 |

---

## Services

| Container | Role |
|---|---|
| `mamood-synapse` | Matrix homeserver (Synapse) |
| `mamood-mas` | Matrix Authentication Service — handles login/register/OIDC |
| `mamood-element` | Element Web frontend |
| `mamood-nginx` | Reverse proxy + SSL |
| `mamood-postgres` | PostgreSQL (databases: `matrix` + `mas`) |
| `mamood-admin` | Synapse Admin UI |

---

## Start / Stop

```bash
cd /opt/matrix-project

docker compose up -d           # start all
docker compose down            # stop all
docker compose restart         # restart all
docker logs mamood-synapse -f  # watch Synapse logs
docker logs mamood-mas -f      # watch MAS logs
```

---

## First Time Setup (server)

```bash
mkdir -p synapse-data
chown 991:991 synapse-data
docker compose up -d
```

---

## User Management (via MAS)

Registration is handled by MAS — not Synapse. Synapse registration is disabled.

### Create a registration token

```bash
# Single-use token
docker exec mamood-mas mas-cli manage create-registration-token --uses 1

# Multi-use
docker exec mamood-mas mas-cli manage create-registration-token --uses 10

# Unlimited uses
docker exec mamood-mas mas-cli manage create-registration-token
```

Share with users:
```
https://chat.mamood.ir/#/register?registration_token=TOKEN_HERE
```

### Other user commands

```bash
# List users
docker exec mamood-mas mas-cli manage list-users

# Promote user to MAS admin (can access auth.mamood.ir admin features)
docker exec mamood-mas mas-cli manage promote-admin USERNAME

# Lock a user
docker exec mamood-mas mas-cli manage lock-user USERNAME

# Set a user's password
docker exec mamood-mas mas-cli manage set-password USERNAME
```

### Create a Synapse admin user (for Synapse Admin dashboard)

```bash
docker exec -it mamood-synapse register_new_matrix_user \
  -c /config/homeserver.yaml \
  -u admin -p YourStrongPassword --admin \
  http://localhost:8008
```

Then log into `http://matrix.mamood.ir:8080` with homeserver URL `http://matrix.mamood.ir`.

---

## Admin Panels

### Synapse Admin — `http://matrix.mamood.ir:8080`
- Rooms, media, federation, server stats
- User listing (passwords/sessions managed by MAS now)

### MAS (CLI only for token/user management)
```bash
docker exec mamood-mas mas-cli --help
docker exec mamood-mas mas-cli manage --help
```

---

## Supported Client Apps

| App | Platform | Login method |
|---|---|---|
| Element Web | Browser | Password (via MAS compat) |
| Element X | Android/iOS | Native OIDC via MAS |
| FluffyChat | Android/iOS | Password (via MAS compat) or native OIDC |

---

## SSL Certificates

Certs live on the server at `/etc/letsencrypt/live/`.
Server has no internet — issue certs on your laptop with Docker.

### Issue / renew (on your laptop)

```powershell
# chat.mamood.ir and matrix.mamood.ir
docker run --rm -it `
  -v "$HOME/letsencrypt:/etc/letsencrypt" `
  certbot/certbot certonly --manual --preferred-challenges dns `
  --agree-tos --email am.mahmoudi@outlook.com `
  -d chat.mamood.ir -d matrix.mamood.ir

# auth.mamood.ir (separate cert)
docker run --rm -it `
  -v "$HOME/letsencrypt:/etc/letsencrypt" `
  certbot/certbot certonly --manual --preferred-challenges dns `
  --agree-tos --email am.mahmoudi@outlook.com `
  -d auth.mamood.ir
```

For each: add the `_acme-challenge` TXT record shown in Cloudflare, wait ~30s, press Enter.

### Deploy to server

```powershell
# Copy live + archive dirs for each domain
scp -r "$HOME\letsencrypt\live\chat.mamood.ir" root@178.239.151.162:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\chat.mamood.ir" root@178.239.151.162:/etc/letsencrypt/archive/

scp -r "$HOME\letsencrypt\live\matrix.mamood.ir" root@178.239.151.162:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\matrix.mamood.ir" root@178.239.151.162:/etc/letsencrypt/archive/

scp -r "$HOME\letsencrypt\live\auth.mamood.ir" root@178.239.151.162:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\auth.mamood.ir" root@178.239.151.162:/etc/letsencrypt/archive/
```

```bash
# On server — reload nginx
docker exec mamood-nginx nginx -s reload
```

Certs expire every **90 days** (next: 2026-06-15 for auth.mamood.ir).

---

## Deploy Config Changes

```powershell
# From your laptop — copy changed files then reload
scp nginx/default.conf root@178.239.151.162:/opt/matrix-project/nginx/default.conf
scp mas/config.yaml root@178.239.151.162:/opt/matrix-project/mas/config.yaml
scp synapse/homeserver.yaml root@178.239.151.162:/opt/matrix-project/synapse/homeserver.yaml
```

```bash
# On server
docker exec mamood-nginx nginx -s reload   # nginx changes (no downtime)
docker restart mamood-mas                  # MAS config changes
docker restart mamood-synapse              # Synapse config changes
```

---

## Health Check

```bash
docker exec mamood-mas mas-cli doctor
```

Expected: all green ✅. Known warning: well-known fetch may fail from inside the container (irrelevant, works from outside).

---

## Files

```
matrix-project/
├── docker-compose.yml          # all services
├── nginx/default.conf          # routing + SSL + well-known
├── synapse/
│   ├── homeserver.yaml         # Synapse config (MAS enabled, registration disabled)
│   └── synapse.log.config      # logging config
├── mas/
│   └── config.yaml             # MAS config (public_base, clients, policy, passwords)
├── postgres/
│   └── init.sql                # creates `mas` database on first run
└── element/
    ├── config.json             # Element branding, homeserver, app download links
    ├── welcome.html            # welcome page fragment (shown before login)
    ├── home.html               # home page fragment (shown after login)
    └── images/
        ├── logo.svg            # app logo (also used as favicon)
        └── logo.png            # favicon fallback
```

---

## Server Info

- **Server IP:** 178.239.151.162
- **Provider:** ParsPack
- **Path:** `/opt/matrix-project/`
- **DNS:** Cloudflare grey cloud (DNS only — no proxy, required for Iranian network)
- **Docker mirror (Hub):** https://dockerhub.iranserver.com
- **Docker mirror (ghcr.io):** https://ghcr-mirror.liara.ir
