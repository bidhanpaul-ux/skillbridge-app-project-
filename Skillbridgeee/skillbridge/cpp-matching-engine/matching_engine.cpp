// matching_engine.cpp
// SkillBridge core matching engine.
//
// Computes a match percentage between a student's skill profile and a
// job/internship's required skills. Written in C++ so it can be compiled
// to WebAssembly (via Emscripten) and run directly in the browser --
// fast, and no server round-trip needed to rank candidates or job
// listings for a student.
//
// ---- Build as a normal native program (for testing on your machine) ----
//   g++ -O3 -std=c++17 matching_engine.cpp -o matching_test
//   ./matching_test
//
// ---- Build to WebAssembly for the web app (needs Emscripten installed) ----
//   emcc -O3 -std=c++17 matching_engine.cpp -o matching.js \
//       -s EXPORTED_FUNCTIONS="['_matchScore']" \
//       -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" \
//       -s MODULARIZE=1 -s EXPORT_NAME="MatchingModule"
//
// This produces matching.js + matching.wasm. Copy both into
// frontend/public/ and load them from React (see AIGuide/JobBoard notes
// in the frontend for how matchScore() gets called from JS).

#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <cmath>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#endif

namespace matching {

// A skill has a name and a proficiency level (0-100). Students self-rate
// or get rated via the skill assessment quiz; jobs specify a minimum
// required level per skill.
struct Skill {
    std::string name;
    int level; // 0-100
};

// Splits a "skill:level,skill:level" encoded string into a vector of
// Skill. Kept as a simple, dependency-free wire format so the JS side
// doesn't need a JSON library to talk to the WASM module -- plain
// strings pass across the JS/WASM boundary most simply.
inline std::vector<Skill> parseSkills(const std::string& encoded) {
    std::vector<Skill> skills;
    std::stringstream ss(encoded);
    std::string pair;
    while (std::getline(ss, pair, ',')) {
        if (pair.empty()) continue;
        size_t colon = pair.find(':');
        if (colon == std::string::npos) continue;
        Skill s;
        s.name = pair.substr(0, colon);
        // Normalize to lowercase so "Ayurveda" and "ayurveda" match.
        std::transform(s.name.begin(), s.name.end(), s.name.begin(), ::tolower);
        try {
            s.level = std::stoi(pair.substr(colon + 1));
        } catch (...) {
            s.level = 0;
        }
        skills.push_back(s);
    }
    return skills;
}

// Core scoring logic.
//
// For every skill the job requires, we look for it in the student's
// profile:
//   - missing skill entirely           -> 0 points for that requirement
//   - present but below required level -> partial credit, scaled by how
//                                          close the student's level is
//   - present and meets/exceeds level  -> full points for that requirement
//
// The final score is the average across all required skills, so a job
// requiring 5 skills where the student has 4 strongly and 1 not at all
// still shows a meaningful (not zero) match -- useful for "close match,
// consider upskilling here" messaging rather than a binary pass/fail.
inline double computeMatch(const std::vector<Skill>& studentSkills,
                            const std::vector<Skill>& requiredSkills) {
    if (requiredSkills.empty()) return 0.0;

    std::unordered_map<std::string, int> studentMap;
    studentMap.reserve(studentSkills.size() * 2);
    for (const auto& s : studentSkills) studentMap[s.name] = s.level;

    double totalScore = 0.0;
    for (const auto& req : requiredSkills) {
        auto it = studentMap.find(req.name);
        if (it == studentMap.end()) {
            continue; // 0 contribution
        }
        int studentLevel = it->second;
        if (studentLevel >= req.level) {
            totalScore += 100.0;
        } else {
            // Partial credit proportional to how close they are.
            totalScore += (static_cast<double>(studentLevel) / req.level) * 100.0;
        }
    }
    return totalScore / static_cast<double>(requiredSkills.size());
}

// Identifies which required skills the student is missing or weak on --
// this powers the "skill gap" / learning recommendation feature.
inline std::vector<std::string> findGaps(const std::vector<Skill>& studentSkills,
                                          const std::vector<Skill>& requiredSkills) {
    std::unordered_map<std::string, int> studentMap;
    for (const auto& s : studentSkills) studentMap[s.name] = s.level;

    std::vector<std::string> gaps;
    for (const auto& req : requiredSkills) {
        auto it = studentMap.find(req.name);
        int studentLevel = (it == studentMap.end()) ? 0 : it->second;
        if (studentLevel < req.level) {
            gaps.push_back(req.name);
        }
    }
    return gaps;
}

} // namespace matching

// ---- C-style export for Emscripten / WASM ----
// Emscripten exports plain C functions most reliably. Both inputs are
// encoded strings like "ayurveda:80,yoga therapy:60,panchakarma:40" so
// no JSON parsing library is needed on either side of the boundary.
// Returns match percentage as a double, rounded to 1 decimal.
extern "C" {

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
double matchScore(const char* studentSkillsEncoded, const char* requiredSkillsEncoded) {
    auto studentSkills = matching::parseSkills(studentSkillsEncoded);
    auto requiredSkills = matching::parseSkills(requiredSkillsEncoded);
    double score = matching::computeMatch(studentSkills, requiredSkills);
    return std::round(score * 10.0) / 10.0;
}

} // extern "C"

// ---- Native test harness (only compiled when NOT building for WASM) ----
#ifndef __EMSCRIPTEN__
int main() {
    std::string student = "ayurveda:90,yoga therapy:70,panchakarma:40,communication:85";
    std::string job1 = "ayurveda:80,panchakarma:60"; // strong match expected
    std::string job2 = "unani medicine:70,research writing:80"; // weak match expected

    std::cout << "Student skills: " << student << "\n\n";

    double score1 = matchScore(student.c_str(), job1.c_str());
    std::cout << "Job 1 (\"" << job1 << "\") match: " << score1 << "%\n";
    auto gaps1 = matching::findGaps(matching::parseSkills(student), matching::parseSkills(job1));
    std::cout << "  Gaps: ";
    if (gaps1.empty()) std::cout << "none";
    for (auto& g : gaps1) std::cout << g << " ";
    std::cout << "\n\n";

    double score2 = matchScore(student.c_str(), job2.c_str());
    std::cout << "Job 2 (\"" << job2 << "\") match: " << score2 << "%\n";
    auto gaps2 = matching::findGaps(matching::parseSkills(student), matching::parseSkills(job2));
    std::cout << "  Gaps: ";
    if (gaps2.empty()) std::cout << "none";
    for (auto& g : gaps2) std::cout << g << " ";
    std::cout << "\n";

    return 0;
}
#endif
