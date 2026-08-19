// ============================================================
// SISTEMA DE ÁUDIO - FEEDBACK POR VOZ (Web Speech API)
// ============================================================
// Usa a API nativa do navegador (SpeechSynthesis) para falar
// mensagens de confirmação ao registrar o ponto. Não precisa de
// nenhum arquivo de áudio externo, funciona offline e é gratuito.

interface OpcoesAudio {
  habilitado: boolean;
  velocidade: number; // 0.1 a 10 (padrão: 1)
  tom: number; // 0 a 2 (padrão: 1), 1 = voz padrão
  volume: number; // 0 a 1 (padrão: 1)
}

const OPCOES_PADRAO: OpcoesAudio = {
  habilitado: true,
  velocidade: 0.95,
  tom: 1,
  volume: 1,
};

let opcoesAtuais: OpcoesAudio = { ...OPCOES_PADRAO };

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

/**
 * Fala um texto usando a Web Speech API.
 * Cancela qualquer fala anterior antes de iniciar.
 */
export function falar(texto: string): void {
  if (!opcoesAtuais.habilitado) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'pt-BR';
  utterance.rate = opcoesAtuais.velocidade;
  utterance.pitch = opcoesAtuais.tom;
  utterance.volume = opcoesAtuais.volume;

  // Tenta encontrar uma voz em português brasileiro
  const vozes = window.speechSynthesis.getVoices();
  const vozPt = vozes.find(
    (v) => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang === 'pt-PT'
  );
  if (vozPt) utterance.voice = vozPt;

  window.speechSynthesis.speak(utterance);
}

/**
 * Gera e fala a mensagem de confirmação de ponto registrado.
 * A mensagem varia conforme o horário e o tipo de batida.
 */
export function falarConfirmacaoPonto(
  nome: string,
  tipoBatida: 'entrada' | 'saida_almoco' | 'volta_almoco' | 'saida'
): void {
  const saudacao = obterSaudacaoHorario();
  const primeiroNome = nome.split(' ')[0];

  let mensagem: string;

  switch (tipoBatida) {
    case 'entrada':
      mensagem = `${saudacao}, ${primeiroNome}! Seu ponto de entrada foi registrado com sucesso.`;
      break;
    case 'saida_almoco':
      mensagem = `${saudacao}, ${primeiroNome}! Saída para o almoço registrada. Bom apetite!`;
      break;
    case 'volta_almoco':
      mensagem = `${saudacao}, ${primeiroNome}! Retorno do almoço registrado com sucesso.`;
      break;
    case 'saida':
      mensagem = `${saudacao}, ${primeiroNome}! Sua saída foi registrada. ${obterMensagemDespedida()}!`;
      break;
    default:
      mensagem = `${saudacao}, ${primeiroNome}! Seu ponto foi registrado com sucesso.`;
  }

  falar(mensagem);
}

/**
 * Toca um bipe simples usando Web Audio API.
 * Usado para alertas de erro (rosto não reconhecido, etc).
 */
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
    // Se o AudioContext falhar (ex: navegador antigo), simplesmente ignora
  }
}

/**
 * Inicializa o carregamento das vozes. Alguns navegadores
 * carregam as vozes de forma assíncrona.
 */
export function inicializarAudio(): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
