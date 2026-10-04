# Guia de manutenção da AgriFam

Este guia explica onde mudar cada parte do sistema e quais cuidados evitam erros em
produção. A regra geral é: **interface no frontend, validação e regras confiáveis no
backend, dados no PostgreSQL/Supabase**.

## Mapa do projeto

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura das páginas, links, formulários e pontos onde o JavaScript monta conteúdo. |
| `style.css` | Cores, tipografia, componentes, estados e regras para desktop e celular. |
| `script.js` | Eventos do navegador, chamadas à API, renderização, carrinho local, login e chat. Está dividido em blocos numerados. |
| `types.ts` | Formatos compartilhados de produtos, produtores, pedidos e conversas. |
| `api/index.ts` | Única função serverless do Vercel; carrega a aplicação Express. |
| `api/_app.ts` | Inicializa a API e verifica a configuração do segredo de sessão. |
| `vercel.json` | Envia todos os caminhos `/api/...` para a função única. Preserve essa regra ao editar o deploy. |
| `server/src/app.ts` | Monta middleware, rotas e tratamento de erros do Express. |
| `server/src/routes/` | Liga URLs e métodos HTTP aos controllers. |
| `server/src/controllers/` | Regras das operações de autenticação, catálogo, pagamentos, pedidos e conversas. |
| `server/src/schemas/` | Validação dos dados recebidos pela API com Zod. |
| `server/src/db/schema.ts` | Tabelas e relações do banco definidas em Drizzle. |
| `server/src/db/migrations-pg/` | Migrações PostgreSQL aplicadas por `npm run db:migrate`. Revise-as antes de executar em produção. |
| `server/src/tests/` | Testes existentes para API e autenticação. |
| `server/.env.example` | Lista de nomes e exemplos das variáveis locais; nunca coloque valores reais aqui. |

O navegador carrega `script.js`. `script.ts` ainda não é usado pela página, então uma
alteração nele não muda o site publicado.

## Onde fazer mudanças comuns

### Aparência e navegação

- Cores e fontes: tokens `:root` no início de `style.css`.
- Cabeçalho, busca e menu: `<header>` no `index.html`, bloco 2 de `style.css` e bloco 2 de `script.js`.
- Categorias: ícones em `categoryIcons` e `renderCategories()` no bloco 3 de `script.js`; aparência em `.category` e `.category-list`.
- Cards de produto: `productCard()` e `.product-card`.
- Chat: `chatAvatarMarkup()`, `renderConversationList()`, `renderMessages()` e os estilos `.chat-*`.
- No momento há regras de refinamento visual ao fim de `style.css`. Elas sobrescrevem estilos anteriores; ajuste-as antes de duplicar regras espalhadas pelo arquivo.

### Adicionar uma operação de API

1. Defina e valide o corpo/query em `server/src/schemas/`.
2. Implemente a regra em um controller de `server/src/controllers/`.
3. Registre o caminho e os middlewares em `server/src/routes/`.
4. Monte a rota em `server/src/app.ts` se for uma nova família de rotas.
5. Atualize `types.ts` se o formato atravessar a fronteira entre frontend e API.
6. Acrescente cobertura em `server/src/tests/` antes de mudar uma regra usada por clientes.
7. No frontend, chame a rota por `api()` em `script.js`; evite criar um segundo `fetch` sem necessidade.

### Adicionar um campo ou tabela

Atualize em conjunto o schema Drizzle, as validações, controllers e uma migração
revisada. Aplique a migração no banco correto antes de publicar a API dependente dela.
O projeto não inclui mais seed de lojas ou produtos fictícios.

## Regras que protegem os dados

- Segredos ficam em `server/.env` local ou nas variáveis da Vercel. Nunca no HTML,
  `script.js`, URLs, commits, mensagens ou screenshots.
- Se uma credencial aparecer em uma captura, conversa ou commit, revogue-a e gere outra.
- Pagamentos: valide preço e propriedade no servidor, nunca confie em retorno do navegador
  como confirmação. Só webhook com assinatura válida e consulta do pagamento pode liquidar
  o pedido. Tokens OAuth do Mercado Pago são criptografados; proteja também a chave de
  criptografia e os segredos de webhook nas variáveis da Vercel.
- O frontend pode validar para orientar a pessoa, mas o backend deve validar novamente
  e decidir autorização, preço, quantidade e propriedade dos registros.
- Use `requireAuth` nas rotas privadas e `requireRole("producer")` onde a operação só
  pertence a produtores. Verifique também se o registro pertence ao usuário atual.
- Use `escapeHTML()` para texto dinâmico inserido em HTML e `safeImageURL()` para URLs
  de imagem. Não concatene conteúdo de usuário em `innerHTML` sem sanitização.
- A chave Supabase `SUPABASE_SECRET_KEY` só é usada no servidor. Para chaves `sb_secret_`,
  a API envia `apikey`; não as envie como `Authorization: Bearer`, pois não são JWTs.
- O bucket `agrifam-images` é público para servir avatares pelas URLs atuais. Não use
  esse bucket para documentos privados. Para arquivos privados, use bucket privado e
  URLs assinadas.
- Mantenha o rate limit e os limites de tamanho/tipo de arquivo das rotas de upload.

## Rodar e publicar

Para desenvolvimento local, siga `README.md` e use `server/.env.example` como modelo.
O servidor precisa estar rodando em `http://localhost:3333`, e a página precisa ser
servida por HTTP, não aberta como `file://`.

As alterações desta versão estão na branch `melhorias-agrifam` do repositório
`joao00789/agrifam`. A `main` permanece intacta até o PR ser revisado e integrado.

O deploy automático só ocorre quando o projeto correto da Vercel está conectado a este
repositório e sua branch de produção está configurada. Confira o repositório e a branch
em **Vercel → Project Settings → Git** antes de alterar produção. Para publicar pelo
CLI, entre na raiz do projeto, autentique-se e vincule explicitamente o projeto certo:

```bash
npx --yes vercel login
npx --yes vercel link
npx --yes vercel --prod
```

As variáveis usadas em produção devem estar configuradas no ambiente **Production** da
Vercel. Um deploy manual pelo CLI não configura a integração Git por si só.

## Melhorias recomendadas, em ordem

1. **Credenciais:** trocar as credenciais que já foram compartilhadas fora do painel e
   atualizar Vercel e `server/.env` com os novos valores.
2. **Fonte de deploy:** confirmar que o repositório e a branch corretos estão conectados
   ao projeto Vercel de produção, e revisar um Preview antes de integrar mudanças.
3. **Manutenção do frontend:** migrar gradualmente `script.js` para módulos ES e separar
   `style.css` por componentes. Faça um bloco por vez para facilitar revisão e rollback.
4. **Cobertura de interface:** criar testes de navegador para login, cadastro, upload,
   carrinho, pedido e chat, além dos testes de API que já existem.
5. **Fluxos de produto:** recuperação de senha, pagamento real, estoque e estados de
   pedido ainda precisam de definição e implementação antes de uso comercial completo.
6. **Operação:** documentar rotina de backup/restauração e revisar limites de rate limit,
   logs e políticas de Storage conforme o número de usuários crescer.

Não é necessário reescrever o site inteiro para continuar. A migração gradual reduz o
risco de quebrar funções que já estão em uso.
