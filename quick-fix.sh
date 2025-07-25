#!/bin/bash

# SOLUCIÓN RÁPIDA - Corrige los problemas principales

echo "🔧 APLICANDO CORRECCIONES RÁPIDAS..."

# 1. Corregir package.json para que use yarn
cd /app/frontend
if [ ! -f "package-lock.json" ] && [ -f "yarn.lock" ]; then
    echo "✅ Proyecto configurado para yarn correctamente"
else
    echo "⚠️  Regenerando yarn.lock..."
    rm -f package-lock.json
    yarn install
fi

# 2. Construir aplicación
echo "🏗️  Construyendo aplicación..."
yarn build

echo ""
echo "✅ CORRECCIONES APLICADAS"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Configura MongoDB Atlas: https://cloud.mongodb.com"
echo "2. En Railway, configura variables de entorno:"
echo "   MONGO_URL=tu-connection-string-de-atlas"
echo "   DB_NAME=real_estate_training"
echo "3. En Vercel, configura:"
echo "   REACT_APP_BACKEND_URL=https://tu-backend.railway.app"
echo ""
echo "🔗 DOCUMENTACIÓN COMPLETA: DEPLOYMENT_INSTRUCTIONS.md"