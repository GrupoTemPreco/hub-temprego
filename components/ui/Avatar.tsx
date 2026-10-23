import { iniciais } from "@/lib/format";

const CORES = [
  "bg-blue-500/25 text-blue-200",
  "bg-violet-500/25 text-violet-200",
  "bg-emerald-500/25 text-emerald-200",
  "bg-amber-500/25 text-amber-200",
  "bg-rose-500/25 text-rose-200",
  "bg-cyan-500/25 text-cyan-200",
];

function corPorTexto(texto: string) {
  let soma = 0;
  for (const c of texto) soma += c.charCodeAt(0);
  return CORES[soma % CORES.length];
}

type AvatarProps = {
  nome: string | null;
  email?: string | null;
  size?: "xs" | "sm" | "lg";
  title?: string;
};

const TAMANHOS = { xs: "h-5 w-5 text-[9px]", sm: "h-8 w-8 text-xs", lg: "h-12 w-12 text-base" };

export function Avatar({ nome, email, size = "sm", title }: AvatarProps) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${TAMANHOS[size]} ${corPorTexto(
        nome || email || "?",
      )}`}
    >
      {iniciais(nome, email)}
    </span>
  );
}
