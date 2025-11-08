"""
Batch transcription script for STT Model Evaluator
Processes all audio files and saves transcripts in the same folder
"""

import base64
import json
import socketio
import time
import csv
import os
from pathlib import Path
from datetime import datetime

# Import configuration
try:
    from config import (
        AUDIO_BASE_DIR,
        CSV_OUTPUT_PATH,
        SOCKET_URL,
        AUDIO_EXTENSIONS,
        API_TIMEOUT,
        REQUEST_DELAY
    )
except ImportError:
    # Fallback to default configuration
    AUDIO_BASE_DIR = r"D:\cv_eval_bn\validated"
    CSV_OUTPUT_PATH = r"D:\cv_eval_bn\transcription_path.csv"
    SOCKET_URL = "https://voice.bangla.gov.bd:9394"
    AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg']
    API_TIMEOUT = 120
    REQUEST_DELAY = 1


def get_audio_duration_estimate(audio_path):
    """Get rough duration estimate from file size for MP3"""
    try:
        file_size = os.path.getsize(audio_path)
        # Rough estimate: 1 minute of MP3 at 128kbps ≈ 1MB
        estimated_duration = (file_size / 1024 / 1024) * 60
        return estimated_duration
    except Exception as e:
        return None


def find_all_audio_files(base_dir):
    """Recursively find all audio files in the directory"""
    audio_files = []
    base_path = Path(base_dir)
    
    for ext in AUDIO_EXTENSIONS:
        audio_files.extend(base_path.rglob(f'*{ext}'))
    
    return sorted(audio_files)


def get_existing_transcripts(base_dir):
    """Get set of audio files that already have transcripts"""
    existing = set()
    base_path = Path(base_dir)
    
    # Find all JSON files
    for json_file in base_path.rglob('*.json'):
        # Get the corresponding audio file path (without extension)
        audio_base = json_file.with_suffix('')
        # Check if any audio file with this base name exists
        for ext in AUDIO_EXTENSIONS:
            audio_file = audio_base.with_suffix(ext)
            if audio_file.exists():
                existing.add(str(audio_file))
                break
    
    return existing


def transcribe_audio(audio_path):
    """Transcribe a single audio file using the STT API"""
    result = {
        'success': False,
        'data': None,
        'error': None,
        'api_response_time': None
    }
    
    # Create Socket.IO client
    sio = socketio.Client(ssl_verify=False)
    
    # Event handlers
    @sio.on('connect')
    def on_connect():
        print(f"  Connected to STT server")
    
    @sio.on('disconnect')
    def on_disconnect():
        print(f"  Disconnected from server")
    
    @sio.on('result_upload')
    def on_result_upload(data):
        result['api_response_time'] = time.time() - result['send_time']
        print(f"  Received transcription result (API took {result['api_response_time']:.2f}s)")
        result['success'] = True
        result['data'] = data
        sio.disconnect()
    
    @sio.on('connect_error')
    def on_connect_error(error):
        print(f"  Connection error: {error}")
        result['error'] = f"Connection error: {error}"
        result['success'] = False
    
    try:
        # Read and encode audio file
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
        
        encoded_audio = base64.b64encode(audio_data).decode('utf-8')
        
        # Connect to API
        print(f"  Connecting to API...")
        sio.connect(SOCKET_URL, transports=["websocket"])
        
        # Send audio for transcription
        payload = {
            "index": 0,
            "audio": encoded_audio,
            "endOfStream": True
        }
        
        print(f"  Sending audio data...")
        result['send_time'] = time.time()
        sio.emit("audio_transmit_upload", payload)
        
        # Wait for response (with timeout)
        start_time = time.time()
        
        while not result['success'] and not result['error']:
            time.sleep(0.1)
            if time.time() - start_time > API_TIMEOUT:
                result['error'] = "Timeout waiting for response"
                break
        
        # Ensure disconnection
        if sio.connected:
            sio.disconnect()
        
        return result
        
    except Exception as e:
        result['error'] = str(e)
        if sio.connected:
            sio.disconnect()
        return result


def extract_transcript_text(api_response):
    """Extract concatenated transcript from API response"""
    try:
        if 'output' in api_response and 'predicted_words' in api_response['output']:
            words = api_response['output']['predicted_words']
            transcript = ''.join([word['word'] for word in words])
            return transcript
        return ""
    except Exception as e:
        print(f"  Warning: Could not extract transcript: {e}")
        return ""


def get_audio_duration_from_api(api_response):
    """Extract audio duration from API response"""
    try:
        if 'output' in api_response and 'predicted_words' in api_response['output']:
            words = api_response['output']['predicted_words']
            if words and 'timestamp' in words[-1]:
                # Last timestamp end time in milliseconds
                duration = words[-1]['timestamp'][1] / 1000.0
                return duration
    except:
        pass
    return None


def append_to_csv(csv_path, row_data):
    """Append a row to CSV file (creates file if doesn't exist)"""
    file_exists = os.path.exists(csv_path)
    
    with open(csv_path, 'a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['audio_file_path', 'transcription_file_path', 'transcript', 'audio_length_seconds', 'api_response_time_seconds']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        writer.writerow(row_data)


def process_audio_files():
    """Main processing function"""
    print("=" * 80)
    print("STT Batch Transcription Script")
    print("=" * 80)
    print(f"Audio directory: {AUDIO_BASE_DIR}")
    print(f"CSV output: {CSV_OUTPUT_PATH}")
    print(f"API endpoint: {SOCKET_URL}")
    print("=" * 80)
    
    # Find all audio files
    print("\nScanning for audio files...")
    audio_files = find_all_audio_files(AUDIO_BASE_DIR)
    print(f"Found {len(audio_files)} audio files")
    
    # Get existing transcripts
    existing_transcripts = get_existing_transcripts(AUDIO_BASE_DIR)
    print(f"Found {len(existing_transcripts)} existing transcripts")
    
    # Filter out already processed files
    files_to_process = []
    for audio_file in audio_files:
        if str(audio_file) not in existing_transcripts:
            files_to_process.append(audio_file)
    
    print(f"Files to process: {len(files_to_process)}")
    
    if len(files_to_process) == 0:
        print("\nAll files have been processed!")
        return
    
    print("\n" + "=" * 80)
    print("Starting batch transcription...")
    print("=" * 80 + "\n")
    
    # Process each file
    success_count = 0
    error_count = 0
    
    for idx, audio_file in enumerate(files_to_process, 1):
        print(f"\n[{idx}/{len(files_to_process)}] Processing: {audio_file.name}")
        print(f"  Path: {audio_file}")
        
        try:
            # Transcribe
            result = transcribe_audio(str(audio_file))
            
            if result['success'] and result['data']:
                # Save JSON response in the same folder as audio file
                json_path = audio_file.with_suffix('.json')
                
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(result['data'], f, ensure_ascii=False, indent=2)
                
                print(f"  ✓ Saved JSON: {json_path.name}")
                
                # Extract transcript
                transcript = extract_transcript_text(result['data'])
                
                # Get audio duration from API response
                duration = get_audio_duration_from_api(result['data'])
                if duration is None:
                    duration = get_audio_duration_estimate(str(audio_file))
                
                # Append to CSV
                csv_row = {
                    'audio_file_path': str(audio_file),
                    'transcription_file_path': str(json_path),
                    'transcript': transcript,
                    'audio_length_seconds': f"{duration:.2f}" if duration else 'N/A',
                    'api_response_time_seconds': f"{result['api_response_time']:.2f}" if result['api_response_time'] else 'N/A'
                }
                
                append_to_csv(CSV_OUTPUT_PATH, csv_row)
                print(f"  ✓ Updated CSV")
                print(f"  ✓ Transcript: {transcript[:100]}..." if len(transcript) > 100 else f"  ✓ Transcript: {transcript}")
                
                success_count += 1
                
            else:
                error_msg = result.get('error', 'Unknown error')
                print(f"  ✗ Failed: {error_msg}")
                error_count += 1
                
                # Log error to CSV
                csv_row = {
                    'audio_file_path': str(audio_file),
                    'transcription_file_path': 'ERROR',
                    'transcript': f'ERROR: {error_msg}',
                    'audio_length_seconds': 'N/A',
                    'api_response_time_seconds': 'N/A'
                }
                append_to_csv(CSV_OUTPUT_PATH, csv_row)
            
            # Small delay between requests
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f"  ✗ Exception: {e}")
            error_count += 1
            
            # Log error to CSV
            csv_row = {
                'audio_file_path': str(audio_file),
                'transcription_file_path': 'ERROR',
                'transcript': f'EXCEPTION: {str(e)}',
                'audio_length_seconds': 'N/A',
                'api_response_time_seconds': 'N/A'
            }
            append_to_csv(CSV_OUTPUT_PATH, csv_row)
    
    # Summary
    print("\n" + "=" * 80)
    print("BATCH TRANSCRIPTION COMPLETE")
    print("=" * 80)
    print(f"Total processed: {len(files_to_process)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {error_count}")
    print(f"CSV output: {CSV_OUTPUT_PATH}")
    print("=" * 80)


if __name__ == "__main__":
    try:
        process_audio_files()
    except KeyboardInterrupt:
        print("\n\nProcess interrupted by user")
        print("Progress has been saved to CSV")
    except Exception as e:
        print(f"\n\nFatal error: {e}")
        import traceback
        traceback.print_exc()
