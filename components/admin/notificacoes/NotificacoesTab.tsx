"use client";

import { Bell, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { NotificacoesPainel } from "./NotificacoesPainel";
import { DestaquesPainel } from "./destaques/DestaquesPainel";

type SubAba = "notificacoes" | "destaques";

export function NotificacoesTab() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sub: SubAba = params.get("sub") === "destaques" ? "destaques" : "notificacoes";

  function trocar(destino: SubAba) {
    const novos = new URLSearchParams({ aba: "notificacoes" });
    if (destino === "destaques") novos.set("sub", "destaques");
    router.replace(`${pathname}?${novos.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <Tabs
        variant="underline"
        value={sub}
        onChange={trocar}
        items={[
          { id: "notificacoes", label: "Notificações", icon: Bell },
          { id: "destaques", label: "Destaques no menu", icon: Sparkles },
        ]}
      />
      {sub === "notificacoes" ? <NotificacoesPainel /> : <DestaquesPainel />}
    </div>
  );
}
