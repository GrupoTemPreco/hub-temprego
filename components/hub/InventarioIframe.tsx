"use client";

import { useRef } from "react";
import { usePonteInventario } from "@/hooks/usePonteInventario";
import { buscarFerramenta, podeAcessar } from "@/lib/ferramentas";
import { useUsuarioAtual } from "./UsuarioAtualProvider";

/** O painel de inventário não recebe nada pela URL: a sessão chega por postMessage. */
export function InventarioIframe() {
  const usuario = useUsuarioAtual();
  const app = buscarFerramenta("inventario");
  const permitido = podeAcessar(usuario, app);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  usePonteInventario(iframeRef, permitido);

  if (!permitido) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <p className="text-sm text-texto-suave">Sem permissão para acessar.</p>
      </div>
    );
  }

  return <iframe ref={iframeRef} src={app.url} title={app.label} className="min-h-0 w-full flex-1 border-none" />;
}
