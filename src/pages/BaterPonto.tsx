import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cabecalho } from '../components/Cabecalho';

export function BaterPonto() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [mensagemErro, setMensagemErro] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function ligarCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('pronto');
        // TODO (Fase 2): carregar os modelos do face-api.js aqui e
        // começar a detectar rostos em intervalos, comparando com
        // os descritores baixados via api.listarFuncionarios().
      } catch {
        setStatus('erro');
        setMensagemErro('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      }
    }

    ligarCamera();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

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
          {status === 'carregando' && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
              Ligando câmera...
            </div>
          )}
          {status === 'erro' && (
            <div className="absolute inset-0 flex items-center justify-center text-center text-white/90 text-sm px-6">
              {mensagemErro}
            </div>
          )}
          {status === 'pronto' && (
            <div className="absolute inset-6 border-2 border-brand-accent/70 rounded-2xl pointer-events-none" />
          )}
        </div>

        <p className="text-brand-dark/70 text-sm text-center max-w-sm">
          Posicione seu rosto dentro da moldura. O reconhecimento automático
          será ativado na próxima etapa de desenvolvimento.
        </p>

        <Link to="/" className="text-sm text-brand-blue underline mt-2">
          Voltar
        </Link>
      </main>
    </div>
  );
}
