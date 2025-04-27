// Function to toggle the chatbox visibility
let currentJobIndex = 0;
let allFetchedJobs = [];
let jobSearchCriteria = {};
let sessionId = localStorage.getItem('session_id') || generateSessionId();
localStorage.setItem('session_id', sessionId);

function generateSessionId() {
  return 'session-' + Math.random().toString(36).substring(2, 15);
}

function toggleChatbox(event) {
  const chatbox = document.getElementById('chatbox');
  const chatboxContent = document.getElementById('chatbox-content');
  const chatButton = document.getElementById('chatbot-btn');
  const isVisible = window.getComputedStyle(chatbox).display === 'flex';

  if (!isVisible) {
    chatbox.style.display = 'flex';
    if (window.innerWidth <= 768) chatButton.classList.add('mobile-hidden');

    const visualHeight = Math.round(window.visualViewport?.height || window.innerHeight);
    if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
      chatbox.style.height = `${visualHeight}px`;
    } else {
      chatbox.style.height = `${Math.floor(visualHeight * 0.7)}px`;
    }

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

  updateChatboxHeight();
  event.stopPropagation();
}

document.addEventListener('click', function (event) {
  const chatbox = document.getElementById('chatbox');
  const chatButton = document.getElementById('chatbot-btn');
  if (!chatbox.contains(event.target) && event.target !== chatButton) {
    chatbox.style.display = 'none';
    chatButton.classList.remove('mobile-hidden');
  }
});

document.getElementById('chatbox').addEventListener('click', function (event) {
  event.stopPropagation();
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
    body: JSON.stringify({ message: userText, session_id: sessionId })
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
    let buttonsHTML = '';

    if (data.intent === "job_search") {
      const jobTypes = ["Full-time", "Part-time", "Remote", "All"];
      buttonsHTML = `
        <div class="buttons-container">
          ${jobTypes.map(jobType => `
            <button class="quick-reply" data-button-text="${jobType}" onclick="handleJobTypeSelection(event)">
              ${jobType}
            </button>
          `).join('')}
        </div>
      `;
    } else if (data.intent === "mentorship") {
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

const clientId = "YOUR_GOOGLE_CLIENT_ID"; // Replace with your actual Google Client ID

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

  authBox.style.display = 'none';

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

  const authBox = document.getElementById("auth-box");
  if (authBox) authBox.style.display = "none";

  const chatbox = document.getElementById("chatbox-content");
  if (chatbox) {
    chatbox.innerHTML += `
      <div class="message-container bot-container">
        <div class="message bot">Welcome, ${payload.name} 👋</div>
      </div>
    `;
  }

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

function saveChatHistory(userMessage, botResponse) {
  let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
  chatHistory.push({ userMessage, botResponse });
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

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

function displayAmnyMessage(message) {
  const chatContent = document.getElementById('chatbox-content');
  const botBlock = document.createElement('div');
  botBlock.className = 'message-container bot-container';
  botBlock.innerHTML = `
    <div class="label">Amny</div>
    <div class="message bot">${message}</div>
  `;
  chatContent.appendChild(botBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
}

async function fetchJobsBasedOnCriteria(criteria) {
  const chatContent = document.getElementById('chatbox-content');
  showTypingIndicator(chatContent);

  try {
    const response = await fetch('/search_jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria)
    });
    const data = await response.json(); 
    console.log("Received jobs data:", data);
    hideTypingIndicator(chatContent);

    if (data && data.jobs && data.jobs.length > 0) {
      displayJobListings(data.jobs);
    } else {
      displayAmnyMessage("Sorry, I couldn't find any jobs matching your criteria.");
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    hideTypingIndicator(chatContent);
    displayAmnyMessage("Oops! Something went wrong while fetching jobs. Please try again later.");
  }
}

// function displayJobListings(jobs) {
//   const chatContent = document.getElementById('chatbox-content');
//   let jobCardsHTML = jobs.slice(0, 5).map(job =>
//     `<div class="job-card" style="border:1px solid #eee; border-radius:8px; padding:10px; margin:6px 0;">
//       <strong><span class="math-inline">\{job\.title \|\| 'No Title'\}</strong\><br\>
// <span style\="font\-size\: 13px;"\></span>{job.company || 'Unknown Company'} - ${job.location || 'Unknown Location'}</span><br>
//       ${job.url ? `<a href="${job.url}" target="_blank" style="font-size: 13px; color:#007bff;">View Job</a>` : 'No link available'}
//     </div>`
//   ).join(''); 
//   const botBlock = document.createElement('div');
//   botBlock.className = 'message-container bot-container';
//   botBlock.innerHTML = `
//     <div class="label">Amny</div>
//     <div class="message bot">
//       Here are some jobs that match your criteria:
//       <br>${jobCardsHTML}
//       ${jobs.length > 5 ? '<button onclick="displayMoreJobs()">Show More</button>' : ''}
//     </div>
//   `;
//   chatContent.appendChild(botBlock);
//   chatContent.scrollTop = chatContent.scrollHeight;
//   currentJobIndex = 5;
//   allFetchedJobs = jobs;
// }

// Show the first batch of 3 jobs

function displayJobListings(jobs) {
  // store and reset
  allFetchedJobs = jobs;
  currentJobIndex = 0;

  if (jobs.length === 0) {
    appendMessage('bot','Amny','Sorry, no jobs available.');
    return;
  }
  renderNextBatch();
}

function renderNextBatch() {
  const chatContent = document.getElementById('chatbox-content');
  const sliceStart = currentJobIndex;
  const sliceEnd = sliceStart + 3;
  const batch = allFetchedJobs.slice(sliceStart, sliceEnd);
  if (batch.length === 0) {
    appendMessage('bot','Amny','No more jobs available.');
    return;
  }

  // build cards HTML
  const cardsHTML = batch.map(job => `
    <div class="job-card" style="border:1px solid #eee; border-radius:8px; padding:10px; margin:6px 0;">
      <strong>${job.job_title || 'No Title'}</strong><br>
      <small>${job.employer_name || 'Unknown Company'} — ${job.job_city || ''}, ${job.job_country || ''}</small><br>
      ${job.job_apply_link
        ? `<a href="${job.job_apply_link}" target="_blank" style="font-size:13px;color:#007bff;">View Job</a>`
        : 'No link available'}
    </div>
  `).join('');

  // show “Show More” if there are more left
  const moreBtnHTML = (sliceEnd < allFetchedJobs.length)
    ? '<button id="show-more-btn" style="margin-top:8px;">Show More</button>'
    : '';

  // append to chat
  const botBlock = document.createElement('div');
  botBlock.className = 'message-container bot-container';
  botBlock.innerHTML = `
    <div class="label">Amny</div>
    <div class="message bot">
      Here are some jobs that match your criteria:<br>${cardsHTML}${moreBtnHTML}
    </div>
  `;
  chatContent.appendChild(botBlock);
  chatContent.scrollTop = chatContent.scrollHeight;

  // advance index
  currentJobIndex = sliceEnd;

  // wire up the button
  const btn = document.getElementById('show-more-btn');
  if (btn) {
    btn.addEventListener('click', renderNextBatch);
  }  
  
}

function displayMoreJobs() {
  const chatContent = document.getElementById('chatbox-content');
  const nextJobs = allFetchedJobs.slice(currentJobIndex, currentJobIndex + 5).map(job =>
    `<div class="job-card" style="border:1px solid #eee; border-radius:8px; padding:10px; margin:6px 0;">
      <strong>${job.title || 'No Title'}</strong><br>
      <span style="font-size: 13px;">${job.company || 'Unknown Company'} - ${job.location || 'Unknown Location'}</span><br>
      ${job.url ? `<a href="${job.url}" target="_blank" style="font-size: 13px; color:#007bff;">View Job</a>` : 'No link available'}
    </div>`
  ).join('');

  if (nextJobs) {
    const moreJobsBlock = document.createElement('div');
    moreJobsBlock.className = 'message-container bot-container';
    moreJobsBlock.innerHTML = `
      <div class="label">Amny</div>
      <div class="message bot">${nextJobs}</div>
    `;
    chatContent.appendChild(moreJobsBlock);
    chatContent.scrollTop = chatContent.scrollHeight;
    currentJobIndex += 5;
  }

  if (currentJobIndex >= allFetchedJobs.length) {
    const showMoreButton = chatContent.querySelector('button:contains("Show More")');
    if (showMoreButton) {
      showMoreButton.remove();
    }
  }
}

async function fetchResponseForButton(buttonText) {
  const chatContent = document.getElementById('chatbox-content');
  showTypingIndicator(chatContent);
  try {
    const response = await fetch('/get_response_from_button', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "", button: buttonText, session_id: sessionId })
    });
    const data = await response.json();
    hideTypingIndicator(chatContent);
    const botText = data.response || "I'm here to empower you 💫";
    const botBlock = document.createElement('div');
    botBlock.className = 'message-container bot-container';
    botBlock.innerHTML = `
      <div class="label">Amny</div>
      <div class="message bot">${botText}</div>
    `;
    if (data.buttons && data.buttons.length > 0) {
      const buttonsHTML = data.buttons.map(button =>
        `<button class="quick-reply" data-button-text="${button}" onclick="handleButtonClick(event)">${button}</button>`
      ).join('');
      botBlock.innerHTML += `<div class="buttons-container">${buttonsHTML}</div>`;
    }
    chatContent.appendChild(botBlock);
    chatContent.scrollTop = chatContent.scrollHeight;
    addFeedbackUI(chatContent);
  } catch (error) {
    console.error('Error fetching response for button:', error);
    hideTypingIndicator(chatContent);
    displayAmnyMessage("Oops! Something went wrong. Please try again.");
  }
}

function handleJobTypeSelection(event) {
  const jobType = event.target.getAttribute('data-button-text');
  jobSearchCriteria.jobType = jobType;
  displayAmnyMessage(`Okay, you're looking for ${jobType} roles. Now, what are your key skills? (e.g., JavaScript, Project Management)`);

  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  const skillsInput = document.createElement('input');
  skillsInput.type = 'text';
  skillsInput.id = 'skills-input';
  skillsInput.placeholder = 'Enter your skills';
  const submitSkillsButton = document.createElement('button');
  submitSkillsButton.innerText = 'Submit Skills';
  submitSkillsButton.onclick = handleSkillsSubmission;
  inputContainer.appendChild(skillsInput);
  inputContainer.appendChild(submitSkillsButton);

  const chatContent = document.getElementById('chatbox-content');
  const botBlock = document.createElement('div');
  botBlock.className = 'message-container bot-container';
  botBlock.appendChild(inputContainer);
  chatContent.appendChild(botBlock);
  chatContent.scrollTop = chatContent.scrollHeight;

  event.target.disabled = true;
  event.target.style.backgroundColor = "#ccc";
}

async function handleSkillsSubmission() {
  const skillsInput = document.getElementById('skills-input');
  if (!skillsInput || !skillsInput.value.trim()) {
    displayAmnyMessage("Please enter your skills.");
    return;
  }
  jobSearchCriteria.skills = skillsInput.value.trim();
  skillsInput.remove();
  this.remove();

  displayAmnyMessage("Got it! Finally, how many years of relevant experience do you have?");

  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  const experienceInput = document.createElement('input');
  experienceInput.type = 'number';
  experienceInput.id = 'experience-input';
  experienceInput.placeholder = 'Years of experience';
  const submitExperienceButton = document.createElement('button');
  submitExperienceButton.innerText = 'Submit Experience';
  submitExperienceButton.onclick = handleExperienceSubmission;
  inputContainer.appendChild(experienceInput);
  inputContainer.appendChild(submitExperienceButton);

  const chatContent = document.getElementById('chatbox-content');
  const botBlock = document.createElement('div');
  botBlock.className = 'message-container bot-container';
  botBlock.appendChild(inputContainer);
  chatContent.appendChild(botBlock);
  chatContent.scrollTop = chatContent.scrollHeight;
}

async function handleExperienceSubmission() {
  const experienceInput = document.getElementById('experience-input');
  if (!experienceInput || !experienceInput.value.trim()) {
    displayAmnyMessage("Please enter your years of experience.");
    return;
  }
  jobSearchCriteria.experience = experienceInput.value.trim();
  experienceInput.remove();
  this.remove();

  displayAmnyMessage("Thanks! Let me find some matching jobs for you...");
  await fetchJobsBasedOnCriteria(jobSearchCriteria);
}

async function handleButtonClick(event) {
  const buttonText = event.target.getAttribute('data-button-text');

  const buttonsContainer = event.target.parentNode;
  if (buttonsContainer && buttonsContainer.classList.contains('buttons-container')) {
    Array.from(buttonsContainer.children).forEach(button => {
      button.disabled = true;
      button.style.backgroundColor = "#ccc";
    });
  }

  if (buttonText === "Job Search") {
    displayAmnyMessage("Great! To help me find the best jobs for you, could you tell me what type of role you're looking for?");
    const jobTypes = ["Full-time", "Part-time", "Remote", "All"];
    const buttonsHTML = `
      <div class="buttons-container">
        ${jobTypes.map(type => `
          <button class="quick-reply" data-button-text="${type}" onclick="handleJobTypeSelection(event)">
            ${type}
          </button>
        `).join('')}
      </div>
    `;
    const chatContent = document.getElementById('chatbox-content');
    const botBlock = document.createElement('div');
    botBlock.className = 'message-container bot-container';
    botBlock.innerHTML = buttonsHTML;
    chatContent.appendChild(botBlock);
    chatContent.scrollTop = chatContent.scrollHeight;
  } else {
    displayAmnyMessage(`You selected: ${buttonText}. I will fetch relevant information soon.`);
    fetchResponseForButton(buttonText);
  }
}
