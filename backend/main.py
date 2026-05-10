from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import shutil
import os
import uuid
import datetime
import logging

# Internal project imports
import models
import database
import schemas
import auth
from config import MODEL_PATH, TEMP_DIR, UPLOAD_DIR
from ml.inference import load_model
from services.analyzer import analyze_edf_file
from services.chatbot import get_chat_response

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- LIFESPAN: Load model at startup ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML model at startup, cleanup at shutdown."""
    logger.info("Starting up - Loading CNN+LSTM model...")
    try:
        load_model(MODEL_PATH)
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise
    
    yield
    
    logger.info("Shutting down...")


# 1. Initialize Database Tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Epilepsy Classifier API", lifespan=lifespan)

# 2. Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Setup File Storage
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)


# --- SCHEMAS ---
class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


# --- HELPER: GET CURRENT USER ---
def get_current_user(db: Session = Depends(database.get_db), token: str = Depends(auth.oauth2_scheme)):
    return auth.get_current_user(db, token)


# --- AUTHENTICATION ENDPOINTS ---

@app.post("/auth/register")
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pass = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email, 
        hashed_password=hashed_pass, 
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    
    return {
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "full_name": new_user.full_name
        },
        "token": access_token
    }


@app.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    access_token = auth.create_access_token(data={"sub": db_user.email})

    return {
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name
        },
        "token": access_token
    }


# --- EEG ANALYSIS ENDPOINTS ---

@app.post("/eeg/upload")
async def upload_eeg(
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload and analyze an EDF file.
    Returns seizure classification result using CNN+LSTM model.
    """
    # Validate file extension
    if not file.filename.lower().endswith(('.edf', '.csv')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Please upload an EDF or CSV file."
        )
    
    # Save to temp directory for processing
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(TEMP_DIR, temp_filename)
    
    try:
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Processing file: {file.filename}")
        
        # Run analysis pipeline (preprocess -> inference -> majority voting)
        if file.filename.lower().endswith('.edf'):
            analysis_result = analyze_edf_file(temp_path)
        else:
            # For non-EDF files, return a placeholder
            analysis_result = {
                "success": False,
                "error": "Only EDF files are supported for AI analysis",
                "result": None
            }
        
        if not analysis_result["success"]:
            raise HTTPException(
                status_code=422,
                detail=analysis_result.get("error", "Analysis failed")
            )
        
        classification_result = analysis_result["result"]
        confidence_score = analysis_result.get("confidence", 0.0)
        
        # Save to permanent storage
        permanent_filename = f"{uuid.uuid4()}_{file.filename}"
        permanent_path = os.path.join(UPLOAD_DIR, permanent_filename)
        shutil.copy(temp_path, permanent_path)
        
        # Save to database
        new_record = models.EEGAnalysis(
            file_name=file.filename,
            file_path=permanent_path,
            classification_result=classification_result,
            confidence_score=confidence_score,
            user_id=current_user.id
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        logger.info(f"Analysis complete: {classification_result} ({confidence_score}%)")
        
        return {
            "id": new_record.id,
            "type": classification_result,
            "confidence": confidence_score,
            "fileName": file.filename,
            "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            "windows_analyzed": analysis_result.get("windows_analyzed", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/history", response_model=List[schemas.AnalysisResponse])
def get_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetch analysis history for the logged-in user."""
    return db.query(models.EEGAnalysis).filter(
        models.EEGAnalysis.user_id == current_user.id
    ).order_by(models.EEGAnalysis.created_at.desc()).all()


# --- CHATBOT ENDPOINT ---

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Medical assistant chatbot for epilepsy-related questions.
    Uses Gemini API with medical safety guidelines.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    response = get_chat_response(request.message.strip())
    
    return ChatResponse(reply=response["reply"])


# --- DIARY ENDPOINTS ---

@app.post("/diary")
def create_diary_entry(
    entry: schemas.DiaryEntryCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Saves a new diary entry specifically for the current user."""
    new_entry = models.DiaryEntry(
        type=entry.type,
        title=entry.title,
        description=entry.description,
        date=entry.date,
        time=entry.time,
        user_id=current_user.id
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@app.get("/diary")
def get_diary_entries(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetches diary entries ONLY for the logged-in user."""
    return db.query(models.DiaryEntry).filter(
        models.DiaryEntry.user_id == current_user.id
    ).order_by(models.DiaryEntry.date.desc()).all()


# --- HEALTH CHECK ---

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "model_loaded": True}
