/*
 * Eu explico: AgriFam - comportamento da interface
 *
 * Eu organizo estas partes nesta ordem:
 * Eu organizo esta seção: 1. API, estado local e utilitários compartilhados
 * Eu organizo esta seção: 2. Navegação, busca e carrossel
 * Eu organizo esta seção: 3. Catálogo, categorias e filtros (dados reais via API)
 * Eu organizo esta seção: 4. Favoritos
 * Eu organizo esta seção: 5. Carrinho e checkout (pagamento real pelo Mercado Pago)
 * Eu organizo esta seção: 6. Produtores e autenticação (dados e sessão reais via API)
 * Eu organizo esta seção: 7. Conversas (reais via /api/conversas)
 *
 * Eu explico: O carrinho e os favoritos continuam guardados no localStorage. A navegação do site
 * Eu explico: agora só é liberada depois que a sessão de quem visita é confirmada pela API.
 */


// Eu organizo esta seção: 1. API, ESTADO LOCAL E UTILITÁRIOS COMPARTILHADOS


// Eu explico: Use o mesmo nome de host da interface web durante o desenvolvimento local. Misturar
// Eu explico: localhost e 127.0.0.1 pode fazer o navegador rejeitar o cookie de sessão entre origens.
const localHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE =
  window.AGRIFAM_API_BASE ||
  (localHost ? `http://${window.location.hostname}:3333/api` : "/api");

let refreshInThisTab = null;

const refreshAfter401 = async (send) => {
  const refresh = async () => {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  };

  const retryOrRefresh = async () => {
    // Eu explico: Outra requisição pode já ter renovado o cookie enquanto este pedido aguardava.
    const retried = await send();
    if (retried.status !== 401) return retried;
    if (!refreshInThisTab) {
      refreshInThisTab = refresh().finally(() => { refreshInThisTab = null; });
    }
    if (await refreshInThisTab) return send();
    return retried;
  };

  // Eu explico: Evita que abas/requisições simultâneas tentem consumir o mesmo refresh token.
  if (navigator.locks?.request) {
    return navigator.locks.request("agrifam-session-refresh", retryOrRefresh);
  }
  return retryOrRefresh();
};

const api = async (path, options = {}) => {
  const send = () => fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let response = await send();
  const noRefresh = new Set([
    "/auth",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/google/callback",
    "/auth/password/forgot",
    "/auth/password/reset",
  ]);
  if (response.status === 401 && !noRefresh.has(path)) {
    response = await refreshAfter401(send);
  }
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    const error = new Error(
      body?.error || "Não foi possível completar a ação.",
    );
    error.status = response.status;
    throw error;
  }
  return body;
};

const categoryIcons = {
  apple:
    '<path d="M12 20.5c-4.5 0-7-3.7-7-8.1C5 9.2 7.1 7 10 7c1.2 0 1.7.7 2 .7s.9-.7 2.4-.7c2.1 0 3.6 1.1 4.3 2.2-3.8 2.1-3.2 7.2.6 8.6-.5 1.1-1.1 2.2-1.8 3.1-1 1.4-2 2.7-3.6 2.7s-2-.9-3.7-.9-2.2.9-3.7.9-2.5-1.2-3.5-2.6Z"/><path d="M14 5.5c.7-1.1 1.8-1.8 3.2-1.9.1 1.4-.4 2.5-1.1 3.3-.8.9-2 1.6-3.2 1.5-.1-1.1.3-2.2 1.1-2.9Z"/>',
  leaf: '<path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 10-6 10-15Z"/><path d="M4 20c3-5 7-8 12-10"/>',
  carrot:
    '<path d="m12 10 4 9a2 2 0 0 1-1.8 2.8H9.8A2 2 0 0 1 8 19l4-9Z"/><path d="M12 10c-2-2-2-4 0-6 2 2 2 4 0 6ZM9 7C7 6 6 4 7 2c2 1 3 3 2 5ZM15 7c2-1 3-3 2-5-2 1-3 3-2 5Z"/>',
  wheat:
    '<path d="M12 21V5M12 8c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 13c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 18c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 8c3 0 5-2 5-5-3 0-5 2-5 5ZM12 13c3 0 5-2 5-5-3 0-5 2-5 5ZM12 18c3 0 5-2 5-5-3 0-5 2-5 5Z"/>',
  hexagon:
    '<path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9L12 3Z"/><path d="M8 10h8M8 14h8"/>',
  cheese:
    '<path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z"/><path d="M4 10c2-4 6-6 12-6l4 6M8 14h.01M14 17h.01"/>',
  candy:
    '<path d="m7 8-4-2v4l4 2M17 8l4-2v4l-4 2"/><path d="M7 8h10v8H7z"/><path d="M10 8v8M14 8v8"/>',
  palette:
    '<path d="M12 4a8 8 0 0 0 0 16h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h2a6 6 0 0 0 0-12Z"/><path d="M7 10h.01M9 7h.01M14 7h.01M17 10h.01"/>',
  "map-pin":
    '<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2"/>',
};

// Eu explico: Ícones SVG pequenos usados em botões e cartões dinâmicos.
const arrowIcon =
  '<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const starIcon =
  '<svg class="rating-star" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9L12 2.8Z"/></svg>';

// Eu explico: Estado do cliente. Carrinho e favoritos continuam locais (funcionam sem login);
// Eu explico: usuário, catálogo e conversas vêm do servidor.
let currentUser = null;
let checkoutRequestId = null;
let categories = [];
let products = [];
let activeProducts = [];
let favoriteProducts = [];
let producers = [];
// Eu explico: Dados locais podem estar corrompidos ou indisponíveis (ex.: modo privado).
// Eu explico: A interface continua abrindo com valores seguros nesses casos.
const readLocalJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeLocalJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Eu explico: A sessão continua usável sem persistência local. */
  }
};
const storedCart = readLocalJSON("agrifam-cart", []);
let cart = Array.isArray(storedCart)
  ? storedCart
      .filter(
        (item) =>
          Number.isSafeInteger(Number(item?.id)) &&
          Number(item.id) > 0 &&
          Number.isSafeInteger(Number(item?.quantity)) &&
          Number(item.quantity) >= 1 &&
          Number(item.quantity) <= 100 &&
          Number.isFinite(Number(item?.price)) &&
          Number(item.price) >= 0,
      )
      .map((item) => ({
        ...item,
        id: Number(item.id),
        quantity: Number(item.quantity),
        price: Number(item.price),
      }))
  : [];
const storedFavorites = readLocalJSON("agrifam-favorites", []);
let favorites = Array.isArray(storedFavorites)
  ? [
      ...new Set(
        storedFavorites
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0),
      ),
    ]
  : [];
let conversations = [];
let activeConversationId = null;
let chatReadUserId = null;
let readMessagesByConversation = {};
let authMode = "login";
let googleAuthEnabled = false;
let googleAuthClient = null;

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [
  ...context.querySelectorAll(selector),
];
const isConversationUnread = (conversation) => {
  const latest = conversation?.lastMessage;
  if (
    !currentUser ||
    !latest ||
    Number(latest.senderId) === Number(currentUser.id)
  )
    return false;
  return (
    Number(latest.id) > Number(readMessagesByConversation[conversation.id] || 0)
  );
};
const updateChatNotificationCount = () => {
  const unread = currentUser
    ? conversations.filter(isConversationUnread).length
    : 0;
  $$(".chat-count").forEach((badge) => {
    badge.textContent = String(unread);
    badge.hidden = unread === 0;
  });
  const chatButton = $('[data-action="chat"]');
  if (chatButton)
    chatButton.setAttribute(
      "aria-label",
      unread ? `Abrir conversas, ${unread} não lidas` : "Abrir conversas",
    );
};
const loadChatReadState = (user) => {
  const nextUserId = user ? String(user.id) : null;
  if (nextUserId === chatReadUserId) return;
  chatReadUserId = nextUserId;
  readMessagesByConversation = {};
  conversations = [];
  if (nextUserId) {
    const saved = readLocalJSON(`agrifam-chat-read:${nextUserId}`, {});
    if (saved && typeof saved === "object" && !Array.isArray(saved))
      readMessagesByConversation = saved;
  }
  updateChatNotificationCount();
};
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
const safeImageURL = (value) => {
  try {
    const url = new URL(
      String(value || "asset/imagens/logo 2.png"),
      window.location.origin,
    );
    return ["http:", "https:"].includes(url.protocol)
      ? escapeHTML(url.href)
      : "asset/imagens/logo 2.png";
  } catch {
    return "asset/imagens/logo 2.png";
  }
};
const money = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const showToast = (message) => {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
};

// Eu explico: Revela cartões ao entrarem na área visível, sem atrasar o conteúdo ou a busca.
document.body.classList.add("has-scroll-reveal");
const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -35px" },
      )
    : null;
const observeRevealItems = (context) => {
  const items = $$(".reveal-item", context);
  if (!revealObserver) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  items.forEach((item) => revealObserver.observe(item));
};


// Eu organizo esta seção: 2. NAVEGAÇÃO, BUSCA E CARROSSEL


const heroShader = document.querySelector("#heroShader");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
if (window.Swiper && document.documentElement.dataset.page === "inicio") {
  new window.Swiper(".hero", {
    loop: true,
    autoplay: prefersReducedMotion
      ? false
      : { delay: 5500, disableOnInteraction: false },
    pagination: { el: ".swiper-pagination", clickable: false },
    keyboard: { enabled: true },
    touchRatio: 1,
  });
}
const initHeroShader = async (canvas) => {
  if (!canvas || prefersReducedMotion) return;
  try {
    const { default: gradientGL } =
      await import("https://unpkg.com/gradient-gl@2.0.5");
    gradientGL("s1.eba9", "#heroShader");
  } catch (error) {
    console.warn(
      "Shader do hero indisponível; mantendo o fundo original.",
      error,
    );
  }
};
void initHeroShader(heroShader);
const menuToggle = $("#menuToggle");
const mobileMenu = $("#mobileMenu");
const setMobileMenu = (open) => {
  mobileMenu.classList.toggle("open", open);
  mobileMenu.setAttribute("aria-hidden", String(!open));
  mobileMenu.inert = !open;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  menuToggle.classList.toggle("is-open", open);
};
menuToggle.addEventListener("click", () => {
  setMobileMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});
$$(".mobile-menu a").forEach((link) =>
  link.addEventListener("click", () => setMobileMenu(false)),
);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuToggle.getAttribute("aria-expanded") === "true"
  ) {
    setMobileMenu(false);
    menuToggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (
    menuToggle.getAttribute("aria-expanded") === "true" &&
    !mobileMenu.contains(event.target) &&
    !menuToggle.contains(event.target)
  )
    setMobileMenu(false);
});
let searchDebounce;
$$(".search-wrap input").forEach((input) =>
  input.addEventListener("input", (event) => {
    const other =
      event.target.id === "searchInput"
        ? $("#mobileSearchInput")
        : $("#searchInput");
    other.value = event.target.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(loadProducts, 300);
  }),
);
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceButtons = $$(".voice-search");
if (!SpeechRecognition) {
  voiceButtons.forEach((button) => {
    button.hidden = true;
  });
} else {
  // Eu explico: A busca por voz é opcional: navegadores sem Web Speech continuam usando a busca normal.
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.continuous = false;
  voiceButtons.forEach((button) =>
    button.addEventListener("click", () => {
      recognition.start();
      voiceButtons.forEach((item) => item.classList.add("listening"));
      showToast("Ouvindo sua busca...");
    }),
  );
  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript.trim();
    $("#searchInput").value = transcript;
    $("#mobileSearchInput").value = transcript;
    loadProducts();
  });
  recognition.addEventListener("error", (event) => {
    if (event.error !== "aborted")
      showToast("Não foi possível reconhecer sua voz.");
  });
  recognition.addEventListener("end", () =>
    voiceButtons.forEach((item) => item.classList.remove("listening")),
  );
}
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#searchInput").focus();
  }
});


// Eu organizo esta seção: 3. CATÁLOGO, CATEGORIAS E FILTROS (dados reais via API)


const categoryList = $("#categoryList");
const categoryFilter = $("#categoryFilter");

const renderCategories = () => {
  // Eu explico: Os dados da API não são confiáveis: escape textos e atributos e use apenas
  // Eu explico: caminhos SVG do mapa local de ícones. Não anime estes cartões ao rolar a página
  // Eu explico: para evitar que a fileira de categorias salte ao entrar na área visível.
  categoryList.innerHTML = categories
    .map(
      // Eu explico: "Regionais" funciona como atalho para "ver tudo": não filtra por categoria.
      (category) =>
        `<button class="category" type="button" data-category="${category.name === "Regionais" ? "" : escapeHTML(category.name)}" aria-pressed="false"><span class="category-symbol"><svg class="category-icon" viewBox="0 0 24 24" aria-hidden="true">${categoryIcons[category.icon] || ""}</svg></span><span class="category-copy"><strong>${escapeHTML(category.name)}</strong><small>${escapeHTML(category.count)}</small></span><svg class="category-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button>`,
    )
    .join("");

  categoryFilter.innerHTML =
    '<option value="">Todas as categorias</option>' +
    categories
      .map(
        (category) =>
          `<option value="${escapeHTML(category.name)}">${escapeHTML(category.name)}</option>`,
      )
      .join("");
};

const loadCategories = async () => {
  try {
    categories = await api("/categorias");
    renderCategories();
  } catch (error) {
    showToast(error.message);
  }
};

const isFavorite = (id) => favorites.includes(Number(id));
const productCard = (product, reveal = true) =>
  `<article class="product-card${reveal ? " reveal-item" : ""}"><div class="product-image"><img src="${safeImageURL(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy"><button class="favorite-button ${isFavorite(product.id) ? "active" : ""}" data-favorite="${Number(product.id)}" aria-label="${isFavorite(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566" /></svg></button></div><div class="product-info"><h3>${escapeHTML(product.name)}</h3><div class="product-meta"><span>${escapeHTML(product.producer)}</span><span>${escapeHTML(product.location)}</span></div><div class="rating" aria-label="Avaliação ${Number(product.rating) || 0} de 5"><span class="rating-stars" aria-hidden="true">${Array.from({ length: 5 }, () => starIcon).join("")}</span><span>${Number(product.rating) || 0}</span></div><div class="product-bottom"><span class="price">${money(product.price)} <small>/ ${escapeHTML(product.unit)}</small></span><button class="add-cart" data-cart="${Number(product.id)}" aria-label="Adicionar ${escapeHTML(product.name)} ao carrinho"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-7-7h14" /></svg></button></div></div></article>`;

const renderFavorites = () => {
  const catalog = new Map(
    [...favoriteProducts, ...products, ...activeProducts].map((product) => [
      Number(product.id),
      product,
    ]),
  );
  const saved = [...new Set(favorites.map(Number))]
    .map((id) => catalog.get(id))
    .filter(Boolean);
  // Eu explico: A janela de favoritos não participa da animação por rolagem do catálogo:
  // Eu explico: mantenha os cartões sem `reveal-item` para que não fiquem invisíveis.
  $("#favoritesGrid").innerHTML = saved
    .map((product) => productCard(product, false))
    .join("");
  $("#favoritesEmpty").hidden = favorites.length > 0;
  $("#favoritesUnavailable").hidden =
    saved.length > 0 || favorites.length === 0;
};
const openFavorites = async () => {
  openModal($("#favoritesModal"));
  $("#favoritesGrid").innerHTML =
    '<p class="favorites-loading" role="status">Carregando seus favoritos…</p>';
  try {
    favoriteProducts = await api("/produtos");
    // Eu explico: Remove IDs órfãos do navegador quando o produto já saiu do catálogo.
    // Eu explico: Assim a lista e o contador representam os mesmos itens disponíveis.
    const availableIds = new Set(
      favoriteProducts.map((product) => Number(product.id)),
    );
    const availableFavorites = favorites.filter((id) =>
      availableIds.has(Number(id)),
    );
    if (availableFavorites.length !== favorites.length) {
      favorites = availableFavorites;
      saveFavorites();
    }
    renderFavorites();
  } catch (error) {
    favoriteProducts = [
      ...new Map(
        [...products, ...activeProducts].map((product) => [
          Number(product.id),
          product,
        ]),
      ).values(),
    ];
    renderFavorites();
    if (!favoriteProducts.length) showToast(error.message);
  }
};
const renderProducts = (list) => {
  activeProducts = list;
  $("#productGrid").innerHTML = list.map(productCard).join("");
  observeRevealItems($("#productGrid"));
  $("#resultsCount").textContent =
    `${list.length} resultado${list.length === 1 ? "" : "s"} encontrado${list.length === 1 ? "" : "s"}`;
  $("#emptyState").hidden = list.length > 0;
};

const loadProducts = async () => {
  const params = new URLSearchParams();
  const term = $(".search-wrap input")?.value.trim();
  if (term) params.set("search", term);
  if (categoryFilter.value) params.set("category", categoryFilter.value);
  const sort = $("#sortFilter").value;
  if (sort) params.set("sort", sort);

  try {
    products = await api(`/produtos?${params.toString()}`);
    renderProducts(products);
  } catch (error) {
    showToast(error.message);
  }
};

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  $$(".category", categoryList).forEach((item) => {
    const selected = item === button;
    item.classList.toggle("is-selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  categoryFilter.value = button.dataset.category;
  loadProducts();
  document.querySelector("#produtos").scrollIntoView({ behavior: "smooth" });
});
categoryFilter.addEventListener("change", () => {
  $$(".category", categoryList).forEach((item) => {
    const selected = item.dataset.category === categoryFilter.value;
    item.classList.toggle("is-selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
  loadProducts();
});
$("#sortFilter").addEventListener("change", loadProducts);
$("#clearFilters").addEventListener("click", () => {
  categoryFilter.value = "";
  $$(".category", categoryList).forEach((item) => {
    item.classList.remove("is-selected");
    item.setAttribute("aria-pressed", "false");
  });
  $("#sortFilter").value = "featured";
  $("#searchInput").value = "";
  $("#mobileSearchInput").value = "";
  loadProducts();
});
$("#filterTrigger").addEventListener("click", () => {
  $("#filters").classList.add("open");
  $("#overlay").classList.add("open");
});
$("#closeFilters").addEventListener("click", () => {
  $("#filters").classList.remove("open");
  $("#overlay").classList.remove("open");
});


// Eu organizo esta seção: 4. FAVORITOS


// Eu explico: Favoritos continuam só no localStorage: não há rota de favoritos no servidor
// Eu explico: (fora do escopo atual), então isso é uma preferência só deste navegador.
const saveFavorites = () => {
  favorites = [
    ...new Set(
      favorites.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0),
    ),
  ];
  writeLocalJSON("agrifam-favorites", favorites);
  updateCounters();
};


// Eu organizo esta seção: 5. CARRINHO E CHECKOUT


// Eu explico: O carrinho continua no localStorage — dá para montar a sacola sem estar logado.
// Eu explico: O carrinho pode ser montado sem sessão; a finalização da compra exige login.
const saveCart = () => {
  writeLocalJSON("agrifam-cart", cart);
  updateCounters();
};
const updateCounters = () => {
  $$(".cart-count").forEach(
    (element) =>
      (element.textContent = cart.reduce(
        (sum, item) => sum + item.quantity,
        0,
      )),
  );
  $$(".favorite-count").forEach((element) => {
    element.textContent = String(favorites.length);
    element.hidden = favorites.length === 0;
  });
  updateChatNotificationCount();
};
const renderCart = () => {
  const items = $("#cartItems");
  if (!cart.length) {
    items.innerHTML = `<div class="cart-empty"><p>Seu carrinho está esperando por boas escolhas.</p><a class="text-link" href="#produtos" id="emptyCartLink">Explorar produtos ${arrowIcon}</a></div>`;
  } else {
    items.innerHTML = cart
      .map(
        (item) =>
          `<div class="cart-item"><img src="${safeImageURL(item.image)}" alt=""><div><h4>${escapeHTML(item.name)}</h4><small>${money(item.price)} / ${escapeHTML(item.unit)}</small><div class="qty-controls"><button data-quantity="${Number(item.id)}" data-change="-1">−</button><span>${Number(item.quantity)}</span><button data-quantity="${Number(item.id)}" data-change="1">+</button></div><button class="remove-item" data-remove="${Number(item.id)}">Remover</button></div><strong class="cart-item-price">${money(item.price * item.quantity)}</strong></div>`,
      )
      .join("");
  }
  $("#cartTotal").textContent = money(
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  updateCounters();
};
const openCart = () => {
  renderCart();
  $("#cartDrawer").classList.add("open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  $("#overlay").classList.add("open");
};
const closeCart = () => {
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  $("#overlay").classList.remove("open");
};
document.addEventListener("click", (event) => {
  const favoritesLink = event.target.closest("[data-open-favorites]");
  if (favoritesLink) {
    event.preventDefault();
    setMobileMenu(false);
    openFavorites();
    return;
  }
  const cartButton = event.target.closest("[data-cart]");
  if (cartButton) {
    const product = [...activeProducts, ...favoriteProducts, ...products].find(
      (item) => item.id === Number(cartButton.dataset.cart),
    );
    if (product) {
      const existing = cart.find((item) => item.id === product.id);
      existing ? existing.quantity++ : cart.push({ ...product, quantity: 1 });
      saveCart();
      renderCart();
      showToast(`${product.name} foi adicionado ao carrinho`);
    }
  }
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const id = Number(favoriteButton.dataset.favorite);
    favorites = isFavorite(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    saveFavorites();
    renderProducts(activeProducts);
    renderFavorites();
    showToast(
      isFavorite(id)
        ? "Produto salvo nos favoritos"
        : "Produto removido dos favoritos",
    );
  }
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const item = cart.find(
      (entry) => entry.id === Number(quantityButton.dataset.quantity),
    );
    item.quantity += Number(quantityButton.dataset.change);
    if (item.quantity <= 0) cart = cart.filter((entry) => entry.id !== item.id);
    saveCart();
    renderCart();
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart = cart.filter(
      (item) => item.id !== Number(removeButton.dataset.remove),
    );
    saveCart();
    renderCart();
  }
});
$$('[data-action="favorites"]').forEach((button) =>
  button.addEventListener("click", openFavorites),
);
$$('[data-action="cart"]').forEach((button) =>
  button.addEventListener("click", openCart),
);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", () => {
  closeCart();
  closeChat();
  $("#filters").classList.remove("open");
});
$("#checkoutButton").addEventListener("click", async () => {
  if (!cart.length) {
    showToast("Seu carrinho está vazio.");
    return;
  }
  if (!currentUser) {
    closeCart();
    showToast("Entre na sua conta para finalizar o pedido.");
    openAuthModal("login");
    return;
  }
  try {
    $("#checkoutButton").disabled = true;
    checkoutRequestId ||= crypto.randomUUID();
    const checkout = await api("/pagamentos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": checkoutRequestId },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      }),
    });
    checkoutRequestId = null;
    window.location.assign(checkout.checkoutUrl);
  } catch (error) {
    showToast(error.message);
    // Eu explico: Se a API respondeu com erro, ela não criou um checkout reaproveitável.
    // Eu explico: Em falha de rede, mantenha a chave para repetir a mesma operação com segurança.
    if (error.status) checkoutRequestId = null;
    $("#checkoutButton").disabled = false;
  }
});
updateCounters();


// Eu organizo esta seção: 6. PRODUTORES E AUTENTICAÇÃO (dados e sessão reais via API)


const producerGrid = $("#producerGrid");

const producerCard = (producer) =>
  `<article class="producer-card reveal-item">
    <div class="producer-photo"><img src="${safeImageURL(producer.image)}" alt="${escapeHTML(producer.property || producer.name)}" loading="lazy"><span class="producer-photo-label">Produtor local</span></div>
    <div class="producer-info">
      <p class="producer-location">${escapeHTML(producer.location)}</p>
      <h3>${escapeHTML(producer.property || producer.name)}</h3>
      <p class="producer-owner">Por ${escapeHTML(producer.name)}</p>
      <div class="producer-card-meta"><span>${escapeHTML(producer.specialty)}</span><span class="producer-rating" aria-label="Nota ${Number(producer.rating) || 0} de 5">${starIcon}${Number(producer.rating) || 0}</span></div>
      <button class="producer-card-link" data-producer="${Number(producer.id)}">Conhecer a loja ${arrowIcon}</button>
    </div>
  </article>`;

const renderProducers = () => {
  producerGrid.innerHTML = producers.map(producerCard).join("");
  observeRevealItems(producerGrid);
  const statProducers = $("#statProducers");
  if (statProducers) statProducers.textContent = producers.length;
};

const loadProducers = async () => {
  try {
    producers = await api("/produtores");
    renderProducers();
  } catch (error) {
    showToast(error.message);
  }
};

observeRevealItems(document);
const openModal = (modal) => {
  modal.classList.add("open");
  $("#overlay").classList.add("open");
};
const closeModals = () => {
  $$(".modal").forEach((modal) => modal.classList.remove("open"));
  $("#overlay").classList.remove("open");
};
let settingsOpener = null;
$$("[data-open-settings]").forEach((button) => {
  button.addEventListener("click", () => {
    settingsOpener = button;
    if (menuToggle.getAttribute("aria-expanded") === "true")
      setMobileMenu(false);
    openModal($("#settingsModal"));
    $("#settingsTabExperience").focus();
  });
});
$("#settingsModal")
  ?.querySelectorAll("[data-close-modal]")
  .forEach((button) => {
    button.addEventListener("click", () => settingsOpener?.focus());
  });
producerGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-producer]");
  if (!button) return;
  const producer = producers.find(
    (item) => item.id === Number(button.dataset.producer),
  );
  if (!producer) return;
  const productCount = products.filter(
    (item) => item.producer === producer.property,
  ).length;
  $("#producerModalContent").innerHTML =
    `<div class="producer-store-hero"><img src="${safeImageURL(producer.image)}" alt=""><div class="producer-store-hero-copy"><span class="producer-store-kicker">Loja local · ${escapeHTML(producer.location)}</span><h2 id="producerModalTitle">${escapeHTML(producer.property || producer.name)}</h2><p>Por ${escapeHTML(producer.name)}</p></div></div>
      <div class="producer-store-content"><div class="producer-store-tags"><span>${escapeHTML(producer.specialty)}</span><span class="producer-rating">${starIcon}${Number(producer.rating) || 0} <small>avaliação</small></span></div>
        <section class="producer-store-story"><h3>A história da propriedade</h3><p>${escapeHTML(producer.history || "Este produtor ainda não contou sua história. Conheça os produtos e acompanhe o trabalho desta propriedade local.")}</p></section>
        <div class="producer-store-facts"><div><span>Localização</span><strong>${escapeHTML(producer.location)}</strong></div><div><span>Produtos no catálogo</span><strong>${productCount} ${productCount === 1 ? "produto" : "produtos"}</strong></div></div>
        <div class="modal-actions producer-store-actions"><a href="?page=produtos#produtos" class="button button-green" data-close-modal>Ver produtos ${arrowIcon}</a><button class="button button-light" type="button" data-message-producer="${Number(producer.id)}">Enviar mensagem</button></div>
      </div>`;
  $("#producerModal").classList.add("producer-store-modal");
  openModal($("#producerModal"));
});
const educationalMaterials = [];
let activeMaterialType = "all";
let activeTrainingTopic = "all";

const trainingModules = {
  Palestras: {
    title: "Palestras",
    headline: "Conversas que abrem caminhos",
    description: "Encontros para trocar experiências e conversar sobre ferramentas que fortalecem a agricultura familiar.",
    format: "Encontros presenciais e online",
    topics: ["Segurança e cidadania digital", "Divulgação da produção local", "WhatsApp como canal de negócio"],
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 7H9l3-7ZM5 13h14M7 9v4m10-4v4M8 21h8m-4-8v8" /></svg>',
  },
  Oficinas: {
    title: "Oficinas",
    headline: "Aprender fazendo",
    description: "Atividades guiadas para praticar habilidades digitais com situações do dia a dia da propriedade.",
    format: "Demonstração e prática acompanhada",
    topics: ["Fotografia de produtos com o celular", "Catálogo e atendimento pelo WhatsApp", "Cuidados básicos com contas e senhas"],
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18a2.1 2.1 0 0 0 3 3l6.3-6.3a4 4 0 0 0 5.4-5.4L15 12l-3-3zM14 4l6 6m-3-7 4 4" /></svg>',
  },
};

const renderTrainingModule = (module) => {
  activeTrainingTopic = module.title === "Oficinas" ? "Fotografia de produtos" : "all";
  $("#trainingModalTitle").textContent = module.title;
  $("#trainingModuleContent").innerHTML = `
    <div class="training-module-intro">
      <span class="training-module-icon">${module.icon}</span>
      <div><h3>${escapeHTML(module.headline)}</h3><p>${escapeHTML(module.description)}</p></div>
    </div>
    <div class="training-module-format"><span>Formato</span><strong>${escapeHTML(module.format)}</strong></div>
    <section class="training-module-topics" aria-label="Temas do módulo">
      <h3>${module.title === "Oficinas" ? "Práticas propostas" : "Temas em pauta"}</h3>
      <ul>${module.topics.map((topic) => `<li>${escapeHTML(topic)}</li>`).join("")}</ul>
    </section>
    <p class="training-module-schedule"><strong>Agenda em preparação</strong><span>As datas e inscrições serão publicadas aqui quando estiverem confirmadas.</span></p>`;
};

const renderEducationalMaterials = () => {
  const query = $("#educationSearch").value.trim().toLocaleLowerCase("pt-BR");
  const topic = activeTrainingTopic === "all" ? $("#educationTopicFilter").value : activeTrainingTopic;
  const materials = educationalMaterials.filter((material) => {
    const matchesType = activeMaterialType === "all" || material.type === activeMaterialType;
    const matchesTopic = topic === "all" || material.topic === topic;
    const matchesQuery = `${material.title} ${material.description} ${material.topic}`
      .toLocaleLowerCase("pt-BR")
      .includes(query);
    return matchesType && matchesTopic && matchesQuery;
  });

  $("#educationResultsCount").textContent =
    `${materials.length} ${materials.length === 1 ? "material disponível" : "materiais disponíveis"}`;

  if (!materials.length) {
    const searching = query || topic !== "all" || activeMaterialType !== "all";
    $("#educationMaterialGrid").innerHTML = `
      <div class="education-empty-state">
        <span class="education-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48"><path d="M8 10.5A4.5 4.5 0 0 1 12.5 6H40v34H12.5A4.5 4.5 0 0 1 8 35.5zM8 35.5A4.5 4.5 0 0 1 12.5 31H40M17 14h15M17 20h15M17 26h9" /></svg>
        </span>
        <h3>${searching ? "Nenhum material encontrado" : "Estamos preparando os primeiros materiais"}</h3>
        <p>${searching ? "Tente mudar o tema, o formato ou os termos da busca." : "Em breve, esta biblioteca terá videoaulas e guias em PDF sobre os temas da agricultura familiar."}</p>
      </div>`;
    return;
  }

  $("#educationMaterialGrid").innerHTML = materials.map((material) => {
    const url = new URL(material.url, window.location.href);
    const safeUrl = ["http:", "https:"].includes(url.protocol) ? escapeHTML(url.href) : "#";
    const isVideo = material.type === "video";
    return `<a class="education-material-card" href="${safeUrl}" target="_blank" rel="noopener noreferrer">
      <span class="education-material-art ${isVideo ? "is-video" : "is-pdf"}" aria-hidden="true">
        <svg viewBox="0 0 48 48">${isVideo ? '<path d="m19 14 16 10-16 10z" />' : '<path d="M12 5h17l8 8v30H12zM29 5v9h8M18 24h13M18 30h13M18 36h8" />'}</svg>
      </span>
      <span class="education-material-copy">
        <span class="education-material-meta">${isVideo ? "VIDEOAULA" : "GUIA EM PDF"} <span>${escapeHTML(material.topic)}</span></span>
        <strong>${escapeHTML(material.title)}</strong>
        <span class="education-material-description">${escapeHTML(material.description)}</span>
        <span class="education-material-action">${isVideo ? "Assistir aula" : "Abrir material"} <span aria-hidden="true">↗</span></span>
      </span>
    </a>`;
  }).join("");
};

$$('[data-material-type]').forEach((button) => {
  button.addEventListener("click", () => {
    activeMaterialType = button.dataset.materialType;
    $$('[data-material-type]').forEach((tab) => {
      const selected = tab === button;
      tab.setAttribute("aria-selected", String(selected));
    });
    renderEducationalMaterials();
  });
});
$("#educationSearch").addEventListener("input", renderEducationalMaterials);
$("#educationTopicFilter").addEventListener("change", renderEducationalMaterials);
renderEducationalMaterials();

$$("[data-training]").forEach((button) =>
  button.addEventListener("click", () => {
    if (button.dataset.training === "Materiais educativos") {
      activeTrainingTopic = "all";
      $("#educationTopicFilter").value = "all";
      renderEducationalMaterials();
      openModal($("#educationLibraryModal"));
      $("#educationSearch").focus();
      return;
    }
    renderTrainingModule(trainingModules[button.dataset.training]);
    openModal($("#trainingModal"));
  }),
);
$("#trainingMaterialsLink").addEventListener("click", () => {
  closeModals();
  $("#educationTopicFilter").value = activeTrainingTopic;
  renderEducationalMaterials();
  openModal($("#educationLibraryModal"));
});
$$("[data-close-modal]").forEach((button) =>
  button.addEventListener("click", closeModals),
);
$("#overlay").addEventListener("click", closeModals);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const settingsWereOpen = $("#settingsModal")?.classList.contains("open");
    closeModals();
    closeCart();
    closeChat();
    if (settingsWereOpen) settingsOpener?.focus();
  }
});

// Eu explico: Envia mensagem a um produtor a partir do modal de perfil (botão inserido acima).
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-message-producer]");
  if (!button) return;
  if (!currentUser) {
    closeModals();
    showToast("Entre na sua conta para conversar com o produtor.");
    openAuthModal("login");
    return;
  }
  try {
    const conversation = await api("/conversas", {
      method: "POST",
      body: JSON.stringify({
        producerId: Number(button.dataset.messageProducer),
      }),
    });
    closeModals();
    await openChat(conversation.id);
  } catch (error) {
    showToast(error.message);
  }
});

// Eu explico: --- Autenticação: login e cadastro (com perfil de produtor) reais ---

const updateAuthUI = () => {
  loadChatReadState(currentUser);
  $$(".login-link").forEach((link) => {
    // Eu explico: A navegação fica mais limpa com a saída dentro das configurações do perfil.
    link.textContent = "Entrar";
    link.hidden = Boolean(currentUser);
  });
  const headerProfileLink = $("#headerProfileLink");
  if (headerProfileLink) {
    headerProfileLink.hidden = !currentUser;
    if (currentUser) {
      const name = String(currentUser.name || "Usuário");
      const initial = escapeHTML(
        name.trim().charAt(0).toLocaleUpperCase("pt-BR") || "U",
      );
      const avatarUrl = String(currentUser.avatarUrl || "").trim();
      headerProfileLink.setAttribute("aria-label", `Abrir perfil de ${name}`);
      headerProfileLink.title = `Meu perfil · ${name}`;
      headerProfileLink.innerHTML = avatarUrl
        ? `<img src="${safeImageURL(avatarUrl)}" alt="" />`
        : `<span aria-hidden="true">${initial}</span>`;
    } else {
      headerProfileLink.innerHTML = "";
    }
  }
  const mobileAuthLink = $("#mobileAuthLink");
  if (mobileAuthLink)
    $("#mobileAuthLabel").textContent = currentUser
      ? "Sair / trocar de conta"
      : "Entrar";
  const profileSettingsCard = $("#profileSettingsCard");
  if (profileSettingsCard) profileSettingsCard.hidden = !currentUser;
  const settingsAccountName = $("#settingsAccountName");
  if (settingsAccountName)
    settingsAccountName.textContent = currentUser
      ? currentUser.name
      : "Gerencie seus dados pessoais e sua loja.";

  const isProducer = currentUser?.role === "producer";
  const sellerCta = $("#sellerCta");
  if (sellerCta) {
    sellerCta.classList.toggle("is-producer", isProducer);
    sellerCta.innerHTML = isProducer
      ? `<svg class="seller-store-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18l-1.5-6h-15L3 10Zm1 0v10h16V10M9 20v-6h6v6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></svg><span>Meus produtos</span>${arrowIcon}`
      : `Vender no AgriFam ${arrowIcon}`;
    sellerCta.href = isProducer
      ? "#meus-produtos"
      : "?page=produtores#seja-produtor";
  }
  const sellerCtaMobile = $("#sellerCtaMobile");
  if (sellerCtaMobile) {
    $("#sellerCtaMobileLabel").textContent = isProducer
      ? "Meus produtos"
      : "Seja um produtor";
    sellerCtaMobile.href = isProducer
      ? "#meus-produtos"
      : "?page=produtores#seja-produtor";
  }
};

const loadSession = async () => {
  let sessionError = null;
  try {
    const data = await api("/auth/me");
    currentUser = data.user;
  } catch (error) {
    currentUser = null;
    sessionError = error;
  }
  updateAuthUI();
  document.body.classList.remove("auth-gate", "auth-gate-pending");
  if (
    sessionError &&
    sessionError.status !== 401 &&
    sessionError.status !== 403
  ) {
    showToast(
      "Não foi possível confirmar sua sessão agora. Tente novamente em instantes.",
    );
  }
};

const toggleProducerFields = () => {
  const isProducer = $("#authRole").value === "producer";
  $("#authProducerFields").hidden = !isProducer;
  ["authProperty", "authLocation", "authSpecialty"].forEach((id) => {
    $(`#${id}`).required = isProducer;
  });
};

const setAuthMode = (mode) => {
  authMode = mode;
  $$(".mode-switch [data-auth-mode]").forEach((button) =>
    button.classList.toggle("active", button.dataset.authMode === mode),
  );
  $("#authNameField").hidden = mode !== "register";
  $("#authName").required = mode === "register";
  $("#authRoleField").hidden = mode !== "register";
  $("#authTitle").textContent =
    mode === "register" ? "Crie sua conta" : "Entre no AgriFam";
  $("#authSubtitle").textContent =
    mode === "register"
      ? "Compre direto de quem produz ou venda a sua produção."
      : "Acompanhe seus pedidos e descubra novidades da sua região.";
  $("#authSubmit").innerHTML =
    mode === "register" ? `Criar conta ${arrowIcon}` : `Entrar ${arrowIcon}`;
  $("#authSwitchText").innerHTML =
    mode === "register"
      ? 'Já tem conta? <a href="#" data-auth-mode="login">Entrar</a>'
      : 'Ainda não tem conta? <a href="#" data-auth-mode="register">Criar conta</a>';
  if (mode !== "register") {
    $("#authRole").value = "buyer";
  }
  $("#authGoogleDivider").hidden = !googleAuthEnabled;
  $("#googleAuthButton").hidden = !googleAuthEnabled;
  toggleProducerFields();
};

const openAuthModal = (mode = "login", presetRole = "buyer") => {
  $("#recoveryPanel").hidden = true;
  $("#authForm").hidden = false;
  $("#authGoogleDivider").hidden = !googleAuthEnabled;
  $("#googleAuthButton").hidden = !googleAuthEnabled;
  $("#authSwitchText").hidden = false;
  setAuthMode(mode);
  if (mode === "register") $("#authRole").value = presetRole;
  toggleProducerFields();
  openModal($("#authModal"));
};

$("#authModal").addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-auth-mode]");
  if (!trigger) return;
  event.preventDefault();
  setAuthMode(trigger.dataset.authMode);
});
$("#authRole").addEventListener("change", toggleProducerFields);
$("#googleAuthButton").addEventListener("click", () => {
  // Eu explico: Inicia o OAuth no servidor para o fluxo continuar funcionando mesmo se o
  // Eu explico: cliente do Supabase, carregado pela CDN, estiver indisponível no navegador.
  window.location.assign(`${API_BASE}/auth/google`);
});
$("#authForgot").addEventListener("click", (event) => {
  event.preventDefault();
  $("#authForm").hidden = true;
  $("#authGoogleDivider").hidden = true;
  $("#googleAuthButton").hidden = true;
  $("#authSwitchText").hidden = true;
  $("#recoveryPanel").hidden = false;
  $("#forgotPasswordEmail").value = $("#authEmail").value;
  $("#resetPasswordForm").hidden = true;
  $("#forgotPasswordForm").hidden = false;
  $("#forgotPasswordEmail").focus();
});

$("#recoveryBackToLogin").addEventListener("click", () => openAuthModal("login"));
$("#forgotPasswordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const result = await api("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email: $("#forgotPasswordEmail").value.trim() }),
    });
    $("#recoveryMessage").textContent = result.message;
  } catch (error) {
    showToast(error.message);
  }
});

let passwordResetToken = "";
$("#resetPasswordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = $("#resetPasswordValue").value;
  if (password !== $("#resetPasswordConfirm").value) {
    showToast("As senhas não conferem.");
    return;
  }
  try {
    const result = await api("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token: passwordResetToken, password }),
    });
    passwordResetToken = "";
    $("#resetPasswordForm").reset();
    $("#recoveryMessage").textContent = result.message;
    $("#resetPasswordForm").hidden = true;
    $("#forgotPasswordForm").hidden = false;
  } catch (error) {
    showToast(error.message);
  }
});

const switchAccount = async () => {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // Eu explico: A interface permite seguir para o login mesmo se a API de logout falhar.
  }
  currentUser = null;
  updateAuthUI();
  closeModals();
  openAuthModal("login");
  $("#authEmail").focus();
  showToast("Sessão encerrada. Entre com outra conta.");
};

$$('[href="#login"]').forEach((link) =>
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    if (currentUser) await switchAccount();
    else openAuthModal("login");
  }),
);
$("#profileLogout").addEventListener("click", switchAccount);
$("#deleteAccountButton").addEventListener("click", async () => {
  const password = $("#deleteAccountPassword").value;
  if (!password) {
    showToast("Digite sua senha para confirmar a exclusão.");
    return;
  }
  if (!window.confirm("A exclusão é permanente. Seus pedidos serão preservados sem seu email. Deseja continuar?")) return;
  try {
    const result = await api("/auth/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    $("#deleteAccountPassword").value = "";
    currentUser = null;
    updateAuthUI();
    closeModals();
    showToast(result.message || "Sua conta foi excluída.");
  } catch (error) {
    showToast(error.message);
  }
});
$$('[href="#cadastro"]').forEach((link) =>
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openAuthModal("register", "producer");
  }),
);

$("#authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;

  try {
    let data;
    if (authMode === "register") {
      const role = $("#authRole").value;
      const payload = {
        name: $("#authName").value.trim(),
        email,
        password,
        role,
      };
      if (role === "producer") {
        payload.property = $("#authProperty").value.trim();
        payload.location = $("#authLocation").value.trim();
        payload.specialty = $("#authSpecialty").value.trim();
      }
      data = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } else {
      data = await api("/auth", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    }
    currentUser = data.user;
    updateAuthUI();
    document.body.classList.remove("auth-gate", "auth-gate-pending");
    closeModals();
    event.target.reset();
    showToast(
      authMode === "register"
        ? `Bem-vindo(a) ao AgriFam, ${currentUser.name}!`
        : `Olá de novo, ${currentUser.name}!`,
    );
    loadConversations().catch(() => {});
    if (currentUser.role === "producer") await loadProducers();
  } catch (error) {
    showToast(error.message);
  }
});

const uploadImage = async (file, kind) => {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Escolha uma imagem PNG, JPG ou WebP.");
  }
  if (file.size > 3 * 1024 * 1024)
    throw new Error("A imagem deve ter no máximo 3 MB.");
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
  const endpoint = kind === "profile" ? "/perfil/imagem" : "/produtor/imagens";
  const result = await api(endpoint, {
    method: "POST",
    body: JSON.stringify({ dataUrl, kind }),
  });
  return result.image;
};

let profileAvatarPreviewUrl = null;
let clearProfileAvatar = false;

const renderProfileAvatarPreview = (imageUrl, name) => {
  const preview = $("#profileAvatarPreview");
  const initial = escapeHTML(
    (name || "A").trim().charAt(0).toLocaleUpperCase("pt-BR"),
  );
  preview.innerHTML = imageUrl
    ? `<img src="${escapeHTML(imageUrl)}" alt="" />`
    : `<span>${initial}</span>`;
};

const releaseProfileAvatarPreview = () => {
  if (profileAvatarPreviewUrl) URL.revokeObjectURL(profileAvatarPreviewUrl);
  profileAvatarPreviewUrl = null;
};

$("#profileAvatarFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    event.target.value = "";
    showToast("Escolha uma imagem PNG, JPG ou WebP.");
    return;
  }
  if (file.size > 3 * 1024 * 1024) {
    event.target.value = "";
    showToast("A imagem deve ter no máximo 3 MB.");
    return;
  }
  releaseProfileAvatarPreview();
  profileAvatarPreviewUrl = URL.createObjectURL(file);
  clearProfileAvatar = false;
  renderProfileAvatarPreview(profileAvatarPreviewUrl, currentUser?.name);
});

$("#profileAvatarRemove").addEventListener("click", () => {
  $("#profileAvatarFile").value = "";
  releaseProfileAvatarPreview();
  clearProfileAvatar = true;
  renderProfileAvatarPreview("", currentUser?.name);
});

const openProfile = async () => {
  try {
    const data = await api("/auth/me");
    currentUser = data.user;
    $("#profileName").value = data.user.name;
    $("#profileEmail").value = data.user.email;
    $("#profileCurrentPassword").value = "";
    $("#profileNewPassword").value = "";
    $("#profileAvatarFile").value = "";
    $("#profileStoreImageFile").value = "";
    clearProfileAvatar = false;
    releaseProfileAvatarPreview();
    renderProfileAvatarPreview(data.user.avatarUrl || "", data.user.name);
    const producer = data.producer;
    $("#profileStoreFields").hidden = !producer;
    if (producer) {
      $("#profileProperty").value = producer.property;
      $("#profileLocation").value = producer.location;
      $("#profileSpecialty").value = producer.specialty;
      $("#profileHistory").value = producer.history || "";
      $("#profileStoreImage").value = producer.image || "";
      $("#profileStoreImageFile").value = "";
      const paymentStatus = $("#mercadoPagoStatus");
      const paymentConnect = $("#mercadoPagoConnect");
      paymentStatus.textContent = "Verificando conexão…";
      paymentConnect.textContent = "Conectar Mercado Pago";
      try {
        const connection = await api("/pagamentos/mercadopago/status");
        paymentStatus.textContent = connection.connected
          ? "Conta do Mercado Pago conectada. Os pagamentos aprovados serão direcionados a esta loja."
          : "Conta ainda não conectada. Conecte uma conta Mercado Pago para receber pedidos pagos.";
        paymentConnect.textContent = connection.connected
          ? "Reconectar Mercado Pago"
          : "Conectar Mercado Pago";
      } catch {
        paymentStatus.textContent =
          "Não foi possível verificar a conexão do Mercado Pago agora.";
      }
    }
    openModal($("#profileModal"));
  } catch (error) {
    showToast(error.message);
  }
};

document.addEventListener("click", (event) => {
  const link = event.target.closest('[href="#perfil"]');
  if (!link) return;
  event.preventDefault();
  // Eu explico: Fecha Configurações antes de abrir o perfil para que o modal mais recente
  // Eu explico: não fique escondido atrás da janela de configurações.
  closeModals();
  openProfile();
});

$("#profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: $("#profileName").value.trim(),
    email: $("#profileEmail").value.trim(),
  };
  const currentPassword = $("#profileCurrentPassword").value;
  const newPassword = $("#profileNewPassword").value;
  if (currentPassword || newPassword) {
    payload.currentPassword = currentPassword;
    payload.newPassword = newPassword;
  }
  if (!$("#profileStoreFields").hidden) {
    payload.property = $("#profileProperty").value.trim();
    payload.location = $("#profileLocation").value.trim();
    payload.specialty = $("#profileSpecialty").value.trim();
    payload.history = $("#profileHistory").value.trim();
    payload.image = $("#profileStoreImage").value.trim();
  }
  try {
    const avatarFile = $("#profileAvatarFile").files[0];
    if (avatarFile) {
      payload.avatarUrl = await uploadImage(avatarFile, "profile");
    } else if (clearProfileAvatar) {
      payload.avatarUrl = "";
    }
    const storeFile = $("#profileStoreImageFile").files[0];
    if (storeFile) payload.image = await uploadImage(storeFile, "store");
    const data = await api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    currentUser = data.user;
    clearProfileAvatar = false;
    releaseProfileAvatarPreview();
    $("#profileCurrentPassword").value = "";
    $("#profileNewPassword").value = "";
    updateAuthUI();
    closeModals();
    await loadProducers();
    showToast("Perfil atualizado.");
  } catch (error) {
    showToast(error.message);
  }
});

const completeGoogleLogin = async () => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  let accessToken = params.get("access_token");
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const authError =
    params.get("error_description") ||
    params.get("error") ||
    url.searchParams.get("error_description");
  if (code) {
    if (!googleAuthClient) {
      url.searchParams.delete("code");
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
      showToast(
        "Configuração do login Google indisponível. Confira se a API está rodando.",
      );
      return;
    }
    try {
      const { data, error } =
        await googleAuthClient.auth.exchangeCodeForSession(code);
      if (error) throw error;
      accessToken = data.session?.access_token || null;
    } catch {
      url.searchParams.delete("code");
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
      showToast("Não foi possível concluir o login Google. Tente novamente.");
      return;
    }
  }
  if (!accessToken && !authError) return;
  url.searchParams.delete("code");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  if (authError) {
    showToast(
      "Não foi possível entrar com Google. Confira a configuração OAuth no Supabase.",
    );
    return;
  }
  try {
    const data = await api("/auth/google/callback", {
      method: "POST",
      body: JSON.stringify({ accessToken }),
    });
    currentUser = data.user;
    updateAuthUI();
    try {
      await googleAuthClient?.auth.signOut({ scope: "local" });
    } catch {
      // Eu explico: A sessão da aplicação já foi criada pelo servidor; falha ao limpar a sessão OAuth
      // Eu explico: temporária no navegador não deve desfazer o login concluído.
    }
    showToast(`Olá, ${currentUser.name}!`);
  } catch (error) {
    showToast(error.message);
  }
};

const loadGoogleAuthConfig = async () => {
  try {
    const config = await api("/auth/google/config");
    googleAuthEnabled = config.enabled;
    if (googleAuthEnabled && window.supabase?.createClient) {
      googleAuthClient = window.supabase.createClient(
        config.url,
        config.publishableKey,
        {
          auth: {
            flowType: "pkce",
            detectSessionInUrl: false,
            persistSession: true,
            autoRefreshToken: false,
          },
        },
      );
    }
  } catch {
    googleAuthEnabled = false;
    googleAuthClient = null;
  }
  $("#authGoogleDivider").hidden = !googleAuthEnabled;
  $("#googleAuthButton").hidden = !googleAuthEnabled;
};

// Eu explico: --- Meus produtos: painel do produtor (POST/PATCH/DELETE /api/produtos) ---

let myProducts = [];
let editingProductId = null;

const productForm = $("#productForm");
const productFormSubmit = $("#productFormSubmit");
const productFormCancel = $("#productFormCancel");

const populateProductCategorySelect = () => {
  const select = $("#productCategory");
  const current = select.value;
  select.innerHTML =
    '<option value="">Selecione...</option>' +
    categories
      .map(
        (category) =>
          `<option value="${escapeHTML(category.name)}">${escapeHTML(category.name)}</option>`,
      )
      .join("");
  if (current) select.value = current;
};

const resetProductForm = () => {
  productForm.reset();
  $("#productImageFile").value = "";
  editingProductId = null;
  productFormSubmit.innerHTML = `Adicionar produto ${arrowIcon}`;
  productFormCancel.hidden = true;
};

const myProductItem = (product) =>
  `<div class="my-product-item"><img src="${safeImageURL(product.image)}" alt="${escapeHTML(product.name)}"><div><h4>${escapeHTML(product.name)}</h4><small>${money(product.price)} / ${escapeHTML(product.unit)} · ${escapeHTML(product.category)}</small></div><div class="my-product-actions"><button type="button" data-edit-product="${Number(product.id)}">Editar</button><button type="button" class="my-product-delete" data-delete-product="${Number(product.id)}">Remover</button></div></div>`;

const renderMyProductsList = () => {
  $("#myProductsList").innerHTML = myProducts.length
    ? myProducts.map(myProductItem).join("")
    : '<p class="my-products-empty">Você ainda não cadastrou nenhum produto.</p>';
};

const loadMyProducts = async () => {
  try {
    myProducts = await api("/produtor/produtos");
    renderMyProductsList();
  } catch (error) {
    showToast(error.message);
  }
};

// Eu explico: Atualiza o catálogo/categorias exibidos no site depois de criar, editar ou remover
// Eu explico: um produto, para o preço/contagem não ficarem desatualizados até um F5.
const refreshCatalogAfterChange = () =>
  Promise.all([loadProducts(), loadCategories()]);

const openMyProductsModal = async () => {
  populateProductCategorySelect();
  resetProductForm();
  openModal($("#myProductsModal"));
  await loadMyProducts();
};

// Eu explico: Delegado (não um listener por elemento): o href só vira "#meus-produtos" depois que
// Eu explico: updateAuthUI() roda de forma assíncrona, então o elemento não existe com esse href
// Eu explico: ainda no momento em que o script carrega.
document.addEventListener("click", (event) => {
  const link = event.target.closest('[href="#meus-produtos"]');
  if (!link) return;
  event.preventDefault();
  openMyProductsModal();
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: $("#productName").value.trim(),
    price: Number($("#productPrice").value),
    unit: $("#productUnit").value.trim(),
    location: $("#productLocation").value.trim(),
    category: $("#productCategory").value,
    image: $("#productImage").value.trim(),
  };

  try {
    const imageFile = $("#productImageFile").files[0];
    if (imageFile) payload.image = await uploadImage(imageFile, "products");
    if (editingProductId) {
      await api(`/produtos/${editingProductId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      showToast("Produto atualizado.");
    } else {
      await api("/produtos", { method: "POST", body: JSON.stringify(payload) });
      showToast("Produto cadastrado.");
    }
    resetProductForm();
    await loadMyProducts();
    await refreshCatalogAfterChange();
  } catch (error) {
    showToast(error.message);
  }
});

productFormCancel.addEventListener("click", resetProductForm);

$("#myProductsList").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-product]");
  if (editButton) {
    const product = myProducts.find(
      (item) => item.id === Number(editButton.dataset.editProduct),
    );
    if (!product) return;
    editingProductId = product.id;
    $("#productName").value = product.name;
    $("#productPrice").value = product.price;
    $("#productUnit").value = product.unit;
    $("#productLocation").value = product.location;
    populateProductCategorySelect();
    $("#productCategory").value = product.category;
    $("#productImage").value = product.image;
    productFormSubmit.innerHTML = `Salvar alterações ${arrowIcon}`;
    productFormCancel.hidden = false;
    return;
  }

  const deleteButton = event.target.closest("[data-delete-product]");
  if (deleteButton) {
    const product = myProducts.find(
      (item) => item.id === Number(deleteButton.dataset.deleteProduct),
    );
    if (!product) return;
    if (!confirm(`Remover "${product.name}" do catálogo?`)) return;
    try {
      await api(`/produtos/${product.id}`, { method: "DELETE" });
      showToast("Produto removido do catálogo.");
      if (editingProductId === product.id) resetProductForm();
      await loadMyProducts();
      await refreshCatalogAfterChange();
    } catch (error) {
      showToast(error.message);
    }
  }
});


// Eu organizo esta seção: 7. CONVERSAS (reais via /api/conversas)


const chatDrawer = $("#chatDrawer");
const chatContactsElement = $("#chatContacts");
const chatMessages = $("#chatMessages");
const chatContactHeading = $("#chatContactHeading");
const chatSearch = $("#chatSearch");
const chatForm = $("#chatForm");

const formatChatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const otherParty = (conversation) =>
  currentUser && currentUser.id === conversation.buyer.id
    ? {
        label: conversation.producer.name,
        sub: conversation.producer.property,
        avatarUrl: conversation.producer.avatarUrl,
      }
    : {
        label: conversation.buyer.name,
        sub: "Comprador",
        avatarUrl: conversation.buyer.avatarUrl,
      };

const chatAvatarMarkup = (name, imageUrl, extraClass = "") =>
  `<span class="chat-avatar ${extraClass}">${imageUrl ? `<img src="${safeImageURL(imageUrl)}" alt="" />` : escapeHTML(name.charAt(0).toLocaleUpperCase("pt-BR"))}</span>`;

const renderConversationList = () => {
  const query = chatSearch.value.trim().toLocaleLowerCase("pt-BR");
  const visibleConversations = conversations.filter((conversation) => {
    const party = otherParty(conversation);
    const searchText = `${party.label} ${party.sub} ${conversation.lastMessage?.text || ""}`;
    return searchText.toLocaleLowerCase("pt-BR").includes(query);
  });
  chatContactsElement.innerHTML = visibleConversations.length
    ? visibleConversations
        .map((conversation) => {
          const party = otherParty(conversation);
          const lastMessage = conversation.lastMessage;
          const unreadBadge = isConversationUnread(conversation)
            ? '<span class="chat-unread-badge" aria-label="Mensagem não lida">1</span>'
            : "";
          return `<button class="chat-contact ${conversation.id === activeConversationId ? "active" : ""} ${unreadBadge ? "has-unread" : ""}" data-chat-contact="${Number(conversation.id)}" aria-pressed="${conversation.id === activeConversationId}">${chatAvatarMarkup(party.label, party.avatarUrl)}<span class="chat-contact-copy"><span class="chat-contact-top"><strong>${escapeHTML(party.label)}</strong>${unreadBadge}<time>${lastMessage ? escapeHTML(formatChatTime(lastMessage.createdAt)) : ""}</time></span><small>${escapeHTML(party.sub)}</small><span class="chat-last-message">${escapeHTML(lastMessage?.text || "Inicie a conversa")}</span></span></button>`;
        })
        .join("")
    : `<p class="chat-empty-state">${conversations.length ? "Nenhuma conversa encontrada." : "Suas conversas com produtores e clientes aparecerão aqui."}</p>`;
};

const renderMessages = (messages) => {
  const conversation = conversations.find(
    (item) => item.id === activeConversationId,
  );
  const party = conversation
    ? otherParty(conversation)
    : { label: "", avatarUrl: "" };
  chatMessages.innerHTML = messages
    .map((message) => {
      const mine = message.senderId === currentUser?.id;
      const senderName = mine ? currentUser.name : party.label;
      const senderAvatar = mine ? currentUser.avatarUrl : party.avatarUrl;
      return `<div class="chat-message-row ${mine ? "mine" : ""}">${chatAvatarMarkup(senderName, senderAvatar, "chat-message-avatar")}<div class="chat-message"><p>${escapeHTML(message.text)}</p><time datetime="${escapeHTML(message.createdAt)}">${escapeHTML(formatChatTime(message.createdAt))}</time></div></div>`;
    })
    .join("");
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

let messageLoadVersion = 0;
let chatOpenVersion = 0;
const lastRenderedChatMessageIds = new Map();
const selectConversation = async (conversationId) => {
  activeConversationId = conversationId;
  const requestVersion = ++messageLoadVersion;
  renderConversationList();
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) return;
  chatMessages.innerHTML =
    '<p class="chat-empty-state chat-loading-state" role="status">Carregando mensagens…</p>';
  chatForm.hidden = false;
  const party = otherParty(conversation);
  chatContactHeading.innerHTML = `${chatAvatarMarkup(party.label, party.avatarUrl)}<span><strong>${escapeHTML(party.label)}</strong><small>${escapeHTML(party.sub)}</small></span><span class="chat-heading-caption">Conversa direta</span>`;
  try {
    const messages = await api(`/conversas/${conversationId}/mensagens`);
    if (
      requestVersion !== messageLoadVersion ||
      activeConversationId !== conversationId
    )
      return;
    renderMessages(messages);
    lastRenderedChatMessageIds.set(
      Number(conversationId),
      Number(messages.at(-1)?.id) || 0,
    );
    const conversation = conversations.find(
      (item) => Number(item.id) === Number(conversationId),
    );
    const latestMessageId = Number(
      messages.at(-1)?.id ?? conversation?.lastMessage?.id,
    );
    if (Number.isSafeInteger(latestMessageId) && latestMessageId > 0) {
      readMessagesByConversation[String(conversationId)] = latestMessageId;
      if (chatReadUserId) {
        try {
          writeLocalJSON(
            `agrifam-chat-read:${chatReadUserId}`,
            readMessagesByConversation,
          );
        } catch {
          // Eu explico: O contador continua funcionando nesta sessão sem acesso ao armazenamento local.
        }
      }
      updateChatNotificationCount();
      renderConversationList();
    }
  } catch (error) {
    if (requestVersion !== messageLoadVersion) return;
    chatMessages.innerHTML =
      '<p class="chat-empty-state">Não foi possível carregar as mensagens.</p>';
    showToast(error.message);
  }
};

const loadConversations = async () => {
  conversations = await api("/conversas");
  renderConversationList();
  updateChatNotificationCount();
  const selectedConversation = conversations.find(
    (item) => Number(item.id) === Number(activeConversationId),
  );
  const latest = selectedConversation?.lastMessage;
  if (
    chatDrawer.classList.contains("open") &&
    selectedConversation &&
    latest &&
    Number(latest.id) >
      (lastRenderedChatMessageIds.get(Number(selectedConversation.id)) || 0)
  ) {
    await selectConversation(selectedConversation.id);
  }
};

const openChat = async (conversationId) => {
  const viewVersion = ++chatOpenVersion;
  messageLoadVersion += 1;
  document.body.classList.add("chat-open");
  $("#accessibilityPanel").hidden = true;
  $("#accessibilityTrigger").setAttribute("aria-expanded", "false");
  chatDrawer.classList.add("open");
  chatDrawer.setAttribute("aria-hidden", "false");
  $("#overlay").classList.add("open");
  chatForm.hidden = true;
  chatSearch.value = "";
  activeConversationId = null;
  chatMessages.innerHTML =
    '<p class="chat-empty-state chat-loading-state" role="status">Carregando conversas…</p>';
  chatContactHeading.innerHTML = "";

  if (!currentUser) {
    chatContactsElement.innerHTML = "";
    chatContactHeading.innerHTML = "";
    chatMessages.innerHTML =
      '<p class="chat-empty-state">Entre na sua conta para acessar suas conversas.</p>';
    return;
  }

  try {
    await loadConversations();
    if (
      viewVersion !== chatOpenVersion ||
      !chatDrawer.classList.contains("open")
    )
      return;
    const targetId = conversationId ?? conversations[0]?.id;
    if (targetId) {
      await selectConversation(targetId);
    } else {
      chatContactHeading.innerHTML = "";
      chatMessages.innerHTML =
        '<p class="chat-empty-state">Você ainda não tem conversas. Quando iniciar um contato com um produtor, ele aparecerá aqui.</p>';
    }
  } catch (error) {
    if (
      viewVersion !== chatOpenVersion ||
      !chatDrawer.classList.contains("open")
    )
      return;
    chatMessages.innerHTML =
      '<p class="chat-empty-state">Não foi possível carregar suas conversas. Tente novamente.</p>';
    showToast(error.message);
  }
};
const closeChat = () => {
  chatOpenVersion += 1;
  messageLoadVersion += 1;
  document.body.classList.remove("chat-open");
  chatDrawer.classList.remove("open");
  chatDrawer.setAttribute("aria-hidden", "true");
  $("#overlay").classList.remove("open");
  activeConversationId = null;
  chatMessages.innerHTML = "";
  chatContactHeading.innerHTML = "";
  chatForm.hidden = true;
};
$$('[data-action="chat"]').forEach((button) =>
  button.addEventListener("click", () => openChat()),
);
$("#closeChat").addEventListener("click", closeChat);
chatSearch.addEventListener("input", renderConversationList);
chatContactsElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-contact]");
  if (!button) return;
  selectConversation(Number(button.dataset.chatContact));
});
$("#chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  const conversationId = activeConversationId;
  const viewVersion = chatOpenVersion;
  if (!text || !conversationId) return;
  try {
    await api(`/conversas/${conversationId}/mensagens`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    if (
      activeConversationId !== conversationId ||
      viewVersion !== chatOpenVersion ||
      !chatDrawer.classList.contains("open")
    )
      return;
    input.value = "";
    await selectConversation(conversationId);
    if (
      viewVersion !== chatOpenVersion ||
      !chatDrawer.classList.contains("open")
    )
      return;
    await loadConversations();
  } catch (error) {
    showToast(error.message);
  }
});


// Eu explico: Inicialização


(async () => {
  const initialUrl = new URL(window.location.href);
  passwordResetToken = initialUrl.searchParams.get("reset_token") || "";
  if (passwordResetToken) {
    initialUrl.searchParams.delete("reset_token");
    window.history.replaceState(null, "", `${initialUrl.pathname}${initialUrl.search}${initialUrl.hash}`);
  }
  await loadGoogleAuthConfig();
  await completeGoogleLogin();
  await Promise.all([loadSession(), loadCategories(), loadProducers()]);
  if (passwordResetToken) {
    openAuthModal("login");
    $("#authForm").hidden = true;
    $("#authGoogleDivider").hidden = true;
    $("#googleAuthButton").hidden = true;
    $("#authSwitchText").hidden = true;
    $("#recoveryPanel").hidden = false;
    $("#forgotPasswordForm").hidden = true;
    $("#resetPasswordForm").hidden = false;
    $("#recoveryMessage").textContent = "Defina uma nova senha. O link é válido por 20 minutos e só pode ser usado uma vez.";
    $("#resetPasswordValue").focus();
  }
  await loadProducts();
  // Eu explico: "produtos disponíveis" é uma foto do catálogo no carregamento da página, não
  // Eu explico: atualiza em tempo real conforme o usuário filtra.
  const statProducts = $("#statProducts");
  if (statProducts) statProducts.textContent = products.length;
  if (currentUser) await loadConversations().catch(() => {});
  window.setInterval(() => {
    if (currentUser && document.visibilityState === "visible")
      loadConversations().catch(() => {});
  }, 30_000);
  // Eu explico: Enquanto a conversa estiver aberta, consulte as mensagens com frequência
  // Eu explico: para exibir as enviadas por outro aparelho sem fechar ou recarregar a conversa.
  let chatRefreshInFlight = false;
  window.setInterval(() => {
    if (
      !currentUser ||
      !chatDrawer.classList.contains("open") ||
      document.visibilityState !== "visible" ||
      chatRefreshInFlight
    )
      return;
    chatRefreshInFlight = true;
    loadConversations()
      .catch(() => {})
      .finally(() => {
        chatRefreshInFlight = false;
      });
  }, 2_500);
})();
