"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type UsuarioPendente = {
  id: string;
  nome: string | null;
  email: string | null;
  status: string;
};

type PermissaoKey =
  | "analytics.vendas"
  | "analytics.contas_a_pagar"
  | "checklist.preencher"
  | "checklist.preencher_supervisao"
  | "checklist.analise";

const PERMISSOES_DISPONIVEIS: Array<{
  key: PermissaoKey;
  label: string;
  modulo: string;
  item: string;
}> = [
  {
    key: "analytics.vendas",
    label: "Analytics > Vendas",
    modulo: "analytics",
    item: "vendas",
  },
  {
    key: "analytics.contas_a_pagar",
    label: "Analytics > Contas a Pagar",
    modulo: "analytics",
    item: "contas_a_pagar",
  },
  {
    key: "checklist.preencher",
    label: "Checklist > Preencher",
    modulo: "checklist",
    item: "preencher",
  },
  {
    key: "checklist.preencher_supervisao",
    label: "Checklist > Preencher Supervisão",
    modulo: "checklist",
    item: "preencher_supervisao",
  },
  {
    key: "checklist.analise",
    label: "Checklist > Análise",
    modulo: "checklist",
    item: "analise",
  },
];

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendentes, setPendentes] = useState<UsuarioPendente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioPendente[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedManageUserId, setSelectedManageUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPermissoesUsuario, setLoadingPermissoesUsuario] = useState(false);
  const [checks, setChecks] = useState<Record<PermissaoKey, boolean>>({
    "analytics.vendas": false,
    "analytics.contas_a_pagar": false,
    "checklist.preencher": false,
    "checklist.preencher_supervisao": false,
    "checklist.analise": false,
  });
  const [manageChecks, setManageChecks] = useState<Record<PermissaoKey, boolean>>({
    "analytics.vendas": false,
    "analytics.contas_a_pagar": false,
    "checklist.preencher": false,
    "checklist.preencher_supervisao": false,
    "checklist.analise": false,
  });

  const selectedUser = useMemo(
    () => pendentes.find((u) => u.id === selectedUserId) ?? null,
    [pendentes, selectedUserId],
  );
  const selectedManageUser = useMemo(
    () => usuarios.find((u) => u.id === selectedManageUserId) ?? null,
    [usuarios, selectedManageUserId],
  );

  async function carregarPendentes() {
    const { data, error: pendentesError } = await supabase
      .from("usuarios")
      .select("id, nome, email, status")
      .eq("status", "pendente")
      .order("nome", { ascending: true });

    if (pendentesError) {
      setError(pendentesError.message);
      return;
    }

    setPendentes((data ?? []) as UsuarioPendente[]);
  }

  async function carregarUsuarios() {
    const { data, error: usuariosError } = await supabase
      .from("usuarios")
      .select("id, nome, email, status")
      .order("nome", { ascending: true });

    if (usuariosError) {
      setError(usuariosError.message);
      return;
    }

    setUsuarios((data ?? []) as UsuarioPendente[]);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError("");
      setSuccess("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (perfilError || !perfil?.is_admin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      await carregarPendentes();
      await carregarUsuarios();
      setLoading(false);
    }

    init();
  }, [router]);

  function togglePermissao(key: PermissaoKey) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function togglePermissaoGerenciamento(key: PermissaoKey) {
    setManageChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function carregarPermissoesDoUsuario(userId: string) {
    setLoadingPermissoesUsuario(true);
    setError("");
    setSuccess("");

    const { data, error: permissoesError } = await supabase
      .from("permissoes")
      .select("modulo, item")
      .eq("user_id", userId);

    if (permissoesError) {
      setError(permissoesError.message);
      setLoadingPermissoesUsuario(false);
      return;
    }

    const temVendas = (data ?? []).some((p) => p.modulo === "analytics" && p.item === "vendas");
    const temContas = (data ?? []).some(
      (p) => p.modulo === "analytics" && p.item === "contas_a_pagar",
    );
    const temChecklistPreencher = (data ?? []).some(
      (p) => p.modulo === "checklist" && p.item === "preencher",
    );
    const temChecklistPreencherSupervisao = (data ?? []).some(
      (p) => p.modulo === "checklist" && p.item === "preencher_supervisao",
    );
    const temChecklistAnalise = (data ?? []).some(
      (p) => p.modulo === "checklist" && p.item === "analise",
    );

    setManageChecks({
      "analytics.vendas": temVendas,
      "analytics.contas_a_pagar": temContas,
      "checklist.preencher": temChecklistPreencher,
      "checklist.preencher_supervisao": temChecklistPreencherSupervisao,
      "checklist.analise": temChecklistAnalise,
    });
    setLoadingPermissoesUsuario(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleRejeitar(userId: string) {
    setSaving(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ status: "rejeitado" })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setPendentes((prev) => prev.filter((u) => u.id !== userId));
    if (selectedUserId === userId) setSelectedUserId(null);
    setSuccess("Usuario rejeitado com sucesso.");
    setSaving(false);
  }

  async function handleConfirmarAprovacao() {
    if (!selectedUserId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ status: "aprovado" })
      .eq("id", selectedUserId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("permissoes")
      .delete()
      .eq("user_id", selectedUserId);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    const permissoesSelecionadas = PERMISSOES_DISPONIVEIS.filter((p) => checks[p.key]).map((p) => ({
      user_id: selectedUserId,
      modulo: p.modulo,
      item: p.item,
    }));

    if (permissoesSelecionadas.length > 0) {
      const { error: insertError } = await supabase
        .from("permissoes")
        .insert(permissoesSelecionadas);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setPendentes((prev) => prev.filter((u) => u.id !== selectedUserId));
    setSelectedUserId(null);
    setChecks({
      "analytics.vendas": false,
      "analytics.contas_a_pagar": false,
      "checklist.preencher": false,
      "checklist.preencher_supervisao": false,
      "checklist.analise": false,
    });
    setSuccess("Usuario aprovado e permissoes salvas com sucesso.");
    setSaving(false);
  }

  async function handleSalvarPermissoesUsuario() {
    if (!selectedManageUserId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("permissoes")
      .delete()
      .eq("user_id", selectedManageUserId);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    const permissoesSelecionadas = PERMISSOES_DISPONIVEIS.filter((p) => manageChecks[p.key]).map((p) => ({
      user_id: selectedManageUserId,
      modulo: p.modulo,
      item: p.item,
    }));

    if (permissoesSelecionadas.length > 0) {
      const { error: insertError } = await supabase.from("permissoes").insert(permissoesSelecionadas);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSuccess("Permissoes atualizadas com sucesso.");
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Carregando painel admin...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-[#020617] text-white">
      <aside className="flex w-52 flex-col border-r border-white/10 bg-[#020617] p-4">
        <img src="/logoC.png" alt="Logo Tempreço" className="-ml-7 -mt-14 -mb-9 h-48 w-auto object-contain" />

        <div className="space-y-1">
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-lg px-2 py-2 text-left text-base font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Inicio
          </button>
          <button className="w-full rounded-lg bg-white/15 px-2 py-2 text-left text-base font-medium text-white">
            Admin
          </button>
        </div>

        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-2 py-2 text-left text-sm text-white/60 hover:bg-white/10 hover:text-white"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-semibold">Admin</h1>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {success && <p className="mb-4 text-sm text-emerald-400">{success}</p>}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-white/15 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-medium">Usuarios pendentes</h2>

            {pendentes.length === 0 ? (
              <p className="text-sm text-white/70">Nenhum usuario pendente.</p>
            ) : (
              <div className="space-y-3">
                {pendentes.map((usuario) => (
                  <div key={usuario.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="font-medium">{usuario.nome || "Sem nome"}</p>
                    <p className="text-sm text-white/70">{usuario.email}</p>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUserId(usuario.id);
                          setError("");
                          setSuccess("");
                        }}
                        disabled={saving}
                        className="rounded-md bg-cyan-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-400 disabled:opacity-50"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleRejeitar(usuario.id)}
                        disabled={saving}
                        className="rounded-md bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-400 disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-white/15 bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-medium">Permissoes de acesso</h2>

            {!selectedUser ? (
              <p className="text-sm text-white/70">
                Clique em "Aprovar" em um usuario para definir permissoes.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-white/80">
                  Usuario selecionado:{" "}
                  <span className="font-medium">{selectedUser.nome || selectedUser.email}</span>
                </p>

                <div className="space-y-2">
                  {PERMISSOES_DISPONIVEIS.map((permissao) => (
                    <label key={permissao.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checks[permissao.key]}
                        onChange={() => togglePermissao(permissao.key)}
                      />
                      {permissao.label}
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleConfirmarAprovacao}
                  disabled={saving}
                  className="mt-4 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
                >
                  Confirmar aprovacao
                </button>
              </>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
          <h2 className="mb-3 text-lg font-medium">Gerenciar usuarios</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              {usuarios.length === 0 ? (
                <p className="text-sm text-white/70">Nenhum usuario encontrado.</p>
              ) : (
                usuarios.map((usuario) => (
                  <button
                    key={usuario.id}
                    onClick={async () => {
                      setSelectedManageUserId(usuario.id);
                      await carregarPermissoesDoUsuario(usuario.id);
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      selectedManageUserId === usuario.id
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-medium">{usuario.nome || "Sem nome"}</p>
                    <p className="text-sm text-white/70">{usuario.email}</p>
                    <p className="text-xs text-white/50">Status: {usuario.status || "sem status"}</p>
                  </button>
                ))
              )}
            </div>

            <div>
              {!selectedManageUser ? (
                <p className="text-sm text-white/70">
                  Selecione um usuario para editar as permissoes.
                </p>
              ) : loadingPermissoesUsuario ? (
                <p className="text-sm text-white/70">Carregando permissoes...</p>
              ) : (
                <>
                  <p className="mb-3 text-sm text-white/80">
                    Editando:{" "}
                    <span className="font-medium">
                      {selectedManageUser.nome || selectedManageUser.email}
                    </span>
                  </p>

                  <div className="space-y-2">
                    {PERMISSOES_DISPONIVEIS.map((permissao) => (
                      <label key={permissao.key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={manageChecks[permissao.key]}
                          onChange={() => togglePermissaoGerenciamento(permissao.key)}
                        />
                        {permissao.label}
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleSalvarPermissoesUsuario}
                    disabled={saving}
                    className="mt-4 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400 disabled:opacity-50"
                  >
                    Salvar permissoes
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
