import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import database
import models

# --- CONFIGURATION ---
# SECRET_KEY is used to sign the tokens. Keep this private.
SECRET_KEY = "YOUR_SUPER_SECRET_RANDOM_KEY_CHANGE_THIS" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # Token valid for 24 hours

# Tells FastAPI how to extract the token from the "Authorization" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- 1. PASSWORD HASHING (Using bcrypt directly for Python 3.14 compatibility) ---

def get_password_hash(password: str) -> str:
    """Converts plain password to a secure hash."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the typed password matches the hash in PostgreSQL."""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

# --- 2. JWT TOKEN GENERATION ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Generates an encrypted JWT token. 
    This is what the app saves in AsyncStorage.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- 3. TOKEN VALIDATION (Fixes Data Leak) ---

def get_current_user(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    """
    Decodes the token, verifies the user email, and returns the User object.
    This is the "Security Guard" that keeps User A's data away from User B.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token using the secret key
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Check the database for this specific user email
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user