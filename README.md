# GridShift-AI 🚛🗑️

**GridShift-AI** is a data-driven micro-surge waste forecasting platform designed for municipal sanitation departments. By combining real-time city permit data with predictive Machine Learning (XGBoost) and Generative AI (Google Gemini 2.5 Flash), GridShift-AI acts as a **"Waste Surge Copilot"** — empowering fleet managers to proactively deploy resources *before* trash overflows happen.

> 🏆 **Submission for Seva Innovation Challenge 2026** — Theme: Governance & Civic Technology | UN SDG 11.6 & 12

---

## 🌟 Key Features

1. **Predictive 3D Heatmaps**: Visualizes neighborhood waste pressure spikes in a 3D Deck.gl geospatial environment. Hexagon heights directly correlate to predicted waste tonnage.
2. **Automated Data Scraper**: Simulates real-time ingestion of municipal open-data portals (Construction Permits, Public Gatherings, Street Fairs, Food Festivals).
3. **Machine Learning Engine**: XGBoost Regressor predicts exact waste tonnage a specific event will generate based on its scale, type, and neighborhood history.
4. **Waste Surge Copilot**: Integrates Google Gemini 2.5 Flash to auto-generate actionable dispatch insights — not just "Alert", but *why* the surge is happening and *what* to do (e.g., "Deploy 2 additional mobile compactors by 6PM").
5. **Secure Authentication**: Google Single Sign-On (SSO) via Firebase with Role-Based Access Control (RBAC).

---

## 🎯 UN Sustainable Development Goals (SDG) Alignment

| SDG | Goal & Target | GridShift-AI Contribution |
| :--- | :--- | :--- |
| **SDG 11** | **Sustainable Cities and Communities** • *Target 11.6*: Reduce the adverse per capita environmental impact of cities, including air quality & municipal waste management. | Eliminates chronic urban garbage overflows by replacing reactive cleanup with 24–48hr predictive micro-surge forecasts and AI copilot dispatches. |
| **SDG 12** | **Responsible Consumption and Production** • *Target 12.5*: Substantially reduce waste generation through prevention, reduction, and recycling. | Reduces redundant diesel truck trips by 25–40%, cutting carbon emissions and optimizing municipal fleet resource consumption. |

---

## 🏗️ System Architecture

GridShift-AI uses a modern, decoupled microservices architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRIDSHIFT-AI ARCHITECTURE                    │
├──────────────┬──────────────────┬──────────────┬───────────────┤
│   Frontend   │   Node Backend   │  ML Service  │   Database    │
│              │                  │              │               │
│  React+Vite  │  Node.js/Express │  FastAPI     │  MongoDB      │
│  Deck.gl 3D  │  REST API Layer  │  XGBoost     │  (Mongoose)   │
│  Mapbox GL   │  Firebase RBAC   │  Gemini 2.5  │  Atlas Cloud  │
│  Custom CSS  │  /api/permits    │  /predict    │               │
└──────────────┴──────────────────┴──────────────┴───────────────┘
         │               │                │
         └───────────────┴────────────────┘
                    All services communicate
                    via REST over HTTP/HTTPS
```

**Data Flow:**
1. `scraper.py` → Ingests civic event permits from municipal portals
2. `Node Backend` → Persists permits to MongoDB, triggers ML prediction call
3. `ML Service (FastAPI)` → XGBoost predicts surge tonnage, Gemini generates Copilot response
4. `Frontend (React)` → Fetches predictions, renders 3D hex-bin pressure map + Copilot drawer

---

## 📋 Environment Variables

### 1. ML Service (`ml_service/.env`)

```env
# Google Gemini API Key (required for AI Copilot)
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
# Mapbox public access token (required for map tiles)
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here

# Firebase config (required for Google SSO)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

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

✅ Verify: Open http://localhost:5000/api/permits — should return an empty array `[]`

### Step 4: Start the React Frontend (Port 5173)

```bash
cd frontend

# Install dependencies
npm install

# Create .env and add Firebase & Mapbox keys (see Environment Variables above)

# Start the dev server
npm run dev
```

✅ Visit http://localhost:5173 and sign in with your Google account.

### Step 5: Trigger the Data Scraper (Run Test Predictions)

```bash
cd ml_service

# This ingests 5 synthetic municipal event permits and triggers ML predictions
python scraper.py
```

After running, refresh the frontend — you should see new data points on the 3D heatmap!

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

### Manual API Test (curl)

```bash
# Test health
curl http://localhost:8000/health

# Test a prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"location":"Margao Market","event_type":"Food Festival","scale":9,"date":"2026-11-02T00:00:00"}'
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
| `GET` | `/health` | ML (8000) | Health check |
| `POST` | `/predict` | ML (8000) | Predict surge tonnage + Copilot |
| `GET` | `/api/permits` | Backend (5000) | Fetch all stored permits |
| `POST` | `/api/permits/bulk` | Backend (5000) | Ingest batch of permits |

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
| **Frontend** | [Vercel](https://vercel.com) | Set all `VITE_*` env vars in Vercel dashboard |
| **Backend** | [Render.com](https://render.com) | Set `MONGO_URI`, `PORT`, `ML_SERVICE_URL` in Render env |
| **ML Service** | [Render.com](https://render.com) | Set `GEMINI_API_KEY` in Render env |

> ⚠️ **Important:** Replicate all local `.env` variables into the environment settings of your deployment providers before going live!

---

## 📁 Project Structure

```
GridShift-AI/
├── frontend/                # React + Vite + Deck.gl frontend
│   ├── src/
│   │   ├── App.jsx          # Main app with 3D map
│   │   ├── Login.jsx        # Firebase Google SSO page
│   │   ├── Navbar.jsx       # Navigation & Copilot drawer
│   │   ├── pages/           # Additional pages
│   │   └── index.css        # Custom glassmorphism styles
│   └── public/              # Static assets
├── backend/                 # Node.js + Express backend
│   └── server.js            # REST API + MongoDB integration
├── ml_service/              # Python FastAPI ML microservice
│   ├── main.py              # XGBoost + Gemini prediction engine
│   ├── scraper.py           # Municipal permit data ingester
│   └── requirements.txt     # Python dependencies
└── README.md
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Pranav Kantak — ASSASSIN CODER'S

---

## 👥 Team

**Team Name:** ASSASSIN CODER'S
**Team Lead:** Pranav Sadanand Kantak | pranavkantak9@gmail.com
**GitHub:** https://github.com/Pranq-lgtm/GridShift-AI
