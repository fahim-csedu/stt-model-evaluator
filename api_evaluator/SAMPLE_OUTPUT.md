# Sample Output Format

## CSV Structure

The `transcription_path.csv` file will contain the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| `audio_file_path` | Full path to the audio file | `D:\cv_eval_bn\validated\folder1\audio001.mp3` |
| `transcription_file_path` | Full path to the JSON transcript | `D:\cv_eval_bn\validated\folder1\audio001.json` |
| `transcript` | The transcribed text (concatenated words) | `হাই আমি এখানে আপনার টাইপ করা যেকোনো লেখা পড়তে পারি` |
| `audio_length_seconds` | Duration of the audio in seconds | `27.45` |
| `api_response_time_seconds` | Time taken by API to process | `3.21` |

## Sample CSV Content

```csv
audio_file_path,transcription_file_path,transcript,audio_length_seconds,api_response_time_seconds
D:\cv_eval_bn\validated\folder1\audio001.mp3,D:\cv_eval_bn\validated\folder1\audio001.json,হাই আমি এখানে আপনার টাইপ করা যেকোনো লেখা পড়তে পারি,27.45,3.21
D:\cv_eval_bn\validated\folder1\audio002.mp3,D:\cv_eval_bn\validated\folder1\audio002.json,বাংলাদেশ একটি সুন্দর দেশ,15.32,2.15
D:\cv_eval_bn\validated\folder2\audio003.mp3,D:\cv_eval_bn\validated\folder2\audio003.json,আমরা বাংলায় কথা বলি,18.67,2.89
```

## JSON File Structure

Each audio file gets a corresponding JSON file with the full API response:

```json
{
  "index": "0",
  "output": {
    "predicted_words": [
      {
        "word": "হাই",
        "char_scores": [["হ", 98.894], ["া", 99.6], ["ই", 61.933]],
        "is_confident": true,
        "timestamp": [2560, 8000]
      },
      {
        "word": " ",
        "char_scores": [[" ", 99.843]],
        "is_confident": true,
        "timestamp": [8000, 8320]
      },
      {
        "word": "আমি",
        "char_scores": [["আ", 99.904], ["ম", 99.912], ["ি", 99.887]],
        "is_confident": true,
        "timestamp": [12480, 16000]
      }
    ]
  }
}
```

## Use Cases for Benchmark Data

With this CSV, you can:

1. **Calculate Real-Time Factor (RTF)**:
   ```
   RTF = api_response_time_seconds / audio_length_seconds
   ```
   - RTF < 1.0 = Faster than real-time
   - RTF = 1.0 = Real-time
   - RTF > 1.0 = Slower than real-time

2. **Analyze Performance by Audio Length**:
   - Group by audio length ranges
   - See if longer audios take proportionally longer

3. **Quality Evaluation**:
   - Compare transcripts with ground truth
   - Calculate WER (Word Error Rate)
   - Analyze character-level accuracy

4. **Throughput Analysis**:
   - Total processing time
   - Average time per file
   - Files processed per hour

5. **Error Analysis**:
   - Files that failed (marked as ERROR)
   - Correlation between file size and success rate

## Example Analysis

```python
import pandas as pd

# Load the CSV
df = pd.read_csv('D:/cv_eval_bn/transcription_path.csv')

# Calculate RTF
df['rtf'] = df['api_response_time_seconds'] / df['audio_length_seconds']

# Statistics
print(f"Average RTF: {df['rtf'].mean():.2f}x")
print(f"Median RTF: {df['rtf'].median():.2f}x")
print(f"Total audio duration: {df['audio_length_seconds'].sum() / 3600:.2f} hours")
print(f"Total processing time: {df['api_response_time_seconds'].sum() / 3600:.2f} hours")
print(f"Success rate: {(df['transcription_file_path'] != 'ERROR').sum() / len(df) * 100:.1f}%")
```
