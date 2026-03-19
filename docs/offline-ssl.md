# Offline SSL Certificates (DNS Challenge)

The server has no outbound internet, so certificates are issued/renewed on a connected machine and then copied to the server.

## Issue / renew (on your laptop)

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

# push.mamood.ir (separate cert)
docker run --rm -it `
  -v "$HOME/letsencrypt:/etc/letsencrypt" `
  certbot/certbot certonly --manual --preferred-challenges dns `
  --agree-tos --email am.mahmoudi@outlook.com `
  -d push.mamood.ir
```

For each domain: add the `_acme-challenge` TXT record shown in Cloudflare, wait ~30s, then press Enter.

## Deploy to server

```powershell
# Copy live + archive dirs for each domain
scp -r "$HOME\letsencrypt\live\chat.mamood.ir" root@178.239.151.162:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\chat.mamood.ir" root@178.239.151.162:/etc/letsencrypt/archive/

scp -r "$HOME\letsencrypt\live\matrix.mamood.ir" root@178.239.151.162:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\matrix.mamood.ir" root@178.239.151.162:/etc/letsencrypt/archive/

scp -r "$HOME\letsencrypt\live\auth.mamood.ir" root@178.239.151.162:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\auth.mamood.ir" root@178.239.151.162:/etc/letsencrypt/archive/

scp -r "$HOME\letsencrypt\live\push.mamood.ir" root@178.239.151.162:/etc/letsencrypt/live/
scp -r "$HOME\letsencrypt\archive\push.mamood.ir" root@178.239.151.162:/etc/letsencrypt/archive/
```

Reload nginx on the server:

```bash
docker exec mamood-nginx nginx -s reload
```

Certificates expire every 90 days.
