const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { syncHtml } = require('./sync_html');

const rootDir = path.resolve(__dirname, '..');
// Number() so a PORT env var of "0" (or any junk) falls back to 3000 instead of
// making the server listen on a random OS-assigned port
const PORT = Number(process.env.PORT) || 3000;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // 50MB limit for image uploads
      if (body.length > 50 * 1024 * 1024) {
        req.connection.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // Set CORS headers for local administration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Get Content
  if (req.method === 'GET' && pathname === '/api/content') {
    try {
      const dataFile = path.join(rootDir, 'portfolio-data.json');
      const data = fs.readFileSync(dataFile, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API: Save Content
  if (req.method === 'POST' && pathname === '/api/content') {
    try {
      const body = await readBody(req);
      const parsedData = JSON.parse(body);

      // Save JSON
      const dataFile = path.join(rootDir, 'portfolio-data.json');
      fs.writeFileSync(dataFile, JSON.stringify(parsedData, null, 2), 'utf8');

      // Synchronize index.html
      syncHtml(rootDir, parsedData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Changes saved and portfolio updated successfully!' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API: Upload File (image or PDF via base64)
  if (req.method === 'POST' && pathname === '/api/upload') {
    try {
      const body = await readBody(req);
      const { filename, targetFolder, dataBase64 } = JSON.parse(body);

      if (!filename || !targetFolder || !dataBase64) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing filename, targetFolder, or dataBase64' }));
        return;
      }

      // Sanitize targetFolder
      const allowedFolders = ['Photos', 'Certificate', 'Certificates/PDF', 'Report Cards/Photos', 'Report Cards/PDF'];
      if (!allowedFolders.includes(targetFolder)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid target folder' }));
        return;
      }

      const cleanFilename = path.basename(filename);
      const targetDir = path.join(rootDir, targetFolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, cleanFilename);
      const buffer = Buffer.from(dataBase64, 'base64');
      fs.writeFileSync(filePath, buffer);

      const relativePath = `${targetFolder}/${cleanFilename}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, path: relativePath, filename: cleanFilename }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API: List existing files
  if (req.method === 'GET' && pathname === '/api/files') {
    try {
      function listFiles(dir) {
        const full = path.join(rootDir, dir);
        if (!fs.existsSync(full)) return [];
        return fs.readdirSync(full).filter(f => !fs.statSync(path.join(full, f)).isDirectory());
      }
      const files = {
        photos: listFiles('Photos').map(f => `Photos/${f}`),
        certificates: listFiles('Certificate').map(f => `Certificate/${f}`),
        reportCardPhotos: listFiles('Report Cards/Photos').map(f => `Report Cards/Photos/${f}`),
        reportCardPdfs: listFiles('Report Cards/PDF').map(f => `Report Cards/PDF/${f}`)
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
// API: Push changes to GitHub
if (req.method === 'POST' && pathname === '/api/push') {
  const { exec } = require('child_process');
  exec('git add . && git commit -m "Auto update via admin panel" && git push', { cwd: rootDir }, (err, stdout, stderr) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message, stderr }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Pushed to GitHub successfully.', stdout }));
    }
  });
  return;
}


  // Static File Serving
  let filePath;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
  } else if (pathname === '/admin.css') {
    filePath = path.join(__dirname, 'admin.css');
  } else if (pathname === '/admin.js') {
    filePath = path.join(__dirname, 'admin.js');
  } else {
    // Serve assets from root directory (Photos, Certificate, Report Cards)
    filePath = path.join(rootDir, pathname);
  }

  // Check file existence
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Mahmoud Mobarak Portfolio Admin Panel Running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📂 Admin Location: ${__dirname}`);
  console.log(`🔒 Strictly Local: Edits save to index.html & GitHub Pages`);
  console.log(`==================================================\n`);
});
