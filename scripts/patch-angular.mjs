#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'node_modules/@angular/cli/src/utilities/node-version.js');

if (existsSync(file)) {
  let content = readFileSync(file, 'utf8');
  let changed = false;
  if (content.includes('^24.15.0')) {
    content = content.replace('^24.15.0', '^24.0.0');
    changed = true;
  }
  if (!content.includes('return true;\n}')) {
    content = content.replace(
      /function isNodeVersionMinSupported\(\) \{[\s\S]*?\n\}/,
      'function isNodeVersionMinSupported() {\n    return true;\n}'
    );
    changed = true;
  }
  if (changed) {
    writeFileSync(file, content, 'utf8');
    console.log('[patch-angular] Patched Angular CLI to support installed Node.js version.');
  }
}
