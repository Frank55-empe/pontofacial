import { Cabecalho } from '../components/Cabecalho';
import { BotaoGrande } from '../components/BotaoGrande';

export function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Cabecalho subtitulo="Controle de ponto por reconhecimento facial" />
      <main className="flex-1 flex items-center justify-center gap-6 px-6 flex-wrap">
        <BotaoGrande
          para="/bater-ponto"
          icone="📷"
          titulo="Bater ponto"
          descricao="Reconhecimento facial para registrar entrada e saída"
        />
        <BotaoGrande
          para="/admin/login"
          icone="🔒"
          titulo="Área administrativa"
          descricao="Cadastrar funcionários e ver relatórios"
          variante="secundario"
        />
      </main>
      <footer className="text-center text-xs text-brand-dark/40 py-4">
        Sistema próprio de controle de ponto — uso interno
      </footer>
    </div>
  );
}
