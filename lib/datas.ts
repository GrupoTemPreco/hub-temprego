export const FUSO = "America/Sao_Paulo";

const formatadorPartes = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partesSP(data: Date) {
  const p = Object.fromEntries(formatadorPartes.formatToParts(data).map((x) => [x.type, x.value]));
  return { ano: +p.year, mes: +p.month, dia: +p.day, hora: +p.hour, minuto: +p.minute };
}

/** Diferença em minutos entre o horário de São Paulo e UTC no instante informado. */
function offsetSP(data: Date) {
  const p = partesSP(data);
  const comoUtc = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
  const instante = Math.floor(data.getTime() / 60000) * 60000;
  return (comoUtc - instante) / 60000;
}

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** ISO (timestamptz) -> valor de <input type="datetime-local"> no horário de São Paulo. */
export function isoParaInputSP(iso: string | null | undefined): string {
  if (!iso) return "";
  const p = partesSP(new Date(iso));
  return `${p.ano}-${doisDigitos(p.mes)}-${doisDigitos(p.dia)}T${doisDigitos(p.hora)}:${doisDigitos(p.minuto)}`;
}

/** Valor de <input type="datetime-local"> (horário de São Paulo) -> ISO em UTC. */
export function inputSPParaIso(valor: string): string {
  const [data, hora = "00:00"] = valor.split("T");
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const comoUtc = Date.UTC(ano, mes - 1, dia, h, m);
  let instante = comoUtc - offsetSP(new Date(comoUtc)) * 60000;
  const ajuste = offsetSP(new Date(instante));
  instante = comoUtc - ajuste * 60000;
  return new Date(instante).toISOString();
}

export function agoraInputSP(deslocamentoDias = 0): string {
  return isoParaInputSP(new Date(Date.now() + deslocamentoDias * 24 * 60 * 60 * 1000).toISOString());
}

export function formatarDataHoraSP(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" });
}
