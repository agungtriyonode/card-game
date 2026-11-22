// Emberfall — screenshot presets for ?shot=title|table|win|lose&seed=N.
// Each preset rebuilds the same table from a fixed seed, so the four
// screenshots are reproducible renders of the real game, never composites.
import {
  newMatch, resetMatch, startMatch, makeMinion, damageHero, checkEnd, me, foe,
} from './state.js';

function setTable(state) {
  const p = me(state);
  const r = foe(state);
  p.board = ['ember-hound', 'ash-guard', 'flame-acolyte'].map((id) => makeMinion(id));
  r.board = ['cinder-drake', 'molten-knight'].map((id) => makeMinion(id));
  for (const m of p.board) m.canAttack = true;
  for (const m of r.board) m.canAttack = false;
  p.hand = ['phoenix', 'ember-burst', 'rekindle', 'cinder-rain', 'spark-imp']
    .map((defId, i) => ({ defId, uid: 2000 + i }));
  r.hand = ['lava-golem', 'storm-crow', 'ember-hound', 'ash-guard']
    .map((defId, i) => ({ defId, uid: 2100 + i }));
  p.life = 24;
  r.life = 18;
  p.ember = 5;
  p.maxEmber = 6;
  r.ember = 3;
  r.maxEmber = 5;
  state.turn = 5;
  state.phase = 'player';
  state.banner = '';
  state.stats = { turns: 5, cardsPlayed: 5, damageDealt: 8 };
  state.log = [
    'You summon Flame Acolyte (3/3).',
    'Cinder Warden summons Cinder Drake (4/4).',
    'Ember Hound strikes the foe for 3.',
    'Your turn — 6 ember',
  ];
}

// Returns true when a preset was applied.
export function applyShot(state, query) {
  const shot = query.get('shot');
  if (!shot) return false;
  const seed = Number(query.get('seed') || 7);
  resetMatch(state, seed);
  if (shot === 'title') return true;
  startMatch(state, 0);
  if (shot === 'table') {
    setTable(state);
    return true;
  }
  if (shot === 'win') {
    setTable(state);
    damageHero(state, foe(state), foe(state).life);
    checkEnd(state);
    return true;
  }
  if (shot === 'lose') {
    setTable(state);
    damageHero(state, me(state), me(state).life);
    checkEnd(state);
    return true;
  }
  return false;
}

export { newMatch };
