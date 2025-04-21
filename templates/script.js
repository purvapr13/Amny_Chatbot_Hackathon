
function toggleChatbox(event) {
  const chatbox = document.getElementById('chatbox');
  const isVisible = chatbox.style.display === 'flex';
  chatbox.style.display = isVisible ? 'none' : 'flex';
  event.stopPropagation();
}

document.addEventListener('click', function (event) {
  const chatbox = document.getElementById('chatbox');
  const chatButton = document.getElementById('chatbot-btn');
  if (!chatbox.contains(event.target) && event.target !== chatButton) {
    chatbox.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('user-input');
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
});

async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatContent = document.getElementById('chatbox-content');
  const userText = input.value.trim();
  if (!userText) return;

  // Display user's message
  const userBlock = document.createElement('div');
  userBlock.className = 'message-container user-container';
  userBlock.innerHTML = `
        <div class="label">You</div>
        <div class="message user">${userText}</div>
      `;
  chatContent.appendChild(userBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
  input.value = '';

  // Show typing indicator
  showTypingIndicator(chatContent);

  // Get bot response from server
  const response = await fetch('/get_response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userText })
  });

  const data = await response.json();
  const botText = data.response || "I'm here to empower you 💫";

  // Hide typing indicator
  hideTypingIndicator(chatContent);

  // Show real bot message and quick reply buttons
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
}


// Show typing indicator
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

// Hide typing indicator
function hideTypingIndicator(chatContent) {
  const typing = document.getElementById('typing-block');
  if (typing) typing.remove();
}

// Handle Quick replies button clicks
function handleButtonClick(event) {
  const chatContent = document.getElementById('chatbox-content');
  const buttonText = event.target.getAttribute('data-button-text');

  // Disable all buttons in the container
  const buttons = chatContent.querySelectorAll('.quick-reply');
  buttons.forEach(button => {
    button.disabled = true;
    button.style.backgroundColor = "#ccc";  // Change the background color to indicate it's disabled
  });

  // Disable the clicked button and set the text to the original label
  event.target.disabled = true;
  event.target.style.backgroundColor = "#ccc";  // Change the background color to indicate it's disabled
  event.target.innerText = event.target.getAttribute('data-button-text');  // Keep the original button text

  // Show a loading indicator while waiting for the backend response
  const typingBlock = document.createElement('div');
  typingBlock.className = 'message-container bot-container';
  typingBlock.id = 'typing-block';
  typingBlock.innerHTML = `
        <div class="label">Amny</div>
        <div class="typing-indicator" id="typing-text">....</div>
      `;
  chatContent.appendChild(typingBlock);
  chatContent.scrollTop = chatContent.scrollHeight;

  // Send the button text to the backend
  fetch('/get_response_from_button', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ button: buttonText })  // Pass the button text
  })
    .then(response => response.json())
    .then(data => {
      // Remove the typing indicator
      const typing = document.getElementById('typing-block');
      if (typing) typing.remove();

      // Show the backend response (bot's answer)
      const botText = data.response || "I'm here to empower you 💫";  // Default message in case no response is received

      const botBlock = document.createElement('div');
      botBlock.className = 'message-container bot-container';
      botBlock.innerHTML = `
          <div class="label">Amny</div>
          <div class="message bot">${botText}</div>
        `;
      chatContent.appendChild(botBlock);
      chatContent.scrollTop = chatContent.scrollHeight;
    });
}




function sendFeedback(score, icon) {
  const container = icon.parentElement;
  container.querySelectorAll('i').forEach(i => {
    i.style.pointerEvents = 'none';
    i.style.opacity = '0.4';
  });

  icon.style.color = score === 1 ? '#4caf50' : '#e53935';
  console.log("User feedback:", score);

  // Optional: send to backend
  fetch('/submit_feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback: score })
  }).catch(err => console.error('Feedback error:', err));
}

function handleGoogleSignIn() {
  gapi.load('auth2', function () {
    const auth2 = gapi.auth2.init({
      client_id: '518842382134-df825f3u5oqab9l7linsgrr4h8mhutbo.apps.googleusercontent.com',
    });

    auth2.signIn().then(function (googleUser) {
      const profile = googleUser.getBasicProfile();
      console.log('Name: ' + profile.getName());
      console.log('Email: ' + profile.getEmail());
      console.log('ID Token: ' + googleUser.getAuthResponse().id_token);

      // Show user's name in chatbox header
      document.getElementById("chatbox-header").innerText = `Hi, ${profile.getGivenName()}! Ask Amny`;

      // Optional: hide sign-in button
      document.getElementById("google-signin-btn").style.display = 'none';
    }).catch(function (error) {
      console.error("Google Sign-In error", error);
    });
  });
}


gapi.load('auth2', function () {
  gapi.auth2.init({
    client_id: '518842382134-df825f3u5oqab9l7linsgrr4h8mhutbo.apps.googleusercontent.com'
  }).then(function (auth2) {
    auth2.attachClickHandler(document.getElementById('google-signin-btn'), {}, onSignIn, function (error) {
      console.log(JSON.stringify(error, undefined, 2));
    });
  });
});


function toggleChatbox(event) {
  const chatbox = document.getElementById('chatbox');
  const chatboxContent = document.getElementById('chatbox-content');
  const isVisible = window.getComputedStyle(chatbox).display === 'flex';

  // Show chatbox
  if (!isVisible) {
    chatbox.style.display = 'flex';

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
  }

  event.stopPropagation();
}

document.addEventListener('click', function (event) {
  const chatbox = document.getElementById('chatbox');
  const chatButton = document.getElementById('chatbot-btn');
  if (!chatbox.contains(event.target) && event.target !== chatButton) {
    chatbox.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('user-input');
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
});

let privacyNoticeVisible = true;

async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatContent = document.getElementById('chatbox-content');
  const userText = input.value.trim();
  if (!userText) return;

  // Display user's message
  const userBlock = document.createElement('div');
  userBlock.className = 'message-container user-container';
  userBlock.innerHTML = `
  <div class="label">You</div>
  <div class="message user">${userText}</div>
  `;
  chatContent.appendChild(userBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
  input.value = '';

  // Show typing indicator
  showTypingIndicator(chatContent);

  // Get bot response from server
  const response = await fetch('/get_response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userText })
  });

  const data = await response.json();
  const botText = data.response || "I'm here to empower you 💫";

  // Hide typing indicator
  hideTypingIndicator(chatContent);

  // Show real bot message and quick reply buttons
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
}


// Show typing indicator
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

// Hide typing indicator
function hideTypingIndicator(chatContent) {
  const typing = document.getElementById('typing-block');
  if (typing) typing.remove();
}

// Handle Quick replies button clicks
function handleButtonClick(event) {
  const chatContent = document.getElementById('chatbox-content');
  const buttonText = event.target.getAttribute('data-button-text');

  // Disable all buttons in the container
  const buttons = chatContent.querySelectorAll('.quick-reply');
  buttons.forEach(button => {
    button.disabled = true;
    button.style.backgroundColor = "#ccc";  // Change the background color to indicate it's disabled
  });

  // Disable the clicked button and set the text to the original label
  event.target.disabled = true;
  event.target.style.backgroundColor = "#ccc";  // Change the background color to indicate it's disabled
  event.target.innerText = event.target.getAttribute('data-button-text');  // Keep the original button text

  // Show a loading indicator while waiting for the backend response
  const typingBlock = document.createElement('div');
  typingBlock.className = 'message-container bot-container';
  typingBlock.id = 'typing-block';
  typingBlock.innerHTML = `
  <div class="label">Amny</div>
  <div class="typing-indicator" id="typing-text">....</div>
  `;
  chatContent.appendChild(typingBlock);
  chatContent.scrollTop = chatContent.scrollHeight;

  // Send the button text to the backend
  fetch('/get_response_from_button', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ button: buttonText })  // Pass the button text
  })
    .then(response => response.json())
    .then(data => {
      // Remove the typing indicator
      const typing = document.getElementById('typing-block');
      if (typing) typing.remove();

      // Show the backend response (bot's answer)
      const botText = data.response || "I'm here to empower you 💫";  // Default message in case no response is received

      const botBlock = document.createElement('div');
      botBlock.className = 'message-container bot-container';
      botBlock.innerHTML = `
  <div class="label">Amny</div>
  <div class="message bot">${botText}</div>
  `;
      chatContent.appendChild(botBlock);
      chatContent.scrollTop = chatContent.scrollHeight;
    });
}




function sendFeedback(score, icon) {
  const container = icon.parentElement;
  container.querySelectorAll('i').forEach(i => {
    i.style.pointerEvents = 'none';
    i.style.opacity = '0.4';
  });

  icon.style.color = score === 1 ? '#4caf50' : '#e53935';
  console.log("User feedback:", score);

  // Optional: send to backend
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

  const payload = parseJwt(response.credential);
  console.log("User Info:", payload);

  // Hide login, show welcome
  document.getElementById("auth-box").style.display = "none";
  const chatbox = document.getElementById("chatbox-content");
  chatbox.innerHTML += `<div class="message-container bot-container">
    <div class="message bot">Welcome, ${payload.name} 👋</div>
  </div>`;
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
    // Optional: personalize chatbot or load user history
  } else {
    console.log("Guest mode chatbot");
  }
}
