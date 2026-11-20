const PRODUCTS = [
  { id: 'blusa-linho', name: 'Blusa Linho Serena', category: 'ROUPAS', price: 129.9, image: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=700&q=85', alt: 'Blusa leve em tom neutro', tag: 'MAIS AMADO' },
  { id: 'bolsa-nude', name: 'Bolsa Aura Nude', category: 'ACESSÓRIOS', price: 189.9, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85', alt: 'Bolsa feminina em tom neutro', tag: 'NOVO' },
  { id: 'vestido-sol', name: 'Vestido Sol de Verão', category: 'ROUPAS', price: 219.9, image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=700&q=85', alt: 'Vestido feminino elegante', tag: 'EDIÇÃO L&A' },
  { id: 'colar-dourado', name: 'Colar Elo Dourado', category: 'ACESSÓRIOS', price: 79.9, image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=85', alt: 'Colar dourado delicado', tag: 'FEITO PARA VOCÊ' }
];
const FREE_SHIPPING_FROM = 299;
let cart = loadCart();
let shipping = null;
let toastTimer;
const $ = (selector) => document.querySelector(selector);
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const subtotal = () => cart.reduce((sum, item) => sum + product(item.id).price * item.quantity, 0);
const product = (id) => PRODUCTS.find((item) => item.id === id);
const cartQuantity = () => cart.reduce((sum, item) => sum + item.quantity, 0);
const escapeHTML = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem('la-moda-cart') || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => product(item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch { return []; }
}
function saveCart() { localStorage.setItem('la-moda-cart', JSON.stringify(cart)); }
function renderProducts() {
  $('#product-grid').innerHTML = PRODUCTS.map((item) => `<article class="product-card"><div class="product-image"><img src="${item.image}" alt="${escapeHTML(item.alt)}" loading="lazy"><span class="product-tag">${escapeHTML(item.tag)}</span><button class="add-button" type="button" data-add="${item.id}">Adicionar à sacola +</button></div><div class="product-info"><h3>${escapeHTML(item.name)}</h3><p>${item.category}</p><strong class="product-price">${money(item.price)}</strong></div></article>`).join('');
}
function renderCart() {
  $('#cart-count').textContent = cartQuantity();
  $('#cart-empty').hidden = cart.length > 0;
  $('#cart-footer').hidden = cart.length === 0;
  $('#cart-items').innerHTML = cart.map((entry) => { const item = product(entry.id); return `<article class="cart-item"><img class="cart-thumb" src="${item.image}" alt="${escapeHTML(item.alt)}"><div><h3>${escapeHTML(item.name)}</h3><p>${money(item.price)}</p><div class="quantity-control"><button type="button" data-quantity="${item.id}" data-delta="-1" aria-label="Diminuir quantidade">−</button><span>${entry.quantity}</span><button type="button" data-quantity="${item.id}" data-delta="1" aria-label="Aumentar quantidade">+</button></div></div><button class="remove-item" type="button" data-remove="${item.id}">Remover</button></article>`; }).join('');
  $('#cart-subtotal').textContent = money(subtotal());
  $('#cart-shipping').textContent = shipping ? (subtotal() >= FREE_SHIPPING_FROM ? 'Grátis' : money(shipping.fee)) : 'Calcule pelo CEP';
  $('#cart-total').textContent = money(subtotal() + (subtotal() >= FREE_SHIPPING_FROM ? 0 : shipping?.fee || 0));
  saveCart();
}
function openCart() { $('#overlay').hidden = false; $('#cart-drawer').classList.add('is-open'); $('#cart-drawer').setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll'); }
function closeCart() { $('#overlay').hidden = true; $('#cart-drawer').classList.remove('is-open'); $('#cart-drawer').setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); }
function notify(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400); }
function formatZip(value) { const digits = value.replace(/\D/g, '').slice(0, 8); return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits; }
function estimateShipping(zip) {
  const digits = zip.replace(/\D/g, '');
  // Valores ilustrativos por faixa de CEP; não são cotação de transportadora.
  const first = Number(digits[0]);
  const fee = first <= 2 ? 14.9 : first <= 5 ? 19.9 : first <= 7 ? 24.9 : 29.9;
  return { fee, region: first <= 2 ? 'Sudeste' : first <= 5 ? 'Nordeste' : first <= 7 ? 'Norte e Centro-Oeste' : 'Sul' };
}
async function lookupZip(zip, feedback, addressTarget) {
  const digits = zip.replace(/\D/g, '');
  feedback.className = 'zip-feedback';
  if (!/^\d{8}$/.test(digits)) { feedback.textContent = 'Digite um CEP válido com 8 números.'; feedback.classList.add('error'); return false; }
  feedback.textContent = 'Consultando CEP…';
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) throw new Error('Não foi possível consultar o CEP.');
    const data = await response.json();
    if (data.erro) { feedback.textContent = 'CEP não encontrado. Confira os números.'; feedback.classList.add('error'); return false; }
    shipping = estimateShipping(digits);
    const amount = subtotal() >= FREE_SHIPPING_FROM ? 'Frete grátis para este pedido!' : `Frete estimado para ${shipping.region}: ${money(shipping.fee)}.`;
    feedback.textContent = amount;
    feedback.classList.add('success');
    if (addressTarget) { addressTarget.innerHTML = `<strong>${escapeHTML(data.logradouro || 'Endereço')}</strong>${data.bairro ? `, ${escapeHTML(data.bairro)}` : ''}<br>${escapeHTML(data.localidade)} — ${escapeHTML(data.uf)}${data.complemento ? `<br>${escapeHTML(data.complemento)}` : ''}`; addressTarget.hidden = false; }
    renderCart();
    if (!$('#checkout-screen').hidden) renderCheckout();
    return true;
  } catch {
    feedback.textContent = 'Não foi possível consultar agora. Tente novamente.';
    feedback.classList.add('error');
    return false;
  }
}
function renderCheckout() {
  $('#checkout-items').innerHTML = cart.map((entry) => { const item = product(entry.id); return `<div class="summary-product"><img src="${item.image}" alt=""><div><strong>${escapeHTML(item.name)}</strong><small>Qtd.: ${entry.quantity}</small></div><span>${money(item.price * entry.quantity)}</span></div>`; }).join('');
  $('#checkout-subtotal').textContent = money(subtotal());
  $('#checkout-shipping').textContent = shipping ? (subtotal() >= FREE_SHIPPING_FROM ? 'Grátis' : money(shipping.fee)) : 'A confirmar';
  $('#checkout-total').textContent = money(subtotal() + (subtotal() >= FREE_SHIPPING_FROM ? 0 : shipping?.fee || 0));
  const options = Array.from({ length: 12 }, (_, index) => `<option value="${index + 1}">${index + 1}x de ${money((subtotal() + (subtotal() >= FREE_SHIPPING_FROM ? 0 : shipping?.fee || 0)) / (index + 1))}${index === 0 ? ' — à vista' : ' sem juros (simulação)'}</option>`).join('');
  $('#installments').innerHTML = options;
  updatePayment();
}
function updatePayment() {
  const method = document.querySelector('input[name="payment"]:checked')?.value || 'pix';
  $('#installments-wrap').hidden = method !== 'credit';
  const total = subtotal() + (subtotal() >= FREE_SHIPPING_FROM ? 0 : shipping?.fee || 0);
  if (method === 'pix') $('#payment-info').textContent = 'Pix selecionado. No pagamento real, o QR Code ou código Pix deve ser gerado pelo provedor de pagamentos.';
  else if (method === 'debit') $('#payment-info').textContent = 'Cartão de débito selecionado. A integração com um provedor de pagamentos é necessária para processar a transação.';
  else $('#payment-info').textContent = `Parcelamento demonstrativo: ${$('#installments').value || 1}x de ${money(total / Number($('#installments').value || 1))}.`;
  $('#installment-summary').textContent = `Total demonstrativo: ${money(total)}. As parcelas são exibidas sem juros apenas para prévia.`;
}
function goToCheckout() {
  if (!cart.length) return;
  closeCart();
  $('#checkout-screen').hidden = false;
  document.querySelector('main').hidden = true;
  document.querySelector('.site-header').hidden = true;
  document.querySelector('.site-footer').hidden = true;
  window.scrollTo(0, 0);
  renderCheckout();
}
function returnToShop() {
  $('#checkout-screen').hidden = true;
  document.querySelector('main').hidden = false;
  document.querySelector('.site-header').hidden = false;
  document.querySelector('.site-footer').hidden = false;
  window.scrollTo(0, 0);
}
function placeOrder() {
  if (!cart.length) { notify('Sua sacola está vazia.'); return; }
  if (!shipping) { notify('Confirme seu CEP para calcular o frete.'); $('#checkout-zip').focus(); return; }
  const method = document.querySelector('input[name="payment"]:checked')?.value || 'pix';
  const names = { pix: 'Pix', credit: `cartão de crédito em ${$('#installments').value}x`, debit: 'cartão de débito' };
  $('#order-message').textContent = `Seu pedido demonstrativo foi registrado com pagamento por ${names[method]}. Total: ${money(subtotal() + (subtotal() >= FREE_SHIPPING_FROM ? 0 : shipping.fee))}.`;
  $('#order-dialog').showModal();
}

document.addEventListener('click', (event) => {
  const add = event.target.closest('[data-add]');
  if (add) { const item = cart.find((entry) => entry.id === add.dataset.add); if (item) item.quantity += 1; else cart.push({ id: add.dataset.add, quantity: 1 }); renderCart(); notify('Adicionado à sua sacola ♡'); return; }
  const quantity = event.target.closest('[data-quantity]');
  if (quantity) { const item = cart.find((entry) => entry.id === quantity.dataset.quantity); if (item) item.quantity += Number(quantity.dataset.delta); cart = cart.filter((entry) => entry.quantity > 0); renderCart(); if (!cart.length) shipping = null; if (!$('#checkout-screen').hidden) renderCheckout(); return; }
  const remove = event.target.closest('[data-remove]');
  if (remove) { cart = cart.filter((entry) => entry.id !== remove.dataset.remove); if (!cart.length) shipping = null; renderCart(); if (!$('#checkout-screen').hidden) renderCheckout(); }
});
$('#open-cart').addEventListener('click', openCart);
$('#close-cart').addEventListener('click', closeCart);
$('#overlay').addEventListener('click', closeCart);
$('#continue-shopping').addEventListener('click', closeCart);
$('#checkout-button').addEventListener('click', goToCheckout);
$('#back-to-shop').addEventListener('click', returnToShop);
$('#calculate-shipping').addEventListener('click', () => lookupZip($('#cart-zip').value, $('#cart-zip-feedback')));
$('#cart-zip').addEventListener('input', (event) => { event.target.value = formatZip(event.target.value); });
$('#checkout-zip').addEventListener('input', (event) => { event.target.value = formatZip(event.target.value); });
$('#checkout-lookup').addEventListener('click', () => lookupZip($('#checkout-zip').value, $('#checkout-zip-feedback'), $('#address-result')));
document.querySelectorAll('input[name="payment"]').forEach((input) => input.addEventListener('change', updatePayment));
$('#installments').addEventListener('change', updatePayment);
$('#place-order').addEventListener('click', placeOrder);
$('#close-order').addEventListener('click', () => $('#order-dialog').close());
$('#finish-order').addEventListener('click', () => { $('#order-dialog').close(); cart = []; shipping = null; renderCart(); returnToShop(); });
$('#year').textContent = new Date().getFullYear();
renderProducts();
renderCart();
