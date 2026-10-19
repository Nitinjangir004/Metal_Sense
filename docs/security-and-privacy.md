# Security, Privacy & SaaS Authentication Specification

**Product:** MetalSense — Heavy Metal Pollution Intelligence  
**Version:** 1.0.0  
**Classification:** Enterprise Environmental Data System

---

## 1. Authentication Architecture & Google OAuth 2.0 Setup

### 1.1 Google Cloud Platform (GCP) Configuration
To configure production or staging Google sign-in:
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a GCP project (e.g. `metalsense-production`).
3. Configure the **OAuth Consent Screen**:
   - User Type: External or Internal (for institutional deployments).
   - App Name: `MetalSense Heavy Metal Intelligence`.
   - Authorized Domains: Your production domain (e.g. `metalsense.org`).
   - Scopes: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`.
4. Create **OAuth 2.0 Client IDs**:
   - Application Type: *Web Application*.
   - Name: `MetalSense Web Client`.
   - **Authorized JavaScript origins:**
     - Development: `http://localhost:5173`, `http://localhost:5000`
     - Production: `https://your-domain.com`
   - **Authorized redirect URIs:**
     - Development: `http://localhost:5173/auth/callback`, `http://localhost:5000/api/v1/auth/callback`
     - Production: `https://your-domain.com/auth/callback`
5. Copy the generated **Client ID** and **Client Secret** into your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 1.2 Mandatory Server-Side Identity Verification Rule
- The frontend receives an ID token (`credential`) from the Google Sign-In SDK.
- The token is transmitted to `POST /api/v1/auth/google`.
- The backend uses `google-auth-library` (`OAuth2Client.verifyIdToken`) to cryptographically verify:
  - Signature against Google's public JWKS.
  - Audience matches `process.env.GOOGLE_CLIENT_ID`.
  - Expiry timestamp ($exp > now$).
  - `email_verified === true`.
- **Zero Client Trust:** The backend extracts the email and user ID directly from the decoded Google payload. Client-provided profile names or roles in request bodies are discarded.

---

## 2. Session Management & Cookies

- Upon successful authentication, the server creates a signed JWT session containing `{ userId, email }` with a 7-day expiry.
- The session is stored in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie named `metalsense_session`.
- `HttpOnly` protects the token from Cross-Site Scripting (XSS) extraction.
- State-changing API routes are protected by workspace RBAC middleware.
- A Bearer token is also returned in the response body for programmatic API clients and automated tests.

---

## 3. Multi-Tenant SaaS Isolation & RBAC

### 3.1 Workspace Isolation
- Every project, sample, document upload, analysis run, and report is strictly foreign-keyed to a `workspaceId`.
- The `requireWorkspaceRole` middleware inspects the user's membership in the target workspace.
- **Cross-Tenant Access Denial:** If User A attempts to access `/api/v1/workspaces/:wsB/...`, the server immediately halts the request with `403 Forbidden` and records a security audit entry.

### 3.2 Role Hierarchy
| Role | Privileges |
|---|---|
| **Owner** | Full workspace administration, member invitations, project deletion, audit log access. |
| **Editor** | Create, edit, and verify samples; upload lab documents; execute index calculations; export reports. |
| **Viewer** | Read-only inspection of verified sample dossiers, charts, and public maps. Sensitive GPS coordinates are masked if configured. Cannot create or modify data. |

---

## 4. Audit Logging & Provenance

Every state-changing action writes an immutable audit record:
- **Timestamp:** ISO 8601 UTC timestamp.
- **UserId:** Actor performing the action.
- **WorkspaceId:** Tenant boundary.
- **Action:** e.g. `USER_SIGN_IN`, `CREATE_WORKSPACE`, `CREATE_SAMPLE`, `VERIFY_OCR_VALUES`.
- **TargetType & TargetId:** Resource impacted.
- **IP Address & User-Agent:** Origin metadata.
