// Polis World (computer version): money, markets and the World Bank (November 2026).
//
// Every city has the money it really used at the time it's set in: silver denarii in Trajan's Rome, owl drachmas in
// Pericles' Athens, golden florins in Florence, copper cash in Ming Beijing. Places that had no coins use what people
// really paid with: grain in Old Kingdom Egypt, silver weighed out by the shekel in Babylon, carnelian beads in
// Mohenjo-daro, cacao beans in Teotihuacan, rice at Angkor. Your purse holds them all, and the World Bank, in the middle
// of the map, changes any of them for any other.
//
// Where a king or an emperor rules, he sets the prices and his tax collectors take a share of every sale. Athens was a
// democracy, and Carthage and Florence were republics: there prices go up and down with what people buy and sell, you
// can own a market stall and set your own prices, and you can put money into a voyage or a company and share the
// profit — or lose it if the ship goes down. Merchants in all three really did this.
//
// What things are worth is counted underneath in one hidden unit, about an Athenian obol (a sixth of a drachma), so
// every price and every exchange rate comes from the same place.
import { ITEM, RECIPES } from './items.js';

// ---------- the money of each city ----------
// v: what one unit is worth, in obols. art: how its picture is drawn. rule: who's in charge, and who pays you for work.
export const MONEY = {
  rome: { unit: 'denarius', units: 'denarii', v: 5, art: ['coin', 'silver', 'head'], tax: 0.05,
    ruler: 'the Emperor', rulerName: 'Emperor Trajan', clerk: ['Felix', "Clerk of the Emperor's Treasury"], merchant: ['Tertia', 'Market Trader'],
    about: "A silver denarius was about a day's pay for a working man in Trajan's time. Four brass sestertii made a denarius, and twenty-five denarii made a gold aureus.",
    taxNote: "The emperor's tax collectors take 1 coin in every 20 here. Real Romans paid 1 in 20 on some things, like an inheritance, and 1 in 100 on things sold at auction." },
  athens: { unit: 'drachma', units: 'drachmas', v: 6, art: ['coin', 'silver', 'owl'], free: true,
    ruler: 'the Assembly', rulerName: 'the Assembly of the citizens', clerk: ['Theron', 'Secretary of the Council'], merchant: ['Kallias', 'Banker at the Agora'],
    about: "Athens' silver drachmas had Athena's owl on them, so people called them 'owls'. Six obols made a drachma. The silver came from the city's own mines at Laurion.",
    invest: { kind: 'sea loan', what: 'a grain ship sailing to the Black Sea and back', days: 1, win: 0.85, gain: 0.3,
      how: "Lend money to a ship's captain for his voyage. If the ship comes home, he pays you back with 30 extra in every 100. If it sinks, he owes you nothing at all — that's why sea loans paid so much. Athenians really did this, and wrote it all down in contracts.",
      won: "The grain ship came home from the Black Sea, its hold full of wheat. The captain paid you back with interest:",
      lost: "Bad news from the harbour: a storm sank the grain ship on its way home. Under a sea loan the captain owes nothing when his ship is lost, so the money you lent is gone." } },
  giza: { unit: 'hekat of grain', units: 'hekats of grain', v: 1.5, art: ['grain'], tax: 0.1,
    ruler: 'Pharaoh', rulerName: 'Pharaoh Khufu', clerk: ['Senbi', "Overseer of Pharaoh's Granary"], merchant: ['Nefret', 'Market Trader'],
    about: "Egypt had no coins for another two thousand years. Workers were paid in grain, bread and beer, and grain was measured out by the hekat, a measure of about five litres.",
    taxNote: "Pharaoh's scribes count every harvest and take a share for the royal granaries. Here his scribes take 1 in 10 of every sale." },
  alexandria: { unit: 'Ptolemaic drachma', units: 'Ptolemaic drachmas', v: 5, art: ['coin', 'silver', 'eagle'], tax: 0.1,
    ruler: 'the King', rulerName: 'King Ptolemy', clerk: ['Apollonios', 'Clerk of the Royal Bank'], merchant: ['Berenike', 'Market Trader'],
    about: "The Ptolemy kings struck their own drachmas, with Zeus's eagle on them, a little lighter than Athens' coins. Foreign coins weren't allowed in Egypt: merchants had to change them for the king's.",
    taxNote: "The king taxes sales here at 1 in 10, and only the king's own workshops are allowed to make oil and papyrus to sell." },
  babylon: { unit: 'shekel of silver', units: 'shekels of silver', v: 12, art: ['lump'], tax: 0.1,
    ruler: 'the King', rulerName: 'King Nebuchadnezzar', clerk: ['Nabu-zer', 'Scribe of the Royal Storehouse'], merchant: ['Ishme', 'Market Trader'],
    about: "Babylon had no coins: people paid in silver, cut from rings and bars and weighed out on scales. A shekel was about 8 grams of silver, sixty shekels made a mina, and sixty minas a talent.",
    taxNote: "The temples of Babylon take a tenth of many things, called the esrum. Here the king's scribe takes 1 in 10 of every sale." },
  persepolis: { unit: 'siglos', units: 'sigloi', v: 8, art: ['coin', 'silver', 'archer'], tax: 0.1,
    ruler: 'the King of Kings', rulerName: 'Darius the Great, King of Kings', clerk: ['Baradkama', 'Treasurer of Persepolis'], merchant: ['Farnaz', 'Market Trader'],
    about: "Darius made Persia's first coins: the silver siglos and the gold daric, both showing the king as a running archer. Twenty sigloi made one daric.",
    taxNote: "Every land of the empire sends Darius tribute: silver, gold, horses and more. Here his treasurer takes 1 in 10 of every sale." },
  mohenjoDaro: { unit: 'carnelian bead', units: 'carnelian beads', v: 3, art: ['bead'], tax: 0.05,
    ruler: 'the city', rulerName: "the city's leaders (nobody knows who they were)", clerk: ['Weigher', 'Keeper of the Weights'], merchant: ['Bead Seller', 'Market Trader'],
    about: "Nobody has found any coins in the Indus cities. People traded goods for goods, and long red carnelian beads, which took days to drill, were treasured all the way to Mesopotamia.",
    taxNote: "Nobody knows if Mohenjo-daro had taxes. But every market used the same stone weights, made to exact sizes, so somebody was in charge. Here the Keeper of the Weights takes 1 in 20." },
  teotihuacan: { unit: 'cacao bean', units: 'cacao beans', v: 0.25, art: ['bean'], tax: 0.1,
    ruler: 'the rulers', rulerName: 'the rulers of Teotihuacan (nobody knows their names)', clerk: ['Ollin', 'Keeper of the Storehouse'], merchant: ['Xochitl', 'Market Trader'],
    about: "There were no coins in ancient Mexico. Cacao beans, cotton cloth and obsidian were traded, and later the Aztecs used cacao beans as small change: a tomato cost one bean, a rabbit about thirty.",
    taxNote: "Nobody knows exactly how Teotihuacan was ruled, but its rulers collected goods from farmers and craftspeople. Here their storekeeper takes 1 in 10." },
  angkor: { unit: 'measure of rice', units: 'measures of rice', v: 0.5, art: ['rice'], tax: 0.1,
    ruler: 'the King', rulerName: 'King Suryavarman II', clerk: ['Dara', "The King's Steward"], merchant: ['Bopha', 'Market Trader'],
    about: "The Khmer kings never made coins. A visitor from China wrote that small things at Angkor were paid for with rice and grain, and big things with gold and silver. The market traders were mostly women.",
    taxNote: "The king's officials collect rice, cloth and honey from the villages for the temples. Here the steward takes 1 in 10." },
  jerusalem: { unit: 'Tyrian shekel', units: 'Tyrian shekels', v: 24, art: ['coin', 'silver', 'eagle'], tax: 0.1,
    ruler: 'the Temple', rulerName: 'the treasurers of the Temple (and, over them, Rome)', clerk: ['Eleazar', 'Treasurer of the Temple'], merchant: ['Salome', 'Market Trader'],
    about: "Roman denarii, little bronze prutahs and silver shekels from Tyre were all used here. The Temple would only take Tyrian shekels, because their silver was the purest.",
    taxNote: "Rome collects its taxes here through tax collectors called publicans, who were not popular! Here they take 1 in 10 of every sale." },
  carthage: { unit: 'Carthaginian shekel', units: 'Carthaginian shekels', v: 10, art: ['coin', 'silver', 'horse'], free: true,
    ruler: 'the Republic', rulerName: 'the two suffetes and the Council of Elders', clerk: ['Mago', 'Clerk of the Suffetes'], merchant: ['Bomilcar', 'Merchant of the Harbour'],
    about: "Carthage's coins show the goddess Tanit on one side and a horse or a palm tree on the other. Carthaginian traders had sailed the whole Mediterranean for centuries before they made coins of their own.",
    invest: { kind: 'trading voyage', what: 'a ship sailing out past the Pillars of Hercules to trade for tin and gold', days: 1.5, win: 0.8, gain: 0.4,
      how: "Put money into a merchant ship's voyage, and share what it brings home: 40 more for every 100 you put in, if it comes back. Carthaginian sailors really went out into the Atlantic, south along Africa and north towards Britain's tin.",
      won: "The ship came back through the Pillars of Hercules loaded with tin and gold. Your share:",
      lost: "The ship never came back from the Ocean. Perhaps a storm, perhaps pirates — nobody knows. The money you put in is lost." } },
  forbiddenCity: { unit: 'wen', units: 'wen', v: 0.2, art: ['holed', 'copper'], tax: 0.034,
    ruler: 'the Emperor', rulerName: 'the Hongzhi Emperor', clerk: ['Bao', 'Steward of the Imperial Workshops'], merchant: ['Hua', 'Shopkeeper'],
    about: "Chinese coins were round with a square hole, so they could be strung together: a string of 1,000 copper cash. By the Ming emperors' time, people paid for big things in lumps of silver instead.",
    taxNote: "The Ming emperors taxed shops and markets at 1 in 30, and that's what's taken here." },
  wei: { unit: 'wu zhu', units: 'wu zhu', v: 0.25, art: ['holed', 'bronze'], tax: 0.1,
    ruler: 'the Emperor', rulerName: 'Emperor Cao Rui of Wei', clerk: ['Jing', 'Officer of the State Farms'], merchant: ['Hu', 'Market Trader'],
    about: "Wu zhu means 'five grains', the coin's weight. They'd been made for 300 years. From 221 to 227 Wei stopped using coins altogether, and people paid with grain and silk, until Emperor Cao Rui brought them back.",
    taxNote: "Wei's state farms take half the harvest or more. Here the emperor's officer takes 1 in 10 of every sale." },
  shu: { unit: 'zhi bai coin', units: 'zhi bai coins', v: 2, art: ['holed', 'bronze', 'big'], tax: 0.1,
    ruler: 'the Emperor', rulerName: 'Emperor Liu Shan, with his chancellor Zhuge Liang', clerk: ['Yun', 'Officer of the Brocade Office'], merchant: ['Ping', 'Market Trader'],
    about: "Zhi bai means 'worth a hundred'. Liu Bei made these big coins to pay his army, and said each was worth a hundred ordinary coins. But they had nothing like a hundred coins' worth of bronze in them.",
    taxNote: "Shu sells its brocade to the other kingdoms to pay for its wars. Here the officer takes 1 in 10 of every sale." },
  wu: { unit: 'da quan coin', units: 'da quan coins', v: 3, art: ['holed', 'bronze', 'big'], tax: 0.1,
    ruler: 'the Emperor', rulerName: 'Emperor Sun Quan of Wu', clerk: ['Gong', 'Officer of the Shipyards'], merchant: ['Lian', 'Market Trader'],
    about: "Da quan means 'great money'. Sun Quan made these huge coins and said each was worth five hundred ordinary ones. People hated them, and ten years later he had to take them back.",
    taxNote: "Here the emperor's officer takes 1 in 10 of every sale, for the ships of Wu's river navy." },
  olympia: { unit: 'stater of Elis', units: 'staters of Elis', v: 16, art: ['coin', 'silver', 'bolt'], tax: 0.1,
    ruler: 'the judges', rulerName: 'the judges of Elis, who run the Games', clerk: ['Eudoxos', 'Servant of the Judges'], merchant: ['Damaretos', 'Market Trader'],
    about: "The city of Elis, which ran the Games, struck big silver staters with Zeus's eagle and thunderbolt on them, probably for the crowds that came to Olympia every four years.",
    taxNote: "Athletes who cheat are fined, and the fines pay for bronze statues of Zeus by the stadium. Here the judges' servant takes 1 in 10 of every sale." },
  florence: { unit: 'florin', units: 'florins', v: 50, art: ['coin', 'gold', 'lily'], free: true,
    ruler: 'the Republic', rulerName: 'the Republic of Florence and its Great Council', clerk: ['Niccolò', 'Secretary of the Republic'], merchant: ['Bernardo', 'Wool Merchant and Banker'],
    about: "The gold florin, with Florence's lily on it, was first struck in 1252. It was so trusted that people all over Europe used it, and other cities copied it.",
    invest: { kind: 'partnership', what: 'a wool company that buys English wool and sells fine Florentine cloth', days: 1, win: 0.92, gain: 0.15,
      how: "Become a partner in a company: your money buys wool, the company dyes and weaves it and sells the cloth, and you share the profit — 15 more for every 100 you put in. It's safer than a sea voyage, but a company can still go broke. Florentines invented much of the way companies and banks still work.",
      won: "The wool company had a good year: the cloth sold in Venice and Rome. Your share of the profit:",
      lost: "The wool company went broke: a ship with its wool was lost and the buyers didn't pay. Your money is gone. When a banker went broke, people said his bench was broken — 'banca rotta' — and that's where 'bankrupt' comes from." } },
};
export const BANK_ID = 'worldBank';
export const CITIES = Object.keys(MONEY);
export const isFree = (c) => !!MONEY[c]?.free;
export function fmt(cur, n) { const m = MONEY[cur]; return m ? `${Math.round(n).toLocaleString('en')} ${Math.round(n) === 1 ? m.unit : m.units}` : `${n}`; }

// ---------- what things are worth ----------
// Raw things get a worth by hand; anything made from a recipe is worth what goes into it, and a quarter more.
const RAW = {
  dirt: 0.08, cobblestone: 0.2, sand: 0.12, gravel: 0.12, snowball: 0.05, clay: 0.3, sandstone: 0.4, cactus: 0.5,
  oakLog: 1, birchLog: 1, spruceLog: 1.2, palmLog: 1, jungleLog: 1.2, cherryLog: 1.5, ginkgoLog: 1.5, acaciaLog: 1, figLog: 1, ironwoodLog: 3,
  coal: 1, tinOre: 3, copperOre: 2.5, ironOre: 4, goldOre: 40, granite: 0.6, limestone: 0.5, marble: 2, blackMarble: 6,
  greenMarble: 3, blueMarble: 3, redMarble: 3, purpleMarble: 3, obsidian: 3, mountainSoil: 0.1, blackSand: 0.2, mossyCobble: 0.3,
  diamond: 150, emerald: 100, amethyst: 60, blackOpal: 120, crystal: 30, atlStone: 5,
  apple: 1, rawBeef: 3, rawMutton: 3, rawPork: 2.5, rawChicken: 2, goatMeat: 2, rawFish: 1.5, venison: 4, rawDuck: 2.5, rawTurtle: 3,
  rawSquid: 2, rawSailfish: 4, rawPufferfish: 1, wheat: 0.5, wheatSeeds: 0.2, maize: 0.6, maizeSeeds: 0.2, cocoaBean: 0.4, acaiBerry: 1,
  honey: 3, figs: 1.5, dates: 1.5, olives: 1, tea: 3, salt: 2, leather: 3, wool: 2, feather: 0.5, silkFiber: 4, cotton: 3, murex: 4,
  beads: 6, amphora: 3, clayPot: 2, glassBottle: 3, statuette: 15, sealStone: 8, papyrusRods: 0.5, bambooRods: 0.5,
  poppy: 0.5, dandelion: 0.3, tallGrass: 0.1, kelp: 0.3, seagrass: 0.2, brainCoral: 2, tubeCoral: 2, fireCoral: 2, purpleFan: 1.5, yellowFan: 1.5,
  sponge: 4, greenVine: 0.3, stranglerVine: 0.3, waterMoss: 2, drainerVine: 2,
  yellowFeather: 2, greenFeather: 2, blueFeather: 2, whiteFeather: 2, redFeather: 2, crocodileLeather: 8, tigerLeather: 20,
  roastBeef: 4.5, roastMutton: 4.5, roastPork: 4, roastChicken: 3, roastGoat: 3, cookedFish: 2.5, roastVenison: 6, roastDuck: 4,
  roastTurtle: 4.5, cookedSquid: 3, cookedSailfish: 6, driedKelp: 0.6,
};
const memo = new Map();
export function valueOf(id) {
  if (memo.has(id)) return memo.get(id);
  const it = ITEM[id];
  let v = 0;
  if (!it) v = 0;
  else if (RAW[id] !== undefined) v = RAW[id];
  else if (it.relic) v = it.worth ? it.worth * 60 : 0;    // the Atlantean relics have no price
  else {
    memo.set(id, 1);                                      // (a guard, in case two recipes ever make each other)
    let best = Infinity;
    for (const rc of RECIPES) {
      if (rc.out !== id) continue;
      const cost = rc.inputs.reduce((s, [ids, c]) => s + Math.min(...ids.map((x) => (x === id ? Infinity : valueOf(x)))) * c, 0);
      if (Number.isFinite(cost)) best = Math.min(best, cost / rc.n * 1.25);
    }
    v = Number.isFinite(best) ? best : 1;
  }
  memo.set(id, v);
  return v;
}
// What the World Bank buys: gold, gems and treasure.
export const TREASURE = ['goldOre', 'goldIngot', 'goldBlock', 'goldNecklace', 'goldCrown', 'diamond', 'emerald', 'amethyst', 'blackOpal', 'crystal',
  'goldenMask', 'canopicJar', 'scarab', 'ankh', 'shabti', 'jadeBi', 'jadeCong', 'jadeAxe', 'goldenEgg'];

// ---------- what each city's market sells, and what it wants from elsewhere ----------
// What a place makes is cheap there; what it has to bring in from far away fetches a good price.
const GOODS = {
  rome: { sells: ['bread', 'puls', 'olives', 'amphora', 'lamp', 'brick', 'mosaic', 'toga', 'ironSword', 'ironHelmet', 'glassBottle'], wants: ['silk', 'purpleCloth', 'wheat', 'marble', 'tea'] },
  athens: { sells: ['olives', 'figs', 'honey', 'honeyCake', 'amphora', 'marble', 'column', 'statuette', 'bronzeHelmet', 'bronzeArmour', 'woolTunic'], wants: ['wheat', 'planks', 'ironIngot', 'salt'] },
  giza: { sells: ['bread', 'wheat', 'dates', 'linenKilt', 'papyrus', 'limestone', 'goldNecklace', 'clayPot'], wants: ['planks', 'spruceLog', 'copperIngot', 'olives'] },
  alexandria: { sells: ['papyrus', 'glass', 'glassBottle', 'wheat', 'linenKilt', 'lamp', 'fishStew'], wants: ['silk', 'ironIngot', 'planks', 'olives'] },
  babylon: { sells: ['dates', 'mudBrick', 'brick', 'blueTile', 'clayPot', 'wool', 'bread', 'sealStone'], wants: ['planks', 'copperIngot', 'tinIngot', 'goldIngot'] },
  persepolis: { sells: ['carvedStone', 'redCloth', 'blueCloth', 'honey', 'dates', 'goldNecklace', 'bronzeArmour'], wants: ['ironIngot', 'silk', 'wool'] },
  mohenjoDaro: { sells: ['beads', 'beadNecklace', 'cotton', 'sealStone', 'clayPot', 'brick', 'wheat'], wants: ['copperIngot', 'tinIngot', 'goldIngot'] },
  teotihuacan: { sells: ['obsidian', 'obsidianBlade', 'maize', 'tortilla', 'cocoaBean', 'cotton', 'greenFeather', 'plaster'], wants: ['jade', 'redFeather', 'salt'] },
  angkor: { sells: ['riceBowl', 'rawFish', 'cookedFish', 'jungleLog', 'bambooRods', 'honey'], wants: ['silk', 'tinIngot', 'paper', 'clayPot'] },
  jerusalem: { sells: ['olives', 'figs', 'dates', 'jerusalemStone', 'parchment', 'clayPot', 'honey', 'lamp'], wants: ['purpleCloth', 'wool', 'goldIngot'] },
  carthage: { sells: ['purpleCloth', 'purpleCloak', 'murex', 'olives', 'amphora', 'glassBottle', 'oar'], wants: ['tinIngot', 'ironIngot', 'goldIngot', 'wheat'] },
  forbiddenCity: { sells: ['silk', 'silkRobe', 'tea', 'yellowRoof', 'greenRoof', 'redLacquer', 'paper', 'jade', 'clayPot'], wants: ['goldIngot', 'wool', 'salt'] },
  wei: { sells: ['wheat', 'puls', 'paper', 'ironIngot', 'ironSword', 'ironSpear'], wants: ['silk', 'salt', 'tea'] },
  shu: { sells: ['silk', 'silkRobe', 'silkFiber', 'salt', 'tea', 'bambooRods'], wants: ['ironIngot', 'wheat', 'leather'] },
  wu: { sells: ['rawFish', 'riceBowl', 'planks', 'oar', 'sailboat', 'tea'], wants: ['ironIngot', 'silk', 'wheat'] },
  olympia: { sells: ['olives', 'honeyCake', 'statuette', 'bronzeHelmet', 'figs', 'amphora'], wants: ['marble', 'bronzeIngot', 'wheat'] },
  florence: { sells: ['redCloth', 'blueCloth', 'woolTunic', 'marble', 'paper', 'glass', 'statuette'], wants: ['wool', 'silk', 'goldIngot'] },
};
// What a townsperson has to sell depends on their job.
const JOB_GOODS = [
  [/bak/, ['bread', 'puls', 'honeyCake']], [/pott|vase/, ['clayPot', 'amphora']], [/fish/, ['rawFish', 'cookedFish']], [/olive/, ['olives']],
  [/tea/, ['tea']], [/salt/, ['salt']], [/silk/, ['silk', 'silkFiber']], [/paper/, ['paper']], [/papyrus/, ['papyrus']], [/glass/, ['glass', 'glassBottle']],
  [/bead/, ['beads', 'beadNecklace']], [/seal/, ['sealStone']], [/weav/, ['cotton', 'woolTunic']], [/obsidian/, ['obsidian', 'obsidianBlade']],
  [/stone|mason|quarry|carver|hauler/, ['limestone', 'carvedStone', 'stoneBricks']], [/brick/, ['brick', 'mudBrick']], [/smith/, ['ironIngot', 'ironSword']],
  [/purple/, ['purpleCloth', 'murex']], [/dyer/, ['redCloth', 'blueCloth']], [/sculpt/, ['statuette', 'marble']], [/carpent|shipwright/, ['planks', 'oar']],
  [/gardener/, ['apple', 'figs', 'poppy']], [/beam painter/, ['redLacquer']], [/painter|apprentice/, ['brush']], [/scribe/, ['papyrus', 'parchment']],
  [/sailor|rower/, ['rawFish', 'oar']], [/athlete/, ['olives']], [/rice/, ['riceBowl']],
];
const CROP = { teotihuacan: 'maize', angkor: 'riceBowl', wu: 'riceBowl', shu: 'tea' };

// ---------- paid work for each city's ruler ----------
// One job a day in each city. The pay is better than selling the same things in the market.
const WORK = {
  rome: [
    [[['cobblestone', 16]], 'The Emperor is paving a new road. Bring 16 cobblestones for the road-builders.', 'Roman roads were built in layers: big stones, then gravel, then paving on top. Some are still used today, nearly 2,000 years later.'],
    [[['ironIngot', 3]], 'The legions need iron for swords and armour. Bring 3 iron ingots.', "In Trajan's time a legionary was paid 300 denarii a year, and had to pay for his own food and kit out of it."],
    [[['wheat', 12]], 'Grain for the free bread of Rome: bring 12 wheat.', 'Around 200,000 Roman citizens were given free grain by the state every month. It was called the annona.'],
  ],
  athens: [
    [[['planks', 16]], 'The Assembly has voted to build more warships. Bring 16 planks for the shipyards at the Piraeus.', 'In 483 BCE the Assembly voted to spend a lucky new find of silver at the Laurion mines on 200 new warships, instead of sharing it out.'],
    [[['olives', 10]], 'Olive oil for the athletes at the gymnasium: bring 10 olives.', "Winners at Athens' own games, the Panathenaia, were given big painted jars full of oil from Athena's sacred olive trees."],
    [[['marble', 6]], "The temple-builders need marble from Mount Pentelikon. Bring 6 marble.", "Builders on Athens' temples were paid a drachma a day, the same whether they were citizens, foreigners or slaves."],
  ],
  giza: [
    [[['limestone', 16]], "Pharaoh needs fine white limestone to case his pyramid. Bring 16 limestone.", 'The Great Pyramid was cased in smooth white limestone from Tura, across the Nile. It shone in the sun.'],
    [[['bread', 6]], "The workers' village needs bread. Bring 6 loaves.", 'The pyramid builders were not slaves: they were paid workers, given bread, beer and meat, and buried in tombs of their own near the pyramids.'],
    [[['copperIngot', 3]], "The stonecutters' copper chisels keep going blunt. Bring 3 copper ingots.", 'Copper chisels were too soft for granite, so the masons pounded granite with balls of a harder stone, dolerite.'],
  ],
  alexandria: [
    [[['papyrus', 6]], 'The Great Library always wants more books. Bring 6 sheets of papyrus.', 'People said the Library copied the books off every ship that came into the harbour, kept the originals, and gave the owners the copies.'],
    [[['wheat', 12]], "The king's granaries send wheat all over the Mediterranean. Bring 12 wheat.", 'Egypt grew so much grain that it fed other countries. Later on, it fed much of Rome.'],
    [[['coal', 8]], 'The lighthouse keepers need fuel. Bring 8 coal.', 'The Pharos lighthouse stood about 100 metres tall. A fire burned at the top at night, so ships could find the harbour in the dark.'],
  ],
  babylon: [
    [[['blueTile', 8]], 'The Ishtar Gate needs more blue glazed bricks. Bring 8.', "The Ishtar Gate's blue bricks show bulls and dragons. You can still see the gate today, rebuilt in a museum in Berlin."],
    [[['brick', 16]], 'The king is rebuilding the city walls. Bring 16 baked bricks.', 'Nebuchadnezzar had his name stamped on the bricks of his buildings. Archaeologists still dig them up.'],
    [[['dates', 8]], 'Dates for the temple of Marduk: bring 8.', 'Date palms grew all along the canals. Babylonians ate dates every day, and made syrup from them too.'],
  ],
  persepolis: [
    [[['carvedStone', 8]], 'The Hall of a Hundred Columns needs carved stone. Bring 8.', "Thousands of clay tablets found at Persepolis record the workers' pay in grain, wine and beer. Women were paid the same as men for the same work, and new mothers got extra."],
    [[['goldIngot', 1]], 'Gold for the royal mint, to strike new darics. Bring 1 gold ingot.', 'The gold daric showed the king as a running archer. A soldier was paid about one daric a month.'],
    [[['wheat', 12]], 'Grain for the royal storehouses. Bring 12 wheat.', "The Royal Road ran about 2,500 km across the empire, with fresh horses waiting at every day's ride, so the king's messages flew across it."],
  ],
  mohenjoDaro: [
    [[['brick', 12]], 'The Great Bath needs repairing. Bring 12 baked bricks.', 'The bricks of Mohenjo-daro were all made the same shape: as long as two widths, and as wide as two heights.'],
    [[['cotton', 4]], 'The weavers need cotton cloth. Bring 4.', 'The people of the Indus valley were among the first in the world to grow cotton and weave it into cloth.'],
    [[['wheat', 12]], 'The great hall needs grain. Bring 12 wheat.', 'The big building people call the Granary may not have held grain at all. Archaeologists still argue about what it was for.'],
  ],
  teotihuacan: [
    [[['obsidian', 6]], 'The workshops need obsidian. Bring 6.', 'Obsidian from the mountains near Teotihuacan is green and gold. It was carried and traded all over Mexico.'],
    [[['maize', 12]], 'Maize for the storehouses: bring 12.', 'Teotihuacan was one of the biggest cities in the world 1,500 years ago, with perhaps 100,000 people or more.'],
    [[['plaster', 8]], "The city's walls are kept white and painted. Bring 8 white plaster.", 'Almost every wall in Teotihuacan was plastered and painted, many of them red. Nobody knows what the people who lived here called their own city.'],
  ],
  angkor: [
    [[['sandstone', 16]], "The king's temple needs sandstone. Bring 16.", "Angkor Wat's sandstone came from a hill about 40 km away, floated much of the way along canals."],
    [[['rawFish', 8]], "Fish for the king's kitchens: bring 8 raw fish.", 'The great lake near Angkor, the Tonle Sap, is one of the richest places for fish anywhere in the world.'],
    [[['jungleLog', 4]], "Logs for the builders' scaffolding: bring 4 jungle logs.", "Elephants hauled the heaviest loads at Angkor. The king's Terrace of the Elephants is carved with them."],
  ],
  jerusalem: [
    [[['jerusalemStone', 12]], 'The Temple is still being built. Bring 12 blocks of Jerusalem stone.', 'Herod began rebuilding the Temple in about 20 BCE. Its builders were still at work in 30 CE, and it was finished only about 63 CE.'],
    [[['olives', 10]], "Olives, for the oil of the Temple's lamps: bring 10.", "Every grown man paid half a shekel a year to the Temple, in Tyrian shekels. That's why there were money-changers in its courts."],
    [[['goldIngot', 1]], "Gold to cover the Temple's doors: bring 1 gold ingot.", 'Visitors wrote that the Temple was covered in so much gold that in the sunshine it hurt your eyes to look at it.'],
  ],
  carthage: [
    [[['planks', 16]], 'The Council wants more warships for the round harbour. Bring 16 planks.', "Carthage's round naval harbour had sheds for about 200 warships, all round the edge and on an island in the middle."],
    [[['murex', 4]], 'The purple dyers need murex shells. Bring 4.', 'It took thousands of murex sea snails to dye a single cloak purple. Great heaps of their empty shells have been found near the old dye works.'],
    [[['olives', 10]], "Olives for the city's oil presses: bring 10.", "A Carthaginian called Mago wrote a famous book on farming. When the Romans destroyed Carthage they kept his book and had it put into Latin."],
  ],
  forbiddenCity: [
    [[['yellowRoof', 12]], 'The palace roofs need yellow tiles. Bring 12.', "Yellow was the emperor's colour. Only his buildings could have yellow roof tiles."],
    [[['redLacquer', 8]], "The halls' pillars need red lacquered wood. Bring 8.", 'The Forbidden City has about 980 buildings. It took about a million workers fourteen years to build.'],
    [[['tea', 6]], 'Tea for the palace kitchens: bring 6.', 'The Hongzhi Emperor had only one wife, the Empress Zhang. He is the only emperor of China known to have had just one.'],
  ],
  wei: [
    [[['wheat', 12]], 'The state farms need grain. Bring 12 wheat.', 'Wei fed its armies from state farms, where soldiers and farmers worked government land and handed over half the harvest or more.'],
    [[['paper', 6]], 'The court scribes need paper. Bring 6 sheets.', 'Chinese paper was made from bark, hemp and old rags. It was cheaper than silk to write on, and lighter than strips of bamboo.'],
    [[['ironIngot', 3]], 'The armourers need iron for crossbows. Bring 3 iron ingots.', 'For a few years Wei stopped using coins altogether, and people paid with grain and silk instead. Emperor Cao Rui brought the coins back in 227.'],
  ],
  shu: [
    [[['silk', 4]], 'The Brocade Office sells silk to Wei and Wu. Bring 4 silk brocade.', "Zhuge Liang said that Shu's whole army depended on brocade: it was sold to the other kingdoms to pay for the war."],
    [[['salt', 6]], 'Salt for the state: bring 6.', 'In Shu people drilled wells hundreds of metres deep to reach salty water, and boiled it dry over fires of natural gas piped through bamboo.'],
    [[['tea', 6]], 'Tea for the court: bring 6.', 'Tea drinking began in the south-west of China, around Shu. Its capital, Chengdu, is still called the City of Brocade.'],
  ],
  wu: [
    [[['planks', 16]], "Wu's navy needs ships. Bring 16 planks for the shipyards.", "Wu's strength was its navy on the great Yangtze river. Its biggest ships had several decks, one above another."],
    [[['rawFish', 8]], 'Fish for the sailors: bring 8.', "Sun Quan sent ships out across the sea, to the island of Taiwan and south to the kingdoms of south-east Asia."],
    [[['ironIngot', 3]], 'Anchors and nails for the ships: bring 3 iron ingots.', "Wu's people grew rice in flooded fields along the Yangtze. The south of China was only just becoming as rich as the north."],
  ],
  olympia: [
    [[['olives', 10]], 'Oil for the athletes: bring 10 olives.', 'Athletes at Olympia rubbed olive oil on their skin before they competed, and scraped it off afterwards with a curved tool called a strigil.'],
    [[['bronzeIngot', 4]], 'Bronze for new statues of Zeus: bring 4 bronze ingots.', "Athletes caught cheating were fined, and the fines paid for bronze statues of Zeus lining the way into the stadium, with the cheats' names on them."],
    [[['marble', 6]], 'Marble for the Temple of Zeus: bring 6.', 'Inside the temple sat a statue of Zeus 12 metres high, of gold and ivory, made by Phidias. It was one of the Seven Wonders of the World.'],
  ],
  florence: [
    [[['marble', 8]], "The cathedral's works office needs marble from Carrara. Bring 8.", "In 1501 the cathedral's works office gave a young sculptor, Michelangelo, a huge spoiled block of marble that nobody else could use. He carved David out of it."],
    [[['wool', 8]], 'The wool guild needs raw wool from England. Bring 8 wool.', "The wool guild, the Arte della Lana, was put in charge of building the cathedral and its great dome."],
    [[['ironIngot', 3]], 'The Republic is raising its own army. Bring 3 iron ingots for weapons.', 'In 1506 Florence raised an army of its own citizens, instead of paying soldiers from somewhere else. The man who organised it was Niccolò Machiavelli.'],
  ],
};
// Athens: a day on a jury. Juries were huge, chosen by lot, and paid.
const JURY = [
  ["A farmer says his neighbour's goat got into his garden and ate all his cabbages. The neighbour says the farmer's wall had fallen down, so it's the farmer's own fault.",
    ["The goat's owner pays for the cabbages", 'The farmer should have mended his wall'], 'Athenian juries were huge: 201 jurors for a small case like this, and 501 or more for a big one. Nobody could bribe them all!'],
  ['A potter sold a man a big jar for olive oil. When the man filled it, it leaked all over his floor. The potter says it was fine when it left his workshop.',
    ['The potter gives the money back', 'The man must have cracked it himself'], 'There were no lawyers in Athens. Each side spoke for themselves, and a water clock timed their speeches.'],
  ["Two brothers can't agree how to share their father's olive trees. The elder says he should get more, because he's older. The younger says they should share them equally.",
    ['Share them equally', 'The elder brother gets more'], "Athenian law said brothers shared what their father left them equally, whoever was older."],
  ["A man borrowed his friend's donkey to carry grain to the market, and the donkey went lame on the way. The friend wants a new donkey.",
    ['The borrower pays for a new donkey', 'It was an accident: nobody pays'], 'Jurors were chosen by lot on the morning of the trial, so nobody could know in advance who would judge the case.'],
];

// ---------- the money-changers at the World Bank ----------
export const CHANGERS = [
  ['Pasion', 'Money-changer from Athens', 'greek', "In Athens bankers are called trapezitai, 'table men', because we sit at tables in the market. I started out as a slave working in a bank. My masters freed me and left me the bank, and in the end Athens made me a citizen!"],
  ['Caecilius', 'Money-changer from Pompeii', 'roman', "In Rome a banker is an argentarius, a 'silver man'. My wax tablets, with every sale I made at auction, were buried when Vesuvius erupted. Archaeologists found them 1,800 years later."],
  ['Giovanni', 'Banker from Florence', 'roman', "My family, the Medici, started a bank in Florence in 1397. We write bills of exchange, so a merchant can pay money in one city and collect it in another, without carrying a single coin across Europe."],
  ['Zhou', 'Money-changer from China', 'chinese', "Strings of copper coins are heavy! So merchants in China used 'flying money': a note you paid for in one city and cashed in another. Later, China was the first country in the world to print paper money."],
  ['Shimon', 'Money-changer from Jerusalem', 'judean', 'Every grown man pays half a shekel a year to the Temple, and it must be in Tyrian shekels, because their silver is the purest. Pilgrims come from everywhere with all sorts of coins, so we change them.'],
  ['Theon', 'Royal banker from Alexandria', 'greek', "In Egypt the king owns the banks. Foreign coins aren't allowed: a merchant who lands at Alexandria must change his money for the king's coins, and the king keeps a share."],
  ['Arash', 'Money-changer from Persepolis', 'persian', 'King Darius made the gold daric. Twenty silver sigloi make one daric, and a soldier is paid about one daric a month.'],
  ['Xochitl', 'Trader from Teotihuacan', 'mesoamerican', 'Where I come from, people trade cacao beans, cotton cloth and obsidian. Much later the Aztecs used cacao beans as small change, and some people made fake ones, filling empty bean skins with mud!'],
];
export const NABU = {
  start: 'Welcome to the World Bank! I am Nabu, of the House of Egibi in Babylon. Everybody\'s money is good here: the money-changers at the counters inside will change any money in the world for any other.',
  egibi: 'My family were real bankers in Babylon, about 2,600 years ago. We lent silver, kept people\'s money safe, bought and sold land and houses, and wrote everything down on clay tablets. Archaeologists have found well over a thousand of our tablets.',
  interest: 'When we lent silver, we usually charged 20 shekels a year for every 100 we lent. That extra is called interest. Hammurabi\'s laws, more than a thousand years before me, set the most a lender was allowed to charge.',
  why: 'Every land made its own money from the things it trusted: silver weighed out here in Babylon, coins in Greece and Rome, grain in Egypt, cacao beans in Mexico, copper cash in China. What makes money work is that everybody agrees it\'s worth something.',
  how: 'Bring us any money and choose the money you want, and the money-changers will change it. We keep a little each time, 1 coin in 20: that\'s how a money-changer earns a living. We also buy gold, gems and treasure, and pay in any money you like.',
};

// ---------- coin pictures ----------
const METAL = { gold: ['#f2c94c', '#a8781a', '#fff2a8'], silver: ['#cfd5dc', '#7d858f', '#ffffff'], bronze: ['#c98a4b', '#70461d', '#f0c48c'], copper: ['#c8754a', '#6e3a1e', '#f2a57a'] };
const GLYPH = {
  owl: ['1...1', '.111.', '1.1.1', '.111.', '.1.1.'], head: ['.11..', '1111.', '.1111', '.11..', '.1...'], archer: ['..1..', '.111.', '1.1.1', '.1.1.', '1...1'],
  eagle: ['1.1.1', '.111.', '..1..', '.1.1.', '1...1'], lily: ['..1..', '1.1.1', '11111', '..1..', '.111.'], horse: ['11...', '.1111', '.1111', '.1..1', '.1..1'],
  bolt: ['...1.', '..1..', '.111.', '..1..', '.1...'],
};
const artCache = new Map();
export function coinArt(cur) {
  if (artCache.has(cur)) return artCache.get(cur);
  const m = MONEY[cur], c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x * 2, y * 2, 2, 2); };
  const [kind, metal, mark] = m ? m.art : ['coin', 'gold', null];
  const disc = (r, cols, hole) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d > r) continue;
      if (hole && Math.abs(x - 7.5) < 1.6 && Math.abs(y - 7.5) < 1.6) continue;
      const edge = d > r - 1.1 || (hole && Math.abs(x - 7.5) < 2.6 && Math.abs(y - 7.5) < 2.6);
      px(x, y, edge ? cols[1] : (x + y < 12 && d > r - 2.6 ? cols[2] : cols[0]));
    }
  };
  if (kind === 'coin') {
    const cols = METAL[metal]; disc(7.4, cols);
    const gl = GLYPH[mark];
    if (gl) gl.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '1') px(x + 5, y + 5, cols[1]); }));
  } else if (kind === 'holed') {
    const cols = METAL[metal]; disc(mark === 'big' ? 7.6 : 6.8, cols, true);
    for (const [x, y] of [[7, 3], [8, 3], [7, 12], [8, 12], [3, 7], [3, 8], [12, 7], [12, 8]]) px(x, y, cols[1]);   // the four characters round the hole
  } else if (kind === 'lump') {   // silver cut from rings and bars, ready to weigh
    const cols = METAL.silver;
    for (const [cx, cy, r] of [[5.5, 9.5, 3.6], [10.5, 8.5, 3.2], [8, 5, 2.6]]) for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - cx, (y - cy) * 1.2); if (d <= r) px(x, y, d > r - 1 ? cols[1] : (x < cx && y < cy ? cols[2] : cols[0])); }
  } else if (kind === 'grain') {   // a little sack of grain, open at the top
    for (let y = 4; y < 15; y++) for (let x = 3; x < 13; x++) { const w = y < 6 ? 3 : 5 - (y > 12 ? 1 : 0); if (Math.abs(x - 7.5) <= w) px(x, y, Math.abs(x - 7.5) > w - 1 || y === 14 ? '#8a6a3a' : '#d8b878'); }
    for (const [x, y] of [[6, 3], [8, 2], [9, 3], [7, 2], [10, 4], [5, 4]]) px(x, y, '#e8c860');
    for (let x = 4; x < 12; x++) px(x, 6, '#6e5028');
  } else if (kind === 'bean') {   // a cacao bean
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot((x - 7.5) / 4.6, (y - 7.5) / 6.2); if (d <= 1) px(x, y, d > 0.8 ? '#3e2214' : (x < 7 && y < 7 ? '#a0603a' : '#7a4428')); }
    for (let y = 3; y < 13; y++) px(7 + (y > 9 ? 1 : y < 6 ? -1 : 0), y, '#3e2214');
  } else if (kind === 'bead') {   // a long etched carnelian bead
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot((x - 7.5) / 3.6, (y - 7.5) / 7); if (d <= 1) px(x, y, d > 0.82 ? '#7a2a14' : (x < 7 ? '#e8743a' : '#c8501e')); }
    for (const y of [5, 10]) for (let x = 5; x < 11; x++) px(x, y, '#f4ead8');
    px(7, 0, '#3a2a1a'); px(8, 0, '#3a2a1a'); px(7, 15, '#3a2a1a'); px(8, 15, '#3a2a1a');
  } else if (kind === 'rice') {   // a bowl heaped with rice
    for (let y = 9; y < 15; y++) for (let x = 1; x < 15; x++) { const w = 7 - (y - 9) * 0.9; if (Math.abs(x - 7.5) <= w) px(x, y, Math.abs(x - 7.5) > w - 1 || y === 14 ? '#5a3a20' : '#9a6a3a'); }
    for (let y = 4; y < 9; y++) for (let x = 2; x < 14; x++) { const w = 6 - (8 - y) * 1.1; if (Math.abs(x - 7.5) <= w) px(x, y, (x + y) % 3 ? '#fbf8ee' : '#e6e0cc'); }
  }
  const url = c.toDataURL();
  artCache.set(cur, url);
  return url;
}
export const coinImg = (cur, size = 20) => `<img class="coin" src="${coinArt(cur)}" width="${size}" height="${size}" alt="">`;

// ---------- a few small helpers ----------
function seeded(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x6d2b79f5 | 0; h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
const LOTS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---------- the game's side of it ----------
// `api` is how this talks to the rest of the game (see game.js, "money and markets").
export function createCommerce(api) {
  const { inv } = api;
  // Everything here is kept in the save as `money`.
  const S = { purse: {}, job: {}, jury: -1, stall: {}, invest: [], mkt: {}, mktHour: -1 };
  const day = () => Math.floor(api.clock() / 1440);
  const firstTime = (key, n, why) => { if (api.talked.has(key)) return; api.talked.add(key); if (n) api.stars(n, why); };

  // ----- the purse -----
  function has(cur) { return Math.max(0, Math.floor(S.purse[cur] || 0)); }
  function add(cur, n) { if (!MONEY[cur] || !(n > 0)) return; S.purse[cur] = has(cur) + Math.floor(n); api.save(); api.hud(); }
  function take(cur, n) { if (has(cur) < n) return false; S.purse[cur] = has(cur) - n; if (!S.purse[cur]) delete S.purse[cur]; api.save(); api.hud(); return true; }

  // ----- what's for sale, and for how much -----
  function mkt(city, id) {
    const row = (S.mkt[city] ??= {});
    return (row[id] ??= [1, 0, 1]);   // [the market's mood for it, the push from your own buying and selling, this morning's]
  }
  function unitValue(city, id) {
    let v = valueOf(id);
    const g = GOODS[city];
    if (g && g.sells.includes(id)) v *= 0.7; else if (g && g.wants.includes(id)) v *= 1.6;   // carry things from where they're made to where they're wanted, and you make a profit
    if (isFree(city)) { const [m, p] = mkt(city, id); v *= Math.min(2.2, Math.max(0.45, m * (1 + p))); }
    return v;
  }
  // A "lot" is how many you buy or sell at once: enough to cost at least one coin, so a florin buys a few loaves.
  function lot(city, id, unit, side) {
    const cur = MONEY[city], per = unit / cur.v;
    if (per <= 0) return null;
    const max = ITEM[id]?.max ?? 64;
    const n = LOTS.find((k) => k <= max && k * per >= 0.75) ?? null;
    if (!n) return null;
    const price = Math.max(1, Math.round(n * per));
    const tax = isFree(city) ? 0 : Math.round(price * (cur.tax || 0));
    return { id, n, price, tax, total: side === 'buy' ? price + tax : price - tax };
  }
  const buyLot = (city, id) => lot(city, id, unitValue(city, id) * 1.2, 'buy');
  const sellLot = (city, id) => lot(city, id, unitValue(city, id) * 0.7, 'sell');
  function trend(city, id) {
    if (!isFree(city)) return '';
    const [m, p, morning] = mkt(city, id), now = m * (1 + p);
    return now > morning * 1.04 ? 'up' : now < morning * 0.96 ? 'down' : '';
  }
  function push(city, id, k) { if (!isFree(city)) return; const r = mkt(city, id); r[1] = Math.max(-0.5, Math.min(0.8, r[1] + k)); }

  // ----- the people you trade with -----
  // Townspeople have a few things of their own to sell, and only so much money to spend each day.
  function stockOf(who) {
    const d = day();
    if (who.shop && who.shop.day === d) return who.shop;
    const city = who.city, rnd = seeded(`${who.name}:${city}:${d}`), g = GOODS[city] || { sells: [] };
    const job = String(who.trade || '').toLowerCase();
    let ids = [];
    if (who.kind === 'merchant') ids = [...g.sells];
    else {
      for (const [re, list] of JOB_GOODS) if (re.test(job)) ids.push(...list);
      if (/farm/.test(job)) ids.push(CROP[city] || 'wheat');
      const extra = g.sells.map((id) => [rnd(), id]).sort((a, b) => a[0] - b[0]).map((q) => q[1]).slice(0, ids.length ? 2 : 4);
      ids.push(...extra);
    }
    ids = [...new Set(ids)].filter((id) => ITEM[id] && valueOf(id) > 0).slice(0, who.kind === 'merchant' ? 12 : 8);
    const stock = {};
    for (const id of ids) stock[id] = who.kind === 'merchant' ? 6 + Math.floor(rnd() * 6) : 2 + Math.floor(rnd() * 4);
    who.shop = { day: d, stock, budget: who.kind === 'merchant' ? 900 : 50 + Math.floor(rnd() * 50) };   // (budget in obols)
    return who.shop;
  }
  const budgetIn = (who, city) => Math.floor(stockOf(who).budget / MONEY[city].v);

  // ----- the window: trading, the bank, your purse, your stall -----
  const view = { mode: null, who: null, swap: null, from: null, to: null, amt: 1, note: '' };
  function open(mode, who = null) { Object.assign(view, { mode, who, swap: null, note: '' }); api.open(); }
  function render(el) {
    if (view.mode === 'trade') renderTrade(el);
    else if (view.mode === 'bank') renderBank(el);
    else if (view.mode === 'stall') renderStall(el);
    else renderPurse(el);
    el.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act, b.dataset.arg, b.dataset.arg2)));
  }
  const head = (title, sub) => `<div class="phead"><h2>${esc(title)}</h2><button class="done" data-act="done">Done</button></div>${sub ? `<div class="shopsub">${sub}</div>` : ''}`;
  const priceTag = (city, p, dir) => `<span class="sprice">${coinImg(city, 18)}<b>${p}</b>${dir === 'up' ? '<i class="up" title="dearer than this morning">▲</i>' : dir === 'down' ? '<i class="down" title="cheaper than this morning">▼</i>' : ''}</span>`;
  const itemCell = (id, n) => `<span class="ri">${api.icon(id, 32)}${n > 1 ? `<span class="n">${n}</span>` : ''}</span>`;
  function rulesLine(city) {
    const m = MONEY[city];
    return m.free ? `Free market: prices here go up and down with what people buy and sell. No king takes a share.`
      : `${cap(m.ruler)} sets the prices here. Tax on every sale: ${m.tax >= 0.099 ? '1 coin in 10' : m.tax >= 0.049 ? '1 coin in 20' : '1 coin in 30'}.`;
  }
  function renderTrade(el) {
    const who = view.who, city = who.city, m = MONEY[city], shop = stockOf(who);
    const title = who.kind === 'merchant' ? who.title : cap(String(who.trade || 'townsperson'));
    let html = head(`Trading with ${who.name}`, `${esc(title)} · ${esc(api.cityName(city))} · ${esc(rulesLine(city))}`);
    html += `<div class="purseline">${coinImg(city, 22)}<span>You have <b>${fmt(city, has(city))}</b>. ${esc(who.name)} has <b>${fmt(city, budgetIn(who, city))}</b> to spend today.</span></div>`;
    if (view.note) html += `<div class="shopnote">${view.note}</div>`;
    html += '<div class="shopcols"><section><h3>Buy</h3>';
    const ids = Object.keys(shop.stock);
    if (!ids.length) html += '<p class="empty">Nothing for sale today.</p>';
    for (const id of ids) {
      const L = buyLot(city, id); if (!L) continue;
      const left = shop.stock[id], can = left > 0 && has(city) >= L.total;
      const tag = GOODS[city]?.sells.includes(id) ? 'made here' : GOODS[city]?.wants.includes(id) ? 'from far away' : '';
      html += `<div class="srow${view.swap === id ? ' on' : ''}">${itemCell(id, L.n)}<span class="sname">${esc(ITEM[id].name)}${L.n > 1 ? ` ×${L.n}` : ''}<small>${left > 0 ? `${left} left${tag ? ' · ' + tag : ''}` : 'sold out'}${L.tax ? ` · ${L.price} + ${L.tax} tax` : ''}</small></span>${priceTag(city, L.total, trend(city, id))}`
        + `<button class="sbtn" data-act="buy" data-arg="${id}" ${can ? '' : 'disabled'}>Buy</button><button class="sbtn alt" data-act="swap" data-arg="${id}" ${left > 0 ? '' : 'disabled'}>Swap</button></div>`;
    }
    html += '</section><section><h3>Sell</h3>';
    const mine = [...new Set(inv.slots.filter(Boolean).map((s) => s.id))].filter((id) => valueOf(id) > 0);
    if (!mine.length) html += '<p class="empty">You have nothing to sell.</p>';
    const budget = budgetIn(who, city);
    const rows = mine.map((id) => [id, sellLot(city, id)]).filter(([, L]) => L).sort((a, b) => b[1].total / b[1].n - a[1].total / a[1].n);
    for (const [id, L] of rows) {
      const have = inv.count(id), can = have >= L.n && L.total <= budget && L.total > 0;
      html += `<div class="srow">${itemCell(id, L.n)}<span class="sname">${esc(ITEM[id].name)}${L.n > 1 ? ` ×${L.n}` : ''}<small>you have ${have}${have < L.n ? ` · need ${L.n}` : ''}${L.tax ? ` · ${L.price} − ${L.tax} tax` : ''}${L.total > budget ? ` · too dear for ${esc(who.name)}` : ''}</small></span>${priceTag(city, L.total, trend(city, id))}`
        + `<button class="sbtn" data-act="sell" data-arg="${id}" ${can ? '' : 'disabled'}>Sell</button></div>`;
    }
    html += '</section></div>';
    if (view.swap) html += swapBox(who, city, view.swap);
    html += `<p class="shophint">Swap means barter: goods for goods, no coins and no tax. People traded like that for thousands of years before money.</p>`;
    el.innerHTML = html;
  }
  // Barter: what of yours they'd take, and how many, for one lot of theirs.
  function swapOffers(city, id) {
    const L = buyLot(city, id); if (!L) return [];
    const want = L.n * unitValue(city, id) * 1.1;
    const mine = [...new Set(inv.slots.filter(Boolean).map((s) => s.id))].filter((x) => x !== id && valueOf(x) > 0 && !(ITEM[x].relic && !ITEM[x].worth));
    const out = [];
    for (const x of mine) {
      const each = unitValue(city, x) * 0.9;
      const k = Math.max(1, Math.ceil(want / each));
      if (k > 64) continue;
      out.push({ id: x, k, have: inv.count(x), over: k * each / want });
    }
    return out.sort((a, b) => (b.have >= b.k) - (a.have >= a.k) || a.over - b.over).slice(0, 8);
  }
  function swapBox(who, city, id) {
    const L = buyLot(city, id), offers = swapOffers(city, id);
    let html = `<div class="swapbox"><h3>Swap for ${esc(ITEM[id].name)}${L.n > 1 ? ` ×${L.n}` : ''}: what will you give?</h3>`;
    if (!offers.length) html += '<p class="empty">You have nothing they want for that.</p>';
    for (const o of offers) html += `<div class="srow">${itemCell(o.id, o.k)}<span class="sname">Give ${o.k} ${esc(ITEM[o.id].name)}<small>you have ${o.have}</small></span><button class="sbtn" data-act="barter" data-arg="${id}" data-arg2="${o.id}" ${o.have >= o.k ? '' : 'disabled'}>Swap</button></div>`;
    return html + '<button class="sbtn alt" data-act="swap" data-arg="">Never mind</button></div>';
  }
  function act(a, arg, arg2) {
    const who = view.who, city = who && who.city;
    if (a === 'done') { api.close(); return; }
    if (a === 'buy') {
      const shop = stockOf(who), L = buyLot(city, arg);
      if (!L || shop.stock[arg] <= 0) return;
      if (!take(city, L.total)) { view.note = `You need ${fmt(city, L.total)}. Sell something, work for ${MONEY[city].ruler}, or change money at the World Bank.`; return api.refresh(); }
      shop.stock[arg]--; shop.budget += L.price * MONEY[city].v;
      api.receive(arg, L.n); push(city, arg, 0.05);
      api.sound('pickup');
      view.note = `You bought ${L.n > 1 ? L.n + ' ' : ''}${esc(ITEM[arg].name)} for ${fmt(city, L.total)}${L.tax ? ` (${fmt(city, L.tax)} of it went to ${esc(MONEY[city].ruler)})` : ''}.`;
      firstTime('money:trade', 1, `Your first purchase with ${MONEY[city].units}!`);
    } else if (a === 'sell') {
      const shop = stockOf(who), L = sellLot(city, arg);
      if (!L || inv.count(arg) < L.n || L.total > budgetIn(who, city)) return;
      inv.remove(arg, L.n); add(city, L.total); shop.budget -= L.price * MONEY[city].v; push(city, arg, -0.05);
      api.hotbar(); api.sound('coin');
      view.note = `${esc(who.name)} paid you ${fmt(city, L.total)} for ${L.n > 1 ? L.n + ' ' : ''}${esc(ITEM[arg].name)}${L.tax ? `. The tax collector took ${fmt(city, L.tax)}` : ''}.`;
      firstTime('money:sold', 1, `You earned your first ${MONEY[city].units}!`);
    } else if (a === 'swap') { view.swap = arg || null; }
    else if (a === 'barter') {
      const shop = stockOf(who), o = swapOffers(city, arg).find((q) => q.id === arg2), L = buyLot(city, arg);
      if (!o || !L || inv.count(arg2) < o.k || shop.stock[arg] <= 0) return;
      inv.remove(arg2, o.k); shop.stock[arg]--; api.receive(arg, L.n); api.hotbar(); api.sound('pickup');
      view.swap = null;
      view.note = `A fair swap: ${o.k} ${esc(ITEM[arg2].name)} for ${L.n > 1 ? L.n + ' ' : ''}${esc(ITEM[arg].name)}.`;
      firstTime('money:barter', 1, 'You bartered, the oldest way of trading there is!');
    } else if (a === 'from') { view.from = arg; view.amt = Math.min(Math.max(1, view.amt), Math.max(1, has(arg))); }
    else if (a === 'to') { view.to = arg; }
    else if (a === 'amt') { const max = has(view.from); view.amt = arg === 'all' ? max : Math.max(1, Math.min(max, view.amt + Number(arg))); }
    else if (a === 'change') { exchange(); }
    else if (a === 'treasure') { sellTreasure(arg); }
    else if (a === 'stallput') { stallPut(arg, arg2); }
    else if (a === 'stallback') { stallBack(arg); }
    else if (a === 'stallmode') { const st = S.stall[view.city]; const row = st && st.items.find((r) => r.id === arg); if (row) row.mode = arg2; api.save(); }
    else if (a === 'stalltill') { stallTill(); }
    else if (a === 'stallbuy') { stallBuy(); }
    else if (a === 'bank') { open('bank'); return; }
    api.refresh();
  }

  // ----- the World Bank -----
  const FEE = 0.05;
  function quote(from, to, n) {
    const value = n * MONEY[from].v, get = Math.floor(value * (1 - FEE) / MONEY[to].v + 1e-9);
    return { get, fee: Math.max(0, Math.round(value / MONEY[to].v) - get) };
  }
  function rate(from, to) {
    const r = MONEY[from].v / MONEY[to].v;
    return r >= 1 ? `1 ${MONEY[from].unit} = ${r >= 10 ? Math.round(r) : Math.round(r * 10) / 10} ${MONEY[to].units}` : `${1 / r >= 10 ? Math.round(1 / r) : Math.round(10 / r) / 10} ${MONEY[from].units} = 1 ${MONEY[to].unit}`;
  }
  function exchange() {
    const { from, to } = view, n = Math.min(view.amt, has(from));
    if (!from || !to || from === to || n < 1) return;
    const q = quote(from, to, n);
    if (q.get < 1) { view.note = `That isn't enough to make even one ${MONEY[to].unit}. ${rate(from, to)}.`; return; }
    take(from, n); add(to, q.get); api.sound('coin');
    view.note = `You gave ${fmt(from, n)} and got <b>${fmt(to, q.get)}</b>. The bank kept a little for its trouble.`;
    view.amt = Math.max(1, Math.min(view.amt, has(from)));
    firstTime('money:bank', 1, 'You changed money at the World Bank!');
  }
  function sellTreasure(id) {
    const to = view.to || CITIES.find((c) => has(c) > 0) || 'babylon', v = valueOf(id);
    if (!inv.count(id) || !v) return;
    const get = Math.floor(v / MONEY[to].v);
    if (get < 1) { view.note = `Choose a money worth less than a ${MONEY[to].unit} to sell that.`; return; }
    inv.remove(id, 1); add(to, get); api.hotbar(); api.sound('coin');
    view.note = `The bank bought your ${esc(ITEM[id].name)} for <b>${fmt(to, get)}</b>.`;
  }
  function renderBank(el) {
    const held = CITIES.filter((c) => has(c) > 0);
    if (!view.from || !has(view.from)) view.from = held[0] || null;
    if (!view.to || view.to === view.from) view.to = CITIES.find((c) => c !== view.from && c === api.lastCity()) || CITIES.find((c) => c !== view.from);
    let html = head('The World Bank', 'Change any money in the world for any other. The bank keeps 1 coin in 20.');
    if (view.note) html += `<div class="shopnote">${view.note}</div>`;
    html += '<div class="bankcols"><section><h3>Your money</h3>';
    if (!held.length) html += '<p class="empty">Your purse is empty. Sell something in a city\'s market, or work for its ruler, then come back. The bank will also buy gold, gems and treasure from you (below).</p>';
    for (const c of held) html += `<button class="cur${view.from === c ? ' on' : ''}" data-act="from" data-arg="${c}">${coinImg(c, 22)}<span><b>${fmt(c, has(c))}</b><small>${esc(api.cityName(c))}</small></span></button>`;
    html += '</section><section><h3>Change it into</h3><div class="curgrid">';
    for (const c of CITIES) if (c !== view.from) html += `<button class="cur small${view.to === c ? ' on' : ''}" data-act="to" data-arg="${c}" title="${esc(MONEY[c].units)} (${esc(api.cityName(c))})">${coinImg(c, 20)}<span>${esc(api.cityName(c))}<small>${esc(MONEY[c].units)}</small></span></button>`;
    html += '</div></section></div>';
    if (view.from && view.to) {
      const n = Math.min(view.amt, has(view.from)), q = quote(view.from, view.to, n);
      html += `<div class="changebar"><span class="rate">${esc(rate(view.from, view.to))}</span><span class="stepper"><button class="sbtn alt" data-act="amt" data-arg="-10">−10</button><button class="sbtn alt" data-act="amt" data-arg="-1">−1</button><b>${fmt(view.from, n)}</b><button class="sbtn alt" data-act="amt" data-arg="1">+1</button><button class="sbtn alt" data-act="amt" data-arg="10">+10</button><button class="sbtn alt" data-act="amt" data-arg="all">All</button></span>`
        + `<span class="get">→ ${coinImg(view.to, 20)} <b>${fmt(view.to, q.get)}</b></span><button class="sbtn go" data-act="change" ${q.get >= 1 ? '' : 'disabled'}>Change</button></div>`;
    }
    const treasure = TREASURE.filter((id) => inv.count(id) > 0);
    html += `<h3>Sell gold, gems and treasure${view.to ? ` for ${esc(MONEY[view.to].units)}` : ''}</h3>`;
    if (!treasure.length) html += '<p class="empty">You have no gold, gems or treasure with you.</p>';
    for (const id of treasure) {
      const get = view.to ? Math.floor(valueOf(id) / MONEY[view.to].v) : 0;
      html += `<div class="srow">${itemCell(id, 1)}<span class="sname">${esc(ITEM[id].name)}<small>you have ${inv.count(id)}</small></span>${view.to ? priceTag(view.to, get, '') : ''}<button class="sbtn" data-act="treasure" data-arg="${id}" ${get >= 1 ? '' : 'disabled'}>Sell</button></div>`;
    }
    el.innerHTML = html;
  }

  // ----- your purse -----
  function renderPurse(el) {
    const held = CITIES.filter((c) => has(c) > 0);
    let html = head('Your purse', 'Every city has its own money. Change one for another at the World Bank, in the middle of the map.');
    if (!held.length) html += '<p class="empty">No money yet! Sell things to the people in any city, or ask the ruler\'s clerk there for paid work. The World Bank, south of Babylon, also buys gold and gems.</p>';
    for (const c of held) html += `<div class="prow">${coinImg(c, 32)}<span><b>${fmt(c, has(c))}</b><small>${esc(api.cityName(c))} · ${esc(MONEY[c].about)}</small></span></div>`;
    const stalls = Object.entries(S.stall).filter(([, st]) => st.owned);
    if (stalls.length) {
      html += '<h3>Your market stalls</h3>';
      for (const [c, st] of stalls) html += `<div class="prow">${coinImg(c, 24)}<span><b>${esc(api.cityName(c))}</b><small>${st.items.length ? st.items.map((r) => `${r.n} ${esc(ITEM[r.id].name)}`).join(', ') : 'nothing on it'} · ${fmt(c, st.till)} waiting in the till</small></span></div>`;
    }
    if (S.invest.length) {
      html += '<h3>Your money at sea and in business</h3>';
      for (const iv of S.invest) {
        const left = Math.max(0, iv.due - api.clock()), h = Math.ceil(left / 60);
        html += `<div class="prow">${coinImg(iv.city, 24)}<span><b>${fmt(iv.city, iv.n)} in ${esc(MONEY[iv.city].invest.what)}</b><small>${esc(api.cityName(iv.city))} · news in about ${h} hour${h === 1 ? '' : 's'} of game time</small></span></div>`;
      }
    }
    el.innerHTML = html;
  }

  // ----- a market stall of your own (Athens, Carthage, Florence) -----
  const STALL_COST = 120;   // obols
  const MODES = { cheap: ['Cheap', 0.9, 0.55], fair: ['Fair', 1.15, 0.32], dear: ['Dear', 1.5, 0.13] };
  const stallPrice = (city, id, mode) => unitValue(city, id) * MODES[mode][1];
  function stallBuy() {
    const city = view.city, cost = Math.max(1, Math.round(STALL_COST / MONEY[city].v));
    if (!take(city, cost)) { view.note = `A stall costs ${fmt(city, cost)}. You have ${fmt(city, has(city))}.`; return; }
    S.stall[city] = { owned: true, items: [], till: 0, acc: 0 };
    view.note = 'The stall is yours! Put things on it, choose a price, and people will buy them, even while you\'re away.';
    firstTime('money:stall', 1, 'You own a market stall!');
    stallChanged(city);
  }
  const stallChanged = (city) => { if (api.stallChanged) api.stallChanged(city); };
  function stallPut(id, all) {
    const st = S.stall[view.city]; if (!st) return;
    const n = all === 'all' ? inv.count(id) : Math.min(inv.count(id), Math.max(1, sellLot(view.city, id)?.n || 1));
    if (n < 1) return;
    let row = st.items.find((r) => r.id === id);
    if (!row) { if (st.items.length >= 6) { view.note = 'Your stall only has room for 6 different things.'; return; } row = { id, n: 0, mode: 'fair' }; st.items.push(row); }
    inv.remove(id, n); row.n += n; api.hotbar(); api.save(); stallChanged(view.city);
  }
  function stallBack(id) {
    const st = S.stall[view.city], row = st && st.items.find((r) => r.id === id);
    if (!row) return;
    api.receive(id, row.n); st.items = st.items.filter((r) => r !== row); api.save(); stallChanged(view.city);
  }
  function stallTill() {
    const st = S.stall[view.city]; if (!st || !st.till) return;
    add(view.city, st.till); view.note = `You took ${fmt(view.city, st.till)} out of the till.`; st.till = 0; api.sound('coin');
  }
  function renderStall(el) {
    const city = view.city, st = S.stall[city], m = MONEY[city];
    let html = head(`Your stall in ${api.cityName(city)}`, 'Set your own prices: cheap things sell fast, dear things sell slowly but earn more. It sells while you\'re away.');
    if (view.note) html += `<div class="shopnote">${view.note}</div>`;
    if (!st || !st.owned) {
      const cost = Math.max(1, Math.round(STALL_COST / m.v));
      html += `<p class="empty">A stall in the market costs ${fmt(city, cost)}, and it's yours for good. You have ${fmt(city, has(city))}.</p><button class="sbtn go" data-act="stallbuy" ${has(city) >= cost ? '' : 'disabled'}>Buy a stall for ${fmt(city, cost)}</button>`;
      el.innerHTML = html; return;
    }
    html += `<div class="purseline">${coinImg(city, 22)}<span>In the till: <b>${fmt(city, st.till)}</b></span><button class="sbtn go" data-act="stalltill" ${st.till ? '' : 'disabled'}>Take the money</button></div>`;
    html += '<div class="shopcols"><section><h3>On your stall</h3>';
    if (!st.items.length) html += '<p class="empty">Nothing yet. Put something out from your bag!</p>';
    for (const r of st.items) {
      const L = sellLot(city, r.id), each = Math.max(1, Math.round(stallPrice(city, r.id, r.mode) * (L?.n || 1) / m.v));
      html += `<div class="srow">${itemCell(r.id, r.n)}<span class="sname">${esc(ITEM[r.id].name)}<small>${L && L.n > 1 ? `${L.n} for ` : ''}${fmt(city, each)}</small><span class="modes">${Object.entries(MODES).map(([k, [lbl]]) => `<button class="chip${r.mode === k ? ' on' : ''}" data-act="stallmode" data-arg="${r.id}" data-arg2="${k}">${lbl}</button>`).join('')}</span></span><button class="sbtn alt" data-act="stallback" data-arg="${r.id}">Take back</button></div>`;
    }
    html += '</section><section><h3>From your bag</h3>';
    const mine = [...new Set(inv.slots.filter(Boolean).map((s) => s.id))].filter((id) => valueOf(id) > 0 && !(ITEM[id].relic && !ITEM[id].worth));
    for (const id of mine) html += `<div class="srow">${itemCell(id, inv.count(id))}<span class="sname">${esc(ITEM[id].name)}</span><button class="sbtn" data-act="stallput" data-arg="${id}" data-arg2="one">Put some</button><button class="sbtn alt" data-act="stallput" data-arg="${id}" data-arg2="all">All</button></div>`;
    html += '</section></div>';
    el.innerHTML = html;
  }
  function openStall(city) { view.city = city; open('stall', { city, name: 'stall' }); }

  // ----- the world ticking over: prices, your stalls, your voyages -----
  let stallT = 0;
  function tick(dt) {
    const hour = Math.floor(api.clock() / 60);
    if (hour !== S.mktHour) {
      const newDay = S.mktHour >= 0 && Math.floor(hour / 24) !== Math.floor(S.mktHour / 24);
      S.mktHour = hour;
      // Every hour of game time the free markets' prices wander: a ship comes in, a harvest fails, a fashion starts.
      for (const city of CITIES) {
        if (!isFree(city)) continue;
        for (const id of [...GOODS[city].sells, ...GOODS[city].wants]) {
          const r = mkt(city, id), rnd = seeded(`${city}:${id}:${hour}`)();
          r[0] = Math.min(1.8, Math.max(0.55, r[0] * Math.exp((rnd - 0.5) * 0.22) + (1 - r[0]) * 0.06));
          r[1] *= 0.85;
          if (newDay) r[2] = r[0] * (1 + r[1]);
        }
      }
    }
    // Your stalls sell a little at a time, whether you're there or not.
    stallT += dt;
    if (stallT >= 10) {
      stallT = 0;
      for (const [city, st] of Object.entries(S.stall)) {
        if (!st.owned) continue;
        for (const r of st.items) {
          if (r.n <= 0) continue;
          if (Math.random() > MODES[r.mode][2]) continue;
          const L = sellLot(city, r.id), k = Math.min(r.n, L?.n || 1);
          r.n -= k; st.acc += stallPrice(city, r.id, r.mode) * k;
          const coins = Math.floor(st.acc / MONEY[city].v);
          if (coins) { st.till += coins; st.acc -= coins * MONEY[city].v; }
          if (api.here() === city) api.toast(`Your stall sold ${k} ${ITEM[r.id].name}!`, r.id);
        }
        const was = st.items.length;
        st.items = st.items.filter((r) => r.n > 0);
        if (st.items.length !== was) stallChanged(city);
      }
      api.save();
    }
    // Voyages and partnerships come to an end.
    for (const iv of [...S.invest]) {
      if (api.clock() < iv.due) continue;
      S.invest.splice(S.invest.indexOf(iv), 1);
      const inv2 = MONEY[iv.city].invest;
      if (iv.ok) { const back = Math.round(iv.n * (1 + inv2.gain)); add(iv.city, back); api.card(`News from ${api.cityName(iv.city)}!`, `Your ${inv2.kind}`, `${inv2.won} ${fmt(iv.city, back)} (you put in ${fmt(iv.city, iv.n)}).`); api.sound('star'); }
      else api.card(`News from ${api.cityName(iv.city)}`, `Your ${inv2.kind}`, inv2.lost);
      api.save();
    }
  }

  // ----- talking: the ruler's clerk, the market trader, the bankers -----
  function clerkTalk(who, page = 'start') {
    const city = who.city, m = MONEY[city], go = (p) => () => clerkTalk(who, p), bye = ['Goodbye', () => api.closeDialogue(who)];
    const show = (text, choices) => api.dialogue(who.name, who.title, text, choices);
    const d = day(), jobs = WORK[city], job = jobs[d % jobs.length], [want, ask, fact] = job;
    const value = want.reduce((s, [id, n]) => s + valueOf(id) * n, 0), pay = Math.max(1, Math.round(Math.max(36, value * 1.6) / m.v));
    const done = S.job[city] === d, have = want.every(([id, n]) => inv.count(id) >= n);
    const menu = [];
    if (!done) menu.push(['Is there any work for me?', go('job')]);
    if (city === 'athens' && S.jury !== d) menu.push(['Can I serve on a jury today?', go('jury')]);
    menu.push(['Who rules here?', go('rule')], ['Tell me about the money here', go('money')], bye);
    if (page === 'start') show(`Greetings! I'm ${who.name}, ${who.title.toLowerCase()}. ${m.free ? `There's no king here: ${m.rulerName} run${city === 'florence' ? 's' : ''} the city, and the city pays well for work done for it.` : `I pay people for work done for ${m.rulerName}.`}${done ? ' Your work for today is done. Come back tomorrow!' : ''}`, menu);
    else if (page === 'job') {
      if (done) { show('That\'s all for today. Come back tomorrow for more work!', [bye]); return; }
      const need = have ? 'You have everything!' : want.map(([id, n]) => `${ITEM[id].name}: you have ${inv.count(id)} of the ${n} needed.`).join(' ');
      show(`${ask} ${m.free ? 'The city' : cap(m.ruler)} will pay you ${fmt(city, pay)}. ${need}`, have ? [[`Here they are! (get ${fmt(city, pay)})`, go('paid')], ['Not now', go('start')], bye] : [['I\'ll come back with them', go('start')], bye]);
    } else if (page === 'paid') {
      if (done || !have) { clerkTalk(who, 'job'); return; }
      for (const [id, n] of want) inv.remove(id, n);
      S.job[city] = d; add(city, pay); api.hotbar(); api.sound('coin');
      firstTime('money:job:' + city, 1, `You worked for ${m.free ? 'the city of ' + api.cityName(city) : m.ruler + ' of ' + api.cityName(city)}!`);
      show(`Thank you! Here's your pay: ${fmt(city, pay)}. ${fact}`, [['Thank you!', go('start')], bye]);
    } else if (page === 'jury') {
      if (S.jury === d) { show('You\'ve already served on a jury today. Come back tomorrow!', [bye]); return; }
      const [tell, opts] = JURY[d % JURY.length];
      show(`Today's case: ${tell} How do you vote?`, [[opts[0], go('vote0')], [opts[1], go('vote1')]]);
    } else if (page === 'vote0' || page === 'vote1') {
      if (S.jury === d) { clerkTalk(who, 'start'); return; }
      const [, , fact] = JURY[d % JURY.length], first = 60 + Math.floor(seeded(`jury:${d}`)() * 81), mine = page === 'vote0' ? first : 201 - first;
      S.jury = d; add('athens', 1); api.sound('coin');
      firstTime('money:jury', 1, 'You served on an Athenian jury!');
      show(`The jurors drop their votes into two urns… ${mine} of the 201 voted the same way as you. ${mine > 100 ? 'Your side wins!' : 'Most voted the other way this time — that\'s democracy!'} ${fact} Here's your pay: a drachma. (Under Pericles, jurors got 2 obols a day, a third of a drachma.)`, [['Thank you!', go('start')], bye]);
    } else if (page === 'rule') show(m.free ? ({ athens: 'Athens is a democracy: every citizen can speak and vote in the Assembly, up on the Pnyx hill. Many jobs in the city are given out by lot, so ordinary people take turns running things.', carthage: 'Carthage is a republic. Every year we elect two leaders called suffetes, and a Council of Elders advises them. Even the Greek thinker Aristotle praised how Carthage was run.', florence: 'Florence is a republic. A Great Council of more than three thousand citizens makes the laws, and in 1502 it chose a leader for life, the Gonfaloniere Piero Soderini.' }[city]) : `${cap(m.rulerName)}. ${m.taxNote}`, [['Is there any work for me?', go('job')], bye]);
    else if (page === 'money') show(m.about, [['Is there any work for me?', go('job')], bye]);
  }
  function merchantTalk(who, page = 'start') {
    const city = who.city, m = MONEY[city], go = (p) => () => merchantTalk(who, p), bye = ['Goodbye', () => api.closeDialogue(who)];
    const show = (text, choices) => api.dialogue(who.name, who.title, text, choices);
    const menu = [['Let\'s trade', () => { api.closeDialogue(who); open('trade', who); }]];
    if (m.free) menu.push([S.stall[city]?.owned ? 'My market stall' : 'Can I have a market stall?', () => { api.closeDialogue(who); openStall(city); }], [`Invest in ${m.invest.what.split(' ').slice(0, 3).join(' ')}…`, go('invest')]);
    menu.push(['How do prices work here?', go('prices')], bye);
    if (page === 'start') show(`Welcome to my stall! Everything here is priced in ${m.units}. You have ${fmt(city, has(city))}.`, menu);
    else if (page === 'prices') show(m.free ? `${cap(api.cityName(city))} is free: nobody sets the prices but the buyers and sellers. When lots of people want something its price goes up; when there's plenty, it comes down. Watch the arrows! Buy cheap, sell dear.` : `${cap(m.ruler)} decides the prices here, and they don't change. ${m.taxNote}`, menu);
    else if (page === 'invest') {
      const iv = m.invest, mine = S.invest.filter((q) => q.city === city).length;
      if (mine >= 3) { show('You already have three ventures under way here. Wait and see how they turn out first!', [bye]); return; }
      const opts = [10, 25, 50, 100].map((k) => Math.max(1, Math.round(k * 6 / m.v))).filter((k, i, a) => a.indexOf(k) === i && k <= has(city));
      show(`${iv.how} Would you like to put money into ${iv.what}?${opts.length ? '' : ` You'll need some ${m.units} first.`}`, [...opts.map((k) => [`Invest ${fmt(city, k)}`, go('inv:' + k)]), ['Not now', go('start')]]);
    } else if (page.startsWith('inv:')) {
      const n = Number(page.slice(4)), iv = m.invest;
      if (!take(city, n)) { merchantTalk(who, 'invest'); return; }
      S.invest.push({ city, n, due: api.clock() + iv.days * 1440, ok: Math.random() < iv.win });
      api.save();
      firstTime('money:invest', 1, 'You made your first investment!');
      show(`Done! Your ${fmt(city, n)} goes into ${iv.what}. You'll hear how it went in about ${iv.days === 1 ? 'a day' : iv.days + ' days'} of game time. Remember: you might get more back — or nothing at all.`, [['Good luck to the ship!', go('start')], bye]);
    }
  }
  function changerTalk(who, page = 'start') {
    const bye = ['Goodbye', () => api.closeDialogue(who)], go = (p) => () => changerTalk(who, p);
    const change = ['Change money', () => { api.closeDialogue(who); open('bank'); }];
    if (page === 'start') api.dialogue(who.name, who.title, `Welcome! I'll change any money in the world for you. ${who.fact}`, [change, bye]);
  }
  function nabuTalk(who, page = 'start') {
    const bye = ['Goodbye', () => api.closeDialogue(who)], go = (p) => () => nabuTalk(who, p);
    const change = ['Change money', () => { api.closeDialogue(who); open('bank'); }];
    const menu = [change, ['Who are you?', go('egibi')], ['What is interest?', go('interest')], ['Why is money different everywhere?', go('why')], ['How does the bank work?', go('how')], bye];
    const show = (text, choices) => api.dialogue(who.name, who.title, text, choices);
    if (page === 'start') {
      if (!api.talked.has('money:gift')) {
        api.talked.add('money:gift'); add('babylon', 5); api.sound('coin');
        show(`${NABU.start} And here's something to start you off: 5 shekels of silver, the money of Babylon. Spend them there, or change them here for any money you like!`, menu);
      } else show(NABU.start, menu);
    } else {
      if (page === 'egibi') firstTime('worldBank', 1, 'Nabu told you about the first bankers!');
      show(NABU[page], [['Ask something else', go('start')], change, bye]);
    }
  }

  // ----- money from a friend (playing together) -----
  function gift(cur, n, from) { if (!MONEY[cur] || !(n > 0)) return; add(cur, n); api.sound('coin'); api.toast(`${from} gave you ${fmt(cur, n)}!`); }

  return {
    S, has, add, take, fmt, open, render, tick, clerkTalk, merchantTalk, changerTalk, nabuTalk, gift, openStall, valueOf,
    view: () => view.mode,
    load(m) {
      if (!m || typeof m !== 'object') return;
      for (const [c, n] of Object.entries(m.purse || {})) if (MONEY[c] && Number.isFinite(n) && n > 0) S.purse[c] = Math.floor(n);
      for (const [c, d] of Object.entries(m.job || {})) if (MONEY[c] && Number.isInteger(d)) S.job[c] = d;
      if (Number.isInteger(m.jury)) S.jury = m.jury;
      for (const [c, st] of Object.entries(m.stall || {})) if (isFree(c) && st && st.owned) S.stall[c] = { owned: true, till: Math.max(0, Math.floor(st.till || 0)), acc: Number(st.acc) || 0, items: (st.items || []).filter((r) => r && ITEM[r.id] && r.n > 0 && MODES[r.mode]).slice(0, 6) };
      for (const iv of m.invest || []) if (iv && isFree(iv.city) && iv.n > 0 && Number.isFinite(iv.due)) S.invest.push({ city: iv.city, n: Math.floor(iv.n), due: iv.due, ok: !!iv.ok });
      for (const [c, row] of Object.entries(m.mkt || {})) if (isFree(c) && row) for (const [id, r] of Object.entries(row)) if (ITEM[id] && Array.isArray(r) && r.every(Number.isFinite)) (S.mkt[c] ??= {})[id] = r.slice(0, 3);
      if (Number.isInteger(m.mktHour)) S.mktHour = m.mktHour;
    },
    state() { return S; },
  };
}
