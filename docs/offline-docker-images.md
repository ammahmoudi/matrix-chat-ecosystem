# Offline Docker Images (Preload / Transfer / Import)

Target: the Matrix server has **no outbound internet**.

## Where to store image tarballs in this repo

- Put exported images under `artifacts/docker-images/`.
- Keep these files **out of git** (they are large). If needed, add them to `.gitignore`.

## 1) Pre-pull images (on a connected machine)

These images are used by `docker-compose.yml`:

```bash
docker pull postgres:15-alpine
docker pull ghcr.io/element-hq/matrix-authentication-service:latest
docker pull matrixdotorg/synapse:latest
docker pull vectorim/element-web:latest
docker pull etkecc/synapse-admin:latest
docker pull amahmoudi/mas-admin:latest
docker pull binwiederhier/ntfy
docker pull ajbura/cinny:latest
docker pull nginx:latest
```

## 2) Build images that need internet during build

None (all services use prebuilt images). If you fork and change `mas-admin`, you can build your own image.

## 3) Export images to tar files

Bundle upstream images:

```bash
mkdir -p artifacts/docker-images

docker save -o artifacts/docker-images/matrix-images.tar \
  postgres:15-alpine \
  ghcr.io/element-hq/matrix-authentication-service:latest \
  matrixdotorg/synapse:latest \
  vectorim/element-web:latest \
  etkecc/synapse-admin:latest \
  amahmoudi/mas-admin:latest \
  binwiederhier/ntfy \
  ajbura/cinny:latest \
  nginx:latest
```

No local image exports are required.

## 4) Transfer to the server

```bash
scp artifacts/docker-images/*.tar root@YOUR_SERVER_IP:/opt/matrix-project/artifacts/docker-images/
```

## 5) Import on the offline server

```bash
cd /opt/matrix-project

docker load -i artifacts/docker-images/matrix-images.tar
```

From this point, `docker compose up -d` should start without pulling, as long as the images exist locally.

## Optional: verify locally available images

```bash
docker image ls | egrep "postgres|matrix-authentication-service|synapse|element-web|synapse-admin|ntfy|cinny|nginx|mas-admin"
```
