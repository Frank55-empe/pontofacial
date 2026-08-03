// ============================================================
// TIPOS COMPARTILHADOS
// ============================================================

export interface Funcionario {
  id: string; // gerado automaticamente (ex: FUNC-0001)
  nome: string;
  cpf: string;
  cargo: string;
  matricula?: string;
  dataAdmissao: string; // YYYY-MM-DD
  ativo: boolean;
  // Vetor de 128 números que representa o rosto da pessoa.
  // Gerado pelo face-api.js, guardado como string separada por
  // vírgula dentro da célula do Google Sheets.
  descritorFacial: string;
  criadoEm: string; // ISO timestamp
}

export type TipoBatida = 'entrada' | 'saida_almoco' | 'volta_almoco' | 'saida';

export interface RegistroPonto {
  id: string;
  funcionarioId: string;
  nomeFuncionario: string;
  tipoBatida: TipoBatida;
  dataHora: string; // ISO timestamp
  metodoConfirmacao: 'facial' | 'manual_admin';
  distanciaFacial?: number; // quão próximo do cadastro (quanto menor, mais parecido)
  observacao?: string;
}

export interface EspelhoPontoDia {
  data: string;
  entrada?: string;
  saidaAlmoco?: string;
  voltaAlmoco?: string;
  saida?: string;
  horasTrabalhadas?: string;
  status: 'completo' | 'incompleto' | 'falta';
}

// ---- Formato de resposta padrão do Apps Script ----
export interface ApiResponse<T = unknown> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
}
