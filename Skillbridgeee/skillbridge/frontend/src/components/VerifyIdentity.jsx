// components/VerifyIdentity.jsx
// Simulates an identity verification flow (like LinkedIn's verified
// badge) with a live camera face-scan step for visual realism.
// IMPORTANT: real Aadhaar/PAN verification requires UIDAI-licensed
// eKYC API access. This demo intentionally never stores the full ID
// number (only masked last-4-digits), and the camera feed is shown
// for UX realism only -- no image is captured, analyzed, or stored.
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";

function isValidAadhaarFormat(v) {
  return /^\d{12}$/.test(v.replace(/\s/g, ""));
}
function isValidPanFormat(v) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.toUpperCase());
}

export default function VerifyIdentity({ profile, onClose, onVerified }) {
  const { currentUser } = useAuth();
  const [method, setMethod] = useState("aadhaar");
  const [value, setValue] = useState("");
  const [step, setStep] = useState("input"); // input | camera | verifying | done | error
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (step === "camera") {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "user" } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          // Simulated scan duration
          setTimeout(() => {
            stopCamera();
            proceedToVerifying();
          }, 3200);
        })
        .catch(() => {
          setCameraError(true);
          setTimeout(() => proceedToVerifying(), 1500);
        });
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function handleVerify() {
    const cleaned = value.trim();
    const valid =
      method === "aadhaar" ? isValidAadhaarFormat(cleaned) : isValidPanFormat(cleaned);

    if (!valid) {
      setStep("error");
      return;
    }
    setStep("camera");
  }

  async function proceedToVerifying() {
    setStep("verifying");
    setTimeout(async () => {
      const cleaned = value.trim();
      const last4 = cleaned.slice(-4);
      await updateDoc(doc(db, "profiles", currentUser.uid), {
        verified: true,
        verifiedMethod: method,
        verifiedLast4: last4,
      });
      setStep("done");
      onVerified?.();
    }, 1800);
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  return (
    <motion.div
      style={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={step !== "camera" && step !== "verifying" ? handleClose : undefined}
    >
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p style={styles.title}>Verify your identity</p>
              <p style={styles.subtext}>
                Get a verified badge on your profile, like LinkedIn's identity check.
              </p>

              <div style={styles.methodRow}>
                <button
                  style={method === "aadhaar" ? styles.methodBtnActive : styles.methodBtn}
                  onClick={() => { setMethod("aadhaar"); setValue(""); }}
                >
                  Aadhaar
                </button>
                <button
                  style={method === "pan" ? styles.methodBtnActive : styles.methodBtn}
                  onClick={() => { setMethod("pan"); setValue(""); }}
                >
                  PAN
                </button>
              </div>

              <input
                style={styles.input}
                placeholder={method === "aadhaar" ? "1234 5678 9012" : "ABCDE1234F"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={method === "aadhaar" ? 14 : 10}
              />

              <p style={styles.privacyNote}>
                🔒 For this demo, only the last 4 digits are stored — never the full number.
              </p>

              <motion.button
                style={styles.verifyBtn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVerify}
              >
                Continue to face scan
              </motion.button>
            </motion.div>
          )}

          {step === "camera" && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.centerState}
            >
              <p style={styles.title}>Face verification</p>
              <p style={styles.subtext}>Hold still and look at the camera</p>

              <div style={styles.cameraFrame}>
                {cameraError ? (
                  <div style={styles.cameraFallback}>📷</div>
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
                )}
                <motion.div
                  style={styles.scanLine}
                  animate={{ y: [0, 220, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <div style={styles.scanRingOverlay} />
              </div>

              <p style={styles.scanningText}>
                {cameraError ? "Camera unavailable — continuing..." : "Scanning face..."}
              </p>
            </motion.div>
          )}

          {step === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.centerState}
            >
              <motion.div
                style={styles.spinner}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p style={styles.verifyingText}>Cross-checking with government records...</p>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.centerState}
            >
              <div style={styles.checkCircle}>✓</div>
              <p style={styles.verifyingText}>Identity verified!</p>
              <motion.button
                style={styles.verifyBtn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
              >
                Done
              </motion.button>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p style={styles.title}>Invalid format</p>
              <p style={styles.subtext}>
                {method === "aadhaar" ? "Aadhaar must be 12 digits." : "PAN format: ABCDE1234F"}
              </p>
              <motion.button
                style={styles.verifyBtn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("input")}
              >
                Try again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5000, padding: 20,
  },
  modal: {
    width: "100%", maxWidth: 380, background: "#1E3D34", color: "#F4EFE6",
    borderRadius: 16, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", textAlign: "center",
  },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  subtext: { fontSize: 13, opacity: 0.85, marginBottom: 18, lineHeight: 1.5 },
  methodRow: { display: "flex", gap: 8, marginBottom: 14, justifyContent: "center" },
  methodBtn: {
    background: "rgba(244,239,230,0.1)", color: "#F4EFE6", border: "1px solid rgba(244,239,230,0.3)",
    borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer",
  },
  methodBtnActive: {
    background: "#C97A3D", color: "#1E3D34", border: "1px solid #C97A3D",
    borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  input: {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(244,239,230,0.3)",
    background: "rgba(244,239,230,0.08)", color: "#F4EFE6", fontSize: 14, marginBottom: 10,
    boxSizing: "border-box", textAlign: "center", letterSpacing: "1px",
  },
  privacyNote: { fontSize: 11, opacity: 0.7, marginBottom: 16 },
  verifyBtn: {
    background: "#C97A3D", color: "#1E3D34", border: "none", borderRadius: 8,
    padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%",
  },
  centerState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "6px 0" },
  cameraFrame: {
    position: "relative",
    width: 220,
    height: 220,
    borderRadius: "50%",
    overflow: "hidden",
    border: "3px solid #C97A3D",
    background: "#0d1f1a",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)", // mirror, feels more natural
  },
  cameraFallback: {
    width: "100%", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 48, opacity: 0.5,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: 2,
    background: "linear-gradient(90deg, transparent, #C97A3D, transparent)",
    boxShadow: "0 0 8px #C97A3D",
  },
  scanRingOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    boxShadow: "inset 0 0 30px rgba(0,0,0,0.4)",
    pointerEvents: "none",
  },
  scanningText: { fontSize: 13, opacity: 0.85, marginTop: 4 },
  spinner: {
    width: 40, height: 40, borderRadius: "50%",
    border: "4px solid rgba(244,239,230,0.2)", borderTopColor: "#C97A3D",
  },
  verifyingText: { fontSize: 14, opacity: 0.9 },
  checkCircle: {
    width: 56, height: 56, borderRadius: "50%", background: "#5C8A5E",
    color: "#fff", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center",
  },
};