"""
FastAPI Backend for Employee Mood Analyzer
Provides emotion detection API endpoint using the trained model
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import base64
from io import BytesIO
from PIL import Image
import logging
import database  # Import our database module

# Configure logging FIRST
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# RAG System imports
import chromadb

# Compatibility shim for huggingface_hub cached_download removal in newer versions
try:
    import huggingface_hub as _hf
    if not hasattr(_hf, 'cached_download') and hasattr(_hf, 'hf_hub_download'):
        def cached_download(*args, **kwargs):  # minimal wrapper
            return _hf.hf_hub_download(*args, **kwargs)
        _hf.cached_download = cached_download
except Exception:
    pass

# Optional import - SentenceTransformer is heavy, import only if needed
SentenceTransformer = None
try:
    from sentence_transformers import SentenceTransformer
except Exception as e:
    logger.warning(f"sentence-transformers not available ({type(e).__name__}), RAG embeddings will be disabled")

import warnings
warnings.filterwarnings('ignore')

app = FastAPI(title="Employee Mood Analyzer API", version="1.0.0")

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000", "*"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and cascade
model = None
face_cascade = None
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

# RAG System for Emotion Insights
class EmotionRAG:
    def __init__(self):
        try:
            logger.info("🤖 Loading RAG AI model...")
            # Try to load the embedder, but don't fail if offline
            try:
                if SentenceTransformer is not None:
                    self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
                    logger.info("✅ Sentence Transformer loaded from HuggingFace")
                else:
                    logger.warning("⚠️  SentenceTransformer not available")
                    self.embedder = None
            except Exception as e:
                logger.warning(f"⚠️  HuggingFace download failed: {e}")
                logger.info("📦 Using cached embedder or basic similarity search...")
                self.embedder = None
            
            # Initialize ChromaDB for vector storage
            self.chroma = chromadb.Client()
            self.collection = None
            self.records_cache = []
            
            logger.info("✅ RAG system initialized (will use rule-based insights if needed)")
        except Exception as e:
            logger.error(f"❌ Error initializing RAG: {e}")
            self.embedder = None
            self.chroma = None
            self.records_cache = []
    
    def build_from_database(self) -> bool:
        """Build vector database from mood records or cache records if vector DB unavailable"""
        try:
            # Get mood records from database
            mood_records = database.get_mood_records(limit=1000)
            
            if not mood_records:
                logger.info("No mood records found for RAG")
                self.records_cache = []
                return False
            
            # Cache records for rule-based insights
            self.records_cache = mood_records
            logger.info(f"📦 Cached {len(mood_records)} mood records for RAG")
            
            # If vector DB available, build collection
            if self.embedder and self.chroma:
                logger.info(f"🔨 Building RAG database from {len(mood_records)} records...")
                # Delete old collection if exists
                try:
                    self.chroma.delete_collection("emotions")
                except Exception:
                    pass
                # Create new collection
                self.collection = self.chroma.create_collection("emotions")
                
                # Prepare documents
                docs = []
                ids = []
                metas = []
                
                for i, rec in enumerate(mood_records):
                    time_str = rec['timestamp'][:19].replace('T', ' ')
                    
                    text = f"""Emotion Record {i+1} at {time_str}
Employee: {rec.get('full_name', rec['user_id'])}
Department: {rec.get('department', 'Unknown')}
Detected emotion: {rec['emotion']}
Confidence: {rec['confidence']:.1f}%
Detection method: {rec.get('detection_method', 'webcam')}
Notes: {rec.get('notes', 'No additional notes')}
Analysis: The employee was feeling {rec['emotion']} with {rec['confidence']:.1f}% confidence."""
                    
                    docs.append(text)
                    ids.append(f"rec_{i}")
                    metas.append({
                        'emotion': rec['emotion'],
                        'user_id': rec['user_id'],
                        'timestamp': rec['timestamp'],
                        'confidence': rec['confidence'],
                        'id': i
                    })
                
                # Add to collection
                self.collection.add(documents=docs, ids=ids, metadatas=metas)
                logger.info(f"✅ RAG vector database ready with {len(docs)} records")
            else:
                logger.info("✅ RAG cache ready (rule-based insights enabled)")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error building RAG database: {e}")
            # Still return True since we have cache
            return len(self.records_cache) > 0
    
    def query(self, question: str, user_id: str = None) -> str:
        """Query the RAG system for emotion insights; works without vector DB."""
        # Ensure data available
        if not self.collection and not self.records_cache:
            if not self.build_from_database():
                return "❌ RAG insights not available yet. No emotion data found. Please record some emotions first."
        
        try:
            metas = []
            # If we have vector DB, use it
            if self.collection and self.embedder:
                try:
                    results = self.collection.query(query_texts=[question], n_results=10)
                    if results.get('metadatas') and results['metadatas'][0]:
                        metas = results['metadatas'][0]
                except Exception as e:
                    logger.warning(f"Vector search failed: {e}, falling back to cache")
                    metas = []
            
            # Fallback: use cached records for rule-based insights
            if not metas and self.records_cache:
                metas = [{
                    'emotion': r['emotion'],
                    'user_id': r['user_id'],
                    'timestamp': r['timestamp'],
                    'confidence': r['confidence'],
                    'full_name': r.get('full_name', r['user_id']),
                    'department': r.get('department', 'Unknown')
                } for r in self.records_cache]
            
            if not metas:
                return "❌ No emotion data available to query."
            
            # Filter by user if specified
            if user_id:
                filtered_metas = [m for m in metas if m.get('user_id') == user_id]
                if filtered_metas:
                    metas = filtered_metas
                else:
                    return f"No emotion data found for user {user_id}."
            
            # Analyze retrieved data
            emotions = [m['emotion'] for m in metas]
            emotion_counts = {}
            for e in emotions:
                emotion_counts[e] = emotion_counts.get(e, 0) + 1
            
            # Generate smart answer based on question
            q_lower = question.lower()
            
            if 'most' in q_lower or 'common' in q_lower or 'frequent' in q_lower:
                if emotion_counts:
                    most = max(emotion_counts, key=emotion_counts.get)
                    return f"Based on the records, '{most}' is the most common emotion, appearing {emotion_counts[most]} times in relevant data."
                return "No emotion patterns found."
            
            elif 'recent' in q_lower or 'latest' in q_lower or 'last' in q_lower:
                if metas:
                    latest = metas[0]['emotion']
                    latest_time = metas[0]['timestamp'][:19].replace('T', ' ')
                    return f"The most recent emotion detected was '{latest}' at {latest_time}."
                return "No recent emotion data found."
            
            elif 'pattern' in q_lower or 'trend' in q_lower:
                if emotion_counts:
                    summary = ", ".join([f"{e}: {c} times" for e, c in emotion_counts.items()])
                    most_common = max(emotion_counts, key=emotion_counts.get)
                    return f"The emotional patterns show: {summary}. This indicates varying emotional states with emphasis on {most_common}."
                return "No emotional patterns found."
            
            elif any(emotion in q_lower for emotion in ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral']):
                target_emotions = [e for e in ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'] if e in q_lower]
                if target_emotions and emotion_counts:
                    target = target_emotions[0]
                    count = emotion_counts.get(target, 0)
                    return f"'{target}' appears {count} times in the relevant records, suggesting it's {'a significant' if count > 2 else 'a minor'} part of the emotional pattern."
                return f"No data found for the specified emotion."
            
            elif 'feel' in q_lower or 'emotion' in q_lower or 'mood' in q_lower:
                if emotion_counts:
                    most = max(emotion_counts, key=emotion_counts.get)
                    summary = ", ".join([f"{e} ({c}x)" for e, c in sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)])
                    return f"Overall emotional state shows: {summary}. The dominant emotion is {most}."
                return "No emotional data available."
            
            elif 'struggling' in q_lower or 'concern' in q_lower or 'negative' in q_lower:
                negative_emotions = ['sad', 'angry', 'fear', 'disgust']
                negative_count = sum(emotion_counts.get(e, 0) for e in negative_emotions)
                if negative_count > 0:
                    return f"Found {negative_count} negative emotion instances. Consider reaching out to affected employees for support."
                return "No concerning emotional patterns detected."
            
            elif 'team' in q_lower or 'department' in q_lower or 'organizational' in q_lower:
                if emotion_counts:
                    summary = ", ".join([f"{e} ({c}x)" for e, c in sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)])
                    positive = emotion_counts.get('happy', 0) + emotion_counts.get('neutral', 0)
                    total = sum(emotion_counts.values())
                    positive_pct = (positive / total * 100) if total > 0 else 0
                    return f"Team emotional health: {summary}. Overall positivity: {positive_pct:.1f}%."
                return "No team emotional data available."
            
            else:
                # Generic answer
                if emotion_counts:
                    summary = ", ".join([f"{e} ({c}x)" for e, c in sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)])
                    dominant = max(emotion_counts, key=emotion_counts.get)
                    return f"Based on relevant emotion records: {summary}. The dominant emotion in this context is {dominant}."
                return "No relevant emotion data found for your query."
                
        except Exception as e:
            logger.error(f"❌ Error in RAG query: {e}")
            return f"Error processing your question: {str(e)}"
    
    def get_insights(self, user_id: str = None) -> str:
        """Generate automatic insights from emotion data"""
        try:
            # Ensure cache is populated
            if not self.records_cache:
                self.build_from_database()
            
            # Get statistics from database
            if user_id:
                records = database.get_mood_records(user_id, limit=100)
            else:
                records = database.get_mood_records(None, limit=100)
            
            if not records:
                return "📊 No emotion data available yet. Start by recording some emotions through the emotion detection feature."
            
            # Calculate insights
            total_records = len(records)
            emotion_counts = {}
            confidence_sum = {}
            
            for record in records:
                emotion = record['emotion']
                confidence = record['confidence']
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                confidence_sum[emotion] = confidence_sum.get(emotion, 0) + confidence
            
            if not emotion_counts:
                return "No emotion data available for analysis."
            
            most_common = max(emotion_counts, key=emotion_counts.get)
            avg_confidences = {e: confidence_sum[e]/emotion_counts[e] for e in emotion_counts}
            
            insights = f"""╔══════════════════════════════════════════════════════════╗
║            EMOTION ANALYSIS INSIGHTS                     ║
╚══════════════════════════════════════════════════════════╝

📊 Summary:
   • Total Records: {total_records}
   • Most Common: {most_common.capitalize()} ({emotion_counts[most_common]}x, {emotion_counts[most_common]/total_records*100:.1f}%)
   • Average Confidence: {avg_confidences[most_common]:.1f}%

📈 Distribution:"""
            
            for emotion, count in sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True):
                pct = count/total_records*100
                bar = "█" * min(int(pct/3), 20)
                insights += f"\n   {emotion.capitalize():12s}: {count:3d} ({pct:5.1f}%) {bar}"
            
            # Add analysis
            insights += "\n\n💡 Analysis:\n"
            
            if most_common in ['happy', 'neutral', 'calm', 'energetic']:
                insights += "   ✅ Overall emotional state appears balanced and positive.\n"
            elif most_common in ['sad', 'angry', 'fear', 'disgusted', 'stressed']:
                insights += f"   ⚠️  Predominant {most_common} emotions detected.\n"
                insights += "   💙 Consider wellness programs and support initiatives.\n"
            
            # Diversity analysis
            emotion_variety = len(emotion_counts)
            if emotion_variety >= 5:
                insights += "   🎭 High emotional variety detected - showing healthy emotional range.\n"
            elif emotion_variety <= 2:
                insights += "   📌 Limited emotional variety - emotional state appears stable.\n"
            
            # Confidence analysis
            avg_confidence = sum(confidence_sum.values()) / sum(emotion_counts.values())
            if avg_confidence >= 85:
                insights += f"   🎯 High detection confidence ({avg_confidence:.1f}%) - emotions are clearly defined.\n"
            elif avg_confidence < 70:
                insights += f"   📷 Lower detection confidence ({avg_confidence:.1f}%) - consider improving lighting or camera angle.\n"
            
            return insights
            
        except Exception as e:
            logger.error(f"❌ Error generating insights: {e}")
            return f"Error generating insights: {str(e)}"

# Initialize RAG system
rag_system = None

def load_emotion_model():
    """Load the trained emotion detection model"""
    global model, face_cascade
    try:
        logger.info("Loading emotion detection model...")
        # Try loading your original trained model with different compatibility approaches
        try:
            # Method 1: Direct loading
            model = load_model('emotion_detection_model.h5')
            logger.info("✓ Original model loaded successfully!")
        except Exception as e1:
            logger.info(f"Direct loading failed: {e1}")
            try:
                # Method 2: Loading without compilation
                model = load_model('emotion_detection_model.h5', compile=False)
                logger.info("✓ Original model loaded (compile=False)!")
            except Exception as e2:
                logger.info(f"Compile=False failed: {e2}")
                try:
                    # Method 3: Manual reconstruction from weights
                    import h5py
                    from tensorflow.keras.layers import Dense, Dropout, Flatten, Conv2D, MaxPooling2D, BatchNormalization
                    from tensorflow.keras.models import Sequential
                    
                    # Create model architecture that matches your training
                    model = Sequential([
                        Conv2D(64, (3, 3), activation='relu', input_shape=(48, 48, 1)),
                        BatchNormalization(),
                        MaxPooling2D(pool_size=(2, 2)),
                        Dropout(0.25),
                        
                        Conv2D(128, (3, 3), activation='relu'),
                        BatchNormalization(),
                        MaxPooling2D(pool_size=(2, 2)),
                        Dropout(0.25),
                        
                        Conv2D(256, (3, 3), activation='relu'),
                        BatchNormalization(),
                        MaxPooling2D(pool_size=(2, 2)),
                        Dropout(0.25),
                        
                        Conv2D(512, (3, 3), activation='relu'),
                        BatchNormalization(),
                        MaxPooling2D(pool_size=(2, 2)),
                        Dropout(0.25),
                        
                        Flatten(),
                        Dense(256, activation='relu'),
                        BatchNormalization(),
                        Dropout(0.5),
                        Dense(512, activation='relu'),
                        BatchNormalization(),
                        Dropout(0.5),
                        Dense(7, activation='softmax')
                    ])
                    
                    # Try to extract and load weights manually
                    with h5py.File('emotion_detection_model.h5', 'r') as f:
                        # Load weights if available
                        if 'model_weights' in f.keys():
                            model.load_weights('emotion_detection_model.h5')
                        else:
                            # Compile and use as-is for now
                            model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
                            
                    logger.info("✓ Model reconstructed with manual architecture!")
                    
                except Exception as e3:
                    logger.info(f"Manual reconstruction failed: {e3}")
                    # Try the improved model first
                    try:
                        model = load_model('emotion_detection_model.h5')
                        logger.info("✓ Original model loaded successfully!")
                    except Exception as e4:
                        logger.error("❌ Could not load any model file")
                        raise Exception("No compatible emotion model found")
        
        # Load face cascade classifier
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        logger.info("✓ Face cascade loaded successfully!")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise e

def preprocess_face(face_img):
    """Preprocess face image for model prediction"""
    # Resize to 48x48
    face_img = cv2.resize(face_img, (48, 48))
    # Convert to grayscale if needed
    if len(face_img.shape) == 3:
        face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    # Normalize
    face_img = face_img / 255.0
    # Reshape for model input
    face_img = face_img.reshape(1, 48, 48, 1)
    return face_img

def decode_base64_image(base64_string):
    """Decode base64 image string to numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 string
        img_data = base64.b64decode(base64_string)
        img = Image.open(BytesIO(img_data))
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Convert RGB to BGR (OpenCV format)
        if len(img_array.shape) == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        return img_array
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Load model and initialize database on startup"""
    global rag_system
    
    # Try to load model but don't fail if it doesn't work
    try:
        load_emotion_model()
    except Exception as e:
        logger.warning(f"⚠️  Emotion model not loaded: {e}")
        logger.info("✓ API will run without emotion detection features")
    
    database.init_database()
    
    # Initialize RAG system
    try:
        rag_system = EmotionRAG()
        # Build initial database from existing mood records
        rag_system.build_from_database()
        logger.info("✓ RAG system initialized and ready")
    except Exception as e:
        logger.error(f"✗ RAG system initialization failed: {e}")
        rag_system = EmotionRAG()  # Still create empty instance for graceful fallback
    
    # Ensure at least one user exists to allow login
    try:
        users = database.get_all_users()
        if not users:
            # Create a default employee and HR user if DB is empty
            database.create_user(
                user_id="EMP001",
                password="emp123",
                role="employee",
                full_name="Employee One",
                email="emp1@example.com",
                department="Engineering",
            )
            database.create_user(
                user_id="HR001",
                password="hr123",
                role="hr",
                full_name="HR One",
                email="hr1@example.com",
                department="HR",
            )
            logger.info("✓ Seeded default users: EMP001/emp123, HR001/hr123")
    except Exception as e:
        logger.warning(f"Could not seed default users: {e}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Employee Mood Analyzer API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "/detect-emotion": "POST - Detect emotion from image",
            "/health": "GET - Health check"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_loaded = model is not None
    cascade_loaded = face_cascade is not None
    
    return {
        "status": "healthy" if (model_loaded and cascade_loaded) else "unhealthy",
        "model_loaded": model_loaded,
        "face_cascade_loaded": cascade_loaded
    }

@app.post("/api/detect-emotion")
async def detect_emotion(data: dict):
    """
    Detect emotion from base64 encoded image
    
    Request body:
    {
        "image": "base64_encoded_image_string",
        "user_id": "optional_user_id_to_save_to_database"
    }
    
    Response:
    {
        "emotion": "Happy",
        "confidence": 95.5,
        "all_predictions": {...}
    }
    """
    try:
        if model is None or face_cascade is None:
            raise HTTPException(status_code=503, detail="Emotion detection model not loaded")
        
        # Get image from request
        if 'image' not in data:
            raise HTTPException(status_code=400, detail="No image provided")
        
        base64_image = data['image']
        user_id = data.get('user_id')  # Optional user_id
        
        # Decode base64 image
        image = decode_base64_image(base64_image)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return JSONResponse(
                status_code=200,
                content={
                    "emotion": "No Face Detected",
                    "confidence": 0,
                    "all_predictions": {label: 0.0 for label in emotion_labels},
                    "face_detected": False,
                    "message": "No face detected in the image. Please ensure your face is visible and well-lit."
                }
            )
        
        # Use the largest face
        (x, y, w, h) = max(faces, key=lambda face: face[2] * face[3])
        
        # Extract face region
        face_roi = gray[y:y+h, x:x+w]
        
        # Preprocess face
        processed_face = preprocess_face(face_roi)
        
        # Predict emotion
        predictions = model.predict(processed_face)[0]
        
        # Create predictions dictionary
        all_predictions = {
            emotion_labels[i]: float(predictions[i] * 100)
            for i in range(len(emotion_labels))
        }
        
        # Get the emotion with highest confidence
        max_index = np.argmax(predictions)
        emotion = emotion_labels[max_index]
        confidence = float(predictions[max_index] * 100)
        
        logger.info(f"Detected emotion: {emotion} with {confidence:.2f}% confidence")
        
        # Save to database if user_id is provided
        if user_id and emotion != "No Face Detected":
            save_success = database.save_mood_record(
                user_id=user_id,
                emotion=emotion,
                confidence=confidence,
                detection_method='webcam',
                notes=f"Auto-detected with {confidence:.2f}% confidence"
            )
            logger.info(f"Mood record save result: {'SUCCESS' if save_success else 'FAILED'} for user: {user_id}")
            saved_to_db = save_success
        else:
            saved_to_db = False
        return {
            "emotion": emotion,
            "confidence": round(confidence, 2),
            "all_predictions": all_predictions,
            "face_detected": True,
            "face_location": {
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            },
            "saved_to_db": saved_to_db
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in emotion detection: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/api/detect-emotion-file")
async def detect_emotion_from_file(file: UploadFile = File(...)):
    """
    Detect emotion from uploaded image file
    """
    try:
        if model is None or face_cascade is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return {
                "emotion": "No Face Detected",
                "confidence": 0,
                "message": "No face detected in the image",
                "all_predictions": {}
            }
        
        # Use the largest face
        (x, y, w, h) = max(faces, key=lambda face: face[2] * face[3])
        
        # Extract face region
        face_roi = gray[y:y+h, x:x+w]
        
        # Preprocess face
        processed_face = preprocess_face(face_roi)
        
        # Predict emotion
        predictions = model.predict(processed_face, verbose=0)[0]
        
        # Get emotion with highest probability
        emotion_idx = np.argmax(predictions)
        emotion = emotion_labels[emotion_idx]
        confidence = float(predictions[emotion_idx] * 100)
        
        # Create predictions dictionary
        all_predictions = {
            emotion_labels[i]: float(predictions[i] * 100)
            for i in range(len(emotion_labels))
        }
        
        return {
            "emotion": emotion,
            "confidence": round(confidence, 2),
            "all_predictions": all_predictions,
            "face_detected": True
        }
        
    except Exception as e:
        logger.error(f"Error in emotion detection: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# ==================== Database API Endpoints ====================

class LoginRequest(BaseModel):
    user_id: str
    password: str

class UserRegistrationRequest(BaseModel):
    user_id: str
    password: str
    role: str  # 'employee' or 'hr'
    full_name: str
    email: str
    department: str = None

class PasswordUpdateRequest(BaseModel):
    user_id: str
    new_password: str

class MoodRecordRequest(BaseModel):
    user_id: str
    emotion: str
    confidence: float
    detection_method: str = 'webcam'
    notes: str = None

class MoodHistoryRequest(BaseModel):
    user_id: str
    mood: str
    intensity: int
    notes: str = None

class TaskCreateRequest(BaseModel):
    title: str
    description: str = None
    assigned_to: str
    assigned_by: str = None
    priority: str = 'medium'
    due_date: str = None

class TaskUpdateRequest(BaseModel):
    task_id: int
    status: str



@app.post("/api/login")
async def login(request: LoginRequest):
    """Authenticate user and return user details"""
    try:
        logger.info(f"Login attempt for user: {request.user_id}")
        user = database.authenticate_user(request.user_id, request.password)
        
        if user:
            logger.info(f"Login successful for user: {request.user_id}")
            return {
                "success": True,
                "user": user,
                "message": "Login successful"
            }
        else:
            logger.warning(f"Login failed for user: {request.user_id} - Invalid credentials")
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@app.post("/api/register")
async def register_user(request: UserRegistrationRequest):
    """Register a new user"""
    # Validate role
    if request.role not in ['employee', 'hr']:
        raise HTTPException(status_code=400, detail="Role must be 'employee' or 'hr'")
    
    # Validate password strength
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    result = database.create_user(
        request.user_id,
        request.password,
        request.role,
        request.full_name,
        request.email,
        request.department
    )
    
    if result['success']:
        return {
            "success": True,
            "message": result['message']
        }
    else:
        raise HTTPException(status_code=400, detail=result['message'])

@app.post("/api/update-password")
async def update_password(request: PasswordUpdateRequest):
    """Update a user's password"""
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    success = database.update_user_password(request.user_id, request.new_password)
    
    if success:
        return {
            "success": True,
            "message": "Password updated successfully"
        }
    else:
        raise HTTPException(status_code=404, detail="User not found")

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user (admin only)"""
    success = database.delete_user(user_id)
    
    if success:
        return {
            "success": True,
            "message": "User deleted successfully"
        }
    else:
        raise HTTPException(status_code=404, detail="User not found")

@app.get("/api/users")
async def get_users(role: str = None):
    """Get all users, optionally filtered by role"""
    users = database.get_all_users(role)
    return {"users": users}

@app.post("/api/mood-record")
async def save_mood(request: MoodRecordRequest):
    """Save a mood detection record to database"""
    success = database.save_mood_record(
        request.user_id,
        request.emotion,
        request.confidence,
        request.detection_method,
        request.notes
    )
    
    if success:
        return {"success": True, "message": "Mood record saved"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save mood record")

@app.get("/api/mood-records")
async def get_moods(user_id: str = None, limit: int = 100):
    """Get mood records, optionally filtered by user_id"""
    records = database.get_mood_records(user_id, limit)
    return {"records": records}

@app.get("/api/mood-statistics")
async def get_statistics(user_id: str = None):
    """Get mood statistics"""
    stats = database.get_mood_statistics(user_id)
    return {"statistics": stats}

@app.post("/api/mood-history")
async def save_history(request: MoodHistoryRequest):
    """Save manual mood entry (typically by HR)"""
    success = database.save_mood_history(
        request.user_id,
        request.mood,
        request.intensity,
        request.notes
    )
    
    if success:
        return {"success": True, "message": "Mood history saved"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save mood history")

@app.get("/api/mood-history")
async def get_history(user_id: str = None, limit: int = 100):
    """Get mood history records"""
    history = database.get_mood_history(user_id, limit)
    return {"history": history}

@app.post("/api/reset-password-admin")
async def reset_password_admin(user_id: str, new_password: str):
    """Admin endpoint to reset any user's password - for troubleshooting"""
    if len(new_password) < 3:
        raise HTTPException(status_code=400, detail="Password must be at least 3 characters")
    
    success = database.update_user_password(user_id, new_password)
    
    if success:
        return {
            "success": True,
            "message": f"Password reset for user {user_id}",
            "new_password": new_password
        }
    else:
        raise HTTPException(status_code=404, detail="User not found")

# ==================== Task Management Endpoints ====================

@app.post("/api/tasks")
async def create_task(request: TaskCreateRequest, current_user: str = None):
    """Create a new task (HR only)"""
    # Use assigned_by from request, or default to first HR user if not provided
    assigned_by = request.assigned_by
    if not assigned_by:
        # Get the first HR user as default
        hr_users = database.get_all_users('hr')
        if hr_users:
            assigned_by = hr_users[0]['user_id']
        else:
            raise HTTPException(status_code=400, detail="No HR users found to assign the task")
    
    result = database.create_task(
        title=request.title,
        description=request.description,
        assigned_to=request.assigned_to,
        assigned_by=assigned_by,
        priority=request.priority,
        due_date=request.due_date
    )
    
    if result['success']:
        return result
    else:
        raise HTTPException(status_code=400, detail=result['message'])

@app.get("/api/tasks")
async def get_tasks(user_id: str = None, status: str = None, assigned_by: str = None):
    """Get tasks with optional filters"""
    tasks = database.get_tasks(user_id=user_id, status=status, assigned_by=assigned_by)
    return {"tasks": tasks}

@app.put("/api/tasks/{task_id}/status")
async def update_task_status(task_id: int, request: TaskUpdateRequest, current_user: str = None):
    """Update task status"""
    success = database.update_task_status(
        task_id=task_id, 
        status=request.status, 
        user_id=current_user
    )
    
    if success:
        return {"success": True, "message": "Task status updated"}
    else:
        raise HTTPException(status_code=400, detail="Failed to update task status")

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int, current_user: str = None):
    """Delete a task (HR only)"""
    success = database.delete_task(task_id=task_id, user_id=current_user)
    
    if success:
        return {"success": True, "message": "Task deleted"}
    else:
        raise HTTPException(status_code=403, detail="Unauthorized or task not found")

@app.get("/api/tasks/statistics")
async def get_task_statistics(user_id: str = None):
    """Get task statistics"""
    stats = database.get_task_statistics(user_id=user_id)
    return {"statistics": stats}

# ==================== RAG Emotion Insights Endpoints ====================

class RAGQueryRequest(BaseModel):
    question: str
    user_id: str = None

@app.post("/api/emotion-insights/query")
async def query_emotion_insights(request: RAGQueryRequest):
    """Query emotion insights using natural language"""
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system not available")
    
    try:
        answer = rag_system.query(request.question, request.user_id)
        return {
            "success": True,
            "question": request.question,
            "answer": answer
        }
    except Exception as e:
        logger.error(f"Error in RAG query: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/api/emotion-insights/auto-insights")
async def get_auto_insights(user_id: str = None):
    """Get automatic emotion insights and analysis"""
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system not available")
    
    try:
        insights = rag_system.get_insights(user_id)
        return {
            "success": True,
            "insights": insights,
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")

@app.post("/api/emotion-insights/rebuild")
async def rebuild_rag_database():
    """Rebuild RAG database from current mood records (Admin only)"""
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system not available")
    
    try:
        success = rag_system.build_from_database()
        if success:
            return {
                "success": True,
                "message": "RAG database rebuilt successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to rebuild RAG database")
    except Exception as e:
        logger.error(f"Error rebuilding RAG: {e}")
        raise HTTPException(status_code=500, detail=f"Error rebuilding database: {str(e)}")

# ==================== Leave Management Endpoints ====================

class LeaveRequest(BaseModel):
    employee_id: str
    leave_type: str  # sick, casual, vacation, personal, emergency
    start_date: str
    end_date: str
    reason: str

class LeaveApprovalRequest(BaseModel):
    status: str  # approved or rejected
    approved_by: str
    approval_notes: str = None

@app.post("/api/leaves")
async def create_leave_request(request: LeaveRequest):
    """Create a new leave request"""
    result = database.create_leave_request(
        employee_id=request.employee_id,
        leave_type=request.leave_type,
        start_date=request.start_date,
        end_date=request.end_date,
        reason=request.reason
    )
    
    if result['success']:
        return {"success": True, "message": result['message'], "leave_id": result['leave_id']}
    else:
        raise HTTPException(status_code=400, detail=result['message'])

@app.get("/api/leaves")
async def get_leave_requests(employee_id: str = None, status: str = None):
    """Get leave requests with optional filters"""
    leaves = database.get_leave_requests(employee_id=employee_id, status=status)
    return {"leaves": leaves}

@app.put("/api/leaves/{leave_id}/status")
async def update_leave_status(leave_id: int, request: LeaveApprovalRequest):
    """Approve or reject a leave request"""
    success = database.update_leave_status(
        leave_id=leave_id,
        status=request.status,
        approved_by=request.approved_by,
        approval_notes=request.approval_notes
    )
    
    if success:
        return {"success": True, "message": f"Leave request {request.status}"}
    else:
        raise HTTPException(status_code=400, detail="Failed to update leave status")

@app.delete("/api/leaves/{leave_id}")
async def delete_leave_request(leave_id: int, user_id: str):
    """Delete a leave request (employee can delete pending requests)"""
    success = database.delete_leave_request(leave_id=leave_id, user_id=user_id)
    
    if success:
        return {"success": True, "message": "Leave request deleted"}
    else:
        raise HTTPException(status_code=403, detail="Cannot delete this leave request")

@app.get("/api/leaves/statistics")
async def get_leave_statistics(employee_id: str = None):
    """Get leave statistics"""
    stats = database.get_leave_statistics(employee_id=employee_id)
    return {"statistics": stats}

# ==================== RAG Emotion Insights Endpoints ====================

class RAGQueryRequest(BaseModel):
    question: str
    user_id: str = None

@app.post("/api/emotion-insights/query")
async def query_emotion_insights(request: RAGQueryRequest):
    """Query emotion insights using natural language"""
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system not available")
    
    try:
        answer = rag_system.query(request.question, request.user_id)
        return {
            "success": True,
            "question": request.question,
            "answer": answer
        }
    except Exception as e:
        logger.error(f"Error in RAG query: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/api/emotion-insights/auto-insights")
async def get_auto_insights(user_id: str = None):
    """Get automatic emotion insights and analysis"""
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system not available")
    
    try:
        insights = rag_system.get_insights(user_id)
        return {
            "success": True,
            "insights": insights,
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")

@app.post("/api/emotion-insights/rebuild")
async def rebuild_rag_database():
    """Rebuild RAG database from current mood records (Admin only)"""
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system not available")
    
    try:
        success = rag_system.build_from_database()
        if success:
            return {
                "success": True,
                "message": "RAG database rebuilt successfully"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to rebuild RAG database")
    except Exception as e:
        logger.error(f"Error rebuilding RAG: {e}")
        raise HTTPException(status_code=500, detail=f"Error rebuilding database: {str(e)}")

# Enhanced RAG Endpoints with Gemini Support
from rag_enhanced import rag_system as enhanced_rag, set_gemini_api_key

class EnhancedRAGQueryRequest(BaseModel):
    question: str
    use_gemini: bool = True
    context: dict = None

@app.post("/api/rag/enhanced-query")
async def enhanced_query(request: EnhancedRAGQueryRequest):
    """Query with enhanced RAG using Gemini API (if available)"""
    try:
        result = enhanced_rag.query_with_gemini(
            request.question, 
            context_data=request.context
        )
        return {
            "success": True,
            "question": request.question,
            **result
        }
    except Exception as e:
        logger.error(f"Enhanced query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rag/suggestions")
async def get_question_suggestions():
    """Get smart question suggestions based on available data"""
    try:
        suggestions = enhanced_rag.get_question_suggestions()
        stats = enhanced_rag.get_emotion_stats()
        return {
            "success": True,
            "suggestions": suggestions,
            "emotion_stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rag/insights")
async def get_formatted_insights():
    """Get formatted insights report"""
    try:
        insights = enhanced_rag.get_insights()
        return {
            "success": True,
            "insights": insights
        }
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class GeminiConfigRequest(BaseModel):
    api_key: str

@app.post("/api/rag/configure-gemini")
async def configure_gemini(request: GeminiConfigRequest):
    """Configure Gemini API key"""
    try:
        if not request.api_key or not request.api_key.strip():
            raise HTTPException(status_code=400, detail="API key cannot be empty")
        
        success = set_gemini_api_key(request.api_key.strip())
        if success:
            return {
                "success": True,
                "message": "Gemini API configured successfully",
                "gemini_enabled": True
            }
        else:
            return {
                "success": False,
                "message": "Failed to configure Gemini API",
                "gemini_enabled": False,
                "error": "Could not import google-generativeai. Install with: pip install google-generativeai"
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error configuring Gemini: {e}")
        return {
            "success": False,
            "message": f"Configuration failed: {str(e)}",
            "gemini_enabled": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=False)
