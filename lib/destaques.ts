import { supabase } from "@/lib/supabase";
import type { DestaqueCor, DestaqueMenu } from "@/lib/types/shell";

export const CORES_DESTAQUE: Array<{ value: DestaqueCor; label: string; selo: string; ponto: string }> = [
  {
    value: "verde",
    label: "Verde",
    selo: "border-emerald-200/70 bg-emerald-500/55 shadow-[0_0_14px_rgba(52,211,153,0.55)]",
    ponto: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  },
  {
    value: "azul",
    label: "Azul",
    selo: "border-sky-200/70 bg-sky-500/55 shadow-[0_0_14px_rgba(56,189,248,0.55)]",
    ponto: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
  },
  {
    value: "laranja",
    label: "Laranja",
    selo: "border-orange-200/70 bg-orange-500/60 shadow-[0_0_14px_rgba(251,146,60,0.55)]",
    ponto: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]",
  },
  {
    value: "vermelho",
    label: "Vermelho",
    selo: "border-rose-200/70 bg-rose-500/60 shadow-[0_0_14px_rgba(244,63,94,0.55)]",
    ponto: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
  },
  {
    value: "roxo",
    label: "Roxo",
    selo: "border-violet-200/70 bg-violet-500/60 shadow-[0_0_14px_rgba(167,139,250,0.55)]",
    ponto: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]",
  },
];

export const TEXTO_DESTAQUE_MAX = 12;

export function estiloCor(cor: DestaqueCor) {
  return CORES_DESTAQUE.find((c) => c.value === cor) ?? CORES_DESTAQUE[0];
}

export type SituacaoDestaque = "vigente" | "agendado" | "encerrado";

export function situacaoDestaque(d: Pick<DestaqueMenu, "ativo" | "inicio_em" | "fim_em">, agora = new Date()) {
  const t = agora.getTime();
  if (!d.ativo || (d.fim_em && new Date(d.fim_em).getTime() <= t)) return "encerrado";
  if (new Date(d.inicio_em).getTime() > t) return "agendado";
  return "vigente";
}

/** Reativar só faz sentido se foi encerrado manualmente e o período ainda não acabou. */
export function podeReativarDestaque(d: Pick<DestaqueMenu, "ativo" | "fim_em">, agora = new Date()) {
  return !d.ativo && (!d.fim_em || new Date(d.fim_em).getTime() > agora.getTime());
}

/** Um destaque por ferramenta; havendo mais de um vigente, vale o mais recente. */
export function destaquesPorFerramenta(destaques: DestaqueMenu[], agora = new Date()) {
  const mapa = new Map<string, DestaqueMenu>();
  const vigentes = destaques
    .filter((d) => situacaoDestaque(d, agora) === "vigente")
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  for (const d of vigentes) if (!mapa.has(d.ferramenta_id)) mapa.set(d.ferramenta_id, d);
  return mapa;
}

export async function carregarDestaquesVigentes(): Promise<DestaqueMenu[]> {
  const agora = new Date().toISOString();
  const { data, error } = await supabase
    .from("destaques_menu")
    .select("*")
    .eq("ativo", true)
    .lte("inicio_em", agora)
    .or(`fim_em.is.null,fim_em.gt.${agora}`);
  if (error) throw new Error(error.message);
  return (data ?? []) as DestaqueMenu[];
}
