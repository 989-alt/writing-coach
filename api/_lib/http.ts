import type { IncomingMessage, ServerResponse } from 'node:http';

export async function readJson<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8').trim();
      if (!raw) return resolve({} as T);
      try {
        resolve(JSON.parse(raw) as T);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('invalid json body'));
      }
    });
    req.on('error', reject);
  });
}

export function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function sendError(res: ServerResponse, status: number, message: string) {
  sendJson(res, status, { error: message });
}

export function methodGuard(req: IncomingMessage, res: ServerResponse, allowed: string[] = ['POST']) {
  const method = (req.method ?? 'GET').toUpperCase();
  if (!allowed.includes(method)) {
    res.setHeader('allow', allowed.join(', '));
    sendError(res, 405, `Method ${method} not allowed`);
    return false;
  }
  return true;
}
