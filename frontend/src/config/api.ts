// API configuration
// When running locally, point to the deployed backend
const API_URL = import.meta.env.VITE_API_URL || 'https://citeai-back.vercel.app';

// API endpoints
export const ENDPOINTS = {
  // Ensure we don't have double slashes by removing trailing slash from API_URL if it exists
  GENERATE_PAPER: `${API_URL.replace(/\/$/, '')}/api/create-content`,
  STATUS: `${API_URL.replace(/\/$/, '')}/api/status`
};

export default API_URL; 