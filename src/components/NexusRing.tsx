import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface NexusRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
}

function getColor(score: number) {
  if (score >= 85) return { stroke: "oklch(0.92 0.22 130)", glow: "oklch(0.92 0.22 130)", name: "lime" };
  if (score >= 60) return { stroke: "oklch(0.82 0.18 220)", glow: "oklch(0.82 0.18 220)", name: "cyan" };
  return { stroke: "oklch(0.78 0.16 70)", glow: "oklch(0.78 0.16 70)", name: "amber" };
}

export function NexusRing({
  score,
  size = 180,
  strokeWidth = 6,
  label = "CONFIDENCE",
  showLabel = true,
}: NexusRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getColor(score);

  const spring = useSpring(0, { stiffness: 80, damping: 14, mass: 0.8 });
  const dashOffset = useTransform(spring, (v) => circumference - (v / 100) * circumference);
  const displayScore = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(Math.max(0, Math.min(100, score)));
  }, [score, spring]);

  const filterId = `nexus-glow-${color.name}`;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`grad-${color.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color.stroke} stopOpacity="1" />
            <stop offset="100%" stopColor={color.stroke} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(1 0 0 / 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#grad-${color.name})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset, filter: `url(#${filterId})` }}
        />
        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 360;
          const isMajor = i % 5 === 0;
          const inner = radius - strokeWidth - (isMajor ? 8 : 4);
          const outer = radius - strokeWidth - 2;
          const rad = (angle * Math.PI) / 180;
          const x1 = size / 2 + inner * Math.cos(rad);
          const y1 = size / 2 + inner * Math.sin(rad);
          const x2 = size / 2 + outer * Math.cos(rad);
          const y2 = size / 2 + outer * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="oklch(1 0 0 / 0.15)"
              strokeWidth={isMajor ? 1 : 0.5}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="font-mono font-bold tracking-tight tabular-nums"
          style={{
            fontSize: size * 0.28,
            color: color.stroke,
            textShadow: `0 0 16px ${color.glow}`,
          }}
        >
          <motion.span>{displayScore}</motion.span>
        </motion.div>
        {showLabel && (
          <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mt-1">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
