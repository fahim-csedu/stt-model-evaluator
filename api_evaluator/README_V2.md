# STT Model Evaluator - Batch Transcription V2

Complete benchmark system for evaluating STT model performance.

## 🎯 What This Does

Processes audio files through the STT API and generates a comprehensive benchmark dataset with:
- Full transcripts
- Audio duration
- API response time (latency)
- Real-time factor calculations

Perfect for model evaluation and performance benchmarking!

## 📊 Output CSV Format

The CSV contains everything you need for benchmarking:

| Column | Description |
|--------|-------------|
| `audio_file_path` | Full path to audio file |
| `transcription_file_path` | Full path to JSON transcript |
| `transcript` | The transcribed text |
| `audio_length_seconds` | Audio duration |
| `api_response_time_seconds` | API processing time |

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Test API Latency (IMPORTANT!)
```bash
# Place sample.mp3 in this folder first
python test_api_latency.py
```

This shows you:
- How fast the API is
- Expected time for full batch
- Real-time factor

### 3. Run Batch Transcription
```bash
python batch_transcribe_v2.py
```

Processes all MP3 files in `D:\cv_eval_bn\validated` and saves:
- JSON transcripts next to each audio file
- CSV with all benchmark data

### 4. Analyze Results
```bash
python analyze_results.py
```

Get comprehensive statistics:
- Success rate
- Average RTF (Real-Time Factor)
- Throughput metrics
- Distribution analysis
- Sample transcripts

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `test_api_latency.py` | Test API with single file |
| `batch_transcribe_v2.py` | Process all files |
| `analyze_results.py` | Analyze benchmark data |
| `config.py` | Configuration settings |
| `QUICK_START.md` | Quick reference guide |
| `SAMPLE_OUTPUT.md` | Example output format |

## ⚙️ Configuration

Edit `config.py`:
```python
AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"
CSV_OUTPUT_PATH = r"D:\cv_eval_bn\transcription_path.csv"
SOCKET_URL = "https://voice.bangla.gov.bd:9394"
API_TIMEOUT = 120  # seconds
REQUEST_DELAY = 1  # seconds between requests
```

## 📈 Benchmark Metrics

### Real-Time Factor (RTF)
```
RTF = API Response Time / Audio Duration
```
- RTF < 1.0 = Faster than real-time ✓
- RTF = 1.0 = Real-time speed
- RTF > 1.0 = Slower than real-time

### Throughput
- Files processed per hour
- Audio hours processed per hour

### Quality Metrics (with ground truth)
- Word Error Rate (WER)
- Character Error Rate (CER)
- Accuracy by audio length

## 🔄 Resume Capability

The script automatically skips files that already have JSON transcripts. If interrupted:
1. Just run the script again
2. It will continue from where it stopped
3. CSV is updated after each file (crash-safe)

## 💡 Use Cases

1. **Model Benchmarking**: Compare different STT models
2. **Performance Testing**: Measure API latency and throughput
3. **Quality Evaluation**: Analyze transcription accuracy
4. **Capacity Planning**: Estimate processing time for large datasets
5. **Error Analysis**: Identify problematic audio characteristics

## 📝 Example Analysis

```python
import pandas as pd

df = pd.read_csv('D:/cv_eval_bn/transcription_path.csv')

# Calculate RTF
df['rtf'] = df['api_response_time_seconds'] / df['audio_length_seconds']

# Statistics
print(f"Average RTF: {df['rtf'].mean():.2f}x")
print(f"Total audio: {df['audio_length_seconds'].sum()/3600:.1f} hours")
print(f"Processing time: {df['api_response_time_seconds'].sum()/3600:.1f} hours")
```

## 🛠️ Troubleshooting

**Timeout errors**: Increase `API_TIMEOUT` in config.py

**Connection errors**: Check API endpoint and internet connection

**Slow processing**: Check RTF from latency test, consider parallel processing

**Memory issues**: Process in smaller batches by organizing into subfolders

## 📚 Documentation

- `QUICK_START.md` - Quick reference
- `TEST_INSTRUCTIONS.md` - Detailed testing guide
- `SAMPLE_OUTPUT.md` - Output format examples

## 🎓 Tips

1. **Always test latency first** with a sample file
2. **Monitor the first few files** to ensure everything works
3. **Use the analysis tool** to get insights from your data
4. **Keep the CSV safe** - it's your benchmark dataset!
5. **Compare results** across different model versions or configurations
