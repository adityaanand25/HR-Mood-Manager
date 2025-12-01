'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi, historyApi, User, MoodHistoryEntry, MoodHistoryRequest } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserPlus, Save, RefreshCw, Users, Brain } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MOOD_OPTIONS = [
  'Excellent', 'Good', 'Average', 'Poor', 'Terrible',
  'Energetic', 'Calm', 'Stressed', 'Anxious', 'Focused',
  'Motivated', 'Overwhelmed', 'Content', 'Frustrated'
];

export const HRPanel: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<User[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MoodHistoryRequest>({
    user_id: '',
    mood: '',
    intensity: 5,
    notes: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.role === 'hr') {
      fetchEmployees();
      fetchMoodHistory();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const response = await authApi.getUsers('employee');
      setEmployees(response.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchMoodHistory = async () => {
    try {
      const response = await historyApi.getMoodHistory(undefined, 20);
      setMoodHistory(response.history || []);
    } catch (error) {
      console.error('Error fetching mood history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.mood) {
      setMessage({ type: 'error', text: 'Please select an employee and mood' });
      return;
    }

    setIsLoading(true);
    try {
      await historyApi.saveMoodHistory(formData);
      setMessage({ type: 'success', text: 'Mood entry saved successfully' });
      setFormData({
        user_id: '',
        mood: '',
        intensity: 5,
        notes: ''
      });
      fetchMoodHistory(); // Refresh the history
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save mood entry' });
      console.error('Error saving mood entry:', error);
    } finally {
      setIsLoading(false);
    }

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  if (user?.role !== 'hr') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6">
            <span className="text-3xl text-white">🚫</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Access Restricted</h2>
          <p className="text-lg text-red-300">HR administrator privileges required to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Professional Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 animate-float">
          <Users className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          HR <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Control Panel</span>
        </h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Manage employee wellness data, track mood trends, and oversee organizational mental health initiatives.
        </p>
      </div>
      {/* Professional Mood Entry Form */}
      <Card className="glass-purple p-8 hover-lift shadow-2xl border-2 border-white/20">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Manual Mood Entry</h3>
            <p className="text-sm text-slate-400">Add mood data for employees</p>
          </div>
        </div>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee
                </label>
                <select
                  id="employee"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((employee) => (
                    <option key={employee.user_id} value={employee.user_id}>
                      {employee.full_name} ({employee.user_id}) - {employee.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1">
                  Mood
                </label>
                <select
                  id="mood"
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select mood...</option>
                  {MOOD_OPTIONS.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="intensity" className="block text-sm font-medium text-gray-700 mb-1">
                Intensity: {formData.intensity}/10
              </label>
              <input
                type="range"
                id="intensity"
                min="1"
                max="10"
                value={formData.intensity}
                onChange={(e) => setFormData({ ...formData, intensity: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (1)</span>
                <span>High (10)</span>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional observations or context..."
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Mood Entry'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={fetchMoodHistory}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Mood History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Recent Manual Entries</h3>
        </CardHeader>
        <CardContent>
          {moodHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No manual mood entries yet
            </div>
          ) : (
            <div className="space-y-3">
              {moodHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {entry.mood}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {entry.full_name} ({entry.user_id})
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.department}
                      </div>
                      {entry.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      Intensity: {entry.intensity}/10
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights Access */}
      <Card className="glass-purple p-8 hover-lift shadow-2xl border-2 border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">AI Insights & Analytics</h3>
              <p className="text-sm text-slate-400">Get AI-powered analysis of employee emotions and trends</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/insights')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg transition-all"
          >
            <Brain className="h-4 w-4" />
            Open AI Insights
          </Button>
        </div>
      </Card>
    </div>
  );
};