'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { moodApi } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Brain, Calendar } from 'lucide-react';

interface MoodStat {
  emotion: string;
  count: number;
  avg_confidence: number;
  last_detected: string;
}

export const MoodStatistics: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MoodStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [user]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await moodApi.getMoodStatistics(
        user?.role === 'hr' ? undefined : user?.user_id
      );
      setStats(response.statistics || []);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Error fetching statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const EMOTION_COLORS = {
    'Happy': '#10B981',
    'Sad': '#3B82F6', 
    'Angry': '#EF4444',
    'Fear': '#8B5CF6',
    'Surprise': '#F59E0B',
    'Disgust': '#F97316',
    'Neutral': '#6B7280'
  };

  const GRADIENT_COLORS = {
    'Happy': 'from-green-400 to-green-600',
    'Sad': 'from-blue-400 to-blue-600',
    'Angry': 'from-red-400 to-red-600', 
    'Fear': 'from-purple-400 to-purple-600',
    'Surprise': 'from-yellow-400 to-yellow-600',
    'Disgust': 'from-orange-400 to-orange-600',
    'Neutral': 'from-gray-400 to-gray-600'
  };

  const pieData = stats.map(stat => ({
    name: stat.emotion,
    value: stat.count,
    color: EMOTION_COLORS[stat.emotion as keyof typeof EMOTION_COLORS] || '#6B7280'
  }));

  const barData = stats.map(stat => ({
    emotion: stat.emotion,
    count: stat.count,
    confidence: Math.round(stat.avg_confidence),
    fill: EMOTION_COLORS[stat.emotion as keyof typeof EMOTION_COLORS] || '#6B7280'
  }));

  const totalDetections = stats.reduce((sum, stat) => sum + stat.count, 0);
  const avgConfidence = stats.length > 0 
    ? stats.reduce((sum, stat) => sum + stat.avg_confidence * stat.count, 0) / totalDetections 
    : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6">
            <span className="text-3xl text-white">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Statistics Error</h2>
          <p className="text-lg text-red-300">{error}</p>
        </div>
        
        <Card className="glass-purple border-red-500/30 p-8">
          <div className="text-center">
            <button 
              onClick={fetchStatistics}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Retry Loading Statistics
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Detections</p>
                <p className="text-2xl font-bold text-gray-900">{totalDetections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{avgConfidence.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Most Common</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.length > 0 ? stats[0]?.emotion : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Emotions Detected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Emotion Distribution</h3>
          </CardHeader>
          <CardContent>
            {stats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Detection Count & Confidence</h3>
          </CardHeader>
          <CardContent>
            {stats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="emotion" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Count" fill="#3B82F6" />
                  <Bar yAxisId="right" dataKey="confidence" name="Avg Confidence %" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Detailed Statistics</h3>
        </CardHeader>
        <CardContent>
          {stats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Emotion</th>
                    <th className="text-right p-2">Count</th>
                    <th className="text-right p-2">Avg Confidence</th>
                    <th className="text-right p-2">Percentage</th>
                    <th className="text-right p-2">Last Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.emotion} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: EMOTION_COLORS[stat.emotion as keyof typeof EMOTION_COLORS] 
                            }}
                          ></div>
                          {stat.emotion}
                        </div>
                      </td>
                      <td className="text-right p-2">{stat.count}</td>
                      <td className="text-right p-2">{stat.avg_confidence.toFixed(1)}%</td>
                      <td className="text-right p-2">
                        {((stat.count / totalDetections) * 100).toFixed(1)}%
                      </td>
                      <td className="text-right p-2 text-sm text-gray-600">
                        {new Date(stat.last_detected).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No statistics available yet. Start detecting emotions to see data here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};