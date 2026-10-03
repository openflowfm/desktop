// The published shape: every module in src/ is reachable as
// `@openflow/desktop/<name>.ts` through the exports map (self-reference, as an
// installed consumer resolves it), landing on built JavaScript with adjacent
// declarations. Needs `npm run build` first.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const modules = readdirSync(path.join(root, 'src'))
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
  .sort();

describe('the published exports map', () => {
  it.each(modules)('@openflow/desktop/%s resolves to built JavaScript and declarations', (file) => {
    const resolved = require.resolve(`@openflow/desktop/${file}`);
    const stem = file.slice(0, -'.ts'.length);
    expect(resolved).toBe(path.join(root, 'dist', `${stem}.js`));
    expect(existsSync(resolved), `${resolved} missing: run npm run build`).toBe(true);
    expect(existsSync(path.join(root, 'dist', `${stem}.d.ts`))).toBe(true);
  });

  it('ships the electron-builder base config at its documented subpath', () => {
    const base = require.resolve('@openflow/desktop/electron-builder.base.yml');
    expect(base).toBe(path.join(root, 'electron-builder.base.yml'));
  });

  it('ships the signing backport as compiled code consumers can call', async () => {
    const { repairBuilder } = await import(
      /* @vite-ignore */ path.join(root, 'dist', 'builderPatch.js')
    ) as typeof import('./builderPatch.ts');
    expect(() => repairBuilder('unrelated')).toThrow(/Unexpected electron-builder signing code/);
  });

  it('is publishable: not private, public with provenance, files cover every export target', () => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.private).toBeUndefined();
    expect(pkg.publishConfig).toEqual({ access: 'public', provenance: true });
    expect(pkg.files).toEqual(expect.arrayContaining(['dist', 'electron-builder.base.yml']));
  });
});
