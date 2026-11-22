// Emberfall — shared constants: board geometry, rules numbers, palette.
// One place for every magic number so the other modules read rules, not literals.
export const VIEW_W = 1280;
export const VIEW_H = 800;

export const START_LIFE = 30;
export const MAX_EMBER = 10;
export const MAX_HAND = 7;
export const MAX_BOARD = 5;
export const START_HAND = 3;
export const FATIGUE_START = 1;

export const CARD_W = 112;
export const CARD_H = 152;
export const BOARD_CARD_W = 118;
export const BOARD_CARD_H = 158;
export const CARD_GAP = 14;

// Rows (y of the top edge) in the 1280x800 view.
export const ENEMY_HAND_Y = 84;
export const ENEMY_BOARD_Y = 238;
export const PLAYER_BOARD_Y = 420;
export const PLAYER_HAND_Y = 604;

export const HERO_R = 46;
export const ENEMY_HERO = { x: 96, y: 150 };
export const PLAYER_HERO = { x: 96, y: 660 };

// Palette: ember table, gold for the player, cold ash-violet for the rival.
export const COLORS = {
  table: '#241812',
  tableEdge: '#3a241a',
  felt: '#2e2019',
  feltLine: '#4a2f1e',
  gold: '#e8b64c',
  goldDim: '#9a7a33',
  ember: '#ff7a2f',
  emberHot: '#ffb347',
  ash: '#8d7fb8',
  ashDark: '#4a3f6e',
  ink: '#f5ead6',
  inkDim: '#c9b69a',
  cardFace: '#f7ecd4',
  cardFaceDark: '#e9d9b8',
  cardBack: '#5b3a8c',
  cardBackEdge: '#3d2760',
  hp: '#3fae5a',
  atk: '#d84a35',
  cost: '#2f7fc4',
  log: '#b7a586',
  danger: '#ff5a4e',
  win: '#ffd76a',
};
