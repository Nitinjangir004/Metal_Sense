# MetalSense — Production Deployment & Operations Guide

This guide details containerization, environment configuration, reverse-proxy setup, database clustering, and security controls for deploying MetalSense in high-compliance production environments.

---

## 1. Quickstart with Docker Compose

MetalSense includes production-grade container specifications for immediate orchestration:

```bash
# 1. Clone repository & configure environment variables
cp .env.example .env

# 2. Build and launch application and MongoDB services
docker compose up -d --build

# 3. Verify health status
docker compose ps
curl http://localhost:5000/api/v1/health
```

The production container:
- Runs as an unprivileged user (`metalsense:metalsense`, UID 1000).
- Multi-stage build strips dev dependencies, compilers, and test suites.
- Serves the compiled React + Vite bundle statically while servicing the Express API.
- Evaluates health via continuous `GET /api/v1/health` checks.

---

## 2. Environment Configuration Reference

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Enables production optimizations, secure cookies, and static serving |
| `PORT` | No | `5000` | HTTP listen port |
| `CLIENT_ORIGIN` | Yes | `https://metalsense.yourdomain.org` | CORS whitelist domain |
| `API_PREFIX` | No | `/api/v1` | Routing prefix for REST endpoints |
| `SESSION_SECRET` | Yes | *(32+ char secret)* | Signs JWT session tokens |
| `MONGODB_URI` | Yes | `mongodb://mongodb:27017/metalsense` | MongoDB connection URI |
| `GOOGLE_CLIENT_ID` | Optional | `*.apps.googleusercontent.com` | Google OAuth 2.0 client credential |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Gemini AI key for OCR & grounded summaries |
| `AI_TIMEOUT_MS` | No | `20000` | Upstream AI timeout before deterministic fallback |
| `UPLOAD_MAX_BYTES` | No | `10485760` (10MB) | Enforced maximum upload file size |
| `STORAGE_DRIVER` | No | `local` | `local` for dev, or adapter for object storage (S3) |

---

## 3. Production Architecture & Reverse Proxy

In production, MetalSense should be deployed behind an edge reverse proxy (such as Nginx, Cloudflare, or Caddy) terminating TLS and enforcing HTTP/2 or HTTP/3.

### Recommended Nginx Configuration

```nginx
# /etc/nginx/conf.d/metalsense.conf

upstream metalsense_backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name metalsense.yourdomain.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name metalsense.yourdomain.org;

    # TLS Certificates
    ssl_certificate /etc/letsencrypt/live/metalsense.yourdomain.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/metalsense.yourdomain.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Static Assets Cache
    location ~* \.(?:css|js|woff2?|svg|png|jpg|ico)$ {
        proxy_pass http://metalsense_backend;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API and Dynamic Application
    location / {
        proxy_pass http://metalsense_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 12M;
    }
}
```

---

## 4. Production Security Hardening Checklist

- [x] **Zero-Trust Numerical Calculation:** Generative AI is strictly firewalled from numerical calculations; calculations are pure functions with versioned traces.
- [x] **Adversarial Prompt Defense:** Document extraction input passes through system-prompt sanitizers stripping override commands.
- [x] **Secure Session Cookies:** `HttpOnly`, `SameSite=Lax`, `Secure=true` in production mode.
- [x] **Multi-Tenant Access Isolation:** All database reads and writes enforce `workspaceId` tenant boundaries.
- [x] **Rate Limiting:** IP-level rate limiting enabled on `/api/` endpoints (500 requests / 15 minutes by default).
- [x] **Payload Inspection & MIME Guards:** File uploads enforce 10MB limit and validate MIME signatures.
- [x] **Non-Root Container Execution:** Container runs as user `metalsense` (UID 1000).
- [x] **Traceable Audit Logging:** Workspace audit log tracks sample creation, re-analyses, and AI explanations.

---

## 5. Monitoring & Operational Health

- **Health Check URL:** `GET /api/v1/health`
  - Returns `200 OK` with uptime, timestamp, memory metrics, and active version.
- **Request ID Header:** Every incoming request is stamped with `X-Request-ID` and propagated through logs and responses for correlation.
