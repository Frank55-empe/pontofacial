# Ponto Facial

Sistema próprio de controle de ponto por reconhecimento facial, com
Google Sheets como banco de dados e hospedagem no GitHub Pages.

## Status do projeto (Fases 1, 2 e 3 concluídas)

- [x] Estrutura do projeto (React + TypeScript + Vite + Tailwind v4)
- [x] Rotas: tela inicial, bater ponto, login admin, dashboard,
      funcionários, cadastro de funcionário, espelho de ponto
- [x] Serviço de comunicação com o Apps Script via JSONP
- [x] Backend em Google Apps Script com planilhas de funcionários,
      registros de ponto e configurações
- [x] Workflow de deploy automático no GitHub Pages
- [x] Fase 2: reconhecimento facial de verdade (face-api.js)
- [x] Fase 3: bater ponto automático com reconhecimento ao vivo
- [ ] Fase 4: relatórios e exportação no painel admin

## Como rodar localmente

```bash
npm install
npm run dev
```

## Como configurar o backend (Google Sheets + Apps Script)

1. Crie uma planilha nova no Google Sheets.
2. Vá em **Extensões > Apps Script**.
3. Apague o conteúdo padrão e cole o conteúdo de `apps-script/Code.gs`.
4. No editor do Apps Script, rode a função `configurarPlanilha` uma vez
   (selecione ela no menu de funções e clique em Executar). Isso cria
   as 3 abas com os cabeçalhos certos: `funcionarios`, `registros_ponto`,
   `configuracoes`.
5. **Importante:** na aba `configuracoes`, troque a senha padrão do
   admin (linha `admin_senha`) antes de usar de verdade.
6. Vá em **Implantar > Nova implantação**.
   - Tipo: **App da Web**
   - Executar como: **Eu** (sua conta)
   - Quem pode acessar: **Qualquer pessoa**
7. Copie a URL gerada (termina em `/exec`).
8. Cole essa URL em `src/config.ts`, no campo `APPS_SCRIPT_URL`.

## Como publicar no GitHub Pages

**Importante, pela sua própria experiência no Bolão Copa 2026:**
não suba os arquivos pelo site do GitHub (drag-and-drop). A pasta
`.github/workflows` é oculta e o site do GitHub costuma "perder" ela
nesse processo. Use o git local mesmo:

```bash
git init
git add .
git commit -m "Primeira versão - Fase 1"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/ponto-facial.git
git push -u origin main
```

Depois, no GitHub: **Settings > Pages > Source > GitHub Actions**.
O workflow em `.github/workflows/deploy.yml` cuida do resto sozinho
a cada push na branch `main`.

Se o nome do seu repositório não for `ponto-facial`, ajuste o campo
`base` em `vite.config.ts` para bater com o nome real do repositório.

## Estrutura de pastas

```
src/
  components/     componentes reutilizáveis (Cabeçalho, botões, rota protegida)
  pages/          telas do app
    admin/         telas da área administrativa
  services/       comunicação com o Apps Script (api.ts)
  hooks/          hooks (autenticação do admin)
  types/          tipos TypeScript compartilhados
  config.ts       URL do Apps Script e configurações gerais
apps-script/
  Code.gs         código do backend para colar no Apps Script
```
