import { Link } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const ITENS = [
  { para: '/admin/funcionarios', titulo: 'Funcionários', descricao: 'Cadastrar, editar e desativar' },
  { para: '/admin/espelho', titulo: 'Espelho de ponto', descricao: 'Consultar registros' },
  { para: '/admin/relatorios', titulo: 'Relatórios mensais', descricao: 'Gerar PDF de ponto por funcionário' },
];

export function Dashboard() {
  const { sair } = useAdminAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Painel administrativo" />
      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="grid sm:grid-cols-2 gap-4">
          {ITENS.map(item => (
            <Link
              key={item.para}
              to={item.para}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-brand-dark/10"
            >
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
