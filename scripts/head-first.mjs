// Preview build only: the preview host supplies <html>/<head>/<body>, so strip ours
// and move the title, meta and font links to the very top of the file.
// Only the markup outside the inlined <script> and <style> is touched.
import { readFileSync, writeFileSync } from 'node:fs';
const f = 'dist/index.html';
const src = readFileSync(f, 'utf8');
const parts = src.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/);
const head = [];
let styled = false, scripted = false;
const out = parts.map((p, i) => {
  if (i % 2 === 1) {
    // tag the app's own CSS and JS so the page can rebuild itself when the owner publishes
    if (!styled && p.startsWith('<style')) { styled = true; return p.replace(/^<style[^>]*>/, '<style id="os-css">'); }
    if (!scripted && /^<script type="module"/.test(p)) { scripted = true; return p.replace(/^<script[^>]*>/, '<script type="module" id="os-js">'); }
    return p;
  }
  return p
    .replace(/<!doctype html>|<\/?html[^>]*>|<\/?head>|<\/?body>|<meta charset[^>]*>|<meta name="viewport"[^>]*>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>|<meta name="(?:description|theme-color)"[^>]*>|<link rel="(?:preconnect|stylesheet|icon)" href="(?:https:\/\/fonts|data:)[^>]*>/g, (m) => { head.push(m); return ''; });
});
const headHtml = head.join('');
writeFileSync(f, `<template id="os-head">${headHtml}</template>` + headHtml + '\n' + out.join('').trim() + '\n');
