import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cabecalho } from '../components/Cabecalho';
import { api } from '../services/api';
import {
  carregarModelosFaciais,
  detectarRosto,
  encontrarMelhorCorrespondencia,
} from '../services/faceRecognition';
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
const PAUSA_APOS_NAO_RECONHECIDO_MS = 3500;

/** Bipe curto e simples via Web Audio API, sem precisar de nenhum arquivo de áudio */
function tocarBipe(tipo: 'sucesso' | 'erro') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const contexto = new AudioCtx();
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();
    oscilador.connect(ganho);
    ganho.connect(contexto.destination);
    oscilador.frequency.value = tipo === 'sucesso' ? 880 : 220;
    ganho.gain.value = 0.15;
    oscilador.start();
    oscilador.stop(contexto.currentTime + (tipo === 'sucesso' ? 0.15 : 0.3));
  } catch {
    // Se o navegador bloquear áudio automático, só ignora. Não é crítico.
  }
}

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

  // ---- Descobre a próxima batida esperada, olhando os registros de hoje ----
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
      // Se não conseguir checar o histórico, assume "entrada" pra não travar o fluxo.
      return 'entrada';
    }
  }, []);

  // ---- Registra a batida de ponto de quem foi reconhecido ----
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
        tocarBipe('sucesso');
        setResultado({
          nome,
          tipo,
          horario: agora.toLocaleTimeString('pt-BR'),
        });
        setStatus('sucesso');
      } else {
        tocarBipe('erro');
        setMensagem(resposta.erro || 'Erro ao registrar o ponto. Tente novamente.');
        setStatus('erro');
      }
    } catch (e) {
      tocarBipe('erro');
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

  // ---- Ciclo de detecção: roda a cada X ms enquanto está "procurando" ----
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

    // Rosto detectado, mas não bateu com ninguém cadastrado.
    tentativasSemMatchRef.current += 1;
    if (tentativasSemMatchRef.current >= TENTATIVAS_ATE_AVISAR_DESCONHECIDO) {
      emProcessamentoRef.current = true;
      tocarBipe('erro');
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

  // ---- Setup inicial: modelos + câmera + lista de funcionários ----
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

  // ---- Liga o intervalo de detecção enquanto a câmera estiver pronta ----
  useEffect(() => {
    intervaloRef.current = setInterval(cicloDeteccao, INTERVALO_DETECCAO_MS);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [cicloDeteccao]);

  const corMoldura =
    status === 'sucesso' ? 'border-brand-accent' :
    status === 'nao_reconhecido' || status === 'erro' ? 'border-brand-warn' :
    status === 'processando' ? 'border-yellow-400' :
    'border-white/70';

  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Bater ponto" />
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-8">
        <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover -scale-x-100"
          />

          <div className={`absolute inset-6 border-4 rounded-2xl pointer-events-none transition-colors duration-300 ${corMoldura}`} />

          {status === 'carregando' && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm text-center px-6 bg-black/40">
              {mensagem}
            </div>
          )}

          {status === 'sucesso' && resultado && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white text-center px-6">
              <div className="text-5xl">✅</div>
              <p className="text-lg font-semibold">Bem-vindo(a), {resultado.nome}!</p>
              <p className="text-sm text-white/80">{ROTULOS_BATIDA[resultado.tipo]} registrada</p>
              <p className="text-2xl font-mono mt-1">{resultado.horario}</p>
            </div>
          )}

          {status === 'processando' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm text-center px-6">
              {mensagem}
            </div>
          )}

          {status === 'nao_reconhecido' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white text-center px-6">
              <div className="text-4xl">⚠️</div>
              <p className="text-sm">{mensagem}</p>
            </div>
          )}

          {status === 'erro' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white text-center px-6">
              <div className="text-4xl">❌</div>
              <p className="text-sm">{mensagem}</p>
            </div>
          )}
        </div>

        <p className="text-brand-dark/70 text-sm text-center max-w-sm">
          {status === 'procurando' ? mensagem : '\u00A0'}
        </p>

        <Link to="/" className="text-sm text-brand-blue underline mt-2">
          Voltar
        </Link>
      </main>
    </div>
  );
}
