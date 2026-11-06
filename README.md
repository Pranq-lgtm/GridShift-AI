# GridShift-AI 🚛🗑️

**GridShift-AI** is a data-driven micro-surge waste forecasting and automated civic redressal platform designed for municipal sanitation departments. By combining real-time city permit data, **Google Maps Platform** geospatial telemetry (centered on **Madgaon, Goa**), predictive Machine Learning (**XGBoost**), and Generative AI (**Google Gemini 3.8 Flash** with **Gemini 3.5 Flash-Lite** fallback), GridShift-AI acts as a **"Waste Surge Copilot"** — empowering municipal teams to proactively deploy existing sanitation staff and vehicles *before* trash overflows happen while closing the loop with citizens through automated SLA ticket tracking.

🌐 **Live Production App (Firebase Hosting):** [https://gridshift-ai.web.app/](https://gridshift-ai.web.app/)  
🏷️ **UN SDG 11.6 & 12** • **Latest Release:** [v1.3.0 (GitHub Releases)](https://github.com/Pranq-lgtm/GridShift-AI/releases/tag/v1.3.0)

---

## 🌟 Key Features

1. **Google Maps Platform Live Grid Map (Madgaon Local Area Default View)**: Interactive geospatial command center (`@vis.gl/react-google-maps`) centered by default on **Madgaon (Margao), Goa (`15.2736° N, 73.9575° E`)** with unobstructed **Map / Satellite / Terrain** mode controls, live layer toggles for Construction & Demolition (C&D) Debris sites, Micro-Surge Hotspots, Geotagged Citizen Redressal Tickets (pinned live across all pages), and 3D Hex Density overlays.
2. **Zero-Capex Municipal Staff & Small Pickup Van Dispatch**: Built to zero-burden municipal budgets without expensive autonomous rovers or proprietary IoT bin hardware — incidents are triaged and assigned to existing **Municipal Sanitation Staff (On Foot — Ward Beat Crews)**, **Small Pickup Vans (`V-102`, `V-104`)**, and heavy **Compactor/Tipper Trucks (`T-402`, `T-119`, `T-304`)**.
3. **Nitrosend AI Email Agent & Dual-Role Email Dashboard (`/email-agent`)**: Replaces Mailchimp with the **Nitrosend Email Agent** (`Nitrosend_Public_Key` & `Nitrosend_Secret_Key`), providing a **Client-Facing Dashboard** (Transactional Logs & Receipts timeline, Subscription & Category Preferences Center, and Personal Outbox Engagement Telemetry) and an **Internal Team / Admin Dashboard** (Aggregated Analytics & Metrics, System Health & SPF/DKIM/DMARC Deliverability, AI Approval Gate / Drafts Queue, Global Audience Segments, and Bring-Your-Own ESP Infrastructure + Global Brand Kit editor).
4. **Live Camera Citizen Reporting & Automated Ticket Redressal (`/redressal`)**: Enforces authentic live webcam capture on desktop (blocking arbitrary computer file uploads) and native phone camera capture on mobile, persisting geotagged tickets into the MongoDB `tickets` collection across a 6-stage SLA workflow (`OPEN` → `TRIAGED` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `VERIFIED_CLOSED`) with 1–5 star citizen verification ratings.
5. **Google OAuth, Email/Password, Forgot Password & Mobile OTP Authentication (`/login`)**: Full Firebase Authentication supporting **Continue with Google (`GoogleAuthProvider`)**, **Email/Password Sign-In & Sign-Up**, **Forgot Password (`sendPasswordResetEmail`)**, and **Mobile SMS OTP (`+91`)**. Authenticating as **`pranavkantak9@gmail.com`** or **`+91 7219341650`** automatically unlocks the **Platform Admin Dispatch & Nitrosend Internal Console**.
6. **Vectorized Bulk Permit Scraper & MongoDB `permits` / `tickets` Persistence**: Ingests municipal open-data permits using parallelized batch XGBoost inference (`/predict/batch`) and single-roundtrip `Permit.insertMany()` into the MongoDB `permits` collection.
7. **Resilient Waste Surge Copilot (`gemini-3.8-flash` + `gemini-3.5-flash-lite` fallback)**: Integrates **Google Gemini 3.8 Flash** (`gemini-3.8-flash`) as the primary reasoning model with automatic fallback to **Google Gemini 3.5 Flash-Lite** (`gemini-3.5-flash-lite`), clean plain-text formatting, live ticket ID lookup (`TKT-2026-*`), sliding-window rate limiting (`12 RPM` guard), and HTTP `429` exponential backoff.

---

## 🆕 What's New in v1.3.0

> 📄 Full release notes are published in the **[GitHub Releases Section](https://github.com/Pranq-lgtm/GridShift-AI/releases)**.

- **⚡ Nitrosend AI Email Agent & Custom Dual-Role Dashboard (`/email-agent`)**: Replaced Mailchimp with **Nitrosend** (`Nitrosend_Public_Key` & `Nitrosend_Secret_Key`) and built a comprehensive email operations hub featuring:
  - **👤 Client-Facing Dashboard**: Personal **Transactional Logs & Receipts** timeline, explicit **Preferences & Subscription Center** (opt-in/opt-out & category toggles), and **Basic Individual Engagement** outbox telemetry (`Delivered`, `Opened`, `Bounced`).
  - **👥 Internal Team / Admin Dashboard**: **Aggregated Analytics & Metrics** (volume, open rate, CTR, 7-day trend chart), **System Health & Deliverability** (`SPF`, `DKIM`, `DMARC`, bounce/spam/suppression telemetry), **The Approval Gate / AI Drafts Queue** (review, edit, schedule, or approve AI-generated campaigns), **Global Audience Segments** (custom tags & lifecycle triggers), and **Infrastructure Configuration** (BYO AWS SES / Mailgun / SendGrid + Global Brand Kit editor).
- **🎥 Desktop Live Camera Capture Enforcement (`WasteCameraModal.jsx`)**: Removed arbitrary computer file explorer uploads on desktop so citizen reporting captures authentic, live geotagged webcam frames with timestamp/GPS watermarks while preserving native camera app redirection on mobile devices.
- **📱 Mobile Redressal UI, Non-Stopping Live Stream Pulse & Clean Copilot**: Redesigned the mobile Ticket Redressal layout (5-column equal-width star rating bar, 2×2 KPI grid, 3×2 stepper), fixed the mobile touch-hover pause on the Live Stream Pulse marquee, stripped `**` markdown symbols from AI Copilot responses, and bound MongoDB `permits` and `tickets` collections on ingestion.
- **🏛️ Overview Footer & Legal/Contact Pages (`/about`, `/contact`, `/privacy`, `/terms`)**: Added dedicated **About Us**, **Contact Us** (Admin: **Pranav Kantak** • `pranavkantak9@gmail.com` • `+91 7219341650`), **Privacy Policy**, and **Terms & Conditions** pages linked in the Overview footer.

---

## 📦 Previous Release Highlights (v1.2.0)

- **🔥 Hosted on Firebase Hosting ([https://gridshift-ai.web.app/](https://gridshift-ai.web.app/))**: Configured automated GitHub Actions CI/CD deployment (`firebase-hosting-merge.yml`) to build and deploy the production React + Vite frontend directly to Firebase Hosting.
- **🔐 Google Sign-In + Fixed Forgot Password & Mobile OTP (`/login`)**: Added one-click **Continue with Google** OAuth sign-in alongside Firebase Email/Password (`Sign In` / `Sign Up`), real **Forgot Password** email delivery (`sendPasswordResetEmail`), and **Mobile OTP (`+91`)** with clean reCAPTCHA lifecycle management.
- **🗺️ Unobscured Satellite/Terrain Controls & Cross-Page Citizen Report Pinning**: Repositioned floating HUD overlays so Google Maps **Map / Satellite / Terrain** controls remain 100% accessible, and persisted citizen camera reports globally so incidents reported from *any* route (`Home`, `Redressal`, `Fleet`, `Analytics`, or `Dashboard`) immediately pin onto the Madgaon Live Grid Map.
- **🚶 Zero-Capex Municipal Resource Model**: Replaced costly IoT/rover dispatches with practical **Municipal Sanitation Staff (on foot)** and **Small Pickup Vans (`V-102`, `V-104`)** to ensure zero financial burden on municipal corporations.
- **🤖 Gemini 3.8 Flash & Gemini 3.5 Flash-Lite Fallback**: Standardized the AI Copilot across frontend, backend, and ML microservice on **`gemini-3.8-flash`** (Gemini 3.8 Flash) with automatic fallback to **`gemini-3.5-flash-lite`** (Gemini 3.5 Flash-Lite), 12 RPM sliding-window rate limiting, HTTP 429 exponential backoff + jitter, and 5-minute TTL caching.

---

## 🎯 UN Sustainable Development Goals (SDG) Alignment

| SDG | Goal & Target | GridShift-AI Contribution |
| :--- | :--- | :--- |
| **SDG 11** | **Sustainable Cities and Communities** • *Target 11.6*: Reduce the adverse per capita environmental impact of cities, including air quality & municipal waste management. | Eliminates chronic urban garbage overflows by replacing reactive cleanup with 24–48hr predictive micro-surge forecasts, zero-capex municipal staff/van dispatches, and SLA-verified citizen redressal. |
| **SDG 12** | **Responsible Consumption and Production** • *Target 12.5*: Substantially reduce waste generation through prevention, reduction, and recycling. | Reduces redundant diesel truck trips by 25–40%, cutting carbon emissions and optimizing municipal fleet & foot-crew resource allocation. |

---

## 🏗️ System Architecture

GridShift-AI uses a modern, decoupled microservices architecture:

```
┌──────────────────────────────────────────────────────────────────────┐
│                      GRIDSHIFT-AI ARCHITECTURE                       │
├───────────────┬───────────────────┬───────────────┬──────────────────┤
│   Frontend    │   Node Backend    │  ML Service   │    Database      │
│               │                   │               │                  │
│  React + Vite │  Node.js/Express  │  FastAPI      │  MongoDB         │
│  Google Maps  │  Vectorized Bulk  │  XGBoost      │  (Mongoose)      │
│  Madgaon Grid │  Email RBAC Guard │  /predict &   │  Permits &       │
│  Redressal UI │  /api/permits     │  /predict/    │  Redressal       │
│  Firebase Auth│  /api/tickets     │   batch       │  Tickets         │
│  Gemini 3.8   │  insertMany()     │  Gemini 3.8   │  Atlas Cloud     │
│  (3.5 Lite FB)│                   │  (3.5 Lite FB)│                  │
└───────────────┴───────────────────┴───────────────┴──────────────────┘
          │                │                 │
          └────────────────┴─────────────────┘
                     All services communicate
                     via REST over HTTP/HTTPS
```

**Data Flow:**
1. `scraper.py` → Ingests civic event permits from municipal portals
2. `Node Backend` → Calls vectorized `/predict/batch` and persists permits via single-roundtrip `Permit.insertMany()`
3. `ML Service (FastAPI)` → XGBoost predicts surge tonnage; `gemini-3.8-flash` (with `gemini-3.5-flash-lite` fallback, 429 backoff & TTL cache) generates Copilot dispatch plan
4. `Frontend (React on Firebase Hosting)` → Renders **Google Maps Platform** live grid centered on Madgaon (`15.2736, 73.9575`), AI Copilot drawer, and email-bound **Citizen/Admin Redressal Console (`/redressal`)**

---

## 📋 Environment Variables

### 1. ML Service (`ml_service/.env`)

```env
# Google Gemini API Key (required for AI Copilot - uses gemini-3.8-flash with gemini-3.5-flash-lite fallback)
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key: https://aistudio.google.com/app/apikey

### 2. Backend (`backend/.env`)

```env
# MongoDB connection string (required — persists permits & tickets collections in gridshift_db)
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/gridshift_db?retryWrites=true&w=majority

# Nitrosend AI Email Agent keys (replaces Mailchimp)
Nitrosend_Public_Key=your_nitrosend_public_key
Nitrosend_Secret_Key=your_nitrosend_secret_key

# Port for the Node.js server (optional, defaults to 5000)
PORT=5000

# URL of the ML FastAPI service (required)
ML_SERVICE_URL=your_render_url
```

### 3. Frontend (`frontend/.env`)

```env
# Google Maps Platform API Key (required for Madgaon Live Grid Map)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase config (required for Google OAuth, Email/Password, Forgot Password & Mobile OTP)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Gemini API Key for client-side RAG Copilot fallback (optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Backend API URL (optional)
VITE_BACKEND_URL=your_backend_url
```

---

## 🚀 Getting Started Locally

**Prerequisites:** Node.js ≥ 18, Python ≥ 3.10, MongoDB Atlas account (free tier works)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Pranq-lgtm/GridShift-AI.git
cd GridShift-AI
```

### Step 2: Start the ML Service (Port 8000)

```bash
cd ml_service

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env and add your GEMINI_API_KEY (see Environment Variables above)

# Start the FastAPI ML server
uvicorn main:app --reload --port 8000
```

✅ Verify: Open http://localhost:8000/health — should return `{"status": "ML Service is running"}`

### Step 3: Start the Node.js Backend (Port 5000)

```bash
cd backend

# Install dependencies
npm install

# Create .env and add MONGO_URI (see Environment Variables above)

# Start the server
npm run start
```

✅ Verify: Open http://localhost:5000/api/permits — should return an array of stored permits

### Step 4: Start the React Frontend (Port 5173)

```bash
cd frontend

# Install dependencies
npm install

# Create .env and add VITE_GOOGLE_MAPS_API_KEY & VITE_FIREBASE_* keys (see Environment Variables above)

# Start the dev server
npm run dev
```

✅ Visit http://localhost:5173 (or the live deployment at https://gridshift-ai.web.app/) and sign in via **Google**, **Email/Password**, or **Mobile OTP** (`pranavkantak9@gmail.com` or `+91 7219341650` for Admin Console; any other email for Citizen View).

### Step 5: Trigger the Data Scraper (Run Test Predictions)

```bash
cd ml_service

# This ingests 5 synthetic municipal event permits and triggers ML predictions
python scraper.py
```

After running, refresh the frontend — you will see updated telemetry markers on the Madgaon Google Maps Live Grid!

---

## 📊 Technical Design Document

### ML Model: XGBoost Regressor

| Parameter | Value |
|-----------|-------|
| Algorithm | XGBoost Regressor |
| Features | `scale` (1-10), `days_to_event` (int), `event_type_encoded` (0-4) |
| Target | `waste_surge_tonnage` (float, metric tons) |
| Alert Threshold | `predicted_tonnage > 1.5x baseline (30 tons)` |
| Normal Baseline | 20 tons |
| Estimators | 100 |
| Max Depth | 3 |
| Learning Rate | 0.1 |

### API Endpoints

| Method | Endpoint | Service | Description |
|--------|----------|---------|-------------|
| `GET` | `/health` | ML (8000) | Health check + Gemini 3.8 Flash / 3.5 Flash-Lite rate-limit telemetry |
| `POST` | `/predict` | ML (8000) | Predict single event surge tonnage + Gemini 3.8 Flash Copilot (with 3.5 Flash-Lite fallback) |
| `POST` | `/predict/batch` | ML (8000) | Vectorized batch XGBoost prediction for bulk ingestion |
| `GET` | `/api/permits` | Backend (5000) | Fetch all stored permits (`permits` collection) |
| `POST` | `/api/permits/bulk` | Backend (5000) | Vectorized bulk permit ingestion (`insertMany`, 15.1x faster) |
| `GET` | `/api/tickets` | Backend (5000) | Fetch citizen redressal tickets & SLA history (`tickets` collection) |
| `POST` | `/api/tickets` | Backend (5000) | Create automated citizen redressal ticket with SLA timer |
| `PATCH` | `/api/tickets/:id/status` | Backend (5000) | Admin-only (`pranavkantak9@gmail.com`) ticket dispatch & status update |
| `GET` | `/api/nitrosend/status` | Backend (5000) | Nitrosend Email Agent configuration & key verification status |
| `POST` | `/api/nitrosend/send` | Backend (5000) | Dispatch transactional or outbox email via Nitrosend Agent |
| `POST` | `/api/nitrosend/preferences` | Backend (5000) | Sync citizen subscription & notification category preferences |

---

## 🌍 Production Deployment

| Service | Platform | Live URL / Notes |
|---------|----------|------------------|
| **Frontend** | [Firebase Hosting](https://gridshift-ai.web.app/) | Live at **https://gridshift-ai.web.app/** (auto-deployed via GitHub Actions on push to `main`) |
| **Backend** | [Render.com](https://render.com) | Set `MONGO_URI`, `Nitrosend_Public_Key`, `Nitrosend_Secret_Key`, `PORT`, `ML_SERVICE_URL` in Render env |
| **ML Service** | [Render.com](https://render.com) | Set `GEMINI_API_KEY` (`gemini-3.8-flash` / `gemini-3.5-flash-lite`) in Render env |

---

## 📁 Project Structure

```
GridShift-AI/
├── .github/workflows/               # GitHub Actions CI & Firebase Hosting auto-deploy
├── frontend/                        # React + Vite + Google Maps Platform frontend
│   ├── src/
│   │   ├── App.jsx                  # Main router, Firebase session & RBAC state
│   │   ├── Login.jsx                # Google OAuth + Email/Password + Forgot Password + Mobile OTP
│   │   ├── Navbar.jsx               # Navigation, RBAC badges & Nitrosend Email triggers
│   │   ├── firebase.js              # Firebase Auth config (gridshift-ai) & Admin email/phone helper
│   │   ├── components/
│   │   │   ├── Chatbot.jsx          # Gemini 3.8 Flash Copilot drawer (plain-text clean output)
│   │   │   └── WasteCameraModal.jsx # Live webcam capture on desktop + phone camera capture on mobile
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing overview, Google Maps 3D grid & legal footer
│   │   │   ├── Dashboard.jsx        # Google Maps Madgaon Live Grid Map & 3D telemetry
│   │   │   ├── Redressal.jsx        # Mobile-optimized Citizen/Admin Redressal & 5-star loop
│   │   │   ├── NitrosendDashboard.jsx # Dual-role Nitrosend Client & Internal Admin Email Hub
│   │   │   ├── LegalAndInfoPages.jsx  # About Us, Contact Us, Privacy Policy & Terms pages
│   │   │   ├── Fleet.jsx            # Municipal foot staff, pickup vans & compactor telemetry
│   │   │   └── Analytics.jsx        # Ward-level waste diversion & Gemini 3.8 Flash insights
│   │   ├── utils/
│   │   │   └── ragEngine.js         # Gemini 3.8 Flash + 3.5 Flash-Lite client with ticket ID lookup
│   │   └── index.css                # Custom glassmorphism & responsive mobile styles
│   └── public/                      # Static assets
├── backend/                         # Node.js + Express backend
│   └── server.js                    # Vectorized bulk API, Nitrosend Agent, Redressal RBAC & MongoDB
├── ml_service/                      # Python FastAPI ML microservice
│   ├── main.py                      # XGBoost (/predict, /predict/batch) + Gemini 3.8 Flash + MongoDB
│   ├── scraper.py                   # Municipal permit data ingester
│   └── requirements.txt             # Python dependencies
├── firebase.json                    # Firebase Hosting configuration (frontend/dist)
├── .firebaserc                      # Firebase project binding (gridshift-ai)
└── README.md                        # Project documentation
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](https://github.com/Pranq-lgtm/GridShift-AI?tab=MIT-1-ov-file) file for details.

Copyright (c) 2026 Pranav Kantak — ASSASSIN CODER'S

---

## 👥 Team

**Team Name:** ASSASSIN CODER'S   
**Team Lead:** Pranav Kantak | pranavkantak9@gmail.com | +91 7219341650  
**Live App:** https://gridshift-ai.web.app/  
**GitHub:** https://github.com/Pranq-lgtm/GridShift-AI
