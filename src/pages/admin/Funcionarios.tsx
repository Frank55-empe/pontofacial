import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { api } from '../../services/api';
import type { Funcionario } from '../../types';

export function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [desativando, setDesativando] = useState<string | null>(null);

  function carregar() {
    setCarregando(true);
    api.listarFuncionarios()
      .then(resposta => {
        if (resposta.sucesso) {
          setFuncionarios((resposta.dados as Funcionario[]) || []);
        } else {
          setErro(resposta.erro || 'Erro ao carregar funcionários');
        }
      })
      .catch(e => setErro(e instanceof Error ? e.message : 'Erro ao conectar com o servidor'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => { carregar(); }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return funcionarios;
    return funcionarios.filter(f =>
      f.nome.toLowerCase().includes(termo) ||
      f.cargo?.toLowerCase().includes(termo) ||
      f.cpf?.includes(termo)
    );
  }, [funcionarios, busca]);

  async function desativar(f: Funcionario) {
    if (!confirm(`Desativar ${f.nome}? A pessoa deixa de aparecer na lista e no reconhecimento facial.`)) return;
    setDesativando(f.id);
    try {
      const resposta = await api.atualizarFuncionario(f.id, { ativo: 'false' });
      if (resposta.sucesso) {
        setFuncionarios(prev => prev.filter(x => x.id !== f.id));
      } else {
        alert(resposta.erro || 'Erro ao desativar');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao conectar com o servidor');
    } finally {
      setDesativando(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Funcionários" />
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="flex justify-between items-center mb-4">
          <Link to="/admin" className="text-sm text-brand-blue underline">Voltar</Link>
          <Link
            to="/admin/funcionarios/novo"
            className="bg-brand-blue text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
          >
            + Novo funcionário
          </Link>
        </div>

        {!carregando && funcionarios.length > 0 && (
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, cargo ou CPF..."
            className="w-full border border-brand-dark/20 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-brand-blue bg-white"
          />
        )}

        {carregando && <p className="text-brand-dark/60 text-sm">Carregando...</p>}
        {erro && <p className="text-brand-warn text-sm">{erro}</p>}

        {!carregando && !erro && funcionarios.length === 0 && (
          <p className="text-sm text-brand-dark/60">Nenhum funcionário cadastrado ainda.</p>
        )}

        {!carregando && funcionarios.length > 0 && filtrados.length === 0 && (
          <p className="text-sm text-brand-dark/60">Nenhum funcionário encontrado para "{busca}".</p>
        )}

        <div className="flex flex-col gap-2">
          {filtrados.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-brand-dark/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-blue font-semibold text-sm flex-shrink-0">
                  {f.nome.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-brand-dark">{f.nome}</p>
                  <p className="text-xs text-brand-dark/60">{f.cargo} · {f.cpf}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-brand-accent bg-brand-accent/10 px-2 py-1 rounded-full">Ativo</span>
                <button
                  onClick={() => desativar(f)}
                  disabled={desativando === f.id}
                  className="text-xs text-brand-warn hover:underline disabled:opacity-50"
                >
                  {desativando === f.id ? 'Desativando...' : 'Desativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
