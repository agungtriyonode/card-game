// Emberfall — bootstrap: canvas, game loop, and the rival's turn driver.
// The loop draws every frame, ages the effects, and steps the Cinder Warden
// one planned action at a time so its turn reads like a real opponent's.
import { VIEW_W, VIEW_H } from './config.js';
import { newMatch, endTurn, summonCreature, castSpell, attack, me, foe } from './state.js';
import { planNextAction, findMinion } from './ai.js';
import { drawGame, layoutBoard, heroRect } from './render.js';
import { createUi, handleClick, handleKey } from './input.js';
import { createFx, tickFx, spawnFloater, addShake } from './anim.js';
import { freshSeed } from './random.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

canvas.width = VIEW_W;
canvas.height = VIEW_H;

const query = new URLSearchParams(location.search);
const state = newMatch(freshSeed());
const ui = createUi();
const fx = createFx();
applyShot(state, query);

// Exposed for headless playtests: window.__game.state drives assertions.
window.__game = { state, ui, fx };

const AI_STEP_MS = 650;
const AI_MAX_ACTIONS = 40;
let aiActions = 0;
let nextAiAt = 0;

function runAiAction(now) {
  if (state.screen !== 'play' || state.phase !== 'rival') return;
  if (aiActions >= AI_MAX_ACTIONS) {
    endTurn(state, now);
    return;
  }
  const action = planNextAction(state);
  aiActions += 1;
  if (action.type === 'end') {
    endTurn(state, now);
    aiActions = 0;
    return;
  }
  const ai = foe(state);
  if (action.type === 'play') {
    const before = ai.board.length;
    const card = ai.hand[action.handIndex];
    if (card && card.defId) {
      if (card.defId === 'ember-burst' || card.defId === 'rekindle' || card.defId === 'cinder-rain') {
        castSpell(state, ai, action.handIndex, action.target ?? null);
      } else {
        const minion = summonCreature(state, ai, action.handIndex);
        if (minion && ai.board.length > before) {
          const slot = layoutBoard(state, 1).find((s) => s.minion.uid === minion.uid);
          if (slot) spawnFloater(fx, slot.x + 59, slot.y - 6, minion.name, '#8d7fb8');
        }
      }
    }
  } else if (action.type === 'attack') {
    const attacker = findMinion(state, action.attackerUid);
    if (attacker) {
      const beforeLife = me(state).life;
      if (action.targetUid === 'hero') {
        attacker.lunge = { x: heroRect(0).cx, y: heroRect(0).cy, until: now + 180 };
      }
      attack(state, attacker, action.targetUid);
      if (action.targetUid === 'hero' && me(state).life < beforeLife) {
        const rect = heroRect(0);
        spawnFloater(fx, rect.cx, rect.cy - 60, `-${attacker.attack}`, '#ff5a4e');
        addShake(fx, 5);
      }
    }
  }
}

function frame(now) {
  tickFx(fx, now);
  if (state.screen === 'play' && state.phase === 'rival') {
    if (now >= nextAiAt) {
      runAiAction(now);
      nextAiAt = now + AI_STEP_MS;
    }
  } else {
    aiActions = 0;
    nextAiAt = now + AI_STEP_MS;
  }
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawGame(ctx, state, ui, fx, now);
  updateStatus();
  requestAnimationFrame(frame);
}

function updateStatus() {
  const p = me(state);
  const r = foe(state);
  statusEl.textContent =
    state.screen === 'title'
      ? 'Emberfall title screen. Press Enter to play.'
      : state.screen === 'won'
        ? 'Victory. The last flame endures.'
        : state.screen === 'lost'
          ? 'Defeat. The flame fades.'
          : `Turn ${state.turn}. Your life ${p.life}, Warden life ${r.life}. ` +
            `Ember ${p.ember} of ${p.maxEmber}. Hand ${p.hand.length} cards. ` +
            `${state.phase === 'player' ? 'Your move.' : 'Warden is thinking.'}`;
}

function toViewCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

canvas.addEventListener('click', (event) => {
  const { x, y } = toViewCoords(event);
  handleClick(state, ui, x, y, performance.now(), fx);
});

canvas.addEventListener('mousemove', (event) => {
  const { x, y } = toViewCoords(event);
  ui.mouse = { x, y };
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  handleKey(state, ui, event.key, performance.now(), fx);
});

requestAnimationFrame(frame);
