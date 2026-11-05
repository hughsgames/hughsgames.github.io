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
| `graphics.js` | the picture: the three quality settings, the drawing passes (clouds, world, water, sunbeams, glow, the finished image), automatic resolution, rounded boxes for people and animals |
| `shaders.js` | shader code shared by the sky, the clouds, the haze and the blocks |
| `textures.js` | the blocks' pictures painted afresh at 80 × 80 (stone, grass, bark, bricks…), each from the colours of its 10 × 10 original, and the atlas and bump map built from them |
| `texworker.js` | runs `textures.js` in the background while the world is built |
| `farland.js` | the land beyond the loaded chunks, drawn as coarse columns out to the horizon, and the sea under everything |
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
| `machines.js` | Leonardo's working machines in Florence: models, flying, driving, the crossbow, the robots |
| `megajungle.js` | Hugh's megajungle: its creatures and traps (the plateau itself is built in `worldgen.js`) |
| `net.js` | playing together: codes, connections, letting friends in, sending messages (what they say is in `game.js`, "playing together") |

## Saves

- Key: `polis-world-web-1`. Backups the player makes from the launch screen are kept under
  `polis-world-web-1-backup-<timestamp>`.
- `WORLD_VERSION` in `game.js` (currently 14) says which generation of the world a save came
  from. When new cities or terrain are added, bump it and add a line to the `changed` list so
  that **only the newly changed places** are rebuilt in an existing world — never the whole
  map, which would bulldoze what the player built.
- A new site added to `SITES` must not change which plants grow anywhere else: give it
  `noLand: true` (see `landMap`), then diff the generated world with and without it.
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
- **Water must be held in.** Still water with open air beside or under it hangs there like a glass block (the
  game only lets water flow once something near it changes). Build fountains with `basin()` (a kerb all round, a floor,
  filled in down to the ground), sink pools into a floor rather than standing them on it, and give a river or moat one
  level all along rather than following the ground in steps. After everything is built, `holdWater` in `worldgen.js`
  banks up whatever is left (a kerb of the ground beside it, a wall of rock where a ravine cuts in beside a river).
  Check a change with an audit that lists still water at or above y 26 with air beside or under it; there should be
  none apart from a few natural steps where two rivers meet.
- A change to a monument that alters ground heights near it can move the houses round it (`plotGround` reads the
  ground), which would put a player's saved edits on top of different buildings. Diff the generated world before and
  after: the city plans (`cities`) must come out the same.

## Graphics

- Three settings, **Fast**, **Balanced** and **Amazing** (`QUALITY` in `graphics.js`). The game
  picks one for the machine (`detectQuality`: no graphics chip → Fast; phones, tablets and
  Intel/Mali/Adreno-class chips → Balanced; otherwise Amazing), and the Graphics button on the
  launch screen and in the controls window changes it. The choice is kept under the key
  `polis-graphics`, **separate from the save**: nothing about graphics ever touches the world.
- Balanced and Amazing draw into a high-range (half-float) picture and finish it themselves:
  tone curve, glow, sunbeams from the shadow map, a cloud picture, reflections, lens flare. Fast
  draws straight to the screen, like the game before November 2026. A struggling machine lowers
  its own resolution (down to 60 %) and redraws shadows every other frame. If a shader won't
  build or the high-range picture isn't supported, the game drops to Fast by itself.
- `classify()` puts everything on one of three layers each frame: solid (mask 1), water
  (`userData.water`, mask 2), see-through (mask 4). Lights and raycasters use
  `layers.enableAll()`; anything new that must be seen in every pass needs the same.
- **Never add dynamic lights** (PointLight, SpotLight): every block material recompiles and
  every frame gets slower. Glows are additive points or meshes brighter than white (the glow
  pass picks them up); lightning brightens the hemisphere light instead.
- People and animals get rounded edges from a patch to `MeshLambertMaterial` that only acts on
  geometry whose uvs are shifted by +2 — call `boxUvs(geo)` on any new box-built model.
- Block vertices are packed small (normals as bytes, uvs as shorts, light as bytes): keep the
  format the same in `buildChunk`, the far land and the block shaders. Shader colours are
  linear light; the sky colours in `updateDaylight` were fitted so they land on the intended
  screen colours after the tone curve.
- Screen-space slopes (`dFdx`, `fwidth`) only inside `#if __VERSION__ >= 300` or with
  `extensions: { derivatives: true }`, so Fast still runs on a WebGL1-only browser.
- **Block pictures.** The 10 × 10 art (`data.js` sheets plus `paintTiles`) is still the source of every block's
  colours, the icons and the far land. `textures.js` repaints each picture at 80 × 80 from it: a painter per kind of
  material (rock, soil, grass, bark, rings, boards, bricks, cobbles, leaves, ores, marble, metal, cloth, roof tiles),
  and for anything else (flowers, doors, lamps, plants) the original enlarged with Scale2x and softened. A painter takes
  its colours from the original's own pixels (`palette`, `splitPalette` for two-material pictures like ore in rock),
  bakes light from the top left, and the average brightness is pulled back to the original's so the world looks the
  same from a distance. Everything wraps, so walls show no seams. To change a picture: edit its painter, then run the
  painter in Node on a dump of the sheet and look at the PNG — no browser needed.
- The atlas is 1024 × 4096 (80-pixel pictures in 128-pixel cells; Fast gets 512 × 2048, 40-pixel). It is a
  `DataTexture` with rows stored bottom-up, so `tileUV` is unchanged; raw pixels rather than a canvas so the colours
  kept under see-through pixels survive (a canvas would make them black, and smooth filtering would draw dark rims
  round leaves). Filtering is smooth (linear), not nearest. The bump map comes from heights the painters give, not
  from brightness. If the painting fails the game falls back to the old enlarged atlas (`buildAtlas`, `normalAtlas`).
- Painting takes 2–3 s, in a module worker, alongside the world worker; `start` waits for both (`pictures`).
- Weather: showers, steady rain and downpours (`W.want` 0.35 / 0.7 / 1). Only a downpour turns
  into a thunderstorm: the sky darkens (`storm.dark`) and lightning strikes every 6–16 s.

## Playing together

- One player's computer is the **host**: its world, its save. The host presses **P** (or Friends on a touch screen) and
  *Invite a friend*: the world opens with a code (FOX-27) and the invite goes straight to the share sheet (Messages,
  Mail, AirDrop) where the browser allows it, or is copied to paste into a message; *Send an invite* sends it again.
  The invite is this page's address with `?join=FOX-27`: opening it fills in the code on the launch page and, if that
  device already knows the player's name, knocks at once. (`join` is taken off the address straight away, so going
  home or reloading brings back the friend's own world.) A friend with the host in the room can still press *Play in a
  friend's world* and type the code. At most 3 friends.
- The host lets each newcomer in. A friend let in before comes **straight in**: each device has a random 32-hex-digit
  number of its own (`polis-device`, sent only to the world it's joining, in `hello.dev`), and the host keeps the numbers
  it said yes to under `polis-known-friends` (newest 20). *Ask me about everyone again* in the Friends window forgets
  them all.
- `net.js` fetches PeerJS 1.5.5 from jsdelivr only when someone presses one of those buttons. PeerJS's free public
  server (0.peerjs.com) introduces the computers; then they talk directly (WebRTC), or through PeerJS's free relay.
  Nothing is stored anywhere. Codes are names on that server, prefixed `hughsgames-polis-`.
- The host is in charge. **Every block change must go through `setBlock`** (it queues the change for everyone while
  `net.role` is set); a change made around it, like the sponge's, pushes to `netQuiet` by hand. A guest's changes go
  to the host, which applies them, keeps them, saves them and sends them on to everyone (the sender too, so all agree).
  The host also sends the clock, the weather and each lightning strike (with a seed, so the bolt is the same).
- A guest **never saves**: `save()` returns while `guestWorld` is set, so the guest's own world at home is untouched.
  A guest starts from the host's world (`worldForGuest`) with their own things and stars read from their own save
  (or a starter kit). On a guest, water flow, the weather's turns and lightning strikes are switched off: they come
  from the host.
- Host and guest must be the same `BUILD` (the host turns away an older or newer copy), so bump `BUILD` on every push.
- Before the first friend comes in each session, the host keeps a spare copy of the world as an ordinary backup
  (`polis-world-web-1-backup-…`, listed in `polis-friend-backups`, newest 3 kept), only if there's plenty of room in
  localStorage. "Bring back my older world" on the launch page restores it.
- It needs the open internet, so it works on hughsgames.github.io but not inside the Claude artifact.

## Testing before pushing

There's no test suite. What works: serve this folder over plain HTTP, open it with Playwright,
stub the Three.js CDN with a local copy if the network is walled off, then start a world and
watch for console errors. Worth checking after any change: the world builds, the launch screen
offers *Continue my world*, an existing save still loads, and the hotbar icons aren't blurry.

- Headless Chromium draws with SwiftShader, so the game picks Fast. To test another setting,
  set `polis-graphics` to `{"q":"amazing","auto":false}` in an init script.
- For steady screenshots, stop the game's own loop (`window.requestAnimationFrame = () => 0`)
  and draw frames with `polisDebug.render()` (it takes an optional function to adjust things
  just before drawing). `polisDebug.strike(x, z)` calls down lightning.
- Run once with `--disable-webgl2` too: Fast must still work on WebGL1.
- Playing together: run a PeerServer of your own (`npm i peer`, then `peerjs --port 9000 --host 127.0.0.1`) and open
  two browser profiles with `?debug&peer=127.0.0.1:9000` (the guest with `&stay`, so it stays on the launch page).
  Chromium needs `--disable-features=WebRtcHideLocalIpsWithMdns --allow-loopback-in-peer-connection`. Under
  SwiftShader a world takes minutes to build, so wait on conditions, not fixed sleeps.
- Only measure speed on a real graphics chip, e.g. William's Mac loading a pushed branch through
  `raw.githack.com`. Warm the chip up first, then time back-to-back `gfx.render` calls each
  followed by a one-pixel `readPixels`; GPU timer queries are unreliable on Apple chips.

## The other two versions

The same game exists twice more, and they do **not** share code:

- **The iPhone app** — Swift/SceneKit, in the `RomanCityBuilder` repo on William's Mac,
  branch `block-world`. Features often get built here first and ported there afterwards.
- **An earlier web version** written by another assistant, in `RomanCityBuilder/web`.

When William asks for something "in both", he means this one and the iPhone app.
