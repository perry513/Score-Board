@echo off
cd /d "%~dp0"
start "" mongoose.exe -d dist
start "" http://localhost:8000/index.html

