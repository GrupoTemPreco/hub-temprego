export const SENHA_MINIMA = 8;
export const MSG_SENHA_CURTA = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;

// Sem caracteres que se confundem: 0/O, 1/l/I.
const LETRAS = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const NUMEROS = "23456789";
const TODOS = LETRAS + NUMEROS;

function sortear(alfabeto: string) {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return alfabeto[n % alfabeto.length];
}

/** Senha aleatória com letras e números (pelo menos um de cada), sem caracteres parecidos. */
export function gerarSenha(tamanho = 10) {
  const caracteres = [sortear(LETRAS), sortear(NUMEROS)];
  while (caracteres.length < tamanho) caracteres.push(sortear(TODOS));
  // Embaralha para a letra e o número garantidos não ficarem sempre no começo.
  for (let i = caracteres.length - 1; i > 0; i--) {
    const [n] = crypto.getRandomValues(new Uint32Array(1));
    const j = n % (i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join("");
}
