"""
Test script with enhanced debugging for API latency testing
Helps diagnose connection and processing issues
"""

import base64
import json
import socketio
import time
import os
from pathlib import Path
from datetime import datetime

# Configuration
SOCKET_URL = "https://voice.bangla.gov.bd:9394"
TEST_AUDIO_FILE = "./common_voice_bn_30704510.mp3"  # Your test file

# Try with smaller file size limit (in MB) - API might have size limits
MAX_FILE_SIZE_MB = 10


def get_file_info(audio_path):
    """Get file information"""
    file_size = os.path.getsize(audio_path)
    file_size_mb = file_size / 1024 / 1024
    return {
        'size_bytes': file_size,
        'size_mb': file_size_mb,
        'extension': Path(audio_path).suffix
    }


def transcribe_audio_debug(audio_path):
    """Transcribe audio with detailed debugging"""
    result = {
        'success': False,
        'data': None,
        'error': None,
        'timings': {
            'start_time': None,
            'connect_time': None,
            'send_time': None,
            'response_time': None,
            'total_time': None
        },
        'events': []
    }
    
    # Create Socket.IO client with more verbose logging
    sio = socketio.Client(
        ssl_verify=False,
        logger=False,  # Set to True for even more debugging
        engineio_logger=False
    )
    
    # Event handlers with detailed logging
    @sio.on('connect')
    def on_connect():
        result['timings']['connect_time'] = time.time()
        elapsed = result['timings']['connect_time'] - result['timings']['start_time']
        msg = f"✓ Connected to server (took {elapsed:.2f}s)"
        print(f"  {msg}")
        result['events'].append(msg)
    
    @sio.on('disconnect')
    def on_disconnect():
        msg = "✓ Disconnected from server"
        print(f"  {msg}")
        result['events'].append(msg)
    
    @sio.on('result_upload')
    def on_result_upload(data):
        result['timings']['response_time'] = time.time()
        elapsed = result['timings']['response_time'] - result['timings']['send_time']
        msg = f"✓ Received response (took {elapsed:.2f}s)"
        print(f"  {msg}")
        result['events'].append(msg)
        result['success'] = True
        result['data'] = data
        sio.disconnect()
    
    @sio.on('result')
    def on_result(data):
        msg = "✓ Received streaming result"
        print(f"  {msg}")
        result['events'].append(msg)
        # Note: This is for streaming, not upload
    
    @sio.on('connect_error')
    def on_connect_error(error):
        msg = f"✗ Connection error: {error}"
        print(f"  {msg}")
        result['events'].append(msg)
        result['error'] = f"Connection error: {error}"
        result['success'] = False
    
    @sio.on('error')
    def on_error(error):
        msg = f"✗ Socket error: {error}"
        print(f"  {msg}")
        result['events'].append(msg)
        result['error'] = f"Socket error: {error}"
    
    try:
        result['timings']['start_time'] = time.time()
        
        # Read audio file
        print(f"  Reading audio file...")
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
        
        file_size_mb = len(audio_data) / 1024 / 1024
        print(f"  File size: {file_size_mb:.2f} MB")
        
        if file_size_mb > MAX_FILE_SIZE_MB:
            print(f"  ⚠️  WARNING: File is larger than {MAX_FILE_SIZE_MB}MB - API might reject it")
        
        # Encode audio
        print(f"  Encoding audio to base64...")
        encode_start = time.time()
        encoded_audio = base64.b64encode(audio_data).decode('utf-8')
        encode_time = time.time() - encode_start
        print(f"  Encoding took {encode_time:.2f}s")
        print(f"  Encoded size: {len(encoded_audio) / 1024 / 1024:.2f} MB")
        
        # Connect to API
        print(f"  Connecting to API: {SOCKET_URL}")
        connect_start = time.time()
        sio.connect(SOCKET_URL, transports=["websocket"])
        
        # Wait a bit for connection to establish
        time.sleep(0.5)
        
        if not sio.connected:
            result['error'] = "Failed to connect to server"
            return result
        
        # Prepare payload
        payload = {
            "index": 0,
            "audio": encoded_audio,
            "endOfStream": True
        }
        
        print(f"  Sending audio data...")
        result['timings']['send_time'] = time.time()
        
        # Emit the event
        sio.emit("audio_transmit_upload", payload)
        print(f"  Audio data sent, waiting for response...")
        
        # Wait for response with timeout
        timeout = 180  # 3 minutes timeout for large files
        start_wait = time.time()
        
        while not result['success'] and not result['error']:
            time.sleep(0.5)
            elapsed = time.time() - start_wait
            
            # Show progress every 5 seconds
            if int(elapsed) % 5 == 0 and elapsed > 0:
                print(f"  Still waiting... ({elapsed:.0f}s elapsed)")
            
            if elapsed > timeout:
                result['error'] = f"Timeout after {timeout}s waiting for response"
                break
        
        # Calculate total time
        if result['timings']['response_time']:
            result['timings']['total_time'] = result['timings']['response_time'] - result['timings']['start_time']
        
        # Ensure disconnection
        if sio.connected:
            sio.disconnect()
        
        return result
        
    except Exception as e:
        result['error'] = str(e)
        result['events'].append(f"Exception: {str(e)}")
        if sio.connected:
            sio.disconnect()
        return result


def main():
    print("=" * 80)
    print("STT API LATENCY TEST (DEBUG MODE)")
    print("=" * 80)
    print(f"API endpoint: {SOCKET_URL}")
    print(f"Test file: {TEST_AUDIO_FILE}")
    print("=" * 80 + "\n")
    
    # Check if test file exists
    if not os.path.exists(TEST_AUDIO_FILE):
        print(f"ERROR: Test file '{TEST_AUDIO_FILE}' not found!")
        print(f"Please place an audio file at this location.")
        return
    
    # Get file info
    file_info = get_file_info(TEST_AUDIO_FILE)
    
    print(f"File Information:")
    print(f"  Path: {TEST_AUDIO_FILE}")
    print(f"  Size: {file_info['size_mb']:.2f} MB ({file_info['size_bytes']:,} bytes)")
    print(f"  Format: {file_info['extension']}")
    
    if file_info['size_mb'] > MAX_FILE_SIZE_MB:
        print(f"\n⚠️  WARNING: File is larger than {MAX_FILE_SIZE_MB}MB")
        print(f"  The API might have size limits. Consider testing with a smaller file first.")
    
    if file_info['extension'].lower() != '.wav':
        print(f"\n⚠️  NOTE: File is {file_info['extension']}, not .wav")
        print(f"  WAV format is recommended. MP3 might have compatibility issues.")
    
    print()
    
    # Run transcription test
    print("Starting transcription test...\n")
    result = transcribe_audio_debug(TEST_AUDIO_FILE)
    
    print("\n" + "=" * 80)
    print("TEST RESULTS")
    print("=" * 80)
    
    if result['success'] and result['data']:
        print("✓ Transcription successful!\n")
        
        # Extract transcript
        try:
            if 'output' in result['data'] and 'predicted_words' in result['data']['output']:
                words = result['data']['output']['predicted_words']
                transcript = ''.join([word['word'] for word in words])
                print(f"Transcript: {transcript[:200]}..." if len(transcript) > 200 else f"Transcript: {transcript}")
            else:
                print(f"Response structure: {json.dumps(result['data'], indent=2, ensure_ascii=False)[:500]}")
        except Exception as e:
            print(f"Could not extract transcript: {e}")
        
        print()
        
        # Show timing breakdown
        timings = result['timings']
        if timings['total_time']:
            print(f"Total time:         {timings['total_time']:.2f}s")
        
        # Save test result
        test_result = {
            'test_file': TEST_AUDIO_FILE,
            'file_info': file_info,
            'timings': timings,
            'events': result['events'],
            'api_response': result['data'],
            'timestamp': datetime.now().isoformat()
        }
        
        with open('test_result_debug.json', 'w', encoding='utf-8') as f:
            json.dump(test_result, f, ensure_ascii=False, indent=2)
        
        print(f"\nFull test results saved to: test_result_debug.json")
        
    else:
        print(f"✗ Transcription failed!")
        print(f"\nError: {result.get('error', 'Unknown error')}")
        print(f"\nEvents log:")
        for event in result['events']:
            print(f"  - {event}")
        
        # Troubleshooting tips
        print(f"\n" + "=" * 80)
        print("TROUBLESHOOTING TIPS")
        print("=" * 80)
        print("1. Check if the API endpoint is accessible")
        print("2. Try with a smaller audio file (< 5MB)")
        print("3. Try with WAV format instead of MP3")
        print("4. Check your internet connection")
        print("5. Verify the API is not rate-limiting your requests")
        
        if file_info['size_mb'] > 5:
            print(f"\n⚠️  Your file is {file_info['size_mb']:.1f}MB - try a smaller file first")
    
    print("=" * 80)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nFatal error: {e}")
        import traceback
        traceback.print_exc()
