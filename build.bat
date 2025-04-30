@echo off
chcp 65001 >nul
color 0A
echo.
echo ^>^>^> СБОРКА ПРОЕКТА (БЕЗ МИНИФИКАЦИИ) ^<^<^<
echo.
npm run build
pause 