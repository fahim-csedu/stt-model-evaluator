@echo off
echo ========================================
echo STT Batch Transcription Script
echo ========================================
echo.
echo This will process all audio files in:
echo D:\Final_data_MRK\Modified
echo.
echo Press Ctrl+C to stop at any time.
echo Progress will be saved automatically.
echo.
pause

python batch_transcribe.py

echo.
echo ========================================
echo Script finished or interrupted
echo ========================================
pause
