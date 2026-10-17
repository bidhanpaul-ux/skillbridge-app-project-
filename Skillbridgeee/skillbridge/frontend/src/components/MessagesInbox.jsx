// components/MessagesInbox.jsx
// Lists all conversation threads with the latest message and unread
// counts, updating in real time via Firestore onSnapshot.
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";
import ChatModal from "./ChatModal";

export default function MessagesInbox({ myProfile }) {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState({});
  const [openThread, setOpenThread] = useState(null);

  useEffect(() => {
    const qSent = query(collection(db, "messages"), where("fromId", "==", currentUser.uid));
    const qReceived = query(collection(db, "messages"), where("toId", "==", currentUser.uid));

    let sentMsgs = [];
    let receivedMsgs = [];

    function rebuild() {
      const all = [...sentMsgs, ...receivedMsgs];
      const map = {};
      all.forEach((m) => {
        const otherId = m.fromId === currentUser.uid ? m.toId : m.fromId;
        const otherName = m.fromId === currentUser.uid ? m.toName : m.fromName;
        if (!map[otherId] || (m.createdAt || "") > (map[otherId].lastAt || "")) {
          map[otherId] = {
            id: otherId,
            name: otherName || "Student",
            lastText: m.text,
            lastAt: m.createdAt,
          };
        }
      });
      receivedMsgs.forEach((m) => {
        if (!m.read && map[m.fromId]) {
          map[m.fromId].unread = (map[m.fromId].unread || 0) + 1;
        }
      });
      setThreads({ ...map });
    }

    const unsub1 = onSnapshot(qSent, (snap) => {
      sentMsgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rebuild();
    });
    const unsub2 = onSnapshot(qReceived, (snap) => {
      receivedMsgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rebuild();
    });

    return () => { unsub1(); unsub2(); };
  }, [currentUser.uid]);

  const threadList = Object.values(threads).sort((a, b) =>
    (b.lastAt || "").localeCompare(a.lastAt || "")
  );

  return (
    <motion.div style={styles.page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={styles.heading}>Messages</h2>
      {threadList.length === 0 && (
        <p style={styles.empty}>No conversations yet — message someone from Browse Students.</p>
      )}
      <div style={styles.list}>
        {threadList.map((t) => (
          <motion.div
            key={t.id}
            style={styles.card}
            whileHover={{ scale: 1.01 }}
            onClick={() => setOpenThread(t)}
          >
            <div style={styles.avatar}>{(t.name || "?").slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={styles.name}>{t.name}</p>
              <p style={styles.preview}>{t.lastText}</p>
            </div>
            {t.unread > 0 && <span style={styles.badge}>{t.unread}</span>}
          </motion.div>
        ))}
      </div>

      {openThread && (
        <ChatModal
          otherUser={openThread}
          myName={myProfile.name || "Student"}
          onClose={() => setOpenThread(null)}
        />
      )}
    </motion.div>
  );
}

const styles = {
  page: { maxWidth: 560, margin: "0 auto", padding: "20px 20px 40px" },
  heading: { fontFamily: "Georgia, serif", fontSize: 24, color: "#1E3D34", marginBottom: 16 },
  empty: { fontSize: 14, color: "#8A8A7C", textAlign: "center", padding: 30 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    display: "flex", alignItems: "center", gap: 12, background: "#fff",
    borderRadius: 12, padding: "12px 14px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)", cursor: "pointer",
  },
  avatar: {
    width: 42, height: 42, borderRadius: "50%", background: "#1E3D34", color: "#F4EFE6",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  name: { fontSize: 14, fontWeight: 700, color: "#1E3D34", margin: 0 },
  preview: {
    fontSize: 12, color: "#8A8A7C", margin: "2px 0 0",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  badge: {
    background: "#C97A3D", color: "#fff", borderRadius: "50%", width: 22, height: 22,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
};