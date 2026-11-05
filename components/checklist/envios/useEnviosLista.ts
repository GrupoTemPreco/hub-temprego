"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  agruparLotesLista,
  assinarEnviosLista,
  cancelarEnvioLista,
  enviarLista,
  listarListasEnviadas,
  listarListasRecebidas,
  listarLoteLista,
  listarProgressoLoteLista,
  marcarCienteEnvioLista,
  MSG_LISTA_JA_ACEITA,
  reenviarEnvioLista,
  responderEnvioLista,
  situacaoPorLista,
  type LoteLista,
  type NovoEnvioLista,
  type ProgressoEnvioListaLote,
  type SituacaoEnvioLista,
} from "@/lib/checklistEnviosLista";
import type { ChecklistEnvioLista } from "@/lib/types/shell";
import { avisoDoEnvioLista } from "./avisosDoEnvioLista";
import type { AvisoChecklist } from "./useAvisosChecklist";
import type { Nomes } from "./textosLote";

/** "ja-aceita": outra pessoa do mesmo envio aceitou antes (a RPC recusou o aceite). */
export type ResultadoRespostaLista = "ok" | "ja-aceita" | "erro";

export type EnviosListaApi = {
  carregado: boolean;
  /** Envios de lista pendentes para o usuário. */
  recebidas: ChecklistEnvioLista[];
  /** Envios de lista do usuário agrupados por lote. */
  lotes: LoteLista[];
  /** Aguardando resposta, recusada por todos (sem "Ok") ou progresso do modo "todos". */
  situacaoDaLista: (grupoId: string) => SituacaoEnvioLista | null;
  /** Conclusão das cópias no modo "todos", por lote. */
  progressoDoLote: (loteId: string) => ProgressoEnvioListaLote[];
  enviar: (dados: NovoEnvioLista) => Promise<boolean>;
  reenviar: (lote: LoteLista) => Promise<boolean>;
  cancelar: (lote: LoteLista) => Promise<boolean>;
  marcarCiente: (lote: LoteLista) => Promise<boolean>;
  responder: (envio: ChecklistEnvioLista, aceitar: boolean, resposta: string | null) => Promise<ResultadoRespostaLista>;
  /** Avisa quando uma lista enviada pelo usuário foi aceita e passou para outra pessoa. */
  aoListaSair: (ouvinte: (grupoId: string) => void) => () => void;
};

type Params = {
  ativo: boolean;
  usuarioId: string;
  /** Pessoas e setores já carregados: só então assina (os avisos precisam dos nomes). */
  pronto: boolean;
  nomes: () => Nomes;
  adicionarAviso: (aviso: AvisoChecklist) => void;
  removerAvisos: (filtro: (a: AvisoChecklist) => boolean) => void;
  tocar: () => void;
};

function upsert(lista: ChecklistEnvioLista[], envio: ChecklistEnvioLista) {
  const sem = lista.filter((e) => e.id !== envio.id);
  return [envio, ...sem].sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
}

const mensagem = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function useEnviosLista({ ativo, usuarioId, pronto, nomes, adicionarAviso, removerAvisos, tocar }: Params): EnviosListaApi {
  const toast = useToast();
  const [recebidas, setRecebidas] = useState<ChecklistEnvioLista[]>([]);
  const [enviadas, setEnviadas] = useState<ChecklistEnvioLista[]>([]);
  const [progresso, setProgresso] = useState<Record<string, ProgressoEnvioListaLote[]>>({});
  const [carregado, setCarregado] = useState(false);
  const refs = useRef({ recebidas, enviadas });
  const ouvintesSaida = useRef(new Set<(grupoId: string) => void>());

  useEffect(() => {
    refs.current = { recebidas, enviadas };
  }, [recebidas, enviadas]);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    Promise.all([listarListasRecebidas(usuarioId), listarListasEnviadas(usuarioId)])
      .then(([r, e]) => {
        if (!vivo) return;
        setRecebidas(r);
        setEnviadas(e);
      })
      .catch((err) => console.error("[checklist-envios] Falha ao carregar envios de lista:", err))
      .finally(() => vivo && setCarregado(true));
    return () => {
      vivo = false;
    };
  }, [ativo, usuarioId]);

  const receber = useCallback(
    (envio: ChecklistEnvioLista) => {
      const { recebidas: rec, enviadas: env } = refs.current;
      const souRemetente = envio.de_usuario_id === usuarioId;
      const antes = (souRemetente ? env : rec).find((e) => e.id === envio.id);
      const aviso = avisoDoEnvioLista(envio, antes, { ...nomes(), meuId: usuarioId, enviadosAntes: env });

      if (souRemetente) {
        setEnviadas((prev) => upsert(prev, envio));
        if (
          antes?.status === "pendente" &&
          envio.status === "aceito" &&
          envio.grupo_id &&
          envio.modo !== "todos" &&
          !envio.copia_grupo_id
        ) {
          ouvintesSaida.current.forEach((o) => o(envio.grupo_id!));
        }
      } else if (envio.status === "pendente") {
        setRecebidas((prev) => upsert(prev, envio));
      } else {
        // Encerrado (outra pessoa aceitou), cancelado ou respondido: sai na hora, sem som.
        setRecebidas((prev) => prev.filter((e) => e.id !== envio.id));
        removerAvisos((a) => a.envioRecebidoId === envio.id);
      }

      if (aviso) {
        adicionarAviso(aviso);
        tocar();
      }
    },
    [usuarioId, nomes, adicionarAviso, removerAvisos, tocar],
  );

  useEffect(() => {
    if (!ativo || !pronto || !carregado) return;
    return assinarEnviosLista(usuarioId, receber);
  }, [ativo, pronto, carregado, usuarioId, receber]);

  const executar = useCallback(
    async (acao: () => Promise<ChecklistEnvioLista[]>, erro: string) => {
      try {
        const linhas = await acao();
        setEnviadas((prev) => linhas.reduce(upsert, prev));
        return true;
      } catch (err) {
        toast.error(`${erro}: ${mensagem(err)}`);
        return false;
      }
    },
    [toast],
  );

  const responder = useCallback<EnviosListaApi["responder"]>(
    async (envio, aceitar, resposta) => {
      try {
        await responderEnvioLista(envio.id, aceitar, resposta);
        setRecebidas((prev) => prev.filter((e) => e.id !== envio.id));
        removerAvisos((a) => a.envioRecebidoId === envio.id);
        return "ok";
      } catch (err) {
        const texto = mensagem(err);
        if (!texto.includes(MSG_LISTA_JA_ACEITA)) {
          toast.error(`Não foi possível responder: ${texto}`);
          return "erro";
        }
        toast.error(MSG_LISTA_JA_ACEITA);
        setRecebidas((prev) => prev.filter((e) => e.id !== envio.id));
        removerAvisos((a) => a.envioRecebidoId === envio.id);
        return "ja-aceita";
      }
    },
    [toast, removerAvisos],
  );

  const aoListaSair = useCallback((ouvinte: (grupoId: string) => void) => {
    ouvintesSaida.current.add(ouvinte);
    return () => {
      ouvintesSaida.current.delete(ouvinte);
    };
  }, []);

  const lotes = useMemo(() => agruparLotesLista(enviadas), [enviadas]);
  const situacoes = useMemo(() => situacaoPorLista(lotes), [lotes]);
  const chaveProgresso = useMemo(
    () =>
      enviadas
        .filter((e) => e.modo === "todos")
        .map((e) => `${e.lote_id}:${e.status}:${e.copia_grupo_id ?? ""}`)
        .sort()
        .join("|"),
    [enviadas],
  );

  useEffect(() => {
    if (!ativo || !carregado || !chaveProgresso) {
      setProgresso({});
      return;
    }
    const ids = [...new Set(chaveProgresso.split("|").map((p) => p.split(":")[0]))];
    let vivo = true;
    const carregar = () => {
      Promise.all(ids.map((id) => listarProgressoLoteLista(id).then((linhas) => [id, linhas] as const)))
        .then((pares) => {
          if (vivo) setProgresso(Object.fromEntries(pares));
        })
        .catch((err) => console.error("[checklist-envios] Falha ao carregar progresso da lista:", err));
    };
    carregar();
    const t = window.setInterval(carregar, 60_000);
    return () => {
      vivo = false;
      window.clearInterval(t);
    };
  }, [ativo, carregado, chaveProgresso]);

  return useMemo<EnviosListaApi>(
    () => ({
      carregado: !ativo || carregado,
      recebidas: ativo ? recebidas : [],
      lotes: ativo ? lotes : [],
      situacaoDaLista: (grupoId) => (ativo ? situacoes.get(grupoId) ?? null : null),
      progressoDoLote: (loteId) => progresso[loteId] ?? [],
      enviar: (dados) => executar(async () => listarLoteLista(await enviarLista(dados)), "Não foi possível enviar a lista"),
      reenviar: (lote) => executar(() => reenviarEnvioLista(lote.id), "Não foi possível reenviar"),
      cancelar: (lote) => executar(() => cancelarEnvioLista(lote.id), "Não foi possível cancelar o envio"),
      marcarCiente: async (lote) => {
        const ok = await executar(() => marcarCienteEnvioLista(lote.id), "Não foi possível confirmar");
        if (ok) removerAvisos((a) => a.loteId === lote.id);
        return ok;
      },
      responder,
      aoListaSair,
    }),
    [ativo, carregado, recebidas, lotes, situacoes, progresso, executar, removerAvisos, responder, aoListaSair],
  );
}
