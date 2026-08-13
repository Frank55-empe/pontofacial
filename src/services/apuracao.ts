import type { RegistroPonto, TipoBatida } from '../types';
import { APP_CONFIG } from '../config';

export interface DiaApurado {
  data: Date;
  dataTexto: string; // DD/MM/AAAA
  diaSemana: string; // Seg, Ter, Qua...
  entrada?: Date;
  saidaAlmoco?: Date;
  voltaAlmoco?: Date;
  saida?: Date;
  segundosTrabalhados: number;
  segundosExtra: number;
  status: 'completo' | 'incompleto' | 'sem_registro';
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function diasNoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

function formatarHora(data?: Date): string {
  if (!data) return '--:--';
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function segundosParaHoras(segundos: number): string {
  const sinal = segundos < 0 ? '-' : '';
  const abs = Math.abs(Math.round(segundos));
  const horas = Math.floor(abs / 3600);
  const minutos = Math.floor((abs % 3600) / 60);
  return `${sinal}${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/**
 * Agrupa os registros de ponto (batidas soltas) por dia e calcula quanto
 * foi trabalhado em cada dia, junto com a hora extra (o que passou da
 * jornada padrão configurada em APP_CONFIG.horasJornadaPadrao).
 */
export function apurarMes(registros: RegistroPonto[], mes: number, ano: number): DiaApurado[] {
  const porDia = new Map<string, Partial<Record<TipoBatida, Date>>>();

  for (const r of registros) {
    const data = new Date(r.dataHora);
    const chave = data.toDateString();
    if (!porDia.has(chave)) porDia.set(chave, {});
    porDia.get(chave)![r.tipoBatida] = data;
  }

  const total = diasNoMes(mes, ano);
  const dias: DiaApurado[] = [];

  for (let dia = 1; dia <= total; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const chave = data.toDateString();
    const batidas = porDia.get(chave);

    const entrada = batidas?.entrada;
    const saidaAlmoco = batidas?.saida_almoco;
    const voltaAlmoco = batidas?.volta_almoco;
    const saida = batidas?.saida;

    let segundosTrabalhados = 0;
    let status: DiaApurado['status'] = 'sem_registro';

    if (entrada && saida) {
      if (saidaAlmoco && voltaAlmoco) {
        const periodo1 = (saidaAlmoco.getTime() - entrada.getTime()) / 1000;
        const periodo2 = (saida.getTime() - voltaAlmoco.getTime()) / 1000;
        segundosTrabalhados = Math.max(0, periodo1) + Math.max(0, periodo2);
      } else {
        segundosTrabalhados = Math.max(0, (saida.getTime() - entrada.getTime()) / 1000);
      }
      status = 'completo';
    } else if (entrada || saidaAlmoco || voltaAlmoco || saida) {
      status = 'incompleto';
    }

    const segundosExtra =
      status === 'completo'
        ? Math.max(0, segundosTrabalhados - APP_CONFIG.horasJornadaPadrao * 3600)
        : 0;

    dias.push({
      data,
      dataTexto: data.toLocaleDateString('pt-BR'),
      diaSemana: DIAS_SEMANA[data.getDay()],
      entrada,
      saidaAlmoco,
      voltaAlmoco,
      saida,
      segundosTrabalhados,
      segundosExtra,
      status,
    });
  }

  return dias;
}

export { formatarHora };
