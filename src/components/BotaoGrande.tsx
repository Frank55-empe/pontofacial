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
  const classes =
    variante === 'primario'
      ? 'bg-gradient-to-br from-brand-blue to-brand-dark text-white shadow-lg shadow-brand-blue/20 hover:shadow-xl hover:shadow-brand-blue/30 hover:-translate-y-1'
      : 'bg-white text-brand-dark border border-brand-blue/20 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-brand-blue/40';
  return (
    <button
      onClick={() => navegar(para)}
      className={`flex flex-col items-center gap-3 rounded-2xl px-8 py-10 w-64 transition-all duration-300 ${classes}`}
    >
      <div className="text-4xl">{icone}</div>
      <div className="text-lg font-semibold">{titulo}</div>
      <div className={`text-sm text-center ${variante === 'primario' ? 'text-white/70' : 'text-brand-dark/50'}`}>
        {descricao}
      </div>
    </button>
  );
}
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
  const classes =
    variante === 'primario'
      ? 'bg-gradient-to-br from-brand-blue to-brand-dark text-white shadow-lg shadow-brand-blue/20 hover:shadow-xl hover:shadow-brand-blue/30 hover:-translate-y-1'
      : 'bg-white text-brand-dark border border-brand-blue/20 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-brand-blue/40';
  return (
    <button
      onClick={() => navegar(para)}
      className={`flex flex-col items-center gap-3 rounded-2xl px-8 py-10 w-64 transition-all duration-300 ${classes}`}
    >
      <div className="text-4xl">{icone}</div>
      <div className="text-lg font-semibold">{titulo}</div>
      <div className={`text-sm text-center ${variante === 'primario' ? 'text-white/70' : 'text-brand-dark/50'}`}>
        {descricao}
      </div>
    </button>
  );
}