import axios from 'axios';

// Ensure this matches your backend server's address and port
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth-related API helpers used by SignUp / SignIn flows
export const authAPI = {
    signup: async (payload) => {
        try {
            const response = await api.post('/auth/register', payload);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                'Failed to create account. Please try again.';

            return {
                success: false,
                error: message,
            };
        }
    },

    login: async (payload) => {
        try {
            const response = await api.post('/auth/login', payload);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                'Failed to sign in. Please check your credentials.';

            return {
                success: false,
                error: message,
            };
        }
    },

    me: async () => {
        try {
            const response = await api.get('/auth/me');
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                'Failed to fetch profile.';

            return {
                success: false,
                error: message,
            };
        }
    },
};

// Medical history API helpers
export const historyAPI = {
    save: async (payload) => {
        try {
            const response = await api.post('/history/save', payload);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                'Failed to save medical history.';

            return {
                success: false,
                error: message,
            };
        }
    },

    get: async () => {
        try {
            const response = await api.get('/history/get');
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                'Failed to fetch medical history.';

            return {
                success: false,
                error: message,
            };
        }
    },
};

// Chat API helpers for AI assistant
export const chatAPI = {
    // Start a new chat session with initial free-text symptoms
    start: async (rawSymptoms) => {
        try {
            const response = await api.post('/chat/start', { raw_symptoms: rawSymptoms });
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                'Failed to start chat session.';

            return {
                success: false,
                error: message,
            };
        }
    },

    // Continue an existing chat session by answering a follow-up question
    continue: async ({ session_id, symptom_token, has_symptom, severity }) => {
        try {
            const response = await api.post('/chat/continue', {
                session_id,
                symptom_token,
                has_symptom,
                severity,
            });
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                'Failed to continue chat session.';

            return {
                success: false,
                error: message,
            };
        }
    },

    // (Optional) Fetch recent chat sessions for history view
    getSessions: async () => {
        try {
            const response = await api.get('/chat/sessions');
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                'Failed to fetch chat sessions.';

            return {
                success: false,
                error: message,
            };
        }
    },
};

export default api;