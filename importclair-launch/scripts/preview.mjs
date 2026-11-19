import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import worker from '../src/worker.mjs';

// The preview always disables payments and listens only on this computer.
export async function handlePreviewRequest(req, res) {
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
        else if (value !== undefined) headers.set(name, value);
      }
      const options = { method: req.method, headers };
      if (!['GET', 'HEAD'].includes(req.method)) {
        options.body = Readable.toWeb(req);
        options.duplex = 'half';
      }
      const origin = `http://127.0.0.1:${res.socket.localPort}`;
      const response = await worker.fetch(new Request(origin + req.url, options), {});
      const responseHeaders = Object.fromEntries(response.headers);
      const cookies = response.headers.getSetCookie();
      if (cookies.length) responseHeaders['set-cookie'] = cookies;
      res.writeHead(response.status, responseHeaders);
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      }
      res.end('Prévisualisation temporairement indisponible.');
    }
}

export function createPreviewServer() {
  return createServer(handlePreviewRequest);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  createPreviewServer().listen(8787, '127.0.0.1', () => {
    console.log('Local preview: http://127.0.0.1:8787 (sales disabled)');
  });
}
