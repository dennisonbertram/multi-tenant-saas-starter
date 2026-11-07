# Deployment

Two supported paths, both fully self-hosted. Pick one:

- **Path A — Docker Compose** (recommended): one command, includes Postgres
  and automatic HTTPS via Caddy.
- **Path B — bare metal**: systemd + your own Postgres + nginx/Caddy.

---

## Path A — Docker Compose

Requirements: Docker + Docker Compose, a domain pointing at the server
(A/AAAA record), ports 80/443 open.

```bash
git clone <your-repo> && cd <your-repo>
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=postgresql://saas:STRONG-PASSWORD@db:5432/saas_starter   # (compose overrides this, but keep it consistent)
APP_URL=https://app.yourdomain.com
APP_DOMAIN=app.yourdomain.com        # consumed by docker-compose → Caddy
POSTGRES_PASSWORD=STRONG-PASSWORD
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=SaaS Starter <no-reply@yourdomain.com>
```

```bash
docker compose up -d --build
docker compose run --rm migrate      # create tables (auto-runs on future starts too)
docker compose exec app node -e "…"  # optional: seed via src/scripts/seed.ts pattern
```

Caddy obtains and renews Let's Encrypt certificates automatically. Verify:

```bash
curl https://app.yourdomain.com/api/health   # {"status":"ok","database":"up"}
```

Updating:

```bash
git pull && docker compose up -d --build   # migrate service runs automatically
```

---

## Path B — bare metal (systemd)

Assumes Ubuntu/Debian with a `saas` user and the app in `/opt/saas-starter`.

### 1. System packages

```bash
sudo apt update && sudo apt install -y nodejs npm postgresql caddy
# or install Node 20+ from nodesource
sudo -u postgres createuser saas --pwprompt
sudo -u postgres createdb saas_starter --owner=saas
```

### 2. App

```bash
sudo mkdir -p /opt/saas-starter && sudo chown saas:saas /opt/saas-starter
# as the saas user:
cd /opt/saas-starter
git clone <your-repo> . && npm ci && npm run build
cp .env.example .env   # fill in real values; chmod 600 .env
npm run db:migrate
```

### 3. Service

```bash
sudo cp deploy/systemd/saas-starter.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now saas-starter
sudo journalctl -u saas-starter -f        # logs
```

The unit runs `npm run db:migrate` before every start (idempotent) and binds
to `127.0.0.1:3000`.

### 4. Reverse proxy (Caddy)

`/etc/caddy/Caddyfile`:

```
app.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
    header Strict-Transport-Security "max-age=31536000; includeSubDomains"
}
```

```bash
sudo systemctl reload caddy
```

(nginx works too — proxy `X-Forwarded-For`/`X-Real-IP` so rate limiting sees
real client IPs.)

### 5. Backups

```bash
sudo cp deploy/backup.sh /etc/cron.daily/saas-backup && sudo chmod +x /etc/cron.daily/saas-backup
```

Edit the script to add off-box copying (rclone/S3/rsync). Test a restore.

---

## Either path: first-run checklist

1. `curl https://<your-domain>/api/health` → `{"status":"ok","database":"up"}`
2. Sign up through the UI; confirm the verification email arrives.
3. Change any seeded credentials.
4. Add uptime monitoring on `/api/health`.
5. Set up log rotation/persistence (journald is fine; Docker: configure the
   `json-file` driver with limits).

## Environment variables reference

| Variable      | Required | Notes                                             |
|---------------|----------|---------------------------------------------------|
| `DATABASE_URL`| yes      | `postgresql://user:pass@host:5432/db`             |
| `APP_URL`     | yes      | Public HTTPS URL; used in all email links         |
| `SMTP_HOST`   | prod     | Empty in dev → emails logged to console           |
| `SMTP_PORT`   | no       | Default 587 (STARTTLS)                            |
| `SMTP_USER/PASS` | no    | Omit for unauthenticated local relays             |
| `SMTP_SECURE` | no       | `true` only for implicit TLS (port 465)           |
| `EMAIL_FROM`  | no       | `"App Name <no-reply@yourdomain.com>"`            |

## Troubleshooting

- **502 from Caddy** → app not listening: `journalctl -u saas-starter` or
  `docker compose logs app`.
- **Emails not arriving** → check `EMAIL_FROM` domain matches your SPF/DKIM;
  test SMTP creds with `swaks` or your provider's dashboard.
- **`Invalid environment configuration` at startup** → a required var is
  missing; the error names it exactly.
- **Migrations fail** → never edit applied migration files; generate a new
  one instead.
