#!/usr/bin/env python3
"""
Test script to verify RAG system integration and create test emotion data
"""

import sys
import time
import database

def create_test_emotions():
    """Create test emotion records for RAG to analyze"""
    print("\n🔧 Creating test emotion data...")
    
    # Test emotions for different employees
    test_data = [
        ("EMP001", "happy", 85.5, "Morning check-in - feeling great"),
        ("EMP001", "neutral", 72.3, "Mid-afternoon - focused on work"),
        ("EMP001", "happy", 88.1, "End of day - accomplished tasks"),
        ("2415800007", "sad", 65.4, "Stressed with workload"),
        ("2415800007", "angry", 72.0, "Meeting didn't go well"),
        ("2415800007", "neutral", 68.5, "Taking a break"),
        ("2415800016", "happy", 90.2, "Great day, productive"),
        ("2415800016", "happy", 87.6, "Team lunch was great"),
        ("2415800016", "neutral", 70.1, "Routine tasks"),
    ]
    
    saved_count = 0
    for user_id, emotion, confidence, notes in test_data:
        try:
            result = database.save_mood_record(
                user_id=user_id,
                emotion=emotion,
                confidence=confidence,
                detection_method='manual_test',
                notes=notes
            )
            if result:
                saved_count += 1
                print(f"   ✓ {user_id}: {emotion} ({confidence:.1f}%)")
            else:
                print(f"   ✗ Failed to save for {user_id}")
        except Exception as e:
            print(f"   ✗ Error for {user_id}: {e}")
    
    print(f"\n✅ Created {saved_count} test emotion records\n")
    return saved_count > 0

def test_rag_system():
    """Test the RAG system directly"""
    print("\n🤖 Testing RAG system...")
    
    try:
        # Import after database setup
        import api_server
        
        # Initialize RAG
        rag = api_server.EmotionRAG()
        print("   ✓ RAG system initialized")
        
        # Build from database
        if rag.build_from_database():
            print("   ✓ RAG database built from mood records")
        else:
            print("   ⚠ RAG database build returned false (may be empty)")
        
        # Test queries
        test_queries = [
            "What are the most common emotions?",
            "How is EMP001 feeling?",
            "Any concerning emotional trends?",
            "What's the team mood?",
        ]
        
        print("\n   📝 Testing queries:")
        for query in test_queries:
            response = rag.query(query)
            print(f"\n   Q: {query}")
            print(f"   A: {response[:100]}...")
        
        # Test insights
        print("\n   📊 Generating insights:")
        insights = rag.get_insights()
        print(insights)
        
        print("\n✅ RAG system test completed successfully\n")
        return True
        
    except Exception as e:
        print(f"\n❌ RAG system test failed: {e}\n")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("EMPLOYEE MOOD ANALYZER - RAG SYSTEM TEST")
    print("=" * 60)
    
    # Initialize database
    print("\n📦 Initializing database...")
    try:
        database.init_database()
        print("   ✓ Database initialized")
    except Exception as e:
        print(f"   ✗ Failed to initialize database: {e}")
        return 1
    
    # Create test data
    if not create_test_emotions():
        print("⚠️  No test data created, continuing with existing data...")
    
    # Test RAG system
    if not test_rag_system():
        print("⚠️  RAG system test had issues, check configuration")
        return 1
    
    print("=" * 60)
    print("✅ ALL TESTS COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print("\nYou can now:")
    print("  1. Start the backend: python api_server.py")
    print("  2. Access AI Insights at: http://localhost:3001/insights")
    print("  3. Or click 'Open AI Insights' from the HR Panel")
    print("=" * 60)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
