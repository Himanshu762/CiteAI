// API configuration
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5173';

// Gemini API configuration
// Using the most recent stable model that's widely available
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Keep OpenRouter config for backward compatibility
export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export default BASE_URL;