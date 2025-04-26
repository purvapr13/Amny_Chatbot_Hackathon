import sqlite3
import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

# Local imports
from model_utils.intent_classification import predict_intent, load_model
from features import dodging, greet, bye
from features.faq_rag import load_faq, build_faq_index, query_index, load_demotivated_stories

# Load variables from .env into environment
load_dotenv()

# Get the path for the database from the environment or default to "sessions.db"
DB_PATH = os.getenv("SESSION_DB_PATH", "sessions.db")

# Ensure the directory exists for the SQLite database file
db_directory = os.path.dirname(DB_PATH)
if db_directory and not os.path.exists(db_directory):
    os.makedirs(db_directory)
    print(f"Created directory: {db_directory}")

ml_models = {}


def create_connection():
    """Create and return SQLite connection and cursor."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    try:
        # Create sessions table if not exists
        cursor.execute('''CREATE TABLE IF NOT EXISTS sessions
                          (session_id TEXT PRIMARY KEY, session_data TEXT)''')
        conn.commit()
    except sqlite3.Error as e:
        print(f"DB error: {e}")
    return conn, cursor


def close_connection(conn):
    """Close the SQLite connection."""
    if conn:
        conn.close()


# FastAPI app setup
app = FastAPI()

# Mount static files (for JS, CSS, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Jinja2 templates
templates = Jinja2Templates(directory="templates")


# ----------------------------
# Models
# ----------------------------
class MessageRequest(BaseModel):
    message: str
    button: str | None = None
    session_id: str | None = None


class FeedbackRequest(BaseModel):
    feedback: int


# ----------------------------
# Helper Functions for Session Management with SQLite
# ----------------------------
def get_session(conn, cursor, session_id: str):
    """Retrieve the session data from SQLite."""
    cursor.execute("SELECT session_data FROM sessions WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    if row:
        return json.loads(row[0])
    return []  # Return empty list if no session found


def save_session(conn, cursor, session_id: str, session_data: list):
    """Save the session data to SQLite."""
    cursor.execute("""
        INSERT INTO sessions (session_id, session_data)
        VALUES (?, ?)
        ON CONFLICT(session_id) DO UPDATE SET session_data = excluded.session_data
        """, (session_id, json.dumps(session_data)))
    conn.commit()


# FastAPI Event Handlers for DB Connection
@app.on_event("startup")
async def startup():
    print("🚀 Loading models and embeddings at startup...")
    ml_models["intent_classification"] = load_model()
    faq_data = load_faq()
    success_stories_data = load_demotivated_stories()
    ml_models["index"] = build_faq_index(faq_data, success_stories_data)
    print("✅ Models ready!")

    # Establish database connection and store it in state
    conn, cursor = create_connection()
    app.state.db_conn = conn
    app.state.db_cursor = cursor


@app.on_event("shutdown")
async def shutdown():
    # Close the database connection on shutdown
    close_connection(app.state.db_conn)
    ml_models.clear()


# ----------------------------
# Routes
# ----------------------------

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/get_response")
async def get_response(req: MessageRequest, request: Request):
    message = req.message.strip()
    session_id = req.session_id
    # Access the database connection from FastAPI state
    conn = request.app.state.db_conn
    cursor = request.app.state.db_cursor
    # Load session data from SQLite
    session_data = get_session(conn, cursor, session_id)

    # Append the user message to the session data
    session_data.append({"from": "user", "text": message})

    intent, confidence = predict_intent(message)
    show_buttons = None

    if intent == "dodging":
        response = dodging.get_random_dodge_response()
    elif intent == "greet":
        response = greet.get_random_greet_response()
        show_buttons = True
    elif intent == "bye":
        response = bye.get_random_bye_response()
    elif intent == "faq":
        result = query_index(ml_models['index'], message, is_faq=True)
        response = result["matched_text"]
    elif intent == "demotivated":
        result = query_index(ml_models['index'], message, is_faq=False)
        response = result["matched_text"]
    else:
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

    # Store bot response
    session_data.append({"from": "bot", "text": response})

    # Save the updated session data to SQLite
    save_session(conn, cursor, session_id, session_data)

    return {
        "intent": intent,
        "confidence": round(confidence, 2),
        "response": response,
        "show_buttons": show_buttons
    }


@app.post("/submit_feedback")
def submit_feedback(feedback_req: FeedbackRequest):
    print(f"User feedback received ✅: {feedback_req.feedback}")
    return {"status": "success"}


@app.post("/get_response_from_button")
async def get_response_from_button(req: MessageRequest, request: Request):
    message = req.message.strip()
    session_id = req.session_id
    button_clicked = req.button

    # Access the database connection from FastAPI state
    conn = request.app.state.db_conn
    cursor = request.app.state.db_cursor
    # Load session data from SQLite
    session_data = get_session(conn, cursor, session_id)

    # Append the button clicked to the session
    session_data.append({"from": "user", "text": f"[button: {button_clicked}]"})

    if button_clicked == "Job Search":
        response = "I can help you search for jobs! What type of job are you looking for?"
    elif button_clicked == "Mentoring":
        response = "Together, we’re unstoppable. Let’s make it happen! 💥"
    elif button_clicked == "Community events":
        response = "Your energy, your ideas—our community thrives because of YOU! 🌟"
    else:
        intent, _ = predict_intent(message)
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

    # Store bot response
    session_data.append({"from": "bot", "text": response})

    # Save the updated session data to SQLite
    save_session(conn, cursor, session_id, session_data)

    return {"response": response}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=5000)
