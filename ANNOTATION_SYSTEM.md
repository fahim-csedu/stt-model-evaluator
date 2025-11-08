# Annotation System Documentation

## Overview

The webapp now includes a comprehensive annotation system for evaluating STT model performance. Annotations are saved per file and can be loaded when revisiting files.

## Features

### 1. Optimized CSV Loading
- **New CSV**: `webapp_reference.csv` (2 MB vs 8.7 MB original)
- **Filtered**: Excludes "remaining" bucket files
- **Reduced from**: 15,455 records → 8,927 records
- **Fields included**: filename, sentence, age, gender, accents, variant, demog_group, bucket, duration_s

### 2. Metadata Display
Shows additional context from CSV:
- **Age**: Speaker age group
- **Variant**: Language variant
- **Accents**: Accent information
- **Demographics**: Demographic group

### 3. Annotation Fields

#### Basic Information
- **Filename**: Auto-filled (read-only)
- **Duration**: Auto-filled from CSV (read-only)

#### Transcript Evaluation
- **Reference Transcript Correct?**: Yes/No
- **Model Transcript Correct?**: Yes/No
- **Ideal Transcript**: Text field (only fill if both are incorrect)

#### Error Categories
- **Proper Noun Recognition**: Yes/No
- **Accent Variation**: Yes/No
- **Numeric/Date Recognition**: Yes/No
- **Homophone Confusion**: Yes/No
- **Contains >10% Foreign Language?**: Yes/No

#### Audio Quality
- **Speaker Gender**: M/F/Unknown (pre-filled from CSV)
- **Background Noise**: None/Music/Crowd/Traffic/Echo
- **Audio Quality**: Excellent/Good/Fair/Poor

#### Additional Notes
- **Notes**: Free-form text area for observations

### 4. Copy Functionality
- **Copy Reference**: Copies reference transcript to clipboard
- **Copy API**: Copies API transcript to clipboard
- Visual feedback (✓) when copied

### 5. Annotation Storage
- **Format**: JSONL (JSON Lines) - one annotation per line
- **File**: `webapp/annotations.jsonl`
- **Metadata**: Includes annotator username and timestamp
- **Persistence**: Latest annotation per file is loaded automatically

## Data Flow

```
1. User selects audio file
   ↓
2. System loads:
   - MP3 audio
   - API transcript (JSON)
   - Reference data (CSV)
   - Existing annotation (if any)
   ↓
3. Display:
   - Audio player
   - Reference transcript (with copy button)
   - API transcript (with copy button)
   - Metadata (age, variant, accents, demographics)
   - Annotation form (pre-filled if exists)
   ↓
4. User annotates
   ↓
5. Click "Save Annotation"
   ↓
6. Saved to annotations.jsonl with:
   - All form fields
   - Annotator username
   - Timestamp
```

## Annotation File Format

Each line in `annotations.jsonl`:

```json
{
  "filename": "common_voice_bn_30704510",
  "duration": "9.6195",
  "refCorrect": "yes",
  "modelCorrect": "no",
  "idealTranscript": "",
  "properNoun": "yes",
  "accentVariation": "no",
  "numericDate": "no",
  "homophone": "no",
  "foreignLanguage": "no",
  "gender": "M",
  "backgroundNoise": "None",
  "audioQuality": "Good",
  "notes": "Company name recognition issue",
  "annotator": "demo",
  "timestamp": "2025-11-08T12:34:56.789Z"
}
```

## API Endpoints

### GET /api/reference
Returns reference data for a file:
```json
{
  "filename": "common_voice_bn_30704510",
  "sentence": "এ সময়ে \"দ্য বেঙ্গল রিভার সার্ভিস কোম্পানি\" নামে...",
  "age": "thirties",
  "gender": "male_masculine",
  "accents": "",
  "variant": "",
  "demog_group": "male_masculine|thirties|unknown_accent",
  "bucket": "bucket_01",
  "duration_s": "9.6195"
}
```

### POST /api/annotation
Saves an annotation (requires authentication)

### GET /api/annotation
Retrieves the latest annotation for a file

## Usage Workflow

1. **Login** with credentials
2. **Navigate** to audio files
3. **Select** an audio file
4. **Review**:
   - Listen to audio
   - Compare reference vs API transcripts
   - Check metadata
5. **Annotate**:
   - Fill in evaluation fields
   - Add notes if needed
6. **Save** annotation
7. **Move to next file** (use arrow keys for quick navigation)

## Keyboard Shortcuts

- **↑/↓**: Navigate between files
- **Enter**: Open selected folder/file
- **Backspace**: Go back to parent folder

## Pre-filled Fields

The system automatically pre-fills:
- **Filename**: From selected file
- **Duration**: From CSV
- **Gender**: Parsed from CSV gender field
  - "male_masculine" → M
  - "female" → F
  - Others → Unknown

## Export Annotations

Annotations are stored in `webapp/annotations.jsonl`. To export:

```bash
# View all annotations
cat webapp/annotations.jsonl

# Convert to CSV (using jq)
cat webapp/annotations.jsonl | jq -r '[.filename, .refCorrect, .modelCorrect, .annotator, .timestamp] | @csv'

# Count annotations
wc -l webapp/annotations.jsonl
```

## Benefits

✅ **Efficient**: Reduced CSV size (77% smaller)  
✅ **Fast**: Parallel loading of all data  
✅ **Persistent**: Annotations saved and reloaded  
✅ **Comprehensive**: All requested evaluation fields  
✅ **User-friendly**: Copy buttons, pre-filled fields, keyboard shortcuts  
✅ **Traceable**: Includes annotator and timestamp  
✅ **Flexible**: JSONL format easy to process  

## Files Modified/Created

1. `api_evaluator/create_filtered_csv.py` - Script to create optimized CSV
2. `api_evaluator/webapp_reference.csv` - Optimized reference data
3. `webapp/webapp_reference.csv` - Copy for webapp use
4. `webapp/server.js` - Updated CSV loading, added annotation endpoints
5. `webapp/public/index.html` - Added annotation form
6. `webapp/public/script.js` - Added annotation logic
7. `webapp/public/style.css` - Added annotation styling
8. `webapp/annotations.jsonl` - Annotation storage (created on first save)
