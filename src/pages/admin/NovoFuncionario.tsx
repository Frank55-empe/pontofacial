import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cabecalho } from '../../components/Cabecalho';
import { api } from '../../services/api';
import {
  carregarModelosFaciais,
  descritorParaTexto,
  detectarRosto,
} from '../../services/faceRecognition';

type StatusCamera = 'carregando' | 'pronta' | 'erro';
type StatusCaptura = 'nenhuma' | 'procurando' | 'capturada';

export function NovoFuncionario() {
  const navegar = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [statusCamera, setStatusCamera] = useState<StatusCamera>('carregando');
  const [statusCaptura, setStatusCaptura] = useState<StatusCaptura>('nenhuma');
  const [descritorFacial, setDescritorFacial] = useState<string>('');
  const [mensagemCaptura, setMensagemCaptura] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      try {
        await carregarModelosFaciais();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (cancelado) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatusCamera('pronta');
      } catch {
        setStatusCamera('erro');
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function capturarRosto() {
    if (!videoRef.current || statusCamera !== 'pronta') return;
    setStatusCaptura('procurando');
    setMensagemCaptura('Procurando rosto...');

    const rosto = await detectarRosto(videoRef.current);

    if (!rosto) {
      setStatusCaptura('nenhuma');
      setMensagemCaptura('Nenhum rosto encontrado. Centralize o rosto na câmera e tente de novo.');
      return;
    }

    setDescritorFacial(descritorParaTexto(rosto.descritor));
    setStatusCaptura('capturada');
    setMensagemCaptura('Rosto capturado com sucesso!');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (!descritorFacial) {
      setErro('Capture o rosto do funcionário antes de salvar.');
      return;
    }

    setSalvando(true);
    try {
      const resposta = await api.cadastrarFuncionario({ nome, cpf, cargo, dataAdmissao, descritorFacial });
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

          <div className="flex flex-col gap-2">
            <label className="text-sm text-brand-dark/70">Rosto para reconhecimento facial</label>

            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover -scale-x-100"
              />
              {statusCamera === 'carregando' && (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm text-center px-4">
                  Carregando câmera e modelos de reconhecimento...
                </div>
              )}
              {statusCamera === 'erro' && (
                <div className="absolute inset-0 flex items-center justify-center text-white/90 text-sm text-center px-4">
                  Não foi possível acessar a câmera. Verifique as permissões do navegador.
                </div>
              )}
              {statusCamera === 'pronta' && (
                <div
                  className={`absolute inset-6 border-2 rounded-2xl pointer-events-none transition-colors ${
                    statusCaptura === 'capturada' ? 'border-brand-accent' : 'border-white/70'
                  }`}
                />
              )}
            </div>

            <button
              type="button"
              onClick={capturarRosto}
              disabled={statusCamera !== 'pronta' || statusCaptura === 'procurando'}
              className="bg-brand-dark text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-blue transition-colors disabled:opacity-50"
            >
              {statusCaptura === 'capturada' ? '📷 Capturar de novo' : '📷 Capturar rosto'}
            </button>

            {mensagemCaptura && (
              <p className={`text-xs text-center ${statusCaptura === 'capturada' ? 'text-brand-accent' : 'text-brand-dark/60'}`}>
                {mensagemCaptura}
              </p>
            )}
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
