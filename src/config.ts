### `src/config.ts` — copia só isto:

    export const APPS_SCRIPT_URL =
      'https://script.google.com/macros/s/AKfycbzadsGtGm6bw3nU-x0s38IP_xO-3YaeWAsv4_uCnE833utsPSgGcR907wnW_Nx2J64P/exec';

    export const APP_CONFIG = {
      nomeEmpresa: 'Minha Empresa',
      limiarReconhecimentoFacial: 0.55,
      toleranciaAtrasoMinutos: 10,
      horasJornadaPadrao: 8,
      audio: {
        habilitado: true,
        velocidadeFala: 0.95,
        tomVoz: 1,
        volume: 1,
      },
    };

### `src/components/BotaoGrande.tsx` — copia só isto:

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
          className={'flex flex-col items-center gap-3 rounded-2xl px-8 py-10 w-64 transition-all duration-300 ' + classes}
        >
          <div className="text-4xl">{icone}</div>
          <div className="text-lg font-semibold">{titulo}</div>
          <div className={'text-sm text-center ' + (variante === 'primario' ? 'text-white/70' : 'text-brand-dark/50')}>
            {descricao}
          </div>
        </button>
      );
    }

### `tsconfig.node.json` — cria este arquivo novo na raiz do projeto:

    {
      "compilerOptions": {
        "composite": true,
        "skipLibCheck": true,
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true
      },
      "include": ["vite.config.ts"]
    }

## Resumo

| Arquivo | Ação |
|---|---|
| `src/config.ts` | Apagar tudo, colar só o código (sem
```) |
| `src/components/BotaoGrande.tsx` | Apagar tudo, colar só o código (sem
```) |
| `tsconfig.node.json` | Criar arquivo novo na raiz com o código acima |

O erro do `tsconfig.node.json` é separado — esse arquivo está faltando no repositório. Cria ele novo na raiz (mesma pasta onde está o `package.json`).

Depois de corrigir esses 3, faz commit e verifica se a bolinha fica verde. Se tiver mais erros, manda aqui.
