# Offline SSL Certificates (DNS Challenge)

The server has no outbound internet, so certificates are issued/renewed on a connected machine and then copied to the server.

## Issue / renew (on your laptop)

```powershell
# chat.example.com and matrix.example.com
docker run --rm -it `
  -v "$HOME/letsencrypt:/etc/letsencrypt" `
  certbot/certbot certonly --manual --preferred-challenges dns `
  --agree-tos --email you@example.com `
  -d chat.example.com -d matrix.example.com

# auth.example.com (separate cert)
docker run --rm -it `
  -v "$HOME/letsencrypt:/etc/letsencrypt" `
  certbot/certbot certonly --manual --preferred-challenges dns `
  --agree-tos --email you@example.com `
  -d auth.example.com

# push.example.com (separate cert)
docker run --rm -it `
  -v "$HOME/letsencrypt:/etc/letsencrypt" `
  certbot/certbot certonly --manual --preferred-challenges dns `
  --agree-tos --email you@example.com `
  -d push.example.com
```

For each domain: add the `_acme-challenge` TXT record shown in Cloudflare, wait ~30s, then press Enter.

## Deploy to server

```powershell
# Copy live + archive dirs for each domain
scp -r "$HOME\letsencrypt\live\chat.example.com" root@YOUR_SERVER_IP:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\chat.example.com" root@YOUR_SERVER_IP:/etc/letsencrypt/archive/

scp -r "$HOME\letsencrypt\live\matrix.example.com" root@YOUR_SERVER_IP:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\matrix.example.com" root@YOUR_SERVER_IP:/etc/letsencrypt/archive/

scp -r "$HOME\letsencrypt\live\auth.example.com" root@YOUR_SERVER_IP:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\auth.example.com" root@YOUR_SERVER_IP:/etc/letsencrypt/archive/

scp -r "$HOME\letsencrypt\live\push.example.com" root@YOUR_SERVER_IP:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\push.example.com" root@YOUR_SERVER_IP:/etc/letsencrypt/archive/
```

Reload nginx on the server:

```bash
docker exec mamood-nginx nginx -s reload
```

Certificates expire every 90 days.
