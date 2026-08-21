# Voyage P&L LAN Setup

Updated: August 18, 2026

Server machine LAN IP on current network: `192.168.1.136`

## 1. Frontend

Create `apps/voyage-ui/.env.local` from `apps/voyage-ui/.env.lan.example` and set:

```env
VITE_API_BASE_URL=http://192.168.1.136:3001/api
```

Run:

```powershell
pnpm --dir apps/voyage-ui dev:lan
```

Client URL:

```text
http://192.168.1.136:5173
```

## 2. Backend

Set the allowed web origin for LAN:

```powershell
$env:WEB_ORIGIN="http://192.168.1.136:5173"
pnpm --dir apps/api dev:lan
```

API docs:

```text
http://192.168.1.136:3001/docs
```

## 3. Windows Firewall

Open inbound TCP ports:

- `5173` for frontend
- `3001` for API

Apply to `Domain` and `Private` profiles.

## 4. Kaspersky Premium

In Kaspersky Firewall:

- mark the company LAN as `Trusted`
- allow inbound access for `node.exe`
- or allow TCP ports `5173` and `3001`

Do not disable Kaspersky entirely.

## 5. Stable multi-user trial

For a steadier shared test, build frontend and run preview:

```powershell
pnpm --dir apps/voyage-ui build
pnpm --dir apps/voyage-ui preview:lan
```

Preview URL:

```text
http://192.168.1.136:4173
```
