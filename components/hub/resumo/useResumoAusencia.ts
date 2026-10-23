"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useDesde } from "@/components/hub/RegistroAcesso";
import { useSom } from "@/components/hub/SomNotificacaoProvider";
import { useChecklistEnvios } from "@/components/checklist/envios/ChecklistEnviosProvider";
import { useTicketsUsuario } from "@/components/tickets/usuario/TicketsUsuarioProvider";
import { montarResumo, type EntradaResumo, type TipoResumo } from "./montarResumo";

const chaveStorage = (usuarioId: string) => `hub:resumo-ausencia:${usuarioId}`;

function ler(usuarioId: string): EntradaResumo[] {
  try {
    const lista = JSON.parse(window.localStorage.getItem(chaveStorage(usuarioId)) ?? "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvar(usuarioId: string, lista: EntradaResumo[]) {
  try {
    if (lista.length) window.localStorage.setItem(chaveStorage(usuarioId), JSON.stringify(lista));
    else window.localStorage.removeItem(chaveStorage(usuarioId));
  } catch {
    // Sem localStorage, o resumo não sobrevive ao recarregamento.
  }
}

/** O guardado continua; o novo só entra se ainda não estiver lá. */
function mesclar(guardadas: EntradaResumo[], novas: EntradaResumo[]) {
  const chaves = new Set(guardadas.map((e) => e.chave));
  return [...guardadas, ...novas.filter((e) => !chaves.has(e.chave))];
}

type NavegadorComAtivacao = Navigator & { userActivation?: { hasBeenActive: boolean } };

/** O navegador só deixa tocar depois de uma interação: toca já, se houve uma, ou na próxima. */
function tocarNaPrimeiraInteracao(tocar: () => void) {
  if ((navigator as NavegadorComAtivacao).userActivation?.hasBeenActive) {
    tocar();
    return;
  }
  const eventos = ["pointerdown", "keydown", "touchstart"] as const;
  const disparar = () => {
    eventos.forEach((e) => window.removeEventListener(e, disparar));
    // Depois da liberação do áudio do SomNotificacaoProvider, que roda no mesmo evento.
    setTimeout(tocar, 50);
  };
  eventos.forEach((e) => window.addEventListener(e, disparar, { passive: true }));
}

/**
 * Resumo "Enquanto você estava fora", calculado uma vez ao abrir o hub a partir do "desde".
 * Fica guardado no localStorage até o "Ok"; ao recarregar, o "desde" é recente e só volta
 * o que ainda está sem ciência ou sem leitura.
 */
export function useResumoAusencia() {
  const usuario = useUsuarioAtual();
  const marco = useDesde();
  const envios = useChecklistEnvios();
  const ticketsUsuario = useTicketsUsuario();
  const { tocar } = useSom();
  const [entradas, setEntradas] = useState<EntradaResumo[]>(() => ler(usuario.id));
  const [calculado, setCalculado] = useState(false);
  const iniciadoRef = useRef(false);

  useEffect(() => salvar(usuario.id, entradas), [usuario.id, entradas]);

  const fontesProntas =
    marco.status === "pronto" && (!envios.ativo || envios.carregado) && ticketsUsuario.carregado;

  useEffect(() => {
    if (!fontesProntas || marco.status !== "pronto" || iniciadoRef.current) return;
    iniciadoRef.current = true;
    montarResumo({
      usuarioId: usuario.id,
      desde: marco.desde,
      checklistAtivo: envios.ativo,
      nomeDe: envios.nomeDe,
      recebidos: envios.recebidos,
      lotes: envios.lotes,
      tickets: ticketsUsuario.tickets,
      novidades: ticketsUsuario.novidades,
    })
      .then((novas) => {
        setEntradas((prev) => mesclar(prev, novas));
        if (novas.length > 0) tocarNaPrimeiraInteracao(tocar);
      })
      .catch((err) => console.error("[resumo] Falha ao montar o resumo:", err))
      .finally(() => setCalculado(true));
  }, [fontesProntas, marco, usuario.id, envios, ticketsUsuario, tocar]);

  const removerTipo = useCallback((tipo: TipoResumo) => setEntradas((prev) => prev.filter((e) => e.tipo !== tipo)), []);
  const limpar = useCallback(() => setEntradas([]), []);

  return {
    entradas,
    /** Já se sabe se o resumo tem tickets (ou não haverá resumo): o lembrete pode decidir. */
    pronto: calculado || marco.status === "indisponivel",
    removerTipo,
    limpar,
  };
}
