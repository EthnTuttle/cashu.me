/**
 * Shared game logic utilities for consistent unit properties across components
 */

// Consistent hash function
export const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Consistent element system (using Arsenal's 8-element system)
export const GAME_ELEMENTS = ['Fire', 'Ice', 'Earth', 'Air', 'Lightning', 'Light', 'Shadow', 'Void'];

// Unit type names by amount
export const UNIT_TYPES = {
  1: 'Goblin Skirmisher',
  2: 'Kobold Trickster', 
  4: 'Pixie Scout',
  8: 'Orcish Berserker',
  16: 'Elvish Ranger',
  32: 'Dwarvish Warrior',
  64: 'Human Paladin',
  128: 'Dragon Knight',
  256: 'Arcane Mage',
  512: 'Shadow Assassin',
  1024: 'Frost Giant',
  2048: 'Phoenix Guardian',
  4096: 'Void Stalker',
  8192: 'Crystal Warden',
  16384: 'Storm Elemental',
  32768: 'Demon Lord',
  65536: 'Angel of War',
  131072: 'Titan Slayer',
  262144: 'Cosmic Dragon',
  524288: 'Reality Bender',
  1048576: 'Infinity Weaver'
};

// Unit type icons
export const UNIT_TYPE_ICONS = {
  1: 'psychology', 2: 'smart_toy', 4: 'flutter_dash', 8: 'local_fire_department',
  16: 'nature_people', 32: 'hardware', 64: 'security', 128: 'whatshot',
  256: 'auto_awesome', 512: 'visibility_off', 1024: 'ac_unit', 2048: 'local_fire_department',
  4096: 'dark_mode', 8192: 'diamond', 16384: 'flash_on', 32768: 'dangerous',
  65536: 'light_mode', 131072: 'military_tech', 262144: 'pets', 524288: 'blur_on',
  1048576: 'all_inclusive'
};

// Element colors
export const ELEMENT_COLORS = {
  'Fire': 'red',
  'Ice': 'cyan', 
  'Earth': 'brown',
  'Air': 'light-blue',
  'Lightning': 'yellow',
  'Light': 'amber',
  'Shadow': 'deep-purple',
  'Void': 'black'
};

// Element icons
export const ELEMENT_ICONS = {
  'Fire': 'local_fire_department',
  'Ice': 'ac_unit',
  'Earth': 'terrain', 
  'Air': 'air',
  'Lightning': 'flash_on',
  'Light': 'light_mode',
  'Shadow': 'dark_mode',
  'Void': 'blur_on'
};

// Shared unit property functions
export const getUnitPower = (proof) => {
  const hash = hashString(proof.C.substring(0, 16));
  return Math.floor((hash % 50) + (proof.amount * 2) + 10);
};

export const getUnitDefense = (proof) => {
  const hash = hashString(proof.C.substring(16, 32));
  return Math.floor((hash % 40) + (proof.amount * 1.5) + 8);
};

export const getUnitElement = (proof) => {
  const hash = hashString(proof.C.substring(8, 24));
  return GAME_ELEMENTS[hash % GAME_ELEMENTS.length];
};

export const getUnitRarity = (proof) => {
  const hash = hashString(proof.C.substring(32, 48));
  const rand = hash % 100;
  
  if (rand < 50) return 'Common';
  if (rand < 75) return 'Uncommon';
  if (rand < 90) return 'Rare';
  if (rand < 98) return 'Epic';
  return 'Legendary';
};

export const getUnitTypeName = (amount) => {
  if (UNIT_TYPES[amount]) return UNIT_TYPES[amount];
  
  // Dynamic naming for unlisted amounts
  const hash = hashString(amount.toString());
  const tier = Math.floor(Math.log2(amount));
  
  const prefixes = ['Ancient', 'Divine', 'Legendary', 'Mythical', 'Eternal', 'Celestial', 'Primordial', 'Transcendent'];
  const creatures = ['Behemoth', 'Leviathan', 'Sovereign', 'Overlord', 'Emperor', 'Destroyer', 'Annihilator', 'Godslayer'];
  
  const prefix = prefixes[hash % prefixes.length];
  const creature = creatures[(hash >> 3) % creatures.length];
  
  return `${prefix} ${creature}`;
};

export const getUnitTypeIcon = (amount) => {
  return UNIT_TYPE_ICONS[amount] || 'star';
};

export const getUnitTypeColor = (amount) => {
  const colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange'];
  const hash = hashString(amount.toString());
  return colors[hash % colors.length];
};

export const getElementColor = (element) => {
  return ELEMENT_COLORS[element] || 'grey';
};

export const getElementIcon = (element) => {
  return ELEMENT_ICONS[element] || 'star';
};

export const getRarityColor = (rarity) => {
  const colors = {
    'Legendary': 'orange',
    'Epic': 'purple',
    'Rare': 'blue',
    'Uncommon': 'green', 
    'Common': 'grey'
  };
  return colors[rarity] || 'grey';
};

export const getUnitName = (proof) => {
  const hash = hashString(proof.secret);
  const instanceNum = (hash % 999) + 1;
  return `${getUnitTypeName(proof.amount)} #${instanceNum}`;
};

// Kingdom Age functions (based on keyset ID)
export const getKingdomAgeName = (keysetId) => {
  // Use first few characters of keyset ID to determine era
  const hash = keysetId.substring(0, 4).toLowerCase();
  const hashNum = parseInt(hash, 16) % 8;
  
  const ages = [
    'Dawn Era',
    'Golden Age', 
    'Silver Age',
    'Bronze Age',
    'Iron Age',
    'Shadow Age',
    'Crystal Age',
    'Void Age'
  ];
  
  return ages[hashNum];
};

export const getKingdomAgeColor = (keysetId) => {
  const hash = keysetId.substring(0, 4).toLowerCase();
  const hashNum = parseInt(hash, 16) % 8;
  
  const colors = [
    'pink',
    'amber', 
    'blue-grey',
    'brown',
    'grey',
    'deep-purple',
    'cyan',
    'black'
  ];
  
  return colors[hashNum];
};

// Unit instance functions
export const getUnitInstance = (proof) => {
  // Use secret to generate a unique identifier
  const hash = proof.secret.substring(0, 6);
  const hashNum = parseInt(hash, 16) % 999 + 1;
  return `#${hashNum.toString().padStart(3, '0')}`;
};

export const getUnitStatusIcon = (proof) => {
  return proof.reserved ? 'local_fire_department' : 'check_circle';
};

// Unit type description (Arsenal-specific)
export const getUnitTypeDescription = (amount) => {
  const descriptions = {
    1: 'Cunning raiders from the dark forests, masters of hit-and-run tactics',
    2: 'Clever trap-makers who use wit over strength to overcome foes',
    4: 'Magical scouts that phase between dimensions to gather intelligence',
    8: 'Savage warriors driven by bloodlust and tribal fury',
    16: 'Elite marksmen with centuries of woodland combat experience',
    32: 'Stalwart defenders forged in the mountain halls of their ancestors',
    64: 'Holy warriors sworn to uphold justice and divine law',
    128: 'Reborn warriors wreathed in eternal flames of righteousness',
    256: 'Mages who command the very forces of nature itself',
    512: 'Silent killers who strike from the realm of shadows',
    1024: 'Ancient giants from the frozen peaks, masters of ice magic',
    2048: 'Primordial dragons with millennia of accumulated power',
    4096: 'Hunters from the spaces between stars and reality',
    8192: 'Primal beings from the dawn of creation itself',
    16384: 'Rulers of magical realms with dominion over arcane forces',
    32768: 'Infernal princes commanding legions of the damned',
    65536: 'Divine warriors leading the celestial armies of light',
    131072: 'Colossal beings who stride across entire planes of existence',
    262144: 'Architects of reality capable of rewriting the laws of physics',
    524288: 'Transcendent entities who travel between parallel universes',
    1048576: 'The ultimate weavers of fate and architects of infinity'
  };
  
  if (descriptions[amount]) {
    return descriptions[amount];
  }
  
  // Dynamic descriptions for unlisted amounts
  if (amount < 10) return `Mischievous fey creatures with unpredictable magical abilities worth ${amount} mana each`;
  if (amount < 50) return `Versatile spellcasters combining martial prowess with arcane knowledge worth ${amount} mana each`;
  if (amount < 100) return `Fearsome creatures bred for war and destruction worth ${amount} mana each`;
  if (amount < 500) return `Interdimensional protectors maintaining cosmic balance worth ${amount} mana each`;
  if (amount < 1000) return `Mythical embodiments of pure power worth ${amount} mana each`;
  if (amount < 5000) return `Cosmic entities transcending mortal understanding worth ${amount} mana each`;
  return `Omnipotent beings wielding infinite power worth ${amount} mana each`;
};