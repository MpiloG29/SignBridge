from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="SignBridge API", version="0.1.0")


class SignPrediction(BaseModel):
    sign: str
    confidence: float


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict", response_model=SignPrediction)
def predict() -> SignPrediction:
    """Placeholder endpoint for future model inference.

    Replace this with a model call once you've trained your SASL classifier.
    """
    return SignPrediction(sign="hello", confidence=0.75)
