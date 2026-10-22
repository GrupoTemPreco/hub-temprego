"use client";

import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { buscarSenhaUsuario } from "@/lib/admin/usuarioDetalhe";

export function UsuarioSenhaTab({ usuarioId }: { usuarioId: string }) {
  const toast = useToast();
  const [senha, setSenha] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarSenhaUsuario(usuarioId)
      .then((valor) => ativo && setSenha(valor))
      .catch((err) => toast.error(`Erro ao carregar senha: ${err.message}`))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [usuarioId, toast]);

  async function copiar() {
    if (!senha) return;
    try {
      await navigator.clipboard.writeText(senha);
      toast.success("Senha copiada.");
    } catch {
      toast.error("Não foi possível copiar a senha.");
    }
  }

  if (carregando) return <p className="text-sm text-white/60">Carregando...</p>;
  if (!senha) return <EmptyState compact title="Senha não registrada" description="Este usuário não tem senha salva." />;

  return (
    <div className="space-y-2">
      <span className="block text-sm text-white/70">Senha</span>
      <div className="flex gap-2">
        <input
          readOnly
          type={visivel ? "text" : "password"}
          value={senha}
          className="flex-1 rounded-md border border-white/10 px-3 py-2 font-mono text-sm outline-none"
        />
        <Button variant="secondary" onClick={() => setVisivel((v) => !v)} aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}>
          {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="secondary" onClick={copiar} aria-label="Copiar senha">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-white/45">Somente leitura.</p>
    </div>
  );
}
