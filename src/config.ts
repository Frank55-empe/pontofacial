
---

### Arquivo 1: `src/config.ts`
```typescript
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