import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { api } from '../../services/api';
import { gerarRelatorioPDF, gerarNomeArquivo } from '../../services/relatorioPdf';
import type { Funcionario, RegistroPonto } from '../../types';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type EstadoLinha = 'ocioso' | 'gerando' | 'pronto' | 'erro';

export function Relatorios() {
  const hoje = new Date();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [estados, setEstados] = useState<Record<string, EstadoLinha>>({});
  const [gerandoTodos, setGerandoTodos] = useState(false);

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

  async function gerarPdfDe(funcionario: Funcionario) {
    setEstados(prev => ({ ...prev, [funcionario.id]: 'gerando' }));
    try {
      const resposta = await api.buscarEspelhoPonto(funcionario.id, String(mes), String(ano));
      const registros = (resposta.sucesso ? (resposta.dados as RegistroPonto[]) : []) || [];
      const doc = gerarRelatorioPDF(funcionario, registros, mes, ano);
      doc.save(gerarNomeArquivo(funcionario, mes, ano));
      setEstados(prev => ({ ...prev, [funcionario.id]: 'pronto' }));
    } catch {
      setEstados(prev => ({ ...prev, [funcionario.id]: 'erro' }));
    }
  }

  async function gerarTodos() {
    setGerandoTodos(true);
    for (const f of funcionarios) {
      await gerarPdfDe(f);
      // Uma pequena pausa entre downloads evita que o navegador
      // bloqueie os pop-ups/downloads em sequência muito rápida.
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    setGerandoTodos(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Relatórios mensais" />
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <Link to="/admin" className="text-sm text-brand-blue underline">Voltar</Link>

        <div className="bg-white rounded-2xl shadow-sm p-4 mt-4 flex flex-wrap gap-3 items-end border border-brand-dark/10">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-dark/60">Mês</label>
            <select value={mes} onChange={e => setMes(Number(e.target.value))}
              className="border border-brand-dark/20 rounded-lg px-3 py-2 text-sm">
              {MESES.map((nome, i) => <option key={i} value={i + 1}>{nome}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-dark/60">Ano</label>
            <input
              value={ano}
              onChange={e => setAno(Number(e.target.value) || hoje.getFullYear())}
              className="border border-brand-dark/20 rounded-lg px-3 py-2 text-sm w-20"
            />
          </div>

          <button
            onClick={gerarTodos}
            disabled={gerandoTodos || funcionarios.length === 0}
            className="bg-brand-blue text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {gerandoTodos ? 'Gerando todos...' : '📄 Baixar PDF de todos'}
          </button>
        </div>

        {carregando && <p className="text-sm text-brand-dark/60 mt-4">Carregando...</p>}
        {erro && <p className="text-sm text-brand-warn mt-4">{erro}</p>}

        {!carregando && funcionarios.length === 0 && (
          <p className="text-sm text-brand-dark/60 mt-4">Nenhum funcionário cadastrado ainda.</p>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {funcionarios.map(f => {
            const estado = estados[f.id] || 'ocioso';
            return (
              <div key={f.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-brand-dark/10">
                <div>
                  <p className="font-medium text-brand-dark">{f.nome}</p>
                  <p className="text-xs text-brand-dark/60">{f.cargo}</p>
                </div>
                <button
                  onClick={() => gerarPdfDe(f)}
                  disabled={estado === 'gerando'}
                  className="text-sm px-3 py-1.5 rounded-lg border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-colors disabled:opacity-60"
                >
                  {estado === 'gerando' && 'Gerando...'}
                  {estado === 'pronto' && '✅ Baixado'}
                  {estado === 'erro' && '❌ Tentar de novo'}
                  {estado === 'ocioso' && '📄 Baixar PDF'}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
