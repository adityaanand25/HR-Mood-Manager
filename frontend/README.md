# Employee Mood Analyzer Frontend

A modern, responsive Next.js frontend for the Employee Mood Analyzer system that provides real-time emotion detection, mood tracking, and comprehensive analytics.

## Features

### 🔐 Authentication System
- **Secure Login**: User authentication with role-based access control
- **Role Management**: Separate interfaces for Employees and HR personnel
- **Demo Accounts**: Quick access with pre-configured demo credentials

### 📸 Real-time Emotion Detection
- **Webcam Integration**: Live camera feed for emotion capture
- **AI-Powered Analysis**: Real-time emotion detection using TensorFlow model
- **Confidence Scoring**: Detailed confidence levels for each emotion
- **Multiple Predictions**: Shows all emotion probabilities, not just the top result
- **Auto-save**: Automatic saving of emotion data to database

### 📊 Comprehensive Analytics
- **Mood Statistics**: Detailed charts and graphs showing emotion patterns
- **Distribution Charts**: Pie charts showing emotion distribution over time
- **Trend Analysis**: Bar charts comparing detection counts and confidence levels
- **Summary Metrics**: Key performance indicators and statistics

### 📝 Mood History Management
- **Historical Records**: Complete history of all mood detections
- **Filtering Options**: Filter by user (HR view) or personal history (employee view)
- **Detailed Information**: Timestamps, confidence levels, detection methods
- **Real-time Updates**: Live updates when new emotions are detected

### 🏢 HR Management Panel
- **Manual Mood Entry**: HR can manually log employee mood observations
- **Employee Selection**: Dropdown to select from all registered employees
- **Mood Categories**: Comprehensive list of mood options
- **Intensity Ratings**: 1-10 scale for mood intensity
- **Notes System**: Additional context and observations
- **Recent Entries**: View of recently added manual mood entries

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Clean Interface**: Intuitive navigation with clear visual hierarchy
- **Interactive Components**: Hover effects, smooth transitions, loading states
- **Accessibility**: Screen reader friendly with proper ARIA labels
- **Real-time Feedback**: Immediate visual feedback for all user actions

## Demo Accounts

### Employee Demo
- **User ID**: EMP001
- **Password**: emp123

### HR Demo
- **User ID**: HR001
- **Password**: hr123

## Quick Start

1. **Start the backend** (from main directory):
   ```bash
   .\.venv\Scripts\Activate.ps1
   python api_server.py
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## Technology Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Webcam** for camera integration
- **Axios** for API calls
