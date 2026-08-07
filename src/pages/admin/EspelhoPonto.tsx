import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { api } from '../../services/api';
import type { Funcionario, RegistroPonto } from '../../types';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function EspelhoPonto() {
  const hoje = new Date();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionarioId, setFuncionarioId] = useState('');
  const [mes, setMes] = useState(String(hoje.getMonth() + 1));
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.listarFuncionarios().then(resposta => {
      if (resposta.sucesso) setFuncionarios((resposta.dados as Funcionario[]) || []);
    });
  }, []);

  async function buscar() {
    if (!funcionarioId) return;
    setErro('');
    setCarregando(true);
    try {
      const resposta = await api.buscarEspelhoPonto(funcionarioId, mes, ano);
      if (resposta.sucesso) {
        setRegistros((resposta.dados as RegistroPonto[]) || []);
      } else {
        setErro(resposta.erro || 'Erro ao buscar registros');
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Espelho de ponto" />
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <Link to="/admin" className="text-sm text-brand-blue underline">Voltar</Link>

        <div className="bg-white rounded-2xl shadow-sm p-4 mt-4 flex flex-wrap gap-3 items-end border border-brand-dark/10">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-dark/60">Funcionário</label>
            <select value={funcionarioId} onChange={e => setFuncionarioId(e.target.value)}
              className="border border-brand-dark/20 rounded-lg px-3 py-2 text-sm">
              <option value="">Selecione...</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-dark/60">Mês</label>
            <select value={mes} onChange={e => setMes(e.target.value)}
              className="border border-brand-dark/20 rounded-lg px-3 py-2 text-sm">
              {MESES.map((nome, i) => <option key={i} value={i + 1}>{nome}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-dark/60">Ano</label>
            <input value={ano} onChange={e => setAno(e.target.value)}
              className="border border-brand-dark/20 rounded-lg px-3 py-2 text-sm w-20" />
          </div>

          <button onClick={buscar}
            className="bg-brand-blue text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors">
            Buscar
          </button>
        </div>

        {carregando && <p className="text-sm text-brand-dark/60 mt-4">Carregando...</p>}
        {erro && <p className="text-sm text-brand-warn mt-4">{erro}</p>}

        {registros.length > 0 && (
          <table className="w-full mt-4 bg-white rounded-xl overflow-hidden shadow-sm text-sm">
            <thead className="bg-brand-light text-brand-dark/70">
              <tr>
                <th className="text-left px-3 py-2">Data/Hora</th>
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-left px-3 py-2">Método</th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <tr key={r.id} className="border-t border-brand-dark/5">
                  <td className="px-3 py-2">{new Date(r.dataHora).toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 capitalize">{r.tipoBatida.replace('_', ' ')}</td>
                  <td className="px-3 py-2 capitalize">{r.metodoConfirmacao.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
