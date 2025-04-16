from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


# Home route (renders the chat widget page)
@app.route('/')
def index():
    return render_template('index.html')


# Chatbot response endpoint
@app.route('/get_response', methods=['POST'])
def get_response():
    user_message = request.json.get('message')

    # Simple logic for generating a response
    if 'hello' in user_message.lower():
        bot_response = "Hi! How can I assist you today?"
    elif 'bye' in user_message.lower():
        bot_response = "See you again, Dear!"
    else:
        bot_response = "Sorry, I didn't quite understand that."

    return jsonify({'response': bot_response})


if __name__ == '__main__':
    app.run(debug=True)
