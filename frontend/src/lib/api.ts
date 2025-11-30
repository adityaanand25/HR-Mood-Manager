import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// Helpful during dev to verify target server in console
if (typeof window !== 'undefined') {
  // Only log once per session
  (window as any).__API_BASE_URL_LOGGED__ || console.log('[API] Base URL:', API_BASE_URL);
  (window as any).__API_BASE_URL_LOGGED__ = true;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for emotion detection
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - backend may be down');
    }
    return Promise.reject(error);
  }
);

// User Management
export interface User {
  user_id: string;
  role: 'employee' | 'hr';
  full_name: string;
  email: string;
  department: string;
}

export interface LoginRequest {
  user_id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  message: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/api/login', credentials);
    return response.data;
  },

  register: async (userData: any) => { // Using 'any' for now, can be typed later
    const response = await api.post('/api/register', userData);
    return response.data;
  },

  getUsers: async (role?: string) => {
    const response = await api.get(`/api/users${role ? `?role=${role}` : ''}`);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  }
};

// Emotion Detection
export interface EmotionDetectionRequest {
  image: string; // base64 encoded
  user_id?: string;
}

export interface EmotionDetectionResponse {
  emotion: string;
  confidence: number;
  all_predictions: Record<string, number>;
  face_detected: boolean;
  face_location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  saved_to_db: boolean;
}

export const emotionApi = {
  detectEmotion: async (data: EmotionDetectionRequest): Promise<EmotionDetectionResponse> => {
    try {
      console.log('Making emotion detection API call to:', `${API_BASE_URL}/api/detect-emotion`);
      console.log('Request data:', { 
        imageLength: data.image?.length, 
        user_id: data.user_id 
      });
      
      const response = await api.post('/api/detect-emotion', data, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('API response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Emotion detection API error:', error);
      
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to backend server. Please ensure the server is running on http://localhost:8000');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Request timeout - the server took too long to respond');
      } else if (error.response?.status === 503) {
        throw new Error('Emotion detection model is not loaded on the server');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error(error.message || 'Failed to detect emotion');
      }
    }
  },

  detectEmotionFromFile: async (file: File): Promise<EmotionDetectionResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/detect-emotion-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Mood Records
export interface MoodRecord {
  id: number;
  user_id: string;
  emotion: string;
  confidence: number;
  detection_method: string;
  notes?: string;
  timestamp: string;
  full_name: string;
  department: string;
}

export interface MoodRecordRequest {
  user_id: string;
  emotion: string;
  confidence: number;
  detection_method?: string;
  notes?: string;
}

export const moodApi = {
  saveMoodRecord: async (data: MoodRecordRequest) => {
    const response = await api.post('/api/mood-record', data);
    return response.data;
  },

  getMoodRecords: async (user_id?: string, limit: number = 100) => {
    const params = new URLSearchParams();
    if (user_id) params.append('user_id', user_id);
    params.append('limit', limit.toString());
    
    const response = await api.get(`/api/mood-records?${params}`);
    return response.data;
  },

  getMoodStatistics: async (user_id?: string) => {
    const params = new URLSearchParams();
    if (user_id) params.append('user_id', user_id);
    
    const response = await api.get(`/api/mood-statistics?${params}`);
    return response.data;
  }
};

// Mood History (Manual entries)
export interface MoodHistoryEntry {
  id: number;
  user_id: string;
  mood: string;
  intensity: number;
  notes?: string;
  timestamp: string;
  full_name: string;
  department: string;
}

export interface MoodHistoryRequest {
  user_id: string;
  mood: string;
  intensity: number;
  notes?: string;
}

export const historyApi = {
  saveMoodHistory: async (data: MoodHistoryRequest) => {
    const response = await api.post('/api/mood-history', data);
    return response.data;
  },

  getMoodHistory: async (user_id?: string, limit: number = 100) => {
    const params = new URLSearchParams();
    if (user_id) params.append('user_id', user_id);
    params.append('limit', limit.toString());
    
    const response = await api.get(`/api/mood-history?${params}`);
    return response.data;
  }
};

// Health Check
export const healthApi = {
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

// Task Management
export interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to: string;
  assigned_by: string;
  assigned_to_name: string;
  assigned_by_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  assigned_to: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface TaskUpdateRequest {
  task_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export const taskApi = {
  createTask: async (taskData: TaskCreateRequest) => {
    const response = await api.post('/api/tasks', taskData);
    return response.data;
  },

  getTasks: async (filters?: { user_id?: string; status?: string; assigned_by?: string }) => {
    const params = new URLSearchParams();
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigned_by) params.append('assigned_by', filters.assigned_by);
    
    const response = await api.get(`/api/tasks${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
  },

  updateTaskStatus: async (taskId: number, status: string) => {
    const response = await api.put(`/api/tasks/${taskId}/status`, { 
      task_id: taskId, 
      status 
    });
    return response.data;
  },

  deleteTask: async (taskId: number) => {
    const response = await api.delete(`/api/tasks/${taskId}`);
    return response.data;
  },

  getTaskStatistics: async (userId?: string) => {
    const params = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/api/tasks/statistics${params}`);
    return response.data;
  }
};

// RAG Emotion Insights
export interface RAGQueryRequest {
  question: string;
  user_id?: string;
}

export interface RAGQueryResponse {
  success: boolean;
  question: string;
  answer: string;
}

export interface RAGInsightsResponse {
  success: boolean;
  insights: string;
  user_id?: string;
}

export const ragApi = {
  queryInsights: async (data: RAGQueryRequest): Promise<RAGQueryResponse> => {
    const response = await api.post('/api/emotion-insights/query', data);
    return response.data;
  },

  getAutoInsights: async (userId?: string): Promise<RAGInsightsResponse> => {
    const params = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/api/emotion-insights/auto-insights${params}`);
    return response.data;
  },

  rebuildDatabase: async () => {
    const response = await api.post('/api/emotion-insights/rebuild');
    return response.data;
  }
};

export default api;