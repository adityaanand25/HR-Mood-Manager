"""
Enhanced RAG System with Gemini API Integration
Provides emotion insights from database with optional Gemini suggestions
"""

import os
from typing import Dict, List, Optional
import database
import logging

logger = logging.getLogger(__name__)

# Try to import Gemini
genai = None
try:
    import google.generativeai as genai_module
    genai = genai_module
except ImportError as e:
    logger.warning(f"⚠️  google-generativeai not installed: {e}")
    logger.info("Install with: pip install google-generativeai")

# Initialize Gemini if API key available
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_ENABLED = bool(GEMINI_API_KEY) and genai is not None

if GEMINI_ENABLED:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("✅ Gemini API initialized")
    except Exception as e:
        logger.warning(f"⚠️  Could not initialize Gemini: {e}")
        GEMINI_ENABLED = False


class EnhancedEmotionRAG:
    """Enhanced RAG with Gemini API for smart suggestions"""
    
    def __init__(self):
        self.records_cache = []
        self.build_from_database()
    
    def build_from_database(self):
        """Load mood records from database"""
        try:
            mood_records = database.get_mood_records(limit=1000)
            self.records_cache = mood_records
            logger.info(f"📦 Loaded {len(mood_records)} mood records for RAG")
            return len(mood_records) > 0
        except Exception as e:
            logger.error(f"❌ Error loading mood records: {e}")
            self.records_cache = []
            return False
    
    def get_emotion_stats(self) -> Dict:
        """Get statistics about emotions in the database"""
        if not self.records_cache:
            return {}
        
        emotion_counts = {}
        confidence_sum = {}
        
        for record in self.records_cache:
            emotion = record['emotion']
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            confidence_sum[emotion] = confidence_sum.get(emotion, 0) + record['confidence']
        
        # Calculate averages
        stats = {
            'total_records': len(self.records_cache),
            'emotion_counts': emotion_counts,
            'emotion_distribution': {
                e: count / len(self.records_cache) * 100 
                for e, count in emotion_counts.items()
            },
            'average_confidence': {
                e: confidence_sum[e] / emotion_counts[e] 
                for e in emotion_counts
            },
            'most_common': max(emotion_counts, key=emotion_counts.get) if emotion_counts else None
        }
        
        return stats
    
    def get_question_suggestions(self) -> List[str]:
        """Provide smart suggestions for questions users can ask"""
        stats = self.get_emotion_stats()
        
        suggestions = [
            "What is the most common emotion among employees?",
            "Show me the emotional trend over time",
            "Which departments have the highest stress levels?",
            "What are the recent emotion patterns?",
            "How can we improve employee well-being?"
        ]
        
        # Add dynamic suggestions based on data
        if stats.get('most_common'):
            suggestions.insert(0, f"Why are employees feeling {stats['most_common']} most often?")
        
        if len(stats.get('emotion_counts', {})) > 3:
            suggestions.append("What factors contribute to different emotions?")
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def query_with_gemini(self, question: str, context_data: Optional[Dict] = None) -> Dict:
        """
        Query with Gemini API for enhanced analysis and suggestions
        Returns both RAG answer and Gemini suggestions
        """
        if not GEMINI_ENABLED or genai is None:
            logger.warning("⚠️  Gemini API not configured. Returning rule-based answer only.")
            return {
                'answer': self.query_rule_based(question),
                'suggestions': self.get_question_suggestions(),
                'source': 'rule-based'
            }
        
        try:
            stats = context_data or self.get_emotion_stats()
            
            # Prepare context for Gemini
            emotion_summary = ", ".join([
                f"{e}: {count}x" 
                for e, count in sorted(
                    stats.get('emotion_counts', {}).items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:5]
            ])
            
            prompt = f"""You are an HR analytics expert analyzing employee emotional data.

Employee Emotion Data Summary:
- Total Records: {stats.get('total_records', 0)}
- Emotion Distribution: {emotion_summary}
- Most Common Emotion: {stats.get('most_common', 'Unknown')}

User Question: {question}

Provide:
1. A concise answer to the question based on the data
2. 2-3 actionable suggestions for HR to improve employee well-being
3. Any concerns or patterns to watch

Keep the response professional and data-driven."""
            
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            
            # Parse the response
            answer_text = response.text
            
            return {
                'answer': answer_text,
                'suggestions': self.get_question_suggestions(),
                'source': 'gemini-enhanced',
                'confidence': 'high'
            }
            
        except Exception as e:
            logger.error(f"❌ Gemini API error: {e}")
            # Fallback to rule-based
            return {
                'answer': self.query_rule_based(question),
                'suggestions': self.get_question_suggestions(),
                'source': 'rule-based-fallback',
                'error': str(e)
            }
    
    def query_rule_based(self, question: str) -> str:
        """Rule-based query for when Gemini is not available"""
        if not self.records_cache:
            return "No emotion data available. Please add mood records first."
        
        stats = self.get_emotion_stats()
        q_lower = question.lower()
        
        # Pattern matching for common questions
        if any(word in q_lower for word in ['most', 'common', 'frequent']):
            most = stats.get('most_common', 'unknown')
            count = stats['emotion_counts'].get(most, 0)
            return f"The most common emotion is '{most}' with {count} occurrences ({stats['emotion_distribution'].get(most, 0):.1f}% of all records)."
        
        elif any(word in q_lower for word in ['recent', 'latest', 'last']):
            if self.records_cache:
                latest = self.records_cache[-1]
                return f"The most recent emotion detected was '{latest['emotion']}' for {latest['user_id']} at {latest['timestamp']}."
            return "No recent records found."
        
        elif any(word in q_lower for word in ['trend', 'pattern', 'change']):
            emotions_list = [r['emotion'] for r in self.records_cache[-10:]]
            unique_emotions = list(set(emotions_list))
            return f"Recent emotional patterns show variety: {', '.join(unique_emotions)}. This indicates diverse emotional states among employees."
        
        elif any(word in q_lower for word in ['stress', 'anxiety', 'worry']):
            negative = stats['emotion_counts'].get('Sad', 0) + stats['emotion_counts'].get('Angry', 0)
            total = stats['total_records']
            pct = (negative / total * 100) if total > 0 else 0
            return f"Negative emotions (Sad/Angry) account for {pct:.1f}% of records. HR should consider support initiatives."
        
        elif any(word in q_lower for word in ['happy', 'positive', 'good']):
            positive = stats['emotion_counts'].get('Happy', 0)
            total = stats['total_records']
            pct = (positive / total * 100) if total > 0 else 0
            return f"Positive emotions (Happy) represent {pct:.1f}% of records. {['Consider ways to sustain this positive trend.' if pct > 50 else 'There is room to improve employee satisfaction.']}"
        
        else:
            # Generic answer
            summary = ", ".join([
                f"{e} ({count})" 
                for e, count in sorted(
                    stats['emotion_counts'].items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:3]
            ])
            return f"Based on {stats['total_records']} mood records: {summary}. The overall emotional landscape shows {stats.get('most_common', 'diverse')} emotions being most prevalent."
    
    def get_insights(self) -> str:
        """Generate formatted insights report"""
        stats = self.get_emotion_stats()
        
        if not stats:
            return "No emotion data available for insights."
        
        report = f"""
╔══════════════════════════════════════════════════════════╗
║         EMPLOYEE EMOTION INSIGHTS REPORT                 ║
╚══════════════════════════════════════════════════════════╝

📊 Summary:
   Total Records: {stats['total_records']}
   Most Common Emotion: {stats.get('most_common', 'Unknown')}
   Unique Emotions Detected: {len(stats['emotion_counts'])}

📈 Emotion Distribution:
"""
        
        for emotion, pct in sorted(
            stats['emotion_distribution'].items(),
            key=lambda x: x[1],
            reverse=True
        ):
            count = stats['emotion_counts'][emotion]
            bar = "█" * int(pct / 5)
            report += f"   {emotion:15s}: {count:3d} ({pct:5.1f}%) {bar}\n"
        
        report += "\n💡 Key Insights:\n"
        
        # Add insights based on patterns
        if stats['emotion_distribution'].get('Happy', 0) > 40:
            report += "   ✅ Excellent: High levels of positive emotions detected.\n"
        
        if stats['emotion_distribution'].get('Sad', 0) > 20 or stats['emotion_distribution'].get('Angry', 0) > 20:
            report += "   ⚠️  Warning: Significant negative emotions detected. Consider support programs.\n"
        
        if stats['emotion_distribution'].get('Neutral', 0) > 30:
            report += "   📌 Note: High neutral emotions suggest potential disengagement.\n"
        
        report += "\n🎯 Recommendations:\n"
        report += "   • Monitor emotional trends weekly\n"
        report += "   • Conduct focus groups on stress factors\n"
        report += "   • Implement wellness programs as needed\n"
        
        return report


# Create a singleton instance
rag_system = EnhancedEmotionRAG()


def set_gemini_api_key(api_key: str):
    """Set Gemini API key at runtime"""
    global GEMINI_ENABLED, GEMINI_API_KEY, genai
    
    if not api_key or not api_key.strip():
        logger.error("API key is empty")
        return False
    
    # Check if genai is available
    if genai is None:
        logger.error("❌ google-generativeai not installed. Install with: pip install google-generativeai")
        return False
    
    GEMINI_API_KEY = api_key.strip()
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("✅ Gemini API configured")
        GEMINI_ENABLED = True
        return True
    except ValueError as e:
        logger.error(f"❌ Invalid API key: {e}")
        GEMINI_ENABLED = False
        return False
    except Exception as e:
        logger.error(f"❌ Failed to configure Gemini: {e}")
        GEMINI_ENABLED = False
        return False
