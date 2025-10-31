import React, { useState } from 'react';
import { MoodOption } from '../types/mood';
import './MoodSelector.css';

const moodOptions: MoodOption[] = [
  { value: 'happy', label: 'Happy', emoji: '😊', color: '#4CAF50' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#9E9E9E' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: '#2196F3' },
  { value: 'angry', label: 'Angry', emoji: '😠', color: '#F44336' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: '#FF9800' },
  { value: 'excited', label: 'Excited', emoji: '🤩', color: '#FFD700' },
];

interface MoodSelectorProps {
  onMoodSubmit: (mood: string, intensity: number, notes: string) => void;
  userId: string;
  userRole: string;
  onLogout: () => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ onMoodSubmit, userId, userRole, onLogout }) => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMood) {
      onMoodSubmit(selectedMood, intensity, notes);
      setSubmitted(true);
      setTimeout(() => {
        setSelectedMood('');
        setIntensity(5);
        setNotes('');
        setSubmitted(false);
      }, 2000);
    }
  };

  const selectedMoodOption = moodOptions.find(m => m.value === selectedMood);

  return (
    <div className="mood-selector-container">
      <div className="mood-selector-card">
        <div className="header-section">
          <div>
            <h1 className="title">How are you feeling today?</h1>
            <p className="subtitle">Your wellbeing matters. Share your mood with us.</p>
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

        <form onSubmit={handleSubmit} className="mood-form">
          <div className="mood-grid">
            {moodOptions.map((mood) => (
              <button
                key={mood.value}
                type="button"
                className={`mood-button ${selectedMood === mood.value ? 'selected' : ''}`}
                onClick={() => setSelectedMood(mood.value)}
                style={{
                  borderColor: selectedMood === mood.value ? mood.color : '#e0e0e0',
                  backgroundColor: selectedMood === mood.value ? `${mood.color}15` : 'white',
                }}
              >
                <div className="mood-emoji">{mood.emoji}</div>
                <div className="mood-label">{mood.label}</div>
              </button>
            ))}
          </div>

          {selectedMood && (
            <div className="intensity-section">
              <label className="intensity-label">
                Intensity: <strong>{intensity}/10</strong>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="intensity-slider"
                style={{
                  background: `linear-gradient(to right, ${selectedMoodOption?.color} 0%, ${selectedMoodOption?.color} ${intensity * 10}%, #e0e0e0 ${intensity * 10}%, #e0e0e0 100%)`
                }}
              />
            </div>
          )}

          {selectedMood && (
            <div className="notes-section">
              <label className="notes-label">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell us more about how you're feeling..."
                className="notes-textarea"
                rows={4}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedMood || submitted}
            className="submit-button"
            style={{
              backgroundColor: selectedMoodOption?.color || '#6200EA',
              opacity: !selectedMood || submitted ? 0.5 : 1,
            }}
          >
            {submitted ? '✓ Submitted!' : 'Submit Mood'}
          </button>
        </form>

        {submitted && (
          <div className="success-message">
            Thank you for sharing! Your mood has been recorded.
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodSelector;
