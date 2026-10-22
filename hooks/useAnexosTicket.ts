"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ehImagem } from "@/lib/anexosArquivo";
import { assinarUrls, listarAnexosDoTicket } from "@/lib/ticketsAnexos";
import type { TicketAnexo } from "@/lib/types/shell";

export type AnexoExibicao = TicketAnexo & { url: string | null; imagem: boolean; removido: boolean };

/**
 * Anexos do ticket com URLs assinadas. Recarrega quando `versao` muda (Realtime),
 * assinando só os caminhos que ainda não têm URL. Anexos removidos na limpeza não recebem URL.
 */
export function useAnexosTicket(ticketId: string | null, versao: number) {
  const [anexos, setAnexos] = useState<TicketAnexo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const urlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!ticketId) return;
    let ativo = true;
    (async () => {
      const lista = await listarAnexosDoTicket(ticketId);
      const novas = await assinarUrls(lista.filter((a) => !a.removido_em && !(a.caminho in urlsRef.current)));
      if (!ativo) return;
      urlsRef.current = { ...urlsRef.current, ...novas };
      setUrls(urlsRef.current);
      setAnexos(lista);
      setErro("");
    })().catch((err: Error) => ativo && setErro(err.message));
    return () => {
      ativo = false;
    };
  }, [ticketId, versao]);

  const exibicao = useMemo<AnexoExibicao[]>(
    () =>
      anexos.map((a) => {
        const removido = Boolean(a.removido_em);
        return { ...a, removido, url: removido ? null : urls[a.caminho] ?? null, imagem: ehImagem(a.tipo_mime) };
      }),
    [anexos, urls],
  );

  return { anexos: exibicao, erro };
}
