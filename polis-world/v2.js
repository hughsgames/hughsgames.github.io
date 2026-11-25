// Polis World 2: choosing a map and where your home is, the pictures of the maps, and the cities' names.
import { MAPS, MAP_IDS, KM, SIZE, sample } from './geo.js';

export const CITY_NAME = {
  alexandria: 'Alexandria', giza: 'Giza', memphis: 'Memphis', thebes: 'Thebes', babylon: 'Babylon', persepolis: 'Persepolis',
  mohenjoDaro: 'Mohenjo-daro', forbiddenCity: 'Beijing', wei: 'Wei', shu: 'Shu', wu: 'Wu', liangzhu: 'Liangzhu', angkor: 'Angkor',
  rome: 'Rome', florence: 'Florence', athens: 'Athens', olympia: 'Olympia', carthage: 'Carthage', jerusalem: 'Jerusalem',
  worldBank: 'The World Bank', chichenItza: 'Chichén Itzá', uxmal: 'Uxmal', tulum: 'Tulum', tikal: 'Tikal', teotihuacan: 'Teotihuacan',
};

// One worker draws the map pictures (they take a moment: every pixel is worked out from the map's shape).
let painter = null;
const pictures = new Map(), waiting = new Map();
export function mapPicture(mapId, n) {
  const k = mapId + '@' + n;
  if (pictures.has(k)) return Promise.resolve(pictures.get(k));
  if (waiting.has(k)) return waiting.get(k).p;
  if (!painter) {
    painter = new Worker(new URL('./chunkworker.js', import.meta.url), { type: 'module' });
    painter.onmessage = (e) => {
      const m = e.data, key = m.map + '@' + m.n, c = document.createElement('canvas');
      c.width = c.height = m.n;
      c.getContext('2d').putImageData(new ImageData(m.px, m.n, m.n), 0, 0);
      pictures.set(key, c);
      waiting.get(key)?.res(c); waiting.delete(key);
    };
  }
  let res; const p = new Promise((r) => { res = r; });
  waiting.set(k, { p, res });
  painter.postMessage({ kind: 'map', map: mapId, n });
  return p;
}

/// Cities in block coordinates, the way the game keeps them (centre and reach).
export function citiesOf(mapId) {
  const out = {};
  for (const c of MAPS[mapId].cities) out[c.id] = { center: [Math.round(c.x * KM), Math.round(c.z * KM)], R: Math.round(c.r * KM), name: CITY_NAME[c.id] || c.id, level: c.e };
  return out;
}

/// Is this a good place for a home: dry land, not in the sea, a river or a city?
export function homeOK(mapId, bx, bz) {
  const c = sample(MAPS[mapId], bx / KM, bz / KM);
  if (c.sea || c.e < 1 || c.river < 0.3 || c.cenote) return 'That spot is in the water. Pick some dry land.';
  if (c.city) return `That's inside ${CITY_NAME[c.city.id] || 'a city'}. Pick a spot outside the city walls (close by is fine).`;
  if (c.e > 90) return "That's high in the mountains. Pick somewhere lower down.";
  if (bx < 400 || bz < 400 || bx > SIZE - 400 || bz > SIZE - 400) return "That's right at the edge of the map. Pick somewhere further in.";
  return null;
}

/// Shows the map chooser, then the big map to put your home on. Resolves with { map, home: [x, z] } in blocks,
/// or null if the player backs out. `only` limits it to one map (moving your home within the map you're in).
export function pickHome({ only = null, homes = {}, title = null } = {}) {
  const box = document.getElementById('worldPick');
  const cards = document.getElementById('wpMaps'), big = document.getElementById('wpBig');
  const canvas = document.getElementById('wpCanvas'), pins = document.getElementById('wpPins'), note = document.getElementById('wpNote');
  const go = document.getElementById('wpGo'), back = document.getElementById('wpBack');
  box.hidden = false;
  return new Promise((resolve) => {
    let mapId = null, home = null;
    const finish = (v) => { box.hidden = true; go.onclick = back.onclick = canvas.onclick = null; resolve(v); };
    const showCards = () => {
      big.hidden = true; cards.hidden = false;
      document.getElementById('wpTitle').textContent = title || 'Choose your land';
      document.getElementById('wpSub').textContent = 'Each land has its own weather, plants, animals, cities and people. You can visit the others later.';
      cards.innerHTML = '';
      for (const id of MAP_IDS) {
        const m = MAPS[id], b = document.createElement('button');
        b.type = 'button'; b.className = 'wpcard';
        b.innerHTML = `<canvas width="140" height="140"></canvas><b>${m.name}</b><span>${m.blurb}</span>`;
        mapPicture(id, 140).then((pic) => b.querySelector('canvas').getContext('2d').drawImage(pic, 0, 0));
        b.onclick = () => showBig(id);
        cards.appendChild(b);
      }
      back.textContent = 'Back'; back.onclick = () => finish(null);
      go.hidden = true;
    };
    const showBig = (id) => {
      mapId = id; home = homes[id] || null;
      cards.hidden = true; big.hidden = false; go.hidden = false;
      document.getElementById('wpTitle').textContent = MAPS[id].name;
      document.getElementById('wpSub').textContent = 'Tap the map where you want your home. That is where you start, and where you come back to. You can move it later.';
      const g = canvas.getContext('2d');
      g.fillStyle = '#2c5c9e'; g.fillRect(0, 0, canvas.width, canvas.height);
      mapPicture(id, 400).then((pic) => { if (mapId === id) { g.imageSmoothingEnabled = true; g.drawImage(pic, 0, 0, canvas.width, canvas.height); drawPins(); } });
      note.textContent = home ? 'Your home is marked. Tap somewhere else to move it.' : '40 km across. The red dots are the great cities.';
      drawPins();
      back.textContent = only ? 'Cancel' : 'Other lands'; back.onclick = () => (only ? finish(null) : showCards());
      go.disabled = !home;
      go.onclick = () => home && finish({ map: mapId, home });
    };
    const drawPins = () => {
      pins.innerHTML = '';
      for (const c of MAPS[mapId].cities) {
        const p = document.createElement('div');
        p.className = 'wpcity'; p.style.left = `${(c.x / 40) * 100}%`; p.style.top = `${(c.z / 40) * 100}%`;
        p.textContent = CITY_NAME[c.id] || c.id;
        pins.appendChild(p);
      }
      if (home) {
        const h = document.createElement('div');
        h.className = 'wphome'; h.style.left = `${(home[0] / SIZE) * 100}%`; h.style.top = `${(home[1] / SIZE) * 100}%`;
        h.textContent = '⌂';
        pins.appendChild(h);
      }
    };
    canvas.onclick = (e) => {
      const r = canvas.getBoundingClientRect();
      const bx = Math.round(((e.clientX - r.left) / r.width) * SIZE), bz = Math.round(((e.clientY - r.top) / r.height) * SIZE);
      const why = homeOK(mapId, bx, bz);
      if (why) { note.textContent = why; return; }
      home = [bx, bz];
      // Near anything? Say so.
      let near = null, nd = 1e9;
      for (const c of MAPS[mapId].cities) { const d = Math.hypot(c.x - bx / KM, c.z - bz / KM); if (d < nd) { nd = d; near = c; } }
      note.textContent = near ? `Home: ${nd < 0.1 ? 'right by' : nd.toFixed(1) + ' km from'} ${CITY_NAME[near.id] || near.id}.` : 'Home chosen.';
      go.disabled = false;
      drawPins();
    };
    if (only) showBig(only); else showCards();
  });
}
