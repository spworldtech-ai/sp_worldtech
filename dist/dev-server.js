const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^([.][.][/\\])+/, '');
  return path.join(ROOT, normalized === '/' ? 'index.html' : normalized.replace(/^[/\\]+/, ''));
}

function resolveFile(urlPath) {
  let filePath = safePath(urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  if (urlPath.endsWith('/')) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
  }
  if (!path.extname(urlPath)) {
    const htmlPath = `${filePath}.html`;
    if (fs.existsSync(htmlPath)) return htmlPath;
    const nestedIndex = path.join(filePath, 'index.html');
    if (fs.existsSync(nestedIndex)) return nestedIndex;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'spworldtech.com'}`);
  let filePath = resolveFile(requestUrl.pathname);

  // Keep browser history routes usable during local development.
  if (!filePath) filePath = path.join(ROOT, 'index.html');

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Unable to load the requested page.');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SP WorldTech frontend running on port ${PORT}`);
});
