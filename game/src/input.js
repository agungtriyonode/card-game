// Emberfall — mouse and keyboard: turns clicks and keys into rules calls.
// The player clicks a hand card to play it, clicks a ready creature and then
// a foe to attack, and ends the turn with the button, Space or Enter.
import { cardById } from './cards.js';
import {
  me, foe, summonCreature, castSpell, attack, endTurn, startMatch, resetMatch,
} from './state.js';
import {
  layoutHand, layoutBoard, heroRect, endTurnRect,
} from './render.js';
import { spawnFloater, addShake } from './anim.js';
import { freshSeed } from './random.js';

export function createUi() {
  return {
    selected: null, // { type: 'hand', index } | { type: 'minion', uid }
    targeting: null, // { kind: 'attack', uid } | { kind: 'burst', handIndex }
    mouse: { x: 0, y: 0 },
  };
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function inCircle(x, y, c) {
  const dx = x - c.cx;
  const dy = y - c.cy;
  return dx * dx + dy * dy <= c.r * c.r;
}

function tryPlayHandCard(state, ui, handIndex, now, fx) {
  const player = me(state);
  const card = player.hand[handIndex];
  if (!card) return false;
  const def = cardById(card.defId);
  if (state.phase !== 'player' || state.screen !== 'play') return false;
  if (player.ember < def.cost) {
    spawnFloater(fx, 640, 560, 'Not enough ember', '#ff5a4e');
    return false;
  }
  if (def.kind === 'creature') {
    if (player.board.length >= 5) {
      spawnFloater(fx, 640, 560, 'Board is full', '#ff5a4e');
      return false;
    }
    const minion = summonCreature(state, player, handIndex);
    if (minion) {
      const slot = layoutBoard(state, 0).find((s) => s.minion.uid === minion.uid);
      if (slot) spawnFloater(fx, slot.x + 59, slot.y - 6, def.name, '#e8b64c');
    }
    ui.selected = null;
    ui.targeting = null;
    return true;
  }
  // Spells: the ones without a target fire at once; Ember Burst arms targeting.
  if (def.id === 'ember-burst') {
    ui.selected = { type: 'hand', index: handIndex };
    ui.targeting = { kind: 'burst', handIndex };
    return true;
  }
  castSpell(state, player, handIndex, null);
  ui.selected = null;
  ui.targeting = null;
  return true;
}

function tryAttackTarget(state, ui, targetUid, now, fx) {
  const attacker = me(state).board.find((m) => m.uid === ui.targeting.uid);
  if (!attacker) {
    ui.targeting = null;
    return false;
  }
  const beforeFoeLife = foe(state).life;
  const ok = attack(state, attacker, targetUid);
  if (ok) {
    if (targetUid === 'hero') {
      const rect = heroRect(1);
      spawnFloater(fx, rect.cx, rect.cy - 60, `-${attacker.attack}`, '#ff5a4e');
      addShake(fx, 5);
    } else {
      const slot = layoutBoard(state, 1).find((s) => s.minion.uid === targetUid);
      if (slot) spawnFloater(fx, slot.x + 59, slot.y - 6, `-${attacker.attack}`, '#ff5a4e');
    }
    if (foe(state).life < beforeFoeLife) addShake(fx, 3);
  }
  ui.selected = null;
  ui.targeting = null;
  return ok;
}

function tryBurstTarget(state, ui, target, now, fx) {
  const player = me(state);
  const ok = castSpell(state, player, ui.targeting.handIndex, target);
  if (ok) {
    if (target === 'hero-foe') {
      const rect = heroRect(1);
      spawnFloater(fx, rect.cx, rect.cy - 60, '-3', '#ff5a4e');
      addShake(fx, 5);
    } else if (typeof target === 'number') {
      const slot = layoutBoard(state, 1).find((s) => s.minion.uid === target)
        || layoutBoard(state, 0).find((s) => s.minion.uid === target);
      if (slot) spawnFloater(fx, slot.x + 59, slot.y - 6, '-3', '#ff5a4e');
    }
  }
  ui.selected = null;
  ui.targeting = null;
  return ok;
}

export function handleClick(state, ui, x, y, now, fx) {
  ui.mouse = { x, y };
  if (state.screen === 'title') {
    startMatch(state, now);
    return;
  }
  if (state.screen === 'won' || state.screen === 'lost') {
    resetMatch(state, freshSeed());
    startMatch(state, now);
    return;
  }
  if (state.screen !== 'play' || state.phase !== 'player') return;

  // A target is armed: the click must land on a legal target or cancel.
  if (ui.targeting) {
    if (ui.targeting.kind === 'attack') {
      if (inCircle(x, y, heroRect(1))) {
        tryAttackTarget(state, ui, 'hero', now, fx);
        return;
      }
      for (const slot of layoutBoard(state, 1)) {
        if (inRect(x, y, slot)) {
          tryAttackTarget(state, ui, slot.minion.uid, now, fx);
          return;
        }
      }
      ui.targeting = null;
      ui.selected = null;
      return;
    }
    if (ui.targeting.kind === 'burst') {
      if (inCircle(x, y, heroRect(1))) {
        tryBurstTarget(state, ui, 'hero-foe', now, fx);
        return;
      }
      if (inCircle(x, y, heroRect(0))) {
        tryBurstTarget(state, ui, 'hero-me', now, fx);
        return;
      }
      for (const who of [1, 0]) {
        for (const slot of layoutBoard(state, who)) {
          if (inRect(x, y, slot)) {
            tryBurstTarget(state, ui, slot.minion.uid, now, fx);
            return;
          }
        }
      }
      ui.targeting = null;
      ui.selected = null;
      return;
    }
  }

  // End turn button.
  if (inRect(x, y, endTurnRect())) {
    endTurn(state, now);
    return;
  }

  // Own board: pick a ready creature to attack with.
  for (const slot of layoutBoard(state, 0)) {
    if (inRect(x, y, slot)) {
      if (slot.minion.canAttack) {
        ui.selected = { type: 'minion', uid: slot.minion.uid };
        ui.targeting = { kind: 'attack', uid: slot.minion.uid };
      } else {
        spawnFloater(fx, slot.x + 59, slot.y - 6, 'Tired', '#c9b69a');
      }
      return;
    }
  }

  // Hand: play the card under the cursor.
  const hand = layoutHand(state, 0);
  for (let i = hand.length - 1; i >= 0; i--) {
    if (inRect(x, y, hand[i])) {
      tryPlayHandCard(state, ui, i, now, fx);
      return;
    }
  }

  ui.selected = null;
  ui.targeting = null;
}

export function handleKey(state, ui, key, now, fx) {
  if (key === 'Enter' || key === ' ') {
    if (state.screen === 'title') {
      startMatch(state, now);
      return;
    }
    if (state.screen === 'play' && state.phase === 'player') {
      ui.selected = null;
      ui.targeting = null;
      endTurn(state, now);
    }
    return;
  }
  if (key === 'Escape') {
    ui.selected = null;
    ui.targeting = null;
    return;
  }
  if ((key === 'r' || key === 'R') && (state.screen === 'won' || state.screen === 'lost')) {
    resetMatch(state, freshSeed());
    startMatch(state, now);
    return;
  }
  if (state.screen === 'play' && state.phase === 'player' && /^[1-7]$/.test(key)) {
    const index = Number(key) - 1;
    if (index < me(state).hand.length) tryPlayHandCard(state, ui, index, now, fx);
  }
}
