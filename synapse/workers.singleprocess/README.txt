# Single-process mode — no worker config files needed.
#
# In single-process mode (the default) Synapse runs as a single Python process
# that handles everything: client API, federation, media, sync, push, background
# tasks, and event persistence. No workers are started and this directory
# contains no yaml files.
#
# To switch to multiprocess (workers) mode, see:
#   docker-compose.workers.yml      — add Redis + worker containers
#   synapse/homeserver.yaml         — uncomment the WORKERS MODE section
#   synapse/workers/                — worker-specific config files (real)
#   synapse/workers.example/        — worker config templates
#   nginx/default.workers.conf      — nginx config with worker routing
#
# This file exists only to keep the directory tracked by git.
