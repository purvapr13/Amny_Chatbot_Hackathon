import random

greeting_messages = [
    "Hi there! 👋 Let’s find the right job for you today. 💼",
    "Hello! 😊 Ready to explore new career opportunities?",
    "Hey! 🌸 Let’s take the next step in your career journey.",
    "Hi! 🙌 Let’s make your goals a little more real today.",
    "Glad you’re here! 💖 Let’s get started on something great.",
    "Nice to see you! 👩‍💻 Let’s discover jobs that fit your life.",
    "Hey there! 💫 You’re in the right place to grow and thrive.",
    "Hello! 🌟 Let’s focus on your goals — one step at a time.",
    "Hi! 💼 Let’s work on something amazing together.",
    "Hey! 💬 I’m here to help you find what truly fits your life.",
    "Hey there! 👋 Ready to find your next career step? 💼",
    "Hello! 💖 Let’s make your career dreams happen. 🚀",
    "Hi! 🌟 Your next big opportunity is waiting. Let’s go! 💼",
    "Hey! 💬 Ready to explore new jobs? Let’s dive in! 🌟",
    "Hello! 🌸 Let’s find something amazing for you today. 💡",
    "Hi there! 💼 Let’s work on your future, step by step. 💪",
    "Hey! 👩‍💻 Ready to discover your dream job? 🌟",
    "Hello! 🌈 Let's find a job that fits YOU perfectly. 💼",
    "Hi! 💖 Time to start something great. Let’s get moving! 🌟",
    "Hey there! 💫 Let’s make your next career move count. 🚀",
    "Hi! 🙌 Let’s find the perfect job for you today. 💼",
    "Hello! 🌟 Ready to unlock your career potential? 🔓",
    "Hey! 👋 Let’s get you closer to your career goals. 🎯",
    "Hi! 🌱 Let’s take the next step in your career. 💼",
    "Hey! 💖 Let’s explore the best opportunities for you. ✨"
]


def get_random_greet_response():
    return random.choice(greeting_messages)