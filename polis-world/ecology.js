// Deterministic target selection keeps hunting separate from rendering and movement.
export const PREDATORS = new Set(['lion','tiger','jaguar','wolf','crocodile','bear','hyena']);
export const PREY = new Set(['deer','sheep','goat','pig','chicken','boar','llama','gazelle','ibex']);
// A chest-height sight line also stops bites through walls, closed doors and terrain.
export function clearHuntPath(from, to, solid = () => false) {
  if (![from.x, from.y, from.z, to.x, to.y, to.z].every(Number.isFinite)) return false;
  const distance = Math.hypot(to.x-from.x, to.y-from.y, to.z-from.z);
  const steps = Math.max(1, Math.ceil(distance * 4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (solid(Math.floor(from.x+(to.x-from.x)*t), Math.floor(from.y+(to.y-from.y)*t+0.65), Math.floor(from.z+(to.z-from.z)*t))) return false;
  }
  return true;
}
export function huntingTarget(hunter, animals, player, solid) {
  if (!PREDATORS.has(hunter.kind) || hunter.tame || hunter.ridden || hunter.dead) return null;
  let closest = 18, target = null;
  for (const animal of animals) {
    if (animal.dead || animal.ridden || animal.tame || animal.protected || animal === hunter || !PREY.has(animal.kind)) continue;
    if (Math.abs(animal.y - hunter.y) > 2) continue;
    const d = Math.hypot(animal.x-hunter.x,animal.z-hunter.z);
    if (d < closest && clearHuntPath(hunter, animal, solid)) { closest = d; target = animal; }
  }
  if (player && Math.abs(player.y-hunter.y)<2 && Math.hypot(player.x-hunter.x,player.z-hunter.z)<Math.min(closest,8) && clearHuntPath(hunter, player, solid)) return player;
  return target;
}
