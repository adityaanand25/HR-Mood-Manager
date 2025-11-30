# HR Mood Manager - Complete Data Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Browser)                             │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend (Port 3001)                      │   │
│  │                                                                       │   │
│  │  ├── Public Assets                                                   │   │
│  │  │   ├── manifest.json (PWA Config)                                 │   │
│  │  │   ├── sw.js (Service Worker)                                     │   │
│  │  │   ├── offline.html                                               │   │
│  │  │   └── icons/ (PWA Icons)                                         │   │
│  │  │                                                                   │   │
│  │  ├── Pages                                                           │   │
│  │  │   ├── / (Login Page)                                             │   │
│  │  │   ├── /dashboard (Main Dashboard)                                │   │
│  │  │   ├── /insights (AI Insights)                                    │   │
│  │  │   └── /tasks (Task Management)                                   │   │
│  │  │                                                                   │   │
│  │  ├── Components                                                      │   │
│  │  │   ├── MoodTracker.tsx (Emotion Detection)                        │   │
│  │  │   ├── TaskManagement.tsx (Employee Tasks)                        │   │
│  │  │   ├── HRTaskView.tsx (HR Task Management)                        │   │
│  │  │   ├── LeaveManagement.tsx (Employee Leave)                       │   │
│  │  │   ├── HRLeaveApproval.tsx (HR Leave Approval)                    │   │
│  │  │   ├── InsightsDashboard.tsx (AI Insights)                        │   │
│  │  │   └── ProfileSettings.tsx (User Profile)                         │   │
│  │  │                                                                   │   │
│  │  └── API Client (lib/api.ts)                                        │   │
│  │      ├── authApi                                                     │   │
│  │      ├── moodApi                                                     │   │
│  │      ├── taskApi                                                     │   │
│  │      ├── leaveApi                                                    │   │
│  │      └── insightsApi                                                 │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│                                    ↕ HTTP/HTTPS                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                     ↓↑
                                     
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVER LAYER (Backend)                               │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 FastAPI Server (Port 8000)                           │   │
│  │                      (api_server.py)                                 │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    API Endpoints                                │ │   │
│  │  │                                                                  │ │   │
│  │  │  Authentication:                                                │ │   │
│  │  │  ├── POST /api/auth/login                                       │ │   │
│  │  │  ├── POST /api/auth/signup                                      │ │   │
│  │  │  └── POST /api/auth/logout                                      │ │   │
│  │  │                                                                  │ │   │
│  │  │  Mood Tracking:                                                 │ │   │
│  │  │  ├── POST /api/mood (Record mood)                               │ │   │
│  │  │  ├── GET /api/mood (Get mood history)                           │ │   │
│  │  │  ├── POST /api/mood/detect (Image emotion detection)            │ │   │
│  │  │  └── GET /api/mood/stats (Mood statistics)                      │ │   │
│  │  │                                                                  │ │   │
│  │  │  Task Management:                                               │ │   │
│  │  │  ├── POST /api/tasks (Create task)                              │ │   │
│  │  │  ├── GET /api/tasks (Get tasks)                                 │ │   │
│  │  │  ├── PUT /api/tasks/{id} (Update task)                          │ │   │
│  │  │  ├── DELETE /api/tasks/{id} (Delete task)                       │ │   │
│  │  │  └── GET /api/tasks/stats (Task statistics)                     │ │   │
│  │  │                                                                  │ │   │
│  │  │  Leave Management:                                              │ │   │
│  │  │  ├── POST /api/leaves (Apply leave)                             │ │   │
│  │  │  ├── GET /api/leaves (Get leave requests)                       │ │   │
│  │  │  ├── PUT /api/leaves/{id}/approve (Approve/Reject)              │ │   │
│  │  │  └── GET /api/leaves/statistics (Leave stats)                   │ │   │
│  │  │                                                                  │ │   │
│  │  │  AI Insights:                                                   │ │   │
│  │  │  ├── POST /api/chat (RAG Chat)                                  │ │   │
│  │  │  ├── GET /api/insights (Get AI insights)                        │ │   │
│  │  │  └── POST /api/insights/generate (Generate new insights)        │ │   │
│  │  │                                                                  │ │   │
│  │  │  Health Check:                                                  │ │   │
│  │  │  └── GET /health                                                │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    AI/ML Models                                 │ │   │
│  │  │                                                                  │ │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐  │ │   │
│  │  │  │ Emotion Detection Model                                  │  │ │   │
│  │  │  │ (emotion_detection_model.h5)                             │  │ │   │
│  │  │  │                                                           │  │ │   │
│  │  │  │ Input: Face Image (48x48 grayscale)                      │  │ │   │
│  │  │  │ Process: CNN Model (Conv2D + MaxPooling + Dense)         │  │ │   │
│  │  │  │ Output: Emotion (Happy, Sad, Angry, Neutral, etc.)       │  │ │   │
│  │  │  └─────────────────────────────────────────────────────────┘  │ │   │
│  │  │                                                                  │ │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐  │ │   │
│  │  │  │ RAG System (Retrieval Augmented Generation)             │  │ │   │
│  │  │  │                                                           │  │ │   │
│  │  │  │ Embedding Model: sentence-transformers/all-MiniLM-L6-v2 │  │ │   │
│  │  │  │ Vector Store: ChromaDB                                   │  │ │   │
│  │  │  │ LLM: Google Gemini API                                   │  │ │   │
│  │  │  │                                                           │  │ │   │
│  │  │  │ Process:                                                 │  │ │   │
│  │  │  │ 1. User Query → Text Embedding                           │  │ │   │
│  │  │  │ 2. Vector Search in ChromaDB                             │  │ │   │
│  │  │  │ 3. Retrieve Relevant Documents                           │  │ │   │
│  │  │  │ 4. Send to Gemini with Context                           │  │ │   │
│  │  │  │ 5. Generate Contextual Response                          │  │ │   │
│  │  │  └─────────────────────────────────────────────────────────┘  │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│                                    ↕ SQL                                     │
└─────────────────────────────────────────────────────────────────────────────┘

                                     ↓↑

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER (Database)                               │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                SQLite Database (database.db)                         │   │
│  │                      (database.py)                                   │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    Database Tables                              │ │   │
│  │  │                                                                  │ │   │
│  │  │  users                                                          │ │   │
│  │  │  ├── user_id (PK)                                               │ │   │
│  │  │  ├── password_hash                                              │ │   │
│  │  │  ├── full_name                                                  │ │   │
│  │  │  ├── email                                                      │ │   │
│  │  │  ├── role (employee/hr)                                         │ │   │
│  │  │  ├── department                                                 │ │   │
│  │  │  ├── created_at                                                 │ │   │
│  │  │  └── last_login                                                 │ │   │
│  │  │                                                                  │ │   │
│  │  │  mood_entries                                                   │ │   │
│  │  │  ├── id (PK)                                                    │ │   │
│  │  │  ├── user_id (FK → users.user_id)                              │ │   │
│  │  │  ├── mood (text/detected emotion)                               │ │   │
│  │  │  ├── note (optional)                                            │ │   │
│  │  │  ├── detection_method (manual/camera)                           │ │   │
│  │  │  ├── confidence_score                                           │ │   │
│  │  │  └── created_at                                                 │ │   │
│  │  │                                                                  │ │   │
│  │  │  tasks                                                          │ │   │
│  │  │  ├── id (PK)                                                    │ │   │
│  │  │  ├── employee_id (FK → users.user_id)                          │ │   │
│  │  │  ├── assigned_by (FK → users.user_id)                          │ │   │
│  │  │  ├── title                                                      │ │   │
│  │  │  ├── description                                                │ │   │
│  │  │  ├── priority (low/medium/high)                                 │ │   │
│  │  │  ├── status (pending/in_progress/completed)                     │ │   │
│  │  │  ├── due_date                                                   │ │   │
│  │  │  ├── created_at                                                 │ │   │
│  │  │  └── updated_at                                                 │ │   │
│  │  │                                                                  │ │   │
│  │  │  leave_requests                                                 │ │   │
│  │  │  ├── id (PK)                                                    │ │   │
│  │  │  ├── employee_id (FK → users.user_id)                          │ │   │
│  │  │  ├── leave_type (sick/casual/vacation)                          │ │   │
│  │  │  ├── start_date                                                 │ │   │
│  │  │  ├── end_date                                                   │ │   │
│  │  │  ├── reason                                                     │ │   │
│  │  │  ├── status (pending/approved/rejected)                         │ │   │
│  │  │  ├── approved_by (FK → users.user_id)                          │ │   │
│  │  │  ├── hr_notes                                                   │ │   │
│  │  │  ├── created_at                                                 │ │   │
│  │  │  └── updated_at                                                 │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │                  Database Functions                             │ │   │
│  │  │                                                                  │ │   │
│  │  │  User Management:                                               │ │   │
│  │  │  ├── authenticate_user()                                        │ │   │
│  │  │  ├── create_user()                                              │ │   │
│  │  │  ├── get_user()                                                 │ │   │
│  │  │  └── update_last_login()                                        │ │   │
│  │  │                                                                  │ │   │
│  │  │  Mood Management:                                               │ │   │
│  │  │  ├── save_mood_entry()                                          │ │   │
│  │  │  ├── get_mood_history()                                         │ │   │
│  │  │  └── get_mood_statistics()                                      │ │   │
│  │  │                                                                  │ │   │
│  │  │  Task Management:                                               │ │   │
│  │  │  ├── create_task()                                              │ │   │
│  │  │  ├── get_tasks()                                                │ │   │
│  │  │  ├── update_task()                                              │ │   │
│  │  │  ├── delete_task()                                              │ │   │
│  │  │  └── get_task_statistics()                                      │ │   │
│  │  │                                                                  │ │   │
│  │  │  Leave Management:                                              │ │   │
│  │  │  ├── create_leave_request()                                     │ │   │
│  │  │  ├── get_leave_requests()                                       │ │   │
│  │  │  ├── update_leave_status()                                      │ │   │
│  │  │  └── get_leave_statistics()                                     │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              ChromaDB Vector Database (RAG)                          │   │
│  │                                                                       │   │
│  │  Collections:                                                        │   │
│  │  ├── hr_knowledge_base                                              │   │
│  │  │   ├── Document Embeddings (384-dim vectors)                      │   │
│  │  │   ├── Metadata (source, category, timestamp)                     │   │
│  │  │   └── Original Text Content                                      │   │
│  │  │                                                                   │   │
│  │  └── Operations:                                                     │   │
│  │      ├── add_documents()                                            │   │
│  │      ├── query_similar()                                            │   │
│  │      └── update_documents()                                         │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

                                     ↓↑

┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES LAYER                                 │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Google Gemini API                                 │   │
│  │                                                                       │   │
│  │  Purpose: Natural Language Processing & Generation                   │   │
│  │  Model: gemini-1.5-flash                                             │   │
│  │                                                                       │   │
│  │  Uses:                                                               │   │
│  │  ├── Generate AI Insights from mood/task data                       │   │
│  │  ├── Answer HR-related queries (RAG)                                │   │
│  │  ├── Provide recommendations                                         │   │
│  │  └── Analyze employee sentiment                                     │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Data Flow Scenarios

### 1. User Login Flow
```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Browser │────→│ Next.js │────→│  FastAPI │────→│ Database │
│         │     │ Frontend│     │  Server  │     │ (SQLite) │
└─────────┘     └─────────┘     └──────────┘     └──────────┘
    │                │                 │                │
    │ 1. Enter       │                 │                │
    │ credentials    │                 │                │
    │────────────────→                 │                │
    │                │ 2. POST         │                │
    │                │ /api/auth/login │                │
    │                │─────────────────→                │
    │                │                 │ 3. Query user  │
    │                │                 │ & verify hash  │
    │                │                 │────────────────→
    │                │                 │ 4. User data   │
    │                │                 │←────────────────
    │                │ 5. JWT Token    │                │
    │                │←─────────────────                │
    │ 6. Redirect    │                 │                │
    │ to dashboard   │                 │                │
    │←────────────────                 │                │
```

### 2. Mood Detection Flow (Camera)
```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Browser │     │ Next.js │     │  FastAPI │     │    AI    │
│ Camera  │     │ Frontend│     │  Server  │     │  Model   │
└─────────┘     └─────────┘     └──────────┘     └──────────┘
    │                │                 │                │
    │ 1. Capture     │                 │                │
    │ face image     │                 │                │
    │────────────────→                 │                │
    │                │ 2. POST         │                │
    │                │ /api/mood/detect│                │
    │                │ (base64 image)  │                │
    │                │─────────────────→                │
    │                │                 │ 3. Preprocess  │
    │                │                 │ & predict      │
    │                │                 │────────────────→
    │                │                 │ 4. Emotion +   │
    │                │                 │ confidence     │
    │                │                 │←────────────────
    │                │                 │ 5. Save to DB  │
    │                │                 │────────────────→
    │                │ 6. Emotion      │                │
    │                │ result          │                │
    │                │←─────────────────                │
    │ 7. Display     │                 │                │
    │ emotion        │                 │                │
    │←────────────────                 │                │
```

### 3. Leave Request Flow (Employee → HR)
```
┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐
│ Employee │  │ Next.js │  │  FastAPI │  │ Database │  │   HR    │
│ Browser  │  │ Frontend│  │  Server  │  │ (SQLite) │  │ Browser │
└──────────┘  └─────────┘  └──────────┘  └──────────┘  └─────────┘
     │             │              │              │             │
     │ 1. Fill     │              │              │             │
     │ leave form  │              │              │             │
     │─────────────→              │              │             │
     │             │ 2. POST      │              │             │
     │             │ /api/leaves  │              │             │
     │             │──────────────→              │             │
     │             │              │ 3. Insert    │             │
     │             │              │ leave_request│             │
     │             │              │──────────────→             │
     │             │              │ 4. Success   │             │
     │             │              │←──────────────             │
     │             │ 5. Confirm   │              │             │
     │             │←──────────────              │             │
     │ 6. Show     │              │              │             │
     │ success     │              │              │             │
     │←─────────────              │              │             │
     │             │              │              │ 7. HR opens │
     │             │              │              │ dashboard   │
     │             │              │              │←─────────────
     │             │              │ 8. GET       │             │
     │             │              │ /api/leaves  │             │
     │             │              │←──────────────────────────
     │             │              │ 9. Query all │             │
     │             │              │ pending      │             │
     │             │              │──────────────→             │
     │             │              │ 10. Leave    │             │
     │             │              │ list         │             │
     │             │              │←──────────────             │
     │             │              │ 11. Return   │             │
     │             │              │ leave data   │             │
     │             │              │──────────────────────────→
     │             │              │              │ 12. Display │
     │             │              │              │ leave list  │
     │             │              │              │─────────────→
     │             │              │              │ 13. Approve/│
     │             │              │              │ Reject      │
     │             │              │ 14. PUT      │←─────────────
     │             │              │ /api/leaves/ │             │
     │             │              │ {id}/approve │             │
     │             │              │←──────────────────────────
     │             │              │ 15. Update   │             │
     │             │              │ status       │             │
     │             │              │──────────────→             │
     │             │              │ 16. Success  │             │
     │             │              │←──────────────             │
```

### 4. AI Insights Generation Flow
```
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐
│ Browser │  │ Next.js │  │  FastAPI │  │ Database │  │ Gemini  │
│         │  │ Frontend│  │  Server  │  │          │  │   API   │
└─────────┘  └─────────┘  └──────────┘  └──────────┘  └─────────┘
     │             │              │              │             │
     │ 1. Request  │              │              │             │
     │ insights    │              │              │             │
     │─────────────→              │              │             │
     │             │ 2. POST      │              │             │
     │             │ /api/insights│              │             │
     │             │ /generate    │              │             │
     │             │──────────────→              │             │
     │             │              │ 3. Get mood  │             │
     │             │              │ history      │             │
     │             │              │──────────────→             │
     │             │              │ 4. Mood data │             │
     │             │              │←──────────────             │
     │             │              │ 5. Get tasks │             │
     │             │              │──────────────→             │
     │             │              │ 6. Task data │             │
     │             │              │←──────────────             │
     │             │              │ 7. Send to   │             │
     │             │              │ Gemini API   │             │
     │             │              │──────────────────────────→
     │             │              │              │ 8. Analyze │
     │             │              │              │ & generate │
     │             │              │              │ insights   │
     │             │              │ 9. AI        │             │
     │             │              │ insights     │             │
     │             │              │←──────────────────────────
     │             │ 10. Return   │              │             │
     │             │ insights     │              │             │
     │             │←──────────────              │             │
     │ 11. Display │              │              │             │
     │ insights    │              │              │             │
     │←─────────────              │              │             │
```

### 5. RAG Chat Flow
```
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐
│ Browser │  │ Next.js │  │  FastAPI │  │ ChromaDB │  │ Gemini  │
│         │  │ Frontend│  │  Server  │  │          │  │   API   │
└─────────┘  └─────────┘  └──────────┘  └──────────┘  └─────────┘
     │             │              │              │             │
     │ 1. Ask HR   │              │              │             │
     │ question    │              │              │             │
     │─────────────→              │              │             │
     │             │ 2. POST      │              │             │
     │             │ /api/chat    │              │             │
     │             │──────────────→              │             │
     │             │              │ 3. Embed     │             │
     │             │              │ query        │             │
     │             │              │──────────────→             │
     │             │              │ 4. Vector    │             │
     │             │              │ search       │             │
     │             │              │←──────────────             │
     │             │              │ 5. Relevant  │             │
     │             │              │ docs         │             │
     │             │              │ 6. Send query│             │
     │             │              │ + context to │             │
     │             │              │ Gemini       │             │
     │             │              │──────────────────────────→
     │             │              │              │ 7. Generate│
     │             │              │              │ response   │
     │             │              │ 8. AI answer │             │
     │             │              │←──────────────────────────
     │             │ 9. Return    │              │             │
     │             │ answer       │              │             │
     │             │←──────────────              │             │
     │ 10. Display │              │              │             │
     │ answer      │              │             │             │
     │←─────────────              │              │             │
```

## Data Models & Relationships

```
┌─────────────┐
│    users    │
│─────────────│
│ user_id PK  │──┐
│ password    │  │
│ full_name   │  │
│ email       │  │
│ role        │  │
│ department  │  │
└─────────────┘  │
                 │
         ┌───────┴──────┬──────────────┬──────────────┐
         │              │              │              │
         ↓              ↓              ↓              ↓
┌──────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ mood_entries │ │    tasks    │ │   leave_    │ │    tasks    │
│              │ │             │ │  requests   │ │ (assigned)  │
│──────────────│ │─────────────│ │─────────────│ │─────────────│
│ id PK        │ │ id PK       │ │ id PK       │ │             │
│ user_id FK   │ │ employee_id │ │ employee_id │ │ assigned_by │
│ mood         │ │ assigned_by │ │ leave_type  │ │ FK          │
│ note         │ │ title       │ │ start_date  │ │             │
│ confidence   │ │ description │ │ end_date    │ └─────────────┘
│ method       │ │ priority    │ │ reason      │
│ created_at   │ │ status      │ │ status      │
└──────────────┘ │ due_date    │ │ approved_by │
                 └─────────────┘ │ FK          │
                                 │ hr_notes    │
                                 └─────────────┘
```

## Technology Stack Flow

```
┌────────────────────────────────────────────────────────────────┐
│                        Frontend Stack                           │
│                                                                 │
│  Next.js 16 (App Router) ─→ React 19 ─→ TypeScript            │
│       ↓                          ↓              ↓               │
│  Tailwind CSS            React Hooks      Type Safety          │
│       ↓                          ↓              ↓               │
│  Responsive UI           State Mgmt      API Typing            │
└────────────────────────────────────────────────────────────────┘
                              ↕
┌────────────────────────────────────────────────────────────────┐
│                        Backend Stack                            │
│                                                                 │
│  FastAPI ─→ Python 3.11 ─→ Uvicorn Server                     │
│     ↓             ↓              ↓                              │
│  Pydantic   Async/Await    High Performance                    │
│     ↓             ↓              ↓                              │
│  Validation   Concurrent    Auto Docs                          │
└────────────────────────────────────────────────────────────────┘
                              ↕
┌────────────────────────────────────────────────────────────────┐
│                       Database Stack                            │
│                                                                 │
│  SQLite3 ─→ SQL Queries ─→ WAL Mode                           │
│     ↓             ↓              ↓                              │
│  Embedded    Transactions    Concurrent Reads                  │
│                                                                 │
│  ChromaDB ─→ Vector Store ─→ Embeddings                       │
│     ↓             ↓              ↓                              │
│  Persistent  Similarity      384-dim vectors                   │
└────────────────────────────────────────────────────────────────┘
                              ↕
┌────────────────────────────────────────────────────────────────┐
│                         AI/ML Stack                             │
│                                                                 │
│  TensorFlow ─→ Keras ─→ CNN Model                             │
│     ↓             ↓         ↓                                   │
│  Deep Learning  Sequential  Emotion Detection                  │
│                                                                 │
│  Sentence Transformers ─→ HuggingFace ─→ Embeddings           │
│     ↓                         ↓              ↓                  │
│  all-MiniLM-L6-v2         Models         Vector Repr.          │
│                                                                 │
│  Google Gemini API ─→ LLM ─→ Natural Language                 │
│     ↓                    ↓         ↓                            │
│  Cloud Service      gemini-1.5   Generation                    │
└────────────────────────────────────────────────────────────────┘
```

## Security & Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Chain                         │
│                                                                  │
│  User Credentials                                               │
│         ↓                                                        │
│  Frontend Validation                                            │
│         ↓                                                        │
│  HTTPS Request (POST /api/auth/login)                          │
│         ↓                                                        │
│  Backend receives credentials                                   │
│         ↓                                                        │
│  Query user from database                                       │
│         ↓                                                        │
│  Verify password hash (SHA-256 + Salt)                         │
│         ↓                                                        │
│  Generate JWT token (if valid)                                 │
│         ↓                                                        │
│  Return token + user data                                      │
│         ↓                                                        │
│  Frontend stores token (localStorage)                          │
│         ↓                                                        │
│  Include token in all subsequent requests                      │
│         ↓                                                        │
│  Backend validates token for protected routes                  │
└─────────────────────────────────────────────────────────────────┘
```

## PWA Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PWA Components                              │
│                                                                  │
│  manifest.json ────→ App Metadata                               │
│       ↓                   ↓                                      │
│  Name, Icons         Display Mode                               │
│  Theme Color         Start URL                                  │
│                                                                  │
│  sw.js ────────────→ Service Worker                             │
│       ↓                   ↓                                      │
│  Cache Strategy      Offline Support                            │
│  (install event)     (fetch intercept)                          │
│       ↓                   ↓                                      │
│  Cache assets        Serve from cache                           │
│  Cache API calls     Fallback to network                        │
│                                                                  │
│  offline.html ──────→ Offline Fallback                          │
│                           ↓                                      │
│                      Show when offline                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

This HR Mood Manager system implements a complete full-stack architecture with:

- **Frontend**: Next.js with React for responsive UI
- **Backend**: FastAPI for high-performance API
- **Database**: SQLite for relational data, ChromaDB for vector search
- **AI/ML**: TensorFlow for emotion detection, Sentence Transformers for embeddings, Google Gemini for natural language generation
- **PWA**: Offline support and installable web app
- **Security**: JWT authentication with password hashing

The data flows seamlessly through authentication, mood tracking, task management, leave management, and AI-powered insights generation, providing a comprehensive HR management solution.
