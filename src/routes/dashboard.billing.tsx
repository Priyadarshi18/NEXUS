import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Users, Target, Cpu, ScanLine, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/billing")({
  component: BillingPage,
});

function BillingPage() {
  const [tier, setTier] = useState<"individual" | "business">("individual");

  return (
    <div className="min-h-[calc(100vh-2rem)] flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-sm bg-primary glow-lime grid place-items-center">
            <Cpu className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-mono font-bold tracking-[0.2em] text-2xl">NEXUS_ULTIMATE</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Unleash <span className="text-primary">Supercharged</span> Intelligence.
        </h1>
        <p className="text-muted-foreground text-lg mb-10 font-mono">
          Try <span className="text-primary">Free</span> For 7 Days
        </p>

        {/* Toggle */}
        <div className="inline-flex bg-secondary/50 p-1 rounded-full border border-border mb-12">
          <button
            onClick={() => setTier("individual")}
            className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${
              tier === "individual" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setTier("business")}
            className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${
              tier === "business" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Business
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* NEXUS LITE */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 text-left shadow-2xl relative overflow-hidden group hover:border-primary/20 transition-all"
          >
            <div className="mb-8">
              <div className="font-mono text-[10px] text-muted-foreground tracking-[0.3em] mb-4 uppercase">Nexus_Lite</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-muted-foreground text-xs font-mono">/mo</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-mono mt-2">
                Essential features for <span className="text-foreground">individual recruiters</span>
              </p>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-full font-bold border-white/10 hover:bg-white/5 transition-all mb-8">
              Current Plan
            </Button>

            <div className="space-y-4">
              {[
                { icon: ScanLine, label: "50 Semantic Scans", sub: "Monthly limit" },
                { icon: Target, label: "Basic Skill Matching", sub: "Core entity extraction" },
                { icon: Users, label: "Single User", sub: "Personal workspace" },
                { icon: Cpu, label: "Standard Models", sub: "Gemini 3 Flash base" },
                { icon: Info, label: "Community Support", sub: "Access to knowledge base" },
              ].map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* NEXUS ULTRA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card/40 backdrop-blur-xl border border-primary/30 rounded-[2.5rem] p-8 text-left shadow-2xl relative overflow-hidden group hover:border-primary/50 transition-all scale-105"
          >
            <div className="absolute top-0 right-0 p-6">
               <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[8px] font-mono uppercase tracking-widest font-bold">
                 Best Value
               </div>
            </div>

            <div className="mb-8">
              <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-4 uppercase">Nexus_Ultra</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold">₹1,499</span>
                <span className="text-muted-foreground text-xs font-mono">/mo</span>
              </div>
              <p className="text-muted-foreground text-[10px] font-mono mt-2">
                Advanced power for <span className="text-primary">high-performance teams</span>
              </p>
            </div>

            <Button className="w-full h-12 rounded-full font-bold bg-primary text-primary-foreground hover:glow-lime transition-all mb-8 shadow-lg">
              Upgrade Now
            </Button>

            <div className="space-y-4">
              {[
                { icon: ScanLine, label: "Unlimited Scans", sub: "No monthly quotas" },
                { icon: Target, label: "Advanced Gap Analysis", sub: "Deep-learning matching" },
                { icon: Users, label: "Multi-User / Teams", sub: "Shared candidate pools" },
                { icon: Cpu, label: "Custom Models", sub: "Train on your criteria" },
                { icon: Zap, label: "Priority Inference", sub: "Zero-latency processing" },
              ].map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
           <Info className="w-3 h-3" /> Secure processing via Stripe Core
        </div>
      </motion.div>
    </div>
  );
}
