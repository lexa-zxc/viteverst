@echo off
chcp 65001 >nul
color 0A
echo.
echo ^>^>^> СБОРКА ПРОЕКТА (БЕЗ МИНИФИКАЦИИ) ^<^<^<
echo.
echo 1. Запускаем сборку Vite с сохранением комментариев...
call npm run build
echo.
echo ^>^>^> СБОРКА ЗАВЕРШЕНА ^<^<^<
echo.
pause 