import type { BadgeVariant } from "@/components/ui/Badge";
import { FERRAMENTAS } from "@/lib/ferramentas";
import type {
  Notificacao,
  NotificacaoFormato,
  NotificacaoNivel,
  NotificacaoPublico,
  Usuario,
  UsuarioSetor,
} from "@/lib/types/shell";

export const NIVEIS_NOTIFICACAO: Array<{ value: NotificacaoNivel; label: string; cor: BadgeVariant }> = [
  { value: "informacao", label: "Informação", cor: "info" },
  { value: "sucesso", label: "Sucesso", cor: "success" },
  { value: "atencao", label: "Atenção", cor: "warning" },
  { value: "critico", label: "Crítico", cor: "danger" },
];

export const FORMATOS_NOTIFICACAO: Array<{ value: NotificacaoFormato; label: string; descricao: string }> = [
  { value: "faixa", label: "Faixa", descricao: "Barra no topo da tela." },
  { value: "aviso", label: "Aviso", descricao: "Cartão no canto, some ao fechar." },
  { value: "janela", label: "Janela", descricao: 'Exige clicar em "Entendi".' },
];

export const PUBLICOS_NOTIFICACAO: Array<{ value: NotificacaoPublico; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "setores", label: "Setores" },
  { value: "usuarios", label: "Usuários específicos" },
];

/** Telas onde uma notificação pode aparecer (coluna modulos). */
export const TELAS_NOTIFICACAO: Array<{ value: string; label: string }> = [
  { value: "inicio", label: "Início" },
  ...FERRAMENTAS.map((f) => ({ value: f.id as string, label: f.label })),
  { value: "admin", label: "Admin" },
];

export type SituacaoNotificacao = "ativa" | "agendada" | "encerrada";

type Periodo = Pick<Notificacao, "ativa" | "inicio_em" | "fim_em">;

export function situacaoNotificacao(n: Periodo, agora = new Date()): SituacaoNotificacao {
  const t = agora.getTime();
  if (!n.ativa || (n.fim_em && new Date(n.fim_em).getTime() <= t)) return "encerrada";
  if (new Date(n.inicio_em).getTime() > t) return "agendada";
  return "ativa";
}

/** Reativar só faz sentido se foi encerrada por ativa = false e o período ainda não acabou. */
export function podeReativarNotificacao(n: Pick<Notificacao, "ativa" | "fim_em">, agora = new Date()) {
  return !n.ativa && (!n.fim_em || new Date(n.fim_em).getTime() > agora.getTime());
}

/** Janela exige confirmação ("Entendi"); faixa e aviso só registram visualização. */
export function exigeConfirmacao(formato: NotificacaoFormato) {
  return formato === "janela";
}

export function rotuloNivel(nivel: string) {
  return NIVEIS_NOTIFICACAO.find((n) => n.value === nivel)?.label ?? nivel;
}

export function corNivel(nivel: string): BadgeVariant {
  return NIVEIS_NOTIFICACAO.find((n) => n.value === nivel)?.cor ?? "neutral";
}

export function rotuloFormato(formato: string) {
  return FORMATOS_NOTIFICACAO.find((f) => f.value === formato)?.label ?? formato;
}

type Publico = Pick<Notificacao, "publico" | "setores_ids" | "usuarios_ids">;

export function rotuloPublico(n: Publico) {
  if (n.publico === "setores") {
    const qtd = n.setores_ids?.length ?? 0;
    return `${qtd} ${qtd === 1 ? "setor" : "setores"}`;
  }
  if (n.publico === "usuarios") {
    const qtd = n.usuarios_ids?.length ?? 0;
    return `${qtd} ${qtd === 1 ? "usuário" : "usuários"}`;
  }
  return "Todos";
}

export function rotuloTelas(modulos: string[] | null) {
  if (!modulos || modulos.length === 0) return "Todas as telas";
  return modulos.map((m) => TELAS_NOTIFICACAO.find((t) => t.value === m)?.label ?? m).join(", ");
}

/** Usuários aprovados que devem ver a notificação, sem repetir. */
export function usuariosDoPublico<U extends Pick<Usuario, "id" | "status">>(
  n: Publico,
  usuarios: U[],
  usuarioSetores: UsuarioSetor[],
): U[] {
  const aprovados = usuarios.filter((u) => u.status === "aprovado");
  if (n.publico === "todos") return aprovados;
  if (n.publico === "usuarios") {
    const escolhidos = new Set(n.usuarios_ids ?? []);
    return aprovados.filter((u) => escolhidos.has(u.id));
  }
  const setores = new Set(n.setores_ids ?? []);
  const membros = new Set(usuarioSetores.filter((v) => setores.has(v.setor_id)).map((v) => v.usuario_id));
  return aprovados.filter((u) => membros.has(u.id));
}

/** `telaAtual` nulo ignora o filtro de telas (ex.: mural da tela inicial). */
export function notificacaoVisivelPara(
  n: Periodo & Publico & Pick<Notificacao, "modulos">,
  usuarioId: string,
  setoresDoUsuario: string[],
  telaAtual: string | null,
  agora = new Date(),
) {
  if (situacaoNotificacao(n, agora) !== "ativa") return false;

  const noPublico =
    n.publico === "todos" ||
    (n.publico === "usuarios" && (n.usuarios_ids ?? []).includes(usuarioId)) ||
    (n.publico === "setores" && (n.setores_ids ?? []).some((s) => setoresDoUsuario.includes(s)));
  if (!noPublico) return false;

  return telaAtual === null || !n.modulos || n.modulos.length === 0 || n.modulos.includes(telaAtual);
}

const PESO_NIVEL: Record<NotificacaoNivel, number> = { critico: 0, atencao: 1, informacao: 2, sucesso: 3 };

/** Mais críticas primeiro; no mesmo nível, as mais recentes. */
export function ordenarPorCriticidade<T extends Pick<Notificacao, "nivel" | "inicio_em">>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) => PESO_NIVEL[a.nivel] - PESO_NIVEL[b.nivel] || new Date(b.inicio_em).getTime() - new Date(a.inicio_em).getTime(),
  );
}
