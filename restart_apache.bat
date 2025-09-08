@echo off
echo === REINICIANDO APACHE PARA APLICAR CAMBIOS ZIP ===
echo.

echo Deteniendo Apache...
net stop Apache2.4 2>nul
if %errorlevel% neq 0 (
    echo Apache no estaba ejecutandose o no se pudo detener via servicio
    echo Intentando con XAMPP...
    taskkill /f /im httpd.exe 2>nul
)

echo.
echo Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo Iniciando Apache...
net start Apache2.4 2>nul
if %errorlevel% neq 0 (
    echo No se pudo iniciar via servicio, usa el Panel de Control de XAMPP
    echo.
    echo INSTRUCCIONES MANUALES:
    echo 1. Abre el Panel de Control de XAMPP
    echo 2. Haz clic en "Stop" junto a Apache
    echo 3. Espera unos segundos
    echo 4. Haz clic en "Start" junto a Apache
    echo.
    pause
    exit /b 1
)

echo.
echo === VERIFICANDO EXTENSION ZIP ===
php -m | findstr zip
if %errorlevel% equ 0 (
    echo ✅ Extension ZIP habilitada correctamente!
) else (
    echo ❌ Extension ZIP aun no disponible
    echo Verifica que Apache se haya reiniciado correctamente
)

echo.
echo === EJECUTANDO DIAGNOSTICO COMPLETO ===
php check_system.php

echo.
echo Proceso completado. Presiona cualquier tecla para continuar...
pause >nul