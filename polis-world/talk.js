// Polis World (computer version): what the townspeople of each great city can tell you.
// Every fact here is meant to be true to what historians and archaeologists know about that city at the time shown in the
// game (Rome around 100 CE, Athens around 430 BCE, and so on). Where nobody knows for sure, the townsperson says so.
// Each person starts at a different fact, so two people with the same job tell you different things.

export const TALK = {
  rome: {
    hello: ['Salve! (That means "hello" in Latin.)', 'Salve, traveller!', 'Ave! Welcome to Rome, the biggest city in the world.'],
    jobs: {
      baker: [
        'I bake bread in a big stone oven. Rome gives free grain to its poorer citizens, so bakers are always busy.',
        'A donkey walks round and round turning my millstones, grinding wheat into flour. The bakeries in Pompeii had mills just like mine.',
        'Bakers stamp their loaves with their name. Archaeologists found a whole round loaf in Pompeii, burnt black by the volcano, still cut into eight slices!',
      ],
      potter: [
        'I make amphorae, tall jars for wine, olive oil and fish sauce. Ships carry them all over the empire.',
        'By the river there is a whole hill, Monte Testaccio, made of broken oil jars that were thrown away. Tens of millions of them!',
        'Rich families eat off shiny red pottery called terra sigillata. Potters stamp their names on the bottom, like a brand.',
      ],
      stonemason: [
        'I cut stone for roads and aqueducts. Romans invented a concrete so strong that some of it still stands today.',
        'We build roads in layers: big stones at the bottom, then gravel, then tight-fitting paving stones on top. Some Roman roads are still used today!',
        'We mix lime with volcanic ash from near Naples to make concrete that even hardens underwater. That is how we build harbours.',
      ],
      shopkeeper: [
        'My shop opens onto the street under the apartments. Nearly every ground floor in Rome is a shop!',
        'I sell over a counter that faces the street. At night I close up with wooden shutters.',
        'We pay with coins: copper asses, brass sestertii, silver denarii and gold aurei. Each coin shows the emperor\'s face. Right now that is Trajan.',
      ],
      'water carrier': [
        'Aqueducts bring fresh water into Rome from the hills, nine of them by now! I carry it from the public fountain up to the top floors.',
        'Aqueducts slope very gently downhill the whole way, so gravity does all the work. No pumps needed!',
        'Rich people pay to have water piped into their houses. The pipes are lead, and our word for lead, plumbum, gave English the word "plumber".',
      ],
    },
    food: [
      'Most of us eat puls, a porridge of grain, with bread, olives, cheese and vegetables. Meat is a treat for festival days.',
      'We love garum, a salty sauce made from fish left to ferment in the sun. We put it on almost everything!',
      'Rich Romans hold dinner parties where the guests lie on couches to eat. Dormice cooked with honey are a fancy dish!',
    ],
    kids: [
      'Children play with knucklebones, dolls, hoops and nuts. When we say someone has "left their nuts behind", we mean they have grown up!',
      'Some children go to a teacher in the morning and learn to write on wax tablets with a pointed stick called a stylus.',
      'A freeborn boy wears a lucky charm called a bulla round his neck until he becomes a man, at about 15 or 16.',
    ],
    home: [
      'Most of us live in apartment blocks called insulae, some six or seven floors high! Few flats have kitchens, so we buy hot food at street counters.',
      'Top-floor flats are the cheapest: no water, lots of stairs, and if there is a fire they are the hardest to escape.',
      'Rich families live in a house called a domus. Its hall, the atrium, has an opening in the roof and a pool underneath to catch rainwater.',
    ],
    gods: [
      'We worship many gods: Jupiter, king of the gods, and Juno, Minerva, Mars, Venus and many more.',
      'Every home has a little shrine called a lararium for the household spirits. We leave them small gifts of food.',
      'People from all over the empire bring their own gods here too, like Isis from Egypt. A small new religion called Christianity has followers in Rome as well.',
    ],
    fun: [
      'The Colosseum holds about 50,000 people. The shows there include animal hunts and gladiator fights.',
      'At the Circus Maximus, four teams race chariots: the Reds, Whites, Blues and Greens. Fans cheer wildly for their team!',
      'Everyone goes to the public baths, with hot rooms, warm rooms and cold pools, plus gardens and places to exercise. It costs very little.',
    ],
    wonder: [
      'Emperor Trajan is building a giant new forum and market, paid for with treasure won in his wars in Dacia (today\'s Romania). A tall column carved with pictures of the war will stand there.',
      'The Pantheon has the biggest dome of plain concrete in the world. Even today, nobody has built a bigger one!',
      'A golden milestone in the Forum marks where the great roads begin. That is why people say "all roads lead to Rome".',
    ],
    words: [
      'Salve means "hello". Say it to anyone you meet!',
      'Aqua means "water", and ducere means "to lead". Put them together and you get aqueduct: something that leads water.',
      'Insula means "island". We call apartment blocks insulae because each one stands alone, with streets all round, like an island.',
      'Forum means an open square or marketplace. It is the heart of the city.',
    ],
  },

  athens: {
    hello: ['Chaire! (That is how we say "hello" in Greek.)', 'Chaire, stranger! Welcome to Athens.', 'Welcome to Athens, city of Athena!'],
    jobs: {
      'olive farmer': [
        'Olive oil is for cooking, for lamps and even for washing. The olive tree was Athena\'s gift to our city.',
        'At harvest we knock the branches with long sticks so the olives fall onto cloths. Then we crush them in a press for the oil.',
        'Winners at the Panathenaic Games get big painted jars full of oil from Athena\'s sacred olive trees!',
      ],
      'vase painter': [
        'I paint black and red pictures of heroes and athletes on pots. People will dig them up thousands of years from now!',
        'In the new red-figure style, I paint the background black and leave the people the red colour of the clay.',
        'Our pots show gods, heroes, athletes and everyday life. They are one of the best ways people in the future learn how we lived.',
      ],
      sculptor: [
        'I carve marble statues. We painted them in bright colours, even though the paint has worn off the ones you see in museums.',
        'The great sculptor Phidias made a giant statue of Athena for the Parthenon, covered in gold and ivory.',
        'Our marble comes from Mount Pentelikon, just outside the city. It is white and sparkles in the sun.',
      ],
      rower: [
        'I row in a trireme, a warship with 170 rowers. Many rowers were poor citizens, and they could vote in the Assembly too.',
        'A trireme has three rows of oars on each side. "Tri" means three.',
        'A flute player plays a steady beat so all 170 of us row together.',
      ],
    },
    food: [
      'We eat barley porridge and bread with olives, figs, cheese and onions. Most meat comes from animals offered to the gods at festivals.',
      'Fish from the sea is a favourite. The fishmongers in the agora are famous for being grumpy!',
      'Honey is our sugar. Little cakes with honey and sesame seeds are a treat.',
    ],
    kids: [
      'Boys go to school to learn reading, music and sport.',
      'A slave called a paidagogos walks boys to school and makes sure they behave. That is where your word "pedagogy", the art of teaching, comes from.',
      'Girls usually stay at home and learn weaving and running a household from their mothers. Children of all kinds play with tops, dolls and even yo-yos!',
    ],
    home: [
      'Our houses are built around a small open courtyard, so the rooms get light and air.',
      'Houses are made of mud brick on stone foundations. Burglars can dig right through the walls, so we call them "wall-diggers"!',
    ],
    gods: [
      'Athena is our goddess. The story goes that she and Poseidon both wanted the city, and she won by giving us the olive tree.',
      'We honour Zeus, Athena, Apollo, Poseidon and the other Olympian gods with festivals, prayers and sacrifices.',
      'In our great festival, the Panathenaia, a parade climbs to the Acropolis to give Athena\'s statue a beautiful new robe.',
    ],
    fun: [
      'We watch plays in the theatre of Dionysus: serious tragedies by Sophocles and Euripides, and very silly comedies.',
      'Every four years, Greeks from everywhere travel to Olympia for the Olympic Games, held in honour of Zeus.',
      'We love a good argument! Citizens meet in the agora to talk about everything, from politics to philosophy.',
    ],
    wonder: [
      'The Parthenon on the Acropolis was finished just a few years ago. Its columns bulge a tiny bit in the middle, so from far away they look perfectly straight.',
      'Pericles, our leader, had the Parthenon and the other new temples built with money from our allies. Not everyone thinks that was fair!',
      'Athens is a democracy, "rule by the people": any male citizen can speak and vote in the Assembly. But women, slaves and foreigners cannot vote.',
    ],
    words: [
      'Chaire means "hello" (it really means "be happy!").',
      'Polis means "city". It is where words like politics and police come from, and the name of this game!',
      'Demokratia means "rule by the people": demos is "the people" and kratos is "power".',
      'Agora means "gathering place". It is our market square and meeting place.',
    ],
  },

  giza: {
    hello: ['Welcome to Giza, home of the great pyramids!', 'Greetings, traveller! Mind the sledges.', 'Welcome to the pyramid builders\' town!'],
    jobs: {
      'stone hauler': [
        'Teams of us drag huge blocks on wooden sledges. Someone pours water on the sand in front so the sledge slides more easily.',
        'An old Egyptian painting shows a giant statue on a sledge, pulled by 172 men, with a man pouring water in front!',
        'We work in teams with names like "Friends of Khufu", and the teams try to beat each other. You can still see their names written on the stones.',
      ],
      baker: [
        'I bake bread in clay pots for thousands of workers. It\'s hot work!',
        'Archaeologists found our bakeries right here in the workers\' town, with the bread pots still in place.',
        'Our bread has a bit of sand and grit in it from the grinding stones, so people\'s teeth get worn down over the years.',
      ],
      'quarry worker': [
        'We cut limestone blocks with copper chisels and wooden wedges.',
        'The fine white stone for the outside of the pyramids comes from Tura, across the river.',
        'The granite for the king\'s burial chamber comes by boat down the Nile from Aswan, hundreds of miles to the south.',
      ],
    },
    food: [
      'We eat bread, onions, garlic, lentils and fish from the Nile. Archaeologists found lots of cattle bones here, so the builders ate plenty of meat too!',
      'There are no coins yet. Workers are paid in food: bread, beer and other rations.',
      'Our sweets are figs, dates and honey.',
    ],
    kids: [
      'Children play with balls, spinning tops and toy animals made of wood or clay.',
      'Only a few boys train to be scribes. Learning to write hieroglyphs takes years!',
      'Most children help their families from a young age: fishing, farming, or looking after the animals.',
    ],
    home: [
      'We pyramid builders live in a town with bakeries, breweries and even doctors.',
      'Our houses are made of mud bricks, which keep them cool. On hot nights many people sleep on the roof.',
    ],
    gods: [
      'We believe the king, Pharaoh, is a god on earth. His pyramid helps him rise up to the sky to join the sun god Ra.',
      'We worship many gods, like Ra the sun god, Osiris the god of the dead, and Hathor, a goddess of joy and music.',
      'We preserve the bodies of the dead as mummies, because we believe the body is needed in the afterlife.',
    ],
    fun: [
      'We play a board game called senet. It is one of the oldest board games in the world!',
      'At festivals there is music with harps, flutes and clapping, and lots of dancing.',
      'We swim and fish in the canals of the Nile, and we hold wrestling matches.',
    ],
    wonder: [
      'The Great Pyramid was built for King Khufu from more than two million blocks. It was the tallest building in the world for almost 4,000 years!',
      'When they are new, the pyramids are covered in smooth white limestone that shines in the sun.',
      'We builders aren\'t slaves! Archaeologists found that we were paid workers, and that doctors even set the broken bones of injured builders.',
    ],
    words: [
      'Ankh means "life". Its hieroglyph looks like a cross with a loop on top.',
      'Nefer means "good" or "beautiful". It is part of names like Nefertiti, "the beautiful one has come".',
      'Per-aa means "great house", the king\'s palace. Much later it became a name for the king himself, which is where "pharaoh" comes from.',
    ],
  },

  alexandria: {
    hello: ['Chaire! Welcome to Alexandria!', 'Welcome to the greatest port in the world!', 'Hello, traveller! Have you seen the lighthouse yet?'],
    jobs: {
      'papyrus maker': [
        'I make paper from papyrus reeds that grow along the Nile. The Great Library needs a lot of it!',
        'I slice the reed stems into thin strips, lay them in two layers crossways, and press them flat. The plant\'s own juice glues them together.',
        'Sheets are glued end to end into rolls, which can be many metres long. That is what a "book" looks like here: a scroll.',
      ],
      sailor: [
        'The Pharos lighthouse guides our ships home at night. You can see its fire from far out at sea.',
        'Our ships carry Egyptian wheat across the sea. Egypt grows so much grain that it feeds other cities too.',
        'We sail mostly in summer. Winter storms make the sea too dangerous.',
      ],
      glassblower: [
        'Alexandria is famous for glass: beads, bowls and colourful mosaic glass that we sell all over the Mediterranean.',
        'Glass is made by melting sand with natron, a salt that comes from dry lakes in Egypt.',
        'Around this time, glassmakers along this coast are discovering how to shape hot glass by blowing through a pipe. It will make glass cheap enough for everyone!',
      ],
    },
    food: [
      'Our markets have food from everywhere: Egyptian bread and lentils, Greek olives, and fish from the sea and the Nile.',
      'Dates, figs and pomegranates are sold on every street.',
      'Barley and wheat from the Nile valley fill our granaries, and ships take the rest abroad.',
    ],
    kids: [
      'Children from rich families go to the gymnasium to learn Greek, poetry, maths and sport.',
      'Pupils practise writing on wax tablets or on broken bits of pottery called ostraca, because papyrus costs money.',
    ],
    home: [
      'Alexandria is full of people from everywhere: Greeks, Egyptians, Jews, Romans and more. Each group has its own neighbourhood.',
      'The streets are laid out in a neat grid, with a huge main avenue running across the city.',
    ],
    gods: [
      'Our city\'s special god is Serapis, a mix of Greek and Egyptian gods. The kings introduced him to bring Greeks and Egyptians together.',
      'Egyptian gods like Isis are worshipped alongside Greek gods like Zeus. Many people pray to both!',
    ],
    fun: [
      'The Museum is where scholars live and study. "Museum" means "place of the Muses", the goddesses of learning and the arts.',
      'A librarian here, Eratosthenes, measured the size of the whole Earth using shadows and geometry, and got very close!',
      'Crowds go to the hippodrome to watch chariot races.',
    ],
    wonder: [
      'The Great Library tries to collect every book in the world. It is said that ships in the harbour had their books copied for it!',
      'The Pharos lighthouse is one of the Seven Wonders of the World, well over 100 metres tall. It stands on an island joined to the city by a long causeway.',
      'Alexander the Great founded this city, and his tomb is here. Our kings and queens, the Ptolemies, are Greek, but they rule Egypt as pharaohs.',
    ],
    words: [
      'Pharos is the island where the lighthouse stands. In French a lighthouse is still called a "phare", and in Italian and Spanish a "faro"!',
      'Biblion means "book". It is where the word "Bible" and "bibliography" come from.',
      'Alexandria means "city of Alexander". Alexander the Great named lots of cities after himself!',
    ],
  },

  babylon: {
    hello: ['Welcome to Babylon, greatest city of the world!', 'Greetings, traveller! Have you seen the blue gate?', 'Welcome! May Marduk bless you.'],
    jobs: {
      'brick maker': [
        'We shape mud bricks in wooden moulds and dry them in the sun. The best ones are baked in a kiln and glazed blue.',
        'Many of our bricks are stamped with the king\'s name, Nebuchadnezzar. Archaeologists still dig them up today!',
        'The Ishtar Gate is covered in shining blue glazed bricks, decorated with dragons and bulls.',
      ],
      'canal digger': [
        'Canals carry water from the Euphrates to the fields. Without them, nothing would grow here.',
        'The Euphrates flows right through the middle of Babylon, and a bridge crosses it.',
        'Floods bring rich new soil, but they can wash fields away too, so we build banks to hold the river back.',
      ],
      astronomer: [
        'We count in sixties. That is why your hour still has 60 minutes and your minute has 60 seconds!',
        'We write down what we see in the sky night after night, for hundreds of years. We can even predict eclipses of the moon.',
        'We sort the stars along the path of the sun and moon into groups. They will become the signs of the zodiac.',
      ],
    },
    food: [
      'We grow barley and dates. Date palms give us fruit, syrup, wood and rope!',
      'We eat barley bread, lentils, onions and fish from the canals.',
      'Sheep and goats give us milk, cheese and wool.',
    ],
    kids: [
      'Boys who will be scribes go to a school called the "tablet house" and copy signs onto clay tablets again and again.',
      'We write in cuneiform: wedge-shaped marks pressed into wet clay with a cut reed.',
      'Children play with clay rattles and little animals on wheels that they pull along on a string.',
    ],
    home: [
      'Our houses are made of mud brick with flat roofs. On hot nights we sleep up on the roof where it\'s cooler.',
      'Houses face inward onto a courtyard, with few windows on the street, to keep out the heat and dust.',
    ],
    gods: [
      'Our great god is Marduk. His temple, the Esagila, stands next to the giant ziggurat.',
      'At the New Year festival, the Akitu, the king takes the hand of Marduk\'s statue to show the god chooses him for another year.',
      'Ishtar is the goddess of love and war. The great blue gate is named after her.',
    ],
    fun: [
      'We play the Royal Game of Ur, a race game with dice shaped like little pyramids. It is already about 2,000 years old!',
      'Musicians play lyres, harps and drums at feasts and festivals.',
      'Storytellers tell the tale of Gilgamesh, a hero-king who searched for the secret of living forever.',
    ],
    wonder: [
      'The ziggurat Etemenanki is a giant stepped tower. Its name means "House of the foundation of heaven and earth".',
      'Some people think the Bible\'s story of the Tower of Babel is about our ziggurat.',
      'The Hanging Gardens of Babylon are said to have been built by King Nebuchadnezzar for his queen. But archaeologists have never found them, so maybe they were somewhere else, or only a legend!',
    ],
    words: [
      'Šarrum means "king".',
      'Bāb-ili means "gate of god". That is how Babylon got its name.',
      'Ziqqurratu means a temple tower built high. You call it a ziggurat.',
    ],
  },

  persepolis: {
    hello: ['Welcome to Persepolis, the city of the King of Kings!', 'Greetings! Have you come to bring gifts to the king?', 'Welcome, friend from a far land!'],
    jobs: {
      'stone carver': [
        'I carve the rows of gift-bearers on the stairways: people from 23 nations, each in their own clothes.',
        'Workers come here from all over the empire: Ionian Greeks, Egyptians, Babylonians and more. Clay tablets record what each one is paid.',
        'Women work here too, and they are paid. Mothers even get extra food rations when they have a baby!',
      ],
      gardener: [
        'Persian kings loved gardens with water channels and fruit trees. Our word for a walled garden gave English the word "paradise"!',
        'At Pasargadae, King Cyrus\'s garden has stone water channels running between the flower beds.',
        'We plant pomegranates, figs and grapes, and shady trees to keep the gardens cool.',
      ],
      messenger: [
        'I ride the Royal Road. Fresh horses wait at every station, so the king\'s news travels fast.',
        'The Royal Road runs about 2,500 kilometres. Walking it takes three months, but messengers, riding in relays, can carry news along it in about a week!',
        'A Greek writer, Herodotus, said that nothing on earth is faster than the king\'s messengers.',
      ],
    },
    food: [
      'The king\'s kitchens feed thousands of guests every day.',
      'We eat bread, meat, cheese and lots of fruit. Herodotus says Persians love having many courses of dessert!',
      'Wheat and barley grow on the plain around the city, and flocks of sheep graze in the hills.',
    ],
    kids: [
      'Herodotus says Persian boys learn three things: to ride a horse, to shoot a bow, and to tell the truth.',
      'Telling a lie is one of the worst things you can do here. Our religion calls it the Lie, the enemy of goodness.',
    ],
    home: [
      'Persepolis is a royal city for ceremonies. Every spring, people from all over the empire come to bring gifts to the king for the New Year festival, Nowruz, which people still celebrate today.',
      'Most people live in the town and villages below the great stone terrace, where the palaces are.',
    ],
    gods: [
      'We worship Ahura Mazda, the "Wise Lord". King Darius says in his carvings that he rules by Ahura Mazda\'s favour.',
      'Fire is sacred to us, as a sign of truth and goodness.',
      'The king lets the peoples of the empire keep their own gods and customs. Cyrus even let the Jews go home from Babylon to rebuild their temple.',
    ],
    fun: [
      'Riding and archery contests are a favourite pastime.',
      'Nobles hunt in great walled parks full of animals.',
      'Nowruz, the New Year, comes on the first day of spring with feasting and gifts.',
    ],
    wonder: [
      'The Apadana is the great audience hall: 72 tall stone columns, topped with carved heads of bulls.',
      'King Darius had his story carved into a cliff at Behistun in three languages. Much later it helped people learn to read cuneiform again!',
      'The Persian Empire is the biggest the world has ever seen, stretching from Egypt and Greece to India.',
    ],
    words: [
      'Xšāyaθiya means "king". It is where the later Persian word "shah" comes from.',
      'Paridaida means a walled garden. The Greeks borrowed it, and it became "paradise".',
      'Ahura Mazda means "Wise Lord", our great god.',
    ],
  },

  mohenjoDaro: {
    hello: ['Hello, and welcome to our city by the Indus river!', 'Welcome! Watch your step; the drains are under the street.', 'Hello, traveller!'],
    jobs: {
      'bead maker': [
        'I drill tiny holes through hard carnelian stones to make beads. Traders take them as far as Mesopotamia.',
        'A long carnelian bead can take days to drill, using special hard stone drills.',
        'We heat the stones in a fire to make their red colour brighter.',
      ],
      weaver: [
        'We grow cotton and weave it into cloth. The Indus people were some of the first in the world to do that.',
        'A tiny scrap of cotton cloth was found here, stuck to a silver vase, about 4,500 years old.',
        'We spin thread on spindles weighted with little round whorls, and weave it on looms.',
      ],
      'seal carver': [
        'I carve animals and our writing onto little stone seals. Nobody today can read the writing — maybe you\'ll be the one to work it out!',
        'Many seals show a one-horned animal that archaeologists call the "unicorn". Nobody knows what it meant.',
        'Traders press our seals into clay to mark their goods. Our seals have even been found in Mesopotamia!',
      ],
    },
    food: [
      'We grow wheat, barley, peas and sesame, and keep cattle, sheep and goats.',
      'Fish from the Indus river is on the menu too.',
      'Traders use sets of stone weights, all made to the same sizes, so everyone gets a fair deal at market.',
    ],
    kids: [
      'Archaeologists found our toys: little carts with wheels, whistles shaped like birds, and clay animals whose heads nod.',
      'Nobody knows what our schools were like, because nobody can read our writing yet.',
    ],
    home: [
      'Almost every house here has its own bathroom, with a drain into covered drains under the street. Many cities didn\'t have that even 4,000 years later!',
      'Our houses are made of baked bricks, all the same shape: as wide as two thicknesses and as long as four.',
      'The streets are laid out in a neat grid, with the main streets running north to south and east to west.',
    ],
    gods: [
      'Nobody knows for sure what we believed. Archaeologists found little figures of women that might be goddesses.',
      'The Great Bath may have been used for washing before ceremonies. But that is still a mystery!',
    ],
    fun: [
      'Dice! Cube-shaped dice have been found here, much like yours.',
      'A little bronze statue of a girl, called the "Dancing Girl", was found here. She is about 4,500 years old.',
    ],
    wonder: [
      'The Great Bath is a big pool made waterproof with a layer of tar called bitumen.',
      'Part of the city stands on a giant mud-brick platform that archaeologists call the Citadel.',
      'No palaces or grand royal tombs have been found here. Maybe there wasn\'t a king at all!',
    ],
    words: [
      'Nobody can read our writing yet. There are about 400 different signs, but most writings are very short.',
      '"Mohenjo-daro" isn\'t our name for the city. It is a much later Sindhi name meaning "mound of the dead". Nobody knows what we called it!',
    ],
  },

  teotihuacan: {
    hello: ['Welcome to the great city!', 'Hello, traveller! Have you walked the great avenue?', 'Welcome! Watch out for the obsidian chips.'],
    jobs: {
      'obsidian worker': [
        'I chip obsidian, a black volcanic glass, into blades sharper than steel. We trade them far and wide.',
        'Obsidian comes from volcanoes near here. Some, from near Pachuca, is a beautiful green.',
        'Our obsidian is traded all the way south to the Maya cities.',
      ],
      farmer: [
        'We grow maize, beans and squash together in the same field. People call them the Three Sisters.',
        'The beans climb up the maize stalks, and the big squash leaves shade the soil so weeds can\'t grow.',
        'We soak maize in lime water before grinding it. It makes the dough softer and the food healthier.',
      ],
      'mural painter': [
        'I paint the walls of the compounds with jaguars, birds and gods, in red, green and blue.',
        'We paint on smooth lime plaster, then polish it until it shines.',
        'One famous mural shows people playing, swimming and singing in a paradise full of butterflies and flowers.',
      ],
    },
    food: [
      'We eat maize as tortillas and tamales, with beans, squash, chillies and tomatoes.',
      'We hunt deer and keep turkeys. Lots of rabbit bones were found in our homes, so maybe we raised rabbits too!',
    ],
    kids: [
      'Families live together in big apartment compounds, so children grow up with lots of cousins around.',
      'Children learn their family\'s craft by helping: potters\' children make pots and weavers\' children weave.',
    ],
    home: [
      'Families here live together in big stone apartment compounds, with many rooms around open patios. The walls are covered in bright painted murals.',
      'There are about 2,000 apartment compounds in the city. Some neighbourhoods are home to people from far away, like Oaxaca.',
    ],
    gods: [
      'We honour a storm god who brings rain, and a Feathered Serpent. Much later, the Aztecs called them Tlaloc and Quetzalcoatl.',
      'The Temple of the Feathered Serpent is decorated with big stone serpent heads.',
    ],
    fun: [
      'Our murals show people playing ball games, some with sticks!',
      'At festivals there is music with drums, flutes and rattles.',
    ],
    wonder: [
      'The Avenue of the Dead is more than 2 kilometres long, with the Pyramid of the Sun and the Pyramid of the Moon along it.',
      'The Pyramid of the Sun is one of the biggest pyramids in the world.',
      'The whole city is laid out on a grid, turned a little east of north, on purpose, to line up with the sky.',
    ],
    words: [
      'Nobody knows what we called our city or which language we spoke!',
      '"Teotihuacan" is an Aztec name, given centuries later. It means "the place where the gods were created". The Aztecs found the city in ruins and believed the sun and moon were born here.',
    ],
  },

  angkor: {
    hello: ['Welcome to Angkor, city of the Khmer kings!', 'Hello! Have you seen the new temple?', 'Welcome, traveller. Mind the moat!'],
    jobs: {
      'rice farmer': [
        'Huge reservoirs called barays store water for our rice fields.',
        'We plant the young rice plants by hand, one by one, in flooded fields.',
        'Water buffalo pull our ploughs through the muddy fields.',
      ],
      'temple carver': [
        'I carve apsaras, heavenly dancers, into the sandstone walls of the temples.',
        'Angkor Wat\'s walls have nearly 1,800 apsaras carved on them, and no two are quite the same.',
        'One huge carving shows the Churning of the Ocean of Milk: gods and demons pulling a giant snake back and forth, like a tug-of-war!',
      ],
      fisher: [
        'The great lake, Tonle Sap, is full of fish. We dry and salt them to eat all year.',
        'When the Mekong floods, the Tonle Sap river flows backwards and fills the great lake!',
        'We catch fish with nets, traps and spears.',
      ],
    },
    food: [
      'We eat rice and fish most of all, flavoured with herbs.',
      'Fruit grows everywhere: bananas, mangoes and coconuts.',
    ],
    kids: [
      'Children help in the rice fields, catch fish and look after the water buffalo.',
      'Some boys study at the temples, learning Sanskrit, the language of the holy books.',
    ],
    home: [
      'Our houses stand on stilts to stay dry when the monsoon rains flood the land. Only temples are built of stone. Even the king\'s palace is wood!',
      'Wooden houses don\'t last, so most of the city has disappeared. Only the stone temples remain.',
    ],
    gods: [
      'King Suryavarman II is building Angkor Wat for the Hindu god Vishnu.',
      'Later kings will follow Buddhism, and Angkor Wat will become a Buddhist temple, as it still is today.',
    ],
    fun: [
      'Festivals have music, dancing and boat races.',
      'Apsara dancers perform graceful dances. Cambodian dancers still perform them today.',
    ],
    wonder: [
      'Angkor Wat is the largest religious building in the world.',
      'Unlike most temples here, Angkor Wat faces west. West is the direction linked with the god Vishnu.',
      'Its moat is about 190 metres wide and surrounds the whole temple.',
    ],
    words: [
      '"Angkor" comes from the Sanskrit word nagara, which means "city".',
      '"Wat" means temple, so Angkor Wat means "City Temple".',
      'Inscriptions here are in two languages: Sanskrit for poems to the gods, and Old Khmer for everyday records.',
    ],
  },  olympia: {
    hello: ['Chaire! Welcome to Olympia, home of the Games!', 'Welcome, traveller! Have you come for the Games?', 'Greetings! The sacred truce means you can travel here safely.'],
    jobs: {
      athlete: [
        'I train every day in the palaestra and the gymnasium. Before the Games, athletes had to train for a whole month at nearby Elis, watched by the judges.',
        'The oldest race is the stadion, one length of the stadium: about 192 metres. Legend says Heracles measured it out with his own feet!',
        'Athletes competed with no clothes on, rubbed with olive oil. Afterwards we scrape the oil and dust off with a curved tool called a strigil.',
        'In the pentathlon you must run, jump, throw the discus, throw the javelin and wrestle. Long jumpers swing stone weights to jump further.',
        'Milo of Croton won the wrestling six times. People say he trained by carrying a calf every day until it grew into a bull!',
      ],
      judge: [
        'I am one of the Hellanodikai, the judges of the Greeks. We wear purple robes, and we fine anyone who cheats.',
        'Cheats pay for a bronze statue of Zeus called a Zan. Look at the row of them by the stadium entrance: every athlete walks past them, as a warning.',
        'Married women weren\'t allowed to watch the Games. But a Spartan princess named Kyniska won the four-horse chariot race twice, because the prize went to the owner of the horses!',
        'Only free Greek men could compete. Women had their own races here, the Heraia, in honour of the goddess Hera.',
      ],
      sculptor: [
        'I make statues of the winners. A champion who wins three times may have a statue that looks just like him!',
        'The great sculptor Phidias made the statue of Zeus in a workshop just outside the sanctuary. Archaeologists found it, with a cup scratched with the words "I belong to Phidias".',
        'The statue of Zeus was about 12 metres tall, so big that people said if he stood up he would go through the roof!',
      ],
      'olive farmer': [
        'I look after the sacred olive tree. A boy whose parents are both alive cuts the winners\' wreaths with a golden sickle.',
        'A winner gets only an olive wreath here, but back home his city might give him free meals for life!',
        'Olive oil is everywhere at the Games: athletes rub it on their skin, and it fills the lamps at night.',
      ],
    },
    food: [
      'On the third day of the Games, 100 oxen are sacrificed to Zeus, and everyone shares a great feast of roast meat.',
      'Visitors buy bread, cheese, figs and olives from traders who set up stalls by the river.',
    ],
    kids: [
      'Boys have their own races and wrestling matches at the Games!',
      'Children watch from the grassy banks of the stadium. There are no stone seats, so everyone sits on the grass, about 45,000 people!',
    ],
    home: [
      'Most of the year Olympia is quiet. But every four years crowds arrive and camp in tents all round the sanctuary.',
      'Important visitors stay in the Leonidaion, a guesthouse with rooms round a shady garden.',
    ],
    gods: [
      'The Games are held to honour Zeus, king of the gods. Athletes swear an oath in front of his statue to play fair.',
      'The Temple of Hera is the oldest building here. Today the Olympic flame for the modern Games is lit in front of it, using the sun\'s rays and a curved mirror.',
    ],
    fun: [
      'The chariot race is the most exciting of all: dozens of chariots race 12 laps round the hippodrome, and crashes are common!',
      'Pankration is a mix of boxing and wrestling, with almost no rules. Only biting and eye-gouging are forbidden!',
    ],
    wonder: [
      'The gold-and-ivory statue of Zeus by Phidias is one of the Seven Wonders of the Ancient World.',
      'Workers oil the ivory to keep it from cracking, and a shallow pool of olive oil on the floor in front helps protect it from the damp.',
      'The ancient Games lasted for over a thousand years. They started again in Athens in 1896, as the modern Olympic Games.',
    ],
    words: [
      '"Stadium" comes from the Greek "stadion", the length of the race track.',
      '"Athlete" comes from the Greek word "athlon", meaning a prize.',
      '"Gymnasium" comes from the Greek word "gymnos", meaning naked, because that is how athletes trained!',
    ],
  },
  jerusalem: {
    hello: ['Shalom! (That means "peace", and we say it for hello.)', 'Shalom, traveller! Have you come up for the festival?', 'Welcome to Jerusalem, the city of the Temple!'],
    jobs: {
      stonemason: [
        'I cut stone for the Temple Mount. Some blocks are as long as a bus, and they stay up by their own weight, with no mortar.',
        'King Herod began rebuilding the Temple around 20 BCE. The whole Temple Mount took more than 80 years to finish, only a few years before the Romans destroyed it.',
        'The historian Josephus says a thousand priests were trained as stonemasons and carpenters, so that only priests would build the holiest parts.',
        'Look at the edges of the big stones: we carve a smooth flat border around each one. You can still see those borders on the Western Wall today.',
      ],
      potter: [
        'I make stone and clay jars. Stone jars are special here, because the law says stone cannot become unclean.',
        'Archaeologists have found thousands of pieces of stone cups and jars in Jerusalem from this time.',
        'My oil lamps are small clay dishes with a spout for the wick. They burn olive oil.',
      ],
      'olive farmer': [
        'Our olives grow on the Mount of Olives, just across the valley from the Temple.',
        'The purest olive oil, from the first gentle pressing, is burned in the Temple\'s great lampstand, the menorah.',
        'Gethsemane, the garden on the Mount of Olives, gets its name from the words for "oil press".',
      ],
      scribe: [
        'I copy the holy books with a reed pen and black ink on parchment, one letter at a time. One mistake and I must start that sheet again!',
        'In 1947, a shepherd boy found very old scrolls hidden in clay jars in caves near the Dead Sea. They were copied around this time, over 2,000 years ago.',
        'The Torah is written on one long scroll that is rolled from one wooden handle to another as you read.',
      ],
    },
    food: [
      'We eat bread, olives, figs, dates, lentils and fish salted at the Sea of Galilee.',
      'Our food laws say we must not eat pork or shellfish.',
      'At Passover we eat flat bread called matzah, to remember how our ancestors left Egypt in a hurry, with no time for the bread to rise.',
    ],
    kids: [
      'Boys go to the synagogue school to learn to read the Torah. Girls mostly learn at home.',
      'At the festival of Sukkot, families build little huts with leafy roofs and eat, and sometimes sleep, in them for a week. Children love it!',
    ],
    home: [
      'Our houses are built of the pale local stone, with flat roofs where we dry figs and sleep on hot nights.',
      'Rich priests live in the Upper City in big houses with mosaic floors and their own ritual baths, called mikvehs.',
    ],
    gods: [
      'We worship one God. The Temple is the only place where sacrifices are offered to Him.',
      'Only the High Priest may enter the innermost room, the Holy of Holies, and only once a year, on the Day of Atonement, Yom Kippur.',
      'A great curtain hangs in front of the Holy of Holies, woven in blue, purple and scarlet.',
    ],
    fun: [
      'Three times a year, at Passover, Shavuot and Sukkot, pilgrims fill the city. People sing psalms as they walk up to the Temple.',
      'At Sukkot, the Temple courts are lit by giant lamps and people dance with torches all night.',
    ],
    wonder: [
      'Josephus wrote that the front of the Temple was covered in gold plates, so bright in the morning sun that you had to look away.',
      'From far away, he said, the Temple looked like a snowy mountain, because the parts that weren\'t gold were brilliant white.',
      'The Temple Mount platform is so big that about 20 football pitches would fit on it.',
      'The Romans destroyed the Temple in 70 CE. The Western Wall, part of the wall around the platform, still stands, and people pray there today.',
    ],
    words: [
      '"Shalom" means peace. It\'s still how people say hello in Hebrew.',
      '"Hallelujah" is Hebrew for "praise God". You can hear it in songs all over the world.',
      'In Hebrew, Jerusalem is "Yerushalayim".',
      'Most people here speak Aramaic every day, read the holy books in Hebrew, and use Greek for trade.',
    ],
  },
  carthage: {
    hello: ['Welcome to Qart-hadasht, the New City!', 'Welcome, traveller! Have you come by sea? Everyone does.', 'Greetings from Carthage, queen of the sea!'],
    jobs: {
      'purple dyer': [
        'I crush murex sea snails to make purple dye. It takes thousands of snails to dye one robe!',
        'Purple dye is so costly that in Rome only important people can wear purple. They buy it from us Phoenicians.',
        'The dye works smell terrible, so they are kept at the edge of town. Archaeologists still find great heaps of broken snail shells.',
      ],
      shipwright: [
        'I build warships. Every piece is marked with a letter, so the ship goes together quickly, like a kit.',
        'A Punic warship found sunk off Sicily still had our builders\' letters painted on its timbers.',
        'The round war harbour, the cothon, has sheds for about 220 ships, and the admiral watches from a tower on the island in the middle.',
      ],
      sailor: [
        'Our sailors know the whole sea. Some have sailed out past the Pillars of Hercules, into the ocean beyond.',
        'A Carthaginian captain named Hanno sailed down the coast of Africa. He wrote about hairy wild people his guides called "gorillai". That\'s where the word gorilla comes from!',
        'Our warships are rowed by teams of rowers, one or more to each oar, keeping time together.',
      ],
      'olive farmer': [
        'The farms around Carthage are famous. A Carthaginian named Mago wrote a farming book in 28 volumes!',
        'After Carthage fell, the Roman Senate ordered Mago\'s farming book to be translated into Latin.',
        'A Roman named Cato once showed the Senate fresh figs from Carthage, to prove how close and how dangerous we were.',
      ],
    },
    food: [
      'We eat bread, olives, figs, grapes and fish, and plenty of pomegranates.',
      'The Romans call pomegranates "Punic apples", because they think of them as our fruit.',
      'Carthaginian cooks make a famous porridge of wheat, cheese, honey and eggs.',
    ],
    kids: [
      'Children learn our alphabet of 22 letters, the alphabet that the Greeks and Romans borrowed from the Phoenicians.',
      'Many boys go to sea with their fathers to learn how to trade.',
    ],
    home: [
      'Our houses stand close together, some six floors high, and they are plastered white.',
      'Many houses have a cistern under the floor to catch rainwater, and some even have a little bathtub!',
      'The city walls are so thick they have stables inside them, for 300 elephants and 4,000 horses.',
    ],
    gods: [
      'Our greatest gods are Baal Hammon and the goddess Tanit. Her sign looks like a simple person with arms raised.',
      'Melqart is the god of our mother city, Tyre. We send gifts to his temple there every year.',
      'Eshmun, the god of healing, has his temple on top of the Byrsa hill.',
    ],
    fun: [
      'When a fleet comes home, the whole city crowds the harbour to see what it brought.',
      'In the market you can hear a dozen languages: Punic, Greek, Libyan, Latin and more.',
    ],
    wonder: [
      'The cothon is a round harbour dug by hand, with an island in the middle. From the sea, nobody can see inside!',
      'Our general Hannibal crossed the Alps into Italy in 218 BCE with an army and 37 war elephants.',
      'Rome and Carthage fought three wars, called the Punic Wars. In 146 BCE Rome won and destroyed the city.',
      'The Romans later built a new Carthage on the same spot. Its ruins are near Tunis today.',
    ],
    words: [
      '"Qart-hadasht" means "New City". The Romans turned it into "Carthago".',
      '"Punic" comes from the Latin word for Phoenician.',
      'Legend says Queen Elissa, called Dido, was told she could have as much land as an ox-hide could cover. She cut it into thin strips and circled a whole hill!',
      'The Phoenician alphabet is the great-great-grandparent of the letters you are reading right now.',
    ],
  },
  forbiddenCity: {
    hello: ['Welcome to Beijing, the Northern Capital!', 'Greetings, traveller! Bow when the emperor\'s guards pass.', 'Welcome! Have you seen the golden roofs?'],
    jobs: {
      carpenter: [
        'I build palace halls from huge timbers. We fit the beams together with wooden joints, without nails.',
        'Under the eaves, clusters of wooden brackets called dougong hold up the heavy roof. They can even flex in an earthquake.',
        'The best pillars are nanmu wood from the far southwest. The logs took years to float here along rivers and canals.',
      ],
      'beam painter': [
        'I paint the beams under the roofs with dragons, flowers and clouds. The paint protects the wood from the weather too.',
        'The dragon with five claws on each foot is only for the emperor. Anyone else who uses it is in big trouble!',
        'The walls are red and the roofs are yellow. Yellow is the emperor\'s colour, the colour of the centre of the world.',
      ],
      gardener: [
        'I look after the Imperial Garden, with its old cypress trees and strange rocks from Lake Tai.',
        'The hill north of the palace, Jingshan, was made from the earth dug out for the moat.',
        'Garden rocks full of holes are carved by water over many years, and they are very valuable.',
      ],
      shopkeeper: [
        'I sell blue-and-white porcelain from Jingdezhen. People all over the world want to buy it.',
        'I count with an abacus, sliding beads on rods. A good clerk is faster than you could write the numbers down!',
        'Merchants bring silk, tea and porcelain through the city. The Grand Canal brings grain from the south.',
      ],
    },
    food: [
      'In the north we eat more wheat than rice: noodles, dumplings and steamed buns.',
      'Roast duck is a favourite in the capital, and it is still Beijing\'s most famous dish.',
      'The palace kitchens cook hundreds of dishes for the emperor, and he only tastes a few.',
    ],
    kids: [
      'Children fly paper kites and play jianzi, kicking a feathered shuttlecock to keep it in the air.',
      'Boys study the books of Confucius for years, hoping to pass the hard exams to become officials.',
    ],
    home: [
      'We live in courtyard houses called siheyuan, along narrow lanes called hutongs.',
      'In winter we sleep on a kang, a brick bed with a fire underneath to keep it warm.',
    ],
    gods: [
      'The emperor is called the Son of Heaven. Each winter he prays at the Temple of Heaven for a good harvest.',
      'People follow the teachings of Confucius, visit Buddhist and Daoist temples, and honour their ancestors at home.',
    ],
    fun: [
      'At the Lantern Festival the streets glow with paper lanterns, and people solve riddles written on them.',
      'Fireworks were invented in China! We set them off at New Year to scare away bad luck.',
    ],
    wonder: [
      'The Yongle Emperor built the palace between 1406 and 1420. About a million workers helped, people say.',
      'Huge stone slabs were dragged here in winter along roads made icy by pouring water on them.',
      'People say the palace has 9,999 rooms, one fewer than a palace in Heaven. The real count is lower, but still around 8,700!',
      'The Hall of Supreme Harmony stands on three tiers of white marble. It is the biggest wooden hall in China.',
    ],
    words: [
      '"Beijing" means "northern capital". The southern capital was Nanjing.',
      'The palace is called "Zijin Cheng", the Purple Forbidden City. Purple stands for the North Star, home of the Emperor of Heaven.',
      '"Huangdi" means emperor.',
      'Chinese is written with characters, not letters. Each one stands for a word or part of a word.',
    ],
  },
  wei: {
    hello: ['Welcome to Luoyang, capital of Wei!', 'Greetings, traveller! The Han dynasty is over. This is the kingdom of Wei now.', 'Welcome! Are you a soldier or a farmer? Here, many people are both.'],
    jobs: {
      'millet farmer': [
        'Millet is the grain of the north. We eat it as porridge, or steamed.',
        'Cao Cao set up soldier farms called tuntian. Soldiers grow grain in peacetime, so the army never goes hungry.',
        'We plough with iron ploughs pulled by oxen.',
      ],
      'paper maker': [
        'I make paper from mulberry bark, hemp and old rags. Paper is much lighter than the bamboo strips people wrote on before.',
        'A court official named Cai Lun improved paper-making here in Luoyang in 105 CE.',
        'We beat the fibres into a pulp, scoop it up with a screen, and dry the thin sheets in the sun.',
      ],
      blacksmith: [
        'Our iron is melted and poured into moulds. China has made cast iron for hundreds of years.',
        'A water wheel works the bellows to make the furnace extra hot.',
        'An engineer named Ma Jun built a south-pointing chariot for the emperor: a cart with gears that always points the same way.',
      ],
    },
    food: [
      'We eat millet, wheat noodles, beans and pickled vegetables.',
      'Rich families eat pork, chicken and fish, with sauces made from fermented soybeans.',
    ],
    kids: [
      'Children play weiqi, a board game with black and white stones. Today it is called Go.',
      'Boys play cuju, kicking a leather ball stuffed with feathers.',
    ],
    home: [
      'Luoyang was burned in a war in 190, so we are building it again.',
      'Our houses have walls of rammed earth, pounded hard between wooden boards, and tiled roofs.',
    ],
    gods: [
      'We honour our ancestors and the gods of heaven and earth.',
      'The White Horse Temple here is said to be China\'s first Buddhist temple. Its name comes from the white horse that carried holy books from India.',
    ],
    fun: [
      'Cao Cao is a great general, and he is also a poet! His poems are still read today.',
      'Musicians play the zither, flutes and bells at feasts.',
    ],
    wonder: [
      'In 220 CE, Cao Pi made himself emperor of Wei. That was the end of the 400-year-old Han dynasty.',
      'Wei is the biggest of the Three Kingdoms, with many more people than Shu and Wu.',
      'In 280 CE, the Jin dynasty, which took over from Wei, reunited all of China.',
      'Hundreds of years later, a writer turned these wars into a famous novel, Romance of the Three Kingdoms.',
    ],
    words: [
      '"Sanguo" means "Three Kingdoms".',
      '"Wei" was the name of this kingdom. It was taken from an old state in the same lands.',
      'Luoyang means "north of the Luo River".',
    ],
  },
  shu: {
    hello: ['Welcome to Chengdu, the Brocade City!', 'Greetings! Come and drink some tea.', 'Welcome to Shu, Land of Abundance!'],
    jobs: {
      'silk weaver': [
        'I weave Shu brocade, silk with patterns woven right in.',
        'Chancellor Zhuge Liang says the kingdom pays for its army with brocade!',
        'A single silkworm cocoon is one long thread, up to about a kilometre long.',
        'We wash the brocade in the Jin River, the "Brocade River". People say the colours come out brighter there.',
      ],
      'salt worker': [
        'We drill deep wells to bring up salty water, then boil it until only salt is left.',
        'Some wells give off a gas that burns! We pipe it through bamboo tubes and use it to boil the brine.',
        'Salt is so important that the government controls who can sell it.',
      ],
      'tea farmer': [
        'We pick tea leaves on the misty hills. People here have been drinking tea for hundreds of years.',
        'Long before this, a man from Shu wrote a contract telling his servant to go and buy tea at the market. It is one of the oldest writings that mentions tea.',
        'Later, tea will travel all around the world, but it started in these hills.',
      ],
    },
    food: [
      'Our dishes use Sichuan pepper, a spice that makes your tongue tingle and go numb!',
      'Chilli peppers come from America and won\'t reach China for another 1,300 years. Spicy food here is all about Sichuan pepper.',
      'We have rice, pork, beans and lots of vegetables, because the land is so rich.',
    ],
    kids: [
      'Up in the bamboo forests in the mountains live black and white bears. Today they are called giant pandas.',
      'Children help pick tea leaves and feed the silkworms mulberry leaves.',
    ],
    home: [
      'Our basin is warm and misty, ringed by mountains. The land is so rich people call it the Land of Abundance.',
      'To get here, travellers walk on plank roads: wooden walkways fixed to the sides of cliffs!',
    ],
    gods: [
      'A religion called Daoism grew strong here. Its first leaders, the Celestial Masters, started in these mountains.',
      'We honour our ancestors, and the spirits of rivers and mountains.',
    ],
    fun: [
      'Tea houses are full of people chatting, playing games and listening to storytellers.',
      'People tell clever stories about Zhuge Liang. They say he invented a wooden ox for carrying supplies over the mountains!',
    ],
    wonder: [
      'Liu Bei made himself emperor in 221 CE. He said he was the true heir of the Han emperors.',
      'Dujiangyan, a river system built around 256 BCE, splits the river to water our fields. It still works today, more than 2,000 years later!',
      'Shu was the smallest of the Three Kingdoms, and Wei conquered it in 263 CE.',
    ],
    words: [
      '"Shu" is an old name for this land.',
      'In Chinese, the giant panda is called "xiongmao", which means "bear cat".',
      'Chengdu is still the capital of Sichuan province, and one of China\'s biggest cities.',
    ],
  },
  wu: {
    hello: ['Welcome to Jianye, on the Long River!', 'Greetings, traveller! Did you come by boat? Everyone does here.', 'Welcome to Wu!'],
    jobs: {
      shipwright: [
        'I build tower ships for the navy, with several decks, like floating castles.',
        'We fill the gaps between planks with tung oil and lime, so the ship stays watertight.',
        'Chinese ships were steered with a rudder at the back. Europe would not use rudders like that for about another thousand years.',
      ],
      'rice farmer': [
        'The south is warm and wet, perfect for rice in flooded paddy fields.',
        'People call this "the land of fish and rice".',
        'We plant the rice seedlings by hand, standing up to our ankles in water.',
      ],
      fisher: [
        'The Long River and its lakes are full of fish.',
        'In the river there are pale freshwater dolphins called baiji. Sadly, they are probably extinct today.',
        'Some fishermen train cormorant birds to catch fish for them!',
      ],
    },
    food: [
      'We eat rice and fish every day, with lotus roots, water chestnuts and greens.',
      'At the Dragon Boat Festival we eat rice wrapped in leaves.',
    ],
    kids: [
      'Children learn to swim and handle boats almost as soon as they can walk.',
      'At the Dragon Boat Festival, long boats with dragon heads race on the river while drums beat.',
    ],
    home: [
      'We live by the water. Boats are everywhere, and many streets are canals.',
      'Our pots have a green glaze, called celadon. Potters around here are famous for it.',
    ],
    gods: [
      'A Buddhist monk named Kang Senghui came to Jianye in 247 CE and built the first Buddhist temple in the south.',
      'We pray to the spirits of the river for safe journeys.',
    ],
    fun: [
      'The Dragon Boat races are the most exciting day of the year!',
      'Sailors tell stories of faraway lands. Wu has sent envoys by sea to kingdoms in Southeast Asia.',
    ],
    wonder: [
      'In 208 CE, at the Battle of Red Cliffs, Wu and Liu Bei beat Cao Cao\'s huge fleet by sending in boats set on fire.',
      'Sun Quan built the Stone City fortress in 212 CE, on a cliff above the river.',
      'Wu was the last of the Three Kingdoms. It fell in 280 CE, and China was one country again.',
    ],
    words: [
      'The Yangtze River is called "Chang Jiang", the Long River. It is the longest river in Asia.',
      'Jianye is called Nanjing today, the "southern capital".',
      '"Shui" means water.',
    ],
  },
};

// What each craftsperson can make for you, and what they'd like in return (people often bartered: goods for goods).
// make: [item, how many]; want: [[item, how many], ...]; done: what they say as they hand it over.
export const ORDERS = {
  athlete: { make: ['olives', 2], want: [['bread', 1]], done: 'Thanks! Here are some olives from my training food. Athletes ate lots of meat, bread, figs and cheese.' },
  judge: { make: ['purpleCloth', 1], want: [['wool', 2]], done: 'A length of purple cloth, like our judges\' robes. Purple dye is very costly!' },
  baker: { make: ['bread', 2], want: [['wheat', 3]], done: 'Fresh from the oven! Bakers ground the grain, kneaded the dough and baked it all in one shop.' },
  potter: { make: ['amphora', 1], want: [['clay', 4]], done: 'Here is your amphora. The pointed bottom lets it stand in sand, or be packed tightly in a ship.' },
  'vase painter': { make: ['clayPot', 1], want: [['clay', 2], ['coal', 1]], done: 'A painted pot for you! The black is a special clay slip that turns black in the kiln.' },
  sculptor: { make: ['statuette', 1], want: [['marble', 2]], done: 'A little marble statue. I roughed it out with a pick, then shaped it with chisels and smoothed it with sand.' },
  'papyrus maker': { make: ['papyrus', 3], want: [['apple', 2]], done: 'Three fresh sheets of papyrus. Write on them with a reed pen and ink made from soot.' },
  glassblower: { make: ['glassBottle', 1], want: [['sand', 2], ['coal', 1]], done: 'Here is a little glass bottle, for perfume or oil. Hold it up to the light!' },
  'bead maker': { make: ['beads', 1], want: [['copperIngot', 1]], done: 'A string of carnelian beads, drilled by hand. Traders carry beads like these all the way to Mesopotamia.' },
  weaver: { make: ['cotton', 2], want: [['wheat', 2]], done: 'Soft cotton cloth from my loom. Cotton grows well by the Indus river.' },
  'seal carver': { make: ['sealStone', 1], want: [['limestone', 1], ['apple', 1]], done: 'Your own seal! Press it into wet clay to mark what is yours.' },
  'obsidian worker': { make: ['obsidianBlade', 1], want: [['cobblestone', 4]], done: 'An obsidian blade, sharper than steel. Careful, it can chip!' },
  'mural painter': { make: ['plaster', 4], want: [['limestone', 2]], done: 'White lime plaster, ready for painting. We paint the walls while the plaster is fresh.' },
  stonemason: { make: ['stoneBricks', 8], want: [['cobblestone', 8]], done: 'Neatly cut stone bricks. Square blocks fit together tightly, so walls stand for centuries.' },
  'brick maker': { make: ['brick', 4], want: [['clay', 4]], done: 'Baked bricks, hard as stone. I fired them in my kiln for you.' },
  shopkeeper: { make: ['figs', 3], want: [['wheat', 2]], done: 'Sweet figs from the countryside. Thank you for your custom!' },
  'olive farmer': { make: ['olives', 4], want: [['bread', 1]], done: 'Olives from Athena\'s trees. Soak them in salt water first, or they taste very bitter!' },
  fisher: { make: ['rawFish', 3], want: [['bread', 1]], done: 'Three fish from the great lake, caught this morning.' },
  'rice farmer': { make: ['riceBowl', 1], want: [['rawFish', 1]], done: 'Rice with fish and herbs: what we eat every day here.' },
  farmer: { make: ['tortilla', 3], want: [['apple', 1]], done: 'Warm maize tortillas, cooked on a clay griddle called a comal.' },
  'stone carver': { make: ['carvedStone', 4], want: [['stoneBricks', 4]], done: 'Carved stone with a pattern of rosettes, like the walls of the palace.' },
  'temple carver': { make: ['carvedStone', 4], want: [['stoneBricks', 4]], done: 'Carved sandstone, with a dancing apsara on it.' },
  'quarry worker': { make: ['limestone', 6], want: [['bread', 1]], done: 'Six blocks of limestone, cut with copper chisels and wooden wedges.' },
  gardener: { make: ['poppy', 3], want: [['wheat', 1]], done: 'Flowers from the king\'s garden. Shh, don\'t tell!' },
  'glass maker': { make: ['glass', 4], want: [['sand', 4]], done: 'Clear glass, melted from sand.' },
  scribe: { make: ['parchment', 2], want: [['leather', 1]], done: 'Two sheets of parchment, scraped smooth and ready for writing. Use a reed pen and ink made from soot.' },
  'purple dyer': { make: ['purpleCloth', 1], want: [['wool', 3]], done: 'Cloth dyed with Tyrian purple. It will never fade, and it smells of the sea!' },
  shipwright: { make: ['planks', 8], want: [['oakLog', 2]], done: 'Planks cut and shaped for you, the way we shape a ship\'s hull.' },
  carpenter: { make: ['door', 1], want: [['planks', 4]], done: 'A door that fits perfectly, held together with wooden joints, no nails!' },
  'beam painter': { make: ['redLacquer', 4], want: [['planks', 4]], done: 'Red lacquered wood, like the palace pillars. Each coat has to dry before the next.' },
  'millet farmer': { make: ['wheat', 4], want: [['apple', 2]], done: 'Grain from our fields. Millet porridge keeps you going all day.' },
  'paper maker': { make: ['paper', 4], want: [['planks', 1]], done: 'Four sheets of paper, made from beaten bark and rags. Paper was a Chinese invention!' },
  blacksmith: { make: ['ironIngot', 2], want: [['ironOre', 2], ['coal', 2]], done: 'Two bars of iron from my furnace. Our bellows are worked by a water wheel!' },
  'silk weaver': { make: ['silk', 1], want: [['wheat', 3]], done: 'Shu brocade! Silk with patterns woven right into it. Merchants carry it all the way to Rome.' },
  'salt worker': { make: ['salt', 3], want: [['bread', 1]], done: 'Salt from the brine wells, boiled in iron pans over gas fires.' },
  'tea farmer': { make: ['tea', 3], want: [['wheat', 1]], done: 'Fresh tea leaves from the misty hills. Pour hot water on them and drink!' },
};
