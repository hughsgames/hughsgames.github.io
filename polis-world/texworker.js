// Paints the block pictures (textures.js) away from the page, so the launch screen stays smooth while it happens.
import { buildAtlasData } from './textures.js';
self.onmessage = (e) => {
  const { sheet, T, scale } = e.data;
  const d = buildAtlasData(sheet, T, scale);
  self.postMessage(d, [d.rgba.buffer, d.normal.buffer]);
};
