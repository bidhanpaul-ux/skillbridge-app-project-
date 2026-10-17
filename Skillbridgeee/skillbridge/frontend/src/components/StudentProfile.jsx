// components/StudentProfile.jsx
import { motion } from "framer-motion";
import React, { useState } from "react";

const DISCIPLINES = ["Computer Science and Engineering (CSE)", "Information Technology (IT)", "Electronics and Communication Engineering (ECE)", "Electrical Engineering", "Mechanical Engineering","Civil Engineering","Artificial Intelligence and Data Science"];

export default function StudentProfile({ profile, onSave }) {
  const [form, setForm] = useState(profile);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, complete: true });
  };

  return (
    <motion.div style={styles.page}>
      <h2 style={styles.heading}>Your profile</h2>
      <p style={styles.sub}>This is what institutions and employers see first.</p>
      <form onSubmit={submit} style={styles.form}>
        <label style={styles.label}>
          Full name
          <input style={styles.input} value={form.name || ""} onChange={update("name")} required />
        </label>
        <label style={styles.label}>
          Institution
          <input style={styles.input} value={form.institution || ""} onChange={update("institution")} required />
        </label>
        <label style={styles.label}>
          Engineering/Tech Streams
          <select style={styles.input} value={form.discipline || ""} onChange={update("discipline")} required>
            <option value="" disabled>Choose one</option>
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <label style={styles.label}>
          Year of study
          <input style={styles.input} type="number" min="1" max="6" value={form.year || ""} onChange={update("year")} required />
        </label>
        <button type="submit" style={styles.button}>Save profile</button>
      </form>
    </motion.div>
  );
}

const styles = {
  page: { maxWidth: 480, margin: "0 auto", padding: "32px 20px" },
  heading: { fontFamily: "Georgia, serif", fontSize: 28, color: "#1E3D34", margin: "0 0 4px" },
  sub: { color: "#5B6B63", marginBottom: 24, fontSize: 14 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#33443B", fontWeight: 600 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #C9C2B4",
    fontSize: 14,
    fontFamily: "inherit",
  },
  button: {
    marginTop: 8,
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
