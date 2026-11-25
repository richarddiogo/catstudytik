const { phases, assets } = JSON.parse(document.querySelector('#content').textContent);
const app = document.querySelector('#app');
const notice = document.querySelector('#notice');
const storageKey = 'catstudytik-mockup-v1';
const pages = ['estudar', 'trilha', 'colecao'];
const icons = {
  book: '<path d="M4 5h6a2 2 0 0 1 2 2v13a3 3 0 0 0-3-3H4zM20 5h-6a2 2 0 0 0-2 2v13a3 3 0 0 1 3-3h5z"/>',
  route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h8a4 4 0 0 1 0 8H8a2 2 0 0 0 0 4h8"/>',
  album: '<rect x="6" y="5" width="13" height="15" rx="2"/><path d="M3 16V5a3 3 0 0 1 3-3h9M10 9h5m-5 4h5"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 14"/>',
  database: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 9-12h-6z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  box: '<path d="M12 3 4 7.5v9l8 4.5 8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9M8 5.3l8 4.4"/>',
  flag: '<path d="M5 21V4c5-4 8 4 14 0v10c-6 4-9-4-14 0"/>',
  focus: '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/><circle cx="12" cy="12" r="2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  link: '<path d="M10 13a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-2 2m3 4a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l2-2"/>',
  alert: '<path d="m12 3 9 16H3L12 3zm0 6v4m0 3h.01"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12h.01"/>',
  bookmark: '<path d="M6 4h12v16l-6-4-6 4z"/>',
  left: '<path d="m14 6-6 6 6 6"/>',
  right: '<path d="m10 6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
  swipe: '<path d="M2 7h15m-3-3 3 3-3 3m8 7H7m3-3-3 3 3 3"/>',
};

const cats = {
  analista: { name: 'A Analista', skill: 'Dados e contrato', phrase: 'Inspeciona o schema antes de confiar no payload.', asset: 'analista', art: 'terminal' },
  dorminhoco: { name: 'O Dorminhoco', skill: 'AWS Lambda', phrase: 'Acorda por chamada. Às vezes leva um pouco.', asset: 'dorminhoco' },
  porteiro: { name: 'O Porteiro', skill: 'API Gateway', phrase: 'Quer saber o método e a rota antes de abrir.', asset: 'porteiro' },
  desconfiado: { name: 'O Desconfiado', skill: 'Angular e RxJS', phrase: 'No HTTP do Angular, espera alguém assinar.', asset: 'desconfiado' },
  vigia: { name: 'O Vigia', skill: 'ECS Fargate', phrase: 'Mantém o processo de pé e cobra ração pelo turno.', asset: 'vigia' },
};

const kinds = {
  ponte: { label: 'Ponte', icon: 'link', duration: '30 s' },
  armadilha: { label: 'Armadilha', icon: 'alert', duration: '30 s' },
  desafio: { label: 'Desafio', icon: 'target', duration: '2–5 min' },
  boss: { label: 'Boss', icon: 'flag', duration: 'Entrega em PR' },
};

const cardId = (phase, index) => phase.cards[index].id;
const total = phases.reduce((sum, phase) => sum + phase.cards.length, 0);
const validCards = new Set(phases.flatMap(phase => phase.cards.map((_, index) => cardId(phase, index))));
const readHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
};
const history = readHistory();
const validSet = value => new Set(Array.isArray(value) ? value.filter(id => validCards.has(id)) : []);
const done = validSet(history.done);
const saved = validSet(history.saved);
let phaseIndex = Math.max(0, phases.findIndex(phase => phase.id === history.phase));
let cardIndex = Number.isInteger(history.card) && history.card >= 0 && history.card < phases[phaseIndex].cards.length ? history.card : 0;
let focusMode = false;
let swipeStart;

function store() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ phase: phases[phaseIndex].id, card: cardIndex, done: [...done], saved: [...saved] }));
  } catch {
    // The current session remains usable if the browser disables storage.
  }
}

const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const number = value => String(value).padStart(2, '0');
const countPhase = phase => phase.cards.filter((_, index) => done.has(cardId(phase, index))).length;
const pageName = () => pages.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'estudar';

function progress() {
  const phaseCount = phases.filter(phase => countPhase(phase) === phase.cards.length).length;
  const segments = 12;
  const ratio = done.size / total * segments;
  return `<div class="progress" aria-label="Seu progresso, ${done.size} de ${total} cards concluídos">
    <div class="progress-head"><span>Seu progresso</span><span data-progress>${number(done.size)}/${total}</span></div>
    <div class="meter" aria-hidden="true">${Array.from({ length: segments }, (_, index) => `<i class="${index + 1 <= ratio ? 'filled' : index < ratio ? 'part' : ''}"></i>`).join('')}</div>
    <small>${phaseCount} de ${phases.length} fases concluídas</small>
  </div>`;
}

function intro(label, title, description) {
  return `<div class="intro"><div><div class="eyebrow">${label}</div><h1>${title}</h1><p>${description}</p></div>${progress()}</div>`;
}

function tag(card) {
  return `<span class="tag">${svg(kinds[card.tipo].icon)} ${kinds[card.tipo].label}</span>`;
}

function renderCard(phase, card, index) {
  const cat = cats[phase.cat];
  const bookmarked = saved.has(cardId(phase, index));
  return `<article class="lesson" data-kind="${card.tipo}" aria-labelledby="card-title">
    <div class="lesson-content">
      <div class="lesson-meta">${tag(card)}<span class="duration">${svg('clock')} ${kinds[card.tipo].duration}</span></div>
      <h3 id="card-title" tabindex="-1">${escape(card.titulo)}</h3>
      <p>${escape(card.texto)}</p>
      <div class="example">${card.exemplos.map(({ rotulo, conteudo }) => `<div class="example-line"><span class="example-label">${escape(rotulo)}</span><code>${escape(conteudo)}</code></div>`).join('')}</div>
    </div>
    <div class="lesson-art">
      <img src="${assets[cat.art || cat.asset]}" alt="">
      <span class="character-label"><i></i>${cat.name}</span>
    </div>
    <button class="square bookmark" type="button" data-action="bookmark" aria-pressed="${bookmarked}" aria-label="Salvar card">${svg('bookmark')}</button>
  </article>`;
}

function readerControls(phase) {
  const currentDone = done.has(cardId(phase, cardIndex));
  const finished = currentDone && done.size === total;
  const marks = phase.cards.map((card, index) => `<button type="button" data-card="${index}" class="${done.has(cardId(phase, index)) ? 'is-done' : ''}" ${cardIndex === index ? 'aria-current="true"' : ''} aria-label="Card ${index + 1}, ${escape(card.titulo)}"></button>`).join('');
  return `<div class="reader-controls">
    <div class="arrows" aria-label="Navegar pelos cards">
      <button class="square" type="button" data-action="prev" aria-label="Card anterior" ${cardIndex === 0 ? 'disabled' : ''}>${svg('left')}</button>
      <button class="square" type="button" data-action="next" aria-label="Próximo card" ${cardIndex + 1 === phase.cards.length ? 'disabled' : ''}>${svg('right')}</button>
    </div>
    <div class="pager">${marks}<span class="count">${number(cardIndex + 1)} / ${number(phase.cards.length)}</span></div>
    <button class="primary" type="button" data-action="complete" ${finished ? 'disabled' : ''}>${svg('check')} ${finished ? 'Trilha concluída' : currentDone ? 'Continuar' : 'Concluir card'}</button>
  </div>`;
}

function phaseList() {
  return phases.map((phase, index) => {
    const current = index === phaseIndex;
    const completed = countPhase(phase) === phase.cards.length;
    return `<button class="phase" type="button" data-phase="${index}" ${current ? 'aria-current="true"' : ''}>
      <span class="phase-icon">${svg(phase.icon)}</span>
      <span><span class="phase-title">${phase.title}</span><span class="phase-stack">${phase.stack}</span></span>
      <span class="phase-state ${completed ? 'done' : ''}">${completed ? '<span class="visually-hidden">Concluída</span>' + svg('check') : current ? 'ATUAL' : number(index + 1)}</span>
    </button>`;
  }).join('');
}

function deckTile(card, index, phase, nested = false) {
  const selector = nested ? `data-open="${phases.indexOf(phase)}:${index}"` : `data-card="${index}"`;
  return `<button class="mini" type="button" ${selector} data-kind="${card.tipo}">${tag(card)}<strong>${escape(card.titulo)}</strong>${nested ? `<small>${phase.title}</small>` : ''}</button>`;
}

function study() {
  const phase = phases[phaseIndex];
  const card = phase.cards[cardIndex];
  const deck = phase.cards.map((item, index) => index === cardIndex ? '' : deckTile(item, index, phase)).join('');
  return `${intro('Laboratório full stack', 'Do pipeline <span>à tela.</span>', 'Use o que você já sabe de dados para construir seu próprio app de estudo.')}
    <div class="workspace">
      <section aria-labelledby="deck-heading">
        <div class="section-head"><h2 id="deck-heading">Baralho de estudo</h2><button class="quiet" type="button" data-action="focus" aria-pressed="${focusMode}">${svg('focus')} ${focusMode ? 'Sair do foco' : 'Modo foco'}</button></div>
        ${renderCard(phase, card, cardIndex)}${readerControls(phase)}
        <section class="deck" aria-labelledby="remaining-heading">
          <div class="section-head"><h2 id="remaining-heading">Neste baralho</h2><span class="kicker">${phase.title}</span></div>
          <div class="mini-grid">${deck}</div>
        </section>
      </section>
      <aside class="right" aria-labelledby="phases-heading">
        <div class="section-head"><h2 id="phases-heading">Trilha de construção</h2><span class="kicker">${phases.length} fases</span></div>
        <div class="phase-list">${phaseList()}</div>
        <div class="aside-note"><span class="key-hint">${svg('keyboard')} Use <kbd>←</kbd> <kbd>→</kbd> para trocar de card.</span><span class="touch-hint">${svg('swipe')} Deslize para os lados para trocar de card.</span></div>
      </aside>
    </div>`;
}

function journey() {
  const tiles = phases.map((phase, index) => `<article class="phase-tile">
    <div class="tile-head"><span class="phase-icon">${svg(phase.icon)}</span><span class="phase-state">${countPhase(phase)}/${phase.cards.length} cards</span></div>
    <h2>${phase.title}</h2><span class="phase-stack">${phase.stack}</span><p>${phase.summary}</p>
    <p class="outcome"><strong>Entrega em PR</strong>${phase.outcome}</p>
    <button type="button" class="quiet" data-phase="${index}">${svg('book')} Abrir baralho</button>
  </article>`).join('');
  return `${intro('Plano de estudo', 'Trilha de <span>construção.</span>', 'Seis fases para colocar o próprio CatStudyTik no ar.')}<div class="page-grid">${tiles}</div>`;
}

function collection() {
  const mentors = Object.values(cats).map((cat, index) => {
    const unlocked = index === 0 || countPhase(phases[index - 1]) === phases[index - 1].cards.length;
    return `<article class="cat-tile ${unlocked ? '' : 'locked'}"><img src="${assets[cat.asset]}" alt=""><div>
      <small>${unlocked ? cat.skill : `Libera após a fase ${index}`}</small><h3>${cat.name}</h3><p>${cat.phrase}</p></div></article>`;
  }).join('');
  const bookmarks = phases.flatMap(phase => phase.cards.map((card, index) => saved.has(cardId(phase, index)) ? deckTile(card, index, phase, true) : '')).join('');
  return `${intro('Coleção', 'Gatos do <span>laboratório.</span>', 'Conclua fases para recrutar os mentores e guarde os cards que quiser rever.')}
    <section class="collection" aria-label="Mentores"><div class="cat-grid">${mentors}</div></section>
    <section class="saved" aria-labelledby="saved-heading"><div class="section-head"><h2 id="saved-heading">Cards salvos</h2><span class="kicker">${saved.size} card${saved.size === 1 ? '' : 's'}</span></div>
      ${bookmarks ? `<div class="mini-grid">${bookmarks}</div>` : '<p class="empty">Salve um card pelo ícone de marcador para encontrar aqui.</p>'}</section>`;
}

function render(focusSelector) {
  const currentPage = pageName();
  for (const link of document.querySelectorAll('.nav a')) {
    if (link.dataset.page === currentPage) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  app.classList.toggle('focus', currentPage === 'estudar' && focusMode);
  app.innerHTML = { estudar: study, trilha: journey, colecao: collection }[currentPage]();
  if (focusSelector) {
    const target = app.querySelector(focusSelector);
    (target && !target.disabled ? target : app.querySelector('#card-title'))?.focus({ preventScroll: true });
  }
}

function selectCard(index, selector) {
  if (index < 0 || index >= phases[phaseIndex].cards.length) return;
  cardIndex = index;
  store();
  render(selector);
}

function openPhase(index, selectedCard) {
  phaseIndex = index;
  const phase = phases[index];
  const unfinished = phase.cards.findIndex((_, position) => !done.has(cardId(phase, position)));
  cardIndex = selectedCard ?? Math.max(0, unfinished);
  store();
  if (pageName() !== 'estudar') location.hash = 'estudar';
  else render('#card-title');
  document.querySelector('.topbar').scrollIntoView({ block: 'start' });
}

function completeCard() {
  const phase = phases[phaseIndex];
  const id = cardId(phase, cardIndex);
  if (!done.has(id)) {
    done.add(id);
    notice.textContent = countPhase(phase) === phase.cards.length ? `Fase concluída. ${phase.title}.` : `Card concluído. ${done.size} de ${total}.`;
  }
  if (cardIndex + 1 < phase.cards.length) {
    cardIndex += 1;
  } else if (done.size < total) {
    const order = [...phases.slice(phaseIndex), ...phases.slice(0, phaseIndex)];
    const next = order.find(item => countPhase(item) < item.cards.length);
    phaseIndex = phases.indexOf(next);
    cardIndex = next.cards.findIndex((_, position) => !done.has(cardId(next, position)));
  }
  store();
  render('#card-title');
}

app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const { action, card, phase, open } = button.dataset;
  if (phase !== undefined) openPhase(Number(phase));
  if (open) openPhase(...open.split(':').map(Number));
  if (card !== undefined) selectCard(Number(card), '#card-title');
  if (action === 'prev') selectCard(cardIndex - 1, '[data-action="prev"]');
  if (action === 'next') selectCard(cardIndex + 1, '[data-action="next"]');
  if (action === 'complete') completeCard();
  if (action === 'focus') {
    focusMode = !focusMode;
    render('[data-action="focus"]');
    document.querySelector('.topbar').scrollIntoView({ block: 'start' });
  }
  if (action === 'bookmark') {
    const id = cardId(phases[phaseIndex], cardIndex);
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    notice.textContent = saved.has(id) ? 'Card salvo na coleção.' : 'Card removido dos salvos.';
    store();
    render('[data-action="bookmark"]');
  }
});

app.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' || !event.isPrimary || !event.target.closest('.lesson') || event.target.closest('button')) return;
  swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

app.addEventListener('pointercancel', () => {
  swipeStart = undefined;
});

app.addEventListener('pointerup', event => {
  if (!swipeStart || event.pointerId !== swipeStart.id) return;
  const horizontal = event.clientX - swipeStart.x;
  const vertical = event.clientY - swipeStart.y;
  swipeStart = undefined;
  if (Math.abs(horizontal) > 48 && Math.abs(horizontal) > Math.abs(vertical) * 1.4) {
    selectCard(cardIndex + (horizontal < 0 ? 1 : -1), '#card-title');
  }
});

document.addEventListener('keydown', event => {
  if (pageName() !== 'estudar' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'Escape' && focusMode) {
    focusMode = false;
    render('[data-action="focus"]');
  }
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    selectCard(cardIndex + (event.key === 'ArrowRight' ? 1 : -1), '#card-title');
  }
});

window.addEventListener('hashchange', () => {
  render(pageName() === 'estudar' ? '#card-title' : undefined);
  window.scrollTo(0, 0);
});

for (const [page, icon] of Object.entries({ estudar: 'book', trilha: 'route', colecao: 'album' })) {
  document.querySelector(`[data-page="${page}"]`).insertAdjacentHTML('afterbegin', svg(icon));
}
document.querySelector('.repo').insertAdjacentHTML('afterbegin', svg('code'));
render();
