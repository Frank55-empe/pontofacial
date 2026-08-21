// SISTEMA DE AUDIO - VOZ HUMANIZADA (Puter.js + Amazon Polly + Gemini TTS)

declare global {
  interface Window {
    puter?: {
      ai: {
        txt2speech: (text: string, options?: {
          voice?: string;
          engine?: string;
          language?: string;
          provider?: string;
          model?: string;
          instructions?: string;
        }) => Promise<HTMLAudioElement>;
      };
    };
  }
}

interface OpcoesAudio {
  habilitado: boolean;
  velocidade: number;
  tom: number;
  volume: number;
}

const OPCOES_PADRAO: OpcoesAudio = {
  habilitado: true,
  velocidade: 1,
  tom: 1,
  volume: 1,
};

let opcoesAtuais: OpcoesAudio = { ...OPCOES_PADRAO };
let audioAtual: HTMLAudioElement | null = null;

export function configurarAudio(novasOpcoes: Partial<OpcoesAudio>): void {
  opcoesAtuais = { ...opcoesAtuais, ...novasOpcoes };
}

export function getOpcoesAudio(): OpcoesAudio {
  return { ...opcoesAtuais };
}

function obterSaudacaoHorario(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function obterMensagemDespedida(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Tenha um excelente dia';
  if (hora < 18) return 'Tenha uma boa tarde';
  return 'Tenha um bom descanso';
}

async function falarPuter(texto: string): Promise<boolean> {
  try {
    if (!window.puter || !window.puter.ai || !window.puter.ai.txt2speech) {
      return false;
    }

    if (audioAtual) {
      audioAtual.pause();
      audioAtual = null;
    }

    const audio = await window.puter.ai.txt2speech(texto, {
      voice: 'Ricardo',
      engine: 'neural',
      language: 'pt-BR',
    });

    audio.volume = opcoesAtuais.volume;
    audioAtual = audio;
    audio.play();
    return true;
  } catch {
    return false;
  }
}

async function falarGemini(texto: string): Promise<boolean> {
  try {
    if (!window.puter || !window.puter.ai || !window.puter.ai.txt2speech) {
      return false;
    }

    if (audioAtual) {
      audioAtual.pause();
      audioAtual = null;
    }

    const audio = await window.puter.ai.txt2speech(texto, {
      provider: 'gemini',
      model: 'gemini-2.5-flash-preview-tts',
      voice: 'Puck',
      instructions: 'Speak in Portuguese with a natural, friendly, masculine tone.',
    });

    audio.volume = opcoesAtuais.volume;
    audioAtual = audio;
    audio.play();
    return true;
  } catch {
    return false;
  }
}

function falarWebSpeech(texto: string): void {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.9;
  utterance.pitch = 0.85;
  utterance.volume = opcoesAtuais.volume;

  const vozes = window.speechSynthesis.getVoices();
  const vozesPt = vozes.filter(
    (v) => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang === 'pt-PT'
  );

  if (vozesPt.length > 0) {
    const naoFemininas = vozesPt.filter(
      (v) => !v.name.toLowerCase().includes('maria') &&
            !v.name.toLowerCase().includes('francisca') &&
            !v.name.toLowerCase().includes('luciana') &&
            !v.name.toLowerCase().includes('vitoria') &&
            !v.name.toLowerCase().includes('camila')
    );
    if (naoFemininas.length > 0) {
      utterance.voice = naoFemininas[0];
    } else {
      utterance.voice = vozesPt[0];
    }
  }

  window.speechSynthesis.speak(utterance);
}

function falar(texto: string): void {
  if (!opcoesAtuais.habilitado) return;

  falarPuter(texto).then((sucesso) => {
    if (!sucesso) {
      falarGemini(texto).then((sucesso2) => {
        if (!sucesso2) {
          falarWebSpeech(texto);
        }
      });
    }
  });
}

export function falarConfirmacaoPonto(
  nome: string,
  tipoBatida: 'entrada' | 'saida_almoco' | 'volta_almoco' | 'saida'
): void {
  const saudacao = obterSaudacaoHorario();
  const primeiroNome = nome.split(' ')[0];
  let mensagem: string;

  switch (tipoBatida) {
    case 'entrada':
      mensagem = saudacao + ', ' + primeiroNome + '! Ponto de entrada registrado com sucesso.';
      break;
    case 'saida_almoco':
      mensagem = saudacao + ', ' + primeiroNome + '! Saida para o almoco registrada. Bom apetite!';
      break;
    case 'volta_almoco':
      mensagem = saudacao + ', ' + primeiroNome + '! Retorno do almoco registrado com sucesso.';
      break;
    case 'saida':
      mensagem = saudacao + ', ' + primeiroNome + '! Saida registrada. ' + obterMensagemDespedida() + '!';
      break;
    default:
      mensagem = saudacao + ', ' + primeiroNome + '! Ponto registrado com sucesso.';
  }

  falar(mensagem);
}

export function tocarBipe(tipo: 'sucesso' | 'erro' = 'erro'): void {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    if (tipo === 'sucesso') {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
    } else {
      oscillator.frequency.setValueAtTime(220, ctx.currentTime);
      oscillator.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
    }
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
    oscillator.onended = () => ctx.close();
  } catch {
  }
}

export function inicializarAudio(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}
