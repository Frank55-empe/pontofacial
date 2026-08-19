import { Cabecalho } from '../components/Cabecalho';
import { BotaoGrande } from '../components/BotaoGrande';

export function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light via-white to-brand-light">
      <Cabecalho />

      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="text-center max-w-lg">
          <h2 className="text-3xl font-bold text-brand-dark mb-2">
            Controle de Ponto
          </h2>
          <p className="text-brand-dark/60">
            Sistema de registro por reconhecimento facial
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          <BotaoGrande
            para="/bater-ponto"
            icone={
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            titulo="Bater Ponto"
            descricao="Reconhecimento facial automático"
            variante="primario"
          />
          <BotaoGrande
            para="/admin/login"
            icone={
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
            titulo="Administração"
            descricao="Acesso restrito a gestores"
            variante="secundario"
          />
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-brand-dark/40">
        Ponto Facial &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
  export default BaterPonto; 
}
