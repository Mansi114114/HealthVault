# HealthVault — Personal Health Record Manager

HealthVault is a responsive healthcare dashboard for managing reports, prescriptions, appointment history, and time-limited sharing. The visual design follows the eight-page reference named **HealthVault – App Screens**: dark teal home page, split sign-in page, and light patient workspace with a left navigation sidebar.

> **Privacy notice:** This is a **college demonstration project**, not a clinically certified medical application. Use fictitious patient data and sample reports only. The demo mode is **not secure**. Firebase mode implements account-based access controls but requires real security testing and a privacy/legal review before any real-world health-data use.

## Stack and full-stack architecture

- **Editor:** Visual Studio Code (VS Code).
- **Frontend:** React 18, Vite 6, JavaScript, responsive CSS, Lucide icons.
- **Backend services (BaaS):** Firebase Authentication + Cloud Firestore (documents and files) + Firebase Security Rules, all on the free Spark plan. No separate Express/Flask server is necessary for this scope.
- **Cloud hosting:** Vercel (static React SPA).
- **Source control:** Git/GitHub.
- **Local environment:** Node.js 20+ and npm (works in VS Code on Windows, macOS and Linux).

```
Patient/Doctor browser (React, hosted on Vercel)
        |                  |
        v                  v
Firebase Auth      Cloud Firestore
Login / roles      Appointments, metadata, shares,
                   access logs + file chunks
                   (protected by security rules)
```

## Delivered features

1. Landing page, responsive sidebar dashboard and secure signup/login.
2. Medical documents: PDF/JPG/PNG upload (up to 5 MB, stored in Firestore), browse, filter, search, preview and delete.
3. Prescriptions: medicine, dosage, doctor, date, notes and linked report.
4. Appointments: upcoming and past visits, notes, date/time and mark completed.
5. Email-specific single-document sharing, 24-hour/7-day/30-day expiry, revocation, recipient view and in-app access log.
6. Two roles defined by permissions: **patient owner** and **verified recipient**. No public document links are required.
7. Firestore real-time snapshots for lists, Vercel setup and sample data.

## A. RUN LOCALLY IN VS CODE — DEMO (NO FIREBASE ACCOUNT NEEDED)

### 1. Install prerequisites

- Install **Node.js 20 or newer** from https://nodejs.org/ (includes npm).
- Install **Visual Studio Code** from https://code.visualstudio.com/.
- Install **Git** from https://git-scm.com/downloads.

### 2. Open the project

1. Clone the repository: `git clone https://github.com/Mansi114114/HealthVault.git`
2. VS Code → **File → Open Folder** → select the `HealthVault` folder.
3. Open **Terminal → New Terminal**.

### 3. Run the following commands

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

In **Command Prompt**, use `copy .env.example .env` instead of `Copy-Item`.

Open the address printed by Vite, typically **http://localhost:5173/**.

**Demo login:** use the **Open patient demo** button on the login screen. You can also click **Or explore with sample data** on the landing page. In the top-right user menu, select **Switch to doctor demo** to see shared files from the recipient perspective.

Demo notes:
- Existing reports use the fictional PDFs in `public/samples/`.
- Demo metadata is saved to browser `localStorage`; user-uploaded demo files are saved to browser `IndexedDB`.
- **Demo authentication is simulated, not real**. Demo data is not securely protected and is not synced across computers.
- Don't upload real medical records in demo mode.

### 4. Useful scripts

```bash
npm run dev        # Start local React app
npm test           # Run built-in validation unit tests
npm run build      # Create production dist/ build
npm run preview    # Inspect production build locally
```

## B. CONNECT REAL FIREBASE CLOUD BACKEND

**No billing needed:** this version stores files in Cloud Firestore as chunks, so it runs on the free **Spark** plan. Each file is limited to 5 MB. Firestore free-tier quotas apply (check Firebase pricing for current limits).

1. Go to https://console.firebase.google.com/ and **Create project**.
2. **Authentication → Sign-in method:** enable **Email/Password**.
3. **Firestore Database:** create a database in production mode (the supplied rules will be deployed next).
4. **Project settings → Your apps → Web app**: register your web app and copy the Firebase config.
5. In VS Code, update the `.env` file (do **NOT** include quotes):

```env
VITE_DEMO_MODE=false
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

6. Deploy the **security rules**. You can paste `firestore.rules` into the Firestore Rules tab, or use the CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

The CLI command uses `firebase.json` and `firestore.rules`. Review the rules before deploying.

### Role-based workspaces

During signup, choose **Patient** or **Doctor** as the account workspace. The choice is stored in `users/{uid}.role` and determines which dashboard and navigation the account sees. Doctors only see records that patients have explicitly shared with their verified email; patient record, prescription and appointment pages are unavailable in the doctor workspace. Existing accounts without a role default to patient; a project administrator can set their role in the Firebase console. Doctor workspace selection is not professional credential verification.

7. Restart `npm run dev` after editing `.env`. Create an account and click the verification link received in email before testing **received** shares. To create a share, sign in as one user, upload a sample PDF, share with another verified Firebase user email, log in as that recipient, and open it from **Sharing → Documents shared with me**.

## C. DEPLOY TO VERCEL

1. Push this repository to GitHub. Do not commit `.env` or credentials.
2. Go to https://vercel.com/ → **Add New Project** → import your GitHub repo.
3. Framework should be **Vite**. Set Build Command `npm run build` and Output Directory `dist`.
4. In Vercel Environment Variables:
   - **Demo deployment:** add `VITE_DEMO_MODE=true`.
   - **Real Firebase:** add **exactly** the `VITE_...` values used in `.env` above, including `VITE_DEMO_MODE=false`.
5. Deploy and copy the `https://...vercel.app` live link.
6. For real Firebase only: Firebase Console → Authentication → Settings → Authorized domains: add the Vercel domain.
7. **Re-deploy** if environment variables change (Vite reads them at build time). Test on the actual live link using two verified test accounts.

Vercel SPA rewrites are included in `vercel.json` (the app's navigation uses URL hashes, so deep links also remain reliable).

## C2. DEPLOY TO FIREBASE HOSTING

This repository also includes Firebase Hosting configuration. Sign in with the Firebase CLI, then run `firebase deploy --only hosting,firestore:rules`. The hosting predeploy step builds the app and publishes `dist/` to `https://healthvault-24cc5.web.app`. Keep `VITE_APP_URL` set to that public URL when building locally; deployed builds can use their own origin. Share links point to the HealthVault app and preserve the recipient's sign-in redirect before opening the shared record.

**Cost warning:** Vercel and Firebase service quotas/limits may change. Set a Firebase Cloud Billing budget if you use real Firebase mode.

## D. PROJECT STRUCTURE

```
HealthVault/
├── public/samples/            # Four fictional PDF reports
├── src/
│   ├── components/            # Shared UI, sidebar, document viewer
│   ├── context/               # App state + Firebase/demo data operations
│   ├── lib/                   # Config, validation, Firebase, demo database
│   ├── pages/                 # Home, Auth, Dashboard, Documents,
│   │                          # Prescriptions, Appointments, Sharing
│   ├── App.jsx                # Hash-based navigation
│   ├── main.jsx               # React app entry point
│   └── styles.css             # Responsive teal design system
├── tests/                     # Node.js built-in unit tests
├── firestore.rules            # Firestore authorization (documents + file chunks)
├── firebase.json              # Firebase CLI config
├── vercel.json                # Static hosting rewrite + security headers
├── .env.example               # Fill Firebase web config here
└── package.json               # npm dependencies and scripts
```

## E. SECURITY DESIGN AND LIMITATIONS

- **Owner isolation:** Firestore query rules only allow a signed-in owner to list/update their records, prescriptions and appointments.
- **Verified recipient:** Shares are tied to the intended recipient email and require a verified Firebase email identity for receiving; rules enforce access on reads. A link alone never grants access.
- **Time-limited:** Firestore `expiresAt` is a timestamp; Firestore rules verify `expiresAt > request.time` and `revoked == false` on every file-chunk read.
- **No public links:** Files are rebuilt in the browser from authenticated Firestore reads; there is no long-lived download URL.
- **In-app logging only:** The interface logs recipient opens, not every possible lower-level download. A robust production-grade audit gateway would require a trusted backend and server-side logs.
- **No recall of copies:** A recipient who has already saved/downloaded a copy cannot be forced to erase it after revocation.
- **Encryption at rest:** Google Cloud provides provider-managed encryption at rest; this project does not add patient-managed end-to-end encryption.
- **File size:** files are stored in Firestore, so each is limited to 5 MB. For larger files, move to a dedicated object store.
- **Not production medical software:** It does not provide HIPAA/GDPR/DPDP compliance assurance, clinical verification, virus scanning, detailed clinician onboarding, or a formal consent/audit system.

## F. TROUBLESHOOTING

| Error | Solution |
|---|---|
| `npm` not recognized | Install Node.js 20+ and reopen VS Code. |
| `Missing script dev` | Terminal must be in the project folder (the one containing `package.json`). |
| Firebase `auth/operation-not-allowed` | Enable Email/Password in Firebase Authentication. |
| Firebase `permission-denied` | Deploy supplied Firestore rules, verify correct project ID/account. |
| File won't open | Deploy the latest `firestore.rules` (they include the file-chunk rules) and check the file is under 5 MB. |
| Share invisible to doctor | Verify doctor email, refresh session, check exact matching email address. |
| Deployed Vercel site shows the yellow "DEMO MODE" banner | The `VITE_` variables are missing or incomplete, so the app fell back to demo mode. Add all of them in Vercel and redeploy. |
| Demo upload not opening | Demo files are stored in the browser's IndexedDB; try the same browser/profile. |
