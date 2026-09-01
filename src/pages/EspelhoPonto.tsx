
---

### 2. Estrutura de Colunas do Relatório

<p style="text-align: justify;">A tabela a seguir apresenta o detalhamento dos campos calculados e exibidos na listagem e na exportação do espelho de ponto:</p>

<table>
<thead>
<tr>
<th>Sigla / Campo</th>
<th>Descrição da Coluna</th>
<th>Regra de Preenchimento</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Data</strong></td>
<td>Data do registro</td>
<td>Formato DD/MM/AAAA</td>
</tr>
<tr>
<td><strong>Dia</strong></td>
<td>Dia da semana</td>
<td>Abreviação (Dom, Seg, Ter, Qua, Qui, Sex, Sab)</td>
</tr>
<tr>
<td><strong>Marcações</strong></td>
<td>Horários registrados no dia</td>
<td>Pares de entrada/saída formatados (HH:mm)</td>
</tr>
<tr>
<td><strong>Jornada</strong></td>
<td>Carga horária prevista</td>
<td>08:00 para dias úteis / 00:00 para finais de semana</td>
</tr>
<tr>
<td><strong>Observações</strong></td>
<td>Status do dia ou tipos de batida</td>
<td>Descritivo das marcações ou 'Falta'</td>
</tr>
<tr>
<td><strong>HT</strong></td>
<td>Horas Trabalhadas</td>
<td>Soma total do tempo entre marcações pares</td>
</tr>
<tr>
<td><strong>EX</strong></td>
<td>Horas Extras</td>
<td>Tempo trabalhado excedente à jornada prevista</td>
</tr>
<tr>
<td><strong>AN</strong></td>
<td>Horas a Menos / Atraso Negativo</td>
<td>Déficit de tempo em relação à jornada diária</td>
</tr>
<tr>
<td><strong>EN / AT / FA</strong></td>
<td>Entrada Noturna, Atraso e Faltas</td>
<td>Contadores e registros de ocorrências</td>
</tr>
</tbody>
</table>

---

### 3. Código-Fonte Completo (`src/pages/EspelhoPonto.tsx`)
```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cabecalho } from '../components/Cabecalho';
import { api } from '../services/api';
import type { RegistroPonto, Funcionario } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DiaEspelho {
  data: string;<br/>
  diaSemana: string;<br/>
  marcacoes: string[];<br/>
  jornada: string;<br/>
  observacoes: string;<br/>
  ht: string;<br/>
  ex: string;<br/>
  an: string;<br/>
  en: string;<br/>
  at: string;<br/>
  fa: string;
}

export function EspelhoPonto() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [registros, setRegistros] = useState<DiaEspelho[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [nomeFuncionario, setNomeFuncionario] = useState('');

  useEffect(() => {
    async function carregarFuncionarios() {
      try {
        const resposta = await api.listarFuncionarios();
        const ativos = (resposta.dados as Funcionario[]) || [];
        setFuncionarios(ativos);
      } catch {
        // erro silencioso
      }
    }
    carregarFuncionarios();
  }, []);

  function obterDiaSemana(data: Date): string {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    return dias[data.getDay()];
  }

  function calcularHoras(marcacoes: string[], jornada: string): { ht: string; ex: string; an: string } {<br/>
    if (marcacoes.length < 2) return { ht: '00:00', ex: '00:00', an: '00:00' };
    let totalMin = 0;
    for (let i = 0; i < marcacoes.length - 1; i += 2) {
      const entrada = marcacoes[i];
      const saida = marcacoes[i + 1];
      if (entrada && saida) {
        const [eh, em] = entrada.split(':').map(Number);<br/>
        const [sh, sm] = saida.split(':').map(Number);
        totalMin += (sh * 60 + sm) - (eh * 60 + em);
      }
    }
    const horas = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const ht = String(horas).padStart(2, '0') + ':' + String(mins).padStart(2, '0');<br/>
    const [jh, jm] = jornada.split(':').map(Number);
    const jornadaMin = jh * 60 + jm;
    const diff = totalMin - jornadaMin;
    let ex = '00:00';<br/>
    let an = '00:00';
    if (diff > 0) {
      ex = String(Math.floor(diff / 60)).padStart(2, '0') + ':' + String(diff % 60).padStart(2, '0');
    } else if (diff < 0) {
      const abs = Math.abs(diff);
      an = String(Math.floor(abs / 60)).padStart(2, '0') + ':' + String(abs % 60).padStart(2, '0');
    }
    return { ht, ex, an };
  }

  async function gerarRelatorio() {
    setCarregando(true);
    try {
      const func = funcionarios.find(f => f.id === funcionarioSelecionado);
      setNomeFuncionario(func ? func.nome : '');
      const resposta = await api.listarRegistrosPeriodo(funcionarioSelecionado, dataInicio, dataFim);
      const regs = (resposta.dados as RegistroPonto[]) || [];
      const mapa: Record<string, RegistroPonto[]> = {};
      for (const r of regs) {
        const data = r.dataHora.split('T')[0];
        if (!mapa[data]) mapa[data] = [];
        mapa[data].push(r);
      }
      const dias: DiaEspelho[] = [];
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        const regsDia = mapa[dataStr] || [];
        const marcacoes = regsDia.map(r => {
          const hora = new Date(r.dataHora);
          return hora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        });
        const diaSemana = obterDiaSemana(d);
        const isFimDeSemana = diaSemana === 'Dom' || diaSemana === 'Sab';
        const jornada = isFimDeSemana ? '00:00' : '08:00';
        const { ht, ex, an } = calcularHoras(marcacoes, jornada);
        let observacoes = '';
        if (regsDia.length > 0) {
          observacoes = regsDia.map(r => r.tipoBatida).join(', ');
        } else if (!isFimDeSemana) {
          observacoes = 'Falta';
        }
        dias.push({
          data: dataStr.split('-').reverse().join('/'),
          diaSemana,
          marcacoes: marcacoes.length > 0 ? marcacoes : ['--'],
          jornada,
          observacoes,
          ht,
          ex,
          an,
          en: '00:00',<br/>
          at: '00:00',<br/>
          fa: observacoes === 'Falta' ? '1' : '0',
        });
      }
      setRegistros(dias);
    } catch {
      // erro
    }
    setCarregando(false);
  }

  function imprimir() {
    window.print();
  }

  function salvarPDF() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Espelho de Ponto - ' + nomeFuncionario, 14, 15);
    doc.setFontSize(10);
    doc.text('Periodo: ' + dataInicio.split('-').reverse().join('/') + ' a ' + dataFim.split('-').reverse().join('/'), 14, 22);
    const head = [['Data', 'Dia', 'Marcacoes', 'Jornada', 'Obs', 'HT', 'EX', 'AN', 'EN', 'AT', 'FA']];
    const body = registros.map(d => [
      d.data,
      d.diaSemana,
      d.marcacoes.join('  '),
      d.jornada,
      d.observacoes,
      d.ht,
      d.ex,
      d.an,
      d.en,
      d.at,
      d.fa,
    ]);
    autoTable(doc, {
      head: head,<br/>
      body: body,<br/>
      startY: 28,<br/>
      styles: { fontSize: 8, cellPadding: 1.5 },<br/>
      headStyles: { fillColor: [22, 58, 110], textColor: 255 },<br/>
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });
    const totalHT = registros.reduce((acc, d) => {
      const [h, m] = d.ht.split(':').map(Number);
      return acc + h * 60 + m;
    }, 0);
    const totalEX = registros.reduce((acc, d) => {
      const [h, m] = d.ex.split(':').map(Number);
      return acc + h * 60 + m;
    }, 0);
    const totalAN = registros.reduce((acc, d) => {
      const [h, m] = d.an.split(':').map(Number);
      return acc + h * 60 + m;
    }, 0);
    const totalFA = registros.reduce((acc, d) => acc + Number(d.fa), 0);
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(9);
    doc.text(
      'Totais:  HT ' + String(Math.floor(totalHT / 60)).padStart(2, '0') + ':' + String(totalHT % 60).padStart(2, '0') +<br/>
      '   EX ' + String(Math.floor(totalEX / 60)).padStart(2, '0') + ':' + String(totalEX % 60).padStart(2, '0') +<br/>
      '   AN ' + String(Math.floor(totalAN / 60)).padStart(2, '0') + ':' + String(totalAN % 60).padStart(2, '0') +
      '   FA ' + totalFA,
      14, finalY + 8
    );
    doc.save('espelho-ponto-' + nomeFuncionario.toLowerCase().replace(/\s+/g, '-') + '.pdf');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light to-white">
      <Cabecalho subtitulo="Espelho de Ponto" />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 print:hidden">
            <h2 className="text-xl font-bold text-brand-dark mb-4">Gerar Espelho de Ponto</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark/70 mb-1">Funcionario</label>
                <select
                  value={funcionarioSelecionado}
                  onChange={(e) => setFuncionarioSelecionado(e.target.value)}
                  className="w-full rounded-lg border border-brand-dark/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">Selecione...</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/70 mb-1">Data Inicio</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full rounded-lg border border-brand-dark/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/70 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full rounded-lg border border-brand-dark/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={gerarRelatorio}
                  className="w-full bg-brand-blue text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {carregando ? 'Gerando...' : 'Gerar Relatorio'}
                </button>
              </div>
            </div>
          </div>

          {registros.length > 0 && (
            <>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 print:hidden">
                <div className="flex gap-3">
                  <button
                    onClick={imprimir}
                    className="flex items-center gap-2 bg-brand-accent text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-accent/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir
                  </button>
                  <button
                    onClick={salvarPDF}
                    className="flex items-center gap-2 bg-brand-warn text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-warn/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Salvar PDF
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none print:rounded-none">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-brand-dark">Espelho de Ponto</h2>
                  <p className="text-sm text-brand-dark/60">Funcionario: {nomeFuncionario}</p>
                  <p className="text-sm text-brand-dark/60">Periodo: {dataInicio.split('-').reverse().join('/')} a {dataFim.split('-').reverse().join('/')}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-brand-blue text-white">
                        <th className="border border-brand-dark/20 px-2 py-1 text-left">Data</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">Dia</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">Marcacoes</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">Jornada</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-left">Observacoes</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">HT</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">EX</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">AN</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">EN</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">AT</th>
                        <th className="border border-brand-dark/20 px-2 py-1 text-center">FA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registros.map((dia, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-light/30'}>
                          <td className="border border-brand-dark/20 px-2 py-1">{dia.data}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center">{dia.diaSemana}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">{dia.marcacoes.join('  ')}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center">{dia.jornada}</td>
                          <td className="border border-brand-dark/20 px-2 py-1">{dia.observacoes}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">{dia.ht}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">{dia.ex}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">{dia.an}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">{dia.en}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">{dia.at}</td>
                          <td className="border border-brand-dark/20 px-2 py-1 text-center">{dia.fa}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-brand-blue/10 font-bold">
                        <td colSpan={5} className="border border-brand-dark/20 px-2 py-1 text-right">Totais</td>
                        <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">
                          {String(Math.floor(registros.reduce((a, d) => a + d.ht.split(':').map(Number)[0] * 60 + d.ht.split(':').map(Number)[1], 0) / 60)).padStart(2, '0')}:{String(registros.reduce((a, d) => a + d.ht.split(':').map(Number)[0] * 60 + d.ht.split(':').map(Number)[1], 0) % 60).padStart(2, '0')}
                        </td>
                        <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">
                          {String(Math.floor(registros.reduce((a, d) => a + d.ex.split(':').map(Number)[0] * 60 + d.ex.split(':').map(Number)[1], 0) / 60)).padStart(2, '0')}:{String(registros.reduce((a, d) => a + d.ex.split(':').map(Number)[0] * 60 + d.ex.split(':').map(Number)[1], 0) % 60).padStart(2, '0')}
                        </td>
                        <td className="border border-brand-dark/20 px-2 py-1 text-center font-mono">
                          {String(Math.floor(registros.reduce((a, d) => a + d.an.split(':').map(Number)[0] * 60 + d.an.split(':').map(Number)[1], 0) / 60)).padStart(2, '0')}:{String(registros.reduce((a, d) => a + d.an.split(':').map(Number)[0] * 60 + d.an.split(':').map(Number)[1], 0) % 60).padStart(2, '0')}
                        </td>
                        <td className="border border-brand-dark/20 px-2 py-1 text-center">--</td>
                        <td className="border border-brand-dark/20 px-2 py-1 text-center">--</td>
                        <td className="border border-brand-dark/20 px-2 py-1 text-center">{registros.reduce((a, d) => a + Number(d.fa), 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 print:hidden">
            <Link to="/" className="text-sm text-brand-dark/50 hover:text-brand-dark hover:underline transition-colors">
              Voltar ao inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
