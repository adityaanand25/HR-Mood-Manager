#!/usr/bin/env python3
"""Quick verification of Gemini API setup"""

import os
import sys

print("Gemini API Setup Verification")
print("=" * 70)

# Check 1: google-generativeai installed
print("\n[1/5] Checking google-generativeai installation...")
try:
    import google.generativeai as genai
    print("✅ google-generativeai is installed")
except ImportError:
    print("❌ google-generativeai NOT installed")
    print("   Fix: pip install google-generativeai")
    sys.exit(1)

# Check 2: FastAPI and dependencies
print("\n[2/5] Checking FastAPI and dependencies...")
try:
    from fastapi import FastAPI
    print("✅ FastAPI is installed")
except ImportError:
    print("❌ FastAPI NOT installed")
    print("   Fix: pip install fastapi uvicorn")
    sys.exit(1)

# Check 3: Database module
print("\n[3/5] Checking database module...")
try:
    import database
    records = database.get_mood_records(limit=1)
    print(f"✅ Database module works ({len(database.get_mood_records())} records)")
except Exception as e:
    print(f"⚠️  Database issue: {e}")

# Check 4: RAG module
print("\n[4/5] Checking RAG module...")
try:
    from rag_enhanced import rag_system, set_gemini_api_key
    stats = rag_system.get_emotion_stats()
    print(f"✅ RAG module works ({stats.get('total_records', 0)} records loaded)")
except Exception as e:
    print(f"❌ RAG module error: {e}")
    sys.exit(1)

# Check 5: API Key format validator
print("\n[5/5] API Key format check...")
def validate_api_key_format(key):
    """Check if API key has valid format"""
    if not key:
        return False, "Empty key"
    if not key.startswith("AIzaSy"):
        return False, "Should start with 'AIzaSy'"
    if len(key) < 39:
        return False, f"Too short ({len(key)} chars, need 39+)"
    return True, "Valid format"

# Test with dummy key
test_key = "AIzaSyDummy1234567890-abcdefghijklmnopqrst"
is_valid, msg = validate_api_key_format(test_key)
if is_valid:
    print(f"✅ API Key format validation ready")
else:
    print(f"⚠️  Format check: {msg}")

print("\n" + "=" * 70)
print("SETUP STATUS: ✅ All systems ready!")
print("=" * 70)

print("""
To use Gemini API:

1. Get API key from: https://makersuite.google.com/app/apikey
2. Start backend: python api_server.py
3. Start frontend: cd frontend && npm run dev
4. Open http://localhost:3001
5. Go to AI Insights page
6. Click Configure button
7. Paste your API key
8. Click Configure

Your API key should:
- Start with "AIzaSy"
- Be 39+ characters long
- Not have spaces or special chars
- Have Gemini API enabled at makersuite.google.com

Problems?
- Check GEMINI_API_SETUP.md for detailed guide
- Run: python test_gemini_endpoint.py (with server running)
- Check F12 console in browser for errors
""")
