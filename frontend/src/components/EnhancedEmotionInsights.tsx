'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Send, Settings } from 'lucide-react';

interface RAGResponse {
  success: boolean;
  answer: string;
  suggestions: string[];
  source: string;
}

export default function EnhancedEmotionInsights() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [configuring, setConfiguring] = useState(false);

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/rag/suggestions');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleAskQuestion = async (q: string = question) => {
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/rag/enhanced-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          use_gemini: true
        })
      });

      const data = await res.json();
      setResponse(data);
      setQuestion('');
    } catch (error) {
      console.error('Error querying RAG:', error);
      setResponse({
        success: false,
        answer: 'Error querying RAG system. Please try again.',
        suggestions: [],
        source: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureGemini = async () => {
    if (!geminiKey.trim()) {
      alert('Please enter your Gemini API key');
      return;
    }

    setConfiguring(true);
    try {
      const res = await fetch('http://localhost:8000/api/rag/configure-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: geminiKey })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('✅ Gemini API configured successfully!');
        setShowKeyInput(false);
        setGeminiKey('');
      } else {
        const errorMsg = data.error || data.message || 'Unknown error';
        console.error('Configuration error:', errorMsg);
        alert(`⚠️  Configuration Issue:\n\n${errorMsg}\n\nMake sure:\n1. Your API key is valid (from makersuite.google.com)\n2. The key has access to Gemini API\n3. google-generativeai is installed (pip install google-generativeai)`);
      }
    } catch (error) {
      console.error('Error configuring Gemini:', error);
      alert('❌ Error configuring Gemini API:\n\n' + String(error) + '\n\nMake sure the backend server is running on port 8000');
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-purple border-2 border-white/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Enhanced AI Insights</h2>
            </div>
            <Button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600"
              size="sm"
            >
              <Settings className="w-4 h-4" />
              Configure
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Gemini API Key Configuration */}
      {showKeyInput && (
        <Card className="glass-purple border-2 border-yellow-500/30 bg-yellow-900/20">
          <CardHeader>
            <h3 className="text-white font-bold">Configure Gemini API</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API Key"
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              Get your API key from{' '}
              <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                Google AI Studio
              </a>
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleConfigureGemini}
                disabled={configuring}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {configuring ? 'Configuring...' : 'Configure'}
              </Button>
              <Button
                onClick={() => setShowKeyInput(false)}
                className="bg-slate-700 hover:bg-slate-600"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Input */}
      <Card className="glass-purple border-2 border-white/20">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Ask about employee emotions and trends..."
              className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none"
            />
            <Button
              onClick={() => handleAskQuestion()}
              disabled={loading || !question.trim()}
              className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Asking...' : 'Ask'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="glass-purple border-2 border-white/20">
          <CardHeader>
            <h3 className="text-white font-bold">Suggested Questions</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuestion(suggestion)}
                  className="text-left p-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {response && (
        <Card className={`glass-purple border-2 ${response.success ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">AI Response</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                response.source === 'gemini-enhanced' ? 'bg-purple-600' : 'bg-slate-600'
              } text-white`}>
                {response.source === 'gemini-enhanced' ? 'Gemini Enhanced' : 'Rule-Based'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-lg text-slate-100 whitespace-pre-wrap text-sm">
              {response.answer}
            </div>

            {response.suggestions && response.suggestions.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-2">Follow-up Questions:</h4>
                <div className="space-y-2">
                  {response.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskQuestion(suggestion)}
                      className="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                    >
                      • {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
