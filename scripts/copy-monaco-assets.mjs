import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'node_modules', 'monaco-editor', 'min', 'vs');
const targetDir = path.join(rootDir, 'public', 'monaco', 'vs');

if (!existsSync(sourceDir)) {
  console.warn('[copy-monaco-assets] source directory not found:', sourceDir);
  process.exit(0);
}

mkdirSync(path.dirname(targetDir), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log('[copy-monaco-assets] copied Monaco assets to', targetDir);
