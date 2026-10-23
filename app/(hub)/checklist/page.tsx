"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ABA_CHECKLIST } from "@/lib/telaAtual";

/** O checklist agora é uma aba do Início; sem acesso, o Início ignora a aba. */
export default function ChecklistPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?aba=${ABA_CHECKLIST}`);
  }, [router]);

  return null;
}
