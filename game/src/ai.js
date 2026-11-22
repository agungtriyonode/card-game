// Emberfall — the rival brain: Cinder Warden.
// Plans one action at a time from the live state, so the main loop can play
// each move out with a pause the player can follow. The rival reads the board:
// it spends ember on the best creature it can afford, answers a wide board
// with Cinder Rain, draws when its hand runs dry, takes the trades that kill
// without dying, and goes for the face when the numbers say lethal.
import { cardById } from './cards.js';
import { me, foe, hasGuard } from './state.js';

function creatureScore(def, state) {
  let score = def.attack + def.health;
  if (def.keyword === 'Guard') score += 1.5;
  if (def.keyword === 'Swift') score += 1;
  if (def.keyword === 'Kindle') score += 1;
  // A guard is worth more when the player's attackers are already on the table.
  const threat = me(state).board.reduce((sum, m) => sum + (m.canAttack ? m.attack : 0), 0);
  if (def.keyword === 'Guard' && threat >= 4) score += 2;
  return score;
}

function findMinion(state, uid) {
  for (const p of state.players) {
    const m = p.board.find((x) => x.uid === uid);
    if (m) return m;
  }
  return null;
}

// One next action for the rival, or { type: 'end' } when its turn is done.
export function planNextAction(state) {
  const ai = foe(state);
  const player = me(state);

  // --- Spells first, when the moment is right. ---
  for (let i = 0; i < ai.hand.length; i++) {
    const def = cardById(ai.hand[i].defId);
    if (def.kind !== 'spell' || ai.ember < def.cost) continue;
    if (def.id === 'rekindle' && ai.hand.length <= 2) {
      return { type: 'play', handIndex: i, target: null };
    }
    if (def.id === 'cinder-rain' && player.board.length >= 2) {
      return { type: 'play', handIndex: i, target: null };
    }
    if (def.id === 'ember-burst') {
      if (player.life <= 3) {
        return { type: 'play', handIndex: i, target: 'hero-foe' };
      }
      const big = [...player.board].sort((a, b) => b.attack - a.attack)[0];
      if (big && big.attack >= 4 && big.health <= 3) {
        return { type: 'play', handIndex: i, target: big.uid };
      }
    }
  }

  // --- Then the best creature the ember allows. ---
  let bestIndex = -1;
  let bestScore = 0;
  for (let i = 0; i < ai.hand.length; i++) {
    const def = cardById(ai.hand[i].defId);
    if (def.kind !== 'creature' || ai.ember < def.cost) continue;
    const score = creatureScore(def, state);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  if (bestIndex >= 0 && ai.board.length < 5) {
    return { type: 'play', handIndex: bestIndex, target: null };
  }

  // --- Then attacks, one minion at a time. ---
  const ready = ai.board.filter((m) => m.canAttack);
  if (ready.length > 0) {
    const guards = player.board.filter((m) => m.keyword === 'Guard');
    const faceDamage = ready.reduce((sum, m) => sum + m.attack, 0);
    if (guards.length === 0 && faceDamage >= player.life) {
      return { type: 'attack', attackerUid: ready[0].uid, targetUid: 'hero' };
    }
    for (const attacker of ready) {
      if (guards.length > 0) {
        // Must answer a guard: only a kill that survives is worth it.
        const killable = guards.find((g) => attacker.attack >= g.health && attacker.health > g.attack);
        if (killable) return { type: 'attack', attackerUid: attacker.uid, targetUid: killable.uid };
        continue;
      }
      // A clean trade: kill without dying.
      const prey = player.board.find((t) => attacker.attack >= t.health && attacker.health > t.attack);
      if (prey) return { type: 'attack', attackerUid: attacker.uid, targetUid: prey.uid };
      // Nothing worth trading with: hit the face.
      return { type: 'attack', attackerUid: attacker.uid, targetUid: 'hero' };
    }
  }

  return { type: 'end' };
}

export { findMinion };
