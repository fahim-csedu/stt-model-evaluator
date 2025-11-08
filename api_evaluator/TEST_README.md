# Testing Single File Transcription

## Step 1: List Available Audio Files

First, see what audio files are available:

```bash
python3 list_audio_files.py
```

This will show you the first 10 audio files. To see more:

```bash
python3 list_audio_files.py 20
```

## Step 2: Test Single File Transcription

Copy the path of a WAV file from the list and test it:

```bash
python3 test_single_transcribe.py "/path/to/audio.wav"
```

Example (Windows):
```bash
python3 test_single_transcribe.py "D:\cv_eval_bn\validated\folder1\audio.wav"
```

Example (Mac/Linux):
```bash
python3 test_single_transcribe.py "/Users/username/validated/folder1/audio.wav"
```

## What the Test Script Does

1. Connects to the STT API
2. Reads and encodes the audio file
3. Sends it to the API
4. Waits for the transcription result
5. Saves the JSON response next to the audio file
6. Displays the transcript

## Troubleshooting

If you get errors, the script will show:
- Connection errors
- File not found errors
- API timeout errors
- Any other exceptions with full stack trace

This helps identify what's going wrong before running the batch script.

## After Successful Test

Once a single file works, you can run the full batch script:

```bash
python3 batch_transcribe_v2.py
```
