export interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  timestamp: Date;
  notes?: string;
  detectedEmotion?: string;
}

export interface MoodOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
}
