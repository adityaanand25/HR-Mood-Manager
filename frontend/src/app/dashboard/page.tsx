'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import EmotionCapture from '@/components/EmotionCapture';
import { MoodHistory } from '@/components/MoodHistory';
import { MoodStatistics } from '@/components/MoodStatistics';
import { HRPanel } from '@/components/HRPanel';
import { TaskManagement } from '@/components/TaskManagement';
import LeaveManagement from '@/components/LeaveManagement';
import HRLeaveApproval from '@/components/HRLeaveApproval';
import { 
  User, 
  LogOut, 
  Camera, 
  History, 
  BarChart3, 
  Settings,
  Brain,
  Shield,
  Users,
  ClipboardList,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'detection' | 'history' | 'statistics' | 'tasks' | 'leaves' | 'hr-panel';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('detection');

  // Handle redirect in useEffect to avoid rendering issues
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth or redirecting
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl animate-pulse mx-auto">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const tabs = [
    {
      id: 'detection' as TabType,
      label: 'Emotion Detection',
      icon: Camera,
      description: 'Capture and analyze emotions in real-time'
    },
    {
      id: 'history' as TabType,
      label: 'Mood History',
      icon: History,
      description: 'View past mood records and trends'
    },
    {
      id: 'statistics' as TabType,
      label: 'Statistics',
      icon: BarChart3,
      description: 'Analyze mood patterns and insights'
    },
    {
      id: 'tasks' as TabType,
      label: user?.role === 'hr' ? 'Task Management' : 'My Tasks',
      icon: ClipboardList,
      description: user?.role === 'hr' ? 'Assign and track employee tasks' : 'View and manage your assigned tasks'
    },
    {
      id: 'leaves' as TabType,
      label: user?.role === 'hr' ? 'Leave Approvals' : 'My Leaves',
      icon: Calendar,
      description: user?.role === 'hr' ? 'Review and approve leave requests' : 'Apply for leave and track requests'
    },
    ...(user?.role === 'hr' ? [{
      id: 'hr-panel' as TabType,
      label: 'HR Panel',
      icon: Settings,
      description: 'Manual mood entry and employee management'
    }] : [])
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'detection':
        return <EmotionCapture autoSave={true} />;
      case 'history':
        return <MoodHistory />;
      case 'statistics':
        return <MoodStatistics />;
      case 'tasks':
        return <TaskManagement isHRView={user?.role === 'hr'} />;
      case 'leaves':
        return user?.role === 'hr' ? <HRLeaveApproval hrUserId={user.user_id} /> : <LeaveManagement userId={user.user_id} />;
      case 'hr-panel':
        return <HRPanel />;
      default:
        return <EmotionCapture autoSave={true} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Professional Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Employee Mood Analyzer</h1>
                <p className="text-sm text-slate-400">Employee Wellness Platform</p>
              </div>
            </div>
            
            {/* User Info and Actions */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  {user.role === 'hr' ? <Shield className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user.full_name || user.user_id}</p>
                  <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                </div>
              </div>
              
              <Link 
                href="/insights" 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-xl text-purple-300 hover:text-white transition-all duration-300 text-sm font-medium"
              >
                <Brain className="h-4 w-4" />
                AI Insights
              </Link>
              
              {user.role === 'hr' && (
                <Link 
                  href="/users" 
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl text-blue-300 hover:text-white transition-all duration-300 text-sm font-medium"
                >
                  <Users className="h-4 w-4" />
                  Manage Users
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-red-300 hover:text-white transition-all duration-300 text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-2 border border-white/10">
            <nav className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="relative">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl -z-10"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="animate-fade-in relative z-10 min-h-[500px]">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}