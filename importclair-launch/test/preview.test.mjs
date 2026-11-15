import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { handlePreviewRequest } from '../scripts/preview.mjs';

async function preview(path, method = 'GET', extraHeaders = {}) {
  const req = Readable.from(method === 'POST' ? [Buffer.from('professional=yes')] : []);
  Object.assign(req, {
    url: path, method,
    headers: { origin: 'http://127.0.0.1:8787', 'content-type': 'application/x-www-form-urlencoded', ...extraHeaders }
  });
  const res = {
    socket: { localPort: 8787 }, headersSent: false,
    writeHead(status, headers) { this.status = status; this.headers = headers; this.headersSent = true; },
    end(body) { this.body = Buffer.from(body).toString(); }
  };
  await handlePreviewRequest(req, res);
  return res;
}

test('preview adapter handles POST streams and keeps payments disabled', async () => {
  const logout = await preview('/logout', 'POST');
  assert.equal(logout.status, 303);
  assert.match(logout.headers['set-cookie'][0], /Max-Age=0/);
  assert.equal((await preview('/checkout', 'POST')).status, 503);
  const home = await preview('/');
  assert.equal(home.status, 200);
  assert.match(home.body, /Aucun paiement disponible/);
});

test('preview adapter contains malformed request errors', async () => {
  const broken = await preview('/', 'GET', { 'invalid header name': 'value' });
  assert.equal(broken.status, 500);
  assert.match(broken.body, /temporairement indisponible/);
  assert.equal((await preview('/')).status, 200);
});
