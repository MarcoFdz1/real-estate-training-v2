#!/usr/bin/env python3
"""
Script de diagnóstico para MongoDB - Plataforma de Capacitación Inmobiliaria
"""

import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def test_mongodb_connection():
    """Probar conexión a MongoDB y mostrar información de diagnóstico"""
    
    print("🔍 DIAGNÓSTICO DE CONEXIÓN MONGODB")
    print("=" * 50)
    
    # Cargar variables de entorno
    root_dir = Path(__file__).parent
    env_file = root_dir / '.env'
    env_prod_file = root_dir / '.env.production'
    
    print(f"📁 Directorio actual: {root_dir}")
    print(f"📄 Archivo .env existe: {env_file.exists()}")
    print(f"📄 Archivo .env.production existe: {env_prod_file.exists()}")
    
    # Cargar variables de entorno local
    load_dotenv(env_file)
    
    mongo_url = os.environ.get('MONGO_URL', 'No configurado')
    db_name = os.environ.get('DB_NAME', 'No configurado')
    
    print(f"\n🔧 CONFIGURACIÓN ACTUAL:")
    print(f"MONGO_URL: {mongo_url}")
    print(f"DB_NAME: {db_name}")
    
    # Probar conexión
    print(f"\n🔌 PROBANDO CONEXIÓN...")
    
    if mongo_url == 'mongodb://localhost:27017':
        print("⚠️  USANDO CONFIGURACIÓN LOCAL")
        print("   Esto funcionará en desarrollo pero NO en producción")
        
        # Probar conexión local
        try:
            client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
            await client.admin.command('ping')
            db = client[db_name]
            print("✅ Conexión local exitosa")
            
            # Probar colecciones
            collections = await db.list_collection_names()
            print(f"📚 Colecciones encontradas: {collections}")
            
            # Contar documentos en cada colección
            for collection_name in ['categories', 'users', 'videos', 'settings']:
                if collection_name in collections:
                    count = await db[collection_name].count_documents({})
                    print(f"   - {collection_name}: {count} documentos")
                else:
                    print(f"   - {collection_name}: No existe")
                    
        except Exception as e:
            print(f"❌ Error de conexión local: {e}")
            
    else:
        print("🌐 USANDO CONFIGURACIÓN DE PRODUCCIÓN")
        
        try:
            client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000)
            await client.admin.command('ping')
            db = client[db_name]
            print("✅ Conexión de producción exitosa")
            
            # Probar colecciones
            collections = await db.list_collection_names()
            print(f"📚 Colecciones encontradas: {collections}")
            
            # Contar documentos en cada colección
            for collection_name in ['categories', 'users', 'videos', 'settings']:
                if collection_name in collections:
                    count = await db[collection_name].count_documents({})
                    print(f"   - {collection_name}: {count} documentos")
                else:
                    print(f"   - {collection_name}: No existe")
                    
        except Exception as e:
            print(f"❌ Error de conexión de producción: {e}")
    
    print(f"\n📋 RECOMENDACIONES:")
    
    if mongo_url == 'mongodb://localhost:27017':
        print("1. 🔄 Para producción, necesitas:")
        print("   a) Crear una base de datos MongoDB Atlas (gratis)")
        print("   b) Obtener la connection string")
        print("   c) Configurar variables de entorno en Railway/Vercel")
        print("   d) Actualizar el archivo .env.production")
        
        print(f"\n2. 🛠️ PASOS PARA CORREGIR:")
        print("   a) Ve a: https://cloud.mongodb.com")
        print("   b) Crea un cluster gratuito (M0)")
        print("   c) Crea un usuario de base de datos")
        print("   d) Obtén la connection string")
        print("   e) Reemplaza en .env.production:")
        print("      MONGO_URL=\"mongodb+srv://usuario:password@cluster.mongodb.net/real_estate_training?retryWrites=true&w=majority\"")
        
    else:
        print("1. ✅ Configuración de producción detectada")
        print("2. 🔍 Verifica que la connection string sea correcta")
        print("3. 🔐 Verifica credenciales de usuario de base de datos")
        print("4. 🌐 Verifica acceso de red en MongoDB Atlas")

if __name__ == "__main__":
    asyncio.run(test_mongodb_connection())