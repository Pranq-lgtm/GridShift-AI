from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import xgboost as xgb
from datetime import datetime
import google.generativeai as genai
import json
import os

app = FastAPI(title="GridShift-AI ML Microservice")

gemini_api_key = os.environ.get("GEMINI_API_KEY")
if not gemini_api_key:
    print("Warning: GEMINI_API_KEY environment variable not set. Copilot will fail.")
genai.configure(api_key=gemini_api_key)
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3)

print("Training dummy XGBoost model...")
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

@app.get("/health")
def health_check():
    return {"status": "ML Service is running"}

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

            Provide a short, structured JSON response explaining why this surge is expected and what actionable steps the fleet manager should take.
            Output exactly in this JSON format:
            {{
                "when": "Expected peak time string (e.g., '8:30 PM–11:00 PM')",
                "why": ["Reason 1", "Reason 2", "Reason 3"],
                "recommendations": ["Recommendation 1", "Recommendation 2"],
                "confidence": 84
            }}
            Return ONLY the JSON.
            """
            
            try:
                ai_response = gemini_model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                copilot_dict = json.loads(ai_response.text)
                copilot_data = CopilotExplanation(**copilot_dict)
            except Exception as e:
                print("Gemini API Error:", e)
                copilot_data = CopilotExplanation(
                    when="Unknown",
                    why=["Event scale exceeds normal threshold"],
                    recommendations=["Deploy additional trucks"],
                    confidence=70
                )

        return PredictionResponse(
            predicted_surge_tonnage=prediction,
            pressure_level=pressure_level,
            alert_triggered=alert,
            copilot=copilot_data
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
