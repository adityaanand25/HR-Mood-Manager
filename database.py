import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db_connection():
    """Create and return a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_database():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Users table (for both Employees and HR)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('employee', 'hr')),
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            department TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # Create Mood Records table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mood_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            emotion TEXT NOT NULL,
            confidence REAL NOT NULL,
            detection_method TEXT DEFAULT 'webcam',
            notes TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Create Mood History table (for manual entries by HR)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mood_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            mood TEXT NOT NULL,
            intensity INTEGER CHECK(intensity >= 1 AND intensity <= 10),
            notes TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Insert some default users if table is empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        default_users = [
            ('EMP001', 'emp123', 'employee', 'John Doe', 'john.doe@company.com', 'IT'),
            ('EMP002', 'emp123', 'employee', 'Jane Smith', 'jane.smith@company.com', 'Marketing'),
            ('HR001', 'hr123', 'hr', 'Sarah Johnson', 'sarah.hr@company.com', 'Human Resources'),
            ('HR002', 'hr123', 'hr', 'Mike Wilson', 'mike.hr@company.com', 'Human Resources'),
        ]
        
        cursor.executemany('''
            INSERT INTO users (user_id, password, role, full_name, email, department)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', default_users)
    
    conn.commit()
    conn.close()
    print(f"✓ Database initialized successfully at: {DATABASE_PATH}")

# User Management Functions
def authenticate_user(user_id: str, password: str) -> Optional[Dict]:
    """Authenticate a user and return their details"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT user_id, role, full_name, email, department
        FROM users
        WHERE user_id = ? AND password = ?
    ''', (user_id, password))
    
    user = cursor.fetchone()
    
    if user:
        # Update last login
        cursor.execute('''
            UPDATE users SET last_login = CURRENT_TIMESTAMP
            WHERE user_id = ?
        ''', (user_id,))
        conn.commit()
        
        result = dict(user)
    else:
        result = None
    
    conn.close()
    return result

def create_user(user_id: str, password: str, role: str, full_name: str, 
                email: str, department: str = None) -> bool:
    """Create a new user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO users (user_id, password, role, full_name, email, department)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, password, role, full_name, email, department))
        
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False

def get_all_users(role: str = None) -> List[Dict]:
    """Get all users, optionally filtered by role"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if role:
        cursor.execute('''
            SELECT user_id, role, full_name, email, department, created_at, last_login
            FROM users WHERE role = ?
            ORDER BY created_at DESC
        ''', (role,))
    else:
        cursor.execute('''
            SELECT user_id, role, full_name, email, department, created_at, last_login
            FROM users
            ORDER BY created_at DESC
        ''')
    
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

# Mood Records Functions
def save_mood_record(user_id: str, emotion: str, confidence: float, 
                     detection_method: str = 'webcam', notes: str = None) -> bool:
    """Save a mood detection record"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO mood_records (user_id, emotion, confidence, detection_method, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, emotion, confidence, detection_method, notes))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving mood record: {e}")
        return False

def get_mood_records(user_id: str = None, limit: int = 100) -> List[Dict]:
    """Get mood records, optionally filtered by user_id"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute('''
            SELECT mr.*, u.full_name, u.department
            FROM mood_records mr
            JOIN users u ON mr.user_id = u.user_id
            WHERE mr.user_id = ?
            ORDER BY mr.timestamp DESC
            LIMIT ?
        ''', (user_id, limit))
    else:
        cursor.execute('''
            SELECT mr.*, u.full_name, u.department
            FROM mood_records mr
            JOIN users u ON mr.user_id = u.user_id
            ORDER BY mr.timestamp DESC
            LIMIT ?
        ''', (limit,))
    
    records = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return records

def get_mood_statistics(user_id: str = None) -> Dict:
    """Get mood statistics for a user or all users"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute('''
            SELECT 
                emotion,
                COUNT(*) as count,
                AVG(confidence) as avg_confidence,
                MAX(timestamp) as last_detected
            FROM mood_records
            WHERE user_id = ?
            GROUP BY emotion
            ORDER BY count DESC
        ''', (user_id,))
    else:
        cursor.execute('''
            SELECT 
                emotion,
                COUNT(*) as count,
                AVG(confidence) as avg_confidence,
                MAX(timestamp) as last_detected
            FROM mood_records
            GROUP BY emotion
            ORDER BY count DESC
        ''')
    
    stats = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return stats

# Mood History Functions (Manual entries)
def save_mood_history(user_id: str, mood: str, intensity: int, notes: str = None) -> bool:
    """Save manual mood entry (typically by HR)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO mood_history (user_id, mood, intensity, notes)
            VALUES (?, ?, ?, ?)
        ''', (user_id, mood, intensity, notes))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving mood history: {e}")
        return False

def get_mood_history(user_id: str = None, limit: int = 100) -> List[Dict]:
    """Get mood history records"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute('''
            SELECT mh.*, u.full_name, u.department
            FROM mood_history mh
            JOIN users u ON mh.user_id = u.user_id
            WHERE mh.user_id = ?
            ORDER BY mh.timestamp DESC
            LIMIT ?
        ''', (user_id, limit))
    else:
        cursor.execute('''
            SELECT mh.*, u.full_name, u.department
            FROM mood_history mh
            JOIN users u ON mh.user_id = u.user_id
            ORDER BY mh.timestamp DESC
            LIMIT ?
        ''', (limit,))
    
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

# Initialize database when this module is imported
if __name__ == "__main__":
    init_database()
    print("\n✓ Database setup complete!")
    print(f"✓ Database file created at: {DATABASE_PATH}")
    print("\nDefault users created:")
    print("Employees: EMP001 (password: emp123), EMP002 (password: emp123)")
    print("HR: HR001 (password: hr123), HR002 (password: hr123)")
