#!/usr/bin/env python3
"""
Test emotion RAG app with database records
"""
import sys
sys.path.insert(0, 'd:\\HR Mood Manager')

from emotion_rag_app import EmotionDetector, EmotionRAG

# Load records from database
detector = EmotionDetector()
print(f"\n✅ Loaded {len(detector.history)} records from database")

# Build RAG
rag = EmotionRAG()
if rag.build(detector.history):
    print("\n📊 Testing RAG queries...")
    
    # Test queries
    test_questions = [
        "What is the most common emotion?",
        "What was my latest emotion?",
        "Show me the emotional pattern",
        "How often was I happy?"
    ]
    
    for question in test_questions:
        answer = rag.query(question)
        print(f"\n❓ {question}")
        print(f"💡 {answer}")
    
    # Get insights
    print("\n" + "="*60)
    insights = rag.get_insights(detector.history)
    print(insights)
