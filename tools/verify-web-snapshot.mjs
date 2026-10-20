#!/usr/bin/env node
// Verify the reviewed Web showcase remains byte-identical to its exported UI snapshot.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metadata = JSON.parse(readFileSync(join(root, 'demo/web-ui-1.2.2.json'), 'utf8'));

function treeHash(directory, ignored = new Set()) {
  const files = [];
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) {
        if (!ignored.has(relative(directory, path).split('\\').join('/'))) files.push(path);
      }
      else throw Error(`Unexpected non-file in snapshot: ${path}`);
    }
  }
  walk(directory);
  files.sort((a, b) => {
    const left = relative(directory, a), right = relative(directory, b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  const combined = createHash('sha256');
  for (const file of files) {
    const name = relative(directory, file).split('\\').join('/');
    const digest = createHash('sha256').update(readFileSync(file)).digest('hex');
    combined.update(`${name}\0${digest}\n`);
  }
  return { count: files.length, sha256: combined.digest('hex') };
}

for (const [label, folder, countKey, hashKey] of [
  ['Web runtime', 'demo/web', 'dist_file_count', 'dist_tree_sha256'],
  ['UI source reference', 'demo/web-reference-src', 'ui_source_file_count', 'ui_source_tree_sha256'],
]) {
  const actual = treeHash(join(root, folder), folder === 'demo/web-reference-src' ? new Set(['README.md']) : new Set());
  if (actual.count !== metadata[countKey] || actual.sha256 !== metadata[hashKey]) {
    console.error(`WEB_SNAPSHOT_MISMATCH ${label}: ${actual.count} files, ${actual.sha256}`);
    process.exitCode = 1;
  } else console.log(`WEB_SNAPSHOT_OK ${label}: ${actual.count} files, ${actual.sha256.slice(0, 12)}`);
}
