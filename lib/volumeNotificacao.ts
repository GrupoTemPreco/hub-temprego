import { supabase } from "@/lib/supabase";
import { lerConfiguracao } from "@/lib/configuracoes";

export const CHAVE_SOM = "som_notificacao";
export const VOLUME_GLOBAL_PADRAO = 1;

type ValorSom = { volume?: number };

function falhar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function limitarVolume(v: unknown, padrao = VOLUME_GLOBAL_PADRAO) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : padrao;
}

/** Pessoal, se houver; senão, o de todos. */
export function volumeEfetivo(pessoal: number | null, global: number) {
  return pessoal ?? global;
}

export async function lerVolumeGlobal() {
  const valor = await lerConfiguracao<ValorSom>(CHAVE_SOM, { volume: VOLUME_GLOBAL_PADRAO });
  return limitarVolume(valor?.volume);
}

/** Só para admin (a RPC confere). */
export async function definirVolumeGlobal(volume: number) {
  const { error } = await supabase.rpc("definir_volume_global", { p_volume: volume });
  falhar(error);
}

/** Nulo volta a usar o volume de todos. */
export async function salvarVolumePessoal(usuarioId: string, volume: number | null) {
  const { error } = await supabase.from("usuarios").update({ volume_notificacao: volume }).eq("id", usuarioId);
  falhar(error);
}

/** Mudanças em configuracoes['som_notificacao'] (ex.: admin salvou "para todos"). */
export function assinarVolumeGlobal(aoMudar: (volume: number) => void) {
  const canal = supabase
    .channel(`configuracoes-som-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "shell", table: "configuracoes", filter: `chave=eq.${CHAVE_SOM}` },
      (payload) => {
        const novo = payload.new as { valor?: ValorSom } | null;
        if (novo?.valor) aoMudar(limitarVolume(novo.valor.volume));
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}
