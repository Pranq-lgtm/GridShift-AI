from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime, timedelta

app = FastAPI(title="GridShift-AI ML Microservice")

# Mock training data and model for demonstration purposes
# In production, this would be loaded from a saved artifact (.json or .pkl)
model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3)

# Train a dummy model on startup
print("Training dummy XGBoost model...")
np.random.seed(42)
X_train = np.random.rand(100, 3) # Features: [scale, days_to_event, type_encoded]
y_train = X_train[:, 0] * 5 + X_train[:, 1] * 2 + np.random.randn(100) # Target: waste tonnage spike
model.fit(X_train, y_train)
print("Model trained.")

class PredictionRequest(BaseModel):
    location: str
    event_type: str
    scale: int
    date: str # ISO format string

class PredictionResponse(BaseModel):
    predicted_surge_tonnage: float
    pressure_level: str
    alert_triggered: bool

def encode_event_type(event_type: str) -> int:
    types = {"Construction": 1, "Public Gathering": 2, "Food Festival": 3}
    return types.get(event_type, 0)

@app.get("/health")
def health_check():
    return {"status": "ML Service is running"}

@app.post("/predict", response_model=PredictionResponse)
def predict_surge(request: PredictionRequest):
    try:
        event_date = datetime.fromisoformat(request.date.replace('Z', '+00:00'))
        days_to_event = (event_date - datetime.now(event_date.tzinfo)).days
        
        # Prepare features: [scale, days_to_event, type_encoded]
        features = np.array([[request.scale, days_to_event, encode_event_type(request.event_type)]])
        
        # Predict tonnage surge
        prediction = model.predict(features)[0]
        
        # Threshold logic for priority zoning
        base_threshold = 20.0 # e.g. 20 tons
        pressure_level = "Normal"
        alert = False
        
        if prediction > base_threshold * 1.5:
            pressure_level = "Critical"
            alert = True
        elif prediction > base_threshold:
            pressure_level = "High"
            
        return PredictionResponse(
            predicted_surge_tonnage=float(prediction),
            pressure_level=pressure_level,
            alert_triggered=alert
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
