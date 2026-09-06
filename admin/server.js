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
  // A malformed request URI must never crash the whole server (this was the
  // root cause of "localhost admin page doesn't work" — one bad request from
  // a browser extension or scanner killed Node and the panel went offline)
  let pathname;
  try {
    const parsedUrl = url.parse(req.url, true);
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

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
  // GIT_TERMINAL_PROMPT=0 makes git fail fast instead of hanging on a hidden password prompt,
  // and timeout: 120000 guarantees the request always answers within 2 minutes.
  const execOpts = { cwd: rootDir, timeout: 120000, env: Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0' }) };
  const run = (cmd) => new Promise((resolve) => {
    exec(cmd, execOpts, (err, stdout, stderr) => resolve({ err, stdout: stdout || '', stderr: stderr || '' }));
  });

  (async () => {
    try {
      // 0. A GitHub remote must exist at all
      const remote = await run('git remote get-url origin');
      if (remote.err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'No GitHub repository is connected yet. Open the Tutorial tab -> "Commit & Publish" for the two commands that connect one.' }));
        return;
      }

      // 1. Stage everything
      await run('git add .');

      // 2. Commit. "nothing to commit" is normal, not an error.
      const commit = await run('git commit -m "Auto update via admin panel"');
      const nothingToCommit = commit.err && /nothing to commit|no changes added/i.test(commit.stdout + commit.stderr);
      if (commit.err && !nothingToCommit) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: ('Commit failed: ' + (commit.stderr || commit.err.message)).trim() }));
        return;
      }

      // 3. Push (also picks up any earlier commit whose push failed)
      const push = await run('git push origin HEAD');
      if (push.err) {
        const detail = (push.stderr || push.stdout || push.err.message).trim();
        let hint = '';
        if (/could not read|authentication|403|permission/i.test(detail)) {
          hint = ' — GitHub sign-in looks expired. Open Git Bash in the project folder and run "git push" once to sign in again, then retry.';
        } else if (/could not resolve|connection|timed out|network/i.test(detail)) {
          hint = ' — No internet connection detected. Check your network and retry.';
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: ('Push failed: ' + detail + hint).trim() }));
        return;
      }

      const msg = nothingToCommit
        ? 'Everything was already up to date on GitHub.'
        : 'Saved and pushed to GitHub successfully.';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: msg }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Push failed: ' + e.message }));
    }
  })();
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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   The admin panel may already be running — try opening http://localhost:${PORT}`);
    console.error(`   Or close the other program using port ${PORT} and run this again.`);
  } else {
    console.error('\n❌ Server failed to start:', err.message);
  }
  console.error('\nPress any key to close this window...');
  process.exit(1);
});

server.listen(PORT, () => {
  // Open the browser only AFTER the server is actually accepting connections
  // (the old start-admin.bat opened it before Node booted → "site can't be reached")
  try {
    const { exec } = require('child_process');
    const url = `http://localhost:${PORT}`;
    if (process.platform === 'win32') exec(`start "" "${url}"`, { detached: true }).unref();
    else if (process.platform === 'darwin') exec(`open ${url}`, { detached: true }).unref();
    else exec(`xdg-open ${url}`, { detached: true }).unref();
  } catch (_) { /* never block the server over a browser launch */ }

  console.log(`\n==================================================`);
  console.log(`🚀 Mahmoud Mobarak Portfolio Admin Panel Running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📂 Admin Location: ${__dirname}`);
  console.log(`🔒 Strictly Local: Edits save to index.html & GitHub Pages`);
  console.log(`==================================================\n`);
});
