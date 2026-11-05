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
import {
  camposParaGravar,
  comStatusDoDia,
  conclusaoAoReprogramar,
  diariaAoMudarDeLista,
  feitaNaOcorrencia,
  marcarConclusoes,
  ocorrenciaAtual,
  qtdConcluidasAntesDeHoje,
} from "@/lib/checklistDiarias";
import { alterarMembro, listarMembros } from "@/lib/checklistMembros";
import {
  calcularAcesso,
  gruposNaOrdemDaGrade,
  membrosPorGrupo,
  travarSeAguardando,
  type AcessoGrupo,
} from "@/lib/checklistAcesso";
import { hojeSP, ordemNoFim } from "@/lib/checklistRegras";
import type { ChecklistCor, ChecklistGrupo, ChecklistItem, ChecklistMembro } from "@/lib/types/shell";
import { upsertMembro, upsertPorId, useChecklistRealtime } from "./useChecklistRealtime";
import { useAcoesMembros, type AcoesMembros } from "./useAcoesMembros";
import { useConclusoesHoje } from "./useConclusoesHoje";
import { aplicarRepeticaoLista, type NovaRepeticaoLista } from "./repeticaoLista";

export type DadosNovoItem = Pick<ChecklistItem, "titulo"> &
  Partial<Pick<ChecklistItem, "nivel" | "urgencia" | "observacao" | "diaria" | "dias_semana">>;

export type AcoesChecklist = AcoesMembros & {
  alterarItem: (id: string, campos: CamposItem, erro?: string) => Promise<boolean>;
  /** Marca ou desmarca a ocorrência atual de uma tarefa recorrente. Não mexe no status da linha. */
  alternarDiaria: (id: string, concluir: boolean) => Promise<boolean>;
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
  /** Lê do banco a lista, as tarefas e os membros (ex.: lista restaurada ou recém-aceita). */
  trazerGrupo: (id: string) => Promise<void>;
  /** Liga, troca os dias ou desliga a repetição da lista inteira (as tarefas ficam com os dias dela). */
  definirRepeticaoLista: (grupoId: string, nova: NovaRepeticaoLista) => Promise<boolean>;
  /** Tarefas da lista feitas, mas não hoje (ao ligar a repetição elas voltam pendentes). */
  contarConcluidasAntesDeHoje: (grupoId: string) => number;
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
  const { aoItemSair, listas: enviosLista } = useChecklistEnvios();
  const { aoListaSair, situacaoDaLista } = enviosLista;
  const conclusoes = useConclusoesHoje(usuarioId, habilitado);
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
    const lida = conclusoes.epocaAtual();
    carregarChecklist(usuarioId, criarGrupoInicial)
      .then((dados) => {
        if (!ativo) return;
        grupoIdsRef.current = new Set(dados.grupos.map((g) => g.id));
        membrosRef.current = dados.membros;
        setGrupos(organizarGrupos(dados.grupos));
        setItens(dados.itens);
        setMembros(dados.membros);
        conclusoes.substituir(dados.conclusoes, lida);
      })
      .catch((err) => ativo && setErro(mensagem(err)))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [usuarioId, criarGrupoInicial, habilitado, conclusoes.substituir, conclusoes.epocaAtual]);

  // Envio aceito: a RPC passou o item para o grupo de outra pessoa. O Realtime de checklist_itens
  // pode nem chegar (o item deixa de ser visível para quem enviou), então o aviso do envio também tira.
  useEffect(() => aoItemSair((id) => setItens((prev) => prev.filter((i) => i.id !== id))), [aoItemSair]);
  // Lista aceita por quem recebeu: o dono mudou e ela sai da grade de quem enviou, com as tarefas.
  useEffect(
    () =>
      aoListaSair((grupoId) => {
        grupoIdsRef.current.delete(grupoId);
        setGrupos((prev) => prev.filter((g) => g.id !== grupoId));
        setItens((prev) => prev.filter((i) => i.grupo_id !== grupoId));
        setMembros((prev) => prev.filter((m) => m.grupo_id !== grupoId));
      }),
    [aoListaSair],
  );

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
    const hoje = conclusoes.dia;
    return itens.filter((i) => ativas.has(i.grupo_id)).map((item) => comStatusDoDia(item, conclusoes.conclusoes, hoje));
  }, [itens, todosGrupos, conclusoes.conclusoes, conclusoes.dia]);
  const porGrupo = useMemo(() => membrosPorGrupo(membros), [membros]);
  const acessoDe = useCallback(
    (grupoId: string): AcessoGrupo =>
      travarSeAguardando(
        calcularAcesso(todosGrupos.find((g) => g.id === grupoId), porGrupo.get(grupoId) ?? [], usuarioId),
        situacaoDaLista(grupoId)?.tipo === "aguardando",
      ),
    [todosGrupos, porGrupo, usuarioId, situacaoDaLista],
  );

  const acoesMembros = useAcoesMembros({ usuarioId, setMembros, setGrupos, setItens, grupoIdsRef });

  const alterarItem: AcoesChecklist["alterarItem"] = async (id, campos, erroMsg = "Não foi possível salvar o item") => {
    const antes = itens.find((i) => i.id === id);
    if (!antes) return false;
    const destinoId = campos.grupo_id ?? antes.grupo_id;
    const origemDiaria = Boolean(todosGrupos.find((g) => g.id === antes.grupo_id)?.diaria);
    const destino = todosGrupos.find((g) => g.id === destinoId) ?? null;
    const hoje = hojeSP();
    const feitaAgora = feitaNaOcorrencia(antes, conclusoes.conclusoes, hoje);
    const gravar = camposParaGravar(antes, diariaAoMudarDeLista(antes, campos, origemDiaria, destino, feitaAgora), feitaAgora);
    if (Object.keys(gravar).length === 0) return true;
    const nova = conclusaoAoReprogramar(antes, { ...antes, ...gravar }, conclusoes.conclusoes, hoje);
    const novas = nova ? [nova] : [];
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, ...gravar } : i)));
    conclusoes.incluir(novas);
    try {
      await atualizarItem(id, gravar);
      await marcarConclusoes(novas, usuarioId);
      return true;
    } catch (err) {
      setItens((prev) => prev.map((i) => (i.id === id ? antes : i)));
      conclusoes.retirar(novas);
      toast.error(`${erroMsg}: ${mensagem(err)}`);
      return false;
    }
  };

  const alternarDiaria: AcoesChecklist["alternarDiaria"] = async (id, concluir) => {
    const item = itens.find((i) => i.id === id);
    const data = item ? ocorrenciaAtual(item, hojeSP()) : null;
    // Sem ocorrência ainda (antes do primeiro dia programado), não há o que marcar.
    if (!data) return false;
    try {
      await conclusoes.alternar(id, data, concluir);
      return true;
    } catch (err) {
      toast.error(`Não foi possível atualizar a tarefa diária: ${mensagem(err)}`);
      return false;
    }
  };

  const adicionarItem: AcoesChecklist["adicionarItem"] = async (grupoId, dados) => {
    try {
      const { nivel, urgencia, ...resto } = dados;
      const novo = await criarItem({
        ...resto,
        grupo_id: grupoId,
        ordem: ordemNoFim(itens.filter((i) => i.grupo_id === grupoId)),
        criado_por: usuarioId,
        ...(nivel != null ? { nivel } : {}),
        ...(urgencia != null ? { urgencia } : {}),
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

  const definirRepeticaoLista: AcoesChecklist["definirRepeticaoLista"] = async (grupoId, nova) => {
    try {
      await aplicarRepeticaoLista({ usuarioId, grupos: todosGrupos, itens, conclusoes, setGrupos, setItens }, grupoId, nova);
      return true;
    } catch (err) {
      toast.error(`Não foi possível atualizar a repetição da lista: ${mensagem(err)}`);
      return false;
    }
  };

  const trazerGrupo: AcoesChecklist["trazerGrupo"] = async (id) => {
    const [[grupo], itensDaLista, membrosDaLista] = await Promise.all([
      listarGruposPorIds([id]),
      listarItens([id]),
      listarMembros([id]),
    ]);
    if (!grupo) return;
    grupoIdsRef.current.add(id);
    setGrupos((prev) => organizarGrupos(upsertPorId(prev, grupo)));
    setItens((prev) => itensDaLista.reduce(upsertPorId, prev));
    setMembros((prev) => [...prev.filter((m) => m.grupo_id !== id), ...membrosDaLista]);
    await conclusoes.recarregar().catch((err) => console.error("[checklist] Falha ao recarregar o dia:", err));
  };

  const restaurarGrupo: AcoesChecklist["restaurarGrupo"] = async (id) => {
    try {
      // Volta no fim da grade; os membros voltam a vê-la porque a participação não foi apagada.
      await atualizarGrupo(id, { arquivado: false, arquivado_em: null, ordem: ordemNoFim(grupos) });
      await trazerGrupo(id);
      return true;
    } catch (err) {
      toast.error(`Não foi possível restaurar a lista: ${mensagem(err)}`);
      return false;
    }
  };

  const acoes: AcoesChecklist = {
    ...acoesMembros,
    alterarItem,
    alternarDiaria,
    adicionarItem,
    removerItem,
    adicionarGrupo,
    alterarGrupo,
    arquivarGrupo,
    restaurarGrupo,
    moverGrupo,
    trazerItem,
    trazerGrupo,
    definirRepeticaoLista,
    contarConcluidasAntesDeHoje: (grupoId) =>
      qtdConcluidasAntesDeHoje(
        itensAtivos.filter((i) => i.grupo_id === grupoId),
        conclusoes.conclusoes,
        conclusoes.dia,
      ),
  };
  /** Só os grupos do próprio usuário (ex.: destino ao aceitar uma tarefa, como a RPC exige), menos os enviados aguardando resposta. */
  const gruposProprios = grupos.filter((g) => g.dono_id === usuarioId && situacaoDaLista(g.id)?.tipo !== "aguardando");
  return { grupos, gruposProprios, itens: itensAtivos, carregando, erro, acoes, acessoDe };
}
