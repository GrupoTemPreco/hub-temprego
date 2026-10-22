"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";

/** /tickets leva ao Início correto (/admin ou /), preservando ?ticket=<numero>. */
function Redirecionar() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAdmin } = useUsuarioAtual();
  const ticket = params.get("ticket");

  useEffect(() => {
    const inicio = isAdmin ? "/admin" : "/";
    router.replace(ticket ? `${inicio}?ticket=${encodeURIComponent(ticket)}` : inicio);
  }, [isAdmin, ticket, router]);

  return null;
}

export default function TicketsPage() {
  return (
    <Suspense fallback={null}>
      <Redirecionar />
    </Suspense>
  );
}
