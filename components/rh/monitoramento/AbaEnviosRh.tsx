import { Inbox, Send } from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatarDataHoraSP } from "@/lib/datas";
import { formatarHoras, horasEntre } from "@/lib/rhRegras";
import type { EnvioRh } from "@/lib/rhMonitoramento";
import { STATUS_DESTINATARIO } from "@/components/checklist/envios/textosLote";

type SecaoProps = {
  titulo: string;
  icone: ComponentType<{ className?: string }>;
  envios: EnvioRh[];
  outraParte: (e: EnvioRh) => string;
};

function SecaoEnvios({ titulo, icone: Icone, envios, outraParte }: SecaoProps) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
        <Icone className="h-4 w-4" /> {titulo} ({envios.length})
      </h3>
      {envios.length === 0 ? (
        <p className="py-2 text-sm text-white/45">Nenhuma nos últimos 90 dias.</p>
      ) : (
        <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
          {envios.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white/90">{e.titulo}</span>
                <span className="block truncate text-xs text-white/50">
                  {outraParte(e)} · {formatarDataHoraSP(e.criado_em)}
                </span>
              </span>
              <span className="text-xs text-white/55" title="Tempo até a resposta">
                {e.respondido_em ? `Respondeu em ${formatarHoras(horasEntre(e.criado_em, e.respondido_em))}` : "Sem resposta"}
              </span>
              <Badge variant={STATUS_DESTINATARIO[e.status].cor}>{STATUS_DESTINATARIO[e.status].texto}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Tarefas recebidas e enviadas pela pessoa nos últimos 90 dias (como a RPC devolve). */
export function AbaEnviosRh({ envios, usuarioId }: { envios: EnvioRh[]; usuarioId: string }) {
  const ordenados = [...envios].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  return (
    <div className="space-y-5">
      <SecaoEnvios
        titulo="Recebidas"
        icone={Inbox}
        envios={ordenados.filter((e) => e.para_usuario_id === usuarioId)}
        outraParte={(e) => `De ${e.de_nome ?? "—"}`}
      />
      <SecaoEnvios
        titulo="Enviadas"
        icone={Send}
        envios={ordenados.filter((e) => e.de_usuario_id === usuarioId)}
        outraParte={(e) => `Para ${e.para_nome ?? "—"}`}
      />
    </div>
  );
}
