"""
Configuration file for batch transcription
"""

# Root directory containing folders with audio files
# Script will process all subdirectories EXCEPT 'remaining' folder
AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"

# Path to output CSV file (in parent directory)
CSV_OUTPUT_PATH = r"D:\cv_eval_bn\transcription_path.csv"

# STT API endpoint
SOCKET_URL = "https://voice.bangla.gov.bd:9394"

# Supported audio file extensions (WAV files are used for API calls)
# Note: MP3 files exist in same folders but are only for web UI playback
AUDIO_EXTENSIONS = ['.wav', '.flac']

# Timeout for API requests (seconds)
API_TIMEOUT = 60

# Delay between requests (seconds)
REQUEST_DELAY = 1
