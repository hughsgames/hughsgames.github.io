// Makes chunks of the Polis World 2 maps in the background (geo.js), so walking never waits for the land,
// and draws pictures of the maps for the map screens.
import { MAPS, genChunk, mapPixels } from './geo.js';

self.onmessage = (e) => {
  const m = e.data;
  if (m.kind === 'map') { const px = mapPixels(MAPS[m.map], m.n); self.postMessage({ kind: 'map', map: m.map, n: m.n, px }, [px.buffer]); return; }
  const c = genChunk(MAPS[m.map], m.cx, m.cz);
  self.postMessage({ map: m.map, ...c }, [c.cells.buffer, c.tops.buffer, c.bio.buffer]);
};
