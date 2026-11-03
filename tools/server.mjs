import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpg':'image/jpeg', '.png':'image/png', '.json':'application/json; charset=utf-8' };
http.createServer((request,response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {response.writeHead(404);response.end('Not found');return;}
    response.writeHead(200, { 'Content-Type':types[path.extname(filename)] || 'application/octet-stream','Cache-Control':'no-store' });
    fs.createReadStream(filename).pipe(response);
  } catch {response.writeHead(400);response.end('Bad request');}
}).listen(port, '127.0.0.1', () => console.log(`Campus v2.1: http://127.0.0.1:${port}`));
