import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Apple } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Identity confirmed", { description: "Welcome to NEXUS." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Access granted");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error("Access denied", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OAuth failed";
      toast.error("Handshake failed", { description: msg });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className="fixed inset-0 grid-bg grid-bg-fade pointer-events-none" aria-hidden />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.92 0.22 130 / 0.08), transparent 70%)" }}
        aria-hidden
      />

      <Link
        to="/"
        className="absolute top-6 left-6 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Abort
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-strong rounded-md p-8 relative overflow-hidden">
          {/* terminal header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary terminal-pulse" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
                SECURE_TERMINAL_ENTRY
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">v1.0.4</span>
          </div>

          <h1 className="font-mono text-2xl font-bold mb-1">
            {mode === "signin" ? "> AUTHENTICATE" : "> REGISTER_OPERATOR"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8 font-mono">
            {mode === "signin" ? "Enter credentials to access mainframe." : "Provision new clearance level."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">CALLSIGN</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Operator name"
                  className="mt-2 w-full bg-input/40 border border-border rounded-sm px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-primary focus:glow-lime transition-all"
                />
              </div>
            )}
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">EMAIL</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@nexus.io"
                className="mt-2 w-full bg-input/40 border border-border rounded-sm px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-primary focus:glow-lime transition-all"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">PASSPHRASE</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full bg-input/40 border border-border rounded-sm px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-primary focus:glow-lime transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground font-mono text-sm uppercase tracking-[0.15em] px-4 py-3 rounded-sm hover:glow-lime transition-all disabled:opacity-50 flex items-center justify-center gap-2 btn-glitch"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Establish Connection" : "Initialize Identity"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-mono">
              <span className="bg-[#0A0A0A] px-4 text-muted-foreground">EXTERNAL_PROTOCOLS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="flex items-center justify-center gap-2 border border-border/50 rounded-sm px-4 py-2.5 font-mono text-xs hover:bg-muted/10 transition-all uppercase tracking-widest hover:border-primary/50"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              className="flex items-center justify-center gap-2 border border-border/50 rounded-sm px-4 py-2.5 font-mono text-xs hover:bg-muted/10 transition-all uppercase tracking-widest hover:border-primary/50"
            >
              <Apple className="w-3.5 h-3.5" /> Apple
            </button>
          </div>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === "signin" ? "// no clearance? register →" : "// existing operator? sign in →"}
          </button>
        </div>

        <div className="mt-4 text-center font-mono text-[10px] text-muted-foreground tracking-[0.2em]">
          ENCRYPTED // E2E // ZERO_KNOWLEDGE
        </div>
      </motion.div>
    </div>
  );
}
