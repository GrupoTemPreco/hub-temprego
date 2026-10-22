"use client";

import { useState, type ReactNode } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { formatarTamanho } from "@/lib/format";
import type { AcaoLimpeza, Previa } from "@/lib/admin/limpeza";

const MAX_ITENS_PREVIA = 100;

type Props<D> = {
  titulo: string;
  descricao: ReactNode;
  acao: AcaoLimpeza<D>;
  /** Sem valor: a ação não tem campo de dias. */
  diasPadrao?: number;
  diasMinimo?: number;
  /** ["anexo", "anexos"] */
  unidade: [string, string];
  rotuloExecutar: string;
  onConcluido: () => void;
};

const qtd = (n: number, [singular, plural]: [string, string]) => `${n} ${n === 1 ? singular : plural}`;

function resumo(previa: { quantidade: number; bytes: number | null }, unidade: [string, string]) {
  return `${qtd(previa.quantidade, unidade)}${previa.bytes !== null ? ` · ${formatarTamanho(previa.bytes)}` : ""}`;
}

/** Card de uma ação de limpeza: prévia obrigatória antes de executar, com confirmação. */
export function LimpezaCard<D>({
  titulo,
  descricao,
  acao,
  diasPadrao,
  diasMinimo = 1,
  unidade,
  rotuloExecutar,
  onConcluido,
}: Props<D>) {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const temDias = diasPadrao !== undefined;
  const [diasTexto, setDiasTexto] = useState(String(diasPadrao ?? 0));
  const [previa, setPrevia] = useState<(Previa<D> & { dias: number }) | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const dias = Number(diasTexto);
  const diasValido = !temDias || (Number.isInteger(dias) && dias >= diasMinimo);
  const podeExecutar = previa !== null && previa.quantidade > 0 && !carregando && !executando;

  async function verPrevia() {
    if (!diasValido) return;
    setCarregando(true);
    try {
      setPrevia({ ...(await acao.previa(temDias ? dias : 0)), dias });
    } catch (err) {
      toast.error(`Erro ao montar a prévia: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCarregando(false);
    }
  }

  async function executar() {
    if (!previa) return;
    setExecutando(true);
    try {
      const r = await acao.executar(previa, previa.dias, usuario.id);
      const bytes = r.bytes ? ` · ${formatarTamanho(r.bytes)} liberados` : "";
      toast.success(`${titulo}: ${qtd(r.quantidade, unidade)} apagados${bytes}.`);
      if (r.falhas.length) {
        toast.error(`${r.falhas.length} itens falharam: ${r.falhas.slice(0, 3).join("; ")}${r.falhas.length > 3 ? "..." : ""}`);
      }
      setPrevia(null);
      onConcluido();
    } catch (err) {
      toast.error(`Erro ao executar a limpeza: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExecutando(false);
      setConfirmando(false);
    }
  }

  return (
    <article className="flex flex-col rounded-xl border border-white/10 bg-white/3 p-4">
      <h3 className="font-semibold text-white">{titulo}</h3>
      <p className="mt-1 text-sm text-white/55">{descricao}</p>

      {temDias && (
        <label className="mt-3 flex items-center gap-2 text-sm text-white/70">
          Mais de
          <input
            type="number"
            min={diasMinimo}
            value={diasTexto}
            onChange={(e) => {
              setDiasTexto(e.target.value);
              setPrevia(null);
            }}
            className="w-20 rounded-md border border-white/10 px-2 py-1 text-sm outline-none focus:border-blue-500"
          />
          dias
        </label>
      )}
      {!diasValido && <p className="mt-1 text-xs text-rose-400">Informe um número inteiro a partir de {diasMinimo}.</p>}

      {previa && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
          <p className="font-medium text-white/85">
            {previa.quantidade === 0 ? "Nada a apagar." : `Será apagado: ${resumo(previa, unidade)}`}
          </p>
          {previa.itens.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto font-mono text-xs text-white/55">
              {previa.itens.slice(0, MAX_ITENS_PREVIA).map((item, i) => (
                <li key={`${item}-${i}`} className="truncate">
                  {item}
                </li>
              ))}
              {previa.itens.length > MAX_ITENS_PREVIA && (
                <li className="text-white/40">e mais {previa.itens.length - MAX_ITENS_PREVIA}...</li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Button variant="secondary" size="sm" onClick={verPrevia} disabled={carregando || executando || !diasValido}>
          <Eye className="h-3.5 w-3.5" /> {carregando ? "Calculando..." : "Ver o que será apagado"}
        </Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmando(true)} disabled={!podeExecutar}>
          <Trash2 className="h-3.5 w-3.5" /> {rotuloExecutar}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmando}
        danger
        title={`${titulo}?`}
        description={previa ? `Será apagado: ${resumo(previa, unidade)}. Esta ação não pode ser desfeita.` : undefined}
        confirmLabel={rotuloExecutar}
        loading={executando}
        onConfirm={executar}
        onCancel={() => setConfirmando(false)}
      />
    </article>
  );
}
