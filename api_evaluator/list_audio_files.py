"""
List audio files in the validated directory
"""

import os
from pathlib import Path

# Import configuration
try:
    from config_local import AUDIO_BASE_DIR, AUDIO_EXTENSIONS
    print("Using local configuration")
except ImportError:
    try:
        from config import AUDIO_BASE_DIR, AUDIO_EXTENSIONS
        print("Using default configuration")
    except ImportError:
        AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"
        AUDIO_EXTENSIONS = ['.wav', '.flac']
        print("Using fallback configuration")


def list_audio_files(base_dir, limit=10):
    """List audio files in the directory"""
    print(f"\n{'='*80}")
    print(f"Listing Audio Files")
    print(f"{'='*80}")
    print(f"Base directory: {base_dir}")
    print(f"Extensions: {', '.join(AUDIO_EXTENSIONS)}")
    print(f"{'='*80}\n")
    
    if not os.path.exists(base_dir):
        print(f"✗ Error: Directory not found: {base_dir}")
        return []
    
    base_path = Path(base_dir)
    
    # Get all subdirectories, excluding 'remaining'
    subdirs = [d for d in base_path.iterdir() if d.is_dir() and d.name.lower() != 'remaining']
    
    print(f"Found {len(subdirs)} subdirectories (excluding 'remaining'):\n")
    for subdir in subdirs:
        print(f"  - {subdir.name}")
    
    print(f"\n{'='*80}")
    print(f"Audio Files (showing first {limit}):")
    print(f"{'='*80}\n")
    
    audio_files = []
    
    # Find audio files in subdirectories
    for subdir in subdirs:
        for ext in AUDIO_EXTENSIONS:
            files = list(subdir.rglob(f'*{ext}'))
            audio_files.extend(files)
    
    audio_files = sorted(audio_files)
    
    if not audio_files:
        print("No audio files found!")
        return []
    
    print(f"Total audio files found: {len(audio_files)}\n")
    
    # Show first N files
    for idx, audio_file in enumerate(audio_files[:limit], 1):
        # Check if JSON exists
        json_file = audio_file.with_suffix('.json')
        has_json = "✓" if json_file.exists() else "✗"
        
        # Get file size
        size_kb = audio_file.stat().st_size / 1024
        
        print(f"{idx:3d}. [{has_json}] {audio_file.name}")
        print(f"      Path: {audio_file}")
        print(f"      Size: {size_kb:.2f} KB")
        print()
    
    if len(audio_files) > limit:
        print(f"... and {len(audio_files) - limit} more files\n")
    
    print(f"{'='*80}")
    print(f"Legend: [✓] = has JSON transcript, [✗] = no transcript")
    print(f"{'='*80}\n")
    
    return audio_files


if __name__ == "__main__":
    import sys
    
    # Allow custom limit
    limit = 10
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            print("Invalid limit, using default (10)")
    
    files = list_audio_files(AUDIO_BASE_DIR, limit)
    
    if files:
        print("\nTo test transcription on the first file, run:")
        print(f"  python3 test_single_transcribe.py \"{files[0]}\"")
