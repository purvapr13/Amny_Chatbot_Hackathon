
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


    gapi.load('auth2', function() {
      gapi.auth2.init({
        client_id: '518842382134-df825f3u5oqab9l7linsgrr4h8mhutbo.apps.googleusercontent.com'
      }).then(function(auth2) {
        auth2.attachClickHandler(document.getElementById('google-signin-btn'), {}, onSignIn, function(error) {
          console.log(JSON.stringify(error, undefined, 2));
        });
      });
    });
