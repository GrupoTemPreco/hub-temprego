import { File, FileSpreadsheet, FileText, Image as IconeImagem } from "lucide-react";

const PLANILHAS = ["sheet", "excel", "csv"];
const DOCUMENTOS = ["pdf", "word", "msword", "text/plain"];

export function IconeArquivo({ tipo, className = "h-4 w-4" }: { tipo: string | null; className?: string }) {
  const t = tipo ?? "";
  if (t.startsWith("image/")) return <IconeImagem className={className} />;
  if (PLANILHAS.some((p) => t.includes(p))) return <FileSpreadsheet className={`${className} text-emerald-300`} />;
  if (t.includes("pdf")) return <FileText className={`${className} text-rose-300`} />;
  if (DOCUMENTOS.some((p) => t.includes(p))) return <FileText className={`${className} text-sky-300`} />;
  return <File className={className} />;
}
