// ============================================================
// CONFIGURAÇÃO CENTRAL DO SISTEMA
// ============================================================
// Depois de publicar o Apps Script como Web App (Fase 1, passo
// final), cole a URL de implantação (deployment) aqui embaixo.
// Ela tem esse formato:
// https://script.google.com/macros/s/AKfycb.../exec

export const APPS_SCRIPT_URL =
  'COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT';

export const APP_CONFIG = {
  nomeEmpresa: 'Minha Empresa',
  // Distância máxima aceita entre o rosto capturado e o rosto
  // cadastrado para considerar "é a mesma pessoa". Quanto menor,
  // mais rigoroso (e mais chance de recusar por engano).
  // face-api.js recomenda algo entre 0.5 e 0.6 como padrão.
  limiarReconhecimentoFacial: 0.55,
  // Tolerância em minutos para considerar um atraso
  toleranciaAtrasoMinutos: 10,
};
