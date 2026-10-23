() => {
 // Iteration 12 probe: layout of key header/CTA links + ClickFacilite classes (display, rect, icon position vs label)
 const pick = (re) => [...document.querySelectorAll('a[href],button')].filter(e => !e.closest('cplus-app-root')).find(e => re.test((e.textContent || '').trim() + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('data-testid') || '')));
 const targets = {
  telechargement: pick(/^T[ée]l[ée]chargement/i),
  github: pick(/^GitHub/i),
  theme: [...document.querySelectorAll('button')].find(b => !b.closest('cplus-app-root') && /th[eè]me|theme|dark|clair|sombre/i.test((b.getAttribute('aria-label') || '') + (b.getAttribute('data-testid') || '') + (b.title || ''))),
  cta: pick(/T[ée]l[ée]charger le \.xpi/i),
  guide: pick(/Guide d.installation complet/i),
 };
 const header = document.querySelector('header');
 const out = { headerH: header ? Math.round(header.getBoundingClientRect().height) : null, items: {} };
 for (const [k, el] of Object.entries(targets)) {
  if (!el) { out.items[k] = null; continue; }
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  const svg = el.querySelector('svg');
  let iconPos = null;
  if (svg) {
   const s = svg.getBoundingClientRect();
   // find label text node rect
   const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() ? 1 : 3 });
   const tn = tw.nextNode();
   if (tn) { const rg = document.createRange(); rg.selectNodeContents(tn); const tr = rg.getBoundingClientRect();
    const vOverlap = Math.min(s.bottom, tr.bottom) - Math.max(s.top, tr.top);
    iconPos = { sideBySide: vOverlap > 0, iconBottom: Math.round(s.bottom), textTop: Math.round(tr.top), stacked: s.bottom <= tr.top + 1 }; }
  }
  out.items[k] = { tag: el.tagName, txt: el.textContent.trim().slice(0, 30), display: cs.display, w: Math.round(r.width), h: Math.round(r.height), pad: cs.paddingTop + '/' + cs.paddingBottom, cls: [...el.classList].filter(c => c.startsWith('click-facilite')).join(' '), iconPos };
 }
 out.counts = {};
 for (const c of ['click-facilite-target', 'click-facilite-enlarged', 'click-facilite-enlarged-inline', 'click-facilite-enlarged-control']) out.counts[c] = document.querySelectorAll('.' + c).length;
 out.style = !!document.getElementById('click-facilite-enlarge-style');
 // flex/grid targets that got display changed by enlarge
 out.enlargedNonInlineDisplays = [...document.querySelectorAll('.click-facilite-enlarged')].map(e => getComputedStyle(e).display);
 out.inlineCls = [...document.querySelectorAll('.click-facilite-enlarged-inline')].map(e => e.tagName + ':' + getComputedStyle(e).display + ':' + e.textContent.trim().slice(0, 20));
 return out;
}
