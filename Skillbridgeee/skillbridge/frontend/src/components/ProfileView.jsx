// components/ProfileView.jsx
// A read-only, LinkedIn-style display of the student's saved profile.
// Shown after "Save profile" instead of always showing the edit form.
import VerifyIdentity from "./VerifyIdentity";
import { useAuth } from "../AuthContext";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ProfileView({ profile, onEdit }) {
  const initials = (profile.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [showAISummary, setShowAISummary] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { currentUser } = useAuth();
  const [showVerify, setShowVerify] = useState(false);

  async function openAISummary() {
    setShowAISummary(true);
    setLoadingPosts(true);
    const q = query(
      collection(db, "projects"),
      where("authorId", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    setPosts(snap.docs.map((d) => d.data()));
    setLoadingPosts(false);
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
  
    const img = new Image();
    const reader = new FileReader();
  
    reader.onload = () => {
      img.onload = async () => {
        const maxSize = 300;
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
  
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
  
        try {
          await updateDoc(doc(db, "profiles", currentUser.uid), {
            photoUrl: compressed,
          });
          window.location.reload();
        } catch (err) {
          alert("Photo still too large or failed to save. Try a smaller/simpler photo.");
          setUploadingPhoto(false);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  async function removePhoto() {
    await updateDoc(doc(db, "profiles", currentUser.uid), {
      photoUrl: null,
    });
    window.location.reload();
  }
  function buildSummary() {
    const name = profile.name || "This student";
    const parts = [];

    parts.push(`${name} is a Year ${profile.year || "—"} student`);
    if (profile.branch) parts.push(`studying ${profile.branch}`);
    if (profile.institution) parts.push(`at ${profile.institution}`);
    parts.push(".");

    let summary = parts.join(" ").replace(" .", ".");

    if (profile.skillLevel) {
      summary += ` Their assessed skill level is ${profile.skillLevel}`;
      if (profile.quizScore != null) summary += ` (scored ${profile.quizScore}/5 on the skill quiz)`;
      summary += ".";
    }

    if (posts.length > 0) {
      summary += ` They've shared ${posts.length} project${posts.length > 1 ? "s" : ""} on the portfolio feed, including "${posts[0].title}".`;
    } else {
      summary += ` They haven't posted any projects yet.`;
    }

    const followers = profile.followers?.length ?? 0;
    const following = profile.following?.length ?? 0;
    summary += ` Currently has ${followers} follower${followers !== 1 ? "s" : ""} and follows ${following} student${following !== 1 ? "s" : ""} on SkillBridge.`;

    return summary;
  }

  return (
    <motion.div
      style={styles.page}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={styles.coverBanner} />

      <div style={styles.card}>
        <div style={styles.avatarWrap}>
          <motion.label
            style={styles.avatar}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {profile.photoUrl ? (
              <motion.img
                src={profile.photoUrl}
                alt="profile"
                style={styles.avatarImg}
                initial={{ opacity: 0, scale: 1.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              />
            ) : uploadingPhoto ? (
              "..."
            ) : (
              initials
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
          </motion.label>{profile.photoUrl && (
  <button
    style={styles.removePhotoBtn}
    onClick={(e) => {
      e.preventDefault();
      removePhoto();
    }}
    aria-label="Remove photo"
  >
    ✕
  </button>
)}
          <motion.button
            style={styles.aiButton}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={openAISummary}
            aria-label="AI summary"
          >
            ✨
          </motion.button>
        </div>

        <h2 style={styles.name}>
  {profile.name || "Unnamed student"}
  {profile.verified && <span style={styles.verifiedBadge} title="Verified">✓</span>}
</h2>
        <p style={styles.subtitle}>
          {profile.branch || "Branch not set"} • Year {profile.year || "—"}
        </p>
        <p style={styles.institution}>{profile.institution || "Institution not set"}</p>

        {profile.skillLevel && (
          <span style={styles.levelBadge}>{profile.skillLevel}</span>
        )}
        {!profile.verified && (
  <motion.button
    style={styles.getVerifiedBtn}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={() => setShowVerify(true)}
  >
    🛡️ Get verified
  </motion.button>
)}

{showVerify && (
  <VerifyIdentity
    profile={profile}
    onClose={() => setShowVerify(false)}
    onVerified={() => window.location.reload()}
  />
)}

        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={styles.statNumber}>{profile.quizScore ?? "-"}/5</span>
            <span style={styles.statLabel}>Quiz score</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNumber}>{profile.followers?.length ?? 0}</span>
            <span style={styles.statLabel}>Followers</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNumber}>{profile.following?.length ?? 0}</span>
            <span style={styles.statLabel}>Following</span>
          </div>
        </div>

        <motion.button
          style={styles.editBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEdit}
        >
          Edit profile
        </motion.button>
      </div>

      {showAISummary && (
        <motion.div
          style={styles.aiBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAISummary(false)}
        >
          <motion.div
            style={styles.aiCard}
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={styles.aiBadgeLabel}>✨ AI Summary</p>
            {loadingPosts ? (
              <p style={styles.aiText}>Analyzing profile...</p>
            ) : (
              <p style={styles.aiText}>{buildSummary()}</p>
            )}
            <motion.button
              style={styles.aiCloseBtn}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAISummary(false)}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

const styles = {
  page: { maxWidth: 480, margin: "0 auto", paddingBottom: 40 },
  coverBanner: {
    height: 0,
  },
  card: {
    background: "#e8e5e0",
    borderRadius: 32,
    padding: "48px 32px 32px",
    textAlign: "center",
    boxShadow: "12px 12px 24px rgba(163,160,152,0.6), -12px -12px 24px rgba(255,255,255,0.9)",
    position: "relative",
  },
  avatarWrap: { position: "relative", width: 96, height: 96, margin: "0 auto 20px" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "#e8e5e0",
    color: "#1E3D34",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
    fontWeight: 700,
    boxShadow: "inset 6px 6px 12px rgba(163,160,152,0.5), inset -6px -6px 12px rgba(255,255,255,0.9)",
    cursor: "pointer",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
  },
  aiButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#C97A3D",
    border: "3px solid #e8e5e0",
    color: "#1E3D34",
    fontSize: 15,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  },
  name: { fontFamily: "Georgia, serif", fontSize: 24, margin: "0 0 6px", color: "#1E3D34" },
  subtitle: { fontSize: 14, color: "#6b6b63", margin: "0 0 2px" },
  institution: { fontSize: 13, color: "#8A8A7C", margin: "0 0 16px" },
  levelBadge: {
    display: "inline-block",
    background: "#e8e5e0",
    color: "#C97A3D",
    fontSize: 12,
    fontWeight: 700,
    padding: "8px 20px",
    borderRadius: 20,
    marginBottom: 20,
    boxShadow: "4px 4px 8px rgba(163,160,152,0.5), -4px -4px 8px rgba(255,255,255,0.9)",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    padding: "20px 0",
    marginBottom: 24,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#e8e5e0",
    borderRadius: 16,
    padding: "12px 16px",
    flex: 1,
    boxShadow: "inset 4px 4px 8px rgba(163,160,152,0.4), inset -4px -4px 8px rgba(255,255,255,0.8)",
  },
  statNumber: { fontSize: 18, fontWeight: 700, color: "#1E3D34" },
  statLabel: { fontSize: 11, color: "#8A8A7C", marginTop: 4 },
  editBtn: {
    background: "#e8e5e0",
    color: "#1E3D34",
    border: "none",
    borderRadius: 16,
    padding: "14px 28px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "6px 6px 12px rgba(163,160,152,0.6), -6px -6px 12px rgba(255,255,255,0.9)",
  },
  aiBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    padding: 20,
  },
  aiCard: {
    background: "#1E3D34",
    color: "#F4EFE6",
    borderRadius: 16,
    padding: "24px 22px",
    maxWidth: 380,
    width: "100%",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  },
  aiBadgeLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#C97A3D",
    marginBottom: 10,
    letterSpacing: "0.03em",
  },
  aiText: { fontSize: 14, lineHeight: 1.6, marginBottom: 18 },
  aiCloseBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "9px 18px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  removePhotoBtn: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#8A2E2E",
    color: "#fff",
    border: "2px solid #e8e5e0",
    fontSize: 11,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
  display: "inline-block",
  marginLeft: 6,
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#4D96FF",
  color: "#fff",
  fontSize: 12,
  lineHeight: "20px",
  textAlign: "center",
},
getVerifiedBtn: {
  background: "#4D96FF",
  color: "#fff",
  border: "none",
  borderRadius: 20,
  padding: "8px 18px",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  marginBottom: 20,
},
};