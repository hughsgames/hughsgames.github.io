// Deterministic target selection keeps hunting separate from rendering and movement.
export const PREDATORS = new Set(['lion','tiger','jaguar','wolf','crocodile','bear','hyena']);
export const PREY = new Set(['deer','sheep','goat','pig','chicken','boar','llama']);
export function huntingTarget(hunter, animals, player) {
  if (!PREDATORS.has(hunter.kind) || hunter.tame || hunter.ridden || hunter.dead) return null;
  let closest = 18, target = null;
  for (const animal of animals) {
    if (animal.dead || animal.ridden || animal === hunter || !PREY.has(animal.kind)) continue;
    if (Math.abs(animal.y - hunter.y) > 2) continue;
    const d = Math.hypot(animal.x-hunter.x,animal.z-hunter.z);
    if (d < closest) { closest = d; target = animal; }
  }
  if (player && Math.abs(player.y-hunter.y)<2 && Math.hypot(player.x-hunter.x,player.z-hunter.z)<Math.min(closest,8)) return player;
  return target;
}
