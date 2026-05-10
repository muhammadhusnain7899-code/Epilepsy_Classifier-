// Backend API Configuration
// For local development, use your computer's IP address
// For production, use the Hugging Face Spaces URL

const DEV_URL = "http://10.218.115.141:8000";
const PROD_URL = "https://husnain7899-epilepsy-classifier-api.hf.space";

// Set to true for production build
const IS_PRODUCTION = true;

export const API_URL = IS_PRODUCTION ? PROD_URL : DEV_URL; 

export const API_ENDPOINTS = {
  BASE_URL: API_URL,
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  UPLOAD: `${API_URL}/eeg/upload`,
  HISTORY: `${API_URL}/history`,
  CHAT: `${API_URL}/chat`,
  DIARY: `${API_URL}/diary`,
  HEALTH: `${API_URL}/health`,
};