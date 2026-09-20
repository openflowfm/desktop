import { describe, expect, it } from 'vitest';
import { APPS } from './apps.ts';
import { devUrl, isDev } from './dev.ts';

describe('isDev', () => {
  it('is off with neither variable', () => {
    expect(isDev({})).toBe(false);
  });
  it('agrees with devUrl on both switches', () => {
    for (const env of [{ OPENFLOW_DEV: '1' }, { OPENFLOW_DEV_URL: 'http://localhost:9' }]) {
      expect(isDev(env)).toBe(true);
      expect(devUrl(APPS.set, env)).not.toBe('');
    }
  });
});
