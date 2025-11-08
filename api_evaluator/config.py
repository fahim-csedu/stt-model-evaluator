"""
Configuration file for batch transcription
"""

# Root directory containing folders with audio files
AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"

# Path to output CSV file (in parent directory)
CSV_OUTPUT_PATH = r"D:\cv_eval_bn\transcription_path.csv"

# STT API endpoint
SOCKET_URL = "https://voice.bangla.gov.bd:9394"

# Supported audio file extensions
AUDIO_EXTENSIONS = ['.wav', '.flac', '.mp3', '.m4a', '.ogg']

# Timeout for API requests (seconds)
API_TIMEOUT = 60

# Delay between requests (seconds)
REQUEST_DELAY = 1
