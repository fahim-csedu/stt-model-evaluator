"""
Test script to check API latency with a sample MP3 file
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
TEST_AUDIO_FILE = "./common_voice_bn_30704510.mp3"  # Place a sample MP3 file in this directory


def get_audio_duration_mp3(audio_path):
    """Get approximate duration from file size (rough estimate)"""
    try:
        file_size = os.path.getsize(audio_path)
        # Rough estimate: 1 minute of MP3 at 128kbps ≈ 1MB
        estimated_duration = (file_size / 1024 / 1024) * 60
        return estimated_duration
    except Exception as e:
        print(f"Could not estimate duration: {e}")
        return None


def transcribe_audio_with_timing(audio_path):
    """Transcribe audio and measure timing"""
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
        }
    }
    
    # Create Socket.IO client
    sio = socketio.Client(ssl_verify=False)
    
    # Event handlers
    @sio.on('connect')
    def on_connect():
        result['timings']['connect_time'] = time.time()
        elapsed = result['timings']['connect_time'] - result['timings']['start_time']
        print(f"  ✓ Connected to server (took {elapsed:.2f}s)")
    
    @sio.on('disconnect')
    def on_disconnect():
        print(f"  ✓ Disconnected from server")
    
    @sio.on('result_upload')
    def on_result_upload(data):
        result['timings']['response_time'] = time.time()
        elapsed = result['timings']['response_time'] - result['timings']['send_time']
        print(f"  ✓ Received response (took {elapsed:.2f}s)")
        result['success'] = True
        result['data'] = data
        sio.disconnect()
    
    @sio.on('connect_error')
    def on_connect_error(error):
        print(f"  ✗ Connection error: {error}")
        result['error'] = f"Connection error: {error}"
        result['success'] = False
    
    try:
        result['timings']['start_time'] = time.time()
        
        # Read and encode audio file
        print(f"  Reading audio file...")
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
        
        file_size_mb = len(audio_data) / 1024 / 1024
        print(f"  File size: {file_size_mb:.2f} MB")
        
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
        result['timings']['send_time'] = time.time()
        sio.emit("audio_transmit_upload", payload)
        
        # Wait for response (with timeout)
        timeout = 120  # 2 minutes timeout
        start_wait = time.time()
        
        while not result['success'] and not result['error']:
            time.sleep(0.1)
            if time.time() - start_wait > timeout:
                result['error'] = "Timeout waiting for response"
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


def main():
    print("=" * 80)
    print("STT API LATENCY TEST")
    print("=" * 80)
    print(f"API endpoint: {SOCKET_URL}")
    print(f"Test file: {TEST_AUDIO_FILE}")
    print("=" * 80 + "\n")
    
    # Check if test file exists
    if not os.path.exists(TEST_AUDIO_FILE):
        print(f"ERROR: Test file '{TEST_AUDIO_FILE}' not found!")
        print(f"Please place a sample MP3 file named '{TEST_AUDIO_FILE}' in this directory.")
        return
    
    # Get file info
    file_size = os.path.getsize(TEST_AUDIO_FILE)
    file_size_mb = file_size / 1024 / 1024
    estimated_duration = get_audio_duration_mp3(TEST_AUDIO_FILE)
    
    print(f"File Information:")
    print(f"  Size: {file_size_mb:.2f} MB")
    if estimated_duration:
        print(f"  Estimated duration: {estimated_duration:.1f} seconds")
    print()
    
    # Run transcription test
    print("Starting transcription test...\n")
    result = transcribe_audio_with_timing(TEST_AUDIO_FILE)
    
    print("\n" + "=" * 80)
    print("TEST RESULTS")
    print("=" * 80)
    
    if result['success'] and result['data']:
        print("✓ Transcription successful!\n")
        
        # Extract transcript
        transcript = extract_transcript_text(result['data'])
        print(f"Transcript: {transcript[:200]}..." if len(transcript) > 200 else f"Transcript: {transcript}")
        print()
        
        # Show timing breakdown
        timings = result['timings']
        if timings['connect_time'] and timings['start_time']:
            connect_time = timings['connect_time'] - timings['start_time']
            print(f"Connection time:    {connect_time:.2f}s")
        
        if timings['send_time'] and timings['connect_time']:
            prep_time = timings['send_time'] - timings['connect_time']
            print(f"Preparation time:   {prep_time:.2f}s")
        
        if timings['response_time'] and timings['send_time']:
            processing_time = timings['response_time'] - timings['send_time']
            print(f"API processing:     {processing_time:.2f}s")
        
        if timings['total_time']:
            print(f"Total time:         {timings['total_time']:.2f}s")
            print()
            
            # Calculate real-time factor
            if estimated_duration:
                rtf = timings['total_time'] / estimated_duration
                print(f"Real-time factor:   {rtf:.2f}x")
                if rtf < 1:
                    print(f"  → Faster than real-time!")
                else:
                    print(f"  → Slower than real-time")
        
        # Save test result
        test_result = {
            'test_file': TEST_AUDIO_FILE,
            'file_size_mb': file_size_mb,
            'estimated_duration': estimated_duration,
            'timings': timings,
            'transcript': transcript,
            'api_response': result['data'],
            'timestamp': datetime.now().isoformat()
        }
        
        with open('test_result.json', 'w', encoding='utf-8') as f:
            json.dump(test_result, f, ensure_ascii=False, indent=2)
        
        print(f"\nFull test results saved to: test_result.json")
        
    else:
        print(f"✗ Transcription failed!")
        print(f"Error: {result.get('error', 'Unknown error')}")
    
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
