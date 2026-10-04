# AgriFam

Plataforma de agricultura familiar para conectar produtores locais a clientes. O sistema reúne catálogo real, perfis de lojas, pedidos com Mercado Pago, autenticação, conversas e recursos de acessibilidade.

## Conteúdo

- [Recursos](#recursos)
- [Tecnologias](#tecnologias)
- [Executar localmente](#executar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Segurança](#segurança)
- [Rotas da API](#rotas-da-api)
- [Pagamentos](#pagamentos)
- [Publicar na Vercel](#publicar-na-vercel)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Manutenção](#manutenção)

## Recursos

- Catálogo e lojas com dados mantidos no PostgreSQL do Supabase.
- Cadastro e login por email, além de login com Google pelo Supabase Auth.
- Perfis de comprador e produtor, com autorização específica para cada ação.
- Cadastro, edição e remoção de produtos pelo painel do produtor. Remover desativa o produto e preserva o histórico de pedidos.
- Carrinho, favoritos e busca com filtros.
- Conversas privadas entre compradores e produtores, com atualização automática enquanto o chat está aberto.
- Checkout Mercado Pago Marketplace, divisão por loja e taxa configurável.
- Tema claro/escuro, painel de acessibilidade, VLibras e instalação como PWA.
- Mapa regional interativo com Leaflet e dados de mapas do OpenStreetMap.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | HTML, CSS e JavaScript |
| API | Node.js, Express 5 e TypeScript |
| Banco | PostgreSQL, Supabase e Drizzle ORM |
| Identidade | JWT em cookie `HttpOnly`; Supabase Auth para Google |
| Imagens | Supabase Storage |
| Pagamentos | Mercado Pago Checkout Pro Marketplace |
| Hospedagem | Vercel (site estático e uma função Express para a API) |

O navegador carrega `script.js`. `script.ts` é uma base tipada separada para uma migração gradual; não é carregado pela página hoje.

## Executar localmente

### Requisitos

- Node.js 20 ou superior.
- Um projeto Supabase com PostgreSQL e Storage.
- As credenciais locais descritas em [Variáveis de ambiente](#variáveis-de-ambiente).

### Preparar o banco

1. Copie `server/.env.example` para `server/.env` e preencha `DATABASE_URL`.
2. Para um banco novo, revise e execute `server/supabase-schema.sql` no SQL Editor do Supabase.
3. Para atualizar uma instalação existente, revise e aplique as migrações necessárias em `server/src/db/migrations-pg/`. Não execute o schema inicial por cima de tabelas existentes.

O servidor não altera o banco automaticamente ao iniciar. Isso mantém a aplicação longe de mudanças inesperadas em dados de produção.

### Iniciar a API e a interface

Terminal 1, na raiz do projeto:

```bash
npm ci --prefix server
npm run dev --prefix server
```

A API fica em `http://localhost:3333`.

Terminal 2, também na raiz:

```bash
python3 -m http.server 5173
```

Abra `http://localhost:5173`. Não abra `index.html` com `file://`, pois a sessão e as chamadas à API dependem de HTTP.

Para compilar o backend:

```bash
npm run build --prefix server
```

## Variáveis de ambiente

Os valores reais ficam em `server/.env` localmente e nas variáveis protegidas do projeto Vercel. Nunca coloque segredos em `index.html`, `script.js`, README, commits ou capturas de tela.

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | URI PostgreSQL do Supabase. A conexão do backend exige SSL. |
| `JWT_SECRET` | Segredo aleatório forte para assinar sessões. Use pelo menos 32 caracteres; prefira 48 bytes aleatórios ou mais. |
| `PORT` | Porta local da API; normalmente `3333`. |
| `CORS_ORIGIN` | Origem permitida para desenvolvimento separado. Em produção, use o domínio canônico HTTPS do site (`https://agri-fam2.vercel.app`). |
| `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` | Rate limit compartilhado entre instâncias serverless. Obrigatórias em produção; crie um banco Redis no Upstash e configure no ambiente Production da Vercel. |
| `RESEND_API_KEY` e `AUTH_EMAIL_FROM` | Envio de links temporários de redefinição de senha. O domínio do remetente precisa estar verificado no Resend. |
| `SUPABASE_URL` | URL do projeto Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública usada no fluxo de login Google. Não dá autorização administrativa à API. |
| `SUPABASE_SECRET_KEY` | Chave privada usada somente no servidor para gravar imagens. Nunca exponha no frontend. |
| `SUPABASE_STORAGE_BUCKET` | Bucket usado para fotos; normalmente `agrifam-images`. |
| `MP_CLIENT_ID` e `MP_CLIENT_SECRET` | Credenciais privadas da aplicação Marketplace. |
| `MP_REDIRECT_URI` | Callback OAuth cadastrada no Mercado Pago, terminada em `/api/pagamentos/mercadopago/callback`. |
| `MP_TOKEN_ENCRYPTION_KEY` | Chave exclusiva de 32 bytes para criptografar tokens Mercado Pago no banco. Preserve uma cópia segura. |
| `MP_WEBHOOK_SECRET` | Segredo para conferir a assinatura HMAC dos webhooks do Mercado Pago. |
| `MP_MARKETPLACE_FEE_PERCENT` | Comissão da plataforma; atualmente configurada em 3%. |
| `PUBLIC_APP_URL` | URL HTTPS canônica do site, usada em callbacks e retornos de pagamento. |

Gere segredos localmente; nunca reutilize os valores de exemplo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" # MP_TOKEN_ENCRYPTION_KEY
```

Se um segredo real for parar em um commit, log ou conversa, considere-o comprometido: revogue-o no provedor, gere outro e atualize o deploy. Apagar o texto depois não invalida uma credencial exposta.

## Segurança

### Proteções implementadas

- **Criptografia em trânsito:** a Vercel serve o site por HTTPS; HSTS é configurado nos cabeçalhos de produção. A conexão PostgreSQL usa SSL.
- **Sessão:** JWT de acesso com 15 minutos e refresh token rotativo, opaco, armazenado como hash no banco e entregue em cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção. JavaScript da página não consegue ler os tokens.
- **Autorização no backend:** rotas de produtor exigem sessão e função de produtor. Alterações de produto verificam também a propriedade do registro. Conversas e pedidos conferem a participação/dono no servidor.
- **Entradas:** corpos de API passam por schemas Zod ou validação explícita antes de alcançar as operações de banco e pagamento. Consultas usam Drizzle ORM.
- **Limites e tamanho:** login/cadastro, uploads, conexão de pagamento, checkout e mensagens têm limites compartilhados por Upstash em produção; o JSON da API tem limite de tamanho e imagens passam por validação de conteúdo real e tamanho.
- **Cabeçalhos:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e HSTS em produção.
- **Dados financeiros:** o backend recalcula valores a partir do catálogo. Webhooks são conferidos por HMAC e o pagamento é consultado no Mercado Pago antes de atualizar o pedido.
- **Segredos de pagamento:** tokens OAuth dos lojistas são armazenados com AES-256-GCM. A chave fica no ambiente do backend.
- **Erros:** a API retorna mensagens genéricas para falhas internas, sem enviar stack trace ao navegador.
- **Cache:** respostas da API recebem `Cache-Control: no-store`.

### Sobre criptografar rotas e esconder links

HTTPS/TLS criptografa a comunicação entre o navegador e o servidor. Não se deve criptografar nem tentar esconder caminhos como `/api/auth/me`: nomes de rota e páginas do frontend não são segredos e podem ser vistos nas ferramentas do navegador. A proteção real é validar identidade, função e propriedade em cada endpoint — isso é feito no backend. Os links de navegação não concedem acesso aos dados por si só.

### Operação segura

1. Mantenha `.env` fora do Git; `.gitignore` já ignora esses arquivos. Só `server/.env.example`, sem valores reais, deve ser compartilhado.
2. Mantenha `JWT_SECRET`, `MP_CLIENT_SECRET`, `MP_WEBHOOK_SECRET`, `MP_TOKEN_ENCRYPTION_KEY` e `SUPABASE_SECRET_KEY` como variáveis privadas do servidor.
3. Não registre tokens, senhas, cookies, chaves ou conteúdo pessoal em logs. Os logs de produção devem conter apenas o necessário para diagnóstico.
4. Proteja a conta Vercel, Supabase, Mercado Pago e GitHub com senhas exclusivas e autenticação em dois fatores.
5. Revise mudanças de banco e dependências antes de aplicar em produção. Faça backup do banco antes de migrações.

### Configuração obrigatória antes de produção

- Configure Redis compartilhado Upstash; as rotas limitadas respondem `503` em produção se as variáveis estiverem ausentes ou o Redis estiver indisponível.
- Configure Resend e um remetente verificado para a recuperação de senha.
- Aplique e revise as migrações PostgreSQL `0003_auth_sessions_and_password_resets.sql` e `0004_idempotent_checkout_and_payment_audit.sql` no banco de destino antes do deploy. A aplicação não as executa ao iniciar.
- Faça testes ponta a ponta de login, recuperação, pagamentos e exclusão em staging e configure backup/monitoramento fora do código.

Veja o [Roadmap de Segurança e Produção](docs/ROADMAP_SEGURANCA.md) para separar o que está no código do que ainda requer configuração externa, revisão jurídica ou validação manual. Nenhuma checklist garante ausência de vulnerabilidades.

## Rotas da API

Os caminhos são públicos no sentido de que o navegador consegue solicitá-los; isso é esperado. As respostas e alterações protegidas dependem das verificações do servidor.

| Método e caminho | Acesso | Finalidade |
| --- | --- | --- |
| `GET /api/health` | Público | Verificar disponibilidade da API. |
| `POST /api/auth/register`, `POST /api/auth` | Público + limite de tentativas | Criar conta e entrar. |
| `POST /api/auth/logout` | Sessão/cookie | Encerrar a sessão. |
| `GET /api/auth/me`, `PATCH /api/auth/me` | Sessão | Consultar ou atualizar o perfil próprio. |
| `GET /api/auth/google/config`, `GET /api/auth/google`, `POST /api/auth/google/callback` | Público + validação Supabase | Configurar e concluir login Google. |
| `GET /api/produtos`, `GET /api/produtos/:id`, `GET /api/produtores`, `GET /api/produtores/:id`, `GET /api/categorias` | Público | Consultar catálogo ativo. |
| `POST /api/produtos`, `PATCH /api/produtos/:id`, `DELETE /api/produtos/:id` | Produtor; alterações verificam dono | Gerenciar produtos próprios. DELETE desativa e preserva histórico. |
| `GET /api/produtor/produtos`, `GET /api/produtor/pedidos` | Produtor | Consultar produtos e pedidos da própria loja. |
| `GET /api/pedidos`, `GET /api/pedidos/:id` | Sessão; pedidos próprios | Consultar histórico de compras. |
| `GET/POST /api/conversas`, `GET/POST /api/conversas/:id/mensagens` | Sessão; participante da conversa | Criar conversas e ler/enviar mensagens. |
| `POST /api/perfil/imagem` | Sessão + limite de upload | Enviar a própria foto. |
| `POST /api/produtor/imagens` | Produtor + limite de upload | Enviar imagem de loja ou produto. |
| `POST /api/pagamentos/checkout` | Sessão + limite de tentativas | Criar checkout calculado pelo backend. |
| `GET /api/pagamentos/mercadopago/conectar`, `GET /api/pagamentos/mercadopago/status` | Produtor | Conectar e consultar a própria conta de recebimento. |
| `GET /api/pagamentos/mercadopago/callback` | OAuth com estado assinado e cookie | Finalizar conexão Mercado Pago. |
| `POST /api/pagamentos/mercadopago/webhook` | Assinatura HMAC válida | Receber atualização autenticada do pagamento. |

## Pagamentos

O checkout usa Mercado Pago Checkout Pro Marketplace. O carrinho finaliza uma loja por vez. O servidor calcula preços e taxa a partir do banco, registra o pedido como pendente e só marca o pagamento conforme o webhook assinado e a consulta ao Mercado Pago confirmarem o resultado.

Cada produtor precisa conectar a própria conta pelo painel de perfil. Sem essa conexão, o checkout é recusado e o comprador recebe uma notificação. Configure as URLs de callback e webhook no painel Mercado Pago e use credenciais de teste antes de habilitar as de produção.

## Publicar na Vercel

1. Vincule o repositório GitHub ao projeto Vercel e use a raiz deste repositório como **Root Directory**.
2. Cadastre as variáveis da tabela acima nos ambientes Vercel necessários. Não cole valores secretos em comandos compartilhados ou capturas de tela; use o prompt da CLI ou o painel protegido.
3. Confira `PUBLIC_APP_URL`, `CORS_ORIGIN` e `MP_REDIRECT_URI` para o domínio canônico HTTPS; configure também Redis e email.
4. Revise as migrações PostgreSQL pendentes e aplique-as ao banco correto com backup feito. Não rode migrações às cegas em produção.
5. Faça o deploy e confira `GET /api/health`, autenticação e logs da função.

Deploy pelo terminal:

```bash
npx --yes vercel login
npx --yes vercel link
npx --yes vercel --prod
```

O `vercel.json` compila `server/` e reescreve `/api/*` para `api/index.ts`, que inicializa a aplicação Express em `api/_app.ts`.

## Estrutura do projeto

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura, navegação, formulários, modais e regiões acessíveis. |
| `style.css` | Tokens visuais, componentes, estados, temas e responsividade. |
| `script.js` | Comportamento do navegador, chamadas de API e renderização. |
| `region-map.js` | Mapa regional Leaflet. |
| `types.ts` | Tipos compartilhados do frontend. |
| `api/index.ts`, `api/_app.ts` | Ponto de entrada serverless e criação da API. |
| `server/src/app.ts` | Middleware HTTP, cabeçalhos, CORS e montagem das rotas. |
| `server/src/routes/` | Métodos HTTP e autenticação exigida em cada rota. |
| `server/src/controllers/` | Regras de negócio e acesso a dados. |
| `server/src/middlewares/` | Sessão, autorização, limitação de tentativas e erros. |
| `server/src/schemas/` | Schemas para validar entradas. |
| `server/src/db/schema.ts` | Modelo Drizzle do banco. |
| `server/src/db/migrations-pg/` | Migrações PostgreSQL. |
| `server/supabase-schema.sql` | Estrutura inicial do banco. |
| `server/.env.example` | Nomes e formato das variáveis, sem segredos reais. |
| `docs/MANUTENCAO.md` | Guia complementar para localizar e alterar funcionalidades. |
| `docs/ROADMAP_SEGURANCA.md` | Estado das proteções, pendências externas e verificações para lançamento. |
| `asset/` | Imagens e identidade visual local. |

## Manutenção

- Ao adicionar uma rota, valide a entrada no backend e escolha explicitamente se exige `requireAuth`, `requireRole` e verificação de propriedade/participação.
- Não confie em IDs, preços, função do usuário ou permissões enviados pelo frontend. Releia os dados necessários do banco na API.
- Ao inserir dados dinâmicos no HTML, escape texto e valide URLs de imagem. Não use `innerHTML` com texto fornecido pelo usuário sem sanitização.
- Ao mudar tabelas, crie/revise uma migração PostgreSQL e faça backup antes de aplicar em produção.
- Depois de mudar arquivos do app shell, atualize a versão do cache em `service-worker.js` para os navegadores buscarem os arquivos novos.
- Antes de publicar, revise `git diff`, confirme que `.env` não está incluído e compile o backend:

```bash
npm run check
npm run build --prefix server
```
