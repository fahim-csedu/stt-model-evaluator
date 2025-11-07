@echo off
echo ========================================
echo Installing Dependencies
echo ========================================
echo.

pip install -r requirements.txt

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start batch transcription, run:
echo   run_batch_transcribe.bat
echo.
echo To check progress, run:
echo   python check_progress.py
echo.
pause
