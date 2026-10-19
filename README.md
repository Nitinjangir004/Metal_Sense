# MetalSense — Heavy Metal Pollution Intelligence SaaS

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-teal.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-slate.svg)](https://expressjs.com/)
[![Standards](https://img.shields.io/badge/Standards-BIS%2010500%3A2012%20%7C%20WHO-emerald.svg)](https://archive.org/details/gov.in.is.10500.2012)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage-blue.svg)](https://www.docker.com/)

**MetalSense** is a production-minded environmental intelligence SaaS platform for assessing heavy metal pollution from laboratory reports and measured water/groundwater sample data. It provides deterministic water quality index evaluations (HPI, HEI, $C_d$), compares monitored analytes against traceable regulatory standards, visualizes spatial contaminant distributions across monitored aquifers, and exports auditable PDF compliance dossiers and CSV matrices.

---

## 1. Scientific Integrity Mandate

> **Core Scientific Rule:** MetalSense strictly separates deterministic numerical calculation from generative AI. Pollution indices ($HPI$, $HEI$, $C_d$) are evaluated exclusively by pure, versioned, unit-tested TypeScript functions using documented formulas and statutory standard limits. Generative AI is strictly restricted to candidate OCR extraction proposals and structured natural-language summaries. No neural network or LLM performs arithmetic, declares water potable, or generates medical health diagnoses.

---

## 2. Key Capabilities

1. **Deterministic Scientific Calculation Engine**
   - **Heavy Metal Pollution Index (HPI):** Mohan et al. (1996), Prasad & Bose (2001) with intermediate sub-index traces ($W_i, Q_i, W_i \cdot Q_i$).
   - **Heavy Metal Evaluation Index (HEI):** Edet & Offiong (2002) evaluating cumulative ratios against maximum admissible concentrations ($H_c / H_{mac}$).
   - **Degree of Contamination ($C_d$):** Backman et al. (1998) calculating cumulative contamination factors ($C_{fi} = \frac{C_{Ai}}{C_{Ni}} - 1$).
   - **Detection Limit ($\text{LOD}$) Handling:** Supports EPA $0.5 \times \text{LOD}$ substitution, zero substitution, or conservative full $\text{LOD}$.

2. **Official Regulatory Standards Registry**
   - **BIS IS 10500:2012:** Indian Standard Drinking Water Specification (including 2015 amendments).
   - **WHO GDWQ 4th Edition:** World Health Organization Guidelines for Drinking-water Quality (2022).
   - Dynamic real-time switching between regulatory standards without recalculating raw inputs.

3. **Multi-Modal Data Ingestion & Human-in-the-Loop OCR**
   - Manual parameter entry with dynamic unit selection ($\text{mg/L}, \mu\text{g/L}, \text{ppm}, \text{ppb}$) and qualifiers ($=, <, \le, >, \ge$).
   - RFC-4180 compliant CSV bulk matrix upload with intelligent column detection.
   - Laboratory PDF/image report ingestion with confidence ratings and mandatory analyst verification before saving.

4. **Geospatial & Analytical Dashboards**
   - Interactive OpenStreetMap/Leaflet visualization coloring monitoring wells by calculated HPI category ($<25$ Pristine, $25-100$ Moderate, $\ge 100$ Critical).
   - Responsive Recharts bar charts comparing measured concentrations against standard permissible limits.
   - Honest empty states for unmapped samples (never guesses GPS coordinates).

5. **Auditable Compliance Dossiers**
   - High-resolution PDF export with mathematical snapshot, weights, calculation version (`v1.0.0-deterministic`), and regulatory disclaimers.
   - RFC-4180 compliant CSV matrix export for research, GIS, and statistical pipelines.

---

## 3. Monorepo Architecture

```
d:\NSP\
├── shared/              # Isomorphic domain models, Zod schemas, standards registry, unit converters
│   ├── src/types/       # Canonical types (Sample, AnalyteMeasurement, RegulatoryStandard, AnalysisRun)
│   ├── src/constants/   # BIS 10500:2012 and WHO GDWQ 4th Edition specifications
│   └── src/utils/       # Unit normalization helpers (ug/L, mg/L, ppm, ppb)
│
├── server/              # Node.js + Express + TypeScript API
│   ├── src/services/    # Calculation engine, AI explainer, CSV parser, report generator (PDF/CSV)
│   ├── src/routes/      # Auth, workspaces, projects, samples, analyses, standards, reports
│   ├── src/middleware/  # Google OAuth, JWT cookies, RBAC, 10MB upload limits, request IDs
│   └── tests/           # Vitest integration & unit test suite (35 passing tests)
│
├── client/              # React 18 + Vite + TypeScript + Tailwind CSS SPA
│   ├── src/features/    # Landing, Dashboard, Samples, Analytics, Map, Reports, Methodology, Settings
│   ├── src/components/  # Accessible UI primitives (Button, Card, Badge, StatusBadge, Alert)
│   └── e2e/             # Playwright E2E browser test suite (Multi-viewport responsive QA)
│
├── docs/                # Engineering specifications & guides
│   ├── architecture.md          # Multi-tenant system architecture & design tokens
│   ├── scientific-methodology.md# Mathematical formulations and derivation proofs
│   ├── security-and-privacy.md  # RBAC, OAuth 2.0, prompt injection defense, and sanitization
│   ├── testing.md               # Quality assurance, test commands, and invariant proofs
│   └── deployment.md            # Production Docker, Nginx reverse proxy, and monitoring
│
├── Dockerfile           # Multi-stage production container build
├── docker-compose.yml   # Multi-service production orchestration (App + MongoDB 7)
├── package.json         # Workspaces root definition
└── .env.example         # Documented environment template with placeholders
```

---

## 4. Getting Started

### Local Development Setup

```bash
# 1. Install dependencies across all workspaces
npm install

# 2. Build the shared package
npm run build:shared

# 3. Start development servers concurrently
# Terminal 1: Backend Express API (port 5000)
npm run dev:server

# Terminal 2: Frontend Vite SPA (port 5173)
npm run dev:client
```

Open `http://localhost:5173` in your browser.

---

## 5. Automated Testing

MetalSense includes 40+ automated tests across unit, integration, and end-to-end specifications:

```bash
# Run all unit and integration tests across monorepo
npm test

# Run server test suite (invariants, math proofs, RBAC, report generation)
npm test --workspace=@metalsense/server

# Run client test suite (benchmark dataset integrity, UI assertions)
npm test --workspace=@metalsense/client

# Run Playwright E2E browser tests across viewports (360px, 390px, 768px, 1440px)
npm run test:e2e --workspace=@metalsense/client
```

---

## 6. Production Deployment

MetalSense is ready for deployment via Docker:

```bash
# 1. Configure environment variables
cp .env.example .env

# 2. Launch production stack
docker compose up -d --build

# 3. Verify health endpoint
curl http://localhost:5000/api/v1/health
```

Refer to [`docs/deployment.md`](file:///d:/NSP/docs/deployment.md) for Nginx reverse-proxy setup, SSL/TLS, and MongoDB clustering.

---

## 7. Versioning & Mathematical Provenance

- **Current Application Version:** `1.0.0`
- **Calculation Engine Version:** `v1.0.0-deterministic`
- **BIS Specification:** IS 10500:2012 (Second Revision, with Amendment No. 1 & 2)
- **WHO Guidelines:** GDWQ 4th Edition (incorporating 1st and 2nd addenda, 2022)
- **Method References:**
  - HPI: Mohan, S. V., Nithila, P., & Reddy, S. J. (1996). *Estimation of heavy metal in drinking water and development of heavy metal pollution index.*
  - HEI: Edet, A. E., & Offiong, O. E. (2002). *Evaluation of water quality index in southern Nigeria.*
  - $C_d$: Backman, B., Bodiš, D., Lahermo, P., Rapant, S., & Tarvainen, T. (1998). *Application of a groundwater contamination index in Finland and Slovakia.*
