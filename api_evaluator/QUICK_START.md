# Quick Start Guide

## Prerequisites

Install dependencies:
```bash
pip install -r requirements.txt
```

## Step 1: Test API Latency (IMPORTANT!)

Before processing thousands of files, test with a single MP3:

1. **Place a sample MP3 file** in this folder and name it `sample.mp3`
2. **Run the test**:
   ```bash
   python test_api_latency.py
   ```
   Or double-click: `run_latency_test.bat`

3. **Check the results**:
   - Look at the console output for timing information
   - Check `test_result.json` for detailed results
   - Note the "Real-time factor" - this tells you how fast the API is

### What to look for:
- **Real-time factor < 1.0**: API is faster than real-time (good!)
- **Real-time factor > 1.0**: API is slower than real-time (might take a while for large batches)
- **API processing time**: How long the API takes to process the audio

### Example:
If you have 1000 files averaging 30 seconds each:
- Real-time factor 0.5x → ~4 hours total
- Real-time factor 1.0x → ~8 hours total
- Real-time factor 2.0x → ~16 hours total

## Step 2: Run Batch Transcription

Once you're satisfied with the latency:

```bash
python batch_transcribe_v2.py
```
Or double-click: `run_batch_v2.bat`

### What happens:
1. Scans `D:\cv_eval_bn\validated` for MP3 files
2. Skips files that already have `.json` transcripts
3. Processes each file and saves transcript in the same folder
4. Updates CSV with: audio path, transcript path, transcript text, audio length, API response time

### Output:
- **JSON files**: Saved next to each audio file (e.g., `audio.mp3` → `audio.json`)
- **CSV file**: `D:\cv_eval_bn\transcription_path.csv`
  - Columns: audio_file_path, transcription_file_path, transcript, audio_length_seconds, api_response_time_seconds
  - Perfect for benchmarking and model evaluation!

### Resume:
If interrupted, just run again - it skips already processed files!

## Configuration

Edit `config.py` to change:
- `AUDIO_BASE_DIR`: Root folder with audio files
- `CSV_OUTPUT_PATH`: Where to save the CSV
- `API_TIMEOUT`: How long to wait for API response (default: 120s)
- `REQUEST_DELAY`: Delay between requests (default: 1s)

## Step 3: Analyze Results

After processing, analyze the benchmark data:

```bash
python analyze_results.py
```
Or double-click: `analyze_results.bat`

### What you get:
- Success/failure statistics
- Audio duration statistics (total, average, min, max)
- API processing time statistics
- Real-Time Factor (RTF) analysis
- Throughput metrics (files/hour, audio hours/hour)
- Distribution by audio length
- Sample transcripts

This gives you a complete benchmark report!

## Monitoring Progress

The script shows:
- Current file being processed
- Progress (e.g., [45/1000])
- API response time for each file
- Success/failure status

## Troubleshooting

**"Timeout waiting for response"**
- Increase `API_TIMEOUT` in `config.py`
- Check your internet connection
- Verify the API is accessible

**"Connection error"**
- Check if the API endpoint is correct
- Verify SSL certificate settings
- Try running the latency test first

**Script is too slow**
- Check the real-time factor from the latency test
- Consider running multiple instances in parallel (different folders)
- Adjust `REQUEST_DELAY` if needed
