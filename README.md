# 🤖 Amny - Your Career Assistant Chatbot

**Amny** is a smart career assistant built with **FastAPI**.  
It helps users:
- Discover job opportunities
- Get mentorship advice
- Attend community events
- Find motivation through success stories
- Get quick answers to FAQs

Amny uses **Machine Learning** (for Intent Detection + Retrieval-Augmented Generation) and integrates with **RapidAPI** to fetch real-time job listings.

---

## 🚀 Features

- **Conversational Chatbot** with intent understanding
- **Live Job Search** via RapidAPI JSearch
- **FAQ Retrieval** with Vector Search
- **Session Tracking** (per user)
- **Motivational Stories** for users who feel demotivated
- **Quick Reply Buttons** for smooth UX
- **User Feedback Collection**

---

## 🛠️ Tech Stack

- **Backend:** FastAPI
- **Database:** PostgreSQL / SQLite
- **Machine Learning:** Intent Classification, Retrieval-Augmented Generation (RAG)
- **External APIs:** RapidAPI - JSearch
- **HTTP Client:** httpx (async)

---

## 📂 Project Structure

. ├── main.py # FastAPI Application Entry Point ├── db/ # Database Models & Session Management ├── models/ # Pydantic Schemas ├── ml_models/ # Machine Learning Models ├── utils/ # Helper Functions ├── templates/ # Frontend HTML (if any) ├── static/ # Static files (CSS, JS) └── README.md # Project Documentation

ruby
Copy
Edit

---

## ⚡ API Endpoints

| Method | Endpoint | Purpose |
|:------:|:--------:|:-------:|
| `GET`  | `/` | Load Amny Home page |
| `POST` | `/get_response` | Get Amny’s response for user messages |
| `POST` | `/get_response_from_button` | Handle Quick-Reply buttons |
| `POST` | `/submit_feedback` | Submit user feedback |
| `GET`  | `/remote_jobs` | Get stored remote job listings |
| `POST` | `/search_jobs` | **(New)** Live Job Search via RapidAPI |

---

## 🔎 Job Search Feature (`/search_jobs`)

### RapidAPI Credentials (currently hardcoded)

```python
RAPIDAPI_KEY = '080a1d30fdmsh54528a6131eb341p14a6adjsnbef0b03a79b2'
RAPIDAPI_HOST = 'jsearch.p.rapidapi.com'
✅ (Optional: You can also load them from environment variables for production.)

python
Copy
Edit
# RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY')
# RAPIDAPI_HOST = os.getenv('RAPIDAPI_HOST') or 'jsearch.p.rapidapi.com'
Internal Function to Fetch Jobs
python
Copy
Edit
async def fetch_jobs_from_rapidapi(skill: str, experience: str, job_type: str = "FULLTIME", page: int = 1):
    url = "https://jsearch.p.rapidapi.com/search"
    params = {
        "query": skill,
        "country": "IN"
    }
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, params=params, headers=headers)
            r.raise_for_status()
            return r.json().get("data", [])
        except Exception as e:
            print("‼️ fetch failed:", e)
            return []
/search_jobs API Usage
POST /search_jobs

Request Body
json
Copy
Edit
{
  "skills": "python",
  "experience": "2",
  "jobType": "FULLTIME"
}
Success Response
json
Copy
Edit
{
  "jobs": [
    {
      "job_title": "Python Developer",
      "company_name": "Tech Solutions",
      "location": "Remote",
      "url": "https://example.com/job"
    },
    ...
  ]
}
If skills or experience are missing, returns 400 Bad Request.

🧠 How Amny Handles Messages

Detected Intent	Action Taken
greet	Sends greeting
bye	Bids farewell
faq	Searches FAQ database
demotivated	Sends a motivational story
job_search	Offers job listings
mentorship	Provides mentorship advice
events / sessions	Shares upcoming events
unknown	Responds with fallback message
💬 Session Management
Each chat is linked to a session_id.

Amny remembers last 10 messages of a user.

Conversation history stored in database.

📢 Feedback Feature
Endpoint /submit_feedback

Allows users to submit ratings, suggestions, or comments about Amny.

🖼️ Amny Flow Diagram
pgsql
Copy
Edit
User Message → /get_response
        ↓
Intent Prediction → Action Execution
        ↓
Session Update → Amny’s Smart Response
⚙️ Running Amny Locally
bash
Copy
Edit
# Install required libraries
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload
Visit: http://localhost:8000

✨ About
"Amny is your career buddy, helping you explore jobs, grow with mentors, and stay motivated!"

📌 Notes
For production: Secure the RAPIDAPI_KEY using environment variables.

You can extend Amny with more intents (like Resume Building, Interview Prep, etc.).

🚀 Ready to Launch with Amny!
yaml
Copy
Edit
