// Polis World (computer version): refugees and your village.
// Now and then a family that has lost its home (to a flood, a war or a bad harvest) walks up to your camp and asks to
// stay. You choose the work each newcomer will do; they set up near your camp, work there all day, and every morning
// they bring you something they've made.

// Jobs you can give, what each needs to work, and what they bring you each morning.
export const ROLES = {
  farmer: { title: 'Farmer', prop: 'maize', tool: 'hoe', anim: 'dig', gift: [['wheat', 3], ['wheatSeeds', 1]],
    say: 'I\'ll plough and plant the fields. Most people in the ancient world were farmers, about nine in every ten!' },
  baker: { title: 'Baker', prop: 'oven', anim: 'knead', gift: [['bread', 2]], say: 'I\'ll bake bread for everyone. A good baker can feed a whole street.' },
  brickmaker: { title: 'Brick maker', prop: 'bricks', anim: 'knead', gift: [['brick', 3]], say: 'Mud, straw and a wooden mould: I\'ll make bricks so you can build more houses.' },
  shepherd: { title: 'Shepherd', prop: 'trough', tool: 'rod', anim: 'fish', gift: [['wool', 2]], say: 'I\'ll watch your sheep and shear them. Wool keeps everyone warm in winter.' },
  smith: { title: 'Smith', prop: 'anvil', tool: 'hammer', anim: 'hammer', gift: [['bronzeIngot', 1]], say: 'Give me a hot fire and I\'ll make tools and metal for the village.' },
  potter: { title: 'Potter', prop: 'wheel', anim: 'knead', gift: [['lamp', 1], ['clay', 2]], say: 'I\'ll make pots for storing grain and oil, and lamps for the long nights.' },
  weaver: { title: 'Weaver', prop: 'loom', anim: 'weave', gift: [['redCloth', 1]], say: 'Give me wool and a loom and I\'ll weave cloth for clothes and blankets.' },
};
export const REFUGEE_NAMES = ['Ama', 'Bion', 'Daria', 'Eshe', 'Gaius', 'Hesper', 'Ishara', 'Jun', 'Kiya', 'Leon', 'Mira', 'Nabu', 'Priya', 'Rhea', 'Sami', 'Talia', 'Omid', 'Lin', 'Tahu', 'Zara'];
export const WHY = [
  'The river flooded and washed our village away.',
  'Soldiers burned our farm in the war, and we had to run.',
  'The rains didn\'t come for three years, and nothing would grow.',
  'A great fire burned our town.',
  'Raiders took our animals and our grain.',
];
// How refugees looked: plain travel clothes, a bundle on the back.
export const LOOKS = [[0xdcae86, 0x8a7a5a, 0x5a4632], [0xa87850, 0x6a7a5a, 0x4a3a2a], [0x8c5e3d, 0x9a8a6a, 0x5a4a3a], [0xc69772, 0x7a6a8a, 0x4a3a2a], [0x6b4430, 0xa8946a, 0x5a4632]];
