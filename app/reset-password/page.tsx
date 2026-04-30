"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        setHasRecoverySession(true);
      }
    });

    async function validateRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasRecoverySession(Boolean(session));
      setCheckingSession(false);
    }

    validateRecoverySession();

    return () => {
      subscription.unsubscribe();
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  async function handleResetPassword() {
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Preencha os dois campos de senha.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess("Senha atualizada com sucesso. Redirecionando para o login...");
    setLoading(false);
    redirectTimeoutRef.current = setTimeout(() => {
      router.push("/login");
    }, 3000);
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#020617] px-4">
      <div className="flex w-full max-w-sm flex-col items-center">
        <img src="/logoA.png" alt="Logo do Tempreço" className="mb-6 h-32 w-auto" />

        <div className="w-full rounded-xl border border-white/20 bg-white/9 p-8 shadow-sm backdrop-blur-sm">
          <h1 className="mb-6 text-xl font-semibold text-white">Redefinir senha</h1>

          {checkingSession ? (
            <p className="text-sm text-white/70">Validando link de recuperacao...</p>
          ) : !hasRecoverySession ? (
            <p className="text-sm text-red-400">
              Link de recuperacao invalido ou expirado. Solicite um novo link.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 pr-10 text-sm outline-none focus:border-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-700"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2 pr-10 text-sm outline-none focus:border-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-700"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
              {success && <p className="text-xs text-emerald-400">{success}</p>}

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="mt-2 rounded-lg bg-[#0EA5E9] py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
