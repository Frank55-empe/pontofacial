export function jsonp<T>(url: string, params: Record<string, string>, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const cbName = 'cb_' + Math.random().toString(36).slice(2) + Date.now();
    const script = document.createElement('script');
    const query = new URLSearchParams({ ...params, callback: cbName });
    const timer = setTimeout(() => {
      limpar();
      reject(new Error('Tempo esgotado ao falar com o servidor'));
    }, timeoutMs);

    (window as any)[cbName] = (data: T) => {
      limpar();
      resolve(data);
    };

    function limpar() {
      clearTimeout(timer);
      delete (window as any)[cbName];
      script.remove();
    }

    script.src = `${url}?${query.toString()}`;
    script.onerror = () => {
      limpar();
      reject(new Error('Falha de rede'));
    };
    document.body.appendChild(script);
  });
}
