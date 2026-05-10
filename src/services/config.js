// Backend API Configuration
// Change this IP to match your computer's local IPv4 address
export const API_URL = "http://10.218.115.141:8000"; 

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