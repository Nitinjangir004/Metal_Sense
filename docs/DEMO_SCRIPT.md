# MetalSense — 3-Minute Product Walkthrough Script

This script provides an end-to-end walkthrough of **MetalSense — Heavy Metal Pollution Intelligence**, demonstrating real user registration, workspace creation, CSV lab report ingestion, deterministic index calculation, standard comparison, and audit PDF export.

---

## Prerequisites
- Server running at `http://localhost:5000` (or `docker compose up --build`).
- Client running at `http://localhost:5173`.
- Test dataset file ready: `examples/groundwater_lab_samples.csv` (also available via the 1-click **"Load Example CSV"** button).

---

## Step 1: Sign Up & Workspace Setup (45 seconds)
1. Navigate to `http://localhost:5173/signup`.
2. Enter your details:
   - **Full Name**: `Dr. Aris Thorne`
   - **Email Address**: `analyst@groundwater-lab.org`
   - **Password**: `SecurePass2026!` (notice the dynamic password strength meter)
   - **Workspace Name**: `Indo-Gangetic Aquifer Monitoring`
   - **Default Regulatory Standard**: `BIS IS 10500:2012 (India)`
   - **LOD Handling Strategy**: `Half LOD (0.5 × LOD)`
3. Click **"Create Laboratory Account"**.
4. You will be authenticated immediately via secure `metalsense_session` cookie and land on the clean **Water Quality Intelligence Dashboard**.
5. Observe the clean empty state: zero hardcoded demo data, welcoming you with options to import a CSV, enter measurements manually, or load the verified test dataset.

---

## Step 2: 3-Step CSV Ingestion & Validation (45 seconds)
1. Click **"Import CSV / Add Sample"** (or navigate to `/app/samples/new`).
2. Switch to the **"CSV Batch Import"** tab.
3. Click **"Load Example CSV"** (or upload `examples/groundwater_lab_samples.csv` from your disk).
4. Review the **Step 2: Preview & Validation Table**:
   - Status badge shows: `5 Valid Samples`.
   - Table previews sample codes: `GW-KAN-01`, `GW-KAN-02`, `GW-VAR-01`, `GW-VAR-02`, `GW-PAT-01`.
   - GPS coordinates and detected metal counts (`As`, `Cd`, `Cr`, `Cu`, `Fe`, `Mn`, `Ni`, `Pb`, `Zn`) are verified.
5. Click **"Confirm & Ingest 5 Samples"**.
6. The system executes deterministic calculations across all 5 monitoring wells, stores immutable `AnalysisRun` documents in MongoDB, and redirects to the **Sample Registry**.

---

## Step 3: Inspect Index Calculations & Regulatory Standards (45 seconds)
1. On the **Sample Registry** (`/app/samples`):
   - Notice `GW-KAN-01` displays **Critical HPI** (`HPI ≥ 100`, colored rose).
   - `GW-KAN-02` displays **Low HPI** (`HPI < 25`, colored emerald).
   - Exceeded analytes chips show exact statutory exceedances (`As`, `Cd`, `Cr`, `Fe`, `Ni`).
2. Click on **`GW-KAN-01`** to open its **Laboratory Dossier** (`/app/samples/:id`):
   - Top cards display **HPI (Heavy Metal Pollution Index)**, **HEI (Heavy Metal Evaluation Index)**, and **$C_d$ (Degree of Contamination)**.
   - Heavy metal concentrations table compares measured values against standard limits ($S_i$) with sub-index $Q_i$ traces.
   - Use the **Re-evaluate Standard** dropdown to switch to **WHO Guidelines (4th Edition)** and click **"Recalculate Indices"**. Notice that a new immutable analysis run is recorded while preserving audit history.

---

## Step 4: Geospatial Map & Auditable PDF Export (45 seconds)
1. Click **"Geospatial Map"** (`/app/map`):
   - All 5 samples with valid coordinates are plotted across the Indo-Gangetic basin.
   - Markers are colored deterministically by HPI category (Red = Critical, Green = Compliant).
   - Click a marker to open its popup summary and jump directly to its dossier.
2. Click **"Auditable Reports"** (`/app/reports`):
   - Click **"Download Executive PDF"** to generate the formal audit dossier with mathematical methodology, formulas, parameter tables, and statutory signatures.
   - Click **"Download Full Matrix CSV"** to export the normalized research matrix compatible with R, Python Pandas, and QGIS.

---

## Summary of Verification Checks
- **Zero Dummy Data**: Starting from a new account displays an honest empty state with 0 samples.
- **Deterministic Math**: Pure functions calculate indices; no LLMs perform arithmetic.
- **Auditable Provenance**: Original CSV file names, timestamps, and calculation versions (`1.1.0-deterministic`) are recorded for every sample.
