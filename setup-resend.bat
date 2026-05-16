@echo off
echo ========================================
echo    Configuracion de Resend para FE28
echo ========================================
echo.

echo 1. Configurando secreto de Resend API Key...
echo.
echo IMPORTANTE: Necesitas tu API Key de Resend
echo - Ve a https://resend.com/api-keys
echo - Crea una nueva API Key
echo - Copia el valor (formato: re_xxxxxxxxxx)
echo.

firebase functions:secrets:set RESEND_API_KEY

echo.
echo 2. Verificando configuracion...
firebase functions:secrets:access RESEND_API_KEY

echo.
echo 3. Instalando dependencias...
cd functions
npm install resend

echo.
echo 4. Desplegando funciones...
cd ..
firebase deploy --only functions

echo.
echo ========================================
echo    Configuracion completada!
echo ========================================
echo.
echo Proximos pasos:
echo 1. Verifica tu dominio en Resend Dashboard
echo 2. Configura registros DNS (SPF, DKIM, DMARC)
echo 3. Prueba enviando un correo de prueba
echo.
echo Para ver logs: firebase functions:log
echo.
pause