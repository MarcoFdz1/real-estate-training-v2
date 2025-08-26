#!/usr/bin/env python3
"""
Script para migrar datos de MongoDB local a MongoDB Atlas
"""

import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def migrate_data():
    """Migrar datos de local a producción"""
    
    print("🔄 MIGRACIÓN DE DATOS")
    print("=" * 50)
    
    # Configuración local
    local_url = "mongodb://localhost:27017"
    local_db_name = "test_database"
    
    # Configuración de producción (debes configurar esto)
    prod_url = input("📝 Ingresa tu MongoDB Atlas connection string: ").strip()
    prod_db_name = "real_estate_training"
    
    if not prod_url or "localhost" in prod_url:
        print("❌ Error: Necesitas una connection string válida de MongoDB Atlas")
        return
    
    try:
        # Conectar a base de datos local
        print("🔌 Conectando a MongoDB local...")
        local_client = AsyncIOMotorClient(local_url, serverSelectionTimeoutMS=5000)
        local_db = local_client[local_db_name]
        
        # Conectar a base de datos de producción
        print("🔌 Conectando a MongoDB Atlas...")
        prod_client = AsyncIOMotorClient(prod_url, serverSelectionTimeoutMS=10000)
        await prod_client.admin.command('ping')
        prod_db = prod_client[prod_db_name]
        
        print("✅ Conexiones establecidas")
        
        # Migrar cada colección
        collections_to_migrate = ['categories', 'users', 'videos', 'settings', 'video_progress']
        
        for collection_name in collections_to_migrate:
            print(f"\n📋 Migrando colección: {collection_name}")
            
            # Obtener datos de local
            local_docs = await local_db[collection_name].find().to_list(1000)
            count_local = len(local_docs)
            
            if count_local > 0:
                # Insertar en producción (sin duplicados)
                for doc in local_docs:
                    # Verificar si ya existe
                    existing = await prod_db[collection_name].find_one({"id": doc.get("id")})
                    if not existing:
                        await prod_db[collection_name].insert_one(doc)
                        print(f"   ✅ Migrado: {doc.get('name', doc.get('title', doc.get('email', 'documento')))}")
                    else:
                        print(f"   ⚠️  Ya existe: {doc.get('name', doc.get('title', doc.get('email', 'documento')))}")
                
                # Verificar migración
                count_prod = await prod_db[collection_name].count_documents({})
                print(f"   📊 Local: {count_local} docs → Producción: {count_prod} docs")
            else:
                print(f"   📭 Colección vacía en local")
        
        print(f"\n🎉 MIGRACIÓN COMPLETADA")
        print(f"✅ Todos los datos han sido migrados a MongoDB Atlas")
        print(f"✅ Tu aplicación en Railway ahora debería funcionar correctamente")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_data())