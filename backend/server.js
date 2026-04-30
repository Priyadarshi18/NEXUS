const express = require("express");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cors = require("cors");
const multer = require("multer");
const PDFLib = require("pdf-parse");

const extractPDFText = async (buffer) => {
    try {
        let text = "";
        // If the library is a direct function (older versions)
        if (typeof PDFLib === 'function') {
            const data = await PDFLib(buffer);
            text = data.text || "";
        }
        // If the library is an object with a PDFParse class (newer versions like 2.4.5)
        else if (PDFLib && PDFLib.PDFParse) {
            const uint8 = new Uint8Array(buffer);
            const parser = new PDFLib.PDFParse(uint8);
            const result = await parser.getText();
            text = (result && result.text) ? result.text : String(result || "");
        }

        // Ensure we return a clean string
        return typeof text === 'string' ? text : String(text || "");
    } catch (err) {
        console.error("❌ PDF Extraction Error:", err.message);
        return "";
    }
};

const app = express();
const uploadMiddleware = multer();
const fs = require("fs");
const path = require("path");

// 📁 Local Database File
const DB_FILE = path.join(__dirname, "candidates.json");

// 🛠️ Local DB Helpers
const getCandidates = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error("❌ DB Read Error:", err);
        return [];
    }
};

const saveCandidate = (candidate) => {
    const candidates = getCandidates();
    
    // Generate IST Date and Time
    const now = new Date();
    const dateStr = now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).toUpperCase();

    const timeStr = now.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).toUpperCase() + " IST";

    const newCandidate = { 
        ...candidate, 
        id: Date.now().toString(), 
        created_at_date: dateStr,
        created_at_time: timeStr
    };
    candidates.unshift(newCandidate);
    fs.writeFileSync(DB_FILE, JSON.stringify(candidates, null, 2));
    return newCandidate;
};

const deleteCandidate = (id) => {
    const candidates = getCandidates();
    const filtered = candidates.filter(c => c.id !== id);
    fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2));
    return true;
};

app.use(cors());
app.use(express.json());

/* =========================================================
   📂 LOCAL PERSISTENCE ENDPOINTS
========================================================= */
app.get("/candidates", (req, res) => {
    res.json(getCandidates());
});

app.delete("/candidates/:id", (req, res) => {
    const { id } = req.params;
    deleteCandidate(id);
    res.json({ success: true });
});

app.put("/candidates/:id/shortlist", (req, res) => {
    const { id } = req.params;
    const candidates = getCandidates();
    const index = candidates.findIndex(c => c.id === id);

    if (index !== -1) {
        candidates[index].shortlist_status = !candidates[index].shortlist_status;
        fs.writeFileSync(DB_FILE, JSON.stringify(candidates, null, 2));
        return res.json(candidates[index]);
    }

    res.status(404).json({ error: "Candidate not found" });
});

/* =========================================================
   🧠 JD ANALYSIS
========================================================= */
app.post("/analyze-jd", async (req, res) => {
    try {
        const { jobDescription } = req.body;

        if (!jobDescription) {
            return res.status(400).json({ error: "Job description required" });
        }

        const prompt = `
### ROLE: Senior AI Recruitment Engineer (NEXUS_ENGINE)
### OBJECTIVE: Deconstruct the provided Job Description into a high-fidelity semantic matrix with 100% accuracy.

### EXTRACTION GUIDELINES:
1. **JOB_TITLE**: Extract the exact official title. If multiple, choose the primary one.
2. **EXECUTIVE_SUMMARY**: A high-impact, 2-sentence summary of the role's mission.
3. **CORE_SKILLS**: Extract EVERY technical skill, tool, framework, and methodology mentioned. 
   - DO NOT generalize. (e.g., "React" instead of just "Frontend").
   - Categorize them implicitly but return as a flat list of strings.
4. **EXPERIENCE_MATRIX**: Extract specific years of experience, educational requirements, and industry-specific background.
5. **NICE_TO_HAVES**: Extract preferred qualifications, optional certifications, or "plus" skills.

### OUTPUT FORMAT (STRICT JSON ONLY):
{
  "title": "Exact Job Title",
  "summary": "Impactful role summary...",
  "key_skills": ["List", "of", "all", "technical", "skills", "found"],
  "experience_requirements": "Summary of years/experience needed...",
  "nice_to_haves": ["Optional", "skills"],
  "full_text": "Original Text"
}

### CONSTRAINTS:
- No conversational filler.
- No markdown formatting (no \`\`\`json).
- If a section is missing, return an empty array or "Not specified".
- Ensure the 'key_skills' list is exhaustive.

### SOURCE_DATA:
${jobDescription.slice(0, 5000)}
`;

        const aiRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistral", // 🔥 better JSON consistency than llama3
                prompt,
                stream: false,
            }),
        });

        const aiData = await aiRes.json();

        if (!aiData || !aiData.response) {
            throw new Error("No response from Ollama");
        }

        // 🔥 CLEAN + EXTRACT JSON
        let raw = aiData.response.trim();

        raw = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const match = raw.match(/\{[\s\S]*\}/);

        let parsed;

        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch {
                console.log("⚠️ JSON parse failed:", match[0]);
            }
        }

        // 🔥 FINAL FALLBACK (safe, not garbage)
        if (!parsed) {
            console.log("⚠️ RAW OUTPUT:", raw);

            parsed = {
                title: extractTitleFallback(jobDescription),
                summary: raw,
                key_skills: [],
                experience_requirements: "",
                nice_to_haves: [],
                full_text: jobDescription,
            };
        }

        // always keep original text
        parsed.full_text = jobDescription;

        res.json({
            result: JSON.stringify(parsed),
        });

    } catch (err) {
        console.error("❌ JD ERROR:", err);

        res.status(500).json({
            error: err.message || "JD analysis failed",
        });
    }
});

/* =========================================================
   📄 RESUME ANALYSIS
========================================================= */
app.post("/analyze-resume", uploadMiddleware.single("resume"), async (req, res) => {
    try {
        const file = req.file;
        const { jobDescription } = req.body;

        if (!file || !jobDescription) {
            return res.status(400).json({
                error: "Resume file and Job Description required",
            });
        }

        const resumeText = await extractPDFText(file.buffer);

        if (!resumeText || resumeText.length < 50) {
            return res.status(400).json({
                error: "Could not extract enough text from PDF",
            });
        }

        const prompt = `
### ROLE: Technical Audit Engine (NEXUS_AUDIT)
### OBJECTIVE: Perform a high-precision gap analysis between the Candidate Resume and the Job Description.

### AUDIT_INSTRUCTIONS:
1. **INVENTORY**: Identify EVERY technical skill, tool, and qualification required in the JD.
2. **VERIFICATION**: Scan the Resume for EXACT or highly similar matches. DO NOT give credit for vague mentions.
3. **GAP_DETECTION**: Explicitly list skills required by the JD that are COMPLETELY MISSING from the Resume.

### OUTPUT FORMAT (STRICT JSON ONLY):
{
  "is_valid_resume": true,
  "name": "Full Name",
  "required_jd_skills": ["List of all skills found in JD"],
  "candidate_matched_skills": ["Skills from JD actually found in Resume"],
  "missing_skills": ["Critical skills in JD missing in Resume"],
  "experience_match": boolean,
  "summary": "1-sentence audit result",
  "scoring_justification": "Detailed breakdown of the match/mismatch"
}

### CRITICAL:
If the JD asks for "React, Node, AWS" and the resume only has "HTML, CSS", the "missing_skills" MUST include "React, Node, AWS". Be brutal. Do not sugarcoat.

### SOURCE_DATA:
RESUME_TEXT:
${String(resumeText || "").slice(0, 5000)}

JOB_DESCRIPTION:
${String(jobDescription || "").slice(0, 3000)}
`;

        const aiRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3",
                prompt,
                stream: false,
            }),
        });

        const aiData = await aiRes.json();
        let raw = aiData.response.trim();

        // 🔥 Robust JSON extraction
        raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);

        let parsed;
        if (jsonMatch) {
            try {
                parsed = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("❌ Resume JSON Parse Error:", e);
            }
        }

        // ❌ ULTRA-STRICT VALIDATION CHECK
        if (!parsed || parsed.is_valid_resume === false || !parsed.name || parsed.name.toLowerCase().includes("unknown") || parsed.name.toLowerCase() === "null") {
            return res.status(400).json({
                error: "INVALID_RESUME",
                message: "NEXUS_INTEGRITY_SENTRY: The uploaded document does not match the structural signature of a professional resume."
            });
        }

        // 🧠 DETERMINISTIC SCORING LOGIC (Coding Logic)
        const required = (parsed.required_jd_skills || []).length;
        const matched = (parsed.candidate_matched_skills || []).length;
        const expWeight = parsed.experience_match ? 20 : 0;
        
        // Base score from skills (80% weight) + Experience (20% weight)
        let skillScore = required > 0 ? (matched / required) * 80 : 0;
        let finalScore = Math.min(100, Math.round(skillScore + expWeight));

        // Ensure a minimum score of 5 if it's a valid resume but zero matches
        if (finalScore < 5) finalScore = 5;

        // ✅ Save to local JSON DB
        const saved = saveCandidate({
            candidate_name: parsed.name,
            match_score: finalScore,
            analysis: parsed.summary || "",
            top_skills: parsed.candidate_matched_skills || [],
            missing_skills: parsed.missing_skills || [],
            shortlist_status: finalScore > 70,
            resume_filename: file.originalname,
        });

        res.json({
            result: JSON.stringify({
                ...parsed,
                overall_score: finalScore
            }),
            saved: saved
        });

    } catch (err) {
        console.error("❌ RESUME ERROR:", err);
        res.status(500).json({
            error: err.message || "Resume analysis failed",
        });
    }
});

/* =========================
   🛠️ HELPERS
========================= */
const extractTitleFallback = (text) => {
    if (!text) return "Job Role";
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    return lines[0].slice(0, 50) || "Job Role";
};

const extractNameFallback = (text) => {
    if (!text) return "Candidate";
    const lines = text.split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    // Usually the name is in the first 3 lines
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
        const line = lines[i];
        // Ignore lines that look like "Resume", "Curriculum Vitae", or contain @ (email)
        if (!line.toLowerCase().includes("resume") &&
            !line.toLowerCase().includes("curriculum") &&
            !line.includes("@") &&
            line.split(" ").length >= 2) {
            return line.slice(0, 30);
        }
    }
    return "Candidate";
};

/* =========================
   🚀 HEALTH CHECK
========================= */
app.get("/", (req, res) => {
    res.send("✅ Server running");
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(5000, "0.0.0.0", () => {
    console.log("🚀 Server running on http://127.0.0.1:5000");
});