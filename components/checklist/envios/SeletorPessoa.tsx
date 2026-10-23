"use client";

import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { PessoaChecklist } from "@/lib/checklistEnvios";

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const nomeDaPessoa = (p: PessoaChecklist) => p.nome || p.email || "Usuário";

type ListaProps = {
  pessoas: PessoaChecklist[];
  selecionados: string[];
  onEscolher: (id: string) => void;
};

/** Busca por nome e lista com avatar; usada pela escolha de uma pessoa e de várias. */
function ListaPessoas({ pessoas, selecionados, onEscolher }: ListaProps) {
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca.trim());
  const visiveis = termo ? pessoas.filter((p) => normalizar(`${p.nome ?? ""} ${p.email ?? ""}`).includes(termo)) : pessoas;

  return (
    <div className="overflow-hidden rounded-md border border-white/10">
      <label className="relative block border-b border-white/10">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pessoa..."
          aria-label="Buscar pessoa"
          className="w-full py-2 pl-9 pr-3 text-sm outline-none"
        />
      </label>
      <ul role="listbox" aria-label="Pessoas" aria-multiselectable={selecionados.length > 1} className="max-h-44 overflow-y-auto py-1">
        {pessoas.length === 0 && (
          <li className="px-3 py-2 text-sm text-white/45">Ninguém com acesso ao checklist para receber.</li>
        )}
        {pessoas.length > 0 && visiveis.length === 0 && <li className="px-3 py-2 text-sm text-white/45">Nada encontrado.</li>}
        {visiveis.map((p) => {
          const ativo = selecionados.includes(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={ativo}
                onClick={() => onEscolher(p.id)}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm hover:bg-white/10 ${
                  ativo ? "bg-blue-600/20 text-blue-100" : "text-white/85"
                }`}
              >
                <Avatar nome={p.nome} email={p.email} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{nomeDaPessoa(p)}</span>
                  {p.nome && p.email && <span className="block truncate text-xs text-white/45">{p.email}</span>}
                </span>
                {ativo && <Check className="h-4 w-4 shrink-0 text-blue-300" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type UmaProps = { pessoas: PessoaChecklist[]; valor: string | null; onChange: (id: string) => void };

/** Escolha de uma pessoa (ex.: compartilhar lista). */
export function SeletorPessoa({ pessoas, valor, onChange }: UmaProps) {
  return <ListaPessoas pessoas={pessoas} selecionados={valor ? [valor] : []} onEscolher={onChange} />;
}

type VariasProps = { pessoas: PessoaChecklist[]; valores: string[]; onChange: (ids: string[]) => void };

/** Escolha de várias pessoas, com chips das escolhidas (envio de tarefa). */
export function SeletorPessoas({ pessoas, valores, onChange }: VariasProps) {
  const alternar = (id: string) => onChange(valores.includes(id) ? valores.filter((v) => v !== id) : [...valores, id]);
  const escolhidas = valores.map((id) => pessoas.find((p) => p.id === id)).filter((p): p is PessoaChecklist => Boolean(p));

  return (
    <div className="space-y-2">
      {escolhidas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {escolhidas.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-600/20 py-0.5 pl-1 pr-1 text-xs text-blue-100"
            >
              <Avatar nome={p.nome} email={p.email} size="xs" />
              {nomeDaPessoa(p)}
              <button
                type="button"
                onClick={() => alternar(p.id)}
                aria-label={`Remover ${nomeDaPessoa(p)}`}
                className="rounded-full p-0.5 hover:bg-white/15"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <ListaPessoas pessoas={pessoas} selecionados={valores} onEscolher={alternar} />
    </div>
  );
}
