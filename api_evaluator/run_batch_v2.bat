@echo off
echo ========================================
echo STT Batch Transcription Script V2
echo ========================================
echo.
echo This will process all audio files in:
echo D:\cv_eval_bn\validated
echo.
echo Transcripts will be saved in the same folders
echo CSV will be saved to: D:\cv_eval_bn\transcription_path.csv
echo.
echo Press Ctrl+C to stop at any time.
echo Progress will be saved automatically.
echo.
pause

python batch_transcribe_v2.py

echo.
echo ========================================
echo Script finished or interrupted
echo ========================================
pause
