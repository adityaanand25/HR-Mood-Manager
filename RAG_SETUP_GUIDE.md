# Enhanced RAG System with Gemini API

Your RAG system is now fully integrated with your mood database and supports Gemini API for enhanced suggestions!

## Features

✅ **Database Integration**
- Loads mood records directly from your SQLite database
- Works with all 54+ mood records automatically
- No manual data entry required

✅ **Smart Question Suggestions**
- Contextual suggestions based on your emotion data
- Dynamically generated from mood statistics
- Helps users discover insights

✅ **Two Query Modes**

### 1. Rule-Based (Always Available)
- Works offline
- Pattern matching for common questions
- Fast responses
- No API key needed

### 2. Gemini-Enhanced (Optional)
- More intelligent analysis
- Personalized suggestions
- Natural language understanding
- Requires Gemini API key

## How to Use

### Option 1: Use Without Gemini API (Free)
Just access the AI Insights page and start asking questions. The system will use rule-based analysis.

### Option 2: Add Gemini API (Enhanced)

**Step 1: Get Gemini API Key**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy your API key

**Step 2: Configure in Frontend**
1. Click "Open AI Insights" from HR Panel
2. Click "Configure" button (top right)
3. Paste your Gemini API key
4. Click "Configure"

**Step 3: Start Using**
- Ask questions like:
  - "What is the most common emotion?"
  - "Show me emotional trends"
  - "Why are employees stressed?"
  - "How can we improve morale?"

## API Endpoints

### Enhanced Query with Gemini
```bash
POST /api/rag/enhanced-query
{
  "question": "What is the most common emotion?",
  "use_gemini": true
}
```

### Get Question Suggestions
```bash
GET /api/rag/suggestions
```

### Get Formatted Insights
```bash
GET /api/rag/insights
```

### Configure Gemini API
```bash
POST /api/rag/configure-gemini
{
  "api_key": "your-api-key"
}
```

## Backend Implementation

The enhanced RAG system is in `rag_enhanced.py` with:

- **EnhancedEmotionRAG**: Main class handling queries
- **get_emotion_stats()**: Analyzes mood distribution
- **get_question_suggestions()**: Generates smart suggestions
- **query_with_gemini()**: Uses Gemini for advanced analysis
- **query_rule_based()**: Fallback rule-based analysis
- **get_insights()**: Generates formatted reports

## Database Queries

The system pulls from your `mood_records` table:
- Emotion type (happy, sad, angry, etc.)
- Confidence score
- Timestamp
- Employee information
- Detection method

## Configuration via Environment

You can also set the API key via environment variable:
```powershell
$env:GEMINI_API_KEY = "your-api-key"
```

Then restart your backend server.

## Example Questions You Can Ask

**Analysis Questions:**
- "What is the most common emotion among employees?"
- "Show me the emotional trend over the past week"
- "Which departments have the highest stress levels?"

**Suggestions Questions:**
- "How can we improve employee well-being?"
- "What are the main stressors?"
- "Why are some employees more engaged than others?"

**Action Questions:**
- "What interventions should we implement?"
- "How should we support struggling employees?"
- "What wellness programs work best?"

## Troubleshooting

### Gemini API not working?
- Verify API key is valid
- Check internet connection
- Ensure google-generativeai package is installed: `pip install google-generativeai`

### No mood records showing?
- Ensure mood records exist in database
- Check database connection
- Run: `python -c "from database import get_mood_records; print(len(get_mood_records()))"`

### Empty suggestions?
- Add more mood records to database
- System needs at least some data to generate suggestions
- Run emotion detection to generate more records

## Next Steps

1. ✅ Click "Open AI Insights" from HR Panel
2. ✅ Try asking questions about emotions
3. ✅ (Optional) Add Gemini API key for enhanced features
4. ✅ Share insights with team leads
5. ✅ Track emotional trends over time

Enjoy your AI-powered emotion insights! 🎉
