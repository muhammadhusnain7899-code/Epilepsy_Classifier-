from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from typing import Optional, List
from datetime import datetime

# --- USER SCHEMAS ---

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    
    # Pydantic V2 style config (Replaces class Config)
    model_config = ConfigDict(from_attributes=True)

# --- EEG ANALYSIS SCHEMAS ---

class AnalysisResponse(BaseModel):
    id: UUID
    file_name: str
    classification_result: str
    confidence_score: float
    # Matches the PostgreSQL DateTime column
    created_at: Optional[datetime] = None 

    model_config = ConfigDict(from_attributes=True)

# --- DIARY SCHEMAS ---

class DiaryEntryCreate(BaseModel):
    """What the app sends to the server (Incoming)"""
    type: str
    title: str
    description: str
    date: str
    time: str

class DiaryEntry(DiaryEntryCreate):
    """What the server sends back to the app (Outgoing)"""
    id: UUID
    # user_id is included here but usually hidden from the UI
    user_id: UUID 
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)