import { handleLLMRequest } from './_lib/llm-gateway.js';

// Each call is one paper section or one short analysis; streaming keeps the connection alive
export const config = {
    maxDuration: 60,
};

export default {
    fetch(request: Request) {
        return handleLLMRequest(request, process.env);
    },
};
