from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import logging
import sys
import os
from typing import Optional, Dict, Any, List
import sqlite3

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize global variables
rag_system = None

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup."""
    logger.info("Starting RAG Test Server...")
    
    # Initialize database
    try:
        from database import init_database
        init_database()
        logger.info("✓ Database initialized successfully!")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise e
    
    # Initialize RAG system
    try:
        await init_rag_system()
        logger.info("✓ RAG system initialized successfully!")
    except Exception as e:
        logger.warning(f"RAG system initialization failed: {e}")
        # Continue without RAG for now

# RAG Models
class RAGQueryRequest(BaseModel):
    question: str
    user_id: Optional[str] = None

class RAGQueryResponse(BaseModel):
    success: bool
    question: str
    answer: str

class RAGInsightsResponse(BaseModel):
    success: bool
    insights: str
    user_id: Optional[str] = None

# Emotion RAG System Class
class EmotionRAG:
    def __init__(self):
        self.embeddings = None
        self.chroma_client = None
        self.collection = None
        self.model_name = "all-MiniLM-L6-v2"
        
    async def initialize(self):
        """Initialize the RAG system with embeddings and vector database"""
        try:
            from sentence_transformers import SentenceTransformer
            import chromadb
            from chromadb.config import Settings
            import sqlite3
            
            # Initialize embeddings
            logger.info("Loading sentence transformer model...")
            self.embeddings = SentenceTransformer(self.model_name)
            
            # Initialize ChromaDB
            logger.info("Initializing ChromaDB...")
            self.chroma_client = chromadb.Client(Settings(
                allow_reset=True,
                is_persistent=False  # Use in-memory for testing
            ))
            
            # Create or get collection
            self.collection = self.chroma_client.get_or_create_collection(
                name="emotion_data",
                metadata={"description": "Employee emotion analysis data"}
            )
            
            # Build database from existing emotion records
            await self.build_from_database()
            
            return True
            
        except Exception as e:
            logger.error(f"RAG initialization error: {e}")
            return False
    
    async def build_from_database(self):
        """Build vector database from existing emotion records"""
        try:
            import sqlite3
            import pandas as pd
            from datetime import datetime
            
            # Connect to database
            conn = sqlite3.connect('database.db')
            
            # Get emotion records
            query = """
            SELECT er.*, u.full_name, u.user_id 
            FROM emotion_records er
            LEFT JOIN users u ON er.user_id = u.id
            ORDER BY er.created_at DESC
            """
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            if df.empty:
                logger.info("No emotion records found in database")
                return
            
            # Create documents from emotion data
            documents = []
            metadatas = []
            ids = []
            
            for idx, row in df.iterrows():
                # Create a comprehensive document for each emotion record
                doc_text = f"""
                Employee: {row.get('full_name', 'Unknown')} (ID: {row.get('user_id', 'Unknown')})
                Date: {row['created_at']}
                Primary Emotion: {row['predicted_emotion']}
                Confidence: {row['confidence']:.2f}
                Emotions Detected: {row['all_emotions']}
                Context: Emotion detection analysis from facial expression
                Timestamp: {row['created_at']}
                """
                
                documents.append(doc_text.strip())
                metadatas.append({
                    'user_id': str(row.get('user_id', '')),
                    'emotion': row['predicted_emotion'],
                    'confidence': float(row['confidence']),
                    'date': row['created_at'],
                    'full_name': row.get('full_name', 'Unknown'),
                    'type': 'emotion_record'
                })
                ids.append(f"emotion_{row['id']}")
            
            if documents:
                # Generate embeddings
                logger.info(f"Generating embeddings for {len(documents)} emotion records...")
                embeddings = self.embeddings.encode(documents).tolist()
                
                # Add to collection
                self.collection.add(
                    documents=documents,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    ids=ids
                )
                
                logger.info(f"✓ Added {len(documents)} emotion records to vector database")
            
        except Exception as e:
            logger.error(f"Error building database: {e}")
    
    async def query(self, question: str, user_id: Optional[str] = None) -> str:
        """Query the RAG system with a question"""
        try:
            if not self.collection:
                return "RAG system not properly initialized"
            
            # Generate query embedding
            query_embedding = self.embeddings.encode([question]).tolist()
            
            # Prepare where filter if user_id is specified
            where_filter = None
            if user_id:
                where_filter = {"user_id": user_id}
            
            # Search similar documents
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=5,
                where=where_filter
            )
            
            if not results['documents'] or not results['documents'][0]:
                return "No relevant emotion data found for your question."
            
            # Combine relevant documents
            context_docs = results['documents'][0]
            metadatas = results['metadatas'][0]
            
            # Create context for analysis
            context = "\\n\\n".join(context_docs)
            
            # Generate response using simple pattern matching and analysis
            response = self._analyze_question_with_context(question, context, metadatas)
            
            return response
            
        except Exception as e:
            logger.error(f"Query error: {e}")
            return f"Error processing your question: {str(e)}"
    
    def _analyze_question_with_context(self, question: str, context: str, metadatas: List[Dict]) -> str:
        """Analyze the question with context and generate a response"""
        question_lower = question.lower()
        
        # Extract emotions from metadata
        emotions = [meta.get('emotion', '') for meta in metadatas]
        confidences = [meta.get('confidence', 0) for meta in metadatas]
        users = [meta.get('full_name', 'Unknown') for meta in metadatas]
        dates = [meta.get('date', '') for meta in metadatas]
        
        # Common emotion analysis patterns
        if any(word in question_lower for word in ['most common', 'frequent', 'popular']):
            from collections import Counter
            emotion_counts = Counter(emotions)
            most_common = emotion_counts.most_common(3)
            
            if most_common:
                response = "Based on recent emotion data, the most common emotions are:\\n"
                for emotion, count in most_common:
                    response += f"• {emotion}: {count} instances\\n"
                return response
        
        elif any(word in question_lower for word in ['struggling', 'negative', 'sad', 'stress']):
            negative_emotions = ['sad', 'angry', 'fear', 'disgust']
            concerning_cases = []
            
            for i, emotion in enumerate(emotions):
                if emotion.lower() in negative_emotions:
                    concerning_cases.append({
                        'user': users[i],
                        'emotion': emotion,
                        'date': dates[i],
                        'confidence': confidences[i]
                    })
            
            if concerning_cases:
                response = "Employees showing concerning emotions:\\n"
                for case in concerning_cases[:5]:  # Limit to 5 cases
                    response += f"• {case['user']}: {case['emotion']} on {case['date'][:10]}\\n"
                return response
            else:
                return "No employees showing significantly concerning emotional patterns in recent data."
        
        elif any(word in question_lower for word in ['happy', 'positive', 'good', 'well']):
            positive_emotions = ['happy', 'joy', 'neutral']
            positive_cases = []
            
            for i, emotion in enumerate(emotions):
                if emotion.lower() in positive_emotions:
                    positive_cases.append({
                        'user': users[i],
                        'emotion': emotion,
                        'date': dates[i],
                        'confidence': confidences[i]
                    })
            
            if positive_cases:
                response = "Employees showing positive emotions:\\n"
                for case in positive_cases[:5]:
                    response += f"• {case['user']}: {case['emotion']} on {case['date'][:10]}\\n"
                return response
        
        elif any(word in question_lower for word in ['trend', 'pattern', 'over time', 'change']):
            return "Based on the available data, I can see emotion patterns from recent records. For detailed trend analysis, more historical data would be helpful."
        
        elif any(word in question_lower for word in ['average', 'confidence', 'accuracy']):
            if confidences:
                avg_confidence = sum(confidences) / len(confidences)
                response = f"Average emotion detection confidence: {avg_confidence:.1%}\\n"
                response += f"Based on {len(emotions)} recent emotion records."
                return response
        
        # Default response with summary
        unique_emotions = list(set(emotions))
        unique_users = list(set(users))
        
        response = f"Based on {len(emotions)} recent emotion records:\\n"
        response += f"• {len(unique_users)} employees monitored\\n"
        response += f"• {len(unique_emotions)} different emotions detected\\n"
        response += f"• Emotions include: {', '.join(unique_emotions[:5])}\\n"
        
        if len(unique_emotions) > 5:
            response += f"• And {len(unique_emotions) - 5} more...\\n"
        
        return response
    
    async def get_insights(self, user_id: Optional[str] = None) -> str:
        """Generate automatic insights from emotion data"""
        try:
            if not self.collection:
                return "RAG system not properly initialized for insights generation"
            
            # Prepare where filter if user_id is specified
            where_filter = None
            if user_id:
                where_filter = {"user_id": user_id}
            
            # Get recent emotion data
            results = self.collection.query(
                query_embeddings=None,
                n_results=20,
                where=where_filter
            )
            
            if not results['metadatas'] or not results['metadatas'][0]:
                return "No emotion data available for insights generation"
            
            metadatas = results['metadatas'][0]
            
            # Analyze the data
            emotions = [meta.get('emotion', '') for meta in metadatas]
            confidences = [meta.get('confidence', 0) for meta in metadatas]
            users = [meta.get('full_name', 'Unknown') for meta in metadatas]
            
            # Generate insights
            insights = []
            
            # Emotion distribution analysis
            from collections import Counter
            emotion_counts = Counter(emotions)
            
            if emotion_counts:
                insights.append("📊 EMOTION DISTRIBUTION:")
                for emotion, count in emotion_counts.most_common(3):
                    percentage = (count / len(emotions)) * 100
                    insights.append(f"   • {emotion}: {count} instances ({percentage:.1f}%)")
            
            # Confidence analysis
            if confidences:
                avg_confidence = sum(confidences) / len(confidences)
                insights.append(f"\\n🎯 DETECTION CONFIDENCE: {avg_confidence:.1%} average")
            
            # User participation
            unique_users = len(set(users))
            insights.append(f"\\n👥 PARTICIPATION: {unique_users} employees monitored")
            
            # Mood assessment
            positive_emotions = ['happy', 'joy', 'neutral']
            negative_emotions = ['sad', 'angry', 'fear', 'disgust']
            
            positive_count = sum(1 for e in emotions if e.lower() in positive_emotions)
            negative_count = sum(1 for e in emotions if e.lower() in negative_emotions)
            
            if positive_count + negative_count > 0:
                mood_ratio = positive_count / (positive_count + negative_count)
                insights.append(f"\\n😊 MOOD ASSESSMENT: {mood_ratio:.1%} positive emotions")
                
                if mood_ratio > 0.7:
                    insights.append("   Status: Generally positive workplace mood")
                elif mood_ratio > 0.4:
                    insights.append("   Status: Balanced emotional climate")
                else:
                    insights.append("   Status: May need attention for employee wellbeing")
            
            # Recommendations
            insights.append("\\n💡 RECOMMENDATIONS:")
            if negative_count > positive_count:
                insights.append("   • Consider team building activities")
                insights.append("   • Check workload and stress levels")
            elif avg_confidence < 0.8:
                insights.append("   • Emotion detection may need recalibration")
            else:
                insights.append("   • Maintain current positive environment")
            
            return "\\n".join(insights)
            
        except Exception as e:
            logger.error(f"Insights generation error: {e}")
            return f"Error generating insights: {str(e)}"

# Initialize RAG system
async def init_rag_system():
    """Initialize the global RAG system"""
    global rag_system
    try:
        rag_system = EmotionRAG()
        success = await rag_system.initialize()
        if success:
            logger.info("RAG system initialized successfully")
        else:
            logger.error("RAG system initialization failed")
            rag_system = None
    except Exception as e:
        logger.error(f"RAG system initialization error: {e}")
        rag_system = None

# RAG API Endpoints
@app.post("/api/emotion-insights/query", response_model=RAGQueryResponse)
async def query_emotion_insights(request: RAGQueryRequest):
    """Query emotion insights using natural language"""
    try:
        if not rag_system:
            raise HTTPException(status_code=503, detail="RAG system not available")
        
        answer = await rag_system.query(request.question, request.user_id)
        
        return RAGQueryResponse(
            success=True,
            question=request.question,
            answer=answer
        )
    
    except Exception as e:
        logger.error(f"Query endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/emotion-insights/auto-insights", response_model=RAGInsightsResponse)
async def get_auto_insights(user_id: Optional[str] = None):
    """Get automatic emotion insights"""
    try:
        if not rag_system:
            raise HTTPException(status_code=503, detail="RAG system not available")
        
        insights = await rag_system.get_insights(user_id)
        
        return RAGInsightsResponse(
            success=True,
            insights=insights,
            user_id=user_id
        )
    
    except Exception as e:
        logger.error(f"Auto insights endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emotion-insights/rebuild")
async def rebuild_rag_database():
    """Rebuild the RAG vector database from current emotion records"""
    try:
        if not rag_system:
            raise HTTPException(status_code=503, detail="RAG system not available")
        
        await rag_system.build_from_database()
        
        return {"success": True, "message": "RAG database rebuilt successfully"}
    
    except Exception as e:
        logger.error(f"Rebuild endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Basic health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "RAG Test Server is running"}

# Basic user endpoints for testing
class UserLogin(BaseModel):
    user_id: str
    password: str

@app.post("/api/login")
async def login(user_data: UserLogin):
    """Simple login for testing"""
    try:
        from database import authenticate_user
        user = authenticate_user(user_data.user_id, user_data.password)
        if user:
            return {
                "success": True,
                "user": {
                    "id": user['id'],
                    "user_id": user['user_id'],
                    "full_name": user['full_name'],
                    "role": user['role']
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)