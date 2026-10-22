"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ARQUIVO_PADRAO = "/sons/notificacao.mp3";
const INTERVALO_MINIMO_MS = 10_000;
const VOLUME_PADRAO = 0.8;
/** Ganho da reserva (Web Audio) no volume padrão fica em torno de 0,6. */
const FATOR_GANHO_RESERVA = 0.75;

type JanelaComWebkit = Window & { webkitAudioContext?: typeof AudioContext };

type Opcoes = {
  /** Chave do localStorage com "ligado"/"desligado" (padrão: ligado). */
  chavePreferencia: string;
  /** Chave do localStorage com o volume de 0 a 1 (padrão: 0,8). */
  chaveVolume: string;
  arquivo?: string;
};

function ler(chave: string) {
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function salvar(chave: string, valor: string) {
  try {
    window.localStorage.setItem(chave, valor);
  } catch {
    // Sem localStorage (modo privado, bloqueio): a preferência vale só nesta sessão.
  }
}

function lerVolume(chave: string) {
  const v = Number(ler(chave));
  return ler(chave) !== null && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : VOLUME_PADRAO;
}

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
 */
export function useSomNotificacao({ chavePreferencia, chaveVolume, arquivo = ARQUIVO_PADRAO }: Opcoes) {
  const [ligado, setLigado] = useState(() => ler(chavePreferencia) !== "desligado");
  const [volume, setVolume] = useState(() => lerVolume(chaveVolume));
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

  const tocarReserva = useCallback(() => {
    try {
      const ctx = (contextoRef.current ??= criarContexto());
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const ganho = FATOR_GANHO_RESERVA * volumeRef.current;
      const t = ctx.currentTime;
      nota(ctx, 880, t, 0.16, ganho);
      nota(ctx, 1318.5, t + 0.1, 0.22, ganho);
    } catch {
      // Falha em silêncio.
    }
  }, []);

  const reproduzir = useCallback(() => {
    geracaoRef.current += 1;
    const audio = audioRef.current;
    if (!audio || arquivoFalhouRef.current) {
      tocarReserva();
      return;
    }
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = volumeRef.current;
      audio.play().catch((err: unknown) => {
        // Arquivo inválido ou formato sem suporte: usa a reserva. Bloqueio do navegador: silêncio.
        if (err instanceof DOMException && err.name === "NotSupportedError") {
          arquivoFalhouRef.current = true;
          tocarReserva();
        }
      });
    } catch {
      tocarReserva();
    }
  }, [tocarReserva]);

  /** Para os avisos: respeita o som desligado e o intervalo mínimo de 10 segundos. */
  const tocar = useCallback(() => {
    if (!ligadoRef.current || Date.now() - ultimoRef.current < INTERVALO_MINIMO_MS) return;
    ultimoRef.current = Date.now();
    reproduzir();
  }, [reproduzir]);

  /** Botão "Testar som": toca agora, no volume atual. */
  const testar = useCallback(() => reproduzir(), [reproduzir]);

  const alternar = useCallback(() => {
    const novo = !ligadoRef.current;
    setLigado(novo);
    salvar(chavePreferencia, novo ? "ligado" : "desligado");
  }, [chavePreferencia]);

  const definirVolume = useCallback(
    (novo: number) => {
      const v = Math.min(1, Math.max(0, novo));
      volumeRef.current = v;
      setVolume(v);
      salvar(chaveVolume, String(v));
    },
    [chaveVolume],
  );

  return { ligado, alternar, volume, definirVolume, tocar, testar };
}
