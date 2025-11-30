'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { emotionApi, EmotionDetectionResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Camera, CameraOff, RefreshCw, Brain } from 'lucide-react';

interface EmotionCaptureProps {
  onEmotionDetected?: (emotion: EmotionDetectionResponse) => void;
  autoSave?: boolean;
}

const EmotionCapture: React.FC<EmotionCaptureProps> = ({
  onEmotionDetected,
  autoSave = false
}) => {
  const { user } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastEmotion, setLastEmotion] = useState<EmotionDetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Check backend connection on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
          setBackendStatus('connected');
          console.log('Backend server is running and healthy');
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        setBackendStatus('disconnected');
        console.error('Backend server is not available:', error);
      }
    };

    checkBackendHealth();
  }, []);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
    frameRate: { ideal: 30, min: 10 }
  };

  const captureEmotion = useCallback(async () => {
    if (!webcamRef.current || !isCameraOn) {
      setError('Webcam is not available. Please start the camera first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
        quality: 0.8
      });

      if (!imageSrc) {
        throw new Error('Failed to capture image from webcam');
      }

      console.log('Image captured successfully');
      console.log('Image data URL length:', imageSrc.length);

      // Remove the data URL prefix to get just the base64 data
      const base64Data = imageSrc.split(',')[1];
      
      if (!base64Data || base64Data.length < 100) {
        throw new Error('Invalid image data captured from webcam');
      }

      console.log('Sending emotion detection request...');
      console.log('Base64 data length:', base64Data.length);
      console.log('User ID:', user?.user_id);
      console.log('Auto-save enabled:', autoSave);

      const response = await emotionApi.detectEmotion({
        image: base64Data,
        user_id: autoSave ? user?.user_id : undefined
      });

      console.log('Emotion detection response:', response);

      if (response.emotion === 'No Face Detected') {
        setError('No face detected in the image. Please ensure your face is clearly visible and well-lit.');
      } else {
        setError(null); // Clear any previous errors
        console.log(`✅ Emotion detected: ${response.emotion} (${response.confidence}% confidence)`);
      }

      setLastEmotion(response);
      onEmotionDetected?.(response);

    } catch (err) {
      console.error('Detailed emotion detection error:', err);
      let errorMessage = 'Failed to detect emotion';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as any;
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        } else if (axiosError.response?.status) {
          errorMessage = `Server error: ${axiosError.response.status}`;
        } else if (axiosError.code === 'ECONNREFUSED') {
          errorMessage = 'Cannot connect to backend server. Please ensure the server is running on http://localhost:8000';
        }
      }

      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user?.user_id, autoSave, onEmotionDetected, isCameraOn]);

  const startCapturing = useCallback(() => {
    setIsCapturing(true);
    setIsCameraOn(true);
  }, []);

  const stopCapturing = useCallback(() => {
    setIsCapturing(false);
    setIsCameraOn(false);
    setLastEmotion(null);
  }, []);

  const getEmotionColor = (emotion: string): string => {
    const colors = {
      'Happy': 'bg-green-100 text-green-800 border-green-200',
      'Sad': 'bg-blue-100 text-blue-800 border-blue-200',
      'Angry': 'bg-red-100 text-red-800 border-red-200',
      'Fear': 'bg-purple-100 text-purple-800 border-purple-200',
      'Surprise': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Disgust': 'bg-orange-100 text-orange-800 border-orange-200',
      'Neutral': 'bg-gray-100 text-gray-800 border-gray-200',
      'No Face Detected': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[emotion as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <Card className="glass-purple p-6 hover-lift shadow-xl border border-white/20">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              Emotion Detection
            </h3>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                backendStatus === 'connected' 
                  ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                  : backendStatus === 'disconnected'
                  ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                  backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-purple-500 animate-pulse'
                }`}></div>
                {backendStatus === 'connected' ? 'Backend Connected' : 
                 backendStatus === 'disconnected' ? 'Backend Disconnected' : 'Checking...'}
              </div>
              <div className="flex gap-2">
                {!isCapturing ? (
                  <button 
                    onClick={startCapturing} 
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Camera className="h-4 w-4" />
                    Start Camera
                  </button>
                ) : (
                  <button 
                    onClick={stopCapturing} 
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium rounded-lg transition-all duration-300"
                  >
                    <CameraOff className="h-4 w-4" />
                    Stop Camera
                  </button>
                )}
              </div>
            </div>
          </div>

          {backendStatus === 'disconnected' && (
            <div className="p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg text-yellow-300 text-sm">
              ⚠️ Backend server is not available. Please ensure the server is running.
            </div>
          )}

          {isCapturing && isCameraOn && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border-2 border-white/30 bg-black/20">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.8}
                  videoConstraints={videoConstraints}
                  className="w-full max-w-lg mx-auto"
                  mirrored={true}
                />
                <div className="absolute top-2 left-2 bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
                <div className="absolute top-2 left-8 text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                  Live
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={captureEmotion}
                  disabled={isAnalyzing || backendStatus !== 'connected'}
                  className={`flex items-center gap-3 px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                    backendStatus !== 'connected' 
                      ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed' 
                      : isAnalyzing
                      ? 'bg-purple-600 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : backendStatus !== 'connected' ? (
                    'Backend Disconnected'
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Detect Emotion
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {lastEmotion && lastEmotion.emotion !== 'No Face Detected' && (
            <div className="p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-white/20 rounded-xl backdrop-blur-sm">
              <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className={`${getEmotionColor(lastEmotion.emotion)} text-lg px-4 py-2 font-semibold rounded-lg`}>
                    {lastEmotion.emotion}
                  </div>
                  <div className="text-white">
                    <span className="text-2xl font-bold">{lastEmotion.confidence.toFixed(1)}%</span>
                    <span className="text-sm text-slate-300 ml-2">confidence</span>
                  </div>
                </div>
                
                {lastEmotion.face_location && (
                  <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                    ✅ Face detected at position ({lastEmotion.face_location.x}, {lastEmotion.face_location.y})
                  </div>
                )}
                
                {lastEmotion.all_predictions && Object.keys(lastEmotion.all_predictions).length > 0 && (
                  <div className="mt-4 w-full">
                    <h5 className="text-sm font-medium mb-3 text-center">📊 All Emotion Predictions:</h5>
                    <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                      {Object.entries(lastEmotion.all_predictions)
                        .sort(([,a], [,b]) => b - a)
                        .map(([emotion, confidence]) => (
                          <div key={emotion} className="flex justify-between text-sm p-2 bg-white rounded border">
                            <span className="font-medium">{emotion}</span>
                            <span className={`font-bold ${confidence > 50 ? 'text-green-600' : 'text-gray-500'}`}>
                              {confidence.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {autoSave && lastEmotion.saved_to_db && (
                  <div className="text-sm text-green-600 font-medium flex items-center gap-2 justify-center">
                    💾 ✓ Automatically saved to your mood history
                  </div>
                )}
              </div>
            </div>
          )}

          {lastEmotion && lastEmotion.emotion === 'No Face Detected' && (
            <div className="p-4 bg-orange-500/20 border border-orange-400/30 rounded-lg">
              <div className="flex items-center gap-3 text-orange-300">
                <span className="text-xl">😕</span>
                <div>
                  <h4 className="font-medium">No Face Detected</h4>
                  <p className="text-sm text-orange-200">Please ensure your face is clearly visible and well-lit.</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
              <div className="flex items-center gap-3 text-red-300">
                <span className="text-xl">⚠️</span>
                <div>
                  <h5 className="font-medium">Error</h5>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EmotionCapture;