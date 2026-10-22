"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { AcessoUsuario } from "@/lib/ferramentas";

export type UsuarioAtual = AcessoUsuario & {
  email: string | null;
  /** Ids dos setores de que a pessoa é membro (ativos ou não). */
  setores: string[];
  recebeTickets: boolean;
};

const UsuarioAtualContext = createContext<UsuarioAtual | null>(null);

/** Mesma regra do login: só entra quem tem status aprovado. */
function estaAprovado(status: string | null | undefined) {
  const normalizado = String(status ?? "").trim().toLowerCase();
  return normalizado === "aprovado" || normalizado === "approved";
}

async function carregarUsuarioAtual(): Promise<UsuarioAtual | "sem-sessao" | "bloqueado"> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return "sem-sessao";

  const [perfilRes, permissoesRes, setoresRes] = await Promise.all([
    supabase
      .from("usuarios")
      .select("status, is_admin, nome, email, recebe_tickets")
      .eq("id", session.user.id)
      .maybeSingle(),
    supabase.from("permissoes").select("modulo, item").eq("user_id", session.user.id),
    supabase.from("usuario_setores").select("setor_id").eq("usuario_id", session.user.id),
  ]);

  if (perfilRes.error || !perfilRes.data || !estaAprovado(perfilRes.data.status)) return "bloqueado";

  return {
    id: session.user.id,
    nome: perfilRes.data.nome ?? null,
    email: perfilRes.data.email ?? null,
    isAdmin: Boolean(perfilRes.data.is_admin),
    permissoes: permissoesRes.data ?? [],
    setores: (setoresRes.data ?? []).map((v) => v.setor_id as string),
    recebeTickets: Boolean(perfilRes.data.recebe_tickets),
  };
}

export function UsuarioAtualProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarUsuarioAtual().then(async (resultado) => {
      if (!ativo) return;
      if (resultado === "sem-sessao") {
        router.push("/login");
        return;
      }
      if (resultado === "bloqueado") {
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }
      setUsuario(resultado);
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  if (!usuario) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020617]">
        <p className="text-sm text-zinc-400">Carregando...</p>
      </div>
    );
  }

  return <UsuarioAtualContext.Provider value={usuario}>{children}</UsuarioAtualContext.Provider>;
}

export function useUsuarioAtual(): UsuarioAtual {
  const ctx = useContext(UsuarioAtualContext);
  if (!ctx) throw new Error("useUsuarioAtual precisa estar dentro de <UsuarioAtualProvider>.");
  return ctx;
}
