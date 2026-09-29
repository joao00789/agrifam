# AgriFam

Site da AgriFam, uma plataforma para aproximar consumidores da agricultura familiar.

## Ver esta versão no GitHub

Esta atualização está publicada na branch [`melhorias-agrifam`](https://github.com/joao00789/agrifam/tree/melhorias-agrifam). Para comparar com a `main` ou abrir um pull request, acesse [comparar e criar pull request](https://github.com/joao00789/agrifam/pull/new/melhorias-agrifam). A `main` não foi alterada.

No GitHub, também é possível abrir **Branches**, selecionar `melhorias-agrifam` e navegar pelos arquivos. Os arquivos `.env` com credenciais reais não fazem parte desta branch.

> **Dados de demonstração:** `server/src/db/seed.ts` contém registros de exemplo para
> desenvolvimento. O seed é manual; nunca o execute em um banco com dados reais sem
> antes revisar os registros que serão inseridos.

Para saber onde editar cada parte, veja o [Guia de manutenção](docs/MANUTENCAO.md).

## Stack do frontend

- **HTML5**: estrutura semântica, acessibilidade básica e pontos de montagem do conteúdo.
- **CSS3**: layout, tokens visuais, responsividade, estados e animações.
- **JavaScript**: comportamento da página, integração com a API do backend e interações.
- **TypeScript**: contratos de dados e base para a migração gradual do JavaScript.
- **Swiper 11**: carrossel principal do hero.
- **DM Sans** e **Nunito Sans**: tipografia carregada pelo Google Fonts.

O navegador usa `script.js` diretamente. O `script.ts` ainda é uma base tipada separada e não é carregado pelo `index.html`.

## Recursos externos

Os recursos externos usados atualmente estão concentrados no `index.html` e nas URLs dos dados de `script.js`:

| Recurso | Local de uso | Origem |
| --- | --- | --- |
| DM Sans e Nunito Sans | Títulos, textos e controles | [Google Fonts](https://fonts.google.com/) carregado no `<head>` |
| Swiper 11 | Carrossel `.hero` | [jsDelivr](https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js) |
| Leaflet 1.9.4 | Mapa regional interativo | [unpkg](https://unpkg.com/leaflet@1.9.4/) |
| Mosaicos cartográficos | Ruas e referências geográficas do mapa | [OpenStreetMap](https://www.openstreetmap.org/copyright) |
| Imagens de produtos e produtores | Cards do catálogo e produtores | [Unsplash](https://unsplash.com/) por URL em `script.js` |
| Shader do hero | Canvas `#heroShader` | Pacote `gradient-gl@2.0.5` via [unpkg](https://unpkg.com/gradient-gl@2.0.5) |
| Busca por voz | Botões `.voice-search` | API nativa `SpeechRecognition`/`webkitSpeechRecognition` do navegador |

As imagens externas dependem de conexão com a internet. Para produção, prefira baixar os arquivos aprovados e colocá-los em `asset/imagens/`.

## Assets locais

Os arquivos visuais ficam em `asset/`:

### Ícones PNG

| Arquivo | Uso no frontend |
| --- | --- |
| `asset/icons/lupa.png` | Ícone dos campos de busca desktop e mobile |
| `asset/icons/carrinho.png` | Botão do carrinho no cabeçalho |
| `asset/icons/menu hamburger open.png` | Menu mobile fechado |
| `asset/icons/menu hamburger close.png` | Menu mobile aberto |
| `asset/icons/seta esquerda.png` | Navegação anterior do carrossel |
| `asset/icons/seta direita.png` | Navegação seguinte do carrossel |

### Imagens locais

| Arquivo | Uso no frontend |
| --- | --- |
| `asset/imagens/logo 2.png` | Logo do cabeçalho e rodapé |
| `asset/imagens/fundo 1.jpg` | Primeiro slide do hero |
| `asset/imagens/fundo 2.jpg` | Segundo slide do hero |
| `asset/imagens/fundo 3.jpg` | Terceiro slide do hero |
| `asset/imagens/print.png` | Imagem auxiliar disponível no projeto |

### SVGs e mapa

Não há biblioteca de ícones instalada. Os demais ícones são SVGs inline:

- Ícones de navegação, favoritos, microfone, filtros, redes sociais e treinamento ficam diretamente no `index.html`.
- Ícones das categorias ficam no objeto `categoryIcons` de `script.js` e são inseridos na renderização da categoria.
- Ícones de estado vazio e elementos pequenos também podem ser SVG inline.

O mapa de cidades usa Leaflet: o HTML fica em `index.html`, a aparência em `style.css` e os locais e eventos em `region-map.js`. Os marcadores representam referências aproximadas dos centros municipais, não endereços de produtores. Os botões levam o mapa a Jardim do Mulato, Angical do Piauí, Regeneração, Santo Antônio dos Milagres, São Gonçalo do Piauí e Hugo Napoleão. Os dados de ruas vêm dos tiles do OpenStreetMap, portanto o navegador precisa de internet para carregá-los.

Para adicionar um ícone pequeno de interface, prefira reutilizar um SVG inline existente. Para uma imagem que precisa ser trocada pela equipe, use `asset/icons/` e referencie o caminho com `src="asset/icons/nome-do-arquivo.png"`.

## Onde encontrar cada parte

### Estrutura da página: `index.html`

| Parte | Localizador principal | Responsabilidade |
| --- | --- | --- |
| Aviso superior | `.announcement` | Mensagem institucional no topo |
| Cabeçalho desktop/mobile | `#topo`, `.site-header` | Logo, busca, navegação e ações |
| Menu mobile | `#mobileMenu`, `#menuToggle` | Navegação responsiva |
| Hero/carrossel | `.hero`, `.hero-one`, `.hero-two`, `.hero-three` | Destaques principais |
| Categorias | `#categorias`, `#categoryList` | Categorias renderizadas pelo JavaScript |
| Produtos e filtros | `#produtos`, `#productGrid`, `#filters` | Catálogo, busca, ordenação e filtros |
| Como funciona | `#como-funciona` | Etapas de compra local |
| Produtores | `#produtores`, `#producerGrid` | Cards e perfis dos produtores |
| Educação | `#educacao`, `#capacitacao` | Conteúdo institucional e treinamentos |
| Localização | `.location-section`, `#regionMap` | Mapa regional interativo e indicadores da plataforma |
| CTA do produtor | `#seja-produtor` | Chamada para cadastro de produtores |
| Rodapé | `#sobre`, `.site-footer` | Links institucionais e redes sociais |
| Carrinho | `#cartDrawer`, `#cartItems` | Drawer do carrinho e total |
| Chat | `#chatDrawer`, `#chatMessages` | Conversas entre cliente e produtor |
| Modais | `#producerModal`, `#authModal`, `#trainingModal` | Perfis, login e capacitação |

### Comportamento: `script.js`

O frontend busca catálogo, autenticação e conversas da API (`server/`) pela função
`api()` no topo do arquivo. O `server/src/db/seed.ts` serve apenas para popular um banco
de desenvolvimento vazio com dados de exemplo.

| Bloco | O que editar |
| --- | --- |
| `api()` e `API_BASE` | Chamada HTTP central (cookies inclusos) e URL base do backend |
| `categoryIcons` | SVGs usados nos botões de categoria (só isso continua fixo no frontend) |
| `$` e `$$` | Atalhos para `querySelector` e `querySelectorAll` |
| `loadProducts()`, `renderProducts()`, `productCard()` | Busca (com filtros via query string), estrutura e conteúdo dos cards de produto |
| `loadProducers()`, `renderProducers()`, `producerCard()` | Grid de produtores e conteúdo do modal de perfil |
| `renderCart()`, `saveCart()`, `saveFavorites()` | Carrinho e favoritos — **continuam no `localStorage`** (funcionam sem login; só o checkout exige sessão) |
| `openAuthModal()`, `setAuthMode()`, `loadSession()` | Login, cadastro (com perfil de produtor) e sessão atual |
| `loadConversations()`, `selectConversation()`, `renderMessages()` | Chat: lista de conversas e histórico de mensagens |
| `openModal()` e `closeModals()` | Abertura e fechamento dos modais |

Os elementos são encontrados principalmente por `id`, por exemplo `$("#productGrid")`, por classe, por exemplo `$(".search-wrap input")`, e por atributos `data-*`, por exemplo `[data-cart]` e `[data-producer]`. Ao criar um novo componente interativo, adicione um seletor estável no HTML e conecte o evento no bloco correspondente do `script.js`.

## Integração com o backend

As principais operações do frontend usam o backend em `server/`. Algumas preferências,
como carrinho e favoritos, continuam locais ao navegador; o checkout não processa
pagamentos reais.

### O que ainda é só do navegador (por design, não é mock temporário)

- **Carrinho** (`agrifam-cart`) e **favoritos** (`agrifam-favorites`) continuam no `localStorage`, disponíveis no botão do coração no cabeçalho (e no menu mobile). As listas são específicas deste navegador.
- Perfil pessoal, troca de senha com a senha atual, perfil da loja, catálogo e pedidos usam a API e o banco.

### O que rodar para desenvolver localmente

1. Na primeira execução, copie `server/.env.example` para `server/.env` e preencha as variáveis da seção [Configuração local e Supabase](#configuração-local-e-supabase). Nunca copie credenciais reais para o README.
2. Prepare o banco usando **um** método: execute `server/supabase-schema.sql` no SQL Editor do Supabase, ou configure `DATABASE_URL` e rode as migrações PostgreSQL com `npm run db:migrate` dentro de `server/` (usa `server/src/db/migrations-pg/`). Não aplique os dois métodos sobre as mesmas tabelas. O servidor não cria nem altera tabelas automaticamente ao iniciar.
3. Inicie o backend em um terminal:

   ```bash
   cd server
   npm ci
   npm run dev
   ```

   A API fica em `http://localhost:3333`.

4. Em outro terminal, na raiz do projeto, sirva a página por HTTP — não abra `index.html` como `file://`:

   ```bash
   python3 -m http.server 5173
   ```

   Abra `http://localhost:5173`.

5. Para login Google, configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no `server/.env`. No Supabase, ative o provedor Google e informe o Client ID/Secret do Google. Cadastre no Google Cloud a callback informada pelo Supabase e permita as URLs local e de produção em **Authentication → URL Configuration**.
6. Para upload de imagens, configure `SUPABASE_SECRET_KEY` apenas no backend e crie o bucket público `agrifam-images` (ou informe outro nome em `SUPABASE_STORAGE_BUCKET`). Nunca exponha a secret key no frontend.
7. Localmente, `script.js` envia chamadas para a API em `:3333`. Se frontend e backend estiverem em domínios diferentes, configure `window.AGRIFAM_API_BASE` e `CORS_ORIGIN` com os endereços corretos.

### Configuração local e Supabase

Copie `server/.env.example` para `server/.env` e substitua os exemplos. O `.env` real é ignorado pelo Git.

| Variável | Onde obter/usar | Observação |
| --- | --- | --- |
| `DATABASE_URL` | Supabase → **Connect** → PostgreSQL | URI de conexão; configure TLS (`sslmode=require`) e faça URL-encoding de caracteres especiais na senha. |
| `JWT_SECRET` | Gere localmente com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` | O backend exige pelo menos 32 caracteres. Mantenha o mesmo valor nos ambientes que compartilham sessões. |
| `PORT` | Definido localmente | Padrão `3333`; a Vercel define sua própria porta. |
| `CORS_ORIGIN` | URL do frontend | Local: `http://localhost:5173`. Em hospedagem, use o domínio real do site. |
| `SUPABASE_URL` | Supabase → **Project Settings → API** | URL do projeto usada no OAuth e Storage. |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase → **Project Settings → API** | Chave pública usada para iniciar a autenticação; não substitui autorização no backend. |
| `SUPABASE_SECRET_KEY` | Supabase → **Project Settings → API** | Somente backend. Nunca publicar em frontend, README ou Git. |
| `SUPABASE_STORAGE_BUCKET` | Nome do bucket de imagens | Padrão `agrifam-images`; o backend precisa de permissão de escrita e o bucket é público para exibir imagens. |

Para criar as tabelas, revise e execute `server/supabase-schema.sql` no SQL Editor do projeto Supabase correto. Não rode seed de demonstração em banco com usuários ou produtos reais.

### Configurar login Google

1. No Supabase, abra **Authentication → Sign In / Providers → Google** e habilite o provedor.
2. Configure o Client ID e o Client Secret do OAuth do Google Cloud no provedor Google do Supabase. Use como callback a URL informada pelo Supabase nessa tela.
3. No Supabase, abra **Authentication → URL Configuration** e adicione a URL local e a URL pública do AgriFam à lista de redirecionamentos permitidos.
4. Configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no backend. O Client Secret do Google fica no Supabase; não o coloque no frontend.

### Configurar imagens de perfil

Crie no Supabase Storage o bucket indicado por `SUPABASE_STORAGE_BUCKET` (padrão `agrifam-images`) e mantenha `SUPABASE_SECRET_KEY` apenas no backend. A rota `POST /api/perfil/imagem` valida autenticação, tipo e tamanho do arquivo antes do upload. Se houver erro `Invalid Compact JWS` ou `Unauthorized`, confira se a secret key é do projeto correto, sem espaços ou quebras; depois atualize a variável no deploy e publique novamente.

## Publicar na Vercel

O `vercel.json` configura o build do backend e encaminha `/api/*` para uma única função em `api/index.ts`. Essa estrutura evita criar uma função serverless separada por endpoint. A raiz do projeto deve ser o **Root Directory** da Vercel.

1. Importe o repositório `joao00789/agrifam` no painel da Vercel ou conecte um projeto Vercel existente ao repositório.
2. Confirme o **Root Directory** como `.` (raiz do repositório) e deixe o build ser definido pelo `vercel.json`.
3. Em **Settings → Environment Variables**, cadastre para **Production**: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `SUPABASE_STORAGE_BUCKET`. Use valores do mesmo projeto Supabase; não reutilize os exemplos deste README.
4. Faça um novo deploy após alterar variáveis. Para publicar pelo terminal, entre na raiz do projeto, faça `npx --yes vercel login`, vincule o projeto correto com `npx --yes vercel link` e rode `npx --yes vercel --prod`.

O deploy automático por Git depende de o projeto Vercel estar conectado ao repositório e da branch de produção estar configurada. Publicar uma branch de revisão não altera automaticamente o site de produção.

### Responsabilidade de cada lado

**Frontend:** exibir dados, validar campos básicos, controlar estados visuais, enviar requisições e mostrar mensagens de sucesso ou erro.

**Backend:** autenticar usuários, validar todos os dados novamente, autorizar acesso, calcular preços, persistir pedidos e conversas, e proteger segredos.

O frontend nunca contém senha, token privado ou regra de preço considerada confiável — `POST /api/pedidos` sempre recalcula o preço a partir do produto no banco, ignorando o que vier do cliente.

### Painel do produtor ("Meus produtos")

Um produtor autenticado tem acesso a um painel para cadastrar, editar e remover seus
próprios produtos, sem precisar chamar a API diretamente. No cabeçalho, o botão "Vender
no AgriFam" vira **"Meus produtos"** assim que o usuário logado tem `role: "producer"`
(ver `updateAuthUI()` em `script.js`) e abre o modal `#myProductsModal`.

- O formulário cadastra (`POST /api/produtos`) ou atualiza (`PATCH /api/produtos/:id`,
  ao clicar em "Editar" num item da lista) um produto.
- "Remover" chama `DELETE /api/produtos/:id` (com uma confirmação nativa do navegador).
- A lista vem de `GET /api/produtor/produtos` — um endpoint que não existia antes desta
  tela: os outros endpoints de produto não filtram por dono, e sem ele o frontend não
  tinha como saber com segurança quais produtos são do produtor logado (o campo
  `producer` da resposta é só o nome da propriedade, que não é garantido único no
  banco).
- Depois de qualquer criação/edição/remoção, o catálogo público e as categorias são
  recarregados (`refreshCatalogAfterChange()`), para preço e contagem não ficarem
  desatualizados no resto do site.

## API do backend

O backend em `server/` usa Node.js, Express, TypeScript, Drizzle e PostgreSQL no Supabase.
As rotas organizam autenticação, catálogo, pedidos, uploads e conversas.

Configure `server/.env` usando `server/.env.example` e a URI PostgreSQL em Supabase >
Connect. Rode `cd server && npm ci && npm run dev`; a API sobe em
`http://localhost:3333` e usa o schema PostgreSQL preparado em `server/supabase-schema.sql`.
O servidor não aplica migrations nem insere seed ao iniciar, para não alterar seu banco
remoto automaticamente. `npm run db:seed` é uma ação manual e só deve ser executada
quando você realmente quiser os dados de demonstração.

### Autenticação

| Rota | Método | Corpo (JSON) | Resposta em caso de sucesso |
| --- | --- | --- | --- |
| `/api/auth/register` | POST | `{ "name", "email", "password", "role": "buyer" \| "producer" }` — se `role` for `"producer"`, exige também `{ "property", "location", "specialty" }` (`"history"`/`"image"` opcionais) | `201` + `{ "user": { id, name, email, role } }`, define cookie de sessão |
| `/api/auth` | POST | `{ "email", "password" }` | `200` + `{ "user": {...} }`, define cookie de sessão |
| `/api/auth/logout` | POST | — | `200` + `{ "ok": true }`, limpa o cookie |
| `/api/auth/me` | GET | — (usa o cookie de sessão) | `200` + `{ "user": {...} }`, ou `401` se não autenticado |
| `/api/auth/me` | PATCH | Campos permitidos do perfil | `200` + usuário atualizado; exige sessão |
| `/api/auth/google/config` | GET | — | Informa se Supabase Google OAuth está configurado |
| `/api/auth/google` | GET | — | Inicia o login Google via Supabase |
| `/api/auth/google/callback` | POST | Token retornado pelo fluxo Google | Valida o usuário e cria cookie de sessão local |

A sessão é um JWT em cookie `httpOnly` (`agrifam_token`), válido por 7 dias.

### Catálogo

| Rota | Método | Corpo/Query | Resposta em caso de sucesso |
| --- | --- | --- | --- |
| `/api/produtos` | GET | Query: `search`, `category`, `sort` (`featured`\|`price-low`\|`rating`) | `200` + `Product[]` (mesmo formato de [types.ts](types.ts)) |
| `/api/produtos/:id` | GET | — | `200` + `Product`, ou `404` |
| `/api/produtos` | POST | `{ "name", "price", "unit", "location", "category", "image"?, "rating"? }` — precisa de sessão com `role: "producer"` | `201` + `Product` |
| `/api/produtos/:id` | PATCH | Qualquer subconjunto dos campos acima — só o produtor dono do produto pode alterar | `200` + `Product`, ou `403` se não for o dono |
| `/api/produtos/:id` | DELETE | — só o produtor dono do produto pode remover | `200` + `{ "ok": true }`, ou `403` se não for o dono |
| `/api/produtor/produtos` | GET | — precisa de sessão com `role: "producer"` | `200` + `Product[]`, só os produtos do produtor autenticado (usado pelo painel "Meus produtos") |
| `/api/produtores` | GET | — | `200` + `Producer[]` |
| `/api/produtores/:id` | GET | — | `200` + `Producer`, ou `404` |
| `/api/categorias` | GET | — | `200` + `{ id, name, icon, count }[]` — `count` é calculado a partir dos produtos reais, não é um valor fixo |

### Pedidos

Pedidos são **simulados nesta fase**: não há gateway de pagamento integrado ainda, todo
pedido nasce com `status: "confirmado"`. Qualquer usuário autenticado pode comprar
(comprador ou produtor). O preço de cada item é sempre recalculado a partir do produto
no banco — o backend ignora qualquer preço enviado pelo cliente no corpo da requisição.

| Rota | Método | Corpo (JSON) | Resposta em caso de sucesso |
| --- | --- | --- | --- |
| `/api/pedidos` | POST | `{ "items": [{ "productId", "quantity" }] }` (ver `CreateOrderInput` em [types.ts](types.ts)) | `201` + `Order` (ver `Order`/`OrderItem` em types.ts) |
| `/api/pedidos` | GET | — | `200` + `Order[]`, só os pedidos do usuário autenticado |
| `/api/pedidos/:id` | GET | — | `200` + `Order`, ou `403` se o pedido não for do usuário autenticado |
| `/api/produtor/pedidos` | GET | — precisa de sessão com `role: "producer"` | `200` + lista de itens de pedido que incluem produtos do produtor autenticado (com `buyerName`, `productName`, `quantity`, `subtotal`, etc.) |

### Conversas

Uma conversa é sempre entre um comprador e um produtor (identificado pelo `producerId`
de `GET /api/produtores`); existe no máximo uma conversa por par comprador-produtor —
iniciar de novo com o mesmo produtor devolve a conversa já existente em vez de duplicar.

| Rota | Método | Corpo (JSON) | Resposta em caso de sucesso |
| --- | --- | --- | --- |
| `/api/conversas` | GET | — | `200` + `ConversationSummary[]` (conversas em que o usuário autenticado participa, como comprador ou como produtor) |
| `/api/conversas` | POST | `{ "producerId" }` | `201` + conversa nova, ou `200` + conversa já existente entre esse par |
| `/api/conversas/:id/mensagens` | GET | — só participantes da conversa | `200` + `Message[]`, em ordem cronológica |
| `/api/conversas/:id/mensagens` | POST | `{ "text" }` (1 a 2000 caracteres) | `201` + `Message` |

Erros seguem sempre o formato `{ "error": "mensagem" }`, com os códigos HTTP `400`
(dados inválidos, categoria/produto inexistente, produtor iniciando conversa consigo
mesmo), `401` (sem sessão), `403` (perfil/dono errado, ou não participa da conversa) e
`409` (email já cadastrado no registro).

### Upload de imagens

| Rota | Método | Corpo | Resposta |
| --- | --- | --- | --- |
| `/api/perfil/imagem` | POST | `{ "dataUrl": "data:image/...;base64,..." }` | `201` + `{ "image": "URL pública" }`; exige sessão |
| `/api/produtor/imagens` | POST | `{ "dataUrl": "data:image/...;base64,...", "kind": "store" ou "products" }` | `201` + `{ "image": "URL pública" }`; exige perfil de produtor |

São aceitos PNG, JPG e WebP até 3 MB. O backend envia a imagem ao Supabase Storage e devolve uma URL pública. A chave `SUPABASE_SECRET_KEY` fica somente no servidor.

## Organização dos arquivos

- `index.html`: estrutura semântica, navegação, seções, modais e pontos de montagem dinâmicos.
- `style.css`: tokens visuais, componentes, estados de interação, mapa, conversas e responsividade. As seções estão numeradas no início do arquivo.
- `script.js`: comportamento executado no navegador: busca, filtros, carrinho, chat, modais e carrossel.
- `region-map.js`: inicializa o Leaflet, posiciona referências municipais e conecta os botões do mapa.
- `script.ts`: base tipada para a migração gradual do comportamento para TypeScript.
- `types.ts`: contratos compartilhados de categorias, produtos, produtores, carrinho e filtros.
- `api/index.ts` e `api/_app.ts`: função serverless única da Vercel e inicialização do Express.
- `vercel.json`: build, arquivos estáticos e reescrita das rotas `/api/*`.
- `asset/`: imagens e ícones locais usados pela interface.
- `server/`: backend (Node.js + Express + TypeScript), com o próprio `package.json`,
  testes (`src/tests`), validações (`src/schemas`), migrações PostgreSQL (`src/db/migrations-pg`) e SQL inicial (`supabase-schema.sql`).
- `docs/MANUTENCAO.md`: mapa do código, orientações para mudanças comuns e melhorias pendentes.

## Desenvolvimento

Instale as dependências, compile o backend e execute os testes de API:

```bash
npm install
npm run check
npm ci --prefix server
npm run build --prefix server
npm test --prefix server
```

## Tipografia e estilos

- **DM Sans**: títulos e elementos de destaque.
- **Nunito Sans**: textos, navegação e controles.

As fontes são carregadas no `<head>` de `index.html` e expostas pelos tokens `--display` e `--sans` no `style.css`.

Os principais tokens visuais ficam no bloco `:root` de `style.css`: `--green`, `--green-dark`, `--ink`, `--muted`, `--cream`, `--line`, `--white`, `--display`, `--sans` e `--shadow`.

## Antes de enviar alterações

1. Execute `npm run check` para verificar os contratos TypeScript.
2. Execute `npx prettier --write index.html style.css script.js script.ts types.ts tsconfig.json` depois de editar os arquivos.
3. Confira `git diff --check` para detectar problemas de espaços e formatação.

## Próximos passos

- Recuperação de senha (hoje o link só avisa que ainda não está disponível).
- Gateway de pagamento real e regras de estoque (o checkout ainda não cobra pagamentos).
- Integração contínua com o repositório GitHub oficial e cobertura de testes de interface.
- Rotina documentada de backup e restauração do banco.

Veja prioridades e orientações no [Guia de manutenção](docs/MANUTENCAO.md).
