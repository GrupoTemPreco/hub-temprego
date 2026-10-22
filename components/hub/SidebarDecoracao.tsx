"use client";

import { motion } from "framer-motion";

const decoNodes = [
  { left: "1%", bottom: "8%", size: "h-1.5 w-1.5", delay: 0, driftX: 10, driftY: -16 },
  { left: "4%", bottom: "14%", size: "h-1 w-1", delay: 0.1, driftX: -8, driftY: -13 },
  { left: "7%", bottom: "20%", size: "h-1.5 w-1.5", delay: 0.2, driftX: 9, driftY: -14 },
  { left: "10%", bottom: "26%", size: "h-1 w-1", delay: 0.3, driftX: -9, driftY: -12 },
  { left: "13%", bottom: "32%", size: "h-1.5 w-1.5", delay: 0.4, driftX: 10, driftY: -15 },
  { left: "16%", bottom: "38%", size: "h-1 w-1", delay: 0.5, driftX: -7, driftY: -11 },
  { left: "19%", bottom: "44%", size: "h-1.5 w-1.5", delay: 0.6, driftX: 8, driftY: -13 },
  { left: "22%", bottom: "50%", size: "h-1 w-1", delay: 0.7, driftX: -8, driftY: -10 },
  { left: "25%", bottom: "12%", size: "h-1.5 w-1.5", delay: 0.8, driftX: 9, driftY: -14 },
  { left: "28%", bottom: "18%", size: "h-1 w-1", delay: 0.9, driftX: -9, driftY: -12 },
  { left: "31%", bottom: "24%", size: "h-1.5 w-1.5", delay: 1, driftX: 10, driftY: -15 },
  { left: "34%", bottom: "30%", size: "h-1 w-1", delay: 1.1, driftX: -7, driftY: -10 },
  { left: "37%", bottom: "36%", size: "h-1.5 w-1.5", delay: 1.2, driftX: 8, driftY: -13 },
  { left: "40%", bottom: "42%", size: "h-1 w-1", delay: 1.3, driftX: -8, driftY: -11 },
  { left: "43%", bottom: "48%", size: "h-1.5 w-1.5", delay: 1.4, driftX: 9, driftY: -14 },
  { left: "46%", bottom: "54%", size: "h-1 w-1", delay: 1.5, driftX: -9, driftY: -12 },
  { left: "49%", bottom: "10%", size: "h-1.5 w-1.5", delay: 1.6, driftX: 10, driftY: -16 },
  { left: "52%", bottom: "16%", size: "h-1 w-1", delay: 1.7, driftX: -8, driftY: -12 },
  { left: "55%", bottom: "22%", size: "h-1.5 w-1.5", delay: 1.8, driftX: 9, driftY: -14 },
  { left: "58%", bottom: "28%", size: "h-1 w-1", delay: 1.9, driftX: -9, driftY: -11 },
  { left: "61%", bottom: "34%", size: "h-1.5 w-1.5", delay: 2, driftX: 8, driftY: -13 },
  { left: "64%", bottom: "40%", size: "h-1 w-1", delay: 2.1, driftX: -8, driftY: -10 },
  { left: "67%", bottom: "46%", size: "h-1.5 w-1.5", delay: 2.2, driftX: 9, driftY: -12 },
  { left: "70%", bottom: "52%", size: "h-1 w-1", delay: 2.3, driftX: -9, driftY: -11 },
  { left: "73%", bottom: "8%", size: "h-1.5 w-1.5", delay: 2.4, driftX: 10, driftY: -15 },
  { left: "76%", bottom: "14%", size: "h-1 w-1", delay: 2.5, driftX: -8, driftY: -12 },
  { left: "79%", bottom: "20%", size: "h-1.5 w-1.5", delay: 2.6, driftX: 9, driftY: -14 },
  { left: "82%", bottom: "26%", size: "h-1 w-1", delay: 2.7, driftX: -9, driftY: -11 },
  { left: "85%", bottom: "32%", size: "h-1.5 w-1.5", delay: 2.8, driftX: 8, driftY: -13 },
  { left: "88%", bottom: "38%", size: "h-1 w-1", delay: 2.9, driftX: -8, driftY: -10 },
  { left: "91%", bottom: "44%", size: "h-1.5 w-1.5", delay: 3, driftX: 9, driftY: -12 },
  { left: "94%", bottom: "50%", size: "h-1 w-1", delay: 3.1, driftX: -9, driftY: -11 },
  { left: "97%", bottom: "56%", size: "h-1.5 w-1.5", delay: 3.2, driftX: 8, driftY: -13 },
];

const decoLines = [
  { left: "11%", bottom: "13%", width: "22%", rotate: -24, delay: 0.2 },
  { left: "18%", bottom: "20%", width: "20%", rotate: 18, delay: 0.7 },
  { left: "26%", bottom: "30%", width: "18%", rotate: -30, delay: 1.1 },
  { left: "34%", bottom: "18%", width: "26%", rotate: 12, delay: 1.6 },
  { left: "42%", bottom: "40%", width: "24%", rotate: -20, delay: 0.5 },
  { left: "50%", bottom: "26%", width: "20%", rotate: 16, delay: 2.1 },
  { left: "58%", bottom: "14%", width: "22%", rotate: -28, delay: 1.3 },
  { left: "22%", bottom: "44%", width: "18%", rotate: 8, delay: 1.8 },
  { left: "36%", bottom: "50%", width: "20%", rotate: -14, delay: 2.4 },
];

export function SidebarDecoracao({ aberta }: { aberta: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-0 ${aberta ? "h-[52%]" : "h-[58%]"}`}>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-cyan-400/25 via-cyan-300/10 to-transparent blur-2xl" />
      <div className="absolute inset-0 opacity-80 mask-[linear-gradient(to_top,black_0%,black_60%,transparent_100%)]">
        {decoLines.map((line, idx) => (
          <motion.span
            key={`fx-line-${idx}`}
            className="absolute block h-px bg-cyan-200/45"
            style={{
              left: line.left,
              bottom: line.bottom,
              width: line.width,
              transform: `rotate(${line.rotate}deg)`,
              transformOrigin: "left center",
            }}
            animate={{
              opacity: [0.2, 0.55, 0.25],
              scaleX: [1, 1.06, 1],
            }}
            transition={{
              duration: 4.2 + idx * 0.22,
              delay: line.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {decoNodes.map((dot, idx) => (
        <motion.span
          key={`fx-dot-${idx}`}
          className={`absolute rounded-full bg-cyan-200/80 ${dot.size}`}
          style={{ left: dot.left, bottom: dot.bottom, filter: "blur(0.5px)" }}
          animate={{
            x: [0, dot.driftX, 0],
            y: [0, dot.driftY, 0],
            opacity: [0.35, 1, 0.4],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: 2.4 + idx * 0.12,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
