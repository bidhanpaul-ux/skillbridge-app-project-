// components/ChatModal.jsx
// Real-time 1:1 chat popup between the current user and another student.
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";

const EMOJIS = ["😀", "😂", "👍", "🔥", "❤️", "🎉", "😢", "🙏"];

function getThreadId(a, b) {
  return [a, b].sort().join("_");
}

export default function ChatModal({ otherUser, myName, onClose }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef(null);
  const threadId = getThreadId(currentUser.uid, otherUser.id);

  useEffect(() => {
    const q = query(collection(db, "messages"), where("threadId", "==", threadId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      setMessages(list);

      list.forEach((m) => {
        if (m.toId === currentUser.uid && !m.read) {
          updateDoc(doc(db, "messages", m.id), { read: true });
        }
      });
    });
    return unsub;
  }, [threadId, currentUser.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const t = text.trim();
    if (!t) return;
    setText("");
    setShowEmojis(false);
    await addDoc(collection(db, "messages"), {
      threadId,
      fromId: currentUser.uid,
      toId: otherUser.id,
      fromName: myName,
      toName: otherUser.name,
      text: t,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }

  function addEmoji(emoji) {
    setText((prev) => prev + emoji);
  }

  return (
    <motion.div
      style={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <p style={styles.headerName}>{otherUser.name}</p>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.messageList}>
          {messages.length === 0 && (
            <p style={styles.emptyText}>Say hello to {otherUser.name.split(" ")[0]}!</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              style={m.fromId === currentUser.uid ? styles.myBubble : styles.theirBubble}
            >
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {showEmojis && (
          <div style={styles.emojiRow}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                style={styles.emojiBtn}
                onClick={() => addEmoji(e)}
                type="button"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        <div style={styles.inputRow}>
          <button
            style={styles.emojiToggle}
            onClick={() => setShowEmojis(!showEmojis)}
            type="button"
          >
            😊
          </button>
          <input
            style={styles.input}
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <motion.button
            style={styles.sendBtn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
          >
            Send
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 4000, padding: 20,
  },
  modal: {
    width: "100%", maxWidth: 420, background: "#fff", borderRadius: 16,
    overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    display: "flex", flexDirection: "column", maxHeight: "80vh",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 18px", background: "#1E3D34", color: "#F4EFE6",
  },
  headerName: { fontWeight: 700, fontSize: 15, margin: 0 },
  closeBtn: { background: "none", border: "none", color: "#F4EFE6", fontSize: 16, cursor: "pointer" },
  messageList: {
    flex: 1, overflowY: "auto", padding: 16, display: "flex",
    flexDirection: "column", gap: 8, minHeight: 200,
  },
  emptyText: { textAlign: "center", color: "#8A8A7C", fontSize: 13, margin: "auto" },
  myBubble: {
    alignSelf: "flex-end", background: "#C97A3D", color: "#1E3D34",
    padding: "8px 12px", borderRadius: "12px 12px 2px 12px", fontSize: 13, maxWidth: "75%",
  },
  theirBubble: {
    alignSelf: "flex-start", background: "#F0EEE9", color: "#1E3D34",
    padding: "8px 12px", borderRadius: "12px 12px 12px 2px", fontSize: 13, maxWidth: "75%",
  },
  emojiRow: {
    display: "flex", gap: 6, padding: "8px 12px", borderTop: "1px solid #eee",
    flexWrap: "wrap",
  },
  emojiBtn: {
    background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4,
  },
  inputRow: { display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee", alignItems: "center" },
  emojiToggle: {
    background: "none", border: "none", fontSize: 20, cursor: "pointer", flexShrink: 0,
  },
  input: { flex: 1, padding: "10px 12px", borderRadius: 20, border: "1px solid #ddd", fontSize: 13 },
  sendBtn: {
    background: "#C97A3D", color: "#1E3D34", border: "none", borderRadius: 20,
    padding: "10px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0,
  },
};