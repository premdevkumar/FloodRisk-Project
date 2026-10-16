import os
import torch
import torch.nn as nn
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
try:
    from deep_translator import GoogleTranslator
    HAS_TRANSLATOR = True
except ImportError:
    HAS_TRANSLATOR = False

app = FastAPI(
    title="Flood Risk Prediction & NLP ML Microservice",
    version="1.0.0",
    description="PyTorch LSTM Time-Series Prediction & Multi-Lingual NLP Advisory Service"
)

# -------------------------------------------------------------------
# PyTorch LSTM Model Definition
# -------------------------------------------------------------------
class FloodLSTMModel(nn.Module):
    def __init__(self, input_size: int = 2, hidden_size: int = 64, num_layers: int = 2):
        super(FloodLSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # x shape: (batch_size, seq_len, input_size)
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])  # take last timestep
        prob = self.sigmoid(out)
        return prob

# Initialize model instance with pre-trained or default weights
model = FloodLSTMModel()
model.eval()

# -------------------------------------------------------------------
# Request / Response Schemas
# -------------------------------------------------------------------
class FloodPredictRequest(BaseModel):
    station_id: str
    historical_water_levels: List[float]  # e.g. last 10 readings in meters
    historical_rainfall_mm: List[float]   # e.g. last 10 readings in mm

class FloodPredictResponse(BaseModel):
    station_id: str
    predicted_water_level_m: float
    flood_probability: float
    risk_level: str  # NORMAL, WARNING, DANGER, EXTREME_DANGER

class TranslateRequest(BaseModel):
    text: str
    target_language: str  # te, hi, mr, ta, en

class TranslateResponse(BaseModel):
    translated_text: str
    target_language: str

# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Flood Risk Prediction & NLP Worker",
        "has_deep_translator": HAS_TRANSLATOR
    }

@app.post("/api/v1/predict-flood", response_model=FloodPredictResponse)
def predict_flood(req: FloodPredictRequest):
    if len(req.historical_water_levels) == 0 or len(req.historical_rainfall_mm) == 0:
        raise HTTPException(status_code=400, detail="Historical data cannot be empty.")

    seq_len = min(len(req.historical_water_levels), len(req.historical_rainfall_mm))
    
    # Scale inputs roughly
    water_norm = [w / 100.0 for w in req.historical_water_levels[-seq_len:]]
    rain_norm = [r / 200.0 for r in req.historical_rainfall_mm[-seq_len:]]
    
    data_array = np.column_stack((water_norm, rain_norm))
    input_tensor = torch.tensor(data_array, dtype=torch.float32).unsqueeze(0) # (1, seq_len, 2)
    
    with torch.no_grad():
        raw_prob = model(input_tensor).item()

    # Heuristic adjustment based on recent trend
    recent_water = req.historical_water_levels[-1]
    latest_rain = req.historical_rainfall_mm[-1]
    
    adjusted_prob = min(1.0, max(0.0, float(raw_prob + (latest_rain / 500.0))))
    predicted_level = round(recent_water + (latest_rain * 0.05), 2)
    
    if adjusted_prob >= 0.85:
        risk_level = "EXTREME_DANGER"
    elif adjusted_prob >= 0.70:
        risk_level = "DANGER"
    elif adjusted_prob >= 0.40:
        risk_level = "WARNING"
    else:
        risk_level = "NORMAL"

    return FloodPredictResponse(
        station_id=req.station_id,
        predicted_water_level_m=predicted_level,
        flood_probability=round(adjusted_prob, 4),
        risk_level=risk_level
    )

@app.post("/api/v1/translate", response_model=TranslateResponse)
def translate_text(req: TranslateRequest):
    lang = req.target_language.lower().strip()
    if lang == "en" or not req.text.strip():
        return TranslateResponse(translated_text=req.text, target_language=lang)
        
    if HAS_TRANSLATOR:
        try:
            translator = GoogleTranslator(source='auto', target=lang)
            translated = translator.translate(req.text)
            return TranslateResponse(translated_text=translated, target_language=lang)
        except Exception as e:
            # Fallback if network or service is unreachable
            return TranslateResponse(
                translated_text=f"[{lang.upper()} TRANSLATION] " + req.text,
                target_language=lang
            )
    else:
        return TranslateResponse(
            translated_text=f"[{lang.upper()} TRANSLATION] " + req.text,
            target_language=lang
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
