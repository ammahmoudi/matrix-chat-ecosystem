# Mamood Chat — Matrix Server

Private Matrix chat server for mamood.ir using Synapse + Element.

## URLs

| Service | URL |
|---|---|
| Chat (Element) | https://chat.mamood.ir |
| Matrix API | https://matrix.mamood.ir |
| Admin Dashboard | http://matrix.mamood.ir:8080 |

---

## Start / Stop

```bash
cd /opt/matrix-project

docker compose up -d       # start
docker compose down        # stop
docker compose restart     # restart all
docker logs mamood-synapse -f  # watch logs
```

---

## First Time Setup (server)

```bash
# Fix Synapse data folder ownership (only needed once)
mkdir -p synapse-data
chown 991:991 synapse-data

docker compose up -d
```

---

## Create Admin User

```bash
docker exec -it mamood-synapse register_new_matrix_user \
  -c /config/homeserver.yaml \
  -u admin \
  -p YourStrongPassword \
  --admin \
  http://localhost:8008
```

Log into admin dashboard at `http://matrix.mamood.ir:8080`:
- Homeserver URL: `http://matrix.mamood.ir`
- Username: `@admin:matrix.mamood.ir`

---

## Create Regular User

```bash
docker exec -it mamood-synapse register_new_matrix_user \
  -c /config/homeserver.yaml \
  -u username \
  -p YourStrongPassword \
  --no-admin \
  http://localhost:8008
```

---

## SSL Certificates

Certs are stored on the server at `/etc/letsencrypt/live/`.

### Renew (run on your laptop — server has no internet)

```powershell
# Issue/renew via Docker on laptop
docker run --rm -it `
  -v C:\letsencrypt:/etc/letsencrypt `
  certbot/certbot certonly --manual --preferred-challenges dns `
  --agree-tos --no-eff-email `
  -m admin@mamood.ir `
  -d chat.mamood.ir -d matrix.mamood.ir
```

When prompted, add the TXT records in Cloudflare DNS, wait 30s, press Enter.

### Deploy renewed certs to server

```powershell
scp C:\letsencrypt\archive\chat.mamood.ir\fullchain1.pem root@178.239.151.162:/etc/letsencrypt/live/chat.mamood.ir/fullchain.pem
scp C:\letsencrypt\archive\chat.mamood.ir\privkey1.pem root@178.239.151.162:/etc/letsencrypt/live/chat.mamood.ir/privkey.pem
scp C:\letsencrypt\archive\chat.mamood.ir\fullchain1.pem root@178.239.151.162:/etc/letsencrypt/live/matrix.mamood.ir/fullchain.pem
scp C:\letsencrypt\archive\chat.mamood.ir\privkey1.pem root@178.239.151.162:/etc/letsencrypt/live/matrix.mamood.ir/privkey.pem
```

Then reload nginx:
```bash
docker exec mamood-nginx nginx -s reload
```

Certs expire every **90 days**. Renew before expiry.

---

## User Registration

Registration requires a token. Create tokens in the Admin Dashboard:
`http://matrix.mamood.ir:8080` → Registration Tokens → New Token

Share the token with friends. They register at `https://chat.mamood.ir`.

---

## Files

```
matrix-project/
├── docker-compose.yml              # all services
├── nginx/default.conf              # routing + SSL
├── synapse/
│   ├── homeserver.yaml             # Synapse config
│   └── synapse.log.config          # logging config
└── element/
    ├── config.json                 # Element branding + homeserver + app links
    ├── welcome.html                # welcome page (shown before login)
    ├── home.html                   # home page (shown after login, no room selected)
    └── images/
        ├── logo.svg                # ← REPLACE with your logo
        └── bg/
            └── background.jpg     # ← REPLACE with your background image (1920x1080 recommended)
```

---

## Server Info

- **Server IP:** 178.239.151.162
- **Provider:** ParsPack
- **DNS:** Cloudflare (DNS only — grey cloud, no proxy)
- **Docker mirror:** https://dockerhub.iranserver.com
