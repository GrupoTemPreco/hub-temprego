import type { ToastApi } from "@/components/ui/Toast";
import { enviarAnexos, type FalhaAnexo } from "@/lib/ticketsAnexos";

/** Um toast por arquivo que falhou, com "Tentar de novo" para reenviar só aquele arquivo ao mesmo destino. */
export function avisarFalhasAnexos(toast: ToastApi, falhas: FalhaAnexo[], autorId: string) {
  for (const falha of falhas) {
    toast.error(`Não foi possível anexar "${falha.arquivo.nome}": ${falha.erro}.`, {
      rotulo: "Tentar de novo",
      onClick: async () => {
        const novasFalhas = await enviarAnexos(falha.destino, autorId, [falha.arquivo]);
        if (novasFalhas.length === 0) toast.success(`"${falha.arquivo.nome}" anexado.`);
        else avisarFalhasAnexos(toast, novasFalhas, autorId);
      },
    });
  }
}
