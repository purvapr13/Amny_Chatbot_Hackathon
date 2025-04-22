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

// Sign-out functionality
function handleSignOut() {
  google.accounts.id.disableAutoSelect(); // Clear session
  document.getElementById('google-signout-btn').style.display = 'none'; // Hide sign-out button
  console.log("Signed out.");
}

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
    body: JSON.stringify({ message: userText })
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

  if (data.show_buttons) {
    const buttonsHTML = `
      <div class="buttons-container">
        <button class="quick-reply" data-button-text="Job Search" onclick="handleButtonClick(event)">Job Search</button>
        <button class="quick-reply" data-button-text="Mentoring" onclick="handleButtonClick(event)">Mentoring</button>
        <button class="quick-reply" data-button-text="Community events" onclick="handleButtonClick(event)">Community events</button>
      </div>
    `;
    botBlock.innerHTML += buttonsHTML;
  }

  chatContent.appendChild(botBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
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
    body: JSON.stringify({ button: buttonText })
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

  document.getElementById("google-signin-btn").addEventListener("click", () => {
    google.accounts.id.prompt(); // triggers the popup
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

  authToken = response.credential;

  const payload = parseJwt(response.credential);
  console.log("User Info:", payload);

  // Hide login, show welcome
  document.getElementById("auth-box").style.display = "none";
  const chatbox = document.getElementById("chatbox-content");
  chatbox.innerHTML += `<div class="message-container bot-container">
    <div class="message bot">Welcome, ${payload.name} 👋</div>
  </div>`;

  // Show Sign-Out button
  document.getElementById("google-signout-btn").style.display = "block";
  console.log("Sign-out button displayed.");

  // Add event listener for sign-out dynamically when user is logged in
  document.getElementById("google-signout-btn").addEventListener("click", signOut);
  console.log("Sign-out button displayed.");
}

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
    // Optionally, personalize chatbot or load user history
  } else {
    console.log("Guest mode chatbot");
  }
}

function signOut() {
  console.log("Sign-out triggered");

    if (!authToken) {
    console.log("No token found, user might not be logged in.");
    return;
    }

  // Sign out from Google by revoking the token
  google.accounts.id.revoke(authToken, function() {
    console.log("User signed out from Google");

    // Clear the chat history
    const chatbox = document.getElementById("chatbox-content");
    chatbox.innerHTML = ''; // Clear chat history

    // Show the sign-out confirmation message
    const logoutMessageBlock = document.createElement('div');
    logoutMessageBlock.className = 'message-container bot-container';
    logoutMessageBlock.innerHTML = `
      <div class="label">Amny</div>
      <div class="message bot">You have successfully logged out. See you next time! 👋</div>
    `;
    chatbox.appendChild(logoutMessageBlock);
    chatbox.scrollTop = chatbox.scrollHeight; // Scroll to the new message

    // Hide the chat container and show the auth box (sign-in box)
    document.getElementById("chat-container").style.display = "none";  // Hide the chat container
    document.getElementById("auth-box").style.display = "block";  // Show the sign-in box

    // Hide the Sign-Out button
    document.getElementById("google-signout-btn").style.display = "none";  // Hide the sign-out button

    console.log("User signed out.");
  });
}


