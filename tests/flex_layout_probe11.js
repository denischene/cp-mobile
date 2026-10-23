() => {
 // Iteration 11 probe: snapshot of every page element (rect) + flex/grid containers text, to compare before/after read-aloud word/sentence/noModifications.
 // First call stores element references in window.__refs; later calls compare the same nodes. Wait for document.fonts.ready + ~2.5s before the baseline.
 if(!window.__refs){window.__refs=[...document.body.querySelectorAll('*')].filter(e=>!e.closest('cplus-app-root')&&!e.matches('script,style,[class*="cplus"]'));}
 const refs=window.__refs;
 const flex=refs.filter(e=>/flex|grid/.test(getComputedStyle(e).display)&&e.getBoundingClientRect().width>0);
 const m=document.querySelector('.App')||document.body;
 return {n:refs.length,
   rects:refs.map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]}),
   flexTxt:flex.map(e=>e.textContent), flexInner:flex.map(e=>e.innerText), flexN:flex.length,
   appTxt:m.textContent, appInner:m.innerText,
   spans:document.querySelectorAll('[class*="read-aloud"]').length}
}
