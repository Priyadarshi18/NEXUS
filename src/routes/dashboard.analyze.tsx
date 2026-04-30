import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { NexusRing } from "@/components/NexusRing";
import { Upload, FileText, X, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/analyze")({
  component: AnalyzePage,
});

interface AnalysisResult {
  candidate_name: string;
  match_score: number;
  analysis: string;
  top_skills: string[];
  missing_skills: string[];
  shortlist_status: boolean;
}

interface JDAnalysis {
  title: string;
  company?: string;
  summary: string;
  key_skills: string[];
  experience_requirements: string;
  nice_to_haves?: string[];
  full_text: string;
}

const ACCEPTED = [".pdf", ".docx"];

function AnalyzePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [jd, setJd] = useState("");
  const [jdMode, setJdMode] = useState<"paste" | "upload">("paste");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysis | null>(null);
  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [jdDragOver, setJdDragOver] = useState(false);
  const [phase, setPhase] = useState<"idle" | "scanning" | "result">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | File[] | null) => {
    if (!newFiles) return;
    
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter(f => {
      const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
      if (!ACCEPTED.includes(ext)) {
        toast.error(`Unsupported format: ${f.name}`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${f.name}`);
        return false;
      }
      return true;
    });

    setFiles(prev => {
      const combined = [...prev, ...validFiles];
      if (combined.length > 10) {
        toast.warning("Maximum 10 resumes allowed per batch.");
        return combined.slice(0, 10);
      }
      return combined;
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractText = async (f: File): Promise<string> => {
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (ext === ".txt") {
      return new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsText(f);
      });
    }

    if (ext === ".pdf") {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = async () => {
          try {
            const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const arrayBuffer = await f.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              fullText += textContent.items.map((item: any) => item.str).join(' ') + ' ';
            }
            resolve(fullText);
          } catch (e) { reject(e); }
        };
        document.head.appendChild(script);
      });
    }

    return "Unsupported format for text extraction. Please paste text directly.";
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const result = r.result as string;
        resolve(result.split(",")[1]);
      };
      r.onerror = reject;
      r.readAsDataURL(f);
    });

  const handleScan = async () => {
    if (files.length === 0 || !jd.trim() || !user) return;

    setPhase("scanning");
    setResult(null);

    try {
      // 🚀 PARALLEL EXECUTION 🚀
      const scanPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("resume", file);
        formData.append("jobDescription", jd);

        const res = await fetch("http://127.0.0.1:5000/analyze-resume", {
          method: "POST",
          body: formData,
        });

        const raw = await res.text();
        
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(`Backend not returning JSON for ${file.name}`);
        }

        if (!res.ok) {
          if (data.error === "INVALID_RESUME") {
             toast.warning(`Skipped invalid PDF: ${file.name}`);
             return null; // Skip invalid resumes in batch
          }
          throw new Error(data.error || `Scan failed for ${file.name}`);
        }

        return JSON.parse(data.result);
      });

      const results = await Promise.all(scanPromises);
      const validResults = results.filter(r => r !== null);
      
      if (validResults.length === 0) {
         toast.error("All uploaded resumes were invalid. Scan aborted.");
         setPhase("idle");
         return;
      }

      toast.success(`Successfully analyzed ${validResults.length} candidate(s).`);
      
      // If single file, show result directly, otherwise redirect to grid to see the top candidates
      if (validResults.length === 1) {
        const parsed = validResults[0];
        setResult({
          candidate_name: parsed.name || "Candidate",
          match_score: parsed.overall_score || 0,
          analysis: parsed.summary || "",
          top_skills: parsed.candidate_matched_skills || parsed.matched_skills || [],
          missing_skills: parsed.missing_skills || [],
          shortlist_status: (parsed.overall_score || 0) > 70,
        });
        setPhase("result");
      } else {
        // Redirect to grid to see the batch results and top candidates
        navigate({ to: "/dashboard" });
      }

    } catch (e) {
      console.error(e);
      toast.error("Scan failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
      setPhase("idle");
    }
  };
  const handleJDFile = (f: File | null) => {
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      toast.error("Unsupported format", { description: "Use PDF or DOCX." });
      return;
    }
    setJdFile(f);
    // Auto-analyze if file is added? Maybe just set it.
  };

  const handleAnalyzeJD = async () => {
    if (jdMode === "paste" && !jd.trim()) return;
    if (jdMode === "upload" && !jdFile) return;

    setAnalyzingJD(true);
    console.log("🚀 Sending request to backend...");
    try {
      let text = "";

      if (jdMode === "paste") {
        text = jd;
      } else if (jdFile) {
        text = await extractText(jdFile);
      }

      const res = await fetch("http://127.0.0.1:5000/analyze-jd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription: text }),
      });

      const raw = await res.text();

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("❌ Invalid response:", raw);
        throw new Error("Backend not returning JSON");
      }

      // 🔥 PARSE THE AI CONTENT
      let parsed: JDAnalysis;
      try {
        parsed = JSON.parse(data.result);
      } catch {
        console.error("❌ Failed to parse AI result:", data.result);
        throw new Error("AI response was not valid JSON");
      }

      setJdAnalysis(parsed);

      if (parsed.full_text) {
        setJd(parsed.full_text);
      }

      toast.success("JD Analyzed");
    } catch (e) {
      toast.error("JD Analysis Failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setAnalyzingJD(false);
    }
  };
  const reset = () => {
    setFiles([]);
    setJd("");
    setJdFile(null);
    setJdAnalysis(null);
    setPhase("idle");
    setResult(null);
  };

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-2 flex items-center gap-2">
          <span className="terminal-pulse">●</span> SEMANTIC_SCAN_MODULE
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Initiate Scan</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono">
          Upload candidate resume + paste job description. Engine runs Gemini 3 Flash inference.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {phase !== "result" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Upload zone */}
            <div className="relative">
              <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-3 bg-primary/5 w-fit px-2 py-1 rounded-sm border border-primary/20">
                INPUT_01 :: RESUME_DOCUMENT
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-md border-2 border-dashed p-10 min-h-[280px] flex flex-col items-center justify-center text-center transition-all bg-card/30 backdrop-blur-sm ${dragOver
                  ? "border-primary bg-primary/10 glow-lime"
                  : "border-primary/20 hover:border-primary/40 hover:bg-card/50"
                  }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                {phase === "scanning" && <div className="laser-line" />}
                {files.length === 0 ? (
                  <>
                    <div className="w-12 h-12 rounded-sm bg-secondary border border-border grid place-items-center mb-4">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div className="font-mono text-sm">Drop up to 10 resumes or click</div>
                    <div className="font-mono text-[10px] text-muted-foreground tracking-wider mt-2">
                      PDF / DOCX · MAX 10MB EACH
                    </div>
                  </>
                ) : (
                  <div className="w-full flex flex-col gap-3 h-full overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-left bg-card/50 p-3 rounded-sm border border-border/50">
                        <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm truncate">{f.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground mt-1">
                            {(f.size / 1024).toFixed(1)} KB · READY
                          </div>
                        </div>
                        {phase === "idle" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {files.length < 10 && phase === "idle" && (
                      <div className="text-center font-mono text-[10px] text-primary mt-2">
                        + Click to add more ({10 - files.length} slots left)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* JD */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[10px] text-primary tracking-[0.3em] bg-primary/5 px-2 py-1 rounded-sm border border-primary/20">
                  INPUT_02 :: JOB_DESCRIPTION
                </div>
                <div className="flex bg-secondary/50 p-0.5 rounded-sm">
                  <button
                    onClick={() => setJdMode("paste")}
                    className={`px-3 py-1 font-mono text-[10px] rounded-sm transition-all ${jdMode === "paste" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    PASTE
                  </button>
                  <button
                    onClick={() => setJdMode("upload")}
                    className={`px-3 py-1 font-mono text-[10px] rounded-sm transition-all ${jdMode === "upload" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    UPLOAD
                  </button>
                </div>
              </div>

              {jdMode === "paste" ? (
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  disabled={phase === "scanning"}
                  placeholder="// paste full job description here..."
                  className="w-full h-[280px] bg-card/30 border-2 border-primary/20 rounded-md p-4 font-mono text-sm resize-none focus:outline-none focus:border-primary/50 focus:bg-card/50 focus:glow-lime transition-all disabled:opacity-60 placeholder:text-muted-foreground/30"
                />
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setJdDragOver(true); }}
                  onDragLeave={() => setJdDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setJdDragOver(false);
                    handleJDFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  onClick={() => jdInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-md border-2 border-dashed p-10 h-[280px] flex flex-col items-center justify-center text-center transition-all bg-card/30 backdrop-blur-sm ${jdDragOver
                    ? "border-primary bg-primary/10 glow-lime"
                    : "border-primary/20 hover:border-primary/40 hover:bg-card/50"
                    }`}
                >
                  <input
                    ref={jdInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => handleJDFile(e.target.files?.[0] ?? null)}
                  />
                  {!jdFile ? (
                    <>
                      <div className="w-10 h-10 rounded-sm bg-secondary border border-border grid place-items-center mb-3">
                        <Upload className="w-4 h-4 text-primary" />
                      </div>
                      <div className="font-mono text-sm">Drop JD document or click</div>
                      <div className="font-mono text-[10px] text-muted-foreground tracking-wider mt-2">
                        PDF / DOCX
                      </div>
                    </>
                  ) : (
                    <div className="w-full">
                      <div className="flex items-center gap-3 text-left">
                        <FileText className="w-5 h-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm truncate">{jdFile.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">READY</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setJdFile(null); }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence>
                {((jdMode === "paste" && jd.trim()) || (jdMode === "upload" && jdFile)) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <button
                      onClick={handleAnalyzeJD}
                      disabled={analyzingJD}
                      className="w-full border border-primary/30 rounded-sm py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] bg-linear-to-r from-[oklch(0.55_0.18_250)] via-[oklch(0.5_0.2_275)] to-[oklch(0.55_0.18_300)] text-white glow-vibe hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                    >
                      {analyzingJD ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                      ) : (
                        <>Analyze JD Context</>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {jdAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 glass-strong rounded-sm border border-primary/20 space-y-4"
                >
                  <div>
                    <div className="font-mono text-[8px] text-primary tracking-[0.3em] mb-1">EXTRACTED_ROLE</div>
                    <div className="text-sm font-bold">{jdAnalysis.title}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[8px] text-muted-foreground tracking-[0.3em] mb-1">REQUIREMENTS</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {jdAnalysis.key_skills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary font-mono text-[9px] rounded-full border border-primary/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8px] text-muted-foreground tracking-[0.3em] mb-1">EXPERIENCE</div>
                    <div className="text-[11px] text-muted-foreground">{jdAnalysis.experience_requirements}</div>
                  </div>
                  {jdAnalysis.nice_to_haves && jdAnalysis.nice_to_haves.length > 0 && (
                    <div>
                      <div className="font-mono text-[8px] text-muted-foreground tracking-[0.3em] mb-1">NICE_TO_HAVE</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {jdAnalysis.nice_to_haves.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-secondary text-muted-foreground font-mono text-[9px] rounded-full border border-border">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="lg:col-span-2 flex flex-col items-center gap-6 pt-12 pb-8">
              <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] text-center max-w-xl">
                {phase === "scanning"
                  ? "● SCANNING_DOCUMENT // PARSING_SEMANTICS // COMPUTING_MATCH_VECTOR..."
                  : "SYSTEM_IDLE // READY_FOR_EXECUTION"}
              </div>
              <button
                onClick={handleScan}
                disabled={files.length === 0 || !jd.trim() || phase === "scanning"}
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground font-mono text-base uppercase tracking-[0.2em] px-12 py-4 rounded-sm hover:glow-lime transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-glitch shadow-2xl"
              >
                {phase === "scanning" ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Executing Scan</>
                ) : (
                  <>Execute Scan <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </motion.div>
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-[auto_1fr] gap-10 items-start glass rounded-sm p-8"
          >
            <div className="flex flex-col items-center gap-4">
              <NexusRing score={result.match_score} size={240} strokeWidth={8} />
              <div className={`font-mono text-xs tracking-[0.2em] inline-flex items-center gap-2 ${result.shortlist_status ? "text-primary" : "text-muted-foreground"}`}>
                {result.shortlist_status ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {result.shortlist_status ? "RECOMMEND_SHORTLIST" : "DO_NOT_ADVANCE"}
              </div>
              <button
                onClick={() => {
                  setResult(prev => prev ? { ...prev, shortlist_status: !prev.shortlist_status } : null);
                  toast.info("Status updated locally");
                }}
                className={`mt-4 w-full py-2 border rounded-sm font-mono text-[10px] uppercase tracking-widest transition-all ${result.shortlist_status ? "border-amber text-amber hover:bg-amber/10" : "border-primary text-primary hover:bg-primary/10"}`}
              >
                {result.shortlist_status ? "Remove from Shortlist" : "Move to Shortlist"}
              </button>
            </div>

            <div className="space-y-6 min-w-0">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] mb-1">CANDIDATE</div>
                <h2 className="text-3xl font-bold">{result.candidate_name}</h2>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] mb-2">EXEC_SUMMARY</div>
                <p className="text-sm leading-relaxed text-foreground/90">{result.analysis}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="font-mono text-[10px] text-primary tracking-[0.25em] mb-2">+ TOP_SKILLS</div>
                  <ul className="space-y-1.5">
                    {result.top_skills.map((s, i) => (
                      <li key={i} className="font-mono text-xs flex items-start gap-2">
                        <span className="text-primary mt-0.5">›</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-amber tracking-[0.25em] mb-2">— GAPS_DETECTED</div>
                  <ul className="space-y-1.5">
                    {result.missing_skills.map((s, i) => (
                      <li key={i} className="font-mono text-xs flex items-start gap-2 text-muted-foreground">
                        <span className="text-amber mt-0.5">›</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={reset}
                  className="font-mono text-xs uppercase tracking-wider px-4 py-2.5 border border-border rounded-sm hover:bg-secondary transition-colors"
                >
                  Scan Another
                </button>
                <button
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="font-mono text-xs uppercase tracking-wider px-4 py-2.5 bg-primary text-primary-foreground rounded-sm hover:glow-lime transition-all"
                >
                  View Grid →
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
