# Reference Transcript Feature

## Overview

The webapp now displays **two transcripts side-by-side** for comparison:

1. **Reference Transcript** - The original/correct transcript from `filtered_csedu.csv`
2. **API Generated Transcript** - The STT model output from the JSON file

## How It Works

### Backend (server.js)

1. **CSV Loading**: On startup, the server loads all reference transcripts from `filtered_csedu.csv`
   - Parses the CSV file
   - Stores transcripts in a Map indexed by filename
   - Logs the count of loaded transcripts

2. **New API Endpoint**: `/api/reference`
   - Takes a file path as parameter
   - Returns the reference transcript from the CSV
   - Returns 404 if not found

### Frontend (index.html + script.js)

1. **Two Transcript Sections**:
   - Reference Transcript (top) - Green border, light gray background
   - API Generated Transcript (bottom) - Blue border, white background

2. **Parallel Loading**:
   - Both transcripts are fetched simultaneously using `Promise.all()`
   - Faster loading experience

3. **Visual Distinction**:
   - Different colors and labels make it easy to distinguish
   - Reference: Green accent, labeled "(Original)"
   - API: Blue accent, labeled "(STT Model Output)"

## CSV Structure

The `filtered_csedu.csv` file contains:
- `path`: Audio filename (e.g., `common_voice_bn_30704510.mp3`)
- `sentence`: The reference transcript
- Other metadata columns

## Benefits

✅ **Easy Comparison**: Users can immediately see differences between reference and API output  
✅ **Quality Assessment**: Helps evaluate STT model accuracy  
✅ **Side-by-Side View**: No need to switch between views  
✅ **Visual Clarity**: Color coding makes it clear which is which  

## Example Comparison

For file: `common_voice_bn_30704510.mp3`

**Reference (Original):**
```
এ সময়ে "দ্য বেঙ্গল রিভার সার্ভিস কোম্পানি" নামে নৌ-পরিবহন সংস্থা এবং নৌ-পরিবহন বীমা কোম্পানি প্রতিষ্ঠা করেন।
```

**API Generated:**
```
এ সময়ে দ্য বেঙ্গল রিভার সার্ভিস কোম্পানি নামে নৌ পরিবহন সংস্থা এবং নৌ পরিবহন বিমা কোম্পানি প্রতিষ্ঠা করে
```

**Differences:**
- Quotation marks around company name
- Hyphenation in "নৌ-পরিবহন" vs "নৌ পরিবহন"
- "বীমা" vs "বিমা"
- "করেন" vs "করে"

## Files Modified

1. `webapp/server.js` - Added CSV loading and `/api/reference` endpoint
2. `webapp/public/index.html` - Added two transcript sections
3. `webapp/public/script.js` - Updated to load both transcripts
4. `webapp/public/style.css` - Added styling for dual transcript view

## Testing

The webapp is currently running at http://localhost:3002 with:
- 15,455 reference transcripts loaded from CSV
- Example file available for testing
- Both transcripts displaying correctly
