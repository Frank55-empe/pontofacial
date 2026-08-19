import { APPS_SCRIPT_URL } from '../config';
import type { ApiResponse, RegistroPonto } from '../types';

// ============================================================
// COMUNICAÇÃO COM O GOOGLE APPS SCRIPT
// ============================================================

function validarUrl() {
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_URL.startsWith('https://script.google.com')) {
    throw new Error(
      `A URL do Apps Script em config.ts não parece válida. Valor atual: "${APPS_SCRIPT_URL}"`
    );
  }
}

async function chamarViaFetch<T>(params: Record<string, string>): Promise<ApiResponse<T>> {
  const query = new URLSearchParams(params).toString();
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 15000);
  try {
    const resposta = await fetch(`${APPS_SCRIPT_URL}?${query}`, {
      method: 'GET',
      signal: controlador.signal,
    });
    if (!resposta.ok) {
      throw new Error(`Servidor respondeu com status ${resposta.status}`);
    }
    return (await resposta.json()) as ApiResponse<T>;
  } finally {
    clearTimeout(timeout);
  }
}

let callbackContador = 0;

function chamarViaJSONP<T>(params: Record<string, string>): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    callbackContador += 1;
    const nomeCallback = `pontoCallback_${Date.now()}_${callbackContador}`;

    const timeout = setTimeout(() => {
      limpar();
      reject(new Error('Tempo esgotado ao falar com o servidor. Verifique sua internet.'));
    }, 15000);

    function limpar() {
      clearTimeout(timeout);
      delete (window as unknown as Record<string, unknown>)[nomeCallback];
      script.remove();
    }

    (window as unknown as Record<string, unknown>)[nomeCallback] = (resposta: ApiResponse<T>) => {
      limpar();
      resolve(resposta);
    };

    const query = new URLSearchParams({ ...params, callback: nomeCallback }).toString();
    const script = document.createElement('script');
    script.src = `${APPS_SCRIPT_URL}?${query}`;
    script.onerror = () => {
      limpar();
      reject(new Error('Não foi possível conectar ao servidor. Confira a URL do Apps Script em config.ts e sua conexão de internet.'));
    };
    document.body.appendChild(script);
  });
}

async function chamarBackend<T>(params: Record<string, string>): Promise<ApiResponse<T>> {
  validarUrl();
  try {
    return await chamarViaFetch<T>(params);
  } catch {
    return await chamarViaJSONP<T>(params);
  }
}

// ---- Funções expostas para o resto do app ----
export const api = {
  /** Lista todos os funcionários ativos, com seus descritores faciais */
  listarFuncionarios: () =>
    chamarBackend({ acao: 'LISTAR_FUNCIONARIOS' }),

  /** Cadastra um novo funcionário */
  cadastrarFuncionario: (dados: Record<string, string>) =>
    chamarBackend({ acao: 'CADASTRAR_FUNCIONARIO', ...dados }),

  /** Atualiza dados de um funcionário existente */
  atualizarFuncionario: (id: string, dados: Record<string, string>) =>
    chamarBackend({ acao: 'ATUALIZAR_FUNCIONARIO', id, ...dados }),

  /** Registra uma batida de ponto */
  registrarPonto: (dados: Record<string, string>) =>
    chamarBackend({ acao: 'REGISTRAR_PONTO', ...dados }),

  /** Busca o espelho de ponto de um funcionário num período */
  buscarEspelhoPonto: (funcionarioId: string, mes: string, ano: string) =>
    chamarBackend({ acao: 'ESPELHO_PONTO', funcionarioId, mes, ano }),

  /** Login do admin */
  loginAdmin: (usuario: string, senha: string) =>
    chamarBackend({ acao: 'LOGIN_ADMIN', usuario, senha }),

  /** Lista os registros de ponto do funcionário no dia atual */
  listarRegistrosDoDia: (funcionarioId: string): Promise<ApiResponse<RegistroPonto[]>> =>
    chamarBackend<RegistroPonto[]>({ acao: 'LISTAR_REGISTROS_DIA', funcionarioId }),
};
