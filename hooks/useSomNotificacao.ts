"use client";

import { useCallback, useEffect, useRef } from "react";

const ARQUIVO_PADRAO = "/sons/notificacao.mp3";
const INTERVALO_MINIMO_MS = 10_000;
/** Ganho da reserva (Web Audio) no volume 0,8 fica em torno de 0,6. */
const FATOR_GANHO_RESERVA = 0.75;

type JanelaComWebkit = Window & { webkitAudioContext?: typeof AudioContext };

type Opcoes = {
  /** De 0 a 1 (volume efetivo, decidido por quem chama). */
  volume: number;
  /** Falso silencia `tocar` (o "Testar som" continua tocando). */
  ligado: boolean;
  arquivo?: string;
};

function criarContexto(): AudioContext | null {
  try {
    const Construtor = window.AudioContext ?? (window as JanelaComWebkit).webkitAudioContext;
    return Construtor ? new Construtor() : null;
  } catch {
    return null;
  }
}

/** Uma nota senoidal curta com fade out (som de reserva). */
function nota(ctx: AudioContext, frequencia: number, inicio: number, duracao: number, ganhoInicial: number) {
  const osc = ctx.createOscillator();
  const ganho = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequencia;
  ganho.gain.setValueAtTime(Math.max(ganhoInicial, 0.0002), inicio);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
  osc.connect(ganho).connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + duracao);
}

/**
 * Som de notificação a partir de um arquivo (HTMLAudioElement), pré-carregado ao montar.
 * O áudio é liberado na primeira interação com a página (toque silencioso e pausa).
 * Se o arquivo não carregar, toca um "plim" da Web Audio API como reserva. Falhas ficam em silêncio.
 * Use uma instância só (SomNotificacaoProvider): o intervalo mínimo vale para o hub inteiro.
 */
export function useSomNotificacao({ volume, ligado, arquivo = ARQUIVO_PADRAO }: Opcoes) {
  const ligadoRef = useRef(ligado);
  const volumeRef = useRef(volume);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const arquivoFalhouRef = useRef(false);
  const contextoRef = useRef<AudioContext | null>(null);
  const ultimoRef = useRef(0);
  /** Muda a cada toque real, para a liberação silenciosa não pausar um som de verdade. */
  const geracaoRef = useRef(0);

  useEffect(() => {
    ligadoRef.current = ligado;
  }, [ligado]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Pré-carrega o arquivo assim que o hub abre.
  useEffect(() => {
    const audio = new Audio(arquivo);
    audio.preload = "auto";
    const aoFalhar = () => {
      arquivoFalhouRef.current = true;
    };
    audio.addEventListener("error", aoFalhar);
    audio.load();
    audioRef.current = audio;
    arquivoFalhouRef.current = false;
    return () => {
      audio.removeEventListener("error", aoFalhar);
      audio.pause();
      audioRef.current = null;
    };
  }, [arquivo]);

  // Libera o áudio na primeira interação. "blur" cobre o primeiro clique direto num iframe de dashboard.
  useEffect(() => {
    const eventos = ["pointerdown", "keydown", "touchstart"] as const;
    const remover = () => {
      eventos.forEach((e) => window.removeEventListener(e, liberar));
      window.removeEventListener("blur", liberar);
    };
    function liberar() {
      contextoRef.current ??= criarContexto();
      const audio = audioRef.current;
      if (!audio || arquivoFalhouRef.current) {
        remover();
        return;
      }
      const geracao = geracaoRef.current;
      audio.muted = true;
      audio
        .play()
        .then(() => {
          if (geracaoRef.current === geracao) {
            audio.pause();
            audio.currentTime = 0;
          }
          audio.muted = false;
          remover();
        })
        .catch(() => {
          // Ainda sem permissão: tenta de novo na próxima interação.
          audio.muted = false;
        });
    }
    eventos.forEach((e) => window.addEventListener(e, liberar, { passive: true }));
    window.addEventListener("blur", liberar);
    return remover;
  }, []);

  const tocarReserva = useCallback((volumeDoToque: number) => {
    try {
      const ctx = (contextoRef.current ??= criarContexto());
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const ganho = FATOR_GANHO_RESERVA * volumeDoToque;
      const t = ctx.currentTime;
      nota(ctx, 880, t, 0.16, ganho);
      nota(ctx, 1318.5, t + 0.1, 0.22, ganho);
    } catch {
      // Falha em silêncio.
    }
  }, []);

  const reproduzir = useCallback((volumeDoToque: number) => {
    geracaoRef.current += 1;
    const audio = audioRef.current;
    if (!audio || arquivoFalhouRef.current) {
      tocarReserva(volumeDoToque);
      return;
    }
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = volumeDoToque;
      audio.play().catch((err: unknown) => {
        // Arquivo inválido ou formato sem suporte: usa a reserva. Bloqueio do navegador: silêncio.
        if (err instanceof DOMException && err.name === "NotSupportedError") {
          arquivoFalhouRef.current = true;
          tocarReserva(volumeDoToque);
        }
      });
    } catch {
      tocarReserva(volumeDoToque);
    }
  }, [tocarReserva]);

  /** Para os avisos: respeita o som desligado e o intervalo mínimo de 10 segundos. */
  const tocar = useCallback(() => {
    if (!ligadoRef.current || Date.now() - ultimoRef.current < INTERVALO_MINIMO_MS) return;
    ultimoRef.current = Date.now();
    reproduzir(volumeRef.current);
  }, [reproduzir]);

  /** Botão "Testar som": toca agora, no volume informado (ex.: o do slider, antes de salvar). */
  const testar = useCallback((volumeTeste?: number) => reproduzir(volumeTeste ?? volumeRef.current), [reproduzir]);

  return { tocar, testar };
}
