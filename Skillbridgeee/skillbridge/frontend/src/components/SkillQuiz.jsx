// components/SkillQuiz.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";

const QUESTIONS = [
  {
    q: "What does 'Big O notation' describe?",
    options: ["File size", "Algorithm efficiency/complexity", "Color codes", "Network speed"],
    correct: 1,
  },
  {
    q: "Which of these is NOT a JavaScript data type?",
    options: ["String", "Boolean", "Float", "Undefined"],
    correct: 2,
  },
  {
    q: "What is the primary purpose of Git?",
    options: ["Version control", "Database management", "UI design", "Server hosting"],
    correct: 0,
  },
  {
    q: "In OOP, what does 'inheritance' allow?",
    options: [
      "Deleting unused code",
      "A class to reuse properties/methods of another class",
      "Faster compilation",
      "Automatic error handling",
    ],
    correct: 1,
  },
  {
    q: "What does SQL stand for?",
    options: [
      "Simple Query Language",
      "System Quality Level",
      "Structured Query Language",
      "Sequential Query Logic",
    ],
    correct: 2,
  },
];

function getLevel(score) {
  if (score <= 1) return "Beginner";
  if (score <= 3) return "Intermediate";
  if (score === 4) return "Advanced";
  return "Expert";
}

export default function SkillQuiz({ onDone }) {
  const { currentUser } = useAuth();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  function selectAnswer(index) {
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);

    if (current + 1 < QUESTIONS.length) {
      setCurrent(current + 1);
    } else {
      const finalScore = newAnswers.filter((a, i) => a === QUESTIONS[i].correct).length;
      setScore(finalScore);
      setFinished(true);
      saveResult(finalScore);
    }
  }

  async function saveResult(finalScore) {
    if (!currentUser) return;
    const level = getLevel(finalScore);
    await updateDoc(doc(db, "profiles", currentUser.uid), {
      quizScore: finalScore,
      skillLevel: level,
    });
  }

  if (finished) {
    return (
      <motion.div style={styles.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 style={styles.resultTitle}>You scored {score} / 5</h2>
        <p style={styles.resultLevel}>Skill level: {getLevel(score)}</p>
        <motion.button
          style={styles.button}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDone}
        >
          Continue
        </motion.button>
      </motion.div>
    );
  }

  const q = QUESTIONS[current];

  return (
    <motion.div style={styles.card} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p style={styles.progress}>Question {current + 1} of {QUESTIONS.length}</p>
      <h3 style={styles.question}>{q.q}</h3>
      <div style={styles.options}>
        {q.options.map((opt, i) => (
          <motion.button
            key={i}
            style={styles.optionBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectAnswer(i)}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    maxWidth: 480,
    margin: "40px auto",
    background: "rgba(30,61,52,0.95)",
    padding: "28px 24px",
    borderRadius: 16,
    color: "#F4EFE6",
    boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
  },
  progress: { fontSize: 12, opacity: 0.7, marginBottom: 8 },
  question: { fontSize: 18, marginBottom: 18 },
  options: { display: "flex", flexDirection: "column", gap: 10 },
  optionBtn: {
    textAlign: "left",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid rgba(244,239,230,0.3)",
    background: "rgba(244,239,230,0.08)",
    color: "#F4EFE6",
    cursor: "pointer",
    fontSize: 14,
  },
  resultTitle: { fontSize: 24, marginBottom: 8 },
  resultLevel: { fontSize: 16, opacity: 0.9, marginBottom: 20 },
  button: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};