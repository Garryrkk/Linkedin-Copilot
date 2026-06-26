@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "BACKEND=%ROOT%Backend"
set "FRONTEND=%ROOT%frontend"
set "MODELS=%ROOT%models"
set "GGUF=nous-hermes-2-mistral-7b-dpo.Q4_K_S.gguf"

echo ================================================
echo   Audience AI - starting LLM + backend + frontend
echo ================================================
echo.

REM ---------- Backend: .env ----------
if not exist "%BACKEND%\.env" (
    if exist "%BACKEND%\.env.example" (
        copy /y "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
        echo [Backend] Created Backend\.env from .env.example.
        echo [Backend] Open it and set LLM_API_KEY/LLM_BASE_URL and DATABASE_URL - the pipeline will not work without them.
        echo.
    )
)

REM ---------- Backend: virtualenv ----------
if not exist "%BACKEND%\.venv\Scripts\python.exe" (
    echo [Backend] No virtualenv found - creating one and installing dependencies...
    python -m venv "%BACKEND%\.venv"
    if errorlevel 1 (
        echo [Backend] ERROR: failed to create virtualenv. Is Python installed and on PATH?
        pause
        exit /b 1
    )
    "%BACKEND%\.venv\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check -r "%BACKEND%\requirements.txt"
    echo [Backend] Dependencies installed.
    echo.
)

REM ---------- Frontend: .env.local ----------
if not exist "%FRONTEND%\.env.local" (
    if exist "%FRONTEND%\.env.example" (
        copy /y "%FRONTEND%\.env.example" "%FRONTEND%\.env.local" >nul
        echo [Frontend] Created frontend\.env.local from .env.example - defaults to http://localhost:8000
        echo.
    )
)

REM ---------- Frontend: node_modules ----------
if not exist "%FRONTEND%\node_modules" (
    echo [Frontend] No node_modules found - running npm install...
    pushd "%FRONTEND%"
    call npm install
    popd
    echo.
)

REM ---------- LLM server: sanity check ----------
set "LLM_OK=1"
if not exist "%MODELS%\llama-server.exe" (
    echo [LLM] WARNING: llama-server.exe not found in %MODELS% - skipping LLM server launch.
    set "LLM_OK=0"
)
if not exist "%MODELS%\%GGUF%" (
    echo [LLM] WARNING: %GGUF% not found in %MODELS% - skipping LLM server launch.
    set "LLM_OK=0"
)

if "%LLM_OK%"=="1" (
    echo Launching LLM server - llama.cpp - on http://localhost:8080
    start "Audience AI - LLM" /D "%MODELS%" cmd /k ".\llama-server.exe -m .\%GGUF% --port 8080 --gpu-layers 999 --flash-attn"
)

echo Launching Backend  (FastAPI)  on http://localhost:8000
start "Audience AI - Backend" /D "%BACKEND%" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

echo Launching Frontend (Next.js) on http://localhost:3000
start "Audience AI - Frontend" /D "%FRONTEND%" cmd /k "npm run dev"

echo.
echo All servers are starting in their own windows.
echo   LLM server:    http://localhost:8080  (loads the GGUF model - give it time)
echo   Backend docs:  http://localhost:8000/docs
echo   Frontend:      http://localhost:3000
echo.
echo Reminder: Backend\.env must have a working DATABASE_URL and LLM_BASE_URL
echo pointing at the LLM server above for post analysis to actually work.
echo Close each window (or Ctrl+C inside it) to stop that server.
echo.
endlocal
