// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API endpoints
export const ENDPOINTS = {
  GENERATE_PAPER: `${API_URL}/generate-paper`,
  // Add other endpoints as needed
};

export default API_URL; 