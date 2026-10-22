"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useUsuarioAtual } from "@/components/hub/UsuarioAtualProvider";
import { carregarLimitesPlano, salvarLimitesPlano, type LimitesPlano } from "@/lib/admin/armazenamento";

const CAMPO = "w-full rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

type Props = { onClose: () => void; onSalvo: () => void };

function valido(texto: string) {
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Limites incluídos no plano (shell.configuracoes), usados nos cards de uso de espaço. */
export function LimitesPlanoModal({ onClose, onSalvo }: Props) {
  const toast = useToast();
  const usuario = useUsuarioAtual();
  const [atuais, setAtuais] = useState<LimitesPlano | null>(null);
  const [banco, setBanco] = useState("");
  const [storage, setStorage] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarLimitesPlano()
      .then((l) => {
        if (!ativo) return;
        setAtuais(l);
        setBanco(String(l.bancoGb));
        setStorage(String(l.storageGb));
      })
      .catch((err) => toast.error(`Erro ao carregar os limites: ${err instanceof Error ? err.message : String(err)}`));
    return () => {
      ativo = false;
    };
  }, [toast]);

  const bancoGb = valido(banco);
  const storageGb = valido(storage);

  async function salvar() {
    if (!atuais || bancoGb === null || storageGb === null) return;
    setSalvando(true);
    try {
      await salvarLimitesPlano({ bancoGb, storageGb }, atuais, usuario.id);
      toast.success("Limites do plano atualizados.");
      onSalvo();
      onClose();
    } catch (err) {
      toast.error(`Erro ao salvar os limites: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open
      onClose={salvando ? () => {} : onClose}
      title="Limites do plano"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || !atuais || bancoGb === null || storageGb === null}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      {!atuais ? (
        <p className="text-sm text-white/55">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-white/55">
            Quanto o plano do Supabase inclui. Usado para calcular o espaço disponível e os alertas.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">Limite do banco de dados (GB)</span>
            <input type="number" min={0} step="any" className={CAMPO} value={banco} onChange={(e) => setBanco(e.target.value)} />
            {bancoGb === null && <span className="mt-1 block text-xs text-rose-400">Informe um número maior que zero.</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">Limite do Storage (GB)</span>
            <input
              type="number"
              min={0}
              step="any"
              className={CAMPO}
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
            />
            {storageGb === null && <span className="mt-1 block text-xs text-rose-400">Informe um número maior que zero.</span>}
          </label>
        </div>
      )}
    </Modal>
  );
}
