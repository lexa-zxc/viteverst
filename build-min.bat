@echo off
chcp 65001 >nul
color 0A
echo.
echo ^>^>^> СБОРКА ПРОЕКТА (С МИНИФИКАЦИЕЙ) ^<^<^<
echo.
npm run build-min
pause 