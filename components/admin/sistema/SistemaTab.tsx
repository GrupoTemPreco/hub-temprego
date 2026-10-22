"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { NavegarAba } from "../abas";
import { UsoEspaco } from "./UsoEspaco";
import { LimpezaSecao } from "./LimpezaSecao";
import { LimitesPlanoModal } from "./LimitesPlanoModal";

/** Aba Sistema: uso de espaço do banco e do Storage, limites do plano e ações de limpeza. */
export function SistemaTab({ onNavegar }: { onNavegar: NavegarAba }) {
  const [versao, setVersao] = useState(0);
  const [editandoLimites, setEditandoLimites] = useState(false);
  const recarregar = () => setVersao((v) => v + 1);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => setEditandoLimites(true)}>
          <Gauge className="h-4 w-4" /> Limites do plano
        </Button>
      </div>
      <UsoEspaco versao={versao} onAbrirTicket={(numero) => onNavegar("tickets", { ticket: String(numero) })} />
      <LimpezaSecao onConcluido={recarregar} />

      {editandoLimites && <LimitesPlanoModal onClose={() => setEditandoLimites(false)} onSalvo={recarregar} />}
    </div>
  );
}
