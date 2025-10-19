// API Configuration
// Automatically detects if running on device vs simulator/web

import { Platform } from "react-native";
import { DEV_CONFIG } from "./development";

// Get the correct API base URL based on environment
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === "web") {
      // Web browser - use localhost
      return `http://localhost:${DEV_CONFIG.BACKEND_PORT}`;
    } else {
      // Mobile device - use your computer's IP
      return `http://${DEV_CONFIG.COMPUTER_IP}:${DEV_CONFIG.BACKEND_PORT}`;
    }
  } else {
    // Production mode - use your deployed backend URL
    return "https://your-production-api.com";
  }
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  USER_INFO: `${API_BASE_URL}/user/info`,
  SWITCH_ROLE: `${API_BASE_URL}/user/switch-role`,
} as const;
