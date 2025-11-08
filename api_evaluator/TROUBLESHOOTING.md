# Troubleshooting Guide

## Issue: Script Gets Stuck at "Sending audio data"

### Possible Causes:

1. **File Format Issues**
   - The API might prefer WAV format over MP3
   - MP3 encoding might not be compatible with the API

2. **File Size Too Large**
   - API might have size limits (e.g., 10MB max)
   - Large files take longer to upload and process

3. **Network Issues**
   - Slow internet connection
   - Firewall blocking the connection
   - API server not responding

4. **API Rate Limiting**
   - Too many requests in short time
   - API might be throttling your connection

### Solutions:

#### 1. Try WAV Format First

Convert your MP3 to WAV:
```python
from pydub import AudioSegment

audio = AudioSegment.from_mp3("sample.mp3")
audio.export("sample.wav", format="wav")
```

Or use online converters, or ffmpeg:
```bash
ffmpeg -i sample.mp3 sample.wav
```

#### 2. Use a Smaller Test File

Try with a very short audio file first (< 5 seconds, < 1MB):
- This helps isolate if the issue is file size related
- If small files work, gradually increase size

#### 3. Use the Debug Script

Run the enhanced debug version:
```bash
python test_api_latency_debug.py
```

This provides:
- Detailed progress logging
- Event tracking
- Better timeout handling
- Troubleshooting tips

#### 4. Check the Original API Test

The original `api_test.py` uses WAV files. Try running it:
```bash
python ../api_test.py
```

If that works, the issue is likely format-related.

#### 5. Test with Streaming Instead of Upload

The API supports two modes:
- `audio_transmit_upload` - Upload entire file at once
- `audio_transmit` - Stream in chunks

Try the streaming approach for large files:

```python
def test_streaming(audio_path, chunk_size=32000):
    with open(audio_path, "rb") as f:
        data = f.read()
    
    chunks = [data[i:i + chunk_size] for i in range(0, len(data), chunk_size)]
    
    for i, chunk in enumerate(chunks):
        payload = {
            "index": i,
            "audio": base64.b64encode(chunk).decode('utf-8'),
            "endOfStream": i == len(chunks) - 1
        }
        sio.emit("audio_transmit", payload)
        time.sleep(0.1)
```

### Recommended Testing Sequence:

1. **Start Small**: Test with a 3-5 second WAV file
2. **Check Format**: If MP3 doesn't work, convert to WAV
3. **Increase Size**: Gradually test larger files
4. **Monitor**: Use debug script to see where it gets stuck
5. **Adjust Timeout**: Increase timeout for larger files

### File Size Guidelines:

| Audio Length | Approx Size (WAV) | Approx Size (MP3) | Recommended |
|--------------|-------------------|-------------------|-------------|
| 5 seconds    | ~500 KB          | ~80 KB            | ✓ Good for testing |
| 30 seconds   | ~3 MB            | ~500 KB           | ✓ Should work |
| 1 minute     | ~6 MB            | ~1 MB             | ⚠️ Might be slow |
| 2 minutes    | ~12 MB           | ~2 MB             | ⚠️ May timeout |
| 5+ minutes   | ~30+ MB          | ~5+ MB            | ✗ Likely too large |

### Common Error Messages:

**"Timeout waiting for response"**
- File too large
- API processing taking too long
- Network issues
- Solution: Try smaller file or increase timeout

**"Connection error"**
- API endpoint unreachable
- SSL certificate issues
- Firewall blocking
- Solution: Check network, try different network

**Gets stuck without error**
- API not responding to this format
- File encoding issue
- Solution: Try WAV format, use debug script

### Quick Test Commands:

```bash
# Test with debug mode
python test_api_latency_debug.py

# Check if API is reachable
curl -I https://voice.bangla.gov.bd:9394

# Test with original script (uses WAV)
python ../api_test.py
```

### If Nothing Works:

1. Check if the API documentation specifies:
   - Supported formats
   - Maximum file size
   - Rate limits
   - Required headers or authentication

2. Contact API provider for:
   - Format requirements
   - Size limitations
   - Expected response times

3. Consider alternative approaches:
   - Process files in smaller chunks
   - Use streaming mode instead of upload
   - Pre-process audio (resample, compress)
