// Published mode: the album lives inside this page. The owner edits a draft and presses Publish,
// which republishes the page with the album embedded; everyone else sees the last published version.
import type { AppState } from './types';

type ClaudeNS = { use: (name: string) => Promise<unknown> };
const claude = () => (window as unknown as { claude?: ClaudeNS }).claude;

export const isPublishedBuild = import.meta.env.VITE_TARGET === 'artifact';

/* ---------- the album embedded in the page ---------- */
export interface Embedded { state: AppState; stamp: number }

export function readEmbedded(): Embedded | null {
  try {
    const el = document.getElementById('ourstory-data');
    if (!el?.textContent?.trim()) return null;
    const data = JSON.parse(el.textContent) as Embedded;
    return data?.state?.memories ? data : null;
  } catch {
    return null;
  }
}

/* ---------- who is looking ---------- */
export async function canEditPage(): Promise<boolean> {
  const c = claude();
  if (!c) return false;
  try {
    const user = (await c.use('user')) as { canEdit?: () => Promise<boolean> } | null;
    const art = await c.use('artifact');
    if (!art) return false;
    return (await user?.canEdit?.()) ?? false;
  } catch {
    return false;
  }
}

/* ---------- rebuilding the page ---------- */
// Captured once at startup, before anything changes: the app's own CSS and JS as they shipped.
const shipped = {
  css: document.getElementById('os-css')?.textContent ?? '',
  js: document.getElementById('os-js')?.textContent ?? '',
  head: document.getElementById('os-head')?.innerHTML ?? '',
  reset: document.head?.querySelector('style')?.textContent ?? '',
};

const RESET = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.5 system-ui,-apple-system,sans-serif;background:#fafaf9}img{max-width:100%}[hidden]{display:none!important}';

const LS = new RegExp(String.fromCharCode(0x2028), 'g');
const PS = new RegExp(String.fromCharCode(0x2029), 'g');
const safeJson = (x: unknown) => JSON.stringify(x).replace(/</g, '\\u003c').replace(LS, '\\u2028').replace(PS, '\\u2029');

export function buildDocument(state: AppState, stamp: number): string {
  const data = safeJson({ state: { ...state, family: { ...state.family, theme: 'system' } }, stamp });
  return (
    '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    `<style>${shipped.reset || RESET}</style></head><body>` +
    `<template id="os-head">${shipped.head}</template>` +
    shipped.head +
    `<style id="os-css">${shipped.css}</style>` +
    '<div id="root"></div>' +
    `<script type="application/json" id="ourstory-data">${data}</script>` +
    `<script type="module" id="os-js">${shipped.js}</script>` +
    '</body></html>'
  );
}

export const LIMIT_BYTES = 15.5 * 1024 * 1024;
export const pageBytes = (state: AppState) => shipped.css.length + shipped.js.length + safeJson(state).length + 4000;

export type PublishOutcome = 'ok' | 'conflict' | 'too_large' | 'not_writer' | 'error';

export async function publishPage(state: AppState, stamp: number): Promise<PublishOutcome> {
  const c = claude();
  if (!c || !shipped.js) return 'error';
  const art = (await c.use('artifact')) as { publish: (html: string) => Promise<unknown> } | null;
  if (!art) return 'not_writer';
  try {
    await art.publish(buildDocument(state, stamp));
    return 'ok';
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'conflict') return 'conflict';
    if (code === 'too_large') return 'too_large';
    if (code === 'not_writer' || code === 'not_granted' || code === 'consent_required') return 'not_writer';
    return 'error';
  }
}
