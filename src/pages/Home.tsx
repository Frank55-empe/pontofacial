import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config';

export function Home() {
  const navegar = useNavigate();
  const [relogio, setRelogio] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setRelogio(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-dark via-brand-blue to-brand-dark text-white">
      <header className="w-full px-6 py-6 flex items-center justify-between">
        <div>
          <p className="font-bold tracking-wide text-lg">{APP_CONFIG.nomeEmpresa}</p>
          <p className="text-xs text-white/50">Sistema de controle de ponto</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-semibold leading-none">
            {relogio.toLocaleTimeString('pt-BR')}
          </p>
          <p className="text-xs text-white/50 capitalize">
            {relogio.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-10 px-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🕒</div>
          <h1 className="text-2xl font-bold">Controle de Ponto</h1>
          <p className="text-white/60 text-sm mt-1">Reconhecimento facial automático</p>
        </div>

        <div className="flex flex-wrap items-stretch justify-center gap-5">
          <button
            onClick={() => navegar('/bater-ponto')}
            className="group flex flex-col items-center gap-3 rounded-3xl px-10 py-10 w-64 bg-white text-brand-dark shadow-xl hover:scale-[1.03] transition-transform"
          >
            <div className="text-5xl group-hover:scale-110 transition-transform">📷</div>
            <div className="text-lg font-bold">Bater ponto</div>
            <div className="text-sm text-brand-dark/60 text-center">
              Olhe para a câmera para registrar sua entrada ou saída
            </div>
          </button>

          <button
            onClick={() => navegar('/admin/login')}
            className="group flex flex-col items-center gap-3 rounded-3xl px-10 py-10 w-64 bg-white/10 border border-white/20 text-white backdrop-blur-sm hover:bg-white/15 hover:scale-[1.03] transition-all"
          >
            <div className="text-5xl group-hover:scale-110 transition-transform">🔒</div>
            <div className="text-lg font-bold">Área administrativa</div>
            <div className="text-sm text-white/60 text-center">
              Cadastrar funcionários e gerar relatórios
            </div>
          </button>
        </div>
      </main>

      <footer className="text-center text-xs text-white/30 py-5">
        Sistema próprio de controle de ponto — uso interno
      </footer>
    </div>
  );
}
