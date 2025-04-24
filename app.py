from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

# Local imports
from model_utils.intent_classification import predict_intent, load_model
from features import dodging, greet, bye

app = FastAPI()

# Load intent classification model on startup

@app.on_event("startup")
def on_startup():
    load_model()

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


class FeedbackRequest(BaseModel):
    feedback: int


# ----------------------------
# Routes
# ----------------------------

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/get_response")
async def get_response(req: MessageRequest):
    message = req.message.strip()
    intent, confidence = predict_intent(message)
    show_buttons = None

    if intent == "dodging":
        response = dodging.get_random_dodge_response()
    elif intent == "greet":
        response = greet.get_random_greet_response()
        show_buttons = True
    elif intent == "bye":
        response = bye.get_random_bye_response()
    else:
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

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
async def get_response_from_button(req: MessageRequest):
    message = req.message.strip()
    button_clicked = req.button
    response = None

    if button_clicked == "Job Search":
        response = "I can help you search for jobs! What type of job are you looking for?"
    elif button_clicked == "Mentoring":
        response = "Together, we’re unstoppable. Let’s make it happen! 💥"
    elif button_clicked == "Community events":
        response = "Your energy, your ideas—our community thrives because of YOU! 🌟"
    else:
        intent, _ = predict_intent(message)
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=5000)

