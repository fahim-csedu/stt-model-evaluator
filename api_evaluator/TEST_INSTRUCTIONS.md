# Testing Instructions

## Step 1: Test API Latency

Before running the batch transcription, test the API with a sample MP3 file to check latency.

### Setup:
1. Place a sample MP3 file in the `api_evaluator` folder
2. Rename it to `sample.mp3` (or update the filename in `test_api_latency.py`)

### Run the test:
```bash
python test_api_latency.py
```

### What it measures:
- Connection time
- Data preparation time
- API processing time
- Total time
- Real-time factor (how fast compared to audio duration)

### Expected output:
```
STT API LATENCY TEST
================================================================================
API endpoint: https://voice.bangla.gov.bd:9394
Test file: sample.mp3
================================================================================

File Information:
  Size: 0.45 MB
  Estimated duration: 27.0 seconds

Starting transcription test...

  Reading audio file...
  File size: 0.45 MB
  Connecting to API...
  ✓ Connected to server (took 0.35s)
  Sending audio data...
  ✓ Received response (took 3.21s)
  ✓ Disconnected from server

================================================================================
TEST RESULTS
================================================================================
✓ Transcription successful!

Transcript: হাই আমি এখানে আপনার টাইপ করা যেকোনো লেখা পড়তে পারি

Connection time:    0.35s
Preparation time:   0.02s
API processing:     3.21s
Total time:         3.58s

Real-time factor:   0.13x
  → Faster than real-time!

Full test results saved to: test_result.json
================================================================================
```

## Step 2: Review Test Results

Check the `test_result.json` file for detailed timing information and API response structure.

## Step 3: Run Batch Transcription

Once you're satisfied with the latency, run the batch transcription:

```bash
python batch_transcribe_v2.py
```

### What it does:
1. Scans `D:\cv_eval_bn\validated` for all MP3 files (recursively)
2. Checks which files already have `.json` transcripts
3. Processes remaining files one by one
4. Saves JSON transcripts in the same folder as the audio file
5. Updates `D:\cv_eval_bn\transcription_path.csv` with:
   - Audio file path
   - Transcription file path
   - Audio length (seconds)
   - API response time (seconds)

### Resume capability:
If interrupted, simply run the script again. It will skip files that already have JSON transcripts.

## Configuration

Edit `config.py` to change paths:
```python
AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"
CSV_OUTPUT_PATH = r"D:\cv_eval_bn\transcription_path.csv"
```

## Notes

- The script saves transcripts in the same folder as the audio files
- CSV is updated after each successful transcription (crash-safe)
- API response time is measured for each file
- Estimated audio duration is calculated from file size for MP3 files
- Actual duration is extracted from API response when available
