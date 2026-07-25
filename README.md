# FB Marketplace Automation Suite — Desktop Frontend

Electron + React desktop application that is the control panel for the **FB Automation Backend** (FastAPI). It lets an operator manage Facebook accounts, generate and publish Marketplace listings with AI, run account warmup / slow-listing flows, and monitor background automation jobs in real time.

This app holds no automation logic itself — every action calls the FastAPI backend, which drives Playwright/Facebook and returns a `task_id` that the UI polls for progress.

---

## Technology Stack

| Layer      | Technology                      |
|------------|----------------------------------|
| Shell      | Electron 31                     |
| UI         | React 19 + Vite + Tailwind CSS  |
| State      | Zustand                         |
| API client | Axios (REST, JWT bearer auth)   |
| IPC        | Electron contextBridge (secure) |

---

## Project Structure

```
Facebook-automated/
├── electron/
│   ├── main/
│   │   ├── index.js        ← Electron main process: window management, window IPC
│   │   ├── database.js     ← Legacy, unused (see "Legacy code" below)
│   │   └── whatsapp.js     ← Legacy, unused (see "Legacy code" below)
│   └── preload/
│       └── index.js        ← contextBridge — exposes window controls + legacy channels
│
├── src/
│   ├── App.jsx               ← Auth gate + active-tab router
│   ├── components/
│   │   ├── TitleBar.jsx      ← Custom window chrome (minimize/maximize/close)
│   │   ├── Sidebar.jsx       ← Feature navigation, built from config/features.js
│   │   ├── TaskMonitor.jsx   ← Polls a task_id every 2.5s until it finishes
│   │   ├── Dashboard/        ← Stats overview (accounts, listings, tasks) + recent task table
│   │   ├── Admin/            ← AccountsView, ActivityView, InboxView, SettingsView, UsersView
│   │   └── FeaturePages/
│   │       ├── AccountManagement/ ← Slow Listings (v1/v2), Warmup, Open Accounts, Profile Updater
│   │       ├── ListingManagement/ ← AI Ultra Listings, Create Drafts, Draft Publisher (+ AI), Renew/Relist, Delete/Draft Delete
│   │       ├── MarketingTools/    ← Ads Multiplier, Click Tracking, Listing Automation
│   │       ├── AIFeatures/        ← Title/Description generation, Content Optimization, Smart Suggestions, Automated Workflow
│   │       └── shared/            ← Shared helpers for feature pages
│   ├── config/
│   │   └── features.js       ← Declarative catalog of every nav section/feature
│   ├── store/
│   │   └── index.js          ← Zustand store: auth, active tab, dashboard stats, settings
│   ├── utils/
│   │   ├── api.js            ← Axios client for the FastAPI backend (auth/accounts/listings/tasks/automation/inbox)
│   │   └── ipc.js            ← Thin wrapper around window.electronAPI
│   └── hooks/
│       └── useApi.js          ← Generic "call an api.* fn, track loading/error" hook
│
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- The FB Automation Backend running and reachable (defaults to `http://localhost:8000`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server (port 5173) and Electron concurrently. The app opens with DevTools enabled.

### Production Build

```bash
npm run build
```

Outputs:
- `dist/` — compiled React app
- `dist-electron/` — platform installer (`.exe` / `.dmg` / `.AppImage`)

---

## Backend Connection

- **Base URL** — read from `VITE_API_BASE_URL` at build time, overridable at runtime via `localStorage['fb_base_url']` (Settings screen), falling back to `http://localhost:8000`.
- **Auth** — `POST /api/auth/login` returns a JWT stored in `localStorage['access_token']`; it's attached as a `Bearer` header on every request and cleared automatically on a `401`. `App.jsx`'s `AuthGate` checks `/api/auth/me` on launch to decide whether to show the app or prompt for login.
- **Automation calls are async** — every feature page posts to `POST /api/automation/{name}` (see `src/utils/api.js`), which returns a `task_id` immediately. `TaskMonitor.jsx` polls `GET /api/tasks/{id}` every 2.5s and reports progress/status until the job leaves `queued`/`running`/`pending`.

---

## Feature Catalog

Defined in `src/config/features.js` and rendered by `Sidebar.jsx`:

| Section              | Features |
|----------------------|----------|
| Overview             | Dashboard, Activity Monitoring, Inbox, FB Accounts |
| Account Management   | Old Account Listings, New Account Slow Listings (v1/v2), Account Warm Up, Open FB Accounts, Profile Updater |
| Listing Management   | AI Ultra Listings (max 100), Create Only Drafts, AI Draft Publisher, Draft Publisher, Renew Listings, Relist Listings, Delete All Listings, X Draft Delete |
| Marketing Tools      | ADS Multiplier, Marketplace Click Tracking, Listing Automation |
| AI Features          | AI Title Generation, AI Description Creation, AI Content Optimization, AI Draft Creation, Smart Listing Suggestions, Automated Workflow Support |
| System               | Settings |

---

## Security Model

- **contextIsolation: true** — renderer cannot access Node.js APIs directly
- **nodeIntegration: false** — no direct Node in renderer
- **preload.js whitelist** — only explicitly allowed IPC channels are exposed to the renderer (window controls; see legacy note below)
- **CSP** — `connect-src` is locked to `localhost` in development and the configured production API host in packaged builds

---

## Legacy Code (not part of the current app)

This project was bootstrapped from an earlier WhatsApp-bulk-sender Electron template, and some of that scaffolding is still present but **unused**:

- `electron/main/whatsapp.js`, `electron/main/database.js` — Baileys/SQLite services
- The `wa:*`, `contacts:*`, and `settings:get`/`settings:save` IPC channels in `electron/main/index.js` / `electron/preload/index.js`
- `package.json`'s `name`, `description`, and `build.appId`/`build.productName`/`build.publish` still say "whatsapp-automated"

No component in `src/` calls any of the `wa:*`/`contacts:*`/`settings:*` channels — all real data flows through `src/utils/api.js` over HTTPS to the FastAPI backend. Safe to remove once confirmed, but left untouched here since that wasn't the scope of this change.

---

## Platform Support

| Platform | Format      | Notes                                 |
|----------|-------------|----------------------------------------|
| Windows  | NSIS `.exe` / portable | Requires Visual C++ Build Tools |
| macOS    | `.dmg`      | Requires Xcode CLI Tools              |
| Linux    | `.AppImage` / `.deb` | No install needed, self-contained |

---

## Legal Notice

This software is for legitimate business use only. Ensure you comply with Facebook's Terms of Service and applicable regulations in your jurisdiction. Always operate accounts you are authorized to manage.
