# STT API Batch Transcription

This script processes all audio files in the `D:\Final_data_MRK\Modified` folder and generates transcripts using the STT API.

## Features

- Recursively scans for all audio files (WAV, FLAC, MP3, M4A, OGG)
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
1. Scan `D:\Final_data_MRK\Modified` for audio files
2. Check which files already have transcripts in `D:\Final_data_MRK\api_response`
3. Process remaining files one by one
4. Save JSON responses to `D:\Final_data_MRK\api_response\{filename}.json`
5. Append results to `D:\Final_data_MRK\transcription_results.csv`

## Output

### JSON Files
Each audio file gets a corresponding JSON file with the full API response:
- Location: `D:\Final_data_MRK\api_response\`
- Format: `{audio_filename}.json`

### CSV File
A single CSV file tracks all transcriptions:
- Location: `D:\Final_data_MRK\transcription_results.csv`
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

Edit these variables in `batch_transcribe.py` if needed:
```python
AUDIO_BASE_DIR = r"D:\Final_data_MRK\Modified"
API_RESPONSE_DIR = r"D:\Final_data_MRK\api_response"
CSV_OUTPUT_PATH = r"D:\Final_data_MRK\transcription_results.csv"
SOCKET_URL = "https://voice.bangla.gov.bd:9394"
```

## Error Handling

- Connection errors are logged to CSV with "ERROR" status
- Failed files can be retried by deleting their JSON file
- Progress is saved after each file to prevent data loss
