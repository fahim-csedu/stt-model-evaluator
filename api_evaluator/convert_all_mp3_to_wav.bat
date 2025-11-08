@echo off
echo ========================================
echo Batch Convert MP3 to WAV
echo ========================================
echo.
echo This will convert all MP3 files in:
echo D:\cv_eval_bn\validated
echo.
echo WAV files will be created in the same folders
echo Original MP3 files will be kept
echo.
echo NOTE: Requires ffmpeg to be installed
echo Download from: https://ffmpeg.org/download.html
echo.
pause

echo.
echo Starting conversion...
echo.

set count=0
for /r "D:\cv_eval_bn\validated" %%f in (*.mp3) do (
    set /a count+=1
    echo [!count!] Converting: %%~nxf
    ffmpeg -i "%%f" "%%~dpnf.wav" -y -loglevel error
    if errorlevel 1 (
        echo   ERROR: Failed to convert %%~nxf
    ) else (
        echo   SUCCESS: Created %%~nf.wav
    )
    echo.
)

echo.
echo ========================================
echo Conversion Complete!
echo ========================================
echo Total files processed: %count%
echo.
echo You can now run: python batch_transcribe_v2.py
echo.
pause
