// Emberfall — the rules engine: match state, turns, summoning, combat and spells.
// This module knows nothing about drawing or input; it only mutates state and
// records what happened in the log, so the AI and the UI share one truth.
import {
  START_LIFE, MAX_EMBER, MAX_HAND, MAX_BOARD, START_HAND, FATIGUE_START,
} from './config.js';
import { cardById, buildDeck } from './cards.js';
import { mulberry32 } from './random.js';

let uidCounter = 1;

export function makeMinion(defId) {
  const def = cardById(defId);
  return {
    uid: uidCounter++,
    defId,
    name: def.name,
    cost: def.cost,
    attack: def.attack,
    health: def.health,
    maxHealth: def.health,
    keyword: def.keyword,
    art: def.art,
    tint: def.tint,
    canAttack: def.keyword === 'Swift',
    justSummoned: true,
  };
}

export function makePlayer(isAi, rng) {
  return {
    isAi,
    life: START_LIFE,
    ember: 0,
    maxEmber: 0,
    deck: buildDeck(rng),
    hand: [],
    board: [],
    fatigue: FATIGUE_START,
  };
}

// A fresh match. screen: 'title' until the player starts it.
export function newMatch(seed) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    rng,
    screen: 'title',
    turn: 0,
    active: 0, // 0 = player, 1 = rival
    phase: 'title',
    players: [makePlayer(false, rng), makePlayer(true, rng)],
    log: ['The last flame is lit. Two keepers step to the table.'],
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0 },
    winner: null,
    banner: '',
    bannerUntil: 0,
  };
  return state;
}

// Rebuild a match in place (same object, fresh decks), for Play Again.
export function resetMatch(state, seed) {
  const fresh = newMatch(seed);
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
}

export function me(state) {
  return state.players[0];
}

export function foe(state) {
  return state.players[1];
}

export function activePlayer(state) {
  return state.players[state.active];
}

export function inactivePlayer(state) {
  return state.players[1 - state.active];
}

export function pushLog(state, text) {
  state.log.push(text);
  if (state.log.length > 7) state.log.shift();
}

export function showBanner(state, text, now) {
  state.banner = text;
  state.bannerUntil = now + 1400;
}

export function drawCard(state, player) {
  if (player.deck.length === 0) {
    player.life -= player.fatigue;
    pushLog(state, `${player.isAi ? 'Cinder Warden' : 'You'} take ${player.fatigue} fatigue damage.`);
    player.fatigue += 1;
    return null;
  }
  const defId = player.deck.pop();
  if (player.hand.length >= MAX_HAND) {
    pushLog(state, `Hand is full — ${cardById(defId).name} burns away.`);
    return null;
  }
  player.hand.push({ defId, uid: uidCounter++ });
  return defId;
}

export function startMatch(state, now) {
  state.screen = 'play';
  state.phase = 'player';
  state.active = 0;
  state.turn = 1;
  const p = me(state);
  const r = foe(state);
  for (let i = 0; i < START_HAND; i++) drawCard(state, p);
  for (let i = 0; i < START_HAND; i++) drawCard(state, r);
  beginTurn(state, p, now);
}

export function beginTurn(state, player, now) {
  if (player.maxEmber < MAX_EMBER) player.maxEmber += 1;
  player.ember = player.maxEmber;
  for (const m of player.board) {
    m.canAttack = true;
    m.justSummoned = false;
  }
  drawCard(state, player);
  if (!player.isAi) {
    state.stats.turns = state.turn;
    showBanner(state, `Your turn — ${player.maxEmber} ember`, now);
  } else {
    showBanner(state, 'Cinder Warden takes the turn', now);
  }
  checkEnd(state);
}

export function endTurn(state, now) {
  if (state.screen !== 'play') return;
  state.active = 1 - state.active;
  if (state.active === 0) {
    state.turn += 1;
    state.phase = 'player';
    beginTurn(state, me(state), now);
  } else {
    state.phase = 'rival';
    beginTurn(state, foe(state), now);
  }
  checkEnd(state);
}

function sweepDead(state, player) {
  const before = player.board.length;
  player.board = player.board.filter((m) => m.health > 0);
  if (player.board.length < before) {
    pushLog(state, `${player.isAi ? 'Cinder Warden' : 'You'} lose a creature.`);
  }
}

export function damageMinion(state, player, minion, amount) {
  minion.health -= amount;
  if (minion.health < 0) minion.health = 0;
  sweepDead(state, player);
}

export function damageHero(state, player, amount) {
  player.life -= amount;
  if (player.life < 0) player.life = 0;
}

export function hasGuard(player) {
  return player.board.some((m) => m.keyword === 'Guard');
}

// Summon a creature from hand. Returns the minion or null.
export function summonCreature(state, player, handIndex) {
  const card = player.hand[handIndex];
  if (!card) return null;
  const def = cardById(card.defId);
  if (def.kind !== 'creature') return null;
  if (player.ember < def.cost) return null;
  if (player.board.length >= MAX_BOARD) return null;
  player.hand.splice(handIndex, 1);
  player.ember -= def.cost;
  const minion = makeMinion(card.defId);
  player.board.push(minion);
  state.stats.cardsPlayed += 1;
  pushLog(state, `${player.isAi ? 'Cinder Warden summons' : 'You summon'} ${def.name} (${def.attack}/${def.health}).`);
  if (def.keyword === 'Kindle') {
    const other = player.isAi ? me(state) : foe(state);
    damageHero(state, other, 2);
    pushLog(state, `${def.name} kindles — the foe takes 2 damage.`);
  }
  checkEnd(state);
  return minion;
}

// Cast a spell from hand. targetUid may be a minion uid, 'hero-me',
// 'hero-foe', or null for spells that need no target. Returns true on cast.
export function castSpell(state, player, handIndex, target) {
  const card = player.hand[handIndex];
  if (!card) return false;
  const def = cardById(card.defId);
  if (def.kind !== 'spell') return false;
  if (player.ember < def.cost) return false;
  if (def.id === 'ember-burst' && !target) return false;
  player.hand.splice(handIndex, 1);
  player.ember -= def.cost;
  state.stats.cardsPlayed += 1;
  const other = player.isAi ? me(state) : foe(state);
  if (def.id === 'ember-burst') {
    const amount = 3;
    if (target === 'hero-foe') {
      damageHero(state, other, amount);
      pushLog(state, `Ember Burst hits the foe for ${amount}.`);
    } else if (target === 'hero-me') {
      damageHero(state, player, amount);
      pushLog(state, `Ember Burst hits your own hero for ${amount}.`);
    } else {
      const owner = state.players.find((pl) => pl.board.some((m) => m.uid === target));
      if (!owner) return false;
      const minion = owner.board.find((m) => m.uid === target);
      damageMinion(state, owner, minion, amount);
      pushLog(state, `Ember Burst hits ${minion.name} for ${amount}.`);
    }
  } else if (def.id === 'rekindle') {
    drawCard(state, player);
    drawCard(state, player);
    pushLog(state, `${player.isAi ? 'Cinder Warden' : 'You'} draw 2 cards.`);
  } else if (def.id === 'cinder-rain') {
    const victims = [...other.board];
    for (const m of victims) damageMinion(state, other, m, 2);
    pushLog(state, `Cinder Rain falls — all foe creatures take 2.`);
  }
  checkEnd(state);
  return true;
}

// One creature attacks another, or the enemy hero ('hero').
export function attack(state, attacker, targetUid) {
  if (!attacker.canAttack) return false;
  const owner = me(state).board.includes(attacker) ? me(state) : foe(state);
  const enemy = owner === me(state) ? foe(state) : me(state);
  if (targetUid === 'hero') {
    if (hasGuard(enemy)) return false;
    attacker.canAttack = false;
    damageHero(state, enemy, attacker.attack);
    state.stats.damageDealt += attacker.attack;
    pushLog(state, `${attacker.name} strikes the foe for ${attacker.attack}.`);
  } else {
    const target = enemy.board.find((m) => m.uid === targetUid);
    if (!target) return false;
    if (hasGuard(enemy) && target.keyword !== 'Guard') return false;
    attacker.canAttack = false;
    const atk = attacker.attack;
    const back = target.attack;
    target.health -= atk;
    attacker.health -= back;
    state.stats.damageDealt += atk;
    pushLog(state, `${attacker.name} trades with ${target.name} (${atk} vs ${back}).`);
    sweepDead(state, enemy);
    sweepDead(state, owner);
  }
  checkEnd(state);
  return true;
}

export function checkEnd(state) {
  if (state.screen !== 'play') return;
  if (foe(state).life <= 0 && me(state).life <= 0) {
    state.screen = 'lost';
    state.winner = 'draw';
  } else if (foe(state).life <= 0) {
    state.screen = 'won';
    state.winner = 'player';
  } else if (me(state).life <= 0) {
    state.screen = 'lost';
    state.winner = 'rival';
  }
  if (state.screen === 'won') pushLog(state, 'Victory — the last flame endures.');
  if (state.screen === 'lost') pushLog(state, 'Defeat — the flame fades.');
}
