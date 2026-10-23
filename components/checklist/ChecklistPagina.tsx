"use client";

import { useEffect, useMemo, useState } from "react";
import { registrarAcessoChecklist } from "@/lib/registroAcesso";
import { Archive, History, ListChecks, Plus, Send } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useListasArquivadas } from "./arquivadas/useListasArquivadas";
import { ListasArquivadasDrawer } from "./arquivadas/ListasArquivadasDrawer";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { COR_GRUPO_PADRAO, NOME_GRUPO_INICIAL, type CamposItem } from "@/lib/checklist";
import { FILTROS_PADRAO, ordemNoFim, type FiltrosChecklist } from "@/lib/checklistRegras";
import type { ChecklistEnvio, ChecklistItem } from "@/lib/types/shell";
import { useChecklistDados } from "./useChecklistDados";
import { useItemNaUrl, useParametroUrl } from "./useItemNaUrl";
import { destinoDoLote } from "./envios/textosLote";
import type { LoteEnvio } from "@/lib/checklistLotes";
import { PAINEL_ENVIADAS } from "@/lib/telaAtual";
import { ChecklistFiltros } from "./ChecklistFiltros";
import { ChecklistQuadro } from "./ChecklistQuadro";
import { GrupoModal } from "./GrupoModal";
import { ItemDrawer } from "./ItemDrawer";
import { useChecklistEnvios } from "./envios/ChecklistEnviosProvider";
import { AcoesEnvioItemContext, type AcoesEnvioItem } from "./envios/AcoesEnvioItem";
import { RecebidasSecao } from "./envios/RecebidasSecao";
import { EnviarItemModal } from "./envios/EnviarItemModal";
import { NovaSolicitacaoModal } from "./envios/NovaSolicitacaoModal";
import { ResponderEnvioModal } from "./envios/ResponderEnvioModal";
import { EnviadasDrawer } from "./envios/EnviadasDrawer";

type Painel =
  | { tipo: "novo-grupo" }
  | { tipo: "enviar"; item: ChecklistItem }
  | { tipo: "nova-solicitacao" }
  | { tipo: "responder"; envio: ChecklistEnvio; aceitar: boolean };

/** Conteúdo da aba Checklist do Início. Exige <Suspense> acima (?item= e ?painel= na URL). */
export function ChecklistPagina() {
  const usuario = useUsuarioAtual();
  const envios = useChecklistEnvios();
  const { grupos, gruposProprios, itens, carregando, erro, acoes, acessoDe } = useChecklistDados(usuario.id);
  const itemUrl = useItemNaUrl();
  // Enviadas fica na URL para o "Abrir" do aviso de aceite levar direto ao drawer.
  const painelUrl = useParametroUrl("painel");
  const enviadasAberto = painelUrl.valor === PAINEL_ENVIADAS;
  const [filtros, setFiltros] = useState<FiltrosChecklist>(FILTROS_PADRAO);
  const [painel, setPainel] = useState<Painel | null>(null);
  // Fica fora de `painel` porque pode abrir por cima do Drawer de Enviadas.
  const [cancelando, setCancelando] = useState<LoteEnvio | null>(null);
  const itemAberto = itens.find((i) => i.id === itemUrl.itemId) ?? null;
  const toast = useToast();
  const arquivadas = useListasArquivadas({ usuarioId: usuario.id, restaurarNaGrade: acoes.restaurarGrupo });
  const [arquivadasAberto, setArquivadasAberto] = useState(false);
  // Arquivar pela grade também atualiza o contador do botão "Arquivadas".
  const acoesDoQuadro = {
    ...acoes,
    arquivarGrupo: async (id: string) => {
      const ok = await acoes.arquivarGrupo(id);
      if (ok) {
        toast.success("Lista arquivada.");
        arquivadas.recarregar();
      }
      return ok;
    },
  };

  // Abrir a aba Checklist conta como acesso ao checklist (no máximo a cada 5 minutos).
  useEffect(() => registrarAcessoChecklist(), []);
  const fecharPainel = () => setPainel(null);

  const acoesEnvioItem = useMemo<AcoesEnvioItem>(
    () => ({
      situacao: (item) => envios.situacaoDoItem(item.id),
      enviar: (item) => setPainel({ tipo: "enviar", item }),
      cancelar: setCancelando,
    }),
    [envios],
  );

  function salvarItem(id: string, campos: CamposItem) {
    // Ao trocar de grupo pelo Drawer, o item entra no fim do grupo novo.
    const comOrdem = campos.grupo_id
      ? { ...campos, ordem: ordemNoFim(itens.filter((i) => i.grupo_id === campos.grupo_id)) }
      : campos;
    return acoes.alterarItem(id, comOrdem);
  }

  /** Grupo do próprio usuário (a RPC de aceite exige isso); sem nenhum, cria "Minhas tarefas". */
  async function garantirGrupo(grupoId: string | null) {
    if (grupoId && gruposProprios.some((g) => g.id === grupoId)) return grupoId;
    if (gruposProprios.length > 0) return gruposProprios[0].id;
    return (await acoes.adicionarGrupo(NOME_GRUPO_INICIAL, COR_GRUPO_PADRAO))?.id ?? null;
  }

  async function confirmarCancelamento() {
    if (cancelando && (await envios.cancelar(cancelando))) setCancelando(null);
  }

  const botoes = (
    <>
      <Button variant="secondary" size="sm" onClick={() => painelUrl.definir(PAINEL_ENVIADAS)}>
        <History className="h-3.5 w-3.5" /> Enviadas
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setPainel({ tipo: "nova-solicitacao" })} disabled={carregando}>
        <Send className="h-3.5 w-3.5" /> Enviar tarefa
      </Button>
      <Button size="sm" onClick={() => setPainel({ tipo: "novo-grupo" })} disabled={carregando || Boolean(erro)}>
        <Plus className="h-3.5 w-3.5" /> Nova lista
      </Button>
    </>
  );

  return (
    <AcoesEnvioItemContext.Provider value={acoesEnvioItem}>
      <div className="min-w-0 text-white">
        <RecebidasSecao
          onAceitar={(envio) => setPainel({ tipo: "responder", envio, aceitar: true })}
          onRecusar={(envio) => setPainel({ tipo: "responder", envio, aceitar: false })}
        />

        <ChecklistFiltros
          filtros={filtros}
          onChange={setFiltros}
          acoes={botoes}
          aoLadoDaBusca={
            arquivadas.total > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setArquivadasAberto(true)}>
                <Archive className="h-3.5 w-3.5" /> Arquivadas
                <span className="rounded-full bg-white/15 px-1.5 text-[11px]">{arquivadas.total}</span>
              </Button>
            )
          }
        />
        {!usuario.isAdmin && <p className="-mt-3 mb-4 text-xs text-white/40">Seu checklist pode ser visualizado pelo RH.</p>}

        {carregando ? (
          <p className="py-14 text-center text-sm text-white/50">Carregando checklist...</p>
        ) : erro ? (
          <EmptyState title="Não foi possível carregar o checklist" description={erro} />
        ) : grupos.length === 0 ? (
          <EmptyState icon={ListChecks} title="Nenhuma lista ativa" description='Crie uma lista em "Nova lista" para começar.' />
        ) : (
          <ChecklistQuadro
            grupos={grupos}
            itens={itens}
            filtros={filtros}
            acoes={acoesDoQuadro}
            acessoDe={acessoDe}
            onAbrirItem={(item) => itemUrl.abrir(item.id)}
          />
        )}

        {itemAberto && (
          <ItemDrawer
            key={itemAberto.id}
            item={itemAberto}
            grupos={grupos.filter((g) => acessoDe(g.id).podeEditar)}
            somenteLeitura={!acessoDe(itemAberto.grupo_id).podeEditar}
            onClose={itemUrl.fechar}
            onSalvar={(campos) => salvarItem(itemAberto.id, campos)}
            onExcluir={() => acoes.removerItem(itemAberto.id)}
          />
        )}

        {painel?.tipo === "novo-grupo" && (
          <GrupoModal
            titulo="Nova lista"
            corInicial={COR_GRUPO_PADRAO}
            rotuloSalvar="Criar lista"
            onSalvar={(nome, cor) => acoes.adicionarGrupo(nome, cor).then(Boolean)}
            onClose={fecharPainel}
          />
        )}
        {painel?.tipo === "enviar" && <EnviarItemModal item={painel.item} onClose={fecharPainel} />}
        {painel?.tipo === "nova-solicitacao" && (
          <NovaSolicitacaoModal grupos={gruposProprios} acoes={acoes} garantirGrupo={garantirGrupo} onClose={fecharPainel} />
        )}
        {painel?.tipo === "responder" && (
          <ResponderEnvioModal
            envio={painel.envio}
            aceitar={painel.aceitar}
            grupos={gruposProprios}
            garantirGrupo={garantirGrupo}
            onRespondido={(envio) => {
              if (painel.aceitar && envio.item_id) void acoes.trazerItem(envio.item_id);
            }}
            onClose={fecharPainel}
          />
        )}
        {enviadasAberto && <EnviadasDrawer onCancelar={setCancelando} onClose={painelUrl.limpar} />}
        {arquivadasAberto && <ListasArquivadasDrawer arquivadas={arquivadas} onClose={() => setArquivadasAberto(false)} />}

        <ConfirmDialog
          open={Boolean(cancelando)}
          title="Cancelar envio?"
          description={
            cancelando &&
            `"${cancelando.titulo}" deixa de aguardar resposta de ${destinoDoLote(cancelando, envios)} e volta ao normal.`
          }
          confirmLabel="Cancelar envio"
          cancelLabel="Voltar"
          danger
          onConfirm={confirmarCancelamento}
          onCancel={() => setCancelando(null)}
        />
      </div>
    </AcoesEnvioItemContext.Provider>
  );
}
