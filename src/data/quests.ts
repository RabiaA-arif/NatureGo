import { Quest } from '../types/nature';

export const INITIAL_QUESTS: Quest[] = [
  // Trees & Woods
  {
    id: 'quest-leaf',
    target: 'green leaf',
    category: 'forest',
    title: 'Green Leaf',
    description: 'Find a real green leaf outside on a tree, bush, or plant in natural daylight.',
    iconName: 'Leaf',
    difficulty: 'easy',
    hints: [
      'Look for healthy green leaves on trees or bushes',
      'Make sure it is growing outside in natural daylight',
    ],
  },
  {
    id: 'quest-bark',
    target: 'tree bark',
    category: 'forest',
    title: 'Tree Bark',
    description: 'Get a clear close-up of rough, textured bark on a live outdoor tree.',
    iconName: 'TreePine',
    difficulty: 'easy',
    hints: [
      'Look for deep grooves, moss, or rings on the trunk',
      'Oak, pine, or birch trees all have great bark textures',
    ],
  },
  {
    id: 'quest-pinecone',
    target: 'pinecone',
    category: 'forest',
    title: 'Pinecone',
    description: 'Find a real pinecone on the ground or hanging from an evergreen tree branch.',
    iconName: 'Trees',
    difficulty: 'medium',
    hints: [
      'Look around the base of pine, spruce, or fir trees',
      'Check for open woody scales resting in dirt or needles',
    ],
  },
  {
    id: 'quest-acorn',
    target: 'wild acorn or oak nut',
    category: 'forest',
    title: 'Acorn Nut',
    description: 'Find a wild fallen acorn or oak nut resting on the outdoor ground.',
    iconName: 'TreePine',
    difficulty: 'medium',
    hints: [
      'Search beneath oak trees on dirt paths or grass',
      'Look for the smooth brown nut with its little textured cap',
    ],
  },
  {
    id: 'quest-fern',
    target: 'wild outdoor fern frond',
    category: 'forest',
    title: 'Wild Fern',
    description: 'Find a feathery green fern growing in shaded outdoor woods or a garden.',
    iconName: 'Leaf',
    difficulty: 'medium',
    hints: [
      'Look in shaded, damp spots near trees or logs',
      'Notice the repeating leafy fronds',
    ],
  },
  {
    id: 'quest-pineneedles',
    target: 'pine needle bed on forest floor',
    category: 'forest',
    title: 'Pine Needles',
    description: 'Find a bed of fallen pine needles on the ground under evergreen trees.',
    iconName: 'Trees',
    difficulty: 'easy',
    hints: [
      'Check beneath pine trees for the brown needle carpet',
    ],
  },
  {
    id: 'quest-mushroom',
    target: 'wild woodland mushroom or tree fungus',
    category: 'forest',
    title: 'Wild Mushroom',
    description: 'Spot a mushroom or shelf fungus growing on outdoor logs, bark, or damp soil.',
    iconName: 'Sparkles',
    difficulty: 'hard',
    hints: [
      'Look on old tree stumps or damp soil',
      'Remember: only take photos, never touch or eat wild mushrooms',
    ],
  },

  // Sky & Water
  {
    id: 'quest-water',
    target: 'running water',
    category: 'water_sky',
    title: 'Moving Water',
    description: 'Find outdoor flowing water in a stream, pond edge, creek, or fountain.',
    iconName: 'Droplets',
    difficulty: 'medium',
    hints: [
      'Look for ripples or moving water under the open sky',
    ],
  },
  {
    id: 'quest-sky',
    target: 'sky and clouds',
    category: 'water_sky',
    title: 'Clouds in the Sky',
    description: 'Point your camera up at the open sky to capture natural clouds or daylight.',
    iconName: 'CloudSun',
    difficulty: 'easy',
    hints: [
      'Step outside into open space and look straight up',
      'Capture fluffy white clouds or blue open sky',
    ],
  },
  {
    id: 'quest-pebble',
    target: 'smooth river pebble or stream stone',
    category: 'water_sky',
    title: 'Smooth River Stone',
    description: 'Find a smooth, rounded pebble or stone by water or outdoor gravel.',
    iconName: 'Droplets',
    difficulty: 'easy',
    hints: [
      'Look for naturally tumbled stones smoothed by water',
    ],
  },
  {
    id: 'quest-horizon',
    target: 'outdoor golden hour sunlight or twilight sky',
    category: 'water_sky',
    title: 'Sunlight & Horizon',
    description: 'Capture warm outdoor sunlight, sunrise, or golden sunset light outside.',
    iconName: 'CloudSun',
    difficulty: 'medium',
    hints: [
      'Best in morning or late afternoon when light is warm and soft',
    ],
  },

  // Flowers & Meadow
  {
    id: 'quest-flower',
    target: 'wildflower or dandelion',
    category: 'meadow',
    title: 'Wildflower or Dandelion',
    description: 'Spot a real flower or yellow dandelion blooming outdoors in the dirt or grass.',
    iconName: 'Flower2',
    difficulty: 'easy',
    hints: [
      'Check lawns, park meadows, or sidewalk edges',
      'Must be growing outdoors in real earth',
    ],
  },
  {
    id: 'quest-tallgrass',
    target: 'wild prairie grass seed head',
    category: 'meadow',
    title: 'Tall Wild Grass',
    description: 'Find tall wild grass with visible seed heads waving in the outdoor breeze.',
    iconName: 'Leaf',
    difficulty: 'easy',
    hints: [
      'Look along fields or trail edges for feathery grass tops',
    ],
  },
  {
    id: 'quest-soil',
    target: 'earth soil and dirt',
    category: 'meadow',
    title: 'Outdoor Soil & Dirt',
    description: 'Get a clear photo of real outdoor dirt, dark soil, or ground.',
    iconName: 'Compass',
    difficulty: 'easy',
    hints: [
      'Find natural outdoor earth with bits of leaves or pebbles',
    ],
  },
  {
    id: 'quest-feather',
    target: 'wild bird feather in ground or grass',
    category: 'meadow',
    title: 'Bird Feather',
    description: 'Spot a real bird feather resting on the ground, in grass, or on a trail.',
    iconName: 'Sparkles',
    difficulty: 'hard',
    hints: [
      'Keep your eyes open near park trees, pond banks, or dirt paths',
    ],
  },
  {
    id: 'quest-pollinator',
    target: 'outdoor bee or pollinator on blossom',
    category: 'meadow',
    title: 'Bee or Butterfly',
    description: 'Watch a live bee or butterfly visiting outdoor flowers.',
    iconName: 'Flower2',
    difficulty: 'hard',
    hints: [
      'Watch blooming bushes quietly on sunny days',
    ],
  },

  // Tiny Finds
  {
    id: 'quest-moss',
    target: 'moss on stone',
    category: 'micro_nature',
    title: 'Moss on a Rock',
    description: 'Find soft green moss growing on a shady rock, boulder, or brick.',
    iconName: 'Sparkles',
    difficulty: 'medium',
    hints: [
      'Look in shaded, damp spots near trees or garden walls',
    ],
  },
  {
    id: 'quest-dewdrops',
    target: 'morning dew drops on plant petal',
    category: 'micro_nature',
    title: 'Morning Dewdrops',
    description: 'Find tiny drops of water or morning dew resting on grass or plant leaves.',
    iconName: 'Droplets',
    difficulty: 'medium',
    hints: [
      'Best early in the morning or right after light rain',
    ],
  },
  {
    id: 'quest-spiderweb',
    target: 'outdoor spiderweb or dew-covered web',
    category: 'micro_nature',
    title: 'Outdoor Spiderweb',
    description: 'Spot a spiderweb woven between tree branches, bushes, or fence rails.',
    iconName: 'Sparkles',
    difficulty: 'hard',
    hints: [
      'Look where morning light catches the thin silk lines',
    ],
  },
  {
    id: 'quest-snail',
    target: 'wild outdoor snail shell',
    category: 'micro_nature',
    title: 'Snail or Shell',
    description: 'Find a garden snail or snail shell in damp outdoor soil or near plants.',
    iconName: 'Compass',
    difficulty: 'medium',
    hints: [
      'Check under damp flower pots, garden stones, or shady leaves',
    ],
  },
];
