export type Ferramenta = {
  id: "estoque" | "financeiro" | "compras" | "checklist";
  modulo: string;
  item: string;
  label: string;
  url: string;
};

export type PermissaoUsuario = { modulo: string; item: string };

export type AcessoUsuario = {
  id: string;
  nome: string | null;
  isAdmin: boolean;
  permissoes: PermissaoUsuario[];
};

export const FERRAMENTAS: Ferramenta[] = [
  {
    id: "estoque",
    modulo: "analytics",
    item: "estoque",
    label: "Estoque",
    url: "https://estoque-seven-kappa.vercel.app/",
  },
  {
    id: "financeiro",
    modulo: "analytics",
    item: "contas_a_pagar",
    label: "Contas a Pagar",
    url: "https://dashboard-financeiro-zeta.vercel.app/",
  },
  {
    id: "compras",
    modulo: "analytics",
    item: "compras",
    label: "Compras",
    url: "https://dashboard-compras-kappa.vercel.app/",
  },
  {
    id: "checklist",
    modulo: "checklist",
    item: "preencher",
    label: "Checklist lojas",
    url: "https://checklist-nu-nine.vercel.app/checklist",
  },
];

export function buscarFerramenta(id: Ferramenta["id"]): Ferramenta {
  return FERRAMENTAS.find((f) => f.id === id)!;
}

/** Itens do submenu "Análises" da sidebar, com o rótulo exibido no menu. */
export const ITENS_ANALISES = [
  { id: "analise-estoque", label: "Estoque", app: buscarFerramenta("estoque") },
  { id: "analise-financeiro", label: "Financeiro", app: buscarFerramenta("financeiro") },
  { id: "analise-compras", label: "Compras", app: buscarFerramenta("compras") },
];

export function temPermissao(usuario: AcessoUsuario, modulo: string, item: string) {
  return usuario.permissoes.some((p) => p.modulo === modulo && p.item === item);
}

/** Rota nativa do monitoramento de tarefas do RH. */
export const ROTA_RH_MONITORAMENTO = "/rh/monitoramento";

/** Admin ou permissão rh/monitoramento (a mesma regra da RPC pode_monitorar_rh). */
export function podeMonitorarRh(usuario: AcessoUsuario) {
  return usuario.isAdmin || temPermissao(usuario, "rh", "monitoramento");
}

export function temPermissaoChecklist(usuario: AcessoUsuario) {
  return (
    usuario.isAdmin ||
    temPermissao(usuario, "checklist", "preencher") ||
    temPermissao(usuario, "checklist", "preencher_supervisao")
  );
}

export function podeAcessar(usuario: AcessoUsuario, app: Ferramenta) {
  return app.id === "checklist" ? temPermissaoChecklist(usuario) : temPermissao(usuario, app.modulo, app.item);
}

/** Nome da ferramenta como aparece no menu (ex.: "Financeiro" para Contas a Pagar). */
export function rotuloFerramentaMenu(appId: string) {
  return ITENS_ANALISES.find((i) => i.app.id === appId)?.label ?? FERRAMENTAS.find((f) => f.id === appId)?.label ?? appId;
}

export function srcIframe(app: Ferramenta, usuario: AcessoUsuario) {
  if (app.id === "compras") {
    const url = new URL(app.url);
    url.searchParams.set("uid", usuario.id);
    url.searchParams.set("nome", usuario.nome ?? "");
    return url.href;
  }

  if (app.id !== "checklist") return app.url;
  const perfil = usuario.isAdmin
    ? "admin"
    : temPermissao(usuario, "checklist", "preencher_supervisao")
      ? "supervisor"
      : "gerente";
  const url = new URL(app.url);
  url.searchParams.set("perfil", perfil);
  url.searchParams.set("uid", usuario.id);
  return url.href;
}
