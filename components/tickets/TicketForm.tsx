"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { useAnexos } from "@/hooks/useAnexos";
import { CATEGORIAS_TICKET, PRIORIDADES_TICKET } from "@/lib/tickets";
import {
  carregarReferencias,
  type DestinoValor,
  type NovoTicket,
  type SetorReferencia,
  type UsuarioReferencia,
} from "@/lib/ticketsApi";
import { criarTicketComAnexos, criarTicketsParaVariosDestinos } from "@/lib/ticketsAnexos";
import { rotuloTela } from "@/lib/telaAtual";
import type { Ticket, TicketCategoria, TicketPrioridade } from "@/lib/types/shell";
import { CampoDestino } from "./CampoDestino";
import { AnexosInput } from "./AnexosInput";
import { avisarFalhasAnexos } from "./anexos/avisarFalhasAnexos";

const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

type TicketCriado = Pick<Ticket, "id" | "numero">;

type Props = {
  /** Quem aparece entre as pessoas do destino. Padrão: usuários aprovados, exceto quem está criando. */
  filtrarPessoa?: (usuario: UsuarioReferencia) => boolean;
  /** Tela de onde o ticket foi aberto; aparece como "Aberto a partir de: ..." e vai para modulo_origem. */
  moduloOrigem?: string | null;
  /** Exibido no lugar do formulário quando não há nenhum setor nem pessoa disponível como destino. */
  semDestinos?: ReactNode;
  onCriado: (ticket: TicketCriado) => void;
  /** Admin com várias pessoas no destino: um ticket por pessoa. O formulário já mostra "N tickets criados". */
  onVariosCriados?: (tickets: TicketCriado[]) => void;
  onCancelar?: () => void;
};

/**
 * Admin: destino com várias pessoas (um ticket para cada) ou um setor, inclusive inativo.
 * Demais: um destino só, entre setores ativos e as pessoas permitidas.
 */
export function TicketForm({ filtrarPessoa, moduloOrigem, semDestinos, onCriado, onVariosCriados, onCancelar }: Props) {
  const usuario = useUsuarioAtual();
  const toast = useToast();
  const anexos = useAnexos();
  const [todosSetores, setTodosSetores] = useState<SetorReferencia[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioReferencia[] | null>(null);
  const filtro = filtrarPessoa ?? ((u: UsuarioReferencia) => u.status === "aprovado" && u.id !== usuario.id);
  const pessoas = (usuarios ?? []).filter(filtro);
  const setores = usuario.isAdmin ? todosSetores : todosSetores.filter((s) => s.ativo);
  const [form, setForm] = useState<Omit<NovoTicket, "destino">>({
    titulo: "",
    descricao: "",
    categoria: "solicitacao",
    prioridade: "normal",
  });
  const [destinos, setDestinos] = useState<DestinoValor[]>([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarReferencias()
      .then((refs) => {
        if (!ativo) return;
        setTodosSetores(refs.setores);
        setUsuarios(refs.usuarios);
      })
      .catch((err) => ativo && setErro(`Erro ao carregar destinos: ${err.message}`));
    return () => {
      ativo = false;
    };
  }, []);

  const dados = { ...form, modulo_origem: moduloOrigem };

  async function criarUm(destino: DestinoValor) {
    const { ticket, falhas } = await criarTicketComAnexos(
      { ...dados, destino },
      usuario.id,
      anexos.prontos,
      anexos.definirProgresso,
    );
    avisarFalhasAnexos(toast, falhas, usuario.id);
    anexos.limpar();
    onCriado(ticket);
  }

  async function criarVarios() {
    const r = await criarTicketsParaVariosDestinos(dados, destinos, usuario.id, anexos.prontos, anexos.definirProgresso);
    avisarFalhasAnexos(toast, r.falhas, usuario.id);
    if (r.tickets.length === 0) throw new Error(r.erro ?? "nenhum ticket foi criado");
    if (r.erro) toast.error(`Só ${r.tickets.length} de ${destinos.length} tickets foram criados: ${r.erro}`);
    toast.success(`${r.tickets.length} tickets criados`);
    anexos.limpar();
    onVariosCriados?.(r.tickets);
  }

  async function enviar() {
    if (!form.titulo.trim()) return setErro("Informe o título.");
    if (destinos.length === 0) return setErro("Escolha para quem é o ticket.");
    setErro("");
    setEnviando(true);
    try {
      await (destinos.length === 1 ? criarUm(destinos[0]) : criarVarios());
    } catch (err) {
      anexos.zerarProgresso();
      setErro(`Erro ao criar ticket: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setEnviando(false);
    }
  }

  let rotuloBotao = destinos.length > 1 ? `Criar ${destinos.length} tickets` : "Criar ticket";
  if (anexos.preparando) rotuloBotao = "Preparando anexos...";
  if (enviando) rotuloBotao = anexos.prontos.length > 0 ? "Enviando anexos..." : "Criando...";

  if (semDestinos && usuarios !== null && setores.length === 0 && pessoas.length === 0) return <>{semDestinos}</>;

  return (
    <div className="space-y-4" onPaste={anexos.colar}>
      {moduloOrigem && (
        <p className="text-xs text-white/55">
          Aberto a partir de: <strong className="font-medium text-white/80">{rotuloTela(moduloOrigem)}</strong>
        </p>
      )}
      <label className="block">
        <span className="mb-1 block text-sm text-white/70">
          Título <span className="text-rose-400">*</span>
        </span>
        <input
          autoFocus
          className={CAMPO}
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Resuma o pedido em uma frase"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-white/70">Descrição</span>
        <textarea
          rows={4}
          className={`${CAMPO} resize-y`}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Descreva com detalhes o que precisa"
        />
      </label>

      <div>
        <span className="mb-1 block text-sm text-white/70">Anexos</span>
        <AnexosInput anexos={anexos} desabilitado={enviando} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Categoria</span>
          <select
            className={CAMPO}
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value as TicketCategoria })}
          >
            {CATEGORIAS_TICKET.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-white/70">Prioridade</span>
          <select
            className={CAMPO}
            value={form.prioridade}
            onChange={(e) => setForm({ ...form, prioridade: e.target.value as TicketPrioridade })}
          >
            {PRIORIDADES_TICKET.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="mb-1 block text-sm text-white/70">
          Destino <span className="text-rose-400">*</span>
        </span>
        <CampoDestino
          multiplo={usuario.isAdmin}
          className={CAMPO}
          value={destinos}
          onChange={setDestinos}
          setores={setores}
          pessoas={pessoas}
        />
      </div>

      {erro && <p className="text-sm text-rose-400">{erro}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancelar && (
          <Button variant="secondary" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Button>
        )}
        <Button onClick={enviar} disabled={enviando || anexos.preparando}>
          {rotuloBotao}
        </Button>
      </div>
    </div>
  );
}
