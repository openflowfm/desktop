import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app, APPS, NAMES, present, serverPort, uiPort } from './apps.ts';

// The registry is the one file here a test runner can reach — everything else
// in this package imports `electron`, which only exists inside a main process.
// It is also the file most worth pinning: a wrong offset is two dev servers
// quietly fighting over a port, and a wrong port is a window that opens onto
// somebody else's server.

describe('the registry', () => {
  it('names every app it defines', () => {
    expect(NAMES).toEqual(Object.keys(APPS));
    for (const name of NAMES) {
      expect((APPS as Record<string, { name: string }>)[name]?.name).toBe(name);
    }
  });

  it('gives every app a distinct dev-server offset', () => {
    const offsets = Object.values(APPS).map((one) => one.ui);
    expect(new Set(offsets).size).toBe(offsets.length);
  });

  it('leaves the two benches their offsets', () => {
    // The benches are not apps and are still counted in their own vite configs,
    // at +100 and +200. An app that lands on either is the collision this
    // registry cannot see for itself.
    const offsets = Object.values(APPS).map((one) => one.ui);
    expect(offsets).not.toContain(100);
    expect(offsets).not.toContain(200);
  });

  it('names the app it cannot find, and the ones it can', () => {
    expect(() => app('mixer')).toThrow(/mixer/);
    expect(() => app('mixer')).toThrow(new RegExp(NAMES.join(', ')));
    expect(() => app(undefined)).toThrow(/none named/);
  });

  it('finds an app by name', () => {
    expect(app('set')).toBe(APPS.set);
  });
});

describe('present', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'openflow-apps-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('finds nothing in an empty checkout', () => {
    expect(present(root)).toEqual([]);
  });

  it('finds only the apps whose directory exists', () => {
    mkdirSync(join(root, 'set'));
    expect(present(root)).toEqual(['set']);
  });

  it('finds every app once every directory exists', () => {
    for (const name of NAMES) mkdirSync(join(root, name));
    expect(present(root)).toEqual(NAMES);
  });

  it('keeps the order NAMES is in, not the order directories were made', () => {
    mkdirSync(join(root, 'visuals'));
    mkdirSync(join(root, 'set'));
    expect(present(root)).toEqual(['set', 'visuals']);
  });
});

describe('uiPort', () => {
  it('counts from the base', () => {
    expect(uiPort(APPS.set, {})).toBe(5173);
    expect(uiPort(APPS.visuals, {})).toBe(5473);
  });

  it('follows a base that moved, which is how a second worktree works', () => {
    expect(uiPort(APPS.set, { OPENFLOW_PORT_BASE: '6000' })).toBe(6000);
    expect(uiPort(APPS.visuals, { OPENFLOW_PORT_BASE: '6000' })).toBe(6300);
  });

  it('lets one app move without moving the base', () => {
    expect(uiPort(APPS.visuals, { OPENFLOW_VISUALS_UI_PORT: '5999' })).toBe(5999);
    // And the override wins over a base that also moved, rather than adding.
    const both = { OPENFLOW_PORT_BASE: '6000', OPENFLOW_VISUALS_UI_PORT: '5999' };
    expect(uiPort(APPS.visuals, both)).toBe(5999);
  });

  it('ignores a variable that is not a number', () => {
    expect(uiPort(APPS.set, { OPENFLOW_PORT_BASE: 'yes' })).toBe(5173);
  });
});

describe('serverPort', () => {
  it('is a number of its own, not an offset', () => {
    expect(serverPort(APPS.visuals, {})).toBe(17900);
  });

  it('follows its own variable', () => {
    expect(serverPort(APPS.visuals, { OPENFLOW_VISUALS_PORT: '17999' })).toBe(17999);
  });

  it('refuses an app that has no server rather than inventing a port', () => {
    expect(() => serverPort(APPS.set, {})).toThrow(/no server/);
  });
});
