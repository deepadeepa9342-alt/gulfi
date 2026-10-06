// Gulfi Chat - Zero-dependency Local Server
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  // Normalize URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Server API endpoint: Real-time verified IST Time
  if (pathname === '/api/time') {
    const now = new Date();
    // Calculate IST time (UTC + 5:30)
    const istString = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    });
    const istHours = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
    const istDate = now.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const istDay = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      timezone: 'Asia/Kolkata',
      offset: '+05:30',
      istDateTime: istString,
      istDate: istDate,
      istTime: istHours,
      istDay: istDay,
      timestamp: now.getTime()
    }));
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found - Gulfi Chat');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Gulfi Chat is running live!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`⏰ Timezone: Asia/Kolkata (IST UTC+05:30)`);
  console.log(`===============================================`);
});
