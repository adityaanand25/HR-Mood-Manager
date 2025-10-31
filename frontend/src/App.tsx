import React, { useState } from 'react';
import Login from './components/Login';
import MoodSelector from './components/MoodSelector';
import WebcamMoodDetection from './components/WebcamMoodDetection';
import './App.css';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [moodHistory, setMoodHistory] = useState<Array<{
    mood: string;
    intensity: number;
    notes: string;
    timestamp: Date;
    userId: string;
  }>>([]);

  const handleLogin = (loggedInUserId: string, role: string) => {
    setUserId(loggedInUserId);
    setUserRole(role);
    setIsLoggedIn(true);
    console.log('User logged in:', loggedInUserId, 'Role:', role);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId('');
    setUserRole('');
    setMoodHistory([]);
  };

  const handleMoodSubmit = (mood: string, intensity: number, notes: string) => {
    const newEntry = {
      mood,
      intensity,
      notes,
      timestamp: new Date(),
      userId,
    };
    
    setMoodHistory([newEntry, ...moodHistory]);
    
    // Here you can send data to backend
    console.log('Mood submitted:', newEntry);
    
    // Optional: Send to backend API
    // fetch('/api/mood', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newEntry)
    // });
  };

  const handleMoodDetected = (mood: string, confidence: number) => {
    const newEntry = {
      mood,
      intensity: Math.round(confidence / 10), // Convert confidence to 1-10 scale
      notes: `AI detected with ${confidence}% confidence`,
      timestamp: new Date(),
      userId,
    };
    
    setMoodHistory([newEntry, ...moodHistory]);
    
    // Here you can send data to backend
    console.log('Mood detected:', newEntry);
    
    // Optional: Send to backend API
    // fetch('/api/mood', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newEntry)
    // });
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : userRole === 'employee' ? (
        <WebcamMoodDetection 
          userId={userId}
          userRole={userRole}
          onLogout={handleLogout}
          onMoodDetected={handleMoodDetected}
        />
      ) : (
        <MoodSelector 
          onMoodSubmit={handleMoodSubmit} 
          userId={userId}
          userRole={userRole}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
