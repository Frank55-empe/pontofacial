import { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { APPS_SCRIPT_URL, DISTANCIA_FACIAL_MAX } from '../config';
import { jsonp } from '../lib/jsonp';
import { useKiosk } from '../hooks/useKiosk';

interface FuncionarioKiosk {
  id: string;
  nome: string;
  matricula: string;
  descritor: number[];
}

interface RespostaPonto {
  ok: boolean;
  rotulo?: string;
  horario?: string;
  mensagem?: string;
}

type Tela = 'espera' | 'reconhecido' | 'erro';

const INTERVALO_DETECCAO = 400;
const COOLDOWN_MS = 4000;
const RESET_MS = 5000;
const TOQUES_ADMIN = 7;

export default function KioskScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tela, setTela] = useState<Tela>('espera');
  const [funcionarios, setFuncionarios] = useState<FuncionarioKiosk[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [hora, setHora] = useState(new Date());
  const [carregando, setCarregando] = useState(true);
  const [erroInicial, setErroInicial] = useState('');

  const funcionariosRef = useRef<FuncionarioKiosk[]>([]);
  const bloqueadoAte = useRef(0);
  const deteccaoRodando = useRef(false);
  const toques = useRef(0);
  const ultimoToque = useRef(0);

  useKiosk(true);

  useEffect(() => {
    funcionariosRef.current = funcionarios;
  }, [funcionarios]);

  useEffect(() => {
    const timer = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const registrarBatida = useCallback(async (func: FuncionarioKiosk) => {
    try {
      const resp = await jsonp<RespostaPonto>(APPS_SCRIPT_URL, {
        acao: 'registrarPonto',
        id: func.id,
      });
      if (resp?.ok) {
        setMensagem(`Olá, ${func.nome}! ${resp.rotulo ?? 'Ponto'} registrado às ${resp.horario ?? ''}.`);
      } else {
        setMensagem(resp?.mensagem ?? 'Ponto já registrado agora, aguarde.');
      }
    } catch {
      setMensagem('Falha ao registrar o ponto. Tente novamente.');
    }
    setTela('reconhecido');
    setTimeout(() => setTela('espera'), RESET_MS);
  }, []);

  const iniciarDeteccao = useCallback(async () => {
    if (deteccaoRodando.current) return;
    deteccaoRodando.current = true;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });

    while (deteccaoRodando.current) {
      try {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        const deteccao = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (deteccao && Date.now() > bloqueadoAte.current) {
          const candidatos = funcionariosRef.current
            .map((f) => ({ f, distancia: faceapi.euclideanDistance(deteccao.descriptor, f.descritor) }))
            .sort((a, b) => a.distancia - b.distancia);
          const melhor = candidatos[0];
          if (melhor && melhor.distancia < DISTANCIA_FACIAL_MAX) {
            bloqueadoAte.current = Date.now() + COOLDOWN_MS;
            await registrarBatida(melhor.f);
          }
        }
      } catch {
        // frame descartado, segue o loop
      }
      await new Promise((r) => setTimeout(r, INTERVALO_DETECCAO));
    }
  }, [registrarBatida]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const base = `${window.location.origin}${import.meta.env.BASE_URL}models`;
        try {
          await faceapi.nets.tinyFaceDetector.loadFromUri(base);
          await faceapi.nets.faceLandmark68Net.loadFromUri(base);
          await faceapi.nets.faceRecognitionNet.loadFromUri(base);
        } catch {
          const cdn = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
          await faceapi.nets.tinyFaceDetector.loadFromUri(cdn);
          await faceapi.nets.faceLandmark68Net.loadFromUri(cdn);
          await faceapi.nets.faceRecognitionNet.loadFromUri(cdn);
        }

        const resp = await jsonp<{ ok: boolean; dados: FuncionarioKiosk[] }>(APPS_SCRIPT_URL, {
          acao: 'funcionariosKiosk',
        });
        if (!cancelado && resp?.ok) setFuncionarios(resp.dados ?? []);

        if (videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          if (cancelado) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (!cancelado) setCarregando(false);
        iniciarDeteccao();
      } catch {
        if (!cancelado) {
          setErroInicial('Sem acesso à câmera. Verifique as permissões do tablet.');
          setTela('erro');
          setCarregando(false);
        }
      }
    })();

    return () => {
      cancelado = true;
      deteccaoRodando.current = false;
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [iniciarDeteccao]);

  const abrirAdmin = useCallback(() => {
    const agora = Date.now();
    if (agora - ultimoToque.current > 2000) toques.current = 0;
    ultimoToque.current = agora;
    toques.current += 1;
    if (toques.current >= TOQUES_ADMIN) {
      toques.current = 0;
      window.location.hash = '#/admin';
    }
  }, []);

  const dataFormatada = hora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-white select-none">
      {carregando && (
        <div className="text-center">
          <p className="text-2xl">Iniciando reconhecimento facial...</p>
          <p className="mt-2 text-sm text-slate-400">Aguarde, carregando modelos e câmera</p>
        </div>
      )}

      {!carregando && tela === 'erro' && (
        <div className="p-8 text-center">
          <p className="text-3xl font-bold text-red-400">Problema na câmera</p>
          <p className="mt-4 text-lg">{erroInicial}</p>
        </div>
      )}

      {!carregando && tela === 'espera' && (
        <div className="relative flex h-full w-full flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            style={{ transform: 'scaleX(-1)' }}
          />

          <div
            onClick={abrirAdmin}
            className="relative z-10 flex flex-col items-center rounded-3xl bg-slate-900/80 px-14 py-10 backdrop-blur"
          >
            <p className="text-lg text-slate-300">{dataFormatada}</p>
            <p className="mt-2 text-8xl font-bold tabular-nums">
              {hora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="mt-6 text-2xl font-medium text-slate-200">Aproxime-se para registrar o ponto</p>
            <p className="mt-2 text-sm text-slate-400">Mantenha o rosto centralizado na câmera</p>
          </div>
        </div>
      )}

      {!carregando && tela === 'reconhecido' && (
        <div className="flex h-full w-full flex-col items-center justify-center bg-emerald-950/90 p-10 text-center">
          <p className="text-6xl">✔</p>
          <p className="mt-6 text-4xl font-bold text-emerald-300">{mensagem}</p>
          <p className="mt-4 text-xl text-slate-300">Pode se afastar. Próxima pessoa em instantes.</p>
        </div>
      )}
    </div>
  );
}
