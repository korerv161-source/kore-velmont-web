const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  if (!nav) return;
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open'); menuToggle?.setAttribute('aria-expanded', 'false');
}));
const yearElement = document.getElementById('year');
if (yearElement) yearElement.textContent = new Date().getFullYear();
document.getElementById('subscribe-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const email = document.getElementById('reader-email')?.value.trim();
  const message = document.getElementById('form-message');
  if (!email || !message) return;
  message.textContent = 'La lista de lectores todavía no está conectada.';
  document.getElementById('reader-email').value = '';
});

const SUPABASE_URL = 'https://gixqmwlclafjfexxfyic.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_m5J_8zeHSLBGzYpkafaRMQ_00JKG1Iw';
const storiesContainer = document.getElementById('stories-container');
const storySearch = document.getElementById('story-search');
const storyCount = document.getElementById('story-count');
const storiesLoading = document.getElementById('stories-loading');
const storiesEmpty = document.getElementById('stories-empty');
const storiesError = document.getElementById('stories-error');
const overlay = document.getElementById('reader-overlay');
let publishedStories = [];

function openReader(story) {
  document.getElementById('reader-series').textContent = story.categoria || 'RELATO INDEPENDIENTE';
  document.getElementById('reader-title').textContent = story.titulo || 'Sin título';
  document.getElementById('reader-synopsis').textContent = story.sinopsis || '';
  const content = document.getElementById('reader-content');
  content.replaceChildren();
  (story.contenido || '').split(/\n\s*\n/).filter(Boolean).forEach(paragraph => {
    const p = document.createElement('p'); p.textContent = paragraph; content.appendChild(p);
  });
  overlay.hidden = false; document.body.classList.add('reader-open');
  document.getElementById('reader-close').focus();
}
function closeReader() { overlay.hidden = true; document.body.classList.remove('reader-open'); }
document.getElementById('reader-close')?.addEventListener('click', closeReader);
overlay?.addEventListener('click', e => { if (e.target === overlay) closeReader(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay && !overlay.hidden) closeReader(); });

function renderStories() {
  if (!storiesContainer) return;
  storiesContainer.replaceChildren();
  const term = (storySearch?.value || '').trim().toLocaleLowerCase('es');
  const filtered = publishedStories.filter(s => `${s.titulo||''} ${s.sinopsis||''} ${s.categoria||''}`.toLocaleLowerCase('es').includes(term));
  if (storyCount) storyCount.textContent = `${String(filtered.length).padStart(2,'0')} ${filtered.length === 1 ? 'RELATO' : 'RELATOS'}`;
  if (storiesEmpty) storiesEmpty.hidden = filtered.length !== 0;
  if (!filtered.length) return;
  const groups = new Map();
  filtered.forEach(story => {
    const series = (story.categoria || '').trim() || 'Relatos independientes';
    if (!groups.has(series)) groups.set(series, []);
    groups.get(series).push(story);
  });
  for (const [series, stories] of groups) {
    const section = document.createElement('section'); section.className = 'story-series';
    const heading = document.createElement('div'); heading.className = 'story-series-heading';
    const label = document.createElement('p'); label.className = 'eyebrow'; label.textContent = 'SERIE / COLECCIÓN';
    const title = document.createElement('h3'); title.textContent = series;
    const total = document.createElement('span'); total.className = 'record-count'; total.textContent = `${stories.length} ${stories.length === 1 ? 'EXPEDIENTE' : 'EXPEDIENTES'}`;
    heading.append(label, title, total); section.appendChild(heading);
    const grid = document.createElement('div'); grid.className = 'story-grid';
    stories.forEach(story => {
      const card = document.createElement('article'); card.className = 'story-card';
      if (story.portada_url) { const img=document.createElement('img'); img.className='story-card-cover'; img.src=story.portada_url; img.alt=`Portada de ${story.titulo||'relato'}`; img.loading='lazy'; card.appendChild(img); }
      const body = document.createElement('div'); body.className='story-card-body';
      const kicker=document.createElement('p'); kicker.className='card-kicker'; kicker.textContent=series.toUpperCase();
      const h=document.createElement('h4'); h.textContent=story.titulo||'Sin título';
      const desc=document.createElement('p'); desc.className='story-card-synopsis'; desc.textContent=story.sinopsis||'Un expediente recuperado del archivo de Kore Velmont.';
      const btn=document.createElement('button'); btn.type='button'; btn.className='button button-primary story-read-button'; btn.textContent='Leer relato ↗'; btn.addEventListener('click',()=>openReader(story));
      body.append(kicker,h,desc,btn); card.appendChild(body); grid.appendChild(card);
    });
    section.appendChild(grid); storiesContainer.appendChild(section);
  }
}
storySearch?.addEventListener('input', renderStories);
async function loadPublishedStories() {
  // Evita que la sección se quede eternamente en «CARGANDO».
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 12000);
  try {
    if (!storiesContainer) throw new Error('No se encontró el contenedor de relatos en index.html.');
    if (storiesLoading) storiesLoading.hidden = false;
    if (storiesError) { storiesError.hidden = true; storiesError.textContent = ''; }
    const url = `${SUPABASE_URL}/rest/v1/historias?select=id,titulo,sinopsis,contenido,categoria,portada_url,created_at&estado=eq.publicado&order=created_at.desc`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        Accept: 'application/json'
      },
      signal: timeout.signal
    });
    if (!response.ok) {
      let detail = '';
      try { const data = await response.json(); detail = data.message || data.details || data.hint || ''; } catch (_) {}
      throw new Error(`Supabase respondió ${response.status}${detail ? `: ${detail}` : '. Revisa la exposición de la tabla y la política SELECT.'}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Supabase devolvió una respuesta inesperada.');
    publishedStories = data;
    if (storiesLoading) storiesLoading.hidden = true;
    if (storiesLoading) storiesLoading.textContent = 'Consultando los expedientes publicados…';
    renderStories();
  } catch (error) {
    if (storiesLoading) {
      storiesLoading.hidden = true;
      storiesLoading.textContent = 'Consultando los expedientes publicados…';
    }
    if (storiesError) {
      storiesError.hidden = false;
      storiesError.textContent = error.name === 'AbortError'
        ? 'La conexión con el archivo tardó demasiado. Recarga la página e inténtalo de nuevo.'
        : `No se pudieron cargar los relatos: ${error.message}`;
    }
    if (storyCount) storyCount.textContent = 'ERROR DE CARGA';
    console.error('Error cargando relatos publicados:', error);
  } finally {
    clearTimeout(timer);
  }
}

// El enlace «Entrar al archivo» lleva directamente a la sección de relatos.
document.querySelectorAll('a[href="#archivo"], a[href="#relatos"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.getElementById('archivo') || document.getElementById('relatos');
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${target.id}`);
  });
});

loadPublishedStories();
