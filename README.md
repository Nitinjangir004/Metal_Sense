# MetalSense — Heavy Metal Pollution Intelligence SaaS

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-teal.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-slate.svg)](https://expressjs.com/)
[![Standards](https://img.shields.io/badge/Standards-BIS%2010500%3A2012%20%7C%20WHO-emerald.svg)](https://archive.org/details/gov.in.is.10500.2012)

MetalSense is a multi-user environmental analysis platform for assessing heavy-metal pollution from laboratory reports and measured sample data. It provides deterministic water quality indices (HPI, HEI, $C_d$), compares values against official regulatory standards, renders geospatial distribution maps, and produces auditable compliance dossiers.

---

## Key Features

1. **Deterministic Scientific Calculation Engine**
   - **HPI (Heavy Metal Pollution Index):** Mohan et al. (1996), Prasad & Bose (2001).
   - **HEI (Heavy Metal Evaluation Index):** Edet & Offiong (2002).
   - **$C_d$ (Degree of Contamination):** Backman et al. (1998).
   - **Zero Arithmetic Hallucination:** Computations are performed exclusively by deterministic, unit-tested code.

2. **Official Regulatory Standards Registry**
   - **BIS 10500:2012:** Bureau of Indian Standards Drinking Water Specification (including 2015 amendments).
   - **WHO GDWQ 4th Edition:** World Health Organization Guidelines for Drinking-water Quality.

3. **Multi-Modal Data Ingestion & Human-in-the-Loop OCR**
   - Manual parameter entry with dynamic unit and detection limit qualifiers ($=, <, \le$).
   - CSV bulk matrix upload with field mapping.
   - Laboratory PDF/image certificate ingestion with confidence indicators and mandatory analyst verification.

4. **Geospatial & Analytical Intelligence**
   - Interactive OpenStreetMap/Leaflet visualization of geocoded aquifer wells.
   - Recharts comparative analyte breakdowns vs statutory maximum admissible limits.

5. **Auditable Reporting**
   - Legally reproducible dossiers including intermediate weightings ($W_i, Q_i, W_i \cdot Q_i$), detection limit strategies, and timestamps.

---

## Monorepo Structure

```
d:\NSP\
├── shared/     # Isomorphic TypeScript types, Zod schemas, constants, unit converters
├── server/     # Express API, deterministic solvers, standards registry, routers
├── client/     # React 18, Vite, Tailwind CSS, Recharts, Leaflet, UI primitives
├── docs/       # Architecture, scientific methodology, security, and deployment guides
└── package.json
```

---

## Local Development Setup

### Prerequisites
- **Node.js:** v18+ (tested on Node v24.14.1)
- **npm:** v9+ (tested on npm 11.11.0)

### Installation
```bash
git clone <repo-url>
cd NSP
npm install
```

### Running Locally
```bash
# Run server (port 5000)
npm run dev:server

# Run client (port 5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) to view the application with the pre-loaded sandbox benchmark dataset.

### Running Test Suites
```bash
# Run all unit and integration tests
npm test
```
