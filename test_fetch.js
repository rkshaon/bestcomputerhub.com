const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length');
  res.setHeader('Content-Length', '12345');
  res.writeHead(200);
  res.end();
});

server.listen(8081, async () => {
  try {
    const fetch = globalThis.fetch;
    const res = await fetch('http://localhost:8081/', { method: 'HEAD' });
    console.log('Status:', res.status);
    console.log('Content-Length:', res.headers.get('content-length'));
  } catch (e) {
    console.log('Error:', e);
  }
  server.close();
});
