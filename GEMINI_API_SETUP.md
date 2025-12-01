# Gemini API Configuration Guide

## Issue: "Failed to configure Gemini API"

This guide helps you fix the Gemini API configuration issue.

## Step 1: Get Your API Key ✅

1. **Visit Google AI Studio:**
   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key:**
   - Click "Create API Key" or "Create new secret key"
   - Your key will look like: `AIzaSyD_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy the entire key

3. **Verify Your Key:**
   - Should start with `AIzaSy`
   - Should be 39+ characters long
   - Should not have spaces or special characters

## Step 2: Check Requirements ✅

Make sure these are installed:

```powershell
# In your HR Mood Manager terminal
python -m pip install google-generativeai

# Verify installation
python -c "import google.generativeai; print('OK')"
```

## Step 3: Configure in Frontend ✅

1. **Start Backend Server:**
   ```powershell
   cd "d:\HR Mood Manager"
   python api_server.py
   ```
   You should see: `Uvicorn running on http://0.0.0.0:8000`

2. **Start Frontend:**
   ```powershell
   cd "d:\HR Mood Manager\frontend"
   npm run dev
   ```
   You should see: `ready on http://localhost:3001`

3. **Configure API Key:**
   - Open http://localhost:3001 in browser
   - Login as HR user
   - Click "Open AI Insights" from dashboard
   - Click "Configure" button (top right)
   - Paste your API key
   - Click "Configure"

## Step 4: Troubleshooting ⚠️

### Error: "API key not valid"
- Check your API key is correct
- Visit https://makersuite.google.com/app/apikey
- Make sure key hasn't been revoked
- Copy the entire key without spaces

### Error: "google-generativeai not installed"
```powershell
python -m pip install --upgrade google-generativeai
```

### Error: "Connection refused" or "Backend not running"
- Make sure api_server.py is running
- Check it's on port 8000
- Look for errors in the terminal

### Error: "API key has no access"
- Free tier keys need to enable Gemini API
- Visit https://ai.google.dev/
- Follow setup instructions

## Step 5: Test Configuration ✅

Run this test script to verify everything:

```powershell
cd "d:\HR Mood Manager"
python test_gemini_endpoint.py
```

You should see output like:
```
Status Code: 200
{
  "success": true,
  "message": "Gemini API configured successfully",
  "gemini_enabled": true
}
```

## Step 6: Use Enhanced Insights ✅

Once configured:

1. Go to "AI Insights" page
2. Click on "Enhanced AI Insights" tab
3. Ask questions like:
   - "What is the most common emotion?"
   - "Why are employees stressed?"
   - "How can we improve morale?"
4. Get intelligent suggestions based on your data

## Still Having Issues?

### Check API Key Validity
```powershell
python
>>> import google.generativeai as genai
>>> genai.configure(api_key="YOUR_API_KEY_HERE")
>>> model = genai.GenerativeModel('gemini-pro')
>>> response = model.generate_content("Hello")
>>> print(response.text)
```

### Check Backend Logs
Look at the terminal running `api_server.py` for error messages

### Check Frontend Console
- Press F12 in browser
- Go to Console tab
- Look for error messages

## API Key Security 🔒

⚠️ **IMPORTANT:**
- Never commit your API key to git
- Don't share your API key with anyone
- Regenerate it if you suspect it's compromised
- Use environment variables in production: `GEMINI_API_KEY=your_key python api_server.py`

## Rate Limits

Free tier has limits:
- 60 requests per minute
- Check usage at: https://console.cloud.google.com

## Alternative: Use Without Gemini

If you can't get Gemini working, the system still works with rule-based analysis:
- Click "Basic Insights" tab
- Ask questions - works offline
- No API key needed

## Next Steps

1. ✅ Get valid API key
2. ✅ Install google-generativeai
3. ✅ Configure in frontend
4. ✅ Start asking questions
5. ✅ Get intelligent suggestions

Questions? Check the error messages in:
- Browser console (F12)
- Terminal running api_server.py
- Terminal running npm run dev
