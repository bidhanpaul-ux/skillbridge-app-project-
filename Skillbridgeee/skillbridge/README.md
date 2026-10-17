# SkillBridge — SIH26044 (Ministry of Ayush)

Portal for Academia-Industry collaboration: Skill Mapping, Internships and Placement.

## What's in this project

```
skillbridge/
├── cpp-matching-engine/
│   └── matching_engine.cpp     ← the C++ core: computes match % between
│                                  a student's skills and a job's required
│                                  skills. Compiles to WebAssembly and
│                                  runs directly in the browser.
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── firebase.js          ← your entire backend config (auth + DB)
        ├── matchingEngine.js    ← loads the C++/WASM module, with a JS
        │                          fallback so the app works even before
        │                          you've compiled the WASM
        ├── App.jsx              ← main app shell / navigation
        └── components/
            ├── StudentProfile.jsx
            ├── SkillAssessment.jsx
            ├── JobBoard.jsx           ← uses the matching engine
            ├── InstitutionDashboard.jsx  ← skill-gap analytics
            └── AIGuide.jsx       ← the "AI" guidance assistant
                                     (rule-based, safe for live demo)
```

## Setup (do this first — ~30 minutes)

1. Install Node.js: https://nodejs.org (LTS version)
2. `cd frontend && npm install`
3. Create a Firebase project (see the comment block at the top of
   `src/firebase.js` for exact steps) and paste your config into that
   file.
4. `npm start` — the app opens at http://localhost:3000

At this point you have a **fully working app** — profile, skill
assessment, ranked internships (using the JS fallback matching), and
institution dashboard. The C++/WASM piece is an enhancement layer on
top, not a blocker.

## Adding the real C++/WASM matching engine (do this once the app runs)

1. Install Emscripten: https://emscripten.org/docs/getting_started/downloads.html
   ```
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh      # (emsdk_env.bat on Windows)
   ```
2. From `cpp-matching-engine/`:
   ```
   emcc -O3 -std=c++17 matching_engine.cpp -o matching.js \
       -s EXPORTED_FUNCTIONS="['_matchScore']" \
       -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" \
       -s MODULARIZE=1 -s EXPORT_NAME="MatchingModule"
   ```
3. Copy the two generated files (`matching.js`, `matching.wasm`) into
   `frontend/public/`.
4. Restart `npm start`. Open the browser console — you should NOT see
   the "WASM matching engine not found" warning anymore. Your matching
   is now genuinely running compiled C++ inside the browser.

You can verify the C++ logic on its own anytime with:
```
cd cpp-matching-engine
g++ -O3 -std=c++17 matching_engine.cpp -o matching_test
./matching_test
```

## Deploying so judges can open a live link

```
npm install -g firebase-tools
firebase login
firebase init hosting     # choose your project, public dir = "build"
npm run build
firebase deploy
```
You'll get a live `https://your-project.web.app` link — put this in
your PPT and demo directly from it (also keep `npm start` running
locally as a backup in case the venue wifi is bad).

## Your 2-day plan

**Day 1**
- Morning: Firebase setup, `npm install`, get the app running locally (30–60 min)
- Late morning: Customize `StudentProfile.jsx` and `SkillAssessment.jsx`
  skill lists if you want more AYUSH-specific detail
- Afternoon: Wire real Firestore reads/writes (see "Wiring to real
  data" comments in `JobBoard.jsx` and `InstitutionDashboard.jsx`) —
  or skip this and keep seed data if time is tight; a working demo
  with realistic seed data beats a half-wired real database
- Evening: Compile the C++ engine to WASM, drop it in, confirm it loads

**Day 2**
- Morning: Polish UI, test the full flow end-to-end (profile → assessment
  → matched jobs → apply), fix bugs
- Midday: Deploy to Firebase Hosting, test the live link on another
  device/network
- Afternoon: Build the PPT (problem → solution → architecture diagram →
  demo screenshots → impact → feasibility/challenges → team)
- Evening: Rehearse the live demo at least twice, out loud, with a timer

## Talking points for judges (be ready for these questions)

- **"Why C++ for the matching engine?"** — Performance and portability:
  compiled once, runs client-side with no server round-trip, and scales
  to ranking thousands of listings without server load.
- **"Is the AI guide really AI?"** — Be honest: it's a rule-based
  decision engine today (transparent, reliable, free to run), with a
  clear upgrade path to an LLM-backed assistant for richer, personalized
  learning-resource recommendations post-hackathon.
- **"How do you verify student skill claims?"** — Roadmap item:
  institution-side endorsement workflow (already implicit in the
  Institution Dashboard's role) before scaling beyond pilot.
