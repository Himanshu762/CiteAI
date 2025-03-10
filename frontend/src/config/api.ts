// API configuration
// When running locally, point to the deployed backend instead of localhost
const API_URL = import.meta.env.VITE_API_URL || 'https://citeai-back.vercel.app';

// API endpoints
export const ENDPOINTS = {
  GENERATE_PAPER: `${API_URL}/api/create-content`,
  STATUS: `${API_URL}/api/status`
};

export default API_URL; 