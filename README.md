# `@openflow/desktop`

Pre-1.0: unstable and in active development; expect breaking changes.

The shared Electron main process for open[flow] apps. This package lives in
[openflowfm/desktop](https://github.com/openflowfm/desktop), separately from its app consumers. `set[flow]` and `visual[flow]` are
each a `main.ts` of about fifty lines plus a preload of five; everything else about
being a desktop app is in this package, once.

It exists because the third app was the one that made the cost visible. Two apps that
each own a whole main process look like duplication you can live with. Three do not —
and the two we had were already drifting: set[flow] remembered where its window was
and visual[flow] did not; visual[flow] refused a second instance and set[flow] did
not; both had a dev-server retry written once and only one of them used it.

**This is an index. Read the row you're changing.**

| touching | read |
|---|---|
| adding an app, or where an app's ports and names come from, or telling every app apart from the ones in this checkout | [`docs/registry.md`](docs/registry.md) — `src/apps.ts`, `present()` |
| the window, its frame, where it may navigate, when the app quits | [`docs/window.md`](docs/window.md) — `src/window.ts`, `bounds.ts`, `navigate.ts`, `state.ts`, `dev.ts` |
| an app serving its own build without a server | [`docs/scheme.md`](docs/scheme.md) — `src/serve.ts` |
| an app that owns a backend process | [`docs/server.md`](docs/server.md) — `src/supervise.ts` |
| keeping shipped apps current | [`docs/update.md`](docs/update.md) — `src/update.ts` |
| what gets built, signed and installed | [`docs/packaging.md`](docs/packaging.md) — `electron-builder.base.yml`, `tools/app.ts` |

## The shape of an app

```ts
const MIX = APPS.mix;
const DEV = devUrl(MIX);
const HOME = DEV || `${MIX.name}://app/`;

state(MIX);   // the state directory, before anything can read it
scheme(MIX);  // the privileged scheme, before whenReady

const window = () => open({ app: MIX, home: HOME, dev: DEV, bounds: true, retry: true });

void app.whenReady().then(() => {
  serve(MIX, DIST);
  window();
  updates(MIX);
});

lifecycle(app, window);
```

That is a whole app that opens where you left it, refuses to navigate away from itself,
opens links in a browser, retries a dev server that has not booted, says `— dev` in its
title when it is pointed at one, keeps its `localStorage` in a bucket nothing else
shares, and updates itself the day there is a feed to update from.

## What is deliberately *not* here

An app's own reason for existing. set[flow] knows where the device is; visual[flow]
owns a server, refuses to be throttled, and puts windows on projectors. Those stay in
their own `main.ts`, and each one is one short block with a comment saying why.

The line to hold: **shared code documents the mechanism, an app documents why it opted
in.** Merging two files merges two reasons, and a reason that has been generalised
until it fits both is a reason nobody can act on.

## Developing and consuming

Use Node 26 or newer (`.nvmrc`). `npm ci`, `npm run typecheck`, `npm run build`
and `npm test` run independently of the app repository; build before testing,
because the exports test checks the built `dist/`. [`AGENTS.md`](AGENTS.md) lists
the exact checks. `npm run test:coverage`
measures the pure and HTTP helpers; Electron window behavior still needs an app.

Consumers install the published package:

```sh
npm install @openflow/desktop
```

`electron` (44.x) is a peer dependency; the app provides it. Imports such as
`@openflow/desktop/apps.ts` resolve to built JavaScript with adjacent types in
`dist/`: Node cannot strip TypeScript in installed dependencies. The browser-safe
`reach-client.ts` export remains separate from Electron and Node implementations.
The builder base is exported as `@openflow/desktop/electron-builder.base.yml`, and
the electron-builder signing backport as `@openflow/desktop/builderPatch.ts` (see
[`docs/packaging.md`](docs/packaging.md)). A commit-pinned Git dependency still
works too: npm's `prepare` compiles `dist/` during Git installation.

The app registry remains here. App-specific entry points, assets, native preparation,
and the build driver remain in the [app repository](https://github.com/ryangavin/better-session-view) —
though apps may live in their own repositories rather than all being checked out
together, and the registry is what keeps the union of all of them: `NAMES` names
every app that exists, and `present(root)` narrows that to every app actually in a
given checkout, which is the list a build driver or CI loop must use once a checkout
cannot be assumed to have them all. Adding an app therefore updates this registry
and the consumer's dependency version.
Do not edit an installed copy or add Desktop back as a workspace. Update this
repository, verify its CI, release it, then update the consumer's version and
verify every app build. No signing or notarization policy changes are part of
consuming this package.

## Releasing

Releases are automated with [Changesets](https://changesets.dev) and
`.github/workflows/release.yml`.

**Versioning policy.** Below 1.0, a breaking change takes a **minor** bump
(0.1.x to 0.2.0) and a feature or fix takes a **patch** bump. No prereleases
during 0.x: every release is a plain `0.y.z`. 1.0.0 is the first release meant
for people outside open[flow]; from then on, ordinary semver applies.

1. In any PR that changes what consumers get, run `npx changeset`, pick the bump
   by the policy above and describe the change. Commit the generated file in
   `.changeset/`.
2. When that PR merges, the Release workflow opens (or updates) a **Version
   packages** PR that bumps `package.json` and writes `CHANGELOG.md`.
3. Merging the Version packages PR publishes to npm with provenance, using npm
   trusted publishing (OIDC, no `NPM_TOKEN`), tags the release on GitHub, then
   sends a `repository_dispatch` (`event_type: renovate`) to
   `openflowfm/renovate` so consumers get their update PRs straight away.

PRs opened by the workflow's `GITHUB_TOKEN` don't trigger CI; the Version
packages PR only touches the version and changelog, and the Release workflow
re-runs typecheck, build and tests before publishing.

### One-time setup (owner, by hand)

Do these in order, before merging the first Version packages PR:

1. **npm org.** Create the `openflow` organisation on npmjs.com if it doesn't
   exist yet, so the `@openflow` scope is yours.
2. **First publish by hand, under `next`.** Trusted publishers can only be
   configured on a package that already exists. From a clean checkout of `main`:
   `npm ci && npm login && npm publish --access public --tag next --provenance=false`
   This publishes the current pre-release (`0.1.0-rc.4`) under the `next` tag, so
   it never becomes `latest`. (`--provenance=false` because provenance needs CI.)
3. **Trusted publisher.** On npmjs.com, package `@openflow/desktop` > Settings >
   Trusted publishing > GitHub Actions: organisation `openflowfm`, repository
   `desktop`, workflow `release.yml`, no environment. Optionally then set
   "Publishing access" to require 2FA and disallow tokens.
4. **Actions permissions.** In the repo's Settings > Actions > General, enable
   "Allow GitHub Actions to create and approve pull requests" (the Version
   packages PR needs it).
5. **Renovate dispatch secret.** Add a repository secret
   `RENOVATE_DISPATCH_TOKEN`: a fine-grained token with Contents read/write on
   `openflowfm/renovate` (what `repository_dispatch` requires). Without it the
   notify step is skipped and Renovate picks the release up on its schedule.

Then merge the Version packages PR: the workflow publishes `0.1.0` as `latest`.
