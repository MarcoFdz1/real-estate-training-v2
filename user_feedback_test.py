#!/usr/bin/env python3
"""
Focused Backend Testing for User Feedback Issues
Testing the 4 specific user issues mentioned in the review request:
1. LANDING PAGE TEXT EDITING: Test if settings save correctly now
2. OPTIONAL FIELD VALIDATION: Test video creation with minimal fields
3. VIDEO EDITING: Test video update functionality through API 
4. RESPONSIVE DESIGN: Verify API endpoints support the frontend changes
"""

import requests
import json
import uuid
import time
import sys
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://proptech-videos.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

# Admin credentials as specified in the review request
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

def test_issue_1_landing_page_text_editing():
    """
    ISSUE 1: LANDING PAGE TEXT EDITING
    User reported: "Si esta la edición de los textos de la portada en el Panel de admin pero no guarda los cambios."
    Test if settings save correctly now (user reported "no guarda los cambios")
    """
    print("\n=== ISSUE 1: LANDING PAGE TEXT EDITING ===")
    print("Testing if settings save correctly (user reported 'no guarda los cambios')\n")
    
    # Test 1.1: Get current settings
    response = requests.get(f"{API_URL}/settings")
    settings_retrieved = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "1.1 Get Current Settings", 
        settings_retrieved,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not settings_retrieved:
        return
    
    original_settings = response.json()
    
    # Test 1.2: Update landing page texts (loginTitle, loginSubtitle, companyName)
    unique_id = str(uuid.uuid4())[:8]
    update_data = {
        "loginTitle": f"Nuevo Título de Login {unique_id}",
        "loginSubtitle": f"Nuevo Subtítulo de Login {unique_id}",
        "companyName": f"Nueva Empresa {unique_id}",
        "logoUrl": f"https://example.com/logo-{unique_id}.png",
        "loginBackgroundUrl": f"https://example.com/bg-{unique_id}.jpg"
    }
    
    response = requests.put(f"{API_URL}/settings", json=update_data)
    settings_updated = response.status_code == 200
    
    log_test(
        "1.2 Update Landing Page Settings", 
        settings_updated,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not settings_updated:
        return
    
    # Test 1.3: Verify settings were actually saved (critical test)
    response = requests.get(f"{API_URL}/settings")
    if response.status_code == 200:
        updated_settings = response.json()
        
        # Check each field was saved correctly
        fields_saved_correctly = True
        field_details = {}
        
        for field, expected_value in update_data.items():
            actual_value = updated_settings.get(field)
            field_correct = actual_value == expected_value
            fields_saved_correctly = fields_saved_correctly and field_correct
            field_details[field] = {
                "expected": expected_value,
                "actual": actual_value,
                "saved_correctly": field_correct
            }
        
        log_test(
            "1.3 Verify Settings Were Saved Correctly", 
            fields_saved_correctly,
            f"All fields saved correctly: {fields_saved_correctly}",
            field_details
        )
        
        # Test 1.4: Test partial update (common use case)
        partial_update = {
            "loginTitle": f"Título Parcial {unique_id}",
            "theme": "light"
        }
        
        response = requests.put(f"{API_URL}/settings", json=partial_update)
        partial_update_success = response.status_code == 200
        
        log_test(
            "1.4 Test Partial Settings Update", 
            partial_update_success,
            f"Status: {response.status_code}",
            response.json() if response.status_code == 200 else response.text
        )
        
        if partial_update_success:
            # Verify partial update
            response = requests.get(f"{API_URL}/settings")
            if response.status_code == 200:
                final_settings = response.json()
                
                partial_verified = (
                    final_settings.get("loginTitle") == partial_update["loginTitle"] and
                    final_settings.get("theme") == partial_update["theme"] and
                    final_settings.get("companyName") == update_data["companyName"]  # Should remain from previous update
                )
                
                log_test(
                    "1.5 Verify Partial Update Preserved Other Fields", 
                    partial_verified,
                    f"Partial update verified: {partial_verified}",
                    {
                        "loginTitle": final_settings.get("loginTitle"),
                        "theme": final_settings.get("theme"),
                        "companyName": final_settings.get("companyName")
                    }
                )
    else:
        log_test(
            "1.3 Verify Settings Were Saved Correctly", 
            False,
            f"Failed to retrieve updated settings. Status: {response.status_code}",
            response.text
        )

def test_issue_2_optional_field_validation():
    """
    ISSUE 2: OPTIONAL FIELD VALIDATION
    User reported: "Me sigue forzando incluir textos en campos y quiero unos que si no escribo nada quede vacío."
    Test video creation with minimal fields (title, youtubeId, categoryId only)
    """
    print("\n=== ISSUE 2: OPTIONAL FIELD VALIDATION ===")
    print("Testing video creation with minimal fields (title, youtubeId, categoryId only)\n")
    
    # Test 2.1: Get a valid category ID
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    
    if not categories:
        log_test("2.1 Get Category for Testing", False, "No categories found")
        return
    
    category_id = categories[0]["id"]
    log_test(
        "2.1 Get Category for Testing", 
        True,
        f"Using category: {categories[0]['name']} (ID: {category_id})",
        None
    )
    
    # Test 2.2: Create video with ONLY required fields as specified in review request
    minimal_video_data = {
        "title": "Test Video",
        "youtubeId": "dQw4w9WgXcQ",
        "categoryId": category_id
    }
    
    response = requests.post(f"{API_URL}/videos", json=minimal_video_data)
    video_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "2.2 Create Video with Minimal Required Fields", 
        video_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not video_created:
        return
    
    video_id = response.json()["id"]
    created_video = response.json()
    
    # Test 2.3: Verify optional fields got appropriate default values
    expected_defaults = {
        "description": "",  # Should be empty string, not forced
        "duration": "45 min",
        "match": "95%",
        "difficulty": "Intermedio",
        "rating": 4.5,
        "views": 0
    }
    
    defaults_correct = True
    default_details = {}
    
    for field, expected_value in expected_defaults.items():
        actual_value = created_video.get(field)
        field_correct = actual_value == expected_value
        defaults_correct = defaults_correct and field_correct
        default_details[field] = {
            "expected": expected_value,
            "actual": actual_value,
            "correct": field_correct
        }
    
    # Check auto-generated thumbnail
    expected_thumbnail = f"https://img.youtube.com/vi/{minimal_video_data['youtubeId']}/maxresdefault.jpg"
    thumbnail_correct = created_video.get("thumbnail") == expected_thumbnail
    defaults_correct = defaults_correct and thumbnail_correct
    default_details["thumbnail"] = {
        "expected": expected_thumbnail,
        "actual": created_video.get("thumbnail"),
        "correct": thumbnail_correct
    }
    
    # Check auto-generated releaseDate
    today = datetime.utcnow().strftime('%Y-%m-%d')
    release_date_correct = created_video.get("releaseDate") == today
    defaults_correct = defaults_correct and release_date_correct
    default_details["releaseDate"] = {
        "expected": today,
        "actual": created_video.get("releaseDate"),
        "correct": release_date_correct
    }
    
    log_test(
        "2.3 Verify Optional Fields Have Correct Defaults", 
        defaults_correct,
        f"All defaults applied correctly: {defaults_correct}",
        default_details
    )
    
    # Test 2.4: Test that empty description is allowed (key user concern)
    empty_description_video = {
        "title": "Video with Empty Description",
        "youtubeId": "dQw4w9WgXcQ",
        "categoryId": category_id,
        "description": ""  # Explicitly empty
    }
    
    response = requests.post(f"{API_URL}/videos", json=empty_description_video)
    empty_desc_allowed = response.status_code == 200 and response.json().get("description") == ""
    
    log_test(
        "2.4 Allow Empty Description Field", 
        empty_desc_allowed,
        f"Status: {response.status_code}, Description: '{response.json().get('description') if response.status_code == 200 else 'N/A'}'",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Clean up test videos
    if video_created:
        requests.delete(f"{API_URL}/videos/{video_id}")
    if empty_desc_allowed:
        requests.delete(f"{API_URL}/videos/{response.json()['id']}")

def test_issue_3_video_editing():
    """
    ISSUE 3: VIDEO EDITING
    User reported: "No hay la opción de poder editar información de los videos que ya están publicadas."
    Test video update functionality through PUT /api/videos/{id} endpoint
    """
    print("\n=== ISSUE 3: VIDEO EDITING FOR PUBLISHED VIDEOS ===")
    print("Testing video update functionality through API\n")
    
    # Test 3.1: Get a valid category ID
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    
    if not categories:
        log_test("3.1 Get Category for Video Editing Test", False, "No categories found")
        return
    
    category_id = categories[0]["id"]
    
    # Test 3.2: Create a video to edit (simulating a "published" video)
    original_video_data = {
        "title": "Original Video Title",
        "description": "Original description",
        "youtubeId": "dQw4w9WgXcQ",
        "categoryId": category_id,
        "difficulty": "Básico",
        "rating": 3.0,
        "views": 100
    }
    
    response = requests.post(f"{API_URL}/videos", json=original_video_data)
    video_created = response.status_code == 200 and "id" in response.json()
    
    log_test(
        "3.1 Create Video to Edit", 
        video_created,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not video_created:
        return
    
    video_id = response.json()["id"]
    
    # Test 3.3: Update video information (PUT /api/videos/{id})
    updated_video_data = {
        "title": "Updated Video Title",
        "description": "Updated description with new information",
        "youtubeId": "dQw4w9WgXcQ",  # Keep same YouTube ID
        "categoryId": category_id,
        "difficulty": "Avanzado",  # Changed
        "rating": 4.8,  # Changed
        "views": 250,  # Changed
        "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"  # Different thumbnail
    }
    
    response = requests.put(f"{API_URL}/videos/{video_id}", json=updated_video_data)
    video_updated = response.status_code == 200
    
    log_test(
        "3.2 Update Published Video", 
        video_updated,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    if not video_updated:
        # Clean up
        requests.delete(f"{API_URL}/videos/{video_id}")
        return
    
    # Test 3.4: Verify video was updated correctly
    response = requests.get(f"{API_URL}/videos")
    videos = response.json() if response.status_code == 200 else []
    updated_video = next((v for v in videos if v["id"] == video_id), None)
    
    if updated_video:
        update_verified = (
            updated_video["title"] == updated_video_data["title"] and
            updated_video["description"] == updated_video_data["description"] and
            updated_video["difficulty"] == updated_video_data["difficulty"] and
            updated_video["rating"] == updated_video_data["rating"] and
            updated_video["views"] == updated_video_data["views"] and
            updated_video["thumbnail"] == updated_video_data["thumbnail"]
        )
        
        verification_details = {
            "title": {"expected": updated_video_data["title"], "actual": updated_video["title"]},
            "description": {"expected": updated_video_data["description"], "actual": updated_video["description"]},
            "difficulty": {"expected": updated_video_data["difficulty"], "actual": updated_video["difficulty"]},
            "rating": {"expected": updated_video_data["rating"], "actual": updated_video["rating"]},
            "views": {"expected": updated_video_data["views"], "actual": updated_video["views"]},
            "thumbnail": {"expected": updated_video_data["thumbnail"], "actual": updated_video["thumbnail"]}
        }
        
        log_test(
            "3.3 Verify Video Update Persistence", 
            update_verified,
            f"All fields updated correctly: {update_verified}",
            verification_details
        )
    else:
        log_test(
            "3.3 Verify Video Update Persistence", 
            False,
            "Updated video not found in videos list",
            None
        )
    
    # Test 3.5: Test partial video update (common use case)
    partial_update_data = {
        "title": "Partially Updated Title",
        "rating": 5.0
    }
    
    response = requests.put(f"{API_URL}/videos/{video_id}", json=partial_update_data)
    partial_update_success = response.status_code == 200
    
    log_test(
        "3.4 Test Partial Video Update", 
        partial_update_success,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Test 3.6: Test video deletion (part of video management)
    response = requests.delete(f"{API_URL}/videos/{video_id}")
    video_deleted = response.status_code == 200
    
    log_test(
        "3.5 Delete Video", 
        video_deleted,
        f"Status: {response.status_code}",
        response.json() if response.status_code == 200 else response.text
    )
    
    # Verify deletion
    if video_deleted:
        response = requests.get(f"{API_URL}/videos")
        videos = response.json() if response.status_code == 200 else []
        video_gone = not any(v["id"] == video_id for v in videos)
        
        log_test(
            "3.6 Verify Video Deletion", 
            video_gone,
            f"Video successfully removed: {video_gone}",
            None
        )

def test_issue_4_api_endpoints_for_responsive_design():
    """
    ISSUE 4: RESPONSIVE DESIGN API SUPPORT
    User reported: "revisar que si sea totalmente respondido para todas las pantallas y que tenga excelente visualización de móviles."
    Cannot test responsive design via backend, but verify API endpoints support the frontend changes
    """
    print("\n=== ISSUE 4: API ENDPOINTS FOR RESPONSIVE DESIGN ===")
    print("Verifying API endpoints support frontend responsive design requirements\n")
    
    # Test 4.1: Verify all core API endpoints are accessible (needed for responsive frontend)
    core_endpoints = [
        ("GET", "/", "API Root"),
        ("POST", "/auth/login", "Authentication"),
        ("GET", "/categories", "Categories List"),
        ("GET", "/videos", "Videos List"),
        ("GET", "/settings", "Settings"),
        ("GET", "/users", "Users List")
    ]
    
    for method, endpoint, description in core_endpoints:
        if method == "GET":
            response = requests.get(f"{API_URL}{endpoint}")
        elif method == "POST" and endpoint == "/auth/login":
            # Test with admin credentials
            response = requests.post(f"{API_URL}{endpoint}", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
        
        endpoint_accessible = response.status_code == 200
        
        log_test(
            f"4.{core_endpoints.index((method, endpoint, description)) + 1} {description} Endpoint", 
            endpoint_accessible,
            f"{method} {endpoint} - Status: {response.status_code}",
            None
        )
    
    # Test 4.2: Test API response format consistency (important for responsive frontend)
    response = requests.get(f"{API_URL}/categories")
    if response.status_code == 200:
        categories = response.json()
        
        # Check if categories have consistent structure
        if categories:
            required_fields = ["id", "name", "icon"]
            first_category = categories[0]
            structure_consistent = all(field in first_category for field in required_fields)
            
            log_test(
                "4.7 Categories API Structure Consistency", 
                structure_consistent,
                f"Required fields present: {structure_consistent}",
                f"Fields in first category: {list(first_category.keys())}"
            )
    
    # Test 4.3: Test videos API structure (needed for responsive video cards)
    response = requests.get(f"{API_URL}/videos")
    if response.status_code == 200:
        videos = response.json()
        
        if videos:
            required_video_fields = ["id", "title", "thumbnail", "duration", "difficulty", "rating"]
            first_video = videos[0]
            video_structure_consistent = all(field in first_video for field in required_video_fields)
            
            log_test(
                "4.8 Videos API Structure Consistency", 
                video_structure_consistent,
                f"Required video fields present: {video_structure_consistent}",
                f"Fields in first video: {list(first_video.keys())}"
            )
    
    # Test 4.4: Test settings API for theme and responsive configuration
    response = requests.get(f"{API_URL}/settings")
    if response.status_code == 200:
        settings = response.json()
        
        responsive_config_fields = ["theme", "logoUrl", "loginBackgroundUrl", "companyName"]
        responsive_config_available = all(field in settings for field in responsive_config_fields)
        
        log_test(
            "4.9 Settings API Responsive Configuration", 
            responsive_config_available,
            f"Responsive config fields available: {responsive_config_available}",
            f"Available settings: {list(settings.keys())}"
        )

def test_admin_authentication():
    """Test admin authentication with specified credentials"""
    print("\n=== ADMIN AUTHENTICATION TEST ===")
    print(f"Testing admin login with credentials: {ADMIN_EMAIL}\n")
    
    admin_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    response = requests.post(f"{API_URL}/auth/login", json=admin_data)
    
    admin_login_success = (
        response.status_code == 200 and 
        response.json().get("role") == "admin" and
        response.json().get("email") == ADMIN_EMAIL
    )
    
    log_test(
        "Admin Authentication", 
        admin_login_success,
        f"Status: {response.status_code}, Role: {response.json().get('role') if response.status_code == 200 else 'N/A'}",
        response.json() if response.status_code == 200 else response.text
    )
    
    return admin_login_success

def print_summary():
    """Print test summary with focus on user issues"""
    print("\n" + "="*60)
    print(f"USER FEEDBACK ISSUES TEST SUMMARY: {test_results['passed']}/{test_results['total']} tests passed")
    print("="*60)
    
    # Group tests by issue
    issues = {
        "ISSUE 1 - Landing Page Text Editing": [],
        "ISSUE 2 - Optional Field Validation": [],
        "ISSUE 3 - Video Editing": [],
        "ISSUE 4 - API Support for Responsive Design": [],
        "Admin Authentication": []
    }
    
    for test in test_results["tests"]:
        test_name = test["name"]
        if test_name.startswith("1."):
            issues["ISSUE 1 - Landing Page Text Editing"].append(test)
        elif test_name.startswith("2."):
            issues["ISSUE 2 - Optional Field Validation"].append(test)
        elif test_name.startswith("3."):
            issues["ISSUE 3 - Video Editing"].append(test)
        elif test_name.startswith("4."):
            issues["ISSUE 4 - API Support for Responsive Design"].append(test)
        else:
            issues["Admin Authentication"].append(test)
    
    for issue_name, issue_tests in issues.items():
        if issue_tests:
            passed_count = sum(1 for t in issue_tests if t["passed"])
            total_count = len(issue_tests)
            
            print(f"\n{issue_name}: {passed_count}/{total_count} tests passed")
            
            for test in issue_tests:
                status = "✅" if test["passed"] else "❌"
                print(f"  {status} {test['name']}")
                if not test["passed"] and test["message"]:
                    print(f"      {test['message']}")
    
    success_rate = (test_results["passed"] / test_results["total"]) * 100 if test_results["total"] > 0 else 0
    print(f"\nOverall Success Rate: {success_rate:.2f}%")
    
    # Determine which user issues are resolved
    print(f"\n{'='*60}")
    print("USER ISSUE RESOLUTION STATUS:")
    print("="*60)
    
    issue_1_tests = issues["ISSUE 1 - Landing Page Text Editing"]
    issue_1_resolved = all(t["passed"] for t in issue_1_tests) if issue_1_tests else False
    print(f"✅ ISSUE 1 - Landing Page Text Editing: {'RESOLVED' if issue_1_resolved else 'NOT RESOLVED'}")
    
    issue_2_tests = issues["ISSUE 2 - Optional Field Validation"]
    issue_2_resolved = all(t["passed"] for t in issue_2_tests) if issue_2_tests else False
    print(f"✅ ISSUE 2 - Optional Field Validation: {'RESOLVED' if issue_2_resolved else 'NOT RESOLVED'}")
    
    issue_3_tests = issues["ISSUE 3 - Video Editing"]
    issue_3_resolved = all(t["passed"] for t in issue_3_tests) if issue_3_tests else False
    print(f"✅ ISSUE 3 - Video Editing: {'RESOLVED' if issue_3_resolved else 'NOT RESOLVED'}")
    
    issue_4_tests = issues["ISSUE 4 - API Support for Responsive Design"]
    issue_4_resolved = all(t["passed"] for t in issue_4_tests) if issue_4_tests else False
    print(f"✅ ISSUE 4 - API Support for Responsive Design: {'RESOLVED' if issue_4_resolved else 'NOT RESOLVED'}")
    
    if success_rate == 100:
        print(f"\n🎉 All user feedback issues have been resolved! The backend API supports all required functionality.")
    else:
        failed_issues = []
        if not issue_1_resolved: failed_issues.append("Landing Page Text Editing")
        if not issue_2_resolved: failed_issues.append("Optional Field Validation")
        if not issue_3_resolved: failed_issues.append("Video Editing")
        if not issue_4_resolved: failed_issues.append("API Support for Responsive Design")
        
        print(f"\n⚠️ Issues still need attention: {', '.join(failed_issues)}")

def main():
    """Run focused tests for user feedback issues"""
    print("REAL ESTATE TRAINING PLATFORM - USER FEEDBACK TESTING")
    print("="*60)
    print(f"Testing backend API at: {API_URL}")
    print(f"Admin credentials: {ADMIN_EMAIL}")
    print("="*60)
    
    try:
        # Test API connectivity
        response = requests.get(f"{API_URL}/")
        if response.status_code != 200:
            print(f"❌ API connectivity test failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        print("✅ API connectivity test passed")
        print(f"API Response: {response.json()}")
        
        # Test admin authentication first
        if not test_admin_authentication():
            print("❌ Admin authentication failed. Cannot proceed with admin-required tests.")
            return
        
        # Run focused tests for each user issue
        test_issue_1_landing_page_text_editing()
        test_issue_2_optional_field_validation()
        test_issue_3_video_editing()
        test_issue_4_api_endpoints_for_responsive_design()
        
        # Print comprehensive summary
        print_summary()
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to the API: {e}")
        print(f"Make sure the backend is running and accessible at {API_URL}")
        sys.exit(1)

if __name__ == "__main__":
    main()