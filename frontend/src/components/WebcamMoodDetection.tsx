import React, { useState, useRef, useEffect } from 'react';
import './WebcamMoodDetection.css';

interface WebcamMoodDetectionProps {
  userId: string;
  userRole: string;
  onLogout: () => void;
  onMoodDetected: (mood: string, confidence: number) => void;
}

const WebcamMoodDetection: React.FC<WebcamMoodDetectionProps> = ({ 
  userId, 
  userRole, 
  onLogout,
  onMoodDetected 
}) => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detectedMood, setDetectedMood] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop webcam when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Clear detection interval
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsWebcamActive(true);
        
        // Wait for video to be ready and play it
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('Camera started successfully');
                // Start continuous detection after 1 second delay
                setTimeout(() => {
                  startContinuousDetection();
                }, 1000);
              })
              .catch((err) => {
                console.error('Error playing video:', err);
                setError('Unable to play video stream');
              });
          }
        };
      }
    } catch (err) {
      setError('Unable to access webcam. Please ensure you have granted camera permissions.');
      console.error('Error accessing webcam:', err);
    }
  };

  const stopWebcam = () => {
    // Stop continuous detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setIsDetecting(false);
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;

    try {
      // Create a canvas to capture the current video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Draw the current video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to base64 image
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error('Error capturing frame:', err);
      return null;
    }
  };

  const startContinuousDetection = () => {
    // Start detecting emotion every 3 seconds
    setIsDetecting(true);
    
    // Run first detection immediately
    detectMoodContinuously();
    
    // Then run every 3 seconds
    detectionIntervalRef.current = window.setInterval(() => {
      detectMoodContinuously();
    }, 3000); // Detect every 3 seconds
  };

  const detectMoodContinuously = async () => {
    if (!isWebcamActive || !videoRef.current) return;

    try {
      // Capture current video frame
      const frameData = captureFrame();
      
      if (!frameData) {
        console.log('Failed to capture frame');
        return;
      }

      // Send frame to backend API with user_id
      const response = await fetch('http://localhost:8000/api/detect-emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: frameData,
          user_id: userId  // Send user_id to save to database
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.emotion === 'No Face Detected') {
        setError('No face detected. Please position your face in the camera view.');
        return;
      }

      // Clear any previous errors
      setError('');
      setDetectedMood(data.emotion);
      setConfidence(data.confidence);
      onMoodDetected(data.emotion, data.confidence);
      
      console.log('Emotion detected:', data.emotion, `(${data.confidence}%)`);

    } catch (err) {
      console.error('Error detecting emotion:', err);
      setError('Detection failed. Please ensure the backend server is running.');
    }
  };

  const getMoodEmoji = (mood: string) => {
    const emojiMap: { [key: string]: string } = {
      'Happy': '😊',
      'Sad': '😢',
      'Neutral': '😐',
      'Angry': '😠',
      'Surprised': '😮',
      'Anxious': '😰',
      'Fear': '😨',
      'Disgust': '🤢'
    };
    return emojiMap[mood] || '😐';
  };

  const getMoodColor = (mood: string) => {
    const colorMap: { [key: string]: string } = {
      'Happy': '#4CAF50',
      'Sad': '#2196F3',
      'Neutral': '#9E9E9E',
      'Angry': '#F44336',
      'Surprised': '#FFD700',
      'Anxious': '#FF9800',
      'Fear': '#9C27B0',
      'Disgust': '#795548'
    };
    return colorMap[mood] || '#9E9E9E';
  };

  return (
    <div className="webcam-detection-container">
      <div className="webcam-detection-card">
        <div className="header-section">
          <div>
            <h1 className="title">AI Mood Detection</h1>
            <p className="subtitle">Let our AI detect your current mood through facial recognition</p>
          </div>
          <div className="user-info">
            <div className="user-details">
              <span className="user-id">👤 {userId}</span>
              <span className="user-role">
                {userRole === 'hr' ? '👔 HR Manager' : '👤 Employee'}
              </span>
            </div>
            <button onClick={onLogout} className="logout-button" type="button">
              Logout
            </button>
          </div>
        </div>

        <div className="webcam-section">
          <div className="video-container">
            {!isWebcamActive ? (
              <div className="webcam-placeholder">
                <div className="camera-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 7L16 12L23 17V7Z" fill="currentColor" opacity="0.3"/>
                    <path d="M3 5H16C16.5523 5 17 5.44772 17 6V18C17 18.5523 16.5523 19 16 19H3C2.44772 19 2 18.5523 2 18V6C2 5.44772 2.44772 5 3 5Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <p>Camera is off</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  muted
                  className="webcam-video"
                />
                {isDetecting && (
                  <div className="detecting-overlay">
                    <div className="scanner-line"></div>
                    <p>Analyzing facial expressions...</p>
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8.8 12H7.2V10.4H8.8V12ZM8.8 8.8H7.2V4H8.8V8.8Z" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <div className="controls">
            {!isWebcamActive ? (
              <button onClick={startWebcam} className="primary-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M23 7L16 12L23 17V7Z" fill="currentColor"/>
                  <path d="M3 5H16V19H3V5Z" fill="currentColor"/>
                </svg>
                Start Camera & Detect
              </button>
            ) : (
              <div className="active-controls">
                <div className="detection-status">
                  {isDetecting && (
                    <>
                      <span className="status-indicator"></span>
                      <span>🔄 Continuous detection active...</span>
                    </>
                  )}
                </div>
                <button onClick={stopWebcam} className="secondary-button">
                  Stop Camera
                </button>
              </div>
            )}
          </div>
        </div>

        {detectedMood && (
          <div className="result-section" style={{ borderColor: getMoodColor(detectedMood) }}>
            <div className="result-header">
              <span className="result-emoji">{getMoodEmoji(detectedMood)}</span>
              <h3 style={{ color: getMoodColor(detectedMood) }}>Detected Mood: {detectedMood}</h3>
            </div>
            <div className="confidence-bar">
              <div className="confidence-label">Confidence: {confidence}%</div>
              <div className="confidence-track">
                <div 
                  className="confidence-fill" 
                  style={{ 
                    width: `${confidence}%`,
                    backgroundColor: getMoodColor(detectedMood)
                  }}
                ></div>
              </div>
            </div>
            <div className="result-timestamp">
              Detected at: {new Date().toLocaleString()}
            </div>
          </div>
        )}

        <div className="info-section">
          <h3>📸 How it works:</h3>
          <ul>
            <li>Click "Start Camera & Detect" to enable your webcam</li>
            <li>Position your face in the camera view</li>
            <li>AI will automatically analyze your facial expression every 3 seconds</li>
            <li>Your mood will be continuously detected and updated in real-time</li>
            <li>Click "Stop Camera" when you're done</li>
          </ul>
          <p className="privacy-note">
            🔒 <strong>Privacy:</strong> Your camera feed is processed locally and not stored anywhere.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebcamMoodDetection;
