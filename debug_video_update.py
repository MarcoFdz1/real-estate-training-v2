#!/usr/bin/env python3
"""
Debug script to understand the video update issue
"""

import requests
import json
import uuid

BACKEND_URL = "https://proptech-videos.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

def debug_video_update():
    print("=== DEBUGGING VIDEO UPDATE ISSUE ===\n")
    
    # Get a category ID
    response = requests.get(f"{API_URL}/categories")
    categories = response.json() if response.status_code == 200 else []
    
    if not categories:
        print("❌ No categories found")
        return
    
    category_id = categories[0]["id"]
    print(f"✅ Using category: {categories[0]['name']} (ID: {category_id})")
    
    # Create a test video
    original_video_data = {
        "title": "Debug Video Title",
        "description": "Debug description",
        "youtubeId": "dQw4w9WgXcQ",
        "categoryId": category_id,
        "difficulty": "Básico",
        "rating": 3.0,
        "views": 100
    }
    
    response = requests.post(f"{API_URL}/videos", json=original_video_data)
    if response.status_code != 200:
        print(f"❌ Failed to create video: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    video_id = response.json()["id"]
    print(f"✅ Created video with ID: {video_id}")
    
    # Test 1: Full update with all required fields
    print("\n--- Test 1: Full Update ---")
    full_update_data = {
        "title": "Updated Debug Video Title",
        "description": "Updated debug description",
        "youtubeId": "dQw4w9WgXcQ",
        "categoryId": category_id,
        "difficulty": "Avanzado",
        "rating": 4.5,
        "views": 200
    }
    
    response = requests.put(f"{API_URL}/videos/{video_id}", json=full_update_data)
    print(f"Full update status: {response.status_code}")
    if response.status_code != 200:
        print(f"Full update error: {response.text}")
    else:
        print("✅ Full update successful")
    
    # Check if video exists in list after update
    response = requests.get(f"{API_URL}/videos")
    videos = response.json() if response.status_code == 200 else []
    updated_video = next((v for v in videos if v["id"] == video_id), None)
    
    if updated_video:
        print(f"✅ Video found after update: {updated_video['title']}")
        print(f"   Title: {updated_video['title']}")
        print(f"   Description: {updated_video['description']}")
        print(f"   Difficulty: {updated_video['difficulty']}")
        print(f"   Rating: {updated_video['rating']}")
    else:
        print("❌ Video NOT found after update")
        print(f"Total videos in system: {len(videos)}")
        if videos:
            print("Available video IDs:", [v["id"] for v in videos[:5]])
    
    # Test 2: Partial update (this should fail with current implementation)
    print("\n--- Test 2: Partial Update ---")
    partial_update_data = {
        "title": "Partially Updated Title",
        "rating": 5.0
    }
    
    response = requests.put(f"{API_URL}/videos/{video_id}", json=partial_update_data)
    print(f"Partial update status: {response.status_code}")
    if response.status_code != 200:
        print(f"Partial update error: {response.text}")
        
        # Try to understand the error
        try:
            error_detail = response.json()
            print("Error details:")
            for error in error_detail.get("detail", []):
                print(f"  - Missing field: {error.get('loc', ['unknown'])[-1]}")
        except:
            pass
    else:
        print("✅ Partial update successful")
    
    # Clean up
    print(f"\n--- Cleanup ---")
    response = requests.delete(f"{API_URL}/videos/{video_id}")
    print(f"Delete status: {response.status_code}")

if __name__ == "__main__":
    debug_video_update()