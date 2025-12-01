#!/usr/bin/env python3
"""Test Gemini API configuration"""

import os
import sys

# Test 1: Check if google-generativeai is installed
print("Test 1: Checking google-generativeai installation")
print("-" * 60)
try:
    import google.generativeai as genai
    print("✅ google-generativeai is installed")
except ImportError as e:
    print(f"❌ google-generativeai not installed: {e}")
    sys.exit(1)

# Test 2: Try to configure with a dummy key
print("\nTest 2: Testing API configuration with dummy key")
print("-" * 60)
try:
    test_key = "test-api-key-123456789"
    genai.configure(api_key=test_key)
    print("✅ API configuration accepted (no validation on config step)")
except Exception as e:
    print(f"❌ Configuration failed: {e}")
    sys.exit(1)

# Test 3: Try to use the API (will fail with invalid key, but shows the error)
print("\nTest 3: Testing API usage (this should fail with invalid key)")
print("-" * 60)
try:
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Hello")
    print("✅ API call succeeded")
except Exception as e:
    print(f"⚠️  API call failed (expected with invalid key): {type(e).__name__}")
    print(f"   Error: {str(e)[:100]}...")

print("\n" + "=" * 60)
print("IMPORTANT NOTES:")
print("=" * 60)
print("""
1. API key validation happens when you CALL the API, not on configure()
2. Invalid keys will fail during actual API calls
3. Check if your key is correct at: https://makersuite.google.com/app/apikey
4. Ensure the key has access to Gemini API
5. The API endpoint needs to handle errors gracefully
""")
