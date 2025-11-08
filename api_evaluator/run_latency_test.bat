@echo off
echo ========================================
echo STT API Latency Test
echo ========================================
echo.
echo This will test the API with sample.mp3
echo Make sure sample.mp3 exists in this folder!
echo.
pause

python test_api_latency.py

echo.
echo ========================================
echo Test complete!
echo Check test_result.json for details
echo ========================================
pause
