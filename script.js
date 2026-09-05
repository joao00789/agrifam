/*
 * DADOS MOCKADOS: substitua estas coleções por respostas de API quando o backend existir.
 * Contratos TypeScript para essa troca ficam em types.ts.
 * Exemplo futuro: fetch('/api/produtos').then(response => response.json()).
 */
const categories = [
  { name: "Frutas", icon: "apple", count: "24 produtos" },
  { name: "Verduras", icon: "leaf", count: "18 produtos" },
  { name: "Legumes", icon: "carrot", count: "16 produtos" },
  { name: "Grãos", icon: "wheat", count: "12 produtos" },
  { name: "Mel", icon: "hexagon", count: "8 produtos" },
  { name: "Queijos", icon: "cheese", count: "9 produtos" },
  { name: "Doces", icon: "candy", count: "14 produtos" },
  { name: "Artesanato", icon: "palette", count: "11 produtos" },
  { name: "Regionais", icon: "map-pin", count: "21 produtos" },
];
const categoryIcons = {
  apple: '<path d="M12 20.5c-4.5 0-7-3.7-7-8.1C5 9.2 7.1 7 10 7c1.2 0 1.7.7 2 .7s.9-.7 2.4-.7c2.1 0 3.6 1.1 4.3 2.2-3.8 2.1-3.2 7.2.6 8.6-.5 1.1-1.1 2.2-1.8 3.1-1 1.4-2 2.7-3.6 2.7s-2-.9-3.7-.9-2.2.9-3.7.9-2.5-1.2-3.5-2.6Z"/><path d="M14 5.5c.7-1.1 1.8-1.8 3.2-1.9.1 1.4-.4 2.5-1.1 3.3-.8.9-2 1.6-3.2 1.5-.1-1.1.3-2.2 1.1-2.9Z"/>',
  leaf: '<path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 10-6 10-15Z"/><path d="M4 20c3-5 7-8 12-10"/>',
  carrot: '<path d="m12 10 4 9a2 2 0 0 1-1.8 2.8H9.8A2 2 0 0 1 8 19l4-9Z"/><path d="M12 10c-2-2-2-4 0-6 2 2 2 4 0 6ZM9 7C7 6 6 4 7 2c2 1 3 3 2 5ZM15 7c2-1 3-3 2-5-2 1-3 3-2 5Z"/>',
  wheat: '<path d="M12 21V5M12 8c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 13c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 18c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 8c3 0 5-2 5-5-3 0-5 2-5 5ZM12 13c3 0 5-2 5-5-3 0-5 2-5 5ZM12 18c3 0 5-2 5-5-3 0-5 2-5 5Z"/>',
  hexagon: '<path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9L12 3Z"/><path d="M8 10h8M8 14h8"/>',
  cheese: '<path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z"/><path d="M4 10c2-4 6-6 12-6l4 6M8 14h.01M14 17h.01"/>',
  candy: '<path d="m7 8-4-2v4l4 2M17 8l4-2v4l-4 2"/><path d="M7 8h10v8H7z"/><path d="M10 8v8M14 8v8"/>',
  palette: '<path d="M12 4a8 8 0 0 0 0 16h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h2a6 6 0 0 0 0-12Z"/><path d="M7 10h.01M9 7h.01M14 7h.01M17 10h.01"/>',
  "map-pin": '<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2"/>',
};
const products = [
  {
    id: 1,
    name: "Tomate Orgânico",
    price: 8.9,
    unit: "kg",
    producer: "Sítio Boa Esperança",
    location: "Teresina - PI",
    category: "Verduras",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 2,
    name: "Mel Silvestre",
    price: 32.0,
    unit: "500g",
    producer: "Apiário Santa Luz",
    location: "União - PI",
    category: "Mel",
    rating: 5.0,
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 3,
    name: "Queijo Artesanal",
    price: 28.5,
    unit: "500g",
    producer: "Fazenda Nascente",
    location: "Altos - PI",
    category: "Queijos",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 4,
    name: "Cesta de Verduras",
    price: 39.9,
    unit: "unidade",
    producer: "Horta da D. Maria",
    location: "Teresina - PI",
    category: "Verduras",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 5,
    name: "Manga Rosa",
    price: 7.5,
    unit: "kg",
    producer: "Sítio Sabor da Terra",
    location: "José de Freitas - PI",
    category: "Frutas",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 6,
    name: "Doce de Caju",
    price: 18.0,
    unit: "pote 300g",
    producer: "Sabores da Vó",
    location: "Teresina - PI",
    category: "Doces",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 7,
    name: "Arroz Vermelho",
    price: 14.9,
    unit: "kg",
    producer: "Cooperativa Raízes",
    location: "Campo Maior - PI",
    category: "Grãos",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 8,
    name: "Cesto de Palha",
    price: 45.0,
    unit: "unidade",
    producer: "Mãos do Campo",
    location: "Timon - MA",
    category: "Artesanato",
    rating: 5.0,
    image:
      "https://images.unsplash.com/photo-1595521624992-48a59aef95d3?auto=format&fit=crop&w=700&q=80",
  },
];
const producers = [
  {
    id: 1,
    name: "Maria das Dores",
    property: "Horta da D. Maria",
    location: "Teresina - PI",
    specialty: "Verduras e temperos",
    rating: 4.9,
    history:
      "Há mais de 20 anos, Maria cultiva alimentos sem pressa e com respeito à terra. Sua horta abastece famílias de toda a região.",
    image:
      "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "João e Ana Luz",
    property: "Apiário Santa Luz",
    location: "União - PI",
    specialty: "Mel e derivados",
    rating: 5.0,
    history:
      "O casal encontrou nas abelhas uma forma doce de cuidar da natureza e gerar renda para a família.",
    image:
      "https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Seu Raimundo",
    property: "Sítio Boa Esperança",
    location: "Teresina - PI",
    specialty: "Frutas e legumes",
    rating: 4.8,
    history:
      "Raimundo conhece cada canto do seu sítio e compartilha uma produção farta, saudável e cheia de sabor.",
    image:
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Coletivo Raízes",
    property: "Mãos do Campo",
    location: "Timon - MA",
    specialty: "Artesanato regional",
    rating: 4.9,
    history:
      "Um coletivo de famílias que mantém vivos os trançados, as cores e as histórias da nossa cultura.",
    image:
      "https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?auto=format&fit=crop&w=800&q=80",
  },
];
// Estado temporário do cliente. No backend, cart e favorites devem pertencer ao usuário autenticado.
let cart = JSON.parse(localStorage.getItem("agrifam-cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("agrifam-favorites") || "[]");
let activeProducts = [...products];
const chatContacts = [
  {
    id: "maria",
    name: "Maria das Dores",
    property: "Horta da D. Maria",
    status: "Online",
    avatar: "M",
    messages: [
      {
        text: "Olá! Posso ajudar com sua cesta de verduras?",
        from: "them",
        time: "10:42",
      },
    ],
  },
  {
    id: "joao",
    name: "João e Ana Luz",
    property: "Apiário Santa Luz",
    status: "Visto há 5 min",
    avatar: "J",
    messages: [
      {
        text: "Seu mel já está separado para envio.",
        from: "them",
        time: "09:18",
      },
    ],
  },
  {
    id: "suporte",
    name: "Suporte AgriFam",
    property: "Atendimento da plataforma",
    status: "Respondemos rápido",
    avatar: "A",
    messages: [
      { text: "Oi! Como podemos ajudar hoje?", from: "them", time: "Ontem" },
    ],
  },
];
let chatRole = "buyer";
let activeChat = "maria";
const savedChats = JSON.parse(localStorage.getItem("agrifam-chats") || "{}");
chatContacts.forEach((contact) => {
  if (savedChats[contact.id]) contact.messages = savedChats[contact.id];
});

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [
  ...context.querySelectorAll(selector),
];
const money = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

// NAVBAR E CARROSSEL
const swiper = new Swiper(".hero", {
  loop: true,
  autoplay: { delay: 5500, disableOnInteraction: false },
  pagination: { el: ".swiper-pagination", clickable: true },
  navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
  keyboard: { enabled: true },
  touchRatio: 1,
});
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
$$(".search-wrap input").forEach((input) =>
  input.addEventListener("input", (event) => {
    const other =
      event.target.id === "searchInput"
        ? $("#mobileSearchInput")
        : $("#searchInput");
    other.value = event.target.value;
    filterProducts(event.target.value);
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
    filterProducts(transcript);
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

// RENDERIZACAO DE CATEGORIAS E PRODUTOS
const categoryList = $("#categoryList");
categoryList.innerHTML = categories
  .map(
    (category) =>
      `<button class="category reveal-item" data-category="${category.name === "Regionais" ? "regionais" : category.name}"><svg class="category-icon" viewBox="0 0 24 24" aria-hidden="true">${categoryIcons[category.icon]}</svg><strong>${category.name}</strong><small>${category.count}</small></button>`,
  )
  .join("");
observeRevealItems(categoryList);
const categoryFilter = $("#categoryFilter");
categoryFilter.innerHTML += categories
  .map(
    (category) => `<option value="${category.name}">${category.name}</option>`,
  )
  .join("");
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
renderProducts(products);

// BUSCA E FILTROS
const filterProducts = (term) => {
  const category = categoryFilter.value.toLowerCase();
  const query = term.toLowerCase().trim();
  let result = products.filter((product) => {
    const searchable =
      `${product.name} ${product.producer} ${product.category} ${product.location}`.toLowerCase();
    return (
      searchable.includes(query) &&
      (!category || product.category.toLowerCase() === category)
    );
  });
  const sort = $("#sortFilter").value;
  if (sort === "price-low") result.sort((a, b) => a.price - b.price);
  if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
  renderProducts(result);
};
categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  categoryFilter.value =
    button.dataset.category === "regionais" ? "" : button.dataset.category;
  filterProducts($(".search-wrap input").value);
  document.querySelector("#produtos").scrollIntoView({ behavior: "smooth" });
});
categoryFilter.addEventListener("change", () =>
  filterProducts($(".search-wrap input").value),
);
$("#sortFilter").addEventListener("change", () =>
  filterProducts($(".search-wrap input").value),
);
$("#clearFilters").addEventListener("click", () => {
  categoryFilter.value = "";
  $("#sortFilter").value = "featured";
  $("#searchInput").value = "";
  $("#mobileSearchInput").value = "";
  renderProducts(products);
});
$("#filterTrigger").addEventListener("click", () => {
  $("#filters").classList.add("open");
  $("#overlay").classList.add("open");
});
$("#closeFilters").addEventListener("click", () => {
  $("#filters").classList.remove("open");
  $("#overlay").classList.remove("open");
});

// FAVORITOS E CARRINHO
// Até existir uma API, localStorage simula a persistência. Depois, centralize aqui os POST/PUT/DELETE.
const saveState = () => {
  localStorage.setItem("agrifam-cart", JSON.stringify(cart));
  localStorage.setItem("agrifam-favorites", JSON.stringify(favorites));
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
    const product = products.find(
      (item) => item.id === Number(cartButton.dataset.cart),
    );
    const existing = cart.find((item) => item.id === product.id);
    existing ? existing.quantity++ : cart.push({ ...product, quantity: 1 });
    saveState();
    renderCart();
    showToast(`${product.name} foi adicionado ao carrinho`);
  }
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const id = Number(favoriteButton.dataset.favorite);
    favorites = isFavorite(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    saveState();
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
    saveState();
    renderCart();
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart = cart.filter(
      (item) => item.id !== Number(removeButton.dataset.remove),
    );
    saveState();
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
// Este evento sera o ponto de integracao com POST /api/pedidos no checkout real.
$("#checkoutButton").addEventListener("click", () =>
  showToast("Checkout demonstrativo pronto para integração."),
);
updateCounters();

// PRODUTORES, MODAIS E LOGIN
const producerGrid = $("#producerGrid");
producerGrid.innerHTML = producers
  .map(
    (producer) =>
      `<article class="producer-card reveal-item"><div class="producer-photo"><img src="${producer.image}" alt="${producer.name}" loading="lazy"></div><div class="producer-info"><h3>${producer.name}</h3><p>${producer.property} · ${producer.location}</p><span class="producer-specialty">${producer.specialty} · ★ ${producer.rating}</span><button class="text-link" data-producer="${producer.id}">Ver perfil <span>→</span></button></div></article>`,
  )
  .join("");
observeRevealItems(producerGrid);
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
  $("#producerModalContent").innerHTML =
    `<img class="modal-producer-image" src="${producer.image}" alt="${producer.name}"><p class="eyebrow">Produtor AgriFam</p><h2 id="producerModalTitle">${producer.name}</h2><p class="modal-subtitle">${producer.property} · ${producer.location} · ★ ${producer.rating}</p><p>${producer.history}</p><div class="modal-detail"><span>Especialidade</span><strong>${producer.specialty}</strong><small>Na plataforma há 2 anos · 6 produtos disponíveis</small></div><a href="#produtos" class="button button-green" data-close-modal>Ver produtos <span>→</span></a>`;
  openModal($("#producerModal"));
});
$$("[data-training]").forEach((button) =>
  button.addEventListener("click", () => {
    $("#trainingModalTitle").textContent = button.dataset.training;
    openModal($("#trainingModal"));
  }),
);
$$('[href="#login"]').forEach((link) =>
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openModal($("#authModal"));
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
$("#authForm").addEventListener("submit", (event) => {
  event.preventDefault();
  closeModals();
  showToast(
    "Interface demonstrativa: autenticação será integrada futuramente.",
  );
});

// CHAT: substitua o estado local por GET/POST /api/conversas na integração do backend.
const chatDrawer = $("#chatDrawer");
const chatContactsElement = $("#chatContacts");
const chatMessages = $("#chatMessages");
const chatContactHeading = $("#chatContactHeading");
const renderChat = () => {
  const contact = chatContacts.find((item) => item.id === activeChat);
  chatContactsElement.innerHTML = chatContacts
    .map(
      (item) =>
        `<button class="chat-contact ${item.id === activeChat ? "active" : ""}" data-chat-contact="${item.id}"><span class="chat-avatar">${item.avatar}</span><span><strong>${item.name}</strong><small>${item.property}</small></span></button>`,
    )
    .join("");
  chatContactHeading.innerHTML = `<span class="chat-avatar">${contact.avatar}</span><span><strong>${contact.name}</strong><small>${chatRole === "buyer" ? contact.status : "Disponível para atender compradores"}</small></span>`;
  chatMessages.innerHTML = contact.messages
    .map(
      (message) =>
        `<div class="chat-message ${message.from === "me" ? "mine" : ""}"><p>${message.text}</p><small>${message.time}</small></div>`,
    )
    .join("");
  chatMessages.scrollTop = chatMessages.scrollHeight;
};
const openChat = () => {
  renderChat();
  chatDrawer.classList.add("open");
  chatDrawer.setAttribute("aria-hidden", "false");
  $("#overlay").classList.add("open");
};
const closeChat = () => {
  chatDrawer.classList.remove("open");
  chatDrawer.setAttribute("aria-hidden", "true");
  $("#overlay").classList.remove("open");
};
$$('[data-action="chat"]').forEach((button) =>
  button.addEventListener("click", openChat),
);
$("#closeChat").addEventListener("click", closeChat);
chatContactsElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-contact]");
  if (!button) return;
  activeChat = button.dataset.chatContact;
  renderChat();
});
$$("[data-chat-role]").forEach((button) =>
  button.addEventListener("click", () => {
    chatRole = button.dataset.chatRole;
    $$("[data-chat-role]").forEach((item) =>
      item.classList.toggle("active", item === button),
    );
    renderChat();
  }),
);
$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  const contact = chatContacts.find((item) => item.id === activeChat);
  contact.messages.push({
    text,
    from: "me",
    time: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  localStorage.setItem(
    "agrifam-chats",
    JSON.stringify(
      Object.fromEntries(chatContacts.map((item) => [item.id, item.messages])),
    ),
  );
  input.value = "";
  renderChat();
  showToast("Mensagem enviada");
});
