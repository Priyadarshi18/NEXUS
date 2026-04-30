import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Cpu, ScanLine, Target, Zap, Github, Twitter, Linkedin, Terminal } from "lucide-react";
import { NexusRing } from "@/components/NexusRing";
import { useEffect, useState, useRef } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Dynamic Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left glow-lime" 
        style={{ scaleX }}
      />
      {/* Parallax grid */}
      <div
        className="fixed inset-0 grid-bg grid-bg-fade pointer-events-none"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        aria-hidden
      />
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.92 0.22 130 / 0.15), transparent 70%)",
          transform: `translate(-50%, ${scrollY * -0.2}px)`,
        }}
        aria-hidden
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-primary glow-lime grid place-items-center">
            <div className="w-2.5 h-2.5 bg-background rounded-sm" />
          </div>
          <span className="font-mono font-bold tracking-[0.15em] text-sm">NEXUS</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            to="/auth"
            className="font-mono text-xs uppercase tracking-wider px-4 py-2 text-muted-foreground hover:text-foreground transition-colors btn-glitch"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="font-mono text-xs uppercase tracking-wider px-4 py-2 bg-primary text-primary-foreground rounded-sm hover:glow-lime transition-all"
          >
            Initialize
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 px-6 md:px-12 pt-16 md:pt-24 pb-32 max-w-7xl mx-auto"
      >
        <motion.div variants={item} className="flex items-center gap-2 font-mono text-xs text-primary mb-6">
          <span className="terminal-pulse">●</span>
          <span className="tracking-[0.25em]">SYSTEM_ONLINE / V1.0.4</span>
        </motion.div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-center">
          <div>
            <motion.h1
              variants={item}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95]"
            >
              Semantic
              <br />
              resume
              <br />
              <span className="text-primary text-glow-lime">intelligence.</span>
            </motion.h1>
            <motion.p variants={item} className="mt-8 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              NEXUS scans, parses, and grades candidates against any job description with surgical precision. No more keyword games — just real signal.
            </motion.p>

            <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-wider px-6 py-3.5 rounded-sm hover:glow-lime transition-all btn-glitch"
              >
                Enter Mainframe
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="font-mono text-sm uppercase tracking-wider px-6 py-3.5 border border-border rounded-sm hover:bg-secondary transition-colors"
              >
                View Specs
              </a>
            </motion.div>

            <motion.div variants={item} className="mt-12 flex items-center gap-8 font-mono text-xs text-muted-foreground">
              <div>
                <div className="text-primary text-2xl font-bold">99.2%</div>
                <div className="tracking-wider mt-1">PARSE_ACCURACY</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-primary text-2xl font-bold">&lt;3s</div>
                <div className="tracking-wider mt-1">AVG_LATENCY</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-primary text-2xl font-bold">∞</div>
                <div className="tracking-wider mt-1">SCALE</div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={item} className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-8 rounded-full" style={{ background: "radial-gradient(circle, oklch(0.92 0.22 130 / 0.2), transparent 70%)" }} />
              <NexusRing score={92} size={300} strokeWidth={8} />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-primary tracking-[0.3em] whitespace-nowrap">
                CANDIDATE_STREAM_LIVE
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 md:px-12 pb-32 max-w-7xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-3 gap-px bg-border rounded-sm overflow-hidden"
        >
          {[
            { icon: ScanLine, title: "Multimodal Parsing", desc: "Reads PDF and DOCX directly. Layout-aware extraction. No OCR fallbacks." },
            { icon: Cpu, title: "Semantic Match Engine", desc: "Goes beyond keywords. Understands context, seniority, and domain depth." },
            { icon: Target, title: "Auto-Shortlist", desc: "Confidence-graded recommendations. Top skills surfaced. Gaps flagged." },
            { icon: Zap, title: "Sub-Second Inference", desc: "Gemini-grade reasoning at terminal speed. Built for high-volume pipelines." },
            { icon: Cpu, title: "Command Center UI", desc: "Single-pane view of every candidate, every role, every signal." },
            { icon: Target, title: "Bias-Aware", desc: "Skill-first ranking. PII-isolated processing. Auditable decisions." },
          ].map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="bg-card p-8 hover:bg-surface-elevated transition-colors group"
            >
              <f.icon className="w-6 h-6 text-primary mb-5" />
              <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] mb-2">MODULE</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works - Vertical Progress Enhanced */}
      <section id="how-it-works" className="relative z-10 px-6 md:px-12 py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_2.5fr] gap-12">
          <div className="sticky top-32 h-fit">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-mono text-[10px] text-primary tracking-[0.4em] mb-4 uppercase"
            >
              System_Execution
            </motion.div>
            <h2 className="text-4xl font-bold tracking-tighter mb-6">The Nexus Pipeline.</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Our automated workflow handles the entire lifecycle of a candidate scan, from raw data ingestion to neural grading.
            </p>
          </div>

          <div className="space-y-24 relative">
             {/* Progress Vertical Line */}
             <div className="absolute left-0 top-0 bottom-0 w-px bg-border ml-6 md:ml-0" />
             
             {[
               { step: "01", title: "Data Ingestion", desc: "Upload multi-format resumes and job descriptions. Our system supports PDF, DOCX, and raw text buffers.", icon: ScanLine },
               { step: "02", title: "Neural Extraction", desc: "Entities, skills, and experience are extracted with structural awareness, preserving the context of every bullet point.", icon: Cpu },
               { step: "03", title: "Semantic Embedding", desc: "We project your requirements into a high-dimensional vector space, mapping semantic distance between candidate and JD.", icon: Target },
               { step: "04", title: "Automated Grading", desc: "A recursive scoring loop validates every claim against the JD requirements to produce a verified match score.", icon: Zap },
             ].map((s, i) => (
               <motion.div
                 key={s.step}
                 initial={{ opacity: 0, x: 30 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.8 }}
                 className="relative pl-12 md:pl-20"
               >
                 <div className="absolute left-0 top-0 w-12 h-12 md:w-16 md:h-16 rounded-sm bg-background border border-border flex items-center justify-center -translate-x-6 md:-translate-x-1/2 z-10 shadow-xl group hover:border-primary transition-all">
                    <s.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                 </div>
                 <div className="font-mono text-[10px] text-primary mb-2">PHASE_{s.step}</div>
                 <h3 className="text-2xl font-bold mb-4">{s.title}</h3>
                 <p className="text-muted-foreground leading-relaxed max-w-xl">{s.desc}</p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Embedding Visual Section - Restored and Enhanced */}
      <section className="relative z-10 px-6 md:px-12 py-32 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="font-mono text-[10px] text-primary tracking-[0.4em] mb-4 uppercase">Technology_Deep_Dive</div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-8 leading-tight">
              Semantic Intelligence <br /> via Vector Embeddings.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
              Unlike legacy systems that just count keywords, NEXUS translates human language into mathematical coordinates. 
              We map the <span className="text-foreground font-semibold">semantic distance</span> between a candidate's journey and your mission requirements.
            </p>
            
            <div className="space-y-6">
              {[
                { label: "Vector Mapping", desc: "Every skill and experience is projected into a 1536-dimensional space." },
                { label: "Cosine Similarity", desc: "Mathematical calculation of conceptual overlap between JD and Resume." },
                { label: "Contextual Awareness", desc: "Distinguishes between a 'Java Developer' and a 'Java enthusiast' with ease." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_oklch(0.92_0.22_130)]" />
                  <div>
                    <h4 className="font-mono text-sm uppercase tracking-wider text-foreground">{item.label}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative perspective-1000"
          >
            {/* Geometric Vector Visualization */}
            <div className="aspect-square glass rounded-sm overflow-hidden flex items-center justify-center p-8 border-primary/20">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="relative w-full h-full">
                {/* Simulated Data Points */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      x: [0, Math.random() * 40 - 20, 0],
                      y: [0, Math.random() * 40 - 20, 0],
                      opacity: [0.2, 0.6, 0.2]
                    }}
                    transition={{ 
                      duration: 4 + Math.random() * 3, 
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                    className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_oklch(0.92_0.22_130)]"
                    style={{ 
                      left: `${Math.random() * 100}%`, 
                      top: `${Math.random() * 100}%` 
                    }}
                  />
                ))}
                {/* Central Nexus Core */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <motion.div 
                     animate={{ scale: [1, 1.1, 1], rotate: 360 }}
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="w-32 h-32 rounded-full border border-dashed border-primary/40 flex items-center justify-center"
                   >
                      <div className="w-20 h-20 rounded-full border border-primary/60 flex items-center justify-center bg-primary/5 backdrop-blur-md">
                        <Terminal className="w-8 h-8 text-primary" />
                      </div>
                   </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Parallax Call to Action */}
      <section className="relative z-10 px-6 md:px-12 py-32 max-w-7xl mx-auto">
        <motion.div 
          style={{ 
            rotateX: useTransform(scrollYProgress, [0.7, 1], [5, 0]),
            opacity: useTransform(scrollYProgress, [0.7, 1], [0.5, 1])
          }}
          className="relative glass p-12 md:p-24 rounded-sm border-primary/20 overflow-hidden text-center"
        >
          <div className="absolute inset-0 grid-bg opacity-20" />
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 relative z-10">
            Ready to optimize your <br /> <span className="text-primary">talent pipeline?</span>
          </h2>
          <Link
            to="/auth"
            className="relative z-10 inline-flex items-center gap-3 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-sm hover:glow-lime transition-all btn-glitch"
          >
            Deploy Mainframe <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 md:px-12 pt-16 pb-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-6 h-6 rounded-sm bg-primary glow-lime grid place-items-center">
                <div className="w-2 h-2 bg-background rounded-sm" />
              </div>
              <span className="font-mono font-bold tracking-[0.15em] text-xs">NEXUS_CORE</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
              The standard for semantic talent intelligence. Built for high-performance teams who demand signal over noise.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="w-4 h-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-6 uppercase">Platform</div>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Analyzer</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-6 uppercase">Resources</div>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Knowledge Base</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">System Status</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[10px] text-primary tracking-[0.3em] mb-6 uppercase">Legal</div>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Data Processing</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border/40">
          <div className="flex items-center gap-6 font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            <span className="flex items-center gap-1.5"><span className="terminal-pulse">●</span> System_Live</span>
            <span>Uptime: 99.98%</span>
            <span className="hidden md:inline">Region: AP_SOUTH_1</span>
          </div>
          
          <div className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            © {new Date().getFullYear()} NEXUS_LABS — ALL_SIGNALS_RESERVED
          </div>
        </div>
      </footer>
    </div>
  );
}
