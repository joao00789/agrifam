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

## Próximas integrações

- Produtos: `GET /api/produtos`
- Produtores: `GET /api/produtores`
- Autenticação: `POST /api/auth`
- Pedidos: `POST /api/pedidos`
