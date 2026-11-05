"use client";

import { useState } from "react";
import { Building2, Check, ChevronDown, ListChecks, RotateCw, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextoCortado } from "@/components/ui/Tooltip";
import { tempoRelativo } from "@/lib/format";
import { ultimoEnvioEm } from "@/lib/checklistEnvios";
import { listarTarefasDaListaRecebida } from "@/lib/checklistEnviosLista";
import type { ChecklistEnvioLista } from "@/lib/types/shell";
import { textoTarefas } from "./textosLote";

type Props = {
  envio: ChecklistEnvioLista;
  remetente: string;
  /** "Para Financeiro" quando o envio foi para um setor. */
  seloDestino?: string;
  /** Modo "todos": "para você e mais 3 pessoas, cada um fica com a sua". */
  complementoTodos?: string;
  agora: number;
  onAceitar: () => void;
  onRecusar: () => void;
};

type Tarefas = { estado: "fechado" } | { estado: "carregando" } | { estado: "erro" } | { estado: "pronto"; titulos: string[] };

/** "Lista · Nome · 8 tarefas"; expandir mostra os títulos (só leitura). */
export function RecebidaListaCard({ envio, remetente, seloDestino, complementoTodos, agora, onAceitar, onRecusar }: Props) {
  const [tarefas, setTarefas] = useState<Tarefas>({ estado: "fechado" });
  const aberto = tarefas.estado !== "fechado";

  function alternar() {
    if (aberto) {
      setTarefas({ estado: "fechado" });
      return;
    }
    setTarefas({ estado: "carregando" });
    listarTarefasDaListaRecebida(envio.id)
      .then((lista) => setTarefas({ estado: "pronto", titulos: lista.map((t) => t.titulo) }))
      .catch((err) => {
        console.error("[checklist] Falha ao carregar as tarefas da lista recebida:", err);
        setTarefas({ estado: "erro" });
      });
  }

  return (
    <article id={`lista-recebida-${envio.id}`} className="flex flex-col gap-2 rounded-xl border border-blue-400/25 bg-blue-500/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-1.5 font-semibold text-white">
          <ListChecks className="h-4 w-4 shrink-0 text-blue-300" />
          <span className="shrink-0 text-white/60">Lista ·</span>
          <TextoCortado className="min-w-0 truncate">{envio.nome}</TextoCortado>
          <span className="shrink-0 text-white/60">· {textoTarefas(envio.qtd_tarefas)}</span>
          {complementoTodos && <span className="min-w-0 truncate text-xs font-normal text-blue-200/80">· {complementoTodos}</span>}
        </h3>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {seloDestino && (
            <Badge variant="info" className="shrink-0">
              <Building2 className="h-3 w-3" /> {seloDestino}
            </Badge>
          )}
          {envio.reenvios > 0 && (
            <Badge variant="warning" className="shrink-0">
              <RotateCw className="h-3 w-3" /> reenviada
            </Badge>
          )}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-white/60">
        <Avatar nome={remetente} />
        <span>
          De <span className="font-medium text-white/85">{remetente}</span> · enviado{" "}
          {tempoRelativo(ultimoEnvioEm(envio), new Date(agora))}
        </span>
      </p>

      {envio.mensagem && <p className="text-sm text-white/75">&ldquo;{envio.mensagem}&rdquo;</p>}

      {envio.qtd_tarefas > 0 && (
        <button
          type="button"
          onClick={alternar}
          aria-expanded={aberto}
          className="flex items-center gap-1 self-start rounded px-1 text-xs text-blue-200/85 hover:bg-white/5"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`} />
          {aberto ? "Esconder tarefas" : "Ver tarefas"}
        </button>
      )}
      {tarefas.estado === "carregando" && <p className="text-xs text-white/45">Carregando tarefas...</p>}
      {tarefas.estado === "erro" && <p className="text-xs text-rose-300/80">Não foi possível carregar as tarefas.</p>}
      {tarefas.estado === "pronto" && (
        <ul className="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-white/10 bg-white/3 px-2 py-1.5 text-sm text-white/75">
          {tarefas.titulos.map((titulo, i) => (
            <li key={i} className="min-w-0">
              <TextoCortado className="block truncate">{titulo}</TextoCortado>
            </li>
          ))}
          {tarefas.titulos.length === 0 && <li className="text-xs text-white/45">A lista está vazia agora.</li>}
        </ul>
      )}

      <div className="mt-auto flex justify-end gap-2 pt-1">
        <Button size="sm" variant="secondary" onClick={onRecusar}>
          <X className="h-3.5 w-3.5" /> Recusar
        </Button>
        <Button size="sm" onClick={onAceitar}>
          <Check className="h-3.5 w-3.5" /> Aceitar
        </Button>
      </div>
    </article>
  );
}
