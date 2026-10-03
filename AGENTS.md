# AGENTS.md

`@openflow/desktop`: the Electron main process every open[flow] app shares,
compiled from `src/` to `dist/` and published to npm with
`electron-builder.base.yml` and `docs/`. Consumers (mix, set, visuals) import
`@openflow/desktop/<name>.ts` subpaths. Node version is in `.nvmrc`. The README
is an index: read the row for what you're changing.

## Checks

Run `npm ci` once per worktree (its `prepare` also builds `dist/`). Each check
is quick; run each once, in this order, after your last edit. CI
(`.github/workflows/ci.yml`) runs the same list on every push and PR.

| Command | What it checks | When to run |
| --- | --- | --- |
| `npm run typecheck` | `src/` compiles, tests included (no emit) | Any change to `.ts` or tsconfig |
| `npm run build` | Cleans and emits `dist/*.js` and `dist/*.d.ts` | Before `npm test` or `npm pack`; after any change to `src/` or `tsconfig.build.json` |
| `npm test` | Unit tests, the signing backport against the installed electron-builder, and every `@openflow/desktop/<name>.ts` resolving through the exports map to `dist/` | Any change to `src/`, `package.json` exports or build config; needs `npm run build` first |
| `npm run test:coverage` | Same as `npm test` plus coverage (what CI runs) | Instead of `npm test` when coverage matters; not both |
| `npm pack --dry-run` | The tarball holds `dist/`, `docs/`, `electron-builder.base.yml`, README, LICENSE, `package.json`, and no sources or tests | Any change to `files`, `exports` or the build |

There is no watcher; the build is a single `tsc` run.

## Versioning

Below 1.0, a breaking change takes a **minor** bump and a feature or fix a
**patch** bump. No prereleases during 0.x. 1.0.0 is the first release for
other people. Removing or renaming an export, changing a function's signature,
or changing `electron-builder.base.yml` in a way an app must react to is
breaking.

## Rules

- Changing what consumers get (exports, behaviour, the builder base, files)
  needs a changeset: `npx changeset`, commit the file under `.changeset/`.
- Never run `npm publish` or bump `version` by hand. The Release workflow does
  both (see README > Releasing).
- Every module in `src/` is a public subpath. A new module is a new export; a
  removed or renamed one is a breaking change.
- `RENOVATE_DISPATCH_TOKEN` and the `renovate` dispatch event type are a shared
  contract with `openflowfm/renovate`; don't rename them.
- `dist/` is build output and gitignored.
