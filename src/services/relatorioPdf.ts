import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Funcionario } from '../types';
import { APP_CONFIG } from '../config';
import { apurarMes, formatarHora, segundosParaHoras, type DiaApurado } from './apuracao';
import type { RegistroPonto } from '../types';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const ROTULO_STATUS: Record<DiaApurado['status'], string> = {
  completo: '',
  incompleto: 'Incompleto',
  sem_registro: '—',
};

export function gerarNomeArquivo(funcionario: Funcionario, mes: number, ano: number): string {
  const nomeArquivo = funcionario.nome.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  return `Ponto_${nomeArquivo}_${String(mes).padStart(2, '0')}-${ano}.pdf`;
}

export function gerarRelatorioPDF(
  funcionario: Funcionario,
  registros: RegistroPonto[],
  mes: number,
  ano: number
): jsPDF {
  const dias = apurarMes(registros, mes, ano);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // ---- Cabeçalho ----
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_CONFIG.nomeEmpresa, 40, 45);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Espelho de ponto mensal', 40, 63);

  doc.setFontSize(10);
  doc.text(`Funcionário: ${funcionario.nome}`, 40, 85);
  doc.text(`Cargo: ${funcionario.cargo || '-'}`, 40, 100);
  doc.text(`CPF: ${funcionario.cpf || '-'}`, 300, 85);
  doc.text(`Referência: ${MESES[mes - 1]}/${ano}`, 300, 100);

  // ---- Tabela dia a dia ----
  const linhas = dias.map(d => [
    `${d.dataTexto} (${d.diaSemana})`,
    formatarHora(d.entrada),
    formatarHora(d.saidaAlmoco),
    formatarHora(d.voltaAlmoco),
    formatarHora(d.saida),
    d.status === 'completo' ? segundosParaHoras(d.segundosTrabalhados) : '-',
    d.status === 'completo' && d.segundosExtra > 0 ? segundosParaHoras(d.segundosExtra) : '-',
    ROTULO_STATUS[d.status],
  ]);

  autoTable(doc, {
    startY: 120,
    head: [['Data', 'Entrada', 'Saída almoço', 'Volta almoço', 'Saída', 'Horas', 'Extra', 'Obs.']],
    body: linhas,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [11, 29, 58] }, // brand-dark
    columnStyles: {
      0: { cellWidth: 90 },
      7: { cellWidth: 55 },
    },
    didParseCell: (dados) => {
      // Deixa fins de semana com fundo levemente cinza, só pra facilitar
      // a leitura visual (não significa falta, é só referência).
      const dia = dias[dados.row.index];
      if (dia && (dia.diaSemana === 'Sáb' || dia.diaSemana === 'Dom') && dados.section === 'body') {
        dados.cell.styles.fillColor = [245, 246, 248];
      }
    },
  });

  // ---- Totais do mês ----
  const totalTrabalhado = dias.reduce((soma, d) => soma + d.segundosTrabalhados, 0);
  const totalExtra = dias.reduce((soma, d) => soma + d.segundosExtra, 0);
  const diasCompletos = dias.filter(d => d.status === 'completo').length;
  const diasIncompletos = dias.filter(d => d.status === 'incompleto').length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 120;
  let y = finalY + 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Resumo do período', 40, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.text(`Total de horas trabalhadas: ${segundosParaHoras(totalTrabalhado)}`, 40, y);
  y += 15;
  doc.text(`Total de horas extras: ${segundosParaHoras(totalExtra)}`, 40, y);
  y += 15;
  doc.text(`Dias completos: ${diasCompletos}   |   Dias incompletos: ${diasIncompletos}`, 40, y);
  y += 15;
  doc.text(`Jornada padrão considerada: ${APP_CONFIG.horasJornadaPadrao}h/dia`, 40, y);

  // ---- Assinaturas ----
  y += 50;
  doc.line(40, y, 250, y);
  doc.line(320, y, 530, y);
  y += 12;
  doc.setFontSize(9);
  doc.text('Assinatura do funcionário', 40, y);
  doc.text('Assinatura do responsável', 320, y);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
    40,
    doc.internal.pageSize.getHeight() - 20
  );

  return doc;
}
