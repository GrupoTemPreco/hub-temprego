// Tipos escritos à mão para as tabelas do schema "shell" no Supabase.
// Datas chegam do PostgREST como string ISO.

export type UsuarioStatus = "pendente" | "aprovado" | "rejeitado";

export type Usuario = {
  id: string;
  nome: string | null;
  email: string | null;
  status: UsuarioStatus | null;
  is_admin: boolean | null;
  senha: string | null;
  recebe_tickets: boolean | null;
};

export type Permissao = {
  id: string;
  user_id: string;
  modulo: string;
  item: string;
  nome_usuario: string | null;
};

export type Setor = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  responsavel_id: string | null;
  criado_em: string;
};

export type UsuarioSetor = {
  usuario_id: string;
  setor_id: string;
};

export type TicketStatus =
  | "aberto"
  | "em_andamento"
  | "aguardando_solicitante"
  | "resolvido"
  | "recusado"
  | "fechado";

export type TicketCategoria = "ajuste" | "bug" | "ideia" | "solicitacao" | "acesso";

export type TicketPrioridade = "baixa" | "normal" | "alta" | "urgente";

export type TicketEventoTipo =
  | "criado"
  | "mensagem"
  | "status"
  | "reaberto"
  | "encaminhado"
  | "assumido"
  | "prioridade"
  | "excluido"
  | "restaurado";

export type Ticket = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string | null;
  categoria: TicketCategoria;
  prioridade: TicketPrioridade;
  status: TicketStatus;
  modulo_origem: string | null;
  autor_id: string | null;
  destino_usuario_id: string | null;
  destino_setor_id: string | null;
  responsavel_id: string | null;
  criado_em: string;
  atualizado_em: string | null;
  resolvido_em: string | null;
  fechado_em: string | null;
  prazo_em: string | null;
  excluido_em: string | null;
  excluido_por: string | null;
};

export type TicketEvento = {
  id: string;
  ticket_id: string;
  tipo: TicketEventoTipo;
  autor_id: string | null;
  mensagem: string | null;
  interno: boolean;
  status_anterior: TicketStatus | null;
  status_novo: TicketStatus | null;
  de_usuario_id: string | null;
  para_usuario_id: string | null;
  de_setor_id: string | null;
  para_setor_id: string | null;
  criado_em: string;
};

export type TicketAnexo = {
  id: string;
  ticket_id: string;
  /** Nulo = anexo da abertura do ticket; preenchido = anexo de uma mensagem. */
  evento_id: string | null;
  autor_id: string | null;
  /** Caminho no bucket tickets-anexos. */
  caminho: string;
  nome_arquivo: string;
  tipo_mime: string | null;
  tamanho_bytes: number | null;
  criado_em: string;
  /** Preenchido quando o arquivo foi apagado do bucket numa limpeza; o registro continua. */
  removido_em: string | null;
  removido_por: string | null;
};

export type AdminLog = {
  id: string;
  autor_id: string | null;
  acao: string;
  alvo_tipo: string;
  alvo_id: string | null;
  descricao: string | null;
  dados: Record<string, unknown> | null;
  criado_em: string;
};

export type NotificacaoNivel = "informacao" | "sucesso" | "atencao" | "critico";
export type NotificacaoFormato = "faixa" | "aviso" | "janela";
export type NotificacaoPublico = "todos" | "setores" | "usuarios";

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  nivel: NotificacaoNivel;
  formato: NotificacaoFormato;
  publico: NotificacaoPublico;
  setores_ids: string[] | null;
  usuarios_ids: string[] | null;
  /** Vazio ou nulo = todas as telas. */
  modulos: string[] | null;
  inicio_em: string;
  fim_em: string | null;
  ativa: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string | null;
};

export type NotificacaoLeitura = {
  notificacao_id: string;
  usuario_id: string;
  visto_em: string | null;
  confirmado_em: string | null;
};

export type DestaqueCor = "verde" | "azul" | "laranja" | "vermelho" | "roxo";

export type DestaqueMenu = {
  id: string;
  ferramenta_id: string;
  texto: string;
  cor: DestaqueCor;
  inicio_em: string;
  fim_em: string | null;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
};
