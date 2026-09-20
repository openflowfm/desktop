import { app as electron } from 'electron';
import os from 'node:os';
import path from 'node:path';
import { uiPort, type App } from './apps.ts';
import { isDev } from './dev.ts';

/**
 * Where an app's own state lives, and it has to be said **before anything can
 * read it**.
 *
 * An unpackaged Electron app defaults to `~/Library/Application Support/
 * Electron` — a directory every unpackaged Electron app on the machine shares,
 * this repo's included. That is where `localStorage` goes, so leaving it there
 * would mean set[flow]'s column widths and visual[flow]'s keystone corners in
 * one bucket, each disappearing the day something else claimed it.
 *
 * Under `~/.openflow` instead, which is the root this project already keeps
 * state in, and one directory per app beneath it. Moving this later moves the
 * storage, so it is the first line of every `main.ts` for a reason.
 *
 * **A dev run gets a directory of its own, per dev server.** Chromium holds a
 * profile for one process, so two shells on one `userData` fight over it — and
 * two dev shells is the ordinary case: a second worktree on its own
 * `OPENFLOW_PORT_BASE`, opened against the same device. The vite port is what
 * already tells those worktrees apart, so it names the profile too:
 * `~/.openflow/<name>/dev/<port>/electron`. A packaged app is one instance and
 * keeps the one directory.
 */
export function state(one: App): string {
  const here = isDev()
    ? path.join(machine(one), 'dev', String(uiPort(one)), 'electron')
    : path.join(machine(one), 'electron');
  electron.setPath('userData', here);
  return here;
}

/**
 * The app's directory under `~/.openflow`, for what belongs to the *machine*
 * rather than to one profile: mix[flow]'s Python engine is half a gigabyte of
 * wheels that every dev shell should share rather than build again. `state()`
 * is beneath this; so is anything an app keeps outside Electron's own storage.
 */
export function machine(one: App): string {
  const home = process.env.OPENFLOW_HOME ?? path.join(os.homedir(), '.openflow');
  return path.join(home, one.name);
}
