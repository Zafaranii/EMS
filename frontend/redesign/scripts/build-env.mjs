// Reads .env at repo root and writes src/environments/environment.ts before ng serve/build.
// Angular doesn't natively load .env — this is a tiny shim. No external deps.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');
const outPath = resolve(root, 'src/environments/environment.ts');

const env = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    if (line.trim().startsWith('#')) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
}

const apiUrl = env.API_URL || 'http://localhost:5000/api';
const production = String(env.PRODUCTION || 'false').toLowerCase() === 'true';

const content = `// AUTO-GENERATED from .env by scripts/build-env.mjs — do not edit by hand.
export const environment = {
  production: ${production},
  apiUrl: ${JSON.stringify(apiUrl)},
};
`;

writeFileSync(outPath, content);
console.log(`[build-env] wrote ${outPath} (apiUrl=${apiUrl}, production=${production})`);
