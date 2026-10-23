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
  type RespostaEnvio,
  type SetorChecklist,
} from "@/lib/checklistEnvios";
import { agruparLotes, situacaoDoLote, ultimoLotePorItem, type LoteEnvio, type SituacaoEnvioItem } from "@/lib/checklistLotes";
import { PAINEL_ENVIADAS, rotaChecklist } from "@/lib/telaAtual";
import type { ChecklistEnvio } from "@/lib/types/shell";
import { avisoDoEnvio } from "./avisosDoEnvio";
import { useAvisosChecklist, type AvisoChecklist } from "./useAvisosChecklist";
import { useAvisoListaCompartilhada } from "./useAvisoListaCompartilhada";

/** "ja-aceita": outra pessoa do mesmo envio aceitou antes (a RPC recusou o aceite). */
export type ResultadoResposta = "ok" | "ja-aceita" | "erro";

type ChecklistEnviosApi = {
  /** Falso para quem não tem acesso ao checklist: listas vazias e nada assinado. */
  ativo: boolean;
  /** Primeira carga (pessoas, setores, recebidos e enviados) concluída. */
  carregado: boolean;
  /** Pendentes enviados para o usuário. */
  recebidos: ChecklistEnvio[];
  /** Envios do usuário agrupados por lote (últimos 30 dias, pendentes e respostas sem "Ok"). */
  lotes: LoteEnvio[];
  /** Pessoas aprovadas com acesso ao checklist, exceto o próprio usuário. */
  destinatarios: PessoaChecklist[];
  /** Setores ativos com quem receberia um envio para eles. */
  setores: SetorChecklist[];
  nomeDe: (usuarioId: string | null) => string;
  nomeSetor: (setorId: string | null) => string;
  situacaoDoItem: (itemId: string) => SituacaoEnvioItem | null;
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
        if (antes?.status === "pendente" && envio.status === "aceito" && envio.item_id) {
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

  /** Ok do cartão: dispensa os avisos e dá ciência dos aceites que estavam nele. */
  const dispensarAvisos = useCallback(() => {
    const aceites = listaAvisos.filter((a) => a.cienteAoDispensar && a.loteId).map((a) => a.loteId!);
    limparAvisos();
    for (const lote of lotes.filter((l) => aceites.includes(l.id))) {
      marcarCienteLote(lote)
        .then((linhas) => setEnviados((prev) => linhas.reduce(upsert, prev)))
        .catch((err) => console.error("[checklist-envios] Falha ao confirmar aceite:", err));
    }
  }, [listaAvisos, limparAvisos, lotes]);

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
      carregado,
      recebidos: ativo ? recebidos : [],
      lotes: ativo ? lotes : [],
      destinatarios: pessoas.filter((p) => podeReceber(p, usuario.id)),
      setores: setoresBrutos.map((s) => ({
        id: s.id,
        nome: s.nome,
        destinatarios: s.membros.filter((id) => pessoas.some((p) => p.id === id && podeReceber(p, usuario.id))),
      })),
      nomeDe,
      nomeSetor,
      situacaoDoItem: (itemId) => situacaoDoLote(ultimos.get(itemId)),
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
      lotes,
      pessoas,
      setoresBrutos,
      usuario.id,
      nomeDe,
      nomeSetor,
      ultimos,
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
