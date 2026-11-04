'use strict';
const get = id => document.getElementById(id);
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const entries = window.catalog.flatMap((group, i) => group.items.map((item,j) => ({
  ...item, key: i + '-' + j, category: group.name, athlete: j < group.base ? 'Bruno' : 'Rafael'
})));
let marks = {};
try { marks = JSON.parse(localStorage.getItem('fuinha-trechos-v1')) || {}; } catch {}
let athlete = 'Bruno';
let active;
const player = get('player');
const valid = cut => cut && Number.isInteger(cut.start) && Number.isInteger(cut.end) && cut.start >= 0 && cut.end > cut.start;
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
function cutFor(item) { return valid(marks[item.key]) ? marks[item.key] : window.chapters[item.id]; }
function render() {
  const query = normalize(get('query').value.trim());
  const category = get('category').value;
  const shown = entries.filter(item => item.athlete === athlete && (!category || item.category === category) &&
    normalize(item.name + ' ' + item.category).includes(query) &&
    (!get('quick').checked || valid(cutFor(item)) || window.shortVideos[item.id]));
  get('count').textContent = shown.length ? shown.length + ' itens de ' + athlete : 'Nenhum golpe encontrado.';
  get('cards').replaceChildren(...shown.map(item => {
    const card = node('article','','card');
    const button = node('button',valid(cutFor(item)) ? '▶ Ver trecho' : window.shortVideos[item.id] ? '▶ Ver vídeo · ' + window.shortVideos[item.id] + ' s' : '▶ Ver demonstração','play');
    button.onclick = () => open(item);
    card.append(node('span',item.category,'badge'),node('h2',item.name));
    const points = rule(item.category);
    if (points) card.append(node('p',points,'rule'));
    if (item.id === 'MLvOyCxmH8A') card.append(node('p','Original restrito a membros do canal.','rule'));
    card.append(button);
    return card;
  }));
}
function playback() {
  const cut = cutFor(active);
  const marked = valid(cut);
  const params = new URLSearchParams({autoplay:'1',playsinline:'1',rel:'0'});
  if (marked) { params.set('start',cut.start); params.set('end',cut.end); }
  const frame = document.createElement('iframe');
  frame.title = active.title || active.name;
  frame.src = 'https://www.youtube-nocookie.com/embed/' + active.id + '?' + params;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  get('frame').replaceChildren(frame);
  get('clip').textContent = marked ? (cut.label ? 'Capítulo do criador · ' + cut.label + ' · ' : 'Marcação deste aparelho · ') + cut.start + '–' + cut.end + ' s' : 'Vídeo original · trecho ainda sem marcação';
  get('original').href = 'https://www.youtube.com/watch?v=' + active.id + (marked ? '&t=' + cut.start + 's' : '');
}
function open(item) {
  active = item;
  get('title').textContent = item.name;
  get('notice').textContent = '';
  get('start').value = marks[item.key]?.start ?? '';
  get('end').value = marks[item.key]?.end ?? '';
  player.showModal();
  playback();
}
function save() {
  try { localStorage.setItem('fuinha-trechos-v1',JSON.stringify(marks)); return true; }
  catch { return false; }
}
get('marks').onsubmit = event => {
  event.preventDefault();
  const cut = {start:get('start').valueAsNumber,end:get('end').valueAsNumber};
  if (!valid(cut)) { get('notice').textContent = 'O fim deve vir depois do início.'; return; }
  marks[active.key] = cut;
  get('notice').textContent = save() ? 'Marcação salva.' : 'Marcação disponível nesta sessão.';
  playback();
};
get('clear').onclick = () => {
  delete marks[active.key];
  save();
  get('start').value = get('end').value = '';
  get('notice').textContent = 'Marcação removida.';
  playback();
};
get('replay').onclick = playback;
player.addEventListener('close', () => { get('frame').replaceChildren(); render(); });
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
