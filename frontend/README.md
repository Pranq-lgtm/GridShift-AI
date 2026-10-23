# GridShift-AI 🚛🗑️

**GridShift-AI** is a data-driven micro-surge waste forecasting and automated civic redressal platform designed for municipal sanitation departments. By combining real-time city permit data, **Google Maps Platform** geospatial telemetry (centered on **Madgaon, Goa**), predictive Machine Learning (**XGBoost**), and Generative AI (**Google Gemini 2.5 Flash**), GridShift-AI acts as a **"Waste Surge Copilot"** — empowering fleet managers to proactively deploy resources *before* trash overflows happen while closing the loop with citizens through automated SLA ticket tracking.

> UN SDG 11.6 & 12 • **Latest Release:** [v1.1.0](RELEASE_NOTES.md)

---

## 🌟 Key Features

1. **Google Maps Platform Live Grid Map (Madgaon Local Area Default View)**: Interactive geospatial command center (`@vis.gl/react-google-maps`) centered by default on **Madgaon (Margao), Goa (`15.2736° N, 73.9575° E`)** with live layer toggles for Construction & Demolition (C&D) Debris sites, Micro-Surge Hotspots, Geotagged Citizen Redressal Tickets, and 3D Hex Density overlays.
2. **Automated Citizen Ticket Redressal & Feedback Loop (`/redressal`)**: End-to-end 6-stage civic incident lifecycle (`OPEN` → `TRIAGED` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `VERIFIED_CLOSED`) with severity-driven SLA timers (`4h`–`48h`), fleet unit dispatch, and mandatory citizen 1–5 star verification ratings (with automatic ticket reopen if unresolved).
3. **Email-Bound Role-Based Access Control (RBAC) & Clean Authentication (`/login`)**: Distraction-free Firebase Email/Password login with **Forgot Password (`sendPasswordResetEmail`)** and Mobile OTP (`+91`). Authenticating as **`pranavkantak9@gmail.com`** automatically unlocks the **Platform Admin Dispatch & GitHub Audit Console**, while any other email displays the **Citizen Reporter View**.
4. **Vectorized Bulk Permit Scraper & 15.1x Faster Ingestion**: Ingests municipal open-data permits (Construction Permits, Public Gatherings, Street Fairs, Food Festivals) using parallelized batch XGBoost inference (`/predict/batch`) and single-roundtrip `Permit.insertMany()`.
5. **Resilient Waste Surge Copilot (`gemini-2.5-flash`)**: Integrates the latest free-tier **Google Gemini 2.5 Flash** (with `gemini-2.5-flash-lite` fallback), sliding-window rate limiting (`12 RPM` guard), HTTP `429` exponential backoff + jitter, and a 5-minute TTL response cache.

---

## 🆕 What's New in v1.1.0 (Release Notes)

> 📄 Full changelog available in **[RELEASE_NOTES.md](RELEASE_NOTES.md)**.

- **🗺️ Google Maps Platform Integration (Madgaon Default View)**: Upgraded the Live Grid Map (`Dashboard.jsx`) to Google Maps Platform (`@vis.gl/react-google-maps`) locked by default to the Madgaon municipal sector (`15.2736, 73.9575`) with interactive `AdvancedMarker` telemetry pins for C&D debris (`CD-101`–`CD-105`), waste surge hotspots (`SG-201`–`SG-202`), and citizen tickets (`TKT-*`).
- **🎫 Automated Citizen Ticket Redressal & Star-Rating Verification Loop (`/redressal`)**: Built a complete SLA-tracked ticketing workflow where citizen camera reports generate geotagged tickets, admins dispatch rovers/compactors, and citizens verify cleanup with a 1–5 star rating before closure.
- **🔐 Streamlined Login with Forgot Password & Automatic Email-Based RBAC**: Removed manual Admin/Citizen toggle switches and login page RBAC jargon; added Firebase **Forgot Password** email reset. View mode is strictly bound to the signed-in email (`pranavkantak9@gmail.com` = Admin View + GitHub Repo Audit; all other emails = Citizen View).
- **⚡ 15.1x Core Logic Performance Optimization**: Vectorized `POST /api/permits/bulk` (`backend/server.js`) and added `POST /predict/batch` (`ml_service/main.py`) + `Permit.insertMany()`, reducing 25-permit ingestion latency from `2840ms` to `188ms`. Added client-side canvas image compression (`≤ 480px`) for citizen uploads.
- **🤖 Gemini 2.5 Flash Free-Tier Rate-Limit Guard**: Upgraded to `gemini-2.5-flash` with `gemini-2.5-flash-lite` fallback, sliding-window 12 RPM rate limiting, HTTP 429 exponential backoff + jitter, and 5-minute TTL caching.

---

## 🎯 UN Sustainable Development Goals (SDG) Alignment

| SDG | Goal & Target | GridShift-AI Contribution |
| :--- | :--- | :--- |
| **SDG 11** | **Sustainable Cities and Communities** • *Target 11.6*: Reduce the adverse per capita environmental impact of cities, including air quality & municipal waste management. | Eliminates chronic urban garbage overflows by replacing reactive cleanup with 24–48hr predictive micro-surge forecasts, AI copilot dispatches, and SLA-verified citizen redressal. |
| **SDG 12** | **Responsible Consumption and Production** • *Target 12.5*: Substantially reduce waste generation through prevention, reduction, and recycling. | Reduces redundant diesel truck trips by 25–40%, cutting carbon emissions and optimizing municipal fleet resource consumption. |

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
│  Gemini 2.5   │  insertMany()     │  Gemini 2.5   │  Atlas Cloud     │
└───────────────┴───────────────────┴───────────────┴──────────────────┘
          │                │                 │
          └────────────────┴─────────────────┘
                     All services communicate
                     via REST over HTTP/HTTPS
```

**Data Flow:**
1. `scraper.py` → Ingests civic event permits from municipal portals
2. `Node Backend` → Calls vectorized `/predict/batch` (or parallelized predictions) and persists permits via single-roundtrip `Permit.insertMany()`
3. `ML Service (FastAPI)` → XGBoost predicts surge tonnage; `gemini-2.5-flash` (with 429 backoff & TTL cache) generates Copilot dispatch plan
4. `Frontend (React)` → Renders **Google Maps Platform** live grid centered on Madgaon (`15.2736, 73.9575`), AI Copilot drawer, and email-bound **Citizen/Admin Redressal Console (`/redressal`)**

---

## 📋 Environment Variables

### 1. ML Service (`ml_service/.env`)

```env
# Google Gemini API Key (required for AI Copilot - uses gemini-2.5-flash free tier)
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key: https://aistudio.google.com/app/apikey

### 2. Backend (`backend/.env`)

```env
# MongoDB connection string (required)
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/gridshift?retryWrites=true&w=majority

# Port for the Node.js server (optional, defaults to 5000)
PORT=5000

# URL of the ML FastAPI service (optional, defaults to localhost:8000)
ML_SERVICE_URL=http://localhost:8000
```

### 3. Frontend (`frontend/.env`)

```env
# Google Maps Platform API Key (required for Madgaon Live Grid Map)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase config (required for Email/Password Auth, Forgot Password & Mobile OTP)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Gemini API Key for client-side RAG Copilot fallback (optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Backend API URL (required)
VITE_BACKEND_URL=http://localhost:5000
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

✅ Visit http://localhost:5173 and sign in (`pranavkantak9@gmail.com` for Admin Console; any other email for Citizen View).

### Step 5: Trigger the Data Scraper (Run Test Predictions)

```bash
cd ml_service

# This ingests 5 synthetic municipal event permits and triggers ML predictions
python scraper.py
```

After running, refresh the frontend — you will see updated telemetry markers on the Madgaon Google Maps Live Grid!

---

## 🧪 Sample Data & Test Cases

### Sample Permit Payload (POST `/api/permits/bulk`)

```json
{
  "permits": [
    {
      "location": "Margao Market",
      "coordinates": { "lat": 15.2750, "lng": 73.9580 },
      "type": "Food Festival",
      "scale": 9,
      "date": "2026-11-02T00:00:00"
    },
    {
      "location": "Colva Beach Road",
      "coordinates": { "lat": 15.2760, "lng": 73.9110 },
      "type": "Public Gathering",
      "scale": 3,
      "date": "2026-11-05T00:00:00"
    }
  ]
}
```

### Sample ML Prediction Request (POST `/predict`)

```json
{
  "location": "Fatorda",
  "event_type": "Construction",
  "scale": 8,
  "date": "2026-11-10T00:00:00"
}
```

### Expected Prediction Response

```json
{
  "predicted_surge_tonnage": 34.7,
  "pressure_level": "Critical",
  "alert_triggered": true,
  "copilot": {
    "when": "8:00 AM – 6:00 PM",
    "why": [
      "High-scale construction activity creates large volumes of debris and concrete waste",
      "Fatorda ward has historically low off-day collection frequency",
      "No additional compactor allocated for this zone this week"
    ],
    "recommendations": [
      "Deploy 1 additional tipper truck to Fatorda by 7:30 AM",
      "Coordinate with construction supervisor for debris container placement",
      "Schedule mid-day overflow check at 1:00 PM"
    ],
    "confidence": 87
  }
}
```

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
| `GET` | `/health` | ML (8000) | Health check + Gemini model & rate-limit telemetry |
| `POST` | `/predict` | ML (8000) | Predict single event surge tonnage + Gemini 2.5 Flash Copilot |
| `POST` | `/predict/batch` | ML (8000) | Vectorized batch XGBoost prediction for bulk ingestion |
| `GET` | `/api/permits` | Backend (5000) | Fetch all stored permits |
| `POST` | `/api/permits/bulk` | Backend (5000) | Vectorized bulk permit ingestion (`insertMany`, 15.1x faster) |
| `GET` | `/api/tickets` | Backend (5000) | Fetch citizen redressal tickets & SLA history |
| `POST` | `/api/tickets` | Backend (5000) | Create automated citizen redressal ticket with SLA timer |
| `PATCH` | `/api/tickets/:id/status` | Backend (5000) | Admin-only (`pranavkantak9@gmail.com`) ticket dispatch & status update |
| `POST` | `/api/tickets/:id/feedback` | Backend (5000) | Citizen star rating (1–5) & verification closure / auto-reopen |

### Event Type Encoding

| Event Type | Encoded Value |
|------------|---------------|
| Construction | 1 |
| Public Gathering | 2 |
| Food Festival | 3 |
| Street Fair | 4 |
| Unknown | 0 |

---

## 🌍 Production Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| **Frontend** | [Vercel](https://vercel.com) | Set `VITE_GOOGLE_MAPS_API_KEY`, `VITE_FIREBASE_*`, `VITE_BACKEND_URL` in Vercel dashboard |
| **Backend** | [Render.com](https://render.com) | Set `MONGO_URI`, `PORT`, `ML_SERVICE_URL` in Render env |
| **ML Service** | [Render.com](https://render.com) | Set `GEMINI_API_KEY` in Render env |

> ⚠️ **Important:** Replicate all local `.env` variables into the environment settings of your deployment providers before going live!

---

## 📁 Project Structure

```
GridShift-AI/
├── frontend/                        # React + Vite + Google Maps Platform frontend
│   ├── src/
│   │   ├── App.jsx                  # Main router, Firebase session & RBAC state
│   │   ├── Login.jsx                # Clean Firebase Email/OTP Login + Forgot Password
│   │   ├── Navbar.jsx               # Navigation, RBAC badges & Copilot triggers
│   │   ├── firebase.js              # Firebase Auth config & Admin email helper
│   │   ├── components/
│   │   │   ├── Chatbot.jsx          # Gemini 2.5 Flash Copilot drawer with rate-limit bar
│   │   │   └── WasteCameraModal.jsx # Geotagged camera capture + compressed ticket creator
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing overview & system capabilities
│   │   │   ├── Dashboard.jsx        # Google Maps Madgaon Live Grid Map & 3D telemetry
│   │   │   ├── Redressal.jsx        # Email-bound Admin/Citizen Redressal & Repo Audit
│   │   │   ├── Fleet.jsx            # Autonomous rover & compactor telemetry
│   │   │   └── Analytics.jsx        # Ward-level waste diversion & surge charts
│   │   ├── utils/
│   │   │   └── ragEngine.js         # Gemini 2.5 Flash client with 12 RPM guard & 429 backoff
│   │   └── index.css                # Custom glassmorphism & responsive styles
│   └── public/                      # Static assets
├── backend/                         # Node.js + Express backend
│   └── server.js                    # Vectorized bulk API, Redressal RBAC & MongoDB
├── ml_service/                      # Python FastAPI ML microservice
│   ├── main.py                      # XGBoost (/predict, /predict/batch) + Gemini 2.5 Flash
│   ├── scraper.py                   # Municipal permit data ingester
│   └── requirements.txt             # Python dependencies
├── RELEASE_NOTES.md                 # Version release notes (v1.1.0 & v0.1)
└── README.md                        # Project documentation
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](https://github.com/Pranq-lgtm/GridShift-AI?tab=MIT-1-ov-file) file for details.

Copyright (c) 2026 Pranav Kantak — ASSASSIN CODER'S

---

## 👥 Team

**Team Name:** ASSASSIN CODER'S   
**Team Lead:** Pranav Kantak | pranavkantak9@gmail.com  
**GitHub:** https://github.com/Pranq-lgtm/GridShift-AI
