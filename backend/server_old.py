from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models for Real Estate Platform
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str
    name: str
    role: str  # 'admin' or 'user'
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = 'user'

class UserLogin(BaseModel):
    email: str
    password: str

class Video(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    thumbnail: str
    duration: str
    youtubeId: str
    match: str
    difficulty: str
    rating: float
    views: int
    releaseDate: str
    categoryId: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoCreate(BaseModel):
    title: str
    description: str
    thumbnail: str
    duration: str
    youtubeId: str
    match: str
    difficulty: str
    rating: float
    views: int
    releaseDate: str
    categoryId: str

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    icon: str
    videos: List[Video] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    icon: str

class Settings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logoUrl: str = ""
    companyName: str = "Realty ONE Group Mexico"
    loginBackgroundUrl: str = ""
    bannerUrl: str = ""
    loginTitle: str = "Iniciar Sesión"
    loginSubtitle: str = "Accede a tu plataforma de capacitación inmobiliaria"
    theme: str = "dark"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SettingsUpdate(BaseModel):
    logoUrl: Optional[str] = None
    companyName: Optional[str] = None
    loginBackgroundUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    loginTitle: Optional[str] = None
    loginSubtitle: Optional[str] = None
    theme: Optional[str] = None

class BannerVideo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    thumbnail: str
    youtubeId: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BannerVideoCreate(BaseModel):
    title: str
    description: str
    thumbnail: str
    youtubeId: str

# Legacy models for compatibility
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Authentication endpoints
@api_router.post("/auth/login")
async def login_user(user_login: UserLogin):
    # Check if it's admin default credentials
    if user_login.email == "unbrokerage@realtyonegroupmexico.mx":
        if user_login.password == "OneVision$07":
            return {"role": "admin", "email": user_login.email, "name": "Administrador"}
        elif user_login.password == "AgenteONE13":
            return {"role": "user", "email": user_login.email, "name": "Usuario"}
    
    # Check custom users in database
    user = await db.users.find_one({"email": user_login.email, "password": user_login.password})
    if user:
        return {"role": user["role"], "email": user["email"], "name": user["name"]}
    
    raise HTTPException(status_code=401, detail="Credenciales inválidas")

# User management endpoints
@api_router.post("/users", response_model=User)
async def create_user(user_create: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_create.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    user_dict = user_create.dict()
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario eliminado exitosamente"}

# Category management endpoints
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().to_list(1000)
    if not categories:
        # Initialize with default categories if none exist
        await initialize_default_categories()
        categories = await db.categories.find().to_list(1000)
    return [Category(**category) for category in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(category_create: CategoryCreate):
    category_dict = category_create.dict()
    category_obj = Category(**category_dict)
    await db.categories.insert_one(category_obj.dict())
    return category_obj

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, category_update: CategoryCreate):
    result = await db.categories.update_one(
        {"id": category_id}, 
        {"$set": category_update.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"message": "Categoría actualizada exitosamente"}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return {"message": "Categoría eliminada exitosamente"}

# Video management endpoints
@api_router.get("/videos", response_model=List[Video])
async def get_all_videos():
    videos = await db.videos.find().to_list(1000)
    return [Video(**video) for video in videos]

@api_router.post("/videos", response_model=Video)
async def create_video(video_create: VideoCreate):
    video_dict = video_create.dict()
    video_obj = Video(**video_dict)
    await db.videos.insert_one(video_obj.dict())
    
    # Also add to category's videos array
    await db.categories.update_one(
        {"id": video_create.categoryId},
        {"$push": {"videos": video_obj.dict()}}
    )
    
    return video_obj

@api_router.put("/videos/{video_id}")
async def update_video(video_id: str, video_update: VideoCreate):
    # Update video in videos collection
    result = await db.videos.update_one(
        {"id": video_id}, 
        {"$set": video_update.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    # Update video in category's videos array
    await db.categories.update_one(
        {"videos.id": video_id},
        {"$set": {"videos.$": Video(**video_update.dict()).dict()}}
    )
    
    return {"message": "Video actualizado exitosamente"}

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str):
    # Delete from videos collection
    result = await db.videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    # Remove from all categories
    await db.categories.update_many(
        {},
        {"$pull": {"videos": {"id": video_id}}}
    )
    
    return {"message": "Video eliminado exitosamente"}

# Settings management endpoints
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one()
    if not settings:
        # Create default settings if none exist
        default_settings = Settings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_update: SettingsUpdate):
    # Get current settings or create default
    current_settings = await db.settings.find_one()
    if not current_settings:
        current_settings = Settings().dict()
    
    # Update with new values
    update_dict = {k: v for k, v in settings_update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.settings.update_one(
        {"id": current_settings.get("id", str(uuid.uuid4()))},
        {"$set": update_dict},
        upsert=True
    )
    
    # Return updated settings
    updated_settings = await db.settings.find_one()
    return Settings(**updated_settings)

# Banner video endpoints
@api_router.get("/banner-video")
async def get_banner_video():
    banner_video = await db.banner_videos.find_one()
    if not banner_video:
        return None
    return BannerVideo(**banner_video)

@api_router.post("/banner-video", response_model=BannerVideo)
async def set_banner_video(banner_video_create: BannerVideoCreate):
    banner_video_dict = banner_video_create.dict()
    banner_video_obj = BannerVideo(**banner_video_dict)
    
    # Replace existing banner video
    await db.banner_videos.delete_many({})
    await db.banner_videos.insert_one(banner_video_obj.dict())
    
    return banner_video_obj

@api_router.delete("/banner-video")
async def delete_banner_video():
    result = await db.banner_videos.delete_many({})
    return {"message": "Banner video eliminado exitosamente"}

# Legacy endpoints for compatibility
@api_router.get("/")
async def root():
    return {"message": "Real Estate Training Platform API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Helper function to initialize default categories
async def initialize_default_categories():
    default_categories = [
        {"id": "1", "name": "Fundamentos Inmobiliarios", "icon": "Home", "videos": []},
        {"id": "2", "name": "Marketing y Ventas", "icon": "TrendingUp", "videos": []},
        {"id": "3", "name": "Regulaciones y Ética", "icon": "BookOpen", "videos": []},
        {"id": "4", "name": "Finanzas y Economía", "icon": "PieChart", "videos": []},
        {"id": "5", "name": "Tecnología Inmobiliaria", "icon": "Lightbulb", "videos": []},
        {"id": "6", "name": "Negociación y Cierre", "icon": "Award", "videos": []},
        {"id": "7", "name": "Desarrollo Personal", "icon": "User", "videos": []},
        {"id": "8", "name": "Evaluación de Propiedades", "icon": "Building", "videos": []},
        {"id": "9", "name": "Atención al Cliente", "icon": "Users", "videos": []}
    ]
    
    for category_data in default_categories:
        category_obj = Category(**category_data, created_at=datetime.utcnow())
        await db.categories.insert_one(category_obj.dict())