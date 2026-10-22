"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, MessageSquare, Users } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { carregarResumo, type ResumoAdmin } from "@/lib/admin/visaoGeral";
import {
  alertasDeEspaco,
  carregarLimitesPlano,
  carregarUsoArmazenamento,
  type AlertaEspaco,
} from "@/lib/admin/armazenamento";
import type { NavegarAba } from "../abas";
import { StatCard } from "./StatCard";
import { AtencaoCard } from "./AtencaoCard";
import { AtividadeRecenteCard } from "./AtividadeRecenteCard";
import { MeusTicketsAdmin } from "./MeusTicketsAdmin";

function mensagemErro(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export function VisaoGeralTab({ onNavegar }: { onNavegar: NavegarAba }) {
  const toast = useToast();
  const [resumo, setResumo] = useState<ResumoAdmin | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [alertasEspaco, setAlertasEspaco] = useState<AlertaEspaco[]>([]);
  const { isAdmin } = useUsuarioAtual();

  // Uso de espaço: só para admin e uma vez por carregamento da aba (a RPC é mais pesada que as contagens).
  useEffect(() => {
    if (!isAdmin) return;
    let ativo = true;
    Promise.all([carregarUsoArmazenamento(), carregarLimitesPlano()])
      .then(([uso, limites]) => ativo && setAlertasEspaco(alertasDeEspaco(uso, limites)))
      .catch((err) => console.error("[visao-geral] Falha ao verificar o uso de espaço:", err));
    return () => {
      ativo = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    let ativo = true;
    carregarResumo()
      .then((r) => ativo && setResumo(r))
      .catch((err) => toast.error(`Erro ao carregar indicadores: ${mensagemErro(err)}`))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [toast]);

  if (carregando) return <p className="text-sm text-white/60">Carregando visão geral...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Usuários pendentes"
          valor={resumo?.usuariosPendentes ?? 0}
          legenda="Aguardando aprovação"
          icon={Users}
          cor="blue"
        />
        <StatCard
          titulo="Tickets abertos"
          valor={resumo?.ticketsAbertos ?? 0}
          legenda="Em atendimento"
          icon={MessageSquare}
          cor="cyan"
        />
        <StatCard
          titulo="Tickets atrasados"
          valor={resumo?.ticketsAtrasados ?? 0}
          legenda={(resumo?.ticketsAtrasados ?? 0) > 0 ? "Precisam de atenção" : "Nenhum atraso"}
          icon={AlertTriangle}
          cor="red"
        />
        <StatCard
          titulo="Notificações ativas"
          valor={resumo?.notificacoesAtivas ?? 0}
          legenda="Em exibição no sistema"
          icon={Bell}
          cor="green"
          onClick={() => onNavegar("notificacoes")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AtencaoCard resumo={resumo} alertasEspaco={alertasEspaco} onNavegar={onNavegar} />
        <AtividadeRecenteCard />
      </div>

      <MeusTicketsAdmin onNavegar={onNavegar} />
    </div>
  );
}
