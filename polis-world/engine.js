// Polis World (computer version): blocks, the world in memory, chunk meshes with light and shade, materials and sky.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { SKY_GLSL, CLOUD_GLSL, PANO_GLSL, HASH_GLSL, makeNoiseTexture } from './shaders.js';

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
  // Hugh's megajungle.
  ironwoodSide: 134, ironwoodLeaves: 135, waterMoss: 136, drainerVine: 137, floodHole: 138, ironwoodTop: 139,
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
// ---------- Hugh's megajungle (November 1) ----------
// Ironwood: the hardest wood there is. It takes a long time to chop, even with a good axe.
def(157, 'Ironwood Log', T.ironwoodTop, T.ironwoodSide, T.ironwoodTop, 9, 'axe', 1, 'ironwoodLog');
def(158, 'Ironwood Leaves', T.ironwoodLeaves, T.ironwoodLeaves, T.ironwoodLeaves, 0.4, '', 0, null, 'cube', true);
// Waterblock moss: a thick wet moss that water can't get through, so it holds pools of rain up in the trees.
def(159, 'Waterblock Moss', T.waterMoss, T.waterMoss, T.waterMoss, 0.8, 'shovel', 0, 'waterMoss');
// Drainer vines: you can climb them like a ladder, but they drain your health while you hold on.
def(160, 'Drainer Vine', T.drainerVine, T.drainerVine, T.drainerVine, 0.3, '', 0, 'drainerVine', 'cross', true);
BLOCKS[160].climb = true; BLOCKS[73].climb = true;
// A flash-flood hole: step too close and water bursts out of it.
def(161, 'Flash-Flood Hole', T.floodHole, T.grassSide, T.dirt, -1, '', 0, null);
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
  // ----- Hugh's megajungle -----
  // Ironwood: dark grey-brown bark in deep ridges, with a dense, almost black heart.
  each(T.ironwoodSide, (x, y, r) => [shade(hex(0x4a3f36), (x % 3 === 0 ? 0.62 : x % 3 === 1 ? 1.12 : 0.9) * (y % 5 === 0 && x % 3 ? 0.85 : 1) * (0.9 + r * 0.18))]);
  each(T.ironwoodTop, (x, y, r) => { const d = Math.hypot(x - 4.5, y - 4.5); return [shade(hex(d > 4 ? 0x4a3f36 : Math.floor(d) % 2 ? 0x3a2a22 : 0x2a1e18), 0.9 + r * 0.16)]; });
  canopy(T.ironwoodLeaves, 0x2a6234, 0x3a7a44);
  // Waterblock moss: deep wet green, thick and spongy, with drops of water caught in it.
  each(T.waterMoss, (x, y, r) => { if (rnd(T.waterMoss, x, y, 4) < 0.07) return [hex(0x9fd8e8)]; return [shade(hex(0x2f6b3a), ((x + y * 3) % 5 === 0 ? 0.75 : 1) * (0.85 + r * 0.3))]; });
  // Drainer vines: dark purple-red strands with pale thorns.
  each(T.drainerVine, (x, y, r) => {
    const strand = x === 2 + (y % 4 === 0 ? 1 : 0) || x === 6 - (y % 3 === 0 ? 1 : 0);
    if (strand) return [shade(hex(0x5a1e3a), 0.8 + r * 0.4)];
    if ((x === 1 || x === 4 || x === 7) && y % 3 === 1) return [hex(0xe8d8c8)];
    return clear;
  });
  // A flash-flood hole: a dark hole in the ground with water glinting at the bottom.
  each(T.floodHole, (x, y, r) => {
    const d = Math.hypot(x - 4.5, y - 4.5);
    if (d > 4.2) return [shade(hex(0x4f8a3a), 0.85 + r * 0.3)];
    if (d > 3.2) return [shade(hex(0x3a2a1e), 0.8 + r * 0.3)];
    return [rnd(T.floodHole, x, y, 2) < 0.2 ? hex(0x5fa8d8) : shade(hex(0x0e1a24), 0.8 + r * 0.4)];
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
  // The sky (all in linear light): top, horizon and below-horizon colours, the sunset band, the glow round the sun.
  uZenith: { value: new THREE.Color(0.1, 0.25, 0.6) }, uHorizon: { value: new THREE.Color(0.5, 0.65, 0.85) }, uGround: { value: new THREE.Color(0.3, 0.32, 0.35) },
  uWarmCol: { value: new THREE.Color(1, 0.4, 0.2) }, uWarm: { value: 0 }, uSunGlow: { value: new THREE.Color(1, 0.9, 0.7) }, uSunDisk: { value: new THREE.Color(40, 36, 30) },
  // Haze: how thick, where the view distance ends, and (mode 1) a plain colour instead, for under water or in a swarm.
  uFogDensity: { value: 0.002 }, uFogNear: { value: 60 }, uFogFar: { value: 150 }, uFogMode: { value: 0 }, uFogFlat: { value: new THREE.Color(0.1, 0.2, 0.3) },
  uFogBase: { value: 40 }, uFogFall: { value: 0.02 },
  // Clouds: the noise they are made of, the wind that carries them, how much of the sky they cover, how they are lit.
  uNoise: { value: null }, uWind: { value: new THREE.Vector2() }, uCover: { value: 0.45 },
  uCloudSunDir: { value: new THREE.Vector3(0, 1, 0) }, uCloudSun: { value: new THREE.Color(1, 1, 1) }, uCloudAmb: { value: new THREE.Color(0.4, 0.5, 0.7) },
  tPano: { value: null }, uPanoOn: { value: 0 },
  // Night: the moon, which side of it is lit, the stars turning overhead. And a rainbow after the rain.
  uNight: { value: 0 }, uMoonDir: { value: new THREE.Vector3(0, -1, 0) }, uMoonLit: { value: new THREE.Vector3(0, 1, 0) }, uStarRot: { value: new THREE.Matrix3() }, uRainbow: { value: 0 },
  // Weather on the ground: how hard it is raining and how wet everything has got.
  uRain: { value: 0 }, uWet: { value: 0 },
  // The finished-picture path: whether it is on, the copy of the world the water looks through, and their sizes.
  uPost: { value: 0 }, tRefr: { value: null }, uRefrSize: { value: new THREE.Vector2(1, 1) }, uScreen: { value: new THREE.Vector2(1, 1) },
  uProjM: { value: new THREE.Matrix4() }, uBevel: { value: 0.14 }, uNrmK: { value: 1 },
  tMat: { value: null }, tNrm: { value: null },
};
shared.uNoise.value = makeNoiseTexture();

// ---------- how each picture behaves in the light ----------
// [shine, roughness, metal, bumpiness, glow, light through it (leaves), sparkle, how much rain darkens it]
const SURF = new Array(256).fill(null);
const surf = (tiles, ...v) => { for (const t of [].concat(tiles)) SURF[t] = v; };
surf([T.stone, T.cobble, T.mossyCobble, T.granite, T.stoneBricks, T.carvedStone, T.limestone, T.bedrock, T.atlStone, T.pedestalSide, T.pedestalTop], 0.35, 0.62, 0, 1, 0, 0, 0, 1);
surf([T.sandstone, T.sandstoneTop, T.rammedEarth, T.mudBrick, T.brick, T.terracotta], 0.22, 0.82, 0, 0.9, 0, 0, 0, 1);
surf([T.marble, T.columnSide, T.columnTop, T.jerusalemStone, T.plaster, T.greenMarble, T.blueMarble, T.redMarble, T.purpleMarble], 0.7, 0.22, 0, 0.35, 0, 0, 0, 0.6);
surf([T.blackMarble], 0.9, 0.12, 0, 0.25, 0, 0, 0, 0.5);
surf([T.goldBlock], 1, 0.22, 1, 0.5, 0, 0, 0.25, 0.2);
surf([T.bronze, T.ancientBlock], 1, 0.32, 1, 0.6, 0, 0, 0.15, 0.2);
surf([T.goldOre, T.copperOre, T.ironOre, T.tinOre, T.ancientOre, T.coalOre], 0.45, 0.45, 0, 1, 0, 0, 0.8, 1);
surf([T.diamondOre, T.emeraldOre, T.amethystOre, T.opalOre], 0.7, 0.2, 0, 1, 0, 0, 1, 1);
surf([T.obsidian], 1, 0.06, 0, 0.3, 0, 0, 0.5, 0.3);
surf([T.crystal], 1, 0.08, 0, 0.3, 0.55, 0, 1, 0.2);
surf([T.glass], 1, 0.04, 0, 0, 0, 0, 0, 0.2);
surf([T.blueTile, T.yellowRoof, T.greenRoof, T.greyRoof, T.redLacquer, T.mosaic], 0.75, 0.25, 0, 0.6, 0, 0, 0, 0.5);
surf([T.planks, T.oakSide, T.birchSide, T.spruceSide, T.palmSide, T.jungleSide, T.cherrySide, T.ginkgoSide, T.acaciaSide, T.figSide, T.ironwoodSide, T.logTop, T.ironwoodTop,
  T.door, T.doorLower, T.doorUpper, T.gateWood, T.scrollShelf, T.ladder, T.bedSide, T.nestSide, T.nestTop, T.cactusSide, T.cactusTop], 0.18, 0.78, 0, 0.85, 0, 0, 0, 1);
surf([T.oakLeaves, T.birchLeaves, T.spruceLeaves, T.palmLeaves, T.jungleLeaves, T.cherryBlossom, T.ginkgoLeaves, T.acaciaLeaves, T.figLeaves, T.appleLeaves, T.ironwoodLeaves], 0.12, 0.6, 0, 0.3, 0, 0.75, 0, 0.6);
surf([T.tallGrass, T.redFlower, T.yellowFlower, T.deadBush, T.wheat0, 48, 49, T.wheat3, T.greenVine, T.stranglerVine, T.bamboo, T.papyrus, T.maizeYoung, T.maizeRipe, T.acaiBunch, T.cocoon,
  T.kelp, T.seagrass, T.purpleFan, T.yellowFan, T.drainerVine], 0, 0.7, 0, 0, 0, 0.8, 0, 0.5);   // crossed plants: no shine (their quads point up, not out)
surf([T.grassTop, T.grassSide, T.snowSide], 0.15, 0.85, 0, 0.6, 0, 0.15, 0, 1);
surf([T.dirt, T.farmland, T.clay, T.mountainSoil, T.gravel], 0.12, 0.9, 0, 0.75, 0, 0, 0, 1);
surf([T.sand, T.blackSand], 0.15, 0.85, 0, 0.5, 0, 0, 0.3, 1);
surf([T.snow], 0.3, 0.6, 0, 0.35, 0, 0, 0.6, 0.3);
surf([T.rockSalt], 0.5, 0.3, 0, 0.6, 0, 0, 0.6, 0.5);
surf([T.redCloth, T.blueCloth, T.purpleCloth, T.bedHeadTop, T.bedFootTop], 0.04, 1, 0, 0.5, 0, 0, 0, 1);
surf([T.waterMoss], 0.7, 0.3, 0, 0.6, 0, 0, 0, 0);
surf([T.brainCoral, T.tubeCoral, T.fireCoral, T.sponge], 0.3, 0.6, 0, 0.8, 0, 0, 0, 0);
surf([T.torch, T.campfire], 0.1, 0.8, 0, 0, 0.9, 0.3, 0, 0);
surf([T.lamp], 0.4, 0.4, 0, 0.3, 0.42, 0, 0, 0.2);
surf([T.furnaceLit], 0.3, 0.6, 0, 0.8, 0.45, 0, 0, 0.5);
surf([T.hive, T.cocoaPod], 0.25, 0.6, 0, 0.7, 0, 0, 0, 1);
/// A 256 × 2 table the block shader looks up by picture number.
export function surfaceTable() {
  const d = new Uint8Array(256 * 2 * 4), b = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  for (let t = 0; t < 256; t++) {
    const s = SURF[t] || [0.25, 0.75, 0, 0.6, 0, 0, 0, 1];
    d.set([b(s[0]), b(s[1]), b(s[2]), b(s[3])], t * 4);
    d.set([b(s[4]), b(s[5]), b(s[6]), b(s[7])], (256 + t) * 4);
  }
  const tex = new THREE.DataTexture(d, 256, 2, THREE.RGBAFormat);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
  return tex;
}
/// The bumps in each picture, worked out from how light or dark its pixels are: dark cracks and mortar sink in,
/// light stones stand out. Same layout as the picture atlas, so the same texture coordinates find both.
export function normalAtlas(atlas) {
  const w = atlas.width, h = atlas.height;
  const src = atlas.getContext('2d').getImageData(0, 0, w, h).data;
  const ht = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = src[i * 4 + 3] / 255;
    const l = (0.2126 * src[i * 4] + 0.7152 * src[i * 4 + 1] + 0.0722 * src[i * 4 + 2]) / 255;
    ht[i] = a > 0.5 ? Math.pow(l, 0.8) : 0.25;
  }
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const g = out.getContext('2d'), img = g.createImageData(w, h);
  const at = (x, y) => ht[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = 2.6, dx = (at(x + 1, y) - at(x - 1, y)) * 0.5 * s, dy = (at(x, y + 1) - at(x, y - 1)) * 0.5 * s;
    const nx = -dx, ny = dy, l = Math.hypot(nx, ny, 1), o = (y * w + x) * 4;
    img.data[o] = Math.round((nx / l * 0.5 + 0.5) * 255); img.data[o + 1] = Math.round((ny / l * 0.5 + 0.5) * 255);
    img.data[o + 2] = Math.round((1 / l * 0.5 + 0.5) * 255); img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.colorSpace = THREE.NoColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}
// How fast water swallows each colour (per block): red first, then green; blue goes farthest, so things look bluer the deeper or farther they are.
const ABSORB = 'vec3(0.13, 0.05, 0.032)';

// The block shader. Light comes from the same sun and sky as everything else in the scene (so a sheep and the grass it
// stands on match), plus: firelight baked into the corners, edges rounded off where a block meets open air, bumps
// worked out from each picture, shine on marble and metal and wet stone, sun glowing through leaves, cloud shadows
// drifting over the land, sparkle in gems and snow, glowing flames, the sea floor seen through water, and haze.
const BLOCK_VERT = /* glsl */ `
#include <common>
#include <shadowmap_pars_vertex>
attribute vec4 lt;
attribute float wd;
uniform float uTime; uniform vec4 uHand; uniform vec3 uTorch; uniform float uSway;
varying vec2 vUv; varying vec3 vWp; varying vec3 vN; varying float vSky; varying float vAO; varying vec3 vFire; varying float vWd; varying float vEdge;
void main() {
  float code = floor(lt.z * 255.0 + 0.5);
  float flag = floor(code / 16.0);
  vEdge = code - flag * 16.0;
  vec3 transformed = position;
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
  if (flag > 0.5 && flag < 1.5) {
    transformed.x += sin(uTime * 1.7 + wp.x * 0.9 + wp.z * 0.6 + wp.y * 0.3) * 0.05 * uSway;
    transformed.z += cos(uTime * 1.3 + wp.x * 0.5 + wp.z * 0.8) * 0.04 * uSway;
  } else if (flag > 2.5) {
    // Kelp: the whole stalk leans with the swell, more the higher up it is.
    float k = 0.10 + 0.04 * sin(wp.y * 0.7);
    transformed.x += sin(uTime * 0.8 + wp.y * 0.45 + wp.x * 0.3) * k * uSway;
    transformed.z += cos(uTime * 0.6 + wp.y * 0.4 + wp.z * 0.3) * k * uSway;
  } else if (flag > 1.5) {
    transformed.y += (sin(uTime * 1.3 + wp.x * 0.7 + wp.z * 0.2) + cos(uTime * 0.9 + wp.z * 0.8 - wp.x * 0.3)) * 0.035 * uSway;
  }
  vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
  vWp = worldPosition.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  vSky = pow(lt.x, 2.2); vAO = pow(lt.w, 2.2); vWd = wd;
  vec3 fire = pow(lt.y * lt.w, 2.2) * uTorch * (0.9 + 0.1 * sin(uTime * 9.0 + wp.x * 2.3 + wp.z * 1.7) * sin(uTime * 13.1 + wp.y * 1.9 + wp.x * 0.7));   // firelight flickers
  if (uHand.w > 0.0) { float h = clamp(1.0 - distance(wp, uHand.xyz) / uHand.w, 0.0, 1.0); fire = max(fire, h * h * uTorch); }
  vFire = fire;
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
    vDirectionalShadowCoord[0] = directionalShadowMatrix[0] * (worldPosition + vec4(vN * directionalLightShadows[0].shadowNormalBias, 0.0));
  #endif
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`;
const BLOCK_FRAG = /* glsl */ `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
${HASH_GLSL}
${SKY_GLSL}
${CLOUD_GLSL}
${PANO_GLSL}
uniform sampler2D map; uniform sampler2D tNrm; uniform sampler2D tMat; uniform sampler2D tPano;
uniform float uTime; uniform vec3 uDeep; uniform float uDay; uniform float uCamUnder; uniform float uPost; uniform float uPanoOn;
uniform float uWet; uniform float uRain; uniform float uBevel; uniform float uNrmK;
varying vec2 vUv; varying vec3 vWp; varying vec3 vN; varying float vSky; varying float vAO; varying vec3 vFire; varying float vWd; varying float vEdge;
vec3 envSky(vec3 r, float rough) {
  vec3 c = skyColor(normalize(vec3(r.x, max(r.y, 0.02), r.z)));
  #ifdef PANO
    if (uPanoOn > 0.5) { vec4 cl = texture2D(tPano, panoUV(r), rough * 5.0); c = c * (1.0 - cl.a) + cl.rgb; }
  #endif
  return c;
}
float D_GGX(float NoH, float a) { float a2 = a * a; float d = NoH * NoH * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
float V_Smith(float NoV, float NoL, float a) { float k = a * 0.5; return 0.25 / ((NoV * (1.0 - k) + k) * (NoL * (1.0 - k) + k)); }
void main() {
  vec4 tex = texture2D(map, vUv);
  #ifdef CUT
    if (tex.a < 0.5) discard;
  #endif
  vec3 albedo = tex.rgb;
  float tile = floor(vUv.x * 8.0) + floor((1.0 - vUv.y) * 32.0) * 8.0;
  vec4 mA = texture2D(tMat, vec2((tile + 0.5) / 256.0, 0.25));   // shine, roughness, metal, bumpiness
  vec4 mB = texture2D(tMat, vec2((tile + 0.5) / 256.0, 0.75));   // glow, light through it, sparkle, soaks up rain
  vec3 Ng = normalize(vN);
  #ifdef CUT
    if (!gl_FrontFacing) Ng = -Ng;
  #endif
  vec3 N = Ng;
  float edgeK = 0.0;
  #ifdef BEVEL
  // Rounded edges: near an edge that meets open air, the surface turns towards the neighbouring face, so light rolls
  // round the corner the way it does on a real stone block.
  float eg = floor(vEdge + 0.5);
  if (eg > 0.5) {
    vec3 an = abs(Ng); vec2 q; vec3 ud, vd;
    if (an.x > 0.5) { q = vWp.zy; ud = vec3(0.0, 0.0, 1.0); vd = vec3(0.0, 1.0, 0.0); }
    else if (an.y > 0.5) { q = vWp.xz; ud = vec3(1.0, 0.0, 0.0); vd = vec3(0.0, 0.0, 1.0); }
    else { q = vWp.xy; ud = vec3(1.0, 0.0, 0.0); vd = vec3(0.0, 1.0, 0.0); }
    vec2 f = fract(q);
    float e0 = mod(eg, 2.0), e1 = mod(floor(eg * 0.5), 2.0), e2 = mod(floor(eg * 0.25), 2.0), e3 = floor(eg * 0.125);
    float r = uBevel;
    float t0 = e0 * (1.0 - smoothstep(0.0, r, 1.0 - f.x)), t1 = e1 * (1.0 - smoothstep(0.0, r, f.x));
    float t2 = e2 * (1.0 - smoothstep(0.0, r, 1.0 - f.y)), t3 = e3 * (1.0 - smoothstep(0.0, r, f.y));
    vec3 bend = ud * (t0 - t1) + vd * (t2 - t3);
    edgeK = max(max(t0, t1), max(t2, t3));
    N = normalize(Ng + bend);
  }
  #endif
  #ifdef NORMALMAP
  if (mA.a > 0.01) {
    vec3 tn = texture2D(tNrm, vUv).xyz * 2.0 - 1.0;
    tn.xy *= mA.a * uNrmK * (1.0 - edgeK);
    vec3 dp1 = dFdx(vWp), dp2 = dFdy(vWp); vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
    vec3 dp2perp = cross(dp2, Ng), dp1perp = cross(Ng, dp1);
    vec3 Tt = dp2perp * du1.x + dp1perp * du2.x, Bt = dp2perp * du1.y + dp1perp * du2.y;
    float invmax = inversesqrt(max(max(dot(Tt, Tt), dot(Bt, Bt)), 1e-12));
    N = normalize(Tt * (invmax * tn.x) + Bt * (invmax * tn.y) + N * tn.z);
  }
  #endif
  vec3 V = normalize(cameraPosition - vWp);
  float spec = mA.r, rough = max(mA.g, 0.045), metal = mA.b;
  // Rain: things out under the open sky get dark and shiny, and puddles gather on flat ground.
  float wet = 0.0, pud = 0.0;
  vec3 Npud = Ng;
  #ifdef WEATHER
  if (uWet > 0.003 && mB.a > 0.0) {
    float open = smoothstep(0.8, 0.97, vSky);
    wet = uWet * open * mix(0.3, 1.0, smoothstep(0.2, 0.9, Ng.y)) * mB.a;
    if (Ng.y > 0.9 && open > 0.0) {
      float n = texture2D(uNoise, vWp.xz * 0.019).g * 0.75 + texture2D(uNoise, vWp.xz * 0.083).a * 0.25;
      pud = smoothstep(0.54, 0.6, n) * smoothstep(0.35, 0.85, uWet) * open * mB.a;
      if (pud > 0.001) {
        vec2 rg = vec2(0.0);
        for (int i = 0; i < 2; i++) {
          vec2 qq = vWp.xz * (2.1 + float(i) * 0.9) + float(i) * 7.31;
          vec2 cell = floor(qq), fc = fract(qq) - 0.5;
          float h = hash12(cell + float(i) * 13.1);
          vec2 cc = (vec2(hash12(cell + 3.7), hash12(cell + 9.1)) - 0.5) * 0.5;
          float tt = fract(uTime * 1.4 + h), d = length(fc - cc), rr = tt * 0.42;
          rg += normalize(fc - cc + 1e-5) * sin((d - rr) * 70.0) * exp(-abs(d - rr) * 28.0) * (1.0 - tt);
        }
        Npud = normalize(vec3(-rg.x * 0.25 * uRain, 1.0, -rg.y * 0.25 * uRain));
        N = normalize(mix(N, Npud, pud));
        wet = max(wet, pud);
      }
    }
    albedo *= (1.0 - 0.42 * wet) * (1.0 - 0.35 * pud);
    rough = mix(rough, 0.05, wet);
    spec = mix(spec, 1.0, wet * 0.85);
  }
  #endif
  float NoV = clamp(dot(N, V), 1e-3, 1.0);
  vec3 F0 = mix(vec3(0.08 * spec), albedo, metal);
  vec3 diffCol = albedo * (1.0 - metal);
  // The sun (or the moon), and the sky's light from all round.
  vec3 L = vec3(0.0, 1.0, 0.0), sunC = vec3(0.0), hemi = vec3(0.0);
  #if NUM_DIR_LIGHTS > 0
    L = normalize(inverseTransformDirection(directionalLights[0].direction, viewMatrix));
    sunC = directionalLights[0].color;
  #endif
  #if NUM_HEMI_LIGHTS > 0
    vec3 hd = inverseTransformDirection(hemisphereLights[0].direction, viewMatrix);
    hemi = mix(hemisphereLights[0].groundColor, hemisphereLights[0].skyColor, dot(N, hd) * 0.5 + 0.5);
  #endif
  float shadow = 1.0;
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
    if (receiveShadow) shadow = getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
  #endif
  float sunOpen = smoothstep(0.05, 0.5, vSky);
  float cs = 1.0;
  #ifdef CLOUDSHADOW
    cs = cloudShadow(vWp, L);
  #endif
  float vis = shadow * sunOpen * cs;
  float NoL = max(dot(N, L), 0.0) * smoothstep(-0.08, 0.12, dot(Ng, L));
  float amb = vSky * vAO * (1.0 + edgeK * 0.18);
  vec3 col = diffCol * RECIPROCAL_PI * (sunC * NoL * vis * mix(1.0, vAO, 0.35) + hemi * amb);
  col += albedo * vFire;
  // Leaves and grass glow when the sun shines through them from behind.
  if (mB.g > 0.0) {
    float through = pow(clamp(dot(-V, L), 0.0, 1.0), 4.0);
    float back = clamp(-dot(Ng, L), 0.0, 1.0);
    col += albedo * sunC * RECIPROCAL_PI * mB.g * (through * 1.6 + back * 0.45) * shadow * sunOpen * cs;
  }
  #ifdef SPECULAR
  if (spec > 0.02) {
    vec3 Hh = normalize(L + V);
    float NoH = max(dot(N, Hh), 0.0), VoH = max(dot(V, Hh), 0.0), a = rough * rough;
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0);
    col += D_GGX(NoH, a) * V_Smith(NoV, max(NoL, 1e-3), a) * F * sunC * NoL * vis;
    vec3 R = reflect(-V, N);
    vec3 Fr = F0 + (max(vec3(1.0 - rough), F0) - F0) * pow(1.0 - NoV, 5.0);
    float hor = clamp(1.0 + dot(R, Ng) * 1.5, 0.0, 1.0);
    col += envSky(R, rough) * Fr * (amb * hor * hor * (1.0 - rough * 0.75) * (0.25 + 0.75 * spec));
  }
  #endif
  #ifdef WEATHER
  // A puddle mirrors the sky, more and more the lower you look across it.
  if (pud > 0.001) {
    vec3 Rp = reflect(-V, Npud);
    float Fp = 0.12 + 0.7 * pow(1.0 - clamp(dot(Npud, V), 0.0, 1.0), 3.0);
    col = mix(col, envSky(Rp, 0.02) * vSky * vAO, pud * Fp);
  }
  #endif
  // Gems, ore and snow glitter: tiny facets that each catch the sun at their own angle.
  if (mB.b > 0.0) {
    vec3 cell = floor(vWp * 20.0 + Ng * 0.5);
    float hh = hash13(cell);
    vec3 fn = vec3(hash13(cell + 1.7), hash13(cell + 3.1), hash13(cell + 5.3)) - 0.5;
    float g = pow(max(dot(reflect(-V, normalize(N + fn * 0.9)), L), 0.0), 300.0);
    float bright = smoothstep(0.35, 0.7, dot(albedo, vec3(0.3, 0.6, 0.1)));
    col += (sunC + vFire * 2.0) * g * mB.b * step(0.62, hh) * (vis + 0.15) * 3.0 * bright;
  }
  // Flames, lamps and crystals give their own light.
  if (mB.r > 0.0) {
    float l = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
    float flick = 0.85 + 0.15 * sin(uTime * 11.0 + vWp.x * 3.1 + vWp.z * 2.3) * sin(uTime * 7.3 + vWp.y * 2.0);
    col += albedo * mB.r * 9.0 * smoothstep(0.22, 0.62, l) * flick;
  }
  // The sea floor: light dances on it (caustics), and it turns blue and dim with depth.
  if (vWd > -50.0) {
    float under = vWd - vWp.y;
    if (under > 0.0) {
      // Two layers of ripples drifting past each other; where they line up the light is focused into bright threads.
      vec2 cq = vWp.xz + L.xz / max(L.y, 0.25) * under;
      float n1 = texture2D(uNoise, cq * 0.06 + vec2(uTime * 0.013, uTime * 0.009)).g, n2 = texture2D(uNoise, cq * 0.06 + vec2(0.5 - uTime * 0.011, 0.3 + uTime * 0.012)).g;
      float c = pow(1.0 - min(abs(n1 - n2) * 3.0, 1.0), 6.0) * 1.6;
      col += col * c * exp(-under * 0.2) * uDay * vSky * shadow;
      // How much water the light passes through on its way to your eye. (When the finished-picture path is on and you
      // look in from above, the water surface works this out itself, for fish and divers too.)
      if (uPost < 0.5 || uCamUnder > 0.5) {
        float dist = length(cameraPosition - vWp);
        float path = uCamUnder > 0.5 ? dist : under * dist / max(cameraPosition.y - vWp.y, 0.35);
        path = min(path, 90.0) + under * 0.4;
        col = col * exp(-${ABSORB} * path) + uDeep * vSky * (1.0 - exp(-0.055 * path));
      }
    }
  }
  #ifndef STUDIO
    col = atmos(col, vWp);
  #endif
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
/// Which extras the block shader draws, by graphics setting.
export function blockDefines(q, kind) {
  const d = {};
  if (kind === 'cut') d.CUT = '';
  if (q.bevel && kind !== 'cut') d.BEVEL = '';
  if (q.normals) d.NORMALMAP = '';
  if (q.post) { d.SPECULAR = ''; d.WEATHER = ''; d.CLOUDSHADOW = ''; }
  if (q.pano) d.PANO = '';
  return d;
}
export function blockMaterial(tex, kind, q = { post: false }, studio = false) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights]);
  Object.assign(uniforms, shared, { map: { value: tex } });
  const defines = blockDefines(q, kind);
  if (studio) defines.STUDIO = '';
  const m = new THREE.ShaderMaterial({
    uniforms, lights: true, fog: false, vertexShader: BLOCK_VERT, fragmentShader: BLOCK_FRAG, defines,
    side: kind === 'cut' ? THREE.DoubleSide : THREE.FrontSide,
  });
  // The shadow pass reads these: leaves cast dappled shadows through their gaps.
  m.map = tex;
  if (kind === 'cut') m.alphaTest = 0.5;
  m.userData.kind = kind;
  return m;
}
export function setBlockQuality(m, q) { m.defines = blockDefines(q, m.userData.kind); m.needsUpdate = true; }

/// The water surface, the full version: it bends the view of what's under it, swallows red then green light the
/// deeper you look, mirrors the sky, the clouds and (on Amazing) the shore and buildings round it, glitters where the
/// sun catches the waves, foams along the shore, and dimples with rings when it rains.
const WATER_VERT = /* glsl */ `
#include <common>
#include <shadowmap_pars_vertex>
attribute vec4 lt;
uniform float uTime; uniform vec4 uHand; uniform vec3 uTorch; uniform float uSway;
varying vec3 vWp; varying vec3 vN; varying float vSky; varying vec3 vFire; varying float vFlag; varying float vDist;
void main() {
  float code = floor(lt.z * 255.0 + 0.5);
  float flag = floor(code / 16.0);
  vFlag = flag;
  vec3 p = position;
  vec3 wp = (modelMatrix * vec4(p, 1.0)).xyz;
  if (flag > 1.5 && flag < 2.5) p.y += (sin(uTime * 1.3 + wp.x * 0.7 + wp.z * 0.2) + cos(uTime * 0.9 + wp.z * 0.8 - wp.x * 0.3)) * 0.035 * uSway;
  vec4 worldPosition = modelMatrix * vec4(p, 1.0);
  vWp = worldPosition.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vSky = pow(lt.x, 2.2);
  vec3 fire = pow(lt.y, 2.2) * uTorch;
  if (uHand.w > 0.0) { float h = clamp(1.0 - distance(wp, uHand.xyz) / uHand.w, 0.0, 1.0); fire = max(fire, h * h * uTorch); }
  vFire = fire;
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
    vDirectionalShadowCoord[0] = directionalShadowMatrix[0] * worldPosition;
  #endif
  vec4 mv = viewMatrix * worldPosition;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const WATER_FRAG = /* glsl */ `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
${HASH_GLSL}
${SKY_GLSL}
${CLOUD_GLSL}
${PANO_GLSL}
uniform sampler2D tRefr; uniform sampler2D tPano; uniform vec2 uScreen; uniform mat4 uProjM;
uniform float uTime; uniform float uDay; uniform float uCamUnder; uniform float uRain; uniform float uPanoOn;
uniform vec3 uDeep;
varying vec3 vWp; varying vec3 vN; varying float vSky; varying vec3 vFire; varying float vFlag; varying float vDist;
vec3 envSky(vec3 r) {
  vec3 c = skyColor(normalize(vec3(r.x, max(r.y, 0.015), r.z)));
  #ifdef PANO
    if (uPanoOn > 0.5) { vec4 cl = texture2D(tPano, panoUV(r)); c = c * (1.0 - cl.a) + cl.rgb; }
  #endif
  return c;
}
// One travelling wave: its slope at p.
vec2 wave(vec2 p, vec2 d, float k, float a, float sp) { float ph = dot(d, p) * k + uTime * sp; return d * (a * k * cos(ph)); }
vec3 waveNormal(vec2 p) {
  vec2 g = wave(p, vec2(0.8, 0.6), 0.45, 0.07, 1.0) + wave(p, vec2(-0.55, 0.83), 0.8, 0.04, 1.4)
         + wave(p, vec2(0.23, -0.97), 1.5, 0.022, 1.9) + wave(p, vec2(-0.93, -0.36), 2.6, 0.012, 2.6)
         + wave(p, vec2(0.6, -0.8), 4.1, 0.006, 3.3);
  // Fine ripples from the noise picture, drifting two ways.
  vec2 q1 = p * 0.13 + vec2(uTime * 0.021, uTime * 0.013), q2 = p * 0.29 - vec2(uTime * 0.017, -uTime * 0.026);
  float e = 0.004;
  float h1 = texture2D(uNoise, q1).g, h1x = texture2D(uNoise, q1 + vec2(e, 0.0)).g, h1z = texture2D(uNoise, q1 + vec2(0.0, e)).g;
  float h2 = texture2D(uNoise, q2).a, h2x = texture2D(uNoise, q2 + vec2(e, 0.0)).a, h2z = texture2D(uNoise, q2 + vec2(0.0, e)).a;
  g += vec2(h1x - h1, h1z - h1) * (0.13 / e) * 0.28 + vec2(h2x - h2, h2z - h2) * (0.29 / e) * 0.12;
  return normalize(vec3(-g.x, 1.0, -g.y));
}
// Rings spreading where raindrops land.
vec2 rainRings(vec2 p) {
  vec2 rg = vec2(0.0);
  for (int i = 0; i < 3; i++) {
    vec2 qq = p * (1.7 + float(i) * 0.8) + float(i) * 5.37;
    vec2 cell = floor(qq), fc = fract(qq) - 0.5;
    float h = hash12(cell + float(i) * 17.3);
    vec2 cc = (vec2(hash12(cell + 2.9), hash12(cell + 7.7)) - 0.5) * 0.5;
    float tt = fract(uTime * 1.25 + h), d = length(fc - cc), rr = tt * 0.45;
    rg += normalize(fc - cc + 1e-5) * sin((d - rr) * 64.0) * exp(-abs(d - rr) * 26.0) * (1.0 - tt);
  }
  return rg;
}
#ifdef SSR
// Look along the reflected ray through the copy of the world, to find what the water mirrors.
vec4 traceReflection(vec3 wp, vec3 R) {
  vec3 vp = (viewMatrix * vec4(wp, 1.0)).xyz, vr = normalize((viewMatrix * vec4(R, 0.0)).xyz);
  if (vr.z > 0.6) return vec4(0.0);
  float stepL = 0.5 + vDist * 0.02;
  vec3 p = vp, prev = vp;
  float jit = hash12(gl_FragCoord.xy + fract(uTime) * 37.0);
  p += vr * stepL * jit;
  for (int i = 0; i < 28; i++) {
    prev = p; p += vr * stepL; stepL *= 1.13;
    vec4 c = uProjM * vec4(p, 1.0);
    vec2 uv = c.xy / c.w * 0.5 + 0.5;
    if (c.w <= 0.0 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;
    float sd = texture2D(tRefr, uv).a, rd = length(p);
    if (rd > sd && rd < sd + stepL * 1.6 + 0.6) {
      vec3 a = prev, b = p;
      for (int j = 0; j < 5; j++) {
        vec3 m = (a + b) * 0.5; vec4 cm = uProjM * vec4(m, 1.0); vec2 um = cm.xy / cm.w * 0.5 + 0.5;
        if (length(m) > texture2D(tRefr, um).a) b = m; else a = m;
      }
      vec4 cb = uProjM * vec4(b, 1.0); vec2 ub = cb.xy / cb.w * 0.5 + 0.5;
      vec2 e = smoothstep(0.0, 0.08, ub) * smoothstep(1.0, 0.92, ub);
      return vec4(texture2D(tRefr, ub).rgb, e.x * e.y * (1.0 - float(i) / 28.0 * 0.5));
    }
  }
  return vec4(0.0);
}
#endif
void main() {
  vec3 V = normalize(cameraPosition - vWp);
  bool top = vN.y > 0.5, fall = vFlag > 3.5;
  vec3 N = normalize(vN);
  if (top) {
    N = waveNormal(vWp.xz);
    if (uRain > 0.02) { vec2 rg = rainRings(vWp.xz) * uRain * 0.22; N = normalize(N + vec3(-rg.x, 0.0, -rg.y)); }
  } else if (!fall) {
    vec2 q = (abs(N.x) > 0.5 ? vWp.zy : vWp.xy) * 0.3 + vec2(0.0, uTime * 0.12);
    N = normalize(N + 0.15 * (vec3(texture2D(uNoise, q).g, texture2D(uNoise, q + 0.31).g, texture2D(uNoise, q + 0.67).g) - 0.5));
  }
  if (dot(N, V) < 0.0) N = -N;
  float NoV = clamp(dot(N, V), 0.0, 1.0);
  vec3 L = vec3(0.0, 1.0, 0.0), sunC = vec3(0.0), hemi = vec3(0.3);
  #if NUM_DIR_LIGHTS > 0
    L = normalize(inverseTransformDirection(directionalLights[0].direction, viewMatrix)); sunC = directionalLights[0].color;
  #endif
  #if NUM_HEMI_LIGHTS > 0
    hemi = hemisphereLights[0].skyColor;
  #endif
  float shadow = 1.0;
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
    if (receiveShadow) shadow = getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, vDirectionalShadowCoord[0]);
  #endif
  shadow *= cloudShadow(vWp, L) * smoothstep(0.05, 0.5, vSky);
  // What's behind the surface, and how far through the water you are looking.
  vec2 suv = gl_FragCoord.xy / uScreen;
  vec4 bg = texture2D(tRefr, suv);
  float thick = max(bg.a - vDist, 0.0);
  vec2 off = N.xz * (0.05 * clamp(thick * 0.6, 0.0, 1.0) / (1.0 + vDist * 0.04));
  if (!top) off = (N.xy - vN.xy) * 0.02;
  vec2 ruv = suv + off;
  vec4 rb = texture2D(tRefr, ruv);
  if (rb.a < vDist + 0.05) { rb = bg; }
  float thickR = max(rb.a - vDist, 0.0);
  vec3 body = uDeep * (0.35 + 0.65 * vSky) + vFire * 0.12;
  vec3 refr;
  if (uCamUnder > 0.5) {
    // Looking up from under the water: the world above, bent and tinted, and past the edge of the bright circle
    // overhead the surface turns into a mirror of the deep.
    float path = vDist;
    refr = rb.rgb * exp(-${ABSORB} * path) + body * (1.0 - exp(-0.055 * path));
    float tir = smoothstep(0.62, 0.5, NoV);
    refr = mix(refr, body * 1.1, tir);
    vec3 c = refr;
    c = mix(c, uFogFlat, smoothstep(uFogNear, uFogFar, vDist));
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    return;
  }
  float path = min(thickR, 90.0);
  refr = rb.rgb * exp(-${ABSORB} * 1.8 * path) + body * (1.0 - exp(-0.11 * path));
  // What the water mirrors: the sky and the clouds, and (on Amazing) whatever stands round it.
  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 refl = envSky(R) * mix(0.18, 1.0, vSky) * vec3(0.72, 0.84, 0.95);
  #ifdef SSR
    vec4 hit = traceReflection(vWp, R);
    refl = mix(refl, hit.rgb, hit.a);
  #endif
  float F = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);
  vec3 col = mix(refr, refl, F);
  // The sun on the waves: a hot core and a softer sheen round it.
  vec3 Hh = normalize(L + V);
  float NoH = max(dot(N, Hh), 0.0);
  col += sunC * (pow(NoH, 1400.0) * 9.0 + pow(NoH, 160.0) * 0.5) * shadow * F * 4.0;
  col += vFire * pow(NoV, 2.0) * 0.08;
  // Foam where the water is shallow against the shore, pulsing with the swell.
  float foamN = texture2D(uNoise, vWp.xz * 0.33 + vec2(uTime * 0.03, uTime * 0.021)).b;
  float pulse = 0.55 + 0.45 * sin(uTime * 1.6 + vWp.x * 0.7 + vWp.z * 0.5);
  float foam = (1.0 - smoothstep(0.0, 0.45 + 0.25 * pulse, thick)) * smoothstep(0.32, 0.62, foamN + 0.2 * pulse);
  if (!top) foam = 0.0;
  vec3 lit = (sunC * max(L.y, 0.0) * shadow + hemi) * RECIPROCAL_PI * 0.9 + vFire;
  col = mix(col, lit, foam * 0.8);
  if (fall) {
    // A waterfall: white streaks of foam rushing down a sheet of blue-green water.
    float across = abs(vN.x) > 0.5 ? vWp.z : vWp.x;
    float lane = floor(across * 6.0);
    float seed = fract(sin(lane * 12.9898) * 43758.5453);
    float streak = fract(vWp.y * (0.28 + seed * 0.2) + uTime * (1.5 + seed * 1.2) + seed * 7.0);
    float band = smoothstep(0.0, 0.18, streak) * smoothstep(1.0, 0.45, streak);
    col = mix(mix(refr, body * 1.6, 0.6), lit * 1.1, 0.3 + 0.55 * band);
  }
  col = atmos(col, vWp);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function waterMaterial(tex, q = { post: false }) {
  if (!q.post) return waterMaterialFast(tex);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights]);
  Object.assign(uniforms, shared);
  const defines = {};
  if (q.ssr) defines.SSR = '';
  if (q.pano) defines.PANO = '';
  const m = new THREE.ShaderMaterial({ uniforms, lights: true, fog: false, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, defines, side: THREE.DoubleSide });
  m.userData.water = true;
  return m;
}
/// The water surface, the simple version: nearly clear when you look down into it close by; bluer, and more like a
/// mirror of the sky, the farther away and the flatter you look across it.
function waterMaterialFast(tex) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: tex } }]);
  Object.assign(uniforms, shared);
  uniforms.map = { value: tex };
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `
      attribute vec4 lt;
      uniform float uTime; uniform vec4 uHand; uniform vec3 uTorch; uniform float uSway;
      varying vec2 vUv; varying vec3 vWorld; varying float vSky; varying vec3 vFire; varying vec3 vN; varying float vFlag;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        vec3 wp = (modelMatrix * vec4(p, 1.0)).xyz;
        vFlag = floor(floor(lt.z * 255.0 + 0.5) / 16.0);
        if (vFlag > 1.5 && vFlag < 2.5) p.y += (sin(uTime * 1.3 + wp.x * 0.7 + wp.z * 0.2) + cos(uTime * 0.9 + wp.z * 0.8 - wp.x * 0.3)) * 0.035 * uSway;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
        vUv = uv; vSky = pow(lt.x, 2.2); vN = normal;
        vec3 fire = pow(lt.y, 2.2) * uTorch * (0.9 + 0.1 * sin(uTime * 9.0 + wp.x * 2.3 + wp.z * 1.7) * sin(uTime * 13.1 + wp.y * 1.9 + wp.x * 0.7));   // firelight flickers
        if (uHand.w > 0.0) { float h = clamp(1.0 - distance(wp, uHand.xyz) / uHand.w, 0.0, 1.0); fire = max(fire, h * h * uTorch); }
        vFire = fire;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform float uTime; uniform vec3 uDeep; uniform float uDay; uniform float uCamUnder;
      uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uSkyTop;
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
        // Far-off sea fades into the haze (a little deeper blue than over the land).
        float fogF = atmosAmount(vWorld);
        vec3 seaHaze = uFogMode > 0.5 ? uFogFlat : mix(atmosColor(vWorld), uDeep * 1.6, 0.35);
        col = mix(col, seaHaze, fogF);
        alpha = mix(alpha, 1.0, fogF);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  m.fragmentShader = m.fragmentShader.replace('#include <fog_pars_fragment>', SKY_GLSL);
  m.fog = false;
  m.userData.water = true;
  return m;
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
// For each face, the four directions along it (+u, −u, +v, −v). If the block next door that way is open air, that
// edge is an outside corner and the shader rounds it off. The shader picks u and v the same way (z,y · x,z · x,y).
const EDGE_DIRS = [
  [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]], [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]],
  [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]], [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]],
  [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]], [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]],
];
const b8 = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255);

// Each corner of each face carries: where it is, which way it faces, where its picture is, and four bytes of light —
// sky, firelight, a code (how it sways ×16, plus which edges are rounded) and how tucked into a corner it is.
// Packed small (28 bytes a corner instead of 48), because a city is millions of corners.
class Mesh {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.lt = []; this.wd = []; this.idx = []; }
  geometry() {
    if (!this.idx.length) return null;
    const n = this.pos.length / 3, g = new THREE.BufferGeometry();
    const nrm = new Int8Array(n * 4), uv = new Uint16Array(n * 2);
    for (let i = 0; i < n; i++) { nrm[i * 4] = Math.round(this.nrm[i * 3] * 127); nrm[i * 4 + 1] = Math.round(this.nrm[i * 3 + 1] * 127); nrm[i * 4 + 2] = Math.round(this.nrm[i * 3 + 2] * 127); }
    for (let i = 0; i < n * 2; i++) uv[i] = Math.round(Math.max(0, Math.min(1, this.uv[i])) * 65535);
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 4, true));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2, true));
    g.setAttribute('lt', new THREE.BufferAttribute(Uint8Array.from(this.lt), 4, true));
    g.setAttribute('wd', new THREE.Float32BufferAttribute(this.wd, 1));
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
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
  const edges = (x, y, z, f) => { let e = 0; const ds = EDGE_DIRS[f]; for (let k = 0; k < 4; k++) { const d = ds[k]; if (!occ(x + d[0], y + d[1], z + d[2])) e |= 1 << k; } return e; };
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
        face(cut ? out.cut : out.solid, x, y, z, f, tile, cut, occ, sky, fire, surf(x + DX[f], y + DY[f], z + DZ[f]), cut ? 0 : edges(x, y, z, f));
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

function face(m, x, y, z, f, tile, sway, occ, sky, fire, wd, edgeBits = 0) {
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
    m.lt.push(b8(ss / sn), b8(fire(px + nx * 0.5, py + ny * 0.5, pz + nz * 0.5, nx, ny, nz)), (sway ? 16 : 0) + edgeBits, b8(shade));
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
    m.lt.push(b8(l[0]), b8(l[1]), (flagFn ? flagFn(i, pts[i]) : 0) * 16, 255);
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
// Drawn after everything solid, and only where nothing solid is in the way, so the clouds and stars cost nothing
// behind a wall. The clouds come from the cloud picture the graphics code keeps up to date (on Fast, a simpler
// single layer worked out right here).
const SKY_FRAG = /* glsl */ `
#include <common>
${HASH_GLSL}
${SKY_GLSL}
${CLOUD_GLSL}
${PANO_GLSL}
uniform sampler2D tPano; uniform float uPanoOn; uniform vec3 uSunDisk; uniform float uNight; uniform vec3 uMoonDir; uniform vec3 uMoonLit;
uniform mat3 uStarRot; uniform float uRainbow; uniform float uTime; uniform vec3 uCloudSunDir; uniform vec3 uCloudSun; uniform vec3 uCloudAmb;
varying vec3 vDir;
vec4 flatClouds(vec3 rd) {
  if (rd.y < 0.015) return vec4(0.0);
  float t = (CLOUD_BASE + 30.0 - cameraPosition.y) / rd.y;
  vec3 p = cameraPosition + rd * t;
  float d = cloudMap(p.xz), ln = cloudMap(p.xz + uCloudSunDir.xz * 60.0);
  float a = smoothstep(0.0, 0.55, d) * (1.0 - smoothstep(6000.0, 11000.0, t));
  vec3 c = uCloudSun * (0.25 + 0.3 * (1.0 - ln)) + uCloudAmb * 0.9;
  c = mix(c, skyColor(rd), 1.0 - exp(-t / 5200.0));
  return vec4(c * a, a);
}
// Stars on a cube of cells round the sky: a few cells hold a star, each with its own brightness, colour and twinkle.
vec3 stars(vec3 d) {
  vec3 sd = uStarRot * d, ad = abs(sd);
  vec2 uv; float face;
  if (ad.x >= ad.y && ad.x >= ad.z) { uv = sd.yz / ad.x; face = sd.x > 0.0 ? 0.0 : 1.0; }
  else if (ad.y >= ad.z) { uv = sd.xz / ad.y; face = sd.y > 0.0 ? 2.0 : 3.0; }
  else { uv = sd.xy / ad.z; face = sd.z > 0.0 ? 4.0 : 5.0; }
  vec2 g = (uv * 0.5 + 0.5) * 220.0, cell = floor(g), f = fract(g);
  float h = hash13(vec3(cell, face));
  // The Milky Way: a pale band of dust and crowded stars across the sky.
  vec3 mw = normalize(vec3(0.35, 0.55, 0.76));
  float band = exp(-pow(dot(sd, mw) / 0.17, 2.0));
  float dust = texture2D(uNoise, panoUV(sd) * vec2(3.0, 1.5)).r * texture2D(uNoise, panoUV(sd) * vec2(9.0, 4.5)).g;
  vec3 glow = vec3(0.55, 0.6, 0.8) * band * smoothstep(0.12, 0.45, dust) * 0.05;
  if (h < 0.955 - band * 0.03) return glow;
  vec2 pos = vec2(hash13(vec3(cell, face + 7.0)), hash13(vec3(cell, face + 13.0))) * 0.6 + 0.2;
  float px = max(fwidth(g.x), 0.05);
  float r = length(f - pos) / max(px * 0.9, 0.06);
  float b = pow(hash13(vec3(cell, face + 3.0)), 5.0) * 7.0 + 0.25;
  float tw = 0.65 + 0.35 * sin(uTime * (1.7 + h * 4.0) + h * 91.0);
  vec3 tint = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.65), hash13(vec3(cell, face + 21.0)));
  return glow + tint * b * tw * exp(-r * r * 1.6);
}
void main() {
  vec3 d = normalize(vDir);
  vec3 c = skyColor(d);
  vec4 cl = vec4(0.0);
  #ifdef PANO
    if (uPanoOn > 0.5) cl = texture2D(tPano, panoUV(d)); else cl = flatClouds(d);
  #else
    cl = flatClouds(d);
  #endif
  vec3 behind = vec3(0.0);
  // The sun: a bright disc, a little darker round its rim.
  float mu = dot(d, uSunDir), sr = 0.99976;
  if (mu > sr - 0.0004) {
    float r = clamp((1.0 - mu) / (1.0 - sr), 0.0, 2.0);
    float edge = 1.0 - smoothstep(0.85, 1.15, r);
    behind += uSunDisk * edge * (1.0 - 0.5 * (1.0 - sqrt(max(1.0 - r * r, 0.0))));
  }
  if (uNight > 0.01) {
    // The moon, with the side facing the sun lit (so it waxes and wanes), and grey seas on its face.
    float mmu = dot(d, uMoonDir), mr = 0.99962;
    if (mmu > mr) {
      vec3 mx = normalize(cross(vec3(0.0, 1.0, 0.0), uMoonDir)), my = cross(uMoonDir, mx);
      vec2 q = vec2(dot(d, mx), dot(d, my)) / sqrt(1.0 - mr * mr);
      float r2 = dot(q, q);
      if (r2 < 1.0) {
        vec3 n = q.x * mx + q.y * my - sqrt(1.0 - r2) * uMoonDir;
        float lit = smoothstep(-0.05, 0.12, dot(n, uMoonLit));
        float seas = texture2D(uNoise, q * 0.18 + 0.4).r;
        float alb = 0.62 + 0.38 * smoothstep(0.42, 0.62, seas) - 0.12 * smoothstep(0.65, 0.8, texture2D(uNoise, q * 0.6 + 0.1).b);
        behind += vec3(1.0, 0.97, 0.92) * (2.4 * lit * alb + 0.03) * smoothstep(1.0, 0.94, r2) * uNight;
      }
    }
    behind += vec3(0.5, 0.6, 0.85) * pow(max(mmu, 0.0), 900.0) * 0.5 * uNight;
    behind += stars(d) * uNight * smoothstep(-0.02, 0.2, d.y);
  }
  // A rainbow, opposite the sun, after the rain.
  if (uRainbow > 0.01) {
    float a = acos(clamp(dot(d, -uSunDir), -1.0, 1.0));
    float x = (a - 0.7330) / 0.032;
    if (abs(x) < 1.0) {
      vec3 rb = clamp(abs(fract((1.0 - (x * 0.5 + 0.5)) * 0.82 + vec3(0.0, 0.666, 0.333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
      c += rb * rb * uRainbow * (1.0 - x * x) * 0.35 * smoothstep(0.0, 0.1, d.y) * dot(c, vec3(0.3));
    }
  }
  c = c * (1.0 - cl.a) + cl.rgb + behind * (1.0 - cl.a);
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function makeSky(q = { pano: 0 }) {
  const geo = new THREE.SphereGeometry(400, 32, 16);
  const uniforms = Object.assign({}, shared);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false, uniforms,
    defines: q.pano ? { PANO: '' } : {},
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: SKY_FRAG,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 998;   // after the world (so it is only worked out where it shows), before your hand
  mesh.frustumCulled = false;
  return mesh;
}
export function setSkyQuality(mesh, q) { mesh.material.defines = q.pano ? { PANO: '' } : {}; mesh.material.needsUpdate = true; }
