@echo off

echo ========================================
echo Starting Zero Export Simulator Backend...
echo ========================================

call .venv\Scripts\activate

cd backend

uvicorn main:app --reload

pause