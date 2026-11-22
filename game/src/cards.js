// Emberfall — the card pool. Every card is an original design for this game:
// a cost in ember, an attack and a health for creatures, and a short rule text.
// Keywords: Guard (foes must attack this first), Swift (may attack at once),
// Kindle (does something the moment it is summoned).
export const CARDS = [
  { id: 'spark-imp', name: 'Spark Imp', kind: 'creature', cost: 1, attack: 2, health: 1, keyword: 'Swift', text: 'May attack at once.', art: 'imp', tint: '#ff9a3c' },
  { id: 'cinder-pup', name: 'Cinder Pup', kind: 'creature', cost: 1, attack: 1, health: 2, keyword: '', text: 'A loyal ember.', art: 'pup', tint: '#c98a4b' },
  { id: 'ember-hound', name: 'Ember Hound', kind: 'creature', cost: 2, attack: 3, health: 2, keyword: '', text: 'Runs ahead of the fire.', art: 'hound', tint: '#e06a2e' },
  { id: 'ash-guard', name: 'Ash Guard', kind: 'creature', cost: 2, attack: 1, health: 4, keyword: 'Guard', text: 'Foes must attack this first.', art: 'shield', tint: '#8d7fb8' },
  { id: 'flame-acolyte', name: 'Flame Acolyte', kind: 'creature', cost: 3, attack: 3, health: 3, keyword: '', text: 'Keeps the last flame.', art: 'acolyte', tint: '#ffb347' },
  { id: 'storm-crow', name: 'Storm Crow', kind: 'creature', cost: 3, attack: 2, health: 4, keyword: 'Swift', text: 'May attack at once.', art: 'crow', tint: '#7fb2d9' },
  { id: 'cinder-drake', name: 'Cinder Drake', kind: 'creature', cost: 4, attack: 4, health: 4, keyword: '', text: 'Its breath is smoke.', art: 'drake', tint: '#d84a35' },
  { id: 'molten-knight', name: 'Molten Knight', kind: 'creature', cost: 4, attack: 3, health: 5, keyword: 'Guard', text: 'Foes must attack this first.', art: 'knight', tint: '#b8b0a0' },
  { id: 'lava-golem', name: 'Lava Golem', kind: 'creature', cost: 5, attack: 5, health: 6, keyword: 'Guard', text: 'Foes must attack this first.', art: 'golem', tint: '#a04a2e' },
  { id: 'phoenix', name: 'Phoenix', kind: 'creature', cost: 5, attack: 5, health: 4, keyword: 'Swift', text: 'May attack at once.', art: 'phoenix', tint: '#ff5a7a' },
  { id: 'ember-colossus', name: 'Ember Colossus', kind: 'creature', cost: 6, attack: 7, health: 7, keyword: '', text: 'The mountain walks.', art: 'colossus', tint: '#8a5a2e' },
  { id: 'flame-matriarch', name: 'Flame Matriarch', kind: 'creature', cost: 6, attack: 6, health: 5, keyword: 'Kindle', text: 'On summon: deal 2 to the foe.', art: 'matriarch', tint: '#ffd76a' },
  { id: 'ember-burst', name: 'Ember Burst', kind: 'spell', cost: 2, attack: 0, health: 0, keyword: '', text: 'Deal 3 damage to any target.', art: 'burst', tint: '#ff7a2f' },
  { id: 'rekindle', name: 'Rekindle', kind: 'spell', cost: 2, attack: 0, health: 0, keyword: '', text: 'Draw 2 cards.', art: 'rekindle', tint: '#e8b64c' },
  { id: 'cinder-rain', name: 'Cinder Rain', kind: 'spell', cost: 4, attack: 0, health: 0, keyword: '', text: 'Deal 2 to all foe creatures.', art: 'rain', tint: '#8d7fb8' },
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}

// A match deck: two copies of every card, shuffled by the match rng.
export function buildDeck(rng) {
  const deck = [];
  for (const card of CARDS) {
    deck.push(card.id, card.id);
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}
