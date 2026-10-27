// Polis World (computer version): items, tools, food and recipes (the same as the iPhone game).

export const ITEM = {};
function it(id, name, opts = {}) { ITEM[id] = { id, name, ...opts }; }
it('dirt', 'Dirt', { block: 2 }); it('cobblestone', 'Cobblestone', { block: 22 }); it('sand', 'Sand', { block: 4 });
it('gravel', 'Gravel', { block: 5 }); it('snowball', 'Snowball'); it('clay', 'Clay', { block: 14 });
it('sandstone', 'Sandstone', { block: 21 }); it('cactus', 'Cactus', { block: 13 });
it('oakLog', 'Oak Log', { block: 7 }); it('birchLog', 'Birch Log', { block: 9 }); it('spruceLog', 'Spruce Log', { block: 11 });
it('palmLog', 'Palm Log', { block: 24 }); it('planks', 'Planks', { block: 23 }); it('stick', 'Stick');
it('coal', 'Coal'); it('charcoal', 'Charcoal'); it('tinOre', 'Tin Ore', { block: 16 }); it('copperOre', 'Copper Ore', { block: 17 });
it('ironOre', 'Iron Ore', { block: 18 }); it('goldOre', 'Gold Ore', { block: 19 });
it('copperIngot', 'Copper Ingot'); it('tinIngot', 'Tin Ingot'); it('bronzeIngot', 'Bronze Ingot'); it('ironIngot', 'Iron Ingot'); it('goldIngot', 'Gold Ingot');
it('apple', 'Apple', { food: 2 }); it('rawBeef', 'Raw Beef', { food: 3, cooked: 'roastBeef' }); it('rawMutton', 'Raw Mutton', { food: 3, cooked: 'roastMutton' });
it('rawPork', 'Raw Pork', { food: 3, cooked: 'roastPork' }); it('rawChicken', 'Raw Chicken', { food: 2, cooked: 'roastChicken' });
it('goatMeat', 'Goat Meat', { food: 2, cooked: 'roastGoat' }); it('rawFish', 'Raw Fish', { food: 2, cooked: 'cookedFish' });
it('roastBeef', 'Roast Beef', { food: 6 }); it('roastMutton', 'Roast Mutton', { food: 6 }); it('roastPork', 'Roast Pork', { food: 6 });
it('roastChicken', 'Roast Chicken', { food: 5 }); it('roastGoat', 'Roast Goat', { food: 5 }); it('cookedFish', 'Grilled Fish', { food: 5 });
it('bread', 'Bread', { food: 5 }); it('wheat', 'Wheat'); it('wheatSeeds', 'Wheat Seeds');
it('leather', 'Leather'); it('wool', 'Wool'); it('feather', 'Feather');
it('raft', 'Raft', { boat: 'raft' }); it('sailboat', 'Sailboat', { boat: 'sailboat' });
const toolTiers = [['wooden', 'Wooden', 1], ['stone', 'Stone', 2], ['bronze', 'Bronze', 3], ['iron', 'Iron', 4], ['ancient', 'Ancient Metal', 5]];
for (const [k, n, tier] of toolTiers) {
  it(k + 'Pickaxe', n + ' Pickaxe', { tool: 'pickaxe', tier }); it(k + 'Axe', n + ' Axe', { tool: 'axe', tier });
  it(k + 'Shovel', n + ' Shovel', { tool: 'shovel', tier }); it(k + 'Sword', n + ' Sword', { tool: 'sword', tier });
}
it('ironSpear', 'Iron Spear', { tool: 'spear', tier: 4 });
for (const [k, n] of [['hammer', 'Hammer'], ['hoe', 'Hoe'], ['sickle', 'Sickle'], ['chisel', 'Chisel'], ['brush', 'Brush'], ['fishingRod', 'Fishing Rod'], ['oar', 'Oar']]) it(k, n, { tool: 'craft', tier: 1 });
it('brick', 'Baked Brick', { block: 41 }); it('marble', 'Marble', { block: 42 }); it('blueTile', 'Blue Glazed Brick', { block: 43 });
it('column', 'Marble Column', { block: 44 }); it('goldBlock', 'Gold Block', { block: 45 }); it('lamp', 'Oil Lamp', { block: 46 });
it('limestone', 'Limestone', { block: 52 }); it('mudBrick', 'Mud Brick', { block: 53 }); it('carvedStone', 'Carved Stone', { block: 54 });
it('stoneBricks', 'Stone Bricks', { block: 55 }); it('fence', 'Fence', { block: 34 }); it('torch', 'Torch', { block: 56 });
it('campfire', 'Campfire', { block: 58 }); it('furnace', 'Furnace', { block: 59 }); it('granite', 'Granite', { block: 61 });
// The sea and Atlantis.
it('blackMarble', 'Black Marble', { block: 62 }); it('ancientMetal', 'Ancient Metal'); it('ancientMetalBlock', 'Ancient Metal Block', { block: 63 });
it('kelp', 'Kelp', { block: 65, water: true, cooked: 'driedKelp' }); it('driedKelp', 'Dried Kelp', { food: 2 });
it('seagrass', 'Seagrass', { block: 66, water: true }); it('brainCoral', 'Brain Coral', { block: 67 }); it('tubeCoral', 'Tube Coral', { block: 68 });
it('fireCoral', 'Fire Coral', { block: 69 }); it('purpleFan', 'Purple Sea Fan', { block: 70, water: true }); it('yellowFan', 'Yellow Sea Fan', { block: 71, water: true });
it('sponge', 'Sponge', { block: 72 }); it('ladder', 'Ladder', { block: 73 }); it('crystal', 'Atlantean Crystal', { block: 74 }); it('atlStone', 'Atlantean Stone', { block: 76 });
// New things to make (Oct 22).
it('door', 'Door', { block: 110 }); it('gate', 'Fence Gate', { block: 118 });
it('yellowRoof', 'Yellow Glazed Tile', { block: 90 }); it('greenRoof', 'Green Glazed Tile', { block: 91 }); it('redLacquer', 'Red Lacquered Wood', { block: 92 });
it('glass', 'Glass', { block: 93 }); it('terracotta', 'Terracotta', { block: 94 }); it('mosaic', 'Mosaic', { block: 95 });
it('plaster', 'White Plaster', { block: 96 }); it('bronzeBlock', 'Bronze Block', { block: 97 }); it('redCloth', 'Red Cloth', { block: 98 });
it('blueCloth', 'Blue Cloth', { block: 99 }); it('jerusalemStone', 'Jerusalem Stone', { block: 100 }); it('scrollShelf', 'Scroll Shelf', { block: 101 });
it('jade', 'Jade', { block: 102 }); it('poppy', 'Poppy', { block: 31 }); it('dandelion', 'Dandelion', { block: 32 });
it('parchment', 'Parchment'); it('amphora', 'Amphora'); it('clayPot', 'Clay Pot'); it('beads', 'Carnelian Beads'); it('papyrus', 'Papyrus');
it('obsidianBlade', 'Obsidian Blade', { tool: 'sword', tier: 3 }); it('glassBottle', 'Glass Bottle'); it('statuette', 'Marble Statuette'); it('cotton', 'Cotton Cloth');
it('sealStone', 'Seal Stone'); it('figs', 'Figs', { food: 3 }); it('dates', 'Dates', { food: 3 }); it('olives', 'Olives', { food: 2 });
it('puls', 'Puls (Porridge)', { food: 4 }); it('fishStew', 'Fish Stew', { food: 8 }); it('riceBowl', 'Rice and Fish', { food: 7 });
it('tortilla', 'Maize Tortillas', { food: 5 }); it('honeyCake', 'Honey Cake', { food: 6 });
it('greyRoof', 'Grey Roof Tile', { block: 103 }); it('rammedEarth', 'Rammed Earth', { block: 104 }); it('purpleCloth', 'Purple Cloth', { block: 105 });
it('paper', 'Paper'); it('silk', 'Silk Brocade'); it('salt', 'Salt'); it('tea', 'Tea', { food: 1 }); it('murex', 'Murex Shell');
// The pharaoh's grave goods, out of the Great Pyramid of Giza. Darius the trader pays well for them.
it('goldenMask', 'Golden Funeral Mask', { relic: true, worth: 9 });
it('canopicJar', 'Canopic Jar', { relic: true, worth: 5 });
it('scarab', 'Scarab Amulet', { relic: true, worth: 4 });
it('ankh', 'Golden Ankh', { relic: true, worth: 6 });
it('shabti', 'Shabti Figure', { relic: true, worth: 4 });
// The three Atlantean relics.
it('trident', "Poseidon's Trident", { relic: true }); it('lawTablet', 'Orichalcum Tablet', { relic: true }); it('seahorse', 'Golden Hippocamp', { relic: true });
// ---------- Hugh's resources (October 26) ----------
// Soils, stones and the things you dig out of the ground.
it('mountainSoil', 'Mountain Soil', { block: 122 }); it('blackSand', 'Black Sand', { block: 123 });
it('mossyCobble', 'Mossy Cobblestone', { block: 27 }); it('tallGrass', 'Tall Grass', { block: 30 });
it('greenMarble', 'Green Marble', { block: 146 }); it('blueMarble', 'Blue Marble', { block: 147 });
it('redMarble', 'Red Marble', { block: 148 }); it('purpleMarble', 'Purple Marble', { block: 149 });
it('obsidian', 'Obsidian', { block: 150 });
it('diamond', 'Diamond'); it('emerald', 'Emerald'); it('amethyst', 'Amethyst'); it('blackOpal', 'Black Opal');
// Woods and canes.
it('jungleLog', 'Jungle Log', { block: 124 }); it('cherryLog', 'Cherry Log', { block: 126 });
it('ginkgoLog', 'Ginkgo Log', { block: 128 }); it('acaciaLog', 'Acacia Log', { block: 130 });
it('figLog', 'Fig Log', { block: 132 });
it('greenVine', 'Green Vine', { block: 135 }); it('stranglerVine', 'Strangler Vine', { block: 136 });
it('bambooRods', 'Bamboo Rods', { block: 137 }); it('papyrusRods', 'Papyrus Rods', { block: 138 });
// Food that grows.
it('cocoaBean', 'Cocoa Bean', { food: 1 }); it('acaiBerry', 'Açaí Berries', { food: 2 });
it('maize', 'Maize', { food: 3 }); it('maizeSeeds', 'Maize Seeds');
it('honey', 'Honey', { food: 3 }); it('silkFiber', 'Silk Fibre');
// Meat and fish. Everything raw can go on a campfire.
it('venison', 'Venison', { food: 4, cooked: 'roastVenison' }); it('roastVenison', 'Roast Venison', { food: 7 });
it('rawDuck', 'Raw Duck', { food: 3, cooked: 'roastDuck' }); it('roastDuck', 'Roast Duck', { food: 6 });
it('rawTurtle', 'Raw Turtle', { food: 3, cooked: 'roastTurtle' }); it('roastTurtle', 'Turtle Soup', { food: 6 });
it('rawSquid', 'Raw Squid', { food: 2, cooked: 'cookedSquid' }); it('cookedSquid', 'Grilled Squid', { food: 5 });
it('rawSailfish', 'Raw Sailfish', { food: 3, cooked: 'cookedSailfish' }); it('cookedSailfish', 'Grilled Sailfish', { food: 6 });
it('rawPufferfish', 'Raw Pufferfish', { food: 1 });
// Feathers, hides and the prize at the top of the cliff.
it('yellowFeather', 'Yellow Feather'); it('greenFeather', 'Green Feather'); it('blueFeather', 'Blue Feather');
it('whiteFeather', 'White Feather'); it('redFeather', 'Red Feather');
it('crocodileLeather', 'Crocodile Leather'); it('tigerLeather', 'Tiger Skin');
it('goldenEgg', 'Golden Egg', { relic: true, worth: 8 });
// The gem tools. All four can dig anything, but each gem is best at one job.
const GEMS = [['diamond', 'Diamond', 'pickaxe'], ['emerald', 'Emerald', 'axe'], ['amethyst', 'Amethyst', 'shovel'], ['blackOpal', 'Black Opal', 'sword']];
export const GEM_KINDS = GEMS.map(([k]) => k);
for (const [k, n, best] of GEMS) {
  for (const [job, label] of [['pickaxe', 'Pickaxe'], ['axe', 'Axe'], ['shovel', 'Shovel'], ['sword', 'Sword']]) {
    it(k + label, `${n} ${label}`, { tool: job, tier: 6, best: job === best });
  }
}
for (const k of Object.keys(ITEM)) ITEM[k].max = ITEM[k].tool || ITEM[k].relic ? 1 : 64;

// Tier 6 is the gems: faster than ancient metal, and faster again at the job their gem suits.
export const SPEED = [1, 2, 3.5, 5, 6.5, 9, 12];
export const toolDamage = (t) => !t ? 1 : t.tool === 'sword' ? 3 + t.tier + (t.best ? 3 : 0) : t.tool === 'spear' ? 7 : t.tool === 'axe' ? 2 + t.tier : 1 + Math.floor(t.tier / 2);
export const LOGS = ['oakLog', 'birchLog', 'spruceLog', 'palmLog', 'jungleLog', 'cherryLog', 'ginkgoLog', 'acaciaLog', 'figLog'];
export const FUEL = ['coal', 'charcoal'];
export const STONES = ['cobblestone', 'sandstone', 'limestone', 'granite'];

// Recipes: [id, output, count, inputs [[items...], count], category, note, furnace?]
export const RECIPES = [];
function r(out, n, cat, inputs, note = null, furnace = false) {
  RECIPES.push({ id: out + RECIPES.length, out, n, cat, inputs: inputs.map(([a, c]) => [Array.isArray(a) ? a : [a], c]), note, furnace });
}
r('planks', 4, 'Basics', [[LOGS, 1]]);
r('raft', 1, 'Travel', [[LOGS, 4], ['stick', 2]], 'People have tied logs together to cross rivers for thousands of years. Hold it and click on water to set it afloat.');
r('sailboat', 1, 'Travel', [['planks', 12], ['wool', 3], ['stick', 3]], 'Phoenician sailors crossed the whole Mediterranean in wooden boats with square sails. Hold it and click on water, then take the steering oar.');
r('stick', 4, 'Basics', [['planks', 2]]);
r('torch', 4, 'Basics', [['stick', 1], [FUEL, 1]], 'Before lamps were common, people lit the night with burning torches.');
r('campfire', 1, 'Basics', [['stick', 3], [STONES, 3]], 'Place it, then hold raw meat or fish and click it to cook.');
r('furnace', 1, 'Smelting', [[STONES, 8]], 'Ancient smiths built furnaces of stone and clay, and blew air in with bellows to make the fire hot enough to melt metal.');
r('charcoal', 1, 'Smelting', [[LOGS, 1]], 'Wood baked slowly with very little air turns into charcoal, which burns much hotter than wood.', true);
r('copperIngot', 1, 'Smelting', [['copperOre', 1], [FUEL, 1]], 'Copper was the first metal people smelted, more than 7,000 years ago.', true);
r('tinIngot', 1, 'Smelting', [['tinOre', 1], [FUEL, 1]], null, true);
r('bronzeIngot', 4, 'Smelting', [['copperIngot', 3], ['tinIngot', 1], [FUEL, 1]], 'Melt copper with a little tin and you get bronze. It gave the Bronze Age its name.', true);
r('ironIngot', 1, 'Smelting', [['ironOre', 1], [FUEL, 2]], 'Iron needs a much hotter fire than bronze. Smiths learned it around 1200 BCE.', true);
r('goldIngot', 1, 'Smelting', [['goldOre', 1], [FUEL, 1]], null, true);
r('brick', 4, 'Smelting', [['clay', 4], [FUEL, 1]], 'Fired in a kiln, baked bricks last for thousands of years, like at Mohenjo-daro.', true);
r('ancientMetal', 2, 'Smelting', [['goldIngot', 1], ['ironIngot', 1], [FUEL, 2]], 'One part gold, one part iron: ancient metal, as hard as black marble. Legends say the Atlanteans built with a shining metal called orichalcum.', true);
r('ancientMetalBlock', 1, 'Building', [['ancientMetal', 4]], 'The hardest block you can make: only an iron or ancient metal pickaxe can collect it.');
for (const [mat, k] of [['planks', 'wooden'], ['cobblestone', 'stone'], ['bronzeIngot', 'bronze'], ['ironIngot', 'iron'], ['ancientMetal', 'ancient']]) {
  r(k + 'Pickaxe', 1, 'Tools', [[mat, 3], ['stick', 2]]); r(k + 'Axe', 1, 'Tools', [[mat, 3], ['stick', 2]]);
  r(k + 'Shovel', 1, 'Tools', [[mat, 1], ['stick', 2]]); r(k + 'Sword', 1, 'Tools', [[mat, 2], ['stick', 1]]);
}
r('ironSpear', 1, 'Tools', [['ironIngot', 1], ['stick', 3]]);
// The tools the townspeople use: make them yourself and you'll see they're the very same ones.
r('hammer', 1, 'Tools', [['ironIngot', 1], ['stick', 1]], 'Stonemasons, smiths and shipwrights all worked with hammers. Iron hammer heads were forged and fitted to a wooden handle.');
r('hoe', 1, 'Tools', [['bronzeIngot', 1], ['stick', 2]], 'Farmers broke up the soil with hoes before planting. The ox-drawn plough made big fields faster.');
r('sickle', 1, 'Tools', [['bronzeIngot', 1], ['stick', 1]], 'A curved blade for cutting wheat, millet and rice. The first sickles were made of flint set in wood or bone.');
r('chisel', 1, 'Tools', [['bronzeIngot', 1], ['planks', 1]], 'Sculptors and stone carvers tapped chisels with a mallet to shape stone, a tiny chip at a time.');
r('brush', 1, 'Tools', [['stick', 1], ['wool', 1]], 'Painters and scribes used brushes of animal hair. In China, writing with a brush became the art of calligraphy.');
r('fishingRod', 1, 'Tools', [['stick', 3], ['wool', 2]], 'Egyptian paintings show people fishing with rods, lines and hooks over 4,000 years ago.');
r('oar', 1, 'Tools', [['planks', 3], ['stick', 1]], 'A trireme needed 170 oars, each about 4 metres long, made from fir trees.');
r('bread', 1, 'Food', [['wheat', 3]], 'Bread was baked in Egypt and Mesopotamia over 5,000 years ago.');
r('fence', 3, 'Building', [['planks', 4], ['stick', 2]]);
r('mudBrick', 4, 'Building', [['clay', 2], ['wheat', 1]], 'Mud mixed with straw, dried in the sun: the first city builders used it.');
r('stoneBricks', 4, 'Building', [['cobblestone', 4]]);
r('blueTile', 4, 'Building', [['brick', 4], ['copperIngot', 1]], "Babylon's Ishtar Gate was covered in shiny blue glazed bricks.");
r('column', 1, 'Building', [['marble', 3]], 'Greek temples like the Parthenon were ringed with marble columns.');
r('carvedStone', 2, 'Building', [['stoneBricks', 2]]);
r('lamp', 2, 'Building', [['clay', 1], [FUEL, 2]], 'Clay oil lamps lit homes all over the Greek and Roman world.');
r('goldBlock', 1, 'Building', [['goldIngot', 4]]);
r('ladder', 3, 'Building', [['stick', 7]], 'Climb a ladder by walking into it: Space goes up.');
// Doors and gates: click one to open or close it.
r('door', 1, 'Building', [['planks', 6]], 'A door two blocks high. Click it to open or close it. Ancient doors turned on pivots set into the floor and the lintel.');
r('gate', 1, 'Building', [['planks', 2], ['stick', 4]], 'A gate for your fences, so your animals stay in and you can still get through. Click it to open or close it.');
// New building blocks.
r('yellowRoof', 4, 'Decor', [['brick', 4], ['sand', 1], [FUEL, 1]], "In China, only the emperor's buildings, like the Forbidden City, could have bright yellow roof tiles.", true);
r('greenRoof', 4, 'Decor', [['brick', 4], ['copperIngot', 1], [FUEL, 1]], 'Copper in the glaze turns roof tiles green. Princes and great temples in China used green tiles.', true);
r('redLacquer', 4, 'Decor', [['planks', 4], ['clay', 1]], 'Chinese palace pillars and walls were painted with layers of red lacquer, which protects wood for centuries.');
r('glass', 4, 'Decor', [['sand', 4], [FUEL, 1]], 'Glass is sand melted in a very hot fire. Egypt and Mesopotamia made glass beads and bottles over 3,500 years ago.', true);
r('terracotta', 4, 'Decor', [['clay', 4], [FUEL, 1]], 'Terracotta means "baked earth". China\'s first emperor was buried with an army of 8,000 terracotta soldiers.', true);
r('mosaic', 4, 'Decor', [['stoneBricks', 2], ['blueTile', 1], ['marble', 1]], 'Romans decorated floors with mosaics: pictures made of thousands of tiny coloured stones.');
r('plaster', 4, 'Decor', [['limestone', 2], [FUEL, 1]], 'Burn limestone and mix it with water and you get lime plaster, for smooth white walls.', true);
r('bronzeBlock', 1, 'Decor', [['bronzeIngot', 4]], 'Great bronze doors, statues and bells were cast in moulds of clay.');
r('redCloth', 2, 'Decor', [['wool', 3], ['poppy', 1]], 'Ancient dyers made red from plants like madder, and from tiny insects.');
r('blueCloth', 2, 'Decor', [['wool', 3], ['copperIngot', 1]], 'Egyptian blue, the first man-made colour, was made from copper, sand and lime.');
r('jerusalemStone', 2, 'Decor', [['limestone', 2]], "Herod's builders cut huge blocks of local limestone for the Temple Mount. Some weigh more than 500 tonnes!");
r('scrollShelf', 1, 'Decor', [['planks', 6], ['parchment', 3]], 'Libraries kept scrolls on shelves in little cubbies, with a tag hanging from each scroll saying what it was.');
r('parchment', 3, 'Decor', [['leather', 2]], 'Parchment is thin, scraped animal skin. The Dead Sea Scrolls, found near Jerusalem, are mostly parchment.');
r('greyRoof', 4, 'Decor', [['brick', 4], [FUEL, 1]], 'Ordinary Chinese houses had roofs of grey clay tiles, fired in a kiln with little air, which turns them grey.', true);
r('rammedEarth', 4, 'Decor', [['dirt', 4], ['gravel', 1]], 'Pound damp soil hard, layer by layer, inside a wooden frame: the Great Wall and many Chinese city walls began like this.');
r('purpleCloth', 1, 'Decor', [['wool', 3], ['murex', 2]], 'Tyrian purple, from murex sea snails, was the most expensive dye in the ancient world. Carthage and Tyre were famous for it.');
r('jade', 2, 'Decor', [['granite', 2], ['copperIngot', 1]], 'Jade was treasured in China more than gold. Craftsmen spent months polishing a single jade piece.');
// More food.
r('puls', 2, 'Food', [['wheat', 2]], 'Puls, a thick porridge of grain, was what most Romans ate every day.');
r('fishStew', 1, 'Food', [['cookedFish', 1], ['wheat', 1]], 'Fish stew with grain fed sailors and city people all round the Mediterranean.');
r('honeyCake', 1, 'Food', [['wheat', 2], ['apple', 1]], 'Sweet cakes with honey and fruit were treats at Greek and Roman festivals.');

// ---------- Hugh's resources: what to make with them ----------
// The four gem tool sets. Each gem digs anything, and is quicker still at the job it suits:
// diamond for stone, emerald for wood, amethyst for soil, black opal for a blade.
for (const [k] of GEMS) {
  r(k + 'Pickaxe', 1, 'Tools', [[k, 3], ['stick', 2]], k === 'diamond' ? 'The hardest thing there is. A diamond pickaxe goes through stone faster than anything.' : null);
  r(k + 'Axe', 1, 'Tools', [[k, 3], ['stick', 2]], k === 'emerald' ? 'Emerald takes a long, keen edge: an emerald axe fells a tree in a stroke or two.' : null);
  r(k + 'Shovel', 1, 'Tools', [[k, 1], ['stick', 2]], k === 'amethyst' ? 'Amethyst is purple quartz. Shaped into a shovel it shifts earth and sand quicker than iron.' : null);
  r(k + 'Sword', 1, 'Tools', [[k, 2], ['stick', 1]], k === 'blackOpal' ? 'Black opal flashes green and red as it turns. The sharpest blade in the world.' : null);
}
r('obsidianBlade', 1, 'Tools', [['obsidian', 2], ['stick', 1]], 'The Aztecs set razor-sharp obsidian flakes into wooden clubs. Volcanic glass takes a finer edge than any metal.');
// Canes and reeds.
r('stick', 4, 'Basics', [['bambooRods', 1]], 'Bamboo grows a metre a day and splits into straight rods: scaffolding, pipes, pens and arrows.');
r('papyrus', 2, 'Decor', [['papyrusRods', 3]], 'Egyptians split papyrus reeds, laid them in two layers and pressed them into sheets — the first paper.');
r('paper', 3, 'Decor', [['papyrusRods', 4]]);
r('silk', 1, 'Decor', [['silkFiber', 3]], 'One silkworm cocoon unwinds into a thread nearly a kilometre long. China kept how it was made secret for centuries.');
// Food from the new crops.
r('tortilla', 2, 'Food', [['maize', 3]], 'Maize was the heart of every meal in Mexico. Ground on a stone and patted flat, it becomes a tortilla.');
r('honeyCake', 2, 'Food', [['wheat', 2], ['honey', 1]], 'Real honey makes a better cake. Egyptians kept bees in clay pipes 4,500 years ago.');
r('fishStew', 1, 'Food', [['cookedSquid', 1], ['wheat', 1]]);
// Hides and cloth.
r('parchment', 4, 'Decor', [['crocodileLeather', 2]], 'Crocodile hide is thick and tough: shields, armour and drum skins were made from it.');
r('redCloth', 2, 'Decor', [['silkFiber', 3], ['poppy', 1]]);

export class Inventory {
  constructor() { this.slots = new Array(36).fill(null); }
  count(id) { return this.slots.reduce((s, x) => s + (x && x.id === id ? x.n : 0), 0); }
  countAny(ids) { return ids.reduce((s, id) => s + this.count(id), 0); }
  add(id, n) {
    let left = n;
    const max = ITEM[id]?.max ?? 64;
    for (const s of this.slots) if (left > 0 && s && s.id === id && s.n < max) { const p = Math.min(max - s.n, left); s.n += p; left -= p; }
    for (let i = 0; i < this.slots.length && left > 0; i++) if (!this.slots[i]) { const p = Math.min(max, left); this.slots[i] = { id, n: p }; left -= p; }
    return left;
  }
  remove(id, n) {
    if (this.count(id) < n) return false;
    let left = n;
    for (let i = this.slots.length - 1; i >= 0 && left > 0; i--) { const s = this.slots[i]; if (s && s.id === id) { const t = Math.min(s.n, left); s.n -= t; left -= t; if (!s.n) this.slots[i] = null; } }
    return true;
  }
  removeAny(ids, n) { let left = n; for (const id of ids) { const t = Math.min(this.count(id), left); if (t) { this.remove(id, t); left -= t; } } return left === 0; }
  canMake(rc) { return rc.inputs.every(([ids, c]) => this.countAny(ids) >= c); }
}
