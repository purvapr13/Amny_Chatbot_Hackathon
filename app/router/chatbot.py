from fastapi import APIRouter, Request
from app.schemas import MessageRequest, FeedbackRequest
from db_utils import sess_db_utils
from model_utils.intent_classification import predict_intent
from app.intent_handler import handle_intent


router = APIRouter()


@router.post("/get_response")
async def get_response(req: MessageRequest, request: Request):
    message = req.message.strip()
    session_id = req.session_id
    conn = request.app.state.db_conn
    cursor = request.app.state.db_cursor
    session_data = sess_db_utils.get_session(conn, cursor, session_id)
    session_data.append({"from": "user", "text": message})

    intent, confidence = predict_intent(message)
    response, show_buttons = handle_intent(intent, message, request.app.state.ml_models)

    session_data.append({"from": "bot", "text": response})

    # ✅ Trim session data to last 10 messages
    session_data = session_data[-10:]
    sess_db_utils.save_session(conn, cursor, session_id, session_data)

    return {
        "intent": intent,
        "confidence": round(confidence, 2),
        "response": response,
        "show_buttons": show_buttons
    }

@router.post("/submit_feedback")
def submit_feedback(feedback_req: FeedbackRequest):
    print(f"User feedback received ✅: {feedback_req.feedback}")
    return {"status": "success"}

@router.post("/get_response_from_button")
async def get_response_from_button(req: MessageRequest, request: Request):
    message = req.message.strip()
    session_id = req.session_id
    button_clicked = req.button
    conn = request.app.state.db_conn
    cursor = request.app.state.db_cursor
    session_data = sess_db_utils.get_session(conn, cursor, session_id)
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
    sess_db_utils.save_session(conn, cursor, session_id, session_data)

    return response_data
