/*
 * DADOS MOCKADOS: substitua estas coleções por respostas de API quando o backend existir.
 * Contratos TypeScript para essa troca ficam em types.ts.
 * Exemplo futuro: fetch('/api/produtos').then(response => response.json()).
 */
const categories = [
  { name: 'Frutas', icon: '◒', count: '24 produtos' }, { name: 'Verduras', icon: '✣', count: '18 produtos' },
  { name: 'Legumes', icon: '◓', count: '16 produtos' }, { name: 'Grãos', icon: '▦', count: '12 produtos' },
  { name: 'Mel', icon: '⬡', count: '8 produtos' }, { name: 'Queijos', icon: '◌', count: '9 produtos' },
  { name: 'Doces', icon: '◇', count: '14 produtos' }, { name: 'Artesanato', icon: '✺', count: '11 produtos' },
  { name: 'Regionais', icon: '⌁', count: '21 produtos' }
];
const products = [
  { id: 1, name: 'Tomate Orgânico', price: 8.90, unit: 'kg', producer: 'Sítio Boa Esperança', location: 'Teresina - PI', category: 'Verduras', rating: 4.9, image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=80' },
  { id: 2, name: 'Mel Silvestre', price: 32.00, unit: '500g', producer: 'Apiário Santa Luz', location: 'União - PI', category: 'Mel', rating: 5.0, image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=700&q=80' },
  { id: 3, name: 'Queijo Artesanal', price: 28.50, unit: '500g', producer: 'Fazenda Nascente', location: 'Altos - PI', category: 'Queijos', rating: 4.8, image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=700&q=80' },
  { id: 4, name: 'Cesta de Verduras', price: 39.90, unit: 'unidade', producer: 'Horta da D. Maria', location: 'Teresina - PI', category: 'Verduras', rating: 4.9, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80' },
  { id: 5, name: 'Manga Rosa', price: 7.50, unit: 'kg', producer: 'Sítio Sabor da Terra', location: 'José de Freitas - PI', category: 'Frutas', rating: 4.7, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=700&q=80' },
  { id: 6, name: 'Doce de Caju', price: 18.00, unit: 'pote 300g', producer: 'Sabores da Vó', location: 'Teresina - PI', category: 'Doces', rating: 4.9, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80' },
  { id: 7, name: 'Arroz Vermelho', price: 14.90, unit: 'kg', producer: 'Cooperativa Raízes', location: 'Campo Maior - PI', category: 'Grãos', rating: 4.8, image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=700&q=80' },
  { id: 8, name: 'Cesto de Palha', price: 45.00, unit: 'unidade', producer: 'Mãos do Campo', location: 'Timon - MA', category: 'Artesanato', rating: 5.0, image: 'https://images.unsplash.com/photo-1595521624992-48a59aef95d3?auto=format&fit=crop&w=700&q=80' }
];
const producers = [
  { id: 1, name: 'Maria das Dores', property: 'Horta da D. Maria', location: 'Teresina - PI', specialty: 'Verduras e temperos', rating: 4.9, history: 'Há mais de 20 anos, Maria cultiva alimentos sem pressa e com respeito à terra. Sua horta abastece famílias de toda a região.', image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80' },
  { id: 2, name: 'João e Ana Luz', property: 'Apiário Santa Luz', location: 'União - PI', specialty: 'Mel e derivados', rating: 5.0, history: 'O casal encontrou nas abelhas uma forma doce de cuidar da natureza e gerar renda para a família.', image: 'https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?auto=format&fit=crop&w=800&q=80' },
  { id: 3, name: 'Seu Raimundo', property: 'Sítio Boa Esperança', location: 'Teresina - PI', specialty: 'Frutas e legumes', rating: 4.8, history: 'Raimundo conhece cada canto do seu sítio e compartilha uma produção farta, saudável e cheia de sabor.', image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80' },
  { id: 4, name: 'Coletivo Raízes', property: 'Mãos do Campo', location: 'Timon - MA', specialty: 'Artesanato regional', rating: 4.9, history: 'Um coletivo de famílias que mantém vivos os trançados, as cores e as histórias da nossa cultura.', image: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?auto=format&fit=crop&w=800&q=80' }
];
// Estado temporário do cliente. No backend, cart e favorites devem pertencer ao usuário autenticado.
let cart = JSON.parse(localStorage.getItem('agrifam-cart') || '[]');
let favorites = JSON.parse(localStorage.getItem('agrifam-favorites') || '[]');
let activeProducts = [...products];

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const showToast = message => { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400); };

// NAVBAR E CARROSSEL
const swiper = new Swiper('.hero', { loop: true, autoplay: { delay: 5500, disableOnInteraction: false }, pagination: { el: '.swiper-pagination', clickable: true }, navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }, keyboard: { enabled: true }, touchRatio: 1 });
const menuToggle = $('#menuToggle');
menuToggle.addEventListener('click', () => { const open = $('#mobileMenu').classList.toggle('open'); menuToggle.setAttribute('aria-expanded', open); menuToggle.innerHTML = `<img src="asset/icons/menu hamburger ${open ? 'close' : 'open'}.png" alt="">`; });
$$('.mobile-menu a').forEach(link => link.addEventListener('click', () => { $('#mobileMenu').classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.innerHTML = '<img src="asset/icons/menu hamburger open.png" alt="">'; }));
$$('.search-wrap input').forEach(input => input.addEventListener('input', event => { const other = event.target.id === 'searchInput' ? $('#mobileSearchInput') : $('#searchInput'); other.value = event.target.value; filterProducts(event.target.value); }));
$$('.search-wrap kbd').forEach(key => key.addEventListener('click', () => $('#searchInput').focus()));
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#searchInput').focus(); } });

// RENDERIZACAO DE CATEGORIAS E PRODUTOS
const categoryList = $('#categoryList');
categoryList.innerHTML = categories.map(category => `<button class="category" data-category="${category.name === 'Regionais' ? 'regionais' : category.name}"><span class="category-icon">${category.icon}</span><strong>${category.name}</strong><small>${category.count}</small></button>`).join('');
const categoryFilter = $('#categoryFilter');
categoryFilter.innerHTML += categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('');
const isFavorite = id => favorites.includes(id);
const productCard = product => `<article class="product-card"><div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy"><button class="favorite-button ${isFavorite(product.id) ? 'active' : ''}" data-favorite="${product.id}" aria-label="${isFavorite(product.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${isFavorite(product.id) ? '♥' : '♡'}</button></div><div class="product-info"><h3>${product.name}</h3><div class="product-meta"><span>${product.producer}</span><span>${product.location}</span></div><div class="rating">★★★★★ <span>${product.rating}</span></div><div class="product-bottom"><span class="price">${money(product.price)} <small>/ ${product.unit}</small></span><button class="add-cart" data-cart="${product.id}" aria-label="Adicionar ${product.name} ao carrinho">+</button></div></div></article>`;
const renderProducts = list => { activeProducts = list; $('#productGrid').innerHTML = list.map(productCard).join(''); $('#resultsCount').textContent = `${list.length} resultado${list.length === 1 ? '' : 's'} encontrado${list.length === 1 ? '' : 's'}`; $('#emptyState').hidden = list.length > 0; };
renderProducts(products);

// BUSCA E FILTROS
const filterProducts = term => { const category = categoryFilter.value.toLowerCase(); const query = term.toLowerCase().trim(); let result = products.filter(product => { const searchable = `${product.name} ${product.producer} ${product.category} ${product.location}`.toLowerCase(); return searchable.includes(query) && (!category || product.category.toLowerCase() === category); }); const sort = $('#sortFilter').value; if (sort === 'price-low') result.sort((a, b) => a.price - b.price); if (sort === 'rating') result.sort((a, b) => b.rating - a.rating); renderProducts(result); };
categoryList.addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; categoryFilter.value = button.dataset.category === 'regionais' ? '' : button.dataset.category; filterProducts($('.search-wrap input').value); document.querySelector('#produtos').scrollIntoView({ behavior: 'smooth' }); });
categoryFilter.addEventListener('change', () => filterProducts($('.search-wrap input').value)); $('#sortFilter').addEventListener('change', () => filterProducts($('.search-wrap input').value));
$('#clearFilters').addEventListener('click', () => { categoryFilter.value = ''; $('#sortFilter').value = 'featured'; $('#searchInput').value = ''; $('#mobileSearchInput').value = ''; renderProducts(products); });
$('#filterTrigger').addEventListener('click', () => { $('#filters').classList.add('open'); $('#overlay').classList.add('open'); }); $('#closeFilters').addEventListener('click', () => { $('#filters').classList.remove('open'); $('#overlay').classList.remove('open'); });

// FAVORITOS E CARRINHO
// Até existir uma API, localStorage simula a persistência. Depois, centralize aqui os POST/PUT/DELETE.
const saveState = () => { localStorage.setItem('agrifam-cart', JSON.stringify(cart)); localStorage.setItem('agrifam-favorites', JSON.stringify(favorites)); updateCounters(); };
const updateCounters = () => { $$('.cart-count').forEach(element => element.textContent = cart.reduce((sum, item) => sum + item.quantity, 0)); $$('.favorite-count').forEach(element => element.textContent = favorites.length); };
const renderCart = () => { const items = $('#cartItems'); if (!cart.length) { items.innerHTML = '<div class="cart-empty"><p>Seu carrinho está esperando por boas escolhas.</p><a class="text-link" href="#produtos" id="emptyCartLink">Explorar produtos →</a></div>'; } else { items.innerHTML = cart.map(item => `<div class="cart-item"><img src="${item.image}" alt=""><div><h4>${item.name}</h4><small>${money(item.price)} / ${item.unit}</small><div class="qty-controls"><button data-quantity="${item.id}" data-change="-1">−</button><span>${item.quantity}</span><button data-quantity="${item.id}" data-change="1">+</button></div><button class="remove-item" data-remove="${item.id}">Remover</button></div><strong class="cart-item-price">${money(item.price * item.quantity)}</strong></div>`).join(''); } $('#cartTotal').textContent = money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0)); updateCounters(); };
const openCart = () => { renderCart(); $('#cartDrawer').classList.add('open'); $('#cartDrawer').setAttribute('aria-hidden', 'false'); $('#overlay').classList.add('open'); };
const closeCart = () => { $('#cartDrawer').classList.remove('open'); $('#cartDrawer').setAttribute('aria-hidden', 'true'); $('#overlay').classList.remove('open'); };
document.addEventListener('click', event => { const cartButton = event.target.closest('[data-cart]'); if (cartButton) { const product = products.find(item => item.id === Number(cartButton.dataset.cart)); const existing = cart.find(item => item.id === product.id); existing ? existing.quantity++ : cart.push({ ...product, quantity: 1 }); saveState(); renderCart(); showToast(`${product.name} foi adicionado ao carrinho`); } const favoriteButton = event.target.closest('[data-favorite]'); if (favoriteButton) { const id = Number(favoriteButton.dataset.favorite); favorites = isFavorite(id) ? favorites.filter(item => item !== id) : [...favorites, id]; saveState(); renderProducts(activeProducts); showToast(isFavorite(id) ? 'Produto salvo nos favoritos' : 'Produto removido dos favoritos'); } const quantityButton = event.target.closest('[data-quantity]'); if (quantityButton) { const item = cart.find(entry => entry.id === Number(quantityButton.dataset.quantity)); item.quantity += Number(quantityButton.dataset.change); if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== item.id); saveState(); renderCart(); } const removeButton = event.target.closest('[data-remove]'); if (removeButton) { cart = cart.filter(item => item.id !== Number(removeButton.dataset.remove)); saveState(); renderCart(); } });
$$('[data-action="cart"]').forEach(button => button.addEventListener('click', openCart)); $('#closeCart').addEventListener('click', closeCart); $('#overlay').addEventListener('click', () => { closeCart(); $('#filters').classList.remove('open'); });
// Este evento sera o ponto de integracao com POST /api/pedidos no checkout real.
$('#checkoutButton').addEventListener('click', () => showToast('Checkout demonstrativo pronto para integração.')); updateCounters();

// PRODUTORES, MODAIS E LOGIN
const producerGrid = $('#producerGrid'); producerGrid.innerHTML = producers.map(producer => `<article class="producer-card"><div class="producer-photo"><img src="${producer.image}" alt="${producer.name}" loading="lazy"></div><div class="producer-info"><h3>${producer.name}</h3><p>${producer.property} · ${producer.location}</p><span class="producer-specialty">${producer.specialty} · ★ ${producer.rating}</span><button class="text-link" data-producer="${producer.id}">Ver perfil <span>→</span></button></div></article>`).join('');
const openModal = modal => { modal.classList.add('open'); $('#overlay').classList.add('open'); }; const closeModals = () => { $$('.modal').forEach(modal => modal.classList.remove('open')); $('#overlay').classList.remove('open'); };
producerGrid.addEventListener('click', event => { const button = event.target.closest('[data-producer]'); if (!button) return; const producer = producers.find(item => item.id === Number(button.dataset.producer)); $('#producerModalContent').innerHTML = `<img class="modal-producer-image" src="${producer.image}" alt="${producer.name}"><p class="eyebrow">Produtor AgriFam</p><h2 id="producerModalTitle">${producer.name}</h2><p class="modal-subtitle">${producer.property} · ${producer.location} · ★ ${producer.rating}</p><p>${producer.history}</p><div class="modal-detail"><span>Especialidade</span><strong>${producer.specialty}</strong><small>Na plataforma há 2 anos · 6 produtos disponíveis</small></div><a href="#produtos" class="button button-green" data-close-modal>Ver produtos <span>→</span></a>`; openModal($('#producerModal')); });
$$('[data-training]').forEach(button => button.addEventListener('click', () => { $('#trainingModalTitle').textContent = button.dataset.training; openModal($('#trainingModal')); })); $$('[href="#login"]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); openModal($('#authModal')); })); $$('[data-close-modal]').forEach(button => button.addEventListener('click', closeModals)); $('#overlay').addEventListener('click', closeModals); document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModals(); closeCart(); } }); $('#authForm').addEventListener('submit', event => { event.preventDefault(); closeModals(); showToast('Interface demonstrativa: autenticação será integrada futuramente.'); });
