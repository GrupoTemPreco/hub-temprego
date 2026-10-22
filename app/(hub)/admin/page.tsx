"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { AdminShell } from "@/components/admin/AdminShell";

function Carregando() {
  return (
    <div className="flex flex-1 items-center justify-center text-white">Carregando painel admin...</div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin } = useUsuarioAtual();

  useEffect(() => {
    if (!isAdmin) router.push("/");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  return (
    <Suspense fallback={<Carregando />}>
      <AdminShell />
    </Suspense>
  );
}
