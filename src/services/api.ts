import { APPS_SCRIPT_URL } from '../config';
import type { ApiResponse } from '../types';

// ============================================================
// COMUNICAÇÃO COM O GOOGLE APPS SCRIPT VIA JSONP
// ============================================================
// Por que JSONP e não fetch() normal?
// Porque o Google Apps Script, quando publicado como Web App,
// não devolve os cabeçalhos de CORS que o navegador exige pra
// aceitar a resposta de um fetch() comum. JSONP contorna isso
// carregando a resposta como uma tag <script>, que não sofre
// bloqueio de CORS. É o mesmo truque usado no Bolão da Mega PRO
// e no Bolão Copa 2026.

let callbackContador = 0;

function chamarViaJSONP<T>(params: Record<string, string>): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_URL.startsWith('https://script.google.com')) {
      reject(new Error(
        `A URL do Apps Script em config.ts não parece válida. Valor atual: "${APPS_SCRIPT_URL}"`
      ));
      return;
    }

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
      reject(new Error('Não foi possível conectar ao servidor. Confira a URL do Apps Script em config.ts.'));
    };
    document.body.appendChild(script);
  });
}

// ---- Funções expostas para o resto do app ----

export const api = {
  /** Lista todos os funcionários ativos, com seus descritores faciais, para reconhecimento 1:n */
  listarFuncionarios: () =>
    chamarViaJSONP({ acao: 'LISTAR_FUNCIONARIOS' }),

  /** Cadastra um novo funcionário (nome, cpf, cargo, descritor facial) */
  cadastrarFuncionario: (dados: Record<string, string>) =>
    chamarViaJSONP({ acao: 'CADASTRAR_FUNCIONARIO', ...dados }),

  /** Atualiza dados de um funcionário existente (ex: desativar, trocar cargo) */
  atualizarFuncionario: (id: string, dados: Record<string, string>) =>
    chamarViaJSONP({ acao: 'ATUALIZAR_FUNCIONARIO', id, ...dados }),

  /** Registra uma batida de ponto */
  registrarPonto: (dados: Record<string, string>) =>
    chamarViaJSONP({ acao: 'REGISTRAR_PONTO', ...dados }),

  /** Busca o espelho de ponto de um funcionário num período */
  buscarEspelhoPonto: (funcionarioId: string, mes: string, ano: string) =>
    chamarViaJSONP({ acao: 'ESPELHO_PONTO', funcionarioId, mes, ano }),

  /** Login simples do admin (usuário/senha guardados numa aba de configurações) */
  loginAdmin: (usuario: string, senha: string) =>
    chamarViaJSONP({ acao: 'LOGIN_ADMIN', usuario, senha }),
};
