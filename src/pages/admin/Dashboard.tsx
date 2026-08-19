import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { api } from '../../services/api';
import type { Funcionario } from '../../types';

const ITENS = [
  { para: '/admin/funcionarios', titulo: 'Funcionários', descricao: 'Cadastrar, editar e desativar', icone: '👥' },
  { para: '/admin/espelho', titulo: 'Espelho de ponto', descricao: 'Consultar registros', icone: '🗓️' },
  { para: '/admin/relatorios', titulo: 'Relatórios mensais', descricao: 'Gerar PDF de ponto por funcionário', icone: '📄' },
];

export function Dashboard() {
  const { sair } = useAdminAuth();
  const [totalFuncionarios, setTotalFuncionarios] = useState<number | null>(null);

  useEffect(() => {
    api.listarFuncionarios().then(resposta => {
      if (resposta.sucesso) setTotalFuncionarios(((resposta.dados as Funcionario[]) || []).length);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Painel administrativo" />
      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-brand-dark/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center text-2xl">👥</div>
          <div>
            <p className="text-2xl font-bold text-brand-dark">
              {totalFuncionarios === null ? '...' : totalFuncionarios}
            </p>
            <p className="text-sm text-brand-dark/60">Funcionários ativos cadastrados</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {ITENS.map(item => (
            <Link
              key={item.para}
              to={item.para}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all border border-brand-dark/10"
            >
              <div className="text-2xl mb-2">{item.icone}</div>
              <h3 className="font-semibold text-brand-dark">{item.titulo}</h3>
              <p className="text-sm text-brand-dark/60 mt-1">{item.descricao}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-between items-center text-sm">
          <Link to="/" className="text-brand-blue underline">Voltar ao início</Link>
          <button onClick={sair} className="text-brand-warn underline">Sair</button>
        </div>
      </main>
    </div>
  );
}
