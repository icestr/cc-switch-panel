import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { dispatch } from './rpc.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = new Hono();

app.use('/*', serveStatic({ root: resolve(__dirname, '../dist') }));

app.post('/rpc', async (c) => {
  const { method, params } = await c.req.json();
  return c.json(dispatch(method, params));
});

const port = 24800;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Panel running at http://localhost:${port}`);
});
