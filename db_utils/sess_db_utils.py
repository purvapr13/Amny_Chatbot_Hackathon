import sqlite3
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DB path from .env or use default
DB_PATH = os.getenv("SESSION_DB_PATH", "sessions.db")

# Ensure the directory exists
db_directory = os.path.dirname(DB_PATH)
if db_directory and not os.path.exists(db_directory):
    os.makedirs(db_directory)
    print(f"Created directory: {db_directory}")


def create_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                session_data TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    except sqlite3.Error as e:
        print(f"DB error: {e}")
    return conn, cursor


def close_connection(conn):
    if conn:
        conn.close()


def get_session(conn, cursor, session_id: str):
    cursor.execute("SELECT session_data FROM sessions WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    return json.loads(row[0]) if row else []


def save_session(conn, cursor, session_id: str, session_data: list):
    cursor.execute("""
        INSERT INTO sessions (session_id, session_data, last_updated)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(session_id)
        DO UPDATE SET session_data = excluded.session_data,
                      last_updated = CURRENT_TIMESTAMP
    """, (session_id, json.dumps(session_data)))
    conn.commit()


def cleanup_old_sessions(conn, cursor):
    cursor.execute("""
        DELETE FROM sessions
        WHERE last_updated < datetime('now', '-2 hours')
    """)
    deleted = cursor.rowcount
    conn.commit()
    print(f"🧹 Cleaned up {deleted} session(s) older than 2 hours")
