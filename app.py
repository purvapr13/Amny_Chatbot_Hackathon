from flask import Flask, render_template, request, jsonify

# local imports
from model_utils.intent_classification import predict_intent
from model_utils.intent_classification import load_model
from features import dodging, greet, bye

app = Flask(__name__)

load_model()


# Home route (renders the chat widget page)
@app.route('/')
def index():
    return render_template('index.html')


# Chatbot response endpoint
@app.route('/get_response', methods=['POST'])
def get_response():

    try:
        data = request.get_json(force=True)  # <-- force parsing JSON
    except Exception as e:
        return jsonify({"error": "Invalid JSON", "details": str(e)}), 400
    message = data.get("message", "").strip()

    intent, confidence = predict_intent(message)
    show_buttons = None

    if intent == 'dodging':
        response = dodging.get_random_dodge_response()
    elif intent == 'greet':
        response = greet.get_random_greet_response()
        show_buttons = True
    elif intent == 'bye':
        response = bye.get_random_bye_response()
    else:
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

    return jsonify({
        "intent": intent,
        "confidence": round(confidence, 2),
        "response": response,
        "show_buttons": show_buttons
    })

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    score = data.get('feedback')
    print(f"User feedback received ✅: {score}")
    return jsonify({"status": "success"})

@app.route('/get_response_from_button', methods=['POST'])
def get_response_from_button():
    try:
        data = request.get_json(force=True)  # <-- force parsing JSON
    except Exception as e:
        return jsonify({"error": "Invalid JSON", "details": str(e)}), 400
    message = data.get("message", "").strip()
    button_clicked = data.get('button')  # Get the button title (e.g., "Job Search")
    response = None
    # Generate a response based on the button clicked
    if button_clicked == 'Job Search':
        response = "I can help you search for jobs! What type of job are you looking for?"
    elif button_clicked == 'Mentoring':
        response = "Together, we’re unstoppable. Let’s make it happen! 💥"
    elif button_clicked == 'Community events':
        response = "Your energy, your ideas—our community thrives because of YOU! 🌟"
    else:
        intent, confidence = predict_intent(message)

    return jsonify({'response': response})


if __name__ == '__main__':
    app.run(debug=False)

