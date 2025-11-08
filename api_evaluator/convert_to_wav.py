"""
Simple script to convert MP3 to WAV for API testing
Requires: pip install pydub
"""

import os
from pathlib import Path

try:
    from pydub import AudioSegment
except ImportError:
    print("ERROR: pydub not installed")
    print("Install with: pip install pydub")
    print("\nAlternatively, use ffmpeg directly:")
    print("  ffmpeg -i input.mp3 output.wav")
    exit(1)

def convert_mp3_to_wav(mp3_path, wav_path=None):
    """Convert MP3 to WAV"""
    if not os.path.exists(mp3_path):
        print(f"ERROR: File not found: {mp3_path}")
        return False
    
    if wav_path is None:
        wav_path = Path(mp3_path).with_suffix('.wav')
    
    print(f"Converting: {mp3_path}")
    print(f"Output: {wav_path}")
    
    try:
        # Load MP3
        audio = AudioSegment.from_mp3(mp3_path)
        
        # Get info
        duration = len(audio) / 1000.0  # milliseconds to seconds
        channels = audio.channels
        sample_rate = audio.frame_rate
        
        print(f"Duration: {duration:.1f} seconds")
        print(f"Channels: {channels}")
        print(f"Sample rate: {sample_rate} Hz")
        
        # Export as WAV
        audio.export(wav_path, format="wav")
        
        # Check output size
        output_size = os.path.getsize(wav_path) / 1024 / 1024
        print(f"Output size: {output_size:.2f} MB")
        print(f"✓ Conversion successful!")
        
        return True
        
    except Exception as e:
        print(f"✗ Conversion failed: {e}")
        return False


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python convert_to_wav.py <input.mp3> [output.wav]")
        print("\nExample:")
        print("  python convert_to_wav.py sample.mp3")
        print("  python convert_to_wav.py sample.mp3 output.wav")
        exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    convert_mp3_to_wav(input_file, output_file)
