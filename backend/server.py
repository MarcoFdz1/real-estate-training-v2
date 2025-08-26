from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
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
import hashlib
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="Real Estate Training Platform API", version="1.0.0")

# MongoDB connection with fallback
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'real_estate_training')

async def init_db():
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        # Test connection
        await client.admin.command('ping')
        db = client[db_name]
        print("✅ MongoDB connected successfully")
        return client, db
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        # Use in-memory storage as fallback
        from motor.core import AgnosticDatabase
        class InMemoryDB:
            def __init__(self):
                self.data = {
                    'categories': [],
                    'users': [],
                    'videos': [],
                    'settings': [],
                    'banner_videos': []
                }
            
            def __getattr__(self, name):
                return InMemoryCollection(self.data.get(name, []))
        
        class InMemoryCollection:
            def __init__(self, data):
                self.data = data
            
            async def find(self):
                return MockCursor(self.data)
            
            async def find_one(self, query=None):
                return self.data[0] if self.data else None
            
            async def insert_one(self, doc):
                self.data.append(doc)
                return type('Result', (), {'inserted_id': 'temp'})()
            
            async def update_one(self, query, update):
                return type('Result', (), {'matched_count': 1})()
            
            async def delete_one(self, query):
                return type('Result', (), {'deleted_count': 1})()
            
            async def delete_many(self, query):
                return type('Result', (), {'deleted_count': len(self.data)})()
        
        class MockCursor:
            def __init__(self, data):
                self.data = data
            
            async def to_list(self, length):
                return self.data
        
        return None, InMemoryDB()

client, db = None, None  # Initialize with None
@app.on_event("startup")
async def startup_db_client():
    global client, db
    client, db = await init_db()

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
    # Video source information
    video_type: str  # 'youtube', 'vimeo', 'mp4'
    youtubeId: Optional[str] = None
    vimeoId: Optional[str] = None
    mp4_url: Optional[str] = None
    mp4_filename: Optional[str] = None
    # Video metadata
    match: str
    difficulty: str
    rating: float
    views: int
    releaseDate: str
    categoryId: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    thumbnail: Optional[str] = None
    duration: Optional[str] = "45 min"
    # Video source - only one should be provided
    video_type: str  # 'youtube', 'vimeo', 'mp4'
    youtubeId: Optional[str] = None
    vimeoId: Optional[str] = None
    mp4_url: Optional[str] = None
    mp4_filename: Optional[str] = None
    # Optional fields
    match: Optional[str] = "95%"
    difficulty: Optional[str] = "Intermedio"
    rating: Optional[float] = 4.5
    views: Optional[int] = 0
    releaseDate: Optional[str] = None
    categoryId: str

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[str] = None
    video_type: Optional[str] = None
    youtubeId: Optional[str] = None
    vimeoId: Optional[str] = None
    mp4_url: Optional[str] = None
    mp4_filename: Optional[str] = None
    match: Optional[str] = None
    difficulty: Optional[str] = None
    rating: Optional[float] = None
    views: Optional[int] = None
    releaseDate: Optional[str] = None
    categoryId: Optional[str] = None

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    icon: str
    videos: List[Video] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: str

class Settings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logoUrl: str = ""
    companyName: str = "Realty ONE Group Mexico"
    loginBackgroundUrl: str = ""
    bannerUrl: str = ""
    loginTitle: str = "Iniciar Sesión"
    loginSubtitle: str = "Accede a tu plataforma de capacitación inmobiliaria"
    heroTitle: str = "Plataforma de Capacitación Inmobiliaria"
    heroSubtitle: str = "Explora nuestro contenido educativo especializado"
    theme: str = "dark"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SettingsUpdate(BaseModel):
    logoUrl: Optional[str] = None
    companyName: Optional[str] = None
    loginBackgroundUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    loginTitle: Optional[str] = None
    loginSubtitle: Optional[str] = None
    heroTitle: Optional[str] = None
    heroSubtitle: Optional[str] = None
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

# Video Progress Tracking Models
class VideoProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    video_id: str
    progress_percentage: float = 0.0
    watch_time: int = 0  # in seconds
    completed: bool = False
    last_watched: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoProgressCreate(BaseModel):
    user_email: str
    video_id: str
    progress_percentage: float = 0.0
    watch_time: int = 0
    completed: bool = False

class VideoProgressUpdate(BaseModel):
    progress_percentage: Optional[float] = None
    watch_time: Optional[int] = None
    completed: Optional[bool] = None

# Enhanced Video Model with statistics
class VideoStats(BaseModel):
    total_views: int = 0
    total_completions: int = 0
    average_completion_rate: float = 0.0
    average_watch_time: int = 0

class VideoWithStats(BaseModel):
    id: str
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
    created_at: datetime
    stats: VideoStats = Field(default_factory=VideoStats)

# User Dashboard Model
class UserDashboard(BaseModel):
    user_email: str
    total_videos_watched: int = 0
    total_videos_completed: int = 0
    total_watch_time: int = 0  # in seconds
    completion_rate: float = 0.0
    recent_videos: List[VideoWithStats] = []
    progress_by_category: Dict[str, Dict[str, Any]] = {}


# Helper functions for video processing
def get_vimeo_thumbnail(vimeo_id: str) -> str:
    """Generate Vimeo thumbnail URL from video ID"""
    try:
        import requests
        response = requests.get(f"https://vimeo.com/api/v2/video/{vimeo_id}.json")
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return data[0].get('thumbnail_large', f"https://i.vimeocdn.com/video/{vimeo_id}_640.jpg")
    except:
        pass
    return f"https://i.vimeocdn.com/video/{vimeo_id}_640.jpg"

def extract_vimeo_id(url: str) -> str:
    """Extract Vimeo ID from various Vimeo URL formats"""
    import re
    patterns = [
        r'vimeo\.com/(\d+)',
        r'player\.vimeo\.com/video/(\d+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return url  # Return as-is if no pattern matches

def extract_youtube_id(url: str) -> str:
    """Extract YouTube ID from various YouTube URL formats"""
    import re
    patterns = [
        r'youtube\.com/watch\?v=([^&\n?#]+)',
        r'youtu\.be/([^&\n?#]+)',
        r'youtube\.com/embed/([^&\n?#]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return url  # Return as-is if no pattern matches

# Helper function to hash password
def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password


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
    user = await db.users.find_one({"email": user_login.email})
    if user:
        # Check both hashed and plain passwords for backwards compatibility
        if (user.get("password") == user_login.password or 
            verify_password(user_login.password, user.get("password", ""))):
            return {"role": user["role"], "email": user["email"], "name": user["name"]}
    
    raise HTTPException(status_code=401, detail="Credenciales inválidas")

# Video Progress Tracking Endpoints
@api_router.post("/video-progress", response_model=VideoProgress)
async def create_or_update_video_progress(progress_data: VideoProgressCreate):
    # Check if progress already exists for this user and video
    existing_progress = await db.video_progress.find_one({
        "user_email": progress_data.user_email,
        "video_id": progress_data.video_id
    })
    
    if existing_progress:
        # Update existing progress
        update_data = progress_data.dict()
        update_data["last_watched"] = datetime.utcnow()
        
        await db.video_progress.update_one(
            {"user_email": progress_data.user_email, "video_id": progress_data.video_id},
            {"$set": update_data}
        )
        
        # Return updated progress
        updated_progress = await db.video_progress.find_one({
            "user_email": progress_data.user_email,
            "video_id": progress_data.video_id
        })
        return VideoProgress(**updated_progress)
    else:
        # Create new progress record
        progress_obj = VideoProgress(**progress_data.dict())
        await db.video_progress.insert_one(progress_obj.dict())
        return progress_obj

@api_router.get("/video-progress/{user_email}")
async def get_user_video_progress(user_email: str):
    progress_list = await db.video_progress.find({"user_email": user_email}).to_list(1000)
    return [VideoProgress(**progress) for progress in progress_list]

@api_router.get("/video-progress/{user_email}/{video_id}")
async def get_video_progress(user_email: str, video_id: str):
    progress = await db.video_progress.find_one({
        "user_email": user_email,
        "video_id": video_id
    })
    if not progress:
        return {"progress_percentage": 0.0, "watch_time": 0, "completed": False}
    return VideoProgress(**progress)

@api_router.put("/video-progress/{user_email}/{video_id}")
async def update_video_progress(user_email: str, video_id: str, progress_update: VideoProgressUpdate):
    update_data = {k: v for k, v in progress_update.dict().items() if v is not None}
    update_data["last_watched"] = datetime.utcnow()
    
    result = await db.video_progress.update_one(
        {"user_email": user_email, "video_id": video_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Progreso no encontrado")
    
    return {"message": "Progreso actualizado exitosamente"}

@api_router.get("/dashboard/{user_email}")
async def get_user_dashboard(user_email: str):
    # Get all progress for user
    progress_list = await db.video_progress.find({"user_email": user_email}).to_list(1000)
    
    # Calculate statistics
    total_videos_watched = len(progress_list)
    total_videos_completed = sum(1 for p in progress_list if p.get("completed", False))
    total_watch_time = sum(p.get("watch_time", 0) for p in progress_list)
    completion_rate = (total_videos_completed / total_videos_watched * 100) if total_videos_watched > 0 else 0
    
    # Get recent videos (last 5 watched)
    recent_progress = sorted(progress_list, key=lambda x: x.get("last_watched", datetime.min), reverse=True)[:5]
    recent_videos = []
    
    for progress in recent_progress:
        video = await db.videos.find_one({"id": progress["video_id"]})
        if video:
            video_stats = await calculate_video_stats(progress["video_id"])
            video_with_stats = VideoWithStats(**video, stats=video_stats)
            recent_videos.append(video_with_stats)
    
    # Get progress by category
    progress_by_category = {}
    categories = await db.categories.find().to_list(1000)
    
    for category in categories:
        category_videos = await db.videos.find({"categoryId": category["id"]}).to_list(1000)
        category_video_ids = [v["id"] for v in category_videos]
        
        category_progress = [p for p in progress_list if p["video_id"] in category_video_ids]
        watched_count = len(category_progress)
        completed_count = sum(1 for p in category_progress if p.get("completed", False))
        
        progress_by_category[category["name"]] = {
            "total_videos": len(category_videos),
            "watched_videos": watched_count,
            "completed_videos": completed_count,
            "completion_rate": (completed_count / watched_count * 100) if watched_count > 0 else 0
        }
    
    return UserDashboard(
        user_email=user_email,
        total_videos_watched=total_videos_watched,
        total_videos_completed=total_videos_completed,
        total_watch_time=total_watch_time,
        completion_rate=completion_rate,
        recent_videos=recent_videos,
        progress_by_category=progress_by_category
    )

# Helper function to calculate video statistics
async def calculate_video_stats(video_id: str) -> VideoStats:
    progress_list = await db.video_progress.find({"video_id": video_id}).to_list(1000)
    
    total_views = len(progress_list)
    total_completions = sum(1 for p in progress_list if p.get("completed", False))
    average_completion_rate = (total_completions / total_views * 100) if total_views > 0 else 0
    average_watch_time = sum(p.get("watch_time", 0) for p in progress_list) // total_views if total_views > 0 else 0
    
    return VideoStats(
        total_views=total_views,
        total_completions=total_completions,
        average_completion_rate=average_completion_rate,
        average_watch_time=average_watch_time
    )

@api_router.get("/video-stats/{video_id}")
async def get_video_stats(video_id: str):
    stats = await calculate_video_stats(video_id)
    return stats

# Enhanced video endpoint with statistics
@api_router.get("/videos/{video_id}/detailed")
async def get_video_detailed(video_id: str):
    video = await db.videos.find_one({"id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    stats = await calculate_video_stats(video_id)
    return VideoWithStats(**video, stats=stats)

# Enhanced Video Management Endpoints

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str):
    # Delete video
    result = await db.videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    # Also delete any progress records for this video
    await db.video_progress.delete_many({"video_id": video_id})
    
    return {"message": "Video eliminado exitosamente"}

# Enhanced Category Management Endpoints
@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate):
    category_obj = Category(**category_data.dict())
    await db.categories.insert_one(category_obj.dict())
    return category_obj

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, category_data: CategoryCreate):
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": category_data.dict()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    return {"message": "Categoría actualizada exitosamente"}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    # Delete all videos in this category first
    await db.videos.delete_many({"categoryId": category_id})
    
    # Delete the category
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    return {"message": "Categoría y videos asociados eliminados exitosamente"}

# Video Progress Tracking Endpoints
@api_router.post("/video-progress", response_model=VideoProgress)
async def create_or_update_video_progress(progress_data: VideoProgressCreate):
    # Check if progress already exists for this user and video
    existing_progress = await db.video_progress.find_one({
        "user_email": progress_data.user_email,
        "video_id": progress_data.video_id
    })
    
    if existing_progress:
        # Update existing progress
        update_data = progress_data.dict()
        update_data["last_watched"] = datetime.utcnow()
        
        await db.video_progress.update_one(
            {"user_email": progress_data.user_email, "video_id": progress_data.video_id},
            {"$set": update_data}
        )
        
        # Return updated progress
        updated_progress = await db.video_progress.find_one({
            "user_email": progress_data.user_email,
            "video_id": progress_data.video_id
        })
        return VideoProgress(**updated_progress)
    else:
        # Create new progress record
        progress_obj = VideoProgress(**progress_data.dict())
        await db.video_progress.insert_one(progress_obj.dict())
        return progress_obj

@api_router.get("/video-progress/{user_email}")
async def get_user_video_progress(user_email: str):
    progress_list = await db.video_progress.find({"user_email": user_email}).to_list(1000)
    return [VideoProgress(**progress) for progress in progress_list]

@api_router.get("/video-progress/{user_email}/{video_id}")
async def get_video_progress(user_email: str, video_id: str):
    progress = await db.video_progress.find_one({
        "user_email": user_email,
        "video_id": video_id
    })
    if not progress:
        return {"progress_percentage": 0.0, "watch_time": 0, "completed": False}
    return VideoProgress(**progress)

@api_router.put("/video-progress/{user_email}/{video_id}")
async def update_video_progress(user_email: str, video_id: str, progress_update: VideoProgressUpdate):
    update_data = {k: v for k, v in progress_update.dict().items() if v is not None}
    update_data["last_watched"] = datetime.utcnow()
    
    result = await db.video_progress.update_one(
        {"user_email": user_email, "video_id": video_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Progreso no encontrado")
    
    return {"message": "Progreso actualizado exitosamente"}

@api_router.get("/dashboard/{user_email}")
async def get_user_dashboard(user_email: str):
    # Get all progress for user
    progress_list = await db.video_progress.find({"user_email": user_email}).to_list(1000)
    
    # Calculate statistics
    total_videos_watched = len(progress_list)
    total_videos_completed = sum(1 for p in progress_list if p.get("completed", False))
    total_watch_time = sum(p.get("watch_time", 0) for p in progress_list)
    completion_rate = (total_videos_completed / total_videos_watched * 100) if total_videos_watched > 0 else 0
    
    # Get recent videos (last 5 watched)
    recent_progress = sorted(progress_list, key=lambda x: x.get("last_watched", datetime.min), reverse=True)[:5]
    recent_videos = []
    
    for progress in recent_progress:
        video = await db.videos.find_one({"id": progress["video_id"]})
        if video:
            video_stats = await calculate_video_stats(progress["video_id"])
            video_with_stats = VideoWithStats(**video, stats=video_stats)
            recent_videos.append(video_with_stats)
    
    # Get progress by category
    progress_by_category = {}
    categories = await db.categories.find().to_list(1000)
    
    for category in categories:
        category_videos = await db.videos.find({"categoryId": category["id"]}).to_list(1000)
        category_video_ids = [v["id"] for v in category_videos]
        
        category_progress = [p for p in progress_list if p["video_id"] in category_video_ids]
        watched_count = len(category_progress)
        completed_count = sum(1 for p in category_progress if p.get("completed", False))
        
        progress_by_category[category["name"]] = {
            "total_videos": len(category_videos),
            "watched_videos": watched_count,
            "completed_videos": completed_count,
            "completion_rate": (completed_count / watched_count * 100) if watched_count > 0 else 0
        }
    
    return UserDashboard(
        user_email=user_email,
        total_videos_watched=total_videos_watched,
        total_videos_completed=total_videos_completed,
        total_watch_time=total_watch_time,
        completion_rate=completion_rate,
        recent_videos=recent_videos,
        progress_by_category=progress_by_category
    )

# Helper function to calculate video statistics
async def calculate_video_stats(video_id: str) -> VideoStats:
    progress_list = await db.video_progress.find({"video_id": video_id}).to_list(1000)
    
    total_views = len(progress_list)
    total_completions = sum(1 for p in progress_list if p.get("completed", False))
    average_completion_rate = (total_completions / total_views * 100) if total_views > 0 else 0
    average_watch_time = sum(p.get("watch_time", 0) for p in progress_list) // total_views if total_views > 0 else 0
    
    return VideoStats(
        total_views=total_views,
        total_completions=total_completions,
        average_completion_rate=average_completion_rate,
        average_watch_time=average_watch_time
    )

@api_router.get("/video-stats/{video_id}")
async def get_video_stats(video_id: str):
    stats = await calculate_video_stats(video_id)
    return stats

# Enhanced video endpoint with statistics
@api_router.get("/videos/{video_id}/detailed")
async def get_video_detailed(video_id: str):
    video = await db.videos.find_one({"id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    stats = await calculate_video_stats(video_id)
    return VideoWithStats(**video, stats=stats)

# User management endpoints
@api_router.post("/users", response_model=User)
async def create_user(user_create: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_create.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    user_dict = user_create.dict()
    # Store password as plain text for now for compatibility
    # In production, you should hash the password
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
    
    # Get videos for each category
    for category in categories:
        category_videos = await db.videos.find({"categoryId": category["id"]}).to_list(1000)
        category["videos"] = [Video(**video) for video in category_videos]
    
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

# MP4 File Upload endpoint
@api_router.post("/upload-mp4")
async def upload_mp4_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    categoryId: str = Form(...),
    duration: str = Form("45 min"),
    difficulty: str = Form("Intermedio")
):
    """Upload MP4 video file and store in database"""
    
    # Validate file type
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un video")
    
    if not file.filename.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
        raise HTTPException(status_code=400, detail="Formato de video no soportado")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Convert to base64 for storage (for small files) or save reference
        if len(file_content) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=400, detail="El archivo es demasiado grande (máximo 50MB)")
        
        # Create unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{str(uuid.uuid4())}.{file_extension}"
        
        # For this implementation, we'll store file as base64 in database
        # In production, you'd want to use cloud storage (S3, etc.)
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        mp4_url = f"data:video/{file_extension};base64,{file_base64}"
        
        # Create video object
        video_data = {
            "title": title,
            "description": description,
            "video_type": "mp4",
            "mp4_url": mp4_url,
            "mp4_filename": unique_filename,
            "thumbnail": "https://via.placeholder.com/640x360/1a1a1a/ffffff?text=MP4+Video",
            "duration": duration,
            "difficulty": difficulty,
            "categoryId": categoryId,
            "match": "100%",
            "rating": 4.5,
            "views": 0,
            "releaseDate": datetime.utcnow().strftime('%Y-%m-%d'),
            "youtubeId": None,
            "vimeoId": None
        }
        
        video_obj = Video(**video_data)
        await db.videos.insert_one(video_obj.dict())
        
        return {"message": "Video MP4 subido exitosamente", "video_id": video_obj.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir archivo: {str(e)}")

# Enhanced video creation endpoint
@api_router.get("/videos", response_model=List[Video])
async def get_all_videos():
    videos = await db.videos.find().to_list(1000)
    return [Video(**video) for video in videos]

# Enhanced video creation endpoint
@api_router.post("/videos", response_model=Video)
async def create_video(video_create: VideoCreate):
    video_dict = video_create.dict()
    
    # Process based on video type
    if video_dict['video_type'] == 'youtube':
        if not video_dict.get('youtubeId'):
            raise HTTPException(status_code=400, detail="youtubeId es requerido para videos de YouTube")
        
        # Auto-generate thumbnail if not provided
        if not video_dict.get('thumbnail'):
            video_dict['thumbnail'] = f"https://img.youtube.com/vi/{video_dict['youtubeId']}/maxresdefault.jpg"
        
        # Clear other video type fields
        video_dict['vimeoId'] = None
        video_dict['mp4_url'] = None
        video_dict['mp4_filename'] = None
        
    elif video_dict['video_type'] == 'vimeo':
        if not video_dict.get('vimeoId'):
            raise HTTPException(status_code=400, detail="vimeoId es requerido para videos de Vimeo")
        
        # Auto-generate thumbnail if not provided
        if not video_dict.get('thumbnail'):
            video_dict['thumbnail'] = get_vimeo_thumbnail(video_dict['vimeoId'])
        
        # Clear other video type fields
        video_dict['youtubeId'] = None
        video_dict['mp4_url'] = None
        video_dict['mp4_filename'] = None
        
    elif video_dict['video_type'] == 'mp4':
        if not video_dict.get('mp4_url'):
            raise HTTPException(status_code=400, detail="mp4_url es requerido para videos MP4")
        
        # Use default thumbnail for MP4 if not provided
        if not video_dict.get('thumbnail'):
            video_dict['thumbnail'] = "https://via.placeholder.com/640x360/1a1a1a/ffffff?text=MP4+Video"
        
        # Clear other video type fields
        video_dict['youtubeId'] = None
        video_dict['vimeoId'] = None
        
    else:
        raise HTTPException(status_code=400, detail="Tipo de video no válido. Usa: 'youtube', 'vimeo', o 'mp4'")
    
    # Auto-generate releaseDate if not provided
    if not video_dict.get('releaseDate'):
        video_dict['releaseDate'] = datetime.utcnow().strftime('%Y-%m-%d')
    
    video_obj = Video(**video_dict)
    await db.videos.insert_one(video_obj.dict())
    return video_obj

@api_router.put("/videos/{video_id}")
async def update_video(video_id: str, video_update: VideoUpdate):
    # Check if video exists
    existing_video = await db.videos.find_one({"id": video_id})
    if not existing_video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    # Create update data with only non-None values
    update_data = {k: v for k, v in video_update.dict().items() if v is not None}
    
    # If no fields to update, return success
    if not update_data:
        return {"message": "No hay campos para actualizar"}
    
    # Update video in videos collection
    result = await db.videos.update_one(
        {"id": video_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    return {"message": "Video actualizado exitosamente"}

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str):
    # Delete from videos collection
    result = await db.videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
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

# Admin Statistics Endpoint
@api_router.get("/admin/stats")
async def get_admin_stats():
    # Get total counts
    total_users = len(await db.users.find().to_list(1000))
    total_videos = len(await db.videos.find().to_list(1000))
    total_categories = len(await db.categories.find().to_list(1000))
    
    # Get progress statistics
    all_progress = await db.video_progress.find().to_list(10000)
    total_video_views = len(all_progress)
    total_completions = sum(1 for p in all_progress if p.get("completed", False))
    total_watch_time = sum(p.get("watch_time", 0) for p in all_progress)
    
    # Get most watched videos
    video_view_counts = {}
    for progress in all_progress:
        video_id = progress["video_id"]
        video_view_counts[video_id] = video_view_counts.get(video_id, 0) + 1
    
    # Get top 5 most watched videos
    top_videos = sorted(video_view_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top_videos_detailed = []
    
    for video_id, view_count in top_videos:
        video = await db.videos.find_one({"id": video_id})
        if video:
            stats = await calculate_video_stats(video_id)
            top_videos_detailed.append({
                "video": VideoWithStats(**video, stats=stats),
                "view_count": view_count
            })
    
    # Get completion rate by category
    categories = await db.categories.find().to_list(1000)
    category_stats = {}
    
    for category in categories:
        category_videos = await db.videos.find({"categoryId": category["id"]}).to_list(1000)
        category_video_ids = [v["id"] for v in category_videos]
        
        category_progress = [p for p in all_progress if p["video_id"] in category_video_ids]
        watched_count = len(category_progress)
        completed_count = sum(1 for p in category_progress if p.get("completed", False))
        
        category_stats[category["name"]] = {
            "total_videos": len(category_videos),
            "total_views": watched_count,
            "total_completions": completed_count,
            "completion_rate": (completed_count / watched_count * 100) if watched_count > 0 else 0
        }
    
    return {
        "overview": {
            "total_users": total_users,
            "total_videos": total_videos,
            "total_categories": total_categories,
            "total_video_views": total_video_views,
            "total_completions": total_completions,
            "total_watch_time": total_watch_time,
            "overall_completion_rate": (total_completions / total_video_views * 100) if total_video_views > 0 else 0
        },
        "top_videos": top_videos_detailed,
        "category_stats": category_stats
    }

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