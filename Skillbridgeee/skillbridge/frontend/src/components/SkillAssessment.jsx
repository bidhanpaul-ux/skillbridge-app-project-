// components/SkillAssessment.jsx
import { motion } from "framer-motion";
import React, { useState } from "react";

// Skill list per discipline -- expand freely, this is the seed set that
// covers the core competencies judges will recognize as domain-specific.
const SKILLS_BY_DISCIPLINE = {
  Ayurveda: ["Ayurveda", "Panchakarma", "Herbal Formulation", "Pulse Diagnosis", "Patient Counselling"],
  Yoga: ["Yoga Therapy", "Asana Instruction", "Pranayama", "Anatomy & Physiology", "Patient Counselling"],
  Unani: ["Unani Medicine", "Ilaj Bit Tadbeer", "Pharmacognosy", "Patient Counselling"],
  Siddha: ["Siddha Medicine", "Varma Therapy", "Herbal Formulation", "Patient Counselling"],
  Homeopathy: ["Homeopathy", "Case Taking", "Repertorization", "Patient Counselling"],
};
const GENERAL_SKILLS = ["Research Writing", "Communication", "Digital Literacy", "Clinical Documentation"];

export default function SkillAssessment({ discipline, existingSkills, onSave }) {
  const skillList = [...(SKILLS_BY_DISCIPLINE[discipline] || []), ...GENERAL_SKILLS];
  const initial = Object.fromEntries(
    skillList.map((s) => [s, existingSkills?.find((es) => es.name === s.toLowerCase())?.level ?? 50])
  );
  const [levels, setLevels] = useState(initial);

  const submit = () => {
    const skills = Object.entries(levels).map(([name, level]) => ({
      name: name.toLowerCase(),
      level: Number(level),
    }));
    onSave(skills);
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Skill assessment</h2>
      <p style={styles.sub}>Rate yourself honestly — this drives your internship match scores.</p>
      <div style={styles.list}>
        {skillList.map((skill) => (
          <div key={skill} style={styles.row}>
            <div style={styles.rowHeader}>
              <span>{skill}</span>
              <span style={styles.value}>{levels[skill]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={levels[skill]}
              onChange={(e) => setLevels({ ...levels, [skill]: e.target.value })}
              style={styles.slider}
            />
          </div>
        ))}
      </div>
      <button style={styles.button} onClick={submit}>Save assessment</button>
    </div>
  );
}

const styles = {
  page: { maxWidth: 520, margin: "0 auto", padding: "32px 20px" },
  heading: { fontFamily: "Georgia, serif", fontSize: 28, color: "#1E3D34", margin: "0 0 4px" },
  sub: { color: "#5B6B63", marginBottom: 24, fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 20 },
  row: { display: "flex", flexDirection: "column", gap: 6 },
  rowHeader: { display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "#33443B" },
  value: { color: "#C97A3D" },
  slider: { width: "100%" },
  button: {
    marginTop: 28,
    background: "#1E3D34",
    color: "#F4EFE6",
    border: "none",
    borderRadius: 8,
    padding: "12px 20px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
};
