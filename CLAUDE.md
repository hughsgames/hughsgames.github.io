# Hugh's Games — notes for whoever picks this up next

This repo **is** the website: https://hughsgames.github.io. Push to `main` and GitHub Pages
rebuilds it in about a minute. There is no build step, no bundler and no server — the files
here are served exactly as they are.

It was made for Hugh, who is seven. He plays it; his dad (William) asks for the changes.

## The three rules

1. **Hugh's saved world must never be lost.** It lives in his own browser under the key
   `polis-world-web-1`, and nothing else on earth has a copy. Any change to the world or the
   save format has to keep his world loadable — see *Saves* below.
2. **Everything runs in the player's browser.** No server, no accounts, no database, nothing
   that costs money to keep running. Three.js comes from a CDN; every other file here is
   plain ES modules loaded as files.
3. **Keep the Claude artifact in sync.** The same game is also published as a Claude artifact
   (`claude.ai/artifact/SD7AM1JSxjSXtuuNTkJtQV`) — that's where Hugh's current world lives.
   After changing the game, publish the same files there too, or the two drift apart.

## Layout

```
index.html          the hub page: the shelf of Hugh's games
polis-world/        the game (everything below is in here)
```

| File | What it is |
| --- | --- |
| `index.html` | the page, all the CSS, the launch screen, the HUD markup |
| `game.js` | the game itself: the player, controls, crafting, talking, saves, panels |
| `engine.js` | blocks, the world in memory, chunk meshes with light and shade, materials, sky |
| `worldgen.js` | builds the whole world in a background worker, from the same map as the iPhone game |
| `cityplans.js` | the great cities, built as whole cities rather than a monument with huts |
| `data.js` | the map, block pictures, item icons and history text (generated — don't hand-edit) |
| `items.js` | items, tools, food and recipes |
| `icons.js` | every item's picture, and the 3D models extruded from those pictures |
| `people.js` | what townspeople look like and how they work |
| `figures.js` | crowds: armies and ships' crews, as instanced real people |
| `talk.js` | what the people of each city can tell you |
| `village.js` | refugees arriving, and the jobs you can give them |
| `animals.js` | wild animals, and how each reacts when you bother it |
| `events.js` | great battles and turning points, each near the place it happened |
| `ships.js` | the warships of the ancient Mediterranean |
| `relics.js` | the three Atlantis relics |
| `scenery.js` | the living sky and the small things that make the world feel alive |
| `designer.js` | the building designer (design once, then build copies) |

## Saves

- Key: `polis-world-web-1`. Backups the player makes from the launch screen are kept under
  `polis-world-web-1-backup-<timestamp>`.
- `WORLD_VERSION` in `game.js` (currently 6) says which generation of the world a save came
  from. When new cities or terrain are added, bump it and add a line to the `changed` list so
  that **only the newly changed places** are rebuilt in an existing world — never the whole
  map, which would bulldoze what the player built.
- If the world's size changes, the resize path keeps inventory, stars, discoveries, villagers
  and animals, moves everyone to the new camp, and tells the player the world got bigger.
- The launch screen has a copy-and-paste backup panel. Saves belong to one web address, so a
  world does not follow the player from one address to another — that panel is the way across.

## Gotchas

- `worldgen.js` is a **classic** worker and pulls in `cityplans.js` with `importScripts`.
  Don't turn `cityplans.js` into an ES module.
- Every path in the HTML is relative, so the site works at the root or under a subpath.
- `icons.js` draws each item at 64×64 inside a 32-unit space, and the pictures are shown at
  32 or 16 pixels — both exact halvings, so nothing blurs. Keep that arithmetic.
- Some browsers refuse to let a page hold the mouse (pointer lock). When that happens the
  game lifts the "Click to play" veil anyway and the player looks around by dragging. The
  fallback only triggers if the lock has **never once** held — the game releases the mouse
  itself whenever a window opens, and that must not be mistaken for a refusal.
- `data.js` is ~175 KB of generated data. Read it, don't rewrite it.

## Testing before pushing

There's no test suite. What works: serve this folder over plain HTTP, open it with Playwright,
stub the Three.js CDN with a local copy if the network is walled off, then start a world and
watch for console errors. Worth checking after any change: the world builds, the launch screen
offers *Continue my world*, an existing save still loads, and the hotbar icons aren't blurry.

## The other two versions

The same game exists twice more, and they do **not** share code:

- **The iPhone app** — Swift/SceneKit, in the `RomanCityBuilder` repo on William's Mac,
  branch `block-world`. Features often get built here first and ported there afterwards.
- **An earlier web version** written by another assistant, in `RomanCityBuilder/web`.

When William asks for something "in both", he means this one and the iPhone app.
