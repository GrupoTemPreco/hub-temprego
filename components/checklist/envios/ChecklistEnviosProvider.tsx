"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useFerramentaAtiva } from "@/components/hub/FerramentaAtivaProvider";
import { useSom } from "@/components/hub/SomNotificacaoProvider";
import {
  assinarEnvios,
  cancelarLote,
  enviarTarefa,
  listarEnviados,
  listarLote,
  listarPessoas,
  listarProgressoLote,
  listarRecebidosPendentes,
  listarSetoresComMembros,
  marcarCienteLote,
  MSG_ENVIO_DUPLICADO,
  MSG_JA_ACEITA,
  podeReceber,
  reenviarLote,
  responderEnvio,
  type NovoEnvio,
  type PessoaChecklist,
  type ProgressoEnvioLote,
  type RespostaEnvio,
  type SetorChecklist,
} from "@/lib/checklistEnvios";
import { agruparLotes, situacaoDoItem as montarSituacaoItem, ultimoLotePorItem, type LoteEnvio, type SituacaoEnvioItem } from "@/lib/checklistLotes";
import { PAINEL_ENVIADAS, rotaChecklist } from "@/lib/telaAtual";
import type { ChecklistEnvio } from "@/lib/types/shell";
import { avisoDoEnvio } from "./avisosDoEnvio";
import { useAvisosChecklist, type AvisoChecklist } from "./useAvisosChecklist";
import { useAvisoListaCompartilhada } from "./useAvisoListaCompartilhada";
import { useEnviosLista, type EnviosListaApi } from "./useEnviosLista";
import { useOrigensRecebidas } from "../useOrigensRecebidas";
import type { OrigemRecebida } from "@/lib/checklistOrigem";
import type { Nomes } from "./textosLote";

/** "ja-aceita": outra pessoa do mesmo envio aceitou antes (a RPC recusou o aceite). */
export type ResultadoResposta = "ok" | "ja-aceita" | "erro";

type ChecklistEnviosApi = {
  /** Falso para quem não tem acesso ao checklist: listas vazias e nada assinado. */
  ativo: boolean;
  /** Primeira carga (pessoas, setores, recebidos e enviados) concluída. */
  carregado: boolean;
  /** Pendentes enviados para o usuário. */
  recebidos: ChecklistEnvio[];
  /** Tarefas e listas recebidas aguardando resposta (contadores). */
  qtdRecebidos: number;
  /** Envio da lista inteira: mesmo ciclo do envio de tarefa, em tabela própria. */
  listas: EnviosListaApi;
  /** Envios do usuário agrupados por lote (últimos 30 dias, pendentes e respostas sem "Ok"). */
  lotes: LoteEnvio[];
  /** Pessoas aprovadas com acesso ao checklist, exceto o próprio usuário. */
  destinatarios: PessoaChecklist[];
  /** Setores ativos com quem receberia um envio para eles. */
  setores: SetorChecklist[];
  nomeDe: (usuarioId: string | null) => string;
  nomeSetor: (setorId: string | null) => string;
  /** Envio aceito em que o usuário é o destinatário (transferência ou cópia). */
  origemDaTarefa: (itemId: string) => OrigemRecebida | null;
  origemDaLista: (grupoId: string) => OrigemRecebida | null;
  situacaoDoItem: (itemId: string) => SituacaoEnvioItem | null;
  /** Conclusão das cópias no modo "todos", por lote. */
  progressoDoLote: (loteId: string) => ProgressoEnvioLote[];
  enviar: (dados: NovoEnvio) => Promise<boolean>;
  /** Reenviar e cancelar valem para todos os pendentes do lote. */
  reenviar: (lote: LoteEnvio) => Promise<boolean>;
  cancelar: (lote: LoteEnvio) => Promise<boolean>;
  /** "Ok" de quem enviou (aceite ou recusa de todos): grava ciente_em em todas as linhas do lote. */
  marcarCiente: (lote: LoteEnvio) => Promise<boolean>;
  responder: (resposta: RespostaEnvio) => Promise<ResultadoResposta>;
  /** Avisa quando um item enviado pelo usuário foi aceito e passou para outra pessoa. */
  aoItemSair: (ouvinte: (itemId: string) => void) => () => void;
  /** Avisos do checklist exibidos no cartão do balão. */
  avisos: {
    lista: AvisoChecklist[];
    balancos: number;
    /** Nulo: leva à aba Checklist (cartão com várias novidades). */
    abrir: (aviso: AvisoChecklist | null) => void;
    dispensar: () => void;
  };
};

const ChecklistEnviosContext = createContext<ChecklistEnviosApi | null>(null);

function upsert(lista: ChecklistEnvio[], envio: ChecklistEnvio) {
  const sem = lista.filter((e) => e.id !== envio.id);
  return [envio, ...sem].sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
}

function mensagem(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function ChecklistEnviosProvider({ children }: { children: ReactNode }) {
  const { irPara } = useFerramentaAtiva();
  const toast = useToast();
  const { tocar } = useSom();
  const usuario = useUsuarioAtual();
  const ativo = usuario.acessoChecklist;
  const [pessoas, setPessoas] = useState<PessoaChecklist[]>([]);
  const [setoresBrutos, setSetoresBrutos] = useState<Array<{ id: string; nome: string; membros: string[] }>>([]);
  const [recebidos, setRecebidos] = useState<ChecklistEnvio[]>([]);
  const [enviados, setEnviados] = useState<ChecklistEnvio[]>([]);
  const [progresso, setProgresso] = useState<Record<string, ProgressoEnvioLote[]>>({});
  // Só assina depois da carga: o que já existia ao abrir a página não vira aviso nem toca som.
  const [carregado, setCarregado] = useState(false);
  const { lista: listaAvisos, balancos, adicionar: adicionarAviso, remover: removerAvisos, limpar: limparAvisos } =
    useAvisosChecklist(usuario.id);
  const refs = useRef({ pessoas, setoresBrutos, recebidos, enviados });
  const pessoasRef = useRef(pessoas);
  const ouvintesSaida = useRef(new Set<(itemId: string) => void>());

  useEffect(() => {
    refs.current = { pessoas, setoresBrutos, recebidos, enviados };
    pessoasRef.current = pessoas;
  }, [pessoas, setoresBrutos, recebidos, enviados]);

  const nomeDe = useCallback(
    (id: string | null) => {
      const p = pessoas.find((x) => x.id === id);
      return p?.nome || p?.email || "Alguém";
    },
    [pessoas],
  );
  const nomeSetor = useCallback(
    (id: string | null) => setoresBrutos.find((s) => s.id === id)?.nome ?? "Setor",
    [setoresBrutos],
  );
  /** Nomes do momento, para avisos que chegam pelo tempo real. */
  const nomesAtuais = useCallback((): Nomes => {
    const { pessoas: ps, setoresBrutos: ss } = refs.current;
    return {
      nomeDe: (id) => {
        const p = ps.find((x) => x.id === id);
        return p?.nome || p?.email || "Alguém";
      },
      nomeSetor: (id) => ss.find((s) => s.id === id)?.nome ?? "Setor",
    };
  }, []);
  const origens = useOrigensRecebidas(usuario.id, ativo, nomeDe);
  const listas = useEnviosLista({
    ativo,
    usuarioId: usuario.id,
    pronto: carregado,
    nomes: nomesAtuais,
    adicionarAviso,
    removerAvisos,
    tocar,
  });

  const aoItemSair = useCallback((ouvinte: (itemId: string) => void) => {
    ouvintesSaida.current.add(ouvinte);
    return () => {
      ouvintesSaida.current.delete(ouvinte);
    };
  }, []);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    Promise.all([listarPessoas(), listarSetoresComMembros(), listarRecebidosPendentes(usuario.id), listarEnviados(usuario.id)])
      .then(([p, s, r, e]) => {
        if (!vivo) return;
        setPessoas(p);
        setSetoresBrutos(s);
        setRecebidos(r);
        setEnviados(e);
        setCarregado(true);
      })
      .catch((err) => console.error("[checklist-envios] Falha ao carregar envios:", err));
    return () => {
      vivo = false;
    };
  }, [ativo, usuario.id]);

  const receber = useCallback(
    (envio: ChecklistEnvio) => {
      const { pessoas: ps, setoresBrutos: ss, enviados: env, recebidos: rec } = refs.current;
      const nome = (id: string | null) => {
        const p = ps.find((x) => x.id === id);
        return p?.nome || p?.email || "Alguém";
      };
      const souRemetente = envio.de_usuario_id === usuario.id;
      const antes = (souRemetente ? env : rec).find((e) => e.id === envio.id);
      const aviso = avisoDoEnvio(envio, antes, {
        meuId: usuario.id,
        nomeDe: nome,
        nomeSetor: (id) => ss.find((s) => s.id === id)?.nome ?? "Setor",
        enviadosAntes: env,
      });

      if (souRemetente) {
        setEnviados((prev) => upsert(prev, envio));
        if (
          antes?.status === "pendente" &&
          envio.status === "aceito" &&
          envio.item_id &&
          envio.modo !== "todos" &&
          !envio.copia_item_id
        ) {
          ouvintesSaida.current.forEach((o) => o(envio.item_id!));
        }
      } else if (envio.status === "pendente") {
        setRecebidos((prev) => upsert(prev, envio));
      } else {
        // Encerrado (outra pessoa aceitou), cancelado ou respondido: sai na hora, sem som.
        setRecebidos((prev) => prev.filter((e) => e.id !== envio.id));
        removerAvisos((a) => a.envioRecebidoId === envio.id);
      }

      if (aviso) {
        adicionarAviso(aviso);
        tocar();
      }
    },
    [usuario.id, adicionarAviso, removerAvisos, tocar],
  );

  useEffect(() => {
    if (!ativo || !carregado) return;
    return assinarEnvios(usuario.id, receber);
  }, [ativo, carregado, usuario.id, receber]);

  useAvisoListaCompartilhada({ ativo: ativo && carregado, usuarioId: usuario.id, pessoasRef, adicionarAviso, tocar });

  /** Executa e aplica as linhas devolvidas; erros viram toast. */
  const executar = useCallback(
    async (acao: () => Promise<ChecklistEnvio[]>, erro: string) => {
      try {
        const linhas = await acao();
        setEnviados((prev) => linhas.reduce(upsert, prev));
        return true;
      } catch (err) {
        const texto = mensagem(err);
        toast.error(texto === MSG_ENVIO_DUPLICADO ? texto : `${erro}: ${texto}`);
        return false;
      }
    },
    [toast],
  );

  const marcarCiente = useCallback(
    async (lote: LoteEnvio) => {
      const ok = await executar(() => marcarCienteLote(lote), "Não foi possível confirmar");
      if (ok) removerAvisos((a) => a.loteId === lote.id);
      return ok;
    },
    [executar, removerAvisos],
  );

  const lotes = useMemo(() => agruparLotes(enviados), [enviados]);
  const ultimos = useMemo(() => ultimoLotePorItem(lotes), [lotes]);
  const chaveProgresso = useMemo(
    () =>
      enviados
        .filter((e) => e.modo === "todos" && e.lote_id)
        .map((e) => `${e.lote_id}:${e.status}:${e.copia_item_id ?? ""}`)
        .sort()
        .join("|"),
    [enviados],
  );

  useEffect(() => {
    if (!ativo || !carregado || !chaveProgresso) {
      setProgresso({});
      return;
    }
    const ids = [...new Set(chaveProgresso.split("|").map((p) => p.split(":")[0]))];
    let vivo = true;
    const carregar = () => {
      Promise.all(ids.map((id) => listarProgressoLote(id).then((linhas) => [id, linhas] as const)))
        .then((pares) => {
          if (vivo) setProgresso(Object.fromEntries(pares));
        })
        .catch((err) => console.error("[checklist-envios] Falha ao carregar progresso:", err));
    };
    carregar();
    const t = window.setInterval(carregar, 60_000);
    return () => {
      vivo = false;
      window.clearInterval(t);
    };
  }, [ativo, carregado, chaveProgresso]);

  /** Ok do cartão: dispensa os avisos e dá ciência dos aceites que estavam nele. */
  const dispensarAvisos = useCallback(() => {
    const aceites = listaAvisos.filter((a) => a.cienteAoDispensar && a.loteId).map((a) => a.loteId!);
    limparAvisos();
    for (const lote of lotes.filter((l) => aceites.includes(l.id))) {
      marcarCienteLote(lote)
        .then((linhas) => setEnviados((prev) => linhas.reduce(upsert, prev)))
        .catch((err) => console.error("[checklist-envios] Falha ao confirmar aceite:", err));
    }
    for (const lote of listas.lotes.filter((l) => aceites.includes(l.id))) void listas.marcarCiente(lote);
  }, [listaAvisos, limparAvisos, lotes, listas]);

  const abrirAviso = useCallback(
    (aviso: AvisoChecklist | null) => {
      const destino = aviso?.destino ?? { tipo: "checklist" as const };
      const rota =
        destino.tipo === "item"
          ? rotaChecklist(usuario.isAdmin, destino.itemId)
          : destino.tipo === "enviadas"
            ? rotaChecklist(usuario.isAdmin, undefined, PAINEL_ENVIADAS)
            : rotaChecklist(usuario.isAdmin);
      limparAvisos();
      irPara(rota);
    },
    [limparAvisos, irPara, usuario.isAdmin],
  );

  const responder = useCallback(
    async (r: RespostaEnvio): Promise<ResultadoResposta> => {
      try {
        await responderEnvio(r);
        setRecebidos((prev) => prev.filter((e) => e.id !== r.envioId));
        return "ok";
      } catch (err) {
        const texto = mensagem(err);
        if (!texto.includes(MSG_JA_ACEITA)) {
          toast.error(`Não foi possível responder: ${texto}`);
          return "erro";
        }
        toast.error(MSG_JA_ACEITA);
        setRecebidos((prev) => prev.filter((e) => e.id !== r.envioId));
        removerAvisos((a) => a.envioRecebidoId === r.envioId);
        return "ja-aceita";
      }
    },
    [toast, removerAvisos],
  );

  const api = useMemo<ChecklistEnviosApi>(
    () => ({
      ativo,
      carregado: carregado && listas.carregado,
      recebidos: ativo ? recebidos : [],
      qtdRecebidos: ativo ? recebidos.length + listas.recebidas.length : 0,
      listas,
      lotes: ativo ? lotes : [],
      destinatarios: pessoas.filter((p) => podeReceber(p, usuario.id)),
      setores: setoresBrutos.map((s) => ({
        id: s.id,
        nome: s.nome,
        destinatarios: s.membros.filter((id) => pessoas.some((p) => p.id === id && podeReceber(p, usuario.id))),
      })),
      nomeDe,
      nomeSetor,
      origemDaTarefa: origens.daTarefa,
      origemDaLista: origens.daLista,
      situacaoDoItem: (itemId) => montarSituacaoItem(ultimos.get(itemId)),
      progressoDoLote: (loteId) => progresso[loteId] ?? [],
      enviar: (dados) =>
        executar(async () => listarLote(await enviarTarefa(dados)), "Não foi possível enviar a tarefa"),
      reenviar: (lote) => executar(() => reenviarLote(lote), "Não foi possível reenviar"),
      cancelar: (lote) => executar(() => cancelarLote(lote), "Não foi possível cancelar o envio"),
      marcarCiente,
      responder,
      aoItemSair,
      avisos: { lista: ativo ? listaAvisos : [], balancos, abrir: abrirAviso, dispensar: dispensarAvisos },
    }),
    [
      ativo,
      carregado,
      recebidos,
      listas,
      lotes,
      pessoas,
      setoresBrutos,
      usuario.id,
      nomeDe,
      nomeSetor,
      origens,
      ultimos,
      progresso,
      executar,
      marcarCiente,
      responder,
      aoItemSair,
      listaAvisos,
      balancos,
      abrirAviso,
      dispensarAvisos,
    ],
  );

  return <ChecklistEnviosContext.Provider value={api}>{children}</ChecklistEnviosContext.Provider>;
}

export function useChecklistEnvios(): ChecklistEnviosApi {
  const ctx = useContext(ChecklistEnviosContext);
  if (!ctx) throw new Error("useChecklistEnvios precisa estar dentro de <ChecklistEnviosProvider>.");
  return ctx;
}
