// API configuration
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5173';

// OpenRouter API configuration
export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export default BASE_URL;