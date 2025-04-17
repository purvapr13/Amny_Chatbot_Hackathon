from flask import Flask, render_template, request, jsonify
from model_utils.intent_classification import load_model

app = Flask(__name__)

load_model()


# Home route (renders the chat widget page)
@app.route('/')
def index():
    return render_template('index.html')


# Chatbot response endpoint
@app.route('/get_response', methods=['POST'])
def get_response():
    # local imports
    from model_utils.intent_classification import predict_intent

    try:
        data = request.get_json(force=True)  # <-- force parsing JSON
    except Exception as e:
        return jsonify({"error": "Invalid JSON", "details": str(e)}), 400
    message = data.get("message", "").strip()

    intent, confidence = predict_intent(message)

    if confidence < 0.6:  # Optional fallback
        response = "Hmm... I'm not sure what you mean. Could you say that differently?"
        intent = "unknown_intent"
    if intent == 'greet':
        response = ("Hello, I am Amny, please tell me what are you looking for today?"
                    "\nYou can find some job listings, mentorship for career change etc.")
    else:
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

    return jsonify({
        "intent": intent,
        "confidence": round(confidence, 2),
        "response": response
    })

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    score = data.get('feedback')
    print(f"User feedback received ✅: {score}")
    return jsonify({"status": "success"})


if __name__ == '__main__':
    app.run(debug=False)

