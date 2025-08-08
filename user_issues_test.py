#!/usr/bin/env python3
"""
Focused testing for user-reported issues in Real Estate Training Platform
Testing specific issues mentioned in the review request:
1. User Authentication Issue - newly created users cannot login
2. Video Thumbnail Management - verify thumbnail updates work
3. Category Management - test creation, editing, deletion
4. Optional Field Validation - test optional parameters
5. Settings/Text Management - verify landing page text editing
"""

import requests
import json
import uuid
import time
import sys

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://814fd4b1-15b6-4a3a-bbf6-7f00f94eded3.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

# Admin credentials for testing
ADMIN_EMAIL = "unbrokerage@realtyonegroupmexico.mx"
ADMIN_PASSWORD = "OneVision$07"

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

def test_user_authentication_issue():
    """
    CRITICAL ISSUE 1: Test if newly created users can actually login
    User reported: "Users can be created, but new users are not recognized/cannot log in"
    """
    print("\n=== TESTING USER AUTHENTICATION ISSUE ===\n")
    
    # Generate unique test user data
    test_email = f"newuser.{uuid.uuid4().hex[:8]}@realestate.com"
    test_password = "SecurePass123!"
    test_name = "New Test User"
    
    # Step 1: Create a new user
    user_data = {
        "email": test_email,
        "password": test_password,
        "name": test_name,
        "role": "user"
    }
    
    response = requests.post(f"{API_URL}/users", json=user_data)
    user_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Create New User", 
        user_created,
        f"Status: {response.status_code}, Email: {test_email}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not user_created:
        log_test("User Authentication Flow", False, "Cannot test login - user creation failed")
        return
    
    user_id = response.json()["id"]
    
    # Step 2: Immediately try to login with the newly created user
    login_data = {
        "email": test_email,
        "password": test_password
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=login_data)
    login_successful = (
        response.status_code == 200 and 
        response.json().get("email") == test_email and
        response.json().get("role") == "user" and
        response.json().get("name") == test_name
    )
    
    log_test(
        "CRITICAL: New User Login Test", 
        login_successful,
        f"Status: {response.status_code}, Expected email: {test_email}, Got: {response.json().get('email') if response.status_code == 200 else 'N/A'}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Step 3: Test with admin role user
    admin_test_email = f"admin.{uuid.uuid4().hex[:8]}@realestate.com"
    admin_user_data = {
        "email": admin_test_email,
        "password": test_password,
        "name": "New Admin User",
        "role": "admin"
    }
    
    response = requests.post(f"{API_URL}/users", json=admin_user_data)
    admin_created = response.status_code == 200
    
    log_test(
        "Create New Admin User", 
        admin_created,
        f"Status: {response.status_code}, Email: {admin_test_email}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if admin_created:
        admin_login_data = {
            "email": admin_test_email,
            "password": test_password
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=admin_login_data)
        admin_login_successful = (
            response.status_code == 200 and 
            response.json().get("email") == admin_test_email and
            response.json().get("role") == "admin"
        )
        
        log_test(
            "CRITICAL: New Admin Login Test", 
            admin_login_successful,
            f"Status: {response.status_code}, Expected role: admin, Got: {response.json().get('role') if response.status_code == 200 else 'N/A'}",
            response.json() if response.status_code == 200 else response.text
        )
        
        # Cleanup admin user
        if admin_created:
            admin_id = response.json().get("id") if response.status_code == 200 else None
            if admin_id:
                requests.delete(f"{API_URL}/users/{admin_id}")
    
    # Step 4: Test edge cases
    # Test with wrong password
    wrong_password_data = {
        "email": test_email,
        "password": "WrongPassword123"
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=wrong_password_data)
    wrong_password_rejected = response.status_code == 401
    
    log_test(
        "Wrong Password Rejection", 
        wrong_password_rejected,
        f"Status: {response.status_code} (should be 401)",
        response.json() if hasattr(response, 'json') and response.text else response.text
    )
    
    # Cleanup test user
    requests.delete(f"{API_URL}/users/{user_id}")

def test_video_thumbnail_management():
    """
    CRITICAL ISSUE 2: Test video thumbnail management functionality
    User reported missing: "Option to change video thumbnails and manage them completely"
    """
    print("\n=== TESTING VIDEO THUMBNAIL MANAGEMENT ===\n")
    
    # First, get a category to use
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    
    if not categories:
        log_test("Get Categories for Video Tests", False, "No categories found")
        return
    
    category_id = categories[0]["id"]
    
    # Step 1: Create a video with initial thumbnail
    initial_thumbnail = "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    video_data = {
        "title": f"Thumbnail Test Video {uuid.uuid4().hex[:8]}",
        "description": "Video for testing thumbnail management",
        "thumbnail": initial_thumbnail,
        "duration": "5:30",
        "youtubeId": "dQw4w9WgXcQ",
        "match": "high",
        "difficulty": "básico",
        "rating": 4.2,
        "views": 150,
        "releaseDate": "2024-01-15",
        "categoryId": category_id
    }
    
    response = requests.post(f"{API_URL}/videos", json=video_data)
    video_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "Create Video with Thumbnail", 
        video_created,
        f"Status: {response.status_code}, Initial thumbnail: {initial_thumbnail}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not video_created:
        return
    
    video_id = response.json()["id"]
    
    # Step 2: Update video thumbnail
    updated_thumbnail = "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    update_data = {
        "title": video_data["title"],
        "description": video_data["description"],
        "thumbnail": updated_thumbnail,  # This is the key test
        "duration": video_data["duration"],
        "youtubeId": video_data["youtubeId"],
        "match": video_data["match"],
        "difficulty": video_data["difficulty"],
        "rating": video_data["rating"],
        "views": video_data["views"],
        "releaseDate": video_data["releaseDate"],
        "categoryId": video_data["categoryId"]
    }
    
    response = requests.put(f"{API_URL}/videos/{video_id}", json=update_data)
    thumbnail_updated = response.status_code == 200
    
    log_test(
        "CRITICAL: Update Video Thumbnail", 
        thumbnail_updated,
        f"Status: {response.status_code}, New thumbnail: {updated_thumbnail}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Step 3: Verify thumbnail was actually updated
    response = requests.get(f"{API_URL}/videos")
    videos = response.json() if response.status_code == 200 else []
    updated_video = next((v for v in videos if v["id"] == video_id), None)
    
    thumbnail_verified = (
        updated_video is not None and 
        updated_video.get("thumbnail") == updated_thumbnail
    )
    
    log_test(
        "CRITICAL: Verify Thumbnail Update", 
        thumbnail_verified,
        f"Expected: {updated_thumbnail}, Got: {updated_video.get('thumbnail') if updated_video else 'Video not found'}",
        updated_video
    )
    
    # Step 4: Test thumbnail with different formats/URLs
    test_thumbnails = [
        "https://example.com/custom-thumbnail.png",
        "https://i.ytimg.com/vi/test123/maxresdefault.jpg",
        "https://cdn.example.com/thumbnails/video-thumb.webp"
    ]
    
    for i, test_thumb in enumerate(test_thumbnails):
        update_data["thumbnail"] = test_thumb
        response = requests.put(f"{API_URL}/videos/{video_id}", json=update_data)
        
        # Verify the update
        response = requests.get(f"{API_URL}/videos")
        videos = response.json() if response.status_code == 200 else []
        updated_video = next((v for v in videos if v["id"] == video_id), None)
        
        thumb_test_passed = (
            response.status_code == 200 and
            updated_video is not None and 
            updated_video.get("thumbnail") == test_thumb
        )
        
        log_test(
            f"Thumbnail Format Test {i+1}", 
            thumb_test_passed,
            f"Thumbnail URL: {test_thumb}",
            updated_video.get("thumbnail") if updated_video else "Video not found"
        )
    
    # Cleanup
    requests.delete(f"{API_URL}/videos/{video_id}")

def test_category_management():
    """
    CRITICAL ISSUE 3: Test category creation, editing, and deletion
    User reported missing: "Ability to create or edit categories"
    """
    print("\n=== TESTING CATEGORY MANAGEMENT ===\n")
    
    # Step 1: Test category creation
    category_name = f"Test Category {uuid.uuid4().hex[:8]}"
    category_icon = "TestIcon"
    
    category_data = {
        "name": category_name,
        "icon": category_icon
    }
    
    response = requests.post(f"{API_URL}/categories", json=category_data)
    category_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "CRITICAL: Create New Category", 
        category_created,
        f"Status: {response.status_code}, Name: {category_name}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not category_created:
        return
    
    category_id = response.json()["id"]
    
    # Step 2: Verify category appears in categories list
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    created_category = next((c for c in categories if c["id"] == category_id), None)
    
    category_in_list = created_category is not None
    
    log_test(
        "Verify Category in List", 
        category_in_list,
        f"Category found: {category_in_list}",
        created_category
    )
    
    # Step 3: Test category editing/updating
    updated_name = f"Updated Category {uuid.uuid4().hex[:8]}"
    updated_icon = "UpdatedIcon"
    
    update_data = {
        "name": updated_name,
        "icon": updated_icon
    }
    
    response = requests.put(f"{API_URL}/categories/{category_id}", json=update_data)
    category_updated = response.status_code == 200
    
    log_test(
        "CRITICAL: Update Category", 
        category_updated,
        f"Status: {response.status_code}, New name: {updated_name}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Step 4: Verify category update
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    updated_category = next((c for c in categories if c["id"] == category_id), None)
    
    update_verified = (
        updated_category is not None and 
        updated_category.get("name") == updated_name and
        updated_category.get("icon") == updated_icon
    )
    
    log_test(
        "CRITICAL: Verify Category Update", 
        update_verified,
        f"Expected name: {updated_name}, Got: {updated_category.get('name') if updated_category else 'Category not found'}",
        updated_category
    )
    
    # Step 5: Test category deletion
    response = requests.delete(f"{API_URL}/categories/{category_id}")
    category_deleted = response.status_code == 200
    
    log_test(
        "CRITICAL: Delete Category", 
        category_deleted,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Step 6: Verify category was deleted
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    category_gone = not any(c["id"] == category_id for c in categories)
    
    log_test(
        "CRITICAL: Verify Category Deletion", 
        category_gone,
        f"Category with ID {category_id} {'not found (good)' if category_gone else 'still exists (bad)'}",
        None
    )

def test_optional_field_validation():
    """
    ISSUE 4: Test optional field validation
    User reported: "Fields that should be optional are currently mandatory"
    """
    print("\n=== TESTING OPTIONAL FIELD VALIDATION ===\n")
    
    # Test 1: User creation with minimal required fields
    minimal_user_data = {
        "email": f"minimal.{uuid.uuid4().hex[:8]}@test.com",
        "password": "MinimalPass123",
        "name": "Minimal User"
        # role should default to 'user' if not provided
    }
    
    response = requests.post(f"{API_URL}/users", json=minimal_user_data)
    minimal_user_created = response.status_code == 200
    
    log_test(
        "Create User with Minimal Fields", 
        minimal_user_created,
        f"Status: {response.status_code}, Role should default to 'user'",
        response.json() if response.status_code == 200 else response.text
    )
    
    if minimal_user_created:
        user_id = response.json()["id"]
        default_role_correct = response.json().get("role") == "user"
        
        log_test(
            "Default Role Assignment", 
            default_role_correct,
            f"Expected role: 'user', Got: '{response.json().get('role')}'",
            response.json()
        )
        
        # Cleanup
        requests.delete(f"{API_URL}/users/{user_id}")
    
    # Test 2: Settings update with partial data (optional fields)
    partial_settings_data = {
        "companyName": f"Test Company {uuid.uuid4().hex[:8]}"
        # Other fields like logoUrl, theme, etc. should be optional
    }
    
    response = requests.put(f"{API_URL}/settings", json=partial_settings_data)
    partial_settings_updated = response.status_code == 200
    
    log_test(
        "Update Settings with Partial Data", 
        partial_settings_updated,
        f"Status: {response.status_code}, Only companyName provided",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Test 3: Video creation with optional fields missing
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    
    if categories:
        minimal_video_data = {
            "title": f"Minimal Video {uuid.uuid4().hex[:8]}",
            "description": "Basic video description",
            "thumbnail": "https://example.com/thumb.jpg",
            "duration": "5:00",
            "youtubeId": "test123",
            "categoryId": categories[0]["id"]
            # Optional fields like match, difficulty, rating, views, releaseDate not provided
        }
        
        response = requests.post(f"{API_URL}/videos", json=minimal_video_data)
        minimal_video_created = response.status_code == 200
        
        log_test(
            "Create Video with Minimal Fields", 
            minimal_video_created,
            f"Status: {response.status_code}, Optional fields not provided",
            response.json() if response.status_code == 200 else response.text
        )
        
        if minimal_video_created:
            video_id = response.json()["id"]
            # Cleanup
            requests.delete(f"{API_URL}/videos/{video_id}")
    
    # Test 4: Video progress with optional fields
    response = requests.get(f"{API_URL}/videos")
    videos = response.json() if response.status_code == 200 else []
    
    if videos:
        minimal_progress_data = {
            "user_email": "test@example.com",
            "video_id": videos[0]["id"]
            # progress_percentage, watch_time, completed should be optional with defaults
        }
        
        response = requests.post(f"{API_URL}/video-progress", json=minimal_progress_data)
        minimal_progress_created = response.status_code == 200
        
        log_test(
            "Create Video Progress with Minimal Fields", 
            minimal_progress_created,
            f"Status: {response.status_code}, Optional progress fields not provided",
            response.json() if response.status_code == 200 else response.text
        )
        
        if minimal_progress_created:
            # Verify defaults were applied
            progress_data = response.json()
            defaults_applied = (
                progress_data.get("progress_percentage") == 0.0 and
                progress_data.get("watch_time") == 0 and
                progress_data.get("completed") == False
            )
            
            log_test(
                "Verify Default Values Applied", 
                defaults_applied,
                f"Progress: {progress_data.get('progress_percentage')}, Watch time: {progress_data.get('watch_time')}, Completed: {progress_data.get('completed')}",
                progress_data
            )

def test_settings_text_management():
    """
    ISSUE 5: Test settings/landing page text editing
    User reported missing: "Ability to edit texts on the portada (landing page)"
    """
    print("\n=== TESTING SETTINGS/TEXT MANAGEMENT ===\n")
    
    # Step 1: Get current settings
    response = requests.get(f"{API_URL}/settings")
    settings_retrieved = response.status_code == 200
    
    log_test(
        "Get Current Settings", 
        settings_retrieved,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not settings_retrieved:
        return
    
    current_settings = response.json()
    
    # Step 2: Test updating landing page texts
    landing_page_texts = {
        "loginTitle": f"Custom Login Title {uuid.uuid4().hex[:8]}",
        "loginSubtitle": f"Custom login subtitle for testing {uuid.uuid4().hex[:8]}",
        "companyName": f"Custom Company Name {uuid.uuid4().hex[:8]}"
    }
    
    response = requests.put(f"{API_URL}/settings", json=landing_page_texts)
    texts_updated = response.status_code == 200
    
    log_test(
        "CRITICAL: Update Landing Page Texts", 
        texts_updated,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Step 3: Verify text updates
    response = requests.get(f"{API_URL}/settings")
    if response.status_code == 200:
        updated_settings = response.json()
        
        texts_verified = (
            updated_settings.get("loginTitle") == landing_page_texts["loginTitle"] and
            updated_settings.get("loginSubtitle") == landing_page_texts["loginSubtitle"] and
            updated_settings.get("companyName") == landing_page_texts["companyName"]
        )
        
        log_test(
            "CRITICAL: Verify Text Updates", 
            texts_verified,
            f"Login title: {updated_settings.get('loginTitle')}, Company: {updated_settings.get('companyName')}",
            {
                "loginTitle": updated_settings.get("loginTitle"),
                "loginSubtitle": updated_settings.get("loginSubtitle"),
                "companyName": updated_settings.get("companyName")
            }
        )
    
    # Step 4: Test other customization options
    customization_data = {
        "logoUrl": "https://example.com/custom-logo.png",
        "loginBackgroundUrl": "https://example.com/custom-bg.jpg",
        "bannerUrl": "https://example.com/custom-banner.jpg",
        "theme": "light"
    }
    
    response = requests.put(f"{API_URL}/settings", json=customization_data)
    customization_updated = response.status_code == 200
    
    log_test(
        "Update Customization Settings", 
        customization_updated,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Step 5: Verify customization updates
    response = requests.get(f"{API_URL}/settings")
    if response.status_code == 200:
        final_settings = response.json()
        
        customization_verified = (
            final_settings.get("logoUrl") == customization_data["logoUrl"] and
            final_settings.get("loginBackgroundUrl") == customization_data["loginBackgroundUrl"] and
            final_settings.get("bannerUrl") == customization_data["bannerUrl"] and
            final_settings.get("theme") == customization_data["theme"]
        )
        
        log_test(
            "Verify Customization Updates", 
            customization_verified,
            f"Logo: {final_settings.get('logoUrl')}, Theme: {final_settings.get('theme')}",
            {
                "logoUrl": final_settings.get("logoUrl"),
                "loginBackgroundUrl": final_settings.get("loginBackgroundUrl"),
                "bannerUrl": final_settings.get("bannerUrl"),
                "theme": final_settings.get("theme")
            }
        )

def print_summary():
    """Print test summary with focus on critical issues"""
    print("\n" + "="*60)
    print(f"USER ISSUES TEST SUMMARY: {test_results['passed']}/{test_results['total']} tests passed")
    print("="*60)
    
    # Categorize results by issue
    critical_issues = {
        "User Authentication": [],
        "Video Thumbnail Management": [],
        "Category Management": [],
        "Optional Field Validation": [],
        "Settings/Text Management": []
    }
    
    for test in test_results["tests"]:
        test_name = test["name"]
        if "User" in test_name and ("Login" in test_name or "Create" in test_name):
            critical_issues["User Authentication"].append(test)
        elif "Thumbnail" in test_name:
            critical_issues["Video Thumbnail Management"].append(test)
        elif "Category" in test_name:
            critical_issues["Category Management"].append(test)
        elif "Minimal" in test_name or "Optional" in test_name or "Default" in test_name:
            critical_issues["Optional Field Validation"].append(test)
        elif "Settings" in test_name or "Text" in test_name or "Customization" in test_name:
            critical_issues["Settings/Text Management"].append(test)
    
    # Print results by issue
    for issue, tests in critical_issues.items():
        if tests:
            print(f"\n{issue}:")
            passed_count = sum(1 for t in tests if t["passed"])
            total_count = len(tests)
            print(f"  Status: {passed_count}/{total_count} tests passed")
            
            for test in tests:
                status = "✅" if test["passed"] else "❌"
                print(f"  {status} {test['name']}")
                if not test["passed"] and test["message"]:
                    print(f"     Issue: {test['message']}")
    
    # Overall assessment
    success_rate = (test_results["passed"] / test_results["total"]) * 100 if test_results["total"] > 0 else 0
    print(f"\nOverall Success Rate: {success_rate:.2f}%")
    
    # Critical issues summary
    critical_failures = [test for test in test_results["tests"] if not test["passed"] and "CRITICAL" in test["name"]]
    
    if critical_failures:
        print(f"\n🚨 CRITICAL ISSUES FOUND ({len(critical_failures)}):")
        for test in critical_failures:
            print(f"❌ {test['name']}")
            if test["message"]:
                print(f"   Problem: {test['message']}")
        print("\nThese issues need immediate attention!")
    else:
        print("\n✅ No critical issues found in user-reported problems!")

def main():
    """Run focused tests for user-reported issues"""
    print("="*60)
    print("REAL ESTATE TRAINING PLATFORM - USER ISSUES TESTING")
    print("="*60)
    print(f"Testing backend API at: {API_URL}")
    print("Focus: User-reported issues from review request")
    print("="*60)
    
    try:
        # Test API connectivity first
        response = requests.get(f"{API_URL}/")
        if response.status_code != 200:
            print(f"❌ API connectivity test failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        print("✅ API connectivity confirmed")
        print("="*60 + "\n")
        
        # Run focused tests for user-reported issues
        test_user_authentication_issue()
        test_video_thumbnail_management()
        test_category_management()
        test_optional_field_validation()
        test_settings_text_management()
        
        # Print summary
        print_summary()
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to the API: {e}")
        print(f"Make sure the backend is running and accessible at {API_URL}")
        sys.exit(1)

if __name__ == "__main__":
    main()