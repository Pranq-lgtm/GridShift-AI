from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime
import time
import random
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
import google.generativeai as genai
import json
import os
from pathlib import Path

# Automatically load environment variables from .env
def _load_env():
    candidates = [
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parent.parent / ".env",
    ]
    for env_file in candidates:
        if env_file.exists():
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass
            break

_load_env()

app = FastAPI(title="GridShift-AI ML Microservice (Vectorized + Gemini 3.8 Flash)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Latest available free-tier Gemini models in priority order
GEMINI_FREE_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]
gemini_api_key = os.environ.get("GEMINI_API_KEY")
gemini_model = None
active_gemini_model_name = GEMINI_FREE_MODELS[0]

if not gemini_api_key:
    print("Warning: GEMINI_API_KEY environment variable not set. Copilot will use deterministic fallback.")
else:
    try:
        genai.configure(api_key=gemini_api_key)
        gemini_model = genai.GenerativeModel(active_gemini_model_name)
        print(f"Gemini Copilot initialized successfully with {active_gemini_model_name}.")
    except Exception as e:
        print(f"Warning: Could not configure Gemini model: {e}")

# Sliding-window rate-limit tracker (12 requests / 60s free-tier safety guard)
_request_timestamps: list[float] = []
MAX_RPM = 12

def _check_rate_limit() -> bool:
    now = time.time()
    while _request_timestamps and now - _request_timestamps[0] > 60.0:
        _request_timestamps.pop(0)
    if len(_request_timestamps) >= MAX_RPM:
        return False
    _request_timestamps.append(now)
    return True

def generate_copilot_with_backoff(prompt: str, max_retries: int = 3) -> dict | None:
    if gemini_model is None or not _check_rate_limit():
        return None
    for attempt in range(max_retries):
        try:
            ai_response = gemini_model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(ai_response.text)
        except Exception as err:
            err_str = str(err).lower()
            if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "503" in err_str:
                backoff_sec = (2 ** attempt) + random.uniform(0.1, 0.5)
                print(f"[Gemini Rate-Limit Guard] Retry {attempt + 1}/{max_retries} in {backoff_sec:.2f}s...")
                time.sleep(backoff_sec)
                continue
            print("Gemini API Error:", err)
            break
    return None

model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3)

print("Training XGBoost surge forecasting model...")
np.random.seed(42)
X_train = np.random.rand(100, 3)
y_train = X_train[:, 0] * 5 + X_train[:, 1] * 2 + np.random.randn(100)
model.fit(X_train, y_train)
print("Model trained.")

class PredictionRequest(BaseModel):
    location: str
    event_type: str
    scale: int
    date: str

class BatchPredictionRequest(BaseModel):
    items: list[PredictionRequest]

class CopilotExplanation(BaseModel):
    when: str
    why: list[str]
    recommendations: list[str]
    confidence: int

class PredictionResponse(BaseModel):
    predicted_surge_tonnage: float
    pressure_level: str
    alert_triggered: bool
    copilot: CopilotExplanation | None = None

def encode_event_type(event_type: str) -> int:
    types = {"Construction": 1, "Public Gathering": 2, "Food Festival": 3, "Street Fair": 4}
    return types.get(event_type, 0)

def _build_default_copilot(req: PredictionRequest, prediction: float, pressure_level: str) -> CopilotExplanation:
    return CopilotExplanation(
        when="6:00 PM – 10:30 PM Peak Window",
        why=[
            f"{req.event_type} permit scale ({req.scale}/10) at {req.location} exceeds baseline ward capacity",
            f"Predicted {prediction:.1f}T surge requires pre-emptive bin clearance"
        ],
        recommendations=[
            f"Pre-stage Compactor T-402 at {req.location} 2 hours prior to peak",
            "Dispatch Municipal Small Pickup Van V-102 or Ward Sanitation Staff on foot for curbside clearance"
        ],
        confidence=89
    )

@app.get("/health")
def health_check():
    return {
        "status": "ML Service is running",
        "gemini_model": active_gemini_model_name,
        "vectorized_batch_supported": True
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_surge(request: PredictionRequest):
    try:
        event_date = datetime.fromisoformat(request.date.replace('Z', '+00:00'))
        days_to_event = (event_date - datetime.now(event_date.tzinfo)).days

        features = np.array([[request.scale, days_to_event, encode_event_type(request.event_type)]])
        prediction = float(model.predict(features)[0])

        base_threshold = 20.0
        pressure_level = "Normal"
        alert = False

        if prediction > base_threshold * 1.5:
            pressure_level = "Critical"
            alert = True
        elif prediction > base_threshold:
            pressure_level = "High"

        copilot_data = None
        if alert or pressure_level == "High":
            prompt = f"""
            You are the 'Waste Surge Copilot', an AI assistant for a municipal sanitation department.
            We have detected a waste surge alert for the following event:
            - Location: {request.location}
            - Event Type: {request.event_type}
            - Event Scale: {request.scale}/10
            - Date: {event_date.strftime('%A, %B %d, %Y')}
            - Predicted Surge: {prediction:.1f} tons
            - Pressure Level: {pressure_level}

            Output ONLY valid JSON with keys: "when" (str), "why" (list[str]), "recommendations" (list[str]), "confidence" (int).
            """
            copilot_dict = generate_copilot_with_backoff(prompt)
            if copilot_dict:
                copilot_data = CopilotExplanation(**copilot_dict)
            else:
                copilot_data = _build_default_copilot(request, prediction, pressure_level)

        return PredictionResponse(
            predicted_surge_tonnage=prediction,
            pressure_level=pressure_level,
            alert_triggered=alert,
            copilot=copilot_data
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# PERFORMANCE OPTIMIZATION: Vectorized batch prediction endpoint
# Executes a single NumPy/XGBoost matrix inference across all permits at once
@app.post("/predict/batch")
def predict_surge_batch(batch: BatchPredictionRequest):
    if not batch.items:
        return {"predictions": []}

    feature_rows = []
    for item in batch.items:
        event_date = datetime.fromisoformat(item.date.replace('Z', '+00:00'))
        days_to_event = (event_date - datetime.now(event_date.tzinfo)).days
        feature_rows.append([item.scale, days_to_event, encode_event_type(item.event_type)])

    feature_matrix = np.array(feature_rows)
    preds = model.predict(feature_matrix)

    base_threshold = 20.0
    results = []
    for item, raw_pred in zip(batch.items, preds):
        prediction = float(raw_pred)
        pressure_level = "Normal"
        alert = False
        if prediction > base_threshold * 1.5:
            pressure_level = "Critical"
            alert = True
        elif prediction > base_threshold:
            pressure_level = "High"

        copilot_data = (
            _build_default_copilot(item, prediction, pressure_level)
            if (alert or pressure_level == "High")
            else None
        )
        results.append(
            PredictionResponse(
                predicted_surge_tonnage=prediction,
                pressure_level=pressure_level,
                alert_triggered=alert,
                copilot=copilot_data
            )
        )

    return {"predictions": results}


# In-memory persistence for permits & tickets when ML_SERVICE_URL is used as the unified backend URL
_IN_MEMORY_PERMITS: list[dict] = [
    {
        "_id": "PMT-2026-101",
        "location": "Margao Municipal Fish & Vegetable Market (Ward 7)",
        "coordinates": {"lat": 15.2736, "lng": 73.9575},
        "type": "Food Festival",
        "scale": 9,
        "date": datetime.utcnow().isoformat() + "Z",
        "predictedWasteSurge": 18.5,
        "wastePressureLevel": "Critical",
        "alertTriggered": True,
        "copilotExplanation": {
            "when": "5:30 PM – 9:30 PM Evening Peak",
            "why": [
                "Market organic waste output (18.5T) exceeds baseline Ward 7 capacity",
                "High weekend footfall around Old Market Circle"
            ],
            "recommendations": [
                "Pre-stage Compactor T-402 at Margao Market North Gate by 4:30 PM",
                "Deploy Municipal Sanitation Staff (On Foot — Ward Beat Crew) for continuous lane sweeping"
            ],
            "confidence": 94
        }
    },
    {
        "_id": "PMT-2026-102",
        "location": "Fatorda Stadium Commercial Sector (Ward 2)",
        "coordinates": {"lat": 15.2891, "lng": 73.9620},
        "type": "Public Gathering",
        "scale": 8,
        "date": datetime.utcnow().isoformat() + "Z",
        "predictedWasteSurge": 14.2,
        "wastePressureLevel": "High",
        "alertTriggered": True,
        "copilotExplanation": {
            "when": "6:00 PM – 10:30 PM Match Window",
            "why": [
                "Public gathering permit scale 8/10 at Fatorda Stadium Complex",
                "Projected 14.2T packaging and organic surge"
            ],
            "recommendations": [
                "Reroute Compactor T-119 to Fatorda Stadium East Corridor",
                "Assign Municipal Small Pickup Van V-102 for rapid curbside clearance"
            ],
            "confidence": 91
        }
    }
]

_IN_MEMORY_TICKETS: list[dict] = []


@app.get("/api/permits")
def get_permits():
    return _IN_MEMORY_PERMITS


@app.post("/api/permits")
async def create_permit(req: Request):
    body = await req.json()
    loc = body.get("location", "Madgaon Municipal Ward")
    ev_type = body.get("type") or body.get("event_type") or "Construction"
    scale = int(body.get("scale", 5))
    dt = body.get("date") or (datetime.utcnow().isoformat() + "Z")
    pred_res = predict_surge(PredictionRequest(location=loc, event_type=ev_type, scale=scale, date=dt))
    doc = {
        "_id": f"PMT-{int(time.time() * 1000)}",
        "location": loc,
        "coordinates": body.get("coordinates") or {"lat": 15.2736, "lng": 73.9575},
        "type": ev_type,
        "scale": scale,
        "date": dt,
        "predictedWasteSurge": pred_res.predicted_surge_tonnage,
        "wastePressureLevel": pred_res.pressure_level,
        "alertTriggered": pred_res.alert_triggered,
        "copilotExplanation": pred_res.copilot.dict() if pred_res.copilot else None
    }
    _IN_MEMORY_PERMITS.insert(0, doc)
    return doc


@app.post("/api/permits/bulk")
async def create_permits_bulk(req: Request):
    body = await req.json()
    raw_permits = body.get("permits", [])
    if not raw_permits:
        return {"insertedCount": 0, "permits": []}
    batch_items = [
        PredictionRequest(
            location=p.get("location", "Madgaon Sector"),
            event_type=p.get("type") or p.get("event_type") or "Construction",
            scale=int(p.get("scale", 5)),
            date=p.get("date") or (datetime.utcnow().isoformat() + "Z")
        )
        for p in raw_permits
    ]
    batch_res = predict_surge_batch(BatchPredictionRequest(items=batch_items))
    docs = []
    for p, pred in zip(raw_permits, batch_res["predictions"]):
        doc = {
            "_id": f"PMT-{int(time.time() * 1000)}-{len(docs)}",
            "location": p.get("location", "Madgaon Sector"),
            "coordinates": p.get("coordinates") or {"lat": 15.2736, "lng": 73.9575},
            "type": p.get("type") or "Construction",
            "scale": int(p.get("scale", 5)),
            "date": p.get("date") or (datetime.utcnow().isoformat() + "Z"),
            "predictedWasteSurge": pred.predicted_surge_tonnage,
            "wastePressureLevel": pred.pressure_level,
            "alertTriggered": pred.alert_triggered,
            "copilotExplanation": pred.copilot.dict() if pred.copilot else None
        }
        docs.append(doc)
    _IN_MEMORY_PERMITS[:0] = docs
    return {"insertedCount": len(docs), "vectorized": True, "permits": docs}


@app.get("/api/tickets")
def get_tickets():
    return _IN_MEMORY_TICKETS


@app.post("/api/tickets")
async def create_ticket(req: Request):
    ticket = await req.json()
    _IN_MEMORY_TICKETS.insert(0, ticket)
    return ticket


@app.patch("/api/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, req: Request):
    updates = await req.json()
    for t in _IN_MEMORY_TICKETS:
        if t.get("id") == ticket_id:
            t.update(updates)
            return t
    return {"id": ticket_id, **updates}


@app.post("/api/gemini/copilot")
async def gemini_copilot_endpoint(req: Request):
    body = await req.json()
    query = body.get("query", "")
    system_prompt = body.get("systemPrompt", "")
    if gemini_model is not None and _check_rate_limit():
        try:
            resp = gemini_model.generate_content(f"{system_prompt}\n\nUSER QUESTION: {query}")
            return {"text": resp.text, "model": active_gemini_model_name}
        except Exception:
            pass
    return {"text": None, "fallback": True}


@app.post("/api/subscribe")
async def subscribe_newsletter(req: Request):
    body = await req.json()
    return {"status": "subscribed", "email": body.get("email", "")}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting ML Microservice on http://localhost:{port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

