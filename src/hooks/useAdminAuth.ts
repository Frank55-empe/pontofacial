import { useState, useCallback } from 'react';

const CHAVE_SESSAO = 'ponto-facial:admin-logado';

export function useAdminAuth() {
  const [logado, setLogado] = useState<boolean>(
    () => sessionStorage.getItem(CHAVE_SESSAO) === 'sim'
  );

  const entrar = useCallback(() => {
    sessionStorage.setItem(CHAVE_SESSAO, 'sim');
    setLogado(true);
  }, []);

  const sair = useCallback(() => {
    sessionStorage.removeItem(CHAVE_SESSAO);
    setLogado(false);
  }, []);

  return { logado, entrar, sair };
}
