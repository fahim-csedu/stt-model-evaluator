# STT Model Evaluator Web App

A web application for evaluating STT (Speech-to-Text) models by playing audio files and displaying transcriptions generated via API.

## Features

- Browse audio files from `D:\Final_data_MRK\Modified` directory
- Play audio files directly in the browser
- Automatically fetch transcriptions from STT API
- Save API responses as JSON files in `D:\Final_data_MRK\api_response`
- User authentication system
- Keyboard navigation support

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the application:
   - Copy `config.local.example.js` to `config.local.js`
   - Update paths and settings as needed

3. Start the server:
```bash
npm start
```

4. Access the application at `http://localhost:3002`

## Configuration

Edit `config.local.js` to customize:
- `AUDIO_BASE_DIR`: Path to audio files (default: `D:\Final_data_MRK\Modified`)
- `API_RESPONSE_DIR`: Path to save API responses (default: `D:\Final_data_MRK\api_response`)
- `STT_API_URL`: STT API endpoint (default: `https://voice.bangla.gov.bd:9394`)
- `PORT`: Server port (default: 3002)

## How It Works

1. The app lists audio files from the configured directory
2. When you select an audio file, it checks if a JSON response already exists
3. If not, it sends the audio to the STT API via Socket.IO
4. The API response is saved as a JSON file with the same name as the audio file
5. The transcript is extracted from the `predicted_words` array and displayed

## API Response Format

The app expects responses in this format:
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
      }
    ]
  }
}
```

The transcript is created by concatenating all `word` values from `predicted_words`.

## Default Login Credentials

- Username: `demo`
- Password: `Nz8&aU5hW2qS`

(See `server.js` for all available accounts)

## Keyboard Shortcuts

- `↑/↓`: Navigate files
- `Enter`: Open folder or play audio
- `Backspace`: Go back to parent directory
