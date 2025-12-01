"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EmotionInsights from '../../components/EmotionInsights';
import EnhancedEmotionInsights from '../../components/EnhancedEmotionInsights';
import { ArrowLeft } from 'lucide-react';

export default function InsightsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'basic' | 'enhanced'>('enhanced');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-white">AI Insights & Analytics</h1>
            <p className="text-slate-400 mt-2">Powered by advanced emotion analysis</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setView('enhanced')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              view === 'enhanced'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Enhanced AI Insights
          </button>
          <button
            onClick={() => setView('basic')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              view === 'basic'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Basic Insights
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {view === 'enhanced' ? (
            <EnhancedEmotionInsights />
          ) : (
            <EmotionInsights currentUser={user} />
          )}
        </div>
      </div>
    </div>
  );
}