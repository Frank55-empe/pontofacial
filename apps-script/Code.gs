/**
 * ============================================================
 * PONTO FACIAL - BACKEND (Google Apps Script)
 * ============================================================
 * Como instalar:
 * 1. Crie uma planilha nova no Google Sheets.
 * 2. Extensões > Apps Script.
 * 3. Apague o conteúdo padrão e cole este arquivo inteiro.
 * 4. Rode a função `configurarPlanilha` uma vez (menu Executar),
 *    ela cria as 3 abas com os cabeçalhos certos.
 * 5. Implantar > Nova implantação > tipo "App da Web".
 *    - Executar como: Eu (seu e-mail)
 *    - Quem pode acessar: Qualquer pessoa
 * 6. Copie a URL gerada (termina em /exec) e cole em
 *    src/config.ts no campo APPS_SCRIPT_URL.
 */

const ABA_FUNCIONARIOS = 'funcionarios';
const ABA_REGISTROS = 'registros_ponto';
const ABA_CONFIG = 'configuracoes';

// ---- Ponto de entrada para POST (usado no cadastro/edição de ---
// ---- funcionário, porque o descritor facial é grande demais   ---
// ---- para caber numa URL de GET) ----
function doPost(e) {
  let resposta;
  try {
    const corpo = JSON.parse(e.postData.contents);
    const acao = String(corpo.acao || '').trim().toUpperCase();

    switch (acao) {
      case 'CADASTRAR_FUNCIONARIO':
        resposta = cadastrarFuncionario(corpo);
        break;
      case 'ATUALIZAR_FUNCIONARIO':
        resposta = atualizarFuncionario(corpo);
        break;
      default:
        resposta = { sucesso: false, erro: 'Ação desconhecida (POST): ' + acao };
    }
  } catch (erro) {
    resposta = { sucesso: false, erro: String(erro) };
  }

  return ContentService.createTextOutput(JSON.stringify(resposta))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Ponto de entrada único (JSONP) ----
function doGet(e) {
  // Se você rodar "doGet" direto no editor (botão Executar), o Apps
  // Script não te dá um "e" de verdade, porque doGet só existe pra
  // responder requisições HTTP reais. Esse aviso evita o erro feio
  // "Cannot read properties of undefined" e te lembra de testar
  // pela URL publicada em vez de rodar aqui dentro.
  if (!e || !e.parameter) {
    return ContentService.createTextOutput(
      'doGet não deve ser executado direto no editor. Implante como ' +
      'App da Web (Implantar > Nova implantação) e teste pela URL ' +
      'gerada, assim: SUA_URL/exec?acao=LISTAR_FUNCIONARIOS&callback=teste'
    );
  }

  const callback = e.parameter.callback;
  let resposta;

  try {
    // Normaliza o parâmetro "acao" para minúsculas e sem espaços,
    // porque alguns teclados de celular autocapitalizam a primeira
    // letra depois do "?" na barra de endereço (ex: "Acao" em vez
    // de "acao"), o que quebrava a comparação abaixo.
    const acaoBruta = e.parameter.acao || e.parameter.Acao || e.parameter.ACAO || '';
    const acao = String(acaoBruta).trim().toUpperCase();
    switch (acao) {
      case 'LISTAR_FUNCIONARIOS':
        resposta = listarFuncionarios();
        break;
      case 'CADASTRAR_FUNCIONARIO':
        resposta = cadastrarFuncionario(e.parameter);
        break;
      case 'ATUALIZAR_FUNCIONARIO':
        resposta = atualizarFuncionario(e.parameter);
        break;
      case 'REGISTRAR_PONTO':
        resposta = registrarPonto(e.parameter);
        break;
      case 'ESPELHO_PONTO':
        resposta = espelhoPonto(e.parameter);
        break;
      case 'LOGIN_ADMIN':
        resposta = loginAdmin(e.parameter);
        break;
      default:
        resposta = {
          sucesso: false,
          erro: 'Ação desconhecida: ' + acao,
          parametrosRecebidos: e.parameter,
        };
    }
  } catch (erro) {
    resposta = { sucesso: false, erro: String(erro) };
  }

  // Se testar a URL sem o parâmetro &callback=... (por exemplo, direto
  // no navegador só pra conferir se o backend responde), devolve o
  // JSON puro em vez de tentar montar um JSONP quebrado.
  if (!callback) {
    return ContentService.createTextOutput(JSON.stringify(resposta))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const saida = callback + '(' + JSON.stringify(resposta) + ')';
  return ContentService.createTextOutput(saida).setMimeType(
    ContentService.MimeType.JAVASCRIPT
  );
}

// ---- Configuração inicial das abas ----
function configurarPlanilha() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();

  criarAbaSeNaoExiste(planilha, ABA_FUNCIONARIOS, [
    'id', 'nome', 'cpf', 'cargo', 'matricula', 'dataAdmissao',
    'ativo', 'descritorFacial', 'criadoEm',
  ]);

  criarAbaSeNaoExiste(planilha, ABA_REGISTROS, [
    'id', 'funcionarioId', 'nomeFuncionario', 'tipoBatida',
    'dataHora', 'metodoConfirmacao', 'distanciaFacial', 'observacao',
  ]);

  const abaConfig = criarAbaSeNaoExiste(planilha, ABA_CONFIG, ['chave', 'valor']);
  // Usuário/senha padrão do admin -- TROQUE isso depois de instalar!
  const dados = abaConfig.getDataRange().getValues();
  if (dados.length <= 1) {
    abaConfig.appendRow(['admin_usuario', 'admin']);
    abaConfig.appendRow(['admin_senha', 'troque-esta-senha']);
    abaConfig.appendRow(['nome_empresa', 'Minha Empresa']);
  }
}

function criarAbaSeNaoExiste(planilha, nome, cabecalhos) {
  let aba = planilha.getSheetByName(nome);
  if (!aba) {
    aba = planilha.insertSheet(nome);
    aba.appendRow(cabecalhos);
    aba.setFrozenRows(1);
  }
  return aba;
}

// ---- Funcionários ----
function listarFuncionarios() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_FUNCIONARIOS);
  const linhas = aba.getDataRange().getValues();
  const cabecalho = linhas[0];
  const funcionarios = linhas.slice(1)
    .filter(linha => linha[0]) // ignora linhas vazias
    .map(linha => objetoDaLinha(cabecalho, linha))
    .filter(f => f.ativo === true || f.ativo === 'TRUE' || f.ativo === 'VERDADEIRO');

  return { sucesso: true, dados: funcionarios };
}

function cadastrarFuncionario(parametros) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_FUNCIONARIOS);
  const id = 'FUNC-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  const agora = new Date().toISOString();

  aba.appendRow([
    id,
    parametros.nome || '',
    parametros.cpf || '',
    parametros.cargo || '',
    parametros.matricula || '',
    parametros.dataAdmissao || '',
    true,
    parametros.descritorFacial || '',
    agora,
  ]);

  return { sucesso: true, dados: { id } };
}

function atualizarFuncionario(parametros) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_FUNCIONARIOS);
  const linhas = aba.getDataRange().getValues();
  const cabecalho = linhas[0];
  const colId = cabecalho.indexOf('id');

  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][colId] === parametros.id) {
      // Atualiza somente os campos enviados
      cabecalho.forEach((nomeCampo, colIndex) => {
        if (parametros[nomeCampo] !== undefined) {
          let valor = parametros[nomeCampo];
          if (nomeCampo === 'ativo') valor = valor === 'true' || valor === true;
          aba.getRange(i + 1, colIndex + 1).setValue(valor);
        }
      });
      return { sucesso: true };
    }
  }
  return { sucesso: false, erro: 'Funcionário não encontrado' };
}

// ---- Registro de ponto ----
function registrarPonto(parametros) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_REGISTROS);
  const id = 'REG-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  const agora = new Date().toISOString();

  aba.appendRow([
    id,
    parametros.funcionarioId || '',
    parametros.nomeFuncionario || '',
    parametros.tipoBatida || '',
    parametros.dataHora || agora,
    parametros.metodoConfirmacao || 'facial',
    parametros.distanciaFacial || '',
    parametros.observacao || '',
  ]);

  return { sucesso: true, dados: { id, dataHora: agora } };
}

// ---- Espelho de ponto ----
function espelhoPonto(parametros) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_REGISTROS);
  const linhas = aba.getDataRange().getValues();
  const cabecalho = linhas[0];

  const registros = linhas.slice(1)
    .map(linha => objetoDaLinha(cabecalho, linha))
    .filter(r => {
      if (r.funcionarioId !== parametros.funcionarioId) return false;
      const data = new Date(r.dataHora);
      return (
        String(data.getMonth() + 1) === String(parametros.mes) &&
        String(data.getFullYear()) === String(parametros.ano)
      );
    });

  return { sucesso: true, dados: registros };
}

// ---- Login simples do admin ----
function loginAdmin(parametros) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CONFIG);
  const linhas = aba.getDataRange().getValues();
  const config = {};
  linhas.forEach(linha => { config[linha[0]] = linha[1]; });

  const ok = parametros.usuario === config['admin_usuario'] &&
             parametros.senha === config['admin_senha'];

  return ok
    ? { sucesso: true }
    : { sucesso: false, erro: 'Usuário ou senha incorretos' };
}

// ---- Utilitário ----
function objetoDaLinha(cabecalho, linha) {
  const objeto = {};
  cabecalho.forEach((campo, i) => { objeto[campo] = linha[i]; });
  return objeto;
}
