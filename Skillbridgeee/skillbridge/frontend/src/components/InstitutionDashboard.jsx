// components/InstitutionDashboard.jsx
// Aggregate skill-gap analytics across students -- this is the piece
// that fulfils the "colleges get data-driven insight" part of the PS.
// Uses seed data for demo purposes; wire to a Firestore aggregation
// query once you have real student records (see comment at bottom).
import { motion } from "framer-motion";
import React from "react";

const SKILL_GAPS = [
  { skill: "Data Structures & Algorithms", percentage: 22 },
  { skill: "System Design & Architecture", percentage: 31 },
  { skill: "Database Management (SQL/NoSQL)", percentage: 40 },
  { skill: "Object-Oriented Programming (C++)", percentage: 55 },
  { skill: "Version Control (Git/GitHub)", percentage: 78 },
];

function SkillRing({ skill, percentage }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage < 35 ? "#C9573F" : percentage < 65 ? "#C97A3D" : "#5C8A5E";

  return (
    <motion.div
      style={styles.ringCard}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E9E4D6" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1E3D34">
          {percentage}%
        </text>
      </svg>
      <p style={styles.ringLabel}>{skill}</p>
    </motion.div>
  );
}

export default function InstitutionDashboard() {
  return (
    <motion.div style={styles.page}>
      <h2 style={styles.heading}>Institution skill-gap dashboard</h2>
      <p style={styles.sub}>
        Average skill level across your students, weakest first — these are your targeted-training priorities.
      </p>
      <motion.div style={styles.ringGrid}>
        {SKILL_GAPS.map((g) => (
          <SkillRing key={g.skill} skill={g.skill} percentage={g.percentage} />
        ))}
      </motion.div>
    </motion.div>
  );
}

// ---- Wiring to real data ----
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../firebase";
// Pull every student doc's `skills` array, flatten them into
// { skill, percentage } entries like SKILL_GAPS above, then render
// the same way -- no changes needed to SkillRing or the layout.

const styles = {
  page: { maxWidth: 720, margin: "0 auto", padding: "32px 20px" },
  heading: { fontFamily: "Georgia, serif", fontSize: 28, color: "#1E3D34", margin: "0 0 4px" },
  sub: { color: "#5B6B63", marginBottom: 28, fontSize: 14, maxWidth: 480 },
  ringGrid: { display: "flex", flexWrap: "wrap", gap: 28, justifyContent: "flex-start" },
  ringCard: { display: "flex", flexDirection: "column", alignItems: "center", width: 140 },
  ringLabel: { fontSize: 12, fontWeight: 600, textAlign: "center", marginTop: 8, color: "#33443B" },
};