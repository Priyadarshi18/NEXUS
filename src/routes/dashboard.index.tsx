import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { NexusRing } from "@/components/NexusRing";
import { Plus, CheckCircle2, XCircle, FileText, Trash2, Star, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

type BaseCandidate = Tables<"candidates">;
interface Candidate extends BaseCandidate {
  created_at_date?: string;
  created_at_time?: string;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

function DashboardHome() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    // Initial fetch from local backend
    const fetchCandidates = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/candidates");

        // Safety check: ensure response is JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server did not return JSON. Is the backend running on port 5000?");
        }

        const data = await res.json();
        setCandidates(data);
      } catch (err) {
        console.error("❌ Failed to fetch candidates:", err);
        // Silently fail if it's just a background poll, but show toast on initial mount if desired
      }
    };

    fetchCandidates();

    // Optional: Poll every 10 seconds for updates if no real-time
    const interval = setInterval(fetchCandidates, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleShortlist = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/candidates/${id}/shortlist`, {
        method: "PUT",
      });
      if (res.ok) {
        const updated = await res.json();
        setCandidates((prev) =>
          prev?.map((c) => (c.id === id ? updated : c)) ?? null
        );
        toast.success(updated.shortlist_status ? "Candidate shortlisted" : "Shortlist removed");
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/candidates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCandidates((c) => c?.filter((x) => x.id !== id) ?? null);
        toast.success("Candidate purged");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const stats = {
    total: candidates?.length ?? 0,
    shortlisted: candidates?.filter((c) => c.shortlist_status).length ?? 0,
    avg: candidates && candidates.length > 0
      ? Math.round(candidates.reduce((a, c) => a + (c.match_score || 0), 0) / candidates.length)
      : 0,
  };

  const sortedCandidates = candidates ? [...candidates].sort((a, b) => (b.match_score || 0) - (a.match_score || 0)) : [];
  const totalResumes = sortedCandidates.length;
  const topCount = Math.max(1, Math.floor(totalResumes * 0.2));
  const topCandidateIds = new Set(sortedCandidates.slice(0, topCount).map(c => c.id));

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-2 flex items-center gap-2">
            <span className="terminal-pulse">●</span> COMMAND_CENTER
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Candidate Grid</h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono">
            Welcome back, operator <span className="text-primary">{user?.email?.split("@")[0]}</span>.
          </p>
        </div>

        <Link
          to="/dashboard/analyze"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-wider px-5 py-3 rounded-sm hover:glow-lime transition-all btn-glitch"
        >
          <Plus className="w-4 h-4" />
          New Scan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-border rounded-sm overflow-hidden mb-10">
        {[
          { label: "TOTAL_PROCESSED", value: stats.total },
          { label: "SHORTLISTED", value: stats.shortlisted },
          { label: "AVG_CONFIDENCE", value: stats.avg, suffix: "%" },
        ].map((s) => (
          <div key={s.label} className="bg-card px-6 py-5">
            <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] mb-2">{s.label}</div>
            <div className="font-mono text-3xl font-bold text-primary tabular-nums">
              {s.value}
              {s.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {candidates === null ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-sm skeleton-terminal" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {sortedCandidates.map((c) => (
            <CandidateCard 
              key={c.id} 
              candidate={c} 
              onDelete={() => handleDelete(c.id)}
              onToggleShortlist={() => handleToggleShortlist(c.id)}
              onClick={() => setSelectedCandidate(c)} 
              isTop={topCandidateIds.has(c.id)}
            />
          ))}
        </motion.div>
      )}

      {/* Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] glass rounded-sm overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-4">
                <NexusRing score={selectedCandidate.match_score} size={48} strokeWidth={3} />
                <div>
                  <h2 className="text-xl font-bold">{selectedCandidate.candidate_name}</h2>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    ID: {selectedCandidate.id.slice(0, 8)} · {selectedCandidate.resume_filename}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="w-10 h-10 grid place-items-center rounded-sm hover:bg-secondary text-muted-foreground transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-3 uppercase">Executive_Summary</div>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap bg-secondary/30 p-4 rounded-sm border border-border/50">
                  {selectedCandidate.analysis}
                </p>
              </section>

              <div className="grid lg:grid-cols-2 gap-10">
                <section>
                  <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-5 uppercase flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" /> Technical_Proficiency_Matrix
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {((selectedCandidate.top_skills as string[]) || []).length > 0 ? (
                      ((selectedCandidate.top_skills as string[]) || []).map((s, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 bg-primary/5 border border-primary/10 rounded-sm group hover:bg-primary/10 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-tight">{s}</span>
                            <span className="text-[9px] font-mono text-primary/60 tracking-widest">VERIFIED_MATCH</span>
                          </div>
                          <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ delay: i * 0.05, duration: 0.8 }}
                              className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] font-mono text-muted-foreground bg-secondary/20 p-4 rounded-sm border border-border/50 text-center uppercase tracking-widest">
                        No significant matches found
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <div className="font-mono text-[10px] text-amber tracking-[0.3em] mb-5 uppercase flex items-center gap-2">
                    <XCircle className="w-3 h-3" /> Critical_Knowledge_Gaps
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {((selectedCandidate.missing_skills as string[]) || []).length > 0 ? (
                      ((selectedCandidate.missing_skills as string[]) || []).map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-amber/5 border border-amber/10 rounded-sm group hover:bg-amber/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-1 rounded-full bg-amber/40 group-hover:bg-amber transition-colors" />
                            <span className="text-[11px] font-mono text-amber/80 font-bold uppercase tracking-tight">{s}</span>
                          </div>
                          <span className="text-[9px] font-mono text-amber/40 tracking-widest">REQUIREMENT_MISSING</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] font-mono text-primary/60 bg-primary/5 p-4 rounded-sm border border-primary/10 text-center uppercase tracking-widest">
                        Perfect match - No gaps identified
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="pt-6 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] mb-1 uppercase">Match_Confidence</div>
                    <div className="text-2xl font-mono font-bold text-primary">{selectedCandidate.match_score}%</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] mb-1 uppercase">Selection_Status</div>
                    <div className={`text-sm font-mono uppercase tracking-widest ${selectedCandidate.shortlist_status ? "text-primary" : "text-muted-foreground"}`}>
                      {selectedCandidate.shortlist_status ? "SHORTLISTED" : "UNDER_REVIEW"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleToggleShortlist(selectedCandidate.id);
                    setSelectedCandidate(prev => prev ? { ...prev, shortlist_status: !prev.shortlist_status } : null);
                  }}
                  className={`px-6 py-3 font-mono text-[11px] uppercase tracking-widest border transition-all ${selectedCandidate.shortlist_status
                      ? "bg-amber/10 border-amber text-amber hover:bg-amber/20"
                      : "bg-primary/10 border-primary text-primary hover:glow-lime"
                    }`}
                >
                  {selectedCandidate.shortlist_status ? "Remove Shortlist" : "Approve Shortlist"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function CandidateCard({ 
  candidate, 
  onDelete,
  onToggleShortlist,
  onClick,
  isTop = false
}: { 
  candidate: Candidate; 
  onDelete: () => void;
  onToggleShortlist: () => void;
  onClick: () => void;
  isTop?: boolean;
}) {
  const skills = (candidate.top_skills as string[]) ?? [];
  
  const dateStr = candidate.created_at_date || (candidate.created_at?.includes(" ·") ? candidate.created_at.split(" ·")[0] : candidate.created_at);
  const timeStr = candidate.created_at_time || (candidate.created_at?.includes(" ·") ? candidate.created_at.split(" ·")[1] : "");

  return (
    <motion.div 
      variants={item}
      whileHover={!isTop ? { scale: 1.02, y: -4 } : {}}
      animate={isTop ? { 
        scale: [1, 1.03, 1],
        boxShadow: [
          "0 0 0px rgba(var(--primary), 0)",
          "0 0 20px rgba(var(--primary), 0.4)",
          "0 0 0px rgba(var(--primary), 0)"
        ],
        borderColor: [
          "rgba(var(--border), 1)",
          "rgba(var(--primary), 1)",
          "rgba(var(--border), 1)"
        ]
      } : {}}
      transition={isTop ? {
        repeat: Infinity,
        duration: 2.5,
        ease: "easeInOut"
      } : {}}
      onClick={onClick}
      className={`glass p-5 rounded-sm border border-border hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden ${isTop ? 'bg-primary/5' : ''}`}
    >
      {isTop && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[9px] px-2 py-1 uppercase tracking-widest rounded-bl-sm z-10 shadow-md">
          TOP_MATCH <Star className="w-2.5 h-2.5 inline-block ml-1 pb-0.5" />
        </div>
      )}
      
      {candidate.shortlist_status && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500" />
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10" onClick={e => e.stopPropagation()}>
        <button
          onClick={onToggleShortlist}
          className={`w-7 h-7 grid place-items-center rounded-sm transition-all ${candidate.shortlist_status
              ? "text-amber bg-amber/10 border border-amber/20"
              : "text-muted-foreground hover:text-amber hover:bg-amber/10 border border-transparent"
            }`}
          title="Toggle Shortlist"
        >
          <Star className={`w-3.5 h-3.5 ${candidate.shortlist_status ? "fill-amber" : ""}`} />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 grid place-items-center rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent transition-all"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <NexusRing score={candidate.match_score} size={92} strokeWidth={4} showLabel={false} />
        <div className="flex-1 min-w-0 pt-1">
          <div className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] mb-1">CANDIDATE</div>
          <h3 className="font-semibold truncate">{candidate.candidate_name}</h3>
          <div className="flex flex-col gap-1 mt-1.5">
            <div className="flex items-center gap-1.5">
              {candidate.shortlist_status ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary">
                  <CheckCircle2 className="w-3 h-3" /> Shortlist
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <XCircle className="w-3 h-3" /> Reject
                </span>
              )}
            </div>
            <div className="flex items-start gap-1.5 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-tighter mt-1">
              <Clock className="w-2.5 h-2.5 mt-0.5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span>{dateStr || "DATE_UNSPECIFIED"}</span>
                <span className="text-primary/40">{timeStr || "TIME_UNSPECIFIED"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {candidate.resume_filename && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mb-3 truncate">
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate">{candidate.resume_filename}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {skills.slice(0, 4).map((s, i) => (
          <span
            key={i}
            className="text-[10px] font-mono px-1.5 py-0.5 bg-secondary border border-border rounded-sm text-foreground/80"
          >
            {s}
          </span>
        ))}
        {skills.length > 4 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 text-muted-foreground">+{skills.length - 4}</span>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded-sm p-16 text-center">
      <div className="font-mono text-[10px] text-muted-foreground tracking-[0.3em] mb-4">[ EMPTY_BUFFER ]</div>
      <h3 className="text-lg font-semibold mb-2">No candidates in the pipeline</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Upload a resume and a job description to begin semantic analysis.
      </p>
      <Link
        to="/dashboard/analyze"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-sm hover:glow-lime transition-all"
      >
        <Plus className="w-3.5 h-3.5" /> Initiate First Scan
      </Link>
    </div>
  );
}
