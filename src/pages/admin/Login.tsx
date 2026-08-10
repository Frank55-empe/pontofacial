import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { api } from '../../services/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { APPS_SCRIPT_URL } from '../../config';

export function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [diagnosticando, setDiagnosticando] = useState(false);
  const { entrar } = useAdminAuth();
  const navegar = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const resposta = await api.loginAdmin(usuario, senha);
      if (resposta.sucesso) {
        entrar();
        navegar('/admin');
      } else {
        setErro(resposta.erro || 'Usuário ou senha incorretos');
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  }

  async function testarConexao() {
    setDiagnosticando(true);
    setDiagnostico('Testando...');
    const linhas: string[] = [];

    // Teste 1: fetch() simples, só pra ver se o navegador consegue
    // alcançar o domínio do Apps Script.
    try {
      const inicio = Date.now();
      await fetch(`${APPS_SCRIPT_URL}?acao=LISTAR_FUNCIONARIOS&callback=diag`, { mode: 'no-cors' });
      linhas.push(`✅ fetch() alcançou o servidor (${Date.now() - inicio}ms)`);
    } catch (err) {
      linhas.push(`❌ fetch() falhou: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Teste 2: exatamente o mesmo método que o app usa de verdade (tag <script>)
    try {
      const resultadoScript = await new Promise<string>((resolve, reject) => {
        const nomeCallback = `diagCallback_${Date.now()}`;
        const timeout = setTimeout(() => {
          delete (window as unknown as Record<string, unknown>)[nomeCallback];
          tag.remove();
          reject(new Error('tempo esgotado (10s) esperando o <script> carregar'));
        }, 10000);
        (window as unknown as Record<string, unknown>)[nomeCallback] = () => {
          clearTimeout(timeout);
          delete (window as unknown as Record<string, unknown>)[nomeCallback];
          tag.remove();
          resolve('respondeu com sucesso');
        };
        const tag = document.createElement('script');
        tag.src = `${APPS_SCRIPT_URL}?acao=LISTAR_FUNCIONARIOS&callback=${nomeCallback}`;
        tag.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('o navegador bloqueou ou não conseguiu carregar o <script> (evento onerror)'));
        };
        document.body.appendChild(tag);
      });
      linhas.push(`✅ Tag <script> (método real do app): ${resultadoScript}`);
    } catch (err) {
      linhas.push(`❌ Tag <script> (método real do app): ${err instanceof Error ? err.message : String(err)}`);
    }

    setDiagnostico(linhas.join('\n'));
    setDiagnosticando(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Área administrativa" />
      <main className="flex-1 flex items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm flex flex-col gap-4"
        >
          <h2 className="text-lg font-semibold text-brand-dark text-center">Entrar</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-brand-dark/70">Usuário</label>
            <input
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              className="border border-brand-dark/20 rounded-lg px-3 py-2 outline-none focus:border-brand-blue"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-brand-dark/70">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="border border-brand-dark/20 rounded-lg px-3 py-2 outline-none focus:border-brand-blue"
              required
            />
          </div>

          {erro && (
            <div className="text-sm text-brand-warn bg-brand-warn/10 rounded-lg p-3 flex flex-col gap-1">
              <p>{erro}</p>
              <p className="text-xs text-brand-dark/50 break-all">
                URL configurada no app: {APPS_SCRIPT_URL}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="bg-brand-blue text-white rounded-lg py-2 font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={testarConexao}
            disabled={diagnosticando}
            className="text-xs text-brand-blue underline disabled:opacity-60"
          >
            {diagnosticando ? 'Diagnosticando...' : 'Diagnosticar conexão com o servidor'}
          </button>

          {diagnostico && (
            <pre className="text-xs bg-brand-light rounded-lg p-3 whitespace-pre-wrap break-all border border-brand-dark/10">
              {diagnostico}
            </pre>
          )}
        </form>
      </main>
    </div>
  );
}
