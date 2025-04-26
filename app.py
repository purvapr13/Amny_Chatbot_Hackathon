from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Local imports
from db_utils import db_utils
from model_utils.intent_classification import predict_intent, load_model
from features import dodging, greet, bye
from features.faq_rag import load_faq, build_faq_index, query_index, load_demotivated_stories

ml_models = {}


templates = Jinja2Templates(directory="templates")


class MessageRequest(BaseModel):
    message: str
    button: str | None = None
    session_id: str | None = None


class FeedbackRequest(BaseModel):
    feedback: int


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Loading models and embeddings at startup...")
    ml_models["intent_classification"] = load_model()
    faq_data = load_faq()
    success_stories_data = load_demotivated_stories()
    ml_models["index"] = build_faq_index(faq_data, success_stories_data)
    print("✅ Models ready!")

    # Establish DB connection
    conn, cursor = db_utils.create_connection()
    app.state.db_conn = conn
    app.state.db_cursor = cursor
    db_utils.cleanup_old_sessions(conn, cursor)

    yield  # Application runs here

    # Cleanup
    db_utils.close_connection(conn)
    ml_models.clear()

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/get_response")
async def get_response(req: MessageRequest, request: Request):
    message = req.message.strip()
    session_id = req.session_id
    conn = request.app.state.db_conn
    cursor = request.app.state.db_cursor
    session_data = db_utils.get_session(conn, cursor, session_id)
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
        result = query_index(ml_models["index"], message, is_faq=True)
        response = result["matched_text"]
    elif intent == "demotivated":
        result = query_index(ml_models["index"], message, is_faq=False)
        response = result["matched_text"]
    elif intent == "job_search":
        response = "I can help you search for jobs! What type of job are you looking for?"
        show_buttons = True
    elif intent == "mentorship":
        response = "Together, we’re unstoppable. Let’s make it happen! 💥"
        show_buttons = True
    elif intent == "events" or "sessions":
        response = "Would you like to take the next step in your journey with a session or community event?"
        show_buttons = True
    else:
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

    session_data.append({"from": "bot", "text": response})

    # ✅ Trim session data to last 10 messages
    session_data = session_data[-10:]
    db_utils.save_session(conn, cursor, session_id, session_data)

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
    conn = request.app.state.db_conn
    cursor = request.app.state.db_cursor
    session_data = db_utils.get_session(conn, cursor, session_id)
    session_data.append({"from": "user", "text": f"[button: {button_clicked}]"})
    response = None

    if button_clicked == "Job Search":
        msg = "I can help you search for jobs! What type of job are you looking for?"
        job_types = ["Full-time", "Part-time", "Remote", "All"]
        response_data = {
            "response": msg,
            "buttons": job_types  # send the data to frontend for rendering buttons
        }
    elif button_clicked == "Mentoring":
        response = "Together, we’re unstoppable. Let’s make it happen! 💥"
        response_data = {"response": response}
    elif button_clicked == "Community events":
        response = "Your energy, your ideas—our community thrives because of YOU! 🌟"
        response_data = {"response": response}
    else:
        intent, _ = predict_intent(message)
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."
        response_data = {"response": response}

    # If response is None (in any case), set a default message
    if response is None:
        response = "I didn't quite get that. Could you try again?"

    session_data.append({"from": "bot", "text": response})

    # ✅ Trim session data to last 10 messages
    session_data = session_data[-10:]
    db_utils.save_session(conn, cursor, session_id, session_data)

    return response_data


class JobSearchOptionsResponse(BaseModel):
    options: list[str]


@app.post("/get_job_search_options")
async def get_job_search_options():
    job_search_options = ["Full-time", "Part-time", "Remote", "All"]
    return JobSearchOptionsResponse(options=job_search_options)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=5000)
