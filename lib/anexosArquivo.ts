import { formatarTamanho } from "@/lib/format";

// Precisa bater com a configuração do bucket tickets-anexos no Supabase.
export const LIMITE_BYTES_ANEXO = 10 * 1024 * 1024;
export const MAX_ANEXOS_POR_ENVIO = 5;

/** O tipo enviado ao Storage sai da extensão: o navegador às vezes informa vazio ou outro tipo (ex.: CSV no Windows). */
const TIPOS_POR_EXTENSAO: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  csv: "text/csv",
  txt: "text/plain",
};

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ACCEPT_ANEXOS = Object.keys(TIPOS_POR_EXTENSAO)
  .map((ext) => `.${ext}`)
  .join(",");

export const DESCRICAO_TIPOS_ACEITOS = "imagens (JPG, PNG, WEBP, GIF), PDF, Excel, Word, CSV ou TXT";

const COMPRESSAO = { maxWidthOrHeight: 1920, initialQuality: 0.8 };

export type ArquivoPreparado = { arquivo: File; nome: string; tipo: string };

export function extensao(nome: string) {
  const i = nome.lastIndexOf(".");
  return i > 0 ? nome.slice(i + 1).toLowerCase() : "";
}

function trocarExtensao(nome: string, novaExtensao: string) {
  const i = nome.lastIndexOf(".");
  return `${i > 0 ? nome.slice(0, i) : nome}.${novaExtensao}`;
}

export function ehImagem(tipo: string | null) {
  return Boolean(tipo?.startsWith("image/"));
}

/** Prints colados chegam como "image.png"; damos um nome com data e hora. */
function nomeDoColado(arquivo: File) {
  const agora = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const carimbo = `${agora.getFullYear()}${p(agora.getMonth() + 1)}${p(agora.getDate())}-${p(agora.getHours())}${p(
    agora.getMinutes(),
  )}${p(agora.getSeconds())}`;
  return `print-${carimbo}.${EXTENSAO_POR_TIPO[arquivo.type] ?? (extensao(arquivo.name) || "png")}`;
}

function tipoCanonico(nome: string) {
  return TIPOS_POR_EXTENSAO[extensao(nome)] ?? null;
}

/** Nome seguro para o caminho no bucket: sem acentos, espaços ou símbolos. */
export function sanitizarNome(nome: string) {
  const ext = extensao(nome);
  const base = (ext ? nome.slice(0, -(ext.length + 1)) : nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase()
    .slice(0, 80);
  return `${base || "arquivo"}${ext ? `.${ext}` : ""}`;
}

function erroDeTamanho(nome: string, bytes: number) {
  return `"${nome}" tem ${formatarTamanho(bytes)}. O limite é ${formatarTamanho(LIMITE_BYTES_ANEXO)} por arquivo.`;
}

async function comprimir(arquivo: File, nome: string): Promise<ArquivoPreparado> {
  const { default: imageCompression } = await import("browser-image-compression");
  const opcoes = { ...COMPRESSAO, useWebWorker: false };
  let saida = await imageCompression(arquivo, { ...opcoes, fileType: "image/webp" });
  // Navegadores sem codificador WebP (ex.: Safari antigo) devolvem PNG; nesse caso usamos JPEG.
  if (saida.type !== "image/webp") saida = await imageCompression(arquivo, { ...opcoes, fileType: "image/jpeg" });
  const tipo = saida.type === "image/webp" ? "image/webp" : "image/jpeg";
  const nomeFinal = trocarExtensao(nome, EXTENSAO_POR_TIPO[tipo]);
  return { arquivo: new File([saida], nomeFinal, { type: tipo }), nome: nomeFinal, tipo };
}

/**
 * Valida o arquivo e comprime imagens (exceto GIF).
 * Lança Error com uma mensagem pronta para o usuário quando o arquivo não pode ser anexado.
 */
export async function prepararArquivo(original: File, colado = false): Promise<ArquivoPreparado> {
  const nome = colado ? nomeDoColado(original) : original.name || "arquivo";
  const tipo = tipoCanonico(nome);
  if (!tipo) throw new Error(`"${nome}": tipo de arquivo não aceito. Envie ${DESCRICAO_TIPOS_ACEITOS}.`);
  if (original.size === 0) throw new Error(`"${nome}" está vazio.`);

  let preparado: ArquivoPreparado = { arquivo: original, nome, tipo };
  if (ehImagem(tipo) && tipo !== "image/gif") {
    try {
      preparado = await comprimir(original, nome);
    } catch {
      // Sem compressão, o original ainda pode ser enviado se couber no limite.
    }
  }

  if (preparado.arquivo.size > LIMITE_BYTES_ANEXO) throw new Error(erroDeTamanho(nome, preparado.arquivo.size));
  return preparado;
}
