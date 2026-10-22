import { agoraInputSP, inputSPParaIso, isoParaInputSP } from "@/lib/datas";
import type { NotificacaoPayload } from "@/lib/admin/notificacoes";
import type { Notificacao, NotificacaoFormato, NotificacaoNivel, NotificacaoPublico } from "@/lib/types/shell";

export type NotificacaoForm = {
  titulo: string;
  mensagem: string;
  nivel: NotificacaoNivel;
  formato: NotificacaoFormato;
  publico: NotificacaoPublico;
  setores_ids: string[];
  usuarios_ids: string[];
  todasTelas: boolean;
  modulos: string[];
  /** Valores de datetime-local no horário de São Paulo. */
  inicio: string;
  fim: string;
  semFim: boolean;
  ativa: boolean;
};

export type CampoComErro = "titulo" | "mensagem" | "publico" | "modulos" | "inicio" | "fim";
export type ErrosForm = Partial<Record<CampoComErro, string>>;

export function formVazio(): NotificacaoForm {
  return {
    titulo: "",
    mensagem: "",
    nivel: "informacao",
    formato: "faixa",
    publico: "todos",
    setores_ids: [],
    usuarios_ids: [],
    todasTelas: true,
    modulos: [],
    inicio: agoraInputSP(),
    fim: "",
    semFim: true,
    ativa: true,
  };
}

/** Preenche o formulário a partir de uma notificação. Como nova (duplicar), começa agora e mantém a duração. */
export function formDeNotificacao(n: Notificacao, comoNova: boolean): NotificacaoForm {
  let inicio = isoParaInputSP(n.inicio_em);
  let fim = isoParaInputSP(n.fim_em);
  if (comoNova) {
    const duracao = n.fim_em ? new Date(n.fim_em).getTime() - new Date(n.inicio_em).getTime() : null;
    inicio = agoraInputSP();
    fim = duracao !== null ? isoParaInputSP(new Date(Date.now() + duracao).toISOString()) : "";
  }
  return {
    titulo: n.titulo,
    mensagem: n.mensagem,
    nivel: n.nivel,
    formato: n.formato,
    publico: n.publico,
    setores_ids: n.setores_ids ?? [],
    usuarios_ids: n.usuarios_ids ?? [],
    todasTelas: !n.modulos || n.modulos.length === 0,
    modulos: n.modulos ?? [],
    inicio,
    fim,
    semFim: !n.fim_em,
    ativa: comoNova ? true : n.ativa,
  };
}

export function validarForm(f: NotificacaoForm): ErrosForm {
  const erros: ErrosForm = {};
  if (!f.titulo.trim()) erros.titulo = "Informe o título.";
  if (!f.mensagem.trim()) erros.mensagem = "Informe a mensagem.";
  if (f.publico === "setores" && f.setores_ids.length === 0) erros.publico = "Escolha pelo menos um setor.";
  if (f.publico === "usuarios" && f.usuarios_ids.length === 0) erros.publico = "Escolha pelo menos um usuário.";
  if (!f.todasTelas && f.modulos.length === 0) erros.modulos = "Escolha pelo menos uma tela.";
  if (!f.inicio) erros.inicio = "Informe o início.";
  if (!f.semFim) {
    if (!f.fim) erros.fim = 'Informe o fim ou marque "sem data de fim".';
    else if (f.inicio && inputSPParaIso(f.fim) <= inputSPParaIso(f.inicio)) erros.fim = "O fim precisa ser depois do início.";
  }
  return erros;
}

export function formParaPayload(f: NotificacaoForm): NotificacaoPayload {
  return {
    titulo: f.titulo.trim(),
    mensagem: f.mensagem.trim(),
    nivel: f.nivel,
    formato: f.formato,
    publico: f.publico,
    setores_ids: f.publico === "setores" ? f.setores_ids : [],
    usuarios_ids: f.publico === "usuarios" ? f.usuarios_ids : [],
    modulos: f.todasTelas ? [] : f.modulos,
    inicio_em: inputSPParaIso(f.inicio),
    fim_em: f.semFim ? null : inputSPParaIso(f.fim),
    ativa: f.ativa,
  };
}
