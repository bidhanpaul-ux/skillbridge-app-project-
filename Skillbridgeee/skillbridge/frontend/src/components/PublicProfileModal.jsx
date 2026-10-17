// components/PublicProfileModal.jsx
// A read-only popup showing another student's full profile, opened by
// clicking their card in Browse Students. Includes Follow and Message.
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatModal from "./ChatModal";

export default function PublicProfileModal({ profile, isFollowing, onFollowToggle, onClose, myName }) {
  const [showChat, setShowChat] = useState(false);

  if (!profile) return null;

  const initials = (profile.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AnimatePresence>
      <motion.div
        style={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          style={styles.modal}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>

          <div style={styles.coverBanner} />

          <div style={styles.content}>
            <div style={styles.avatar}>{initials}</div>

            <h2 style={styles.name}>{profile.name || "Unnamed student"}</h2>
            <p style={styles.subtitle}>
              {profile.branch || "Branch not set"} • Year {profile.year || "—"}
            </p>
            <p style={styles.institution}>{profile.institution || "Institution not set"}</p>

            {profile.skillLevel && (
              <span style={styles.levelBadge}>{profile.skillLevel}</span>
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

            <div style={styles.buttonRow}>
              <motion.button
                style={isFollowing ? styles.followingBtn : styles.followBtn}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onFollowToggle}
              >
                {isFollowing ? "Following" : "Follow"}
              </motion.button>
              <motion.button
                style={styles.messageBtn}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowChat(true)}
              >
                Message
              </motion.button>
            </div>
          </div>
        </motion.div>

        {showChat && (
          <ChatModal
            otherUser={{ id: profile.id, name: profile.name }}
            myName={myName}
            onClose={() => setShowChat(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    maxHeight: "85vh",
    overflowY: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    fontSize: 16,
    cursor: "pointer",
  },
  coverBanner: {
    height: 90,
    background: "linear-gradient(120deg, #C97A3D, #E8A05C, #6BCB77)",
    backgroundSize: "200% 200%",
  },
  content: { padding: "0 28px 28px", textAlign: "center" },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    background: "#1E3D34",
    color: "#F4EFE6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
    margin: "-44px auto 12px",
    border: "4px solid #fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  name: { fontFamily: "Georgia, serif", fontSize: 22, margin: "0 0 4px", color: "#1E3D34" },
  subtitle: { fontSize: 14, color: "#5B6B63", margin: "0 0 2px" },
  institution: { fontSize: 13, color: "#8A8A7C", margin: "0 0 12px" },
  levelBadge: {
    display: "inline-block",
    background: "#C97A3D",
    color: "#1E3D34",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 20,
    marginBottom: 16,
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: 28,
    padding: "16px 0",
    borderTop: "1px solid #eee",
    borderBottom: "1px solid #eee",
    marginBottom: 18,
  },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNumber: { fontSize: 16, fontWeight: 700, color: "#1E3D34" },
  statLabel: { fontSize: 11, color: "#8A8A7C" },
  buttonRow: { display: "flex", gap: 10, justifyContent: "center" },
  followBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  followingBtn: {
    background: "#F4EFE6",
    color: "#1E3D34",
    border: "1px solid #C97A3D",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  messageBtn: {
    background: "#1E3D34",
    color: "#F4EFE6",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
};