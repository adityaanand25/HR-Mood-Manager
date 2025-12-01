'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Brain, Users, BarChart3, Shield, ArrowRight, CheckCircle, Star, Menu, X } from 'lucide-react';

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms for accurate emotion detection and sentiment analysis.'
    },
    {
      icon: Users,
      title: 'Employee Wellness',
      description: 'Comprehensive wellness tracking and personalized insights for better employee engagement.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Live dashboards and detailed reporting for data-driven HR decision making.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with encrypted data storage and privacy-first architecture.'
    }
  ];

  const benefits = [
    'Improve employee satisfaction by 40%',
    'Reduce turnover rates significantly',
    'Early detection of workplace stress',
    'Data-driven wellness programs',
    'Comprehensive mood analytics',
    'Real-time team sentiment tracking'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Employee Mood Analyzer</span>
                <p className="text-xs text-slate-400">Employee Wellness Platform</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#benefits" className="text-slate-300 hover:text-white transition-colors">Benefits</a>
              <Link 
                href="/login" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#benefits" className="block text-slate-300 hover:text-white transition-colors">Benefits</a>
              <Link 
                href="/login" 
                className="block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_60%,rgba(147,51,234,0.1),transparent_50%)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto mb-8 w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <Brain className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Your
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Employee Wellness
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Harness the power of AI to understand, analyze, and improve your team's emotional well-being with real-time sentiment analysis and comprehensive wellness insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-3"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm">
              Watch Demo
            </button>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-sm">Trusted by 500+ companies</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm">99.9% uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="text-sm">Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Powerful Features for Modern HR
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Everything you need to build a healthier, more engaged workforce with cutting-edge technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-400 text-lg leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 lg:py-32 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Measurable Results for Your Organization
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Join thousands of companies that have transformed their workplace culture with data-driven insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl p-8 border border-white/10">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">40%</div>
                  <div className="text-slate-400">Improved Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">65%</div>
                  <div className="text-slate-400">Reduced Turnover</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">90%</div>
                  <div className="text-slate-400">Faster Issue Detection</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">99%</div>
                  <div className="text-slate-400">User Adoption Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Workplace?
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Start your journey towards a healthier, more engaged workforce today.
          </p>
          
          <Link 
            href="/login" 
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-8 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">Employee Mood Analyzer</span>
                <p className="text-xs text-slate-400">© 2024 All rights reserved</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
