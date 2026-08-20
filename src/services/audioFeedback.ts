// SISTEMA DE AUDIO - VOZ MASCULINA HUMANIZADA

    interface OpcoesAudio {
      habilitado: boolean;
      velocidade: number;
      tom: number;
      volume: number;
    }

    const OPCOES_PADRAO: OpcoesAudio = {
      habilitado: true,
      velocidade: 0.88,
      tom: 0.85,
      volume: 1,
    };

    let opcoesAtuais: OpcoesAudio = { ...OPCOES_PADRAO };

    export function configurarAudio(novasOpcoes: Partial<OpcoesAudio>): void {
      opcoesAtuais = { ...opcoesAtuais, ...novasOpcoes };
    }

    export function getOpcoesAudio(): OpcoesAudio {
      return { ...opcoesAtuais };
    }

    function obterSaudacaoHorario(): string {
      const hora = new Date().getHours();
      if (hora < 12) return 'Bom dia';
      if (hora < 18) return 'Boa tarde';
      return 'Boa noite';
    }

    function obterMensagemDespedida(): string {
      const hora = new Date().getHours();
      if (hora < 12) return 'Tenha um excelente dia';
      if (hora < 18) return 'Tenha uma boa tarde';
      return 'Tenha um bom descanso';
    }

    const VOZES_MASCULINAS = [
      'Microsoft Daniel',
      'Microsoft Antonio',
      'Microsoft Carlos',
      'Google portugues do Brasil',
      'Google Portuguese (Brazil)',
      'pt-BR-Standard-B',
      'pt-BR-Standard-D',
      'Felipe',
      'Daniel',
      'Antonio',
      'Carlos',
      'Ricardo',
    ];

    const VOZES_FEMININAS = [
      'Microsoft Maria',
      'Microsoft Francisca',
      'pt-BR-Standard-A',
      'pt-BR-Standard-C',
      'Maria',
      'Francisca',
      'Luciana',
      'Vitoria',
      'Camila',
    ];

    function encontrarMelhorVoz(): SpeechSynthesisVoice | undefined {
      const vozes = window.speechSynthesis.getVoices();
      if (!vozes || vozes.length === 0) return undefined;

      const vozesPt = vozes.filter(
        (v) => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang === 'pt-PT'
      );

      if (vozesPt.length === 0) return undefined;

      for (const nomePreferido of VOZES_MASCULINAS) {
        const encontrada = vozesPt.find((v) =>
          v.name.toLowerCase().includes(nomePreferido.toLowerCase())
        );
        if (encontrada) return encontrada;
      }

      const naoFemininas = vozesPt.filter(
        (v) => !VOZES_FEMININAS.some((nome) =>
          v.name.toLowerCase().includes(nome.toLowerCase())
        )
      );
      if (naoFemininas.length > 0) return naoFemininas[0];

      const localBrasil = vozesPt.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR');
      if (localBrasil) return localBrasil;

      return vozesPt[0];
    }

    export function falar(texto: string): void {
      if (!opcoesAtuais.habilitado) return;
      if (!('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-BR';
      utterance.rate = opcoesAtuais.velocidade;
      utterance.pitch = opcoesAtuais.tom;
      utterance.volume = opcoesAtuais.volume;

      const voz = encontrarMelhorVoz();
      if (voz) {
        utterance.voice = voz;
      }

      window.speechSynthesis.speak(utterance);
    }

    export function falarConfirmacaoPonto(
      nome: string,
      tipoBatida: 'entrada' | 'saida_almoco' | 'volta_almoco' | 'saida'
    ): void {
      const saudacao = obterSaudacaoHorario();
      const primeiroNome = nome.split(' ')[0];
      let mensagem: string;

      switch (tipoBatida) {
        case 'entrada':
          mensagem = saudacao + ', ' + primeiroNome + '! Ponto de entrada registrado com sucesso.';
          break;
        case 'saida_almoco':
          mensagem = saudacao + ', ' + primeiroNome + '! Saida para o almoco registrada. Bom apetite!';
          break;
        case 'volta_almoco':
          mensagem = saudacao + ', ' + primeiroNome + '! Retorno do almoco registrado com sucesso.';
          break;
        case 'saida':
          mensagem = saudacao + ', ' + primeiroNome + '! Saida registrada. ' + obterMensagemDespedida() + '!';
          break;
        default:
          mensagem = saudacao + ', ' + primeiroNome + '! Ponto registrado com sucesso.';
      }

      falar(mensagem);
    }

    export function tocarBipe(tipo: 'sucesso' | 'erro' = 'erro'): void {
      try {
        const ctx = new (window.

AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        if (tipo === 'sucesso') {
          oscillator.frequency.setValueAtTime(880, ctx.currentTime);
          oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
        } else {
          oscillator.frequency.setValueAtTime(220, ctx.currentTime);
          oscillator.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
        }

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);

        oscillator.onended = () => ctx.close();
      } catch {
        // ignora se AudioContext falhar
      }
    }

    export function inicializarAudio(): void {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

Clica em **Commit changes**.

---

## Arquivo 2: BaterPonto.tsx

Abre: https://github.com/Frank55-empe/pontofacial/edit/main/src/pages/BaterPonto.tsx

**Ctrl+A** → **Delete** → cola **só isto**:

    import { useCallback, useEffect, useRef, useState } from 'react';
    import { Link } from 'react-router-dom';
    import { Cabecalho } from '../components/Cabecalho';
    import { api } from '../services/api';
    import {
      carregarModelosFaciais,
      detectarRosto,
      encontrarMelhorCorrespondencia,
    } from '../services/faceRecognition';
    import {
      falarConfirmacaoPonto,
      tocarBipe,
      inicializarAudio,
    } from '../services/audioFeedback';
    import type { Funcionario, RegistroPonto, TipoBatida } from '../types';

    type Status =
      | 'carregando'
      | 'procurando'
      | 'processando'
      | 'sucesso'
      | 'nao_reconhecido'
      | 'erro'
      | 'camera_negada';

    interface ResultadoBatida {
      nome: string;
      tipo: TipoBatida;
      horario: string;
    }

    const ROTULOS_BATIDA: Record<TipoBatida, string> = {
      entrada: 'Entrada',
      saida_almoco: 'Saida para almoco',
      volta_almoco: 'Retorno do almoco',
      saida: 'Saida',
    };

    const TENTATIVAS_ATE_AVISAR_DESCONHECIDO = 3;
    const COOLDOWN_MS = 10000;

    export function BaterPonto() {
      const videoRef = useRef<HTMLVideoElement>(null);
      const streamRef = useRef<MediaStream | null>(null);
      const funcionariosRef = useRef<Funcionario[]>([]);
      const emProcessamentoRef = useRef(false);
      const tentativasSemMatchRef = useRef(0);
      const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
      const cooldownRef = useRef<number | null>(null);
      const ultimoReconhecidoRef = useRef<{ id: string; timestamp: number } | null>(null);

      const [status, setStatus] = useState<Status>('carregando');
      const [mensagem, setMensagem] = useState('Inicializando camera...');
      const [resultado, setResultado] = useState<ResultadoBatida | null>(null);
      const [horaAtual, setHoraAtual] = useState('');

      useEffect(() => {
        const atualizar = () => {
          const agora = new Date();
          setHoraAtual(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        atualizar();
        const id = setInterval(atualizar, 1000);
        return () => clearInterval(id);
      }, []);

      useEffect(() => {
        inicializarAudio();
      }, []);

      const proximaBatida = useCallback(
        async (funcionarioId: string): Promise<TipoBatida> => {
          try {
            const resposta = await api.listarRegistrosDoDia(funcionarioId);
            const registros = (resposta.dados as RegistroPonto[]) || [];
            const tiposJaRegistrados = new Set(registros.map((r) => r.tipoBatida));
            const ordem: TipoBatida[] = ['entrada', 'saida_almoco', 'volta_almoco', 'saida'];
            for (const tipo of ordem) {
              if (!tiposJaRegistrados.has(tipo)) return tipo;
            }
            return 'saida';
          } catch {
            return 'entrada';
          }
        },
        []
      );

      const registrarReconhecimento = useCallback(
        async (id: string, nome: string, distancia: number) => {
          const agora = Date.now();

          if (
            ultimoReconhecidoRef.current &&
            ultimoReconhecidoRef.current.id === id &&
            agora - ultimoReconhecidoRef.current.timestamp < COOLDOWN_MS
          ) {
            return;
          }

          ultimoReconhecidoRef.current = { id, timestamp: agora };

          emProcessamentoRef.current = true;
          setStatus('processando');
          setMensagem('Identificado: ' + nome + '. Registrando ponto...');

          try {
            const tipo = await proximaBatida(id);
            const dataHora = new Date();

            const resposta = await api.registrarPonto({
              funcionarioId: id,
              nomeFuncionario: nome,
              tipoBatida: tipo,
              dataHora: dataHora.toISOString(),
              metodoConfirmacao: 'facial',
              distanciaFacial: distancia.toFixed(4),
            });

            if (resposta.sucesso) {
              const horario = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              setResultado({ nome, tipo, horario });
              setStatus('sucesso');
              tocarBipe('sucesso');
              falarConfirmacaoPonto(nome, tipo);

              cooldownRef.current = window.setTimeout(() => {
                tentativasSemMatchRef.current = 0;
                emProcessamentoRef.current = false;
                setStatus('procurando');
                setMensagem('');
              }, COOLDOWN_MS);
            } else {
              setStatus('erro');
              setMensagem(resposta.erro || 'Erro ao registrar ponto.');
              tocarBipe('erro');
              window.setTimeout(() => {
                emProcessamentoRef.current = false;
                setStatus('procurando');
              }, 3000);
            }
          } catch {
            setStatus('erro');
            setMensagem('Falha de comunicacao. Tente novamente.');
            tocarBipe('erro');
            window.setTimeout(() => {
              emProcessamentoRef.current = false;
              setStatus('procurando');
            }, 3000);
          }
        },
        [proximaBatida]
      );

      const cicloDeteccao = useCallback(async () => {
        if (emProcessamentoRef.current) return;
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        const rosto = await detectarRosto(videoRef.current);
        if (!rosto) return;

        const correspondencia = encontrarMelhorCorrespondencia(rosto.descritor, funcionariosRef.current);

        if (correspondencia) {
          const agora = Date.now();
          if (
            ultimoReconhecidoRef.current &&
            ultimoReconhecidoRef.current.id === correspondencia.id &&
            agora - ultimoReconhecidoRef.current.timestamp < COOLDOWN_MS
          ) {
            return;
          }

          tentativasSemMatchRef.current = 0;
          await registrarReconhecimento(correspondencia.id, correspondencia.nome, correspondencia.distancia);
          return;
        }

        tentativasSemMatchRef.current += 1;
        if (tentativasSemMatchRef.current >= TENTATIVAS_ATE_AVISAR_DESCONHECIDO) {
          emProcessamentoRef.current = true;
          tocarBipe('erro');
          setStatus('nao_reconhecido');
          setMensagem('Rosto nao reconhecido. Procure o administrador.');
          window.setTimeout(() => {
            tentativasSemMatchRef.current = 0;
            emProcessamentoRef.current = false;
            setStatus('procurando');
          }, 4000);
        }
      }, [registrarReconhecimento]);

      useEffect(() => {
        let cancelado = false;

        async function iniciar() {
          try {
            setStatus('carregando');
            setMensagem('Carregando reconhecimento facial...');

            const [, stream, respostaFuncionarios] = await Promise.all([
              carregarModelosFaciais(),
              navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } }),
              api.listarFuncionarios(),
            ]);

            if (cancelado) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }

            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }

            const ativos = ((respostaFuncionarios.dados as Funcionario[]) || []).filter((f) => f.ativo && f.descritorFacial);
            funcionariosRef.current = ativos;

            if (ativos.length === 0) {
              setStatus('erro');
              setMensagem('Nenhum funcionario cadastrado com reconhecimento facial.');
              return;
            }

            setStatus('procurando');
            setMensagem('');
            intervaloRef.current = setInterval(cicloDeteccao, 800);
          } catch (err) {
            if (cancelado) return;
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
              setStatus('camera_negada');
              setMensagem('Acesso a camera foi negado. Permita o acesso e recarregue.');
            } else {
              setStatus('erro');
              setMensagem('Erro ao inicializar. Recarregue a pagina.');
            }
          }
        }

        iniciar();

        return () => {
          cancelado = true;
          if (intervaloRef.current) clearInterval(intervaloRef.current);
          if (cooldownRef.current) clearTimeout(cooldownRef.current);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
          }
        };
      }, []);

      useEffect(() => {
        if (status === 'procurando' && !intervaloRef.current) {
          intervaloRef.current = setInterval(cicloDeteccao, 800);
        }
        if (status !== 'procurando' && intervaloRef.current) {
          clearInterval(intervaloRef.current);
          intervaloRef.current = null;
        }
      }, [status, cicloDeteccao]);

      const corMoldura =
        status === 'sucesso'
          ? 'border-brand-accent shadow-[0_0_20px_rgba(30,138,95,0.5)]'
          : status === 'erro' || status === 'nao_reconhecido'
            ? 'border-brand-warn shadow-[0_0_20px_rgba(194,65,12,0.4)]'
            : status === 'processando'
              ? 'border-brand-blue shadow-[0_0_20px_rgba(22,58,110,0.4)]'
              : 'border-white/30';

      return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light to-white">
          <Cabecalho subtitulo="Bater ponto" />
          <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8">
            <div className="text-center">
              <p className="text-3xl font-mono font-bold text-brand-dark tabular-nums">{horaAtual}</p>
              <p className="text-sm text-brand-dark/50">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden bg-black shadow-2xl ring-1 ring-black/10">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className={'absolute inset-6 border-4 rounded-2xl pointer-events-none transition-all duration-500 ' + corMoldura} />

              {status === 'procurando' && (
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                  <span className="text-white text-xs font-medium">Ao vivo</span>
                </div>
              )}

              {status === 'carregando' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white bg-black/70">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-sm text-white/80 text-center px-6">{mensagem}</p>
                </div>
              )}

              {status === 'sucesso' && resultado && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-accent/90 to-brand-blue/90 backdrop-blur-sm text-white text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold">Bem-vindo(a), {resultado.nome.split(' ')[0]}!</p>
                  <p className="text-sm text-white/80">{ROTULOS_BATIDA[resultado.tipo]} registrada</p>
                  <p className="text-2xl font-mono font-bold mt-1 tabular-nums">{resultado.horario}</p>
                </div>
              )}

              {status === 'processando' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white text-center px-6">
                  <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-sm">{mensagem}</p>
                </div>
              )}

              {status === 'nao_reconhecido' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-brand-warn/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm">{mensagem}</p>
                </div>
              )}

              {status === 'erro' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-red-500/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm">{mensagem}</p>
                </div>
              )}

              {status === 'camera_negada' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white text-center px-6">
                  <div className="text-4xl">📷</div>
                  <p className="text-sm">{mensagem}</p>
                </div>
              )}
            </div>

            {status === 'procurando' && (
              <p className="text-sm text-brand-dark/60 text-center max-w-sm">
                Posicione seu rosto na moldura e aguarde o reconhecimento automatico
              </p>
            )}

            <Link to="/" className="text-sm text-brand-dark/50 hover:text-brand-dark hover:underline transition-colors">
              Voltar ao inicio
            </Link>
          </main>
        </div>
      );
    }

Clica em **Commit changes**.

---

## Resumo dos 3 erros corrigidos

| Erro | Causa | Correção |
|---|---|---|
| `TS2554: Expected 1 arguments, but got 2` (BaterPonto.tsx:126) | O arquivo antigo não tinha o `falarConfirmacaoPonto` importado nem chamado corretamente | Adicionado import de `falarConfirmacaoPonto` e chamada `falarConfirmacaoPonto(nome, tipo)` |
| `TS2554: Expected 1-2 arguments, but got 0` (audioFeedback.ts:74) | Marcações
``` dentro do código corrompiam a função `tocarBipe`, fazendo o TypeScript perder a referência | Removidas as marcações
``` e reescrita a função completa |
| `TS2304: Cannot find name 'tipoBatida'` (audioFeedback.ts:127) | As
``` corrompiam a função `falarConfirmacaoPonto`, fazendo o parâmetro `tipoBatida` sumir do escopo | Função reescrita sem
``` e sem template literals (usa `+` em vez de `${}\`) |
