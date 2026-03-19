# Offline / Restricted Network: Docker Mirrors

If your network restricts Docker Hub and/or GHCR access, configure Docker to use registry mirrors.

This project has been used with these mirrors (see README "Server Info"):

- Docker Hub mirror: <https://dockerhub.iranserver.com>
- GHCR mirror: <https://ghcr-mirror.liara.ir>

## Docker daemon configuration (example)

On the server, create or edit `/etc/docker/daemon.json`.

```json
{
  "registry-mirrors": [
    "https://dockerhub.iranserver.com"
  ]
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

Notes:
- Mirror setup is environment-specific.
- Even with mirrors, the safest approach for a truly offline server is still to preload images (see `docs/offline-docker-images.md`).
