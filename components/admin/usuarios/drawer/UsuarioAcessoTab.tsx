"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, MessageSquareText, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { redefinirSenhaUsuario } from "@/lib/admin/redefinirSenha";
import { nomeExibicao, type UsuarioLista } from "@/lib/admin/usuarios";
import { MSG_SENHA_CURTA, SENHA_MINIMA, gerarSenha } from "@/lib/senhas";

const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500";

function mensagemParaEnviar(senha: string, exigiuTroca: boolean) {
  const base = `Sua senha do Hub Tempreço foi redefinida. Nova senha: ${senha}.`;
  return exigiuTroca ? `${base} Você vai precisar criar uma senha sua no primeiro acesso.` : base;
}

/**
 * Aba "Acesso" do drawer: redefinir a senha pelo servidor. A senha nova aparece uma única vez
 * e vive só no estado deste componente (some ao fechar o drawer, trocar de usuário ou de aba).
 */
export function UsuarioAcessoTab({ usuario }: { usuario: UsuarioLista }) {
  const toast = useToast();
  const [senha, setSenha] = useState("");
  const [visivel, setVisivel] = useState(false);
  const [exigirTroca, setExigirTroca] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ senha: string; exigiuTroca: boolean } | null>(null);
  const valida = senha.length >= SENHA_MINIMA;

  async function redefinir() {
    setSalvando(true);
    try {
      await redefinirSenhaUsuario(usuario, senha, exigirTroca);
      setResultado({ senha, exigiuTroca: exigirTroca });
      setSenha("");
      setVisivel(false);
      toast.success(`Senha de ${nomeExibicao(usuario)} redefinida.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
      setConfirmando(false);
    }
  }

  async function copiar(texto: string, sucesso: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(sucesso);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  if (resultado) {
    return (
      <div className="space-y-3 rounded-lg border border-emerald-400/30 bg-emerald-500/7 p-4">
        <p className="text-sm font-medium text-emerald-200">Senha redefinida. Ela aparece só agora:</p>
        <p className="select-all rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-base tracking-wide">
          {resultado.senha}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => copiar(resultado.senha, "Senha copiada.")}>
            <Copy className="h-4 w-4" /> Copiar senha
          </Button>
          <Button
            variant="secondary"
            onClick={() => copiar(mensagemParaEnviar(resultado.senha, resultado.exigiuTroca), "Mensagem copiada.")}
          >
            <MessageSquareText className="h-4 w-4" /> Copiar mensagem
          </Button>
          <Button variant="ghost" onClick={() => setResultado(null)}>
            Concluir
          </Button>
        </div>
        <p className="text-xs text-white/50">
          {resultado.exigiuTroca
            ? "No próximo acesso, a pessoa vai precisar criar uma senha dela."
            : "A pessoa pode continuar usando esta senha."}
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-white/10 p-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-blue-300" />
        <h3 className="text-sm font-semibold">Redefinir senha</h3>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm text-white/70">Senha nova</span>
        <div className="flex gap-2">
          <input
            type={visivel ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
            className={CAMPO}
          />
          <Button variant="secondary" onClick={() => setVisivel((v) => !v)} aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}>
            {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSenha(gerarSenha(10));
              setVisivel(true);
            }}
          >
            <Wand2 className="h-4 w-4" /> Gerar
          </Button>
        </div>
        {senha && !valida && <span className="mt-1 block text-xs text-amber-300">{MSG_SENHA_CURTA}</span>}
      </label>

      <label className="flex items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          checked={exigirTroca}
          onChange={(e) => setExigirTroca(e.target.checked)}
          className="h-4 w-4 accent-blue-500"
        />
        Pedir para trocar no primeiro acesso
      </label>

      <div className="flex justify-end">
        <Button onClick={() => setConfirmando(true)} disabled={!valida || salvando}>
          Redefinir senha
        </Button>
      </div>

      <ConfirmDialog
        open={confirmando}
        title={`Redefinir a senha de ${nomeExibicao(usuario)}?`}
        description={
          exigirTroca
            ? "A senha atual deixa de funcionar e a pessoa vai precisar criar uma senha nova ao entrar."
            : "A senha atual deixa de funcionar."
        }
        confirmLabel="Redefinir senha"
        danger
        loading={salvando}
        onConfirm={redefinir}
        onCancel={() => setConfirmando(false)}
      />
    </section>
  );
}
