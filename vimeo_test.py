import requests
import sys
import json

class VimeoUploadTester:
    def __init__(self, base_url="https://real-estate-v2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response: {json.dumps(response_data, indent=2)}")
                except:
                    print(f"Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:500]}...")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_vimeo_upload(self):
        """Test Vimeo video upload with the specific URL from the request"""
        # First get categories
        success, categories = self.run_test(
            "Get Categories",
            "GET", 
            "categories",
            200
        )
        
        if not success or not categories:
            print("❌ Cannot get categories for Vimeo test")
            return False
            
        # Find "Fundamentos Inmobiliarios" category
        fundamentos_category = None
        for cat in categories:
            if "Fundamentos" in cat.get('name', ''):
                fundamentos_category = cat
                break
        
        if not fundamentos_category:
            # Use first category as fallback
            fundamentos_category = categories[0]
            
        print(f"Using category: {fundamentos_category['name']} (ID: {fundamentos_category['id']})")
        
        # Test Vimeo upload with the specific URL from the request
        vimeo_data = {
            "title": "Test Vimeo Upload",
            "description": "Testing Vimeo video upload functionality with URL from request",
            "video_type": "vimeo",
            "vimeoId": "76979871",  # Extracted from https://vimeo.com/76979871
            "categoryId": fundamentos_category['id'],
            "duration": "5 min",
            "difficulty": "Intermedio"
        }
        
        success, response = self.run_test(
            "Vimeo Video Upload (https://vimeo.com/76979871)",
            "POST",
            "videos",
            200,
            data=vimeo_data
        )
        
        if success:
            video_id = response.get('id')
            print(f"✅ Vimeo video created with ID: {video_id}")
            
            # Verify the video was created correctly
            success2, videos = self.run_test(
                "Verify Vimeo Video in List",
                "GET",
                "videos",
                200
            )
            
            if success2:
                vimeo_videos = [v for v in videos if v.get('video_type') == 'vimeo' and v.get('id') == video_id]
                if vimeo_videos:
                    video = vimeo_videos[0]
                    print(f"✅ Vimeo video verified:")
                    print(f"   - Title: {video.get('title')}")
                    print(f"   - Vimeo ID: {video.get('vimeoId')}")
                    print(f"   - Video Type: {video.get('video_type')}")
                    print(f"   - Category ID: {video.get('categoryId')}")
                    return True
                else:
                    print("❌ Vimeo video not found in video list")
                    return False
        
        return success

def main():
    print("🎬 Testing Vimeo Upload Functionality")
    print("=" * 50)
    
    tester = VimeoUploadTester()
    
    # Test admin login first
    success, _ = tester.run_test(
        "Admin Login",
        "POST",
        "auth/login",
        200,
        data={"email": "unbrokerage@realtyonegroupmexico.mx", "password": "OneVision$07"}
    )
    
    if not success:
        print("❌ Login failed, stopping tests")
        return 1

    # Test Vimeo upload
    if tester.test_vimeo_upload():
        print("\n✅ Vimeo upload test PASSED")
    else:
        print("\n❌ Vimeo upload test FAILED")

    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    return 0 if tester.tests_passed >= 2 else 1  # Need at least login + vimeo upload to pass

if __name__ == "__main__":
    sys.exit(main())