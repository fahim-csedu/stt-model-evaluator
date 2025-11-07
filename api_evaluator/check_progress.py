"""
Check progress of batch transcription
"""

import os
import csv
from pathlib import Path

try:
    from config import AUDIO_BASE_DIR, API_RESPONSE_DIR, CSV_OUTPUT_PATH, AUDIO_EXTENSIONS
except ImportError:
    AUDIO_BASE_DIR = r"D:\cv-corpus-23.0-2025-09-05\bn\clips"
    API_RESPONSE_DIR = r"D:\cv-corpus-23.0-2025-09-05\bn\csedu_labels"
    CSV_OUTPUT_PATH = r"D:\cv-corpus-23.0-2025-09-05\bn\transcription_results.csv"
    AUDIO_EXTENSIONS = ['.wav', '.flac', '.mp3', '.m4a', '.ogg']


def count_audio_files():
    """Count total audio files"""
    audio_files = []
    base_path = Path(AUDIO_BASE_DIR)
    
    for ext in AUDIO_EXTENSIONS:
        audio_files.extend(base_path.rglob(f'*{ext}'))
    
    return len(audio_files)


def count_transcripts():
    """Count existing transcripts"""
    response_path = Path(API_RESPONSE_DIR)
    
    if not response_path.exists():
        return 0
    
    return len(list(response_path.glob('*.json')))


def count_csv_entries():
    """Count entries in CSV"""
    if not os.path.exists(CSV_OUTPUT_PATH):
        return 0
    
    with open(CSV_OUTPUT_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return sum(1 for row in reader)


def count_errors():
    """Count errors in CSV"""
    if not os.path.exists(CSV_OUTPUT_PATH):
        return 0
    
    error_count = 0
    with open(CSV_OUTPUT_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('transcript_file_path') == 'ERROR':
                error_count += 1
    
    return error_count


def main():
    print("=" * 60)
    print("BATCH TRANSCRIPTION PROGRESS")
    print("=" * 60)
    
    total_audio = count_audio_files()
    total_transcripts = count_transcripts()
    csv_entries = count_csv_entries()
    error_count = count_errors()
    
    print(f"\nTotal audio files:        {total_audio}")
    print(f"Transcripts generated:    {total_transcripts}")
    print(f"CSV entries:              {csv_entries}")
    print(f"Errors:                   {error_count}")
    print(f"Remaining:                {total_audio - total_transcripts}")
    
    if total_audio > 0:
        progress = (total_transcripts / total_audio) * 100
        print(f"\nProgress:                 {progress:.1f}%")
    
    print("\n" + "=" * 60)
    
    if total_transcripts < total_audio:
        print(f"\n{total_audio - total_transcripts} files remaining to process")
        print("Run batch_transcribe.py to continue")
    else:
        print("\nAll files have been processed!")
    
    print("=" * 60)


if __name__ == "__main__":
    main()
