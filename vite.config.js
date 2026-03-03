import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function rpcPlugin() {
  return {
    name: 'rpc-middleware',
    async configureServer(server) {
      const { dispatch } = await import('./server/rpc.js');
      server.middlewares.use('/rpc', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          const { method, params } = JSON.parse(body);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(dispatch(method, params)));
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), rpcPlugin()],
  build: { outDir: 'dist' }
});
