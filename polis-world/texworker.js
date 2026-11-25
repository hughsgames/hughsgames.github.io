// Paints the block pictures (textures.js) away from the page, so the launch screen stays smooth while it happens.
import { buildAtlasData } from './textures.js';
self.onmessage = (e) => {
  const { sheet, T, scale, style } = e.data;
  const d = buildAtlasData(sheet, T, scale, 32, style);
  self.postMessage(d, [d.rgba.buffer, d.normal.buffer]);
};
