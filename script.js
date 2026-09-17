/*
 * AgriFam - comportamento da interface
 *
 * Ordem dos blocos:
 * 1. API, estado local e utilitários compartilhados
 * 2. Navegação, busca e carrossel
 * 3. Catálogo, categorias e filtros (dados reais via API)
 * 4. Favoritos
 * 5. Carrinho e checkout (checkout real via POST /api/pedidos)
 * 6. Produtores e autenticação (dados e sessão reais via API)
 * 7. Conversas (reais via /api/conversas)
 *
 * O carrinho e os favoritos continuam guardados no localStorage: dá para navegar e
 * montar o carrinho sem estar logado. Fazer login só é exigido no checkout e no chat,
 * que dependem de saber quem é o usuário.
 */

// -----------------------------------------------------------------------------
// 1. API, ESTADO LOCAL E UTILITÁRIOS COMPARTILHADOS
// -----------------------------------------------------------------------------

const API_BASE = "http://localhost:3333/api";

const api = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new Error(body?.error || "Não foi possível completar a ação.");
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

// Estado do cliente. Carrinho e favoritos continuam locais (funcionam sem login);
// usuário, catálogo e conversas vêm do backend.
let currentUser = null;
let categories = [];
let products = [];
let activeProducts = [];
let producers = [];
let cart = JSON.parse(localStorage.getItem("agrifam-cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("agrifam-favorites") || "[]");
let conversations = [];
let activeConversationId = null;
let authMode = "login";

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [
  ...context.querySelectorAll(selector),
];
const money = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const showToast = (message) => {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
};

// Revela cards quando entram na viewport, sem atrasar o conteúdo ou a busca.
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

// -----------------------------------------------------------------------------
// 2. NAVEGAÇÃO, BUSCA E CARROSSEL
// -----------------------------------------------------------------------------

const swiper = new Swiper(".hero", {
  loop: true,
  autoplay: { delay: 5500, disableOnInteraction: false },
  pagination: { el: ".swiper-pagination", clickable: true },
  navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
  keyboard: { enabled: true },
  touchRatio: 1,
});

const heroShader = document.querySelector("#heroShader");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
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
menuToggle.addEventListener("click", () => {
  const open = $("#mobileMenu").classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open);
  menuToggle.innerHTML = `<img src="asset/icons/menu hamburger ${open ? "close" : "open"}.png" alt="">`;
});
$$(".mobile-menu a").forEach((link) =>
  link.addEventListener("click", () => {
    $("#mobileMenu").classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.innerHTML =
      '<img src="asset/icons/menu hamburger open.png" alt="">';
  }),
);
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
  // A busca por voz é opcional: navegadores sem Web Speech continuam usando a busca normal.
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

// -----------------------------------------------------------------------------
// 3. CATÁLOGO, CATEGORIAS E FILTROS (dados reais via API)
// -----------------------------------------------------------------------------

const categoryList = $("#categoryList");
const categoryFilter = $("#categoryFilter");

const renderCategories = () => {
  categoryList.innerHTML = categories
    .map(
      // "Regionais" funciona como atalho para "ver tudo": não filtra por categoria.
      (category) =>
        `<button class="category reveal-item" data-category="${category.name === "Regionais" ? "" : category.name}"><svg class="category-icon" viewBox="0 0 24 24" aria-hidden="true">${categoryIcons[category.icon] || ""}</svg><strong>${category.name}</strong><small>${category.count}</small></button>`,
    )
    .join("");
  observeRevealItems(categoryList);

  categoryFilter.innerHTML =
    '<option value="">Todas as categorias</option>' +
    categories
      .map((category) => `<option value="${category.name}">${category.name}</option>`)
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

const isFavorite = (id) => favorites.includes(id);
const productCard = (product) =>
  `<article class="product-card reveal-item"><div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy"><button class="favorite-button ${isFavorite(product.id) ? "active" : ""}" data-favorite="${product.id}" aria-label="${isFavorite(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566" /></svg></button></div><div class="product-info"><h3>${product.name}</h3><div class="product-meta"><span>${product.producer}</span><span>${product.location}</span></div><div class="rating">★★★★★ <span>${product.rating}</span></div><div class="product-bottom"><span class="price">${money(product.price)} <small>/ ${product.unit}</small></span><button class="add-cart" data-cart="${product.id}" aria-label="Adicionar ${product.name} ao carrinho"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-7-7h14" /></svg></button></div></div></article>`;
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
  categoryFilter.value = button.dataset.category;
  loadProducts();
  document.querySelector("#produtos").scrollIntoView({ behavior: "smooth" });
});
categoryFilter.addEventListener("change", loadProducts);
$("#sortFilter").addEventListener("change", loadProducts);
$("#clearFilters").addEventListener("click", () => {
  categoryFilter.value = "";
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

// -----------------------------------------------------------------------------
// 4. FAVORITOS
// -----------------------------------------------------------------------------

// Favoritos continuam só no localStorage: não há endpoint de favoritos no backend
// (fora do escopo atual), então isso é uma preferência só deste navegador.
const saveFavorites = () => {
  localStorage.setItem("agrifam-favorites", JSON.stringify(favorites));
  updateCounters();
};

// -----------------------------------------------------------------------------
// 5. CARRINHO E CHECKOUT
// -----------------------------------------------------------------------------

// O carrinho continua no localStorage — dá para montar a sacola sem estar logado.
// Só o checkout (POST /api/pedidos) exige sessão.
const saveCart = () => {
  localStorage.setItem("agrifam-cart", JSON.stringify(cart));
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
  $$(".favorite-count").forEach(
    (element) => (element.textContent = favorites.length),
  );
};
const renderCart = () => {
  const items = $("#cartItems");
  if (!cart.length) {
    items.innerHTML =
      '<div class="cart-empty"><p>Seu carrinho está esperando por boas escolhas.</p><a class="text-link" href="#produtos" id="emptyCartLink">Explorar produtos →</a></div>';
  } else {
    items.innerHTML = cart
      .map(
        (item) =>
          `<div class="cart-item"><img src="${item.image}" alt=""><div><h4>${item.name}</h4><small>${money(item.price)} / ${item.unit}</small><div class="qty-controls"><button data-quantity="${item.id}" data-change="-1">−</button><span>${item.quantity}</span><button data-quantity="${item.id}" data-change="1">+</button></div><button class="remove-item" data-remove="${item.id}">Remover</button></div><strong class="cart-item-price">${money(item.price * item.quantity)}</strong></div>`,
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
  const cartButton = event.target.closest("[data-cart]");
  if (cartButton) {
    const product = activeProducts.find(
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
    const order = await api("/pedidos", {
      method: "POST",
      body: JSON.stringify({
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      }),
    });
    cart = [];
    saveCart();
    renderCart();
    closeCart();
    showToast(`Pedido #${order.id} confirmado! Total: ${money(order.total)}`);
  } catch (error) {
    showToast(error.message);
  }
});
updateCounters();

// -----------------------------------------------------------------------------
// 6. PRODUTORES E AUTENTICAÇÃO (dados e sessão reais via API)
// -----------------------------------------------------------------------------

const producerGrid = $("#producerGrid");

const producerCard = (producer) =>
  `<article class="producer-card reveal-item"><div class="producer-photo"><img src="${producer.image}" alt="${producer.name}" loading="lazy"></div><div class="producer-info"><h3>${producer.name}</h3><p>${producer.property} · ${producer.location}</p><span class="producer-specialty">${producer.specialty} · ★ ${producer.rating}</span><button class="text-link" data-producer="${producer.id}">Ver perfil <span>→</span></button></div></article>`;

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
producerGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-producer]");
  if (!button) return;
  const producer = producers.find(
    (item) => item.id === Number(button.dataset.producer),
  );
  if (!producer) return;
  const productCount = products.filter((item) => item.producer === producer.property).length;
  $("#producerModalContent").innerHTML =
    `<img class="modal-producer-image" src="${producer.image}" alt="${producer.name}"><p class="eyebrow">Produtor AgriFam</p><h2 id="producerModalTitle">${producer.name}</h2><p class="modal-subtitle">${producer.property} · ${producer.location} · ★ ${producer.rating}</p><p>${producer.history || "Este produtor ainda não contou sua história."}</p><div class="modal-detail"><span>Especialidade</span><strong>${producer.specialty}</strong><small>${productCount} produto${productCount === 1 ? "" : "s"} ${productCount === 1 ? "disponível" : "disponíveis"}</small></div><div class="modal-actions"><a href="#produtos" class="button button-green" data-close-modal>Ver produtos <span>→</span></a><button class="button button-light" type="button" data-message-producer="${producer.id}">Enviar mensagem</button></div>`;
  openModal($("#producerModal"));
});
$$("[data-training]").forEach((button) =>
  button.addEventListener("click", () => {
    $("#trainingModalTitle").textContent = button.dataset.training;
    openModal($("#trainingModal"));
  }),
);
$$("[data-close-modal]").forEach((button) =>
  button.addEventListener("click", closeModals),
);
$("#overlay").addEventListener("click", closeModals);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModals();
    closeCart();
    closeChat();
  }
});

// Envia mensagem a um produtor a partir do modal de perfil (botão inserido acima).
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
      body: JSON.stringify({ producerId: Number(button.dataset.messageProducer) }),
    });
    closeModals();
    await openChat(conversation.id);
  } catch (error) {
    showToast(error.message);
  }
});

// --- Autenticação: login e cadastro (com perfil de produtor) reais ---

const updateAuthUI = () => {
  $$('.login-link').forEach((link) => {
    // Só "Sair" (sem o nome): um nome longo quebra o layout do menu do cabeçalho.
    link.textContent = currentUser ? "Sair" : "Entrar";
  });

  const isProducer = currentUser?.role === "producer";
  const sellerCta = $("#sellerCta");
  if (sellerCta) {
    sellerCta.innerHTML = isProducer ? "Meus produtos" : 'Vender no AgriFam <span>↗</span>';
    sellerCta.href = isProducer ? "#meus-produtos" : "#seja-produtor";
  }
  const sellerCtaMobile = $("#sellerCtaMobile");
  if (sellerCtaMobile) {
    sellerCtaMobile.textContent = isProducer ? "Meus produtos" : "Seja um produtor";
    sellerCtaMobile.href = isProducer ? "#meus-produtos" : "#seja-produtor";
  }
};

const loadSession = async () => {
  try {
    const data = await api("/auth/me");
    currentUser = data.user;
  } catch {
    currentUser = null;
  }
  updateAuthUI();
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
  $("#authTitle").textContent = mode === "register" ? "Crie sua conta" : "Entre no AgriFam";
  $("#authSubtitle").textContent =
    mode === "register"
      ? "Compre direto de quem produz ou venda a sua produção."
      : "Acompanhe seus pedidos e descubra novidades da sua região.";
  $("#authSubmit").innerHTML =
    mode === "register" ? "Criar conta <span>→</span>" : "Entrar <span>→</span>";
  $("#authSwitchText").innerHTML =
    mode === "register"
      ? 'Já tem conta? <a href="#" data-auth-mode="login">Entrar</a>'
      : 'Ainda não tem conta? <a href="#" data-auth-mode="register">Criar conta</a>';
  if (mode !== "register") {
    $("#authRole").value = "buyer";
  }
  toggleProducerFields();
};

const openAuthModal = (mode = "login", presetRole = "buyer") => {
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
$("#authForgot").addEventListener("click", (event) => {
  event.preventDefault();
  showToast("Recuperação de senha ainda não está disponível.");
});

$$('[href="#login"]').forEach((link) =>
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    if (currentUser) {
      try {
        await api("/auth/logout", { method: "POST" });
      } catch {
        // Mesmo se a chamada falhar, limpamos a sessão local.
      }
      currentUser = null;
      updateAuthUI();
      showToast("Sessão encerrada.");
    } else {
      openAuthModal("login");
    }
  }),
);
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
      const payload = { name: $("#authName").value.trim(), email, password, role };
      if (role === "producer") {
        payload.property = $("#authProperty").value.trim();
        payload.location = $("#authLocation").value.trim();
        payload.specialty = $("#authSpecialty").value.trim();
      }
      data = await api("/auth/register", { method: "POST", body: JSON.stringify(payload) });
    } else {
      data = await api("/auth", { method: "POST", body: JSON.stringify({ email, password }) });
    }
    currentUser = data.user;
    updateAuthUI();
    closeModals();
    event.target.reset();
    showToast(
      authMode === "register"
        ? `Bem-vindo(a) ao AgriFam, ${currentUser.name}!`
        : `Olá de novo, ${currentUser.name}!`,
    );
    if (currentUser.role === "producer") await loadProducers();
  } catch (error) {
    showToast(error.message);
  }
});

// --- Meus produtos: painel do produtor (POST/PATCH/DELETE /api/produtos) ---

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
    categories.map((category) => `<option value="${category.name}">${category.name}</option>`).join("");
  if (current) select.value = current;
};

const resetProductForm = () => {
  productForm.reset();
  editingProductId = null;
  productFormSubmit.innerHTML = "Adicionar produto <span>→</span>";
  productFormCancel.hidden = true;
};

const myProductItem = (product) =>
  `<div class="my-product-item"><img src="${product.image}" alt="${product.name}"><div><h4>${product.name}</h4><small>${money(product.price)} / ${product.unit} · ${product.category}</small></div><div class="my-product-actions"><button type="button" data-edit-product="${product.id}">Editar</button><button type="button" class="my-product-delete" data-delete-product="${product.id}">Remover</button></div></div>`;

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

// Atualiza o catálogo/categorias exibidos no site depois de criar, editar ou remover
// um produto, para o preço/contagem não ficarem desatualizados até um F5.
const refreshCatalogAfterChange = () => Promise.all([loadProducts(), loadCategories()]);

const openMyProductsModal = async () => {
  populateProductCategorySelect();
  resetProductForm();
  openModal($("#myProductsModal"));
  await loadMyProducts();
};

// Delegado (não um listener por elemento): o href só vira "#meus-produtos" depois que
// updateAuthUI() roda de forma assíncrona, então o elemento não existe com esse href
// ainda no momento em que o script carrega.
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
    if (editingProductId) {
      await api(`/produtos/${editingProductId}`, { method: "PATCH", body: JSON.stringify(payload) });
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
    const product = myProducts.find((item) => item.id === Number(editButton.dataset.editProduct));
    if (!product) return;
    editingProductId = product.id;
    $("#productName").value = product.name;
    $("#productPrice").value = product.price;
    $("#productUnit").value = product.unit;
    $("#productLocation").value = product.location;
    populateProductCategorySelect();
    $("#productCategory").value = product.category;
    $("#productImage").value = product.image;
    productFormSubmit.innerHTML = "Salvar alterações <span>→</span>";
    productFormCancel.hidden = false;
    return;
  }

  const deleteButton = event.target.closest("[data-delete-product]");
  if (deleteButton) {
    const product = myProducts.find((item) => item.id === Number(deleteButton.dataset.deleteProduct));
    if (!product) return;
    if (!confirm(`Remover "${product.name}" do catálogo?`)) return;
    try {
      await api(`/produtos/${product.id}`, { method: "DELETE" });
      showToast("Produto removido.");
      if (editingProductId === product.id) resetProductForm();
      await loadMyProducts();
      await refreshCatalogAfterChange();
    } catch (error) {
      showToast(error.message);
    }
  }
});

// -----------------------------------------------------------------------------
// 7. CONVERSAS (reais via /api/conversas)
// -----------------------------------------------------------------------------

const chatDrawer = $("#chatDrawer");
const chatContactsElement = $("#chatContacts");
const chatMessages = $("#chatMessages");
const chatContactHeading = $("#chatContactHeading");

const otherParty = (conversation) =>
  currentUser && currentUser.id === conversation.buyer.id
    ? { label: conversation.producer.name, sub: conversation.producer.property }
    : { label: conversation.buyer.name, sub: "Comprador" };

const renderConversationList = () => {
  chatContactsElement.innerHTML = conversations.length
    ? conversations
        .map((conversation) => {
          const party = otherParty(conversation);
          return `<button class="chat-contact ${conversation.id === activeConversationId ? "active" : ""}" data-chat-contact="${conversation.id}"><span class="chat-avatar">${party.label.charAt(0)}</span><span><strong>${party.label}</strong><small>${party.sub}</small></span></button>`;
        })
        .join("")
    : "<p>Nenhuma conversa ainda. Envie uma mensagem a partir do perfil de um produtor.</p>";
};

const renderMessages = (messages) => {
  chatMessages.innerHTML = messages
    .map(
      (message) =>
        `<div class="chat-message ${message.senderId === currentUser?.id ? "mine" : ""}"><p>${message.text}</p><small>${message.createdAt}</small></div>`,
    )
    .join("");
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

const selectConversation = async (conversationId) => {
  activeConversationId = conversationId;
  renderConversationList();
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) return;
  const party = otherParty(conversation);
  chatContactHeading.innerHTML = `<span class="chat-avatar">${party.label.charAt(0)}</span><span><strong>${party.label}</strong><small>${party.sub}</small></span>`;
  try {
    const messages = await api(`/conversas/${conversationId}/mensagens`);
    renderMessages(messages);
  } catch (error) {
    showToast(error.message);
  }
};

const loadConversations = async () => {
  conversations = await api("/conversas");
  renderConversationList();
};

const openChat = async (conversationId) => {
  chatDrawer.classList.add("open");
  chatDrawer.setAttribute("aria-hidden", "false");
  $("#overlay").classList.add("open");

  if (!currentUser) {
    chatContactsElement.innerHTML = "";
    chatContactHeading.innerHTML = "";
    chatMessages.innerHTML = "<p>Entre na sua conta para ver suas conversas.</p>";
    return;
  }

  try {
    await loadConversations();
    const targetId = conversationId ?? conversations[0]?.id;
    if (targetId) {
      await selectConversation(targetId);
    } else {
      chatContactHeading.innerHTML = "";
      chatMessages.innerHTML = "<p>Nenhuma conversa ainda.</p>";
    }
  } catch (error) {
    showToast(error.message);
  }
};
const closeChat = () => {
  chatDrawer.classList.remove("open");
  chatDrawer.setAttribute("aria-hidden", "true");
  $("#overlay").classList.remove("open");
};
$$('[data-action="chat"]').forEach((button) =>
  button.addEventListener("click", () => openChat()),
);
$("#closeChat").addEventListener("click", closeChat);
chatContactsElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-contact]");
  if (!button) return;
  selectConversation(Number(button.dataset.chatContact));
});
$("#chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text || !activeConversationId) return;
  try {
    await api(`/conversas/${activeConversationId}/mensagens`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    input.value = "";
    await selectConversation(activeConversationId);
    await loadConversations();
  } catch (error) {
    showToast(error.message);
  }
});

// -----------------------------------------------------------------------------
// Inicialização
// -----------------------------------------------------------------------------

(async () => {
  await Promise.all([loadSession(), loadCategories(), loadProducers()]);
  await loadProducts();
  // "produtos disponíveis" é uma foto do catálogo no carregamento da página, não
  // atualiza em tempo real conforme o usuário filtra.
  const statProducts = $("#statProducts");
  if (statProducts) statProducts.textContent = products.length;
})();
