# Roadmap de segurança e produção — AgriFam

Este documento distingue as proteções implementadas no repositório das tarefas que
dependem de configuração externa, revisão jurídica ou validação operacional. Uma caixa
marcada descreve o código, mas não substitui a configuração do serviço em produção.

## 1. Autenticação e sessões

- [x] Senhas armazenadas com bcrypt; cadastro e redefinição exigem pelo menos 8 caracteres.
- [x] Comparação de senha com hash fictício quando o email não existe, reduzindo diferenças de tempo no login.
- [x] JWT de acesso curto (15 minutos) e refresh token aleatório em cookie HttpOnly, com rotação e hash no banco.
- [x] Renovação verifica sessão ativa no banco; logout, troca/recuperação de senha revogam sessões antigas.
- [x] Recuperação usa token aleatório, de uso único, armazenado como hash e válido por 20 minutos.
- [x] Login Google validado no backend consultando Supabase Auth.
- [ ] Configurar `RESEND_API_KEY`, remetente verificado `AUTH_EMAIL_FROM` e `PUBLIC_APP_URL` na Vercel para habilitar recuperação em produção.
- [ ] Aplicar as migrações `0003_auth_sessions_and_password_resets.sql` e `0004_idempotent_checkout_and_payment_audit.sql` ao banco certo antes do deploy. Usuários terão de autenticar novamente depois da migração de sessões.
- [ ] Revisar as mensagens de recuperação e entrega de email em produção.

## 2. Autorização e propriedade dos dados

- [x] Middleware consulta a sessão e o papel atual no banco; não confia no papel dentro do JWT.
- [x] Rotas privadas usam autenticação e rotas de produtor verificam o papel no servidor.
- [x] Controllers de pedidos, conversas, produtos e perfil aplicam verificações de proprietário/participante.
- [x] Exclusão de conta exige a senha atual e limita a frequência.
- [ ] Fazer revisão manual de IDOR em ambiente de staging com duas contas de teste, sem dados reais.
- [ ] Se for criado painel administrativo, definir papéis explícitos, auditoria e MFA antes de disponibilizá-lo.

## 3. Segredos

- [x] `.env` e variações locais estão ignorados pelo Git; `.env.example` contém apenas marcadores.
- [x] Chaves privadas são usadas no backend e não estão no bundle do navegador.
- [ ] Confirmar no painel Vercel os valores de Production: `CORS_ORIGIN`, `PUBLIC_APP_URL`, Supabase, Mercado Pago, Upstash e Resend.
- [ ] Auditar histórico Git em um clone autenticado do repositório oficial. Este diretório não contém metadados Git utilizáveis, então não foi possível verificar commits antigos.
- [ ] Rotacionar qualquer segredo que tenha sido compartilhado em chats, prints, terminal gravado ou commits; não basta apagá-lo do arquivo atual.

## 4. Mercado Pago

- [x] OAuth usa `state` aleatório validado no callback.
- [x] Checkout calcula preço no backend, aceita chave de idempotência e impede repetição do mesmo pedido/carrinho.
- [x] Webhook valida assinatura antes da consulta à API e confere vendedor, valor, moeda e estado antes de atualizar pedido.
- [x] Eventos financeiros mínimos são registrados sem dados de cartão.
- [ ] Executar a migração `0004` antes de habilitar o novo fluxo em produção.
- [ ] Fazer testes de ponta a ponta em credenciais de teste e depois validar marketplace/split, KYC dos vendedores, comissão e reembolso no painel Mercado Pago.
- [ ] Não anunciar split real antes de confirmar habilitação e requisitos comerciais do Mercado Pago para a conta da AgriFam.

## 5. Uploads

- [x] Backend limita tamanho, valida magic bytes de JPEG/PNG/WebP e gera nomes aleatórios.
- [x] Rotas exigem autenticação e verificam o perfil de produtor onde necessário.
- [ ] Limitar dimensões e recomprimir imagens no servidor. Atualmente o limite de conteúdo está no backend, mas não há processamento de imagem com biblioteca dedicada.
- [ ] Confirmar políticas de acesso e CORS do bucket Supabase; documentos privados devem ficar em bucket separado e privado.

## 6. Validação e XSS

- [x] Endpoints usam schemas de validação no backend e consultas parametrizadas via Drizzle.
- [x] Frontend escapa texto dinâmico nas renderizações revisadas e limita URLs de imagem.
- [x] Erros ao cliente são genéricos; logs estruturados usam request ID e não registram tokens, senhas nem corpo da requisição.
- [ ] Revisar novos campos/rotas antes de cada lançamento e evitar inserir conteúdo externo em `innerHTML` sem escape.

## 7. Chat

- [x] Leitura e envio verificam participação na conversa no backend.
- [x] Envio de mensagens recebe rate limit compartilhado.
- [ ] Revisar exposição de identificadores e executar teste manual de acesso cruzado entre contas em staging.

## 8. Infraestrutura

- [x] Vercel encaminha tráfego via HTTPS; aplicação define CSP e headers contra MIME sniffing, framing e vazamento de referrer.
- [x] Cookies de autenticação usam HttpOnly, SameSite=Lax e Secure em produção.
- [x] Rate limit usa Redis compartilhado Upstash em produção e falha fechado se a configuração estiver ausente.
- [ ] Configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` em Production na Vercel e confirmar que o plano suporta o volume esperado.
- [ ] Conferir domínio exato em `CORS_ORIGIN` e fazer requisição real após cada deploy.
- [ ] Revisar a CSP com todos os serviços de imagem, login e pagamento usados no site; evitar enfraquecê-la com curingas sem necessidade.

## 9. Dependências e operação

- [x] Build de produção do backend compilou após as alterações desta rodada.
- [ ] Reexecutar testes financeiros e de autenticação em CI com banco de teste. O sandbox local pode bloquear sockets de teste HTTP; isso não prova que os testes falham no CI.
- [ ] Rodar `npm audit` em ambiente com acesso ao registry e avaliar cada atualização; não usar `--force` sem revisão de breaking changes.
- [ ] Configurar alertas de erro (por exemplo, Sentry) com scrub de dados pessoais e um uptime monitor externo.
- [ ] Configurar backup automático do Supabase e testar restauração periodicamente.
- [ ] Confirmar que logs da Vercel/Supabase têm retenção adequada e nenhum segredo.

## 10. Privacidade e obrigações legais

- [x] Exclusão de conta remove arquivos da conta, revoga sessões e anonimiza registros pessoais associados no banco.
- [ ] Pedidos e registros financeiros podem precisar ser retidos por obrigação legal; validar prazo e base legal com profissional antes de publicar a política.
- [ ] Política de privacidade, termos de uso, contato do controlador, finalidade/base legal e retenção ainda exigem dados reais do responsável e revisão jurídica. Não publicar texto genérico como documento final.
- [ ] Confirmar idade mínima e fluxo adequado para menores antes de abrir cadastro ao público.

## 11. Negócio e lançamento

- [ ] Validar CNPJ, tributação, contratos de parceria e responsabilidade da operação com contador/advogado.
- [ ] Fazer pentest independente antes de pagamentos reais ou lançamento comercial amplo.
- [ ] Testar login, logout, mudança de conta em múltiplas abas, recuperação, cadastro, uploads, chat, checkout, webhook, duplicidade e estorno em staging.
- [ ] Fazer revisão final de segurança e privacidade após configurar serviços externos; este roadmap não é certificado ou garantia de ausência de vulnerabilidades.

## Variáveis novas usadas pelo código

Configure na Vercel Production (e localmente apenas em `server/.env`):

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY
AUTH_EMAIL_FROM
PUBLIC_APP_URL
```

Nunca compartilhe valores desses segredos em mensagens ou screenshots. Consulte
[`server/.env.example`](../server/.env.example) para nomes e exemplos sem credenciais.
