# ntfy — Push Notifications (UnifiedPush)

This server uses [ntfy](https://ntfy.sh) as a self-hosted **UnifiedPush** distributor so that Matrix clients (FluffyChat, Element X) receive real-time push notifications without relying on Google FCM or Apple APNs.

Push endpoint: **`https://push.example.com`**

---

## Architecture

```
Matrix client (Android)
  └─ registers UnifiedPush endpoint  →  ntfy (push.example.com)
       └─ Synapse  →  sends push via ntfy gateway
            └─ ntfy  →  delivers notification  →  ntfy app on device
```

---

## 1. synapse/homeserver.yaml — required configuration

Synapse must be allowed to reach the ntfy container over the Docker network.  
The `extra_hosts` entry in `docker-compose.yml` already maps `push.example.com` to the host gateway so Synapse can reach nginx → ntfy.

The `ip_range_whitelist` section in `homeserver.yaml` is **critical** — without it Synapse refuses to contact the ntfy push endpoint (it treats local/private IPs as a security risk for URL-preview-style outbound calls, and push gateway calls go through the same filter).

```yaml
# synapse/homeserver.yaml

# Allow Synapse to contact ntfy running on the internal Docker network
# and via the host-gateway mapping.  Without this, push delivery silently fails.
ip_range_whitelist:
  - '172.17.0.0/16'   # default Docker bridge
  # Add your specific Docker network subnet if it differs, e.g.:
  # - '172.20.0.0/16'
```

> **How to find your subnet:** run `docker network inspect matrix-project_matrix-net | grep Subnet`
> and add whatever CIDR is shown.

Restart Synapse after any change:

```bash
docker compose restart synapse
```

---

## 2. nginx/default.conf — push.example.com proxy block

The HTTPS reverse-proxy block for ntfy is already in `nginx/default.conf`.  
Key requirements that **must** be present:

```nginx
# push.example.com — HTTPS → ntfy
server {
    listen 443 ssl;
    server_name push.example.com;

    ssl_certificate     /etc/letsencrypt/live/push.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/push.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    resolver 127.0.0.11 valid=30s ipv6=off;

    location / {
        set $ntfy_upstream http://ntfy:80;
        proxy_pass $ntfy_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        # WebSocket + long-poll support — must NOT be removed
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

> `proxy_http_version 1.1` + the `Upgrade`/`Connection` headers are required for ntfy's
> SSE (long-poll) and WebSocket delivery modes.  Removing them breaks real-time delivery.

Reload nginx after any change:

```bash
docker exec mamood-nginx nginx -s reload
```

---

## 3. ntfy server — first-run access control

ntfy's `server.yml` is configured with `auth-default-access: deny-all`.  
After the very **first** `docker compose up`, grant anonymous read-write access to all
UnifiedPush topics (they all start with `up`):

```bash
docker exec -it mamood-ntfy ntfy access everyone 'up*' read-write
```

This only needs to be run once; the permission is persisted in the `ntfy-data` Docker volume.

---

## 4. Install the ntfy client — Android

The ntfy Android app acts as the **delivery agent** on the device.  It receives the push notification from the server and hands it to the Matrix client via a local broadcast.

| Source | Link |
|--------|------|
| **Google Play** | <https://play.google.com/store/apps/details?id=io.heckel.ntfy> |
| **F-Droid** (no Google) | <https://f-droid.org/packages/io.heckel.ntfy/> |
| **GitHub Releases** (APK) | <https://github.com/binwiederhier/ntfy/releases> (look for `ntfy-android-*.apk`) |

> F-Droid is recommended on devices without Google Play Services — this is the same scenario where UnifiedPush is most useful.

### Change the default server in the ntfy app

After installing, the app points to `https://ntfy.sh` (the public server) by default.  
**Change it to your self-hosted server before registering any client:**

1. Open the ntfy app.
2. Tap the **≡ hamburger menu** (top-left) → **Settings**.
3. Tap **Default server**.
4. Clear the existing URL and enter:
   ```
   https://push.example.com
   ```
5. Tap **Save** / **OK**.

The app does **not** need you to log in or create a topic manually — the Matrix client handles topic creation automatically during UnifiedPush registration.

---

## 5. FluffyChat — enable UnifiedPush notifications

FluffyChat auto-detects a registered ntfy app and registers a UnifiedPush endpoint.

1. Make sure the **ntfy app** is installed and the default server is set to `https://push.example.com` (see §4 above).
2. Open **FluffyChat** → **Settings** → **Notifications**.
3. Under **Push service**, you should see ntfy (or "UnifiedPush") listed as the provider.
4. Confirm the **push server URL** shown matches `https://push.example.com/...`.  
   If it still shows `ntfy.sh` or another URL, go back to the ntfy app and update the default server, then force-stop and reopen FluffyChat.
5. After a chat message is received while the app is backgrounded, verify a notification arrives.

> **Restart FluffyChat** (force-stop from Android app settings, then relaunch) after changing the ntfy server so that FluffyChat re-registers the UnifiedPush endpoint with the correct URL.

---

## 6. Element X — enable ntfy notifications

Element X uses UnifiedPush when a distributor is installed on the device.

1. Make sure the **ntfy app** is installed and pointing to `https://push.example.com`.
2. Open **Element X** → **Settings** (your avatar, bottom-left) → **Notifications**.
3. Find the **Push notification provider** (or "Notification delivery") section.
4. Set the provider to **ntfy** (or "UnifiedPush").
5. The endpoint URL should auto-populate with your ntfy server.  
   If it shows `ntfy.sh`, close Element X, update the ntfy default server, and reopen Element X.

---

## 7. .well-known advertisement

The homeserver already advertises the push gateway in `/.well-known/matrix/client` (served by nginx):

```json
{
  "default_push_gateway": "https://push.example.com",
  "org.unifiedpush.custom_gateway": "https://push.example.com",
  "m.push": { "base_url": "https://push.example.com" }
}
```

Clients that support MSC2967 / UnifiedPush auto-discovery will pick this up automatically.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| No notifications on FluffyChat | ntfy app not installed or wrong default server | Install ntfy, set server to `https://push.example.com`, restart FluffyChat |
| Notifications arrive on WiFi only | ntfy app battery optimisation | Disable battery optimisation for the ntfy app in Android Settings |
| `403 Forbidden` from ntfy | Access control not set up | Run `docker exec -it mamood-ntfy ntfy access everyone 'up*' read-write` |
| Push fails silently after server move | Stale UnifiedPush registration | Force-stop and reopen both the ntfy app and the Matrix client |
| Synapse logs show push delivery errors to internal IP | `ip_range_whitelist` missing or wrong subnet | Add the Docker subnet to `homeserver.yaml`, restart Synapse |
| Element X shows FCM instead of ntfy | ntfy default server not changed before opening Element X | Update ntfy server, clear Element X data / re-login |
