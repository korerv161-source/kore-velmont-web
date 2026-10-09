const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

const search = document.getElementById('book-search');
const cards = [...document.querySelectorAll('.book-card')];
const count = document.getElementById('record-count');
const empty = document.getElementById('empty-state');
search?.addEventListener('input', () => {
  const term = search.value.trim().toLocaleLowerCase('es');
  let visible = 0;
  cards.forEach(card => {
    const matches = (card.dataset.search + ' ' + card.innerText).toLocaleLowerCase('es').includes(term);
    card.hidden = !matches;
    if (matches) visible++;
  });
  count.textContent = `${String(visible).padStart(2, '0')} ${visible === 1 ? 'REGISTRO' : 'REGISTROS'}`;
  empty.hidden = visible !== 0;
});

document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('subscribe-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const email = document.getElementById('reader-email').value.trim();
  const message = document.getElementById('form-message');
  if (!email) return;
  message.textContent = 'Prueba completada. Para recibir suscripciones de verdad, conecta un servicio de correo antes de publicar.';
  document.getElementById('reader-email').value = '';
});
