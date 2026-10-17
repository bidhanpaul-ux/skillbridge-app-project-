// App.jsx
import SkillExchange from "./components/SkillExchange";
import MessagesInbox from "./components/MessagesInbox";
import ProjectsFeed from "./components/ProjectsFeed";
import BrowseProfiles from "./components/BrowseProfiles";
import ProfileView from "./components/ProfileView";
import backgroundImg from "./assets/backgroungg.jpg";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { AuthProvider, useAuth } from "./AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./components/Login";
import SkillQuiz from "./components/SkillQuiz";
import StudentProfile from "./components/StudentProfile";
import SkillAssessment from "./components/SkillAssessment";
import JobBoard from "./components/JobBoard";
import InstitutionDashboard from "./components/InstitutionDashboard";
import AIGuide from "./components/AIGuide";

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { currentUser } = useAuth();
  const [view, setView] = useState("student");
  const [page, setPage] = useState("profile");
  const [profile, setProfile] = useState({});
  const [skills, setSkills] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load this user's saved profile from Firestore the moment they log in
  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) {
        setLoadingProfile(false);
        return;
      }
      const snap = await getDoc(doc(db, "profiles", currentUser.uid));
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setLoadingProfile(false);
    }
    loadProfile();
  }, [currentUser]);

  // Real-time unread message count for the Messages tab badge
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "messages"),
      where("toId", "==", currentUser.uid),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
    return unsub;
  }, [currentUser]);

  // Wraps the existing onSave so profile data is written to Firestore,
  // not just kept in local state -- this is what makes it "saved for real"
  async function handleProfileSave(newProfileData) {
    const updated = { ...profile, ...newProfileData, complete: true };
    setProfile(updated);
    if (currentUser) {
      await setDoc(doc(db, "profiles", currentUser.uid), updated, { merge: true });
    }
  }

  const guideState = {
    profileComplete: !!profile.complete,
    skillsAssessed: skills.length > 0,
    hasResume: applications.length >= 0 && skills.length > 0,
    appliedToAny: applications.length > 0,
    matchedJobsAvailable: true,
  };

  if (!currentUser) {
    return <Login />;
  }

  if (loadingProfile) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading your profile...</div>;
  }

  // Quiz only needs to happen once -- if they already have a skillLevel
  // saved from a previous session, skip straight past it.
  if (!profile.skillLevel) {
    return (
      <SkillQuiz
        onDone={() => {
          // re-fetch so the new skillLevel/quizScore from the quiz shows up
          getDoc(doc(db, "profiles", currentUser.uid)).then((snap) => {
            if (snap.exists()) setProfile(snap.data());
          });
        }}
      />
    );
  }

  return (
    <motion.div
      style={{
        ...styles.app,
        backgroundImage: `linear-gradient(rgba(244,239,230,0.85), rgba(244,239,230,0.85)), url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <motion.header
        style={styles.header}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div style={styles.brand}>SkillBridge</motion.div>
        <nav style={styles.nav}>
          <motion.button
            style={styles.navBtn(view === "student")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setView("student"); setPage("profile"); }}
          >
            Student
          </motion.button>
          <motion.button
            style={styles.navBtn(view === "institution")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("institution")}
          >
            Institution
          </motion.button>
          <motion.button
            style={styles.logoutBtn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signOut(auth)}
          >
            Log out
          </motion.button>
        </nav>
      </motion.header>

      {view === "student" && (
        <>
          <motion.div style={styles.tabBar}>
            {["profile", "assessment", "jobs", "browse", "portfolio", "messages", "exchange"].map((p) => (
              <motion.button key={p} style={styles.tab(page === p)} onClick={() => setPage(p)}>
                {p === "messages" ? (
                  <span>
                    Messages
                    {unreadCount > 0 && <span style={styles.navBadge}>{unreadCount}</span>}
                  </span>
                ) : p === "exchange" ? (
                  "Skill Exchange"
                ) : p === "profile" ? (
                  "Profile"
                ) : p === "assessment" ? (
                  "Skill Assessment"
                ) : p === "jobs" ? (
                  "Internships"
                ) : p === "browse" ? (
                  "Browse Students"
                ) : (
                  "Portfolio"
                )}
              </motion.button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {page === "profile" && (
                profile.complete && !editingProfile ? (
                  <ProfileView profile={profile} onEdit={() => setEditingProfile(true)} />
                ) : (
                  <StudentProfile
                    profile={profile}
                    onSave={async (data) => {
                      await handleProfileSave(data);
                      setEditingProfile(false);
                    }}
                  />
                )
              )}
              {page === "assessment" && (
                <SkillAssessment
                  discipline={profile.discipline}
                  existingSkills={skills}
                  onSave={(s) => { setSkills(s); setPage("jobs"); }}
                />
              )}
              {page === "jobs" && (
                <JobBoard
                  studentSkills={skills}
                  onApply={(jobId) => setApplications([...applications, jobId])}
                />
              )}
              {page === "browse" && (
                <BrowseProfiles
                  myProfile={profile}
                  onProfileUpdate={() => {
                    getDoc(doc(db, "profiles", currentUser.uid)).then((snap) => {
                      if (snap.exists()) setProfile(snap.data());
                    });
                  }}
                />
              )}
              {page === "portfolio" && <ProjectsFeed myProfile={profile} />}
              {page === "messages" && <MessagesInbox myProfile={profile} />}
              {page === "exchange" && (
                <SkillExchange
                  myProfile={profile}
                  onProfileUpdate={() => {
                    getDoc(doc(db, "profiles", currentUser.uid)).then((snap) => {
                      if (snap.exists()) setProfile(snap.data());
                    });
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <AIGuide state={guideState} onNavigate={(action) => setPage(action)} />
        </>
      )}

      {view === "institution" && <InstitutionDashboard />}
    </motion.div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(-45deg, #F4EFE6, #E8DFC8, #F4EFE6, #DCE8DA)",
    backgroundSize: "400% 400%",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 32px",
    margin: "16px",
    borderRadius: 20,
    background: "linear-gradient(270deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9D6BFF, #FF6B6B)",
    backgroundSize: "600% 600%",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.25)",
  },
  brand: { fontFamily: "Georgia, serif", fontSize: 20, color: "#F4EFE6", fontWeight: 700, letterSpacing: "0.01em" },
  navBtn: (active) => ({
    background: active
      ? "linear-gradient(180deg, #D98A4D 0%, #C97A3D 50%, #B8692F 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)",
    color: active ? "#1E3D34" : "#F4EFE6",
    border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(244,239,230,0.4)",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: active
      ? "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)"
      : "inset 0 1px 0 rgba(255,255,255,0.2)",
    backdropFilter: "blur(4px)",
  }),
  logoutBtn: {
    background: "rgba(0,0,0,0.2)",
    color: "#F4EFE6",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  tabBar: { display: "flex", gap: 4, justifyContent: "center", padding: "20px 0 0", flexWrap: "wrap" },
  tab: (active) => ({
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #C97A3D" : "2px solid transparent",
    color: active ? "#1E3D34" : "#8A8A7C",
    fontWeight: 600,
    fontSize: 13,
    padding: "8px 18px",
    cursor: "pointer",
  }),
  navBadge: {
    background: "#C97A3D",
    color: "#fff",
    borderRadius: "50%",
    padding: "1px 6px",
    fontSize: 10,
    marginLeft: 4,
  },
};