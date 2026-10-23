"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { UsuarioStatusBadge } from "../../StatusBadges";
import type { UsuarioLista } from "@/lib/admin/usuarios";
import type { Setor } from "@/lib/types/shell";
import { UsuarioDadosTab } from "./UsuarioDadosTab";
import { UsuarioSetoresTab } from "./UsuarioSetoresTab";
import { UsuarioPermissoesTab } from "./UsuarioPermissoesTab";
import { UsuarioAcessoTab } from "./UsuarioAcessoTab";
import { UsuarioAtividadeTab } from "./UsuarioAtividadeTab";

export type AbaUsuario = "dados" | "setores" | "permissoes" | "acesso" | "atividade";

const ABAS: TabItem<AbaUsuario>[] = [
  { id: "dados", label: "Dados" },
  { id: "setores", label: "Setores" },
  { id: "permissoes", label: "Permissões" },
  { id: "acesso", label: "Acesso" },
  { id: "atividade", label: "Atividade" },
];

type Props = {
  usuario: UsuarioLista;
  setores: Setor[];
  abaInicial: AbaUsuario;
  onClose: () => void;
  onAtualizado: () => Promise<void>;
};

export function UsuarioDrawer({ usuario, setores, abaInicial, onClose, onAtualizado }: Props) {
  const [aba, setAba] = useState<AbaUsuario>(abaInicial);

  return (
    <Drawer open onClose={onClose} title="Detalhes do usuário">
      <div className="flex items-center gap-3 px-5 pt-5">
        <Avatar nome={usuario.nome} email={usuario.email} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{usuario.nome || "Sem nome"}</p>
          <p className="truncate text-sm text-white/55">{usuario.email}</p>
        </div>
        <UsuarioStatusBadge status={usuario.status} />
      </div>

      <div className="mt-4 px-5">
        <Tabs items={ABAS} value={aba} onChange={setAba} variant="underline" />
      </div>

      <div className="p-5">
        {aba === "dados" && <UsuarioDadosTab usuario={usuario} onAtualizado={onAtualizado} />}
        {aba === "setores" && <UsuarioSetoresTab usuario={usuario} setores={setores} onAtualizado={onAtualizado} />}
        {aba === "permissoes" && <UsuarioPermissoesTab usuario={usuario} onAtualizado={onAtualizado} />}
        {aba === "acesso" && <UsuarioAcessoTab key={usuario.id} usuario={usuario} />}
        {aba === "atividade" && <UsuarioAtividadeTab usuarioId={usuario.id} />}
      </div>
    </Drawer>
  );
}
