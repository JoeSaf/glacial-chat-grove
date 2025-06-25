# api.py

import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, Field, validator
import joblib
from text_processing import preprocess_text
import logging
from typing import Dict, Any, Union, Literal, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load the self-contained model
try:
    model = joblib.load('scam_detector_model.pkl')
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise

# Define frontend directory
FRONTEND_DIR = Path(__file__).parent / "frontend"

# Create FastAPI app
app = FastAPI(
    title="Scam Filter Project",
    description="Scam detection system with integrated frontend and API",
    version="1.0.0"
)

# Create API router with prefix
api_router = APIRouter(prefix="/api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class Message(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="The text to check for scams")
    
    @validator('text')
    def text_must_not_be_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Text cannot be empty or just whitespace')
        return v

class PredictionResponse(BaseModel):
    """Response model for prediction endpoint."""
    prediction: bool = Field(..., description="True if the text is classified as a scam, false otherwise")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the prediction (0-1)")

async def validate_input(message: Message) -> Message:
    """Dependency to validate the input text."""
    return message

@api_router.post("/predict", response_model=PredictionResponse)
async def predict(message: Message = Depends(validate_input)) -> PredictionResponse:
    """
    Predict if the provided text is a scam.
    
    - **text**: The text message to analyze
    
    Returns:
    - prediction: Boolean indicating if the message is a scam (true) or legitimate (false)
    - confidence: A value between 0 and 1 indicating prediction confidence
    """
    try:
        # Log the request (without sensitive info)
        logger.info(f"Processing prediction request with text length: {len(message.text)}")
        
        # 1) Preprocess the incoming text:
        clean = preprocess_text(message.text)
        
        # 2) Predict:
        prediction_result = model.predict([clean])[0]
        
        # Standardize the prediction result to a boolean
        # Handle different possible result formats (string, int, bool)
        is_scam = False
        
        if isinstance(prediction_result, str):
            is_scam = prediction_result.lower() in ('spam', 'scam', 'true', '1', 'yes')
        elif isinstance(prediction_result, (int, bool)):
            is_scam = bool(prediction_result)
        else:
            # Handle any unexpected types
            is_scam = bool(prediction_result)
        
        # Extract confidence if available (set to 1.0 if not)
        # Note: This assumes your model returns probabilities. If not, you can remove this part.
        confidence = 1.0
        try:
            if hasattr(model, 'predict_proba'):
                probabilities = model.predict_proba([clean])[0]
                # Typically the second probability is for the positive class (scam)
                confidence = float(probabilities[1] if is_scam else probabilities[0])
        except:
            # If there's any issue getting probabilities, use a default confidence
            pass
        
        # Log the result
        logger.info(f"Prediction result: scam={is_scam}, confidence={confidence:.2f}")
        
        return PredictionResponse(prediction=is_scam, confidence=confidence)
    except Exception as e:
        logger.error(f"Error processing prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing your request: {str(e)}")

@api_router.get("/")
def read_api_root():
    """API root endpoint that provides basic API information."""
    return {
        "message": "Welcome to the Scam Filter API 👋. Visit /api/docs to test or POST to /api/predict.",
        "status": "online",
        "version": "1.0.0"
    }

@api_router.get("/health")
def health_check():
    """Health check endpoint to verify API is functioning."""
    try:
        # Test the model with a simple prediction
        test_prediction = model.predict([preprocess_text("Test message")])
        return {"status": "healthy", "model_loaded": True}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"API is unhealthy: {str(e)}")

# Root redirect to frontend
@app.get("/")
async def root():
    """Redirect root to the frontend index.html"""
    return RedirectResponse(url="/index.html")

# Include API router
app.include_router(api_router)

# Mount the static files directory
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
