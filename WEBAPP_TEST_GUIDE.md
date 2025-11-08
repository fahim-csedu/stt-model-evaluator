# Webapp Test Guide

## Current Setup

The webapp is configured to work with your example files in the `api_evaluator` folder.

### Example Files
- `common_voice_bn_30704510.mp3` - Audio file for playback
- `common_voice_bn_30704510.wav` - Audio file for API (hidden in UI)
- `common_voice_bn_30704510.json` - Transcript data

## How It Works

### 1. File Display
- The webapp shows only **MP3 files** in the UI
- WAV files are hidden (they're only used for API calls)
- The "remaining" folder is excluded from browsing

### 2. Transcript Display
When you click on an MP3 file, the webapp:
1. Plays the MP3 audio
2. Loads the JSON file with the same filename
3. Extracts the transcript from `output.predicted_words`
4. Displays the full sentence by joining all word objects

### 3. JSON Structure
The transcript is extracted from:
```json
{
  "output": {
    "predicted_words": [
      { "word": "এ" },
      { "word": " " },
      { "word": "সময়ে" },
      ...
    ]
  }
}
```

The webapp joins all `word` values to create the full transcript sentence.

## Testing Locally

### Start the Webapp
```bash
cd webapp
npm install
node server.js
```

### Access the Webapp
1. Open browser: http://localhost:3002
2. Login with demo credentials:
   - Username: `demo`
   - Password: `Nz8&aU5hW2qS`

### Test with Example Files
The webapp is currently pointing to `../api_evaluator` which contains your example files.

## For Production (Windows)

Update `webapp/config.local.js`:
```javascript
const config = {
    AUDIO_BASE_DIR: 'D:\\cv_eval_bn\\validated',
    TRANSCRIPTION_DIR: 'D:\\cv_eval_bn\\validated',
    PORT: 3002,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    DEBUG: true
};
```

## Expected Behavior

✅ Shows folders inside validated directory  
✅ Hides "remaining" folder  
✅ Shows only MP3 files (not WAV)  
✅ Plays MP3 when clicked  
✅ Displays **two transcripts side-by-side**:
   - **Reference Transcript** (from filtered_csedu.csv)
   - **API Generated Transcript** (from JSON file)
✅ Transcript shows full sentence (all words joined)  
✅ Cannot navigate above validated directory  

## Transcript Comparison

For the example file `common_voice_bn_30704510.mp3`:

**Reference Transcript (Original):**
```
এ সময়ে "দ্য বেঙ্গল রিভার সার্ভিস কোম্পানি" নামে নৌ-পরিবহন সংস্থা এবং নৌ-পরিবহন বীমা কোম্পানি প্রতিষ্ঠা করেন।
```

**API Generated Transcript:**
```
এ সময়ে দ্য বেঙ্গল রিভার সার্ভিস কোম্পানি নামে নৌ পরিবহন সংস্থা এবং নৌ পরিবহন বিমা কোম্পানি প্রতিষ্ঠা করে
```

This allows users to compare the STT model output with the original reference transcript.
