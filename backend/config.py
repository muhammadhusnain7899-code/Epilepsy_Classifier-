import os
from dotenv import load_dotenv

# Load .env.local for local development (ignored in production)
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)

# API Keys (from environment variables - works on HF Spaces)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Paths
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, 'model_final.keras')

# Fallback to model.keras directory if model_final.keras doesn't exist
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(BASE_DIR, 'model.keras')

UPLOAD_DIR = os.path.join(BASE_DIR, 'storage')
TEMP_DIR = os.path.join(BASE_DIR, 'temp')

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
