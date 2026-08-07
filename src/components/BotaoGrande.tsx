import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface BotaoGrandeProps {
  para: string;
  icone: ReactNode;
  titulo: string;
  descricao: string;
  variante?: 'primario' | 'secundario';
}

export function BotaoGrande({ para, icone, titulo, descricao, variante = 'primario' }: BotaoGrandeProps) {
  const navegar = useNavigate();
  const cores =
    variante === 'primario'
      ? 'bg-brand-blue text-white hover:bg-brand-dark'
      : 'bg-white text-brand-dark border border-brand-blue/30 hover:border-brand-blue';

  return (
    <button
      onClick={() => navegar(para)}
      className={`flex flex-col items-center gap-3 rounded-2xl px-8 py-10 w-64 transition-colors shadow-sm ${cores}`}
    >
      <div className="text-4xl">{icone}</div>
      <div className="text-lg font-semibold">{titulo}</div>
      <div className={`text-sm text-center ${variante === 'primario' ? 'text-white/70' : 'text-brand-dark/60'}`}>
        {descricao}
      </div>
    </button>
  );
}
