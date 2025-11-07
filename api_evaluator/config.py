"""
Configuration file for batch transcription
"""

# Directory containing audio files to process
AUDIO_BASE_DIR = r"D:\Final_data_MRK\Modified"

# Directory to save API response JSON files
API_RESPONSE_DIR = r"D:\Final_data_MRK\api_response"

# Path to output CSV file
CSV_OUTPUT_PATH = r"D:\Final_data_MRK\transcription_results.csv"

# STT API endpoint
SOCKET_URL = "https://voice.bangla.gov.bd:9394"

# Supported audio file extensions
AUDIO_EXTENSIONS = ['.wav', '.flac', '.mp3', '.m4a', '.ogg']

# Timeout for API requests (seconds)
API_TIMEOUT = 60

# Delay between requests (seconds)
REQUEST_DELAY = 1
