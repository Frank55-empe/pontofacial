// SISTEMA DE AUDIO
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
      }
    }
    export function inicializarAudio(): void {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
