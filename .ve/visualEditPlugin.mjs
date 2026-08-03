/**
 * Visual Edit Mode — platform-owned Vite plugin, injected at sandbox launch via a
 * wrapper config so the template repo is never touched. Two jobs:
 *   1. transform: stamp host JSX elements with data-ve-loc="relpath:line".
 *   2. inject the in-app bridge by adding `import "virtual:ve-bridge"` to the root
 *      route module in memory (TanStack Start is SSR, so transformIndexHtml can't fire).
 * Dev only (apply:'serve'); enforce:'pre' to stamp raw JSX before plugin-react runs.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

// @babel/core resolved from the app's own node_modules (vite cwd = app root).
const require = createRequire(process.cwd() + '/');
const babel = require('@babel/core');

const VE_BRIDGE_VIRTUAL = 'virtual:ve-bridge';
const VE_BRIDGE_RESOLVED = '\0virtual:ve-bridge';

// In-iframe bridge (client-only). Enables on a parent VE_ENABLE message (or ?ve=1),
// draws hover/selection overlays, and reports the selected element to the parent.
const VE_BRIDGE_SRC = `
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  var ACCENT = '#2F6BED';
  var enabled = false, hoverEl = null, selectedEl = null, raf = 0, parentOrigin = '*';
  // Per-element live-preview originals, so revert restores every edited element.
  var previews = new Map();

  // --- visual overlay (pointer-events:none except the + button) ---
  var layer = null, box = null, badge = null, plus = null;
  function ensureLayer() {
    if (layer) return;
    layer = document.createElement('div');
    layer.setAttribute('data-ve-overlay', '');
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646;';
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;border:2px dashed ' + ACCENT + ';border-radius:4px;box-sizing:border-box;pointer-events:none;display:none;';
    badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;background:' + ACCENT + ';color:#fff;font:600 11px/1 ui-sans-serif,system-ui,sans-serif;padding:3px 6px;border-radius:4px;pointer-events:none;display:none;white-space:nowrap;';
    plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+';
    plus.style.cssText = 'position:fixed;width:24px;height:24px;padding:0;border:none;border-radius:6px;background:' + ACCENT + ';color:#fff;font:400 16px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer;pointer-events:auto;display:none;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(16,24,40,.25);';
    plus.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (hoverEl) select(hoverEl); });
    layer.appendChild(box); layer.appendChild(badge); layer.appendChild(plus);
    (document.body || document.documentElement).appendChild(layer);
  }
  function place(el, mode) {
    if (!el) return;
    var selected = mode === 'selected';
    var r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.left + 'px'; box.style.top = r.top + 'px';
    box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
    box.style.borderStyle = selected ? 'solid' : 'dashed';
    box.style.background = selected ? 'rgba(47,107,237,0.1)' : 'transparent';
    badge.style.display = 'block'; badge.textContent = el.tagName.toLowerCase();
    badge.style.left = r.left + 'px'; badge.style.top = Math.max(0, r.top - 22) + 'px';
    // The "+" is a hover affordance only; the selected element shows the fill instead.
    if (!selected) { plus.style.display = 'flex'; plus.style.left = (r.right - 28) + 'px'; plus.style.top = (r.top + 4) + 'px'; }
    else { plus.style.display = 'none'; }
  }
  function hideOverlay() { if (box) box.style.display = 'none'; if (badge) badge.style.display = 'none'; if (plus) plus.style.display = 'none'; }

  // --- helpers ---
  function hostFor(t) { return (t instanceof Element) ? t.closest('[data-ve-loc]') : null; }
  function instanceIndexOf(host, loc) {
    if (!loc) return 0;
    var all = Array.prototype.slice.call(document.querySelectorAll('[data-ve-loc="' + CSS.escape(loc) + '"]'));
    return Math.max(0, all.indexOf(host));
  }
  function rectOf(el) { var r = el.getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; }
  var STYLE_KEYS = ['color','backgroundColor','borderColor','borderWidth','borderStyle','borderRadius','fontSize','fontWeight','fontFamily','textAlign','textDecorationLine','lineHeight','letterSpacing','padding','margin','opacity','display','width','height','gap','justifyContent','alignItems'];
  function stylesOf(el) { var cs = getComputedStyle(el), out = {}; for (var i = 0; i < STYLE_KEYS.length; i++) out[STYLE_KEYS[i]] = cs[STYLE_KEYS[i]]; return out; }
  function post(type, extra) { if (window.parent) window.parent.postMessage(Object.assign({ source: 'visual-edit', type: type }, extra || {}), parentOrigin); }

  // --- selection ---
  function elementFor(loc, idx) {
    if (!loc) return null;
    var all = document.querySelectorAll('[data-ve-loc="' + CSS.escape(loc) + '"]');
    return all[idx] || all[0] || null;
  }
  function selOf(host) {
    var loc = host.getAttribute('data-ve-loc');
    return {
      veLoc: loc,
      tag: host.tagName.toLowerCase(),
      text: (host.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 2000),
      // childElementCount === 0 ⇒ pure-text node ⇒ safe to edit Text Content.
      childCount: host.childElementCount,
      instanceIndex: instanceIndexOf(host, loc),
      rect: rectOf(host),
      styles: stylesOf(host)
    };
  }
  function postSelected(host) { var sel = selOf(host); window.__VE_LAST__ = sel; post('VE_SELECTED', sel); }
  function select(host) { selectedEl = host; place(host, 'selected'); postSelected(host); }

  // --- events ---
  // Hover is paused while an element is selected; the parent sends VE_CLEAR to resume.
  function onMove(e) {
    if (!enabled || selectedEl) return;
    var h = hostFor(e.target);
    if (h === hoverEl) return;
    hoverEl = h;
    if (h) place(h, 'hover');
    else hideOverlay();
  }
  function onClick(e) { if (!enabled || selectedEl) return; var h = hostFor(e.target); if (!h) return; e.preventDefault(); e.stopPropagation(); select(h); }
  function sync() {
    raf = 0;
    if (selectedEl) { place(selectedEl, 'selected'); post('VE_LAYOUT', { veLoc: selectedEl.getAttribute('data-ve-loc'), rect: rectOf(selectedEl) }); }
    else if (hoverEl) place(hoverEl, 'hover');
  }
  function onScrollResize() { if (!enabled) return; if (!raf) raf = requestAnimationFrame(sync); }

  // --- live preview (queue-driven, per element) ---
  // The parent sends the whole edit queue; the bridge reverts every tracked
  // element then replays it, keeping the preview in sync across switches/undo/redo.
  function entryFor(el) {
    var e = previews.get(el);
    if (!e) { e = { styles: {}, text: undefined }; previews.set(el, e); }
    return e;
  }
  function setPreviewStyle(el, prop, value) {
    var e = entryFor(el);
    if (!(prop in e.styles)) e.styles[prop] = el.style[prop] || '';
    el.style[prop] = value;
  }
  function setPreviewText(el, value) {
    var e = entryFor(el);
    if (e.text === undefined) e.text = el.textContent;
    el.textContent = value;
  }
  function revertAll() {
    previews.forEach(function (e, el) {
      for (var p in e.styles) el.style[p] = e.styles[p];
      if (e.text !== undefined) el.textContent = e.text;
    });
    previews.clear();
  }
  function applyEdits(edits, refresh) {
    revertAll();
    if (Array.isArray(edits)) {
      for (var i = 0; i < edits.length; i++) {
        var ed = edits[i];
        var el = elementFor(ed.veLoc, ed.instanceIndex || 0);
        if (!el) continue;
        if (ed.kind === 'style' && ed.prop) setPreviewStyle(el, ed.prop, ed.value);
        else if (ed.kind === 'text') setPreviewText(el, ed.text);
      }
    }
    // Re-sync the selected overlay; on restoring ops re-post its styles/text.
    if (selectedEl) { place(selectedEl, 'selected'); if (refresh) postSelected(selectedEl); }
  }

  function enable() {
    if (enabled) return;
    enabled = true; ensureLayer();
    document.addEventListener('click', onClick, true);
    document.addEventListener('mousemove', onMove, true);
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize, true);
    window.__VE_ENABLED__ = true;
    post('VE_READY');
  }
  function disable() {
    enabled = false;
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('mousemove', onMove, true);
    window.removeEventListener('scroll', onScrollResize, true);
    window.removeEventListener('resize', onScrollResize, true);
    revertAll();
    hoverEl = null; selectedEl = null; hideOverlay();
    window.__VE_ENABLED__ = false;
  }

  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.source !== 'visual-edit-parent') return;
    // Only accept commands from the real parent window, and pin its origin from
    // the first message — ignore any later message from another window/origin so
    // a cross-origin sender can't drive the bridge or hijack replies.
    if (e.source !== window.parent) return;
    if (parentOrigin === '*') { if (e.origin) parentOrigin = e.origin; }
    else if (e.origin !== parentOrigin) return;
    if (d.type === 'VE_ENABLE') enable();
    else if (d.type === 'VE_DISABLE') disable();
    // VE_CLEAR drops selection/overlay but keeps previews; VE_REVERT undoes them.
    else if (d.type === 'VE_CLEAR') { selectedEl = null; hoverEl = null; hideOverlay(); }
    else if (d.type === 'VE_APPLY_EDITS') applyEdits(d.edits, d.refresh);
    else if (d.type === 'VE_RESELECT') { var el = elementFor(d.veLoc, d.instanceIndex || 0); if (el) select(el); }
    else if (d.type === 'VE_REVERT') revertAll();
  });
  // ?ve auto-enables only at top level (not framed). A framed preview must go
  // through the VE_ENABLE handshake so parentOrigin is pinned before we post
  // selection data — never broadcast it to an unpinned '*' from inside an iframe.
  if (window.parent === window && new URLSearchParams(location.search).has('ve')) enable();
  // Announce on every (re)init (incl. HMR) so the parent re-arms. VE_HELLO carries
  // no data, so broadcasting it for the handshake is safe.
  post('VE_HELLO');
  console.log('[VE] bridge loaded (injected plugin)');
}
`;

// Babel plugin: add data-ve-loc to intrinsic (host) JSX elements only.
// Stamp file:line, NOT column — columns can drift between the SSR and client
// passes and trigger a React hydration mismatch. file:line + instanceIndex is unique.
function veLocBabel({ types: t }) {
  return {
    name: 've-loc',
    visitor: {
      JSXOpeningElement(p, state) {
        const name = p.node.name;
        if (!name || name.type !== 'JSXIdentifier' || !/^[a-z]/.test(name.name))
          return;
        if (
          p.node.attributes.some(
            (a) =>
              a.type === 'JSXAttribute' &&
              a.name &&
              a.name.name === 'data-ve-loc',
          )
        )
          return;
        const loc = p.node.loc;
        if (!loc) return;
        const rel = (state.opts && state.opts.rel) || 'unknown';
        p.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier('data-ve-loc'),
            t.stringLiteral(`${rel}:${loc.start.line}`),
          ),
        );
      },
    },
  };
}

export function visualEditPlugin() {
  let root = process.cwd();
  return {
    name: 'visual-edit',
    apply: 'serve',
    enforce: 'pre',
    configResolved(c) {
      root = c.root;
    },
    resolveId(id) {
      if (id === VE_BRIDGE_VIRTUAL) return VE_BRIDGE_RESOLVED;
      return null;
    },
    load(id) {
      if (id === VE_BRIDGE_RESOLVED) return VE_BRIDGE_SRC;
      return null;
    },
    transform(code, id) {
      const file = id.split('?')[0];
      if (file.includes('node_modules') || !/\.(t|j)sx$/.test(file))
        return null;
      const rel = path.relative(root, file);
      let out;
      try {
        const res = babel.transformSync(code, {
          filename: file,
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ['jsx', 'typescript'] },
          plugins: [[veLocBabel, { rel }]],
          sourceMaps: true,
          sourceFileName: file,
        });
        if (!res || res.code == null) return null;
        out = res.code;
      } catch {
        return null; // never break the app over a stamp
      }
      // Inject the bridge once, via the always-loaded root route module.
      if (file.endsWith('/routes/__root.tsx')) {
        out = `import ${JSON.stringify(VE_BRIDGE_VIRTUAL)};\n${out}`;
      }
      return { code: out, map: null };
    },
  };
}

export default visualEditPlugin;
