// components/JobBoard.jsx
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { matchScore, findGaps } from "../matchingEngine";

// Seed listings so the demo has something to show without needing a
// live employer to have posted anything yet. In the real app these
// come from Firestore's "jobs" collection -- replace this array with a
// Firestore query (see comment at bottom of file).
const engineeringInternships = [
  {
    id: 1,
    title: "Full Stack Developer Intern",
    company: "TechCorp Solutions",
    matchPercentage: 85,
    requiredSkills: ["React", "Node.js", "Express", "MongoDB"],
    missingSkills: ["Docker"]
  },
  {
    id: 2,
    title: "AI/ML Research Intern",
    company: "InnovateX Labs",
    matchPercentage: 70,
    requiredSkills: ["Python", "Pandas", "Scikit-Learn", "Machine Learning"],
    missingSkills: ["PyTorch", "CUDA"]
  },
  {
    id: 3,
    title: "Software Engineering Trainee",
    company: "Global Solutions Inc.",
    matchPercentage: 60,
    requiredSkills: ["C++", "Data Structures", "Algorithms", "Git"],
    missingSkills: ["System Design", "SQL"]
  }
];

export default function JobBoard({ studentSkills, onApply }) {
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function rank() {
      const scored = await Promise.all(
        engineeringInternships.map(async (job) => ({
          ...job,
          score: await matchScore(studentSkills, job.requiredSkills),
          gaps: findGaps(studentSkills, job.requiredSkills),
        }))
      );
      scored.sort((a, b) => b.score - a.score);
      if (!cancelled) {
        setRanked(scored);
        setLoading(false);
      }
    }
    rank();
    return () => { cancelled = true; };
  }, [studentSkills]);

  if (loading) return <p style={{ padding: 32 }}>Ranking internships against your skills…</p>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Matched internships</h2>
      <p style={styles.sub}>Ranked by match with your skill profile.</p>
      <div style={styles.list}>
        {ranked.map((job) => (
          <div key={job.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.title}>{job.title}</p>
                <p style={styles.org}>{job.org}</p>
              </div>
              <div style={styles.scoreBadge(job.score)}>{job.score}%</div>
            </div>
            {job.gaps.length > 0 && (
              <p style={styles.gaps}>Consider strengthening: {job.gaps.join(", ")}</p>
            )}
            <button style={styles.applyBtn} onClick={() => onApply(job.id)}>Apply</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Wiring to real data (do this once profile flow is solid) ----
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../firebase";
// const snapshot = await getDocs(collection(db, "jobs"));
// const jobs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

const styles = {
  page: { maxWidth: 640, margin: "0 auto", padding: "32px 20px" },
  heading: { fontFamily: "Georgia, serif", fontSize: 28, color: "#1E3D34", margin: "0 0 4px" },
  sub: { color: "#5B6B63", marginBottom: 24, fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  card: { border: "1px solid #E2DCCC", borderRadius: 10, padding: 18, background: "#FBF9F4" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontWeight: 700, fontSize: 15, color: "#1E3D34", margin: 0 },
  org: { fontSize: 13, color: "#5B6B63", margin: "2px 0 0" },
  scoreBadge: (score) => ({
    fontWeight: 700,
    fontSize: 14,
    padding: "4px 10px",
    borderRadius: 20,
    color: "#1E3D34",
    background: score >= 70 ? "#CFE3B4" : score >= 40 ? "#F0DDB0" : "#EFC9C0",
  }),
  gaps: { fontSize: 12, color: "#8A5A2E", marginTop: 10 },
  applyBtn: {
    marginTop: 12,
    background: "#1E3D34",
    color: "#F4EFE6",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
};
