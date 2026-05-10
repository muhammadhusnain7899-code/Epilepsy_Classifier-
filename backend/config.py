import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model_final.keras')
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'storage')
TEMP_DIR = os.path.join(os.path.dirname(__file__), 'temp')

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
