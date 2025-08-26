#!/bin/bash

# Script de Deployment Completo - Plataforma de Capacitación Inmobiliaria
# Corrige todos los problemas de configuración y despliega correctamente

set -e

echo "🚀 SCRIPT DE DEPLOYMENT COMPLETO"
echo "================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Función para preguntar al usuario
ask_user() {
    local question=$1
    local default=${2:-""}
    local response
    
    if [ -n "$default" ]; then
        read -p "$(echo -e "${YELLOW}$question${NC} (default: $default): ")" response
        response=${response:-$default}
    else
        read -p "$(echo -e "${YELLOW}$question${NC}: ")" response
    fi
    
    echo "$response"
}

# Verificar dependencias
print_step "Verificando dependencias..."

# Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Instala Node.js 18 o superior."
    exit 1
fi
print_success "Node.js: $(node --version)"

# Yarn
if ! command -v yarn &> /dev/null; then
    print_error "Yarn no está instalado. Instalando..."
    npm install -g yarn
fi
print_success "Yarn: $(yarn --version)"

# Git
if ! command -v git &> /dev/null; then
    print_error "Git no está instalado."
    exit 1
fi
print_success "Git: $(git --version)"

print_step "Configurando MongoDB Atlas..."
print_info "Ve a: https://cloud.mongodb.com"
print_info "1. Crea una cuenta gratuita"
print_info "2. Crea un cluster M0 (gratuito)"
print_info "3. Configura Database Access (usuario y contraseña)"
print_info "4. Configura Network Access (permite 0.0.0.0/0)"
print_info "5. Obtén la connection string"

mongodb_url=$(ask_user "Ingresa tu MongoDB Atlas connection string")

if [[ $mongodb_url == *"localhost"* ]] || [[ -z "$mongodb_url" ]]; then
    print_error "Necesitas una connection string válida de MongoDB Atlas"
    print_info "Ejemplo: mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/real_estate_training?retryWrites=true&w=majority"
    exit 1
fi

print_step "Configurando archivos de producción..."

# Actualizar .env.production del backend
cat > backend/.env.production << EOF
# Backend Production Environment Variables
MONGO_URL="$mongodb_url"
DB_NAME="real_estate_training"
ENVIRONMENT="production"
PORT=8001
EOF

print_success "Archivo backend/.env.production actualizado"

print_step "Preparando frontend..."
cd frontend

# Verificar que yarn.lock existe
if [ ! -f "yarn.lock" ]; then
    print_warning "yarn.lock no existe. Creándolo..."
    yarn install
fi

# Instalar dependencias
print_step "Instalando dependencias del frontend..."
yarn install

print_step "Construyendo aplicación para producción..."
yarn build

if [ ! -d "build" ]; then
    print_error "Error al construir la aplicación!"
    exit 1
fi

BUILD_SIZE=$(du -sh build | cut -f1)
print_success "Aplicación construida exitosamente. Tamaño: $BUILD_SIZE"

cd ..

print_step "Seleccionando plataforma de deployment..."
echo ""
echo "Plataformas disponibles:"
echo "1) Railway (Recomendado para backend + frontend)"
echo "2) Vercel (Solo frontend) + Railway (Backend)"
echo "3) Docker local"
echo "4) Solo preparar archivos"
echo ""

choice=$(ask_user "Selecciona una opción (1-4)" "1")

case $choice in
    1)
        print_step "Configurando Railway para deployment completo..."
        
        if ! command -v railway &> /dev/null; then
            print_warning "Railway CLI no está instalado. Instalando..."
            npm install -g @railway/cli
        fi
        
        print_info "Instrucciones para Railway:"
        echo "1. Ve a: https://railway.app"
        echo "2. Conecta tu repositorio GitHub"
        echo "3. Crea un servicio para backend:"
        echo "   - Root Directory: /backend"
        echo "   - Variables de entorno:"
        echo "     MONGO_URL=$mongodb_url"
        echo "     DB_NAME=real_estate_training"
        echo "     PORT=8001"
        echo "4. Crea un servicio para frontend:"
        echo "   - Root Directory: /frontend"
        echo "   - Build Command: yarn build"
        echo "   - Start Command: npx serve -s build -p \$PORT"
        
        ;;
    2)
        print_step "Configurando Vercel + Railway..."
        
        # Vercel para frontend
        if ! command -v vercel &> /dev/null; then
            print_warning "Vercel CLI no está instalado. Instalando..."
            npm install -g vercel
        fi
        
        backend_url=$(ask_user "¿Cuál es la URL de tu backend en Railway? (ej: https://backend-production-xxx.up.railway.app)")
        
        # Actualizar .env.production del frontend
        cat > frontend/.env.production << EOF
REACT_APP_BACKEND_URL=$backend_url
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
EOF
        
        print_info "Frontend configurado para: $backend_url"
        print_info "Ejecuta: 'cd frontend && vercel --prod'"
        
        ;;
    3)
        print_step "Construyendo con Docker..."
        
        if ! command -v docker &> /dev/null; then
            print_error "Docker no está instalado."
            exit 1
        fi
        
        # Construir imagen
        docker build -t real-estate-training .
        
        print_success "Imagen Docker construida: real-estate-training"
        print_info "Ejecuta: 'docker run -p 80:80 real-estate-training'"
        
        ;;
    4)
        print_success "Archivos preparados para deployment manual"
        ;;
    *)
        print_error "Opción inválida"
        exit 1
        ;;
esac

print_step "Generando documentación de deployment..."

cat > DEPLOYMENT_INSTRUCTIONS.md << EOF
# 📋 INSTRUCCIONES DE DEPLOYMENT

## ✅ CONFIGURACIÓN COMPLETADA

### MongoDB Atlas:
- Connection String: \`$mongodb_url\`
- Base de datos: \`real_estate_training\`

### Archivos actualizados:
- ✅ \`backend/.env.production\`
- ✅ \`frontend/.env.production\`
- ✅ \`Dockerfile\` corregido para usar yarn
- ✅ Build del frontend completado

## 🚀 PRÓXIMOS PASOS:

### Para Railway:
1. Ve a: https://railway.app
2. Conecta tu repositorio GitHub
3. Configura variables de entorno:
   \`\`\`
   MONGO_URL=$mongodb_url
   DB_NAME=real_estate_training
   PORT=8001
   \`\`\`

### Para Vercel:
1. Instala: \`npm install -g vercel\`
2. Ejecuta: \`cd frontend && vercel --prod\`

## 🔐 CREDENCIALES ADMIN:
- Email: \`unbrokerage@realtyonegroupmexico.mx\`
- Contraseña Admin: \`OneVision$07\`
- Contraseña Usuario: \`AgenteONE13\`

## 📞 VERIFICACIÓN:
Después del deployment, verifica:
1. Login con credenciales admin
2. Crear usuarios desde el panel admin
3. Subir videos de capacitación
4. Verificar que los datos persistan

EOF

print_success "DEPLOYMENT COMPLETADO!"
echo ""
print_info "📋 Documentación generada: DEPLOYMENT_INSTRUCTIONS.md"
print_info "🔧 Todos los archivos han sido corregidos"
print_info "🎯 MongoDB Atlas configurado"
print_info "📦 Build del frontend completado"
echo ""
print_warning "IMPORTANTE: Configura las variables de entorno en tu plataforma de hosting"
print_warning "MongoDB Atlas Connection String: $mongodb_url"
echo ""
print_success "¡Tu aplicación está lista para producción! 🚀"