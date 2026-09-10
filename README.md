# `@openflow/desktop`

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
| adding an app, or where an app's ports and names come from | [`docs/registry.md`](docs/registry.md) — `src/apps.ts` |
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

Use Node 26 or newer. `npm ci`, `npm test`, `npm run typecheck`, and
`npm run build` run independently of the app repository. `npm run test:coverage`
measures the pure and HTTP helpers; Electron window behavior still needs an app.

Consumers install a full commit-pinned Git dependency from this repository. npm's
`prepare` compiles JavaScript and declarations during Git installation. Existing
imports such as `@openflow/desktop/apps.ts` resolve to built JavaScript with adjacent
types: Node cannot strip TypeScript in installed dependencies. The browser-safe
`reach-client.ts` export remains separate from Electron and Node implementations.
The builder base is exported as `@openflow/desktop/electron-builder.base.yml`.

The app registry remains here. App-specific entry points, assets, native preparation,
and the build driver remain in the [app repository](https://github.com/ryangavin/better-session-view).
Adding an app therefore updates this registry and the consumer's pinned commit.
Do not edit an installed copy or add Desktop back as a workspace. Update this
repository, verify its CI, then update the consumer pin and verify every app build.
No npm registry publication is needed. No signing or notarization policy changes
are part of consuming this package.
