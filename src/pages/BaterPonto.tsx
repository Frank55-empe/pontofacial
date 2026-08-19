const proximaBatida = useCallback(
  async (funcionarioId: string): Promise<TipoBatida> => {
    try {
      const resposta = await api.listarRegistrosDoDia(funcionarioId);
      const registros = resposta.dados || [];
      const tiposJaRegistrados = new Set(
        registros.map((r) => r.tipoBatida)
      );
      const ordem: TipoBatida[] = [
        'entrada',
        'saida_almoco',
        'volta_almoco',
        'saida',
      ];
      for (const tipo of ordem) {
        if (!tiposJaRegistrados.has(tipo)) return tipo;
      }
      return 'saida';
    } catch {
      return 'entrada';
    }
  },
  [
    const ativos = ((respostaFuncionarios.dados as Funcionario[]) || []).filter(
  (f) => f.ativo && f.descritorFacial
);
  ]
);
