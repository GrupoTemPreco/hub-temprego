function saudacaoPorHorario(hora: number) {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

type Props = {
  nome: string | null;
  subtitulo?: string;
};

export function SaudacaoUsuario({ nome, subtitulo = "O que você quer acessar hoje?" }: Props) {
  const primeiroNome = nome?.trim().split(/\s+/)[0];
  const saudacao = saudacaoPorHorario(new Date().getHours());

  return (
    <header>
      <h1 className="text-2xl font-semibold text-texto">
        {saudacao}
        {primeiroNome ? `, ${primeiroNome}` : ""}!
      </h1>
      <p className="mt-1 text-sm text-texto-suave">{subtitulo}</p>
    </header>
  );
}
