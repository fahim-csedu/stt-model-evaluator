# MP3 vs WAV for STT API

## The Issue

If your test gets stuck at "Sending audio data", it's likely due to:

1. **Format Compatibility**: The API might not properly handle MP3 format
2. **File Size**: MP3 files, when base64 encoded, become ~33% larger
3. **Processing**: The API might need to decode MP3 before processing

## Why WAV is Better for Testing

### Advantages of WAV:
- ✓ Uncompressed, no decoding needed
- ✓ Standard format for audio processing
- ✓ Better compatibility with STT systems
- ✓ No compression artifacts

### Disadvantages of WAV:
- ✗ Larger file size (10x larger than MP3)
- ✗ Takes longer to upload

### Advantages of MP3:
- ✓ Smaller file size
- ✓ Faster upload

### Disadvantages of MP3:
- ✗ Compressed format
- ✗ May require decoding by API
- ✗ Potential compatibility issues
- ✗ Compression artifacts

## Recommendation

### For Testing:
Use **WAV format** with short clips (5-30 seconds)
- Ensures compatibility
- Easier to debug
- Faster to identify issues

### For Production:
- If WAV works: Use WAV for best quality
- If MP3 works: Use MP3 for efficiency
- Test both formats to see what works

## File Size Comparison

Example: 30-second audio

| Format | Size | Base64 Encoded | Upload Time (1 Mbps) |
|--------|------|----------------|---------------------|
| WAV    | ~3 MB | ~4 MB | ~32 seconds |
| MP3    | ~500 KB | ~667 KB | ~5 seconds |

## Converting MP3 to WAV

### Option 1: Using Python (pydub)
```bash
pip install pydub
python convert_to_wav.py your_file.mp3
```

### Option 2: Using ffmpeg
```bash
ffmpeg -i input.mp3 output.wav
```

### Option 3: Online Converters
- CloudConvert
- Online-Convert
- Zamzar

## Testing Strategy

1. **Start with WAV**: Convert a short MP3 to WAV and test
2. **If WAV works**: The API is functional, format is the issue
3. **Test MP3**: Try the same audio as MP3
4. **Compare**: See if MP3 works or has issues
5. **Decide**: Choose format based on results

## For Batch Processing

If you have thousands of MP3 files:

### If WAV works but MP3 doesn't:
- Convert all MP3 to WAV first (batch conversion)
- Or convert on-the-fly during processing
- Trade-off: Storage space vs compatibility

### If MP3 works:
- Use MP3 directly
- Faster processing
- Less storage needed

## Quick Test

```bash
# 1. Convert your test MP3 to WAV
python convert_to_wav.py common_voice_bn_30704510.mp3

# 2. Update test script to use WAV
# Edit test_api_latency_debug.py:
# TEST_AUDIO_FILE = "./common_voice_bn_30704510.wav"

# 3. Run test
python test_api_latency_debug.py
```

## Expected Results

### If WAV works:
```
✓ Connected to server (took 0.35s)
✓ Audio data sent, waiting for response...
✓ Received response (took 3.21s)
✓ Transcription successful!
```

### If still stuck:
- File might be too large
- Network issues
- API timeout
- See TROUBLESHOOTING.md
