#!/bin/bash

# Plataforma de Capacitación Inmobiliaria - Script de Deployment
# Ejecutar desde el directorio raíz del proyecto

set -e

echo "🚀 Iniciando proceso de deployment..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependencias
print_status "Verificando dependencias..."

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Instala Node.js 18 o superior."
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    print_error "Yarn no está instalado. Instala Yarn: npm install -g yarn"
    exit 1
fi

# Navegar al directorio frontend
print_status "Preparando frontend..."
cd frontend

# Instalar dependencias
print_status "Instalando dependencias..."
yarn install

# Construir para producción
print_status "Construyendo aplicación para producción..."
yarn build

if [ ! -d "build" ]; then
    print_error "Error al construir la aplicación!"
    exit 1
fi

BUILD_SIZE=$(du -sh build | cut -f1)
print_success "Aplicación construida exitosamente. Tamaño: $BUILD_SIZE"

# Seleccionar plataforma de deployment
echo ""
echo "Selecciona la plataforma de deployment:"
echo "1) Vercel (Recomendado para React)"
echo "2) Netlify"
echo "3) Solo construir (manual)"
echo ""
read -p "Ingresa tu elección (1-3): " choice

case $choice in
    1)
        print_status "Seleccionado: Vercel"
        if command -v vercel &> /dev/null; then
            print_status "Ejecutando deployment a Vercel..."
            vercel --prod
            print_success "¡Desplegado en Vercel exitosamente!"
        else
            print_error "Vercel CLI no encontrado. Instala con: npm install -g vercel"
            print_warning "Instrucciones manuales:"
            echo "1. Instalar: npm install -g vercel"
            echo "2. Ejecutar: vercel --prod"
        fi
        ;;
    2)
        print_status "Seleccionado: Netlify"
        if command -v netlify &> /dev/null; then
            print_status "Ejecutando deployment a Netlify..."
            netlify deploy --prod --dir=build
            print_success "¡Desplegado en Netlify exitosamente!"
        else
            print_error "Netlify CLI no encontrado. Instala con: npm install -g netlify-cli"
            print_warning "Instrucciones manuales:"
            echo "1. Instalar: npm install -g netlify-cli"
            echo "2. Ejecutar: netlify deploy --prod --dir=build"
        fi
        ;;
    3)
        print_success "Construcción completada. Puedes subir manualmente la carpeta 'build' a tu proveedor de hosting."
        ;;
    *)
        print_error "Opción inválida!"
        exit 1
        ;;
esac

# Recomendaciones post-deployment
print_status "Recomendaciones post-deployment:"
echo "1. Prueba tu aplicación desplegada"
echo "2. Configura dominio personalizado"
echo "3. Configura certificado SSL"
echo "4. Configura analytics (Google Analytics)"
echo "5. Configura monitoreo de errores"

print_success "¡Proceso de deployment completado!"

echo ""
echo "🎉 Próximos pasos:"
echo "1. Visita tu aplicación desplegada"
echo "2. Inicia sesión con credenciales admin: unbrokerage@realtyonegroupmexico.mx / OneVision$07"
echo "3. Personaliza el branding desde el panel de administración"
echo "4. Crea cuentas de usuario para tu equipo"
echo "5. Sube tu contenido de capacitación"

echo ""
print_success "¡Tu plataforma de capacitación inmobiliaria está lista!"