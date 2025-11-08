"""
Test script to transcribe a single audio file
Usage: python3 test_single_transcribe.py <path_to_wav_file>
"""

import base64
import json
import socketio
import time
import sys
import os
from pathlib import Path

# Import configuration
try:
    from config_local import SOCKET_URL, API_TIMEOUT
except ImportError:
    try:
        from config import SOCKET_URL, API_TIMEOUT
    except ImportError:
        SOCKET_URL = "https://voice.bangla.gov.bd:9394"
        API_TIMEOUT = 120


def transcribe_audio(audio_path):
    """Transcribe a single audio file using the STT API"""
    print(f"\n{'='*80}")
    print(f"Testing Single File Transcription")
    print(f"{'='*80}")
    print(f"Audio file: {audio_path}")
    print(f"API endpoint: {SOCKET_URL}")
    print(f"{'='*80}\n")
    
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
        print("✓ Connected to STT server")
    
    @sio.on('disconnect')
    def on_disconnect():
        print("✓ Disconnected from server")
    
    @sio.on('result_upload')
    def on_result_upload(data):
        result['api_response_time'] = time.time() - result['send_time']
        print(f"✓ Received transcription result (API took {result['api_response_time']:.2f}s)")
        result['success'] = True
        result['data'] = data
        sio.disconnect()
    
    @sio.on('connect_error')
    def on_connect_error(error):
        print(f"✗ Connection error: {error}")
        result['error'] = f"Connection error: {error}"
        result['success'] = False
    
    try:
        # Check if file exists
        if not os.path.exists(audio_path):
            print(f"✗ Error: File not found: {audio_path}")
            return None
        
        # Get file size
        file_size = os.path.getsize(audio_path)
        print(f"File size: {file_size / 1024:.2f} KB")
        
        # Read and encode audio file
        print("Reading audio file...")
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
        
        encoded_audio = base64.b64encode(audio_data).decode('utf-8')
        print(f"✓ Audio encoded (base64 length: {len(encoded_audio)})")
        
        # Connect to API
        print(f"\nConnecting to API...")
        sio.connect(SOCKET_URL, transports=["websocket"])
        
        # Send audio for transcription
        payload = {
            "index": 0,
            "audio": encoded_audio,
            "endOfStream": True
        }
        
        print(f"Sending audio data...")
        result['send_time'] = time.time()
        sio.emit("audio_transmit_upload", payload)
        
        # Wait for response (with timeout)
        start_time = time.time()
        
        while not result['success'] and not result['error']:
            time.sleep(0.1)
            if time.time() - start_time > API_TIMEOUT:
                result['error'] = "Timeout waiting for response"
                print(f"✗ Timeout after {API_TIMEOUT}s")
                break
        
        # Ensure disconnection
        if sio.connected:
            sio.disconnect()
        
        if result['success'] and result['data']:
            print(f"\n{'='*80}")
            print("TRANSCRIPTION SUCCESSFUL")
            print(f"{'='*80}")
            
            # Extract transcript
            if 'output' in result['data'] and 'predicted_words' in result['data']['output']:
                words = result['data']['output']['predicted_words']
                transcript = ''.join([word['word'] for word in words])
                print(f"\nTranscript: {transcript}")
                
                # Get duration
                if words and 'timestamp' in words[-1]:
                    duration = words[-1]['timestamp'][1] / 1000.0
                    print(f"Audio duration: {duration:.2f}s")
            
            # Save JSON response
            output_path = Path(audio_path).with_suffix('.json')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result['data'], f, ensure_ascii=False, indent=2)
            
            print(f"\n✓ Saved JSON to: {output_path}")
            print(f"{'='*80}\n")
            
            return result['data']
        else:
            print(f"\n{'='*80}")
            print("TRANSCRIPTION FAILED")
            print(f"{'='*80}")
            print(f"Error: {result.get('error', 'Unknown error')}")
            print(f"{'='*80}\n")
            return None
        
    except Exception as e:
        print(f"\n✗ Exception: {e}")
        import traceback
        traceback.print_exc()
        if sio.connected:
            sio.disconnect()
        return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 test_single_transcribe.py <path_to_wav_file>")
        print("\nExample:")
        print("  python3 test_single_transcribe.py /path/to/audio.wav")
        sys.exit(1)
    
    audio_path = sys.argv[1]
    result = transcribe_audio(audio_path)
    
    if result:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
