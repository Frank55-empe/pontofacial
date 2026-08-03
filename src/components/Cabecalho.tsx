import { APP_CONFIG } from '../config';

interface CabecalhoProps {
  subtitulo?: string;
}

export function Cabecalho({ subtitulo }: CabecalhoProps) {
  return (
    <header className="w-full bg-brand-dark text-white px-6 py-5 flex flex-col items-center gap-1 shadow-md">
      <h1 className="text-xl font-bold tracking-wide">{APP_CONFIG.nomeEmpresa}</h1>
      {subtitulo && <p className="text-sm text-white/70">{subtitulo}</p>}
    </header>
  );
}
