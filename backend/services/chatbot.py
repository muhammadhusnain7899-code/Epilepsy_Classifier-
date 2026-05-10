"""
Medical Chatbot Service - Uses Groq API (FREE) with Llama 3 for epilepsy-related conversations.
Groq offers free API access with generous rate limits.
"""
import logging
from groq import Groq
from config import GROQ_API_KEY

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful, friendly, and medically-aware epilepsy assistant inside a healthcare application.

Your role is to:
- Answer questions about epilepsy, seizure types, and EEG concepts
- Explain medical terms in simple, understandable language
- Provide general educational information about seizure management
- Be supportive and empathetic to users dealing with epilepsy
- Explain what different seizure classifications mean

Important guidelines:
- NEVER provide specific medical diagnoses or treatment recommendations
- NEVER claim to replace neurologists, doctors, or medical professionals
- ALWAYS encourage users to seek professional medical help for diagnosis and emergencies
- If someone describes an active medical emergency, tell them to call emergency services immediately
- Be honest about the limitations of AI-based assistance
- Keep responses concise but informative (2-3 paragraphs max)

You can explain:
- What different seizure types are (Tonic, Clonic, Tonic-Clonic, Absence, Atonic)
- What EEG readings show and how they're interpreted
- General information about epilepsy medications and lifestyle management
- What to do during and after a seizure
- How the app's AI classification system works (CNN+LSTM model analyzing EEG patterns)

Remember: You are an educational assistant, not a replacement for medical care."""

_client = None


def _init_client():
    """Initialize Groq client."""
    global _client
    if _client is None and GROQ_API_KEY and GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE":
        try:
            _client = Groq(api_key=GROQ_API_KEY)
            logger.info("Groq client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}")
            _client = None
    return _client


def get_chat_response(user_message: str) -> dict:
    """
    Get a response from the medical chatbot using Groq (FREE).
    Uses Llama 3 model for fast, high-quality responses.
    """
    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_GROQ_API_KEY_HERE":
        return {
            "reply": "The chatbot is not configured. Please add your free Groq API key. Get one at: https://console.groq.com/keys",
            "error": "API key not configured"
        }
    
    try:
        client = _init_client()
        if client is None:
            return {
                "reply": "Unable to initialize the AI assistant. Please check your API key.",
                "error": "Client initialization failed"
            }
        
        # Use Groq's Llama 3 model (fast and free)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            model="llama-3.3-70b-versatile",  # Free, fast, high-quality
            temperature=0.7,
            max_tokens=500,
        )
        
        if chat_completion and chat_completion.choices:
            response_text = chat_completion.choices[0].message.content
            logger.info("Chat response generated successfully via Groq")
            return {"reply": response_text.strip()}
        else:
            return {
                "reply": "I couldn't generate a response. Please try again.",
                "error": "Empty response"
            }
            
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Groq chat error: {error_msg}")
        
        if "API_KEY" in error_msg.upper() or "AUTHENTICATION" in error_msg.upper() or "INVALID" in error_msg.upper():
            return {
                "reply": "Invalid API key. Please get a free key at: https://console.groq.com/keys",
                "error": f"Authentication error: {error_msg}"
            }
        
        if "RATE" in error_msg.upper() or "LIMIT" in error_msg.upper():
            return {
                "reply": "Too many requests. Please wait a moment and try again.",
                "error": f"Rate limit: {error_msg}"
            }
        
        return {
            "reply": "I encountered an error. Please try again.",
            "error": error_msg
        }
