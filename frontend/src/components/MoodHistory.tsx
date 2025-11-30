'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { moodApi, MoodRecord } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { Clock, User, Target, TrendingUp } from 'lucide-react';

export const MoodHistory: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MoodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMoodRecords();
  }, [user]);

  const fetchMoodRecords = async () => {
    try {
      setIsLoading(true);
      const response = await moodApi.getMoodRecords(
        user?.role === 'hr' ? undefined : user?.user_id,
        50
      );
      setRecords(response.records || []);
    } catch (err) {
      setError('Failed to fetch mood records');
      console.error('Error fetching mood records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionColor = (emotion: string): string => {
    const colors = {
      'Happy': 'bg-green-500/20 text-green-300 border-green-400/30',
      'Sad': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      'Angry': 'bg-red-500/20 text-red-300 border-red-400/30',
      'Fear': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      'Surprise': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      'Disgust': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
      'Neutral': 'bg-slate-500/20 text-slate-300 border-slate-400/30'
    };
    return colors[emotion as keyof typeof colors] || 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  };

  if (isLoading) {
    return (
      <Card className="glass-purple">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-slate-200">Loading mood records...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-purple border-red-500/30">
        <CardContent className="p-6">
          <div className="text-center text-red-400 flex items-center justify-center gap-2">
            <span className="text-2xl">⚠️</span>
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">
          {user?.role === 'hr' ? 'All Mood Records' : 'Your Mood History'}
        </h2>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white/5 backdrop-blur-xl rounded-xl p-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg mb-2">No mood records found</p>
          <p className="text-sm">Start capturing emotions to see your history here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <Badge className={`${getEmotionColor(record.emotion)} backdrop-blur-sm border`}>
                  {record.emotion}
                </Badge>
                
                <div className="space-y-1">
                  {user?.role === 'hr' && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{record.full_name}</span>
                      <span className="text-slate-500">({record.user_id})</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true })}
                  </div>
                  
                  {record.notes && (
                    <div className="text-sm text-slate-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                      💭 {record.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-slate-300 bg-white/10 px-3 py-2 rounded-lg">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="font-semibold">{record.confidence.toFixed(1)}%</span>
                </div>
                <div className="text-xs text-slate-500 mt-2 px-2 py-1 bg-white/5 rounded-md">
                  {record.detection_method}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};