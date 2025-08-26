#!/usr/bin/env python3
import requests
import json
import uuid
import time
import sys

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://814fd4b1-15b6-4a3a-bbf6-7f00f94eded3.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

# Test results tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(name, passed, message="", response=None):
    """Log test results with formatting"""
    test_results["total"] += 1
    
    if passed:
        test_results["passed"] += 1
        status = "✅ PASS"
    else:
        test_results["failed"] += 1
        status = "❌ FAIL"
    
    test_results["tests"].append({
        "name": name,
        "passed": passed,
        "message": message,
        "response": response
    })
    
    # Print to console
    print(f"{status} | {name}")
    if message:
        print(f"       {message}")
    if response and not passed:
        print(f"       Response: {response}")
    print()

def test_auth_login():
    """Test authentication endpoints"""
    print("\n=== Testing Authentication Endpoints ===\n")
    
    # Test admin login
    admin_data = {"email": "unbrokerage@realtyonegroupmexico.mx", "password": "OneVision$07"}
    response = requests.post(f"{API_URL}/auth/login", json=admin_data)
    log_test(
        "Admin Login", 
        response.status_code == 200 and response.json().get("role") == "admin",
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Test user login
    user_data = {"email": "unbrokerage@realtyonegroupmexico.mx", "password": "AgenteONE13"}
    response = requests.post(f"{API_URL}/auth/login", json=user_data)
    log_test(
        "User Login", 
        response.status_code == 200 and response.json().get("role") == "user",
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Test invalid login
    invalid_data = {"email": "invalid@example.com", "password": "wrongpassword"}
    response = requests.post(f"{API_URL}/auth/login", json=invalid_data)
    log_test(
        "Invalid Login", 
        response.status_code == 401,
        f"Status: {response.status_code}",
        response.json() if hasattr(response, 'json') else response.text
    )

def test_user_management():
    """Test user management endpoints"""
    print("\n=== Testing User Management Endpoints ===\n")
    
    # Generate unique email to avoid conflicts
    test_email = f"test.user.{uuid.uuid4()}@example.com"
    
    # Test user creation
    user_data = {
        "email": test_email,
        "password": "securePassword123",
        "name": "Test User",
        "role": "user"
    }
    
    response = requests.post(f"{API_URL}/users", json=user_data)
    user_created = response.status_code == 200 and "id" in response.json()
    log_test(
        "Create User", 
        user_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if user_created:
        user_id = response.json()["id"]
        
        # Test get all users
        response = requests.get(f"{API_URL}/users")
        users_list = response.json() if response.status_code == 200 else []
        user_found = any(user["email"] == test_email for user in users_list)
        
        log_test(
            "Get All Users", 
            response.status_code == 200 and user_found,
            f"Status: {response.status_code}, User found: {user_found}",
            f"Found {len(users_list)} users" if response.status_code == 200 else response.text
        )
        
        # Test delete user
        response = requests.delete(f"{API_URL}/users/{user_id}")
        log_test(
            "Delete User", 
            response.status_code == 200,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        # Verify user was deleted
        response = requests.get(f"{API_URL}/users")
        users_list = response.json() if response.status_code == 200 else []
        user_deleted = not any(user["id"] == user_id for user in users_list)
        
        log_test(
            "Verify User Deletion", 
            user_deleted,
            f"User with ID {user_id} was {'not found (good)' if user_deleted else 'still found (bad)'}",
            f"Found {len(users_list)} users" if response.status_code == 200 else response.text
        )

def test_category_management():
    """Test category management endpoints"""
    print("\n=== Testing Category Management Endpoints ===\n")
    
    # Test get all categories (should auto-initialize with defaults if empty)
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    
    log_test(
        "Get All Categories", 
        response.status_code == 200 and len(categories) >= 9,  # Should have at least the 9 default categories
        f"Status: {response.status_code}, Found {len(categories)} categories",
        f"First few categories: {categories[:2]}" if categories else response.text
    )
    
    # Test category creation
    category_data = {
        "name": f"Test Category {uuid.uuid4()}",
        "icon": "TestIcon"
    }
    
    response = requests.post(f"{API_URL}/categories", json=category_data)
    category_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Create Category", 
        category_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if category_created:
        category_id = response.json()["id"]
        
        # Test update category
        update_data = {
            "name": f"Updated Category {uuid.uuid4()}",
            "icon": "UpdatedIcon"
        }
        
        response = requests.put(f"{API_URL}/categories/{category_id}", json=update_data)
        log_test(
            "Update Category", 
            response.status_code == 200,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        # Verify update
        response = requests.get(f"{API_URL}/categories")
        categories = response.json() if response.status_code == 200 else []
        updated_category = next((c for c in categories if c["id"] == category_id), None)
        
        update_verified = updated_category and updated_category["name"] == update_data["name"]
        log_test(
            "Verify Category Update", 
            update_verified,
            f"Category name {'matches' if update_verified else 'does not match'} expected value",
            updated_category if updated_category else "Category not found"
        )
        
        # Test delete category
        response = requests.delete(f"{API_URL}/categories/{category_id}")
        log_test(
            "Delete Category", 
            response.status_code == 200,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        # Verify deletion
        response = requests.get(f"{API_URL}/categories")
        categories = response.json() if response.status_code == 200 else []
        category_deleted = not any(c["id"] == category_id for c in categories)
        
        log_test(
            "Verify Category Deletion", 
            category_deleted,
            f"Category with ID {category_id} was {'not found (good)' if category_deleted else 'still found (bad)'}",
            None
        )

def test_video_management():
    """Test video management endpoints"""
    print("\n=== Testing Video Management Endpoints ===\n")
    
    # First, get a category ID to use
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    
    if not categories:
        log_test("Get Category for Video Tests", False, "No categories found to use for video tests")
        return
    
    category_id = categories[0]["id"]
    
    # Test video creation
    video_data = {
        "title": f"Test Video {uuid.uuid4()}",
        "description": "This is a test video description",
        "thumbnail": "https://example.com/thumbnail.jpg",
        "duration": "10:30",
        "youtubeId": "test12345",
        "match": "high",
        "difficulty": "medium",
        "rating": 4.5,
        "views": 100,
        "releaseDate": "2023-05-15",
        "categoryId": category_id
    }
    
    response = requests.post(f"{API_URL}/videos", json=video_data)
    video_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Create Video", 
        video_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if video_created:
        video_id = response.json()["id"]
        
        # Test get all videos
        response = requests.get(f"{API_URL}/videos")
        videos = response.json() if response.status_code == 200 else []
        video_found = any(v["id"] == video_id for v in videos)
        
        log_test(
            "Get All Videos", 
            response.status_code == 200 and video_found,
            f"Status: {response.status_code}, Video found: {video_found}",
            f"Found {len(videos)} videos" if response.status_code == 200 else response.text
        )
        
        # Test update video
        update_data = {
            "title": f"Updated Video {uuid.uuid4()}",
            "description": "Updated test video description",
            "thumbnail": "https://example.com/updated-thumbnail.jpg",
            "duration": "15:45",
            "youtubeId": "updated12345",
            "match": "medium",
            "difficulty": "hard",
            "rating": 3.5,
            "views": 200,
            "releaseDate": "2023-06-20",
            "categoryId": category_id
        }
        
        response = requests.put(f"{API_URL}/videos/{video_id}", json=update_data)
        log_test(
            "Update Video", 
            response.status_code == 200,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        # Verify video was updated in both videos collection and category
        response = requests.get(f"{API_URL}/videos")
        videos = response.json() if response.status_code == 200 else []
        updated_video = next((v for v in videos if v["id"] == video_id), None)
        
        update_verified = updated_video and updated_video["title"] == update_data["title"]
        log_test(
            "Verify Video Update", 
            update_verified,
            f"Video title {'matches' if update_verified else 'does not match'} expected value",
            updated_video if updated_video else "Video not found"
        )
        
        # Test delete video
        response = requests.delete(f"{API_URL}/videos/{video_id}")
        log_test(
            "Delete Video", 
            response.status_code == 200,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        # Verify video was deleted from both videos collection and category
        response = requests.get(f"{API_URL}/videos")
        videos = response.json() if response.status_code == 200 else []
        video_deleted = not any(v["id"] == video_id for v in videos)
        
        log_test(
            "Verify Video Deletion", 
            video_deleted,
            f"Video with ID {video_id} was {'not found (good)' if video_deleted else 'still found (bad)'}",
            None
        )

def test_settings_management():
    """Test settings management endpoints"""
    print("\n=== Testing Settings Management Endpoints ===\n")
    
    # Test get settings (should create defaults if none exist)
    response = requests.get(f"{API_URL}/settings")
    settings_exist = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Get Settings", 
        settings_exist,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if settings_exist:
        # Test update settings
        update_data = {
            "companyName": f"Updated Company Name {uuid.uuid4()}",
            "logoUrl": "https://example.com/updated-logo.png",
            "theme": "light"
        }
        
        response = requests.put(f"{API_URL}/settings", json=update_data)
        settings_updated = response.status_code == 200
        
        log_test(
            "Update Settings", 
            settings_updated,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        if settings_updated:
            # Verify settings were updated
            response = requests.get(f"{API_URL}/settings")
            updated_settings = response.json() if response.status_code == 200 else {}
            
            update_verified = (
                updated_settings.get("companyName") == update_data["companyName"] and
                updated_settings.get("logoUrl") == update_data["logoUrl"] and
                updated_settings.get("theme") == update_data["theme"]
            )
            
            log_test(
                "Verify Settings Update", 
                update_verified,
                f"Settings {'match' if update_verified else 'do not match'} expected values",
                updated_settings
            )

def test_banner_video():
    """Test banner video endpoints"""
    print("\n=== Testing Banner Video Endpoints ===\n")
    
    # Test get banner video (might be None initially)
    response = requests.get(f"{API_URL}/banner-video")
    initial_get_success = response.status_code == 200
    
    log_test(
        "Get Initial Banner Video", 
        initial_get_success,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 and response.text else "No banner video found (expected)"
    )
    
    # Test set banner video
    banner_data = {
        "title": f"Test Banner Video {uuid.uuid4()}",
        "description": "This is a test banner video",
        "thumbnail": "https://example.com/banner-thumbnail.jpg",
        "youtubeId": "banner12345"
    }
    
    response = requests.post(f"{API_URL}/banner-video", json=banner_data)
    banner_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Set Banner Video", 
        banner_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if banner_created:
        # Verify banner video was set
        response = requests.get(f"{API_URL}/banner-video")
        banner_verified = (
            response.status_code == 200 and
            response.json().get("title") == banner_data["title"]
        )
        
        log_test(
            "Verify Banner Video", 
            banner_verified,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        # Test delete banner video
        response = requests.delete(f"{API_URL}/banner-video")
        banner_deleted = response.status_code == 200
        
        log_test(
            "Delete Banner Video", 
            banner_deleted,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        if banner_deleted:
            # Verify banner video was deleted
            response = requests.get(f"{API_URL}/banner-video")
            banner_gone = response.status_code == 200 and (not response.text or response.json() is None)
            
            log_test(
                "Verify Banner Video Deletion", 
                banner_gone,
                f"Status: {response.status_code}",
                "Banner video successfully deleted" if banner_gone else f"Banner video still exists: {response.json()}"
            )

def test_video_progress_tracking():
    """Test video progress tracking endpoints"""
    print("\n=== Testing Video Progress Tracking Endpoints ===\n")
    
    # Test parameters as specified in the review request
    user_email = "unbrokerage@realtyonegroupmexico.mx"
    
    # First, get existing video IDs to use for testing
    response = requests.get(f"{API_URL}/videos")
    videos = response.json() if response.status_code == 200 else []
    
    if not videos:
        # Create a test video if none exist
        response = requests.get(f"{API_URL}/categories")
        categories = response.json() if response.status_code == 200 else []
        
        if categories:
            video_data = {
                "title": "Test Video for Progress Tracking",
                "description": "Test video description",
                "thumbnail": "https://example.com/thumbnail.jpg",
                "duration": "10:30",
                "youtubeId": "test12345",
                "match": "high",
                "difficulty": "medium",
                "rating": 4.5,
                "views": 100,
                "releaseDate": "2023-05-15",
                "categoryId": categories[0]["id"]
            }
            
            response = requests.post(f"{API_URL}/videos", json=video_data)
            if response.status_code == 200:
                videos = [response.json()]
    
    if not videos:
        log_test("Get Videos for Progress Tests", False, "No videos found to use for progress tests")
        return
    
    video_id = videos[0]["id"]
    
    # Test 1: POST /api/video-progress - Create/update video progress
    progress_data = {
        "user_email": user_email,
        "video_id": video_id,
        "progress_percentage": 75.0,
        "watch_time": 1200,
        "completed": False
    }
    
    response = requests.post(f"{API_URL}/video-progress", json=progress_data)
    progress_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Create Video Progress", 
        progress_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if progress_created:
        # Test 2: GET /api/video-progress/{user_email} - Get all progress for a user
        response = requests.get(f"{API_URL}/video-progress/{user_email}")
        user_progress_retrieved = response.status_code == 200 and isinstance(response.json(), list)
        
        log_test(
            "Get User Video Progress", 
            user_progress_retrieved,
            f"Status: {response.status_code}, Found {len(response.json()) if user_progress_retrieved else 0} progress records",
            f"First record: {response.json()[0] if user_progress_retrieved and response.json() else 'None'}"
        )
        
        # Test 3: GET /api/video-progress/{user_email}/{video_id} - Get specific video progress
        response = requests.get(f"{API_URL}/video-progress/{user_email}/{video_id}")
        specific_progress_retrieved = (
            response.status_code == 200 and 
            response.json().get("progress_percentage") == 75.0 and
            response.json().get("watch_time") == 1200
        )
        
        log_test(
            "Get Specific Video Progress", 
            specific_progress_retrieved,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        # Test 4: PUT /api/video-progress/{user_email}/{video_id} - Update video progress
        update_data = {
            "progress_percentage": 90.0,
            "watch_time": 1800,
            "completed": True
        }
        
        response = requests.put(f"{API_URL}/video-progress/{user_email}/{video_id}", json=update_data)
        progress_updated = response.status_code == 200
        
        log_test(
            "Update Video Progress", 
            progress_updated,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        if progress_updated:
            # Verify the update
            response = requests.get(f"{API_URL}/video-progress/{user_email}/{video_id}")
            update_verified = (
                response.status_code == 200 and 
                response.json().get("progress_percentage") == 90.0 and
                response.json().get("watch_time") == 1800 and
                response.json().get("completed") == True
            )
            
            log_test(
                "Verify Progress Update", 
                update_verified,
                f"Status: {response.status_code}",
                response.json() if response.status_code == 200 else response.text
            )

def test_dashboard_and_statistics():
    """Test dashboard and statistics endpoints"""
    print("\n=== Testing Dashboard and Statistics Endpoints ===\n")
    
    user_email = "unbrokerage@realtyonegroupmexico.mx"
    
    # Get existing video IDs for testing
    response = requests.get(f"{API_URL}/videos")
    videos = response.json() if response.status_code == 200 else []
    
    if not videos:
        log_test("Get Videos for Dashboard Tests", False, "No videos found to use for dashboard tests")
        return
    
    video_id = videos[0]["id"]
    
    # Test 5: GET /api/dashboard/{user_email} - Get user dashboard data
    response = requests.get(f"{API_URL}/dashboard/{user_email}")
    dashboard_retrieved = (
        response.status_code == 200 and
        "user_email" in response.json() and
        "total_videos_watched" in response.json() and
        "total_videos_completed" in response.json() and
        "total_watch_time" in response.json() and
        "completion_rate" in response.json() and
        "recent_videos" in response.json() and
        "progress_by_category" in response.json()
    )
    
    log_test(
        "Get User Dashboard", 
        dashboard_retrieved,
        f"Status: {response.status_code}",
        {
            "user_email": response.json().get("user_email"),
            "total_videos_watched": response.json().get("total_videos_watched"),
            "total_videos_completed": response.json().get("total_videos_completed"),
            "completion_rate": response.json().get("completion_rate")
        } if dashboard_retrieved else response.text
    )
    
    # Test 6: GET /api/video-stats/{video_id} - Get video statistics
    response = requests.get(f"{API_URL}/video-stats/{video_id}")
    video_stats_retrieved = (
        response.status_code == 200 and
        "total_views" in response.json() and
        "total_completions" in response.json() and
        "average_completion_rate" in response.json() and
        "average_watch_time" in response.json()
    )
    
    log_test(
        "Get Video Statistics", 
        video_stats_retrieved,
        f"Status: {response.status_code}",
        response.json() if video_stats_retrieved else response.text
    )
    
    # Test 7: GET /api/videos/{video_id}/detailed - Get detailed video with stats
    response = requests.get(f"{API_URL}/videos/{video_id}/detailed")
    detailed_video_retrieved = (
        response.status_code == 200 and
        "id" in response.json() and
        "title" in response.json() and
        "stats" in response.json() and
        "total_views" in response.json().get("stats", {})
    )
    
    log_test(
        "Get Detailed Video with Stats", 
        detailed_video_retrieved,
        f"Status: {response.status_code}",
        {
            "title": response.json().get("title"),
            "stats": response.json().get("stats")
        } if detailed_video_retrieved else response.text
    )
    
    # Test 8: GET /api/admin/stats - Get admin statistics
    response = requests.get(f"{API_URL}/admin/stats")
    admin_stats_retrieved = (
        response.status_code == 200 and
        "overview" in response.json() and
        "top_videos" in response.json() and
        "category_stats" in response.json() and
        "total_users" in response.json().get("overview", {}) and
        "total_videos" in response.json().get("overview", {}) and
        "total_categories" in response.json().get("overview", {})
    )
    
    log_test(
        "Get Admin Statistics", 
        admin_stats_retrieved,
        f"Status: {response.status_code}",
        {
            "overview": response.json().get("overview"),
            "top_videos_count": len(response.json().get("top_videos", [])),
            "category_stats_count": len(response.json().get("category_stats", {}))
        } if admin_stats_retrieved else response.text
    )

def print_summary():
    """Print test summary"""
    print("\n" + "="*50)
    print(f"TEST SUMMARY: {test_results['passed']}/{test_results['total']} tests passed")
    print("="*50)
    
    if test_results["failed"] > 0:
        print("\nFailed Tests:")
        for test in test_results["tests"]:
            if not test["passed"]:
                print(f"❌ {test['name']}")
                if test["message"]:
                    print(f"   Message: {test['message']}")
                if test["response"]:
                    print(f"   Response: {test['response']}")
                print()
    
    success_rate = (test_results["passed"] / test_results["total"]) * 100 if test_results["total"] > 0 else 0
    print(f"Success Rate: {success_rate:.2f}%")
    
    if success_rate == 100:
        print("\n🎉 All tests passed! The backend API is working correctly.")
    else:
        print(f"\n⚠️ {test_results['failed']} tests failed. Please check the details above.")

def test_optional_field_validation():
    """Test Optional Field Validation Fix - Focus on minimal required fields"""
    print("\n=== Testing Optional Field Validation Fix ===\n")
    
    # First, get a category ID to use
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    
    if not categories:
        log_test("Get Category for Optional Field Tests", False, "No categories found to use for optional field tests")
        return
    
    category_id = categories[0]["id"]
    
    # Test 1: Create video with MINIMAL required fields only (title, youtubeId, categoryId)
    minimal_video_data = {
        "title": f"Minimal Video Test {uuid.uuid4()}",
        "youtubeId": "dQw4w9WgXcQ",
        "categoryId": category_id
    }
    
    response = requests.post(f"{API_URL}/videos", json=minimal_video_data)
    video_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Create Video with Minimal Fields", 
        video_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if video_created:
        video_id = response.json()["id"]
        created_video = response.json()
        
        # Test 2: Verify optional fields got default values automatically
        expected_defaults = {
            "description": "",
            "duration": "45 min",
            "match": "95%",
            "difficulty": "Intermedio",
            "rating": 4.5,
            "views": 0
        }
        
        defaults_applied = True
        default_check_details = {}
        
        for field, expected_value in expected_defaults.items():
            actual_value = created_video.get(field)
            field_correct = actual_value == expected_value
            defaults_applied = defaults_applied and field_correct
            default_check_details[field] = {
                "expected": expected_value,
                "actual": actual_value,
                "correct": field_correct
            }
        
        # Check thumbnail auto-generation
        expected_thumbnail = f"https://img.youtube.com/vi/{minimal_video_data['youtubeId']}/maxresdefault.jpg"
        thumbnail_correct = created_video.get("thumbnail") == expected_thumbnail
        defaults_applied = defaults_applied and thumbnail_correct
        default_check_details["thumbnail"] = {
            "expected": expected_thumbnail,
            "actual": created_video.get("thumbnail"),
            "correct": thumbnail_correct
        }
        
        # Check releaseDate auto-generation (should be today's date)
        release_date = created_video.get("releaseDate")
        from datetime import datetime
        today = datetime.utcnow().strftime('%Y-%m-%d')
        release_date_correct = release_date == today
        defaults_applied = defaults_applied and release_date_correct
        default_check_details["releaseDate"] = {
            "expected": today,
            "actual": release_date,
            "correct": release_date_correct
        }
        
        log_test(
            "Verify Optional Fields Got Default Values", 
            defaults_applied,
            f"All defaults applied: {defaults_applied}",
            default_check_details
        )
        
        # Clean up - delete the test video
        requests.delete(f"{API_URL}/videos/{video_id}")
    
    # Test 3: Create category with optional description field
    minimal_category_data = {
        "name": f"Minimal Category Test {uuid.uuid4()}",
        "icon": "TestIcon"
    }
    
    response = requests.post(f"{API_URL}/categories", json=minimal_category_data)
    category_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Create Category with Minimal Fields", 
        category_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if category_created:
        category_id = response.json()["id"]
        created_category = response.json()
        
        # Test 4: Verify description gets default empty string
        description_default = created_category.get("description") == ""
        
        log_test(
            "Verify Category Description Default", 
            description_default,
            f"Description default applied: {description_default}",
            f"Expected: '', Actual: '{created_category.get('description')}'"
        )
        
        # Clean up - delete the test category
        requests.delete(f"{API_URL}/categories/{category_id}")
    
    # Test 5: Test video progress creation with minimal fields
    user_email = "unbrokerage@realtyonegroupmexico.mx"
    
    # Get a video ID for testing
    response = requests.get(f"{API_URL}/videos")
    videos = response.json() if response.status_code == 200 else []
    
    if videos:
        video_id = videos[0]["id"]
        
        minimal_progress_data = {
            "user_email": user_email,
            "video_id": video_id
        }
        
        response = requests.post(f"{API_URL}/video-progress", json=minimal_progress_data)
        progress_created = response.status_code == 200 and "id" in response.json()
        
        log_test(
            "Create Video Progress with Minimal Fields", 
            progress_created,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        if progress_created:
            created_progress = response.json()
            
            # Verify defaults for progress
            progress_defaults = {
                "progress_percentage": 0.0,
                "watch_time": 0,
                "completed": False
            }
            
            progress_defaults_applied = True
            progress_default_details = {}
            
            for field, expected_value in progress_defaults.items():
                actual_value = created_progress.get(field)
                field_correct = actual_value == expected_value
                progress_defaults_applied = progress_defaults_applied and field_correct
                progress_default_details[field] = {
                    "expected": expected_value,
                    "actual": actual_value,
                    "correct": field_correct
                }
            
            log_test(
                "Verify Video Progress Default Values", 
                progress_defaults_applied,
                f"All progress defaults applied: {progress_defaults_applied}",
                progress_default_details
            )

def main():
    """Run all tests"""
    print(f"Testing backend API at: {API_URL}")
    print("="*50)
    
    try:
        # Test API connectivity
        response = requests.get(f"{API_URL}/")
        if response.status_code != 200:
            print(f"❌ API connectivity test failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        print("✅ API connectivity test passed")
        print(f"Response: {response.json()}")
        print("="*50 + "\n")
        
        # Run focused test for Optional Field Validation Fix
        test_optional_field_validation()
        
        # Run other test suites
        test_auth_login()
        test_user_management()
        test_category_management()
        test_video_management()
        test_settings_management()
        test_banner_video()
        test_video_progress_tracking()
        test_dashboard_and_statistics()
        
        # Print summary
        print_summary()
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to the API: {e}")
        print(f"Make sure the backend is running and accessible at {API_URL}")
        sys.exit(1)

if __name__ == "__main__":
    main()