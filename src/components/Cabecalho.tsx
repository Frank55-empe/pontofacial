import { useEffect, useState } from 'react';
import { APP_CONFIG } from '../config';


interface CabecalhoProps {
  subtitulo?: string;
}
export function Cabecalho({ subtitulo }: CabecalhoProps) {
  const [hora, setHora] = useState('');
useEffect(() => {
    const atualizar = () => {
      setHora(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
minute: '2-digit',
        })
      );
    };
    atualizar();
    const id = setInterval(atualizar, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="w-full bg-gradient-to-r from-brand-dark via-brand-blue to-brand-dark text-white px-6 py-5 flex items-center justify-between shadow-lg">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold tracking-wide">{APP_CONFIG.nomeEmpresa}</h1>
        {subtitulo && <p className="text-sm text-white/60">{subtitulo}</p>}
      </div>
      {hora && (
        <div className="text-right">
          <p className="text-lg font-mono font-semibold tabular-nums">{hora}</p>
          <p className="text-xs text-white/50">
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </p>
        </div>
      )}
    </header>
  );
}
