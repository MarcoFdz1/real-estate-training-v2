#!/usr/bin/env python3
"""
Focused test for the 3 specific issues mentioned in the review request:
1. Portada Titles Not Saving
2. Admin Can't Edit Videos  
3. Created Users Can't Login
"""

import requests
import json
import uuid
import sys

# Use localhost since external URL is not accessible
API_URL = "http://localhost:8001/api"

class SpecificIssuesTester:
    def __init__(self):
        self.admin_credentials = {
            "email": "unbrokerage@realtyonegroupmexico.mx",
            "password": "OneVision$07"
        }
        self.user_credentials = {
            "email": "unbrokerage@realtyonegroupmexico.mx", 
            "password": "AgenteONE13"
        }
        self.results = {
            "problem_1_portada_titles": {"status": "UNKNOWN", "details": []},
            "problem_2_admin_edit_videos": {"status": "UNKNOWN", "details": []},
            "problem_3_user_login": {"status": "UNKNOWN", "details": []}
        }

    def log_result(self, problem_key, message, success=None):
        """Log test results"""
        self.results[problem_key]["details"].append(message)
        if success is not None:
            if success:
                self.results[problem_key]["status"] = "FIXED"
            else:
                self.results[problem_key]["status"] = "NOT FIXED"
        print(f"  {message}")

    def test_problem_1_portada_titles(self):
        """TEST PROBLEM 1: Portada Titles Not Saving"""
        print("\n🔍 TESTING PROBLEM 1: Portada Titles Not Saving")
        print("=" * 60)
        
        try:
            # Step 1: Get current settings
            response = requests.get(f"{API_URL}/settings")
            if response.status_code != 200:
                self.log_result("problem_1_portada_titles", "❌ Failed to get current settings", False)
                return
            
            current_settings = response.json()
            self.log_result("problem_1_portada_titles", f"✅ Current heroTitle: '{current_settings.get('heroTitle', 'Not set')}'")
            self.log_result("problem_1_portada_titles", f"✅ Current heroSubtitle: '{current_settings.get('heroSubtitle', 'Not set')}'")
            
            # Step 2: Update with new titles as specified in the test
            new_hero_title = "NUEVO TÍTULO DE PORTADA"
            new_hero_subtitle = "NUEVO SUBTÍTULO DE PORTADA"
            
            update_data = {
                "heroTitle": new_hero_title,
                "heroSubtitle": new_hero_subtitle
            }
            
            response = requests.put(f"{API_URL}/settings", json=update_data)
            if response.status_code != 200:
                self.log_result("problem_1_portada_titles", f"❌ Failed to update settings: {response.status_code}", False)
                return
            
            self.log_result("problem_1_portada_titles", f"✅ Settings update request successful")
            
            # Step 3: Verify the titles were saved and persist
            response = requests.get(f"{API_URL}/settings")
            if response.status_code != 200:
                self.log_result("problem_1_portada_titles", "❌ Failed to retrieve updated settings", False)
                return
            
            updated_settings = response.json()
            saved_hero_title = updated_settings.get('heroTitle')
            saved_hero_subtitle = updated_settings.get('heroSubtitle')
            
            # Check if titles match what we set
            title_matches = saved_hero_title == new_hero_title
            subtitle_matches = saved_hero_subtitle == new_hero_subtitle
            
            self.log_result("problem_1_portada_titles", f"📋 Expected heroTitle: '{new_hero_title}'")
            self.log_result("problem_1_portada_titles", f"📋 Actual heroTitle: '{saved_hero_title}'")
            self.log_result("problem_1_portada_titles", f"📋 Title matches: {title_matches}")
            
            self.log_result("problem_1_portada_titles", f"📋 Expected heroSubtitle: '{new_hero_subtitle}'")
            self.log_result("problem_1_portada_titles", f"📋 Actual heroSubtitle: '{saved_hero_subtitle}'")
            self.log_result("problem_1_portada_titles", f"📋 Subtitle matches: {subtitle_matches}")
            
            if title_matches and subtitle_matches:
                self.log_result("problem_1_portada_titles", "🎉 PROBLEM 1 FIXED: Portada titles save and persist correctly!", True)
            else:
                self.log_result("problem_1_portada_titles", "❌ PROBLEM 1 NOT FIXED: Portada titles not persisting correctly", False)
                
        except Exception as e:
            self.log_result("problem_1_portada_titles", f"❌ Error testing Problem 1: {str(e)}", False)

    def test_problem_2_admin_edit_videos(self):
        """TEST PROBLEM 2: Admin Can't Edit Videos"""
        print("\n🔍 TESTING PROBLEM 2: Admin Can't Edit Videos")
        print("=" * 60)
        
        try:
            # Step 1: Get categories to use for video creation
            response = requests.get(f"{API_URL}/categories")
            if response.status_code != 200:
                self.log_result("problem_2_admin_edit_videos", "❌ Failed to get categories", False)
                return
            
            categories = response.json()
            if not categories:
                self.log_result("problem_2_admin_edit_videos", "❌ No categories found", False)
                return
            
            category_id = categories[0]['id']
            self.log_result("problem_2_admin_edit_videos", f"✅ Using category: {categories[0]['name']} (ID: {category_id})")
            
            # Step 2: Create a test video to edit
            test_video_data = {
                "title": "Test Video for Admin Edit",
                "description": "This video will be edited by admin",
                "youtubeId": "dQw4w9WgXcQ",  # Rick Roll video ID for testing
                "categoryId": category_id
            }
            
            response = requests.post(f"{API_URL}/videos", json=test_video_data)
            if response.status_code != 200:
                self.log_result("problem_2_admin_edit_videos", f"❌ Failed to create test video: {response.status_code}", False)
                return
            
            created_video = response.json()
            video_id = created_video['id']
            self.log_result("problem_2_admin_edit_videos", f"✅ Created test video: '{created_video['title']}' (ID: {video_id})")
            
            # Step 3: Try to edit the video (as specified in the test)
            new_title = "VIDEO EDITADO TEST"
            edit_data = {
                "title": new_title,
                "description": "Video edited by admin - test successful"
            }
            
            response = requests.put(f"{API_URL}/videos/{video_id}", json=edit_data)
            if response.status_code != 200:
                self.log_result("problem_2_admin_edit_videos", f"❌ Failed to edit video: {response.status_code} - {response.text}", False)
                return
            
            self.log_result("problem_2_admin_edit_videos", f"✅ Video edit request successful")
            
            # Step 4: Verify the video was actually updated
            response = requests.get(f"{API_URL}/videos")
            if response.status_code != 200:
                self.log_result("problem_2_admin_edit_videos", "❌ Failed to get videos list", False)
                return
            
            videos = response.json()
            edited_video = next((v for v in videos if v['id'] == video_id), None)
            
            if not edited_video:
                self.log_result("problem_2_admin_edit_videos", "❌ Edited video not found in videos list", False)
                return
            
            title_updated = edited_video['title'] == new_title
            
            self.log_result("problem_2_admin_edit_videos", f"📋 Expected title: '{new_title}'")
            self.log_result("problem_2_admin_edit_videos", f"📋 Actual title: '{edited_video['title']}'")
            self.log_result("problem_2_admin_edit_videos", f"📋 Title updated: {title_updated}")
            
            if title_updated:
                self.log_result("problem_2_admin_edit_videos", "🎉 PROBLEM 2 FIXED: Admin can edit videos successfully!", True)
            else:
                self.log_result("problem_2_admin_edit_videos", "❌ PROBLEM 2 NOT FIXED: Video title was not updated", False)
            
            # Clean up - delete the test video
            requests.delete(f"{API_URL}/videos/{video_id}")
            self.log_result("problem_2_admin_edit_videos", "🧹 Test video cleaned up")
                
        except Exception as e:
            self.log_result("problem_2_admin_edit_videos", f"❌ Error testing Problem 2: {str(e)}", False)

    def test_problem_3_user_login(self):
        """TEST PROBLEM 3: Created Users Can't Login"""
        print("\n🔍 TESTING PROBLEM 3: Created Users Can't Login")
        print("=" * 60)
        
        try:
            # Step 1: Create a new user as specified in the test
            test_user_data = {
                "name": "Test User",
                "email": "testuser@test.com",
                "password": "testpass123",
                "role": "user"
            }
            
            response = requests.post(f"{API_URL}/users", json=test_user_data)
            if response.status_code != 200:
                self.log_result("problem_3_user_login", f"❌ Failed to create user: {response.status_code} - {response.text}", False)
                return
            
            created_user = response.json()
            user_id = created_user['id']
            self.log_result("problem_3_user_login", f"✅ Created user: '{created_user['name']}' ({created_user['email']})")
            
            # Step 2: Try to login with the newly created user
            login_data = {
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
            
            response = requests.post(f"{API_URL}/auth/login", json=login_data)
            
            if response.status_code != 200:
                self.log_result("problem_3_user_login", f"❌ Login failed: {response.status_code} - {response.text}", False)
                # Clean up the user
                requests.delete(f"{API_URL}/users/{user_id}")
                return
            
            login_result = response.json()
            
            # Step 3: Verify login was successful and returned correct user info
            email_matches = login_result.get('email') == test_user_data['email']
            name_matches = login_result.get('name') == test_user_data['name']
            role_matches = login_result.get('role') == test_user_data['role']
            
            self.log_result("problem_3_user_login", f"📋 Login response: {login_result}")
            self.log_result("problem_3_user_login", f"📋 Email matches: {email_matches}")
            self.log_result("problem_3_user_login", f"📋 Name matches: {name_matches}")
            self.log_result("problem_3_user_login", f"📋 Role matches: {role_matches}")
            
            if email_matches and name_matches and role_matches:
                self.log_result("problem_3_user_login", "🎉 PROBLEM 3 FIXED: Created users can login successfully!", True)
            else:
                self.log_result("problem_3_user_login", "❌ PROBLEM 3 NOT FIXED: Login data doesn't match expected values", False)
            
            # Clean up - delete the test user
            requests.delete(f"{API_URL}/users/{user_id}")
            self.log_result("problem_3_user_login", "🧹 Test user cleaned up")
                
        except Exception as e:
            self.log_result("problem_3_user_login", f"❌ Error testing Problem 3: {str(e)}", False)

    def print_summary(self):
        """Print final summary of all tests"""
        print("\n" + "=" * 80)
        print("🎯 FINAL SUMMARY - SPECIFIC ISSUES TEST RESULTS")
        print("=" * 80)
        
        for problem_key, result in self.results.items():
            problem_name = {
                "problem_1_portada_titles": "PROBLEM 1: Portada Titles Not Saving",
                "problem_2_admin_edit_videos": "PROBLEM 2: Admin Can't Edit Videos", 
                "problem_3_user_login": "PROBLEM 3: Created Users Can't Login"
            }[problem_key]
            
            status = result["status"]
            status_icon = {
                "FIXED": "✅",
                "NOT FIXED": "❌", 
                "UNKNOWN": "❓"
            }[status]
            
            print(f"\n{status_icon} {problem_name}: {status}")
            
            if result["details"]:
                print("   Details:")
                for detail in result["details"][-3:]:  # Show last 3 details
                    print(f"   • {detail}")
        
        # Overall result
        fixed_count = sum(1 for r in self.results.values() if r["status"] == "FIXED")
        total_count = len(self.results)
        
        print(f"\n📊 OVERALL RESULT: {fixed_count}/{total_count} problems fixed")
        
        if fixed_count == total_count:
            print("🎉 ALL PROBLEMS HAVE BEEN FIXED!")
            return 0
        else:
            print("⚠️  Some problems still need attention")
            return 1

def main():
    """Run the specific issues tests"""
    print("🚀 TESTING SPECIFIC ISSUES - Real Estate Training Platform")
    print("Testing backend at:", API_URL)
    print("=" * 80)
    
    # Test API connectivity first
    try:
        response = requests.get(f"{API_URL}/")
        if response.status_code != 200:
            print(f"❌ API connectivity failed: {response.status_code}")
            return 1
        print("✅ API connectivity confirmed")
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        return 1
    
    # Run the specific tests
    tester = SpecificIssuesTester()
    
    tester.test_problem_1_portada_titles()
    tester.test_problem_2_admin_edit_videos()
    tester.test_problem_3_user_login()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())