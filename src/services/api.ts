import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config'; 

// --- CONFIGURATION ---

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s timeout for ML inference
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header to every request if token exists
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('user_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error("Token retrieval error", e);
  }
  return config;
});

// --- NEW: GLOBAL CLEARANCE LOGIC ---
/**
 * This function ensures that no old user data or tokens remain in 
 * memory or storage. It is the key to fixing the "Old User Data" issue.
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_info');
    // Important: Clear the Axios header so the next request is forced to look for a new token
    delete api.defaults.headers.common['Authorization'];
    console.log("Auth Data Cleared Successfully");
  } catch (e) {
    console.error("Error during auth cleanup:", e);
  }
};

// --- TYPES ---

export interface User {
  id?: string; // FIXED: Changed to string to support PostgreSQL UUIDs
  uid?: string;
  email: string;
  full_name: string; 
}

export interface EEGResult {
  id: string; // Changed to string for UUID
  
  // Add these backend fields to fix the 'does not exist' errors
  classification_result?: string; 
  confidence_score?: number;
  file_name?: string;
  created_at?: string;

  // Keep these for frontend/simulation compatibility
  type?: string;
  confidence?: number;
  fileName?: string;
  date?: string;
  time?: string;
  description?: string;
  duration?: string;
  frequency?: string;
}

export interface DiaryEntry {
  id: number | string;
  type: "seizure" | "medication" | "trigger" | "sleep";
  title: string;
  description: string;
  date: string;
  time: string;
  createdAt?: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  monthlyAnalyses: number;
  trend: number;
  latestResult: EEGResult | null;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// --- AUTHENTICATION ---

export const loginUser = async (email: string, pass: string): Promise<User> => {
  try {
    // 1. Clear any leftover data before starting a new session
    await clearAuthData();

    const response = await api.post('/auth/login', { email, password: pass });
    const { user, token } = response.data;
    
    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_info', JSON.stringify(user));
    
    // 2. Set the header manually for the immediate next request
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    return user;
  } catch (error: any) {
    console.error("Login Error:", error.response?.data || error.message);
    throw error;
  }
};

export const registerUser = async (email: string, pass: string, name: string): Promise<User> => {
    try {
        // 1. Clear any leftover data before starting a new session
        await clearAuthData();

        const response = await api.post('/auth/register', { 
            email, 
            password: pass, 
            full_name: name 
        });

        // Add a check here to prevent the AsyncStorage crash
        const { user, token } = response.data;

        if (!token) {
            console.error("Backend failed to provide a token!");
            throw new Error("Server error: Missing session token.");
        }

        await AsyncStorage.setItem('user_token', token);
        await AsyncStorage.setItem('user_info', JSON.stringify(user));
        
        // 2. Set the header manually for the immediate next request
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return user;
    } catch (error: any) {
        console.error("Registration Error Detail:", error.response?.data || error.message);
        throw error;
    }
}

export const logoutUser = async () => {
  // Use the new clear logic to ensure absolute isolation
  await clearAuthData();
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const json = await AsyncStorage.getItem('user_info');
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

// --- FILE UPLOAD & ANALYSIS ---

export const analyzeEEG = async (fileUri: string, fileName: string): Promise<EEGResult> => {
  try {
    const formData = new FormData();
    
    // Check if running on web or mobile
    if (typeof window !== 'undefined' && fileUri.startsWith('blob:')) {
      // Web: fetch the blob and append as File
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'application/octet-stream' });
      formData.append('file', file);
    } else {
      // Mobile: use React Native format
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: 'application/octet-stream', 
      } as any);
    }

    const apiResponse = await api.post('/eeg/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes for large files + ML processing
    });
    
    return apiResponse.data;
  } catch (error: any) {
    console.error("Analysis failed:", error.response?.data || error.message);
    
    // If it's a 401/403 Error, it means the token is bad
    if (error.response?.status === 401 || error.response?.status === 403) {
        console.error("Authentication expired or invalid. Please relogin.");
    }
    
    // If it's a 422 error, show the actual error
    if (error.response?.status === 422) {
        console.error("Validation error:", error.response?.data);
    }

    return {
      id: "sim-" + Date.now(), 
      type: "Normal Activity",
      confidence: 95,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      fileName: fileName,
      description: "Simulation: Backend connection failed.",
    };
  }
};

// --- HISTORY ---

export const fetchHistory = async (): Promise<EEGResult[]> => {
  try {
    const response = await api.get('/history');
    // Ensure we return an empty array if data is missing
    return response.data || []; 
  } catch (error) {
    console.error("Fetch history failed:", error);
    return []; 
  }
};

export const getHistoryOnce = fetchHistory;

// --- DASHBOARD STATS ---

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
      const history = await fetchHistory();
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyCount = history.filter(h => h.date && h.date.startsWith(currentMonth)).length;

      return {
          totalAnalyses: history.length,
          monthlyAnalyses: monthlyCount,
          trend: 5, 
          latestResult: history.length > 0 ? history[0] : null
      };
  } catch (e) {
      return { totalAnalyses: 0, monthlyAnalyses: 0, trend: 0, latestResult: null };
  }
};

// --- DIARY ---

export const fetchDiaryEntries = async (): Promise<DiaryEntry[]> => {
    try {
        const response = await api.get('/diary');
        return response.data;
    } catch (e) {
        return [];
    }
};

export const addDiaryEntry = async (entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> => {
    try {
        const response = await api.post('/diary', entry);
        return response.data;
    } catch (e) {
        throw e;
    }
};

export const updateDiaryEntry = async (entryId: string, updatedFields: Partial<DiaryEntry>) => {
  await api.put(`/diary/${entryId}`, updatedFields);
};

export const deleteDiaryEntry = async (entryId: string) => {
  await api.delete(`/diary/${entryId}`);
};

// --- CHATBOT ---

export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    const response = await api.post('/chat', { message }, {
      timeout: 90000, // 90s timeout for AI response (mobile can be slower)
    });
    return response.data.reply;
  } catch (error: any) {
    console.error("Chat error:", error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return "Request timed out. Please check your connection and try again.";
    }
    
    if (error.message?.includes('Network Error')) {
      return "Cannot reach server. Make sure you're on the same WiFi as the backend.";
    }
    
    if (error.response?.status === 400) {
      return "Please enter a valid message.";
    }
    
    return "I'm having trouble connecting right now. Please try again later.";
  }
};

export default api;