(sel) => {
 // Iteration 9 probe: per-link custom properties (--cplus-link-color / -visited- / -pointed-) vs real blended background
 function parse(c){const m=c&&c.match(/[\d.]+/g);return m?m.map(Number):null}
 function lum(r){const a=r.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]}
 function ratio(a,b){const l1=lum(a),l2=lum(b);return +((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2)}
 function bg(el){const layers=[];while(el&&el.nodeType===1){const v=parse(getComputedStyle(el).backgroundColor);if(v){const a=v.length>3?v[3]:1;if(a>0){layers.push([v[0],v[1],v[2],a]);if(a>=1)break;}}el=el.parentElement}
  let res=[255,255,255];if(layers.length&&layers[layers.length-1][3]>=1)res=layers.pop().slice(0,3);
  for(let i=layers.length-1;i>=0;i--){const L=layers[i];res=res.map((c,p)=>L[p]*L[3]+c*(1-L[3]))}return res.map(x=>Math.round(x))}
 function resolve(c){if(!c)return null;const p=document.createElement('span');p.style.setProperty('color',c,'important');p.style.display='none';document.body.appendChild(p);const r=getComputedStyle(p).color;p.remove();return parse(r)}
 const st=[...document.querySelectorAll('style')].find(s=>s.id&&s.id.includes('adaptive'));
 const out=[];
 document.querySelectorAll(sel||'a[href]').forEach(a=>{if(a.closest('cplus-app-root'))return;const r=a.getBoundingClientRect();if(!r.width)return;
  const c=parse(getComputedStyle(a).color);const b=bg(a);
  const cls=[...a.classList].filter(x=>x.startsWith('cplus-link')).join(' ');
  const v={link:a.style.getPropertyValue('--cplus-link-color'),visited:a.style.getPropertyValue('--cplus-link-visited-color'),hover:a.style.getPropertyValue('--cplus-link-pointed-color')};
  const o={id:a.id,txt:a.textContent.trim().slice(0,28),cls,color:c.slice(0,3).join(','),bg:b.join(','),ratio:ratio(c,b),states:{}};
  for(const k of ['link','visited','hover']){const rc=resolve(v[k]);if(rc)o.states[k]={c:v[k].trim(),rgb:rc.slice(0,3).join(','),r:ratio(rc,b)}}
  out.push(o)});
 const minState=k=>{const xs=out.filter(o=>o.states[k]).map(o=>o.states[k].r);return xs.length?Math.min(...xs):null};
 const bad=out.filter(o=>o.ratio<4.5||Object.values(o.states).some(s=>s.r<4.5));
 return {n:out.length,styleTag:!!st,styleTxt:st?st.textContent.replace(/\s+/g,' ').slice(0,400):null,min:{computed:out.length?Math.min(...out.map(o=>o.ratio)):null,link:minState('link'),visited:minState('visited'),hover:minState('hover')},bad,all:out,ls:linkStyleServiceInstance.currentValue,cc:window.cplus.colorContrast.currentValue}
}
