import axios from 'axios';

// Base API configuration
const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - attach token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/signin';
        }
        return Promise.reject(error);
    }
);

// ============= AUTH APIs =============
export const authAPI = {
    signup: async (userData) => {
        try {
            const response = await API.post('/auth/signup', userData);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Signup failed' 
            };
        }
    },

    signin: async (credentials) => {
        try {
            const response = await API.post('/auth/signin', credentials);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Login failed' 
            };
        }
    }
};

// ============= MEDICAL HISTORY APIs =============
export const medicalAPI = {
    saveMedicalHistory: async (data) => {
        try {
            const response = await API.post('/medical/medical-history', data);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Failed to save medical history' 
            };
        }
    },

    getMedicalHistory: async (userId) => {
        try {
            const response = await API.get(`/medical/medical-history/${userId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Failed to fetch medical history' 
            };
        }
    }
};

// ============= CHAT APIs =============
export const chatAPI = {
    startSession: async (userId) => {
        try {
            const response = await API.post('/chat/start', { user_id: userId });
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Failed to start chat' 
            };
        }
    },

    sendMessage: async (messageData) => {
        try {
            const response = await API.post('/chat/message', messageData);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Failed to send message' 
            };
        }
    }
};

// Health check
export const checkHealth = async () => {
    try {
        const response = await API.get('/health');
        return response.data;
    } catch (error) {
        return { status: 'error', message: error.message };
    }
};

export default API;