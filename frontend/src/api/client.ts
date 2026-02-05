import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.error || error.message || "Something went wrong";
        
        // Handle 401 Unauthorized - clear token and redirect to login
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            // You can dispatch an event or use a global state to trigger logout
            window.dispatchEvent(new Event('unauthorized'));
        }
        
        return Promise.reject(new Error(message));
    }
);

export default api;
