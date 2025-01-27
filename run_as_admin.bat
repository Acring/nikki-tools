@echo off
powershell Start-Process python -ArgumentList 'hotkey_listener.py' -Verb RunAs
pause 