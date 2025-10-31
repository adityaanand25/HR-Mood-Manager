"""
FastAPI Backend for HR Mood Manager
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HR Mood Manager API", version="1.0.0")

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

def load_emotion_model():
    """Load the trained emotion detection model"""
    global model, face_cascade
    try:
        logger.info("Loading emotion detection model...")
        model = load_model('emotion_detection_model.h5')
        logger.info("✓ Model loaded successfully!")
        
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
    load_emotion_model()
    database.init_database()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "HR Mood Manager API",
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
            raise HTTPException(status_code=503, detail="Model not loaded")
        
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
                    "message": "No face detected in the image. Please ensure your face is visible and well-lit.",
                    "all_predictions": {}
                }
            )
        
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
        
        logger.info(f"Detected emotion: {emotion} with {confidence:.2f}% confidence")
        
        # Save to database if user_id is provided
        if user_id and emotion != "No Face Detected":
            database.save_mood_record(
                user_id=user_id,
                emotion=emotion,
                confidence=confidence,
                detection_method='webcam',
                notes=f"Auto-detected with {confidence:.2f}% confidence"
            )
            logger.info(f"Saved mood record for user: {user_id}")
        
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
            "saved_to_db": user_id is not None
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

@app.post("/api/login")
async def login(request: LoginRequest):
    """Authenticate user and return user details"""
    user = database.authenticate_user(request.user_id, request.password)
    
    if user:
        return {
            "success": True,
            "user": user,
            "message": "Login successful"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=False)
