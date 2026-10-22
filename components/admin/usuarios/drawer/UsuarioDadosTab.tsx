"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { salvarDadosUsuario, type DadosUsuarioEditaveis, type UsuarioLista } from "@/lib/admin/usuarios";
import type { UsuarioStatus } from "@/lib/types/shell";

const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

type Props = { usuario: UsuarioLista; onAtualizado: () => Promise<void> };

export function UsuarioDadosTab({ usuario, onAtualizado }: Props) {
  const toast = useToast();
  const ehVoceMesmo = useUsuarioAtual().id === usuario.id;
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<DadosUsuarioEditaveis>({
    nome: usuario.nome,
    email: usuario.email,
    status: usuario.status,
    is_admin: Boolean(usuario.is_admin),
    recebe_tickets: Boolean(usuario.recebe_tickets),
  });

  async function salvar() {
    setSalvando(true);
    try {
      const alterou = await salvarDadosUsuario(usuario, {
        ...form,
        nome: form.nome?.trim() || null,
        email: form.email?.trim() || null,
      });
      if (!alterou) {
        toast.success("Nenhuma alteração para salvar.");
        return;
      }
      toast.success("Dados do usuário atualizados.");
      await onAtualizado();
    } catch (err) {
      toast.error(`Erro ao salvar dados: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-white/70">Nome</span>
        <input
          className={CAMPO}
          value={form.nome ?? ""}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-white/70">E-mail</span>
        <input
          type="email"
          className={CAMPO}
          value={form.email ?? ""}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-white/70">Status</span>
        <select
          className={`${CAMPO} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={ehVoceMesmo}
          value={form.status ?? ""}
          onChange={(e) => setForm({ ...form, status: e.target.value as UsuarioStatus })}
        >
          {!form.status && <option value="">Sem status</option>}
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="rejeitado">Rejeitado</option>
        </select>
      </label>

      <div className="divide-y divide-white/10 rounded-lg border border-white/10">
        <div className="flex items-center justify-between gap-4 p-3">
          <div>
            <p className="text-sm font-medium">Administrador</p>
            <p className="text-xs text-white/50">Acesso total ao painel admin.</p>
          </div>
          <Toggle
            label="Administrador"
            disabled={ehVoceMesmo}
            checked={Boolean(form.is_admin)}
            onChange={(v) => setForm({ ...form, is_admin: v })}
          />
        </div>
        {ehVoceMesmo && (
          <p className="bg-amber-500/7 px-3 py-2 text-xs text-amber-200/90">
            Este é o seu usuário. Não é possível remover o seu próprio acesso de administrador nem alterar o seu
            status.
          </p>
        )}
        <div className="flex items-center justify-between gap-4 p-3">
          <div>
            <p className="text-sm font-medium">Recebe tickets</p>
            <p className="text-xs text-white/50">Pode ser escolhido como destino de tickets.</p>
          </div>
          <Toggle
            label="Recebe tickets"
            checked={Boolean(form.recebe_tickets)}
            onChange={(v) => setForm({ ...form, recebe_tickets: v })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
