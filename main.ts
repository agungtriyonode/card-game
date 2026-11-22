// Emberfall — the entrypoint (Node 22, standard library only).
//
// This program hands the game in. It copies the static game/ folder and the
// screenshots/ folder from beside this file into the output directory, then
// writes /output/dossier.json with the vendored make.fun library, which
// summarises the game for the judge. Outside the grader's container the
// MAKEFUN_OUTPUT_DIR environment variable stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The two runs the grader performs must write identical bytes: copying is
// deterministic and buildDossier derives everything from the copied files,
// so nothing here depends on time, randomness, or the machine.

import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name) {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) return 0;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  return countEntries(to);
}

function countEntries(dir) {
  let total = 0;
  for (const entry of readdirSync(dir)) {
    total += 1;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) total += countEntries(full);
  }
  return total;
}

mkdirSync(outputDir, { recursive: true });
const gameEntries = copyTree('game');
const shotEntries = copyTree('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(
  `emberfall: game ${gameEntries} entries, screenshots ${shotEntries} files, ` +
  `dossier ${dossier.length} bytes -> ${outputDir}`,
);
