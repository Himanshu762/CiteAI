import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleLLMRequest, Env } from './llm-gateway.js';

async function toWebRequest(req: IncomingMessage): Promise<Request> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') headers.set(key, value);
        else if (Array.isArray(value)) headers.set(key, value.join(', '));
    }

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    return new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
        signal: controller.signal,
    });
}

async function sendWebResponse(response: Response, res: ServerResponse): Promise<void> {
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (!response.body) {
        res.end();
        return;
    }
    const reader = response.body.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
    } finally {
        res.end();
    }
}

/**
 * Serves the same /api/llm handler as the Vercel function during `npm run dev`,
 * so local development needs no extra tooling.
 */
export function devApiPlugin(env: Env): Plugin {
    return {
        name: 'citeai-dev-api',
        configureServer(server) {
            server.middlewares.use('/api/llm', async (req, res) => {
                try {
                    // Connect strips the mount path; restore it for the handler
                    req.url = '/api/llm' + (req.url === '/' ? '' : req.url);
                    await sendWebResponse(await handleLLMRequest(await toWebRequest(req), env), res);
                } catch (error) {
                    res.statusCode = 500;
                    res.end(error instanceof Error ? error.message : 'internal error');
                }
            });
        },
    };
}
