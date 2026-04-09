# ==============================================================
# MindTrack AI – Flask Backend
# Author: MindTrack AI Team
# Description: REST API for storing and retrieving screen time
#              + mood data using SQLite.
# Run: python app.py
# API Base: http://127.0.0.1:5000
# ==============================================================

print("🔥 FILE IS RUNNING")
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import datetime
import os

# ---------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------
app = Flask(__name__)

# Allow CORS so the HTML frontend can talk to this Flask server.
# In production, restrict origins to your actual domain.
CORS(app)

# Path to the SQLite database file
DB_PATH = os.path.join(os.path.dirname(__file__), 'mindtrack.db')


# ---------------------------------------------------------------
# DATABASE SETUP
# ---------------------------------------------------------------
def init_db():
    """
    Create the SQLite database and the 'logs' table if they
    don't already exist. Called once when the server starts.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT    NOT NULL,
            instagram   INTEGER DEFAULT 0,
            youtube     INTEGER DEFAULT 0,
            whatsapp    INTEGER DEFAULT 0,
            other       INTEGER DEFAULT 0,
            total_minutes INTEGER DEFAULT 0,
            mood        TEXT    NOT NULL,
            points      INTEGER DEFAULT 0
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Database initialised at:", DB_PATH)


def get_db_connection():
    """
    Return a sqlite3 connection with row_factory set so rows
    can be accessed like dictionaries.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us do row['column_name']
    return conn


# ---------------------------------------------------------------
# POINTS CALCULATOR (Gamification Logic)
# ---------------------------------------------------------------
def calculate_points(total_minutes):
    """
    Award points based on how little screen time was used today.
    Fewer minutes = more points = better habit reinforcement.

    Rules:
        < 60 min  → 30 points (Excellent)
        < 120 min → 20 points (Great)
        < 180 min → 10 points (Good)
        < 300 min →  5 points (Fair)
        >= 300 min→  1 point  (At least you logged!)
    """
    if total_minutes < 60:
        return 30
    elif total_minutes < 120:
        return 20
    elif total_minutes < 180:
        return 10
    elif total_minutes < 300:
        return 5
    else:
        return 1


# ---------------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------------

# ---- Health Check ----
@app.route('/', methods=['GET'])
def index():
    """Simple health check endpoint."""
    return jsonify({
        "status": "ok",
        "message": "MindTrack AI backend is running 🧠"
    })


# ---- POST /add_data — Save a new daily log ----
@app.route('/add_data', methods=['POST'])
def add_data():
    """
    Receive JSON data from the frontend form and save it to SQLite.

    Expected JSON body:
    {
        "instagram": 45,
        "youtube":   60,
        "whatsapp":  30,
        "other":     20,
        "mood":      "Happy"
    }

    Returns:
        JSON with success message and points earned.
    """
    data = request.get_json()

    # Validate that JSON was sent
    if not data:
        return jsonify({"error": "No data received. Send JSON."}), 400

    # Extract fields with safe defaults (0 for numbers)
    instagram = int(data.get('instagram', 0))
    youtube   = int(data.get('youtube',   0))
    whatsapp  = int(data.get('whatsapp',  0))
    other     = int(data.get('other',     0))
    mood      = data.get('mood', '').strip()

    # Validate mood
    valid_moods = ['Happy', 'Neutral', 'Stressed', 'Tired']
    if mood not in valid_moods:
        return jsonify({"error": f"Invalid mood. Choose from: {valid_moods}"}), 400

    # Calculate totals
    total_minutes = instagram + youtube + whatsapp + other
    points        = calculate_points(total_minutes)
    date_str      = datetime.datetime.now().isoformat()  # e.g. "2024-01-15T14:30:00"

    # Insert into database
    conn   = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO logs (date, instagram, youtube, whatsapp, other,
                          total_minutes, mood, points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (date_str, instagram, youtube, whatsapp, other,
          total_minutes, mood, points))

    conn.commit()
    conn.close()

    print(f"📝 New log saved: {total_minutes} mins | Mood: {mood} | Points: {points}")

    return jsonify({
        "message":       "Log saved successfully!",
        "points_earned": points,
        "total_minutes": total_minutes,
        "mood":          mood,
        "date":          date_str
    }), 201   # HTTP 201 = Created


# ---- GET /get_data — Retrieve all logs ----
@app.route('/get_data', methods=['GET'])
def get_data():
    """
    Return all stored logs as JSON, ordered by date (oldest first).
    The frontend uses this data to build charts and calculate stats.

    Returns:
        JSON with list of log objects and a count.
    """
    conn   = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM logs ORDER BY date ASC')
    rows = cursor.fetchall()
    conn.close()

    # Convert sqlite3.Row objects to plain Python dicts
    logs = [dict(row) for row in rows]

    return jsonify({
        "count": len(logs),
        "logs":  logs
    }), 200


# ---- DELETE /clear_data — Clear all logs (dev/testing) ----
@app.route('/clear_data', methods=['DELETE'])
def clear_data():
    """
    Delete all records from the logs table.
    Useful for development/testing. Remove this in production!
    """
    conn   = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM logs')
    conn.commit()
    conn.close()

    return jsonify({"message": "All logs cleared."}), 200


# ---------------------------------------------------------------
# RUN SERVER
# ---------------------------------------------------------------
if __name__ == '__main__':
    # Create the database (and table) if not already present
    init_db()

    print("🚀 MindTrack AI backend starting...")
    print("📡 Running at: http://127.0.0.1:5000")
    print("Press CTRL+C to stop.\n")

    # debug=True auto-reloads on code changes (turn off in production)
    app.run(debug=True, host='127.0.0.1', port=5000)
