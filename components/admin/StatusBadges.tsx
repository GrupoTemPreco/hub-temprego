import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { rotuloStatus } from "@/lib/format";

const VARIANTE_USUARIO: Record<string, BadgeVariant> = {
  pendente: "warning",
  aprovado: "success",
  rejeitado: "danger",
};

export function UsuarioStatusBadge({ status }: { status: string | null }) {
  return <Badge variant={VARIANTE_USUARIO[status ?? ""] ?? "neutral"}>{rotuloStatus(status)}</Badge>;
}
