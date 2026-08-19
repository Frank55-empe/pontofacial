import type { TipoBatida } from '../types';

// ============================================================
// RETORNO POR VOZ
// ============================================================
// Usa a API de síntese de voz nativa do navegador (Web Speech API).
// Não precisa de nenhum arquivo de áudio nem serviço externo — a
// própria "voz" do sistema operacional/navegador da pessoa lê o
// texto em voz alta. Funciona em Chrome, Edge e a maioria dos
// navegadores modernos, tanto no computador quanto no celular.

let vozPreferida: SpeechSynthesisVoice | null = null;
let vozesCarregadas = false;

function carregarVozes() {
  if (!('speechSynthesis' in window)) return;
  const vozes = window.speechSynthesis.getVoices();
  if (vozes.length === 0) return;

  vozPreferida =
    vozes.find(v => v.lang === 'pt-BR' && /google/i.test(v.name)) ||
    vozes.find(v => v.lang === 'pt-BR') ||
    vozes.find(v => v.lang?.startsWith('pt')) ||
    null;

  vozesCarregadas = true;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  carregarVozes();
  window.speechSynthesis.onvoiceschanged = carregarVozes;
}

export function falar(texto: string) {
  if (!('speechSynthesis' in window)) return;
  if (!vozesCarregadas) carregarVozes();

  window.speechSynthesis.cancel(); // interrompe qualquer fala anterior ainda em andamento

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'pt-BR';
  utterance.rate = 1;
  utterance.pitch = 1;
  if (vozPreferida) utterance.voice = vozPreferida;

  window.speechSynthesis.speak(utterance);
}

function saudacaoPorHorario(data: Date): string {
  const hora = data.getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

const MENSAGEM_POR_TIPO: Record<TipoBatida, string> = {
  entrada: 'Seu ponto foi registrado com sucesso.',
  saida_almoco: 'Ponto de saída para o almoço registrado. Bom apetite!',
  volta_almoco: 'Ponto de volta do almoço registrado. Vamos ao trabalho!',
  saida: 'Ponto de saída registrado. Tenha um bom descanso!',
};

/** Fala a saudação (bom dia/tarde/noite) + confirmação do ponto, personalizada para o tipo de batida */
export function falarConfirmacaoPonto(nomeCompleto: string, tipo: TipoBatida, quando: Date) {
  const primeiroNome = nomeCompleto.trim().split(' ')[0];
  const saudacao = saudacaoPorHorario(quando);
  const mensagem = `${saudacao}, ${primeiroNome}. ${MENSAGEM_POR_TIPO[tipo]}`;
  falar(mensagem);
}

export function falarRostoNaoReconhecido() {
  falar('Rosto não reconhecido. Procure o administrador para verificar seu cadastro.');
}
