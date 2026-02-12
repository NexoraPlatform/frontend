import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const libDir = resolve(root, 'node_modules', 'next', 'dist', 'lib');

const jsonPath = resolve(libDir, 'server-external-packages.json');
const jsoncPath = resolve(libDir, 'server-external-packages.jsonc');

if (!existsSync(libDir)) {
  console.warn('[ensure-next-internals] next dist/lib not found yet, skipping.');
  process.exit(0);
}

if (existsSync(jsoncPath)) {
  process.exit(0);
}

if (existsSync(jsonPath)) {
  copyFileSync(jsonPath, jsoncPath);
  console.warn(
    '[ensure-next-internals] created missing server-external-packages.jsonc from .json'
  );
  process.exit(0);
}

console.warn(
  '[ensure-next-internals] missing both server-external-packages.json and .jsonc; reinstall next.'
);
process.exit(0);
