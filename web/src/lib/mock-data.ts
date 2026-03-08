import type {
  InterviewConfig,
  TranscriptMessage,
  FeedbackState,
  CoachingNote,
  InterviewPhase,
  Scorecard,
} from "./types";

export const MOCK_INTERVIEW_CONFIG: InterviewConfig = {
  candidateName: "Suman",
  targetRole: "Senior Software Engineer",
  experienceLevel: "senior",
  roleType: "backend",
  primaryLanguage: "python",
  techStack: ["Django", "PostgreSQL", "Redis", "Docker"],
  interviewType: "mock",
};

export const MOCK_TRANSCRIPT: TranscriptMessage[] = [
  {
    id: "m1",
    role: "agent",
    content:
      "Hi Suman! I'm Marcus Johnson, Director of People here. Welcome to your mock interview for the Senior Software Engineer role at Google. How are you feeling today?",
    timestamp: 5,
    persona: "Marcus Johnson",
  },
  {
    id: "m2",
    role: "user",
    content:
      "Hi Marcus! Thanks for having me. I'm feeling great, a bit nervous but excited to get started.",
    timestamp: 15,
  },
  {
    id: "m3",
    role: "agent",
    content:
      "That's perfectly normal! Let's start with something easy. Can you tell me what drew you to Google and this particular role?",
    timestamp: 25,
    persona: "Marcus Johnson",
  },
  {
    id: "m4",
    role: "user",
    content:
      "Absolutely. I've been following Google's work on distributed systems and infrastructure for years. At my current role at Leapfrog, I've been building voice AI infrastructure that handles real-time audio processing at scale, and I'd love to bring that experience to Google Cloud's platform team.",
    timestamp: 40,
  },
  {
    id: "m5",
    role: "agent",
    content:
      "That's a great answer — I can see the alignment. Now, tell me about a time you had to adapt quickly to a major change at work.",
    timestamp: 55,
    persona: "Marcus Johnson",
  },
  {
    id: "m6",
    role: "user",
    content:
      "Sure. When our main client suddenly needed to support 10 languages instead of 2, I had to completely rearchitect our NLP pipeline within three weeks. I reorganized the team into two squads, set up parallel workstreams, and we delivered on time with 99.2% accuracy across all languages.",
    timestamp: 75,
  },
  {
    id: "m7",
    role: "agent",
    content:
      "Excellent use of the STAR format there. Thank you, Suman. I'll now hand you over to Sarah Chen, our Senior Engineering Manager, for the behavioral portion. Sarah?",
    timestamp: 90,
    persona: "Marcus Johnson",
  },
  {
    id: "m8",
    role: "agent",
    content:
      "Hi Suman! I'm Sarah, nice to meet you. Marcus shared some great context. Let me dive deeper — tell me about a time you led a technical project that had significant cross-team impact.",
    timestamp: 100,
    persona: "Sarah Chen",
  },
  {
    id: "m9",
    role: "user",
    content:
      "At Leapfrog, I led the migration of our voice processing pipeline from a monolithic architecture to microservices. This affected 5 teams and about 50 million daily API calls. I created a detailed migration plan with rollback strategies, held weekly syncs with all teams, and we completed the migration with zero downtime over 6 weeks.",
    timestamp: 125,
  },
  {
    id: "m10",
    role: "agent",
    content:
      "Impressive scale. What was the biggest pushback you faced and how did you handle it?",
    timestamp: 140,
    persona: "Sarah Chen",
  },
  {
    id: "m11",
    role: "user",
    content:
      "The ML team was concerned about latency increases with the new service boundaries. I organized a proof-of-concept sprint where we benchmarked the critical path. The data showed only a 12ms increase, which was within our SLA. That evidence convinced them, and we actually found ways to optimize further during the migration.",
    timestamp: 165,
  },
  {
    id: "m12",
    role: "agent",
    content:
      "Great approach — data-driven decision making. Now let me bring in Alex Rivera for the technical portion. Alex?",
    timestamp: 180,
    persona: "Sarah Chen",
  },
  {
    id: "m13",
    role: "agent",
    content:
      "Hey Suman, Alex here. Let's get into the technical stuff. Can you walk me through how you'd design a distributed rate limiter for Google's API gateway?",
    timestamp: 195,
    persona: "Alex Rivera",
  },
  {
    id: "m14",
    role: "user",
    content:
      "Sure! First, let me clarify the requirements. Are we talking about per-user rate limiting, per-API-key, or global? And what's the expected QPS?... Assuming per-API-key at 100K QPS globally, I'd use a sliding window approach with Redis clusters for the counter store. Each API gateway node checks the local Redis replica first, then syncs with the primary asynchronously to handle the distributed nature.",
    timestamp: 230,
  },
  {
    id: "m15",
    role: "agent",
    content:
      "Good clarifying questions. What happens if Redis goes down? How do you handle that failure mode?",
    timestamp: 250,
    persona: "Alex Rivera",
  },
];

export const MOCK_INITIAL_FEEDBACK: FeedbackState = {
  confidence: 72,
  pace: "good",
  fillerWords: 3,
  fillerInstances: [],
};

export const MOCK_COACHING_NOTES: CoachingNote[] = [
  {
    id: "n1",
    timestamp: 15,
    type: "positive",
    message: "Great energy and enthusiasm in your introduction",
    category: "communication",
  },
  {
    id: "n2",
    timestamp: 40,
    type: "positive",
    message: "Strong alignment between your experience and the target role",
    category: "content",
  },
  {
    id: "n3",
    timestamp: 60,
    type: "suggestion",
    message: "Try to pause briefly before answering to gather your thoughts",
    category: "communication",
  },
  {
    id: "n4",
    timestamp: 75,
    type: "positive",
    message: "Excellent STAR format — specific metrics (99.2% accuracy, 10 languages)",
    category: "content",
  },
  {
    id: "n5",
    timestamp: 125,
    type: "positive",
    message: "Great example of leadership at scale — 5 teams, 50M daily calls",
    category: "content",
  },
  {
    id: "n6",
    timestamp: 150,
    type: "suggestion",
    message: "Speaking pace increased slightly under pressure — try to slow down",
    category: "communication",
  },
  {
    id: "n7",
    timestamp: 165,
    type: "positive",
    message: "Data-driven approach to handling pushback — strong senior signal",
    category: "technical",
  },
  {
    id: "n8",
    timestamp: 230,
    type: "positive",
    message: "Good clarifying questions before diving into system design",
    category: "technical",
  },
  {
    id: "n9",
    timestamp: 235,
    type: "concern",
    message: "Could elaborate more on trade-offs between consistency models",
    category: "technical",
  },
];

export const MOCK_PHASES: InterviewPhase[] = [
  {
    phaseNumber: 1,
    phaseType: "hr",
    interviewerName: "Marcus Johnson",
    role: "Director of People",
    status: "complete",
  },
  {
    phaseNumber: 2,
    phaseType: "behavioral",
    interviewerName: "Sarah Chen",
    role: "Senior Engineering Manager",
    status: "active",
  },
  {
    phaseNumber: 3,
    phaseType: "technical",
    interviewerName: "Alex Rivera",
    role: "Staff Software Engineer",
    status: "pending",
  },
];

export const MOCK_SCORECARD: Scorecard = {
  sessionId: "session-abc-123",
  interviewType: "mock",
  overallScore: 78,
  overallSummary:
    "Strong performance with room for improvement in delivery confidence. Technical depth is solid at Senior level, with particularly impressive system design thinking.",
  categories: [
    {
      name: "Communication",
      score: 82,
      description: "Clear, structured responses with good STAR usage",
    },
    {
      name: "Technical",
      score: 75,
      description: "Solid system design, could elaborate on trade-offs",
    },
    {
      name: "Vocal Delivery",
      score: 68,
      description: "Vocal delivery confident, occasional hesitation under pressure",
    },
    {
      name: "Overall Presence",
      score: 80,
      description: "Professional demeanor, confident tone",
    },
  ],
  strengths: [
    "Used STAR format effectively in behavioral questions",
    "Clear communication of technical architecture decisions",
    "Good use of specific metrics and numbers in examples",
    "Strong system design thinking with scalability awareness",
    "Professional and composed throughout the interview",
  ],
  improvements: [
    "Hesitated and used filler words when thinking through answers",
    "Speaking pace increased noticeably under pressure (2:34-3:12)",
    "Could expand more on system design trade-offs and alternatives",
    "Filler words increased during technical questions",
    "Consider pausing before answering instead of rushing in",
  ],
  keyMoments: [
    {
      id: "k1",
      timestamp: 75,
      type: "positive",
      message:
        "Great example of adaptability — rearchitected NLP pipeline for 10 languages in 3 weeks",
    },
    {
      id: "k2",
      timestamp: 125,
      type: "positive",
      message:
        "Strong leadership story — led migration affecting 50M daily API calls across 5 teams",
    },
    {
      id: "k3",
      timestamp: 165,
      type: "positive",
      message:
        "Recovered well with data-driven approach to handling ML team pushback",
    },
    {
      id: "k4",
      timestamp: 230,
      type: "positive",
      message:
        "Good clarifying questions before system design — shows senior-level thinking",
    },
    {
      id: "k5",
      timestamp: 250,
      type: "concern",
      message:
        "Could have elaborated more on Redis failure modes and fallback strategies",
    },
  ],
  analytics: {
    speakingTimePct: 68,
    avgConfidence: 74,
    fillerWordCount: 12,
    fillerWordBreakdown: { um: 5, uh: 4, like: 3 },
    questionsAnswered: 8,
    phasesCompleted: 3,
  },
  phaseScores: [
    {
      phaseType: "hr",
      interviewerName: "Marcus Johnson",
      score: 82,
      summary: "Strong culture fit, clear motivation and career alignment",
      highlights: [
        "Articulated career goals clearly",
        "Good cultural awareness and company research",
      ],
    },
    {
      phaseType: "behavioral",
      interviewerName: "Sarah Chen",
      score: 76,
      summary: "Good STAR format usage but needs more quantitative metrics",
      highlights: [
        "Strong leadership example at scale",
        "Data-driven conflict resolution approach",
      ],
    },
    {
      phaseType: "technical",
      interviewerName: "Alex Rivera",
      score: 74,
      summary: "Solid system design thinking with good clarifying questions",
      highlights: [
        "Good scaling approach for rate limiter",
        "Could elaborate more on trade-offs and failure modes",
      ],
    },
  ],
  levelCalibration: {
    selectedLevel: "senior",
    calibratedLevel: "senior",
    thetaPath: [3.5, 3.5, 4.0, 4.0, 3.5, 4.0],
    strongestArea: "System Design (Senior+)",
    growthArea: "Behavioral storytelling (Mid level)",
    recommendation:
      "Your technical depth is solidly Senior and pushing toward Staff. Focus on structuring your behavioral responses with more concrete metrics and multi-team impact examples to match your technical caliber.",
  },
  generatedAt: "2026-03-01T12:00:00Z",
  config: {
    candidateName: "Suman",
    targetRole: "Senior Software Engineer",
    experienceLevel: "senior",
    roleType: "backend",
    primaryLanguage: "python",
    techStack: ["Django", "PostgreSQL", "Redis", "Docker"],
    interviewType: "mock",
  },
  durationSeconds: 872,
};
