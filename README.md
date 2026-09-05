# AgriFam

Site da AgriFam, uma plataforma para aproximar consumidores da agricultura familiar.

## Desenvolvimento

Instale as dependências e valide o TypeScript:

```bash
npm install
npm run check
npm run build
```

O arquivo `script.ts` concentra a base tipada para a migração gradual do frontend. O navegador usa `script.js` enquanto a aplicação continua sendo migrada para TypeScript.

## Organização do frontend

- `index.html`: estrutura semântica das páginas, navegação, modais e pontos de montagem do conteúdo dinâmico.
- `style.css`: tokens visuais, componentes, estados de interação e responsividade. As seções estão numeradas para facilitar a localização das regras.
- `script.js`: comportamento executado no navegador, renderização dos dados demonstrativos, busca, filtros, carrinho, chat e modais.
- `script.ts`: base tipada para a migração gradual do comportamento para TypeScript.
- `types.ts`: contratos compartilhados de produtos, produtores, categorias, carrinho e filtros.
- `asset/`: imagens e ícones locais usados pela interface.

## Tipografia

- **Poppins**: títulos, chamadas e elementos de destaque.
- **Nunito Sans**: textos, navegação e controles, priorizando leitura confortável.

As fontes são carregadas no `<head>` de `index.html` e expostas pelos tokens `--display` e `--sans` no `style.css`.

## Antes de enviar alterações

1. Execute `npm run check` para verificar os contratos TypeScript.
2. Execute `npx prettier --write index.html style.css script.js script.ts types.ts` depois de editar os arquivos.
3. Confira `git diff --check` para detectar problemas de espaços e formatação.

## Próximas integrações

- Produtos: `GET /api/produtos`
- Produtores: `GET /api/produtores`
- Autenticação: `POST /api/auth`
- Pedidos: `POST /api/pedidos`
