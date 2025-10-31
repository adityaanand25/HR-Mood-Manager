# HR Mood Manager - Complete Setup Guide

AI-powered mood tracking system with webcam emotion detection for employees and manual mood entry for HR managers.

## 🎯 Features

- **Employee Mode**: AI-powered webcam emotion detection using trained TensorFlow model
- **HR Manager Mode**: Manual mood selection interface
- **Real-time Detection**: Analyzes facial expressions in real-time
- **Beautiful UI**: Modern React + TypeScript frontend with responsive design
- **Secure**: Role-based access with login authentication

## 📋 Prerequisites

- Python 3.11+ (Python 3.12 not fully supported by TensorFlow)
- Node.js 16+ and npm
- Webcam for emotion detection
- Windows/Mac/Linux

## 🚀 Quick Start

### Backend Setup (Python + FastAPI)

1. **Activate the Python 3.11 virtual environment:**
   ```powershell
   .venv311\Scripts\activate
   ```

2. **Install backend dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Start the FastAPI server:**
   ```powershell
   python start_backend.ps1
   ```
   
   Or manually:
   ```powershell
   python api_server.py
   ```

   The API will be available at:
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs

### Frontend Setup (React + TypeScript)

1. **Navigate to frontend directory:**
   ```powershell
   cd frontend
   ```

2. **Install frontend dependencies (if not already done):**
   ```powershell
   npm install
   ```

3. **Start the development server:**
   ```powershell
   npm run dev
   ```

   The frontend will be available at: http://localhost:5173

## 📁 Project Structure

```
HR Mood Manager/
├── api_server.py              # FastAPI backend server
├── emotion_detection.py       # Original standalone emotion detection
├── emotion_detection_model.h5 # Trained TensorFlow model
├── requirements.txt           # Python dependencies
├── start_backend.ps1          # Backend startup script
├── start_backend.bat          # Backend startup script (Windows)
├── .venv311/                  # Python 3.11 virtual environment
└── frontend/                  # React + TypeScript frontend
    ├── src/
    │   ├── components/
    │   │   ├── Login.tsx              # Login page with role selection
    │   │   ├── MoodSelector.tsx       # Manual mood selection (HR)
    │   │   ├── WebcamMoodDetection.tsx # Webcam AI detection (Employee)
    │   │   └── *.css                  # Component styles
    │   ├── App.tsx                    # Main app component
    │   └── main.tsx                   # App entry point
    ├── package.json
    └── vite.config.ts
```

## 🎭 How to Use

### For Employees:

1. Open http://localhost:5173
2. Login with any User ID and password (min 6 characters)
3. Select **"Employee"** role
4. Click **"Start Camera"** to enable webcam
5. Position your face in the camera view
6. Click **"Detect Mood"** to analyze your emotion
7. View detected mood with confidence score
8. Your mood is automatically logged

### For HR Managers:

1. Open http://localhost:5173
2. Login with any User ID and password
3. Select **"HR Manager"** role
4. Manually select mood from available options
5. Adjust intensity slider
6. Add optional notes
7. Submit mood entry

## 🔧 API Endpoints

### POST /api/detect-emotion
Detect emotion from base64 encoded image

**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "emotion": "Happy",
  "confidence": 95.5,
  "all_predictions": {
    "Angry": 0.5,
    "Disgust": 0.2,
    "Fear": 1.3,
    "Happy": 95.5,
    "Neutral": 2.0,
    "Sad": 0.3,
    "Surprise": 0.2
  },
  "face_detected": true,
  "face_location": {
    "x": 100,
    "y": 120,
    "width": 200,
    "height": 200
  }
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "face_cascade_loaded": true
}
```

## 🎨 Supported Emotions

1. 😊 **Happy** - Green
2. 😢 **Sad** - Blue
3. 😐 **Neutral** - Gray
4. 😠 **Angry** - Red
5. 😮 **Surprise** - Gold
6. 😰 **Fear** - Purple
7. 🤢 **Disgust** - Brown

## 🔒 Security Notes

- Camera feed is processed locally and not stored
- All data is processed in real-time
- No video recording or storage
- Login required for access
- Role-based access control

## 🐛 Troubleshooting

### Backend Issues:

**"Model not loaded" error:**
- Ensure `emotion_detection_model.h5` is in the root directory
- Check that TensorFlow is properly installed

**"Port already in use" error:**
- Kill the process using port 8000 or change the port in `api_server.py`

**Camera permission denied:**
- Grant camera access in browser settings
- Check that no other application is using the webcam

### Frontend Issues:

**CORS errors:**
- Ensure backend is running on http://localhost:8000
- Check CORS configuration in `api_server.py`

**"No face detected" error:**
- Ensure good lighting conditions
- Position face clearly in camera view
- Check that face is not too close or too far

## 📦 Dependencies

### Backend (Python):
- fastapi - Web framework
- uvicorn - ASGI server
- tensorflow - Deep learning model
- opencv-python - Computer vision
- pillow - Image processing
- numpy - Numerical computing

### Frontend (React):
- react - UI library
- typescript - Type safety
- vite - Build tool
- Modern browser with webcam support

## 🎓 Model Information

The emotion detection model is a Convolutional Neural Network (CNN) trained on facial expression datasets. It:
- Accepts 48x48 grayscale images
- Detects 7 different emotions
- Provides confidence scores for each prediction
- Uses OpenCV's Haar Cascade for face detection

## 📝 License

This project is for educational and internal use.

## 👨‍💻 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at http://localhost:8000/docs
3. Check browser console for frontend errors
4. Review backend logs for API errors

---

Made with ❤️ for better workplace wellbeing
