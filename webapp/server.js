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

// Trust proxy for Cloudflare tunnel
app.set('trust proxy', true);

// CORS headers for Cloudflare tunnel
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-session-id');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Load reference data from CSV files
const referenceData = new Map();
const bnttsCSV = path.join(__dirname, 'STT Stats - bntts highest error.csv');
const commonvoiceCSV = path.join(__dirname, 'STT Stats - common voice highest error.csv');

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

function loadReferenceData() {
    let totalLoaded = 0;
    
    // Load BNTTS data
    if (fs.existsSync(bnttsCSV)) {
        const csvContent = fs.readFileSync(bnttsCSV, 'utf-8');
        const lines = csvContent.split('\n');
        
        // Skip header row (index 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = parseCSVLine(line);
            
            // bntts_wer_error: Column A to C (index 0-2) = filename, reference, model
            if (values.length > 2 && values[0]) {
                const key = `bntts_wer_error/${values[0]}`;
                referenceData.set(key, {
                    filename: values[0],
                    sentence: values[1] || '',
                    modelTranscript: values[2] || '',
                    folder: 'bntts_wer_error'
                });
                totalLoaded++;
            }
            
            // bntts_cer_error: Column E to G (index 4-6) = filename, reference, model
            if (values.length > 6 && values[4]) {
                const key = `bntts_cer_error/${values[4]}`;
                referenceData.set(key, {
                    filename: values[4],
                    sentence: values[5] || '',
                    modelTranscript: values[6] || '',
                    folder: 'bntts_cer_error'
                });
                totalLoaded++;
            }
        }
        console.log(`Loaded BNTTS reference data from ${bnttsCSV}`);
    } else {
        console.log(`Warning: ${bnttsCSV} not found`);
    }
    
    // Load Common Voice data
    if (fs.existsSync(commonvoiceCSV)) {
        const csvContent = fs.readFileSync(commonvoiceCSV, 'utf-8');
        const lines = csvContent.split('\n');
        
        // Skip header row (index 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = parseCSVLine(line);
            
            // commonvoice_wer_error: Column A to C (index 0-2) = filename, reference, model
            if (values.length > 2 && values[0]) {
                const key = `commonvoice_wer_error/${values[0]}`;
                referenceData.set(key, {
                    filename: values[0],
                    sentence: values[1] || '',
                    modelTranscript: values[2] || '',
                    folder: 'commonvoice_wer_error'
                });
                totalLoaded++;
            }
            
            // commonvoice_cer_error: Column E to G (index 4-6) = filename, reference, model
            if (values.length > 6 && values[4]) {
                const key = `commonvoice_cer_error/${values[4]}`;
                referenceData.set(key, {
                    filename: values[4],
                    sentence: values[5] || '',
                    modelTranscript: values[6] || '',
                    folder: 'commonvoice_cer_error'
                });
                totalLoaded++;
            }
        }
        console.log(`Loaded Common Voice reference data from ${commonvoiceCSV}`);
    } else {
        console.log(`Warning: ${commonvoiceCSV} not found`);
    }
    
    console.log(`Total loaded: ${totalLoaded} reference records`);
}

loadReferenceData();

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
    'demo': 'Nz8&aU5hW2qS',
    'nusrat': 'Np8@xK4mT9wQ',
    'mashruf': 'Mh5#vL2nR6yB',
    'khairul': 'Kj9$pW3cF7sD'
};

// Session storage with persistence
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
const sessions = new Map();

// Load sessions from file on startup
function loadSessions() {
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
            const sessionsArray = JSON.parse(data);
            sessionsArray.forEach(([key, value]) => {
                // Only load sessions that haven't expired (24 hours)
                const loginTime = new Date(value.loginTime);
                const now = new Date();
                const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
                if (hoursSinceLogin < 24) {
                    sessions.set(key, value);
                }
            });
            console.log(`Loaded ${sessions.size} active sessions from disk`);
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

// Save sessions to file
function saveSessions() {
    try {
        const sessionsArray = Array.from(sessions.entries());
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsArray, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving sessions:', error);
    }
}

loadSessions();

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
        saveSessions(); // Persist session to disk
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
        saveSessions(); // Persist session removal to disk
    }
    res.json({ success: true });
});

// Browse directory
app.get('/api/browse', requireAuth, (req, res) => {
    const relativePath = decodeURIComponent(req.query.path || '');
    const windowsPath = relativePath.replace(/\//g, path.sep);
    const fullPath = path.resolve(AUDIO_BASE_DIR, windowsPath);

    if (DEBUG) {
        console.log('Browse request:', {
            relativePath,
            windowsPath,
            fullPath,
            baseDir: AUDIO_BASE_DIR
        });
    }

    try {
        const normalizedBase = path.resolve(AUDIO_BASE_DIR);
        const normalizedFull = path.resolve(fullPath);

        if (!normalizedFull.startsWith(normalizedBase)) {
            console.error('Access denied:', { normalizedFull, normalizedBase });
            return res.status(403).json({ error: 'Access denied', details: 'Path outside base directory' });
        }

        if (!fs.existsSync(fullPath)) {
            console.error('Directory not found:', fullPath);
            return res.status(404).json({ error: 'Directory not found', path: fullPath });
        }

        const items = fs.readdirSync(fullPath, { withFileTypes: true });
        const result = {
            currentPath: relativePath,
            items: []
        };

        const audioFiles = [];
        const jsonFiles = [];
        
        // Allowed folders at root level
        const allowedFolders = ['commonvoice_wer_error', 'commonvoice_cer_error', 'bntts_cer_error', 'bntts_wer_error'];

        items.forEach(item => {
            if (item.isDirectory()) {
                // At root level, only show the 4 validated folders
                if (!relativePath && !allowedFolders.includes(item.name)) {
                    return;
                }
                
                const itemPath = normalizePath(relativePath ? `${relativePath}/${item.name}` : item.name);
                const dirFullPath = path.join(fullPath, item.name);
                let fileCount = 0;
                try {
                    const dirItems = fs.readdirSync(dirFullPath, { withFileTypes: true });
                    fileCount = dirItems.filter(dirItem => dirItem.isFile() && dirItem.name.match(/\.wav$/i)).length;
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
                // Show WAV files
                if (item.name.match(/\.wav$/i)) {
                    audioFiles.push(item.name);
                } else if (item.name.endsWith('.json')) {
                    jsonFiles.push(item.name);
                }
            }
        });

        audioFiles.forEach(audioFile => {
            const baseName = audioFile.replace(/\.wav$/i, '');
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

// Get transcript from same folder as audio file or from CSV data
app.get('/api/transcript', requireAuth, async (req, res) => {
    const filePath = req.query.file;
    if (!filePath) {
        return res.status(400).json({ error: 'File path required' });
    }

    const decodedPath = decodeURIComponent(filePath);
    const normalizedPath = normalizePath(decodedPath);
    const windowsPath = decodedPath.replace(/\//g, path.sep);
    const audioFullPath = path.resolve(AUDIO_BASE_DIR, windowsPath);
    
    // Get JSON file in same folder as audio file
    const audioFileName = path.basename(audioFullPath, path.extname(audioFullPath));
    const audioDir = path.dirname(audioFullPath);
    const jsonFullPath = path.join(audioDir, audioFileName + '.json');

    // Check if JSON exists (for saved annotations)
    if (fs.existsSync(jsonFullPath)) {
        try {
            const content = fs.readFileSync(jsonFullPath, 'utf8');
            const jsonData = JSON.parse(content);
            // If it has a transcript field, return it
            if (jsonData.transcript || jsonData.modelTranscript) {
                return res.json({ transcript: jsonData.transcript || jsonData.modelTranscript });
            }
        } catch (error) {
            console.error('Error reading JSON:', error);
        }
    }
    
    // Fall back to CSV data using folder/filename as key
    const pathWithoutExt = normalizedPath.replace(/\.(wav|mp3|flac|m4a|ogg)$/i, '');
    const reference = referenceData.get(pathWithoutExt);
    if (reference && reference.modelTranscript) {
        return res.json({ transcript: reference.modelTranscript });
    }
    
    return res.status(404).json({ error: 'Transcript not found' });
});

// Get reference data from CSV
app.get('/api/reference', requireAuth, async (req, res) => {
    const filePath = req.query.file;
    if (!filePath) {
        return res.status(400).json({ error: 'File path required' });
    }

    const decodedPath = decodeURIComponent(filePath);
    const normalizedPath = normalizePath(decodedPath);
    const pathWithoutExt = normalizedPath.replace(/\.(wav|mp3|flac|m4a|ogg)$/i, '');
    
    const reference = referenceData.get(pathWithoutExt);
    
    if (reference) {
        return res.json(reference);
    } else {
        return res.status(404).json({ error: 'Reference data not found' });
    }
});

// Save annotation
app.post('/api/annotation', requireAuth, async (req, res) => {
    try {
        const annotation = req.body;
        const sessionId = req.headers['x-session-id'];
        const session = sessions.get(sessionId);
        
        if (!annotation.filename) {
            return res.status(400).json({ error: 'Filename required' });
        }
        
        // Add metadata
        annotation.annotator = session.username;
        annotation.timestamp = new Date().toISOString();
        
        // Determine which folder the file is in based on the filename
        const filename = annotation.filename;
        let audioFolder = null;
        
        // Check each validated folder for the audio file
        const validatedFolders = ['commonvoice_wer_error', 'commonvoice_cer_error', 'bntts_cer_error', 'bntts_wer_error'];
        for (const folder of validatedFolders) {
            const audioPath = path.join(AUDIO_BASE_DIR, folder, `${filename}.wav`);
            if (fs.existsSync(audioPath)) {
                audioFolder = folder;
                break;
            }
        }
        
        if (!audioFolder) {
            return res.status(404).json({ error: 'Audio file not found in validated folders' });
        }
        
        // Save JSON in the same folder as the audio file
        const jsonPath = path.join(AUDIO_BASE_DIR, audioFolder, `${filename}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(annotation, null, 2), 'utf-8');
        
        // Also save to annotations folder for backup
        const annotationsDir = path.join(__dirname, 'annotations');
        if (!fs.existsSync(annotationsDir)) {
            fs.mkdirSync(annotationsDir, { recursive: true });
        }
        const annotationFilename = `${filename}_annotation.json`;
        const annotationPath = path.join(annotationsDir, annotationFilename);
        fs.writeFileSync(annotationPath, JSON.stringify(annotation, null, 2), 'utf-8');
        
        res.json({ success: true, message: 'Annotation saved' });
    } catch (error) {
        console.error('Error saving annotation:', error);
        res.status(500).json({ error: 'Failed to save annotation' });
    }
});

// Get annotation for a file
app.get('/api/annotation', requireAuth, async (req, res) => {
    try {
        const filePath = req.query.file;
        if (!filePath) {
            return res.status(400).json({ error: 'File path required' });
        }
        
        const audioFileName = path.basename(decodeURIComponent(filePath), path.extname(decodeURIComponent(filePath)));
        const annotationsDir = path.join(__dirname, 'annotations');
        const annotationFilename = `${audioFileName}_annotation.json`;
        const annotationPath = path.join(annotationsDir, annotationFilename);
        
        if (fs.existsSync(annotationPath)) {
            const content = fs.readFileSync(annotationPath, 'utf-8');
            const annotation = JSON.parse(content);
            return res.json(annotation);
        } else {
            return res.status(404).json({ error: 'No annotation found for this file' });
        }
    } catch (error) {
        console.error('Error loading annotation:', error);
        res.status(500).json({ error: 'Failed to load annotation' });
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

// Verify directories exist on startup
if (!fs.existsSync(AUDIO_BASE_DIR)) {
    console.error(`ERROR: AUDIO_BASE_DIR does not exist: ${AUDIO_BASE_DIR}`);
    console.error('Please check your config.local.js file');
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`STT Model Evaluator running at http://localhost:${PORT}`);
    console.log(`Audio files from: ${AUDIO_BASE_DIR}`);
    console.log(`Transcriptions from: ${TRANSCRIPTION_DIR}`);
    console.log(`Absolute path: ${path.resolve(AUDIO_BASE_DIR)}`);
    
    // List files in directory to verify
    try {
        const files = fs.readdirSync(AUDIO_BASE_DIR);
        console.log(`Found ${files.length} items in audio directory`);
        if (DEBUG) {
            console.log('First few items:', files.slice(0, 5));
        }
    } catch (error) {
        console.error('Error reading audio directory:', error.message);
    }
});
