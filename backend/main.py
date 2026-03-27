from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
app = FastAPI(
    title="SignBridge API",
    version="0.2.0",
    description="Backend health and starter inference endpoints for SignBridge.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignPrediction(BaseModel):
    sign: str
    confidence: float


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "SignBridge API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "checked_at": datetime.now(timezone.utc).isoformat()}


@app.get("/ready")
def readiness() -> dict[str, str]:
    return {"ready": "true"}


@app.post("/predict", response_model=SignPrediction)
def predict() -> SignPrediction:
    """Placeholder endpoint for future model inference.

    Replace this with a model call once you've trained your SASL classifier.
    """
    return SignPrediction(sign="hello", confidence=0.75)
