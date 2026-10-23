"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { fracaoNoPrazo, formatarHoras } from "@/lib/rhRegras";
import type { ResumoUsuarioRh } from "@/lib/rhMonitoramento";
import { AcessoRelativo, NumeroAlerta, PercentualPrazo, SetoresChips } from "./IndicadoresRh";

type Coluna = "nome" | "checklist" | "pendentes" | "criticos" | "vencidos" | "concluidas" | "prazo" | "tempo";
type Ordem = { coluna: Coluna; crescente: boolean };

const COLUNAS: Array<{ id: Coluna; rotulo: string; numero?: boolean }> = [
  { id: "nome", rotulo: "Pessoa" },
  { id: "checklist", rotulo: "Último acesso ao checklist" },
  { id: "pendentes", rotulo: "Pendentes", numero: true },
  { id: "criticos", rotulo: "Críticos", numero: true },
  { id: "vencidos", rotulo: "Vencidos", numero: true },
  { id: "concluidas", rotulo: "Concluídas", numero: true },
  { id: "prazo", rotulo: "% no prazo", numero: true },
  { id: "tempo", rotulo: "Tempo médio", numero: true },
];

const nomeDe = (u: ResumoUsuarioRh) => u.nome || u.email || "";

/** Valor usado na ordenação; nulo vai sempre para o fim. */
function valor(u: ResumoUsuarioRh, coluna: Coluna): string | number | null {
  switch (coluna) {
    case "nome":
      return nomeDe(u).toLowerCase();
    case "checklist":
      return u.ultimo_acesso_checklist_em ? new Date(u.ultimo_acesso_checklist_em).getTime() : null;
    case "prazo":
      return fracaoNoPrazo(u);
    case "tempo":
      return u.tempo_medio_horas;
    default:
      return u[coluna];
  }
}

function ordenar(lista: ResumoUsuarioRh[], { coluna, crescente }: Ordem) {
  return [...lista].sort((a, b) => {
    const va = valor(a, coluna);
    const vb = valor(b, coluna);
    if (va === null || vb === null) return va === vb ? 0 : va === null ? 1 : -1;
    const comparacao = va < vb ? -1 : va > vb ? 1 : 0;
    return crescente ? comparacao : -comparacao;
  });
}

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const CAMPO = "rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

type Props = { usuarios: ResumoUsuarioRh[]; agora: number; onAbrir: (u: ResumoUsuarioRh) => void };

export function TabelaUsuariosRh({ usuarios, agora, onAbrir }: Props) {
  const [busca, setBusca] = useState("");
  const [setor, setSetor] = useState("");
  const [ordem, setOrdem] = useState<Ordem>({ coluna: "nome", crescente: true });
  const setores = useMemo(() => [...new Set(usuarios.flatMap((u) => u.setores))].sort(), [usuarios]);

  const termo = normalizar(busca.trim());
  const visiveis = ordenar(
    usuarios.filter(
      (u) =>
        (!setor || u.setores.includes(setor)) &&
        (!termo || normalizar(`${u.nome ?? ""} ${u.email ?? ""}`).includes(termo)),
    ),
    ordem,
  );

  function ordenarPor(coluna: Coluna) {
    // Números começam do maior; texto e datas, em ordem natural.
    const primeiraVezCrescente = coluna === "nome";
    setOrdem((o) => (o.coluna === coluna ? { coluna, crescente: !o.crescente } : { coluna, crescente: primeiraVezCrescente }));
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/3">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
        <h2 className="mr-auto font-semibold">Pessoas com acesso ao checklist</h2>
        <label className="relative min-w-56 flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            aria-label="Buscar pessoa"
            className={`${CAMPO} w-full pl-9`}
          />
        </label>
        <select aria-label="Filtrar por setor" value={setor} onChange={(e) => setSetor(e.target.value)} className={CAMPO}>
          <option value="">Setor: todos</option>
          {setores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {visiveis.length === 0 ? (
        <EmptyState title="Ninguém encontrado" description="Ajuste a busca ou o setor." compact />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
              <tr>
                {COLUNAS.map((c) => (
                  <th key={c.id} className={`px-4 py-3 font-medium ${c.numero ? "text-right" : ""}`} aria-sort={
                    ordem.coluna === c.id ? (ordem.crescente ? "ascending" : "descending") : "none"
                  }>
                    <button
                      type="button"
                      onClick={() => ordenarPor(c.id)}
                      className={`inline-flex items-center gap-1 uppercase hover:text-white ${ordem.coluna === c.id ? "text-white/80" : ""}`}
                    >
                      {c.rotulo}
                      {ordem.coluna === c.id &&
                        (ordem.crescente ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((u) => (
                <tr
                  key={u.usuario_id}
                  onClick={() => onAbrir(u)}
                  className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/4"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nome={u.nome} email={u.email} />
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{nomeDe(u)}</p>
                        <SetoresChips setores={u.setores} />
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <AcessoRelativo iso={u.ultimo_acesso_checklist_em} agora={agora} alertar />
                  </td>
                  <td className="px-4 py-3 text-right text-white/80">{u.pendentes}</td>
                  <td className="px-4 py-3 text-right">
                    <NumeroAlerta valor={u.criticos} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <NumeroAlerta valor={u.vencidos} />
                  </td>
                  <td className="px-4 py-3 text-right text-white/80">{u.concluidas}</td>
                  <td className="px-4 py-3 text-right">
                    <PercentualPrazo usuario={u} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-white/70">{formatarHoras(u.tempo_medio_horas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
