#!/usr/bin/env python3
"""Test Gemini API configuration with proper error handling"""

import requests
import json

BASE_URL = "http://localhost:8000"

print("Testing Gemini API Configuration Endpoint")
print("=" * 60)

# Test 1: Configure with invalid key
print("\nTest 1: Configuring with test key")
print("-" * 60)

test_payload = {
    "api_key": "AIzaSyDummy1234567890-abcdefghijklmnopqrst"
}

try:
    response = requests.post(
        f"{BASE_URL}/api/rag/configure-gemini",
        json=test_payload,
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(json.dumps(data, indent=2))
    
    if data.get('success'):
        print("\n✅ Configuration accepted (note: validation happens on first use)")
    else:
        print(f"\n⚠️  Configuration issue: {data.get('message', 'Unknown')}")
        if data.get('error'):
            print(f"Error details: {data.get('error')}")
    
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend. Is it running on port 8000?")
    print("   Start it with: python api_server.py")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Configure with empty key
print("\n\nTest 2: Configuring with empty key (should fail)")
print("-" * 60)

test_payload = {
    "api_key": ""
}

try:
    response = requests.post(
        f"{BASE_URL}/api/rag/configure-gemini",
        json=test_payload,
        timeout=10
    )
    
    data = response.json()
    print(json.dumps(data, indent=2))
    
    if not data.get('success'):
        print("\n✅ Correctly rejected empty key")
    
except Exception as e:
    print(f"Error: {e}")

# Test 3: Get suggestions (should work)
print("\n\nTest 3: Getting suggestions (should always work)")
print("-" * 60)

try:
    response = requests.get(
        f"{BASE_URL}/api/rag/suggestions",
        timeout=10
    )
    
    data = response.json()
    if data.get('success'):
        print("✅ Suggestions endpoint working")
        print(f"   Found {len(data.get('suggestions', []))} suggestions")
    else:
        print("❌ Suggestions endpoint failed")
        
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 60)
print("IMPORTANT NOTES:")
print("=" * 60)
print("""
1. To get a valid Gemini API key:
   - Visit: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key
   - Paste in the Configuration panel

2. Valid keys start with "AIzaSy" and are 39+ characters

3. Common issues:
   - Typo in API key
   - API key doesn't have Gemini access enabled
   - Rate limits exceeded (free tier)
   - Invalid authentication

4. First test your key here before using it:
   - https://ai.google.dev/

5. If still failing, ensure google-generativeai is installed:
   pip install google-generativeai
""")
