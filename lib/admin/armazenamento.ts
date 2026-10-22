import { supabase } from "@/lib/supabase";
import { registrarAcao } from "@/lib/adminLog";
import { gravarConfiguracao, lerConfiguracao } from "@/lib/configuracoes";
import { BUCKET_ANEXOS } from "@/lib/ticketsAnexos";

export type UsoArmazenamento = {
  banco_total_bytes: number;
  /** Todos os buckets, inclusive os vazios. */
  buckets: Array<{ bucket: string; arquivos: number; bytes: number }>;
  schemas: Array<{ schema: string; bytes: number }>;
  tabelas_shell: Array<{ tabela: string; bytes: number; linhas: number }>;
};

export type AnexoGrande = {
  id: string;
  nome_arquivo: string;
  tamanho_bytes: number | null;
  criado_em: string;
  ticket: { numero: number } | null;
};

/** Limites incluídos no plano, em GB (shell.configuracoes). */
export type LimitesPlano = { bancoGb: number; storageGb: number };

const CHAVE_LIMITE_BANCO = "limite_banco_gb";
const CHAVE_LIMITE_STORAGE = "limite_storage_gb";
const LIMITES_PADRAO: LimitesPlano = { bancoGb: 8, storageGb: 100 };
export const BYTES_POR_GB = 1024 ** 3;
/** Acima disso o item aparece em "Precisa da sua atenção". */
export const PERCENTUAL_ALERTA = 80;

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** RPC shell.uso_armazenamento() (só admin). */
export async function carregarUsoArmazenamento(): Promise<UsoArmazenamento> {
  const { data, error } = await supabase.rpc("uso_armazenamento");
  falhar(error);
  const uso = (data ?? {}) as Partial<UsoArmazenamento>;
  return {
    banco_total_bytes: Number(uso.banco_total_bytes ?? 0),
    buckets: uso.buckets ?? [],
    schemas: uso.schemas ?? [],
    tabelas_shell: uso.tabelas_shell ?? [],
  };
}

export function totalArquivosStorage(uso: UsoArmazenamento) {
  return uso.buckets.reduce((soma, b) => soma + Number(b.arquivos ?? 0), 0);
}

/** Soma de todos os buckets. */
export function totalBytesStorage(uso: UsoArmazenamento) {
  return uso.buckets.reduce((soma, b) => soma + Number(b.bytes ?? 0), 0);
}

export function bytesDoBucketAnexos(uso: UsoArmazenamento) {
  return Number(uso.buckets.find((b) => b.bucket === BUCKET_ANEXOS)?.bytes ?? 0);
}

/** Maiores anexos que ainda têm arquivo no bucket. */
export async function carregarMaioresAnexos(limite = 10): Promise<AnexoGrande[]> {
  const { data, error } = await supabase
    .from("ticket_anexos")
    .select("id, nome_arquivo, tamanho_bytes, criado_em, ticket:tickets(numero)")
    .is("removido_em", null)
    .order("tamanho_bytes", { ascending: false, nullsFirst: false })
    .limit(limite);
  falhar(error);
  return (data ?? []) as unknown as AnexoGrande[];
}

export async function carregarLimitesPlano(): Promise<LimitesPlano> {
  const [banco, storage] = await Promise.all([
    lerConfiguracao<number>(CHAVE_LIMITE_BANCO, LIMITES_PADRAO.bancoGb),
    lerConfiguracao<number>(CHAVE_LIMITE_STORAGE, LIMITES_PADRAO.storageGb),
  ]);
  return { bancoGb: Number(banco), storageGb: Number(storage) };
}

export async function salvarLimitesPlano(novos: LimitesPlano, antes: LimitesPlano, adminId: string) {
  await Promise.all([
    gravarConfiguracao(CHAVE_LIMITE_BANCO, novos.bancoGb, adminId),
    gravarConfiguracao(CHAVE_LIMITE_STORAGE, novos.storageGb, adminId),
  ]);
  await registrarAcao({
    acao: "editar_limites_plano",
    alvo_tipo: "configuracao",
    alvo_id: null,
    descricao: `alterou os limites do plano para ${novos.bancoGb} GB de banco e ${novos.storageGb} GB de Storage`,
    dados: { antes, depois: novos },
  });
}

export type FaixaOcupacao = "verde" | "ambar" | "vermelho";

/** Uso em relação ao limite. `disponivelBytes` fica negativo quando passa do limite. */
export function calcularOcupacao(usadoBytes: number, limiteGb: number) {
  const limiteBytes = limiteGb * BYTES_POR_GB;
  const percentual = limiteBytes > 0 ? (usadoBytes / limiteBytes) * 100 : 0;
  const faixa: FaixaOcupacao = percentual > 90 ? "vermelho" : percentual >= 70 ? "ambar" : "verde";
  return { limiteBytes, percentual, disponivelBytes: limiteBytes - usadoBytes, faixa };
}

export type AlertaEspaco = { id: "banco" | "storage"; recurso: string; percentual: number };

/** Banco ou Storage acima de 80% do limite do plano. */
export function alertasDeEspaco(uso: UsoArmazenamento, limites: LimitesPlano): AlertaEspaco[] {
  const itens: AlertaEspaco[] = [
    { id: "banco", recurso: "Banco de dados", percentual: calcularOcupacao(uso.banco_total_bytes, limites.bancoGb).percentual },
    { id: "storage", recurso: "Storage", percentual: calcularOcupacao(totalBytesStorage(uso), limites.storageGb).percentual },
  ];
  return itens.filter((a) => a.percentual > PERCENTUAL_ALERTA).map((a) => ({ ...a, percentual: Math.round(a.percentual) }));
}
