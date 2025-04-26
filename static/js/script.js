// Function to toggle the chatbox visibility
function toggleChatbox(event) {
  const chatbox = document.getElementById('chatbox');
  const chatboxContent = document.getElementById('chatbox-content');
  const chatButton = document.getElementById('chatbot-btn');
  const isVisible = window.getComputedStyle(chatbox).display === 'flex';

  // Show chatbox
  if (!isVisible) {
    chatbox.style.display = 'flex';
    if (window.innerWidth <= 768) chatButton.classList.add('mobile-hidden');

    const visualHeight = Math.round(window.visualViewport?.height || window.innerHeight);
    if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
      chatbox.style.height = `${visualHeight}px`;
    } else {
      chatbox.style.height = `${Math.floor(visualHeight * 0.7)}px`;
    }

    // Show privacy notice if not already shown
    if (!document.getElementById('privacy-notice-block')) {
      const noticeBlock = document.createElement('div');
      noticeBlock.className = 'message-container bot-container';
      noticeBlock.id = 'privacy-notice-block';
      noticeBlock.innerHTML = `
        <div class="message bot" style="
          font-size: 11px;
          font-style: italic;
          border-radius: 12px;
          padding: 8px 12px;
          line-height: 1.4;
          background-color: #f9f9f9;
          color: #777;
        ">
          We respect your privacy. We don't store any sensitive personal information.
          The basic information that you provide to the chatbot will be collected to improve your experience.
        </div>
      `;
      chatboxContent.appendChild(noticeBlock);
    }

  } else {
    chatbox.style.display = 'none';
    chatButton.classList.remove('mobile-hidden');
  }

  // Update chatbox height
  updateChatboxHeight();
  event.stopPropagation();
}

// Close the chatbox if user clicks outside
document.addEventListener('click', function (event) {
  const chatbox = document.getElementById('chatbox');
  const chatButton = document.getElementById('chatbot-btn');
  if (!chatbox.contains(event.target) && event.target !== chatButton) {
    chatbox.style.display = 'none';
    chatButton.classList.remove('mobile-hidden');
  }
});

// Prevent clicks inside the chatbox from closing it
document.getElementById('chatbox').addEventListener('click', function (event) {
  event.stopPropagation();
});

// Add event listener for the 'Enter' key to send messages
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('user-input');
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
});

function closeChatbox() {
  const chatbox = document.getElementById('chatbox');
  const chatButton = document.getElementById('chatbot-btn');
  chatbox.style.display = 'none';
  chatButton.classList.remove('mobile-hidden');
}

function updateChatboxHeight() {
  const chatbox = document.getElementById('chatbox');
  if (!chatbox || chatbox.style.display !== 'flex') return;

  const visualHeight = Math.round(window.visualViewport?.height || window.innerHeight);

  if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
    chatbox.style.height = `${visualHeight}px`;
  } else {
    chatbox.style.height = `${Math.floor(visualHeight * 0.7)}px`;
  }
}

window.addEventListener('resize', updateChatboxHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(updateChatboxHeight, 200);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateChatboxHeight);
}

let privacyNoticeVisible = true;
let feedbackShown = false;
let sessionId = localStorage.getItem('session_id') || generateSessionId();
localStorage.setItem('session_id', sessionId);


function generateSessionId() {
  return 'session-' + Math.random().toString(36).substring(2, 15);
}


async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatContent = document.getElementById('chatbox-content');
  const userText = input.value.trim();
  if (!userText) return;

  const userBlock = document.createElement('div');
  userBlock.className = 'message-container user-container';
  userBlock.innerHTML = `
    <div class="label">You</div>
    <div class="message user">${userText}</div>
  `;
  chatContent.appendChild(userBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
  input.value = '';

  showTypingIndicator(chatContent);

  const response = await fetch('/get_response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userText,
                           session_id: sessionId})
    });

  const data = await response.json();
  const botText = data.response || "I'm here to empower you 💫";
  hideTypingIndicator(chatContent);

  const botBlock = document.createElement('div');
  botBlock.className = 'message-container bot-container';
  botBlock.innerHTML = `
    <div class="label">Amny</div>
    <div class="message bot">${botText}</div>
  `;

  // Render buttons based on intent or backend response
  if (data.show_buttons) {
    let buttonsHTML = '';

    if (data.intent === "job_search") {
      // Render job search specific buttons
      const jobTypes = ["Full-time", "Part-time", "Remote", "All"];
      buttonsHTML = `
        <div class="buttons-container">
          ${jobTypes.map(jobType => `
            <button class="quick-reply" data-button-text="${jobType}" onclick="handleButtonClick(event)">
              ${jobType}
            </button>
          `).join('')}
        </div>
      `;
    } else if (data.intent === "mentorship") {
      // Render mentoring related buttons
      buttonsHTML = `
        <div class="buttons-container">
          <button class="quick-reply" data-button-text="Find a Mentor" onclick="handleButtonClick(event)">
            Sign Up for Mentoring
          </button>
          <button class="quick-reply" data-button-text="Mentoring sessions" onclick="handleButtonClick(event)">
            Learn More About Mentoring
          </button>
        </div>
      `;
    } else if (data.intent === "sessions" || data.intent === 'events') {
      // Render community events related buttons
      buttonsHTML = `
        <div class="buttons-container">
          <button class="quick-reply" data-button-text="View Upcoming Events" onclick="handleButtonClick(event)">
            View Upcoming Events
          </button>
          <button class="quick-reply" data-button-text="Join a Community Event" onclick="handleButtonClick(event)">
            Join a Community Event
          </button>
        </div>
      `;
    } else {
      // Default or fallback buttons (for other intents)
      buttonsHTML = `
        <div class="buttons-container">
          <button class="quick-reply" data-button-text="Job Search" onclick="handleButtonClick(event)">Job Search</button>
          <button class="quick-reply" data-button-text="Mentoring" onclick="handleButtonClick(event)">Mentoring</button>
          <button class="quick-reply" data-button-text="Community events" onclick="handleButtonClick(event)">Community events</button>
        </div>
      `;
    }
    botBlock.innerHTML += buttonsHTML;
  }

  chatContent.appendChild(botBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
  // 🔊 Play beep sound for Amny's message
  document.getElementById('amny-beep').play();
  addFeedbackUI(chatContent);
}

function showTypingIndicator(chatContent) {
  const typingBlock = document.createElement('div');
  typingBlock.className = 'message-container bot-container';
  typingBlock.id = 'typing-block';
  typingBlock.innerHTML = `
    <div class="label">Amny</div>
    <div class="typing-indicator" id="typing-text">....</div>
  `;
  chatContent.appendChild(typingBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
}

function hideTypingIndicator(chatContent) {
  const typing = document.getElementById('typing-block');
  if (typing) typing.remove();
}

function handleButtonClick(event) {
  const chatContent = document.getElementById('chatbox-content');
  const buttonText = event.target.getAttribute('data-button-text');

  const buttons = chatContent.querySelectorAll('.quick-reply');
  buttons.forEach(button => {
    button.disabled = true;
    button.style.backgroundColor = "#ccc";
  });

  event.target.disabled = true;
  event.target.style.backgroundColor = "#ccc";

  const typingBlock = document.createElement('div');
  typingBlock.className = 'message-container bot-container';
  typingBlock.id = 'typing-block';
  typingBlock.innerHTML = `
    <div class="label">Amny</div>
    <div class="typing-indicator" id="typing-text">....</div>
  `;
  chatContent.appendChild(typingBlock);
  chatContent.scrollTop = chatContent.scrollHeight;



  fetch('/get_response_from_button', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "",             // Required by FastAPI model
                           button: buttonText,
                           session_id: sessionId})
        })
    .then(response => response.json())
    .then(data => {
      const typing = document.getElementById('typing-block');
      if (typing) typing.remove();

      const botText = data.response || "I'm here to empower you 💫";

      const botBlock = document.createElement('div');
      botBlock.className = 'message-container bot-container';
      botBlock.innerHTML = `
        <div class="label">Amny</div>
        <div class="message bot">${botText}</div>
      `;

      // If the response includes buttons, render them
      if (data.buttons && data.buttons.length > 0) {
        const buttonsHTML = data.buttons.map(button => `
          <button class="quick-reply" data-button-text="${button}" onclick="handleButtonClick(event)">${button}</button>
        `).join('');

        botBlock.innerHTML += `<div class="buttons-container">${buttonsHTML}</div>`;
      }

      chatContent.appendChild(botBlock);
      chatContent.scrollTop = chatContent.scrollHeight;
      addFeedbackUI(chatContent);
    });
}

function addFeedbackUI(chatContent) {
  const buttons = chatContent.querySelectorAll('.quick-reply');
  const anyVisibleButtons = Array.from(buttons).some(btn => !btn.disabled);

  if (anyVisibleButtons) return;

  feedbackShown = true;

  const feedbackBlock = document.createElement('div');
  feedbackBlock.className = 'message-container bot-container';
  feedbackBlock.innerHTML = `
    <div class="feedback-container">
      <div class="feedback-text">Was this conversation helpful so far?</div>
      <div class="feedback-buttons">
        <i class="fas fa-thumbs-up" onclick="sendFeedback(1, this)"></i>
        <i class="fas fa-thumbs-down" onclick="sendFeedback(0, this)"></i>
      </div>
    </div>
  `;
  chatContent.appendChild(feedbackBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
}

function sendFeedback(score, icon) {
  const container = icon.parentElement;
  container.querySelectorAll('i').forEach(i => {
    i.style.pointerEvents = 'none';
    i.style.opacity = '0.4';
  });

  icon.style.color = score === 1 ? '#4caf50' : '#e53935';
  console.log("User feedback:", score);

  fetch('/submit_feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback: score })
  }).catch(err => console.error('Feedback error:', err));
}

const clientId = "518842382134-df825f3u5oqab9l7linsgrr4h8mhutbo.apps.googleusercontent.com";

window.onload = () => {
  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredentialResponse,
    ux_mode: "popup"
  });

};
function notInterestedAction() {
  console.log("User clicked 'Not Interested'");
  const chatContent = document.getElementById('chatbox-content');
  const authBox = document.getElementById('auth-box');

  // Remove auth box (sign-in prompt)
  authBox.style.display = 'none';

  // Show a message that the user can continue without signing in
  const messageBlock = document.createElement('div');
  messageBlock.className = 'message-container bot-container';
  messageBlock.innerHTML = `
  <div class="label">Amny</div>
  <div class="message bot">No worries! You can continue chatting without signing in. Let me know how I can assist you today ✨</div>
  `;
  chatContent.appendChild(messageBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
}

function handleCredentialResponse(response) {
  console.log("Encoded JWT ID token: " + response.credential);

  const payload = parseJwt(response.credential);
  console.log("User Info:", payload);

  storeToken(response.credential);

  // Hide auth box
  const authBox = document.getElementById("auth-box");
  if (authBox) authBox.style.display = "none";

  // Show welcome message in chat
  const chatbox = document.getElementById("chatbox-content");
  if (chatbox) {
    chatbox.innerHTML += `
      <div class="message-container bot-container">
        <div class="message bot">Welcome, ${payload.name} 👋</div>
      </div>
    `;
  }

  // Show logout buttons
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.style.display = "inline-block";

  const googleSignoutBtn = document.getElementById("google-signout-btn");
  if (googleSignoutBtn) googleSignoutBtn.style.display = "block";
}
window.handleCredentialResponse = handleCredentialResponse;


function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

function showChatbot(token = null) {
  document.getElementById("auth-box").style.display = "none";
  document.getElementById("chat-container").style.display = "block";

  if (token) {
    console.log("Authenticated chatbot session. Token:", token);
    // Optional: personalize chatbot or load user history
  } else {
    console.log("Guest mode chatbot");
  }
}



function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

const token = getCookie("jwt_token");
console.log("JWT Token:", token);

function storeToken(token) {
  console.log(token);
  document.cookie = `jwt_token=${token}; path=/; HttpOnly; Secure; SameSite=Strict`;
  localStorage.setItem('jwt_token', token);
}

// Store chat history in localStorage
function saveChatHistory(userMessage, botResponse) {
  let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
  chatHistory.push({ userMessage, botResponse });
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Load chat history from localStorage
function loadChatHistory() {
  const storedHistory = localStorage.getItem('chatHistory');
  return storedHistory ? JSON.parse(storedHistory) : [];
}

const tokens = localStorage.getItem('jwt_token');
console.log("JWT Token:", tokens);

const chatHistory = localStorage.getItem('chatHistory');
console.log("Chat History:", chatHistory);

function signOut() {
  document.cookie = "jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; HttpOnly; SameSite=Strict";
  console.log("User signed out.,token removed");
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('chatHistory');
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.style.display = "none";

  const googleSignoutBtn = document.getElementById("google-signout-btn");
  if (googleSignoutBtn) googleSignoutBtn.style.display = "none";
  const authBox = document.getElementById("auth-box");
  if (authBox) authBox.style.display = "block";

}
