@echo off

echo ========================================
echo Starting Zero Export Simulator Frontend...
echo ========================================

cd frontend

python -m http.server 5500

pause