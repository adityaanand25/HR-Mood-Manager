import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import os
import hashlib
import secrets

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database.db')
BACKUP_PATH = os.path.join(os.path.dirname(__file__), 'database_backup.db')

def get_db_connection():
    """Create and return a database connection with persistence settings"""
    # Ensure database directory exists
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DATABASE_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    
    # Enable WAL mode for better concurrency and crash recovery
    conn.execute('PRAGMA journal_mode=WAL')
    # Enable foreign key constraints
    conn.execute('PRAGMA foreign_keys=ON')
    # Set synchronous mode to FULL for data safety
    conn.execute('PRAGMA synchronous=FULL')
    
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
    
    # Create Tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            assigned_to TEXT NOT NULL,
            assigned_by TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
            priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
            due_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (assigned_to) REFERENCES users (user_id),
            FOREIGN KEY (assigned_by) REFERENCES users (user_id)
        )
    ''')
    
    # Create Leave Requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT NOT NULL,
            leave_type TEXT NOT NULL CHECK(leave_type IN ('sick', 'casual', 'vacation', 'personal', 'emergency')),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
            approved_by TEXT,
            approval_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES users (user_id),
            FOREIGN KEY (approved_by) REFERENCES users (user_id)
        )
    ''')
    
    # Check if any users exist
    cursor.execute('SELECT COUNT(*) FROM users')
    user_count = cursor.fetchone()[0]
    
    if user_count == 0:
        print("\n⚠️  No users found in database.")
        print("📋 You need to create user accounts to use the system.")
        print("💡 Seeding a default HR admin for initial login testing.")
        try:
            # Seed a default HR admin user
            default_user_id = 'admin'
            default_password = 'Admin@123'  # Prompt to change after first login
            default_role = 'hr'
            default_full_name = 'Administrator'
            default_email = 'admin@example.com'
            default_department = 'HR'
            hashed_password = hash_password(default_password)
            cursor.execute('''
                INSERT INTO users (user_id, password, role, full_name, email, department)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (default_user_id, hashed_password, default_role, default_full_name, default_email, default_department))
            conn.commit()
            print("✓ Default admin user created: user_id='admin', password='Admin@123'")
        except Exception as e:
            print(f"⚠️ Failed to seed default admin: {e}")
    
    conn.commit()
    conn.close()
    
    # Create a backup after initialization
    create_backup()
    print(f"✓ Database initialized successfully at: {DATABASE_PATH}")
    print(f"✓ Database backup created at: {BACKUP_PATH}")

def create_backup():
    """Create a backup of the database"""
    try:
        import shutil
        shutil.copy2(DATABASE_PATH, BACKUP_PATH)
        print(f"✓ Database backup created: {BACKUP_PATH}")
        return True
    except Exception as e:
        print(f"⚠️ Warning: Could not create backup: {e}")
        return False

def restore_from_backup():
    """Restore database from backup if main database is corrupted"""
    try:
        if os.path.exists(BACKUP_PATH):
            import shutil
            shutil.copy2(BACKUP_PATH, DATABASE_PATH)
            print(f"✓ Database restored from backup: {BACKUP_PATH}")
            return True
        else:
            print("⚠️ No backup file found")
            return False
    except Exception as e:
        print(f"❌ Error restoring from backup: {e}")
        return False

def hash_password(password: str) -> str:
    """Hash a password using SHA-256 with a salt"""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{pwd_hash}"

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    try:
        salt, pwd_hash = hashed.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == pwd_hash
    except ValueError:
        # Handle old plain text passwords during migration
        return password == hashed

# User Management Functions
def authenticate_user(user_id: str, password: str) -> Optional[Dict]:
    """Authenticate a user and return their details"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT user_id, password, role, full_name, email, department
        FROM users
        WHERE user_id = ?
    ''', (user_id,))
    
    user = cursor.fetchone()
    
    if user and verify_password(password, user['password']):
        # Update last login
        cursor.execute('''
            UPDATE users SET last_login = CURRENT_TIMESTAMP
            WHERE user_id = ?
        ''', (user_id,))
        conn.commit()
        
        # Return user details without password
        result = {
            'user_id': user['user_id'],
            'role': user['role'], 
            'full_name': user['full_name'],
            'email': user['email'],
            'department': user['department']
        }
    else:
        result = None
    
    conn.close()
    return result

def create_user(user_id: str, password: str, role: str, full_name: str, 
                email: str, department: str = None) -> Dict[str, any]:
    """Create a new user with hashed password"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Hash the password
        hashed_password = hash_password(password)
        
        cursor.execute('''
            INSERT INTO users (user_id, password, role, full_name, email, department)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, hashed_password, role, full_name, email, department))
        
        conn.commit()
        conn.close()
        print(f"✓ User created successfully: {user_id} ({full_name})")
        return {'success': True, 'message': 'User created successfully'}
    except sqlite3.IntegrityError as e:
        if 'user_id' in str(e):
            return {'success': False, 'message': 'User ID already exists'}
        elif 'email' in str(e):
            return {'success': False, 'message': 'Email already exists'}
        else:
            return {'success': False, 'message': 'User creation failed'}

def update_user_password(user_id: str, new_password: str) -> bool:
    """Update a user's password"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        hashed_password = hash_password(new_password)
        
        cursor.execute('''
            UPDATE users SET password = ? WHERE user_id = ?
        ''', (hashed_password, user_id))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            print(f"✓ Password updated for user: {user_id}")
            return True
        else:
            conn.close()
            return False
    except Exception as e:
        print(f"❌ Error updating password: {e}")
        return False

def delete_user(user_id: str) -> bool:
    """Delete a user (use with caution)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            print(f"✓ User deleted: {user_id}")
            return True
        else:
            conn.close()
            return False
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
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
    """Save a mood detection record with enhanced persistence"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Begin transaction
        conn.execute('BEGIN IMMEDIATE')
        
        cursor.execute('''
            INSERT INTO mood_records (user_id, emotion, confidence, detection_method, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, emotion, confidence, detection_method, notes))
        
        # Commit transaction
        conn.commit()
        
        # Create backup every 10 records
        cursor.execute('SELECT COUNT(*) FROM mood_records')
        count = cursor.fetchone()[0]
        if count % 10 == 0:
            create_backup()
            
        print(f"✓ Mood record saved: {emotion} for user {user_id} (confidence: {confidence}%)")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error saving mood record: {e}")
        return False
    finally:
        if conn:
            conn.close()

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
    """Save manual mood entry (typically by HR) with enhanced persistence"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Begin transaction
        conn.execute('BEGIN IMMEDIATE')
        
        cursor.execute('''
            INSERT INTO mood_history (user_id, mood, intensity, notes)
            VALUES (?, ?, ?, ?)
        ''', (user_id, mood, intensity, notes))
        
        # Commit transaction
        conn.commit()
        
        print(f"✓ Mood history saved: {mood} (intensity: {intensity}) for user {user_id}")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error saving mood history: {e}")
        return False
    finally:
        if conn:
            conn.close()

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

# Task Management Functions
def create_task(title: str, description: str, assigned_to: str, assigned_by: str, 
                priority: str = 'medium', due_date: str = None) -> Dict[str, any]:
    """Create a new task"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (title, description, assigned_to, assigned_by, priority, due_date))
        
        task_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✓ Task created successfully: {title} (ID: {task_id})")
        return {'success': True, 'message': 'Task created successfully', 'task_id': task_id}
    except Exception as e:
        print(f"❌ Error creating task: {e}")
        return {'success': False, 'message': str(e)}

def get_tasks(user_id: str = None, status: str = None, assigned_by: str = None) -> List[Dict]:
    """Get tasks with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT t.*, 
               u_to.full_name as assigned_to_name,
               u_by.full_name as assigned_by_name
        FROM tasks t
        JOIN users u_to ON t.assigned_to = u_to.user_id
        JOIN users u_by ON t.assigned_by = u_by.user_id
        WHERE 1=1
    '''
    params = []
    
    if user_id:
        query += ' AND t.assigned_to = ?'
        params.append(user_id)
    
    if status:
        query += ' AND t.status = ?'
        params.append(status)
        
    if assigned_by:
        query += ' AND t.assigned_by = ?'
        params.append(assigned_by)
    
    query += ' ORDER BY t.created_at DESC'
    
    cursor.execute(query, params)
    tasks = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tasks

def update_task_status(task_id: int, status: str, user_id: str = None) -> bool:
    """Update task status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user has permission to update (either assigned to them or they're HR)
        if user_id:
            cursor.execute('''
                SELECT t.assigned_to, u.role 
                FROM tasks t
                JOIN users u ON u.user_id = ?
                WHERE t.id = ?
            ''', (user_id, task_id))
            result = cursor.fetchone()
            
            if not result or (result['assigned_to'] != user_id and result['role'] != 'hr'):
                conn.close()
                return False
        
        # Update task status
        update_query = '''
            UPDATE tasks 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
        '''
        params = [status]
        
        if status == 'completed':
            update_query += ', completed_at = CURRENT_TIMESTAMP'
        
        update_query += ' WHERE id = ?'
        params.append(task_id)
        
        cursor.execute(update_query, params)
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            print(f"✓ Task {task_id} status updated to: {status}")
            return True
        else:
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ Error updating task status: {e}")
        return False

def delete_task(task_id: int, user_id: str = None) -> bool:
    """Delete a task (HR only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user is HR
        if user_id:
            cursor.execute('SELECT role FROM users WHERE user_id = ?', (user_id,))
            result = cursor.fetchone()
            if not result or result['role'] != 'hr':
                conn.close()
                return False
        
        cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            print(f"✓ Task {task_id} deleted")
            return True
        else:
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ Error deleting task: {e}")
        return False

def get_task_statistics(user_id: str = None) -> Dict:
    """Get task statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_id:
        # Stats for specific user
        cursor.execute('''
            SELECT 
                status,
                COUNT(*) as count
            FROM tasks
            WHERE assigned_to = ?
            GROUP BY status
        ''', (user_id,))
    else:
        # Overall stats
        cursor.execute('''
            SELECT 
                status,
                COUNT(*) as count
            FROM tasks
            GROUP BY status
        ''')
    
    status_counts = {}
    for row in cursor.fetchall():
        status_counts[row['status']] = row['count']
    
    # Get priority distribution
    if user_id:
        cursor.execute('''
            SELECT 
                priority,
                COUNT(*) as count
            FROM tasks
            WHERE assigned_to = ? AND status != 'completed'
            GROUP BY priority
        ''', (user_id,))
    else:
        cursor.execute('''
            SELECT 
                priority,
                COUNT(*) as count
            FROM tasks
            WHERE status != 'completed'
            GROUP BY priority
        ''')
    
    priority_counts = {}
    for row in cursor.fetchall():
        priority_counts[row['priority']] = row['count']
    
    conn.close()
    
    return {
        'status_counts': status_counts,
        'priority_counts': priority_counts,
        'total': sum(status_counts.values()),
        'pending': status_counts.get('pending', 0),
        'in_progress': status_counts.get('in_progress', 0),
        'completed': status_counts.get('completed', 0)
    }

# Leave Management Functions
def create_leave_request(employee_id: str, leave_type: str, start_date: str, 
                        end_date: str, reason: str) -> Dict[str, any]:
    """Create a new leave request"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
            VALUES (?, ?, ?, ?, ?)
        ''', (employee_id, leave_type, start_date, end_date, reason))
        
        leave_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✓ Leave request created: {leave_type} for {employee_id} (ID: {leave_id})")
        return {'success': True, 'message': 'Leave request created successfully', 'leave_id': leave_id}
    except Exception as e:
        print(f"❌ Error creating leave request: {e}")
        return {'success': False, 'message': str(e)}

def get_leave_requests(employee_id: str = None, status: str = None) -> List[Dict]:
    """Get leave requests with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT lr.*, 
               u_emp.full_name as employee_name,
               u_emp.department as employee_department,
               u_app.full_name as approved_by_name
        FROM leave_requests lr
        JOIN users u_emp ON lr.employee_id = u_emp.user_id
        LEFT JOIN users u_app ON lr.approved_by = u_app.user_id
        WHERE 1=1
    '''
    params = []
    
    if employee_id:
        query += ' AND lr.employee_id = ?'
        params.append(employee_id)
    
    if status:
        query += ' AND lr.status = ?'
        params.append(status)
    
    query += ' ORDER BY lr.created_at DESC'
    
    cursor.execute(query, params)
    leaves = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return leaves

def update_leave_status(leave_id: int, status: str, approved_by: str, 
                       approval_notes: str = None) -> bool:
    """Update leave request status (approve/reject)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE leave_requests 
            SET status = ?, approved_by = ?, approval_notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (status, approved_by, approval_notes, leave_id))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            print(f"✓ Leave request {leave_id} status updated to: {status}")
            return True
        else:
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ Error updating leave status: {e}")
        return False

def delete_leave_request(leave_id: int, user_id: str) -> bool:
    """Delete a leave request (employee can delete pending requests)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user owns the leave request and it's still pending
        cursor.execute('''
            SELECT employee_id, status FROM leave_requests WHERE id = ?
        ''', (leave_id,))
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            return False
            
        # Allow deletion only if user is the employee and status is pending
        if result['employee_id'] != user_id or result['status'] != 'pending':
            conn.close()
            return False
        
        cursor.execute('DELETE FROM leave_requests WHERE id = ?', (leave_id,))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            print(f"✓ Leave request {leave_id} deleted")
            return True
        else:
            conn.close()
            return False
            
    except Exception as e:
        print(f"❌ Error deleting leave request: {e}")
        return False

def get_leave_statistics(employee_id: str = None) -> Dict:
    """Get leave statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if employee_id:
        # Stats for specific employee
        cursor.execute('''
            SELECT 
                status,
                COUNT(*) as count
            FROM leave_requests
            WHERE employee_id = ?
            GROUP BY status
        ''', (employee_id,))
    else:
        # Overall stats
        cursor.execute('''
            SELECT 
                status,
                COUNT(*) as count
            FROM leave_requests
            GROUP BY status
        ''')
    
    status_counts = {}
    for row in cursor.fetchall():
        status_counts[row['status']] = row['count']
    
    # Get leave type distribution
    if employee_id:
        cursor.execute('''
            SELECT 
                leave_type,
                COUNT(*) as count
            FROM leave_requests
            WHERE employee_id = ?
            GROUP BY leave_type
        ''', (employee_id,))
    else:
        cursor.execute('''
            SELECT 
                leave_type,
                COUNT(*) as count
            FROM leave_requests
            GROUP BY leave_type
        ''')
    
    type_counts = {}
    for row in cursor.fetchall():
        type_counts[row['leave_type']] = row['count']
    
    conn.close()
    
    return {
        'status_counts': status_counts,
        'type_counts': type_counts,
        'total': sum(status_counts.values()),
        'pending': status_counts.get('pending', 0),
        'approved': status_counts.get('approved', 0),
        'rejected': status_counts.get('rejected', 0)
    }

# Initialize database when this module is imported
if __name__ == "__main__":
    init_database()
    print("\n✓ Database setup complete!")
    print(f"✓ Database file created at: {DATABASE_PATH}")
    print("\nDefault users created:")
    print("Employees: EMP001 (password: emp123), EMP002 (password: emp123)")
    print("HR: HR001 (password: hr123), HR002 (password: hr123)")
