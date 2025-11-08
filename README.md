# STT Model Evaluator

A comprehensive web application for evaluating Speech-to-Text (STT) model performance with annotation capabilities and Google Sheets integration.

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Batch Transcription](#batch-transcription)
- [Annotation System](#annotation-system)
- [Google Sheets Integration](#google-sheets-integration)
- [Data Export](#data-export)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

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

### 3. Annotate

1. Browse and select audio files
2. Review reference vs API transcripts
3. Fill annotation form
4. Click "Copy Row Data" → Paste in Google Sheets
5. Click "Save Annotation" → Backup locally

---

## Features

### 🎵 Audio File Browser
- Navigate folder structure
- Shows only MP3 files (WAV hidden for API use)
- Excludes "remaining" folder automatically
- Keyboard navigation (↑/↓/Enter/Backspace)

### 📊 Dual Transcript Display
- **Reference Transcript** (green) - Original from CSV
- **API Generated Transcript** (blue) - STT model output
- Side-by-side comparison
- Copy buttons for both

### 📝 Comprehensive Annotation Form

**Basic Information:**
- Filename (auto-filled)
- Duration (auto-filled from CSV)

**Transcript Evaluation:**
- Reference Transcript Correct? (Yes/No)
- Model Transcript Correct? (Yes/No)
- Ideal Transcript (text field if both wrong)

**Error Categories:**
- Proper Noun Recognition
- Accent Variation
- Numeric/Date Recognition
- Homophone Confusion
- Foreign Language >10%

**Audio Quality:**
- Speaker Gender (pre-filled from CSV)
- Background Noise (None/Music/Crowd/Traffic/Echo)
- Audio Quality (Excellent/Good/Fair/Poor)

**Notes:**
- Free-form text area

### 📋 Google Sheets Integration
- **"Copy Row Data"** button copies all 16 fields
- Tab-separated format for direct paste
- Perfect for collaborative annotation
- Works alongside local save

### 💾 Annotation Storage
- Individual JSON files per audio file
- Format: `{filename}_annotation.json`
- Includes annotator username and timestamp
- Auto-loads when revisiting files

### 📈 Metadata Display
Shows from CSV:
- Age group
- Language variant
- Accent information
- Demographics

---

## Installation

### Webapp (Node.js)

```bash
cd webapp
npm install
```

### Batch Transcription (Python)

```bash
cd api_evaluator
pip install -r requirements.txt
```

**Requirements:**
- Node.js 14+
- Python 3.9+
- Modern browser (Chrome/Edge/Firefox/Safari)

---

## Configuration

### Webapp Configuration

Create `webapp/config.local.js`:

**For Development (Mac/Linux):**
```javascript
const config = {
    AUDIO_BASE_DIR: '../api_evaluator',
    TRANSCRIPTION_DIR: '../api_evaluator',
    PORT: 3002,
    DEBUG: true
};
module.exports = config;
```

**For Production (Windows):**
```javascript
const config = {
    AUDIO_BASE_DIR: 'D:\\cv_eval_bn\\validated',
    TRANSCRIPTION_DIR: 'D:\\cv_eval_bn\\validated',
    PORT: 3002,
    DEBUG: false
};
module.exports = config;
```

### Python Configuration

Create `api_evaluator/config.local.py`:

```python
AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"
CSV_OUTPUT_PATH = r"D:\cv_eval_bn\transcription_path.csv"
SOCKET_URL = "https://voice.bangla.gov.bd:9394"
AUDIO_EXTENSIONS = ['.wav', '.flac']
API_TIMEOUT = 120
REQUEST_DELAY = 1
```

---

## Usage

### Starting the Webapp

```bash
cd webapp
node server.js
```

Open http://localhost:3002 and login.

### Navigation

- **↑/↓**: Navigate between files
- **Enter**: Open folder/file
- **Backspace**: Go back to parent folder

### Annotation Workflow

1. **Select audio file** from browser
2. **Listen** to audio
3. **Compare** reference vs API transcripts
4. **Review** metadata (age, variant, accents)
5. **Fill** annotation form
6. **Copy Row Data** → Paste in Google Sheets (collaborative)
7. **Save Annotation** → Backup locally
8. **Move to next file**

---

## Batch Transcription

### Prepare CSV

Create optimized reference CSV (excludes "remaining" folder):

```bash
cd api_evaluator
python3 create_filtered_csv.py
cp webapp_reference.csv ../webapp/
```

**Result:**
- Original: 15,455 records (8.7 MB)
- Filtered: 8,927 records (2 MB)
- Excluded: "remaining" bucket files

### Test Single File

```bash
cd api_evaluator

# List available files
python3 list_audio_files.py

# Test single file
python3 test_single_transcribe.py /path/to/audio.wav
```

### Run Batch Transcription

```bash
cd api_evaluator
python3 batch_transcribe_v2.py
```

**Features:**
- Processes all folders except "remaining"
- Uses WAV files for API calls
- Saves JSON transcripts in same folder as audio
- Skips already transcribed files
- Logs progress to CSV

---

## Annotation System

### Storage Format

Annotations are saved as individual JSON files:

**Filename:** `{audio_filename}_annotation.json`

**Location:** Same folder as audio file

**Example:** `common_voice_bn_30704510_annotation.json`

**Content:**
```json
{
  "filename": "common_voice_bn_30704510",
  "duration": "9.6195",
  "refCorrect": "yes",
  "modelCorrect": "no",
  "idealTranscript": "",
  "properNoun": "yes",
  "accentVariation": "no",
  "numericDate": "no",
  "homophone": "no",
  "foreignLanguage": "no",
  "gender": "M",
  "backgroundNoise": "None",
  "audioQuality": "Good",
  "notes": "Company name recognition issue",
  "annotator": "demo",
  "timestamp": "2025-11-08T12:34:56.789Z"
}
```

### Benefits

✅ **No Overwrites**: Each file is separate  
✅ **Easy Backup**: Copy individual files  
✅ **Version Control**: Track changes per file  
✅ **Portable**: Move files with audio  
✅ **Simple**: Standard JSON format  

---

## Google Sheets Integration

### Setup Template

1. Create Google Sheet with "Data" tab
2. Add headers in Row 1:

```
Filename | Duration (seconds) | Reference Transcript | API Transcript | Reference Correct? | Model Correct? | Ideal Transcript | Proper Noun Recognition | Accent Variation | Numeric/Date Recognition | Homophone Confusion | Foreign Language >10% | Speaker Gender | Background Noise | Audio Quality | Notes
```

Or copy from `google_sheets_template_headers.txt`

### Using Copy Row Data

1. **Fill annotation form** in webapp
2. **Click "📋 Copy Row Data"** (green button)
3. **Open Google Sheets** → Data tab
4. **Click cell A2** (first empty row)
5. **Paste** (Ctrl+V or Cmd+V)
6. All 16 columns populate automatically!

### Data Format

Tab-separated values (TSV):
```
filename	duration	reference	api	refCorrect	modelCorrect	ideal	properNoun	accent	numeric	homophone	foreign	gender	noise	quality	notes
```

### Workflow Options

**Option A: Google Sheets Only**
```
Annotate → Copy Row Data → Paste → Next File
```

**Option B: Local Only**
```
Annotate → Save Annotation → Export Later
```

**Option C: Both (Recommended)**
```
Annotate → Copy Row Data → Paste → Save Annotation → Next File
```

---

## Data Export

### Export Annotations

Annotations are already in individual JSON files. To collect them:

```bash
# Find all annotation files
find . -name "*_annotation.json"

# Copy to export folder
mkdir annotations_export
find . -name "*_annotation.json" -exec cp {} annotations_export/ \;
```

### Convert to CSV

Use the export script:

```bash
cd webapp
node export_annotations.js
```

Output: `annotations_export.csv`

### From Google Sheets

```
File → Download → CSV
```

---

## API Reference

### Authentication

**POST /api/login**
```json
{
  "username": "demo",
  "password": "Nz8&aU5hW2qS"
}
```

**POST /api/logout**

### File Browsing

**GET /api/browse?path={path}**

Returns directory listing with folders and MP3 files.

**GET /audio/{path}**

Streams audio file (requires authentication).

### Data Retrieval

**GET /api/transcript?file={path}**

Returns API-generated transcript (JSON).

**GET /api/reference?file={path}**

Returns reference data from CSV:
```json
{
  "filename": "...",
  "sentence": "...",
  "age": "...",
  "gender": "...",
  "accents": "...",
  "variant": "...",
  "demog_group": "...",
  "bucket": "...",
  "duration_s": "..."
}
```

### Annotation Management

**GET /api/annotation?file={path}**

Returns existing annotation for file.

**POST /api/annotation**

Saves annotation:
```json
{
  "filename": "...",
  "duration": "...",
  "refCorrect": "yes/no",
  "modelCorrect": "yes/no",
  "idealTranscript": "...",
  "properNoun": "yes/no",
  "accentVariation": "yes/no",
  "numericDate": "yes/no",
  "homophone": "yes/no",
  "foreignLanguage": "yes/no",
  "gender": "M/F/Unknown",
  "backgroundNoise": "...",
  "audioQuality": "...",
  "notes": "..."
}
```

---

## Troubleshooting

### Server Won't Start

```bash
cd webapp
npm install
node server.js
```

Check for port conflicts (default: 3002).

### CSV Not Loading

- Verify `webapp/webapp_reference.csv` exists
- Check console: "Loaded X reference records"
- Regenerate: `python3 create_filtered_csv.py`

### Audio Not Playing

- Check file path in config
- Verify audio file exists
- Check browser supports MP3
- Check audio file permissions

### Annotations Not Saving

- Check write permissions in audio folder
- Check browser console for errors
- Verify authentication

### Copy Button Not Working

- Check browser clipboard permissions
- Try Chrome or Edge
- Verify HTTPS or localhost
- Check browser console

### Python Dependencies

```bash
pip install python-socketio[client] websocket-client
```

### Batch Transcription Errors

- Check API endpoint is accessible
- Verify WAV files exist
- Check network connection
- Review API timeout settings

---

## Directory Structure

```
stt-model-evaluator/
├── README.md                           # This file
├── google_sheets_template_headers.txt  # Template for Google Sheets
│
├── api_evaluator/
│   ├── batch_transcribe_v2.py         # Batch transcription
│   ├── test_single_transcribe.py      # Single file test
│   ├── list_audio_files.py            # List available files
│   ├── create_filtered_csv.py         # Create optimized CSV
│   ├── config.py                      # Default config
│   ├── config.local.py                # Local config (create this)
│   ├── requirements.txt               # Python dependencies
│   ├── filtered_csedu.csv             # Original CSV (8.7 MB)
│   └── webapp_reference.csv           # Optimized CSV (2 MB)
│
└── webapp/
    ├── server.js                      # Express server
    ├── config.js                      # Default config
    ├── config.local.js                # Local config (create this)
    ├── webapp_reference.csv           # Reference data
    ├── export_annotations.js          # Export script
    ├── package.json                   # Node dependencies
    └── public/
        ├── index.html                 # Main UI
        ├── login.html                 # Login page
        ├── script.js                  # Frontend logic
        └── style.css                  # Styling
```

---

## Performance

- **CSV Load**: ~100ms (8,927 records)
- **Parallel Data Load**: ~200-300ms
- **Annotation Save**: <10ms
- **Copy to Clipboard**: <10ms
- **File Navigation**: Instant

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Full | Recommended |
| Edge    | ✅ Full | Recommended |
| Firefox | ✅ Full | Works well |
| Safari  | ✅ Full | May prompt for clipboard permission |

---

## Security

- Session-based authentication
- Path traversal protection
- Audio file access control
- Clipboard API (secure)
- Local-only by default

---

## Demo Accounts

See `webapp/server.js` for full list. Examples:

- demo / Nz8&aU5hW2qS
- mehadi / Kx9#mP2vL8qR
- annoor / Zt4$nW7jF3xY

---

## License

Internal use only.

---

## Support

For issues:
1. Check this README
2. Review console logs (browser & server)
3. Verify configuration files
4. Check file permissions
5. Test with example files

---

## Quick Reference

### Start Server
```bash
cd webapp && node server.js
```

### Test Single File
```bash
cd api_evaluator && python3 test_single_transcribe.py /path/to/file.wav
```

### Run Batch
```bash
cd api_evaluator && python3 batch_transcribe_v2.py
```

### Export Annotations
```bash
cd webapp && node export_annotations.js
```

### Create Filtered CSV
```bash
cd api_evaluator && python3 create_filtered_csv.py
```

---

**Version:** 1.0  
**Last Updated:** November 2025
