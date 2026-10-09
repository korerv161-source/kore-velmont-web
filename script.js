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
const grid = document.getElementById('book-grid');
const count = document.getElementById('record-count');
const empty = document.getElementById('empty-state');

function updateSearch() {
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.book-card')];
  const term = (search?.value || '').trim().toLocaleLowerCase('es');
  let visible = 0;
  cards.forEach(card => {
    const matches = ((card.dataset.search || '') + ' ' + card.innerText).toLocaleLowerCase('es').includes(term);
    card.hidden = !matches;
    if (matches) visible++;
  });
  if (count) count.textContent = `${String(visible).padStart(2, '0')} ${visible === 1 ? 'REGISTRO' : 'REGISTROS'}`;
  if (empty) empty.hidden = visible !== 0;
}
search?.addEventListener('input', updateSearch);
document.getElementById('year')?.textContent = new Date().getFullYear();

document.getElementById('subscribe-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const email = document.getElementById('reader-email')?.value.trim();
  const message = document.getElementById('form-message');
  if (!email || !message) return;
  message.textContent = 'La lista de lectores todavía no está conectada.';
  document.getElementById('reader-email').value = '';
});

// La clave publishable es pública. La base de datos limita la lectura a estado = publicado mediante RLS.
const SUPABASE_URL = 'https://gixqmwlclafjfexxfyic.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_m5J_8zeHSLBGzYpkafaRMQ_00JKG1Iw';

async function cargarRelatosPublicados() {
  const loading = document.getElementById('published-loading');
  if (!grid) return;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/historias?select=id,titulo,sinopsis,contenido,categoria,portada_url,created_at&estado=eq.publicado&order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      }
    });
    if (!response.ok) throw new Error(`Respuesta ${response.status}`);
    const historias = await response.json();
    loading?.remove();
    historias.forEach(historia => {
      const card = document.createElement('article');
      card.className = 'book-card published-story-card';
      card.dataset.search = `${historia.titulo || ''} ${historia.sinopsis || ''} ${historia.categoria || ''}`;
      if (historia.portada_url) {
        const img = document.createElement('img');
        img.src = historia.portada_url;
        img.alt = `Portada de ${historia.titulo || 'relato'}`;
        img.loading = 'lazy';
        img.style.cssText = 'display:block;width:100%;height:auto;object-fit:cover;border-bottom:1px solid rgba(199,72,62,.55);';
        card.appendChild(img);
      }
      const info = document.createElement('div');
      info.className = 'book-info';
      const kicker = document.createElement('p');
      kicker.className = 'card-kicker';
      kicker.textContent = `EXPEDIENTE PUBLICADO${historia.categoria ? ' · ' + historia.categoria : ''}`;
      const title = document.createElement('h3');
      title.textContent = historia.titulo || 'Sin título';
      const synopsis = document.createElement('p');
      synopsis.textContent = historia.sinopsis || 'Un expediente recuperado del archivo de Kore Velmont.';
      info.append(kicker, title, synopsis);
      if (historia.contenido) {
        const details = document.createElement('details');
        details.className = 'published-story-content';
        const summary = document.createElement('summary');
        summary.className = 'button button-primary';
        summary.textContent = 'Leer relato ↘';
        const body = document.createElement('div');
        body.className = 'story-body';
        historia.contenido.split(/\n\s*\n/).forEach(paragraph => {
          const p = document.createElement('p');
          p.textContent = paragraph;
          body.appendChild(p);
        });
        details.append(summary, body);
        info.appendChild(details);
      }
      card.appendChild(info);
      grid.appendChild(card);
    });
    updateSearch();
  } catch (error) {
    loading?.remove();
    if (loading) loading.textContent = 'No se pudieron cargar los relatos publicados.';
    console.error('No se pudieron cargar los relatos públicos:', error);
  }
}
cargarRelatosPublicados();
