@echo off
chcp 65001 >nul
color 0A
echo.
echo ^>^>^> СБОРКА ПРОЕКТА (С МИНИФИКАЦИЕЙ И ОПТИМИЗАЦИЕЙ) ^<^<^<
echo.
echo 1. Запускаем минифицированную сборку Vite с сохранением важных комментариев...
call npm run build-min
echo.
echo ^>^>^> СБОРКА ЗАВЕРШЕНА ^<^<^<
echo.
pause 