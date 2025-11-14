# Validated Audio Files Webapp Setup

## Overview
The webapp has been updated to work with the validated audio files organized in 4 folders.

## Folder Structure
```
webapp/
├── validated/
│   ├── commonvoice_wer_error/    (100 WAV files)
│   ├── commonvoice_cer_error/    (100 WAV files)
│   ├── bntts_cer_error/          (100 WAV files)
│   └── bntts_wer_error/          (100 WAV files)
├── STT Stats - bntts highest error.csv
├── STT Stats - common voice highest error.csv
└── server.js
```

## Changes Made

### 1. Audio Organization Script (`organize_validated_audio.py`)
- Reads filenames from CSV files (Column A for WER, Column E for CER)
- Copies BNTTS WAV files from `D:\Final_data_MRK\Modified`
- Copies Common Voice WAV files from `D:\cv_eval_bn\validated` (searches recursively)
- Organizes 100 files into each of the 4 folders

### 2. Server Configuration (`webapp/config.local.js`)
- Updated `AUDIO_BASE_DIR` to point to `webapp/validated` folder
- This makes the webapp only show the 4 validated folders

### 3. Server Updates (`webapp/server.js`)

#### Reference Data Loading
- Now reads from both CSV files:
  - `STT Stats - bntts highest error.csv`
  - `STT Stats - common voice highest error.csv`
- Extracts filenames and transcripts from:
  - Column A (index 0): WER filenames
  - Column B (index 1): WER annotated text
  - Column E (index 4): CER filenames
  - Column F (index 5): CER annotated text

#### Browse Endpoint
- Only shows the 4 validated folders at root level
- Shows WAV files (instead of MP3)
- Counts only WAV files in folder statistics

#### Annotation Save
- Saves JSON files in the same folder as the audio file
- Also creates backup in `annotations/` folder
- Automatically detects which validated folder the file belongs to

## How to Use

### 1. Organize Audio Files
```bash
python organize_validated_audio.py
```

This will:
- Create the 4 folders in `webapp/validated/`
- Copy 100 WAV files to each folder
- Show progress for each file copied

### 2. Start the Webapp
```bash
cd webapp
npm start
```

### 3. Access the Webapp
- Open browser to `http://localhost:3002`
- Login with your credentials
- You'll see only the 4 validated folders
- Click on a folder to see the 100 audio files
- Select an audio file to:
  - Play the audio
  - View reference transcript (from CSV)
  - View model transcript (if JSON exists)
  - Annotate and save

### 4. Annotations
- When you annotate a file, it saves as `{filename}.json` in the same folder as the audio
- Example: `commonvoice_wer_error/common_voice_bn_31593821.json`
- Also backed up to `webapp/annotations/` folder

## Data Flow

1. **Audio Files**: Organized in 4 folders by error type
2. **Reference Transcripts**: Read from CSV files (Column B or F)
3. **Model Transcripts**: Read from JSON files in same folder as audio
4. **Annotations**: Saved as JSON in same folder as audio

## CSV File Format

Both CSV files have the same structure:
- **Column A**: WER filename
- **Column B**: WER annotated text (reference)
- **Column C**: WER generated text (model output)
- **Column D**: (empty)
- **Column E**: CER filename
- **Column F**: CER annotated text (reference)
- **Column G**: CER generated text (model output)

The webapp reads columns A, B, E, and F to get filenames and reference transcripts.
