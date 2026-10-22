const MINUTO = 60;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

function plural(valor: number, singular: string, pluralForm: string) {
  return `${valor} ${valor === 1 ? singular : pluralForm}`;
}

/** "há 12 minutos", "há 2 horas", "há 3 dias"... */
export function tempoRelativo(dataIso: string, agora: Date = new Date()): string {
  const segundos = Math.max(0, Math.floor((agora.getTime() - new Date(dataIso).getTime()) / 1000));

  if (segundos < MINUTO) return "agora mesmo";
  if (segundos < HORA) return `há ${plural(Math.floor(segundos / MINUTO), "minuto", "minutos")}`;
  if (segundos < DIA) return `há ${plural(Math.floor(segundos / HORA), "hora", "horas")}`;
  if (segundos < 30 * DIA) return `há ${plural(Math.floor(segundos / DIA), "dia", "dias")}`;
  if (segundos < 365 * DIA) return `há ${plural(Math.floor(segundos / (30 * DIA)), "mês", "meses")}`;
  return `há ${plural(Math.floor(segundos / (365 * DIA)), "ano", "anos")}`;
}

/** "512 B", "850 KB", "1,2 MB", "5,9 GB" */
export function formatarTamanho(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
  return `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
}

export function formatarData(dataIso: string | null): string {
  if (!dataIso) return "—";
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

export function iniciais(nome: string | null, email?: string | null): string {
  const base = (nome || email || "?").trim();
  const partes = base.split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** "em_atendimento" -> "Em atendimento" */
export function rotuloStatus(status: string | null): string {
  if (!status) return "Sem status";
  const texto = status.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
