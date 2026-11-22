// Emberfall — everything the eye sees: the table, the heroes, the cards,
// the title screen and the win/loss overlays, all drawn on one canvas.
// It also owns the geometry: input.js asks this module where things are
// so a click lands on the same card the player sees.
import {
  VIEW_W, VIEW_H, CARD_W, CARD_H, BOARD_CARD_W, BOARD_CARD_H, CARD_GAP,
  ENEMY_HAND_Y, ENEMY_BOARD_Y, PLAYER_BOARD_Y, PLAYER_HAND_Y,
  ENEMY_HERO, PLAYER_HERO, HERO_R, COLORS,
} from './config.js';
import { cardById } from './cards.js';
import { me, foe } from './state.js';
import { slideTo, easeOut } from './anim.js';

export function heroRect(who) {
  const c = who === 0 ? PLAYER_HERO : ENEMY_HERO;
  return { x: c.x - HERO_R, y: c.y - HERO_R, w: HERO_R * 2, h: HERO_R * 2, cx: c.x, cy: c.y, r: HERO_R };
}

export function endTurnRect() {
  return { x: 1064, y: 690, w: 180, h: 52 };
}

function rowSlots(count, y, w, gap) {
  const total = count * w + (count - 1) * gap;
  const startX = (VIEW_W - total) / 2;
  const slots = [];
  for (let i = 0; i < count; i++) slots.push({ x: startX + i * (w + gap), y });
  return slots;
}

export function layoutHand(state, who) {
  const player = who === 0 ? me(state) : foe(state);
  const w = who === 0 ? CARD_W : 76;
  const h = who === 0 ? CARD_H : 104;
  const y = who === 0 ? PLAYER_HAND_Y : ENEMY_HAND_Y;
  const slots = rowSlots(player.hand.length, y, w, CARD_GAP);
  return player.hand.map((card, i) => ({ card, x: slots[i].x, y: slots[i].y, w, h }));
}

export function layoutBoard(state, who) {
  const player = who === 0 ? me(state) : foe(state);
  const slots = rowSlots(player.board.length, who === 0 ? PLAYER_BOARD_Y : ENEMY_BOARD_Y, BOARD_CARD_W, CARD_GAP);
  return player.board.map((m, i) => ({ minion: m, x: slots[i].x, y: slots[i].y, w: BOARD_CARD_W, h: BOARD_CARD_H }));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function flamePath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 0.2, cx + s * 0.5, cy + s * 0.5, cx, cy + s * 0.6);
  ctx.bezierCurveTo(cx - s * 0.5, cy + s * 0.5, cx - s * 0.7, cy - s * 0.2, cx, cy - s);
  ctx.closePath();
}

function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.7);
  ctx.bezierCurveTo(cx - s, cy - s * 0.1, cx - s * 0.5, cy - s * 0.8, cx, cy - s * 0.2);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.8, cx + s, cy - s * 0.1, cx, cy + s * 0.7);
  ctx.closePath();
}

// One small vector sigil per card, so every creature reads differently
// even before its name is read. All shapes, no images.
export function drawSigil(ctx, art, cx, cy, s, tint) {
  ctx.save();
  ctx.fillStyle = tint;
  ctx.strokeStyle = tint;
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.lineCap = 'round';
  switch (art) {
    case 'imp':
      flamePath(ctx, cx, cy, s * 0.8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.5, cy - s * 0.7);
      ctx.lineTo(cx - s * 0.9, cy - s * 1.2);
      ctx.moveTo(cx + s * 0.5, cy - s * 0.7);
      ctx.lineTo(cx + s * 0.9, cy - s * 1.2);
      ctx.stroke();
      break;
    case 'pup':
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - s * 0.35, cy + s * 0.55, s * 0.22, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.35, cy + s * 0.55, s * 0.22, 0, Math.PI * 2);
      ctx.arc(cx, cy + s * 0.7, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'hound':
      ctx.beginPath();
      ctx.moveTo(cx - s, cy + s * 0.3);
      ctx.lineTo(cx - s * 0.2, cy - s * 0.5);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx - s * 0.2, cy + s * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    case 'shield':
      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.8, cy + s * 0.2);
      ctx.quadraticCurveTo(cx + s * 0.8, cy + s * 0.9, cx, cy + s);
      ctx.quadraticCurveTo(cx - s * 0.8, cy + s * 0.9, cx - s * 0.8, cy + s * 0.2);
      ctx.lineTo(cx - s * 0.8, cy - s * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    case 'acolyte':
      ctx.beginPath();
      ctx.moveTo(cx, cy + s);
      ctx.lineTo(cx - s * 0.7, cy - s * 0.2);
      ctx.lineTo(cx + s * 0.7, cy - s * 0.2);
      ctx.closePath();
      ctx.fill();
      flamePath(ctx, cx, cy - s * 0.45, s * 0.35);
      ctx.fill();
      break;
    case 'crow':
      ctx.beginPath();
      ctx.moveTo(cx - s, cy);
      ctx.quadraticCurveTo(cx, cy - s, cx + s, cy - s * 0.2);
      ctx.quadraticCurveTo(cx + s * 0.3, cy + s * 0.1, cx, cy + s * 0.2);
      ctx.quadraticCurveTo(cx - s * 0.4, cy + s * 0.3, cx - s, cy);
      ctx.closePath();
      ctx.fill();
      break;
    case 'drake':
      ctx.beginPath();
      ctx.moveTo(cx - s, cy + s * 0.5);
      ctx.lineTo(cx - s * 0.2, cy - s);
      ctx.lineTo(cx + s * 0.3, cy + s * 0.1);
      ctx.lineTo(cx + s, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.6, cy + s * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    case 'knight':
      ctx.fillRect(cx - s * 0.55, cy - s * 0.4, s * 1.1, s * 0.9);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.55, cy - s * 0.4);
      ctx.lineTo(cx, cy - s);
      ctx.lineTo(cx + s * 0.55, cy - s * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
    case 'golem':
      ctx.fillRect(cx - s * 0.7, cy + s * 0.2, s * 1.4, s * 0.7);
      ctx.fillRect(cx - s * 0.45, cy - s * 0.5, s * 0.9, s * 0.7);
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.75, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'phoenix':
      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.quadraticCurveTo(cx + s, cy - s * 0.3, cx + s * 0.7, cy + s * 0.6);
      ctx.quadraticCurveTo(cx + s * 0.2, cy + s * 0.1, cx, cy + s * 0.3);
      ctx.quadraticCurveTo(cx - s * 0.2, cy + s * 0.1, cx - s * 0.7, cy + s * 0.6);
      ctx.quadraticCurveTo(cx - s, cy - s * 0.3, cx, cy - s);
      ctx.closePath();
      ctx.fill();
      break;
    case 'colossus':
      ctx.beginPath();
      ctx.moveTo(cx - s, cy + s * 0.7);
      ctx.lineTo(cx - s * 0.4, cy - s * 0.7);
      ctx.lineTo(cx, cy + s * 0.1);
      ctx.lineTo(cx + s * 0.4, cy - s * 0.9);
      ctx.lineTo(cx + s, cy + s * 0.7);
      ctx.closePath();
      ctx.fill();
      break;
    case 'matriarch':
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8, cy + s * 0.6);
      ctx.lineTo(cx - s * 0.8, cy - s * 0.2);
      ctx.lineTo(cx - s * 0.4, cy + s * 0.1);
      ctx.lineTo(cx, cy - s * 0.7);
      ctx.lineTo(cx + s * 0.4, cy + s * 0.1);
      ctx.lineTo(cx + s * 0.8, cy - s * 0.2);
      ctx.lineTo(cx + s * 0.8, cy + s * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    case 'burst':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'rekindle':
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.7, 0.3, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.75, cy - s * 0.5);
      ctx.lineTo(cx + s * 0.95, cy - s * 0.05);
      ctx.lineTo(cx + s * 0.4, cy - s * 0.05);
      ctx.closePath();
      ctx.fill();
      break;
    case 'rain':
      ctx.beginPath();
      ctx.arc(cx - s * 0.3, cy - s * 0.1, s * 0.45, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.35, cy - s * 0.15, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - s * 0.5, cy + s * 0.45, s * 0.12, s * 0.4);
      ctx.fillRect(cx, cy + s * 0.45, s * 0.12, s * 0.4);
      ctx.fillRect(cx + s * 0.5, cy + s * 0.45, s * 0.12, s * 0.4);
      break;
    default:
      flamePath(ctx, cx, cy, s * 0.8);
      ctx.fill();
  }
  ctx.restore();
}

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawCostGem(ctx, x, y, r, cost, affordable) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = affordable ? COLORS.cost : '#5a6a7a';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#dfe9f5';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(r * 1.05)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(cost), x, y + 1);
  ctx.restore();
}

function drawStatOrb(ctx, x, y, r, value, kind) {
  ctx.save();
  ctx.beginPath();
  if (kind === 'hp') heartPath(ctx, x, y, r);
  else ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = kind === 'hp' ? COLORS.hp : COLORS.atk;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(r * 1.05)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y + 1);
  ctx.restore();
}

export function drawCardFace(ctx, def, x, y, w, h, opts = {}) {
  const { selected = false, playable = false, dimmed = false, targetable = false } = opts;
  ctx.save();
  if (selected) {
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 22;
  } else if (targetable) {
    ctx.shadowColor = COLORS.danger;
    ctx.shadowBlur = 18;
  } else if (playable) {
    ctx.shadowColor = COLORS.hp;
    ctx.shadowBlur = 10;
  }
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = COLORS.cardFace;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = selected ? 4 : 2.5;
  ctx.strokeStyle = selected ? COLORS.gold : def.tint;
  ctx.stroke();
  // Header band with the name, kept clear of the cost gem at the left.
  ctx.fillStyle = def.tint;
  roundRect(ctx, x + 3, y + 3, w - 6, 24, 7);
  ctx.fill();
  ctx.fillStyle = '#fff';
  const name = def.name.length > 16 ? def.name.slice(0, 15) + '…' : def.name;
  let nameSize = w > 100 ? 13 : 11;
  ctx.font = `bold ${nameSize}px Georgia, serif`;
  while (ctx.measureText(name).width > w - 44 && nameSize > 8) {
    nameSize -= 1;
    ctx.font = `bold ${nameSize}px Georgia, serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x + w / 2 + 13, y + 15);
  // Art panel.
  const artY = y + 33;
  const artH = Math.round(h * 0.42);
  ctx.fillStyle = '#241812';
  roundRect(ctx, x + 7, artY, w - 14, artH, 6);
  ctx.fill();
  drawSigil(ctx, def.art, x + w / 2, artY + artH / 2, Math.min(w, artH) * 0.32, def.tint);
  // Keyword + rule text.
  ctx.fillStyle = '#3a2a1a';
  ctx.textAlign = 'center';
  let ty = artY + artH + 14;
  if (def.keyword) {
    ctx.font = `bold ${w > 100 ? 11 : 10}px Georgia, serif`;
    ctx.fillText(def.keyword, x + w / 2, ty);
    ty += 13;
  }
  ctx.font = `${w > 100 ? 10.5 : 9}px system-ui, sans-serif`;
  const lines = wrapText(ctx, def.text, w - 16);
  for (const line of lines) {
    ctx.fillText(line, x + w / 2, ty);
    ty += 12;
  }
  // Cost gem, attack and health orbs.
  drawCostGem(ctx, x + 16, y + 16, 13, def.cost, true);
  if (def.kind === 'creature') {
    drawStatOrb(ctx, x + 17, y + h - 17, 13, def.attack, 'atk');
    drawStatOrb(ctx, x + w - 17, y + h - 17, 13, def.health, 'hp');
  } else {
    ctx.fillStyle = COLORS.ember;
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillText('SPELL', x + w / 2, y + h - 14);
  }
  if (dimmed) {
    ctx.fillStyle = 'rgba(20,12,8,0.45)';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = COLORS.cardBack;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.cardBackEdge;
  ctx.stroke();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 5);
  ctx.stroke();
  drawSigil(ctx, 'imp', x + w / 2, y + h / 2, Math.min(w, h) * 0.28, COLORS.emberHot);
  ctx.restore();
}

function drawEmberRow(ctx, x, y, ember, maxEmber) {
  for (let i = 0; i < maxEmber; i++) {
    const cx = x + i * 18;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, y - 7);
    ctx.lineTo(cx + 7, y);
    ctx.lineTo(cx, y + 7);
    ctx.lineTo(cx - 7, y);
    ctx.closePath();
    ctx.fillStyle = i < ember ? COLORS.ember : '#4a3428';
    ctx.fill();
    ctx.strokeStyle = i < ember ? COLORS.emberHot : '#6a4a34';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function drawHero(ctx, state, who, ui) {
  const player = who === 0 ? me(state) : foe(state);
  const rect = heroRect(who);
  const isFoe = who === 1;
  ctx.save();
  ctx.beginPath();
  ctx.arc(rect.cx, rect.cy, rect.r, 0, Math.PI * 2);
  ctx.fillStyle = isFoe ? COLORS.ashDark : '#4a2f1e';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = isFoe ? COLORS.ash : COLORS.gold;
  ctx.stroke();
  drawSigil(ctx, isFoe ? 'drake' : 'acolyte', rect.cx, rect.cy - 4, 22, isFoe ? COLORS.ash : COLORS.gold);
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(isFoe ? 'Cinder Warden' : 'You — Keeper', rect.cx + rect.r + 12, rect.cy - 22);
  // Life total, big and readable.
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillStyle = player.life <= 10 ? COLORS.danger : COLORS.ink;
  ctx.fillText(`${player.life}`, rect.cx + rect.r + 12, rect.cy + 6);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = COLORS.inkDim;
  ctx.fillText('/ 30 life', rect.cx + rect.r + 52, rect.cy + 8);
  drawEmberRow(ctx, rect.cx + rect.r + 12, rect.cy + 30, player.ember, Math.max(player.maxEmber, 1));
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = COLORS.inkDim;
  ctx.fillText(`deck ${player.deck.length}`, rect.cx + rect.r + 12 + Math.max(player.maxEmber, 1) * 18 + 8, rect.cy + 30);
  if (ui.targeting && ui.targeting.kind === 'burst' && isFoe) {
    ctx.beginPath();
    ctx.arc(rect.cx, rect.cy, rect.r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

function drawEndTurn(ctx, state, ui) {
  const r = endTurnRect();
  const enabled = state.screen === 'play' && state.phase === 'player';
  const over = state.screen === 'won' || state.screen === 'lost';
  const lit = enabled || over;
  ctx.save();
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fillStyle = lit ? COLORS.ember : '#4a3428';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = lit ? COLORS.emberHot : '#6a4a34';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(over ? 'PLAY AGAIN' : enabled ? 'END TURN' : 'WARDEN…', r.x + r.w / 2, r.y + r.h / 2);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = COLORS.inkDim;
  ctx.fillText('Space / Enter', r.x + r.w / 2, r.y + r.h + 14);
  ctx.restore();
}

function drawLog(ctx, state) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = COLORS.goldDim;
  ctx.fillText('— Chronicle —', 1064, 250);
  ctx.fillStyle = COLORS.log;
  state.log.slice(-6).forEach((line, i) => {
    ctx.fillText(line.length > 34 ? line.slice(0, 33) + '…' : line, 1064, 272 + i * 17);
  });
  ctx.restore();
}

function drawMinion(ctx, state, slot, ui, now) {
  const m = slot.minion;
  slideTo(m, slot.x, slot.y, 0.22);
  let x = m.dx ?? slot.x;
  let y = m.dy ?? slot.y;
  if (m.lunge && now < m.lunge.until) {
    const t = easeOut(1 - (m.lunge.until - now) / 180);
    x = x + (m.lunge.x - x) * 0.45 * Math.sin(t * Math.PI);
    y = y + (m.lunge.y - y) * 0.45 * Math.sin(t * Math.PI);
  }
  const isPlayer = me(state).board.includes(m);
  const selected = ui.selected && ui.selected.type === 'minion' && ui.selected.uid === m.uid;
  const targetable = ui.targeting && (
    (ui.targeting.kind === 'attack' && !isPlayer) ||
    (ui.targeting.kind === 'burst' && true)
  );
  const def = cardById(m.defId);
  const liveDef = { ...def, health: m.health };
  drawCardFace(ctx, liveDef, x, y, slot.w, slot.h, {
    selected,
    targetable,
    dimmed: isPlayer && !m.canAttack && state.phase === 'player',
    playable: false,
  });
  if (isPlayer && m.canAttack && state.phase === 'player') {
    ctx.save();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('READY', x + slot.w / 2, y - 8);
    ctx.restore();
  }
  if (m.keyword === 'Guard') {
    ctx.save();
    ctx.fillStyle = COLORS.ash;
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    // Player guards label below the card; rival guards label above it,
    // so the two rows never share the crowded middle band.
    ctx.fillText('GUARD', x + slot.w / 2, isPlayer ? y + slot.h + 13 : y - 22);
    ctx.restore();
  }
}

function drawTable(ctx, state, ui, fx, now) {
  // Felt.
  ctx.save();
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.felt;
  roundRect(ctx, 12, 12, VIEW_W - 24, VIEW_H - 24, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.tableEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = COLORS.feltLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(300, VIEW_H / 2);
  ctx.lineTo(980, VIEW_H / 2);
  ctx.stroke();
  // Masthead.
  ctx.fillStyle = COLORS.goldDim;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('E M B E R F A L L', VIEW_W / 2, 30);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = COLORS.inkDim;
  ctx.fillText(`Turn ${state.turn}  •  ${state.phase === 'player' ? 'Your move' : 'Warden is thinking…'}`, VIEW_W / 2, 50);
  ctx.restore();

  drawHero(ctx, state, 1, ui);
  drawHero(ctx, state, 0, ui);

  // Rival hand: backs only.
  for (const slot of layoutHand(state, 1)) {
    drawCardBack(ctx, slot.x, slot.y, slot.w, slot.h);
  }

  // Boards.
  for (const slot of layoutBoard(state, 1)) drawMinion(ctx, state, slot, ui, now);
  for (const slot of layoutBoard(state, 0)) drawMinion(ctx, state, slot, ui, now);

  // Player hand.
  const player = me(state);
  for (const slot of layoutHand(state, 0)) {
    const def = cardById(slot.card.defId);
    slideTo(slot.card, slot.x, slot.y, 0.22);
    const selected = ui.selected && ui.selected.type === 'hand' && ui.selected.index === player.hand.indexOf(slot.card);
    const playable = state.screen === 'play' && state.phase === 'player' && player.ember >= def.cost;
    const lift = selected ? -18 : 0;
    drawCardFace(ctx, def, slot.card.dx ?? slot.x, (slot.card.dy ?? slot.y) + lift, slot.w, slot.h, {
      selected,
      playable,
      dimmed: !playable && state.phase === 'player',
    });
  }

  // Hints.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = COLORS.inkDim;
  if (ui.targeting && ui.targeting.kind === 'burst') {
    ctx.fillStyle = COLORS.danger;
    ctx.fillText('Ember Burst — click a target (creature or hero)', VIEW_W / 2, 786);
  } else if (ui.targeting && ui.targeting.kind === 'attack') {
    ctx.fillText('Choose a target — a guard must be attacked first', VIEW_W / 2, 786);
  } else if (state.phase === 'player') {
    ctx.fillText('Click a card to play it • Click your creature, then a foe, to attack • 1–7 selects a card', VIEW_W / 2, 786);
  }
  ctx.restore();

  drawLog(ctx, state);
  drawEndTurn(ctx, state, ui);

  // Banner.
  if (state.banner && now < state.bannerUntil) {
    const alpha = Math.min(1, (state.bannerUntil - now) / 400);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20,12,8,0.85)';
    roundRect(ctx, VIEW_W / 2 - 220, 330, 440, 44, 10);
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = COLORS.win;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.banner, VIEW_W / 2, 353);
    ctx.restore();
  }

  // Floating damage numbers.
  for (const f of fx.floaters) {
    const age = (now - f.born) / f.life;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = f.color;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y - age * 46);
    ctx.restore();
  }
}

function drawTitle(ctx, state, now) {
  ctx.save();
  ctx.fillStyle = '#1c110c';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Rising embers.
  for (let i = 0; i < 40; i++) {
    const x = (i * 173 + 60) % VIEW_W;
    const speed = 12 + (i % 5) * 6;
    const y = VIEW_H - ((now * speed / 1000 + i * 97) % (VIEW_H + 40)) + 20;
    ctx.globalAlpha = 0.25 + (i % 3) * 0.15;
    ctx.fillStyle = i % 2 ? COLORS.ember : COLORS.emberHot;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Sample fan of cards.
  const samples = ['phoenix', 'lava-golem', 'ember-burst'];
  samples.forEach((id, i) => {
    ctx.save();
    ctx.translate(560 + i * 90, 470);
    ctx.rotate((i - 1) * 0.14);
    drawCardFace(ctx, cardById(id), -56, -76, CARD_W, CARD_H, {});
    ctx.restore();
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.emberHot;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('EMBERFALL', VIEW_W / 2, 210);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('— Duel of the Last Flame —', VIEW_W / 2, 258);
  ctx.fillStyle = COLORS.ink;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Outwit the Cinder Warden. Spend ember, summon creatures, break the guard line,', VIEW_W / 2, 330);
  ctx.fillText('and bring the rival keeper to zero life before yours burns out.', VIEW_W / 2, 354);
  const pulse = 0.65 + 0.35 * Math.sin(now / 350);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.win;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Click or press Enter to play', VIEW_W / 2, 640);
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Mouse + keyboard  •  1–7 play a card  •  Space ends the turn  •  R starts over', VIEW_W / 2, 690);
  ctx.fillText('30 life each  •  ember grows every turn  •  Guard must be attacked first', VIEW_W / 2, 712);
  ctx.restore();
}

function drawEndScreen(ctx, state) {
  const won = state.screen === 'won';
  ctx.save();
  ctx.fillStyle = 'rgba(12,7,4,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? COLORS.win : COLORS.danger;
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', VIEW_W / 2, 300);
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText(
    won ? 'The last flame endures — the Warden bows out.' : 'The flame fades — the Warden keeps the ember.',
    VIEW_W / 2, 350,
  );
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillStyle = COLORS.inkDim;
  ctx.fillText(`Turns played: ${state.stats.turns}   •   Cards played: ${state.stats.cardsPlayed}   •   Damage dealt: ${state.stats.damageDealt}`, VIEW_W / 2, 410);
  ctx.fillText(`Your life: ${me(state).life}   •   Warden life: ${foe(state).life}`, VIEW_W / 2, 440);
  ctx.fillStyle = COLORS.win;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press R or click to play again', VIEW_W / 2, 520);
  ctx.restore();
}

export function drawGame(ctx, state, ui, fx, now) {
  ctx.save();
  if (fx.shake > 0.3) {
    ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
  }
  if (state.screen === 'title') {
    drawTitle(ctx, state, now);
  } else {
    drawTable(ctx, state, ui, fx, now);
    if (state.screen === 'won' || state.screen === 'lost') drawEndScreen(ctx, state);
  }
  ctx.restore();
}
