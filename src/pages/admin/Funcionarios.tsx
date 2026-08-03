import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { api } from '../../services/api';
import type { Funcionario } from '../../types';

export function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Funcionários" />
      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="flex justify-between items-center mb-4">
          <Link to="/admin" className="text-sm text-brand-blue underline">Voltar</Link>
          <Link
            to="/admin/funcionarios/novo"
            className="bg-brand-blue text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
          >
            + Novo funcionário
          </Link>
        </div>

        {carregando && <p className="text-brand-dark/60 text-sm">Carregando...</p>}
        {erro && <p className="text-brand-warn text-sm">{erro}</p>}

        {!carregando && !erro && funcionarios.length === 0 && (
          <p className="text-brand-dark/60 text-sm">Nenhum funcionário cadastrado ainda.</p>
        )}

        <div className="flex flex-col gap-2">
          {funcionarios.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-brand-dark/10">
              <div>
                <p className="font-medium text-brand-dark">{f.nome}</p>
                <p className="text-xs text-brand-dark/60">{f.cargo} · {f.cpf}</p>
              </div>
              <span className="text-xs text-brand-accent">Ativo</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
