# Changelog

## Version 1.0 - November 2025

### Major Changes

#### Documentation Consolidation
- ✅ Created single comprehensive `README.md`
- ✅ Removed 9 redundant documentation files
- ✅ All information now in one place

#### Annotation Storage Improvement
- ✅ Changed from single `annotations.jsonl` to individual JSON files
- ✅ Format: `{filename}_annotation.json`
- ✅ Stored in `webapp/annotations/` folder
- ✅ No overwrites - each file is separate
- ✅ Easy to backup and version control

#### Cleanup
- ✅ Removed 8 `.bat` files (Python scripts available)
- ✅ Cleaner directory structure
- ✅ Easier to navigate

### Features

#### Webapp
- Dual transcript display (reference vs API)
- Comprehensive annotation form (16 fields)
- Google Sheets integration (Copy Row Data button)
- Individual annotation file storage
- Metadata display from CSV
- Keyboard navigation
- Copy to clipboard functionality

#### Batch Transcription
- Process all folders except "remaining"
- Use WAV files for API calls
- Save JSON transcripts with audio files
- Skip already transcribed files
- Progress logging to CSV

#### Data Management
- Optimized CSV (8,927 records, 2 MB)
- Individual annotation files
- Export to CSV script
- Google Sheets template

### File Structure

```
stt-model-evaluator/
├── README.md                    # Comprehensive documentation
├── google_sheets_template_headers.txt
├── CHANGELOG.md                 # This file
│
├── api_evaluator/
│   ├── *.py                     # Python scripts
│   ├── requirements.txt
│   └── *.csv                    # Reference data
│
└── webapp/
    ├── server.js
    ├── export_annotations.js
    ├── annotations/             # Individual annotation files
    │   └── *_annotation.json
    └── public/
        ├── index.html
        ├── login.html
        ├── script.js
        └── style.css
```

### Breaking Changes

⚠️ **Annotation Storage Format Changed**

Old format:
- Single file: `annotations.jsonl`
- Append-only

New format:
- Individual files: `{filename}_annotation.json`
- One file per audio file
- Stored in `webapp/annotations/` folder

**Migration:** If you have existing `annotations.jsonl`, you'll need to split it into individual files.

### Improvements

- 📦 Cleaner directory (removed 17 files)
- 📝 Single source of documentation
- 💾 Better annotation storage (no overwrites)
- 🔧 Easier maintenance
- 📊 Simpler export process

### Technical Details

#### Annotation File Format

```json
{
  "filename": "audio_file_name",
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
  "notes": "Notes here",
  "annotator": "username",
  "timestamp": "2025-11-08T12:34:56.789Z"
}
```

#### API Changes

**POST /api/annotation**
- Now saves to `annotations/{filename}_annotation.json`
- Creates `annotations/` folder if needed
- Pretty-printed JSON (2-space indent)

**GET /api/annotation**
- Reads from `annotations/{filename}_annotation.json`
- Returns 404 if file doesn't exist

### Removed Files

**Documentation (9 files):**
- ANNOTATION_SYSTEM.md
- COMPLETE_GUIDE.md
- COPY_ROW_FEATURE.md
- FEATURE_SUMMARY.md
- GOOGLE_SHEETS_INTEGRATION.md
- IMPLEMENTATION_SUMMARY.md
- QUICK_START_GOOGLE_SHEETS.md
- REFERENCE_TRANSCRIPT_FEATURE.md
- WEBAPP_TEST_GUIDE.md

**Batch Files (8 files):**
- webapp/start.bat
- webapp/install.bat
- api_evaluator/run_batch_transcribe.bat
- api_evaluator/analyze_results.bat
- api_evaluator/run_latency_test.bat
- api_evaluator/install.bat
- api_evaluator/convert_all_mp3_to_wav.bat
- api_evaluator/run_batch_v2.bat

### Remaining Files

**Root:**
- README.md (comprehensive)
- google_sheets_template_headers.txt
- CHANGELOG.md

**Scripts:**
- All Python scripts (`.py`)
- All JavaScript files (`.js`)
- Configuration files

### Next Steps

1. Read `README.md` for complete documentation
2. Start server: `cd webapp && node server.js`
3. Begin annotating
4. Annotations save to `webapp/annotations/`
5. Export when done: `node export_annotations.js`

### Notes

- All functionality preserved
- Better organization
- Easier to maintain
- Single source of truth (README.md)
