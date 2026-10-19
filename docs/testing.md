# MetalSense — Testing & Quality Assurance Suite

MetalSense enforces a multi-tier quality assurance framework combining unit tests, mathematical invariant proofs, API integration tests, adversarial prompt-injection security tests, and Playwright end-to-end browser specifications.

---

## 1. Test Architecture Overview

```
                          ┌────────────────────────┐
                          │   Playwright E2E QA    │  Multi-viewport responsive QA,
                          │  (client/e2e/*.spec)   │  ARIA accessibility, user flows
                          └───────────┬────────────┘
                                      │
                          ┌───────────▼────────────┐
                          │ API Integration Tests  │  Supertest HTTP assertions,
                          │(server/tests/integrat) │  RBAC, multi-tenant isolation
                          └───────────┬────────────┘
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
        │                                                           │
┌───────▼───────────────────────────┐     ┌─────────────────────────▼─────────────────────────┐
│     Mathematical Invariant Tests  │     │       Security & AI Sanitization Tests            │
│  (server/tests/unit/worked_examp) │     │  (server/tests/unit/ai_safety_and_explanations)   │
│  HPI, HEI, Cd worked proofs       │     │  Adversarial prompt injection defense             │
└───────────────────────────────────┘     └───────────────────────────────────────────────────┘
```

---

## 2. Test Execution Commands

### Run All Unit and Integration Tests Across Monorepo
```bash
npm test
```

### Run Server Tests in Isolation
```bash
npm test --workspace=@metalsense/server
```

### Run Client Tests in Isolation
```bash
npm test --workspace=@metalsense/client
```

### Run Playwright Browser E2E Tests
```bash
npm run test:e2e --workspace=@metalsense/client
```

---

## 3. Test Suites & Coverage Breakdown

### Suite A: Mathematical Invariants & Scientific Worked Examples
- **File:** `server/tests/unit/worked_examples.test.ts`
- **Methodological Standards:**
  - **HPI (Heavy Metal Pollution Index):** Mohan et al. (1996), Prasad & Bose (2001).
  - **HEI (Heavy Metal Evaluation Index):** Edet & Offiong (2002).
  - **$C_d$ (Degree of Contamination):** Backman et al. (1998).
- **Invariants Verified:**
  1. **Identity Limit Property:** When all monitored metals equal their respective maximum permissible limits ($M_i = S_i$), $HPI$ evaluates to exactly $100.00$.
  2. **Monotonicity:** An increase in toxic metal concentration strictly increases $HPI$, $HEI$, and $C_d$.
  3. **Zero Concentration Lower Bound:** Pure distilled water with 0 metal content yields $HPI \approx 0$, $HEI = 0$, $C_d = -N$ (where $N$ is count of evaluated metals).
  4. **Detection Limit Substitution:** Handles $< \text{LOD}$ using EPA 0.5x LOD heuristic, strictly verified against zero substitution.
  5. **Unit Normalization Invariance:** Verifies conversion from $\mu\text{g/L}$, $\text{ppm}$, and $\text{ppb}$ to $\text{mg/L}$ yields numerically identical index results.

### Suite B: Multi-Tenant SaaS Isolation & RBAC
- **File:** `server/tests/integration/auth_and_isolation.test.ts`
- **Security Invariants Verified:**
  1. **Unauthenticated Denial:** Protected routes (`/api/v1/auth/me`, `/api/v1/workspaces/*`) reject missing or forged tokens with `401 Unauthorized`.
  2. **Cross-Tenant Access Denial:** User B in Workspace B attempting to access or modify samples, analyses, or projects belonging to Workspace A receives a strict `404 Not Found` or `403 Forbidden`.
  3. **Role Boundary Enforcement:** Users with role `viewer` cannot mutate state, delete records, or access sensitive workspace audit logs.

### Suite C: Ingestion & CSV Parsing Pipeline
- **File:** `server/tests/integration/imports.test.ts`
- **Validations Tested:**
  1. RFC-4180 standard compliance with quoted fields and CRLF delimiters.
  2. Dynamic column detection (mapping "Lead", "Pb", "Concentration (mg/L)").
  3. Rejection of unphysical negative concentrations.
  4. Automatic flagging of below-limit symbols (`<0.001`).

### Suite D: Grounded AI Safety & Prompt Injection Defense
- **File:** `server/tests/unit/ai_safety_and_explanations.test.ts`
- **Adversarial Defenses Verified:**
  1. **System Override Neutralization:** Strips text containing *"ignore all previous instructions"*, *"enter developer mode"*, or markdown evasion.
  2. **Untrusted XML Enclosure:** Lab data is wrapped in `<untrusted_lab_document>` tags.
  3. **Grounding Traceability:** Fallback explanations strictly quote calculated $HPI$, $HEI$, and $C_d$ numbers and forbid medical claims or potability certifications.

### Suite E: Auditable Report Generation
- **File:** `server/tests/integration/reports.test.ts`
- **Export Formats Tested:**
  1. **CSV Matrix:** Validates RFC-4180 format, headers, sample IDs, coordinates, index values, and individual analyte measurements.
  2. **Auditable PDF Dossier:** Validates binary `%PDF` header, document margins, multi-page calculation trace tables, unit weight traces ($W_i \cdot Q_i$), and legal disclaimers.

### Suite F: Playwright Browser E2E & Accessibility Matrix
- **Files:**
  - `client/e2e/landing_and_navigation.spec.ts`
  - `client/e2e/sample_workflow.spec.ts`
  - `client/e2e/accessibility_and_contrast.spec.ts`
- **Responsive Viewport Coverage:**
  - Small Mobile: $360 \times 740\text{px}$
  - Standard Mobile: $390 \times 844\text{px}$
  - Tablet: $768 \times 1024\text{px}$
  - Desktop: $1440 \times 900\text{px}$
- **WCAG 2.2 AA Audits:**
  - Accessible names and aria-labels on select controls.
  - Semantic `<main>`, `<nav>`, `<aside>`, and `<h1>` headings per view.
  - Zero horizontal overflow blowout across breakpoints.
