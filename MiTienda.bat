@echo off
chcp 65001 >nul
title MiTienda - Lanzador
echo ============================================
echo            Iniciando MiTienda...
echo ============================================
echo.

REM Levanta el backend (API) en una ventana nueva
start "MiTienda - Backend (API)" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Levanta el frontend (web) en otra ventana nueva
start "MiTienda - Frontend (Web)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM Espera unos segundos a que arranquen y abre el navegador
echo Esperando a que arranquen los servidores...
timeout /t 7 /nobreak >nul
start http://localhost:5173

echo.
echo  Listo! Se abrieron dos ventanas:
echo    - Backend (API)  -^> puerto 4000
echo    - Frontend (Web) -^> puerto 5173
echo.
echo  La tienda se abrio en: http://localhost:5173
echo.
echo  Para CERRAR la tienda: cerra esas dos ventanas
echo  (o presiona Ctrl+C en cada una).
echo.
echo  Esta ventana se puede cerrar.
echo ============================================
timeout /t 5 /nobreak >nul
