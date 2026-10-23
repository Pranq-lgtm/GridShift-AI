from fastapi import FastAPI, HTTPException
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

# Latest available free-tier Gemini models in priority order
GEMINI_FREE_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"]
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
            "Dispatch Autonomous Rover R-1 for real-time curbside litter telemetry"
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting ML Microservice on http://localhost:{port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
