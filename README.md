# Emberfall — Duel of the Last Flame

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/agungtriyonode/card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/agungtriyonode/card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

A card duel for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).
You are the Keeper of the Last Flame; across the table sits the Cinder Warden.
Spend ember, summon creatures, break the guard line, and bring the rival
keeper to zero life before yours burns out.

## How to play

- **Turns:** each turn your ember grows by 1 (up to 10) and refills; you draw a card.
- **Cards:** creatures cost ember to summon; spells fire at once. 15 original cards:
  creatures with attack/health, plus Ember Burst (3 damage to any target),
  Rekindle (draw 2) and Cinder Rain (2 to all foe creatures).
- **Keywords:** **Guard** must be attacked first, **Swift** may attack at once,
  **Kindle** deals 2 to the foe the moment it is summoned.
- **Combat:** click your ready creature, then a foe creature or the rival hero.
  Creatures trade damage both ways. A creature that just arrived cannot attack
  unless it is Swift.
- **Win / lose:** reduce the Warden to 0 life to win; fall to 0 and the flame fades.
  An empty deck deals growing fatigue damage each draw.
- **Controls:** mouse + keyboard — click cards to play them, `1–7` selects a hand
  card, `Space`/`Enter` ends the turn, `Esc` cancels, `R` plays again.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — `game/index.html` and its ES modules, no build step, no
network requests. Screenshots are real renders of the game itself
(`shots.json` lists the `?shot=` presets that stage each one).
