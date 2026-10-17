// components/SkillExchange.jsx
// Lets students list skills they can teach and skills they want to
// learn, then matches them with complementary students for a 2-way
// skill exchange. Connecting opens a chat to coordinate.
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";
import ChatModal from "./ChatModal";

function parseSkills(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SkillExchange({ myProfile, onProfileUpdate }) {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachInput, setTeachInput] = useState((myProfile.skillsToTeach || []).join(", "));
  const [learnInput, setLearnInput] = useState((myProfile.skillsToLearn || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [chatWith, setChatWith] = useState(null);

  useEffect(() => {
    async function loadAll() {
      const snap = await getDocs(collection(db, "profiles"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.id !== currentUser.uid && p.name);
      setProfiles(list);
      setLoading(false);
    }
    loadAll();
  }, [currentUser]);

  async function saveMySkills() {
    setSaving(true);
    const skillsToTeach = parseSkills(teachInput);
    const skillsToLearn = parseSkills(learnInput);
    await updateDoc(doc(db, "profiles", currentUser.uid), {
      skillsToTeach,
      skillsToLearn,
    });
    onProfileUpdate();
    setSaving(false);
  }

  const myTeach = myProfile.skillsToTeach || [];
  const myLearn = myProfile.skillsToLearn || [];

  const matches = profiles
    .map((p) => {
      const theirTeach = p.skillsToTeach || [];
      const theirLearn = p.skillsToLearn || [];
      const theyTeachWhatIWant = theirTeach.filter((s) =>
        myLearn.some((m) => m.toLowerCase() === s.toLowerCase())
      );
      const iTeachWhatTheyWant = myTeach.filter((s) =>
        theirLearn.some((l) => l.toLowerCase() === s.toLowerCase())
      );
      return {
        ...p,
        theyTeachWhatIWant,
        iTeachWhatTheyWant,
        matchScore: theyTeachWhatIWant.length + iTeachWhatTheyWant.length,
      };
    })
    .filter((p) => p.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40 }}>Loading skill exchange...</p>;
  }

  return (
    <motion.div style={styles.page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={styles.heading}>Skill Exchange</h2>
      <p style={styles.sub}>List what you can teach and what you want to learn — we'll match you with students for a two-way trade.</p>

      <div style={styles.setupCard}>
        <label style={styles.label}>Skills I can teach (comma separated)</label>
        <input
          style={styles.input}
          placeholder="e.g. Python, Git, UI Design"
          value={teachInput}
          onChange={(e) => setTeachInput(e.target.value)}
        />
        <label style={styles.label}>Skills I want to learn (comma separated)</label>
        <input
          style={styles.input}
          placeholder="e.g. React, DSA, SQL"
          value={learnInput}
          onChange={(e) => setLearnInput(e.target.value)}
        />
        <motion.button
          style={styles.saveBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={saveMySkills}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save my skills"}
        </motion.button>
      </div>

      <h3 style={styles.matchesHeading}>Your matches</h3>

      {matches.length === 0 && (
        <p style={styles.empty}>
          No matches yet — add skills above, and matches will appear once other students list complementary ones.
        </p>
      )}

      <div style={styles.list}>
        {matches.map((p) => {
          const initials = (p.name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
          return (
            <motion.div
              key={p.id}
              style={styles.card}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.01, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
            >
              <div style={styles.cardTop}>
                <div style={styles.avatar}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={styles.name}>{p.name}</p>
                  <p style={styles.meta}>{p.branch || "Branch not set"} • Year {p.year || "—"}</p>
                </div>
                <motion.button
                  style={styles.connectBtn}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setChatWith({ id: p.id, name: p.name })}
                >
                  Connect
                </motion.button>
              </div>

              {p.theyTeachWhatIWant.length > 0 && (
                <p style={styles.matchLine}>
                  <span style={styles.matchLabel}>They can teach you:</span>{" "}
                  {p.theyTeachWhatIWant.join(", ")}
                </p>
              )}
              {p.iTeachWhatTheyWant.length > 0 && (
                <p style={styles.matchLine}>
                  <span style={styles.matchLabel}>You can teach them:</span>{" "}
                  {p.iTeachWhatTheyWant.join(", ")}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {chatWith && (
        <ChatModal
          otherUser={chatWith}
          myName={myProfile.name || "Student"}
          onClose={() => setChatWith(null)}
        />
      )}
    </motion.div>
  );
}

const styles = {
  page: { maxWidth: 560, margin: "0 auto", padding: "20px 20px 40px" },
  heading: { fontFamily: "Georgia, serif", fontSize: 24, color: "#1E3D34", margin: "0 0 4px" },
  sub: { fontSize: 13, color: "#5B6B63", marginBottom: 20, lineHeight: 1.5 },
  setupCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 28,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: { fontSize: 12, fontWeight: 700, color: "#1E3D34", marginTop: 6 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  saveBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 8,
  },
  matchesHeading: { fontSize: 16, color: "#1E3D34", marginBottom: 12 },
  empty: { fontSize: 14, color: "#8A8A7C", textAlign: "center", padding: 24 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "14px 16px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  },
  cardTop: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  avatar: {
    width: 42, height: 42, borderRadius: "50%", background: "#1E3D34", color: "#F4EFE6",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  name: { fontSize: 14, fontWeight: 700, color: "#1E3D34", margin: 0 },
  meta: { fontSize: 12, color: "#8A8A7C", margin: 0 },
  connectBtn: {
    background: "#1E3D34", color: "#F4EFE6", border: "none", borderRadius: 8,
    padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0,
  },
  matchLine: { fontSize: 12, color: "#33443B", margin: "4px 0 0" },
  matchLabel: { fontWeight: 700, color: "#C97A3D" },
};