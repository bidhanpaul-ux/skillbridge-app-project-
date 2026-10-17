// components/Login.jsx
import backgroundImg from "../assets/backgroungg.jpg";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Login() {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "profiles", cred.user.uid), {
          name,
          email,
          college: "",
          branch: "",
          year: "",
          skills: [],
          createdAt: new Date().toISOString(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  }

  return (
  <div style={styles.pageWrapper}>
    <motion.div
      style={{ ...styles.bgLayer, backgroundImage: `url(${backgroundImg})` }}
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
    <motion.div
      style={styles.wrapper}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <form style={styles.card} onSubmit={handleSubmit}>
        <h2 style={styles.title}>{isSignup ? "Create your account" : "Welcome back"}</h2>

        {isSignup && (
          <input
            style={styles.input}
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <motion.button
          style={styles.submitBtn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
        >
          {isSignup ? "Sign up" : "Log in"}
        </motion.button>

        <p style={styles.switchText}>
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <span style={styles.switchLink} onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Log in" : "Sign up"}
          </span>
        </p>
            </form>
    </motion.div>
  </div>
);
}
const styles = {
  wrapper: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" },
   pageWrapper: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  bgLayer: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(10px) brightness(0.9)",
    transform: "scale(1.1)",
  },
  wrapper: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
  },
  card: {
    width: 340,
    background: "rgba(30,61,52,0.95)",
    padding: "32px 28px",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
  },
  title: { color: "#F4EFE6", fontFamily: "Georgia, serif", marginBottom: 8 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(244,239,230,0.3)",
    background: "rgba(244,239,230,0.08)",
    color: "#F4EFE6",
    fontSize: 14,
    outline: "none",
  },
  submitBtn: {
    background: "#C97A3D",
    color: "#1E3D34",
    border: "none",
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  error: { color: "#FF8A8A", fontSize: 13, margin: 0 },
  switchText: { color: "#F4EFE6", fontSize: 13, textAlign: "center", marginTop: 8 },
  switchLink: { color: "#C97A3D", fontWeight: 600, cursor: "pointer" },
};