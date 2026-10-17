// components/BrowseProfiles.jsx
// Lists every other student's profile and lets the current user
// follow/unfollow them. Clicking a card opens a detailed popup with
// follow and message options.
import PublicProfileModal from "./PublicProfileModal";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";

export default function BrowseProfiles({ myProfile, onProfileUpdate }) {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    async function loadAll() {
      const snap = await getDocs(collection(db, "profiles"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.id !== currentUser.uid && p.name); // hide yourself + empty profiles
      setProfiles(list);
      setLoading(false);
    }
    loadAll();
  }, [currentUser]);

  const myFollowing = myProfile.following || [];

  async function toggleFollow(targetId) {
    const isFollowing = myFollowing.includes(targetId);
    const myRef = doc(db, "profiles", currentUser.uid);
    const targetRef = doc(db, "profiles", targetId);

    if (isFollowing) {
      await updateDoc(myRef, { following: arrayRemove(targetId) });
      await updateDoc(targetRef, { followers: arrayRemove(currentUser.uid) });
    } else {
      await updateDoc(myRef, { following: arrayUnion(targetId) });
      await updateDoc(targetRef, { followers: arrayUnion(currentUser.uid) });
    }
    onProfileUpdate(); // tell App.jsx to re-fetch my profile so counts update
  }

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40 }}>Loading students...</p>;
  }

  return (
    <motion.div
      style={styles.page}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 style={styles.heading}>Browse students</h2>
      <p style={styles.sub}>Connect with other students on SkillBridge.</p>

      {profiles.length === 0 && (
        <p style={styles.empty}>No other students have joined yet — invite your group!</p>
      )}

      <div style={styles.list}>
        {profiles.map((p) => {
          const isFollowing = myFollowing.includes(p.id);
          const initials = (p.name || "?")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.01, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedProfile(p)}
              style={{ ...styles.card, cursor: "pointer" }}
            >
              <div style={styles.avatar}>{initials}</div>
              <div style={styles.info}>
                <p style={styles.name}>{p.name}</p>
                <p style={styles.meta}>
                  {p.branch || "Branch not set"} • Year {p.year || "—"}
                </p>
                <p style={styles.institution}>{p.institution}</p>
                {p.skillLevel && <span style={styles.levelBadge}>{p.skillLevel}</span>}
              </div>
              <motion.button
                style={isFollowing ? styles.followingBtn : styles.followBtn}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(p.id);
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {selectedProfile && (
        <PublicProfileModal
          profile={selectedProfile}
          isFollowing={myFollowing.includes(selectedProfile.id)}
          myName={myProfile.name || "Student"}
          onFollowToggle={() => {
            const nowFollowing = myFollowing.includes(selectedProfile.id);
            toggleFollow(selectedProfile.id);
            setSelectedProfile({
              ...selectedProfile,
              followers: nowFollowing
                ? (selectedProfile.followers || []).filter((id) => id !== currentUser.uid)
                : [...(selectedProfile.followers || []), currentUser.uid],
            });
          }}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </motion.div>
  );
}

const styles = {
  page: { maxWidth: 560, margin: "0 auto", padding: "20px 20px 40px" },
  heading: { fontFamily: "Georgia, serif", fontSize: 24, color: "#1E3D34", margin: "0 0 4px" },
  sub: { fontSize: 13, color: "#5B6B63", marginBottom: 20 },
  empty: { fontSize: 14, color: "#8A8A7C", textAlign: "center", padding: 30 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#fff",
    borderRadius: 12,
    padding: "14px 16px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#1E3D34",
    color: "#F4EFE6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: 700, color: "#1E3D34", margin: 0 },
  meta: { fontSize: 12, color: "#5B6B63", margin: "2px 0" },
  institution: { fontSize: 12, color: "#8A8A7C", margin: 0 },
  levelBadge: {
    display: "inline-block",
    marginTop: 6,
    background: "rgba(201,122,61,0.15)",
    color: "#C97A3D",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 20,
  },
  followBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    flexShrink: 0,
  },
  followingBtn: {
    background: "#F4EFE6",
    color: "#1E3D34",
    border: "1px solid #C97A3D",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    flexShrink: 0,
  },
};