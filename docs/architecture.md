# 🎯 InterviewPilot — AI Interview Practice Coach
## Gemini Live Agent Challenge Submission

### The Problem
Interview preparation is broken. People practice alone in front of a mirror, watch generic YouTube videos, or pay $150+/hr for human coaches. None of these provide real-time, multimodal feedback — the kind that catches filler words, speaking too fast, or lacking confidence *as it happens*.

### The Solution
**InterviewPilot** is a real-time AI interview coach that **sees you, hears you, and coaches you** through realistic mock interviews. Powered by Gemini Live API's native audio+vision and delivered over LiveKit's WebRTC infrastructure, it provides the world's most natural AI interview experience with:

- 🎙️ **Vocal intelligence** — pace, filler words, confidence level, tone analysis
- 🧠 **Multi-persona panel interviews** — HR, Technical, Behavioral interviewers with distinct voices
- 📊 **Real-time coaching dashboard** — live confidence meter, filler word tracker, pace indicator
- 📋 **Post-interview scorecard** — comprehensive PDF report with timestamped feedback

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              Next.js + LiveKit React SDK                     │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Video    │  │  Real-time   │  │   Chat Transcript     │  │
│  │  Preview  │  │  Feedback    │  │   + Coaching Notes    │  │
│  │  (User    │  │  Dashboard   │  │                       │  │
│  │  Camera)  │  │  - Confidence│  │                       │  │
│  │          │  │  - Pace       │  │                       │  │
│  │          │  │  - Fillers    │  │                       │  │
│  └──────────┘  └──────────────┘  └───────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Interview Setup: Role | Company | Type | Difficulty  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ WebRTC (Audio + Video)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   LiveKit Cloud / Server                      │
│              (WebRTC SFU — Media Routing)                     │
│                                                             │
│  Room: interview_{session_id}                                │
│  Participants: [user, interview-agent]                       │
│  Tracks: audio (bidirectional) + video (user→agent)          │
│  Data Channel: real-time feedback metrics (agent→user)       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              LiveKit Agent (Python)                           │
│              Hosted on Google Cloud (GCE/GKE)                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AgentSession                            │    │
│  │                                                     │    │
│  │  LLM: google.beta.realtime.RealtimeModel            │    │
│  │    - Model: gemini-2.5-flash-native-audio-preview   │    │
│  │    - Video: enabled (sees user camera)              │    │
│  │    - Affective Dialog: enabled                      │    │
│  │    - Proactivity: enabled                           │    │
│  │    - Tool Calling: enabled                          │    │
│  │                                                     │    │
│  │  VAD: silero.VAD                                    │    │
│  │                                                     │    │
│  │  Tools:                                             │    │
│  │    - send_feedback() → DataChannel to frontend      │    │
│  │    - log_observation() → stores coaching notes      │    │
│  │    - switch_interviewer() → changes persona/voice   │    │
│  │    - end_interview() → triggers scorecard gen       │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          Scorecard Generator                         │    │
│  │  Uses Gemini 2.5 Flash (text) to analyze full       │    │
│  │  session transcript + observations → structured     │    │
│  │  JSON scorecard → PDF generation                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

Google Cloud Services Used:
  ├── Vertex AI / Gemini API (Live API + standard)
  ├── Google Compute Engine or GKE (agent hosting)
  ├── Cloud Storage (scorecard PDFs, session recordings)
  └── Cloud Firestore (session metadata, user history)
```

---

## Tech Stack

### Backend (Python Agent)
| Component | Technology |
|-----------|-----------|
| Agent Framework | `livekit-agents` v1.x |
| Gemini Integration | `livekit-plugins-google` (RealtimeModel) |
| VAD | `livekit-plugins-silero` |
| LLM (Scorecard) | `google-genai` SDK → Gemini 2.5 Flash |
| PDF Generation | `reportlab` or `weasyprint` |
| Storage | Google Cloud Storage + Firestore |
| Deployment | Docker → GCE VM (or GKE for bonus points) |

### Frontend (Next.js Web App)
| Component | Technology |
|-----------|-----------|
| Framework | Next.js 15 + React 19 |
| LiveKit SDK | `livekit-client` + `@livekit/components-react` |
| UI Components | LiveKit Agents UI + shadcn/ui + Tailwind |
| Real-time Charts | Recharts (confidence/pace visualization) |
| State Management | React hooks + LiveKit data channels |
| Auth/Tokens | Next.js API routes for LiveKit token generation |

### Google Cloud Services
| Service | Purpose |
|---------|---------|
| **Gemini Live API** | Core AI — real-time voice + vision interview |
| **Gemini 2.5 Flash** | Post-interview scorecard analysis |
| **Compute Engine** | Agent hosting (or GKE for IaC bonus) |
| **Cloud Storage** | Scorecard PDFs, session data |
| **Cloud Firestore** | Session metadata, interview history |

---

## Feature Breakdown

### Phase 1: Core Interview Experience (MVP)
- [x] User enters job role, company, interview type (behavioral/technical/HR)
- [x] LiveKit room created, user joins with camera + mic
- [x] Gemini Live agent joins as interviewer with vision enabled
- [x] Natural conversational interview with interruption handling
- [x] Agent hears user via mic — provides coaching on delivery contextually
- [x] Affective dialog — adapts tone based on user's emotional state
- [x] Full transcript displayed in real-time

### Phase 2: Real-time Coaching Dashboard
- [ ] Agent uses tool calling to send structured feedback via DataChannel
- [ ] Frontend renders live metrics: confidence score, filler word count, speaking pace
- [ ] Visual indicators update in real-time as user speaks
- [ ] Proactive coaching: "Try to slow down — your pace increased under pressure"

### Phase 3: Multi-persona Panel Interview
- [ ] Multiple interviewer personas (HR warmup → Technical deep dive → Behavioral)
- [ ] Each persona has distinct voice, questioning style, and evaluation criteria
- [ ] Smooth handoff: "Thank you, now my colleague will ask some technical questions"
- [ ] Different Gemini voice per persona (Puck, Charon, Kore, etc.)

### Phase 4: Post-Interview Scorecard
- [ ] End-of-interview comprehensive analysis
- [ ] Gemini 2.5 Flash analyzes full transcript + observation logs
- [ ] Generates structured scorecard: communication, technical depth, confidence, vocal delivery
- [ ] Timestamped highlights: "At 2:34, excellent STAR format answer"
- [ ] PDF download + shareable link
- [ ] Stored in Cloud Storage with Firestore metadata

---

## Project Structure

```
interview-pilot/
├── agent/                          # Python LiveKit Agent
│   ├── interview_agent.py          # Main agent entrypoint
│   ├── personas.py                 # Interviewer persona definitions
│   ├── tools.py                    # Function tools (feedback, scoring)
│   ├── scorecard.py                # Post-interview analysis + PDF gen
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── web/                            # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx                # Landing / setup page
│   │   ├── interview/
│   │   │   └── page.tsx            # Interview room
│   │   ├── scorecard/
│   │   │   └── [id]/page.tsx       # Scorecard viewer
│   │   └── api/
│   │       ├── token/route.ts      # LiveKit token generation
│   │       └── scorecard/route.ts  # Scorecard retrieval
│   ├── components/
│   │   ├── InterviewRoom.tsx       # Main interview UI
│   │   ├── FeedbackDashboard.tsx   # Real-time metrics
│   │   ├── SetupForm.tsx           # Interview configuration
│   │   ├── Scorecard.tsx           # Post-interview report
│   │   └── VideoPreview.tsx        # User camera preview
│   ├── package.json
│   └── Dockerfile
│
├── infra/                          # IaC (bonus points)
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── docker-compose.yml          # Local dev
│
├── docs/
│   ├── ARCHITECTURE.md             # This file
│   └── architecture-diagram.png    # Visual diagram
│
└── README.md                       # Setup + spin-up instructions
```

---

## Interview Flow (User Journey)

```
1. SETUP
   User opens web app → enters:
   - Target role (e.g., "Senior Software Engineer")
   - Company (e.g., "Google")
   - Interview type: Behavioral | Technical | System Design | HR
   - Difficulty: Easy | Medium | Hard
   - Duration: 15 min | 30 min

2. CONNECT
   → Next.js creates LiveKit room
   → Generates participant token
   → User grants camera + mic
   → Agent joins room with Gemini Live (vision + audio)

3. INTERVIEW
   Agent: "Hi! I'm your interviewer today. I'll be conducting
          a behavioral interview for the Senior SWE role at
          Google. Shall we begin?"

   → Natural conversation with follow-up questions
   → Agent analyzes candidate's vocal delivery in real-time
   → Real-time feedback dashboard updates
   → Affective responses: adjusts difficulty if user struggles
   → Proactive coaching: "Try to use the STAR format here"

4. COACHING MOMENTS (via tool calling)
   Agent internally calls send_feedback({
     type: "communication",
     metric: "confidence",
     score: 0.6,
     note: "Increased filler words under pressure"
   })
   → Frontend dashboard updates in real-time

5. WRAP-UP
   Agent: "That concludes our interview. You did well overall.
          Let me generate your detailed scorecard."

6. SCORECARD
   → Agent calls end_interview() tool
   → Full transcript + observations sent to Gemini 2.5 Flash
   → Structured analysis generated
   → PDF created and uploaded to Cloud Storage
   → User redirected to scorecard page
```

---

## System Instructions (Agent Prompt)

```python
INTERVIEWER_SYSTEM_PROMPT = """
You are InterviewPilot, an expert AI interview coach conducting a realistic
mock interview. You have two simultaneous roles:

ROLE 1 — INTERVIEWER:
- Conduct a professional {interview_type} interview for {role} at {company}
- Ask realistic, progressively challenging questions
- Follow up on answers with probing questions
- Maintain natural conversation flow with appropriate pauses
- Use affective dialog to match the candidate's emotional state

ROLE 2 — COACH (use tools, don't say these observations aloud):
- Continuously observe the candidate via audio
- Track: speaking pace, filler words (um, uh, like), confidence in voice
- Use the send_feedback tool to send real-time metrics to the dashboard
- Use log_observation tool to record notable moments for the scorecard
- Only give verbal coaching when:
  a) The candidate seems very nervous (offer encouragement)
  b) A major delivery issue persists for 30+ seconds
  c) The candidate asks for feedback

IMPORTANT RULES:
- Stay in character as interviewer. Don't break immersion unnecessarily.
- Be encouraging but honest. This is practice — honest feedback helps.
- If the candidate's answer is too short, probe deeper.
- If the candidate goes off-topic, gently redirect.
- Adapt difficulty based on candidate's performance level.
- Use the candidate's name naturally in conversation.
"""
```

---

## Competitive Advantages (Why We Win)

| What | Why It Matters |
|------|---------------|
| **LiveKit WebRTC** | Real video call experience, not a browser-only gimmick. Sub-200ms latency. |
| **Gemini Live Audio** | Hears the user in real-time — pace, filler words, confidence. Not simulated. |
| **Affective Dialog** | Adapts emotional tone — encouraging when nervous, serious when appropriate. |
| **Tool Calling** | Structured feedback loop — agent sends metrics to frontend in real-time. |
| **Proactive Audio** | Agent can interrupt to coach: "Hold that thought — great point, expand on it." |
| **Production Architecture** | LiveKit + GKE = scalable. Not a prototype-only demo. |
| **Multi-persona** | Different interviewer voices and styles in one session. |

---

## What Makes This UNIQUE vs. Other Interview Coach Submissions

1. **Real-time audio intelligence is the hero feature** — We analyze vocal delivery, filler words, confidence, and speaking pace in real-time. The live coaching dashboard makes this tangible.

2. **Dual-role architecture** — The agent simultaneously interviews AND coaches through tool calling without breaking character. The coaching happens through the visual dashboard, not by interrupting the conversation.

3. **Real-time feedback dashboard** — A live, animated dashboard showing confidence, filler words, and pace creates a visually compelling demo. Judges see data moving in real-time.

4. **Built by a Voice AI Engineer** — Your production LiveKit experience means this won't be a janky demo. It'll be polished, low-latency, and actually work.

---

## Hackathon Submission Checklist

- [ ] **Text Description** — Feature summary, tech used, learnings
- [ ] **Public GitHub Repo** — Full source with README + spin-up instructions
- [ ] **Google Cloud Deployment Proof** — Screen recording of GCE/GKE console
- [ ] **Architecture Diagram** — The diagram above, polished as PNG
- [ ] **Demo Video** — <4 min showing real interview session with live feedback
- [ ] **Bonus: Blog Post** — "Building a Real-Time AI Interview Coach with Gemini Live + LiveKit"
- [ ] **Bonus: IaC Deployment** — Terraform scripts in `/infra`
- [ ] **Bonus: GDG Profile** — Link to Google Developer Group profile

---

## Build Order (Sprint Plan)

### Day 1: Core Agent + Basic Frontend
1. Scaffold Python agent with Gemini Live RealtimeModel + vision
2. Write interviewer system prompt with persona
3. Set up Next.js frontend with LiveKit React SDK
4. Get basic video call working: user ↔ agent with voice + vision
5. Test: agent conducts basic interview while seeing user

### Day 2: Tool Calling + Real-time Dashboard
1. Implement send_feedback tool in agent
2. Set up LiveKit DataChannel for real-time metrics
3. Build frontend FeedbackDashboard component
4. Wire up live confidence/filler-words/pace indicators
5. Test: dashboard updates as user answers questions

### Day 3: Scorecard + Polish
1. Implement end_interview tool + scorecard generation
2. Gemini 2.5 Flash analysis of full transcript
3. PDF generation with reportlab
4. Cloud Storage upload + Firestore metadata
5. Scorecard viewer page in frontend

### Day 4: Multi-persona + Demo Prep
1. Add interviewer persona switching (HR → Technical → Behavioral)
2. Different Gemini voices per persona
3. Deploy to GCE/GKE
4. Record demo video
5. Write README + blog post

---

## Environment Variables

```bash
# .env (Agent)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
GOOGLE_API_KEY=your_gemini_api_key
GCS_BUCKET=interview-pilot-scorecards
FIRESTORE_PROJECT_ID=your-gcp-project

# .env.local (Frontend)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```