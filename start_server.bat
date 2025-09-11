@echo off
echo ==============================================
echo   Starting Soma+ Python Engine (FastAPI)
echo ==============================================
echo.

REM Optional: activate a virtual environment if you use one
REM call venv\Scripts\activate

REM Launch the FastAPI server with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000

pause
