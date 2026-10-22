import { MenuIcon, type MenuIconKind } from "@/components/hub/MenuIcon";
import { SeloDestaque } from "@/components/hub/SeloDestaque";
import { rotuloFerramentaMenu } from "@/lib/ferramentas";
import type { DestaqueCor } from "@/lib/types/shell";

type Props = { ferramentaId: string; texto: string; cor: DestaqueCor };

/** Reproduz um item do submenu da sidebar com o selo. */
export function ItemMenuPreview({ ferramentaId, texto, cor }: Props) {
  return (
    <div className="w-52 rounded-lg border border-white/10 bg-[#020617] p-2">
      <div className="flex w-full items-center gap-2 rounded-lg py-2 pl-3 pr-1.5 text-base font-medium text-white/65">
        <MenuIcon kind={ferramentaId as MenuIconKind} className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{rotuloFerramentaMenu(ferramentaId)}</span>
        {texto.trim() && <SeloDestaque texto={texto} cor={cor} />}
      </div>
    </div>
  );
}
