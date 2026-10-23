"use client";

import { Building2, Users } from "lucide-react";
import type { DestinoEnvio, NovoEnvio } from "@/lib/checklistEnvios";
import { CAMPO, Campo } from "../Campos";
import { SeletorPessoas } from "./SeletorPessoa";
import { SeletorSetor } from "./SeletorSetor";
import { useChecklistEnvios } from "./ChecklistEnviosProvider";

export type FormEnvio = {
  modo: "pessoas" | "setor";
  pessoas: string[];
  setorId: string | null;
  mensagem: string;
  prazo: string;
};

export function formEnvioInicial(prazo: string | null = null): FormEnvio {
  return { modo: "pessoas", pessoas: [], setorId: null, mensagem: "", prazo: prazo ?? "" };
}

export function destinoDoForm(form: FormEnvio): DestinoEnvio | null {
  if (form.modo === "setor") return form.setorId ? { tipo: "setor", setorId: form.setorId } : null;
  return form.pessoas.length > 0 ? { tipo: "pessoas", ids: form.pessoas } : null;
}

/** Dados do envio para a RPC; nulo enquanto não houver destino. */
export function dadosDoEnvio(itemId: string, form: FormEnvio): NovoEnvio | null {
  const destino = destinoDoForm(form);
  if (!destino) return null;
  return { itemId, destino, mensagem: form.mensagem.trim() || null, prazoSugerido: form.prazo || null };
}

/** Para o toast de sucesso: "Ana", "3 pessoas" ou "o setor Financeiro". */
export function textoDestino(
  form: FormEnvio,
  nomes: { nomeDe: (id: string | null) => string; nomeSetor: (id: string | null) => string },
) {
  if (form.modo === "setor") return `o setor ${nomes.nomeSetor(form.setorId)}`;
  return form.pessoas.length === 1 ? nomes.nomeDe(form.pessoas[0]) : `${form.pessoas.length} pessoas`;
}

const ABA = "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

type Props = { form: FormEnvio; onChange: (form: FormEnvio) => void };

/** Destino (pessoas ou setor), mensagem e prazo sugerido; comuns a "Enviar para…" e "Enviar tarefa". */
export function CamposEnvio({ form, onChange }: Props) {
  const { destinatarios, setores } = useChecklistEnvios();
  const alterar = (mudancas: Partial<FormEnvio>) => onChange({ ...form, ...mudancas });
  const varios = (form.modo === "pessoas" && form.pessoas.length > 1) || (form.modo === "setor" && Boolean(form.setorId));

  return (
    <>
      <div className="space-y-2">
        <div role="tablist" aria-label="Enviar para" className="flex gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
          {(["pessoas", "setor"] as const).map((modo) => (
            <button
              key={modo}
              type="button"
              role="tab"
              aria-selected={form.modo === modo}
              onClick={() => alterar({ modo })}
              className={`${ABA} ${form.modo === modo ? "bg-blue-600 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              {modo === "pessoas" ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              {modo === "pessoas" ? "Pessoas" : "Setor"}
            </button>
          ))}
        </div>
        {form.modo === "pessoas" ? (
          <SeletorPessoas pessoas={destinatarios} valores={form.pessoas} onChange={(pessoas) => alterar({ pessoas })} />
        ) : (
          <SeletorSetor setores={setores} valor={form.setorId} onChange={(setorId) => alterar({ setorId })} />
        )}
        {varios && <p className="text-xs text-blue-200/80">Todos recebem; quem aceitar primeiro fica com a tarefa.</p>}
      </div>
      <Campo rotulo="Mensagem (opcional)">
        <textarea
          rows={2}
          className={`${CAMPO} resize-y`}
          value={form.mensagem}
          onChange={(e) => alterar({ mensagem: e.target.value })}
        />
      </Campo>
      <Campo rotulo="Prazo sugerido (opcional)">
        <input type="date" className={CAMPO} value={form.prazo} onChange={(e) => alterar({ prazo: e.target.value })} />
      </Campo>
    </>
  );
}
