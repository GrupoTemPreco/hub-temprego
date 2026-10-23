"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useChecklistEnvios } from "./envios/ChecklistEnviosProvider";
import {
  atualizarGrupo,
  atualizarItem,
  buscarItens,
  carregarChecklist,
  criarGrupo,
  criarItem,
  excluirItem,
  listarGruposPorIds,
  listarItens,
  type CamposGrupo,
  type CamposItem,
} from "@/lib/checklist";
import { alterarMembro, listarMembros } from "@/lib/checklistMembros";
import { calcularAcesso, gruposNaOrdemDaGrade, membrosPorGrupo, type AcessoGrupo } from "@/lib/checklistAcesso";
import { ordemNoFim } from "@/lib/checklistRegras";
import type { ChecklistCor, ChecklistGrupo, ChecklistItem, ChecklistMembro } from "@/lib/types/shell";
import { upsertMembro, upsertPorId, useChecklistRealtime } from "./useChecklistRealtime";
import { useAcoesMembros, type AcoesMembros } from "./useAcoesMembros";

export type DadosNovoItem = Pick<ChecklistItem, "titulo"> &
  Partial<Pick<ChecklistItem, "nivel" | "urgencia" | "observacao">>;

export type AcoesChecklist = AcoesMembros & {
  alterarItem: (id: string, campos: CamposItem, erro?: string) => Promise<boolean>;
  adicionarItem: (grupoId: string, dados: DadosNovoItem) => Promise<ChecklistItem | null>;
  removerItem: (id: string) => Promise<boolean>;
  adicionarGrupo: (nome: string, cor: ChecklistCor) => Promise<ChecklistGrupo | null>;
  alterarGrupo: (id: string, campos: CamposGrupo, erro?: string) => Promise<boolean>;
  /** Some da grade (e da dos membros) até ser restaurada; os itens ficam guardados. */
  arquivarGrupo: (id: string) => Promise<boolean>;
  /** Tira do arquivo e põe no fim da grade. */
  restaurarGrupo: (id: string) => Promise<boolean>;
  /** Posição na grade: em checklist_grupos.ordem (dono) ou checklist_grupo_membros.ordem (membro). */
  moverGrupo: (id: string, ordem: number) => Promise<boolean>;
  /** Relê um item do banco (ex.: tarefa recém-aceita, que a RPC moveu para um grupo do usuário). */
  trazerItem: (id: string) => Promise<void>;
};

/** Só grupos ativos ficam no estado. */
function organizarGrupos(lista: ChecklistGrupo[]) {
  return lista.filter((g) => !g.arquivado);
}

function mensagem(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export type DadosChecklist = ReturnType<typeof useChecklistDados>;

/**
 * Grupos próprios e compartilhados com o usuário, os itens e os membros deles.
 * `criarGrupoInicial` desligado serve para leituras (ex.: cards do Início) que não devem criar "Minhas tarefas".
 * `ativo` desligado (sem acesso ao checklist) não consulta nem assina nada.
 */
export function useChecklistDados(usuarioId: string, { criarGrupoInicial = true, ativo: habilitado = true } = {}) {
  const toast = useToast();
  const { aoItemSair } = useChecklistEnvios();
  const [todosGrupos, setGrupos] = useState<ChecklistGrupo[]>([]);
  const [itens, setItens] = useState<ChecklistItem[]>([]);
  const [membros, setMembros] = useState<ChecklistMembro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const grupoIdsRef = useRef<Set<string>>(new Set());
  const membrosRef = useRef<ChecklistMembro[]>([]);

  useEffect(() => {
    grupoIdsRef.current = new Set(todosGrupos.map((g) => g.id));
  }, [todosGrupos]);

  useEffect(() => {
    membrosRef.current = membros;
  }, [membros]);

  useEffect(() => {
    if (!habilitado) return;
    let ativo = true;
    carregarChecklist(usuarioId, criarGrupoInicial)
      .then((dados) => {
        if (!ativo) return;
        grupoIdsRef.current = new Set(dados.grupos.map((g) => g.id));
        membrosRef.current = dados.membros;
        setGrupos(organizarGrupos(dados.grupos));
        setItens(dados.itens);
        setMembros(dados.membros);
      })
      .catch((err) => ativo && setErro(mensagem(err)))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [usuarioId, criarGrupoInicial, habilitado]);

  // Envio aceito: a RPC passou o item para o grupo de outra pessoa. O Realtime de checklist_itens
  // pode nem chegar (o item deixa de ser visível para quem enviou), então o aviso do envio também tira.
  useEffect(() => aoItemSair((id) => setItens((prev) => prev.filter((i) => i.id !== id))), [aoItemSair]);

  useChecklistRealtime({
    usuarioId,
    habilitado,
    grupoIdsRef,
    membrosRef,
    setGrupos,
    setItens,
    setMembros,
    organizarGrupos,
  });

  const grupos = useMemo(() => gruposNaOrdemDaGrade(todosGrupos, membros, usuarioId), [todosGrupos, membros, usuarioId]);
  // Itens de listas arquivadas (ou que saíram) ficam no estado, mas não contam em nada: grade, "Meu checklist",
  // "Precisa da sua atenção" e contadores do Início usam só estes.
  const itensAtivos = useMemo(() => {
    const ativas = new Set(todosGrupos.map((g) => g.id));
    return itens.filter((i) => ativas.has(i.grupo_id));
  }, [itens, todosGrupos]);
  const porGrupo = useMemo(() => membrosPorGrupo(membros), [membros]);
  const acessoDe = useCallback(
    (grupoId: string): AcessoGrupo =>
      calcularAcesso(
        todosGrupos.find((g) => g.id === grupoId),
        porGrupo.get(grupoId) ?? [],
        usuarioId,
      ),
    [todosGrupos, porGrupo, usuarioId],
  );

  const acoesMembros = useAcoesMembros({ usuarioId, setMembros, setGrupos, setItens, grupoIdsRef });

  const alterarItem: AcoesChecklist["alterarItem"] = async (id, campos, erroMsg = "Não foi possível salvar o item") => {
    const antes = itens.find((i) => i.id === id);
    if (!antes) return false;
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, ...campos } : i)));
    try {
      await atualizarItem(id, campos);
      return true;
    } catch (err) {
      setItens((prev) => prev.map((i) => (i.id === id ? antes : i)));
      toast.error(`${erroMsg}: ${mensagem(err)}`);
      return false;
    }
  };

  const adicionarItem: AcoesChecklist["adicionarItem"] = async (grupoId, dados) => {
    try {
      const novo = await criarItem({
        nivel: 1,
        urgencia: 2,
        ...dados,
        grupo_id: grupoId,
        ordem: ordemNoFim(itens.filter((i) => i.grupo_id === grupoId)),
        criado_por: usuarioId,
      });
      setItens((prev) => upsertPorId(prev, novo));
      return novo;
    } catch (err) {
      toast.error(`Não foi possível adicionar o item: ${mensagem(err)}`);
      return null;
    }
  };

  const trazerItem: AcoesChecklist["trazerItem"] = async (id) => {
    try {
      const [item] = await buscarItens([id]);
      if (item && grupoIdsRef.current.has(item.grupo_id)) setItens((prev) => upsertPorId(prev, item));
    } catch (err) {
      console.error("[checklist] Falha ao recarregar item:", err);
    }
  };

  const removerItem: AcoesChecklist["removerItem"] = async (id) => {
    const antes = itens.find((i) => i.id === id);
    if (!antes) return false;
    setItens((prev) => prev.filter((i) => i.id !== id));
    try {
      await excluirItem(id);
      return true;
    } catch (err) {
      setItens((prev) => upsertPorId(prev, antes));
      toast.error(`Não foi possível excluir o item: ${mensagem(err)}`);
      return false;
    }
  };

  const adicionarGrupo: AcoesChecklist["adicionarGrupo"] = async (nome, cor) => {
    try {
      const novo = await criarGrupo({ dono_id: usuarioId, nome, cor, ordem: ordemNoFim(grupos) });
      grupoIdsRef.current.add(novo.id);
      setGrupos((prev) => organizarGrupos(upsertPorId(prev, novo)));
      return novo;
    } catch (err) {
      toast.error(`Não foi possível criar a lista: ${mensagem(err)}`);
      return null;
    }
  };

  const alterarGrupo: AcoesChecklist["alterarGrupo"] = async (id, campos, erroMsg = "Não foi possível salvar a lista") => {
    const antes = todosGrupos.find((g) => g.id === id);
    if (!antes) return false;
    setGrupos((prev) => organizarGrupos(prev.map((g) => (g.id === id ? { ...g, ...campos } : g))));
    try {
      await atualizarGrupo(id, campos);
      return true;
    } catch (err) {
      setGrupos((prev) => organizarGrupos(upsertPorId(prev, antes)));
      toast.error(`${erroMsg}: ${mensagem(err)}`);
      return false;
    }
  };

  const moverGrupo: AcoesChecklist["moverGrupo"] = async (id, ordem) => {
    if (acessoDe(id).dono) return alterarGrupo(id, { ordem }, "Não foi possível mover a lista");
    const antes = membros.find((m) => m.grupo_id === id && m.usuario_id === usuarioId);
    if (!antes) return false;
    setMembros((prev) => upsertMembro(prev, { ...antes, ordem }));
    try {
      await alterarMembro(id, usuarioId, { ordem });
      return true;
    } catch (err) {
      setMembros((prev) => upsertMembro(prev, antes));
      toast.error(`Não foi possível mover a lista: ${mensagem(err)}`);
      return false;
    }
  };

  const arquivarGrupo: AcoesChecklist["arquivarGrupo"] = (id) =>
    alterarGrupo(id, { arquivado: true, arquivado_em: new Date().toISOString() }, "Não foi possível arquivar a lista");

  const restaurarGrupo: AcoesChecklist["restaurarGrupo"] = async (id) => {
    try {
      // Volta no fim da grade; os membros voltam a vê-la porque a participação não foi apagada.
      await atualizarGrupo(id, { arquivado: false, arquivado_em: null, ordem: ordemNoFim(grupos) });
      const [[grupo], itensDaLista, membrosDaLista] = await Promise.all([
        listarGruposPorIds([id]),
        listarItens([id]),
        listarMembros([id]),
      ]);
      if (grupo) {
        grupoIdsRef.current.add(id);
        setGrupos((prev) => organizarGrupos(upsertPorId(prev, grupo)));
        setItens((prev) => itensDaLista.reduce(upsertPorId, prev));
        setMembros((prev) => [...prev.filter((m) => m.grupo_id !== id), ...membrosDaLista]);
      }
      return true;
    } catch (err) {
      toast.error(`Não foi possível restaurar a lista: ${mensagem(err)}`);
      return false;
    }
  };

  const acoes: AcoesChecklist = {
    ...acoesMembros,
    alterarItem,
    adicionarItem,
    removerItem,
    adicionarGrupo,
    alterarGrupo,
    arquivarGrupo,
    restaurarGrupo,
    moverGrupo,
    trazerItem,
  };
  /** Só os grupos do próprio usuário (ex.: destino ao aceitar uma tarefa, como a RPC exige). */
  const gruposProprios = grupos.filter((g) => g.dono_id === usuarioId);
  return { grupos, gruposProprios, itens: itensAtivos, carregando, erro, acoes, acessoDe };
}
