"use client";

import { ChipsSelect } from "@/components/ui/ChipsSelect";
import type { Opcao } from "@/components/ui/OptionList";
import type { DestinoValor, SetorReferencia, UsuarioReferencia } from "@/lib/ticketsApi";
import { DestinoSelect } from "./DestinoSelect";

type Props = {
  /** Admin: várias pessoas ou um setor. Demais: um destino só. */
  multiplo: boolean;
  value: DestinoValor[];
  onChange: (destinos: DestinoValor[]) => void;
  setores: SetorReferencia[];
  pessoas: UsuarioReferencia[];
  className?: string;
};

/** Setor é destino único: escolher um setor substitui a seleção; escolher uma pessoa tira o setor. */
function aplicarRegra(atuais: DestinoValor[], novos: DestinoValor[]): DestinoValor[] {
  const adicionado = novos.find((v) => !atuais.includes(v));
  if (!adicionado) return novos;
  if (adicionado.startsWith("setor:")) return [adicionado];
  return novos.filter((v) => !v.startsWith("setor:"));
}

export function CampoDestino({ multiplo, value, onChange, setores, pessoas, className }: Props) {
  if (!multiplo) {
    return (
      <DestinoSelect
        className={className}
        value={value[0] ?? ""}
        onChange={(destino) => onChange([destino])}
        setores={setores}
        pessoas={pessoas}
      />
    );
  }

  const opcoes: Opcao[] = [
    ...setores.map((s) => ({ value: `setor:${s.id}`, label: s.nome, sublabel: "Setor", selo: s.ativo ? null : "inativo" })),
    ...pessoas.map((u) => ({ value: `usuario:${u.id}`, label: u.nome || u.email || "Usuário", sublabel: "Pessoa" })),
  ];

  return (
    <>
      <ChipsSelect
        opcoes={opcoes}
        values={value}
        onChange={(novos) => onChange(aplicarRegra(value, novos as DestinoValor[]))}
        adicionarLabel="Adicionar destino"
        vazio="Nenhum destino disponível."
      />
      <span className="mt-1 block text-xs text-white/40">
        Escolha um setor ou uma ou mais pessoas. Com várias pessoas, é criado um ticket para cada uma.
      </span>
    </>
  );
}
