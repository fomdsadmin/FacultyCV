const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Simple CORS proxy for Gotenberg - no bullshit, just works
const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix if you want
  },
  onProxyRes: function (proxyRes, req, res) {
    // Add CORS headers to every response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  },
  onError: function (err, req, res) {
    console.error('Proxy error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    res.end('Proxy error: ' + err.message);
  }
});

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }
  
  // Proxy everything else
  proxy(req, res);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 CORS proxy running on http://localhost:${PORT}`);
  console.log(`🎯 Proxying to Gotenberg at http://localhost:3000`);
  console.log(`💡 Use http://localhost:${PORT} in your React app`);
});

// Handle shutdown
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
