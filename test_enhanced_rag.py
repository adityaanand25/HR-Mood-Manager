#!/usr/bin/env python3
"""Test enhanced RAG system"""

from rag_enhanced import rag_system

print("Testing Enhanced RAG System")
print("="*60)

# Test 1: Rule-based query
print("\n1. Testing Rule-Based Query:")
print("-"*60)
answer = rag_system.query_rule_based("What is the most common emotion?")
print(answer)

# Test 2: Suggestions
print("\n2. Getting Question Suggestions:")
print("-"*60)
suggestions = rag_system.get_question_suggestions()
for i, s in enumerate(suggestions, 1):
    print(f"  {i}. {s}")

# Test 3: Statistics
print("\n3. Emotion Statistics:")
print("-"*60)
stats = rag_system.get_emotion_stats()
print(f"  Total Records: {stats.get('total_records', 0)}")
print(f"  Most Common: {stats.get('most_common', 'N/A')}")
print(f"  Unique Emotions: {len(stats.get('emotion_counts', {}))}")

# Test 4: Another query
print("\n4. Testing Another Query:")
print("-"*60)
answer = rag_system.query_rule_based("Show me recent emotion patterns")
print(answer)

# Test 5: Insights report
print("\n5. Formatted Insights Report:")
print("-"*60)
insights = rag_system.get_insights()
print(insights)

print("\n" + "="*60)
print("All tests completed successfully!")
print("="*60)
