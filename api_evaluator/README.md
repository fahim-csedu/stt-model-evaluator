# STT API Batch Transcription

This script processes all audio files in the `D:\cv-corpus-23.0-2025-09-05\bn\clips` folder and generates transcripts using the STT API.

## Features

- Recursively scans for all audio files (WAV, FLAC, MP3, M4A, OGG)
- Maintains nested folder structure in output directory
- Skips files that already have transcripts (resume capability)
- Saves full API responses as JSON files
- Generates a CSV with audio path, transcript path, transcript text, and duration
- Handles interruptions gracefully - CSV is updated after each file
- Progress tracking and error logging

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Run the script:
```bash
python batch_transcribe.py
```

The script will:
1. Scan `D:\cv-corpus-23.0-2025-09-05\bn\clips` for audio files (recursively)
2. Check which files already have transcripts in `D:\cv-corpus-23.0-2025-09-05\bn\csedu_labels`
3. Process remaining files one by one
4. Save JSON responses to `D:\cv-corpus-23.0-2025-09-05\bn\csedu_labels\` (maintaining folder structure)
5. Append results to `D:\cv-corpus-23.0-2025-09-05\bn\transcription_results.csv`

## Output

### JSON Files
Each audio file gets a corresponding JSON file with the full API response:
- Location: `D:\cv-corpus-23.0-2025-09-05\bn\csedu_labels\`
- Format: Maintains same folder structure as clips (e.g., `subfolder/audio.mp3` → `subfolder/audio.json`)

### CSV File
A single CSV file tracks all transcriptions:
- Location: `D:\cv-corpus-23.0-2025-09-05\bn\transcription_results.csv`
- Columns:
  - `audio_file_path`: Full path to audio file
  - `transcript_file_path`: Full path to JSON response
  - `transcript`: Concatenated transcript text
  - `duration_seconds`: Audio duration
  - `timestamp`: When the transcription was completed

## Resume Capability

If the script is interrupted:
- Already processed files are skipped on restart
- CSV contains all completed transcriptions
- Simply run the script again to continue

## Configuration

Edit these variables in `config.py` if needed:
```python
AUDIO_BASE_DIR = r"D:\cv-corpus-23.0-2025-09-05\bn\clips"
API_RESPONSE_DIR = r"D:\cv-corpus-23.0-2025-09-05\bn\csedu_labels"
CSV_OUTPUT_PATH = r"D:\cv-corpus-23.0-2025-09-05\bn\transcription_results.csv"
SOCKET_URL = "https://voice.bangla.gov.bd:9394"
```

## Error Handling

- Connection errors are logged to CSV with "ERROR" status
- Failed files can be retried by deleting their JSON file
- Progress is saved after each file to prevent data loss
