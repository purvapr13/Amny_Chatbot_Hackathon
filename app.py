from flask import Flask, render_template, request, jsonify
from intent_classification import predict_intent

app = Flask(__name__)


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

    if intent == "unknown_intent":
        response = "Hmm... I'm not quite sure what you mean. Can you say it differently?"
    else:
        response = f"I understood that as **{intent.replace('_', ' ').title()}**."

    return jsonify({"intent": intent, "confidence": confidence, "response": response})

if __name__ == '__main__':
    app.run(debug=True)
