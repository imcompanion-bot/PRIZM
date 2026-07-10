export function initLegacyModule(D) {
  window.D = D; // ensure it's on window too
  
  if (typeof window !== 'undefined' && !window.storage) {
    window.storage = {
      get: async (key) => { const v = localStorage.getItem(key); return v ? { value: v } : null; },
      set: async (key, value) => { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); }
    };
  }

  window.kpixTrendT = kpixTrendT;
  window.kpixGuideT = kpixGuideT;
  window.kpixAnnualT = kpixAnnualT;
  window.showKpix = showKpix;
  window.kpixScopeMkt = kpixScopeMkt;
  window.kpixScopeHub = kpixScopeHub;
  window.kpixScopeClient = kpixScopeClient;
  window.kpixCustom = kpixCustom;
  window.kpixToggleFilters = kpixToggleFilters;

const NEAR=D.NEAR_MO,PREV=D.PREV_MO,ALL=[...PREV,...NEAR],FX=D.FX;const AS_OF=D.AS_OF||'2026-06';const isElapsed=(mk)=>PREV.includes(mk)||mk<AS_OF;
const MN={'2025-05':'May 25','2025-06':'Jun 25','2025-07':'Jul 25','2025-08':'Aug 25','2025-09':'Sep 25','2025-10':'Oct 25','2026-01':'Jan','2026-02':'Feb','2026-03':'Mar','2026-04':'Apr','2026-05':'May','2026-06':'Jun','2026-07':'Jul','2026-08':'Aug','2026-09':'Sep','2026-10':'Oct','2026-11':'Nov','2026-12':'Dec','2027-01':'Jan 27'};
const STGCLS={Committed:'stg-co',Negotiation:'stg-ne',Pitch:'stg-pi',Brief:'stg-br',Speculative:'stg-sp'};
const STGORD={Committed:5,Negotiation:4,Pitch:3,Brief:2,Speculative:1};
const US_HEX=D.us.hub_hex||{'Hub 1':'#1a52b8','Hub 2':'#7c3aed','Hub 3':'#1f7a4a','New Business':'#b45309'};
const UK_AM_HEX=['#1f7a4a','#0e7490','#7c3aed','#b45309','#9d174d','#374151','#065f46','#a05200','#1e4fa8'];
const UK_AMS=Object.keys(D.uk.owner_clients||{});
const UKHEX={};UK_AMS.forEach((am,i)=>{UKHEX[am]=UK_AM_HEX[i%UK_AM_HEX.length];});
let charts={},mkt='grp',view='overview',curGroup=null,curClient=null;
const dk=()=>matchMedia('(prefers-color-scheme:dark)').matches;
const mn=m=>MN[m]||m;
function __sortVal(s){
  if(s==null)return {n:NaN,t:''};
  let t=(''+s).replace(/\u2009|\u00a0/g,' ').trim();
  // strip trailing markers/notes
  const tl=t.toLowerCase();
  // pure-ish number with optional $ £ % k m , + - and words like 'ahead/behind'
  let neg=/^[(\u2212-]/.test(t)||/-/.test(t.replace(/[^\d-]/g,'').slice(0,1));
  let cleaned=t.replace(/[, ]/g,'');
  let mult=1;
  if(/m\b/i.test(cleaned)||/m$/i.test(cleaned.replace(/[^\dkm]/gi,'')))mult=1e6;
  else if(/k\b/i.test(cleaned)||/k$/i.test(cleaned.replace(/[^\dkm]/gi,'')))mult=1e3;
  let num=parseFloat(cleaned.replace(/[^0-9.\-]/g,''));
  if(/^[\u2212(]/.test(t))num=-Math.abs(num);
  if(!isNaN(num)){if(/behind|\u2193|declining/i.test(tl))num=-Math.abs(num)-1e-9;return {n:num*mult,t:tl};}
  return {n:NaN,t:tl};
}
function __sortTable(table,ci,dir){
  const tb=table.querySelector('tbody');if(!tb)return;
  const rows=[...tb.querySelectorAll(':scope > tr')];
  // keep pinned rows (model/estimate/total) out of the sort, in place at end
  const pinned=[],sortable=[];
  rows.forEach(r=>{(/\b(est|trail|total|pinned)\b/.test(r.className)||/model|estimate|→/i.test(r.textContent.slice(0,24)))?pinned.push(r):sortable.push(r);});
  const get=r=>{const c=r.children[ci];return c?__sortVal(c.textContent):{n:NaN,t:''};};
  const allNum=sortable.every(r=>{const v=get(r);return v.t===''||!isNaN(v.n);});
  sortable.sort((a,b)=>{const x=get(a),y=get(b);
    let c;
    if(allNum){const xn=isNaN(x.n)?-Infinity:x.n,yn=isNaN(y.n)?-Infinity:y.n;c=xn-yn;}
    else c=x.t<y.t?-1:x.t>y.t?1:0;
    return dir==='asc'?c:-c;});
  sortable.forEach(r=>tb.appendChild(r));pinned.forEach(r=>tb.appendChild(r));
}
function __initSort(){
  if(window.__sortBound)return;window.__sortBound=true;
  document.addEventListener('click',e=>{
    const th=e.target.closest('.tbl th, table th');if(!th)return;
    const table=th.closest('table');if(!table)return;
    const heads=[...th.parentElement.children];const ci=heads.indexOf(th);if(ci<0)return;
    const cur=table.getAttribute('data-sort-col');const curDir=table.getAttribute('data-sort-dir')||'desc';
    let dir=(cur==(''+ci))?(curDir==='asc'?'desc':'asc'):'desc';
    table.setAttribute('data-sort-col',ci);table.setAttribute('data-sort-dir',dir);
    heads.forEach(h=>{h.querySelector('.sort-caret')?.remove();h.classList.remove('sorted');});
    th.classList.add('sorted');
    const car=document.createElement('span');car.className='sort-caret';car.textContent=dir==='asc'?' \u25b4':' \u25be';
    th.appendChild(car);
    __sortTable(table,ci,dir);
  });
}
function dc(){__initSort();__initComp();Object.values(charts).forEach(c=>{try{c.destroy()}catch(e){}});charts={};}
const f$=n=>{if(n==null||isNaN(n))return'—';const a=Math.abs(Math.round(n)),s=n<0?'-':'';if(a>=1e6)return s+'$'+(a/1e6).toFixed(1)+'m';if(a>=1e3)return s+'$'+Math.round(a/1e3)+'k';return s+'$'+a;};
const fL=n=>{if(n==null||isNaN(n))return'—';const a=Math.abs(Math.round(n)),s=n<0?'-':'';if(a>=1e6)return s+'£'+(a/1e6).toFixed(1)+'m';if(a>=1e3)return s+'£'+Math.round(a/1e3)+'k';return s+'£'+a;};
const fc=n=>n>=1?'<span class="badge g">'+Math.round(n*100)+'%</span>':n>=0.75?'<span class="badge a">'+Math.round(n*100)+'%</span>':'<span class="badge r">'+Math.round(n*100)+'%</span>';
const df=(p,t,m)=>{const d=p-t,fmt=m==='us'?f$:fL;return d>=0?'<span class="pos">+'+fmt(d)+'</span>':'<span class="neg">'+fmt(d)+'</span>';};
const tI=t=>t==='growing'?'<span class="pos">↑</span>':t==='declining'?'<span class="neg">↓</span>':'<span style="color:var(--stone)">→</span>';
function getRr(client,m){const cs=(m==='us'?D.us:D.uk).client_steady?.[client];if(cs&&cs.rr)return cs.rr;const bb=(m==='us'?D.us:D.uk).bb_stats?.[client];if(!bb||!bb.avg12)return 0;return Math.max(0,bb.avg12);}
const copts=(cur)=>({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${cur}${c.raw}k`},backgroundColor:dk()?'rgba(26,23,20,.95)':'rgba(255,255,255,.97)',titleColor:dk()?'#c8bfb3':'#3d3830',bodyColor:dk()?'#9e9487':'#6b6358',borderColor:dk()?'rgba(255,255,255,.08)':'rgba(0,0,0,.07)',borderWidth:1,padding:10,cornerRadius:6}},scales:{x:{ticks:{font:{size:10,family:'"DM Mono"'},color:'#9e9487',maxRotation:0,autoSkip:true,maxTicksLimit:12},grid:{display:false},border:{display:false}},y:{ticks:{font:{size:10,family:'"DM Mono"'},color:'#9e9487',callback:v=>cur+v+'k'},grid:{color:dk()?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)'},border:{display:false}}}});
function switchMarket(m){mkt=m;view='overview';curGroup=null;curClient=null;['grp','us','uk'].forEach(v=>{const el=document.getElementById('mbt-'+v);if(el)el.className='mkt-btn on-'+v+(v===m?' on':'');});buildSidebar();showOverview();}
function buildSidebar(){
  // Handled by React Sidebar component
}
function showOverview(){view='overview';COMP_FOCUS=null;curGroup=null;curClient=null;buildSidebar();dc();if(mkt==='grp')renderGroup();else renderAgency();}
function showGroup(g){view='group';COMP_FOCUS=null;curGroup=g;curClient=null;buildSidebar();dc();renderGroupView(g);}
function showClient(g,c){view='client';COMP_FOCUS=null;curGroup=g;curClient=c;buildSidebar();dc();renderClient(g,c);}
function showFlags(){view='flags';curGroup=null;curClient=null;buildSidebar();dc();renderFlags();}
let KPIX={active:['booked','gp_created'],preset:12,custom:null,hub:'',client:'',fcast:3,gran:'mo',trend:false,showFilters:false};
const BRAND_COLORS = ['#4b70d8', '#fe4f2a', '#ff7daa', '#ffc300'];
const KX_DAILY=['briefs_created','gp_created','briefs_won'];
function showKpix(){view='kpix';curGroup=null;curClient=null;buildSidebar();dc();renderKpix();
  if(!window.__kpixRsz){window.__kpixRsz=1;window.addEventListener('resize',()=>{if(view==='kpix')renderKpix();});}}
function kpixToggleFilters(){KPIX.showFilters=!KPIX.showFilters;renderKpix();}
function kpixToggle(k){const i=KPIX.active.indexOf(k);if(i>=0){if(KPIX.active.length>1)KPIX.active.splice(i,1);}else{if(KPIX.active.length<4)KPIX.active.push(k);}renderKpix();}
function kpixPreset(n){KPIX.preset=n;KPIX.custom=null;if(n>=24&&KPIX.gran==='mo')KPIX.gran='q3';renderKpix();}
function kpixFcast(n){KPIX.fcast=n;renderKpix();}
function kpixGran(g){KPIX.gran=g;renderKpix();}
function kpixTrendT(){KPIX.trend=!KPIX.trend;renderKpix();}
function kpixBucket(labels,vals,agg,size,fromStart){
  if(!labels||!labels.length)return{labels:[],vals:[]};
  const n=labels.length;const L=[],V=[];const groups=[];
  if(fromStart){let i=0;while(i<n){groups.push([i,Math.min(i+size,n)]);i+=size;}}
  else{const off=n%size;let i=off;while(i<n){groups.push([i,Math.min(i+size,n)]);i+=size;}}
  groups.forEach(g2=>{const a=g2[0],b=g2[1];
    const lv=vals.slice(a,b).filter(v=>v!=null);
    V.push(lv.length?(agg==='sum'?lv.reduce((x,y)=>x+y,0):lv.reduce((x,y)=>x+y,0)/lv.length):null);
    const l1=labels[a],l2=labels[b-1];const part=(b-a)<size?'*':'';
    L.push((l1===l2?kpixMn(l1):(l1.slice(0,4)===l2.slice(0,4)?kpixMn(l1).slice(0,3)+'\u2013'+kpixMn(l2):kpixMn(l1)+'\u2013'+kpixMn(l2)))+part);});
  return{labels:L,vals:V};}
function kpixCustom(){const f=document.getElementById('kpix-from')?.value,t=document.getElementById('kpix-to')?.value;if(f&&t&&f<=t){KPIX.custom=[f,t];renderKpix();}}
function kpixScopeMkt(){const v=document.getElementById('kpix-mkt')?.value||'grp';mkt=v;KPIX.hub='';KPIX.client='';buildSidebar();renderKpix();}
function kpixScopeHub(){KPIX.hub=document.getElementById('kpix-hub')?.value||'';KPIX.client='';renderKpix();}
function kpixScopeClient(){KPIX.client=document.getElementById('kpix-client')?.value||'';renderKpix();}
function kpixFmt(u,v){if(v==null||isNaN(v))return'—';if(u==='money')return (mkt==='us'?f$:fL)(v);if(u==='pct')return Math.round(v)+'%';return Math.round(v*10)/10+'';}
function kpixMn(m){const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m.slice(5,7)-1];return mo+' '+m.slice(2,4);}
function kpixDn(d){return +d.slice(8,10)+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+d.slice(5,7)-1];}
function kpixWindow(){
  const all=D.kpix.meta.labels;
  if(KPIX.custom){const [f,t]=KPIX.custom;
    const days=Math.round((new Date(t)-new Date(f))/864e5)+1;
    if(days<=130)return{mode:'daily',from:f,to:t,days};
    const fm=f.slice(0,7),tm=t.slice(0,7);
    let lab=all.filter(m=>m>=fm&&m<=tm);if(!lab.length)lab=all.slice(-12);
    return{mode:'monthly',lab};}
  return{mode:'monthly',lab:all.slice(-Math.min(KPIX.preset,all.length))};}
function kpixDaily(metric,f,t){
  const ints=s=>+s.replaceAll('-','');const fi=ints(f),ti=ints(t);
  const mks=mkt==='grp'?['us','uk']:[mkt];const buckets={};
  const days=[];let dt=new Date(f+'T00:00:00');const end=new Date(t+'T00:00:00');
  while(dt<=end&&days.length<131){days.push(dt.toISOString().slice(0,10));dt.setDate(dt.getDate()+1);}
  days.forEach(d=>buckets[ints(d)]=0);
  mks.forEach(mk2=>{const E=D.kpix.events[mk2];if(!E)return;const fx=(mk2==='uk'&&mkt==='grp')?FX:1;
    const rows=metric==='briefs_won'?E.closed:E.created;
    rows.forEach(r=>{const[dy,gp,hi,cl]=r;if(dy<fi||dy>ti)return;
      if(metric==='briefs_won'&&!r[4])return;
      if(KPIX.client&&cl!==KPIX.client)return;
      if(!KPIX.client&&KPIX.hub&&E.hubs[hi]!==KPIX.hub)return;
      if(!(dy in buckets))return;
      buckets[dy]+=metric==='gp_created'?gp*fx:1;});});
  return{days,vals:days.map(d=>Math.round(buckets[ints(d)]))};}
function kpixAgg(def,vals){
  const nums=vals.filter(v=>v!=null);if(!nums.length)return null;
  if(def.agg==='sum')return nums.reduce((a,b)=>a+b,0);
  if(def.agg==='avg')return nums.reduce((a,b)=>a+b,0)/nums.length;
  return nums[nums.length-1];}
let KPIX_GUIDE=true;
function kpixGuideT(){KPIX_GUIDE=!KPIX_GUIDE;renderKpix();}
function __pct(a,b){return (b&&b!==0)?Math.round((a-b)/Math.abs(b)*100):null;}
function kpixCommentary(act,defs,getfn,scopeName,daily,granN,fN){
  const lines=[];
  const dirWord=(p)=>p==null?'about flat':p>=8?'up a lot':p>=2?'up a little':p<=-8?'down a lot':p<=-2?'down a little':'about flat';
  act.forEach(k=>{
    const d=defs[k];const g=getfn(k);if(!g)return;
    const vals=g.vals.filter(v=>v!=null);if(vals.length<2)return;
    const last=vals[vals.length-1];
    // smoothed direction: average of first third vs last third (avoids endpoint noise)
    const seg=Math.max(1,Math.floor(vals.length/3));
    const headAvg=vals.slice(0,seg).reduce((a,b)=>a+b,0)/seg;
    const tailAvg=vals.slice(-seg).reduce((a,b)=>a+b,0)/seg;
    const p=__pct(tailAvg,headAvg);
    const unitName=d.n.replace(/ \(.*\)/,'').toLowerCase();
    const fmtv=(v)=>d.u==='money'?(mkt==='us'?f$:fL)(v):d.u==='pct'?Math.round(v)+'%':Math.round(v*10)/10;
    let s=`<b>${d.n}</b> is now ${fmtv(last)}, ${dirWord(p)}${p!=null&&Math.abs(p)>=2?` (${p>=0?'+':''}${p}% across the period)`:''}.`;
    // model forward comment
    if(fN&&g.fvals&&g.fvals.some(v=>v!=null)){
      const fv=g.fvals.filter(v=>v!=null);const fl=fv[fv.length-1];const fp=__pct(fl,last);
      if(d.u==='money'&&d.agg==='sum'){
        const histAvg=vals.slice(-3).reduce((a,b)=>a+b,0)/Math.min(3,vals.length);
        const fAvg=fv.reduce((a,b)=>a+b,0)/fv.length;const mp=__pct(fAvg,histAvg);
        s+=` The model expects the next ${fN} months to run ${dirWord(mp)} versus recent months.`;
      } else {
        s+=` The model assumes it stays around ${fmtv(fl)} going forward${Math.abs(fp||0)>=5?` — worth a sense-check`:''}.`;
      }
    }
    // metric-specific plain-English meaning
    if(k==='gp_retention'){const v=last;s+=v>=100?` Above 100% means this book is <b>growing</b> versus a year ago — clients are staying and spending more.`:` Below 100% means it's bringing in <b>less</b> than a year ago — worth understanding why.`;}
    if(k==='win_rate')s+=` That's the share of pitched briefs being won.`;
    if(k==='booked'&&d.agg==='sum')s+=` This is delivered gross profit — money actually earned.`;
    lines.push(s);
  });
  // cross-metric nudge: pipeline-in vs booked
  if(act.includes('gp_created')&&act.includes('booked')){
    const gc=getfn('gp_created'),bk=getfn('booked');
    if(gc&&bk){const gcl=gc.vals.filter(v=>v!=null),bkl=bk.vals.filter(v=>v!=null);
      if(gcl.length&&bkl.length){const gp=__pct(gcl[gcl.length-1],gcl[0]),bp=__pct(bkl[bkl.length-1],bkl[0]);
        if(gp!=null&&bp!=null&&gp<bp-10)lines.push(`<b>Heads-up:</b> new work coming in (pipeline) is growing slower than what's being delivered — today's delivery is healthy but the future pipeline may be thinning.`);
      }}
  }
  const intro=`Here's what this ${daily?'daily ':''}view of <b>${scopeName}</b> is telling you${granN>1?` (grouped into ${granN}-month blocks)`:''}:`;
  return {intro,lines};
}
let KPIX_ANNUAL=false;
function kpixAnnualT(){KPIX_ANNUAL=!KPIX_ANNUAL;renderKpix();if(KPIX_ANNUAL)requestAnimationFrame(()=>{try{drawConc()}catch(e){}});}
function kpixAnnual(){
  const P=D.portfolio;const pkey=mkt==='grp'?'group':mkt;const data=P[pkey];if(!data)return'';
  const fmM=mkt==='uk'?fL:mkt==='us'?f$:fL;
  const c=data.current,ch=data.churn||{};const series=data.series||[];const labels=data.fy_labels||[];
  const growth=data.growth_series||[];const revs=data.rev_series||[];
  const cohortHex=['#c8bfb3','#9e9487','#0e7490','#1e4fa8','#7c3aed','#1f7a4a'];
  let cagr=null;if(revs.length>=2&&revs[0]>0){const yrs=revs.length-1;cagr=Math.round((Math.pow(revs[revs.length-1]/revs[0],1/yrs)-1)*100);}
  const pct=v=>v==null?'—':v+'%';
  const trendRow=(label,vals,fmt,note)=>`<tr><td>${label}${note?` <span style="color:var(--stone);font-weight:300;font-size:11px">${note}</span>`:''}</td>${vals.map(v=>`<td>${v==null?'—':fmt(v)}</td>`).join('')}</tr>`;
  const cohorts=(c&&c.cohorts)?c.cohorts:[];
  const cohortTbl=cohorts.length?`<div class="sec">Client cohort mix — ${P.fy_label||'25/26'}</div>
  <div class="tbl"><table><thead><tr><th>Revenue band</th><th>Clients</th><th>Revenue</th><th>% of revenue</th><th style="width:34%">Share</th></tr></thead><tbody>
    ${cohorts.map((co,i)=>`<tr><td><span style="display:inline-flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:2px;background:${cohortHex[i%6]};flex-shrink:0"></span>${co.band}</span></td><td>${co.count}</td><td>${fmM(co.rev)}</td><td>${co.rev_pct}%</td><td><div class="cov-b" style="width:100%;height:8px"><div class="cov-f" style="width:${co.rev_pct}%;background:${cohortHex[i%6]}"></div></div></td></tr>`).join('')}
    <tr class="tot"><td>Total</td><td>${c.n}</td><td>${fmM(c.total)}</td><td>100%</td><td></td></tr>
  </tbody></table></div>`:'';
  return `
  <div class="sec">Net revenue &amp; concentration — by financial year</div>
  <div class="kpis k4" style="margin-bottom:12px">
    <div class="kpi"><div class="kpi-acc" style="background:#7c3aed"></div><div class="kpi-l">Net revenue / client</div><div class="kpi-v">${fmM(c.per_client)}</div><div class="kpi-m">${c.n} clients · ${fmM(c.total)} total</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:${c.top10_pct>=70?'var(--red)':c.top10_pct>=55?'var(--amb)':'var(--grn)'}"></div><div class="kpi-l">Top 10 concentration</div><div class="kpi-v">${c.top10_pct}%</div><div class="kpi-m">top 20 = ${c.top20_pct}%</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:var(--stone)"></div><div class="kpi-l">3-yr CAGR</div><div class="kpi-v">${cagr!=null?cagr+'%':'—'}</div><div class="kpi-m">revenue, ${labels[0]||''}→${labels[labels.length-1]||''}</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:#0e7490"></div><div class="kpi-l">Headcount</div><div class="kpi-v">${data.headcount!=null?data.headcount+' FTE':'—'}</div><div class="kpi-m">rev/head ${data.rev_per_head?fmM(data.rev_per_head):'—'}</div></div>
  </div>
  <div class="tbl"><table><thead><tr><th>Metric</th>${labels.map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody>
    ${trendRow('Net revenue',revs,v=>fmM(v))}
    ${trendRow('Net revenue growth',growth,pct,'YoY')}
    ${trendRow('No. of clients',series.map(s=>s.n),v=>v)}
    ${trendRow('Net revenue / client',series.map(s=>s.per_client),v=>fmM(v))}
    ${trendRow('% from top 10',series.map(s=>s.top10_pct),pct)}
    ${trendRow('% from top 20',series.map(s=>s.top20_pct),pct)}
  </tbody></table>
  <div class="fx-note">3-year CAGR: ${cagr!=null?cagr+'%':'—'} · ${mkt==='grp'?'UK + US converted to GBP per FY':'Single-market'} · Total GP incl. TEs basis. Reconciles to signed-off P&amp;L within ~1-2% each FY.</div></div>
  ${cohortTbl}
  <div class="cards c2">
    <div class="card"><div class="ct">Concentration trend</div><div class="cs">Top 10 &amp; top 20 client share — rising = higher dependency risk</div><div style="position:relative;height:200px"><canvas id="pf-conc"></canvas></div></div>
    <div class="card"><div class="ct">Retention &amp; churn</div><div class="cs">vs prior year · GP retention (steady) is in the explorer above</div>
      <div style="display:grid;gap:13px;margin-top:8px">
        <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>Client retention (logo)</span><span style="font-family:var(--display);color:var(--grn)">${ch.retention}%</span></div><div class="cov-b" style="width:100%;height:8px"><div class="cov-f" style="width:${ch.retention}%;background:var(--grn)"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>Client churn (logo)</span><span style="font-family:var(--display);color:var(--red)">${ch.churn}%</span></div><div class="cov-b" style="width:100%;height:8px"><div class="cov-f" style="width:${ch.churn}%;background:var(--red)"></div></div></div>
        <div style="font-size:11px;color:var(--stone);font-weight:300;border-top:1px solid var(--bdr);padding-top:10px">Logo churn counts any client not booking this FY — inflated by one-off project clients. For the GP-weighted view, use <b>GP retention (steady)</b> in the explorer metrics above.</div>
      </div>
    </div>
  </div>`;
}
function drawConc(){
  const cv=document.getElementById('pf-conc');if(!cv)return;
  const P=D.portfolio;const data=P[mkt==='grp'?'group':mkt];if(!data)return;
  const series=data.series||[];const labels=data.fy_labels||[];
  const box=cv.parentElement.getBoundingClientRect();const W=Math.max(box.width,280),H=200;
  const dpr=window.devicePixelRatio||1;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);const dark=dk();
  const grid=dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';const txt=dark?'#9a958c':'#8a8578';
  const padL=8,padR=46,padT=14,padB=24,pw=W-padL-padR,ph=H-padT-padB;
  ctx.clearRect(0,0,W,H);ctx.strokeStyle=grid;ctx.lineWidth=1;
  for(let g=0;g<=4;g++){const y=padT+ph*g/4;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();}
  ctx.fillStyle=txt;ctx.font='10px ui-monospace,monospace';ctx.textAlign='center';
  labels.forEach((l,i)=>ctx.fillText(l,padL+pw*(labels.length<2?0.5:i/(labels.length-1)),H-8));
  [['top10_pct','#1e4fa8'],['top20_pct','#7c3aed']].forEach(([key,col])=>{
    const vals=series.map(s=>s[key]);const X=i=>padL+pw*(labels.length<2?0.5:i/(labels.length-1));const Y=v=>padT+ph*(1-v/100);
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();vals.forEach((v,i)=>i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v)));ctx.stroke();
    const li=vals.length-1;ctx.fillStyle=col;ctx.beginPath();ctx.arc(X(li),Y(vals[li]),3,0,7);ctx.fill();
    ctx.textAlign='left';ctx.font='600 10px ui-monospace,monospace';ctx.fillText(vals[li]+'%',X(li)+5,Y(vals[li])+3);
  });
}
function renderKpix(){
  const KX=D.kpix;
  const mainEl = document.getElementById('main');
  if(!KX||!KX.scopes){if(!mainEl) return; mainEl.innerHTML='<div class="body">No KPI series data.</div>';return;}
  const all=KX.meta.labels;const defs=KX.meta.defs;
  const data=mkt==='us'?D.us:mkt==='uk'?D.uk:null;
  if(mkt==='grp'){KPIX.hub='';KPIX.client='';}
  const skey=mkt==='grp'?'group':(KPIX.client?mkt+'|c|'+KPIX.client:(KPIX.hub?mkt+'|h|'+KPIX.hub:mkt));
  const ser=KX.scopes[skey]||KX.scopes[mkt==='grp'?'group':mkt]||{};
  const avail=Object.keys(defs).filter(k=>ser[k]);
  let act=KPIX.active.filter(k=>avail.includes(k));if(!act.length)act=[avail[0]];
  if(act.length===1 && act[0]===undefined) {
    if(mainEl) mainEl.innerHTML='<div class="body">No KPI series data available for this selection.</div>';
    return;
  }
  const W=kpixWindow();const daily=W.mode==='daily';
  const FWALL=KX.fwd||{labels:[],scopes:{}};
  const fN=daily?0:Math.min(KPIX.fcast,FWALL.labels.length);
  const FW={lab:FWALL.labels.slice(0,fN),ser:FWALL.scopes[skey]||{}};
  const get=(k)=>{
    if(daily){if(!KX_DAILY.includes(k))return null;
      const cur=kpixDaily(k,W.from,W.to);
      const pf=new Date(W.from+'T00:00:00');pf.setDate(pf.getDate()-W.days);
      const pt=new Date(W.from+'T00:00:00');pt.setDate(pt.getDate()-1);
      const prev=kpixDaily(k,pf.toISOString().slice(0,10),pt.toISOString().slice(0,10));
      return{labels:cur.days,vals:cur.vals,prev:prev.vals,flab:[],fvals:[]};}
    const vals=W.lab.map(m=>(ser[k]||[])[all.indexOf(m)]);
    const n2=W.lab.length;const fi=all.indexOf(W.lab[0]);
    const prev=(fi>=n2)?all.slice(fi-n2,fi).map(m=>(ser[k]||[])[all.indexOf(m)]):null;
    const ly=(fi>=12)?W.lab.map(m=>(ser[k]||[])[all.indexOf(m)-12]):null;
    const fvals=FW.lab.map((m,i)=>{const a=FW.ser[k];return a?(a[i]??null):null;});
    return{labels:W.lab,vals,prev,ly,flab:FW.lab,fvals};};
  act=act.filter(k=>get(k));if(!act.length)act=[KX_DAILY[0]];
  const granN=daily?1:(KPIX.gran==='q3'?3:KPIX.gran==='h6'?6:1);
  const vw=(k)=>{const g=get(k);if(!g||granN===1)return g;
    const ag2=defs[k].agg==='sum'?'sum':'avg';
    const hb=kpixBucket(g.labels,g.vals,ag2,granN,false);
    const fb=kpixBucket(g.flab,g.fvals,ag2,granN,true);
    return Object.assign({},g,{labels:hb.labels,vals:hb.vals,flab:fb.labels,fvals:fb.vals,raw:true});};
  const scopeName=KPIX.client||KPIX.hub||(mkt==='grp'?'Group':mkt==='us'?'United States':'United Kingdom');
  const winLabel=daily?`${kpixDn(W.from)} – ${kpixDn(W.to)} ${W.to.slice(0,4)} · ${W.days} days · daily`:`${kpixMn(W.lab[0])} – ${kpixMn(W.lab[W.lab.length-1])} · ${W.lab.length} months${granN>1?' · '+granN+'-month periods':''}${fN?` &nbsp;<span style="color:#ff7daa">+ ${fN}m model (dashed)</span>`:''}`+`<br><span style="font-weight:300;color:var(--stone);letter-spacing:0">Cards show this window; <b>prior</b> = the ${W.lab.length} months immediately before it, <b>LY</b> = the same months last year.</span>`;
  const cards=Object.keys(defs).filter(k=>avail.includes(k)).map(k=>{
    const d=defs[k];const g=get(k);const on=act.includes(k);const c=on?BRAND_COLORS[act.indexOf(k)]:null;
    if(!g)return `<div class="kpi" style="opacity:.4"><div class="kpi-acc"></div><div class="kpi-l">${d.n}</div><div class="kpi-v">—</div><div class="kpi-m">monthly only</div></div>`;
    const cur=kpixAgg(d,g.vals);const pv=g.prev?kpixAgg(d,g.prev):null;
    const lv=g.ly?kpixAgg(d,g.ly):null;
    const pct=(a,b)=>(a!=null&&b!=null&&b!==0)?Math.round((a-b)/Math.abs(b)*100):null;
    const dP=pct(cur,pv),dL=pct(cur,lv);
    const n2=g.labels.length;
    const chip=(lbl,dl)=>dl==null?'':`<span style="white-space:nowrap">${lbl} <span class="${dl>=0?'pos':'neg'}">${dl>=0?'+':''}${dl}%</span></span>`;
    const prevLbl=daily?`vs prior ${W.days}d`:(d.agg==='last'?`vs ${n2}m ago`:`vs prior ${n2}m`);
    const isLast=d.agg==='last';const cmp=[(n2===12&&!daily&&!isLast)?chip('vs prior 12m (= LY)',dP):chip(prevLbl,dP),(n2<12&&!daily&&!isLast)?chip('vs same '+n2+'m LY',dL):(isLast&&n2<12&&!daily)?chip('vs LY',dL):''].filter(Boolean).join(' · ');
    const fv=(g.fvals&&g.fvals.some(v=>v!=null))?kpixAgg(d,g.fvals):null;
    const sub=(d.agg==='sum'?'total over window':d.agg==='avg'?'avg / month over window':'latest value')
      +(cmp?`<br>${cmp}`:'')
      +(fv==null?'':`<br><span style="color:#ff7daa">${d.agg==='last'?`in ${fN}m (model)`:`next ${fN}m (model)`}: ${kpixFmt(d.u,fv)}${d.agg==='avg'?' /mo':''}</span>`);
    return `<div class="kpi" onclick="kpixToggle('${k}')" style="cursor:pointer;${on?`box-shadow:0 0 0 1.5px ${c}`:''}">
      <div class="kpi-acc" style="background:${on?c:'transparent'}"></div>
      <div class="kpi-l">${d.n}</div><div class="kpi-v" style="${on?`color:${c}`:''}">${kpixFmt(d.u,cur)}</div>
      <div class="kpi-m">${sub}</div></div>`;}).join('');
  const presets=[6,12,24,36].map(r=>`<button class="wk-btn${!KPIX.custom&&KPIX.preset===r?' on':''}" onclick="kpixPreset(${r})" style="margin-right:6px">${r===36?'All':r+'m'}</button>`).join('');
  const gbtns=[['mo','Mo'],['q3','Qtr'],['h6','6mo']].map(g2=>`<button class="wk-btn${KPIX.gran===g2[0]?' on':''}" onclick="kpixGran('${g2[0]}')" style="margin-right:6px">${g2[1]}</button>`).join('');
  const fbtns=[0,3,6,11].map(r=>`<button class="wk-btn${KPIX.fcast===r?' on':''}" onclick="kpixFcast(${r})" style="margin-right:6px">${r===0?'Off':r===11?'FY':r+'m'}</button>`).join('');
  const lastM=all[all.length-1];const dFrom=KPIX.custom?KPIX.custom[0]:all[Math.max(0,all.length-12)]+'-01';const dTo=KPIX.custom?KPIX.custom[1]:lastM+'-28';
  const mktSel=`<span style="color:var(--stone);font-size:11px;margin-right:4px">Location</span><select id="kpix-mkt" onchange="kpixScopeMkt()" class="wk-btn" style="margin-right:10px"><option value="grp"${mkt==='grp'?' selected':''}>Group</option><option value="us"${mkt==='us'?' selected':''}>United States</option><option value="uk"${mkt==='uk'?' selected':''}>United Kingdom</option></select>`;
  const hubSel=(mkt!=='grp'&&data)?`<span style="color:var(--stone);font-size:11px;margin-right:4px">Hub</span><select id="kpix-hub" onchange="kpixScopeHub()" class="wk-btn" style="margin-right:10px"><option value="">All hubs</option>${Object.keys(data.hubs).map(h=>`<option${KPIX.hub===h?' selected':''}>${h}</option>`).join('')}</select>
    <span style="color:var(--stone);font-size:11px;margin-right:4px">Client</span><select id="kpix-client" onchange="kpixScopeClient()" class="wk-btn" ${!KPIX.hub?'disabled':''}><option value="">${KPIX.hub?'All clients in '+KPIX.hub:'All clients'}</option>${(KPIX.hub?(data.owner_clients[KPIX.hub]||[]):[]).map(c2=>`<option${KPIX.client===c2?' selected':''}>${c2}</option>`).join('')}</select>`:'';
  const scopeBar=mktSel+hubSel;
  const xs=vw(act[0]);
  const fRows=xs.flab.slice().reverse().map(lb=>{const i=xs.flab.indexOf(lb);
    return `<tr style="background:rgba(255,125,170,.06)"><td style="color:#ff7daa;font-style:italic">${xs.raw?lb:kpixMn(lb)} · model</td>`+act.map((k,idx)=>`<td style="color:#ff7daa;font-family:var(--display);font-style:italic">${kpixFmt(defs[k].u,vw(k).fvals[i])}</td>`).join('')+`</tr>`;}).join('');
  const hRows=xs.labels.slice().reverse().slice(0,daily?45:36).map(lb=>{const i=xs.labels.indexOf(lb);
    return `<tr><td>${daily?kpixDn(lb):(xs.raw?lb:kpixMn(lb))}</td>`+act.map((k,idx)=>`<td style="color:${BRAND_COLORS[idx]};font-family:var(--display)">${kpixFmt(defs[k].u,vw(k).vals[i])}</td>`).join('')+`</tr>`;}).join('');
  if(!mainEl) return; mainEl.innerHTML=`
<div class="ph"><div><div class="ph-title">KPI explorer</div><div class="ph-sub">Click metric cards to overlay (up to 4) · solid = actuals · dashed pink = model forecast</div></div></div>
<div class="body">
  <button class="wk-btn" onclick="kpixToggleFilters()" style="margin-bottom:16px;border:1px solid var(--bdr);background:var(--surface)">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
    Filters &amp; Analysis Settings ${KPIX.showFilters?'\u25b4':'\u25be'}
  </button>
  ${KPIX.showFilters ? `
  <div style="padding:16px;border:1px solid var(--bdr);border-radius:var(--r);background:var(--surface);margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px">${scopeBar}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px">${presets}
      <span style="color:var(--stone);font-size:11px;margin:0 4px">or custom:</span>
      <input type="date" id="kpix-from" value="${dFrom}" onchange="kpixCustom()" class="wk-btn" style="border:1px solid var(--bdr)">
      <input type="date" id="kpix-to" value="${dTo}" onchange="kpixCustom()" class="wk-btn" style="border:1px solid var(--bdr)">
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><span style="color:var(--stone);font-size:11px">Model forecast:</span>${fbtns}${daily?'':`<span style="color:var(--stone);font-size:11px;margin-left:10px">View:</span>${gbtns}`}<button class="wk-btn${KPIX.trend?' on':''}" onclick="kpixTrendT()" style="margin-left:10px">Trendline</button></div>
  </div>
  ` : ''}
  <div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:16px">${cards}</div>
  <div class="card" style="margin-bottom:18px"><div class="ct">KPI trends — ${winLabel}</div>
    <div class="cs">${act.map((k,idx)=>`<span style="color:${BRAND_COLORS[idx]};font-weight:500">● ${defs[k].n}</span>`).join(' &nbsp; ')}${KPIX.trend?' &nbsp;<span style="color:var(--stone)">· dotted = linear trend over shown history</span>':''}${daily?' &nbsp;<span style="color:var(--stone)">· day view covers created/won activity; booked GP &amp; rolling metrics are monthly</span>':''}</div>
    <div style="position:relative;height:320px;margin-top:8px"><canvas id="kpix-chart"></canvas></div>
    ${fN&&!daily?`<div class="pred-note" style="margin-top:6px">Dashed = model. Booked GP is the landing model; briefs created, win rate &amp; avg deal GP are held at their backtest-optimal trailing levels (12/12/6mo) — trend-chasing was tested and loses; these series mean-revert. The holds are the model's working assumptions, shown so you can challenge them in the monthly review. Headcount is the budgeted FTE plan.</div>`:''}</div>
  ${KPIX_GUIDE?(()=>{const cm=kpixCommentary(act,defs,vw,scopeName,daily,granN,fN);
    return `<div class="card" style="margin-bottom:18px;border-left:3px solid #ff7daa">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="font-size:22px;line-height:1;flex-shrink:0;margin-top:2px">\u{1F4A1}</div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="ct" style="margin:0">IN OTHER WORDS (IOW)</div>
            <button class="wk-btn" onclick="kpixGuideT()" style="font-size:10px;padding:3px 8px">Hide</button></div>
          <div class="cs" style="margin-top:6px">${cm.intro}</div>
          <ul style="margin:8px 0 0;padding-left:18px;line-height:1.7;font-size:13px">${cm.lines.map(l=>`<li>${l}</li>`).join('')}</ul>
          <div style="margin-top:8px;font-size:10px;color:var(--stone)">IN OTHER WORDS (IOW) read of the numbers above \u2014 not advice. Always sense-check against what you know.</div>
        </div></div></div>`;})():`<div style="margin-bottom:14px"><button class="wk-btn" onclick="kpixGuideT()">\u{1F4A1} IN OTHER WORDS (IOW)</button></div>`}
  <div class="tbl"><table><thead><tr><th>${daily?'Day':granN>1?'Period':'Month'}</th>${act.map((k,idx)=>`<th style="color:${BRAND_COLORS[idx]}">${defs[k].n}</th>`).join('')}</tr></thead><tbody>${fRows}${hRows}</tbody></table></div>
  <div class="sec" style="margin-top:20px;cursor:pointer" onclick="kpixAnnualT()">${KPIX_ANNUAL?'\u25be':'\u25b8'} Annual summary <span style="color:var(--stone);font-weight:300;font-size:11px">· financial-year revenue, concentration, cohorts &amp; churn</span></div>
  ${KPIX_ANNUAL?kpixAnnual():''}
</div>`;
  requestAnimationFrame(()=>{try{drawKpix(act.map((k,idx)=>({k,u:defs[k].u,c:BRAND_COLORS[idx],g:vw(k)})),daily)}catch(e){}if(KPIX_ANNUAL){try{drawConc()}catch(e){}}});
}
function drawKpix(seriesList,daily){
  const cv=document.getElementById('kpix-chart');if(!cv)return;
  const box=cv.parentElement.getBoundingClientRect();const W=Math.max(box.width,320),H=Math.max(box.height,200);
  const dpr=window.devicePixelRatio||1;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  const dark=dk();const grid=dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';const txt=dark?'#9a958c':'#8a8578';
  const padL=8,padR=70,padT=14,padB=26;const pw=W-padL-padR,ph=H-padT-padB;
  ctx.clearRect(0,0,W,H);ctx.strokeStyle=grid;ctx.lineWidth=1;
  for(let g=0;g<=4;g++){const y=padT+ph*g/4;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();}
  const g0=seriesList[0].g;const histN=g0.labels.length;const labels=g0.labels.concat(g0.flab||[]);
  const X=i=>padL+pw*(labels.length===1?0.5:i/(labels.length-1));
  ctx.fillStyle=txt;ctx.font='10px ui-monospace,monospace';ctx.textAlign='center';
  const step=Math.max(1,Math.ceil(labels.length/8));
  const rawL=!!g0.raw;labels.forEach((m,i)=>{if(i%step===0||i===labels.length-1)ctx.fillText(rawL?m:(daily?kpixDn(m):kpixMn(m)),X(i),H-8);});
  if((g0.flab||[]).length){ // today divider between last actual and first model month
    const xd=(X(histN-1)+X(histN))/2;
    ctx.strokeStyle='rgba(255,125,170,.6)';ctx.lineWidth=1;
    ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(xd,padT);ctx.lineTo(xd,padT+ph);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ff7daa';ctx.font='600 9px ui-monospace,monospace';ctx.textAlign='left';ctx.fillText('model →',xd+4,padT+9);}
  seriesList.forEach(s=>{
    const vals=s.g.vals;const fvals=s.g.fvals||[];const allv=vals.concat(fvals);
    const nums=allv.filter(v=>v!=null);if(!nums.length)return;
    let lo=Math.min(...nums),hi=Math.max(...nums);if(hi===lo){hi+=1;lo-=1;}
    const pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
    const Y=v=>padT+ph*(1-(v-lo)/(hi-lo));
    ctx.strokeStyle=s.c;ctx.lineWidth=2;ctx.lineJoin='round';
    ctx.beginPath();let st=false;
    vals.forEach((v,i)=>{if(v==null){st=false;return;}if(!st){ctx.moveTo(X(i),Y(v));st=true;}else ctx.lineTo(X(i),Y(v));});
    ctx.stroke();
    if(KPIX.trend){const pts=[];vals.forEach((v,i)=>{if(v!=null)pts.push([i,v]);});
      if(pts.length>2){const np=pts.length;let mx=0,my=0;pts.forEach(p=>{mx+=p[0];my+=p[1];});mx/=np;my/=np;
        let den=0,num=0;pts.forEach(p=>{den+=(p[0]-mx)*(p[0]-mx);num+=(p[0]-mx)*(p[1]-my);});
        const b2=den?num/den:0;const a2=my-b2*mx;const cl2=v=>Math.max(padT,Math.min(padT+ph,v));
        ctx.setLineDash([2,3]);ctx.lineWidth=1;ctx.globalAlpha=.55;ctx.beginPath();
        ctx.moveTo(X(pts[0][0]),cl2(Y(a2+b2*pts[0][0])));ctx.lineTo(X(pts[np-1][0]),cl2(Y(a2+b2*pts[np-1][0])));ctx.stroke();
        ctx.setLineDash([]);ctx.lineWidth=2;ctx.globalAlpha=1;}}
    if(fvals.some(v=>v!=null)){
      ctx.setLineDash([6,4]);ctx.globalAlpha=0.85;ctx.beginPath();
      let lastHist=-1;for(let i=vals.length-1;i>=0;i--){if(vals[i]!=null){lastHist=i;break;}}
      let st2=false;
      if(lastHist>=0&&fvals[0]!=null){ctx.moveTo(X(lastHist),Y(vals[lastHist]));ctx.lineTo(X(histN),Y(fvals[0]));st2=true;}
      fvals.forEach((v,i)=>{if(v==null){st2=false;return;}const xi=histN+i;
        if(!st2){ctx.moveTo(X(xi),Y(v));st2=true;}else ctx.lineTo(X(xi),Y(v));});
      ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
    const seq=allv;let li=-1;for(let i=seq.length-1;i>=0;i--){if(seq[i]!=null){li=i;break;}}
    if(li>=0){ctx.fillStyle=s.c;ctx.beginPath();ctx.arc(X(li),Y(seq[li]),3,0,7);ctx.fill();
      ctx.textAlign='left';ctx.font='600 10px ui-monospace,monospace';ctx.fillText(kpixFmt(s.u,seq[li]),X(li)+6,Y(seq[li])+3);}
  });
}
function kpixOpenWith(metric){
  if(D.kpix&&D.kpix.meta.defs[metric]){KPIX.active=[metric];}
  KPIX.hub='';KPIX.client='';
  showKpix();
}
function showPortfolio(){showKpix();}
function showWeekly(){view='weekly';curGroup=null;curClient=null;buildSidebar();dc();renderWeekly();}
/* ── GROUP OVERVIEW ── */
function fyQ(){
  // Current FY quarter (FY May-Apr), rolls automatically: Q1=May-Jul, Q2=Aug-Oct, Q3=Nov-Jan, Q4=Feb-Apr
  const y=+AS_OF.slice(0,4),m=+AS_OF.slice(5,7);const fy0=m>=5?y:y-1;const ms=[];
  for(let i=0;i<12;i++){const mm=(4+i)%12+1;const yy=fy0+(mm<5?1:0);ms.push(yy+'-'+String(mm).padStart(2,'0'));}
  const qi=Math.max(0,Math.floor(ms.indexOf(AS_OF)/3));const qm=ms.slice(qi*3,qi*3+3);
  const M3=s=>['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+s.slice(5,7)-1];
  return{n:qi+1,m:qm,label:'Q'+(qi+1)+' \u00b7 '+M3(qm[0])+' \u2013 '+M3(qm[2])};}
function qFromRows(rows){const q=fyQ();let t=0,p=0,pr=0;
  q.m.forEach(mm=>{const r=(rows||{})[mm]||{};t+=r.tv||0;p+=r.pv||0;pr+=r.pred||0;});
  return Object.assign({t,p,pr},q);}
function qFromClients(tf,clients,cpred){const q=fyQ();let t=0,p=0,pr=0;
  (clients||[]).forEach(cl=>{q.m.forEach(mm=>{const e=((tf||{})[cl]||{})[mm]||{};t+=(e.t||0)*1000;p+=(e.p||0)*1000;pr+=(((cpred||{})[cl])||{})[mm]||0;});});
  return Object.assign({t,p,pr},q);}
function qScope(){return mkt==='us'?D.us:D.uk;}
function qHub(g){const d=qScope();return qFromClients((d.targets_full||{})[g]||{},(d.owner_clients||{})[g]||[],d.client_pred||{});}
function qClientQ(g,c){const d=qScope();return qFromClients((d.targets_full||{})[g]||{},[c],d.client_pred||{});}
function qCard(q,fm){
  const pct=q.t?Math.round(q.pr/q.t*100):null;const cov=q.t?Math.round(q.p/q.t*100):null;
  const col=pct==null?'var(--stone)':pct>=100?'var(--grn)':pct>=85?'var(--amb)':'var(--red)';
  return `<div class="kpi"><div class="kpi-acc" style="background:${col}"></div><div class="kpi-l">${q.label}</div><div class="kpi-v" style="color:${col}">${pct!=null?pct+'%':'\u2014'}</div><div class="kpi-m">${fm(q.pr)} expected vs ${fm(q.t)} target \u00b7 pipeline covers ${cov!=null?cov+'%':'\u2014'}</div></div>`;}
function qLY(skey){
  const q=fyQ();const KX=D.kpix;if(!KX||!KX.scopes||!KX.scopes[skey])return null;
  const lab=KX.meta.labels;const arr=KX.scopes[skey].booked||[];let s=0,found=0;
  q.m.forEach(mm=>{const ly=(+mm.slice(0,4)-1)+mm.slice(4);const i=lab.indexOf(ly);
    if(i>=0&&arr[i]!=null){s+=arr[i];found++;}});
  return found===q.m.length?Math.round(s):null;}
function qRow(q,fm,ly,ck){const at=k2=>ck?` data-comp="${k2}" style="cursor:pointer${COMP_FOCUS===k2?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"`:'';
  const pct=q.t?Math.round(q.pr/q.t*100):null;const cov=q.t?Math.round(q.p/q.t*100):null;
  const dd=q.pr-q.t;const col=pct==null?'var(--stone)':pct>=100?'var(--grn)':pct>=85?'var(--amb)':'var(--red)';
  const yoy=(ly&&ly>0)?Math.round((q.pr-ly)/ly*100):null;
  return `<div class="kpi"${at('q_target')}><div class="kpi-l">${q.label.split(' ')[0]} target</div><div class="kpi-v">${fm(q.t)}</div><div class="kpi-m">${q.label.slice(q.label.indexOf('\u00b7')+2)}</div></div>
  <div class="kpi"${at('q_pipe')}><div class="kpi-l">${q.label.split(' ')[0]} pipeline</div><div class="kpi-v">${fm(q.p)}</div><div class="kpi-m">${cov!=null?cov+'% of target':'\u2014'}</div></div>
  <div class="kpi"${at('q_land')}><div class="kpi-acc" style="background:${col}"></div><div class="kpi-l">${q.label.split(' ')[0]} expected landing</div><div class="kpi-v" style="color:${col}">${fm(q.pr)}</div><div class="kpi-m">${pct!=null?pct+'% of target \u00b7 ':''}<span class="${dd>=0?'pos':'neg'}">${dd>=0?'+':'\u2212'}${fm(Math.abs(dd))}</span></div></div>
  ${ly!=null?`<div class="kpi"${at('q_ly')}><div class="kpi-l">LY ${q.label.split(' ')[0]} actuals</div><div class="kpi-v">${fm(ly)}</div><div class="kpi-m">same quarter last year${yoy!=null?` \u00b7 <span class="${yoy>=0?'pos':'neg'}">${yoy>=0?'+':''}${yoy}% YoY</span>`:''}</div></div>`:''}`;}
function renderGroup(){
  const gt=D.group.targets,pr=D.group.pred_rows;
  const h1t=NEAR.reduce((s,m)=>s+(gt[m]?.t||0)*1000,0);
  const h1p=NEAR.reduce((s,m)=>s+(gt[m]?.p||0)*1000,0);
  const h1pred=NEAR.reduce((s,m)=>s+(pr[m]?.pred||0),0);
  const h1t_us=NEAR.reduce((s,m)=>s+(gt[m]?.us_t_gbp||0)*1000,0);
  const h1p_us=NEAR.reduce((s,m)=>s+(gt[m]?.us_p_gbp||0)*1000,0);
  const h1t_uk=NEAR.reduce((s,m)=>s+(gt[m]?.uk_t||0)*1000,0);
  const h1p_uk=NEAR.reduce((s,m)=>s+(gt[m]?.uk_p||0)*1000,0);
  const lyH1=(D.group.ly_h1||0)*1000;
  const yoy=lyH1?Math.round((h1p-lyH1)/lyH1*100):null;
  const predGap=h1pred-h1t;
  const us_pred=Math.round(NEAR.reduce((s,m)=>s+(D.us.pred_rows[m]?.pred||0),0)/FX);
  const uk_pred=NEAR.reduce((s,m)=>s+(D.uk.pred_rows[m]?.pred||0),0);
  const d=dk();
  const rows=ALL.map(mk=>{const isP=isElapsed(mk);const r=pr[mk]||{};const tv=(gt[mk]?.t||0)*1000,pv=(gt[mk]?.p||0)*1000;return{mk,tv,pv,pred:r.pred||pv,us_p:(gt[mk]?.us_p_gbp||0)*1000,uk_p_usd:(gt[mk]?.uk_p||0)*1000,cov:tv?pv/tv:null,isP};});
  const us_hubs=Object.entries(D.us.hubs||{}).map(([hub,hd])=>({name:hub,ht:hd.h1t*1000/FX,hp:hd.h1p*1000/FX,col:US_HEX[hub]||'#888',cov:hd.h1t?hd.h1p/hd.h1t:0}));
  const uk_ams=Object.entries(D.uk.ams||{}).map(([am,ad],i)=>({name:am,ht:ad.h1t*1000,hp:ad.h1p*1000,col:UK_AM_HEX[i%UK_AM_HEX.length],cov:ad.h1t?ad.h1p/ad.h1t:0})).filter(r=>r.ht>0||r.hp>0);
  const gm=D.group.monthly||{};
  const hMos=Object.keys(gm).filter(m=>m>='2025-05'&&m<='2026-04').sort();
  const cL=[...hMos,...NEAR].map(mn);
  const usM=D.us.monthly||{},ukM=D.uk.monthly||{};
  const usPipe=[...hMos.map(m=>Math.round((usM[m]||0)/FX)),...NEAR.map(m=>gt[m]?.us_p_gbp||0)];
  const ukPipeUsd=[...hMos.map(m=>ukM[m]||0),...NEAR.map(m=>gt[m]?.uk_p||0)];
  const budgetLine=[...hMos.map(()=>null),...NEAR.map(m=>gt[m]?.t||0)];
  const gpr=D.group.pred_rows||{};
  const gPred=[...hMos.map(()=>null),...NEAR.map(m=>Math.round((gpr[m]?.pred||0)/1000))];

  const mainEl = document.getElementById('main');
  if(!mainEl) return; mainEl.innerHTML=`
<div class="ph"><div><div class="ph-eye">Group overview</div><div class="ph-title">BDB Group</div><div class="ph-sub">US + UK · FY 26/27 · H1 May – Oct 2026 · GBP at $1=£${(1/FX).toFixed(4)}</div></div><span class="badge ${h1p/h1t>=1?'g':h1p/h1t>=0.75?'a':'r'}">${Math.round(h1p/h1t*100)}% H1 coverage</span></div>
<div class="body">
  ${(()=>{const ln=COMP_FOCUS?compCardExplain(COMP_FOCUS):companionGroupNotes();const intro=COMP_FOCUS?compCardTitle(COMP_FOCUS):"Here\u2019s how the Group is tracking, in other words (IOW):";return ln?companionPanel(intro,ln):'';})()}
<div class="sec" style="margin-top:0">Current quarter · ${fyQ().label}</div>
  <div class="kpis k4" style="margin-bottom:14px">${qRow(qFromRows(D.group.pred_rows),fL,qLY('group'),true)}</div>
  <div class="sec">Current half · H1 · May – Oct</div>
  <div class="kpis k4">
    <div class="kpi" data-comp="h1_target" style="cursor:pointer${COMP_FOCUS==='h1_target'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:var(--col-grp)"></div><div class="kpi-l">Group H1 target</div><div class="kpi-v">${fL(h1t)}</div><div class="kpi-m">May – Oct 2026</div></div>
    <div class="kpi" data-comp="h1_pipe" style="cursor:pointer${COMP_FOCUS==='h1_pipe'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:var(--col-us)"></div><div class="kpi-l">H1 pipeline</div><div class="kpi-v">${fL(h1p)}</div><div class="kpi-m">${fc(h1p/h1t)}&nbsp;confirmed${yoy!==null?`&nbsp;<span class="${yoy>=0?'pos':'neg'}">${yoy>=0?'+':''}${yoy}% YoY</span>`:''}</div></div>
    <div class="kpi" data-comp="h1_land" style="cursor:pointer${COMP_FOCUS==='h1_land'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:${predGap>=0?'var(--grn)':'var(--red)'}"></div><div class="kpi-l">Forecast landing <span style="font-weight:300;font-size:10px;color:var(--stone)">bottom-up</span></div><div class="kpi-v">${fL(h1pred)}</div><div class="kpi-m"><span class="${predGap>=0?'pos':'neg'}">${predGap>=0?'+':''}${fL(predGap)}</span>&nbsp;vs budget</div></div>
    <div class="kpi" data-comp="ly_h1" style="cursor:pointer${COMP_FOCUS==='ly_h1'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:var(--stone)"></div><div class="kpi-l">LY H1 actuals</div><div class="kpi-v">${fL(lyH1)}</div><div class="kpi-m">May – Oct 2025</div></div>
  </div>
  <div class="kpis k2" style="margin-top:0">
    <div class="kpi" data-comp="grp_us" style="cursor:pointer${COMP_FOCUS==='grp_us'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:var(--col-us)"></div><div class="kpi-l">United States</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:4px">
        <div><div style="font-size:10px;color:var(--stone)">Target</div><div style="font-size:18px;font-family:var(--display)">${fL(h1t_us)}</div></div>
        <div><div style="font-size:10px;color:var(--stone)">Pipeline</div><div style="font-size:18px;font-family:var(--display)">${fL(h1p_us)}</div></div>
        <div><div style="font-size:10px;color:var(--stone)">Predicted</div><div style="font-size:18px;font-family:var(--display)">${fL(us_pred)}</div></div>
      </div><div class="kpi-m" style="margin-top:6px">${fc(h1t_us?h1p_us/h1t_us:0)}&nbsp;coverage · ${D.us.stats.open_n} open · ${D.us.stats.win_rate}% win</div></div>
    <div class="kpi" data-comp="grp_uk" style="cursor:pointer${COMP_FOCUS==='grp_uk'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:var(--col-uk)"></div><div class="kpi-l">United Kingdom <span style="font-size:9px;color:var(--stone);font-weight:300">(converted)</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:4px">
        <div><div style="font-size:10px;color:var(--stone)">Target</div><div style="font-size:18px;font-family:var(--display)">${fL(h1t_uk)}</div></div>
        <div><div style="font-size:10px;color:var(--stone)">Pipeline</div><div style="font-size:18px;font-family:var(--display)">${fL(h1p_uk)}</div></div>
        <div><div style="font-size:10px;color:var(--stone)">Predicted</div><div style="font-size:18px;font-family:var(--display)">${fL(uk_pred)}</div></div>
      </div><div class="kpi-m" style="margin-top:6px">${fc(h1t_uk?h1p_uk/h1t_uk:0)}&nbsp;coverage · ${D.uk.stats.open_n} open · ${D.uk.stats.win_rate}% win</div></div>
  </div>
  <div style="margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--stone);margin-bottom:5px"><span>H1 pipeline split</span><span>${Math.round(h1p_us/h1p*100)}% US · ${Math.round(h1p_uk/h1p*100)}% UK</span></div>
    <div class="split-bar"><div style="width:${Math.round(h1p_us/h1p*100)}%;background:var(--col-us);opacity:.75"></div><div style="width:${Math.round(h1p_uk/h1p*100)}%;background:var(--col-uk);opacity:.75"></div></div>
    <div class="split-leg"><span><span class="sdot" style="background:var(--col-us)"></span>US ${fL(h1p_us)} (${Math.round(h1t_us?h1p_us/h1t_us*100:0)}% cov)</span><span><span class="sdot" style="background:var(--col-uk)"></span>UK ${fL(h1p_uk)} (${Math.round(h1t_uk?h1p_uk/h1t_uk*100:0)}% cov)</span></div>
  </div>
  <div class="sec">Monthly tracking — group total</div>
  <div class="tbl"><table>
    <thead><tr><th>Month</th><th>Target</th><th>US pipe</th><th>UK pipe</th><th>Group total</th><th>Predicted</th><th>vs Target</th><th>Coverage</th></tr></thead>
    <tbody>
      ${rows.map(({mk,tv,pv,pred,us_p,uk_p_usd,cov,isP})=>`<tr class="${isP?'trail':''}"><td>${mn(mk)}${isP?'&nbsp;<span style="font-size:9px;color:var(--stone);font-family:var(--display)">actual</span>':''}</td><td>${tv?fL(tv):'—'}</td><td><span style="color:var(--col-us)">${fL(us_p)}</span></td><td><span style="color:var(--col-uk)">${fL(uk_p_usd)}</span></td><td>${fL(pv)}</td><td>${isP?'—':`<span class="${pred>=tv?'pos':'neg'}">${fL(pred)}</span>`}</td><td>${tv?df(pv,tv,'grp'):'—'}</td><td>${cov!==null?`<div class="cov-w">${fc(cov)}<div class="cov-b"><div class="cov-f" style="width:${Math.min(cov,1)*100}%;background:${cov>=1?'var(--grn)':cov>=0.75?'var(--amb)':'var(--red)'}"></div></div></div>`:'—'}</td></tr>`).join('')}
      <tr class="est"><td>→ model estimate</td><td>${fL(h1t)}</td><td colspan="2"></td><td>${fL(h1p)}</td><td><span class="${predGap>=0?'pos':'neg'}">${fL(h1pred)}</span></td><td>${df(h1pred,h1t,'grp')}</td><td>${fc(h1pred/h1t)}</td></tr>
      <tr class="tot"><td>H1 total</td><td>${fL(h1t)}</td><td><span style="color:var(--col-us)">${fL(h1p_us)}</span></td><td><span style="color:var(--col-uk)">${fL(h1p_uk)}</span></td><td>${fL(h1p)}</td><td>${fL(h1pred)}</td><td>${df(h1p,h1t,'grp')}</td><td>${fc(h1p/h1t)}</td></tr>
    </tbody></table>
    <div class="fx-note">US GP converted at $1 = £${(1/FX).toFixed(4)} · Forecast = pipeline + bottom-up client model top-up</div>
  </div>
  <div class="cards c2e">
    <div class="card"><div class="ct">US — by hub</div><div class="cs">H1 pipeline vs target</div><table><thead><tr><th style="text-align:left">Hub</th><th>Target</th><th>Pipeline</th><th>Coverage</th></tr></thead><tbody>${us_hubs.map(r=>`<tr class="cr" onclick="switchMarket('us');setTimeout(()=>showGroup('${r.name.replace(/'/g,"\\'")}'),50)"><td><span style="display:inline-flex;align-items:center;gap:7px"><span style="width:6px;height:6px;border-radius:50%;background:${r.col};flex-shrink:0"></span>${r.name}</span></td><td>${fL(r.ht)}</td><td>${fL(r.hp)}</td><td>${r.ht?fc(r.cov):'—'}</td></tr>`).join('')}</tbody></table></div>
    <div class="card"><div class="ct">UK — by account manager</div><div class="cs">H1 pipeline vs target (GBP)</div><table><thead><tr><th style="text-align:left">AM</th><th>Target</th><th>Pipeline</th><th>Coverage</th></tr></thead><tbody>${uk_ams.map(r=>`<tr class="cr" onclick="switchMarket('uk');setTimeout(()=>showGroup('${r.name.replace(/'/g,"\\'")}'),50)"><td><span style="display:inline-flex;align-items:center;gap:7px"><span style="width:6px;height:6px;border-radius:50%;background:${r.col};flex-shrink:0"></span>${r.name}</span></td><td>${fL(r.ht)}</td><td>${fL(r.hp)}</td><td>${r.ht?fc(r.cov):'—'}</td></tr>`).join('')}</tbody></table></div>
  </div>
  <div class="cards c2">
    <div class="card"><div class="ct">Group GP trend</div><div class="cs">12m actuals + H1 pipeline · US (blue) + UK (green) stacked vs budget</div><div style="position:relative;height:200px"><canvas id="g-trend"></canvas></div></div>
    <div class="card"><div class="ct">Market comparison</div><div class="cs">H1 pipeline vs target</div><div style="position:relative;height:200px"><canvas id="g-mkt"></canvas></div></div>
  </div>
</div>`;
  const co=copts('£');
  charts.gt=new Chart(document.getElementById('g-trend'),{type:'bar',data:{labels:cL,datasets:[
    {label:'US',data:usPipe,backgroundColor:cL.map((_,i)=>i<hMos.length?(d?'rgba(107,159,232,.5)':'rgba(30,79,168,.35)'):(d?'rgba(107,159,232,.25)':'rgba(30,79,168,.18)')),borderRadius:2,stack:'s',order:2},
    {label:'UK',data:ukPipeUsd,backgroundColor:cL.map((_,i)=>i<hMos.length?(d?'rgba(74,186,120,.4)':'rgba(31,122,74,.28)'):(d?'rgba(74,186,120,.18)':'rgba(31,122,74,.13)')),borderRadius:2,stack:'s',order:2},
    {label:'Budget',data:budgetLine,type:'line',borderColor:d?'rgba(194,59,46,.5)':'rgba(194,59,46,.4)',borderWidth:1.5,pointRadius:0,fill:false,borderDash:[4,3],tension:0,order:1},
     {label:'Predicted landing',data:gPred,type:'line',borderColor:d?'rgba(255,125,170,.95)':'rgba(255,125,170,.9)',backgroundColor:'rgba(255,125,170,.10)',borderWidth:2,pointRadius:2.5,pointBackgroundColor:'rgba(255,125,170,1)',fill:false,tension:.3,order:0,spanGaps:true}
  ]},options:{...co,scales:{...co.scales,x:{...co.scales.x,stacked:true},y:{...co.scales.y,stacked:true}}}});
  charts.gm=new Chart(document.getElementById('g-mkt'),{type:'bar',data:{labels:['United States','United Kingdom'],datasets:[
    {label:'Target',data:[Math.round(h1t_us/1000),Math.round(h1t_uk/1000)],backgroundColor:d?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)',borderRadius:4,order:2},
    {label:'Pipeline',data:[Math.round(h1p_us/1000),Math.round(h1p_uk/1000)],backgroundColor:['rgba(30,79,168,.75)','rgba(31,122,74,.75)'],borderRadius:4,order:1}
  ]},options:{...co,indexAxis:'y',scales:{...co.scales,y:{ticks:{font:{size:12,family:'"IBM Plex Sans"'},color:'#9e9487'},grid:{display:false},border:{display:false}}}}});
}

/* ── AGENCY OVERVIEW (US or UK) ── */
function renderAgency(){
  const isUS=mkt==='us';const data=isUS?D.us:D.uk;const ag=data.targets||{};const pr=data.pred_rows||{};
  const cur=isUS?'$':'£';const fmM=isUS?f$:fL;const stats=data.stats||{};const ly=(data.ly_h1||0)*1000;
  const h1t=NEAR.reduce((s,m)=>s+(ag[m]?.t||0)*1000,0);
  const h1p=NEAR.reduce((s,m)=>s+(ag[m]?.p||0)*1000,0);
  const h1pred=NEAR.reduce((s,m)=>s+(pr[m]?.pred||0),0);
  const predGap=h1pred-h1t;const yoy=ly?Math.round((h1p-ly)/ly*100):null;
  const col=isUS?'var(--col-us)':'var(--col-uk)';const d=dk();
  const rows=ALL.map(mk=>{const isP=isElapsed(mk);const r=pr[mk]||{};const tv=(ag[mk]?.t||0)*1000,pv=(ag[mk]?.p||0)*1000;return{mk,tv,pv,pred:r.pred||pv,cov:tv?pv/tv:null,isP};});
  const groups=isUS?Object.entries(D.us.hubs||{}):Object.entries(D.uk.ams||{});
  const hMos=Object.keys(data.monthly||{}).filter(m=>m>='2025-05'&&m<='2026-04').sort();
  const cL=[...hMos,...NEAR].map(mn);const hVals=hMos.map(m=>(data.monthly||{})[m]||0);
  const acCol=isUS?'rgba(30,79,168,':'rgba(31,122,74,';
  const tf=isUS?D.us.targets_full:D.uk.targets_full;const oc=isUS?D.us.owner_clients:D.uk.owner_clients;

  const mainEl = document.getElementById('main');
  if(!mainEl) return; mainEl.innerHTML=`
<div class="ph"><div><div class="ph-eye">${isUS?'United States':'United Kingdom'}</div><div class="ph-title">${isUS?'US Revenue':'UK Revenue'}</div><div class="ph-sub">FY 26/27 · H1 May – Oct 2026 · Values in ${cur}</div></div><span class="badge ${h1p/h1t>=1?'g':h1p/h1t>=0.75?'a':'r'}">${Math.round(h1p/h1t*100)}% H1 coverage</span></div>
<div class="body">
  ${(()=>{const ln=COMP_FOCUS?compCardExplain(COMP_FOCUS):companionAgencyNotes(isUS?"us":"uk",fmM);const intro=COMP_FOCUS?compCardTitle(COMP_FOCUS):"Here’s how "+(isUS?"the US":"the UK")+" is tracking, in other words (IOW):";return ln?companionPanel(intro,ln):"";})()}
  <div class="sec" style="margin-top:0">Current quarter · ${fyQ().label}</div>
  <div class="kpis k4" style="margin-bottom:14px">${qRow(qFromRows(data.pred_rows),fmM,qLY(mkt),true)}</div>
  <div class="sec">Current half · H1 · May – Oct</div>
  <div class="kpis k4">
    <div class="kpi" data-comp="h1_target" style="cursor:pointer${COMP_FOCUS==='h1_target'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:${col}"></div><div class="kpi-l">H1 target</div><div class="kpi-v">${fmM(h1t)}</div><div class="kpi-m">May – Oct 2026</div></div>
    <div class="kpi" data-comp="h1_pipe" style="cursor:pointer${COMP_FOCUS==='h1_pipe'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">H1 pipeline</div><div class="kpi-v">${fmM(h1p)}</div><div class="kpi-m">${fc(h1p/h1t)}&nbsp;confirmed${yoy!==null?`&nbsp;<span class="${yoy>=0?'pos':'neg'}">${yoy>=0?'+':''}${yoy}% YoY</span>`:''}</div></div>
    <div class="kpi" data-comp="h1_land" style="cursor:pointer${COMP_FOCUS==='h1_land'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:${predGap>=0?'var(--grn)':'var(--red)'}"></div><div class="kpi-l">Forecast landing <span style="font-weight:300;font-size:10px;color:var(--stone)">bottom-up</span></div><div class="kpi-v">${fmM(h1pred)}</div><div class="kpi-m"><span class="${predGap>=0?'pos':'neg'}">${predGap>=0?'+':''}${fmM(predGap)}</span>&nbsp;vs budget</div></div>
    <div class="kpi" data-comp="ly_h1" style="cursor:pointer${COMP_FOCUS==='ly_h1'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">LY H1 actuals</div><div class="kpi-v">${fmM(ly)}</div><div class="kpi-m">May – Oct 2025</div></div>
  </div>
  <div class="kpis k4" style="margin-top:0">
    <div class="kpi" data-comp="win_rate" style="cursor:pointer${COMP_FOCUS==='win_rate'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">Win rate</div><div class="kpi-v">${stats.win_rate||0}%</div><div class="kpi-m">${stats.total_won||0}W / ${stats.total_pitched||0} pitched</div></div>
    <div class="kpi" data-comp="median_deal" style="cursor:pointer${COMP_FOCUS==='median_deal'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">Median deal GP</div><div class="kpi-v">${fmM(stats.median_gp||0)}</div><div class="kpi-m">all-time</div></div>
    <div class="kpi" data-comp="open_pipe" style="cursor:pointer${COMP_FOCUS==='open_pipe'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">Open pipeline</div><div class="kpi-v">${fmM((stats.open_gp||0)*1000)}</div><div class="kpi-m">de-risked · ${stats.open_n||0} opps</div></div>
    <div class="kpi" data-comp="clients" style="cursor:pointer${COMP_FOCUS==='clients'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">${isUS?'Budget':'Active'} clients</div><div class="kpi-v">${stats.total_clients||0}</div><div class="kpi-m">H1 FY26/27</div></div>
  </div>
  <div class="divider" style="margin-top:4px"></div>
  <div class="sec">Monthly tracking</div>
  <div class="tbl"><table>
    <thead><tr><th>Month</th><th>Budget</th><th>Actuals / Pipeline</th><th>Predicted</th><th>vs Budget</th><th>Coverage</th></tr></thead>
    <tbody>
      ${rows.map(({mk,tv,pv,pred,cov,isP})=>`<tr class="${isP?'trail':''}"><td>${mn(mk)}${isP?'&nbsp;<span style="font-size:9px;color:var(--stone);font-family:var(--display)">actual</span>':''}</td><td>${tv?fmM(tv):'—'}</td><td>${fmM(pv)}</td><td>${isP?'—':`<span class="${pred>=tv?'pos':pred>=tv*0.9?'':'neg'}">${fmM(pred)}</span>`}</td><td>${tv?df(pv,tv,mkt):'—'}</td><td>${cov!==null?`<div class="cov-w">${fc(cov)}<div class="cov-b"><div class="cov-f" style="width:${Math.min(cov,1)*100}%;background:${cov>=1?'var(--grn)':cov>=0.75?'var(--amb)':'var(--red)'}"></div></div></div>`:'—'}</td></tr>`).join('')}
      <tr class="est"><td>→ model estimate</td><td>${fmM(h1t)}</td><td>${fmM(h1p)}</td><td><span class="${predGap>=0?'pos':'neg'}">${fmM(h1pred)}</span></td><td>${df(h1pred,h1t,mkt)}</td><td>${fc(h1pred/h1t)}</td></tr>
      <tr class="tot"><td>H1 total</td><td>${fmM(h1t)}</td><td>${fmM(h1p)}</td><td>${fmM(h1pred)}</td><td>${df(h1p,h1t,mkt)}</td><td>${fc(h1p/h1t)}</td></tr>
    </tbody></table>
    <div class="pred-note">Forecast = de-risked pipeline + bottom-up client model where it exceeds pipeline.</div>
  </div>
  <div class="sec">${isUS?'Hub breakdown':'Account manager breakdown'} — click to drill in</div>
  <div class="tbl"><table>
    <thead><tr><th>${isUS?'Hub':'Account manager'}</th><th>H1 target</th><th>H1 pipeline</th><th>Model est.</th><th>Coverage</th>${NEAR.slice(0,3).map(m=>`<th>${mn(m)}</th>`).join('')}</tr></thead>
    <tbody>
      ${groups.map(([name,gd],i)=>{const col2=isUS?(US_HEX[name]||'#888'):UK_AM_HEX[i%UK_AM_HEX.length];const clients=oc[name]||[];const ht=(gd.h1t||0)*1000,hp=(gd.h1p||0)*1000;const hpred=NEAR.reduce((s,m)=>{const pv=clients.reduce((cs,c)=>cs+(tf?.[name]?.[c]?.[m]?.p||0)*1000,0);return s+pv+clients.reduce((cs,c)=>cs+Math.max(0,(((mkt==='us'?D.us.client_pred:D.uk.client_pred)?.[c]?.[m])||0)-(tf?.[name]?.[c]?.[m]?.p||0)*1000),0);},0);return`<tr class="cr" onclick="showGroup('${name.replace(/'/g,"\\'")}')"><td><span style="display:inline-flex;align-items:center;gap:8px"><span style="width:7px;height:7px;border-radius:50%;background:${col2};flex-shrink:0"></span>${name}</span></td><td>${ht?fmM(ht):'—'}</td><td>${fmM(hp)}</td><td><span class="${ht?hpred>=ht?'pos':hpred>=ht*0.75?'':'neg':''}">${fmM(hpred)}</span></td><td>${ht?fc(hp/ht):'—'}</td>${NEAR.slice(0,3).map(m=>{const tv2=clients.reduce((cs,c)=>cs+(tf?.[name]?.[c]?.[m]?.t||0)*1000,0);const pv2=clients.reduce((cs,c)=>cs+(tf?.[name]?.[c]?.[m]?.p||0)*1000,0);return`<td><div>${fmM(pv2)}</div>${tv2?`<div class="cov-b" style="margin-top:3px;width:38px"><div class="cov-f" style="width:${Math.min(tv2?pv2/tv2:0,1)*100}%;background:${tv2&&pv2/tv2>=1?'var(--grn)':pv2/tv2>=0.75?'var(--amb)':'var(--red)'}"></div></div>`:''}</td>`;}).join('')}</tr>`;}).join('')}
    </tbody></table>
  </div>
  <div class="cards c2">
    <div class="card"><div class="ct">Monthly GP trend</div><div class="cs">12m actuals + H1 pipeline vs budget</div><div style="position:relative;height:195px"><canvas id="ag-trend"></canvas></div></div>
    <div class="card"><div class="ct">${isUS?'Pipeline by hub':'Pipeline by AM'}</div><div class="cs">H1 confirmed pipeline vs target</div><div style="position:relative;height:195px"><canvas id="ag-split"></canvas></div></div>
  </div>
</div>`;
  const co=copts(cur);const fwdPipe=NEAR.map(m=>ag[m]?.p||0);
  charts.at=new Chart(document.getElementById('ag-trend'),{type:'bar',data:{labels:cL,datasets:[
    {label:'GP',data:[...hVals,...fwdPipe],backgroundColor:cL.map((_,i)=>i<hMos.length?acCol+'.45)':acCol+'.18)'),borderRadius:2,order:2},
    {label:'Budget',data:[...hMos.map(()=>null),...NEAR.map(m=>ag[m]?.t||0)],type:'line',borderColor:d?'rgba(194,59,46,.5)':'rgba(194,59,46,.4)',borderWidth:1.5,pointRadius:0,fill:false,borderDash:[4,3],tension:0,order:1}
  ]},options:co});
  charts.as=new Chart(document.getElementById('ag-split'),{type:'bar',data:{labels:groups.map(([n])=>n.split(' ')[0].length>8?n.split(' ')[0].slice(0,8):n.split(' ')[0]),datasets:[
    {label:'Target',data:groups.map(([,g])=>Math.round((g.h1t||0))),backgroundColor:d?'rgba(255,255,255,.07)':'rgba(0,0,0,.07)',borderRadius:3,order:2},
    {label:'Pipeline',data:groups.map(([,g])=>Math.round((g.h1p||0))),backgroundColor:isUS?Object.keys(D.us.hubs||{}).map(h=>(US_HEX[h]||'#888')+'99'):UK_AMS.map((_,i)=>UK_AM_HEX[i%UK_AM_HEX.length]+'99'),borderRadius:3,order:1}
  ]},options:{...co,scales:{...co.scales,x:{...co.scales.x,ticks:{...co.scales.x.ticks,maxRotation:25}}}}});
}
/* ── HUB / AM DRILLDOWN ── */
function renderGroupView(gname){
  const isUS=mkt==='us';const tf=isUS?D.us.targets_full:D.uk.targets_full;
  const clients=(isUS?D.us.owner_clients:D.uk.owner_clients)[gname]||[];
  const oppsData=isUS?D.us.opps:D.uk.opps;
  const col=isUS?(US_HEX[gname]||'#888'):UKHEX[gname]||'#888';
  const cur=isUS?'$':'£';const fmM=isUS?f$:fL;
  const h1t=NEAR.reduce((s,m)=>s+clients.reduce((cs,c)=>cs+(tf?.[gname]?.[c]?.[m]?.t||0)*1000,0),0);
  const h1p=NEAR.reduce((s,m)=>s+clients.reduce((cs,c)=>cs+(tf?.[gname]?.[c]?.[m]?.p||0)*1000,0),0);
  const monthRows=ALL.map(mk=>{const isP=isElapsed(mk);const tv=clients.reduce((s,c)=>s+(tf?.[gname]?.[c]?.[mk]?.t||0)*1000,0);const pv=clients.reduce((s,c)=>s+(tf?.[gname]?.[c]?.[mk]?.p||0)*1000,0);const rrUp=isP?0:clients.reduce((s,c)=>s+Math.max(0,(((mkt==='us'?D.us.client_pred:D.uk.client_pred)?.[c]?.[mk])||0)-(tf?.[gname]?.[c]?.[mk]?.p||0)*1000),0);return{mk,tv,pv,pred:isP?pv:pv+rrUp,cov:tv?pv/tv:null,isP};});
  const h1pred=monthRows.filter(r=>NEAR.includes(r.mk)).reduce((s,r)=>s+r.pred,0);const predGap=h1pred-h1t;
  const allOpps=clients.flatMap(c=>(oppsData?.[c]||[]).map(o=>({...o,_c:c})));

  const mainEl = document.getElementById('main');
  if(!mainEl) return; mainEl.innerHTML=`
<div class="ph"><div><div class="ph-eye">${isUS?'Hub':'Account manager'}</div><div class="ph-title" style="display:flex;align-items:center;gap:10px"><span style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0"></span>${gname}</div><div class="ph-sub">${clients.join(' · ')}</div></div><span class="badge ${h1t?h1p/h1t>=1?'g':h1p/h1t>=0.75?'a':'r':'b'}">${h1t?Math.round(h1p/h1t*100)+'% H1 coverage':'No target'}</span></div>
<div class="body">
  ${(()=>{const ln=COMP_FOCUS?compCardExplain(COMP_FOCUS):companionHubNotes(gname);const intro=COMP_FOCUS?compCardTitle(COMP_FOCUS):`Here\u2019s how <b>${gname}</b> is tracking, in other words (IOW):`;return ln?companionPanel(intro,ln):'';})()}
<div class="sec" style="margin-top:0">Current quarter · ${fyQ().label}</div>
  <div class="kpis k4" style="margin-bottom:14px">${qRow(qHub(gname),fmM,qLY(mkt+'|h|'+gname),true)}</div>
  <div class="sec">Current half · H1 · May – Oct</div>
  <div class="kpis k4">
    <div class="kpi" data-comp="h1_target" style="cursor:pointer${COMP_FOCUS==='h1_target'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:${col}"></div><div class="kpi-l">H1 target</div><div class="kpi-v">${fmM(h1t)}</div><div class="kpi-m">May – Oct 2026</div></div>
    <div class="kpi" data-comp="h1_pipe" style="cursor:pointer${COMP_FOCUS==='h1_pipe'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">H1 pipeline</div><div class="kpi-v">${fmM(h1p)}</div><div class="kpi-m">${h1t?fc(h1p/h1t)+' confirmed':'No target'}</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:${predGap>=0?'var(--grn)':'var(--red)'}"></div><div class="kpi-l">Forecast landing <span style="font-weight:300;font-size:10px;color:var(--stone)">bottom-up</span></div><div class="kpi-v">${fmM(h1pred)}</div><div class="kpi-m">${h1pred>=h1t?'<span class="pos">On track</span>':'<span class="neg">'+fmM(h1pred-h1t)+' gap</span>'}</div></div>
    <div class="kpi" data-comp="open_opps" style="cursor:pointer${COMP_FOCUS==='open_opps'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">Open opps</div><div class="kpi-v">${allOpps.length}</div><div class="kpi-m">${fmM(allOpps.reduce((s,o)=>s+o.gp,0))} DR GP</div></div>
  </div>
  <div class="sec">Monthly tracking</div>
  <div class="tbl"><table>
    <thead><tr><th>Month</th><th>Budget</th><th>Pipeline</th><th>Predicted</th><th>vs Budget</th><th>Coverage</th></tr></thead>
    <tbody>
      ${monthRows.map(({mk,tv,pv,pred,cov,isP})=>`<tr class="${isP?'trail':''}"><td>${mn(mk)}${isP?'&nbsp;<span style="font-size:9px;color:var(--stone);font-family:var(--display)">actual</span>':''}</td><td>${tv?fmM(tv):'—'}</td><td>${fmM(pv)}</td><td>${isP?'—':`<span class="${pred>=tv?'pos':pred>=tv*0.9?'':'neg'}">${fmM(pred)}</span>`}</td><td>${tv?df(pv,tv,mkt):'—'}</td><td>${cov!==null?`<div class="cov-w">${fc(cov)}<div class="cov-b"><div class="cov-f" style="width:${Math.min(cov,1)*100}%;background:${cov>=1?'var(--grn)':cov>=0.75?'var(--amb)':'var(--red)'}"></div></div></div>`:'—'}</td></tr>`).join('')}
      <tr class="est"><td>→ model estimate</td><td>${fmM(h1t)}</td><td>${fmM(h1p)}</td><td><span class="${predGap>=0?'pos':'neg'}">${fmM(h1pred)}</span></td><td>${df(h1pred,h1t,mkt)}</td><td>${fc(h1pred/h1t)}</td></tr>
      <tr class="tot"><td>H1 total</td><td>${fmM(h1t)}</td><td>${fmM(h1p)}</td><td>${fmM(h1pred)}</td><td>${df(h1p,h1t,mkt)}</td><td>${fc(h1p/h1t)}</td></tr>
    </tbody></table>
    <div class="pred-note">Forecast tops pipeline up to each client's bottom-up model where the model is higher.</div>
  </div>
  <div class="sec">Client breakdown — click to drill in</div>
  <div class="tbl"><table>
    <thead><tr><th>Client</th><th>H1 target</th><th>H1 pipeline</th><th>Model est.</th><th>Coverage</th>${NEAR.slice(0,3).map(m=>`<th>${mn(m)}</th>`).join('')}</tr></thead>
    <tbody>
      ${clients.map(c=>{const ct=NEAR.reduce((s,m)=>s+(tf?.[gname]?.[c]?.[m]?.t||0)*1000,0);const cp=NEAR.reduce((s,m)=>s+(tf?.[gname]?.[c]?.[m]?.p||0)*1000,0);const cpred=NEAR.reduce((s,m)=>{const pv=(tf?.[gname]?.[c]?.[m]?.p||0)*1000;return s+pv+Math.max(0,(((mkt==='us'?D.us.client_pred:D.uk.client_pred)?.[c]?.[m])||0)-pv);},0);return`<tr class="cr" onclick="showClient('${gname.replace(/'/g,"\\'")}','${c.replace(/'/g,"\\'")}')"><td>${c}</td><td>${ct?fmM(ct):'—'}</td><td>${fmM(cp)}</td><td><span class="${ct?cpred>=ct?'pos':cpred>=ct*0.75?'':'neg':''}">${fmM(cpred)}</span></td><td>${ct?fc(ct?cp/ct:0):'—'}</td>${NEAR.slice(0,3).map(m=>{const tv2=(tf?.[gname]?.[c]?.[m]?.t||0)*1000,pv2=(tf?.[gname]?.[c]?.[m]?.p||0)*1000;return`<td><div>${fmM(pv2)}</div>${tv2?`<div class="cov-b" style="margin-top:3px;width:38px"><div class="cov-f" style="width:${Math.min(tv2?pv2/tv2:0,1)*100}%;background:${tv2&&pv2/tv2>=1?'var(--grn)':pv2/tv2>=0.75?'var(--amb)':'var(--red)'}"></div></div>`:''}</td>`;}).join('')}</tr>`;}).join('')}
    </tbody></table>
  </div>
  ${allOpps.length?`<div class="sec">Open pipeline — ${allOpps.length} opps</div>
  <div class="tbl"><table>
    <thead><tr><th>Opportunity</th><th style="text-align:left">Stage</th><th>Prob</th><th style="text-align:left;font-weight:400">Client · Dates</th>${NEAR.map(m=>`<th>${mn(m)}</th>`).join('')}<th>DR GP</th></tr></thead>
    <tbody>${allOpps.sort((a,b)=>(STGORD[b.stage]||0)-(STGORD[a.stage]||0)||b.gp-a.gp).map(o=>{const ph=o.phases||{};const nt=NEAR.reduce((s,m)=>s+(ph[m]||0),0);if(!nt&&!o.gp)return'';const pc=o.prob>=80?'pos':o.prob<=30?'neg':'';return`<tr><td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.name}</td><td style="text-align:left"><span class="stg ${STGCLS[o.stage]||'stg-br'}">${o.stage}</span></td><td><span class="${pc}" style="font-family:var(--display);font-size:12px">${o.prob||'—'}%</span></td><td style="text-align:left;font-size:11px;color:var(--stone);white-space:nowrap">${o._c}&nbsp;·&nbsp;<span style="font-family:var(--display)">${o.start?o.start.slice(0,7):'?'} → ${o.end?o.end.slice(0,7):'?'}</span>${o.rtb?'<span class="tag tag-r">RTB</span>':''}${o.in_delivery?'<span class="tag tag-l">live</span>':''}</td>${NEAR.map(m=>{const v=ph[m]||0;return`<td>${v?fmM(v):'<span style="color:var(--stone2)">—</span>'}</td>`;}).join('')}<td style="font-weight:500">${fmM(o.gp)}</td></tr>`;}).filter(Boolean).join('')}</tbody></table>
  </div>`:''}
</div>`;
}

/* ── CLIENT VIEW ── */
let COMPANION=true;
function companionT(){COMPANION=!COMPANION;if(view==='client'&&curGroup&&curClient)renderClient(curGroup,curClient);else if(view==='overview')renderAgency();}
function companionClientNotes(mk,cl,fmM){
  const n=(D[mk].client_notes||{})[cl];if(!n)return null;
  const lines=[];
  // landing vs pipeline explanation
  if(n.land<n.pipe-1000){
    lines.push(`<b>Predicted landing (${fmM(n.land)}) sits a little below pipeline (${fmM(n.pipe)}).</b> Pipeline GP is already de-risked (probability-weighted) before it reaches the model, so the model takes it at face value. A small shortfall usually means some pipeline is phased into months where delivery looks unlikely on timing.`);
  } else if(n.land>n.pipe+1000){
    lines.push(`<b>Predicted landing (${fmM(n.land)}) is above current pipeline (${fmM(n.pipe)}).</b> The model expects this ${n.steady?'steady ':''}client to keep winning new briefs — it books about ${fmM(n.rr)}/month historically. Worth a sense-check that this pace continues.`);
  } else {
    lines.push(`Predicted landing (${fmM(n.land)}) is close to current pipeline — this client's forecast is well-grounded in deals already in the system.`);
  }
  if(n.steady)lines.push(`Classed as a <b>steady</b> client (books most months, low volatility), so the model floors future months at 85% of its ~${fmM(n.rr)}/month run-rate.`);
  if(n.issues&&n.issues.length){
    lines.push(`<b>Data to clean up:</b> ${n.issues.map(s=>`"${s[0]}" — ${s[1]}`).join('; ')}. Fix the project dates or GP in Salesforce, or close the deal out.`);
  }
  return lines;
}
function companionAgencyNotes(mk,fmM){
  const a=(D[mk]||{}).agency_notes;if(!a)return null;const lines=[];
  const cov=a.tgt?Math.round(a.pipe/a.tgt*100):0;const landPct=a.tgt?Math.round(a.land/a.tgt*100):0;
  lines.push(`Against an H1 target of ${fmM(a.tgt)}, you've got ${fmM(a.pipe)} in pipeline today (${cov}% covered) and the model expects ${fmM(a.land)} to land (${landPct}% of target). The gap to target is work not yet won.`);
  if(a.thin&&a.thin.length){lines.push(`<b>Model expects more than pipeline shows</b> for: ${a.thin.map(t=>`${t[0]} (+${fmM(t[1])})`).join(', ')} — these are steady clients the model assumes keep booking. If you don't see that work coming, flag it down.`);}
  if(a.below&&a.below.length){lines.push(`<b>Landing below pipeline</b> for: ${a.below.map(t=>`${t[0]} (${fmM(t[1])} lower)`).join(', ')} — because their pipeline leans on early-stage pitches the model discounts. Not an error; push those deals forward to close the gap.`);}
  if(a.nflags){lines.push(`${a.nflags} data-quality issue${a.nflags>1?'s':''} that matter on this market (elapsed project windows, missing GP) — see Data quality. Worth a tidy before the finance review.`);
  if(a.bigbets&&a.bigbets.length){
    const tb=a.bigbets.reduce((s,b)=>s+b[3],0);
    lines.push(`<b>Big-pitch watch:</b> ${fmM(tb)} of H1 expected rides on ${a.bigbets.length} large uncommitted deal${a.bigbets.length>1?'s':''} (≥${mkt==='us'?'$':'£'}250k): ${a.bigbets.map(b=>`${b[1]} “${b[0]}” (${b[2]}% CRM prob, ${fmM(b[3])})`).join('; ')}. Historically, pitches this size convert ~30% of GP — the CRM probabilities are account-level and may flatter them.`);
  }}
  return lines;
}
let COMP_FOCUS=null;
function __initComp(){if(window.__compBound)return;window.__compBound=true;
  document.addEventListener('click',e=>{const k=e.target.closest&&e.target.closest('.kpi[data-comp]');
    if(!k||!['overview','group','client'].includes(view))return;compFocus(k.getAttribute('data-comp'));});}
function compRerender(){
  if(view==='overview'){if(mkt==='grp')renderGroup();else renderAgency();}
  else if(view==='group')renderGroupView(curGroup);
  else if(view==='client')renderClient(curGroup,curClient);}
function compFocus(key){COMP_FOCUS=(COMP_FOCUS===key||key==null)?null:key;if(COMP_FOCUS)COMPANION=true;compRerender();}
function compMV(ctx,m){
  if(ctx.rows){const r=ctx.rows[m]||{};return{tv:r.tv||0,pv:r.pv||0,pred:r.pred||0};}
  let tv=0,pv=0,pred=0;
  ctx.cls.forEach(cl=>{const e=((ctx.tf||{})[cl]||{})[m]||{};tv+=(e.t||0)*1000;pv+=(e.p||0)*1000;pred+=(((ctx.cp||{})[cl])||{})[m]||0;});
  return{tv,pv,pred};}
function compCtx(){
  const isUS=mkt==='us';
  if(view==='group'){const d=qScope();return{kind:'hub',fm:isUS?f$:fL,lyk:mkt+'|h|'+curGroup,tf:(d.targets_full||{})[curGroup]||{},cls:(d.owner_clients||{})[curGroup]||[],cp:d.client_pred||{},d,name:curGroup};}
  if(view==='client'){const d=qScope();return{kind:'client',fm:isUS?f$:fL,lyk:mkt+'|c|'+curClient,tf:(d.targets_full||{})[curGroup]||{},cls:[curClient],cp:d.client_pred||{},d,name:curClient};}
  if(mkt==='grp')return{kind:'group',fm:fL,lyk:'group',rows:D.group.pred_rows,pl:D.group.pl||{},lyh:(D.group.ly_h1||0)*1000,name:'the Group'};
  const d=qScope();return{kind:'mkt',fm:isUS?f$:fL,lyk:mkt,rows:d.pred_rows,pl:d.pl||{},lyh:(d.ly_h1||0)*1000,stats:d.stats||{},d,name:isUS?'the US':'the UK'};}
function compCardExplainScoped(key){
  const ctx=compCtx();const fm=ctx.fm;const grp=ctx.kind==='group';const scope=ctx.name;
  const q=fyQ();let qt=0,qp=0,qpr=0;q.m.forEach(m=>{const v=compMV(ctx,m);qt+=v.tv;qp+=v.pv;qpr+=v.pred;});
  const elapsed=q.m.filter(m=>m<AS_OF);let act=0;elapsed.forEach(m=>{act+=compMV(ctx,m).pred;});
  const rem=q.m.filter(m=>m>=AS_OF);let remP=0,remPred=0;rem.forEach(m=>{const v=compMV(ctx,m);remP+=v.pv;remPred+=v.pred;});
  let h1t=0,h1p=0,h1pred=0;NEAR.forEach(m=>{const v=compMV(ctx,m);h1t+=v.tv;h1p+=v.pv;h1pred+=v.pred;});
  const lyq=qLY(ctx.lyk);const qn=q.label.split(' ')[0];
  const M3=mm=>['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mm.slice(5,7)-1];
  const rL=rem.map(M3).join('\u2013');const eL=elapsed.map(M3).join('+');
  const L={
   q_target:[`${fm(qt)} is ${scope}'s share of the monthly targets for ${qn}${grp?' \u2014 UK plus US converted at '+FX+' USD/GBP':''}.`,
     `The near-term yardstick \u2014 the rest of this row is measured against it.`],
   q_pipe:[`${fm(qp)} de-risked GP already phased into these 3 months for ${scope} (Committed counted in full, matching the P&L).`,
     `${qt?Math.round(qp/qt*100)+'% of the '+qn+' target \u2014 ':''}under-coverage 2\u20133 months out is normal; roughly 40% of a month's revenue typically backfills.`],
   q_land:(()=>{const add=remPred-remP;
     const ln=[`${fm(qpr)} = ${elapsed.length?fm(act)+' delivered + committed ('+eL+') + ':''}${fm(remP)} pipeline in ${rL}${Math.abs(add)>15000?` + ${fm(add)} model top-up (steady-client run-rate)`:' \u2014 the model adds little on top here'}.`];
     ln.push(`Elapsed months count won + Committed work (the P&L basis); remaining months are pipeline plus the model's view of normal booking pace.`);return ln;})(),
   q_ly:[lyq!=null?`${fm(lyq)} booked in the same 3 months last year \u2014 a like-for-like seasonal comparison for ${scope}.`:'Not enough history for this quarter last year.',
     `Separates \u201cbehind target\u201d from \u201cbehind last year\u201d \u2014 different conversations.`],
   h1_target:[`${fm(h1t)} is the May\u2013Oct target for ${scope}${ctx.pl&&ctx.pl.budget_h1?`, tying to the P&L H1 budget of ${fm(ctx.pl.budget_h1)} (checked automatically in Data quality)`:' \u2014 the sum of the client-level targets in the plan'}${grp?'. US is converted at a flat '+FX+'; the P&L Group tab uses month-end rates, so small differences are FX, not data':''}.`],
   h1_pipe:[`${fm(h1p)} de-risked GP phased into May\u2013Oct for ${scope} from open + won deals, Committed at full value.`,
     `${h1t?Math.round(h1p/h1t*100)+'% of the H1 target is visible in Salesforce today \u2014 the rest is work still to be created and won.':''}`],
   h1_land:[`${fm(h1pred)} bottom-up: ${ctx.kind==='client'?`${scope}'s pipeline at face value plus the run-rate floor if classed steady`:`every client's forecast summed \u2014 pipeline at face value plus steady-client run-rate floors`}.`,
     `${ctx.kind==='client'?'The implied-briefs strip shows exactly what extra work this assumes \u2014 challenge it there.':'Each client page shows its own assumptions \u2014 challenge them there.'}`],
   ly_h1:[ctx.lyh?`${fm(ctx.lyh)} actually delivered May\u2013Oct last year \u2014 the cleanest base for \u201care we growing?\u201d`:'\u2014'],
   grp_us:[`The US contribution converted to GBP at a flat ${FX}. The P&L's Group view uses month-end FX rates, so small differences vs that tab are currency, not data.`,
     `Switch to the US market in the sidebar for its full view and companion.`],
   grp_uk:[`The UK contribution in native GBP \u2014 ties directly to the UK P&L Summary.`,
     `Switch to the UK market in the sidebar for its full view and companion.`],
   open_opps:[`Deals still open (not yet won or lost) on ${scope}'s clients, all months \u2014 wider than H1 pipeline, which only counts GP phased into May\u2013Oct.`],
   run_rate:(()=>{const n=((ctx.d||{}).client_notes||{})[ctx.name]||{};
     return[`${fm(n.rr||0)}/month is what ${scope} actually booked on average over the last 12 months \u2014 the benchmark the forecast leans on.`,
       n.steady?`Classed steady (books most months, low volatility), so future months are floored at ~85% of this run-rate even where pipeline is thin.`:`Not classed steady, so the model does NOT assume this pace continues \u2014 future months lean on actual pipeline.`];})(),
   c_win_rate:(()=>{const h=((ctx.d||{}).client_hist||{})[ctx.name]||{};
     return[`${h.win_rate!=null?h.win_rate+'%':'\u2014'} of ${scope}'s resolved briefs were won (${h.won||0}W of ${(h.won||0)+(h.lost||0)} resolved).`];})(),
   c_median:(()=>{const p=(((ctx.d||{}).profiles||{})[ctx.name]||{}).all||{};
     return[`${fm(p.med_gp||0)} is the middle won deal for ${scope} \u2014 the size of a \u201cnormal\u201d brief here. It's what translates forecast gaps into the implied-brief counts below.`];})(),
   tenure:(()=>{const a=((ctx.d||{}).account_first_fy||{})[ctx.name];
     return[`First activity on ${scope}: ${a||'\u2014'}. Longer tenure means richer history behind the run-rate, win-rate and seasonality numbers \u2014 and a more trustworthy forecast.`];})()
  };
  return L[key]||null;}
function companionGroupNotes(){
  const r=D.group.pred_rows,pl=D.group.pl||{};let t=0,p=0,pr=0;
  NEAR.forEach(m=>{const x=r[m]||{};t+=x.tv||0;p+=x.pv||0;pr+=x.pred||0;});
  const lines=[`Against a Group H1 target of ${fL(t)}, pipeline today is ${fL(p)} (${t?Math.round(p/t*100):0}% covered) and the model expects ${fL(pr)} to land (${t?Math.round(pr/t*100):0}% of target). The gap is work not yet won.`];
  const ush=(D.us||{}).agency_notes||{},ukh=(D.uk||{}).agency_notes||{};
  if(ush.land&&ukh.land)lines.push(`<b>By market:</b> US expects ${f$(ush.land)} vs ${f$(ush.budget)} budget; UK ${fL(ukh.land)} vs ${fL(ukh.budget)}. ${(ush.land/ush.budget)>(ukh.land/ukh.budget)?'The US is currently the stronger half of the story.':'The UK is currently the stronger half of the story.'}`);
  const q=qFromRows(r);const ly=qLY('group');
  if(ly)lines.push(`${q.label}: expected ${fL(q.pr)} vs ${fL(ly)} same quarter last year (${Math.round((q.pr-ly)/ly*100)}% YoY). Mid-2025 was unusually strong (the US new-business run), so much of that gap is the comparison, not current deterioration \u2014 but it will be asked about.`);
  const nf=(ush.nflags||0)+(ukh.nflags||0);
  if(nf)lines.push(`${nf} data-quality issue${nf>1?'s':''} that matter across the two markets \u2014 see each market's Data quality tab.`);
  return lines;}
function companionHubNotes(g){
  const d=qScope();const fm=mkt==='us'?f$:fL;const cls=(d.owner_clients||{})[g]||[];const notes=d.client_notes||{};
  let t=0,p=0,pr=0;
  NEAR.forEach(m=>{cls.forEach(cl=>{const ee=(((d.targets_full||{})[g]||{})[cl]||{})[m]||{};t+=(ee.t||0)*1000;p+=(ee.p||0)*1000;pr+=((d.client_pred||{})[cl]||{})[m]||0;});});
  const lines=[`${g}: against an H1 target of ${fm(t)}, pipeline is ${fm(p)}${t?' ('+Math.round(p/t*100)+'% covered)':''} and expected landing ${fm(pr)}${t?' ('+Math.round(pr/t*100)+'% of target)':''}.`];
  const thin=cls.map(cl=>({cl,n:notes[cl]})).filter(x=>x.n&&x.n.land>x.n.pipe+25000).sort((a,b)=>(b.n.land-b.n.pipe)-(a.n.land-a.n.pipe));
  if(thin.length)lines.push(`<b>Model expects more than pipeline shows</b> for: ${thin.slice(0,3).map(x=>`${x.cl} (+${fm(x.n.land-x.n.pipe)})`).join(', ')} \u2014 steady clients the model assumes keep booking. If that work isn't coming, flag it down.`);
  const behind=cls.map(cl=>({cl,n:notes[cl]})).filter(x=>x.n&&x.n.pipe>x.n.land+25000).sort((a,b)=>(b.n.pipe-b.n.land)-(a.n.pipe-a.n.land));
  if(behind.length)lines.push(`Pipeline runs ahead of expected landing for ${behind.slice(0,2).map(x=>x.cl).join(' and ')} \u2014 early-stage GP the model discounts; it lands only if those deals commit.`);
  const iss=cls.reduce((s,cl)=>s+((((notes[cl]||{}).issues)||[]).length),0);
  if(iss)lines.push(`${iss} data-quality issue${iss>1?'s':''} on this hub's clients \u2014 see Data quality.`);
  return lines;}
function compCardTitle(key){const t={q_target:'Q target',q_pipe:'Q pipeline',q_land:'Q expected landing',q_ly:'LY Q actuals',
  h1_target:'H1 target',h1_pipe:'H1 pipeline',h1_land:'Forecast landing',ly_h1:'LY H1 actuals',
  win_rate:'Win rate',median_deal:'Median deal GP',open_pipe:'Open pipeline',clients:'Clients',grp_us:'United States',grp_uk:'United Kingdom',open_opps:'Open opps',run_rate:'Run-rate benchmark',c_win_rate:'Win rate',c_median:'Median deal GP',tenure:'Client tenure'}[key]||key;
  return 'What \u201c'+t+'\u201d means:';}
function compCardExplain(key){
  if(view!=='overview'||mkt==='grp')return compCardExplainScoped(key);
  const isUS=mkt==='us';const d=qScope();const fm=isUS?f$:fL;const stats=d.stats||{};
  const q=qFromRows(d.pred_rows);const qn=q.label.split(' ')[0];
  const h1t=NEAR.reduce((s,m)=>s+((d.pred_rows[m]||{}).tv||0),0);
  const h1p=NEAR.reduce((s,m)=>s+((d.pred_rows[m]||{}).pv||0),0);
  const h1pred=NEAR.reduce((s,m)=>s+((d.pred_rows[m]||{}).pred||0),0);
  const bud=(d.pl||{}).budget_h1||0;const lyh=(d.ly_h1||0)*1000;const lyq=qLY(mkt);
  const elapsed=q.m.filter(m=>m<AS_OF);const act=elapsed.reduce((s,m)=>s+((d.pred_rows[m]||{}).pred||0),0);const modv=q.pr-act;
  const L={
  q_target:[`${fm(q.t)} is the sum of the monthly targets for ${q.m.length} months (${qn}), straight from the Targets tab finance signed off.`,
    `It's the near-term yardstick \u2014 everything else on this row is measured against it.`],
  q_pipe:[`${fm(q.p)} is the de-risked GP already phased into these 3 months \u2014 work won or in play today, after probability weighting.`,
    `It covers ${q.t?Math.round(q.p/q.t*100):0}% of the ${qn} target. That's normal, not alarming: roughly 40% of a month's eventual revenue typically doesn't exist in Salesforce 3 months out \u2014 it backfills.`],
  q_land:(()=>{const rem=q.m.filter(m=>m>=AS_OF);const remP=rem.reduce((s,m)=>s+((d.pred_rows[m]||{}).pv||0),0);
    const add=modv-remP;const net=q.pr-q.p;const ePv=elapsed.reduce((s,m)=>s+((d.pred_rows[m]||{}).pv||0),0);const slip=ePv-act;
    const M3=mm=>['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mm.slice(5,7)-1];
    const eL=elapsed.map(M3).join('+');const rL=rem.map(M3).join('\u2013');
    const ln=[`${fm(q.pr)} = ${elapsed.length?fm(act)+' already delivered ('+eL+') + ':''}${fm(remP)} de-risked pipeline phased into ${rL}${Math.abs(add)>20000?` + ${fm(add)} the model adds on top for steady clients' usual run-rate`:` \u2014 the model adds almost nothing on top`}.`];
    if(Math.abs(net)<Math.max(25000,q.t*0.015)&&slip>20000&&add>20000)ln.push(`It lands within ${fm(Math.abs(net))} of the ${qn} pipeline card \u2014 two effects cancelling: ${eL} still has ${fm(slip)} phased on deals awaiting close-out (mostly Committed \u2014 it books when the paperwork lands), which offsets the model's ${rL} top-up.`);
    else if(net<-25000)ln.push(`It sits ${fm(-net)} below the ${qn} pipeline card: ${fm(slip)} phased into ${eL} is still on open deals awaiting close-out, outweighing the model's ${fm(add)} top-up for ${rL}.`);
    else if(net>25000)ln.push(`The model top-up is why it sits ${fm(net)} above the ${qn} pipeline card.`);
    else ln.push(`In net it's the pipeline taken as-is \u2014 the model isn't adding material run-rate inside ${rL}.`);
    ln.push(`Early in the quarter the ${rL} piece is forecast; by the final month it's nearly all actuals. Client pages show which accounts any top-up assumes.`);
    return ln;})(),
  q_ly:[lyq!=null?`${fm(lyq)} is the booked GP delivered in the same 3 months last year \u2014 a like-for-like seasonal comparison.`:`Not enough history for this quarter last year.`,
    `Use it to separate \u201cbehind target\u201d from \u201cbehind last year\u201d \u2014 they're different conversations.`],
  h1_target:[`${fm(h1t)} is the May\u2013Oct target, summed from the monthly Targets tab.`,
    `It should tie to the P&L H1 budget of ${fm(bud)} \u2014 the reconciliation panel checks this automatically.`],
  h1_pipe:[`${fm(h1p)} is de-risked GP phased into May\u2013Oct from all open + won deals.`,
    `\u201cConfirmed %\u201d is this as a share of target. The YoY figure compares to the pipeline position at the same point last year.`],
  h1_land:[`${fm(h1pred)} is bottom-up: every client's forecast (pipeline at face value + run-rate floor for steady clients), summed.`,
    `The \u201cvs budget\u201d delta compares to finance's ${fm(bud)} H1 budget. The model's per-client assumptions are visible on each client page \u2014 challenge them there.`],
  ly_h1:[`${fm(lyh)} is what actually delivered May\u2013Oct last year \u2014 the cleanest base for \u201care we growing?\u201d`],
  win_rate:[`${stats.win_rate||0}% of resolved briefs were won (${stats.total_won||0}W of ${stats.total_pitched||0} pitched) \u2014 counted on commercial record types only (Agency Execution + FiveTwoNine), so RFPs and passthroughs don't distort it.`,
    `It's deal-count based. GP-weighted win rate is lower because big pitches convert at ~30% \u2014 keep that in mind when stacking large deals.`],
  median_deal:[`${fm((stats.median_gp||0))} is the middle won deal \u2014 half your briefs are smaller, half bigger. More honest than the average, which big deals drag upward.`],
  open_pipe:[`${fm((stats.open_gp||0)*1000)} of de-risked GP across deals still open (not yet won or lost), all months \u2014 wider than the H1 pipeline card, which only counts GP phased into May\u2013Oct.`],
  clients:[`${stats.total_clients||0} clients with H1 FY26/27 budgets in the plan.`,
    `The KPI explorer's \u201cActive clients\u201d differs \u2014 that counts who actually billed each month.`]};
  return L[key]||null;}
let currentCompanionRequest = 0;

async function generateCompanionInsight(intro, lines, reqId) {
  try {
    const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });
    const prompt = `You are an expert Revenue Operations Analyst for a global agency group.
    
The user is looking at a pipeline dashboard. We have automatically calculated the following raw insights from the data:

Topic: ${intro}
Data points:
${lines.map(l => "- " + l.replace(/<[^>]*>?/gm, '')).join('\n')}

Synthesize this into a clear, natural, and insightful executive summary.
Tone and formatting rules:
1. Keep it extremely concise and action-driven.
2. Use bullet points if necessary, but do not over-bullet.
3. Do not invent numbers or metrics not provided in the data points.
4. Format the output in basic HTML (<ul>, <li>, <b>). Do NOT use markdown.`;

    const result = await model.generateContent(prompt);
    
    if (currentCompanionRequest !== reqId) return;
    
    const container = document.getElementById('ai-companion-output');
    if (container) {
      container.innerHTML = result.response.text();
    }
  } catch (e) {
    if (currentCompanionRequest !== reqId) return;
    const container = document.getElementById('ai-companion-output');
    if (container) {
      container.innerHTML = `<div style="color:var(--red)">Failed to generate AI insights: ${e.message}</div>`;
    }
  }
}

function companionPanel(intro,lines){
  if(!COMPANION)return `<div style="margin-bottom:14px"><button class="wk-btn" onclick="companionT()">✨ AI Analyst: Explain this view</button></div>`;
  
  currentCompanionRequest++;
  generateCompanionInsight(intro, lines, currentCompanionRequest);

  return `<div class="card" style="margin-bottom:18px;border-left:3px solid #ff7daa">
    <div style="display:flex;align-items:flex-start;gap:10px">
      <div style="font-size:22px;line-height:1;flex-shrink:0;margin-top:2px">✨</div>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center"><div class="ct" style="margin:0">Vertex AI Insights</div>${COMP_FOCUS&&['overview','group','client'].includes(view)?`<span><button class="wk-btn" onclick="compFocus(null)" style="font-size:10px;padding:3px 8px;margin-right:6px">\u2190 Back to summary</button><button class="wk-btn" onclick="companionT()" style="font-size:10px;padding:3px 8px">Hide</button></span>`:`<button class="wk-btn" onclick="companionT()" style="font-size:10px;padding:3px 8px">Hide</button>`}</div>
        <div class="cs" style="margin-top:6px">${intro}</div>
        <div id="ai-companion-output" style="margin:8px 0 0;line-height:1.7;font-size:13px">
          <div style="color:var(--stone);font-style:italic">Analyzing pipeline data...</div>
        </div>
        <div style="margin-top:8px;font-size:10px;color:var(--stone)">AI-generated summary grounded in live dashboard data. ${['overview','group','client'].includes(view)?' \u00b7 Click any KPI card to explain that number; click it again to come back.':''}</div>
      </div></div></div>`;
}
function renderClient(gname,client){
  const isUS=mkt==='us';const tf=isUS?D.us.targets_full:D.uk.targets_full;
  const cd_t=tf?.[gname]?.[client]||{};
  const msf=(isUS?D.us.monthly_sf:D.uk.monthly_sf)?.[client]||{};
  const opps=(isUS?D.us.opps:D.uk.opps)?.[client]||[];
  const cw=(isUS?D.us.cw_deals:D.uk.cw_deals)?.[client]||[];
  const bb=(isUS?D.us.bb_stats:D.uk.bb_stats)?.[client]||{};
  const rr=(isUS?D.us.rr_stats:D.uk.rr_stats)?.[client]||{};
  const fy=(isUS?D.us.client_fy_totals:D.uk.client_fy_totals)?.[client]||{};
  const prof=(isUS?D.us.profiles:D.uk.profiles)?.[client]?.all;
  const affy=(isUS?D.us.account_first_fy:D.uk.account_first_fy)?.[client];
  const chist=(isUS?D.us.client_hist:D.uk.client_hist)?.[client]||null;
  const cseas=(isUS?D.us.client_seasonal:D.uk.client_seasonal)?.[client]||null;
  const impliedBriefs=(isUS?D.us.client_implied_briefs:D.uk.client_implied_briefs)?.[client]||null;
  const clientAvgGp=(isUS?D.us.client_avg_gp:D.uk.client_avg_gp)?.[client]||0;
  const cflags=((isUS?D.us.flags:D.uk.flags)||[]).filter(f=>f.client===client).sort((a,b)=>(b.score||0)-(a.score||0));
  const trueWR=chist&&chist.win_rate!==null?chist.win_rate:null;
  const briefsByFY=(()=>{if(!chist||!chist.created)return null;const byfy={};Object.entries(chist.created).forEach(([ym,n])=>{const p=ym.split('-').map(Number);const fy=p[1]>=5?p[0]:p[0]-1;byfy[fy]=(byfy[fy]||0)+n;});return byfy;})();
  const briefsPerMo=(()=>{if(!chist||!chist.created)return null;const months=Object.keys(chist.created);if(!months.length)return null;const total=Object.values(chist.created).reduce((a,b)=>a+b,0);return(total/months.length);})();
  const lagD=chist?(chist.mean_created_to_phase_days??chist.median_close_to_start_days):null;const lagMed=chist?chist.median_close_to_start_days:null;
  const SEASMN=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const col=isUS?(US_HEX[gname]||'#888'):UKHEX[gname]||'#888';
  const cur=isUS?'$':'£';const fmM=isUS?f$:fL;
  const h1t=NEAR.reduce((s,m)=>s+(cd_t[m]?.t||0)*1000,0);
  const isNewBiz=(!isUS && client==='New Business');
  const grpLines=isNewBiz?(tf?.[gname]||{}):null;
  const pAt=(m)=>{ if(isNewBiz){ let s=0; for(const cc in grpLines){ const cell=grpLines[cc]?.[m]; if(cell&&typeof cell==='object') s+=(cell.p||0);} return s;} return cd_t[m]?.p||0; };
  const h1p=NEAR.reduce((s,m)=>s+pAt(m)*1000,0);
  const monthRows=ALL.map(mk=>{const isP=isElapsed(mk),tv=(cd_t[mk]?.t||0)*1000,pv=pAt(mk)*1000;const cpred=((isUS?D.us.client_pred:D.uk.client_pred)?.[client]?.[mk])||0;const pTop=isP?pv:Math.max(pv,cpred);return{mk,tv,pv,pred:pTop,cov:tv?pv/tv:null,isP};});
  const h1pred=monthRows.filter(r=>NEAR.includes(r.mk)).reduce((s,r)=>s+r.pred,0);const predGap=h1pred-h1t;
  const wr=prof?Math.round(prof.win_rate*100):null;const nW=prof?.n_wins||0,nT=prof?.n_total||0,medGP=prof?.med_gp||0;
  let tenure='—';if(affy){const mo=Math.round((new Date('2026-06-01')-new Date(affy))/(1000*60*60*24*30));tenure=mo>=24?Math.floor(mo/12)+'y '+(mo%12)+'m':mo+'m';}
  const l3=rr.last3_actuals||[],l3mks=rr.last3_mks||[];const trend=rr.trend||'stable';
  const fyChips=Object.entries(fy).filter(([,v])=>v>1000).sort(([a],[b])=>a.localeCompare(b));
  const histMos=Object.keys(msf).filter(m=>m>='2025-01'&&m<='2026-04').sort();
  const hv=histMos.map(m=>Math.round((msf[m]||0)/1000));
  const cL=[...histMos,...NEAR].map(mn);const cA=[...hv,...NEAR.map(()=>null)];
  const cP=[...histMos.map(()=>null),...NEAR.map(m=>cd_t[m]?.p||0)];
  const cT=[...histMos.map(()=>null),...NEAR.map(m=>cd_t[m]?.t||0)];
  const _cpred=(isUS?D.us.client_pred:D.uk.client_pred)?.[client]||{};
  const cPred=[...histMos.map(()=>null),...NEAR.map(m=>Math.round((_cpred[m]||0)/1000))];
  const acCol=isUS?'rgba(30,79,168,':'rgba(31,122,74,';const d=dk();
  const renderRow=(o,isCW)=>{const ph=o.phases||{};const nt=NEAR.reduce((s,m)=>s+(ph[m]||0),0);if(!nt&&!o.gp)return'';return`<tr style="${isCW?'opacity:.72':''}"><td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${isCW?'color:var(--coal2)':''}">${o.name}</td><td style="text-align:left">${isCW?'<span class="stg stg-cw">Closed Won</span>':`<span class="stg ${STGCLS[o.stage]||'stg-br'}">${o.stage}</span>`}</td><td>${isCW?'<span style="color:var(--grn);font-family:var(--display);font-size:11px">Won</span>':`<span class="${o.prob>=80?'pos':o.prob<=30?'neg':''}" style="font-family:var(--display);font-size:12px">${o.prob||'—'}%</span>`}</td><td style="text-align:left;font-size:11px;color:var(--stone);white-space:nowrap"><span style="font-family:var(--display)">${o.start?o.start.slice(0,7):'?'} → ${o.end?o.end.slice(0,7):'?'}</span>${o.rtb?'<span class="tag tag-r">RTB</span>':''}${(o.in_delivery||isCW)?'<span class="tag tag-l">live</span>':''}</td>${NEAR.map(m=>{const v=ph[m]||0;return`<td>${v?`<span style="${isCW?'color:var(--stone)':''}">${fmM(v)}</span>`:'<span style="color:var(--stone2)">—</span>'}</td>`;}).join('')}<td style="font-weight:${isCW?400:500};${isCW?'color:var(--coal2)':''}">${o.gp?fmM(o.gp):'—'}</td></tr>`;};

  const mainEl = document.getElementById('main');
  if(!mainEl) return; mainEl.innerHTML=`
<div class="ph"><div><div class="ph-eye">${gname}</div><div class="ph-title" style="display:flex;align-items:center;gap:9px"><span style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0"></span>${client}</div><div class="ph-sub">${tI(trend)} ${trend.charAt(0).toUpperCase()+trend.slice(1)} · ${fmM(bb.avg12)} avg/month · since ${affy?new Date(affy).toLocaleDateString('en-GB',{month:'short',year:'numeric'}):'—'}</div></div><span class="badge ${h1t?h1p/h1t>=1?'g':h1p/h1t>=0.75?'a':'r':'b'}">${h1t?Math.round(h1p/h1t*100)+'% H1 coverage':'No target'}</span></div>
<div class="body">
  ${(()=>{const ln=COMP_FOCUS?compCardExplain(COMP_FOCUS):companionClientNotes(isUS?'us':'uk',client,fmM);if(COMP_FOCUS&&ln)return companionPanel(compCardTitle(COMP_FOCUS),ln);return ln?companionPanel(`Here's what to be aware of on <b>${client}</b>:`,ln):'';})()}
  ${fyChips.length?`<div class="sec">Revenue history</div><div class="fy-row">${fyChips.map(([yr,v])=>`<div class="fy-chip"><div class="fy-y">${yr}</div><div class="fy-v">${fmM(v)}</div></div>`).join('')}<div class="fy-chip" style="border-color:${col}55;border-style:dashed"><div class="fy-y" style="color:${col}">26/27 est.</div><div class="fy-v" style="color:${col}">${h1t?fmM(h1t*2):'—'}</div></div></div>`:''}
  <div class="sec" style="margin-top:0">Current quarter · ${fyQ().label}</div>
  <div class="kpis k4" style="margin-bottom:14px">${qRow(qClientQ(gname,client),fmM,qLY(mkt+'|c|'+client),true)}</div>
  <div class="sec">Current half · H1 · May – Oct</div>
  <div class="kpis k4" style="margin-bottom:10px">
    <div class="kpi" data-comp="h1_target" style="cursor:pointer${COMP_FOCUS==='h1_target'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:${col}"></div><div class="kpi-l">H1 target</div><div class="kpi-v">${h1t?fmM(h1t):'—'}</div><div class="kpi-m">May – Oct 2026</div></div>
    <div class="kpi" data-comp="h1_pipe" style="cursor:pointer${COMP_FOCUS==='h1_pipe'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">H1 pipeline</div><div class="kpi-v">${fmM(h1p)}</div><div class="kpi-m">${h1t?fc(h1p/h1t)+' confirmed':'No target'}</div></div>
    <div class="kpi" data-comp="h1_land" style="cursor:pointer${COMP_FOCUS==='h1_land'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-acc" style="background:${predGap>=0?'var(--grn)':'var(--red)'}"></div><div class="kpi-l">Forecast landing <span style="font-weight:300;font-size:10px;color:var(--stone)">bottom-up</span></div><div class="kpi-v">${fmM(h1pred)}</div><div class="kpi-m">${h1pred>=h1t?'<span class="pos">On track</span>':'<span class="neg">'+fmM(h1pred-h1t)+' gap</span>'}</div></div>
    <div class="kpi" data-comp="run_rate" style="cursor:pointer${COMP_FOCUS==='run_rate'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">Run-rate benchmark</div><div class="kpi-v">${fmM(getRr(client,mkt))}</div><div class="kpi-m">per month</div></div>
  </div>
  <div class="kpis k4" style="margin-bottom:22px">
    <div class="kpi" data-comp="c_win_rate" style="cursor:pointer${COMP_FOCUS==='c_win_rate'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">Win rate</div><div class="kpi-v">${wr!==null?wr+'%':'—'}</div><div class="kpi-m">${nW} won / ${nT} pitched</div></div>
    <div class="kpi" data-comp="c_median" style="cursor:pointer${COMP_FOCUS==='c_median'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">Median deal GP</div><div class="kpi-v">${medGP?fmM(medGP):'—'}</div><div class="kpi-m">${nW} closed deals</div></div>
    <div class="kpi" data-comp="tenure" style="cursor:pointer${COMP_FOCUS==='tenure'?';border:1.5px solid #ff7daa;box-shadow:0 0 0 1px #ff7daa22':''}"><div class="kpi-l">Client tenure</div><div class="kpi-v">${tenure}</div><div class="kpi-m">since ${affy?new Date(affy).toLocaleDateString('en-GB',{month:'short',year:'numeric'}):'—'}</div></div>
    <div class="kpi"><div class="kpi-l">Delivery trend</div><div class="kpi-v">${tI(trend)}&nbsp;<span style="font-size:18px">${trend.charAt(0).toUpperCase()+trend.slice(1)}</span></div><div class="kpi-m">${l3.length?l3.map((v,i)=>`${l3mks[i]?MN[l3mks[i]]||l3mks[i]:''}:${fmM(v)}`).join(' · '):'—'}</div></div>
  </div>
  <div class="card" style="margin-bottom:18px"><div class="ct">Monthly delivery — history &amp; pipeline</div><div class="cs">Actuals (solid) · Pipeline (faded) · Dashed = target · Pink = predicted landing</div><div style="position:relative;height:185px"><canvas id="cl-chart"></canvas></div></div>
  ${impliedBriefs?(()=>{
    const mns=NEAR;
    const vals=mns.map(m=>impliedBriefs[m]||0);
    const tot=vals.reduce((a,b)=>a+b,0);
    const maxv=Math.max(...vals,1);
    const cells=mns.map((m,i)=>{
      const v=vals[i];const bh=Math.max(2,Math.round(v/maxv*32));
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:10px;color:var(--stone);font-family:var(--display)">${v>0?v.toFixed(1):'—'}</div>
        <div style="width:60%;height:${bh}px;background:rgba(255,125,170,.7);border-radius:2px"></div>
        <div style="font-size:9px;color:var(--stone)">${MN[m]||m}</div></div>`;
    }).join('');
    return `<div class="card" style="margin-bottom:18px"><div class="ct">Implied additional briefs to land</div>
    <div class="cs">Forecast landing above current pipeline ÷ ${cur}${Math.round(clientAvgGp/1000)}k avg brief — i.e. new briefs the model expects to win &amp; deliver, month by month</div>
    <div style="display:flex;align-items:flex-end;gap:6px;height:60px;margin-top:8px">${cells}</div>
    <div class="pred-note">${tot<0.5?`This client's H1 forecast is fully covered by existing pipeline — no new briefs assumed.`:`~${tot.toFixed(0)} additional briefs implied across H1 (${(tot/6).toFixed(1)}/mo). Sense-check: does winning ~${Math.ceil(tot/6)} more ${client} brief(s) a month seem right?`}</div></div>`;
  })():''}
  ${chist?`<div class="sec">Historical performance <span style="font-weight:400;color:var(--stone);font-size:11px">· full opportunity history from Salesforce</span></div>
  <div class="kpis k4" style="margin-bottom:14px">
    <div class="kpi"><div class="kpi-l">Win rate (won/lost)</div><div class="kpi-v">${trueWR!==null?trueWR+'%':'—'}</div><div class="kpi-m">${chist.won} won / ${chist.lost} lost${chist.open?' · '+chist.open+' open':''}</div></div>
    <div class="kpi"><div class="kpi-l">Briefs created / month</div><div class="kpi-v">${briefsPerMo!==null?briefsPerMo.toFixed(1):'—'}</div><div class="kpi-m">avg over active months</div></div>
    <div class="kpi"><div class="kpi-l">Created → GP phasing</div><div class="kpi-v">${lagD!==null?(lagD<7?'same month':lagD+'d'):'—'}</div><div class="kpi-m">avg lag, won deals${lagMed!==null&&lagMed>=7?(' · median '+lagMed+'d'):''}</div></div>
    <div class="kpi"><div class="kpi-l">Total briefs</div><div class="kpi-v">${chist.won+chist.lost+chist.open}</div><div class="kpi-m">all-time opportunities</div></div>
  </div>
  ${briefsByFY?`<div class="cs" style="margin:-6px 0 16px">Briefs created by FY: ${Object.entries(briefsByFY).sort((a,b)=>a[0]-b[0]).map(e=>'<span style="font-family:var(--display);color:var(--ink)">'+String(e[0]).slice(2)+'/'+String(+e[0]+1).slice(2)+'</span>&nbsp;'+e[1]).join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</div>`:''}`:''}
  ${cseas?`<div class="card" style="margin-bottom:18px"><div class="ct">Seasonal delivery pattern</div><div class="cs">Average monthly GP by calendar month — shows when this client typically spends</div><div style="position:relative;height:150px"><canvas id="cl-seas"></canvas></div></div>`:''}
  ${cflags.length?`<div class="sec">Data quality &amp; WIP issues <span style="font-weight:400;color:var(--stone);font-size:11px">· ${cflags.length} flag${cflags.length>1?'s':''} on this client</span></div>
  <div class="tbl" style="margin-bottom:18px"><table>
    <thead><tr><th></th><th style="text-align:left">Opportunity</th><th style="text-align:left">Stage</th><th>GP</th><th style="text-align:left">Issue</th></tr></thead>
    <tbody>${cflags.map(f=>'<tr><td><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:'+(f.t==='error'?'var(--red)':'var(--amb)')+'"></span></td><td style="text-align:left;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(f.opp||'—')+'</td><td style="text-align:left"><span class="stg '+(STGCLS[f.stage]||'stg-br')+'">'+(f.stage||'—')+'</span></td><td>'+(f.gp?fmM(f.gp):'—')+'</td><td style="text-align:left;font-size:11px;color:var(--stone)">'+f.m+(f.tier==='high'?' <span class="tag" style="background:var(--red);color:#fff">high</span>':'')+'</td></tr>').join('')}</tbody></table></div>`:''}
  <div class="sec">Monthly detail</div>
  <div class="tbl"><table>
    <thead><tr><th>Month</th><th>Budget</th><th>Actuals / Pipeline</th><th>Predicted</th><th>vs Budget</th><th>Coverage</th></tr></thead>
    <tbody>
      ${monthRows.map(({mk,tv,pv,pred,cov,isP})=>`<tr class="${isP?'trail':''}"><td>${mn(mk)}${isP?'&nbsp;<span style="font-size:9px;color:var(--stone);font-family:var(--display)">actual</span>':''}</td><td>${tv?fmM(tv):'—'}</td><td>${pv?fmM(pv):'—'}</td><td>${isP?'—':`<span class="${pred>=tv?'pos':pred>=tv*0.9?'':'neg'}">${fmM(pred)}</span>`}</td><td>${tv?df(pv,tv,mkt):'—'}</td><td>${cov!==null?`<div class="cov-w">${fc(cov)}<div class="cov-b"><div class="cov-f" style="width:${Math.min(cov,1)*100}%;background:${cov>=1?'var(--grn)':cov>=0.75?'var(--amb)':'var(--red)'}"></div></div></div>`:'—'}</td></tr>`).join('')}
      ${h1t?`<tr class="est"><td>→ model estimate</td><td>${fmM(h1t)}</td><td>${fmM(h1p)}</td><td><span class="${predGap>=0?'pos':'neg'}">${fmM(h1pred)}</span></td><td>${df(h1pred,h1t,mkt)}</td><td>${fc(h1pred/h1t)}</td></tr>`:''}
      <tr class="tot"><td>H1 total</td><td>${h1t?fmM(h1t):'—'}</td><td>${fmM(h1p)}</td><td>${fmM(h1pred)}</td><td>${h1t?df(h1p,h1t,mkt):'—'}</td><td>${h1t?fc(h1p/h1t):'—'}</td></tr>
    </tbody></table>
    <div class="pred-note">Forecast = de-risked pipeline, topped up to the client's bottom-up model (cadence × win rate × avg GP, 24mo recency-weighted) where the model exceeds pipeline. Directional only.</div>
  </div>
  ${(opps.length||cw.length)?`<div class="sec">Pipeline — ${cw.length+opps.length} jobs</div>
  <div class="tbl" style="margin-bottom:18px"><table>
    <thead><tr><th style="text-align:left">Opportunity</th><th style="text-align:left">Stage</th><th>Prob</th><th style="text-align:left;font-weight:400">Dates</th>${NEAR.map(m=>`<th>${mn(m)}</th>`).join('')}<th>GP</th></tr></thead>
    <tbody>
      ${cw.length?`<tr class="pipe-sh"><td colspan="${4+NEAR.length+1}">CONFIRMED — CLOSED WON</td></tr>${cw.sort((a,b)=>b.gp-a.gp).map(o=>renderRow(o,true)).filter(Boolean).join('')}`:''}
      ${opps.length?`<tr class="pipe-sh"><td colspan="${4+NEAR.length+1}">OPEN PIPELINE</td></tr>${opps.sort((a,b)=>(STGORD[b.stage]||0)-(STGORD[a.stage]||0)||b.gp-a.gp).map(o=>renderRow(o,false)).filter(Boolean).join('')}`:''}
      <tr class="tot"><td style="font-family:var(--sans)" colspan="4">Total incl. closed won</td>${NEAR.map(mk=>{const ct2=cw.reduce((s,o)=>s+(o.phases?.[mk]||0),0),op2=opps.reduce((s,o)=>s+(o.phases?.[mk]||0),0);const tot=ct2+op2,tv2=(cd_t[mk]?.t||0)*1000,cov2=tv2?tot/tv2:null;const bar=cov2!==null?'<div class="cov-b" style="margin-top:3px"><div class="cov-f" style="width:'+Math.min(cov2,1)*100+'%;background:'+(cov2>=1?'var(--grn)':cov2>=0.75?'var(--amb)':'var(--red)')+'"></div></div>':'';return'<td>'+fmM(tot)+bar+'</td>';}).join('')}<td>${fmM([...cw,...opps].reduce((s,o)=>s+o.gp,0))}</td></tr>
    </tbody></table>
  </div>`:`<div class="empty">No pipeline data for ${client}</div>`}
</div>`;
  const co=copts(cur);
  charts.cl=new Chart(document.getElementById('cl-chart'),{type:'bar',data:{labels:cL,datasets:[
    {label:'Actuals',data:cA,backgroundColor:d?acCol+'.5)':'rgba(61,56,48,.35)',borderRadius:2,order:3},
    {label:'Pipeline',data:cP,backgroundColor:d?acCol+'.22)':'rgba(61,56,48,.14)',borderRadius:2,order:2},
    {label:'Target',data:cT,type:'line',borderColor:d?'rgba(194,59,46,.5)':'rgba(194,59,46,.4)',borderWidth:1.5,pointRadius:0,fill:false,borderDash:[4,3],tension:0,order:1},
    {label:'Predicted landing',data:cPred,type:'line',borderColor:d?'rgba(255,125,170,.95)':'rgba(255,125,170,.9)',backgroundColor:d?'rgba(255,125,170,.12)':'rgba(255,125,170,.1)',borderWidth:2,pointRadius:2.5,pointBackgroundColor:'rgba(255,125,170,1)',fill:true,tension:.3,order:0,spanGaps:true}
  ]},options:{...co,scales:{...co.scales,x:{...co.scales.x,ticks:{...co.scales.x.ticks,maxTicksLimit:14}}}}});
  if(cseas&&document.getElementById('cl-seas')){const sLab=[],sVal=[];for(let m=1;m<=12;m++){sLab.push(SEASMN[m]);sVal.push(cseas[String(m)]?Math.round(cseas[String(m)]/1000):0);}
    charts.clSeas=new Chart(document.getElementById('cl-seas'),{type:'bar',data:{labels:sLab,datasets:[{label:'Avg GP',data:sVal,backgroundColor:d?acCol+'.55)':'rgba(61,56,48,.4)',borderRadius:3}]},options:{...co,plugins:{...co.plugins,legend:{display:false}}}});}
}

/* ── DATA QUALITY (priority-ranked) ── */
function renderFlags(){
  const flags=mkt==='uk'?D.uk.flags.map(f=>({...f,_mkt:'UK',_cur:'£'})):mkt==='us'?D.us.flags.map(f=>({...f,_mkt:'US',_cur:'$'})):[...D.us.flags.map(f=>({...f,_mkt:'US',_cur:'$'})),...D.uk.flags.map(f=>({...f,_mkt:'UK',_cur:'£'}))];
  // Group view: flags from each market are pre-sorted; re-sort the merged list by score so priority holds across markets
  if(mkt==='grp')flags.sort((a,b)=>(b.score||0)-(a.score||0));
  const e=flags.filter(f=>f.t==='error'),w=flags.filter(f=>f.t==='warn');
  const top=(()=>{const cc={};flags.forEach(f=>{cc[f.client]=(cc[f.client]||0)+1;});return Object.entries(cc).sort((a,b)=>b[1]-a[1])[0]||['—',0];})();
  const mktLabel=mkt==='grp'?'Group (US + UK)':mkt==='us'?'United States':'United Kingdom';
  const showMkt=mkt==='grp';
  const tierDot=t=>{const c=t==='high'?'var(--red)':t==='med'?'var(--amb)':'var(--stone2)';return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${c};flex-shrink:0"></span>`;};
  const fmF=(gp,cur)=>{if(!gp)return'<span style="color:var(--stone2)">—</span>';const a=Math.abs(gp);return cur+(a>=1e6?(a/1e6).toFixed(1)+'m':a>=1e3?Math.round(a/1e3)+'k':a);};

  const fdt=d=>{if(!d)return '—';const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+d.slice(5,7)-1];return +d.slice(8,10)+' '+mo+' '+d.slice(2,4);};
  function rows(fl){
    return fl.map((f,i)=>`<tr>
      <td style="white-space:nowrap;text-align:center;font-family:var(--display);color:var(--stone);font-size:11px">${i+1}</td>
      <td style="text-align:center">${tierDot(f.tier)}</td>
      ${showMkt?`<td style="white-space:nowrap"><span class="badge ${f._mkt==='US'?'b':'g'}" style="font-size:9px">${f._mkt}</span></td>`:''}
      <td style="text-align:left"><span class="badge ${f.t==='error'?'r':'a'}" style="font-size:9px">${f.t==='error'?'error':'warn'}</span></td>
      <td style="white-space:nowrap">${f.client}</td>
      <td style="text-align:left;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--sans)">${f.opp}</td>
      <td style="text-align:left"><span class="stg ${STGCLS[f.stage]||'stg-br'}">${f.stage||'—'}</span></td>
      <td>${fmF(f.gp,f._cur||'£')}</td>
      <td style="white-space:nowrap;font-family:var(--display);font-size:11px;color:var(--stone)">${fdt(f.ps)}</td>
      <td style="white-space:nowrap;font-family:var(--display);font-size:11px;color:${f.pe&&f.pe<'2026-06-10'?'var(--red)':'var(--stone)'}">${fdt(f.pe)}</td>
      <td style="white-space:nowrap;font-family:var(--display);font-size:11px;color:${f.pr!=null&&f.pr<50?'var(--amb)':'var(--stone)'}">${f.pr!=null?f.pr+'%':'—'}</td>
      <td style="text-align:left;font-family:var(--sans);color:var(--stone);font-size:12px">${f.m}</td>
    </tr>`).join('');
  }

  const N=40;
  const mainEl = document.getElementById('main');
  if(!mainEl) return; mainEl.innerHTML=`
<div class="ph"><div><div class="ph-eye">${mktLabel}</div><div class="ph-title">Data quality</div><div class="ph-sub">Ranked by priority — highest-impact issues first</div></div></div>
<div class="body">
  ${(()=>{
    const mk=mkt==='grp'?null:mkt;
    const mkts=mk?[mk]:['us','uk'];
    const NEARm=D.NEAR_MO;
    let rows='';let allok=true;
    mkts.forEach(m=>{
      const dd=D[m];const pl=dd.pl;if(!pl)return;
      const cur=m==='us'?'$':'£';
      const toolPipe=NEARm.reduce((s,ym)=>s+(dd.pred_rows[ym]?.pv||0),0);
      const plPipe=pl.pipe_h1;
      const drift=plPipe?Math.abs(toolPipe-plPipe)/plPipe*100:0;
      const ok=drift<=5;if(!ok)allok=false;
      const fmt=v=>cur+(v/1e6).toFixed(2)+'m';
      rows+=`<tr><td>${m.toUpperCase()} H1 pipeline</td><td>${fmt(toolPipe)}</td><td>${fmt(plPipe)}</td><td class="${ok?'pos':'neg'}">${ok?'✓ ties':'⚠ '+drift.toFixed(0)+'% drift'}</td></tr>`;
      const toolPred=dd.h1_band?.exp||0;
      rows+=`<tr><td>${m.toUpperCase()} H1 predicted landing</td><td>${fmt(toolPred)}</td><td>${fmt(pl.budget_h1)} <span style="color:var(--stone);font-weight:300">budget</span></td><td class="${toolPred>=plPipe?'pos':''}">${toolPred>=plPipe?'above pipeline':'—'}</td></tr>`;
    });
    if(!rows)return '';
    return `<div class="sec">Reconciliation vs P&L Summary <span style="color:var(--stone);font-weight:300;font-size:11px">· auto-checked against finance source</span></div>
    <div class="tbl"><table><thead><tr><th>Figure</th><th>Co-Pilot</th><th>P&L Summary</th><th>Check</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="pred-note">${allok?'All pipeline figures tie to the P&L Summary within 5%. Numbers are reconciled to finance source — no manual cross-check needed.':'⚠ A figure has drifted from the P&L by more than 5% — worth a look. This usually means the opp tab and P&L are out of sync.'}</div></div>`;
  })()}

  <div class="kpis k4">
    <div class="kpi"><div class="kpi-l">Total flags</div><div class="kpi-v">${flags.length}</div><div class="kpi-m">across ${new Set(flags.map(f=>f.client)).size} clients</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:var(--red)"></div><div class="kpi-l">High priority</div><div class="kpi-v" style="color:var(--red)">${flags.filter(f=>f.tier==='high').length}</div><div class="kpi-m">large, advanced, overdue</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:var(--red)"></div><div class="kpi-l">Errors</div><div class="kpi-v" style="color:var(--red)">${e.length}</div><div class="kpi-m">Close dates passed, missing data</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:var(--amb)"></div><div class="kpi-l">Warnings</div><div class="kpi-v" style="color:var(--amb)">${w.length}</div><div class="kpi-m">Zero GP, unusual probabilities</div></div>
  </div>
  <div class="sec">Priority ranking</div>
  <div class="tbl">
    <div class="tbl-h" style="padding-bottom:12px"><div class="tbl-t">All issues, most important first</div><div class="tbl-n">Top ${Math.min(N,flags.length)} of ${flags.length} shown · ranked by GP value × stage × overdue × severity</div></div>
    <table>
      <thead><tr><th style="text-align:center">#</th><th style="text-align:center"></th>${showMkt?'<th>Mkt</th>':''}<th style="text-align:left">Type</th><th>Client</th><th style="text-align:left">Opportunity</th><th style="text-align:left">Stage</th><th>GP</th><th>Start</th><th>End</th><th>Prob</th><th style="text-align:left">Issue</th></tr></thead>
      <tbody>${rows(flags.slice(0,N))}</tbody>
    </table>
    ${flags.length>N?`<div class="fx-note">+${flags.length-N} lower-priority flags not shown · ${flags.filter(f=>f.tier==='low').length} are low-priority (small or early-stage)</div>`:''}
  </div>
  <div class="sec">How priority is scored</div>
  <div class="card" style="font-size:12px;color:var(--coal2);line-height:1.65;font-weight:300">
    Flags are ranked so the issues that most distort the numbers surface first — calibrated to what matters commercially:
    <div style="margin-top:10px;display:grid;gap:6px">
      <div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--red);margin-right:8px"></span><strong style="font-weight:500">GP value</strong> — a problem on a £200k deal matters far more than on a £2k one; scores scale with money at stake</div>
      <div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--amb);margin-right:8px"></span><strong style="font-weight:500">GP integrity</strong> — missing, negative, or unphased GP; a Committed deal with no GP is near-certain revenue invisible to the forecast</div>
      <div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--blue);margin-right:8px"></span><strong style="font-weight:500">Project window</strong> — elapsed at Committed is usually just paperwork (move to Closed Won); elapsed at Pitch/Brief means never committed and likely dead, so it escalates</div>
      <div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#7c3aed;margin-right:8px"></span><strong style="font-weight:500">Unusual patterns</strong> — deal size vs the client's typical month, project starting sooner than their norm, atypical run length, and work starting before the deal is committed</div>
      <div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--grn);margin-right:8px"></span><strong style="font-weight:500">Close date</strong> — deliberately low-weight: not commercially meaningful here, kept only as a trace signal</div>
    </div>
  </div>
  </div>
</div>`;
}

/* ── KPI DATABOOK (matches advisor sheet; live-derivable metrics only) ── */
function renderPortfolio(){
  const P=D.portfolio;
  const pkey=mkt==='grp'?'group':mkt;
  const data=P[pkey];
  const cur=mkt==='uk'?'£':mkt==='us'?'$':'£';
  const fmM=mkt==='uk'?fL:mkt==='us'?f$:fL;
  const c=data.current, ch=data.churn;
  const series=data.series||[];
  const labels=data.fy_labels||[];
  const growth=data.growth_series||[];
  const revs=data.rev_series||[];
  const mktLabel=mkt==='grp'?'Group (US + UK, USD→GBP)':mkt==='us'?'United States':'United Kingdom';
  const d=dk();
  const cohortHex=['#c8bfb3','#9e9487','#0e7490','#1e4fa8','#7c3aed','#1f7a4a'];
  const concRisk=c.top10_pct>=70?'r':c.top10_pct>=55?'a':'g';
  const churnRisk=ch.churn>=45?'r':ch.churn>=30?'a':'g';
  const latestGrowth=growth[growth.length-1];

  // 3-year CAGR from first→last in the series (derivable from revenue)
  let cagr=null;
  if(revs.length>=2 && revs[0]>0){
    const yrs=revs.length-1;
    cagr=Math.round((Math.pow(revs[revs.length-1]/revs[0],1/yrs)-1)*100);
  }

  // KPI row helper: label, current value, optional trend sparkline values
  const trendRow=(label, vals, fmt, note)=>{
    const cells=vals.map((v,i)=>`<td>${v==null?'—':fmt(v)}</td>`).join('');
    return `<tr><td>${label}${note?` <span style="color:var(--stone);font-weight:300;font-size:11px">${note}</span>`:''}</td>${cells}</tr>`;
  };
  const pct=v=>v==null?'—':v+'%';

  const mainEl = document.getElementById('main');
  if(!mainEl) return; mainEl.innerHTML=`
<div class="ph"><div><div class="ph-eye">${mktLabel}</div><div class="ph-title">KPI databook</div><div class="ph-sub">${P.basis}</div></div><button class="wk-btn on" onclick="showKpix()" style="align-self:center">Review trends in KPI explorer →</button></div>
<div class="body">

  <div class="kpis k4">
    <div class="kpi"><div class="kpi-acc" style="background:#7c3aed"></div><div class="kpi-l">Net revenue / client</div><div class="kpi-v">${fmM(c.per_client)}</div><div class="kpi-m">${c.n} clients · ${fmM(c.total)} total</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:${latestGrowth>=0?'var(--grn)':'var(--red)'}"></div><div class="kpi-l">Revenue growth (YoY)</div><div class="kpi-v">${latestGrowth==null?'—':(latestGrowth>=0?'+':'')+latestGrowth+'%'}</div><div class="kpi-m">${cagr!=null?cagr+'% 3-yr CAGR':''}</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:${concRisk==='r'?'var(--red)':concRisk==='a'?'var(--amb)':'var(--grn)'}"></div><div class="kpi-l">Top 10 concentration</div><div class="kpi-v">${c.top10_pct}%</div><div class="kpi-m">top 20 = ${c.top20_pct}%</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:${churnRisk==='r'?'var(--red)':churnRisk==='a'?'var(--amb)':'var(--grn)'}"></div><div class="kpi-l">Client churn rate</div><div class="kpi-v">${ch.churn}%</div><div class="kpi-m">${ch.retention}% retention</div></div>
  </div>

  <div class="kpis k4" style="margin-top:12px">
    <div class="kpi"><div class="kpi-acc" style="background:#0e7490"></div><div class="kpi-l">Headcount</div><div class="kpi-v">${data.headcount!=null?data.headcount+' FTE':'—'}</div><div class="kpi-m">current, ${mktLabel.split(' ')[0]}</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:#1f7a4a"></div><div class="kpi-l">Revenue / head</div><div class="kpi-v">${data.rev_per_head?fmM(data.rev_per_head):'—'}</div><div class="kpi-m">FY25/26 GP ÷ FTE</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:#7c3aed"></div><div class="kpi-l">Clients / head</div><div class="kpi-v">${data.headcount?(c.n/data.headcount).toFixed(2):'—'}</div><div class="kpi-m">${c.n} clients ÷ ${data.headcount} FTE</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:var(--stone)"></div><div class="kpi-l">3-yr CAGR</div><div class="kpi-v">${cagr!=null?cagr+'%':'—'}</div><div class="kpi-m">revenue, ${labels[0]}→${labels[labels.length-1]}</div></div>
  </div>

  <div class="sec">Financial &amp; client KPIs — by financial year</div>
  <div class="tbl"><table>
    <thead><tr><th>Metric</th>${labels.map(l=>`<th>${l}</th>`).join('')}</tr></thead>
    <tbody>
      ${trendRow('<a onclick="kpixOpenWith(\'booked\')" style="cursor:pointer;border-bottom:1px dotted var(--stone)">Net revenue</a>', revs, v=>fmM(v))}
      ${trendRow('Net revenue growth', growth, pct, 'YoY')}
      ${trendRow('<a onclick="kpixOpenWith(\'clients_active\')" style="cursor:pointer;border-bottom:1px dotted var(--stone)">No. of clients</a>', series.map(s=>s.n), v=>v)}
      ${trendRow('Net revenue / client', series.map(s=>s.per_client), v=>fmM(v))}
      ${trendRow('% from top 10', series.map(s=>s.top10_pct), pct)}
      ${trendRow('% from top 20', series.map(s=>s.top20_pct), pct)}
    </tbody></table>
    <div class="fx-note">3-year CAGR: ${cagr!=null?cagr+'%':'—'} · ${mkt==='grp'?'UK + US converted at month-end FX per FY':'Single-market'} · Total GP incl. TEs basis</div>
    <div class="fx-note" style="margin-top:6px;line-height:1.5"><b>Methodology:</b> figures recomputed each refresh from live Salesforce opportunities, phased on the CFO's 30/30/20/20 basis (RTB recognised immediately; closed-won at full value, open pipeline de-risked at SF probability; 47% UK / 40% US default margin). <b>Reconciliation to signed-off P&amp;L (FY25/26 Total GP):</b> UK £9.99m (0.0%), Group £18.42m (+0.8%), US $11.32m (+1.7%); all FYs tie within ~1-2%. Residual is sub-monthly phasing of long cross-year deals, held as a known variance rather than overfitted. Forward FY26/27 (Unknown/Forecast layer) intentionally excluded.</div>
  </div>

  <div class="sec">Client cohort mix — ${P.fy_label}</div>
  <div class="tbl"><table>
    <thead><tr><th>Revenue band</th><th>Clients</th><th>Revenue</th><th>% of revenue</th><th style="width:34%">Share</th></tr></thead>
    <tbody>
      ${c.cohorts.map((co,i)=>`<tr>
        <td><span style="display:inline-flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:2px;background:${cohortHex[i]};flex-shrink:0"></span>${co.band}</span></td>
        <td>${co.count}</td><td>${fmM(co.rev)}</td><td>${co.rev_pct}%</td>
        <td><div class="cov-b" style="width:100%;height:8px"><div class="cov-f" style="width:${co.rev_pct}%;background:${cohortHex[i]}"></div></div></td>
      </tr>`).join('')}
      <tr class="tot"><td>Total</td><td>${c.n}</td><td>${fmM(c.total)}</td><td>100%</td><td></td></tr>
    </tbody></table>
  </div>

  <div class="cards c2">
    <div class="card">
      <div class="ct">Concentration trend</div><div class="cs">Top 10 &amp; top 20 client share — rising = higher dependency risk</div>
      <div style="position:relative;height:200px"><canvas id="pf-conc"></canvas></div>
    </div>
    <div class="card">
      <div class="ct">Retention, churn &amp; recurring — ${P.fy_label}</div><div class="cs">vs prior year</div>
      <div style="display:grid;gap:13px;margin-top:8px">
        <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--coal)">Client retention</span><span style="font-family:var(--display);color:var(--grn)">${ch.retention}%</span></div><div class="cov-b" style="width:100%;height:8px"><div class="cov-f" style="width:${ch.retention}%;background:var(--grn)"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--coal)">Client churn</span><span style="font-family:var(--display);color:var(--red)">${ch.churn}%</span></div><div class="cov-b" style="width:100%;height:8px"><div class="cov-f" style="width:${ch.churn}%;background:var(--red)"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--coal)">% recurring revenue</span><span style="font-family:var(--display);color:var(--blue)">${ch.recurring_pct}%</span></div><div class="cov-b" style="width:100%;height:8px"><div class="cov-f" style="width:${ch.recurring_pct}%;background:var(--blue)"></div></div></div>
        <div style="font-size:11px;color:var(--stone);font-weight:300;border-top:1px solid var(--bdr);padding-top:10px;margin-top:2px">
          ${ch.new_n} new clients won, ${ch.churned_n} churned in ${P.fy_label} (${fmM(ch.churned_rev)} prior-year revenue lost). ${ch.recurring_n} returning clients generated ${fmM(ch.recurring_rev)} (${ch.recurring_pct}% of revenue).
        </div>
      </div>
    </div>
  </div>

  <div class="sec">What's shown &amp; what isn't</div>
  <div class="card" style="font-size:12px;color:var(--coal2);line-height:1.65;font-weight:300">
    These mirror the M&amp;A KPI databook, computed live from Salesforce per market. Because they're derived from booked revenue, the basis is Total GP incl. TEs (the databook uses net revenue, so absolute figures differ slightly; shape and trends align).
    <div style="margin-top:10px;color:var(--stone)">Databook KPIs that depend on finance/HR systems — adjusted EBITDA margin &amp; per head, net revenue per head, staff-cost ratios, profitability per client, project counts, scoping accuracy and employee turnover — aren't derivable from pipeline data and are intentionally omitted here; they live in the finance pack.</div>
  </div>
</div>`;

  const co=copts('');
  charts.pf=new Chart(document.getElementById('pf-conc'),{type:'line',data:{labels,datasets:[
    {label:'Top 10 %',data:series.map(s=>s.top10_pct),borderColor:d?'#a78bf5':'#7c3aed',backgroundColor:'transparent',borderWidth:2,pointRadius:3,pointBackgroundColor:d?'#a78bf5':'#7c3aed',tension:0.25},
    {label:'Top 20 %',data:series.map(s=>s.top20_pct),borderColor:d?'#6b9fe8':'#1e4fa8',backgroundColor:'transparent',borderWidth:2,pointRadius:3,pointBackgroundColor:d?'#6b9fe8':'#1e4fa8',borderDash:[4,3],tension:0.25}
  ]},options:{...co,plugins:{...co.plugins,legend:{display:true,position:'bottom',labels:{font:{size:10,family:'"IBM Plex Sans"'},color:'#9e9487',boxWidth:12,padding:12}},tooltip:{...co.plugins.tooltip,callbacks:{label:c2=>` ${c2.dataset.label}: ${c2.raw}%`}}},scales:{...co.scales,y:{...co.scales.y,ticks:{...co.scales.y.ticks,callback:v=>v+'%'},suggestedMax:100,suggestedMin:0}}}});
}


/* ═══════════════════════════════════════════════════════════
   WEEKLY UPDATE MODULE — snapshot, diff, and note generation
   Mirrors James Brazier's UK/US pipeline update emails.
   ═══════════════════════════════════════════════════════════ */

// Materiality threshold for showing an opp in the "what changed" note
const MATERIALITY = {us: 20000, uk: 20000};  // de-risked GP change for the FY

// Build a flat opp map keyed by unique opp name → {gp, stage, client, gp_full}
function snapshotOpps(market){
  const M = market==='us'?D.us:D.uk;
  const snap = {};
  for(const [client, opps] of Object.entries(M.opps||{})){
    for(const o of opps){
      snap[o.name] = {gp:o.gp||0, gp_full:o.gp_full||0, stage:o.stage||'', client, prob:o.prob||0};
    }
  }
  // include closed-won so we can detect open→won transitions
  for(const [client, deals] of Object.entries(M.cw_deals||{})){
    for(const o of deals){
      if(!snap[o.name]) snap[o.name] = {gp:o.gp||0, gp_full:o.gp_full||0, stage:'Closed Won', client, prob:100};
    }
  }
  return snap;
}


// Persist this week's snapshot AND append a dated entry to the weekly log
async function saveWeeklySnapshot(){
  const stamp = new Date().toISOString().slice(0,10);
  // 1. Compute diffs against the existing "current" (which becomes last week) BEFORE overwriting
  const diffs = {};
  for(const mkt of ['us','uk']){
    diffs[mkt] = await computeWeeklyDiff(mkt);
  }
  // 2. Shift current → prev, write new current
  for(const mkt of ['us','uk']){
    try{
      let prev=null;
      try{const r=await window.storage.get('snap_'+mkt+'_current'); prev=r?r.value:null;}catch(e){}
      if(prev){ await window.storage.set('snap_'+mkt+'_prev', prev, false); }
      await window.storage.set('snap_'+mkt+'_current', JSON.stringify({stamp, opps:snapshotOpps(mkt)}), false);
    }catch(e){ console.error('snapshot save failed', mkt, e); }
  }
  // 3. Append a compact log entry per market so history is queryable later
  for(const mkt of ['us','uk']){
    const M = mkt==='us'?D.us:D.uk; const ag=M.targets;
    const h1t=NEAR.reduce((s,m)=>s+(ag[m]?.t||0)*1000,0);
    const h1p=NEAR.reduce((s,m)=>s+(ag[m]?.p||0)*1000,0);
    const d = diffs[mkt];
    const entry = {
      stamp, mkt,
      h1_target: Math.round(h1t), h1_pipeline: Math.round(h1p),
      pct_target: h1t?Math.round(h1p/h1t*100):0,
      net_change: d.net_change,
      n_new: d.new_opps.length, n_lost: d.closed_lost.length,
      n_up: d.increases.length, n_down: d.decreases.length, n_won: d.won.length,
      // store the headline movers so the log is meaningful on its own
      new_opps: d.new_opps.slice(0,8), closed_lost: d.closed_lost.slice(0,8),
      increases: d.increases.slice(0,8), decreases: d.decreases.slice(0,8),
    };
    try{
      let log=[];
      try{const r=await window.storage.get('weekly_log_'+mkt); log=r?JSON.parse(r.value):[];}catch(e){}
      // replace same-day entry if re-run, else append
      log = log.filter(e=>e.stamp!==stamp);
      log.push(entry);
      log.sort((a,b)=>a.stamp<b.stamp?1:-1); // newest first
      if(log.length>104) log=log.slice(0,104); // keep ~2 years of weeks
      await window.storage.set('weekly_log_'+mkt, JSON.stringify(log), false);
    }catch(e){ console.error('log append failed', mkt, e); }
  }
  return stamp;
}

async function getWeeklyLog(mkt){
  try{const r=await window.storage.get('weekly_log_'+mkt); return r?JSON.parse(r.value):[];}catch(e){ return []; }
}

// Compute the diff between last week and this week for a market
async function computeWeeklyDiff(mkt){
  let prev=null, curr=null;
  try{const r=await window.storage.get('snap_'+mkt+'_prev'); prev=r?JSON.parse(r.value):null;}catch(e){}
  try{const r=await window.storage.get('snap_'+mkt+'_current'); curr=r?JSON.parse(r.value):null;}catch(e){}
  // Fall back: if no stored current, snapshot live data now as "current"
  const live = {stamp:new Date().toISOString().slice(0,10), opps:snapshotOpps(mkt)};
  if(!curr) curr = live;
  const thr = MATERIALITY[mkt];

  const result = {
    mkt, prev_stamp: prev?prev.stamp:null, curr_stamp: curr.stamp,
    net_change: 0,
    new_opps: [], closed_lost: [], won: [], increases: [], decreases: [],
    has_prev: !!prev,
  };

  // Baseline week: no prior snapshot — report no changes (else every opp counts as 'new')
  if(!prev){ return result; }

  const prevOpps = prev.opps;
  const currOpps = curr.opps;

  // New opps + increases/decreases + won
  for(const [name, c] of Object.entries(currOpps)){
    const p = prevOpps[name];
    if(!p){
      // brand new this week
      if(c.stage!=='Closed Won' && Math.abs(c.gp)>=thr){
        result.new_opps.push({name, client:c.client, gp:c.gp, stage:c.stage});
        result.net_change += c.gp;
      }
    } else {
      const delta = c.gp - p.gp;
      // won transition
      if(c.stage==='Closed Won' && p.stage!=='Closed Won'){
        result.won.push({name, client:c.client, gp:c.gp, from:p.stage});
      }
      if(Math.abs(delta)>=thr){
        if(delta>0) result.increases.push({name, client:c.client, delta, gp:c.gp, from:p.stage, to:c.stage});
        else result.decreases.push({name, client:c.client, delta, gp:c.gp, from:p.stage, to:c.stage});
        result.net_change += delta;
      }
    }
  }
  // Closed/lost: in prev, gone from current (and wasn't won)
  for(const [name, p] of Object.entries(prevOpps)){
    if(!currOpps[name] && p.stage!=='Closed Won'){
      if(Math.abs(p.gp)>=thr){
        result.closed_lost.push({name, client:p.client, gp:-p.gp, stage:p.stage});
        result.net_change -= p.gp;
      }
    }
  }
  // sort each list by magnitude
  result.new_opps.sort((a,b)=>b.gp-a.gp);
  result.closed_lost.sort((a,b)=>a.gp-b.gp);
  result.increases.sort((a,b)=>b.delta-a.delta);
  result.decreases.sort((a,b)=>a.delta-b.delta);
  return result;
}


/* ── Recipient lists (match James's emails) ── */
const RECIPIENTS = {
  uk: ['churrell@billiondollarboy.com','thomas@billiondollarboy.com','sramsey@billiondollarboy.com','kmorrow@billiondollarboy.com','okrispin@billiondollarboy.com','hshields@billiondollarboy.com','leaton@billiondollarboy.com','ed@billiondollarboy.com','gwallace@billiondollarboy.com','sjarvis@billiondollarboy.com','jsilverstone@billiondollarboy.com','owhite@billiondollarboy.com','lhernando@billiondollarboy.com'],
  us: ['kwhann@billiondollarboy.com','erasmussen@billiondollarboy.com','lturek@billiondollarboy.com','aahern@billiondollarboy.com','hbent@billiondollarboy.com','kmazile@billiondollarboy.com','leaton@billiondollarboy.com','thomas@billiondollarboy.com','psouthey@billiondollarboy.com','sramsey@billiondollarboy.com','bdoyle@billiondollarboy.com'],
};

// Coverage gaps & at-risk groups (hubs/AMs below coverage threshold)
function coverageGaps(mkt){
  const M = mkt==='us'?D.us:D.uk;
  const groups = mkt==='us'?M.hubs:M.ams;
  const oc = M.owner_clients, tf = M.targets_full;
  const gaps = [];
  for(const [name, gd] of Object.entries(groups||{})){
    const ht=(gd.h1t||0)*1000, hp=(gd.h1p||0)*1000;
    if(ht>0){
      const cov = hp/ht;
      if(cov < 0.6) gaps.push({name, cov, gap: ht-hp, ht, hp});
    }
  }
  gaps.sort((a,b)=>a.cov-b.cov);
  return gaps;
}

// Top data-quality issues (already scored & sorted in D)
function topDataQuality(mkt, n=5){
  const flags = (mkt==='us'?D.us.flags:D.uk.flags)||[];
  return flags.filter(f=>f.tier==='high').slice(0,n);
}

// Format a GP value for the note
function noteFmt(v, mkt){
  const cur = mkt==='uk'?'£':'$';
  const a = Math.abs(Math.round(v));
  const s = v<0?'-':'';
  if(a>=1000) return s+cur+a.toLocaleString();
  return s+cur+a;
}

// Build the plain-text weekly note for one market (James's structure + ranked key items)
function buildNoteText(diff, mkt){
  const M = mkt==='us'?D.us:D.uk;
  const ag = M.targets, pr = M.pred_rows;
  const NEARm = D.NEAR_MO;
  const h1t = NEARm.reduce((s,m)=>s+(ag[m]?.t||0)*1000,0);
  const h1p = NEARm.reduce((s,m)=>s+(ag[m]?.p||0)*1000,0);
  const cur = mkt==='uk'?'£':'$';
  const pctTarget = h1t?Math.round(h1p/h1t*100):0;
  const name = mkt==='uk'?'UK':'US';
  const dateStr = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const sinceStr = diff.prev_stamp?new Date(diff.prev_stamp).toLocaleDateString('en-GB',{day:'numeric',month:'long'}):'last update';

  let t = `BDB ${name} Pipeline Update — ${dateStr}\n\n`;
  t += `Hi all\n\n`;
  t += `PROGRESS AGAINST TARGETS\n`;
  t += `H1 target achieved: ${pctTarget}% (${cur}${Math.round(h1p/1000)}k of ${cur}${Math.round(h1t/1000)}k)\n\n`;

  // ── KEY ITEMS TO PAY ATTENTION TO (ranked) ──
  t += `KEY ITEMS THIS WEEK\n`;
  let ki = 1;
  // 1. Pipeline movements
  if(diff.net_change!==0 || diff.new_opps.length || diff.closed_lost.length){
    t += `${ki++}. Pipeline moved ${diff.net_change>=0?'+':''}${noteFmt(diff.net_change,mkt)} de-risked GP since ${sinceStr}`;
    if(diff.won.length) t += `; ${diff.won.length} opp${diff.won.length>1?'s':''} won`;
    t += `.\n`;
  }
  // 2. Coverage gaps / at-risk
  const gaps = coverageGaps(mkt);
  if(gaps.length){
    const g = gaps[0];
    t += `${ki++}. Coverage risk: ${g.name} at ${Math.round(g.cov*100)}% (${noteFmt(g.gap,mkt)} below target)`;
    if(gaps.length>1) t += `; ${gaps.length-1} other group${gaps.length-1>1?'s':''} under 60%`;
    t += `.\n`;
  }
  // 3. Data quality
  const dq = topDataQuality(mkt);
  if(dq.length){
    t += `${ki++}. ${dq.length} high-priority data issue${dq.length>1?'s':''} to fix — incl. ${dq[0].client} "${dq[0].opp}" (${dq[0].m}).\n`;
  }
  t += `\n`;

  t += `PIPELINE CHANGES SINCE ${sinceStr.toUpperCase()}\n`;
  t += `All numbers are de-risked Gross Profit. Only showing opportunities with greater than c. ${cur}20k de-risked GP change for this FY in total.\n\n`;
  t += `Net pipeline change: ${diff.net_change>=0?'+':''}${noteFmt(diff.net_change,mkt)}\n\n`;

  const section = (title, arr, fmt) => {
    t += `${title}\n`;
    if(!arr.length){ t += `N/A\n\n`; return; }
    for(const o of arr){ t += `  ${fmt(o)}\n`; }
    t += `\n`;
  };
  section('NEW OPPS ADDED', diff.new_opps, o=>`${o.client} — ${o.name}: ${noteFmt(o.gp,mkt)}`);
  section('OPPS CLOSED LOST', diff.closed_lost, o=>`${o.client} — ${o.name}: ${noteFmt(o.gp,mkt)}`);
  section('EXISTING OPPORTUNITY CHANGES — INCREASES', diff.increases, o=>`${o.client} — ${o.name}: ${o.delta>=0?'+':''}${noteFmt(o.delta,mkt)}${o.from!==o.to?` (${o.from}→${o.to})`:''}`);
  section('EXISTING OPPORTUNITY CHANGES — DECREASES', diff.decreases, o=>`${o.client} — ${o.name}: ${noteFmt(o.delta,mkt)}${o.from!==o.to?` (${o.from}→${o.to})`:''}`);

  if(!diff.has_prev){
    t += `(No prior snapshot found — this is the baseline week. Change sections will populate from next week.)\n\n`;
  }
  t += `Thanks\n`;
  return t;
}


/* ── WEEKLY VIEW — snapshot, current changes, and running log ── */
async function renderWeekly(){
  const mainEl = document.getElementById('main');
  if(!mainEl) return; mainEl.innerHTML = `<div class="ph"><div><div class="ph-eye">Weekly update</div><div class="ph-title">What changed this week</div><div class="ph-sub">Snapshot diff vs last week · running history log</div></div></div><div class="body"><div class="empty">Computing week-over-week changes…</div></div>`;

  const usDiff = await computeWeeklyDiff('us');
  const ukDiff = await computeWeeklyDiff('uk');
  const usLog = await getWeeklyLog('us');
  const ukLog = await getWeeklyLog('uk');

  const stampStr = usDiff.curr_stamp || new Date().toISOString().slice(0,10);
  const prevStr = usDiff.prev_stamp;

  // Compact "this week" change card per market (no draft buttons — sending handled separately)
  const changeCard = (diff, mkt) => {
    const name = mkt==='uk'?'United Kingdom':'United States';
    const col = mkt==='uk'?'var(--col-uk)':'var(--col-us)';
    const nc = diff.net_change;
    const section = (title, arr, fmt) => {
      if(!arr.length) return `<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--stone);margin-bottom:4px">${title}</div><div style="font-size:12px;color:var(--stone2);font-style:italic">None above threshold</div></div>`;
      return `<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--stone);margin-bottom:4px">${title} · ${arr.length}</div>${arr.map(o=>`<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:3px 0;border-bottom:1px solid var(--bdr2)"><span style="color:var(--coal2)">${o.client} — ${o.name}</span><span style="font-family:var(--display);white-space:nowrap;color:${fmt(o)>=0?'var(--grn)':'var(--red)'}">${noteFmt(fmt(o),mkt)}</span></div>`).join('')}</div>`;
    };
    return `<div class="card" style="margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div><div class="ct" style="display:flex;align-items:center;gap:9px"><span style="width:9px;height:9px;border-radius:50%;background:${col}"></span>${name}</div>
        <div class="cs">Net pipeline change since ${prevStr||'baseline'}</div></div>
        <div style="font-family:var(--display);font-size:20px;color:${nc>=0?'var(--grn)':'var(--red)'};font-weight:500">${nc>=0?'+':''}${noteFmt(nc,mkt)}</div>
      </div>
      ${section('New opps added', diff.new_opps, o=>o.gp)}
      ${section('Opps closed / lost', diff.closed_lost, o=>o.gp)}
      ${section('Existing — increases', diff.increases, o=>o.delta)}
      ${section('Existing — decreases', diff.decreases, o=>o.delta)}
      ${!diff.has_prev?`<div style="font-size:11px;color:var(--stone);font-style:italic;border-top:1px solid var(--bdr);padding-top:8px;margin-top:4px">Baseline week — change sections populate from next snapshot.</div>`:''}
    </div>`;
  };

  // Running history log table per market
  const logTable = (log, mkt) => {
    if(!log.length) return `<div class="empty">No snapshots logged yet. Click "Take snapshot now" to start the history.</div>`;
    const cur = mkt==='uk'?'£':'$';
    return `<div class="tbl"><table>
      <thead><tr><th>Week</th><th>Target %</th><th>Pipeline</th><th>Net change</th><th>New</th><th>Lost</th><th>Up</th><th>Down</th><th>Won</th></tr></thead>
      <tbody>${log.map(e=>`<tr>
        <td>${new Date(e.stamp).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}</td>
        <td>${e.pct_target}%</td>
        <td>${noteFmt(e.h1_pipeline,mkt)}</td>
        <td><span class="${e.net_change>=0?'pos':'neg'}">${e.net_change>=0?'+':''}${noteFmt(e.net_change,mkt)}</span></td>
        <td>${e.n_new||0}</td><td>${e.n_lost||0}</td><td>${e.n_up||0}</td><td>${e.n_down||0}</td><td>${e.n_won||0}</td>
      </tr>`).join('')}</tbody>
    </table>${log.length>1?`<div class="pred-note">Each row is a weekly snapshot. Pipeline % and net change let you track momentum week on week.</div>`:''}</div>`;
  };

  if(!mainEl) return; mainEl.innerHTML = `
<div class="ph"><div><div class="ph-eye">Weekly update</div><div class="ph-title">What changed this week</div><div class="ph-sub">Snapshot ${stampStr}${prevStr?` vs ${prevStr}`:' · baseline week'} · ${usLog.length} week${usLog.length===1?'':'s'} logged</div></div>
<div class="ph-r"><button onclick="runWeeklySnapshot()" style="font-family:var(--sans);font-size:12px;font-weight:500;padding:8px 16px;border-radius:7px;border:1px solid var(--col-uk);background:var(--col-uk);color:#fff;cursor:pointer">⟳ Take snapshot now</button></div></div>
<div class="body">
  <div class="kpis k4" style="margin-bottom:20px">
    <div class="kpi"><div class="kpi-acc" style="background:var(--col-us)"></div><div class="kpi-l">US net change</div><div class="kpi-v" style="color:${usDiff.net_change>=0?'var(--grn)':'var(--red)'}">${usDiff.net_change>=0?'+':''}${noteFmt(usDiff.net_change,'us')}</div><div class="kpi-m">${usDiff.new_opps.length} new · ${usDiff.closed_lost.length} lost</div></div>
    <div class="kpi"><div class="kpi-acc" style="background:var(--col-uk)"></div><div class="kpi-l">UK net change</div><div class="kpi-v" style="color:${ukDiff.net_change>=0?'var(--grn)':'var(--red)'}">${ukDiff.net_change>=0?'+':''}${noteFmt(ukDiff.net_change,'uk')}</div><div class="kpi-m">${ukDiff.new_opps.length} new · ${ukDiff.closed_lost.length} lost</div></div>
    <div class="kpi"><div class="kpi-l">Snapshot status</div><div class="kpi-v" style="font-size:15px;letter-spacing:0">${prevStr?'Comparing':'Baseline'}</div><div class="kpi-m">${prevStr?`vs ${prevStr}`:'first run'}</div></div>
    <div class="kpi"><div class="kpi-l">History</div><div class="kpi-v">${usLog.length}</div><div class="kpi-m">week${usLog.length===1?'':'s'} logged</div></div>
  </div>

  <div class="sec">This week's changes</div>
  ${changeCard(usDiff, 'us')}
  ${changeCard(ukDiff, 'uk')}

  <div class="sec">Weekly history — United States</div>
  ${logTable(usLog, 'us')}
  <div class="sec">Weekly history — United Kingdom</div>
  ${logTable(ukLog, 'uk')}

  <div class="sec">How this works</div>
  <div class="card" style="font-size:12px;color:var(--coal2);line-height:1.65;font-weight:300">
    Each week, click <strong style="font-weight:500">Take snapshot now</strong>. The tool diffs the new pipeline against last week's snapshot (showing only changes above ${'\u00b1'}$20k/£20k de-risked GP) and appends a dated row to the history log so you can track momentum over time. The snapshots and log persist across sessions. Drafting the email and Slack notes from this data is handled separately, outside the tool.
  </div>
</div>`;
}

async function runWeeklySnapshot(){
  await saveWeeklySnapshot();
  renderWeekly();
}


window.switchMarket = switchMarket;
  window.showGroup = showGroup;
  window.showClient = showClient;
  window.runWeeklySnapshot = runWeeklySnapshot;
  window.kpixToggle = kpixToggle;
  window.kpixPreset = kpixPreset;
  window.kpixGran = kpixGran;
  window.kpixFcast = kpixFcast;
  window.kpixTrendT = kpixTrendT;
  window.kpixGuideT = kpixGuideT;
  window.kpixAnnualT = kpixAnnualT;
  window.kpixOpenWith = kpixOpenWith;
  window.companionT = companionT;
  window.compFocus = compFocus;
  window.showKpix = showKpix;

buildSidebar();
switchMarket('grp');

    function openClientKpix(clientName) {
      KPIX.client = (!clientName || clientName.toLowerCase() === 'all') ? '' : clientName;
      if (!KPIX.client) {
        mkt = 'grp';
      } else {
        const inUS = Object.values(D.us.owner_clients || {}).flat().includes(KPIX.client);
        mkt = inUS ? 'us' : 'uk';
      }
      showKpix();
    }

    return {
        __sortVal,
    __sortTable,
    __initSort,
    dc,
    getRr,
    switchMarket,
    buildSidebar,
    showOverview,
    showGroup,
    showClient,
    showFlags,
    showKpix,
    openClientKpix,
    kpixToggle,
    kpixPreset,
    kpixFcast,
    kpixGran,
    kpixTrendT,
    kpixBucket,
    kpixCustom,
    kpixScopeMkt,
    kpixScopeHub,
    kpixScopeClient,
    kpixFmt,
    kpixMn,
    kpixDn,
    kpixWindow,
    kpixDaily,
    kpixAgg,
    kpixGuideT,
    __pct,
    kpixCommentary,
    kpixAnnualT,
    kpixAnnual,
    drawConc,
    renderKpix,
    drawKpix,
    kpixOpenWith,
    showPortfolio,
    showWeekly,
    fyQ,
    qFromRows,
    qFromClients,
    qScope,
    qHub,
    qClientQ,
    qCard,
    qLY,
    qRow,
    renderGroup,
    renderAgency,
    renderGroupView,
    companionT,
    companionClientNotes,
    companionAgencyNotes,
    __initComp,
    compRerender,
    compFocus,
    compMV,
    compCtx,
    compCardExplainScoped,
    companionGroupNotes,
    companionHubNotes,
    compCardTitle,
    compCardExplain,
    companionPanel,
    renderClient,
    renderFlags,
    renderPortfolio,
    snapshotOpps,
    coverageGaps,
    topDataQuality,
    noteFmt,
    buildNoteText,
    charts,
    KPIX,
    KPIX_GUIDE,
    KPIX_ANNUAL,
    COMPANION,
    COMP_FOCUS,
    NEAR,
    ALL,
    FX,
    US_HEX,
    UK_AM_HEX,
    fL,
    f$,
    fc,
    df,
    mn,
    dk,
    isElapsed,
    renderWeekly
    };
}
