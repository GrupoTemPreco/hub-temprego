"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent } from "react";
import { MAX_ANEXOS_POR_ENVIO, ehImagem, prepararArquivo } from "@/lib/anexosArquivo";
import type { ArquivoParaEnvio } from "@/lib/ticketsAnexos";

export type AnexoSelecionado = {
  id: string;
  nome: string;
  /** Nulo enquanto o arquivo é validado/comprimido. */
  arquivo: File | null;
  tipo: string;
  miniatura: string | null;
  /** Nulo fora do envio; 0–100 durante o upload. */
  progresso: number | null;
};

export type ControleAnexos = ReturnType<typeof useAnexos>;

function liberar(item: AnexoSelecionado) {
  if (item.miniatura) URL.revokeObjectURL(item.miniatura);
}

/** Estado dos arquivos escolhidos para um envio (formulário de ticket ou caixa de resposta). */
export function useAnexos() {
  const [itens, setItens] = useState<AnexoSelecionado[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const itensRef = useRef(itens);

  useEffect(() => {
    itensRef.current = itens;
  }, [itens]);

  useEffect(() => () => itensRef.current.forEach(liberar), []);

  const preparar = useCallback((item: AnexoSelecionado, original: File, colado: boolean) => {
    prepararArquivo(original, colado)
      .then((p) => {
        if (!itensRef.current.some((x) => x.id === item.id)) return;
        const miniatura = ehImagem(p.tipo) ? URL.createObjectURL(p.arquivo) : null;
        setItens((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, nome: p.nome, arquivo: p.arquivo, tipo: p.tipo, miniatura } : x)),
        );
      })
      .catch((err: Error) => {
        setItens((prev) => prev.filter((x) => x.id !== item.id));
        setAvisos((prev) => [...prev, err.message]);
      });
  }, []);

  const adicionar = useCallback(
    (arquivos: File[], origem: "selecao" | "colagem" = "selecao") => {
      const vagas = Math.max(0, MAX_ANEXOS_POR_ENVIO - itensRef.current.length);
      const aceitos = arquivos.slice(0, vagas);
      const recusados = arquivos.slice(vagas);
      setAvisos(
        recusados.length
          ? [
              `Máximo de ${MAX_ANEXOS_POR_ENVIO} arquivos por envio. ${recusados.map((f) => `"${f.name}"`).join(", ")} ${
                recusados.length === 1 ? "não foi adicionado" : "não foram adicionados"
              }.`,
            ]
          : [],
      );

      const novos = aceitos.map<AnexoSelecionado>((f) => ({
        id: crypto.randomUUID(),
        nome: f.name || "arquivo",
        arquivo: null,
        tipo: f.type,
        miniatura: null,
        progresso: null,
      }));
      itensRef.current = [...itensRef.current, ...novos];
      setItens(itensRef.current);
      novos.forEach((item, i) =>
        preparar(item, aceitos[i], origem === "colagem" && /^image\.\w+$/i.test(aceitos[i].name)),
      );
    },
    [preparar],
  );

  const remover = useCallback((id: string) => {
    const item = itensRef.current.find((x) => x.id === id);
    if (item) liberar(item);
    setItens((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const limpar = useCallback(() => {
    itensRef.current.forEach(liberar);
    setItens([]);
    setAvisos([]);
  }, []);

  const definirProgresso = useCallback((id: string, progresso: number | null) => {
    setItens((prev) => prev.map((x) => (x.id === id ? { ...x, progresso } : x)));
  }, []);

  const zerarProgresso = useCallback(() => {
    setItens((prev) => prev.map((x) => ({ ...x, progresso: null })));
  }, []);

  /** Use no onPaste do contêiner: prints e arquivos colados viram anexos; texto segue normal. */
  const colar = useCallback(
    (e: ClipboardEvent) => {
      const arquivos = Array.from(e.clipboardData.files);
      if (arquivos.length === 0) return;
      e.preventDefault();
      adicionar(arquivos, "colagem");
    },
    [adicionar],
  );

  const prontos = useMemo<ArquivoParaEnvio[]>(
    () => itens.flatMap((x) => (x.arquivo ? [{ id: x.id, arquivo: x.arquivo, nome: x.nome, tipo: x.tipo }] : [])),
    [itens],
  );

  return {
    itens,
    avisos,
    prontos,
    preparando: itens.some((x) => !x.arquivo),
    adicionar,
    remover,
    limpar,
    colar,
    definirProgresso,
    zerarProgresso,
  };
}
