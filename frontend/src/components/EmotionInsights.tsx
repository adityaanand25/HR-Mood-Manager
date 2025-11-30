"use client";
import { useState, useEffect } from 'react';
import { ragApi, RAGQueryRequest, RAGQueryResponse, RAGInsightsResponse } from '../lib/api';
import { User, MessageSquare, Brain, Sparkles, Search, RefreshCw, AlertCircle } from 'lucide-react';

interface EmotionInsightsProps {
  currentUser?: any;
}

export default function EmotionInsights({ currentUser }: EmotionInsightsProps) {
  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState<RAGQueryResponse | null>(null);
  const [autoInsights, setAutoInsights] = useState<RAGInsightsResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load auto insights when component mounts
  useEffect(() => {
    loadAutoInsights();
  }, [currentUser]);

  const loadAutoInsights = async () => {
    setIsLoadingInsights(true);
    setError(null);
    try {
      const insights = await ragApi.getAutoInsights(
        currentUser?.role === 'hr' ? undefined : currentUser?.id
      );
      setAutoInsights(insights);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load emotion insights');
      console.error('Error loading auto insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsQuerying(true);
    setError(null);
    try {
      const queryData: RAGQueryRequest = {
        question: query,
        user_id: currentUser?.role === 'hr' ? undefined : currentUser?.id
      };
      
      const response = await ragApi.queryInsights(queryData);
      setQueryResponse(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process your question');
      console.error('Error querying insights:', err);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleRebuildDatabase = async () => {
    if (!currentUser?.role === 'hr') return;
    
    setIsRebuilding(true);
    setError(null);
    try {
      await ragApi.rebuildDatabase();
      // Reload insights after rebuilding
      await loadAutoInsights();
      alert('Database rebuilt successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to rebuild database');
      console.error('Error rebuilding database:', err);
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-purple-300" />
            <h1 className="text-3xl font-bold text-white">Emotion Insights AI</h1>
          </div>
          <p className="text-purple-200">
            Ask questions about employee emotions and get AI-powered insights
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Query Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-6 w-6 text-purple-300" />
              <h2 className="text-xl font-semibold text-white">Ask a Question</h2>
            </div>
            
            <form onSubmit={handleQuery} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  What would you like to know about emotions?
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., What are the most common emotions this week? How is John feeling lately?"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[100px] resize-y"
                  disabled={isQuerying}
                />
              </div>
              
              <button
                type="submit"
                disabled={isQuerying || !query.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isQuerying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Ask AI
                  </>
                )}
              </button>
            </form>

            {/* Query Response */}
            {queryResponse && (
              <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-sm font-medium text-purple-300 mb-2">Question:</h3>
                <p className="text-purple-100 mb-4 italic">"{queryResponse.question}"</p>
                
                <h3 className="text-sm font-medium text-purple-300 mb-2">Answer:</h3>
                <div className="text-white whitespace-pre-wrap bg-white/5 rounded p-3 border border-white/10">
                  {queryResponse.answer}
                </div>
              </div>
            )}
          </div>

          {/* Auto Insights Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-300" />
                <h2 className="text-xl font-semibold text-white">Auto Insights</h2>
              </div>
              
              <button
                onClick={loadAutoInsights}
                disabled={isLoadingInsights}
                className="bg-purple-600/50 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh insights"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingInsights ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingInsights ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-300" />
                <span className="ml-2 text-purple-200">Generating insights...</span>
              </div>
            ) : autoInsights?.insights ? (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-white whitespace-pre-wrap">
                  {autoInsights.insights}
                </div>
                {autoInsights.user_id && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-purple-300">
                    <User className="h-4 w-4" />
                    Personal insights for User ID: {autoInsights.user_id}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-purple-300">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No insights available yet</p>
                <p className="text-sm mt-1">Try asking a specific question or ensure there's emotion data available</p>
              </div>
            )}
          </div>
        </div>

        {/* HR Tools */}
        {currentUser?.role === 'hr' && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-6 w-6 text-purple-300" />
              <h2 className="text-xl font-semibold text-white">HR Management</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRebuildDatabase}
                disabled={isRebuilding}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isRebuilding ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Rebuilding...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Rebuild AI Database
                  </>
                )}
              </button>
              
              <div className="text-sm text-purple-300 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Use this if emotion data seems outdated or missing from insights
              </div>
            </div>
          </div>
        )}

        {/* Usage Examples */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Example Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "What are the most common emotions this week?",
              "Which employees seem to be struggling lately?",
              "How has team morale changed over time?",
              "What patterns do you see in employee emotions?",
              "Are there any concerning emotional trends?",
              "Which departments have the best emotional health?"
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="text-purple-200 text-sm">"{example}"</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}