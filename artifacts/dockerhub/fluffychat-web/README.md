# amahmoudi/fluffychat-web (unofficial)

Unofficial Docker image for **FluffyChat Web** served via **nginx**.

- Upstream project: https://github.com/krille-chan/fluffychat
- License: **AGPL-3.0** (see upstream LICENSE)
- Upstream app version used: **2.5.0+3550** (Docker tag uses `2.5.0-3550` because `+` is not allowed)

## Tags

- `amahmoudi/fluffychat-web:latest`
- `amahmoudi/fluffychat-web:2.5.0`
- `amahmoudi/fluffychat-web:2.5.0-3550`

## Run

```bash
docker run --rm -p 8085:80 amahmoudi/fluffychat-web:latest
```

Then open: `http://localhost:8085`

## Runtime config.json (optional)

FluffyChat web can read a `config.json` from the web root.

Mount your config file like this:

```bash
docker run --rm -p 8085:80 \
  -v "$PWD/config.json:/config/config.json:ro" \
  amahmoudi/fluffychat-web:latest
```

Use upstream `config.sample.json` as a starting point and only set the keys you need.

## Notes on licensing

This image redistributes FluffyChat under the upstream **AGPL-3.0** license.
If you modify and publish a variant, ensure you comply with AGPL requirements (preserve notices and provide corresponding source).
