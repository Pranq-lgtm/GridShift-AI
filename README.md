# GridShift-AI 🚛🗑️

**GridShift-AI** is a data-driven micro-surge waste forecasting platform designed for municipal sanitation departments. By combining real-time city permit data with predictive Machine Learning models (XGBoost) and Generative AI (Google Gemini), GridShift-AI acts as a "Copilot" for fleet managers, helping them proactively deploy resources *before* trash overflows happen.

---

## 🌟 Key Features

1. **Predictive 3D Heatmaps**: Visualizes neighborhood waste pressure spikes in a stunning 3D Deck.gl environment. Hexagon heights correlate directly to predicted waste tonnage.
2. **Automated Data Scraper**: Simulates real-time ingestion of municipal open-data portals (e.g., Construction Permits, Public Gatherings, Street Fairs).
3. **Machine Learning Engine**: Uses an XGBoost Regressor to predict the exact tonnage of waste a specific event will generate based on its scale, type, and neighborhood history.
4. **Waste Surge Copilot**: Integrates Google Gemini 2.5 Flash to automatically generate actionable insights. It doesn't just say "Alert"—it tells you *why* the surge is happening and *what* to do about it (e.g., "Deploy additional mobile compactors").
5. **Secure Authentication**: Built-in Google Single Sign-On (SSO) via Firebase.

---

## 🏗️ Architecture Stack

GridShift-AI uses a modern, decoupled microservices architecture:

*   **Frontend**: React (Vite) + Deck.gl + Mapbox + Tailwind-style custom glassmorphism CSS.
*   **Backend Server**: Node.js + Express. Handles API routing and database persistence.
*   **Database**: MongoDB (Mongoose). Stores historical permits and AI forecasts.
*   **ML Microservice**: Python + FastAPI + XGBoost + Google Gemini. Handles heavy numerical predictions and LLM reasoning.

---

## 🚀 Getting Started Locally

To run the entire suite locally, you will need to start all three services.

### 1. Start the ML Service
```bash
cd ml_service
python -m venv venv
.\venv\Scripts\activate  # (On Windows)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Start the Node Backend
```bash
cd backend
npm install
npm run start
```
*Note: Ensure you have your `MONGO_URI` set in a `.env` file inside the backend directory.*

### 3. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Note: Ensure you have your Firebase and Mapbox credentials set in `.env` inside the frontend directory.*

### 4. Trigger the Scraper
To ingest new synthetic municipal data and trigger an AI prediction:
```bash
cd ml_service
python scraper.py
```

---

## 🌍 Production Deployment

The infrastructure is optimized for serverless and PaaS deployment:
*   **Frontend**: Deployed via [Vercel](https://vercel.com) (Serverless Edge).
*   **Backend**: Deployed via [Render.com](https://render.com) (Node Web Service).
*   **ML Service**: Deployed via [Render.com](https://render.com) (Python Web Service).

*Remember to replicate all local `.env` variables into the environment settings of your deployment providers!*