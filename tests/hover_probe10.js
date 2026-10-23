(sel) => {
 // Iteration 10 probe: current computed colour vs real blended background for links matching sel (used during real hover)
 function parse(c){const m=c&&c.match(/[\d.]+/g);return m?m.map(Number):null}
 function lum(r){const a=r.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]}
 function ratio(a,b){const l1=lum(a),l2=lum(b);return +((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2)}
 function bg(el){const layers=[];while(el&&el.nodeType===1){const v=parse(getComputedStyle(el).backgroundColor);if(v){const a=v.length>3?v[3]:1;if(a>0){layers.push([v[0],v[1],v[2],a]);if(a>=1)break;}}el=el.parentElement}
  let res=[255,255,255];if(layers.length&&layers[layers.length-1][3]>=1)res=layers.pop().slice(0,3);
  for(let i=layers.length-1;i>=0;i--){const L=layers[i];res=res.map((c,p)=>L[p]*L[3]+c*(1-L[3]))}return res.map(x=>Math.round(x))}
 const a=document.querySelectorAll('a[href]')[sel];
 const c=parse(getComputedStyle(a).color);const b=bg(a);
 return {txt:a.textContent.trim().slice(0,30),hovered:a.matches(':hover'),color:c.slice(0,3).join(','),bg:b.join(','),ratio:ratio(c,b),pointedVar:a.style.getPropertyValue('--cplus-link-pointed-color')};
}
