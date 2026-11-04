'use strict';
const get = id => document.getElementById(id);
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const entries = window.catalog.flatMap((group, i) => group.items.map((item,j) => ({
  ...item, key: [group.name, item.name, item.id, j < group.base ? 'Bruno' : 'Rafael'].join('|'), category: group.name, athlete: j < group.base ? 'Bruno' : 'Rafael'
})));
let athlete = 'Bruno';
let active;
const player = get('player');
function clipFor(item) {
  const clip = window.clips[item.id];
  return clip && /^[A-Za-z0-9_-]{11}$/.test(clip.id) && clip.ranges.length ? clip : null;
}
function node(tag, value, cls) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (cls) element.className = cls;
  return element;
}
function rule(category) {
  const name = normalize(category);
  if (name.startsWith('raspagem')) return 'IBJJF · 2 pontos se inverter a partir da guarda ou meia-guarda e estabilizar por cima por 3 s.';
  if (name === 'passagem de guarda') return 'IBJJF · 3 pontos ao superar a guarda e estabilizar o controle lateral ou norte-sul por 3 s.';
  if (name === 'saida de guarda fechada') return 'IBJJF · Abrir a guarda por si só não pontua. A passagem consolidada vale 3 pontos.';
  return '';
}
function render() {
  const query = normalize(get('query').value.trim());
  const category = get('category').value;
  const shown = entries.filter(item => item.athlete === athlete && (!category || item.category === category) &&
    normalize(item.name + ' ' + item.category).includes(query) &&
    (!get('quick').checked || clipFor(item)));
  get('count').textContent = shown.length ? shown.length + ' itens de ' + athlete : 'Nenhum golpe encontrado.';
  get('cards').replaceChildren(...shown.map(item => {
    const card = node('article','','card');
    const clip = clipFor(item);
    const button = node('button', '▶ Ver golpe', 'play');
    button.dataset.entry = item.key;
    button.onclick = () => open(item);
    card.append(node('span',item.category,'badge'),node('h2',item.name));
    const points = rule(item.category);
    if (points) card.append(node('p',points,'rule'));
    if (clip) card.append(button);
    else card.append(node('p',item.category === 'Pontuação' ? 'Consulte o regulamento no rodapé.' : 'Corte pendente','rule'));
    return card;
  }));
}
function open(item) {
  const clip = clipFor(item);
  if (!clip) return;
  active = item;
  get('title').textContent = item.name;
  const host = get('frame');
  const controls = get('segments');
  controls.replaceChildren();
  function play([start, end]) {
    const frame = document.createElement('iframe');
    const params = new URLSearchParams({autoplay: '1', playsinline: '1', start: Math.floor(start), end: Math.ceil(end)});
    frame.src = 'https://www.youtube-nocookie.com/embed/' + clip.id + '?' + params;
    frame.title = item.name;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    host.replaceChildren(frame);
  }
  clip.ranges.forEach((range, index) => {
    const button = node('button', clip.ranges.length > 1 ? 'Trecho ' + (index + 1) : 'Repetir trecho');
    button.onclick = () => play(range);
    controls.append(button);
  });
  get('clip').textContent = clip.id === item.id ? 'Trecho da demonstração original' : 'Trecho de demonstração alternativa';
  player.showModal();
  play(clip.ranges[0]);
}
player.addEventListener('close', () => {
  get('frame').replaceChildren();
  render();
  const restored = [...get('cards').querySelectorAll('button')].find(button => button.dataset.entry === active.key);
  (restored || get('query')).focus();
});
for (const category of window.catalog) get('category').append(new Option(category.name,category.name));
document.querySelectorAll('[data-athlete]').forEach(button => {
  button.onclick = () => {
    athlete = button.dataset.athlete;
    document.querySelectorAll('[data-athlete]').forEach(tab => tab.setAttribute('aria-pressed',String(tab === button)));
    render();
  };
});
get('quick').addEventListener('change',render);
get('query').addEventListener('input',render);
get('category').addEventListener('change',render);
render();
