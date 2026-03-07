# InterviewPilot — Frontend Design Specification
## Next.js 15 + shadcn/ui + LiveKit Agents UI

---

## Design Philosophy

**Inspiration:** Micro1's split-panel interview layout (AI avatar left, workspace right) + Mercor's clean professional assessment flow. But we go beyond both — they're hiring tools, we're a **coaching tool**. Our UI needs to feel like having a world-class coach in the room with you, not taking a test.

**Aesthetic Direction:** Dark-mode-first, editorial/professional with warm accent colors. Think "Bloomberg Terminal meets a luxury fitness app." Data-dense but never cluttered. The real-time feedback dashboard is the visual centerpiece that neither Micro1 nor Mercor has.

**Key UX Principle:** The user should feel like they're in a real interview, not using software. The coaching layer should be ambient and non-intrusive — glanceable, not distracting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| UI Library | shadcn/ui (installed via CLI) |
| LiveKit | `livekit-client`, `@livekit/components-react` |
| LiveKit Agents UI | `@agents-ui/*` (shadcn-based agent components) |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion (`motion`) |
| Charts | Recharts (for real-time feedback gauges) |
| Icons | Lucide React |
| Font | Geist Sans + Geist Mono (Next.js default, sharp & modern) |
| State | React hooks + LiveKit data channels |
| Token Gen | Next.js API route (no auth — hackathon mode) |

---

## Pages & Routes

```
app/
├── page.tsx                    → Landing / Setup page
├── interview/
│   └── page.tsx                → Interview room (main experience)
├── scorecard/
│   └── [sessionId]/
│       └── page.tsx            → Post-interview scorecard
├── api/
│   └── token/
│       └── route.ts            → LiveKit token generation endpoint
├── layout.tsx                  → Root layout (dark theme, fonts)
└── globals.css                 → Tailwind + custom CSS variables
```

---

## Page 1: Landing / Setup (`/`)

### Purpose
Configure interview before starting. Fast, zero-friction — no account needed.

### Layout
Full-screen centered card on subtle gradient background. Clean, inviting, makes user want to click "Start Interview."

### UI Elements

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ◉ InterviewPilot                         │
│              "Your AI interview coach that            │
│               sees, hears, and coaches you"           │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  │  Target Role     [ Senior Software Engineer ▼]    │
│  │                                              │    │
│  │  Company         [ Google                    ]    │
│  │                                              │    │
│  │  Interview Type  ○ Behavioral                │    │
│  │                  ● Technical                  │    │
│  │                  ○ System Design              │    │
│  │                  ○ HR / Culture Fit           │    │
│  │                                              │    │
│  │  Difficulty      ◄━━━━━●━━━━━━━►             │    │
│  │                  Easy    Medium    Hard        │    │
│  │                                              │    │
│  │  Duration        [ 15 min ▼]                  │    │
│  │                                              │    │
│  │  Your Name       [ Suman                     ]    │
│  │                                              │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │  🎥 Camera Preview (small, rounded)    │  │    │
│  │  │  with device selector dropdowns        │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │                                              │    │
│  │  [ 🎤 Start Interview →                    ] │    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Powered by Gemini Live API + LiveKit                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Components
- `SetupForm.tsx` — Main form card with all inputs
- `CameraPreview.tsx` — Small webcam preview with device selector
- shadcn: `Card`, `Input`, `Select`, `Slider`, `RadioGroup`, `Button`
- Framer Motion: Staggered entry animation for form fields

### Behavior
1. User fills in interview details (all optional except role)
2. Camera preview activates (tests permissions early)
3. "Start Interview" → navigates to `/interview?role=...&company=...&type=...&difficulty=...&duration=...&name=...`
4. Interview params passed via URL search params (simple, no state management needed)

### Design Notes
- Background: subtle animated gradient mesh (dark navy → charcoal)
- Card: glass-morphism effect, subtle border glow
- "Start Interview" button: large, prominent, with pulsing glow animation
- Camera preview: small rounded rectangle in bottom of card with overlay showing device name
- Mobile responsive: single column, full-width

---

## Page 2: Interview Room (`/interview`) — THE MAIN EVENT

### Purpose
The core interview experience. This is where the magic happens.

### Layout Strategy
**Inspired by Micro1's split-panel but evolved:** Three-column layout that adapts based on interview state.

```
┌─────────────────────────────────────────────────────────────────┐
│  ◉ InterviewPilot    Technical Interview · Google    ⏱ 14:32   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────────┐  ┌──────────────┐  │
│  │              │  │                      │  │  COACHING     │  │
│  │   YOUR       │  │     TRANSCRIPT       │  │  DASHBOARD    │  │
│  │   VIDEO      │  │                      │  │              │  │
│  │   FEED       │  │  🤖: "Tell me about  │  │  Confidence  │  │
│  │              │  │   a time you led a   │  │  ████████░░  │  │
│  │  ┌────────┐  │  │   technical project" │  │  78%         │  │
│  │  │ Audio  │  │  │                      │  │              │  │
│  │  │ Viz    │  │  │  👤: "At my previous │  │  Eye Contact │  │
│  │  │ Bar    │  │  │   role at Leapfrog,  │  │  ██████░░░░  │  │
│  │  └────────┘  │  │   I led the voice AI │  │  62%         │  │
│  │              │  │   infrastructure..." │  │              │  │
│  │  Question    │  │                      │  │  Pace        │  │
│  │  3 of ~10    │  │  🤖: "Interesting,   │  │  ━━━●━━━━━━  │  │
│  │              │  │   can you tell me    │  │  Good ✓      │  │
│  │              │  │   about the scale?"  │  │              │  │
│  │              │  │                      │  │  Posture     │  │
│  │              │  │                      │  │  ████████░░  │  │
│  │              │  │                      │  │  Good ✓      │  │
│  │              │  │                      │  │              │  │
│  │              │  │                      │  │  ┌─────────┐ │  │
│  │              │  │                      │  │  │ COACHING│ │  │
│  │              │  │                      │  │  │ NOTES   │ │  │
│  │              │  │                      │  │  │         │ │  │
│  │              │  │                      │  │  │ • Great  │ │  │
│  │              │  │                      │  │  │   STAR   │ │  │
│  │              │  │                      │  │  │   usage  │ │  │
│  │              │  │                      │  │  │         │ │  │
│  │              │  │                      │  │  │ • Try to │ │  │
│  │              │  │                      │  │  │   maintain│ │  │
│  │              │  │                      │  │  │   eye    │ │  │
│  │              │  │                      │  │  │   contact│ │  │
│  │              │  │                      │  │  └─────────┘ │  │
│  └──────────────┘  └──────────────────────┘  └──────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🎤 Mute  │  📹 Camera  │  🔚 End Interview  │  ⚙️      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Three-Column Layout Detail

**Left Column (25% width) — "Your Stage"**
- User's camera feed (large, rounded corners, subtle border)
- Audio waveform visualizer below video (LiveKit `AgentAudioVisualizerBar`)
- Interview progress indicator (Question X of ~Y)
- Current interviewer persona badge (if multi-persona)
- Subtle "LIVE" indicator with recording dot

**Center Column (45% width) — "The Conversation"**
- Real-time transcript (LiveKit `AgentChatTranscript`)
- Agent messages styled differently from user messages
- Agent: dark bubble with AI icon, slightly larger font
- User: lighter bubble, right-aligned
- Auto-scroll to latest message
- Thinking indicator when agent is processing
- Timestamps on each message (subtle, small)

**Right Column (30% width) — "Your Coach"** ← THIS IS THE DIFFERENTIATOR
- **Real-time Feedback Metrics** (updated via LiveKit DataChannel)
  - Confidence Score: animated radial gauge (0-100%)
  - Eye Contact: horizontal progress bar with color coding
  - Speaking Pace: slider indicator (Too Slow ← Good → Too Fast)
  - Posture: simple status indicator (Good/Needs Work)
  - Filler Words Counter: "um" / "uh" / "like" count
- **Coaching Notes Feed** (scrollable)
  - Timestamped observations from the AI coach
  - Color-coded: 🟢 positive, 🟡 suggestion, 🔴 concern
  - These come from the agent's `log_observation()` tool calls
- **Current Question Card**
  - Highlights the current question being asked
  - Shows tips: "STAR format recommended" or "Be specific with numbers"

### Components

```
components/
├── interview/
│   ├── InterviewRoom.tsx           — Main layout orchestrator
│   ├── VideoPanel.tsx              — Left column: user video + progress
│   ├── TranscriptPanel.tsx         — Center column: conversation
│   ├── CoachingDashboard.tsx       — Right column: metrics + notes
│   ├── FeedbackGauge.tsx           — Radial/circular gauge component
│   ├── MetricBar.tsx               — Horizontal metric progress bar
│   ├── PaceIndicator.tsx           — Speaking pace slider widget
│   ├── CoachingNote.tsx            — Individual coaching note card
│   ├── InterviewTimer.tsx          — Countdown timer in header
│   ├── InterviewControls.tsx       — Bottom control bar
│   └── PersonaBadge.tsx            — Current interviewer indicator
```

### LiveKit Integration Points

```tsx
// Key LiveKit hooks used:
import { useSession, useSessionContext } from '@livekit/components-react';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { AgentControlBar } from '@/components/agents-ui/agent-control-bar';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';

// Data channel for real-time feedback from agent:
// Agent sends JSON via LiveKit RPC/DataChannel → frontend parses → updates dashboard
// Format: { type: "feedback", metric: "confidence", score: 78, note: "..." }
```

### State Management

```tsx
// Interview state (React context or simple hooks)
interface InterviewState {
  status: 'connecting' | 'waiting' | 'active' | 'ending' | 'complete';
  currentQuestion: number;
  totalQuestions: number;
  elapsedTime: number;
  currentPersona: InterviewerPersona;
}

// Real-time feedback state (updated via DataChannel)
interface FeedbackState {
  confidence: number;        // 0-100
  eyeContact: number;        // 0-100
  pace: 'slow' | 'good' | 'fast';
  posture: 'good' | 'needs_work';
  fillerWords: number;
  coachingNotes: CoachingNote[];
}

// Coaching note from agent
interface CoachingNote {
  timestamp: number;
  type: 'positive' | 'suggestion' | 'concern';
  message: string;
  category: 'body_language' | 'content' | 'communication' | 'technical';
}
```

### Responsive Behavior
- **Desktop (>1280px):** Three-column layout as designed
- **Tablet (768-1280px):** Two columns — video+transcript left, dashboard right (collapsible)
- **Mobile (<768px):** Single column — video on top, transcript below, dashboard as bottom sheet

### Animation & Polish
- Coaching metrics: smooth animated transitions (Framer Motion `animate` on value changes)
- Transcript messages: slide-in animation from bottom
- Gauge needles: spring physics animation
- Coaching notes: fade-in with subtle slide
- Status transitions (connecting → active): orchestrated reveal sequence
- Pulsing "LIVE" indicator with glow effect
- Control bar: subtle backdrop blur

---

## Page 3: Scorecard (`/scorecard/[sessionId]`)

### Purpose
Post-interview comprehensive analysis. The "money shot" for the demo video.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ◉ InterviewPilot                        📥 Download PDF     │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  INTERVIEW SCORECARD                                  │    │
│  │  Technical Interview · Senior SWE · Google            │    │
│  │  March 1, 2026 · Duration: 14:32                     │    │
│  │                                                      │    │
│  │  Overall Score                                       │    │
│  │  ╔═══════════════════╗                               │    │
│  │  ║       78/100      ║  "Strong performance with     │    │
│  │  ║    ████████░░     ║   room for improvement in     │    │
│  │  ║                   ║   body language confidence"    │    │
│  │  ╚═══════════════════╝                               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  │
│  │Communication│ │ Technical  │ │   Body     │ │ Overall  │  │
│  │    82/100   │ │   75/100   │ │ Language   │ │ Presence │  │
│  │             │ │            │ │   68/100   │ │  80/100  │  │
│  │   ████░░   │ │  ████░░    │ │  ███░░░    │ │ ████░░   │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘  │
│                                                              │
│  DETAILED FEEDBACK                                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ ✅ Strengths                                         │    │
│  │  • Used STAR format effectively in behavioral Q's    │    │
│  │  • Clear communication of technical architecture     │    │
│  │  • Good use of specific metrics and numbers          │    │
│  │                                                      │    │
│  │ 🔧 Areas for Improvement                             │    │
│  │  • Broke eye contact frequently when thinking        │    │
│  │  • Speaking pace increased when nervous (2:34-3:12)  │    │
│  │  • Could expand more on system design trade-offs     │    │
│  │                                                      │    │
│  │ 💡 Key Moments                                       │    │
│  │  ┌────────────────────────────────────────────────┐  │    │
│  │  │ ⏱ 1:45  Great example of leadership at scale   │  │    │
│  │  │ ⏱ 3:20  Recovered well after stumbling         │  │    │
│  │  │ ⏱ 5:15  Strong system design explanation       │  │    │
│  │  │ ⏱ 8:40  Could have elaborated on trade-offs    │  │    │
│  │  └────────────────────────────────────────────────┘  │    │
│  │                                                      │    │
│  │ 📊 Session Analytics                                 │    │
│  │  Speaking Time: You 68% | Interviewer 32%            │    │
│  │  Avg Confidence: 74%                                 │    │
│  │  Filler Words: 12 (um: 5, uh: 4, like: 3)           │    │
│  │  Eye Contact Avg: 62%                                │    │
│  │  Questions Answered: 8/8                             │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  [ 🔄 Practice Again ]    [ 📤 Share Results ]       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Components

```
components/
├── scorecard/
│   ├── ScorecardPage.tsx          — Main scorecard layout
│   ├── OverallScore.tsx           — Large circular score display
│   ├── CategoryScores.tsx         — Four category score cards
│   ├── StrengthsList.tsx          — Green positive feedback items
│   ├── ImprovementsList.tsx       — Yellow improvement suggestions
│   ├── KeyMoments.tsx             — Timestamped highlight timeline
│   ├── SessionAnalytics.tsx       — Stats grid (speaking time, etc.)
│   └── ScoreGauge.tsx             — Reusable circular gauge
```

### Data Source
- Scorecard data fetched from API route that retrieves stored analysis
- Analysis generated by agent's `end_interview()` tool → Gemini 2.5 Flash
- Stored as JSON in Firestore (or just in-memory for hackathon MVP)

### Design Notes
- Background: same dark theme as rest of app
- Score cards: glass-morphism with colored accent borders based on score
  - 80-100: green accent
  - 60-79: amber accent
  - <60: red accent
- Key moments timeline: vertical timeline with colored dots
- "Practice Again" button prominent, "Share" secondary
- PDF download: generates client-side or links to Cloud Storage

---

## Global Design System

### Color Palette

```css
:root {
  /* Base */
  --background: 220 20% 6%;           /* Near-black with blue undertone */
  --foreground: 210 20% 95%;          /* Off-white */
  --card: 220 18% 10%;               /* Slightly lighter dark */
  --card-foreground: 210 20% 95%;

  /* Primary — Warm amber/gold (coaching warmth) */
  --primary: 38 92% 55%;             /* Golden amber */
  --primary-foreground: 220 20% 6%;

  /* Accent — Cool blue (professional trust) */
  --accent: 210 80% 60%;             /* Bright blue */
  --accent-foreground: 210 20% 95%;

  /* Semantic feedback colors */
  --success: 142 72% 50%;            /* Green — good metrics */
  --warning: 38 92% 55%;             /* Amber — needs attention */
  --danger: 0 72% 55%;               /* Red — concern */

  /* Borders & subtle elements */
  --border: 220 15% 18%;
  --muted: 220 15% 15%;
  --muted-foreground: 220 10% 50%;
}
```

### Typography

```css
/* Using Next.js built-in Geist font family */
--font-sans: 'Geist Sans', system-ui, sans-serif;
--font-mono: 'Geist Mono', 'Fira Code', monospace;

/* Scale */
h1: 2.5rem / 700 weight — page titles
h2: 1.75rem / 600 weight — section headers
h3: 1.25rem / 600 weight — card titles
body: 0.9375rem / 400 weight — general text
small: 0.8125rem / 400 weight — timestamps, labels
metric: 2rem / 700 weight / mono — dashboard numbers
```

### Component Patterns

```
Cards:         bg-card rounded-xl border border-border/50 shadow-lg
Buttons:       rounded-lg font-medium, primary uses --primary
Inputs:        bg-muted border-border rounded-lg
Badges:        rounded-full px-3 py-1 text-xs
Glass effect:  bg-card/80 backdrop-blur-xl border-border/30
Glow:          shadow-[0_0_20px_rgba(primary,0.3)]
```

---

## What You Missed (Things I'm Adding)

### 1. Pre-interview Camera/Mic Check Screen
Between setup and interview, a quick "ready room" that:
- Tests camera and mic are working
- Shows audio level meter
- Lets user adjust device settings
- "You look great! Ready to start?" confirmation
- This is what Micro1 and Mercor both do — essential UX

### 2. Interview Ending Transition
When interview ends, smooth transition state:
- "Generating your scorecard..." with animated loading
- Progress steps: Analyzing responses → Evaluating body language → Generating report
- Redirect to scorecard page when ready

### 3. Real-time Coaching Toasts
Subtle, non-intrusive toast notifications that slide in from the coaching dashboard:
- "💡 Try using the STAR format for this question"
- "👀 Great eye contact — keep it up!"
- "🎯 You're at your best pace right now"
- Auto-dismiss after 4 seconds, stackable

### 4. Interviewer Persona Indicator
When multi-persona mode is active:
- Small avatar/badge showing current interviewer
- Smooth transition animation when switching: "Now speaking with Technical Interviewer"
- Different accent color per persona

### 5. Keyboard Shortcuts
- `M` — toggle mute
- `V` — toggle camera
- `Esc` — end interview (with confirmation)
- `Space` — (future) push-to-talk mode

### 6. Connection Quality Indicator
Small indicator in header showing WebRTC connection quality:
- 🟢 Excellent | 🟡 Good | 🔴 Poor
- Important for a real-time app — shows polish and production thinking

### 7. Empty/Loading States
Every panel has a designed empty/loading state:
- Transcript: "Waiting for interviewer to begin..."
- Dashboard: Metrics at 0% with "Warming up..." label
- Coaching notes: "Notes will appear as the interview progresses"

### 8. Sound Effects (Subtle)
- Soft chime when interview starts
- Subtle notification sound for coaching toasts
- Session end chime

### 9. "Powered by" Footer
Small footer with logos:
- "Built with Gemini Live API + LiveKit" with logos
- Link to GitHub repo
- Judges see the tech stack immediately

---

## Project Structure (Frontend)

```
web/
├── app/
│   ├── page.tsx                         # Landing/Setup
│   ├── interview/
│   │   └── page.tsx                     # Interview Room
│   ├── scorecard/
│   │   └── [sessionId]/
│   │       └── page.tsx                 # Scorecard View
│   ├── api/
│   │   └── token/
│   │       └── route.ts                 # LiveKit token generation
│   ├── layout.tsx                       # Root layout + fonts
│   └── globals.css                      # Theme + Tailwind
│
├── components/
│   ├── agents-ui/                       # LiveKit Agents UI (shadcn)
│   │   ├── agent-session-provider.tsx
│   │   ├── agent-control-bar.tsx
│   │   ├── agent-chat-transcript.tsx
│   │   ├── agent-audio-visualizer-bar.tsx
│   │   └── start-audio-button.tsx
│   │
│   ├── ui/                              # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── radio-group.tsx
│   │   ├── badge.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   └── tooltip.tsx
│   │
│   ├── setup/                           # Setup page components
│   │   ├── setup-form.tsx
│   │   ├── camera-preview.tsx
│   │   └── ready-room.tsx
│   │
│   ├── interview/                       # Interview room components
│   │   ├── interview-room.tsx           # Main layout orchestrator
│   │   ├── video-panel.tsx              # User video + progress
│   │   ├── transcript-panel.tsx         # Chat transcript
│   │   ├── coaching-dashboard.tsx       # Metrics + notes
│   │   ├── feedback-gauge.tsx           # Radial gauge (recharts)
│   │   ├── metric-bar.tsx              # Horizontal progress metric
│   │   ├── pace-indicator.tsx           # Pace slider widget
│   │   ├── coaching-note.tsx            # Individual note card
│   │   ├── coaching-toast.tsx           # Non-intrusive toast
│   │   ├── interview-timer.tsx          # Countdown/elapsed timer
│   │   ├── interview-header.tsx         # Top bar with info
│   │   ├── interview-controls.tsx       # Bottom control bar
│   │   ├── persona-badge.tsx            # Interviewer indicator
│   │   └── connection-indicator.tsx     # WebRTC quality badge
│   │
│   ├── scorecard/                       # Scorecard components
│   │   ├── scorecard-page.tsx
│   │   ├── overall-score.tsx
│   │   ├── category-scores.tsx
│   │   ├── strengths-list.tsx
│   │   ├── improvements-list.tsx
│   │   ├── key-moments.tsx
│   │   ├── session-analytics.tsx
│   │   └── score-gauge.tsx
│   │
│   └── shared/                          # Shared components
│       ├── logo.tsx
│       ├── powered-by.tsx
│       └── loading-screen.tsx
│
├── hooks/
│   ├── use-interview-state.ts           # Interview state management
│   ├── use-feedback-channel.ts          # LiveKit DataChannel listener
│   ├── use-coaching-notes.ts            # Coaching notes accumulator
│   └── use-interview-timer.ts           # Timer logic
│
├── lib/
│   ├── utils.ts                         # shadcn utils (cn function)
│   ├── livekit.ts                       # LiveKit connection helpers
│   ├── types.ts                         # TypeScript interfaces
│   └── constants.ts                     # Interview type configs
│
├── public/
│   ├── sounds/
│   │   ├── start-chime.mp3
│   │   ├── notification.mp3
│   │   └── end-chime.mp3
│   └── images/
│       └── og-image.png                 # Social preview
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── components.json                      # shadcn config
└── .env.local.example
```

---

## Data Flow: Real-time Feedback Pipeline

```
Agent (Python)                          Frontend (React)
────────────                           ─────────────────
                                        
Gemini sees video frame  ──────┐        
                               │        
Agent calls send_feedback()    │        
  tool with structured JSON    │        
                               ▼        
  { type: "metric",     ──→  LiveKit DataChannel  ──→  use-feedback-channel.ts
    metric: "confidence",                                  │
    score: 78 }                                           ▼
                                                    FeedbackState updated
                                                          │
  { type: "coaching_note", ──→  LiveKit DataChannel ──→   ▼
    category: "body_language",                      CoachingDashboard.tsx
    message: "Maintain eye                          re-renders with new
    contact when answering",                        metric values + notes
    severity: "suggestion" }                              │
                                                          ▼
                                                    Animated gauge transition
                                                    New coaching note slides in
                                                    Toast notification appears
```

---

## Package Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",

    "livekit-client": "^2.17.0",
    "@livekit/components-react": "^2.9.0",
    "@livekit/components-styles": "latest",
    "livekit-server-sdk": "^2.10.0",

    "recharts": "^2.13.0",
    "motion": "^12.0.0",
    "lucide-react": "^0.460.0",

    "tailwindcss": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  }
}
```

---

## Key Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Dark mode only | Interview settings are typically well-lit rooms → dark UI reduces eye strain and keeps focus on content. Also looks way better in demo videos. |
| Three-column layout | Micro1 uses two columns (avatar + workspace). We add the coaching dashboard as the third column — this is our killer feature and needs dedicated space. |
| LiveKit Agents UI (shadcn) | These are production-tested shadcn components specifically for agent UIs. No need to reinvent transcript rendering, audio viz, or session management. They're customizable since they install as local components. |
| Recharts for gauges | Lightweight, React-native, works perfectly for animated gauges and progress visualizations. No heavyweight charting lib needed. |
| URL params for interview config | Hackathon simplicity. No auth, no database for config. Just pass params in URL. Reload-friendly. |
| DataChannel for feedback | LiveKit's DataChannel is the right mechanism for agent → frontend real-time data. Lower latency than HTTP polling, already in the WebRTC connection. Agent sends JSON, frontend parses. |
| No auth | Hackathon rule. Token generation in API route uses env vars directly. |
| Geist font | Ships with Next.js 15, sharp and modern, professional feel. No external font loading. |

---

## Implementation Priority

### MVP (Must-have for demo)
1. ✅ Setup page with form
2. ✅ Interview room with video + transcript (LiveKit Agents UI)
3. ✅ Basic coaching dashboard with mock/real metrics
4. ✅ Interview controls (mute, camera, end)
5. ✅ Timer
6. ✅ Scorecard page with results

### Nice-to-have (if time allows)
7. Camera/mic check ready room
8. Animated coaching toasts
9. Multi-persona indicator + transitions
10. PDF download from scorecard
11. Keyboard shortcuts
12. Sound effects
13. Connection quality indicator
14. Framer Motion orchestrated animations

---

## LiveKit Token API Route

```typescript
// app/api/token/route.ts
import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { roomName, participantName } = await req.json();

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: participantName || 'user',
      name: participantName || 'Candidate',
    }
  );

  token.addGrant({
    roomJoin: true,
    room: roomName || `interview-${Date.now()}`,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({
    token: await token.toJwt(),
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
  });
}
```

---

## Summary

This frontend is designed to be:
1. **Visually stunning** — dark editorial aesthetic, animated metrics, glass-morphism
2. **Functionally complete** — real video calls, real transcripts, real-time coaching
3. **Demo-ready** — every screen tells a story in a 4-minute video
4. **Technically sound** — built on LiveKit's production components, not duct tape
5. **Judge-friendly** — "Powered by Gemini + LiveKit" visible, architecture clear

The secret sauce is the **coaching dashboard** — it's the thing that makes this more than "another chatbot." Judges will see metrics moving in real-time while you're having a natural conversation, and that's the moment they go "okay, this is different."