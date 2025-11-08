"""
Local configuration file for testing
Copy this file and modify paths for your local environment
"""

# Root directory containing folders with audio files
# For testing on Mac/Linux, use an absolute path like:
# AUDIO_BASE_DIR = "/Users/username/path/to/validated"
# For Windows:
# AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"

AUDIO_BASE_DIR = "./test_audio"  # Change this to your actual path

# Path to output CSV file
CSV_OUTPUT_PATH = "./transcription_path.csv"

# STT API endpoint
SOCKET_URL = "https://voice.bangla.gov.bd:9394"

# Supported audio file extensions (WAV files are used for API calls)
AUDIO_EXTENSIONS = ['.wav', '.flac']

# Timeout for API requests (seconds)
API_TIMEOUT = 120

# Delay between requests (seconds)
REQUEST_DELAY = 1
