"use client";

import { useEffect, type RefObject } from "react";
import { supabase } from "@/lib/supabase";
import { ORIGEM_INVENTARIO } from "@/lib/ferramentas";
import { lerTemaLocal, temaValido } from "@/lib/tema";

type RefIframe = RefObject<HTMLIFrameElement | null>;

function enviar(iframe: HTMLIFrameElement | null, mensagem: Record<string, unknown>) {
  iframe?.contentWindow?.postMessage(mensagem, ORIGEM_INVENTARIO);
}

/** Só o access_token: nunca o refresh_token nem o objeto session. */
function enviarSessao(iframe: HTMLIFrameElement | null, accessToken: string) {
  enviar(iframe, { tipo: "hub-sessao", access_token: accessToken, tema: lerTemaLocal() });
}

function useSessaoInventario(iframeRef: RefIframe, permitido: boolean) {
  useEffect(() => {
    if (!permitido) return;

    async function aoReceberMensagem(event: MessageEvent) {
      if (event.origin !== ORIGEM_INVENTARIO) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if ((event.data as { tipo?: unknown } | null)?.tipo !== "inventario-pronto") return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) enviarSessao(iframeRef.current, session.access_token);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, session) => {
      if ((evento === "TOKEN_REFRESHED" || evento === "SIGNED_IN") && session) {
        enviarSessao(iframeRef.current, session.access_token);
      }
    });

    window.addEventListener("message", aoReceberMensagem);
    return () => {
      window.removeEventListener("message", aoReceberMensagem);
      subscription.unsubscribe();
    };
  }, [iframeRef, permitido]);
}

/** Acompanha o data-tema do <html>, que o SeletorTema altera via aplicarTema. */
function useTemaInventario(iframeRef: RefIframe, permitido: boolean) {
  useEffect(() => {
    if (!permitido) return;
    const raiz = document.documentElement;
    const observador = new MutationObserver((mutacoes) => {
      const tema = raiz.getAttribute("data-tema");
      if (!temaValido(tema) || mutacoes.every((m) => m.oldValue === tema)) return;
      enviar(iframeRef.current, { tipo: "hub-tema", tema });
    });
    observador.observe(raiz, { attributes: true, attributeFilter: ["data-tema"], attributeOldValue: true });
    return () => observador.disconnect();
  }, [iframeRef, permitido]);
}

/** Entrega ao painel de inventário a sessão do hub e o tema, sempre por postMessage para ORIGEM_INVENTARIO. */
export function usePonteInventario(iframeRef: RefIframe, permitido: boolean) {
  useSessaoInventario(iframeRef, permitido);
  useTemaInventario(iframeRef, permitido);
}
