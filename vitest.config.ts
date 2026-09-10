import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['src/**/*.test.ts'], coverage: { provider: 'v8', include: ['src/apps.ts', 'src/within.ts', 'src/binary.ts', 'src/builderPatch.ts', 'src/reach.ts'], reporter: ['text', 'lcov'] } } });
