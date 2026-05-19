# 🏫 Kidz Vision School Management System

A complete, enterprise-grade, multi-tenant cloud-based SaaS school management platform designed to automate and digitize all aspects of school operations—from admissions and billing to classroom teaching, student grading, and parent communications.

Developed with **React 18**, **TypeScript**, **Node.js/Express**, and **Google Cloud Firestore**, this software supports high-performance, real-time synchronization, and multi-tab offline database persistence.

---

## 🎯 System Hierarchy & Access Control

The platform implements a strict **multi-tenant hierarchy** to cleanly isolate educational trusts, school chains, individual branches, and specific user roles:

```
                  ┌─────────────────────────────────────┐
                  │        SUPER ADMIN DASHBOARD        │
                  │   (Platform-wide SaaS Controls)     │
                  └──────────────────┬──────────────────┘
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
               ┌─────────────────┐       ┌─────────────────┐
               │ ORGANIZATION A  │       │ ORGANIZATION B  │
               │ (Edu Trust v1)  │       │ (School Chain)  │
               └────────┬────────┘       └────────┬────────┘
                        │                         │
                 ┌──────┴──────┐           ┌──────┴──────┐
                 ▼             ▼           ▼             ▼
           ┌──────────┐  ┌──────────┐┌──────────┐  ┌──────────┐
           │ SCHOOL 1 │  │ SCHOOL 2 ││ SCHOOL 3 │  │ SCHOOL 4 │
           └────┬─────┘  └──────────┘└──────────┘  └────┬─────┘
                │                                       │
        ┌───────┴───────────────────────────────────────┴──────┐
        │               SCHOOL-LEVEL DASHBOARDS                │
        │ ┌──────────────────────────────────────────────────┐ │
        │ │                 ADMIN DASHBOARD                  │ │
        │ │     (13 Modules - Full Operational Control)      │ │
        │ └──────────────────────────────────────────────────┘ │
        │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
        │ │   TEACHER    │  │    PARENT    │  │   STUDENT    │ │
        │ │  DASHBOARD   │  │  DASHBOARD   │  │  DASHBOARD   │ │
        │ │  (7 Modules) │  │  (6 Modules) │  │  (9 Modules) │ │
        │ └──────────────┘  └──────────────┘  └──────────────┘ │
        └──────────────────────────────────────────────────────┘
```

---

## 👥 Supported User Roles & Dashboards

The system manages **5 distinct roles** spanning **43 modular features** to cover every operational touchpoint:

### 1. 🔐 Super Admin Dashboard (SaaS Owner)
*Platform-wide governance for the entire SaaS footprint.*
* **Scope**: Access to all organizations and school data logs.
* **Key Capabilities**: Create/edit school organizations, configure enterprise-wide third-party services, manage subscription tiers/limits, monitor platform metrics, and dispatch system announcements.

### 2. 👔 School Admin / Principal Dashboard
*Full operational administration over a single, isolated school branch.*
* **Scope**: School-wide access.
* **Key Capabilities**: Process and follow up on enquiries and student admissions, set fee structures, issue and track invoices, configure academic semesters, allocate classrooms, assign teacher schedules, and generate master reports.

### 3. 👨‍🏫 Teacher Dashboard
*Empowers educators with core tracking, grading, and instructional tools.*
* **Scope**: Access limited to assigned classes and subjects.
* **Key Capabilities**: Log daily lesson plans, record student attendance, post new homework and assignments, score student submissions, chat with parents, and utilize integrated AI-powered teaching flows.

### 4. 👪 Parent Dashboard
*Provides transparency and simple channels to monitor and support children.*
* **Scope**: Access restricted strictly to their own enrolled child(ren).
* **Key Capabilities**: Track attendance calendars, review subject grades, pay pending school fees online (with automatic invoice receipt downloads), view real-time events, and apply for child leave.

### 5. 🎓 Student Dashboard
*An interactive homework, schedules, and learning hub.*
* **Scope**: Access restricted to personal academic profiles.
* **Key Capabilities**: Submit completed assignments, download lesson materials, view dynamic class timetables, take online revision quizzes, review question mistakes, study flashcards, and message teachers directly.

---

## 🛠️ Technology Stack

| Layer | Technology | Operational Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 18 (TypeScript), Vite | Formulates type-safe, lightweight, and blazing-fast client interfaces. |
| **Styling & Animation** | Tailwind CSS v4, Framer Motion (`motion`) | Provides polished dark modes, micro-animations, HSL palettes, and fluid layouts. |
| **UI Components** | Radix UI, Material UI (MUI), Lucide Icons | Supplies interactive dialogs, menus, and customizable icons. |
| **Database** | Google Cloud Firestore (NoSQL) | Serves as the primary real-time document store with offline persistence enabled. |
| **Security & Auth** | Firebase Authentication | Provides secure email/password logins with role-based JWT session authorization. |
| **AI Layer** | Firebase AI (Gemini 2.0 via `GoogleAIBackend`) | Implements frontend generative AI models securely without exposing private API keys. |
| **Backend REST API** | Node.js, Express.js | Lightweight Express API to process complex multitenant queries and system updates. |
| **Cloud Integration** | Firebase Cloud Functions (v2 HTTPS) | Deploys a serverless Asian-South1 (Mumbai) backend for lowest latency operations. |
| **Core Pipelines** | Razorpay, Stripe, MSG91, Twilio, SendGrid | Connects payment gateways, SMS feeds, WhatsApp APIs, and transactional emails. |

---

## 📁 Repository Structure

```
School Management Software/
├── src/                               # Frontend codebase (React + Vite)
│   ├── assets/                        # Design systems, media assets, and styling tokens
│   ├── components/                    # Reusable visual components (Cards, Modals, Panels)
│   ├── contexts/                      # Global state providers (Authentication, Theme)
│   ├── hooks/                         # Custom React hooks (e.g. useAggregatedNotifications)
│   ├── pages/                         # Role-specific dashboard layouts & views
│   ├── routes/                        # Client-side routing engine & role security bounds
│   ├── services/                      # API and service adapters
│   │   ├── student/                   # Student data models and reminder structures
│   │   ├── notificationAggregator.ts  # Dispatches exam, fee, announcement alerts to Firestore
│   │   └── apiClient.ts               # Axios client featuring multi-tenant headers insertion
│   └── index.css                      # Master stylesheet compiled using Tailwind CSS
│
├── backend/                           # Node.js/Express API (Alternative local server)
│   ├── src/                           # Route routers and controller actions
│   └── package.json                   # Backend startup dependencies
│
├── functions/                         # Cloud Functions (Production Serverless endpoint)
│   ├── src/                           # Express server wrappers suited for serverless deployment
│   ├── index.js                       # 2nd-gen Cloud Functions HTTPS entrypoint
│   └── package.json                   # Cloud Functions dependencies
│
└── config files                       # vite.config.ts, tsconfig.json, firebase.json, firestore.rules
```

---

## 🚀 Getting Started & Local Setup

Follow these steps to configure the environment and run the application locally on your system.

### 📋 Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)
* A Firebase account with Firestore, Authentication, and Cloud Storage configured.

### 1️⃣ Step 1: Install Dependencies
Open a terminal in the root workspace directory and install dependencies across the frontend, backend, and Cloud Functions folders:

```bash
# Install frontend packages
npm install

# Install local backend packages
cd backend
npm install
cd ..

# Install cloud function packages
cd functions
npm install
cd ..
```

### 2️⃣ Step 2: Environment Variables configuration
Create three environment config files across your project directories:

#### Root Directory Configuration (`.env`)
```env
# Gemini Generative AI Key
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Firebase SDK Client Config
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=school-management-82b09.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=school-management-82b09
VITE_FIREBASE_STORAGE_BUCKET=school-management-82b09.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=848954319432
VITE_FIREBASE_APP_ID=1:848954319432:web:cb27a99dd0200cf8622e7d
VITE_FIREBASE_MEASUREMENT_ID=G-1NW48Z2NT8

# Role Access Lists & API Targets
VITE_SUPERADMIN_EMAILS=superadmin@platform.com,superadmin@gmail.com
VITE_API_BASE_URL=http://localhost:3001
```

#### Local Backend Configuration (`backend/.env`)
```env
FIREBASE_PROJECT_ID=school-management-82b09
SUPERADMIN_EMAILS=superadmin@platform.com,superadmin@gmail.com
PORT=3001
```

#### Cloud Functions Configuration (`functions/.env`)
```env
SUPERADMIN_EMAILS=superadmin@platform.com,superadmin@gmail.com
FRONTEND_URL=https://classroom.bristletech.com,http://localhost:5173,http://localhost:5174
```

> [!TIP]
> Ensure you download your Firebase Admin SDK `serviceAccountKey.json` from the Firebase console, rename it to `serviceAccountKey.json`, and place it in the `backend/` directory to authenticate backend transactions.

### 3️⃣ Step 3: Run the Development Servers
For the complete system to function, both the frontend client and backend API should be running concurrently:

#### Start Backend API
```bash
cd backend
npm run dev
```

#### Start Frontend Client (Vite)
Open a new terminal window in the root directory:
```bash
npm run dev
```
Vite will automatically open the login page at `http://localhost:5173`.

#### (Optional) Run Firebase Cloud Functions Locally
If you want to test the serverless API locally using the Firebase emulator suite:
```bash
cd functions
npm run serve
```

---

## 👥 Seed & Demo Accounts

### Automatic Seeding Script
Populate your local Firestore environment with test data and simulate typical first-time user flows using the custom CLI seeder:

```bash
# Execute from the root workspace
node setup_test_users.js
```

This registers two accounts:
1. **Existing User**: `test-existing@example.com` (Password: `TestPassword123!`)
2. **Provisioned User**: `test-provisioned@example.com` (Triggers first-time password set flow)

### Default Demonstration Accounts
Explore each dashboard instantly using these pre-configured user credentials (Password: `demo123`):

* **Super Admin**: `superadmin@platform.com`
* **School Admin**: `admin@school.com`
* **Teacher**: `teacher@school.com`
* **Parent**: `parent@school.com`
* **Student**: `student@school.com`

---

## 🛡️ Multi-Tenant Safety & Headers Injection

Data isolation and security are enforced directly in the network transport layer. The custom frontend [`apiClient.ts`](file:///c:/BristleTech/School%20Management%20Software/src/services/apiClient.ts) automatically intercepts all outgoing HTTP calls and appends critical tenant metadata:

1. **Authentication Token**: Appends a fresh Firebase ID Token `Authorization: Bearer <JWT>` header for API verification.
2. **Branch Contexts**: Appends `x-school-id` and `x-organization-id` header attributes to strictly isolate database reads/writes at the Firestore document subcollection layer.

---

## 📜 Available Maintenance Scripts

A collection of utility CLI scripts can be found inside the `scripts/` directory:

* `node scripts/validate-school-id.js`: Validates all tenant-bound documents to prevent leaking data.
* `node scripts/fix_students_academic_year.js`: Aligns class records to the current active calendar year.
* `node scripts/migrate-nested-to-flat.js`: Flattens subcollection references for enhanced Firestore querying performance.