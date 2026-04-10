@echo off
echo ========================================
echo Student Images Download Script
echo ========================================
echo.
echo This script will download all student passport images
echo from your database and save them to the 'student-images' folder.
echo.
echo Press any key to start...
pause >nul

npx tsx scripts/download-student-images.ts

echo.
echo ========================================
echo Script execution completed!
echo ========================================
pause
