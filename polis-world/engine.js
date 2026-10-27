// Polis World (computer version): blocks, the world in memory, chunk meshes with light and shade, materials and sky.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const H = 96, WL = 32, CS = 16;

// Tiles in the block atlas (same order as the iPhone game).
export const T = {
  grassTop: 0, grassSide: 1, dirt: 2, stone: 3, sand: 4, gravel: 5, snow: 6, snowSide: 7, oakSide: 8, logTop: 9, oakLeaves: 10,
  birchSide: 11, birchLeaves: 12, spruceSide: 13, spruceLeaves: 14, cactusSide: 15, cactusTop: 16, clay: 17, coalOre: 18, tinOre: 19,
  copperOre: 20, ironOre: 21, goldOre: 22, bedrock: 23, sandstone: 24, cobble: 25, planks: 26, tallGrass: 27, redFlower: 28,
  yellowFlower: 29, water: 30, palmLeaves: 31, palmSide: 32, deadBush: 33, sandstoneTop: 34, mossyCobble: 35, bedHeadTop: 36,
  bedFootTop: 37, bedSide: 38, door: 39, brick: 40, marble: 41, blueTile: 42, columnSide: 43, columnTop: 44, goldBlock: 45, lamp: 46,
  wheat0: 47, wheat3: 50, farmland: 51, limestone: 52, mudBrick: 53, carvedStone: 54, stoneBricks: 55, torch: 56, digSite: 57,
  campfire: 58, furnaceFront: 59, furnaceLit: 61, granite: 62, furnaceTop: 63,
  // The second sheet (extra-tiles): the sea, Atlantis and ancient metal.
  blackMarble: 64, ancientBlock: 65, ancientOre: 66, kelp: 67, seagrass: 68, brainCoral: 69, tubeCoral: 70, fireCoral: 71,
  purpleFan: 72, yellowFan: 73, sponge: 74, ladder: 75, crystal: 76, pedestalTop: 77, pedestalSide: 78, atlStone: 79,
  // Drawn by the game itself (paintTiles below): new building blocks.
  yellowRoof: 80, greenRoof: 81, redLacquer: 82, glass: 83, terracotta: 84, mosaic: 85, plaster: 86, bronze: 87,
  redCloth: 88, blueCloth: 89, jerusalemStone: 90, scrollShelf: 91, gateWood: 92, doorLower: 93, doorUpper: 94, jade: 95,
  greyRoof: 96, rammedEarth: 97, purpleCloth: 98,
  // Hugh's resources: new woods, plants, crops, coloured marble, gems, and the griffon's nest.
  jungleSide: 99, cherrySide: 100, ginkgoSide: 101, acaciaSide: 102, figSide: 103,
  jungleLeaves: 104, cherryBlossom: 105, ginkgoLeaves: 106, acaciaLeaves: 107, figLeaves: 108,
  greenVine: 109, stranglerVine: 110, bamboo: 111, papyrus: 112,
  cocoaPod: 113, acaiBunch: 114, maizeYoung: 115, maizeRipe: 116,
  greenMarble: 117, blueMarble: 118, redMarble: 119, purpleMarble: 120,
  obsidian: 121, diamondOre: 122, emeraldOre: 123, amethystOre: 124, opalOre: 125,
  mountainSoil: 126, blackSand: 127, rockSalt: 128,
  nestTop: 129, nestSide: 130, hive: 131, cocoon: 132, appleLeaves: 133,
};
// 32 rows of 8 pictures. The padded atlas built from this is 128 × 512, which stays a power of two
// so the blur used on far-away blocks still works. Rows 10 upwards are drawn by paintTiles below.
export const TILE_ROWS = 32;

// Every block: name, tiles (top, side, bottom), how hard it is, the right tool, the tool tier needed, what it drops, its shape.
export const BLOCKS = [];
function def(id, name, top, side, bottom, hard, tool, tier, drop, shape = 'cube', cut = false) {
  BLOCKS[id] = { id, name, top, side, bottom, hard, tool, tier, drop, shape, cut };
}
def(0, 'Air', 0, 0, 0, 0, '', 0, null, 'none');
def(1, 'Grass', T.grassTop, T.grassSide, T.dirt, 0.6, 'shovel', 0, 'dirt');
def(2, 'Dirt', T.dirt, T.dirt, T.dirt, 0.5, 'shovel', 0, 'dirt');
def(3, 'Stone', T.stone, T.stone, T.stone, 4, 'pickaxe', 1, 'cobblestone');
def(4, 'Sand', T.sand, T.sand, T.sand, 0.5, 'shovel', 0, 'sand');
def(5, 'Gravel', T.gravel, T.gravel, T.gravel, 0.6, 'shovel', 0, 'gravel');
def(6, 'Snow', T.snow, T.snow, T.snow, 0.4, 'shovel', 0, 'snowball');
def(7, 'Oak Log', T.logTop, T.oakSide, T.logTop, 2.5, 'axe', 0, 'oakLog');
def(8, 'Oak Leaves', T.oakLeaves, T.oakLeaves, T.oakLeaves, 0.3, '', 0, null, 'cube', true);
def(9, 'Birch Log', T.logTop, T.birchSide, T.logTop, 2.5, 'axe', 0, 'birchLog');
def(10, 'Birch Leaves', T.birchLeaves, T.birchLeaves, T.birchLeaves, 0.3, '', 0, null, 'cube', true);
def(11, 'Spruce Log', T.logTop, T.spruceSide, T.logTop, 2.5, 'axe', 0, 'spruceLog');
def(12, 'Spruce Needles', T.spruceLeaves, T.spruceLeaves, T.spruceLeaves, 0.3, '', 0, null, 'cube', true);
def(13, 'Cactus', T.cactusTop, T.cactusSide, T.cactusTop, 0.6, '', 0, 'cactus');
def(14, 'Clay', T.clay, T.clay, T.clay, 0.6, 'shovel', 0, 'clay');
def(15, 'Coal Ore', T.coalOre, T.coalOre, T.coalOre, 3.5, 'pickaxe', 1, 'coal');
def(16, 'Tin Ore', T.tinOre, T.tinOre, T.tinOre, 4.5, 'pickaxe', 2, 'tinOre');
def(17, 'Copper Ore', T.copperOre, T.copperOre, T.copperOre, 4.5, 'pickaxe', 2, 'copperOre');
def(18, 'Iron Ore', T.ironOre, T.ironOre, T.ironOre, 5.5, 'pickaxe', 3, 'ironOre');
def(19, 'Gold Ore', T.goldOre, T.goldOre, T.goldOre, 5.5, 'pickaxe', 3, 'goldOre');
def(20, 'Bedrock', T.bedrock, T.bedrock, T.bedrock, -1, '', 0, null);
def(21, 'Sandstone', T.sandstoneTop, T.sandstone, T.sandstoneTop, 3, 'pickaxe', 1, 'sandstone');
def(22, 'Cobblestone', T.cobble, T.cobble, T.cobble, 4, 'pickaxe', 1, 'cobblestone');
def(23, 'Planks', T.planks, T.planks, T.planks, 2, 'axe', 0, 'planks');
def(24, 'Palm Log', T.logTop, T.palmSide, T.logTop, 2.5, 'axe', 0, 'palmLog');
def(25, 'Palm Fronds', T.palmLeaves, T.palmLeaves, T.palmLeaves, 0.3, '', 0, null, 'cube', true);
def(26, 'Snowy Grass', T.snow, T.snowSide, T.dirt, 0.6, 'shovel', 0, 'dirt');
def(27, 'Mossy Cobblestone', T.mossyCobble, T.mossyCobble, T.mossyCobble, 4, 'pickaxe', 1, 'mossyCobble');
def(30, 'Tall Grass', T.tallGrass, T.tallGrass, T.tallGrass, 0.05, '', 0, 'tallGrass', 'cross', true);
def(31, 'Poppy', T.redFlower, T.redFlower, T.redFlower, 0.05, '', 0, 'poppy', 'cross', true);
def(32, 'Dandelion', T.yellowFlower, T.yellowFlower, T.yellowFlower, 0.05, '', 0, 'dandelion', 'cross', true);
def(33, 'Dead Bush', T.deadBush, T.deadBush, T.deadBush, 0.05, '', 0, 'stick', 'cross', true);
def(34, 'Fence', T.planks, T.planks, T.planks, 2, 'axe', 0, 'fence', 'fence');
def(35, 'Door', T.door, T.door, T.door, -1, '', 0, null, 'none');
def(36, 'Gate', T.planks, T.planks, T.planks, -1, '', 0, null, 'none');
def(37, 'Bed', T.bedHeadTop, T.bedSide, T.planks, -1, '', 0, null, 'bed');
def(38, 'Bed', T.bedFootTop, T.bedSide, T.planks, -1, '', 0, null, 'bed');
def(40, 'Water', T.water, T.water, T.water, -1, '', 0, null, 'liquid');
def(41, 'Baked Brick', T.brick, T.brick, T.brick, 3, 'pickaxe', 1, 'brick');
def(42, 'Marble', T.marble, T.marble, T.marble, 3.5, 'pickaxe', 1, 'marble');
def(43, 'Blue Glazed Brick', T.blueTile, T.blueTile, T.blueTile, 3, 'pickaxe', 1, 'blueTile');
def(44, 'Marble Column', T.columnTop, T.columnSide, T.columnTop, 3.5, 'pickaxe', 1, 'column', 'column');
def(45, 'Gold Block', T.goldBlock, T.goldBlock, T.goldBlock, 4, 'pickaxe', 1, 'goldBlock');
def(46, 'Oil Lamp', T.lamp, T.lamp, T.lamp, 0.4, '', 0, 'lamp');
def(47, 'Wheat Sprouts', T.wheat0, T.wheat0, T.wheat0, 0.05, '', 0, 'wheatSeeds', 'cross', true);
def(48, 'Young Wheat', 48, 48, 48, 0.05, '', 0, 'wheatSeeds', 'cross', true);
def(49, 'Growing Wheat', 49, 49, 49, 0.05, '', 0, 'wheatSeeds', 'cross', true);
def(50, 'Ripe Wheat', T.wheat3, T.wheat3, T.wheat3, 0.05, '', 0, 'wheat', 'cross', true);
def(51, 'Farmland', T.farmland, T.dirt, T.dirt, 0.5, 'shovel', 0, 'dirt');
def(52, 'Limestone', T.limestone, T.limestone, T.limestone, 3, 'pickaxe', 1, 'limestone');
def(53, 'Mud Brick', T.mudBrick, T.mudBrick, T.mudBrick, 1.5, 'pickaxe', 0, 'mudBrick');
def(54, 'Carved Stone', T.carvedStone, T.carvedStone, T.carvedStone, 4, 'pickaxe', 1, 'carvedStone');
def(55, 'Stone Bricks', T.stoneBricks, T.stoneBricks, T.stoneBricks, 4, 'pickaxe', 1, 'stoneBricks');
def(56, 'Torch', T.torch, T.torch, T.torch, 0.05, '', 0, 'torch', 'cross', true);
def(58, 'Campfire', T.campfire, T.campfire, T.campfire, 0.4, '', 0, 'campfire', 'cross', true);
def(59, 'Furnace', T.furnaceTop, T.furnaceFront, T.furnaceTop, 3.5, 'pickaxe', 1, 'furnace');
def(60, 'Burning Furnace', T.furnaceTop, T.furnaceLit, T.furnaceTop, 3.5, 'pickaxe', 1, 'furnace');
def(61, 'Granite', T.granite, T.granite, T.granite, 5, 'pickaxe', 1, 'granite');
// Black marble is the hardest stone in the world, and ancient metal (gold and iron melted together) is just as hard.
def(62, 'Black Marble', T.blackMarble, T.blackMarble, T.blackMarble, 12, 'pickaxe', 4, 'blackMarble');
def(63, 'Ancient Metal Block', T.ancientBlock, T.ancientBlock, T.ancientBlock, 12, 'pickaxe', 4, 'ancientMetalBlock');
def(64, 'Ancient Metal Ore', T.ancientOre, T.ancientOre, T.ancientOre, 8, 'pickaxe', 4, 'ancientMetal');
// Sea life. Kelp, seagrass and sea fans grow under water, so their block is full of water too.
def(65, 'Kelp', T.kelp, T.kelp, T.kelp, 0.05, '', 0, 'kelp', 'cross', true);
def(66, 'Seagrass', T.seagrass, T.seagrass, T.seagrass, 0.05, '', 0, 'seagrass', 'cross', true);
def(67, 'Brain Coral', T.brainCoral, T.brainCoral, T.brainCoral, 1.2, 'pickaxe', 0, 'brainCoral');
def(68, 'Tube Coral', T.tubeCoral, T.tubeCoral, T.tubeCoral, 1.2, 'pickaxe', 0, 'tubeCoral');
def(69, 'Fire Coral', T.fireCoral, T.fireCoral, T.fireCoral, 1.2, 'pickaxe', 0, 'fireCoral');
def(70, 'Purple Sea Fan', T.purpleFan, T.purpleFan, T.purpleFan, 0.05, '', 0, 'purpleFan', 'cross', true);
def(71, 'Yellow Sea Fan', T.yellowFan, T.yellowFan, T.yellowFan, 0.05, '', 0, 'yellowFan', 'cross', true);
def(72, 'Sponge', T.sponge, T.sponge, T.sponge, 0.6, '', 0, 'sponge');
def(73, 'Ladder', T.ladder, T.ladder, T.ladder, 0.4, 'axe', 0, 'ladder', 'ladder', true);
def(74, 'Atlantean Crystal', T.crystal, T.crystal, T.crystal, 1.5, 'pickaxe', 0, 'crystal');
def(75, 'Relic Pedestal', T.pedestalTop, T.pedestalSide, T.pedestalSide, -1, '', 0, null);
def(76, 'Atlantean Stone', T.atlStone, T.atlStone, T.atlStone, 4, 'pickaxe', 1, 'atlStone');
// New building blocks (Oct 22): Chinese glazed roof tiles and red lacquer, glass, terracotta, mosaic, plaster, bronze,
// dyed cloth, Jerusalem stone, scroll shelves and jade.
def(90, 'Yellow Glazed Tile', T.yellowRoof, T.yellowRoof, T.yellowRoof, 3, 'pickaxe', 1, 'yellowRoof');
def(91, 'Green Glazed Tile', T.greenRoof, T.greenRoof, T.greenRoof, 3, 'pickaxe', 1, 'greenRoof');
def(92, 'Red Lacquered Wood', T.redLacquer, T.redLacquer, T.redLacquer, 2, 'axe', 0, 'redLacquer');
def(93, 'Glass', T.glass, T.glass, T.glass, 0.4, '', 0, 'glass', 'cube', true);
def(94, 'Terracotta', T.terracotta, T.terracotta, T.terracotta, 2, 'pickaxe', 0, 'terracotta');
def(95, 'Mosaic', T.mosaic, T.mosaic, T.mosaic, 3, 'pickaxe', 1, 'mosaic');
def(96, 'White Plaster', T.plaster, T.plaster, T.plaster, 1.5, 'pickaxe', 0, 'plaster');
def(97, 'Bronze Block', T.bronze, T.bronze, T.bronze, 5, 'pickaxe', 1, 'bronzeBlock');
def(98, 'Red Cloth', T.redCloth, T.redCloth, T.redCloth, 0.6, '', 0, 'redCloth');
def(99, 'Blue Cloth', T.blueCloth, T.blueCloth, T.blueCloth, 0.6, '', 0, 'blueCloth');
def(100, 'Jerusalem Stone', T.jerusalemStone, T.jerusalemStone, T.jerusalemStone, 3, 'pickaxe', 1, 'jerusalemStone');
def(101, 'Scroll Shelf', T.planks, T.scrollShelf, T.planks, 1.5, 'axe', 0, 'scrollShelf');
def(102, 'Jade', T.jade, T.jade, T.jade, 4, 'pickaxe', 1, 'jade');
def(103, 'Grey Roof Tile', T.greyRoof, T.greyRoof, T.greyRoof, 3, 'pickaxe', 1, 'greyRoof');
def(104, 'Rammed Earth', T.rammedEarth, T.rammedEarth, T.rammedEarth, 1.5, 'shovel', 0, 'rammedEarth');
def(105, 'Purple Cloth', T.purpleCloth, T.purpleCloth, T.purpleCloth, 0.6, '', 0, 'purpleCloth');
// Doors (two blocks high) and gates, across a wall that runs along x ("X") or along z ("Z"), shut or open.
// The bottom half drops the door; the top half goes with it.
for (const [id, axis, open, top] of [[110, 'x', 0, 0], [111, 'x', 0, 1], [112, 'z', 0, 0], [113, 'z', 0, 1], [114, 'x', 1, 0], [115, 'x', 1, 1], [116, 'z', 1, 0], [117, 'z', 1, 1]]) {
  def(id, 'Door', top ? T.doorUpper : T.doorLower, top ? T.doorUpper : T.doorLower, T.planks, 2, 'axe', 0, top ? null : 'door', 'door');
  Object.assign(BLOCKS[id], { axis, open, top, door: true });
}
for (const [id, axis, open] of [[118, 'x', 0], [119, 'z', 0], [120, 'x', 1], [121, 'z', 1]]) {
  def(id, 'Gate', T.gateWood, T.gateWood, T.gateWood, 2, 'axe', 0, 'gate', 'gate');
  Object.assign(BLOCKS[id], { axis, open, gate: true });
}
// ---------- Hugh's resources (October 26): more to find, dig up and gather ----------
// Soils.
def(122, 'Mountain Soil', T.mountainSoil, T.mountainSoil, T.mountainSoil, 0.6, 'shovel', 0, 'mountainSoil');
def(123, 'Black Sand', T.blackSand, T.blackSand, T.blackSand, 0.5, 'shovel', 0, 'blackSand');
// Woods, each with its own leaves. Fig leaves give figs and apple boughs give apples.
def(124, 'Jungle Log', T.logTop, T.jungleSide, T.logTop, 2.6, 'axe', 0, 'jungleLog');
def(125, 'Jungle Leaves', T.jungleLeaves, T.jungleLeaves, T.jungleLeaves, 0.3, '', 0, null, 'cube', true);
def(126, 'Cherry Log', T.logTop, T.cherrySide, T.logTop, 2.5, 'axe', 0, 'cherryLog');
def(127, 'Cherry Blossom', T.cherryBlossom, T.cherryBlossom, T.cherryBlossom, 0.3, '', 0, null, 'cube', true);
def(128, 'Ginkgo Log', T.logTop, T.ginkgoSide, T.logTop, 2.5, 'axe', 0, 'ginkgoLog');
def(129, 'Ginkgo Leaves', T.ginkgoLeaves, T.ginkgoLeaves, T.ginkgoLeaves, 0.3, '', 0, null, 'cube', true);
def(130, 'Acacia Log', T.logTop, T.acaciaSide, T.logTop, 2.5, 'axe', 0, 'acaciaLog');
def(131, 'Acacia Leaves', T.acaciaLeaves, T.acaciaLeaves, T.acaciaLeaves, 0.3, '', 0, null, 'cube', true);
def(132, 'Fig Log', T.logTop, T.figSide, T.logTop, 2.4, 'axe', 0, 'figLog');
def(133, 'Fig Leaves', T.figLeaves, T.figLeaves, T.figLeaves, 0.3, '', 0, 'figs', 'cube', true);
def(134, 'Apple Boughs', T.appleLeaves, T.appleLeaves, T.appleLeaves, 0.3, '', 0, 'apple', 'cube', true);
// Climbers and canes.
def(135, 'Green Vine', T.greenVine, T.greenVine, T.greenVine, 0.1, '', 0, 'greenVine', 'cross', true);
def(136, 'Strangler Vine', T.stranglerVine, T.stranglerVine, T.stranglerVine, 0.4, 'axe', 0, 'stranglerVine', 'cross', true);
def(137, 'Bamboo', T.bamboo, T.bamboo, T.bamboo, 0.4, 'axe', 0, 'bambooRods', 'cross', true);
def(138, 'Papyrus', T.papyrus, T.papyrus, T.papyrus, 0.2, '', 0, 'papyrusRods', 'cross', true);
// Things that grow on trees.
def(139, 'Cocoa Pod', T.cocoaPod, T.cocoaPod, T.cocoaPod, 0.4, '', 0, 'cocoaBean');
def(140, 'Açaí Berries', T.acaiBunch, T.acaiBunch, T.acaiBunch, 0.2, '', 0, 'acaiBerry', 'cross', true);
def(141, 'Beehive', T.hive, T.hive, T.hive, 0.6, '', 0, 'honey');
def(142, 'Silkworm Cocoons', T.cocoon, T.cocoon, T.cocoon, 0.2, '', 0, 'silkFiber', 'cross', true);
// Maize, which grows like wheat: three stages, then a ripe cob.
def(143, 'Maize Sprouts', T.maizeYoung, T.maizeYoung, T.maizeYoung, 0.05, '', 0, 'maizeSeeds', 'cross', true);
def(144, 'Growing Maize', T.maizeYoung, T.maizeYoung, T.maizeYoung, 0.05, '', 0, 'maizeSeeds', 'cross', true);
def(145, 'Ripe Maize', T.maizeRipe, T.maizeRipe, T.maizeRipe, 0.05, '', 0, 'maize', 'cross', true);
// Coloured marble, quarried in different lands.
def(146, 'Green Marble', T.greenMarble, T.greenMarble, T.greenMarble, 3.6, 'pickaxe', 1, 'greenMarble');
def(147, 'Blue Marble', T.blueMarble, T.blueMarble, T.blueMarble, 3.6, 'pickaxe', 1, 'blueMarble');
def(148, 'Red Marble', T.redMarble, T.redMarble, T.redMarble, 3.6, 'pickaxe', 1, 'redMarble');
def(149, 'Purple Marble', T.purpleMarble, T.purpleMarble, T.purpleMarble, 3.6, 'pickaxe', 1, 'purpleMarble');
// Volcanic glass: nearly as hard as black marble, and it takes a good pick to win it.
def(150, 'Obsidian', T.obsidian, T.obsidian, T.obsidian, 10, 'pickaxe', 3, 'obsidian');
// The gems. Diamond and opal are deep and stubborn; amethyst is nearer the surface.
def(151, 'Diamond Ore', T.diamondOre, T.diamondOre, T.diamondOre, 6.5, 'pickaxe', 3, 'diamond');
def(152, 'Emerald Ore', T.emeraldOre, T.emeraldOre, T.emeraldOre, 6, 'pickaxe', 3, 'emerald');
def(153, 'Amethyst Ore', T.amethystOre, T.amethystOre, T.amethystOre, 5, 'pickaxe', 2, 'amethyst');
def(154, 'Black Opal Ore', T.opalOre, T.opalOre, T.opalOre, 7, 'pickaxe', 4, 'blackOpal');
def(155, 'Rock Salt', T.rockSalt, T.rockSalt, T.rockSalt, 2.5, 'pickaxe', 1, 'salt');
// A griffon's nest, high on the cliffs. Break it open and the golden egg is yours — if its mother lets you.
def(156, "Griffon's Nest", T.nestTop, T.nestSide, T.nestSide, 1.2, '', 0, 'goldenEgg');
// Flowing water: 81–87 are thinner and thinner sheets spreading out, 88 is water falling straight down.
for (let a = 1; a <= 8; a++) def(80 + a, 'Water', T.water, T.water, T.water, -1, '', 0, null, 'liquid');
for (let i = 0; i < 256; i++) if (!BLOCKS[i]) def(i, 'Air', 0, 0, 0, 0, '', 0, null, 'none');

export const IS_CUBE = new Uint8Array(256), IS_SOLID = new Uint8Array(256), IS_CROSS = new Uint8Array(256), IS_CUT = new Uint8Array(256), BLOCKS_SKY = new Uint8Array(256);
export const GLOW = new Float32Array(256);
for (const b of BLOCKS) {
  IS_CUBE[b.id] = b.shape === 'cube' ? 1 : 0;
  IS_SOLID[b.id] = ['cube', 'fence', 'bed', 'column'].includes(b.shape) || ((b.shape === 'door' || b.shape === 'gate') && !b.open) ? 1 : 0;
  IS_CROSS[b.id] = b.shape === 'cross' ? 1 : 0;
  IS_CUT[b.id] = b.cut ? 1 : 0;
  BLOCKS_SKY[b.id] = b.shape === 'cube' && !b.cut ? 1 : 0;
}
GLOW[56] = 7.5; GLOW[58] = 9; GLOW[46] = 7; GLOW[60] = 6.5; GLOW[74] = 8;
export const WATER = 40, FALLING = 88;
/// Any kind of water: still (a source), spreading or falling.
export const IS_WATER = new Uint8Array(256);
/// Water, or a sea plant standing in water.
export const IS_WATERY = new Uint8Array(256);
/// How much water a cell holds: 8 for still or falling water, 7 down to 1 as it spreads out.
export const WATER_AMT = new Uint8Array(256);
IS_WATER[40] = 1; WATER_AMT[40] = 8;
for (let a = 1; a <= 8; a++) { IS_WATER[80 + a] = 1; WATER_AMT[80 + a] = a; }
for (let i = 0; i < 256; i++) IS_WATERY[i] = IS_WATER[i];
for (const b of [65, 66, 70, 71]) { IS_WATERY[b] = 1; WATER_AMT[b] = 8; }

// ---------- the world in memory ----------
export class World {
  constructor(n, cells, bio) {
    this.n = n; this.cells = cells; this.bio = bio;
    this.top = new Uint8Array(n * n);        // first y open to the sky, per column
    this.lights = new Map();                 // chunk key → Set of glowing cell indexes
    this.protected = new Map();
    for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) this.top[z * n + x] = this.scanTop(x, z);
    const total = n * n * H;
    for (let i = 0; i < total; i++) if (GLOW[cells[i]] > 0) this.addLight(i);
  }
  idx(x, y, z) { return (y * this.n + z) * this.n + x; }
  inb(x, z) { return x >= 0 && z >= 0 && x < this.n && z < this.n; }
  get(x, y, z) { if (y < 0) return 20; if (x < 0 || z < 0 || x >= this.n || z >= this.n || y >= H) return 0; return this.cells[(y * this.n + z) * this.n + x]; }
  solid(x, y, z) { return IS_SOLID[this.get(x, y, z)] === 1; }
  scanTop(x, z) { for (let y = H - 1; y >= 0; y--) if (BLOCKS_SKY[this.cells[(y * this.n + z) * this.n + x]]) return y + 1; return 0; }
  chunkKey(x, z) { return Math.floor(x / CS) + ',' + Math.floor(z / CS); }
  addLight(i) {
    const n = this.n, x = i % n, z = Math.floor(i / n) % n;
    const k = this.chunkKey(x, z);
    if (!this.lights.has(k)) this.lights.set(k, new Set());
    this.lights.get(k).add(i);
  }
  removeLight(i) {
    const n = this.n, x = i % n, z = Math.floor(i / n) % n;
    this.lights.get(this.chunkKey(x, z))?.delete(i);
  }
  set(x, y, z, b) {
    if (!this.inb(x, z) || y < 0 || y >= H) return;
    const i = this.idx(x, y, z), old = this.cells[i];
    if (old === b) return;
    if (GLOW[old] > 0) this.removeLight(i);
    this.cells[i] = b;
    if (GLOW[b] > 0) this.addLight(i);
    const ci = z * this.n + x;
    if (BLOCKS_SKY[b] && y + 1 > this.top[ci]) this.top[ci] = y + 1;
    else if (BLOCKS_SKY[old] && y + 1 === this.top[ci]) this.top[ci] = this.scanTop(x, z);
  }
  groundY(x, z, below = H - 1) {
    if (!this.inb(x, z)) return 0;
    for (let y = Math.min(below, H - 1); y >= 0; y--) { const b = this.cells[(y * this.n + z) * this.n + x]; if (IS_SOLID[b]) return b === 34 || BLOCKS[b].gate ? y + 1.5 : (BLOCKS[b].shape === 'bed' ? y + 0.56 : y + 1); }
    return 0;
  }
  hasWater(x, z) { return IS_WATER[this.get(x, WL - 1, z)] === 1; }
  skyOpen(x, y, z) { return !this.inb(x, z) || y >= this.top[z * this.n + x]; }
  /// Roughly how much daylight reaches a spot (1 outside, less under a roof, little in a cave).
  skyLight(x, y, z) {
    if (this.skyOpen(x, y, z)) return 1;
    for (let r = 1; r <= 5; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
      if (this.skyOpen(x + dx, y, z + dz)) return SKY_FALLOFF[r];
    }
    return SKY_FALLOFF[6];
  }
  nearestLand(x0, z0) {
    for (let r = 0; r < 80; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
      const x = x0 + dx, z = z0 + dz;
      if (x < 2 || z < 2 || x >= this.n - 2 || z >= this.n - 2) continue;
      const g = Math.floor(this.groundY(x, z)), at = this.get(x, g, z);
      if (g > WL && !this.hasWater(x, z) && (at === 0 || IS_CROSS[at]) && !this.solid(x, g + 1, z)) return [x, z];
    }
    return [x0, z0];
  }
}
export const SKY_FALLOFF = [1, 0.84, 0.68, 0.53, 0.40, 0.29, 0.16];

// ---------- atlas ----------
export const CELL = 16, PAD = 3, TILE = 10;
/// Copies each 10 × 10 picture into a 16 × 16 cell with wrapped borders, so far-away (blurred) blocks don't bleed.
/// `img` holds tiles 0–63 (8 × 8), `extra` holds tiles 64–79 (8 × 2).
export function buildAtlas(img, extra) {
  const c = document.createElement('canvas');
  c.width = CELL * 8; c.height = CELL * TILE_ROWS;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const sheet = tileSheet(img, extra);
  const out = new ImageData(c.width, c.height);
  for (let t = 0; t < 8 * TILE_ROWS; t++) {
    const cx = (t % 8) * CELL, cy = Math.floor(t / 8) * CELL, sx = (t % 8) * TILE, sy = Math.floor(t / 8) * TILE;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const tx = ((x - PAD) % TILE + TILE) % TILE, ty = ((y - PAD) % TILE + TILE) % TILE;
      const src = srcPixel(sheet, sx + tx, sy + ty);
      const o = ((cy + y) * c.width + cx + x) * 4;
      out.data[o] = src[0]; out.data[o + 1] = src[1]; out.data[o + 2] = src[2]; out.data[o + 3] = src[3];
    }
  }
  g.putImageData(out, 0, 0);
  return c;
}
let srcData = null;
function srcPixel(img, x, y) {
  if (!srcData) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); srcData = g.getImageData(0, 0, img.width, img.height); }
  const i = (y * srcData.width + x) * 4;
  return srcData.data.subarray(i, i + 4);
}
export function tileUV(t, u, v) {
  const s = 1 / 8, sv = 1 / TILE_ROWS, k = TILE / CELL, o = PAD / CELL;
  return [(t % 8) * s + (o + u * k) * s, 1 - (Math.floor(t / 8) * sv + (o + v * k) * sv)];
}
/// The sheet of the original 64 pictures, the extra 16 and the 16 drawn here, as one 80 × 120 canvas.
let sheetCache = null;
export function tileSheet(img, extra) {
  if (sheetCache) return sheetCache;
  const c = document.createElement('canvas'); c.width = 80; c.height = 10 * TILE_ROWS;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); if (extra) g.drawImage(extra, 0, 80);
  paintTiles(g);
  sheetCache = c;
  return c;
}
/// The new tiles, drawn pixel by pixel in the same chunky 10 × 10 style.
function paintTiles(g) {
  const rnd = (t, x, y, k = 0) => { let h = (t * 7919 + x * 374761393 + y * 668265263 + k * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const hex = (v) => [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  const shade = (c, f) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  const img = g.createImageData(80, 10 * TILE_ROWS - 100);
  const set = (t, x, y, c, a = 255) => { const i = ((Math.floor((t - 80) / 8) * 10 + y) * 80 + ((t - 80) % 8) * 10 + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = a; };
  const each = (t, fn) => { for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { const r = fn(x, y, rnd(t, x, y)); if (r) set(t, x, y, r[0], r[1] ?? 255); } };
  // Glazed roof tiles: rows of round tiles with a shiny top and a shadow underneath.
  const roof = (t, base) => each(t, (x, y, r) => { const row = y % 3, ridge = x % 3 === 0; let f = row === 0 ? 1.18 : row === 2 ? 0.72 : 1; if (ridge) f *= 0.82; if (r < 0.08) f *= 1.12; return [shade(hex(base), f)]; });
  roof(80, 0xe2b23a); roof(81, 0x3f8a4f);
  each(82, (x, y, r) => [shade(hex(0xa8261e), (x % 4 === 0 ? 0.82 : 1) * (0.94 + r * 0.1) * (y === 0 || y === 9 ? 0.8 : 1))]);
  each(83, (x, y) => (x === 0 || y === 0 || x === 9 || y === 9 ? [hex(0xd8e8f0)] : x === y || x === y + 1 ? [hex(0xf4fbff), 200] : [hex(0xb8d8ec), 0]));
  each(84, (x, y, r) => [shade(hex(0xb5643a), 0.9 + r * 0.18)]);
  const tess = [0xf2efe6, 0x2f5fa8, 0xb5643a, 0xd9b34a, 0x2a2a2a];
  each(85, (x, y) => { if (x % 2 === 1 && y % 2 === 1) return [hex(0x8a8070)]; const k = Math.floor(rnd(85, x >> 1, y >> 1) * 5); return [hex(tess[(Math.abs((x >> 1) - 2) + Math.abs((y >> 1) - 2)) < 2 ? k : 0])]; });
  each(86, (x, y, r) => [shade(hex(0xece6d6), 0.95 + r * 0.06)]);
  each(87, (x, y, r) => [shade(hex(0xb07a3a), (x === 0 || y === 0 ? 1.25 : x === 9 || y === 9 ? 0.7 : 1) * (0.95 + r * 0.1))]);
  const cloth = (t, base) => each(t, (x, y, r) => [shade(hex(base), ((x + y) % 2 ? 0.9 : 1.05) * (0.96 + r * 0.06))]);
  cloth(88, 0xb8322a); cloth(89, 0x2f5fa8);
  // Jerusalem stone: big pale-gold blocks with the flat margin round each face that Herod's masons cut.
  each(90, (x, y, r) => { const mortar = y === 4 || y === 9 || (y < 4 ? x === 6 : x === 1); if (mortar) return [hex(0xb8a478)]; const edge = y === 0 || y === 5 || y === 3 || y === 8; return [shade(hex(0xdcc89a), (edge ? 1.06 : 0.97) * (0.95 + r * 0.08))]; });
  // A shelf of scrolls: a wooden frame with the rolled ends of scrolls in each cubby.
  each(91, (x, y, r) => { if (x === 0 || x === 9 || y === 0 || y === 4 || y === 9) return [hex(0x6b4a2b)]; const end = (x % 3 === 1 || x % 3 === 2) && y % 4 !== 0; return [end ? shade(hex(0xece2c4), r < 0.3 ? 0.85 : 1) : hex(0x3a2716)]; });
  // A wooden gate: posts and rails, gaps you can see through.
  each(92, (x, y) => (x === 0 || x === 9 || y === 2 || y === 3 || y === 7 || x === 4 || x === 5 ? [shade(hex(0x8a6a42), y === 2 || y === 7 ? 1.1 : 1)] : [hex(0x000000), 0]));
  // A plank door in two halves: frame, boards and (on the bottom half) an iron handle.
  each(93, (x, y, r) => { if (x === 0 || x === 9 || y === 9) return [hex(0x5a3a22)]; if (x === 7 && (y === 1 || y === 2)) return [hex(0x8a8f96)]; return [shade(hex(0x9c6a3a), (x % 3 === 0 ? 0.8 : 1) * (0.95 + r * 0.08))]; });
  each(94, (x, y, r) => { if (x === 0 || x === 9 || y === 0) return [hex(0x5a3a22)]; if (y >= 2 && y <= 5 && x >= 2 && x <= 7) return [hex(y === 2 ? 0x5a3a22 : 0xb8d8ec)]; return [shade(hex(0x9c6a3a), (x % 3 === 0 ? 0.8 : 1) * (0.95 + r * 0.08))]; });
  each(95, (x, y, r) => [shade(hex(0x4f9a6a), (rnd(95, x + y * 2, 0) < 0.25 ? 1.25 : 1) * (0.92 + r * 0.12))]);
  roof(96, 0x6a6e74);
  // Rammed earth: layers of packed soil, each pounded down inside a wooden frame.
  each(97, (x, y, r) => [shade(hex(0xa88a62), (y % 3 === 2 ? 0.86 : 1) * (0.93 + r * 0.12))]);
  cloth(98, 0x6a2a6a);

  // ----- Hugh's resources -----
  const clear = [[0, 0, 0], 0];
  // Bark: vertical streaks, a different colour for each tree.
  const bark = (t, base) => each(t, (x, y, r) => [shade(hex(base), (x % 4 === 0 ? 0.78 : x % 4 === 2 ? 1.1 : 1) * (0.93 + r * 0.13))]);
  bark(T.jungleSide, 0x5b6b38); bark(T.cherrySide, 0x6e3b46); bark(T.ginkgoSide, 0x8d8169);
  bark(T.acaciaSide, 0x8a6a3c); bark(T.figSide, 0x9d9382);
  // Leaves: a mottled canopy with a few gaps you can see the sky through.
  const canopy = (t, base, spot) => each(t, (x, y, r) => {
    if (r < 0.07) return clear;
    if (spot && rnd(t, x >> 1, y >> 1, 3) < 0.16) return [hex(spot)];
    return [shade(hex(base), 0.82 + r * 0.36)];
  });
  canopy(T.jungleLeaves, 0x2c6b28); canopy(T.cherryBlossom, 0xf2a9c4, 0xfff0f5);
  canopy(T.ginkgoLeaves, 0xd8c445, 0xa8b03a); canopy(T.acaciaLeaves, 0x7d9a4c);
  canopy(T.figLeaves, 0x3d7a37, 0x6a3a6e);
  canopy(T.appleLeaves, 0x3f7a2f, 0xc43a2a);
  // Vines hang down in strands; the strangler's are thick woody ropes.
  each(T.greenVine, (x, y, r) => {
    const strand = x === 2 || x === 5 || x === 8;
    if (!strand && !(r < 0.1 && x > 0)) return clear;
    return [shade(hex(0x3f8a36), 0.82 + r * 0.4)];
  });
  each(T.stranglerVine, (x, y, r) => {
    const w = x === 3 + (y % 3 === 0 ? 1 : 0) || x === 4 + (y % 3 === 0 ? 1 : 0) || x === 7 - (y % 4 === 0 ? 1 : 0);
    if (!w) return clear;
    return [shade(hex(0x7d6a46), 0.8 + r * 0.42)];
  });
  // Bamboo: bright green canes with a darker knuckle every few blocks.
  each(T.bamboo, (x, y, r) => {
    const cane = (x >= 2 && x <= 4) || (x >= 6 && x <= 7);
    if (!cane) return clear;
    const node = y % 4 === 0;
    return [shade(hex(0x9ec748), (node ? 0.72 : x === 2 || x === 6 ? 1.14 : 1) * (0.95 + r * 0.1))];
  });
  // Papyrus: tall stems with the feathery burst at the top that Egypt made paper from.
  each(T.papyrus, (x, y, r) => {
    if (y <= 3) { if (rnd(T.papyrus, x, y, 5) < 0.45) return [shade(hex(0xa8c45a), 0.85 + r * 0.4)]; return clear; }
    const stem = x === 3 || x === 6;
    return stem ? [shade(hex(0x6f9a38), 0.9 + r * 0.2)] : clear;
  });
  // A cocoa pod on the trunk, and a hanging bunch of açaí berries.
  each(T.cocoaPod, (x, y, r) => {
    const d = Math.hypot(x - 4.5, (y - 4.5) * 0.62);
    if (d > 4.2) return [shade(hex(0x5b4a2a), 0.9 + r * 0.14)];
    return [shade(hex(0xc8752a), (x < 4 ? 1.12 : 0.9) * (0.94 + r * 0.1) * (y % 3 === 0 ? 0.88 : 1))];
  });
  each(T.acaiBunch, (x, y, r) => {
    if (y < 2) return x === 4 || x === 5 ? [hex(0x6a5a3a)] : clear;
    if (rnd(T.acaiBunch, x, y, 7) < 0.3) return clear;
    return [shade(hex(0x3c2b50), 0.8 + r * 0.5)];
  });
  // Maize: a green stalk, then the same stalk with a ripe golden cob.
  each(T.maizeYoung, (x, y, r) => {
    const stalk = x === 4 || x === 5, leaf = (y === 4 || y === 7) && x >= 2 && x <= 7;
    if (!stalk && !leaf) return clear;
    return [shade(hex(0x5f9a35), 0.88 + r * 0.26)];
  });
  each(T.maizeRipe, (x, y, r) => {
    const cob = x >= 5 && x <= 7 && y >= 3 && y <= 7;
    if (cob) return [shade(hex(0xe8c03a), (y % 2 ? 1.08 : 0.9) * (0.95 + r * 0.1))];
    const stalk = x === 3 || x === 4, leaf = (y === 2 || y === 8) && x >= 1 && x <= 6;
    if (!stalk && !leaf) return clear;
    return [shade(hex(0x6f9a3a), 0.88 + r * 0.24)];
  });
  // Coloured marble: polished stone with paler veins running through it.
  const veined = (t, base, vein) => each(t, (x, y, r) => {
    const v = Math.abs((x * 3 + y * 2) % 11 - 5) < 1 || Math.abs((x * 2 - y * 3 + 20) % 13 - 6) < 1;
    return [shade(hex(v ? vein : base), 0.94 + r * 0.12)];
  });
  veined(T.greenMarble, 0x3c6b4c, 0x8fc0a0); veined(T.blueMarble, 0x37578c, 0x9ab6de);
  veined(T.redMarble, 0x8a3732, 0xd8a098); veined(T.purpleMarble, 0x66386e, 0xc0a0cc);
  // Obsidian: volcanic glass, almost black, with a purple sheen where it catches the light.
  each(T.obsidian, (x, y, r) => {
    const sheen = rnd(T.obsidian, x >> 1, y >> 1, 11) < 0.2;
    return [shade(hex(sheen ? 0x3a2a52 : 0x15111f), 0.9 + r * 0.3)];
  });
  // Gems and ores in stone: speckles of colour in a grey rock face.
  const ore = (t, gem, k = 7) => each(t, (x, y, r) => {
    const stone = shade(hex(0x7f7f7f), 0.9 + r * 0.2);
    const d = (cx, cy) => Math.hypot(x - cx, y - cy);
    const near = d(2.5, 3) < 1.6 || d(7, 6.5) < 1.6 || (k > 5 && d(5.5, 1.5) < 1.2);
    if (!near) return [stone];
    return [shade(hex(gem), 0.85 + r * 0.42)];
  });
  ore(T.diamondOre, 0x9fe6f2); ore(T.emeraldOre, 0x2fc46a); ore(T.amethystOre, 0x9d55cf);
  each(T.opalOre, (x, y, r) => {
    const d = (cx, cy) => Math.hypot(x - cx, y - cy);
    if (!(d(3, 3) < 1.8 || d(6.5, 6.5) < 1.8)) return [shade(hex(0x7f7f7f), 0.9 + r * 0.2)];
    // black opal: dark, but every fleck a different colour of the rainbow
    const fire = [0x1a1a22, 0x1a4a6a, 0x2a6a3a, 0x7a2a4a, 0x6a5a1a][Math.floor(rnd(T.opalOre, x, y, 13) * 5)];
    return [shade(hex(fire), 0.88 + r * 0.36)];
  });
  // Mountain soil is thin and stony; black sand is ground-up lava.
  each(T.mountainSoil, (x, y, r) => {
    const pebble = rnd(T.mountainSoil, x >> 1, y >> 1, 17) < 0.28;
    return [shade(hex(pebble ? 0x8a8378 : 0x6b5a46), 0.9 + r * 0.22)];
  });
  each(T.blackSand, (x, y, r) => [shade(hex(0x2b2b31), 0.82 + r * 0.42)]);
  // Rock salt: pale crystals with the faint pink of desert salt.
  each(T.rockSalt, (x, y, r) => {
    const face = (x + y) % 4 < 2;
    return [shade(hex(r < 0.14 ? 0xe8c0bc : 0xeee8e0), (face ? 1.04 : 0.92) * (0.95 + r * 0.1))];
  });
  // The griffon's nest: a great ring of woven sticks, seen from above and from the side.
  each(T.nestTop, (x, y, r) => {
    const d = Math.hypot(x - 4.5, y - 4.5);
    if (d < 2.4) return [shade(hex(0x3a2a18), 0.88 + r * 0.2)];
    return [shade(hex(0x7a5f38), ((x + y) % 3 === 0 ? 0.78 : 1.06) * (0.92 + r * 0.14))];
  });
  each(T.nestSide, (x, y, r) => {
    const stick = (y + Math.floor(x / 3)) % 3 !== 2;
    return [shade(hex(stick ? 0x7a5f38 : 0x4a3a22), 0.9 + r * 0.22)];
  });
  // A beehive, and the silkworm cocoons that China spun into silk.
  each(T.hive, (x, y, r) => {
    const cx = (x + (y % 4 < 2 ? 0 : 2)) % 4, cell = cx < 2 && y % 2 === 0;
    return [shade(hex(cell ? 0xb8862a : 0xe2b64e), 0.94 + r * 0.12)];
  });
  each(T.cocoon, (x, y, r) => {
    if (x === 0 || x === 9) return [shade(hex(0x5a4a2a), 0.9 + r * 0.2)];
    const pod = Math.hypot((x - 4.5) * 0.9, (y % 5 - 2) * 1.5) < 2.2;
    if (!pod) return clear;
    return [shade(hex(0xf0ece0), 0.86 + r * 0.26)];
  });
  g.putImageData(img, 0, 100);
}

// ---------- materials: sun and sky light the daylight part; firelight is added on top ----------
export const shared = {
  uTime: { value: 0 }, uHand: { value: new THREE.Vector4(0, 0, 0, 0) }, uTorch: { value: new THREE.Color(1, 0.7, 0.4) }, uSway: { value: 1 },
  // Water: the colour of deep water, daylight (0 night … 1 noon), whether your eyes are under water, the sun and sky.
  uDeep: { value: new THREE.Color(0.02, 0.13, 0.22) }, uDay: { value: 1 }, uCamUnder: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 0.95, 0.85) },
  uSkyCol: { value: new THREE.Color(0.7, 0.82, 0.95) }, uSkyTop: { value: new THREE.Color(0.3, 0.5, 0.85) },
};
// How fast water swallows each colour (per block): red first, then green; blue goes farthest, so things look bluer the deeper or farther they are.
const ABSORB = 'vec3(0.13, 0.05, 0.032)';
export function blockMaterial(tex, kind) {
  const m = new THREE.MeshLambertMaterial({ map: tex, side: kind === 'cut' ? THREE.DoubleSide : THREE.FrontSide });
  if (kind === 'cut') { m.alphaTest = 0.5; }
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, shared);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 lt; attribute float wd;
        uniform float uTime; uniform vec4 uHand; uniform vec3 uTorch; uniform float uSway;
        varying float vSky; varying vec3 vFire; varying float vWd; varying vec3 vWp;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
        vSky = lt.x; vWd = wd;
        vec3 fire = lt.y * uTorch * (0.9 + 0.1 * sin(uTime * 9.0 + wp.x * 2.3 + wp.z * 1.7) * sin(uTime * 13.1 + wp.y * 1.9 + wp.x * 0.7));   // firelight flickers
        if (uHand.w > 0.0) { float h = clamp(1.0 - distance(wp, uHand.xyz) / uHand.w, 0.0, 1.0); fire = max(fire, h * h * uTorch); }
        vFire = fire;
        if (lt.z > 0.5 && lt.z < 1.5) {
          transformed.x += sin(uTime * 1.7 + wp.x * 0.9 + wp.z * 0.6 + wp.y * 0.3) * 0.05 * uSway;
          transformed.z += cos(uTime * 1.3 + wp.x * 0.5 + wp.z * 0.8) * 0.04 * uSway;
        } else if (lt.z > 2.5) {
          // Kelp: the whole stalk leans with the swell, more the higher up it is.
          float k = 0.10 + 0.04 * sin(wp.y * 0.7);
          transformed.x += sin(uTime * 0.8 + wp.y * 0.45 + wp.x * 0.3) * k * uSway;
          transformed.z += cos(uTime * 0.6 + wp.y * 0.4 + wp.z * 0.3) * k * uSway;
        } else if (lt.z > 1.5) {
          transformed.y += (sin(uTime * 1.3 + wp.x * 0.7 + wp.z * 0.2) + cos(uTime * 0.9 + wp.z * 0.8 - wp.x * 0.3)) * 0.035 * uSway;
        }
        vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; uniform vec3 uDeep; uniform float uDay; uniform float uCamUnder;
        varying float vSky; varying vec3 vFire; varying float vWd; varying vec3 vWp;`)
      .replace('#include <opaque_fragment>', `outgoingLight = outgoingLight * vSky + diffuseColor.rgb * vFire;
        if (vWd > -50.0) {
          float under = vWd - vWp.y;
          if (under > 0.0) {
            // Light dances on the sea floor (caustics), fading with depth.
            float c = sin(vWp.x * 1.7 + uTime * 1.3 + sin(vWp.z * 1.1 + uTime)) * sin(vWp.z * 1.9 - uTime * 1.1 + sin(vWp.x * 0.9));
            outgoingLight += outgoingLight * max(c, 0.0) * 0.45 * exp(-under * 0.22) * uDay * vSky;
            // How much water the light passes through on its way to your eye.
            float dist = length(cameraPosition - vWp);
            float path = uCamUnder > 0.5 ? dist : under * dist / max(cameraPosition.y - vWp.y, 0.35);
            path = min(path, 90.0) + under * 0.4;
            outgoingLight = outgoingLight * exp(-${ABSORB} * path) + uDeep * vSky * (1.0 - exp(-0.055 * path));
          }
        }
        #include <opaque_fragment>`);
  };
  return m;
}

/// The water surface: nearly clear when you look down into it close by; bluer, and more like a mirror of the sky,
/// the farther away and the flatter you look across it.
export function waterMaterial(tex) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: tex } }]);
  Object.assign(uniforms, shared);
  uniforms.map = { value: tex };
  return new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `
      attribute vec3 lt;
      uniform float uTime; uniform vec4 uHand; uniform vec3 uTorch; uniform float uSway;
      varying vec2 vUv; varying vec3 vWorld; varying float vSky; varying vec3 vFire; varying vec3 vN; varying float vFlag;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        vec3 wp = (modelMatrix * vec4(p, 1.0)).xyz;
        vFlag = lt.z;
        if (lt.z > 1.5 && lt.z < 2.5) p.y += (sin(uTime * 1.3 + wp.x * 0.7 + wp.z * 0.2) + cos(uTime * 0.9 + wp.z * 0.8 - wp.x * 0.3)) * 0.035 * uSway;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
        vUv = uv; vSky = lt.x; vN = normal;
        vec3 fire = lt.y * uTorch * (0.9 + 0.1 * sin(uTime * 9.0 + wp.x * 2.3 + wp.z * 1.7) * sin(uTime * 13.1 + wp.y * 1.9 + wp.x * 0.7));   // firelight flickers
        if (uHand.w > 0.0) { float h = clamp(1.0 - distance(wp, uHand.xyz) / uHand.w, 0.0, 1.0); fire = max(fire, h * h * uTorch); }
        vFire = fire;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform float uTime; uniform vec3 uDeep; uniform float uDay; uniform float uCamUnder;
      uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uSkyTop;
      varying vec2 vUv; varying vec3 vWorld; varying float vSky; varying vec3 vFire; varying vec3 vN; varying float vFlag;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        vec3 V = normalize(cameraPosition - vWorld);
        vec3 N = normalize(vN);
        bool top = abs(N.y) > 0.5;
        if (top) {
          // Little ripples.
          N = normalize(vec3(
            sin(vWorld.x * 2.1 + uTime * 1.7) * 0.05 + sin(vWorld.z * 1.3 - uTime * 1.1 + vWorld.x * 0.4) * 0.04,
            1.0,
            cos(vWorld.z * 2.3 + uTime * 1.5) * 0.05 + cos(vWorld.x * 1.7 + uTime * 0.8 - vWorld.z * 0.5) * 0.04));
        }
        if (dot(N, V) < 0.0) N = -N;
        float cosT = clamp(dot(N, V), 0.0, 1.0);
        float fres = 0.03 + 0.97 * pow(1.0 - cosT, 5.0);
        float dist = length(cameraPosition - vWorld);
        float far = smoothstep(4.0, 80.0, dist);
        vec4 tex = texture2D(map, vUv);
        float detail = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
        float light = vSky * (0.35 + 0.65 * uDay);
        // The water's own colour (light scattered back from deep inside it) and the sky it reflects.
        vec3 body = uDeep * (0.45 + 0.55 * vSky) + vFire * 0.25;
        vec3 sky = mix(uSkyTop, uSkyCol, 0.45) * light * 0.75;
        vec3 col = mix(body, sky, fres * 0.45);
        // Farther away you see more water and less of what's under it: a deeper and deeper blue.
        col = mix(col, uDeep * 1.1, far * 0.75);
        float spec = pow(max(dot(reflect(-V, N), normalize(uSunDir)), 0.0), 220.0) * uDay * vSky;
        col += uSunCol * spec * 2.5;
        col *= 0.9 + detail * 0.2;
        float alpha = clamp(0.05 + fres * 0.35 + far * 0.8, 0.0, 0.96);
        if (!top) alpha = max(alpha, 0.3);
        if (uCamUnder > 0.5) { col = body * 1.2 + sky * 0.2; alpha = 0.6; }
        if (vFlag > 3.5) {
          // A waterfall: white streaks of foam rushing down a sheet of blue-green water.
          float across = abs(vN.x) > 0.5 ? vWorld.z : vWorld.x;
          float lane = floor(across * 6.0);
          float seed = fract(sin(lane * 12.9898) * 43758.5453);
          float streak = fract(vWorld.y * (0.28 + seed * 0.2) + uTime * (1.5 + seed * 1.2) + seed * 7.0);
          float band = smoothstep(0.0, 0.18, streak) * smoothstep(1.0, 0.45, streak);
          vec3 foam = vec3(0.88, 0.94, 1.0) * (0.3 + 0.7 * light);
          col = mix(body * 1.5 + sky * 0.25, foam, 0.3 + 0.55 * band);
          alpha = 0.78 + 0.18 * band;
        }
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #ifdef USE_FOG
          // Far-off sea fades into a deep blue rather than into the pale haze over the land.
          float fogF = smoothstep(fogNear, fogFar, vFogDepth);
          vec3 seaHaze = uCamUnder > 0.5 ? fogColor : mix(fogColor, pow(uDeep * 1.6, vec3(0.4545)), 0.6);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, seaHaze, fogF);
          gl_FragColor.a = mix(gl_FragColor.a, 1.0, fogF);
        #endif
      }`,
  });
}

// ---------- chunk meshing ----------
const DX = [1, -1, 0, 0, 0, 0], DY = [0, 0, 1, -1, 0, 0], DZ = [0, 0, 0, 0, 1, -1];
const CORNERS = [
  [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]],
  [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]],
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
  [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]],
];
const NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const AO = [0.5, 0.66, 0.83, 1];
const lin = (v) => Math.pow(Math.max(0, Math.min(1, v)), 2.2);

class Mesh {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.lt = []; this.wd = []; this.idx = []; }
  geometry() {
    if (!this.idx.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('lt', new THREE.Float32BufferAttribute(this.lt, 3));
    g.setAttribute('wd', new THREE.Float32BufferAttribute(this.wd, 1));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

export function meshChunk(w, cx, cz, only = null) {
  const out = { solid: new Mesh(), cut: new Mesh(), water: new Mesh() };
  const x0 = cx * CS, z0 = cz * CS, x1 = Math.min(x0 + CS, w.n), z1 = Math.min(z0 + CS, w.n);
  const skyCache = new Map();
  const sky = (x, y, z) => {
    if (only) return 1;
    if (w.skyOpen(x, y, z)) return 1;
    const k = (y * 4096 + (z - z0 + 8)) * 64 + (x - x0 + 8);
    let v = skyCache.get(k);
    if (v === undefined) { v = w.skyLight(x, y, z); skyCache.set(k, v); }
    return v;
  };
  // Lights within reach of this chunk.
  const emit = [];
  if (!only) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const set = w.lights.get((cx + dx) + ',' + (cz + dz));
    if (!set) continue;
    for (const i of set) { const n = w.n, x = i % n, z = Math.floor(i / n) % n, y = Math.floor(i / (n * n)); emit.push([x + 0.5, y + 0.5, z + 0.5, GLOW[w.cells[i]]]); }
  }
  const fire = (px, py, pz, nx, ny, nz) => {
    let best = 0;
    for (const e of emit) {
      const dx = e[0] - px, dy = e[1] - py, dz = e[2] - pz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d >= e[3] || dx * nx + dy * ny + dz * nz < -0.3) continue;
      const v = 1 - d / e[3];
      best = Math.max(best, v * (0.6 + 0.4 * v));
    }
    return best;
  };
  const get = only ? ((x, y, z) => only.get(x, y, z)) : ((x, y, z) => w.get(x, y, z));
  const occ = (x, y, z) => IS_CUBE[get(x, y, z)] && !IS_CUT[get(x, y, z)] ? 1 : 0;
  // Where the water surface is above a spot (so things under water can be tinted by the water above them).
  const surfCache = new Map();
  const surf = (x, y, z) => {
    if (!IS_WATERY[get(x, y, z)]) return NO_WATER;
    const k = (x * 4099 + z) * 128 + y;
    let v = surfCache.get(k);
    if (v === undefined) { let yy = y; while (yy < H - 1 && IS_WATERY[get(x, yy + 1, z)]) yy++; v = yy + waterHeight(get(x, yy, z), 0); surfCache.set(k, v); }
    return v;
  };
  let maxY = 0;
  for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) { for (let y = H - 1; y > maxY; y--) if (get(x, y, z)) { maxY = y; break; } }
  for (let y = 0; y <= maxY; y++) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
    const b = get(x, y, z);
    if (!b) continue;
    const info = BLOCKS[b];
    if (IS_CUBE[b]) {
      const cut = IS_CUT[b];
      for (let f = 0; f < 6; f++) {
        const nb = get(x + DX[f], y + DY[f], z + DZ[f]);
        const visible = !IS_CUBE[nb] || (IS_CUT[nb] && nb !== b);
        if (!visible || (f === 3 && y === 0)) continue;
        const tile = f === 2 ? info.top : (f === 3 ? info.bottom : info.side);
        face(cut ? out.cut : out.solid, x, y, z, f, tile, cut, occ, sky, fire, surf(x + DX[f], y + DY[f], z + DZ[f]));
      }
    } else if (info.shape === 'cross') {
      const glow = GLOW[b] > 0;
      const s = glow ? 1 : sky(x, y, z), fi = glow ? 1 : fire(x + 0.5, y + 0.5, z + 0.5, 0, 1, 0);
      cross(out.cut, x, y, z, info.top, s, fi, !glow && b !== 33, surf(x, y, z), b === 65);
      if (IS_WATERY[b]) water(out.water, get, x, y, z, b, s, fi);
    } else if (info.shape === 'liquid') {
      water(out.water, get, x, y, z, b, sky(x, y, z), fire(x + 0.5, y + 0.9, z + 0.5, 0, 1, 0));
    } else if (info.shape === 'ladder') {
      const lt = [sky(x, y, z), fire(x + 0.5, y + 0.5, z + 0.5, 0, 1, 0)];
      ladder(out.cut, get, x, y, z, info.top, lt);
    } else if (info.shape === 'fence') {
      const lt = [sky(x, y, z), fire(x + 0.5, y + 0.5, z + 0.5, 0, 1, 0)];
      box(out.solid, x, y, z, [0.375, 0, 0.375], [0.625, 1.5, 0.625], T.planks, T.planks, lt);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nb = get(x + dx, y, z + dz);
        if (!(nb === 34 || (IS_CUBE[nb] && !IS_CUT[nb]))) continue;
        for (const [r0, r1] of [[0.38, 0.53], [0.95, 1.1]]) {
          const a = dx === 1 ? [0.625, r0, 0.44] : dx === -1 ? [0, r0, 0.44] : dz === 1 ? [0.44, r0, 0.625] : [0.44, r0, 0];
          const c = dx === 1 ? [1, r1, 0.56] : dx === -1 ? [0.375, r1, 0.56] : dz === 1 ? [0.56, r1, 1] : [0.56, r1, 0.375];
          box(out.solid, x, y, z, a, c, T.planks, T.planks, lt);
        }
      }
    } else if (info.shape === 'column') {
      box(out.solid, x, y, z, [0.17, 0, 0.17], [0.83, 1, 0.83], info.top, info.side, [sky(x, y, z), fire(x + 0.5, y + 0.5, z + 0.5, 0, 1, 0)], surf(x, y + 1, z));
    } else if (info.shape === 'door' || info.shape === 'gate') {
      // A door is a plank panel across its doorway; open, it swings against the side of the doorway.
      const lt = [sky(x, y, z), fire(x + 0.5, y + 0.5, z + 0.5, 0, 1, 0)];
      const [p0, p1] = info.open ? (info.axis === 'x' ? [[0, 0, 0], [0.12, 1, 1]] : [[0, 0, 0], [1, 1, 0.12]]) : (info.axis === 'x' ? [[0, 0, 0.44], [1, 1, 0.56]] : [[0.44, 0, 0], [0.56, 1, 1]]);
      box(info.gate ? out.cut : out.solid, x, y, z, p0, p1, info.top, info.side, lt);
    } else if (info.shape === 'bed') {
      box(out.solid, x, y, z, [0, 0, 0], [1, 0.56, 1], info.top, info.side, [sky(x, y + 1, z), fire(x + 0.5, y + 0.5, z + 0.5, 0, 1, 0)]);
    }
  }
  return { solid: out.solid.geometry(), cut: out.cut.geometry(), water: out.water.geometry() };
}

function face(m, x, y, z, f, tile, sway, occ, sky, fire, wd) {
  const qx = x + DX[f], qy = y + DY[f], qz = z + DZ[f];
  const [nx, ny, nz] = NORMALS[f];
  const base = m.pos.length / 3;
  const levels = [3, 3, 3, 3];
  const skyHere = sky(qx, qy, qz);
  const jit = 0.95 + 0.08 * ((((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 1000) / 1000;
  CORNERS[f].forEach(([ox, oy, oz], i) => {
    let c1, c2, c3;
    if (f < 2) { const a = oy ? 1 : -1, b = oz ? 1 : -1; c1 = [qx, qy + a, qz]; c2 = [qx, qy, qz + b]; c3 = [qx, qy + a, qz + b]; }
    else if (f < 4) { const a = ox ? 1 : -1, b = oz ? 1 : -1; c1 = [qx + a, qy, qz]; c2 = [qx, qy, qz + b]; c3 = [qx + a, qy, qz + b]; }
    else { const a = ox ? 1 : -1, b = oy ? 1 : -1; c1 = [qx + a, qy, qz]; c2 = [qx, qy + b, qz]; c3 = [qx + a, qy + b, qz]; }
    const s1 = occ(...c1), s2 = occ(...c2), cc = occ(...c3);
    const level = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
    levels[i] = level;
    let ss = skyHere, sn = 1;
    if (!s1) { ss += sky(...c1); sn++; }
    if (!s2) { ss += sky(...c2); sn++; }
    if (!cc && (!s1 || !s2)) { ss += sky(...c3); sn++; }
    const px = x + ox, py = y + oy, pz = z + oz;
    const shade = AO[level] * jit * (f === 3 ? 0.8 : 1);
    m.pos.push(px, py, pz);
    m.nrm.push(nx, ny, nz);
    m.lt.push(lin(shade * ss / sn), lin(shade * fire(px + nx * 0.5, py + ny * 0.5, pz + nz * 0.5, nx, ny, nz)), sway ? 1 : 0);
    m.wd.push(wd);
    let u, v;
    switch (f) {
      case 0: u = 1 - oz; v = 1 - oy; break;
      case 1: u = oz; v = 1 - oy; break;
      case 4: u = ox; v = 1 - oy; break;
      case 5: u = 1 - ox; v = 1 - oy; break;
      case 2: u = ox; v = oz; break;
      default: u = ox; v = 1 - oz;
    }
    m.uv.push(...tileUV(tile, u, v));
  });
  if (levels[0] + levels[2] >= levels[1] + levels[3]) m.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  else m.idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
}

function quad(m, pts, uvs, normal, l, flagFn, wd = NO_WATER) {
  const base = m.pos.length / 3;
  for (let i = 0; i < 4; i++) {
    m.pos.push(...pts[i]); m.nrm.push(...normal);
    m.lt.push(lin(l[0]), lin(l[1]), flagFn ? flagFn(i, pts[i]) : 0);
    m.wd.push(wd);
    m.uv.push(...uvs[i]);
  }
  m.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function box(m, bx, by, bz, a, b, top, side, lt, wd = NO_WATER) {
  const x0 = bx + a[0], y0 = by + a[1], z0 = bz + a[2], x1 = bx + b[0], y1 = by + b[1], z1 = bz + b[2];
  const vTop = Math.max(0, 1 - (b[1] - a[1])), clamp = (v) => Math.min(Math.max(v, 0), 1);
  const uv = (t, u, v) => tileUV(t, clamp(u), clamp(v));
  quad(m, [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [uv(top, a[0], a[2]), uv(top, a[0], b[2]), uv(top, b[0], b[2]), uv(top, b[0], a[2])], [0, 1, 0], lt, null, wd);
  quad(m, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [uv(side, 1 - a[2], 1), uv(side, 1 - a[2], vTop), uv(side, 1 - b[2], vTop), uv(side, 1 - b[2], 1)], [1, 0, 0], lt, null, wd);
  quad(m, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [uv(side, a[2], 1), uv(side, b[2], 1), uv(side, b[2], vTop), uv(side, a[2], vTop)], [-1, 0, 0], lt, null, wd);
  quad(m, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [uv(side, a[0], 1), uv(side, b[0], 1), uv(side, b[0], vTop), uv(side, a[0], vTop)], [0, 0, 1], lt, null, wd);
  quad(m, [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], [uv(side, 1 - a[0], 1), uv(side, 1 - a[0], vTop), uv(side, 1 - b[0], vTop), uv(side, 1 - b[0], 1)], [0, 0, -1], lt, null, wd);
}

function cross(m, x, y, z, tile, s, fi, sway, wd = NO_WATER, kelp = false) {
  const a = 0.15, b = 0.85;
  const uvs = [tileUV(tile, 0, 1), tileUV(tile, 0, 0), tileUV(tile, 1, 0), tileUV(tile, 1, 1)];
  // Kelp sways along its whole height (3 = the bottom sways too, so a tall stalk bends as one).
  const flag = kelp ? (() => 3) : sway ? ((i, p) => (p[1] > y + 0.5 ? 1 : 0)) : null;
  quad(m, [[x + a, y, z + a], [x + a, y + 1, z + a], [x + b, y + 1, z + b], [x + b, y, z + b]], uvs, [0, 1, 0], [s * 0.95, fi * 0.95], flag, wd);
  quad(m, [[x + a, y, z + b], [x + a, y + 1, z + b], [x + b, y + 1, z + a], [x + b, y, z + a]], uvs, [0, 1, 0], [s * 0.95, fi * 0.95], flag, wd);
}

/// A ladder lies flat against the first solid wall next to it.
function ladder(m, get, x, y, z, tile, lt) {
  let dir = [0, -1];
  for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nb = get(x + d[0], y, z + d[1]); if (IS_CUBE[nb] && !IS_CUT[nb]) { dir = d; break; } }
  const o = 0.06, uvs = [tileUV(tile, 0, 1), tileUV(tile, 0, 0), tileUV(tile, 1, 0), tileUV(tile, 1, 1)];
  let pts;
  if (dir[0] === 1) pts = [[x + 1 - o, y, z], [x + 1 - o, y + 1, z], [x + 1 - o, y + 1, z + 1], [x + 1 - o, y, z + 1]];
  else if (dir[0] === -1) pts = [[x + o, y, z + 1], [x + o, y + 1, z + 1], [x + o, y + 1, z], [x + o, y, z]];
  else if (dir[1] === 1) pts = [[x + 1, y, z + 1 - o], [x + 1, y + 1, z + 1 - o], [x, y + 1, z + 1 - o], [x, y, z + 1 - o]];
  else pts = [[x, y, z + o], [x, y + 1, z + o], [x + 1, y + 1, z + o], [x + 1, y, z + o]];
  quad(m, pts, uvs, [-dir[0], 0, -dir[1]], lt);
}

/// How high the water stands in a cell (a full cell when there's more water on top).
export function waterHeight(b, above) {
  if (IS_WATERY[above]) return 1;
  const a = WATER_AMT[b];
  return a >= 8 ? 0.89 : Math.max(a, 1) / 8 * 0.89;
}
export const NO_WATER = -100;

function water(m, get, x, y, z, b, s, fi) {
  const above = get(x, y + 1, z);
  const covered = IS_WATERY[above];
  const own = waterHeight(b, above);
  // Each corner is the average of the water around it, so spreading water slopes down smoothly.
  const corner = (cx, cz) => {
    if (covered) return 1;
    let sum = 0, n = 0;
    for (const [ox, oz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) {
      const qx = cx + ox, qz = cz + oz, q = get(qx, y, qz);
      if (IS_WATERY[q]) { const h = waterHeight(q, get(qx, y + 1, qz)); if (h >= 1) return 1; sum += h; n++; }
      else if (q === 0 || (IS_CROSS[q] && !IS_WATERY[q])) { n += 0.35; }
    }
    return n ? Math.max(sum / n, 0.06) : own;
  };
  const h00 = corner(x, z), h10 = corner(x + 1, z), h11 = corner(x + 1, z + 1), h01 = corner(x, z + 1);
  const t = T.water, uvs = [tileUV(t, 0, 0), tileUV(t, 0, 1), tileUV(t, 1, 1), tileUV(t, 1, 0)];
  if (!covered && !(IS_CUBE[above] && !IS_CUT[above])) {
    quad(m, [[x, y + h00, z], [x, y + h01, z + 1], [x + 1, y + h11, z + 1], [x + 1, y + h10, z]], uvs, [0, 1, 0], [s, fi], () => 2);
  }
  const below = get(x, y - 1, z);
  if (!IS_WATERY[below] && !(IS_CUBE[below] && !IS_CUT[below]) && !IS_SOLID[below]) {
    quad(m, [[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]], uvs, [0, -1, 0], [s * 0.7, fi * 0.7]);
  }
  // Sides: [direction, the two corner heights along that edge, the four points given two heights]
  const sides = [
    [1, 0, h10, h11, (lo0, lo1, a, c) => [[x + 1, y + lo0, z], [x + 1, y + a, z], [x + 1, y + c, z + 1], [x + 1, y + lo1, z + 1]]],
    [-1, 0, h00, h01, (lo0, lo1, a, c) => [[x, y + lo0, z], [x, y + lo1, z + 1], [x, y + c, z + 1], [x, y + a, z]]],
    [0, 1, h01, h11, (lo0, lo1, a, c) => [[x, y + lo0, z + 1], [x + 1, y + lo1, z + 1], [x + 1, y + c, z + 1], [x, y + a, z + 1]]],
    [0, -1, h00, h10, (lo0, lo1, a, c) => [[x, y + lo0, z], [x, y + a, z], [x + 1, y + c, z], [x + 1, y + lo1, z]]],
  ];
  for (const [sx, sz, a, c, pts] of sides) {
    const nb = get(x + sx, y, z + sz);
    if (IS_CUBE[nb] && !IS_CUT[nb]) continue;
    let lo = 0;
    if (IS_WATERY[nb]) {
      lo = waterHeight(nb, get(x + sx, y + 1, z + sz));
      if (lo >= Math.max(a, c) - 0.01) continue;
    }
    quad(m, pts(Math.min(lo, a), Math.min(lo, c), a, c), uvs, [sx, 0, sz], [s * 0.8, fi * 0.8], b === FALLING ? () => 4 : null);
  }
}

// ---------- the sky ----------
export function makeSky() {
  const geo = new THREE.SphereGeometry(400, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, night: { value: 0 }, sunCol: { value: new THREE.Color(1, 0.95, 0.8) }, warm: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform float night; uniform vec3 sunCol; uniform float warm; varying vec3 vDir;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){
        float y = max(vDir.y, 0.0);
        vec3 c = mix(horizon, top, pow(y, 0.55));
        if (vDir.y < 0.0) c = horizon * (1.0 + vDir.y * 0.6);
        float s = max(dot(vDir, sunDir), 0.0);
        c += sunCol * (pow(s, 900.0) * 3.0 + pow(s, 12.0) * 0.18) * (1.0 - night);
        // Sunrise and sunset: a band of orange and pink low in the sky, strongest on the sun's side.
        vec2 hs = normalize(sunDir.xz + vec2(1e-4)), hv = normalize(vDir.xz + vec2(1e-4));
        float side = 0.35 + 0.65 * pow(max(dot(hs, hv), 0.0), 2.0);
        float band = exp(-abs(vDir.y - 0.04) * 7.0);
        c = mix(c, mix(vec3(1.0, 0.45, 0.25), vec3(0.95, 0.55, 0.65), smoothstep(0.0, 0.4, vDir.y)), clamp(warm * band * side, 0.0, 0.75));
        vec3 m = -sunDir; float ms = max(dot(vDir, m), 0.0);
        c += vec3(0.85,0.9,1.0) * pow(ms, 1600.0) * 2.0 * night;
        vec3 q = floor(vDir * 220.0); float st = step(0.9975, h(q)) * night * smoothstep(0.0, 0.25, vDir.y);
        c += vec3(st);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}
