# STT Model Evaluator - Complete Guide

## Quick Start

### 1. Start the Webapp

```bash
cd webapp
npm install
node server.js
```

Server runs at: **http://localhost:3002**

### 2. Login

- Username: `demo`
- Password: `Nz8&aU5hW2qS`

(Other accounts available in `webapp/server.js`)

### 3. Navigate and Annotate

- Browse folders
- Select MP3 files
- Review transcripts
- Fill annotation form
- Save

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     STT Model Evaluator                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Audio Files  │  │ API Outputs  │  │  Reference   │      │
│  │   (MP3)      │  │   (JSON)     │  │    (CSV)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     ┌──────▼──────┐                         │
│                     │   Webapp    │                         │
│                     │  (Node.js)  │                         │
│                     └──────┬──────┘                         │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │             │
│    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐       │
│    │ Display │      │ Annotate  │     │   Export  │       │
│    │ Compare │      │   Save    │     │   JSONL   │       │
│    └─────────┘      └───────────┘     └───────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
stt-model-evaluator/
├── api_evaluator/
│   ├── batch_transcribe_v2.py          # Batch transcription script
│   ├── test_single_transcribe.py       # Single file test
│   ├── list_audio_files.py             # List available files
│   ├── create_filtered_csv.py          # Create optimized CSV
│   ├── config.py                       # API configuration
│   ├── config.local.py                 # Local config
│   ├── filtered_csedu.csv              # Original CSV (8.7 MB)
│   ├── webapp_reference.csv            # Optimized CSV (2 MB)
│   └── requirements.txt                # Python dependencies
│
├── webapp/
│   ├── server.js                       # Express server
│   ├── config.js                       # Default config
│   ├── config.local.js                 # Local config
│   ├── webapp_reference.csv            # Reference data
│   ├── annotations.jsonl               # Saved annotations
│   ├── export_annotations.js           # Export script
│   ├── package.json                    # Node dependencies
│   └── public/
│       ├── index.html                  # Main UI
│       ├── login.html                  # Login page
│       ├── script.js                   # Frontend logic
│       └── style.css                   # Styling
│
└── Documentation/
    ├── COMPLETE_GUIDE.md               # This file
    ├── ANNOTATION_SYSTEM.md            # Annotation details
    ├── REFERENCE_TRANSCRIPT_FEATURE.md # Transcript feature
    ├── WEBAPP_TEST_GUIDE.md            # Testing guide
    └── IMPLEMENTATION_SUMMARY.md       # Summary
```

## Features

### 1. File Browser
- Navigate folder structure
- Shows only MP3 files (WAV hidden)
- Excludes "remaining" folder
- File count per folder
- Keyboard navigation (↑/↓/Enter/Backspace)

### 2. Audio Player
- HTML5 audio player
- Supports MP3 playback
- Shows filename and metadata

### 3. Transcript Comparison
- **Reference Transcript** (green border)
  - From CSV (original/correct)
  - Copy button
- **API Generated Transcript** (blue border)
  - From JSON (STT model output)
  - Copy button

### 4. Metadata Display
Shows from CSV:
- Age group
- Language variant
- Accent information
- Demographics

### 5. Annotation Form

**Transcript Evaluation:**
- Reference correct? (Yes/No)
- Model correct? (Yes/No)
- Ideal transcript (if both wrong)

**Error Categories:**
- Proper noun recognition
- Accent variation
- Numeric/date recognition
- Homophone confusion
- Foreign language >10%

**Audio Quality:**
- Speaker gender (pre-filled)
- Background noise
- Audio quality rating

**Notes:**
- Free-form observations

### 6. Annotation Storage
- JSONL format (one per line)
- Includes annotator username
- Includes timestamp
- Auto-loads on file selection

## Configuration

### For Development (Mac/Linux)

`webapp/config.local.js`:
```javascript
const config = {
    AUDIO_BASE_DIR: '../api_evaluator',
    TRANSCRIPTION_DIR: '../api_evaluator',
    PORT: 3002,
    DEBUG: true
};
```

### For Production (Windows)

`webapp/config.local.js`:
```javascript
const config = {
    AUDIO_BASE_DIR: 'D:\\cv_eval_bn\\validated',
    TRANSCRIPTION_DIR: 'D:\\cv_eval_bn\\validated',
    PORT: 3002,
    DEBUG: false
};
```

## Batch Transcription

### Setup

```bash
cd api_evaluator
pip install -r requirements.txt
```

### Update Config

`api_evaluator/config.local.py`:
```python
AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"
CSV_OUTPUT_PATH = r"D:\cv_eval_bn\transcription_path.csv"
SOCKET_URL = "https://voice.bangla.gov.bd:9394"
AUDIO_EXTENSIONS = ['.wav', '.flac']
```

### Run Batch Transcription

```bash
# Test single file first
python3 test_single_transcribe.py /path/to/audio.wav

# List available files
python3 list_audio_files.py

# Run batch (excludes "remaining" folder)
python3 batch_transcribe_v2.py
```

## Export Annotations

### To CSV

```bash
cd webapp
node export_annotations.js
```

Output: `webapp/annotations_export.csv`

### View JSONL

```bash
# View all
cat webapp/annotations.jsonl

# Count
wc -l webapp/annotations.jsonl

# Pretty print (requires jq)
cat webapp/annotations.jsonl | jq '.'

# Filter by annotator
cat webapp/annotations.jsonl | jq 'select(.annotator == "demo")'
```

## Keyboard Shortcuts

- **↑**: Previous file
- **↓**: Next file
- **Enter**: Open folder/file
- **Backspace**: Go back

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/logout` - Logout

### File Browsing
- `GET /api/browse?path=...` - List directory
- `GET /audio/*` - Stream audio file

### Data
- `GET /api/transcript?file=...` - Get API transcript
- `GET /api/reference?file=...` - Get reference data
- `GET /api/annotation?file=...` - Get annotation
- `POST /api/annotation` - Save annotation

## Data Flow

```
1. User selects audio file
   ↓
2. Parallel load:
   - MP3 audio
   - API transcript (JSON)
   - Reference data (CSV)
   - Existing annotation (JSONL)
   ↓
3. Display:
   - Audio player
   - Reference transcript (copy button)
   - API transcript (copy button)
   - Metadata (age, variant, accents, demographics)
   - Annotation form (pre-filled if exists)
   ↓
4. User reviews and annotates
   ↓
5. Click "Save Annotation"
   ↓
6. Append to annotations.jsonl:
   {
     ...form fields...,
     "annotator": "username",
     "timestamp": "2025-11-08T12:34:56.789Z"
   }
```

## Optimization

### CSV Optimization

Original: `filtered_csedu.csv` (8.7 MB, 15,455 records)  
Optimized: `webapp_reference.csv` (2 MB, 8,927 records)

**Excluded:**
- "remaining" bucket files (6,528 records)

**Included fields:**
- filename, sentence, age, gender, accents, variant, demog_group, bucket, duration_s

**To regenerate:**
```bash
cd api_evaluator
python3 create_filtered_csv.py
cp webapp_reference.csv ../webapp/
```

## Troubleshooting

### Server won't start
```bash
cd webapp
npm install
node server.js
```

### CSV not loading
- Check `webapp/webapp_reference.csv` exists
- Check console for "Loaded X reference records"

### Annotations not saving
- Check write permissions
- Check `webapp/annotations.jsonl` is created
- Check browser console for errors

### Audio not playing
- Check file path in config
- Check audio file exists
- Check browser supports MP3

### Python dependencies
```bash
pip install python-socketio[client] websocket-client
```

## Performance

- **CSV Load**: ~100ms (8,927 records)
- **Parallel Data Load**: ~200-300ms
- **Annotation Save**: ~10ms
- **File Navigation**: Instant

## Security

- Session-based authentication
- Path traversal protection
- Audio file access control
- CORS disabled (local use)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support

## Future Enhancements

- [ ] Annotation statistics dashboard
- [ ] Bulk annotation features
- [ ] Search/filter annotations
- [ ] Export to multiple formats
- [ ] Annotation comparison between users
- [ ] WER (Word Error Rate) calculation
- [ ] Automatic error categorization

## Support

For issues or questions:
1. Check documentation files
2. Review console logs
3. Check file permissions
4. Verify configuration

## License

Internal use only.
