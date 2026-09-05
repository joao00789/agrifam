# AgriFam

Site da AgriFam, uma plataforma para aproximar consumidores da agricultura familiar.

## Stack do frontend

- **HTML5**: estrutura semântica, acessibilidade básica e pontos de montagem do conteúdo.
- **CSS3**: layout, tokens visuais, responsividade, estados e animações.
- **JavaScript**: comportamento da página, renderização dos dados demonstrativos e interações.
- **TypeScript**: contratos de dados e base para a migração gradual do JavaScript.
- **Swiper 11**: carrossel principal do hero.
- **Poppins** e **Nunito Sans**: tipografia carregada pelo Google Fonts.

O navegador usa `script.js` diretamente. O `script.ts` ainda é uma base tipada separada e não é carregado pelo `index.html`.

## Recursos externos

Os recursos externos usados atualmente estão concentrados no `index.html` e nas URLs dos dados de `script.js`:

| Recurso | Local de uso | Origem |
| --- | --- | --- |
| Poppins e Nunito Sans | Títulos, textos e controles | [Google Fonts](https://fonts.google.com/) carregado no `<head>` |
| Swiper 11 | Carrossel `.hero` | [jsDelivr](https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js) |
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

### SVGs

Não há biblioteca de ícones instalada. Os demais ícones são SVGs inline:

- Ícones de navegação, favoritos, microfone, filtros, redes sociais e treinamento ficam diretamente no `index.html`.
- Ícones das categorias ficam no objeto `categoryIcons` de `script.js` e são inseridos na renderização da categoria.
- O mapa ilustrativo do Piauí também é um SVG inline em `index.html`.

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
| Localização | `.location-section`, `.piaui-map` | Mapa e indicadores da plataforma |
| CTA do produtor | `#seja-produtor` | Chamada para cadastro de produtores |
| Rodapé | `#sobre`, `.site-footer` | Links institucionais e redes sociais |
| Carrinho | `#cartDrawer`, `#cartItems` | Drawer do carrinho e total |
| Chat | `#chatDrawer`, `#chatMessages` | Conversas entre cliente e produtor |
| Modais | `#producerModal`, `#authModal`, `#trainingModal` | Perfis, login e capacitação |

### Comportamento: `script.js`

| Bloco | O que editar |
| --- | --- |
| `categories`, `products`, `producers` | Dados demonstrativos até a API existir |
| `categoryIcons` | SVGs usados nos botões de categoria |
| `chatContacts` | Conversas demonstrativas do chat |
| `$` e `$$` | Atalhos para `querySelector` e `querySelectorAll` |
| `renderProducts()` e `productCard()` | Estrutura e conteúdo dos cards de produto |
| `filterProducts()` | Busca, categoria e ordenação |
| `renderCart()` e `saveState()` | Carrinho e persistência em `localStorage` |
| `renderChat()` | Lista de contatos e mensagens |
| `openModal()` e `closeModals()` | Abertura e fechamento dos modais |

Os elementos são encontrados principalmente por `id`, por exemplo `$("#productGrid")`, por classe, por exemplo `$(".search-wrap input")`, e por atributos `data-*`, por exemplo `[data-cart]` e `[data-producer]`. Ao criar um novo componente interativo, adicione um seletor estável no HTML e conecte o evento no bloco correspondente do `script.js`.

## Guia para integração com o backend

Esta seção é o ponto de passagem para quem vai conectar a API. O frontend já possui os componentes visuais e os pontos de montagem; a integração deve substituir os dados demonstrativos sem mudar os seletores do HTML.

### O que é mock hoje

- `products`, `producers` e `categories` em `script.js` são dados temporários.
- `chatContacts` contém apenas conversas demonstrativas.
- `agrifam-cart`, `agrifam-favorites` e `agrifam-chats` são chaves do `localStorage` usadas apenas para simular persistência.
- O login, checkout e cadastro de produtor exibem mensagens demonstrativas; ainda não enviam dados para um servidor.

### Contratos esperados

Os objetos retornados pela API devem manter estes campos, que são consumidos diretamente pelos templates do frontend:

```json
{
	"id": 1,
	"name": "Tomate Orgânico",
	"price": 8.9,
	"unit": "kg",
	"producer": "Sítio Boa Esperança",
	"location": "Teresina - PI",
	"category": "Verduras",
	"rating": 4.9,
	"image": "https://exemplo.com/imagem.jpg"
}
```

Produtores usam os campos `id`, `name`, `property`, `location`, `specialty`, `rating`, `history` e `image`. Categorias usam `name`, `icon` e `count`. Os contratos TypeScript correspondentes estão em `types.ts`.

### Endpoints e pontos de conexão

| Endpoint | Uso no frontend | Ponto que deve ser substituído |
| --- | --- | --- |
| `GET /api/produtos` | Preencher catálogo e busca | Array `products` + `renderProducts(products)` |
| `GET /api/produtores` | Preencher cards e perfil | Array `producers` + `producerGrid.innerHTML` |
| `POST /api/auth` | Login e criação de sessão | Listener de `#authForm` |
| `POST /api/pedidos` | Finalizar carrinho | Listener de `#checkoutButton` |
| `GET /api/conversas` | Carregar contatos e mensagens | Array `chatContacts` + `renderChat()` |
| `POST /api/conversas` | Enviar mensagem | Listener de `#chatForm` |

Ao integrar, preserve os estados de carregamento, erro e vazio no HTML. O catálogo já possui `#emptyState`; podem ser adicionados elementos como `data-state="loading"` e `data-state="error"` sem trocar os IDs principais.

### Fluxo recomendado de integração

1. Substituir os arrays de produtos e produtores por `fetch()`.
2. Manter `productCard()`, `renderProducts()` e os filtros recebendo os mesmos formatos.
3. Trocar o `localStorage` do carrinho por `POST`, `PATCH` e `DELETE` autenticados.
4. Conectar `#authForm` e guardar a sessão em cookie seguro ou mecanismo definido pelo backend.
5. Integrar o checkout usando um provedor de marketplace com split de pagamento; o frontend não deve receber nem armazenar dados de cartão.
6. Substituir o chat local por chamadas autenticadas e atualizar `renderChat()` após cada resposta.

### Responsabilidade de cada lado

**Frontend:** exibir dados, validar campos básicos, controlar estados visuais, enviar requisições e mostrar mensagens de sucesso ou erro.

**Backend:** autenticar usuários, validar todos os dados novamente, autorizar acesso, calcular preços e frete, persistir pedidos, processar pagamentos, dividir valores entre produtores e proteger segredos.

O frontend nunca deve conter senha, token privado, chave secreta de pagamento ou regra de preço considerada confiável. Tudo que envolve dinheiro ou permissão precisa ser recalculado e validado no backend.

## Organização dos arquivos

- `index.html`: estrutura semântica, navegação, seções, modais e pontos de montagem dinâmicos.
- `style.css`: tokens visuais, componentes, estados de interação, mapa, conversas e responsividade. As seções estão numeradas no início do arquivo.
- `script.js`: comportamento executado no navegador, dados demonstrativos, busca, filtros, carrinho, chat, modais e carrossel.
- `script.ts`: base tipada para a migração gradual do comportamento para TypeScript.
- `types.ts`: contratos compartilhados de categorias, produtos, produtores, carrinho e filtros.
- `asset/`: imagens e ícones locais usados pela interface.

## Desenvolvimento

Instale as dependências e valide o TypeScript:

```bash
npm install
npm run check
npm run build
```

## Tipografia e estilos

- **Poppins**: títulos, chamadas e elementos de destaque.
- **Nunito Sans**: textos, navegação e controles, priorizando leitura confortável.

As fontes são carregadas no `<head>` de `index.html` e expostas pelos tokens `--display` e `--sans` no `style.css`.

Os principais tokens visuais ficam no bloco `:root` de `style.css`: `--green`, `--green-dark`, `--ink`, `--muted`, `--cream`, `--line`, `--white`, `--display`, `--sans` e `--shadow`.

## Antes de enviar alterações

1. Execute `npm run check` para verificar os contratos TypeScript.
2. Execute `npx prettier --write index.html style.css script.js script.ts types.ts tsconfig.json` depois de editar os arquivos.
3. Confira `git diff --check` para detectar problemas de espaços e formatação.

## Próximas integrações

- Produtos: `GET /api/produtos`
- Produtores: `GET /api/produtores`
- Autenticação: `POST /api/auth`
- Pedidos: `POST /api/pedidos`
