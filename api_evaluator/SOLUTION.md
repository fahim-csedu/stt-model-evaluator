# Solution: Use WAV Files

## The Problem
- Your previous batch with WAV files worked perfectly ✓
- MP3 files get stuck when sending to the API ✗
- The API clearly prefers WAV format

## The Solution
**Use WAV files only!**

The scripts have been updated to process only WAV and FLAC files by default.

## If You Have MP3 Files

### Option 1: Convert MP3 to WAV (Recommended)
Use external tools to convert your MP3 files to WAV before processing:

**Using ffmpeg (fastest, recommended):**
```bash
# Install ffmpeg first (if not installed)
# Windows: Download from https://ffmpeg.org/download.html
# Or use: choco install ffmpeg

# Convert single file
ffmpeg -i input.mp3 output.wav

# Batch convert all MP3 files in a folder
for %f in (*.mp3) do ffmpeg -i "%f" "%~nf.wav"
```

**Using online converters:**
- CloudConvert.com
- Online-Convert.com
- Zamzar.com

### Option 2: Skip MP3 Files
The batch script will automatically skip MP3 files and only process WAV/FLAC files.

## For Your Current Situation

Since you mentioned `D:\cv_eval_bn\validated` has multiple folders with MP3 files:

### Quick Solution:
1. **Check if you have WAV versions** of these files
2. **If not, batch convert** all MP3 to WAV using ffmpeg
3. **Run the batch script** - it will process WAV files

### Batch Conversion Script (Windows):

Create a file `convert_all_mp3.bat`:
```batch
@echo off
echo Converting all MP3 files to WAV...
echo.

for /r "D:\cv_eval_bn\validated" %%f in (*.mp3) do (
    echo Converting: %%f
    ffmpeg -i "%%f" "%%~dpnf.wav" -y
)

echo.
echo Conversion complete!
pause
```

This will:
- Find all MP3 files in all subfolders
- Convert each to WAV in the same location
- Keep the same filename (just change extension)

## Then Run Batch Transcription

Once you have WAV files:
```bash
python batch_transcribe_v2.py
```

It will:
- Find all WAV files in `D:\cv_eval_bn\validated`
- Process them through the API (which works with WAV!)
- Save transcripts in the same folders
- Generate the benchmark CSV

## Why WAV Works Better

1. **Uncompressed format** - No decoding needed by API
2. **Standard for audio processing** - Better compatibility
3. **Your previous batch proved it works** - Stick with what works!

## File Size Consideration

WAV files are larger than MP3:
- MP3: ~1 MB per minute
- WAV: ~10 MB per minute

But since the API works reliably with WAV, it's worth the extra storage.

## Summary

✓ **Do**: Use WAV files
✓ **Do**: Convert MP3 to WAV using ffmpeg
✓ **Do**: Run batch_transcribe_v2.py with WAV files

✗ **Don't**: Try to use MP3 files directly with this API
✗ **Don't**: Waste time debugging MP3 issues

The API works great with WAV - use that! 🎯
