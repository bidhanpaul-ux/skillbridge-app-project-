// components/ProjectsFeed.jsx
// A shared feed where students post projects/work with a photo, and
// others can like and comment. Uses a "projects" collection in
// Firestore -- separate from "profiles". Images are read directly in
// the browser and stored as embedded data (no Firebase Storage/billing
// needed) -- fine for hackathon-sized screenshots/photos.
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";

export default function ProjectsFeed({ myProfile }) {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});

  async function loadProjects() {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result);
    reader.readAsDataURL(file);
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await addDoc(collection(db, "projects"), {
      authorId: currentUser.uid,
      authorName: myProfile.name || "Student",
      title,
      description,
      imageUrl: imageUrl || null,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    });
    setTitle("");
    setImageUrl("");
    setDescription("");
    setShowForm(false);
    loadProjects();
  }

  async function toggleLike(project) {
    const ref = doc(db, "projects", project.id);
    const alreadyLiked = project.likes?.includes(currentUser.uid);
    await updateDoc(ref, {
      likes: alreadyLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
    loadProjects();
  }

  async function submitComment(project) {
    const text = (commentDrafts[project.id] || "").trim();
    if (!text) return;
    const ref = doc(db, "projects", project.id);
    await updateDoc(ref, {
      comments: arrayUnion({
        userId: currentUser.uid,
        userName: myProfile.name || "Student",
        text,
        createdAt: new Date().toISOString(),
      }),
    });
    setCommentDrafts({ ...commentDrafts, [project.id]: "" });
    loadProjects();
  }

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40 }}>Loading portfolio feed...</p>;
  }

  return (
    <motion.div style={styles.page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.heading}>Portfolio feed</h2>
          <p style={styles.sub}>Share your projects. Like and comment on others' work.</p>
        </div>
        <motion.button
          style={styles.newBtn}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add project"}
        </motion.button>
      </div>

      {showForm && (
        <motion.form
          style={styles.form}
          onSubmit={handlePost}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <input
            style={styles.input}
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label style={styles.fileLabel}>
            {imageUrl ? "✓ Image selected — click to change" : "📷 Add a photo (optional)"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>
          {imageUrl && (
            <img src={imageUrl} alt="preview" style={styles.previewImg} />
          )}

          <textarea
            style={styles.textarea}
            placeholder="What did you build?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <motion.button
            style={styles.postBtn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
          >
            Post
          </motion.button>
        </motion.form>
      )}

      {projects.length === 0 && (
        <p style={styles.empty}>No projects posted yet — be the first!</p>
      )}

      <div style={styles.feed}>
        {projects.map((p) => {
          const liked = p.likes?.includes(currentUser.uid);
          return (
            <motion.div key={p.id} style={styles.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p style={styles.author}>{p.authorName}</p>
              <h3 style={styles.title}>{p.title}</h3>
              {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={styles.image} />}
              {p.description && <p style={styles.description}>{p.description}</p>}

              <div style={styles.actionRow}>
                <motion.button
                  style={liked ? styles.likedBtn : styles.likeBtn}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleLike(p)}
                >
                  {liked ? "❤️" : "🤍"} {p.likes?.length ?? 0}
                </motion.button>
                <span style={styles.commentCount}>{p.comments?.length ?? 0} comments</span>
              </div>

              <div style={styles.comments}>
                {(p.comments || []).map((c, i) => (
                  <p key={i} style={styles.comment}>
                    <span style={styles.commentAuthor}>{c.userName}: </span>
                    {c.text}
                  </p>
                ))}
              </div>

              <div style={styles.commentInputRow}>
                <input
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={commentDrafts[p.id] || ""}
                  onChange={(e) =>
                    setCommentDrafts({ ...commentDrafts, [p.id]: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && submitComment(p)}
                />
                <motion.button
                  style={styles.commentBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => submitComment(p)}
                >
                  Send
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

const styles = {
  page: { maxWidth: 560, margin: "0 auto", padding: "20px 20px 40px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  heading: { fontFamily: "Georgia, serif", fontSize: 24, color: "#1E3D34", margin: "0 0 4px" },
  sub: { fontSize: 13, color: "#5B6B63", margin: 0 },
  newBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  form: {
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  fileLabel: {
    display: "block",
    textAlign: "center",
    padding: "12px",
    borderRadius: 8,
    border: "2px dashed #ccc",
    color: "#5B6B63",
    fontSize: 13,
    cursor: "pointer",
    background: "#fafafa",
  },
  previewImg: {
    width: "100%",
    maxHeight: 200,
    objectFit: "cover",
    borderRadius: 8,
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
  },
  postBtn: {
    background: "#1E3D34",
    color: "#F4EFE6",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  empty: { fontSize: 14, color: "#8A8A7C", textAlign: "center", padding: 30 },
  feed: { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  },
  author: { fontSize: 12, color: "#8A8A7C", margin: "0 0 4px", fontWeight: 600 },
  title: { fontSize: 17, color: "#1E3D34", margin: "0 0 10px" },
  image: {
    width: "100%",
    maxHeight: 260,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 10,
  },
  description: { fontSize: 14, color: "#33443B", marginBottom: 12, lineHeight: 1.5 },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #eee",
    marginBottom: 12,
  },
  likeBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 13,
    cursor: "pointer",
  },
  likedBtn: {
    background: "rgba(201,122,61,0.1)",
    border: "1px solid #C97A3D",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 13,
    cursor: "pointer",
  },
  commentCount: { fontSize: 12, color: "#8A8A7C" },
  comments: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 },
  comment: { fontSize: 13, color: "#33443B", margin: 0 },
  commentAuthor: { fontWeight: 700, color: "#1E3D34" },
  commentInputRow: { display: "flex", gap: 8 },
  commentInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 20,
    border: "1px solid #ddd",
    fontSize: 13,
  },
  commentBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 20,
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
};