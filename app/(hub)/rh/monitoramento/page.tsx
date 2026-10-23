"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { MonitoramentoPagina } from "@/components/rh/monitoramento/MonitoramentoPagina";
import { podeMonitorarRh } from "@/lib/ferramentas";

/** Sem permissão (admin ou rh/monitoramento), volta para a tela inicial. As RPCs também conferem no banco. */
export default function MonitoramentoPage() {
  const router = useRouter();
  const usuario = useUsuarioAtual();
  const pode = podeMonitorarRh(usuario);

  useEffect(() => {
    if (!pode) router.replace("/");
  }, [pode, router]);

  if (!pode) return null;
  return <MonitoramentoPagina />;
}
