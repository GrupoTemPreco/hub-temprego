import { supabase } from "@/lib/supabase";
import { sanitizarNome, ehImagem } from "@/lib/anexosArquivo";
import { criarTicket, enviarMensagem, type DestinoValor, type NovoTicket } from "@/lib/ticketsApi";
import type { Ticket, TicketAnexo } from "@/lib/types/shell";

export const BUCKET_ANEXOS = "tickets-anexos";
const VALIDADE_URL_SEGUNDOS = 60 * 60;

export type ArquivoParaEnvio = { id: string; arquivo: File; nome: string; tipo: string };
/** evento_id nulo = anexo da abertura do ticket. */
export type DestinoAnexo = { ticketId: string; eventoId: string | null };
export type FalhaAnexo = { arquivo: ArquivoParaEnvio; destino: DestinoAnexo; erro: string };
export type AoProgredir = (arquivoId: string, percentual: number) => void;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function mensagemErroStorage(status: number, corpo: string) {
  let detalhe = "";
  try {
    detalhe = String(JSON.parse(corpo).message ?? "");
  } catch {
    detalhe = corpo;
  }
  if (status === 413 || /too large|exceeded/i.test(detalhe)) return "arquivo maior que o limite de 10 MB";
  if (status === 415 || /mime type/i.test(detalhe)) return "tipo de arquivo não aceito";
  if (status === 401 || status === 403) return "sem permissão para enviar arquivos";
  return detalhe || `erro ${status}`;
}

/** O upload do supabase-js não informa progresso; por isso o envio é feito direto na API do Storage. */
function uploadComProgresso(caminho: string, item: ArquivoParaEnvio, token: string, aoProgredir: (p: number) => void) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET_ANEXOS}/${caminho
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    xhr.setRequestHeader("Content-Type", item.tipo);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () =>
      xhr.status < 300 ? resolve() : reject(new Error(mensagemErroStorage(xhr.status, xhr.responseText)));
    xhr.onerror = () => reject(new Error("falha de conexão"));
    xhr.send(item.arquivo);
  });
}

async function enviarUm(item: ArquivoParaEnvio, destino: DestinoAnexo, autorId: string, token: string, aoProgredir: AoProgredir) {
  const caminho = `${destino.ticketId}/${crypto.randomUUID()}-${sanitizarNome(item.nome)}`;
  await uploadComProgresso(caminho, item, token, (p) => aoProgredir(item.id, p));

  const { error } = await supabase.from("ticket_anexos").insert({
    ticket_id: destino.ticketId,
    evento_id: destino.eventoId,
    autor_id: autorId,
    caminho,
    nome_arquivo: item.nome,
    tipo_mime: item.tipo,
    tamanho_bytes: item.arquivo.size,
  });
  if (error) {
    // Sem a linha em ticket_anexos o arquivo ficaria órfão no bucket.
    await supabase.storage.from(BUCKET_ANEXOS).remove([caminho]);
    throw new Error(error.message);
  }
}

/** Envia os arquivos em paralelo. Nunca lança: devolve a lista do que falhou. */
export async function enviarAnexos(
  destino: DestinoAnexo,
  autorId: string,
  arquivos: ArquivoParaEnvio[],
  aoProgredir: AoProgredir = () => {},
): Promise<FalhaAnexo[]> {
  if (arquivos.length === 0) return [];
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return arquivos.map((arquivo) => ({ arquivo, destino, erro: "sessão expirada" }));

  const resultados = await Promise.allSettled(
    arquivos.map((item) => enviarUm(item, destino, autorId, session.access_token, aoProgredir)),
  );
  return resultados.flatMap((r, i) =>
    r.status === "rejected"
      ? [{ arquivo: arquivos[i], destino, erro: r.reason instanceof Error ? r.reason.message : String(r.reason) }]
      : [],
  );
}

/** Cria o ticket e depois envia os anexos. Se um anexo falhar, o ticket continua criado. */
export async function criarTicketComAnexos(
  dados: NovoTicket,
  autorId: string,
  arquivos: ArquivoParaEnvio[],
  aoProgredir?: AoProgredir,
): Promise<{ ticket: Pick<Ticket, "id" | "numero">; falhas: FalhaAnexo[] }> {
  const ticket = await criarTicket(dados, autorId);
  const falhas = await enviarAnexos({ ticketId: ticket.id, eventoId: null }, autorId, arquivos, aoProgredir);
  return { ticket, falhas };
}

/**
 * Um ticket por destino, com os mesmos dados e anexos (upload repetido no caminho de cada ticket).
 * Nunca lança: se um ticket falhar, para ali e devolve os já criados com o erro.
 */
export async function criarTicketsParaVariosDestinos(
  dados: Omit<NovoTicket, "destino">,
  destinos: DestinoValor[],
  autorId: string,
  arquivos: ArquivoParaEnvio[],
  aoProgredir?: AoProgredir,
): Promise<{ tickets: Pick<Ticket, "id" | "numero">[]; falhas: FalhaAnexo[]; erro: string | null }> {
  const tickets: Pick<Ticket, "id" | "numero">[] = [];
  const falhas: FalhaAnexo[] = [];
  for (const destino of destinos) {
    try {
      const r = await criarTicketComAnexos({ ...dados, destino }, autorId, arquivos, aoProgredir);
      tickets.push(r.ticket);
      falhas.push(...r.falhas);
    } catch (err) {
      return { tickets, falhas, erro: err instanceof Error ? err.message : String(err) };
    }
  }
  return { tickets, falhas, erro: null };
}

/** Grava a mensagem (texto opcional) e depois envia os anexos ligados a ela. */
export async function responderComAnexos(
  ticketId: string,
  mensagem: string,
  interno: boolean,
  autorId: string,
  arquivos: ArquivoParaEnvio[],
  aoProgredir?: AoProgredir,
): Promise<FalhaAnexo[]> {
  const eventoId = await enviarMensagem(ticketId, mensagem, interno, autorId);
  return enviarAnexos({ ticketId, eventoId }, autorId, arquivos, aoProgredir);
}

export async function listarAnexosDoTicket(ticketId: string) {
  const { data, error } = await supabase
    .from("ticket_anexos")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("criado_em", { ascending: true });
  falhar(error);
  return (data ?? []) as TicketAnexo[];
}

/**
 * URLs assinadas (1 hora) em lote, indexadas pelo caminho.
 * Arquivos que não são imagem recebem `download` para baixar com o nome original.
 */
export async function assinarUrls(anexos: Pick<TicketAnexo, "caminho" | "nome_arquivo" | "tipo_mime">[]) {
  if (anexos.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .createSignedUrls(
      anexos.map((a) => a.caminho),
      VALIDADE_URL_SEGUNDOS,
    );
  falhar(error);

  const porCaminho = new Map(anexos.map((a) => [a.caminho, a]));
  const urls: Record<string, string> = {};
  (data ?? []).forEach((item) => {
    const anexo = item.path ? porCaminho.get(item.path) : undefined;
    if (!item.signedUrl || !anexo) return;
    urls[anexo.caminho] = ehImagem(anexo.tipo_mime)
      ? item.signedUrl
      : `${item.signedUrl}&download=${encodeURIComponent(anexo.nome_arquivo)}`;
  });
  return urls;
}

/** Apaga do bucket todos os arquivos do ticket (exceto os já removidos). Lança erro se o Storage recusar. */
export async function removerArquivosDoTicket(ticketId: string) {
  const { data, error } = await supabase
    .from("ticket_anexos")
    .select("caminho")
    .eq("ticket_id", ticketId)
    .is("removido_em", null);
  falhar(error);
  const caminhos = (data ?? []).map((a) => a.caminho as string);
  if (caminhos.length === 0) return;

  const { error: storageError } = await supabase.storage.from(BUCKET_ANEXOS).remove(caminhos);
  if (storageError) throw new Error(`Não foi possível apagar os anexos do ticket: ${storageError.message}`);
}
