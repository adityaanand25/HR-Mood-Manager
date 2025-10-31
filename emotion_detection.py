"""
Face Emotion Detection - Real-time Application
Run this in VS Code after training your model in Google Colab
"""

import cv2
import numpy as np
from tensorflow.keras.models import load_model
import os

class EmotionDetector:
    def __init__(self, model_path='emotion_detection_model.h5'):
        """Initialize the emotion detector with trained model"""
        # Load the trained model
        print("Loading model...")
        self.model = load_model(model_path)
        print("✓ Model loaded successfully!")
        
        # Load face cascade classifier
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Emotion labels
        self.emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 
                               'Neutral', 'Sad', 'Surprise']
        
        # Colors for each emotion (BGR format)
        self.emotion_colors = {
            'Angry': (0, 0, 255),      # Red
            'Disgust': (0, 255, 0),    # Green
            'Fear': (128, 0, 128),     # Purple
            'Happy': (0, 255, 255),    # Yellow
            'Neutral': (255, 255, 255),# White
            'Sad': (255, 0, 0),        # Blue
            'Surprise': (255, 165, 0)  # Orange
        }
    
    def preprocess_face(self, face_img):
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
    
    def predict_emotion(self, face_img):
        """Predict emotion from face image"""
        preprocessed = self.preprocess_face(face_img)
        predictions = self.model.predict(preprocessed, verbose=0)
        emotion_idx = np.argmax(predictions[0])
        confidence = predictions[0][emotion_idx]
        return self.emotion_labels[emotion_idx], confidence
    
    def detect_from_webcam(self):
        """Real-time emotion detection from webcam"""
        print("\n=== Starting Webcam Emotion Detection ===")
        print("Press 'q' to quit\n")
        
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("Error: Cannot access webcam!")
            return
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            
            # Process each face
            for (x, y, w, h) in faces:
                # Extract face ROI
                face_roi = gray[y:y+h, x:x+w]
                
                # Predict emotion
                emotion, confidence = self.predict_emotion(face_roi)
                
                # Get color for emotion
                color = self.emotion_colors.get(emotion, (255, 255, 255))
                
                # Draw rectangle around face
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                
                # Display emotion and confidence
                text = f"{emotion}: {confidence*100:.1f}%"
                cv2.putText(frame, text, (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
            
            # Show frame
            cv2.imshow('Emotion Detection - Press Q to quit', frame)
            
            # Exit on 'q' press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print("\n✓ Webcam detection stopped")
    
    def detect_from_image(self, image_path):
        """Detect emotions from a static image"""
        if not os.path.exists(image_path):
            print(f"Error: Image not found at {image_path}")
            return
        
        # Read image
        frame = cv2.imread(image_path)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        print(f"\n✓ Found {len(faces)} face(s)")
        
        # Process each face
        for idx, (x, y, w, h) in enumerate(faces):
            face_roi = gray[y:y+h, x:x+w]
            emotion, confidence = self.predict_emotion(face_roi)
            
            print(f"Face {idx+1}: {emotion} ({confidence*100:.1f}% confidence)")
            
            color = self.emotion_colors.get(emotion, (255, 255, 255))
            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            
            text = f"{emotion}: {confidence*100:.1f}%"
            cv2.putText(frame, text, (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        
        # Display result
        cv2.imshow('Emotion Detection - Press any key to close', frame)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    def detect_from_video(self, video_path):
        """Detect emotions from a video file"""
        if not os.path.exists(video_path):
            print(f"Error: Video not found at {video_path}")
            return
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            print("Error: Cannot open video file!")
            return
        
        print("\n=== Processing Video ===")
        print("Press 'q' to quit\n")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            
            for (x, y, w, h) in faces:
                face_roi = gray[y:y+h, x:x+w]
                emotion, confidence = self.predict_emotion(face_roi)
                
                color = self.emotion_colors.get(emotion, (255, 255, 255))
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                
                text = f"{emotion}: {confidence*100:.1f}%"
                cv2.putText(frame, text, (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
            
            cv2.imshow('Video Emotion Detection - Press Q to quit', frame)
            
            if cv2.waitKey(25) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print("\n✓ Video processing complete")


def main():
    """Main function to run emotion detection"""
    print("=" * 50)
    print("   FACE EMOTION DETECTION SYSTEM")
    print("=" * 50)
    
    # Initialize detector
    detector = EmotionDetector('emotion_detection_model.h5')
    
    # Menu
    while True:
        print("\nChoose an option:")
        print("1. Real-time Webcam Detection")
        print("2. Detect from Image")
        print("3. Detect from Video")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            detector.detect_from_webcam()
        
        elif choice == '2':
            image_path = input("Enter image path: ").strip()
            detector.detect_from_image(image_path)
        
        elif choice == '3':
            video_path = input("Enter video path: ").strip()
            detector.detect_from_video(video_path)
        
        elif choice == '4':
            print("\nThank you for using Emotion Detection System!")
            break
        
        else:
            print("Invalid choice! Please try again.")


if __name__ == "__main__":
    main()