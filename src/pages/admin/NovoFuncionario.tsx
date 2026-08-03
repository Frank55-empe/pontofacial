import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { api } from '../../services/api';

export function NovoFuncionario() {
  const navegar = useNavigate();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      // TODO (Fase 2): antes de salvar, capturar o rosto pela câmera
      // e gerar o descritorFacial com face-api.js, enviando junto aqui.
      const resposta = await api.cadastrarFuncionario({ nome, cpf, cargo, dataAdmissao });
      if (resposta.sucesso) {
        navegar('/admin/funcionarios');
      } else {
        setErro(resposta.erro || 'Erro ao cadastrar');
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao conectar com o servidor');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Novo funcionário" />
      <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        <Link to="/admin/funcionarios" className="text-sm text-brand-blue underline">Voltar</Link>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 mt-4 flex flex-col gap-4 border border-brand-dark/10">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-brand-dark/70">Nome completo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required
              className="border border-brand-dark/20 rounded-lg px-3 py-2 outline-none focus:border-brand-blue" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-brand-dark/70">CPF</label>
            <input value={cpf} onChange={e => setCpf(e.target.value)} required
              className="border border-brand-dark/20 rounded-lg px-3 py-2 outline-none focus:border-brand-blue" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-brand-dark/70">Cargo</label>
            <input value={cargo} onChange={e => setCargo(e.target.value)} required
              className="border border-brand-dark/20 rounded-lg px-3 py-2 outline-none focus:border-brand-blue" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-brand-dark/70">Data de admissão</label>
            <input type="date" value={dataAdmissao} onChange={e => setDataAdmissao(e.target.value)} required
              className="border border-brand-dark/20 rounded-lg px-3 py-2 outline-none focus:border-brand-blue" />
          </div>

          <div className="border border-dashed border-brand-dark/20 rounded-xl p-4 text-center text-sm text-brand-dark/50">
            📷 Captura do rosto para reconhecimento facial entra na próxima fase
          </div>

          {erro && <p className="text-sm text-brand-warn">{erro}</p>}

          <button type="submit" disabled={salvando}
            className="bg-brand-blue text-white rounded-lg py-2 font-medium hover:bg-brand-dark transition-colors disabled:opacity-60">
            {salvando ? 'Salvando...' : 'Salvar funcionário'}
          </button>
        </form>
      </main>
    </div>
  );
}
