# Database Integration Guide

## Overview
The HR Mood Manager now includes a SQLite database (`database.db`) that stores:
- **User accounts** (Employees and HR personnel)
- **Mood detection records** (AI-detected emotions)
- **Mood history** (Manual entries)

## Database Location
📁 `D:\HR Mood Manager\database.db`

You can open and view this database using **[DB Browser for SQLite](https://sqlitebrowser.org/)**

## Database Tables

### 1. `users` Table
Stores all user accounts (both Employees and HR)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | TEXT | Unique user ID (e.g., EMP001, HR001) |
| password | TEXT | User password |
| role | TEXT | 'employee' or 'hr' |
| full_name | TEXT | Full name of the user |
| email | TEXT | Email address |
| department | TEXT | Department name |
| created_at | TIMESTAMP | Account creation date |
| last_login | TIMESTAMP | Last login time |

### 2. `mood_records` Table
Stores AI-detected mood records

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | TEXT | Foreign key to users table |
| emotion | TEXT | Detected emotion (Happy, Sad, etc.) |
| confidence | REAL | Confidence percentage (0-100) |
| detection_method | TEXT | 'webcam', 'image', or 'video' |
| notes | TEXT | Optional notes |
| timestamp | TIMESTAMP | Detection time |

### 3. `mood_history` Table
Stores manual mood entries (typically by HR)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | TEXT | Foreign key to users table |
| mood | TEXT | Mood description |
| intensity | INTEGER | Intensity level (1-10) |
| notes | TEXT | Optional notes |
| timestamp | TIMESTAMP | Entry time |

## Default User Accounts

### Employees
- **User ID**: `EMP001` | **Password**: `emp123` | **Name**: John Doe
- **User ID**: `EMP002` | **Password**: `emp123` | **Name**: Jane Smith

### HR Personnel
- **User ID**: `HR001` | **Password**: `hr123` | **Name**: Sarah Johnson
- **User ID**: `HR002` | **Password**: `hr123` | **Name**: Mike Wilson

## API Endpoints

All database operations are available through the FastAPI backend:

### Authentication
- **POST** `/api/login` - Authenticate user
  ```json
  {
    "user_id": "EMP001",
    "password": "emp123"
  }
  ```

### Users
- **GET** `/api/users?role=employee` - Get all users (filter by role optional)

### Mood Records
- **POST** `/api/mood-record` - Save mood detection
  ```json
  {
    "user_id": "EMP001",
    "emotion": "Happy",
    "confidence": 95.5,
    "detection_method": "webcam",
    "notes": "AI detected"
  }
  ```
- **GET** `/api/mood-records?user_id=EMP001&limit=100` - Get mood records
- **GET** `/api/mood-statistics?user_id=EMP001` - Get mood statistics

### Mood History
- **POST** `/api/mood-history` - Save manual mood entry
  ```json
  {
    "user_id": "EMP001",
    "mood": "Happy",
    "intensity": 8,
    "notes": "Feeling great today"
  }
  ```
- **GET** `/api/mood-history?user_id=EMP001&limit=100` - Get mood history

## Automatic Database Integration

### Webcam Detection
When an employee uses the webcam mood detection feature, **every detection is automatically saved** to the database with:
- User ID
- Detected emotion
- Confidence percentage
- Timestamp
- Detection method (webcam)

### How It Works
1. Employee logs in with their credentials
2. Starts the webcam
3. AI detects mood every 3 seconds
4. Each detection is automatically saved to `mood_records` table
5. HR can view all mood records via API or database

## Viewing the Database

### Using DB Browser for SQLite
1. Download and install [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open the application
3. Click **"Open Database"**
4. Navigate to: `D:\HR Mood Manager\database.db`
5. You can now:
   - Browse all tables
   - View mood records
   - Run SQL queries
   - Export data to CSV/JSON

### Example SQL Queries

**Get all mood records for a specific user:**
```sql
SELECT * FROM mood_records 
WHERE user_id = 'EMP001' 
ORDER BY timestamp DESC;
```

**Get mood statistics:**
```sql
SELECT emotion, COUNT(*) as count, AVG(confidence) as avg_confidence
FROM mood_records
GROUP BY emotion
ORDER BY count DESC;
```

**Get recent employee activity:**
```sql
SELECT u.full_name, u.department, mr.emotion, mr.confidence, mr.timestamp
FROM mood_records mr
JOIN users u ON mr.user_id = u.user_id
WHERE u.role = 'employee'
ORDER BY mr.timestamp DESC
LIMIT 20;
```

## Python Database Functions

You can also use the `database.py` module directly in your Python code:

```python
import database

# Initialize database
database.init_database()

# Authenticate user
user = database.authenticate_user('EMP001', 'emp123')

# Save mood record
database.save_mood_record('EMP001', 'Happy', 95.5, 'webcam')

# Get mood records
records = database.get_mood_records(user_id='EMP001', limit=50)

# Get statistics
stats = database.get_mood_statistics(user_id='EMP001')
```

## Security Notes

⚠️ **Important**: In a production environment, you should:
1. Use hashed passwords (not plain text)
2. Implement JWT tokens for authentication
3. Add user session management
4. Use environment variables for sensitive data
5. Add database backup strategies

## Testing the Integration

1. **Start the backend:**
   ```powershell
   .\.venv\Scripts\Activate.ps1
   python api_server.py
   ```

2. **Start the frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Login as Employee** (EMP001 / emp123)

4. **Start camera and let it detect** - Check database afterwards!

5. **View in DB Browser:**
   - Open `database.db`
   - Check the `mood_records` table
   - You should see all your detections!

## Support

For any issues or questions, check:
- API documentation: `http://localhost:8000/docs`
- Database file: `D:\HR Mood Manager\database.db`
- Console logs in the backend terminal
