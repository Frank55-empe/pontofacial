// ============================================================
// CONFIGURAÇÃO CENTRAL DO SISTEMA
// ============================================================

export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzadsGtGm6bw3nU-x0s38IP_xO-3YaeWAsv4_uCnE833utsPSgGcR907wnW_Nx2J64P/exec';

export const APP_CONFIG = {
  nomeEmpresa: 'Minha Empresa',
  limiarReconhecimentoFacial: 0.55,
  toleranciaAtrasoMinutos: 10,
  horasJornadaPadrao: 8,
  // Configurações de áudio
  audio: {
    habilitado: true, // false para silenciar o sistema
    velocidadeFala: 0.95, // 0.1 (lento) a 10 (rápido)
    tomVoz: 1, // 0 (grave) a 2 (agudo)
    volume: 1, // 0 a 1
  },
};
