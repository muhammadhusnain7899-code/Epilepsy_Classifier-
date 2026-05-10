from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Relationships: This allows a user to "own" their data
    analyses = relationship("EEGAnalysis", back_populates="owner")
    diary_entries = relationship("DiaryEntry", back_populates="owner")

class EEGAnalysis(Base):
    __tablename__ = "eeg_analyses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Linked to User ID
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    classification_result = Column(String) 
    confidence_score = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Back-reference to User
    owner = relationship("User", back_populates="analyses")

class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # CRITICAL FIX: Added user_id to prevent old user data from appearing
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    type = Column(String) # seizure, medication, etc.
    title = Column(String)
    description = Column(String)
    date = Column(String)
    time = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Back-reference to User
    owner = relationship("User", back_populates="diary_entries")