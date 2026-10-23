# Prepwise — AI Mock Interviewer 🎙️

> **"Practice smarter. Interview better."**

Prepwise is a full-stack, production-quality AI mock interview platform that simulates hyper-realistic, personalized voice interviews. Candidates upload their resume, and an intelligent AI interviewer dynamically assesses technical depth, challenges architecture claims, asks contextual follow-ups, and delivers in-depth performance analytics.

---

## 🌟 Core Features

- 📄 **Resume-Tailored Questioning**: Extracts skills, frameworks, and project bullet points from text-based PDF resumes using Groq LLMs.
- 🎙️ **Natural Voice Interaction**: Complete voice conversation with real-time Speech-to-Text (STT) and native Text-to-Speech (TTS) synthesis.
- ⚡ **Dynamic Follow-Up Logic**: Evaluates every spoken answer in real-time. Automatically probes shallow explanations, explores trade-offs, and transitions smoothly across topics.
- 🎯 **Configurable Interview Modes**:
  - **Interview Types**: Technical, HR / Behavioral (STAR method), or Balanced Mixed.
  - **Difficulty Levels**: Easy (Fundamentals), Medium (Practical Trade-offs), Hard (Edge Cases & High Scale).
  - **Question Depth**: 5-question sprint, 10-question standard mock, or 15-question comprehensive session.
- 📊 **Comprehensive Scorecard & Analytics**:
  - Overall performance score (out of 100) and readiness verdict.
  - Category breakdown across *Technical Knowledge*, *Problem Solving*, *Communication*, *Relevance*, *Answer Depth*, and *Confidence*.
  - Actionable Strengths and Priority Growth Areas.
  - Personalized **Study Roadmap** with targeted topic recommendations.
  - Granular **Question-by-Question Review** with full transcripts and AI feedback.
- ⚡ **Ultra-Fast Groq Inference**: Powered by Llama-3.3-70b-versatile and Llama-3.1-8b-instant models for sub-second latency.

---

## 🏗️ Architecture & Tech Stack

```
                                  PREPWISE ARCHITECTURE
                                  
   +-----------------------------------------------------------------------------+
   |                            React + Vite Frontend                            |
   |                                                                             |
   |  [Landing] -> [Resume Dropzone] -> [Setup] -> [Voice Interview] -> [Report] |
   |                                                    |                        |
   |      Web Speech API (STT Microphone) <-------------+                        |
   |      SpeechSynthesis API (TTS Voice) <-------------+                        |
   +---------------------------------------+-------------------------------------+
                                           | HTTP / REST (Axios)
                                           v
   +-----------------------------------------------------------------------------+
   |                              FastAPI Backend                                |
   |                                                                             |
   |  • /api/resume/upload          -> PyPDF Text Extraction & Validator         |
   |  • /api/interview/create       -> In-Memory Session & Strategy Planner       |
   |  • /api/interview/{id}/answer  -> Dynamic Evaluator & Adaptive Follow-Up     |
   |  • /api/interview/{id}/report  -> Performance Synthesis Engine              |
   +---------------------------------------+-------------------------------------+
                                           |
                                           v
                        +-------------------------------------+
                        |          Groq Cloud API             |
                        | (Llama-3.3-70b / Llama-3.1-8b JSON) |
                        +-------------------------------------+
```

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **LLM Inference**: Groq SDK (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`)
- **PDF Extraction**: PyPDF
- **Validation**: Pydantic v2
- **Session Management**: Temporary in-memory session engine

### Frontend
- **Framework**: React 18 / 19 + Vite
- **Styling**: Tailwind CSS + Custom Glassmorphism UI tokens
- **Icons**: Lucide React
- **Celebration**: Canvas-Confetti
- **Voice Stack**: Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

---

## 📂 Project Structure

```text
prepwise/
├── backend/
│   ├── api/
│   │   ├── resume.py            # PDF upload & profile analysis endpoints
│   │   ├── interview.py         # Session creation, answer submission, status
│   │   ├── report.py            # Final performance report generation
│   │   └── session_store.py     # In-memory interview session cache
│   ├── services/
│   │   ├── groq_service.py      # Groq LLM wrapper with structured JSON parsing
│   │   ├── resume_parser.py     # Resume structuring & heuristic fallback
│   │   ├── interview_engine.py  # Adaptive question & dynamic follow-up engine
│   │   └── evaluation_service.py# Per-answer scoring & final report generator
│   ├── models/
│   │   └── schemas.py           # Pydantic data models
│   ├── utils/
│   │   └── file_utils.py        # PDF text extraction & temporary cleanup
│   ├── main.py                  # FastAPI application entry point
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Header with logo & live Groq status
│   │   │   ├── ApiKeyModal.jsx      # Runtime Groq API key configuration
│   │   │   ├── AvatarVisualizer.jsx # Animated AI interviewer avatar
│   │   │   ├── QuestionCard.jsx     # Spoken question display & audio replay
│   │   │   ├── VoiceRecorder.jsx    # Real-time microphone recording & STT
│   │   │   ├── TranscriptDrawer.jsx # Expandable conversation history log
│   │   │   └── ScoreGauge.jsx       # SVG radial score gauge
│   │   ├── data/
│   │   │   └── sampleResumes.js     # One-click sample candidate profiles
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Hero, features & mock preview
│   │   │   ├── ResumeUploadPage.jsx # PDF dropzone & staged parsing checklist
│   │   │   ├── InterviewSetupPage.jsx # Profile summary & configuration controls
│   │   │   ├── InterviewRoomPage.jsx# Live voice interview room
│   │   │   ├── ProcessingPage.jsx   # Animated synthesis progress screen
│   │   │   └── ResultsDashboardPage.jsx # Comprehensive scorecards & roadmap
│   │   ├── services/
│   │   │   ├── api.js               # Backend API client
│   │   │   └── speech.js            # Web Speech API STT and TTS utilities
│   │   ├── App.jsx                  # Main flow controller
│   │   ├── index.css                # Tailwind CSS + custom glassmorphism styles
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.10 or newer
- Node.js 18+ and npm
- (Optional but recommended) A free [Groq API Key](https://console.groq.com/keys)

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and add your Groq API key:
# GROQ_API_KEY=gsk_...

# Start the FastAPI backend server
# If inside the backend/ directory:
uvicorn main:app --reload --port 8000

# Or if at the root prepwise/ directory:
uvicorn backend.main:app --reload --port 8000
```

The backend will be live at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🎙️ Voice & Browser Permissions

1. **Microphone Access**: Click "Allow" when the browser prompts for microphone permissions.
2. **Text Fallback**: If you are in a noisy environment or prefer typing, toggle the **"Type / Edit"** button in the voice recorder to write or edit your answers before submitting.
3. **Audio Replay**: You can click **"Replay Question Audio"** at any time to hear the interviewer speak the question again.

---

## 🧪 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and Groq connectivity |
| `POST` | `/api/config/groq-key` | Runtime configuration of Groq API Key |
| `POST` | `/api/resume/upload` | Upload PDF resume, extract text and parse profile |
| `POST` | `/api/resume/analyze-text` | Parse raw resume text or sample profile |
| `POST` | `/api/interview/create` | Create a new session and generate Question #1 |
| `GET` | `/api/interview/{id}/status` | Retrieve session state, turns, and progress |
| `POST` | `/api/interview/{id}/answer` | Submit answer, evaluate, and generate adaptive follow-up |
| `POST` | `/api/interview/{id}/complete`| Finish interview early and synthesize report |
| `GET` | `/api/interview/{id}/report` | Retrieve final comprehensive performance scorecard |

---

## 🛡️ Security & Privacy Best Practices

- **No Permanent Storage**: Resumes and interview transcripts exist exclusively in memory for the duration of the interview session.
- **Key Safety**: The Groq API key remains strictly on the FastAPI server and is never exposed to client-side bundles.
- **File Validation**: Strict PDF file type validation and size limits (10MB max) prevent execution of unauthorized payloads.

---

## 💡 Future Enhancements

- Video avatar simulation with live facial gesture synthesis.
- Coding sandbox with live syntax execution for algorithmic whiteboard rounds.
- Multi-speaker panel interviews (e.g. Engineering Lead + Product Manager).
- User history and longitudinal skill progression tracking.

---

## 📄 License

MIT License. Built for engineering excellence and interview mastery.
