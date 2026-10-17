// components/AIGuide.jsx
// A floating assistant that looks at the user's current profile/app state
// and tells them exactly what to do next. This is intentionally
// RULE-BASED, not a live LLM call -- for a hackathon demo that's the
// right tradeoff: it always works, costs nothing, needs no API key, and
// can't fail if the wifi drops during judging.
//
// UPGRADE PATH (only if you have spare time on day 2): replace
// answerQuestion() with a call to a real AI API (OpenAI, Anthropic, etc.)
// passing the same `state` object as context in the prompt. Keep this
// rule-based version as a fallback in case the API call fails live.
import { motion } from "framer-motion";
import React, { useState } from "react";

// The core "brain" of the guide: a priority-ordered checklist. The first
// unmet condition is what the student needs to do next.
function getGuidance(state) {
  const {
    profileComplete,
    skillsAssessed,
    hasResume,
    appliedToAny,
    matchedJobsAvailable,
  } = state;

  if (!profileComplete) {
    return {
      step: "Complete your profile",
      detail:
        "Add your name, college, engineering branch, and year of study. This is the foundation everything else builds on.",
      action: "profile",
    };
  }
  if (!skillsAssessed) {
    return {
      step: "Take the skill assessment",
      detail:
        "Rate your proficiency across core technical skills (languages, frameworks, DSA, tools). This powers your match scores with internships and placements.",
      action: "assessment",
    };
  }
  if (!hasResume) {
    return {
      step: "Upload your resume or add a project",
      detail:
        "Recruiters filter by portfolio strength. Even one GitHub project, certification, or hackathon entry makes a real difference to your visibility.",
      action: "portfolio",
    };
  }
  if (matchedJobsAvailable && !appliedToAny) {
    return {
      step: "Check your matched internships",
      detail:
        "Based on your skills, we've ranked internships and placement openings by match percentage. Start with your top matches.",
      action: "jobs",
    };
  }
  return {
    step: "You're all set",
    detail:
      "Keep an eye on new internship and placement postings, and consider strengthening any skill gaps shown on your matches.",
    action: "none",
  };
}

// The "chat brain": takes a free-text question + current state, returns
// an answer. Keyword-matching, not a real language model -- but it reads
// naturally in a demo because the answers are grounded in real app state.
function answerQuestion(question, state) {
  const q = question.toLowerCase();
  const guidance = getGuidance(state);

  if (q.includes("next") || q.includes("what should i do") || q.includes("help")) {
    return `${guidance.step}. ${guidance.detail}`;
  }
  if (q.includes("profile")) {
    return state.profileComplete
      ? "Your profile is complete. You can still update it any time from the Profile tab."
      : "Your profile isn't complete yet. Add your name, college, branch, and year of study on the Profile tab.";
  }
  if (q.includes("skill") || q.includes("assessment") || q.includes("dsa") || q.includes("coding")) {
    return state.skillsAssessed
      ? "You've completed your skill assessment. It's already factored into your internship and placement match scores."
      : "You haven't taken the skill assessment yet. It only takes a couple of minutes and directly improves your match scores.";
  }
  if (q.includes("resume") || q.includes("portfolio") || q.includes("project") || q.includes("github")) {
    return state.hasResume
      ? "You've added a resume/project. Recruiters can already see this in your profile."
      : "You haven't added a resume or project yet. Even one GitHub project or certification noticeably improves how recruiters see you.";
  }
  if (q.includes("match") || q.includes("internship") || q.includes("placement") || q.includes("job") || q.includes("score") || q.includes("percentage")) {
    return state.matchedJobsAvailable
      ? "Your matched internships and placements are ranked by percentage on the Internships tab -- start with your highest match."
      : "No matches are showing yet. Complete your profile and skill assessment first so we can calculate matches.";
  }
  if (q.includes("applied") || q.includes("application")) {
    return state.appliedToAny
      ? "You've applied to at least one opening. You can track status from the Internships tab."
      : "You haven't applied to anything yet. Check your top matches on the Internships tab and hit Apply.";
  }
  if (q.includes("hi") || q.includes("hello") || q.includes("hey")) {
    return "Hey! Ask me things like \"what should I do next\" or \"why is my match score low\" and I'll answer based on your actual profile.";
  }

  return `I'm not sure about that specific one, but here's where you stand right now: ${guidance.step}. ${guidance.detail}`;
}

const SUGGESTIONS = ["What should I do next?", "How are matches calculated?", "Is my profile complete?"];

export default function AIGuide({ state, onNavigate }) {
  const [open, setOpen] = useState(true);
  const guidance = getGuidance(state);
  const [messages, setMessages] = useState([
    { from: "guide", text: `${guidance.step}. ${guidance.detail}` },
  ]);
  const [input, setInput] = useState("");

  function send(text) {
    const question = (text ?? input).trim();
    if (!question) return;
    const answer = answerQuestion(question, state);
    setMessages((prev) => [...prev, { from: "user", text: question }, { from: "guide", text: answer }]);
    setInput("");
  }

  return (
    <motion.div style={styles.wrapper}>
      {open ? (
        <motion.div
          style={styles.card}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          
         <div style={styles.shine} />
<motion.div style={styles.header}>
  <span style={styles.badge}>Guide</span>
  <motion.button style={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Minimize guide">
    –
  </motion.button>
</motion.div>

          <div style={styles.messageList}>
            {messages.map((m, i) => (
              <div key={i} style={m.from === "user" ? styles.userBubble : styles.guideBubble}>
                {m.text}
              </div>
            ))}
          </div>

          {guidance.action !== "none" && (
            <motion.button style={styles.actionBtn} onClick={() => onNavigate(guidance.action)}>
              Go there now
            </motion.button>
          )}

          <div style={styles.suggestionRow}>
            {SUGGESTIONS.map((s) => (
              <motion.button
                key={s}
                style={styles.suggestionChip}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => send(s)}
              >
                {s}
              </motion.button>
            ))}
          </div>

          <div style={styles.inputRow}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question..."
            />
            <motion.button
              style={styles.sendBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => send()}
            >
              Send
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          style={styles.reopenBtn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          aria-label="Open guide"
        >
          Guide
        </motion.button>
      )}
    </motion.div>
  );
}

const styles = {
  wrapper: { position: "fixed", bottom: 24, right: 24, zIndex: 1000, fontFamily: "inherit" },
  card: {
  position: "relative",
  width: 250,
  background: "linear-gradient(160deg, rgba(30, 57, 61, 0.95) 0%, rgba(20,45,38,0.95) 100%)",
  color: "#cfb672",
  borderRadius: 36,
  padding: "16px 18px",
  boxShadow: "0 12px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(200px)",
  overflow: "hidden",
},
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: {
    fontSize: 12,
    letterSpacing: "0.02em",
    background: "#C97A3D",
    color: "#1E3D34",
    padding: "2px 8px",
    borderRadius: 20,
    fontWeight: 600,
  },
  closeBtn: { background: "none", border: "none", color: "#F4EFE6", fontSize: 18, cursor: "pointer" },
  messageList: {
    maxHeight: 220,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 10,
    paddingRight: 4,
  },
  guideBubble: {
    background: "rgba(244,239,230,0.1)",
    borderRadius: "10px 10px 10px 2px",
    padding: "8px 10px",
    fontSize: 13,
    lineHeight: 1.4,
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  userBubble: {
    background: "#C97A3D",
    color: "#1E3D34",
    borderRadius: "10px 10px 2px 10px",
    padding: "8px 10px",
    fontSize: 13,
    lineHeight: 1.4,
    alignSelf: "flex-end",
    maxWidth: "90%",
    fontWeight: 600,
  },
  actionBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
    marginBottom: 10,
    width: "100%",
  },
  suggestionRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  suggestionChip: {
    background: "rgba(244,239,230,0.12)",
    color: "#F4EFE6",
    border: "1px solid rgba(244,239,230,0.3)",
    borderRadius: 14,
    padding: "5px 10px",
    fontSize: 11,
    cursor: "pointer",
  },
  inputRow: { display: "flex", gap: 6 },
  input: {
    flex: 1,
    borderRadius: 8,
    border: "1px solid rgba(244,239,230,0.3)",
    background: "rgba(244,239,230,0.08)",
    color: "#F4EFE6",
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
  },
  sendBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
  },
  reopenBtn: {
    background: "#1E3D34",
    color: "#F4EFE6",
    border: "none",
    borderRadius: 24,
    padding: "10px 18px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
  },
  shine: {
  position: "absolute",
  top: 0,
  left: "-40%",
  width: "60%",
  height: "100%",
  background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.05) 55%, transparent 100%)",
  pointerEvents: "none",
  transform: "skewX(-15deg)",
},
};