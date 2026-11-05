"use client";

import { Building2, Users } from "lucide-react";
import type { DestinoEnvio, NovoEnvio } from "@/lib/checklistEnvios";
import type { ChecklistEnvioModo } from "@/lib/types/shell";
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
  /** Só entra no envio quando há mais de uma pessoa ou um setor. */
  distribuicao: ChecklistEnvioModo;
};

export function formEnvioInicial(prazo: string | null = null): FormEnvio {
  return { modo: "pessoas", pessoas: [], setorId: null, mensagem: "", prazo: prazo ?? "", distribuicao: "primeiro" };
}

export function destinoDoForm(form: FormEnvio): DestinoEnvio | null {
  if (form.modo === "setor") return form.setorId ? { tipo: "setor", setorId: form.setorId } : null;
  return form.pessoas.length > 0 ? { tipo: "pessoas", ids: form.pessoas } : null;
}

export function variosDestinos(form: FormEnvio) {
  return (form.modo === "pessoas" && form.pessoas.length > 1) || (form.modo === "setor" && Boolean(form.setorId));
}

/** Dados do envio para a RPC; nulo enquanto não houver destino. */
export function dadosDoEnvio(itemId: string, form: FormEnvio): NovoEnvio | null {
  const destino = destinoDoForm(form);
  if (!destino) return null;
  return {
    itemId,
    destino,
    mensagem: form.mensagem.trim() || null,
    prazoSugerido: form.prazo || null,
    modo: variosDestinos(form) ? form.distribuicao : "primeiro",
  };
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

type Props = {
  form: FormEnvio;
  onChange: (form: FormEnvio) => void;
  /** Envio de lista: sem prazo sugerido, e o texto de apoio fala da lista. */
  lista?: boolean;
};

/** Destino (pessoas ou setor), mensagem e prazo sugerido; comuns a "Enviar para…", "Enviar tarefa" e "Enviar lista". */
export function CamposEnvio({ form, onChange, lista = false }: Props) {
  const { destinatarios, setores } = useChecklistEnvios();
  const alterar = (mudancas: Partial<FormEnvio>) => onChange({ ...form, ...mudancas });
  const varios = variosDestinos(form);

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
        {varios && (
          <fieldset className="space-y-1.5 rounded-lg border border-white/10 bg-white/3 p-2.5">
            <legend className="px-0.5 text-xs text-white/60">Como enviar</legend>
            {(
              [
                ["primeiro", "Quem aceitar primeiro fica com ela"],
                ["todos", "Todos recebem uma cópia"],
              ] as const
            ).map(([valor, rotulo]) => (
              <label key={valor} className="flex cursor-pointer items-start gap-2 text-sm text-white/85">
                <input
                  type="radio"
                  name={`distribuicao-envio-${lista ? "lista" : "tarefa"}`}
                  className="mt-0.5 accent-blue-500"
                  checked={form.distribuicao === valor}
                  onChange={() => alterar({ distribuicao: valor })}
                />
                {rotulo}
              </label>
            ))}
            {lista && form.distribuicao === "todos" && (
              <p className="text-xs text-white/55">
                Cada pessoa recebe uma cópia da lista. O que você mudar depois não chega nas cópias.
              </p>
            )}
          </fieldset>
        )}
      </div>
      <Campo rotulo="Mensagem (opcional)">
        <textarea
          rows={2}
          className={`${CAMPO} resize-y`}
          value={form.mensagem}
          onChange={(e) => alterar({ mensagem: e.target.value })}
        />
      </Campo>
      {!lista && (
        <Campo rotulo="Prazo sugerido (opcional)">
          <input type="date" className={CAMPO} value={form.prazo} onChange={(e) => alterar({ prazo: e.target.value })} />
        </Campo>
      )}
    </>
  );
}
