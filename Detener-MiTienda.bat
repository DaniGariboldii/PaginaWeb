@echo off
chcp 65001 >nul
title MiTienda - Detener
echo Deteniendo los servidores de MiTienda...
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | Where-Object { $_.CommandLine -like '*server.js*' -or $_.CommandLine -like '*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
echo Listo. La tienda fue detenida.
timeout /t 3 /nobreak >nul
