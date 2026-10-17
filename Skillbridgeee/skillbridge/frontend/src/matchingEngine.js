// matchingEngine.js
// Loads the WebAssembly module built from cpp-matching-engine/matching_engine.cpp
// and exposes a clean matchScore(studentSkills, requiredSkills) function to
// the rest of the React app.
//
// SETUP: after compiling with emcc (see matching_engine.cpp header comment),
// copy the two generated files into frontend/public/:
//   matching.js
//   matching.wasm
// Then this wrapper will load them at runtime.
//
// If you haven't compiled the WASM yet, this file falls back to a pure-JS
// re-implementation of the exact same scoring algorithm, so the app still
// works end-to-end while you finish the C++ build -- swap to WASM whenever
// it's ready, no other code needs to change.

let wasmModule = null;
let wasmMatchScore = null;

async function loadWasm() {
  if (wasmModule) return wasmModule;
  try {
    // MatchingModule is created by emcc's MODULARIZE=1 output (matching.js)
    // eslint-disable-next-line no-undef
    const factory = window.MatchingModule || (await import(/* webpackIgnore: true */ "/matching.js")).default;
    wasmModule = await factory();
    wasmMatchScore = wasmModule.cwrap("matchScore", "number", ["string", "string"]);
    return wasmModule;
  } catch (e) {
    console.warn("WASM matching engine not found, using JS fallback:", e.message);
    return null;
  }
}

// Safely normalizes incoming skill inputs whether they are string objects or raw primitives
function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.map((s) => {
    if (typeof s === "string") {
      return { name: s, level: 1 };
    }
    return {
      name: s && s.name ? String(s.name) : "",
      level: s && typeof s.level === "number" ? s.level : 1,
    };
  }).filter((s) => s.name.length > 0);
}

// Same algorithm as the C++ version, kept in sync deliberately so behavior
// is identical whether WASM is loaded or not.
function jsMatchScore(studentSkills, requiredSkills) {
  const safeStudentSkills = normalizeSkills(studentSkills);
  const safeRequiredSkills = normalizeSkills(requiredSkills);

  const studentMap = new Map(
    safeStudentSkills.map((s) => [s.name.toLowerCase(), s.level])
  );
  if (safeRequiredSkills.length === 0) return 0;
  let total = 0;
  for (const req of safeRequiredSkills) {
    const level = studentMap.get(req.name.toLowerCase());
    if (level === undefined) continue;
    total += level >= req.level ? 100 : (level / req.level) * 100;
  }
  return Math.round((total / safeRequiredSkills.length) * 10) / 10;
}

function encodeSkills(skills) {
  const safeSkills = normalizeSkills(skills);
  return safeSkills.map((s) => `${s.name}:${s.level}`).join(",");
}

// Public API used by JobBoard.jsx and InstitutionDashboard.jsx
export async function matchScore(studentSkills, requiredSkills) {
  await loadWasm();
  if (wasmMatchScore) {
    return wasmMatchScore(encodeSkills(studentSkills), encodeSkills(requiredSkills));
  }
  return jsMatchScore(studentSkills, requiredSkills);
}

export function findGaps(studentSkills, requiredSkills) {
  const safeStudentSkills = normalizeSkills(studentSkills);
  const safeRequiredSkills = normalizeSkills(requiredSkills);

  const studentMap = new Map(
    safeStudentSkills.map((s) => [s.name.toLowerCase(), s.level])
  );
  return safeRequiredSkills
    .filter((req) => (studentMap.get(req.name.toLowerCase()) || 0) < req.level)
    .map((req) => req.name);
}