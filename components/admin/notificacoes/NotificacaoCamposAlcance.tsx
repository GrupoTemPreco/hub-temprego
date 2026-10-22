"use client";

import { Users } from "lucide-react";
import { ChipsSelect } from "@/components/ui/ChipsSelect";
import { Toggle } from "@/components/ui/Toggle";
import { PUBLICOS_NOTIFICACAO, TELAS_NOTIFICACAO, usuariosDoPublico } from "@/lib/notificacoes";
import type { DadosNotificacoes } from "@/lib/admin/notificacoes";
import { CAMPO, Erro, borda } from "./NotificacaoCamposConteudo";
import type { ErrosForm, NotificacaoForm } from "./notificacaoForm";

type Props = {
  form: NotificacaoForm;
  set: (parcial: Partial<NotificacaoForm>) => void;
  erros: ErrosForm;
  dados: DadosNotificacoes;
};

function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
        ativo ? "border-blue-500 bg-blue-600/20 text-white" : "border-white/10 text-white/65 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

export function NotificacaoCamposAlcance({ form, set, erros, dados }: Props) {
  const setoresAtivos = dados.setores.filter((s) => s.ativo).map((s) => ({ value: s.id, label: s.nome }));
  const aprovados = dados.usuarios
    .filter((u) => u.status === "aprovado")
    .map((u) => ({ value: u.id, label: u.nome || u.email || "Usuário", sublabel: u.email }));
  const nomeSetor = (id: string) => dados.setores.find((s) => s.id === id)?.nome ?? "Setor";
  const nomeUsuario = (id: string) => dados.usuarios.find((u) => u.id === id)?.nome ?? "Usuário";
  const alcance = usuariosDoPublico(form, dados.usuarios, dados.vinculos).length;

  return (
    <>
      <div>
        <span className="mb-1 block text-sm text-white/70">Destinatários</span>
        <div className="flex flex-wrap gap-2">
          {PUBLICOS_NOTIFICACAO.map((p) => (
            <Opcao key={p.value} ativo={form.publico === p.value} onClick={() => set({ publico: p.value })}>
              {p.label}
            </Opcao>
          ))}
        </div>
        {form.publico === "setores" && (
          <div className="mt-2">
            <ChipsSelect opcoes={setoresAtivos} values={form.setores_ids} onChange={(v) => set({ setores_ids: v })} labelDe={nomeSetor} adicionarLabel="Adicionar setor" />
          </div>
        )}
        {form.publico === "usuarios" && (
          <div className="mt-2">
            <ChipsSelect opcoes={aprovados} values={form.usuarios_ids} onChange={(v) => set({ usuarios_ids: v })} labelDe={nomeUsuario} adicionarLabel="Adicionar usuário" />
          </div>
        )}
        <Erro texto={erros.publico} />
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/55">
          <Users className="h-3.5 w-3.5" /> Será exibida para {alcance} {alcance === 1 ? "pessoa" : "pessoas"}
        </p>
      </div>

      <div>
        <span className="mb-1 block text-sm text-white/70">Onde aparece</span>
        <div className="flex flex-wrap gap-2">
          <Opcao ativo={form.todasTelas} onClick={() => set({ todasTelas: true })}>Todas as telas</Opcao>
          <Opcao ativo={!form.todasTelas} onClick={() => set({ todasTelas: false })}>Telas específicas</Opcao>
        </div>
        {!form.todasTelas && (
          <div className="mt-2">
            <ChipsSelect opcoes={TELAS_NOTIFICACAO} values={form.modulos} onChange={(v) => set({ modulos: v })} adicionarLabel="Adicionar tela" />
          </div>
        )}
        <Erro texto={erros.modulos} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Início</span>
          <input type="datetime-local" value={form.inicio} onChange={(e) => set({ inicio: e.target.value })} className={`${CAMPO} ${borda(erros.inicio)}`} />
          <Erro texto={erros.inicio} />
        </label>
        <div>
          <span className="mb-1 block text-sm text-white/70">Fim</span>
          <input
            type="datetime-local"
            disabled={form.semFim}
            value={form.semFim ? "" : form.fim}
            onChange={(e) => set({ fim: e.target.value })}
            className={`${CAMPO} ${borda(erros.fim)} disabled:opacity-40`}
          />
          <label className="mt-1.5 flex items-center gap-2 text-xs text-white/60">
            <input type="checkbox" checked={form.semFim} onChange={(e) => set({ semFim: e.target.checked })} />
            Sem data de fim
          </label>
          <Erro texto={erros.fim} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-white/40">Horário de Brasília (America/Sao_Paulo).</p>

      <div className="flex items-center gap-3 rounded-lg border border-white/10 p-3">
        <Toggle label="Ativa" checked={form.ativa} onChange={(v) => set({ ativa: v })} />
        <span className="text-sm">Ativa</span>
      </div>
    </>
  );
}
