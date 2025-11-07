const express = require('express');
const path = require('path');
const fs = require('fs');
const io = require('socket.io-client');

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
const { AUDIO_BASE_DIR, API_RESPONSE_DIR, STT_API_URL, PORT, SESSION_TIMEOUT, DEBUG } = config;

// Ensure API response directory exists
if (!fs.existsSync(API_RESPONSE_DIR)) {
    fs.mkdirSync(API_RESPONSE_DIR, { recursive: true });
    console.log(`Created API response directory: ${API_RESPONSE_DIR}`);
}

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
                if (item.name.match(/\.(flac|wav|mp3|m4a|ogg)$/i)) {
                    audioFiles.push(item.name);
                } else if (item.name.endsWith('.json')) {
                    jsonFiles.push(item.name);
                }
            }
        });

        audioFiles.forEach(audioFile => {
            const baseName = audioFile.replace(/\.(flac|wav|mp3|m4a|ogg)$/i, '');
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

// Get or generate transcript via API
app.get('/api/transcript', requireAuth, async (req, res) => {
    const filePath = req.query.file;
    if (!filePath) {
        return res.status(400).json({ error: 'File path required' });
    }

    const decodedPath = decodeURIComponent(filePath);
    const audioFileName = path.basename(decodedPath, path.extname(decodedPath));
    const jsonFileName = audioFileName + '.json';
    const jsonFullPath = path.join(API_RESPONSE_DIR, jsonFileName);

    // Check if JSON already exists
    if (fs.existsSync(jsonFullPath)) {
        try {
            const content = fs.readFileSync(jsonFullPath, 'utf8');
            const jsonData = JSON.parse(content);
            return res.json(jsonData);
        } catch (error) {
            console.error('Error reading existing JSON:', error);
        }
    }

    // Generate transcript via API
    const windowsPath = decodedPath.replace(/\//g, path.sep);
    const audioFullPath = path.resolve(AUDIO_BASE_DIR, windowsPath);

    if (!fs.existsSync(audioFullPath)) {
        return res.status(404).json({ error: 'Audio file not found' });
    }

    try {
        const transcript = await transcribeAudio(audioFullPath);
        
        // Save to JSON file
        fs.writeFileSync(jsonFullPath, JSON.stringify(transcript, null, 2), 'utf8');
        
        res.json(transcript);
    } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

// Function to transcribe audio using Socket.IO API
async function transcribeAudio(audioFilePath) {
    return new Promise((resolve, reject) => {
        const socket = io(STT_API_URL, {
            transports: ['websocket'],
            rejectUnauthorized: false
        });

        let result = null;
        const timeout = setTimeout(() => {
            socket.disconnect();
            reject(new Error('Transcription timeout'));
        }, 60000); // 60 second timeout

        socket.on('connect', () => {
            if (DEBUG) console.log('Connected to STT API');
            
            // Read and send audio file
            const audioData = fs.readFileSync(audioFilePath);
            const encodedAudio = audioData.toString('base64');
            
            const payload = {
                index: 0,
                audio: encodedAudio,
                endOfStream: true
            };
            
            socket.emit('audio_transmit_upload', payload);
        });

        socket.on('result_upload', (data) => {
            if (DEBUG) console.log('Received result_upload');
            clearTimeout(timeout);
            result = data;
            socket.disconnect();
            
            // Extract transcript from predicted_words
            let transcript = '';
            if (data.output && data.output.predicted_words) {
                transcript = data.output.predicted_words
                    .map(item => item.word)
                    .join('');
            }
            
            resolve({
                ...data,
                transcript: transcript
            });
        });

        socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(`Connection error: ${error.message}`));
        });

        socket.on('error', (error) => {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(`Socket error: ${error}`));
        });
    });
}

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
    console.log(`API responses saved to: ${API_RESPONSE_DIR}`);
});
