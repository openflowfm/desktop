# @openflow/desktop

The Electron main process every open[flow] app shares. Read [`README.md`](README.md) and
`docs/` first; `docs/registry.md` is where ports and the app registry are explained.

Run `npm ci`, `npm run typecheck` and `npm test`. Consumers pin this package by commit:
after pushing, update the pin in each consumer's `package.json` and lock.

No dev port is ever fixed or assumed: dev servers take `PORT` or a free port from the OS,
and the app's dev command hands the real one on (see `docs/registry.md`, "Ports").

Every agent commit must end with a blank line and a GitHub-compatible co-author trailer naming the agent that actually made it, for example `Co-authored-by: Codex <noreply@openai.com>` or `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never name an agent that didn't write the commit.
