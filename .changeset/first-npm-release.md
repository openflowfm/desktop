---
"@openflow/desktop": patch
---

First release on npm as `@openflow/desktop`. The published package ships the
compiled modules (`dist/`, each importable as `@openflow/desktop/<name>.ts`),
`electron-builder.base.yml`, the electron-builder signing backport
(`@openflow/desktop/builderPatch.ts`) and the docs. Imports are unchanged from
the Git-pinned dependency; only the dependency specifier in a consumer's
`package.json` changes.
