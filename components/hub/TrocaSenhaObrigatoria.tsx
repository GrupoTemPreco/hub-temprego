"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";
import { MSG_SENHA_CURTA, SENHA_MINIMA } from "@/lib/senhas";
import { useUsuarioAtual } from "./UsuarioAtualProvider";

const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";
const nada = () => {};

function ModalSenhaNova() {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [visivel, setVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const problema =
    senha.length > 0 && senha.length < SENHA_MINIMA
      ? MSG_SENHA_CURTA
      : confirmacao.length > 0 && senha !== confirmacao
        ? "As senhas não são iguais."
        : "";
  const valida = senha.length >= SENHA_MINIMA && senha === confirmacao;

  async function salvar() {
    if (!valida || salvando) return;
    setSalvando(true);
    setErro("");
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro(`Não foi possível trocar a senha: ${error.message}`);
      setSalvando(false);
      return;
    }
    const { error: erroFlag } = await supabase.from("usuarios").update({ trocar_senha: false }).eq("id", usuario.id);
    if (erroFlag) {
      setErro(`A senha foi trocada, mas não foi possível concluir: ${erroFlag.message}`);
      setSalvando(false);
      return;
    }
    toast.success("Senha criada. Bem-vindo de volta!");
    await usuario.recarregarUsuario();
  }

  return (
    // Sem título no Modal: assim não há "X", e clique fora e Esc não fecham.
    <Modal
      open
      onClose={nada}
      size="sm"
      footer={
        <Button onClick={salvar} disabled={!valida || salvando}>
          {salvando ? "Salvando..." : "Salvar senha"}
        </Button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void salvar();
        }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-blue-300" />
          <h2 className="text-base font-semibold text-white">Crie uma senha nova</h2>
        </div>
        <p className="text-sm text-white/65">
          Sua senha foi redefinida por um administrador. Crie uma senha sua para continuar usando o hub.
        </p>
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Nova senha</span>
          <div className="flex gap-2">
            <input
              autoFocus
              type={visivel ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              className={CAMPO}
            />
            <Button variant="secondary" onClick={() => setVisivel((v) => !v)} aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}>
              {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Confirmar a nova senha</span>
          <input
            type={visivel ? "text" : "password"}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="new-password"
            className={CAMPO}
          />
        </label>
        {(problema || erro) && <p className="text-xs text-amber-300">{erro || problema}</p>}
        <p className="text-xs text-white/45">Mínimo de {SENHA_MINIMA} caracteres.</p>
      </form>
    </Modal>
  );
}

/** Com trocar_senha ligado, o hub não carrega: só o modal "Crie uma senha nova", que não fecha. */
export function TrocaSenhaObrigatoria({ children }: { children: ReactNode }) {
  const { trocarSenha } = useUsuarioAtual();
  if (!trocarSenha) return <>{children}</>;
  return (
    <div className="h-screen w-screen bg-[#020617]">
      <ModalSenhaNova />
    </div>
  );
}
