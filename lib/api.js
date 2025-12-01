import axios from "axios";
import { API_CONFIG, ERROR_MESSAGES } from "@/constants";
import { logger } from "@/utils/logger";

// Request deduplication map to prevent duplicate requests
const pendingRequests = new Map();

// Create axios instance with default config
const api = axios.create({
  baseURL: "/api",
  timeout: API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor with deduplication
api.interceptors.request.use(
  (config) => {
    // Add auth tokens here if needed
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Request deduplication - prevent duplicate requests
    const requestKey = `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params || {})}`;
    if (pendingRequests.has(requestKey)) {
      // Return existing request promise
      return pendingRequests.get(requestKey);
    }
    
    // Create new request promise
    const requestPromise = Promise.resolve(config);
    pendingRequests.set(requestKey, requestPromise);
    
    // Clean up after request completes (in response interceptor)
    requestPromise.finally(() => {
      // Small delay to allow response interceptor to run
      setTimeout(() => pendingRequests.delete(requestKey), 100);
    });
    
    return config;
  },
  (error) => {
    logger.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with improved error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorMessage =
      error.response?.data?.message || error.message || ERROR_MESSAGES.API_ERROR;
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const isStudentAuth = error.config?.url?.includes("/student/auth");
        const isStudentPage = currentPath.includes("/login") || currentPath.includes("/register");
        const isAdminPage = currentPath.includes("/admin");
        
        // Only handle admin token removal and redirect
        if (isAdminPage && !isStudentPage) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Only redirect if not already on admin login/register page
          if (!currentPath.includes("/admin/login") && !currentPath.includes("/admin/register")) {
            window.location.href = "/admin/login";
          }
        }
        // For student auth errors, don't redirect - let the component handle it
        // Don't remove student_token here, let the login component handle it
      }
    } else if (error.response?.status === 403) {
      // Handle forbidden - use logger instead of console
      logger.warn("Access forbidden:", errorMessage);
    } else if (error.response?.status === 500) {
      logger.error("Server error:", errorMessage);
    } else if (error.code === "ECONNABORTED") {
      logger.error("Request timeout");
      return Promise.reject(new Error(ERROR_MESSAGES.TIMEOUT_ERROR));
    } else if (!error.response) {
      // Only log network errors when there's truly no response (actual network issue)
      logger.error("Network error:", error.message || "No response from server");
      return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
    }
    
    // For errors with response (400, 404, etc.), pass through the original error
    // so calling code can handle them appropriately
    return Promise.reject(error);
  }
);

export default api;

