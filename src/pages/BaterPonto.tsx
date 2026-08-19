import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  carregarModelosFaciais,
  detectarRosto,
  encontrarMelhorCorrespondencia,
} from '../services/faceRecognition';
import { falarConfirmacaoPonto, falarRostoNaoReconhecido } from '../services/voz';
import { APP_CONFIG } from '../config';
import type { Funcionario, RegistroPonto, TipoBatida } from '../types';

type Status =
  | 'carregando'
  | 'procurando'
  | 'processando'
  | 'sucesso'
  | 'nao_reconhecido'
  | 'erro';

const ORDEM_BATIDAS: TipoBatida[] = ['entrada', 'saida_almoco', 'volta_almoco', 'saida'];

const ROTULOS_BATIDA: Record<TipoBatida, string> = {
  entrada: 'Entrada',
  saida_almoco: 'Saída para almoço',
  volta_almoco: 'Volta do almoço',
  saida: 'Saída',
};

const INTERVALO_DETECCAO_MS = 900;
const TENTATIVAS_ATE_AVISAR_DESCONHECIDO = 4;
const PAUSA_APOS_SUCESSO_MS = 6000;
const PAUSA_APOS_NAO_RECONHECIDO_MS = 4000;

export function BaterPonto() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const funcionariosRef = useRef<Funcionario[]>([]);
  const emProcessamentoRef = useRef(false);
  const tentativasSemMatchRef = useRef(0);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<Status>('carregando');
  const [mensagem, setMensagem] = useState('Preparando câmera e sistema de reconhecimento...');
  const [resultado, setResultado] = useState<{ nome: string; tipo: TipoBatida; horario: string } | null>(null);
  const [relogio, setRelogio] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setRelogio(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const proximaBatida = useCallback(async (funcionarioId: string): Promise<TipoBatida> => {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1);
    const ano = String(agora.getFullYear());

    try {
      const resposta = await api.buscarEspelhoPonto(funcionarioId, mes, ano);
      const registros = (resposta.sucesso ? (resposta.dados as RegistroPonto[]) : []) || [];
      const hojeTexto = agora.toDateString();
      const registrosHoje = registros.filter(r => new Date(r.dataHora).toDateString() === hojeTexto);
      return ORDEM_BATIDAS[registrosHoje.length % ORDEM_BATIDAS.length];
    } catch {
      return 'entrada';
    }
  }, []);

  const registrarReconhecimento = useCallback(async (id: string, nome: string, distancia: number) => {
    emProcessamentoRef.current = true;
    setStatus('processando');
    setMensagem(`Identificado: ${nome}. Registrando ponto...`);

    try {
      const tipo = await proximaBatida(id);
      const agora = new Date();

      const resposta = await api.registrarPonto({
        funcionarioId: id,
        nomeFuncionario: nome,
        tipoBatida: tipo,
        dataHora: agora.toISOString(),
        metodoConfirmacao: 'facial',
        distanciaFacial: distancia.toFixed(4),
      });

      if (resposta.sucesso) {
        falarConfirmacaoPonto(nome, tipo, agora);
        setResultado({ nome, tipo, horario: agora.toLocaleTimeString('pt-BR') });
        setStatus('sucesso');
      } else {
        setMensagem(resposta.erro || 'Erro ao registrar o ponto. Tente novamente.');
        setStatus('erro');
      }
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : 'Erro ao registrar o ponto.');
      setStatus('erro');
    }

    setTimeout(() => {
      setResultado(null);
      tentativasSemMatchRef.current = 0;
      emProcessamentoRef.current = false;
      setStatus('procurando');
      setMensagem('Posicione seu rosto na moldura para bater o ponto.');
    }, PAUSA_APOS_SUCESSO_MS);
  }, [proximaBatida]);

  const cicloDeteccao = useCallback(async () => {
    if (emProcessamentoRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    const rosto = await detectarRosto(videoRef.current);
    if (!rosto) return;

    const correspondencia = encontrarMelhorCorrespondencia(rosto.descritor, funcionariosRef.current);

    if (correspondencia) {
      tentativasSemMatchRef.current = 0;
      await registrarReconhecimento(correspondencia.id, correspondencia.nome, correspondencia.distancia);
      return;
    }

    tentativasSemMatchRef.current += 1;
    if (tentativasSemMatchRef.current >= TENTATIVAS_ATE_AVISAR_DESCONHECIDO) {
      emProcessamentoRef.current = true;
      falarRostoNaoReconhecido();
      setStatus('nao_reconhecido');
      setMensagem('Rosto não reconhecido. Procure o administrador para verificar seu cadastro.');
      setTimeout(() => {
        tentativasSemMatchRef.current = 0;
        emProcessamentoRef.current = false;
        setStatus('procurando');
        setMensagem('Posicione seu rosto na moldura para bater o ponto.');
      }, PAUSA_APOS_NAO_RECONHECIDO_MS);
    }
  }, [registrarReconhecimento]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      try {
        const [, stream, respostaFuncionarios] = await Promise.all([
          carregarModelosFaciais(),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }),
          api.listarFuncionarios(),
        ]);

        if (cancelado) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        funcionariosRef.current = respostaFuncionarios.sucesso
          ? (respostaFuncionarios.dados as Funcionario[]) || []
          : [];

        setStatus('procurando');
        setMensagem('Posicione seu rosto na moldura para bater o ponto.');
      } catch (e) {
        setStatus('erro');
        setMensagem(
          e instanceof Error
            ? `Não foi possível iniciar: ${e.message}`
            : 'Não foi possível iniciar a câmera ou o sistema de reconhecimento.'
        );
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, []);

  useEffect(() => {
    intervaloRef.current = setInterval(cicloDeteccao, INTERVALO_DETECCAO_MS);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [cicloDeteccao]);

  const corMoldura =
    status === 'sucesso' ? 'border-brand-accent shadow-[0_0_40px_-5px_rgba(30,138,95,0.6)]' :
    status === 'nao_reconhecido' || status === 'erro' ? 'border-brand-warn shadow-[0_0_40px_-5px_rgba(194,65,12,0.5)]' :
    status === 'processando' ? 'border-yellow-400' :
    'border-white/60 animate-pulse';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-dark to-brand-blue text-white">
      <header className="w-full px-6 py-5 flex items-center justify-between">
        <div>
          <p className="font-bold tracking-wide text-lg">{APP_CONFIG.nomeEmpresa}</p>
          <p className="text-xs text-white/60">Ponto por reconhecimento facial</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-semibold leading-none">
            {relogio.toLocaleTimeString('pt-BR')}
          </p>
          <p className="text-xs text-white/60 capitalize">
            {relogio.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-4">
        <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden bg-black shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover -scale-x-100"
          />

          <div className={`absolute inset-6 border-4 rounded-3xl pointer-events-none transition-all duration-300 ${corMoldura}`} />

          {status === 'carregando' && (
            <div className="absolute inset-0 flex items-center justify-center text-white/90 text-sm text-center px-6 bg-black/50">
              {mensagem}
            </div>
          )}

          {status === 'sucesso' && resultado && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white text-center px-6">
              <div className="text-6xl">✅</div>
              <p className="text-xl font-semibold">{resultado.nome}</p>
              <p className="text-sm text-brand-accent font-medium">{ROTULOS_BATIDA[resultado.tipo]} registrada</p>
              <p className="text-3xl font-mono mt-1">{resultado.horario}</p>
            </div>
          )}

          {status === 'processando' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-white text-sm text-center px-6">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {mensagem}
            </div>
          )}

          {status === 'nao_reconhecido' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white text-center px-6">
              <div className="text-5xl">⚠️</div>
              <p className="text-sm">{mensagem}</p>
            </div>
          )}

          {status === 'erro' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white text-center px-6">
              <div className="text-5xl">❌</div>
              <p className="text-sm">{mensagem}</p>
            </div>
          )}
        </div>

        <p className="text-white/70 text-sm text-center max-w-sm min-h-[20px]">
          {status === 'procurando' ? mensagem : '\u00A0'}
        </p>

        <Link to="/" className="text-sm text-white/50 hover:text-white/80 underline transition-colors">
          Voltar
        </Link>
      </main>
    </div>
  );
}
