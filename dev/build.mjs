#!/usr/bin/env node
/**
 * app/manifest.json is the source of truth; each browser gets the subset it understands.
 * Firefox needs the Gecko block for its add-on ID, while Chrome reads it as an unrecognised key
 * during review, so the Chrome package goes without it.
 *
 * Usage: node dev/build.mjs [firefox|chrome|all]
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'app');
const dist = path.join(root, 'dist');

/** Editor, OS and old hand-made packages must not reach a store reviewer. */
const JUNK_NAMES = new Set(['.DS_Store', '.claude', 'Thumbs.db', 'desktop.ini']);
const isJunk = (name) => JUNK_NAMES.has(name) || name.endsWith('.zip') || name.endsWith('.xpi');

const TARGETS = {
  firefox: {
    /** AMO takes a plain zip; .xpi is the same container and is what the listing already carries. */
    extension: 'xpi',
    manifest: (manifest) => manifest,
  },

  chrome: {
    extension: 'zip',
    manifest(manifest) {
      delete manifest.browser_specific_settings;
      return manifest;
    },
  },
};

function verify(dir, manifest) {
  const problems = [];
  const declared = [
    ...Object.values(manifest.icons ?? {}),
    ...(manifest.content_scripts ?? []).flatMap((script) => [...(script.js ?? []), ...(script.css ?? [])]),
  ];
  for (const file of declared) {
    if (!existsSync(path.join(dir, file))) {
      problems.push(`manifest points at a missing file: ${file}`);
      continue;
    }
    // Content scripts load as classic scripts, so that is how they are parsed here.
    if (file.endsWith('.js')) {
      try {
        new vm.Script(readFileSync(path.join(dir, file), 'utf8'), { filename: file });
      } catch (error) {
        problems.push(`${file} does not parse: ${error.message}`);
      }
    }
  }
  return problems;
}

function build(target) {
  const spec = TARGETS[target];
  const manifest = spec.manifest(JSON.parse(readFileSync(path.join(app, 'manifest.json'), 'utf8')));

  const dir = path.join(dist, target);
  rmSync(dir, { recursive: true, force: true });
  cpSync(app, dir, { recursive: true, filter: (source) => !isJunk(path.basename(source)) });
  writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const problems = verify(dir, manifest);
  if (problems.length > 0) {
    for (const problem of problems) console.error(`  ${target}: ${problem}`);
    console.error(`build: ${target} package is not loadable`);
    process.exit(1);
  }

  const output = path.join(dist, `spacebar-review-for-github-${manifest.version}-${target}.${spec.extension}`);
  rmSync(output, { force: true });
  // -X drops the extra attributes that make an archive differ between machines for no reason.
  execFileSync('zip', ['-r', '-q', '-X', output, '.'], { cwd: dir });
  const files = readdirSync(dir).length;
  console.log(`${target.padEnd(8)} ${path.relative(root, output)}  (${files} files, ${Math.round(statSync(output).size / 1024)} KB)`);
}

const named = process.argv.slice(2);
const requested = named.length === 0 || named.includes('all') ? Object.keys(TARGETS) : named;

for (const target of requested) {
  if (!TARGETS[target]) {
    console.error(`build: unknown target "${target}" — expected ${Object.keys(TARGETS).join(', ')} or all`);
    process.exit(1);
  }
}

mkdirSync(dist, { recursive: true });
for (const target of requested) build(target);
