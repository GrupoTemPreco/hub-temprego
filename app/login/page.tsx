"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Node = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      glow: number;
    };

    const nodes: Node[] = [];
    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const connectionDistance = 190;
    const mouse = { x: 0, y: 0, active: false };
    const minSpeed = 0.22;
    const maxSpeed = 1.1;

    const randomSpeed = () =>
      (Math.random() * 0.45 + 0.15) * (Math.random() > 0.5 ? 1 : -1);

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seedNodes = () => {
      nodes.length = 0;
      const count = Math.min(90, Math.max(50, Math.floor((width * height) / 24000)));
      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: randomSpeed(),
          vy: randomSpeed(),
          radius: 1.8 + Math.random() * 3.4,
          glow: 0.25 + Math.random() * 0.55,
        });
      }
    };

    const drawBackgroundGlow = () => {
      const gradient = ctx.createRadialGradient(
        width * 0.85,
        height * 0.08,
        20,
        width * 0.85,
        height * 0.08,
        Math.max(width, height) * 0.65,
      );
      gradient.addColorStop(0, "rgba(14, 165, 233, 0.22)");
      gradient.addColorStop(0.3, "rgba(14, 165, 233, 0.08)");
      gradient.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      drawBackgroundGlow();

      const logoRect = logoRef.current?.getBoundingClientRect() ?? null;
      const modalRect = modalRef.current?.getBoundingClientRect() ?? null;

      for (const node of nodes) {
        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const radius = 140;
          if (dist < radius) {
            const force = ((radius - dist) / radius) * 0.32;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        if (logoRect) {
          const cx = logoRect.left + logoRect.width / 2;
          const cy = logoRect.top + logoRect.height / 2;
          const dx = node.x - cx;
          const dy = node.y - cy;
          const dist = Math.hypot(dx, dy) || 0.001;
          const radius = Math.max(logoRect.width, logoRect.height) * 0.62;
          if (dist < radius) {
            const force = ((radius - dist) / radius) * 0.28;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        if (modalRect) {
          const nearestX = Math.max(modalRect.left, Math.min(node.x, modalRect.right));
          const nearestY = Math.max(modalRect.top, Math.min(node.y, modalRect.bottom));
          const dx = node.x - nearestX;
          const dy = node.y - nearestY;
          const dist = Math.hypot(dx, dy) || 0.001;
          const radius = 90;
          if (dist < radius) {
            const force = ((radius - dist) / radius) * 0.26;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.995;
        node.vy *= 0.995;

        const speed = Math.hypot(node.vx, node.vy);
        if (speed < minSpeed) {
          const angle = Math.atan2(node.vy, node.vx) || Math.random() * Math.PI * 2;
          node.vx = Math.cos(angle) * minSpeed;
          node.vy = Math.sin(angle) * minSpeed;
        } else if (speed > maxSpeed) {
          const ratio = maxSpeed / speed;
          node.vx *= ratio;
          node.vy *= ratio;
        }

        if (node.x <= 0 || node.x >= width) {
          node.vx *= -1;
          node.x = Math.max(0, Math.min(width, node.x));
        }
        if (node.y <= 0 || node.y >= height) {
          node.vy *= -1;
          node.y = Math.max(0, Math.min(height, node.y));
        }
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist > connectionDistance) continue;

          const alpha = (1 - dist / connectionDistance) * 0.42;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(103, 232, 249, ${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(103, 232, 249, 0.9)";
        ctx.shadowColor = "rgba(103, 232, 249, 0.85)";
        ctx.shadowBlur = 8 + 8 * node.glow;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      rafId = window.requestAnimationFrame(loop);
    };

    setupCanvas();
    seedNodes();
    rafId = window.requestAnimationFrame(loop);

    const handleResize = () => {
      setupCanvas();
      seedNodes();
    };
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#020617]">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <img ref={logoRef} src="/logoA.png" alt="Logo do Tempreço" className="mb-6 h-40 w-auto" />
        <div
          ref={modalRef}
          className="w-full rounded-xl border border-white/20 bg-white/9 p-8 shadow-sm backdrop-blur-sm"
        >
          <h1 className="mb-6 text-xl font-semibold text-white">Entrar</h1>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#0EA5E9] py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <motion.span
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}