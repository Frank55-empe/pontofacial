import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { api } from '../../services/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
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

          {erro && <p className="text-sm text-brand-warn">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="bg-brand-blue text-white rounded-lg py-2 font-medium hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  );
}
