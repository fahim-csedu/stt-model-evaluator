const express = require('express');
const path = require('path');
const fs = require('fs');

// Load configuration
let config;
try {
    config = require('./config.local.js');
    console.log('Using local configuration');
} catch (error) {
    config = require('./config.js');
    console.log('Using default configuration');
}

const app = express();
const { AUDIO_BASE_DIR, TRANSCRIPTION_DIR, PORT, SESSION_TIMEOUT, DEBUG } = config;

// Helper function to normalize paths
function normalizePath(pathStr) {
    if (!pathStr) return '';
    return pathStr
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
        .replace(/^\//, '')
        .replace(/\/$/, '');
}

// Demo accounts
const DEMO_ACCOUNTS = {
    'mehadi': 'Kx9#mP2vL8qR',
    'annoor': 'Zt4$nW7jF3xY',
    'lina': 'Bv6&hQ9sM1kE',
    'rar': 'Gp3*rT8cN5wA',
    'dipto': 'Jm7@uV2bX4zD',
    'sta': 'Qw5!yH8fK9pL',
    'mrk': 'Cx2%eR6gJ7nM',
    'fa': 'Fs4^iO1tY3vB',
    'demo': 'Nz8&aU5hW2qS'
};

// Session storage
const sessions = new Map();

// Middleware
app.use(express.json());

// Authentication middleware
function requireAuth(req, res, next) {
    const sessionId = req.headers['x-session-id'];
    if (DEBUG) {
        console.log(`Auth check - Session ID: ${sessionId}`);
    }
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html') || path.endsWith('.css') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Audio file serving with authentication
app.get('/audio/*', (req, res) => {
    const sessionId = req.query.session || req.headers['x-session-id'];
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const filePath = req.params[0];
    const decodedPath = decodeURIComponent(filePath);
    const windowsPath = decodedPath.replace(/\//g, path.sep);
    const fullPath = path.resolve(AUDIO_BASE_DIR, windowsPath);

    try {
        const normalizedBase = path.resolve(AUDIO_BASE_DIR);
        const normalizedFull = path.resolve(fullPath);

        if (!normalizedFull.startsWith(normalizedBase)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const ext = path.extname(fullPath).toLowerCase();
        const contentTypes = {
            '.flac': 'audio/flac',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4',
            '.ogg': 'audio/ogg'
        };
        const contentType = contentTypes[ext] || 'audio/octet-stream';

        const stat = fs.statSync(fullPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(fullPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
            };
            res.writeHead(200, head);
            fs.createReadStream(fullPath).pipe(res);
        }
    } catch (error) {
        console.error('Audio serving error:', error);
        res.status(500).json({ error: 'Failed to serve audio file' });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    if (DEMO_ACCOUNTS[username] && DEMO_ACCOUNTS[username] === password) {
        const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessions.set(sessionId, { username, loginTime: new Date() });
        if (DEBUG) {
            console.log(`Login successful - User: ${username}, Session: ${sessionId}`);
        }
        res.json({ success: true, sessionId, username });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
        sessions.delete(sessionId);
    }
    res.json({ success: true });
});

// Browse directory
app.get('/api/browse', requireAuth, (req, res) => {
    const relativePath = decodeURIComponent(req.query.path || '');
    const windowsPath = relativePath.replace(/\//g, path.sep);
    const fullPath = path.resolve(AUDIO_BASE_DIR, windowsPath);

    try {
        const normalizedBase = path.resolve(AUDIO_BASE_DIR);
        const normalizedFull = path.resolve(fullPath);

        if (!normalizedFull.startsWith(normalizedBase)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'Directory not found' });
        }

        const items = fs.readdirSync(fullPath, { withFileTypes: true });
        const result = {
            currentPath: relativePath,
            items: []
        };

        const audioFiles = [];
        const jsonFiles = [];

        items.forEach(item => {
            if (item.isDirectory()) {
                // Skip the "remaining" folder
                if (item.name.toLowerCase() === 'remaining') {
                    return;
                }
                
                const itemPath = normalizePath(relativePath ? `${relativePath}/${item.name}` : item.name);
                const dirFullPath = path.join(fullPath, item.name);
                let fileCount = 0;
                try {
                    const dirItems = fs.readdirSync(dirFullPath, { withFileTypes: true });
                    fileCount = dirItems.filter(dirItem => dirItem.isFile()).length;
                } catch (error) {
                    fileCount = 0;
                }
                result.items.push({
                    name: item.name,
                    type: 'folder',
                    path: itemPath,
                    fileCount: fileCount
                });
            } else {
                // Only show MP3 files (not WAV files)
                if (item.name.match(/\.mp3$/i)) {
                    audioFiles.push(item.name);
                } else if (item.name.endsWith('.json')) {
                    jsonFiles.push(item.name);
                }
            }
        });

        audioFiles.forEach(audioFile => {
            const baseName = audioFile.replace(/\.mp3$/i, '');
            const matchingJson = jsonFiles.find(jsonFile => jsonFile === baseName + '.json');
            const audioPath = normalizePath(relativePath ? `${relativePath}/${audioFile}` : audioFile);
            const jsonPath = matchingJson ? normalizePath(relativePath ? `${relativePath}/${matchingJson}` : matchingJson) : null;

            result.items.push({
                name: baseName,
                type: 'audio',
                audioFile: audioPath,
                jsonFile: jsonPath,
                path: audioPath
            });
        });

        res.json(result);
    } catch (error) {
        console.error('Browse error:', error);
        res.status(500).json({ error: 'Failed to read directory' });
    }
});

// Get absolute path
app.get('/api/absolutePath', requireAuth, (req, res) => {
    const filePath = req.query.file;
    if (!filePath) {
        return res.status(400).json({ error: 'File path required' });
    }
    const normalizedPath = normalizePath(decodeURIComponent(filePath));
    res.json({ absolutePath: normalizedPath });
});

// Get transcript from same folder as audio file
app.get('/api/transcript', requireAuth, async (req, res) => {
    const filePath = req.query.file;
    if (!filePath) {
        return res.status(400).json({ error: 'File path required' });
    }

    const decodedPath = decodeURIComponent(filePath);
    const windowsPath = decodedPath.replace(/\//g, path.sep);
    const audioFullPath = path.resolve(AUDIO_BASE_DIR, windowsPath);
    
    // Get JSON file in same folder as audio file
    const audioFileName = path.basename(audioFullPath, path.extname(audioFullPath));
    const audioDir = path.dirname(audioFullPath);
    const jsonFullPath = path.join(audioDir, audioFileName + '.json');

    // Check if JSON exists
    if (fs.existsSync(jsonFullPath)) {
        try {
            const content = fs.readFileSync(jsonFullPath, 'utf8');
            const jsonData = JSON.parse(content);
            return res.json(jsonData);
        } catch (error) {
            console.error('Error reading JSON:', error);
            return res.status(500).json({ error: 'Failed to read transcript file' });
        }
    } else {
        return res.status(404).json({ error: 'Transcript not found' });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`STT Model Evaluator running at http://localhost:${PORT}`);
    console.log(`Audio files from: ${AUDIO_BASE_DIR}`);
    console.log(`Transcriptions from: ${TRANSCRIPTION_DIR}`);
});
