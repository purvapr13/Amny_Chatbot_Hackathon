from features import dodging, greet, bye
from features.faq_rag import query_index

def handle_intent(intent: str, message: str, ml_models: dict):
    show_buttons = False

    if intent == "dodging":
        response = dodging.get_random_dodge_response()
    elif intent == "greet":
        response = greet.get_random_greet_response()
        show_buttons = True
    elif intent == "bye":
        response = bye.get_random_bye_response()
        show_buttons = False
    elif intent == "faq":
        result = query_index(ml_models["index"], message, is_faq=True)
        response = result["matched_text"]
        show_buttons = False
    elif intent == "demotivated":
        result = query_index(ml_models["index"], message, is_faq=False)
        response = result["matched_text"]
        show_buttons = False
    elif intent == "job_search":
        response = "I can help you search for jobs! What type of job are you looking for?"
        show_buttons = True
    elif intent == "mentorship":
        response = "Together, we’re unstoppable. Let’s make it happen! 💥"
        show_buttons = True
    elif intent == "events" or intent == "sessions":
        response = "Would you like to take the next step in your journey with a session or community event?"
        show_buttons = True
    else:
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

    return response, show_buttons
