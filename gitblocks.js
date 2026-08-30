/* gitblocks — a tiny engine for animated, isometric git walkthroughs.
   Classic script (works from file:// and any static host). Each page loads
   this plus one vizzes/<name>.js that sets window.VIZ, and the engine boots
   on DOMContentLoaded. */
(function(){
'use strict';

/* ================= BLOCK PALETTE (redstone-university course standard) ================= */
/* blocks render in fixed colors on both themes, like the course figures */
const INK='#30231E', PAPER_B='#F5F1EA',
      WIRE='#611D1D', LIVE='#FF463A', REDF='#D92F1F', STICK='#8A6740', MUTED='#8B8378';
const FAM={paper:'#F5F1EA', blue:'#A8C4D6', rose:'#E4B0AB', sage:'#AECF9C', amber:'#F2D489', peach:'#F0BD94', red:'#D92F1F'};
const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mixhex=(a,b,t)=>{const A=hx(a),B=hx(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');};
const shade=c=>({t:mixhex(c,'#ffffff',.30),l:mixhex(c,'#000000',.06),r:mixhex(c,'#000000',.16),d:mixhex(c,'#000000',.28)});

/* every animation in the series; `on` is decided per page from VIZ.meta.name */
const SERIES=[
  {group:'start here', name:'basics',     file:'basics.html',     fam:'paper', doc:'Commits & Branches'},
  {group:'start here', name:'playground', label:'sandbox', file:'playground.html', fam:'red',   doc:'The Sandbox'},
  {group:'rewriting', name:'rebase',             file:'rebase.html',             fam:'rose',  doc:'Rebase, Replayed'},
  {group:'rewriting', name:'interactive-rebase', file:'interactive-rebase.html', fam:'rose',  doc:'Interactive Rebase, Tidied'},
  {group:'rewriting', name:'rebase-onto',        file:'rebase-onto.html',        fam:'rose',  doc:'Rebase --onto, Transplanted'},
  {group:'rewriting', name:'amend',              file:'amend.html',              fam:'rose',  doc:'Amend, Replaced'},
  {group:'rewriting', name:'cherry-pick',        file:'cherry-pick.html',        fam:'peach', doc:'Cherry-Pick, One Commit'},
  {group:'combining', name:'merge',              file:'merge.html',              fam:'sage',  doc:'Merge, Two Parents'},
  {group:'combining', name:'fast-forward',       file:'fast-forward.html',       fam:'blue',  doc:'Fast-Forward, Just a Pointer'},
  {group:'combining', name:'squash-merge',       file:'squash-merge.html',       fam:'peach', doc:'Squash Merge, One Commit'},
  {group:'undoing',   name:'reset',              file:'reset.html',              fam:'amber', doc:'Reset, Rewound'},
  {group:'undoing',   name:'revert',             file:'revert.html',             fam:'sage',  doc:'Revert, Undo Forward'},
  {group:'syncing',   name:'fetch-pull',         file:'fetch-pull.html',         fam:'blue',  doc:'Fetch vs Pull'},
  {group:'exploring', name:'detached-head',      file:'detached-head.html',      fam:'amber', doc:'Detached HEAD, Time Travel'},
];

/* ---- client-side switching between animations ----
   Chip clicks re-boot the engine in place with the target's data (fetched
   once, ~5KB) instead of a full page navigation. Direct URLs, embeds, and
   file:// (where fetch is unavailable → normal navigation) all still work. */
const VIZ_REG={};
let bootGen=0, bootAC=null, loadChain=Promise.resolve();
function loadVizData(name){
  if(VIZ_REG[name])return Promise.resolve(VIZ_REG[name]);
  // serialize loads: each data file assigns window.VIZ, so evals must not interleave
  loadChain=loadChain.then(async()=>{
    if(VIZ_REG[name])return;
    const res=await fetch('vizzes/'+name+'.js');
    if(!res.ok)throw new Error('fetch '+name);
    (0,eval)(await res.text());
    VIZ_REG[name]=window.VIZ;
  });
  return loadChain.then(()=>VIZ_REG[name]);
}
async function switchViz(name,href,push){
  try{
    const data=await loadVizData(name);
    const u=new URL(href,location.href);
    // if this host serves clean URLs (we weren't loaded via .html), push the clean form
    if(!/\.html$/.test(location.pathname))u.pathname=u.pathname.replace(/\.html$/,'');
    if(push!==false)history.pushState({viz:name},'',u);
    const s=SERIES.find(x=>x.name===name);
    if(s&&s.doc)document.title=s.doc;
    window.scrollTo(0,0);
    boot(data);
  }catch(e){location.href=href;}
}
window.addEventListener('popstate',()=>{
  const base=(location.pathname.split('/').pop()||'').replace(/\.html$/,'')||'rebase';
  const name=SERIES.some(s=>s.name===base)?base:null;
  if(name&&VIZ_REG[name]){
    const s=SERIES.find(x=>x.name===name);
    if(s&&s.doc)document.title=s.doc;
    boot(VIZ_REG[name]);
  }else location.reload();
});

const W=2, D=2, H=72, TW=72, TH=36, NS='http://www.w3.org/2000/svg';
const pts=a=>a.map(p=>p.join(',')).join(' ');
const P=(gx,gy,z=0)=>[(gx-gy)*TW/2,(gx+gy)*TH/2-z];
const el=(t,a={},...kids)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);kids.forEach(k=>e.appendChild(k));return e;};
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,u)=>a+(b-a)*u;
const ease=u=>1-Math.pow(1-u,3);
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* one terminal line -> Human++-colored html. kind: cmd | out | err */
function ttyLine(line,kind){
  if(kind==='err')return '<span class="tk-e">'+esc(line)+'</span>';
  if(kind!=='cmd'){
    const cls=line.trim().startsWith('#')?'tk-c':'tk-o';
    return '<span class="'+cls+'">'+esc(line)+'</span>';
  }
  let html='', rest=line;
  if(rest.startsWith('$')){html='<span class="tk-p">$</span>';rest=rest.slice(1);}
  const re=/("[^"]*")|('[^']*')|(\s+)|(\S+)/g; let m, sawWord=false;
  while((m=re.exec(rest))){
    if(m[3]){html+=m[3];continue;}
    let cls='tk-w';
    if(m[1]||m[2])cls='tk-s';
    else if(!sawWord&&(m[0]==='git'||m[0]==='g'))cls='tk-g';
    else if(m[0].startsWith('-'))cls='tk-f';
    sawWord=true;
    html+='<span class="'+cls+'">'+esc(m[0])+'</span>';
  }
  return html;
}

const cubeSvg=(hex,s=20)=>{const sh=shade(hex);return `<svg width="${s}" height="${s+1}" viewBox="-1 -1 20 21" aria-hidden="true">
  <polygon points="9,0 18,4.5 9,9 0,4.5" fill="${sh.t}" stroke="${INK}" stroke-width="1"/>
  <polygon points="0,4.5 9,9 9,18 0,13.5" fill="${sh.l}" stroke="${INK}" stroke-width="1"/>
  <polygon points="9,9 18,4.5 18,13.5 9,18" fill="${sh.r}" stroke="${INK}" stroke-width="1"/></svg>`;};

function skeleton(meta){
  return `<div class="wrap">
  <header id="top">
    <div id="brand"><a class="bt" href="index.html">git, block by block</a><span class="bs">${esc(meta.title)}</span></div>
    <div id="controls">
      <button class="ctl" id="btnBack">◂ Back</button>
      <button class="ctl primary" id="btnNext">Next ▸</button>
      <button class="ctl" id="btnAuto">▸ Play all</button>
      <button class="ctl" id="btnReplay">↻ Replay</button>
    </div>
  </header>
  <nav id="vizrow" aria-label="Animations"></nav>
  <div id="canvasWrap">
    <svg id="svg" xmlns="http://www.w3.org/2000/svg"><g id="world"></g></svg>
    <div id="rail"></div>
    <div id="cap" aria-hidden="true"></div>
    <div id="econtrols"></div>
    <div id="zoom"><button id="zin" aria-label="Zoom in">+</button><button id="zout" aria-label="Zoom out">−</button><button id="zfit" aria-label="Fit view">⌖</button></div>
    <div id="legend" aria-hidden="true"></div>
    <div id="tip"></div>
  </div>
  <section id="term"><div id="tbar"><span class="td" style="background:#e7349c"></span><span class="td" style="background:#f2a633"></span><span class="td" style="background:#04b372"></span><span class="tt">git · ${esc((SERIES.find(x=>x.name===meta.name)||{}).label||meta.name)}</span>${meta.name==='playground'?'':'<a class="tgo" href="playground.html">try these yourself ⤳</a>'}</div><div id="tlog"></div></section>
  <section id="panel"><div id="body"></div></section>
  <footer id="foot">every animation on this page embeds anywhere: append <code>?embed</code> (and optionally <code>&amp;step=N</code>) to its url and iframe it. · blocks borrowed from <a href="https://redstone.university">redstone.university</a></footer>
</div>`;
}

function boot(VIZ){
const gen=++bootGen;
if(bootAC)bootAC.abort();
bootAC=new AbortController();
const SIG=bootAC.signal;
VIZ_REG[VIZ.meta.name]=VIZ;
const C=VIZ.commits, STEPS=VIZ.steps, BRANCHES=()=>VIZ.branches||['main','feature'], TAGS=()=>VIZ.tags||[];
const blockColor=n=>FAM[n.fam||'paper'];
const parentsOf=n=>[n.parent,n.parent2].filter(Boolean);

document.body.innerHTML=skeleton(VIZ.meta);

const topC=id=>{const n=C[id];return P(n.gx+W/2,n.gy+D/2,H);};

/* ================= STATE ================= */
const Q=new URLSearchParams(location.search);
const EMBED=Q.has('embed');
const S={i:0,sel:null,selRef:null,hover:null,hoverRef:null,auto:false,loop:false,tx:0,ty:0,k:1};
let stepT0=performance.now(), firstBoot=true;
const svg=document.getElementById('svg'), world=document.getElementById('world'),
      tip=document.getElementById('tip'), body=document.getElementById('body');

function targetsOf(i){
  const st=STEPS[i], op={}, gh={};
  for(const id in C){
    const present=st.present.includes(id);
    op[id]=!present?0:(st.dim.includes(id)?.55:(st.ghost.includes(id)?.9:1));
    gh[id]=st.ghost.includes(id)?1:0;
  }
  return {op,gh};
}
let prevT=targetsOf(0);
const packetsOf=st=>st.packets||(st.packet?[st.packet]:[]);
function stepDur(st){
  let d=.6;
  const scan=w=>{if(w&&w[1]>d)d=w[1];};
  if(st.appear)Object.values(st.appear).forEach(scan);
  if(st.refWin)Object.values(st.refWin).forEach(scan);
  if(st.ghostWin)Object.values(st.ghostWin).forEach(scan);
  packetsOf(st).forEach(p=>scan(p.win));
  return d;
}
const tSec=()=>REDUCED?1e9:(performance.now()-stepT0)/1000;
const winU=(w)=>ease(clamp((tSec()-w[0])/Math.max(.001,w[1]-w[0]),0,1));

/* ================= SCENE ================= */
function renderWorld(){
  const st=STEPS[S.i], cur=targetsOf(S.i);
  world.innerHTML='';
  // grid
  const gg=el('g',{opacity:.55});
  let g0=-10,g1=32;
  for(const id of st.present){const n=C[id];g0=Math.min(g0,Math.min(n.gx,n.gy)-8);g1=Math.max(g1,Math.max(n.gx,n.gy)+10);}
  g0=2*Math.floor(g0/2);g1=2*Math.ceil(g1/2);
  for(let i=g0;i<=g1;i+=2){
    let a=P(i,g0),b=P(i,g1); gg.appendChild(el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'var(--grid)','stroke-width':.6}));
    a=P(g0,i);b=P(g1,i); gg.appendChild(el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'var(--grid)','stroke-width':.6}));
  }
  world.appendChild(gg);

  // future previews — faint sketches of where new commits will land
  if(st.future){
    const fu=winU([.15,.7]);
    st.future.forEach(id=>world.appendChild(drawFuture(id,.38*fu)));
  }

  // per-commit animated values
  const val={};
  for(const id in C){
    const w=(st.appear&&st.appear[id])||[0,.45];
    const gw=(st.ghostWin&&st.ghostWin[id])||[0,.45];
    const u=winU(w);
    val[id]={
      op:lerp(prevT.op[id],cur.op[id],u),
      gh:lerp(prevT.gh[id],cur.gh[id],winU(gw)),
      lift:(st.appear&&st.appear[id])?(1-u)*34:0,
      appearing:!!(st.appear&&st.appear[id])&&u<1,
    };
  }

  // edges (under nodes)
  const eg=el('g'); world.appendChild(eg);
  for(const id of st.present){
    const n=C[id], v=val[id]; if(v.op<=0.01)continue;
    for(const p of parentsOf(n)) if(st.present.includes(p)) drawEdge(eg,id,p,v);
  }
  // nodes, painter order
  const ng=el('g'); world.appendChild(ng);
  st.present.slice().sort((a,b)=>(C[a].gx+C[a].gy)-(C[b].gx+C[b].gy))
    .forEach(id=>{const v=val[id]; if(v.op>0.01) ng.appendChild(drawCommit(id,v,st));});
  // labels
  const lg=el('g'); world.appendChild(lg);
  st.present.forEach(id=>{const v=val[id]; if(v.op>0.01) lg.appendChild(drawLabel(id,v,st));});
  // ref tags
  world.appendChild(drawTags(st));
  // packets
  for(const pk of packetsOf(st)){
    const u=winU(pk.win), raw=clamp((tSec()-pk.win[0])/(pk.win[1]-pk.win[0]),0,1);
    if(raw>0&&raw<1) world.appendChild(drawPacket(pk,u,raw));
  }
  renderRail();
}

function drawEdge(g,child,parent,v){
  const a=[C[child].gx+W/2,C[child].gy+D/2], b=[C[parent].gx+W/2,C[parent].gy+D/2];
  const grid=[a,b];
  // trim ends so lines stop at box footprints
  const trim=(p,q,d)=>{const dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy);const f=Math.min(.45,d/L);return [p[0]+dx*f,p[1]+dy*f];};
  grid[0]=trim(grid[0],grid[1],1.0);
  grid[grid.length-1]=trim(grid[grid.length-1],grid[grid.length-2],1.15);
  const scr=grid.map(p=>P(p[0],p[1],0));
  // schematic redstone dust: constant-width matte dark red
  const ghosty=v.gh>0.02;
  const eop=v.op*(ghosty?lerp(1,.45,v.gh):1)*(v.appearing?v.op:1);
  const pl=el('polyline',{points:pts(scr),fill:'none',stroke:WIRE,'stroke-width':4.5,'stroke-linecap':'round','stroke-linejoin':'round',opacity:eop});
  if(ghosty)pl.setAttribute('stroke-dasharray','7 6');
  g.appendChild(pl);
  // arrowhead at parent end
  const tipP=scr[scr.length-1], prev=scr[scr.length-2];
  let dx=tipP[0]-prev[0],dy=tipP[1]-prev[1];const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
  const px=-dy,py=dx;
  g.appendChild(el('polygon',{points:pts([[tipP[0]+dx*6,tipP[1]+dy*6],[tipP[0]-dx*6+px*5.5,tipP[1]-dy*6+py*5.5],[tipP[0]-dx*6-px*5.5,tipP[1]-dy*6-py*5.5]]),fill:WIRE,opacity:eop}));
}

function drawCommit(id,v,st){
  const n=C[id], sel=S.sel===id, hov=S.hover===id;
  const g=el('g',{class:'node','data-id':id,style:'cursor:pointer',opacity:v.op});
  const base=blockColor(n), sh=shade(base), lift=v.lift, {gx,gy}=n;
  const FL=[P(gx,gy+D,lift),P(gx+W,gy+D,lift),P(gx+W,gy+D,H+lift),P(gx,gy+D,H+lift)];
  const FR=[P(gx+W,gy,lift),P(gx+W,gy+D,lift),P(gx+W,gy+D,H+lift),P(gx+W,gy,H+lift)];
  const FT=[P(gx,gy,H+lift),P(gx+W,gy,H+lift),P(gx+W,gy+D,H+lift),P(gx,gy+D,H+lift)];
  const solid=alpha=>{
    const gg=el('g',{opacity:alpha});
    const sw=sel?2:1.3;
    gg.appendChild(el('polygon',{points:pts(FL),fill:sh.l,stroke:INK,'stroke-width':sw,'stroke-linejoin':'round'}));
    gg.appendChild(el('polygon',{points:pts(FR),fill:sh.r,stroke:INK,'stroke-width':sw,'stroke-linejoin':'round'}));
    gg.appendChild(el('polygon',{points:pts(FT),fill:sh.t,stroke:INK,'stroke-width':sw,'stroke-linejoin':'round'}));
    return gg;
  };
  const ghost=alpha=>{
    const gg=el('g',{opacity:alpha*.9});
    const gc=sh.d;
    [FL,FR,FT].forEach(p=>gg.appendChild(el('polygon',{points:pts(p),fill:'none',stroke:gc,'stroke-width':1.3,'stroke-dasharray':'4 3','stroke-linejoin':'round'})));
    return gg;
  };
  if(v.gh<=0.02) g.appendChild(solid(1));
  else if(v.gh>=0.98) g.appendChild(ghost(1));
  else { g.appendChild(solid(1-v.gh)); g.appendChild(ghost(v.gh)); }

  if(sel||hov) g.appendChild(el('polygon',{points:pts(FT),fill:sel?INK:'none',opacity:sel?.12:1,stroke:INK,'stroke-width':sel?2.5:1.8}));
  if(st.halo.includes(id)&&!sel)
    g.appendChild(el('polygon',{class:'halo',points:pts([P(gx-.35,gy-.35),P(gx+W+.35,gy-.35),P(gx+W+.35,gy+D+.35),P(gx-.35,gy+D+.35)]),fill:'none',stroke:LIVE,'stroke-width':2,'stroke-dasharray':'5 4'}));
  // code chip on top face
  const c=P(gx+W/2,gy+D/2,H+lift), chipW=n.code.length*7.6+11;
  const ghosted=v.gh>=.5;
  g.appendChild(el('rect',{x:c[0]-chipW/2,y:c[1]-8,width:chipW,height:14,
    fill:sel?INK:PAPER_B,
    stroke:ghosted?sh.d:INK,'stroke-width':1,'stroke-dasharray':ghosted?'3 2':'none'}));
  const t=el('text',{x:c[0],y:c[1]+3.5,'text-anchor':'middle','font-size':'10','font-family':'var(--mono)',
    fill:sel?PAPER_B:(ghosted?MUTED:INK),'font-weight':'600'});
  t.textContent=n.code; g.appendChild(t);

  g.addEventListener('mouseenter',e=>{S.hover=id;showTip(e,C[id].sha+' · '+C[id].msg);renderPanel();renderWorld();});
  g.addEventListener('mousemove',moveTip);
  g.addEventListener('mouseleave',()=>{if(S.hover===id){S.hover=null;hideTip();renderPanel();renderWorld();}});
  g.addEventListener('click',e=>{e.stopPropagation();select(id);});
  return g;
}

function drawLabel(id,v,st){
  const n=C[id], g=el('g',{style:'pointer-events:none',opacity:v.op});
  const b=P(n.gx+W,n.gy+D,0), txt=n.sha, w=txt.length*7.2+11, y=b[1]+9;
  const dim=v.gh>0.5, sel=S.sel===id, tinted=(n.fam&&n.fam!=='paper'&&n.fam!=='blue');
  g.appendChild(el('rect',{x:b[0]-w/2,y,width:w,height:14,fill:sel?INK:PAPER_B,stroke:dim?MUTED:INK,'stroke-width':.9,'stroke-dasharray':dim?'3 2':'none'}));
  const t=el('text',{x:b[0],y:y+10.8,'text-anchor':'middle','font-size':'10','font-family':'var(--mono)','letter-spacing':'.04em',fill:sel?PAPER_B:(dim?MUTED:INK),'font-weight':'500'});
  t.textContent=txt; g.appendChild(t);
  if(st.notes[id]){
    const nt=el('text',{x:b[0],y:y+26,'text-anchor':'middle','font-size':'9.5','font-family':'var(--mono)','letter-spacing':'.1em',fill:tinted?'var(--rose)':'var(--ink-2)','font-weight':tinted?'600':'400'});
    nt.textContent=st.notes[id].toUpperCase(); g.appendChild(nt);
  }
  return g;
}
function drawFuture(id,op){
  const n=C[id], {gx,gy}=n, rc=mixhex(blockColor(n),'#000000',.22);
  const g=el('g',{style:'pointer-events:none',opacity:op});
  const poly=p=>g.appendChild(el('polygon',{points:pts(p),fill:'none',stroke:rc,'stroke-width':1.3,'stroke-dasharray':'4 3','stroke-linejoin':'round'}));
  poly([P(gx,gy+D),P(gx+W,gy+D),P(gx+W,gy+D,H),P(gx,gy+D,H)]);
  poly([P(gx+W,gy),P(gx+W,gy+D),P(gx+W,gy+D,H),P(gx+W,gy,H)]);
  poly([P(gx,gy,H),P(gx+W,gy,H),P(gx+W,gy+D,H),P(gx,gy+D,H)]);
  const c=P(gx+W/2,gy+D/2,H), chipW=n.code.length*7.6+11;
  g.appendChild(el('rect',{x:c[0]-chipW/2,y:c[1]-8,width:chipW,height:14,fill:'none',stroke:rc,'stroke-width':1,'stroke-dasharray':'3 2'}));
  const t=el('text',{x:c[0],y:c[1]+3.5,'text-anchor':'middle','font-size':'10','font-family':'var(--mono)',fill:rc,'font-weight':'600'});
  t.textContent=n.code; g.appendChild(t);
  return g;
}

/* ---- ref tags ---- */
function restTags(refs){
  const t={}, stack={};
  for(const b of BRANCHES()){
    const cid=refs[b]; if(!cid)continue;
    const [x,y]=topC(cid), lvl=stack[cid]||0; stack[cid]=lvl+1;
    t[b]={x,y:y-34-lvl*24,commit:cid};
  }
  for(const g of TAGS()){
    const cid=refs[g]; if(cid===undefined||cid===null)continue;
    const [x,y]=topC(cid), lvl=stack[cid]||0; stack[cid]=lvl+1;
    t[g]={x,y:y-34-lvl*24,commit:cid,tag:true};
  }
  const hc=refs.head.on?refs[refs.head.on]:refs.head.at;
  const [x,y]=topC(hc), lvl=stack[hc]||0; stack[hc]=lvl+1;
  t.HEAD={x,y:y-34-lvl*24,commit:hc,detached:!refs.head.on};
  return t;
}
function drawTags(st){
  const g=el('g');
  const cur=restTags(st.refs);
  const prev=restTags(STEPS[Math.max(0,S.i-1)].refs);
  const settled={};
  const NAMES=[...BRANCHES(),...TAGS(),'HEAD'];
  for(const name of NAMES){
    if(!cur[name])continue;
    const w=(st.refWin&&st.refWin[name])||null;
    const pv=prev[name];
    let x=cur[name].x, y=cur[name].y, alpha=1, u=1;
    if(!pv){
      // ref newly created this step — fade in at its rest position
      u=w?winU(w):1; alpha=u;
      if(u<=0.01){settled[name]=false;continue;}
    } else {
      const moved=pv.x!==cur[name].x||pv.y!==cur[name].y;
      u=(w&&moved)?winU(w):1;
      const path=st.refPath&&st.refPath[name];
      if(u<1&&path){
        // multi-hop flight through waypoint commits
        const lvl=name==='HEAD'?58:34;
        const wp=path.map((cid,i)=>{
          if(i===0)return [pv.x,pv.y];
          if(i===path.length-1)return [cur[name].x,cur[name].y];
          const tc=topC(cid); return [tc[0],tc[1]-lvl];
        });
        const su=u*(wp.length-1), si=Math.min(wp.length-2,Math.floor(su)), fr=su-si;
        x=lerp(wp[si][0],wp[si+1][0],fr); y=lerp(wp[si][1],wp[si+1][1],fr);
      } else {
        x=lerp(pv.x,cur[name].x,u); y=lerp(pv.y,cur[name].y,u);
      }
    }
    settled[name]=u>=1;
    g.appendChild(tagBox(name,x,y,name==='HEAD',cur[name].detached,st,alpha,cur[name].tag));
  }
  // stems: connect settled tags downward per commit
  const byCommit={};
  for(const name of NAMES){
    if(!settled[name])continue;
    (byCommit[cur[name].commit]=byCommit[cur[name].commit]||[]).push({name,...cur[name]});
  }
  for(const cid in byCommit){
    const list=byCommit[cid].sort((a,b)=>b.y-a.y); // lowest first
    const [tx,ty]=topC(cid);
    let anchorY=ty-4;
    for(const tag of list){
      const dashed=(tag.name==='HEAD'&&tag.detached)||tag.name.includes('/');
      g.appendChild(el('line',{x1:tx,y1:tag.y+16,x2:tx,y2:anchorY,stroke:tag.name==='HEAD'?REDF:INK,'stroke-width':1.3,'stroke-dasharray':dashed?'3 2':'none'}));
      anchorY=tag.y;
    }
  }
  return g;
}
function tagBox(name,x,y,isHead,detached,st,alpha,isTag){
  const label=isHead?'HEAD':name;
  const w=label.length*7.9+15;
  const g=el('g',{style:'cursor:pointer',opacity:alpha==null?1:alpha});
  const isRemote=!isHead&&name.includes('/');
  const r=el('rect',{x:x-w/2,y,width:w,height:16,fill:isHead?REDF:(isTag?FAM.amber:PAPER_B),stroke:isHead?REDF:INK,'stroke-width':1.2});
  if(isHead&&detached){r.setAttribute('stroke',PAPER_B);r.setAttribute('stroke-dasharray','3 2');}
  if(isRemote)r.setAttribute('stroke-dasharray','3 2');
  g.appendChild(r);
  const t=el('text',{x,y:y+11.8,'text-anchor':'middle','font-size':'10.5','font-family':'var(--mono)','font-weight':'600','letter-spacing':'.06em',fill:isHead?PAPER_B:INK});
  t.textContent=label; g.appendChild(t);
  if(isHead&&detached){
    const d=el('text',{x:x+w/2+5,y:y+11.5,'font-size':'8.5','font-family':'var(--mono)',fill:'var(--red)','letter-spacing':'.08em','font-weight':'600'});
    d.textContent='(detached)'; g.appendChild(d);
  }
  const defaults={HEAD:'HEAD: where you are; detached = pointing at a commit, not a branch'};
  const blurb=(VIZ.refBlurbs&&VIZ.refBlurbs[isHead?'HEAD':name])||defaults[isHead?'HEAD':name]
    ||(isTag?`${name}: a tag, a ref that never moves`:`${name}: a branch is just a movable pointer to one commit`);
  g.addEventListener('mouseenter',e=>{S.hoverRef=isHead?'HEAD':name;showTip(e,blurb);renderPanel();});
  g.addEventListener('mousemove',moveTip);
  g.addEventListener('mouseleave',()=>{if(S.hoverRef){S.hoverRef=null;hideTip();renderPanel();}});
  g.addEventListener('click',e=>{e.stopPropagation();S.selRef=isHead?'HEAD':name;S.sel=null;renderPanel();renderWorld();});
  return g;
}

function drawPacket(pk,u,raw){
  // a redstone torch carries the change to where it lands
  const a=topC(pk.from), b=topC(pk.to);
  const x=lerp(a[0],b[0],u), y=lerp(a[1],b[1],u)-Math.sin(raw*Math.PI)*80;
  const g=el('g');
  g.appendChild(el('circle',{cx:x,cy:y-5,r:11,fill:LIVE,opacity:.22}));
  g.appendChild(el('line',{x1:x,y1:y+1,x2:x,y2:y+10,stroke:STICK,'stroke-width':3.5,'stroke-linecap':'round'}));
  g.appendChild(el('rect',{x:x-3.5,y:y-9,width:7,height:8,rx:1.5,fill:REDF,stroke:INK,'stroke-width':.7}));
  const w=pk.label.length*6.4+8;
  g.appendChild(el('rect',{x:x+11,y:y-21,width:w,height:14,fill:PAPER_B,stroke:WIRE,'stroke-width':1}));
  const t=el('text',{x:x+15,y:y-10.5,'font-size':'10','font-family':'var(--mono)',fill:INK,'font-weight':'500'});
  t.textContent=pk.label; g.appendChild(t);
  return g;
}

/* ================= PANEL ================= */
function renderPanel(){
  if(S.selRef||S.hoverRef){renderRefCard(S.selRef||S.hoverRef);return;}
  const id=S.sel||S.hover;
  if(id){renderCommitCard(id);return;}
  renderStepPanel();
}
function renderStepPanel(){
  const st=STEPS[S.i], last=S.i===STEPS.length-1;
  body.innerHTML=`<div class="eyebrow">Step ${S.i+1} of ${STEPS.length}</div>
  <h1 class="t">${st.t}</h1>
  <p class="lede">${st.lede}</p>
  ${st.story}
  ${st.sub?`<p class="sub">${st.sub}</p>`:''}
  ${st.plumbing?`<details><summary>Under the hood</summary>${st.plumbing}</details>`:''}
  <div class="actions">
    <button class="ctl" onclick="prevStep()" ${S.i===0?'disabled':''}>◂ Back</button>
    <button class="ctl primary" onclick="${last?'gotoStep(0)':'nextStep()'}">${last?'↺ Start over':'Next ▸'}</button>
  </div>`;
}
function renderCommitCard(id){
  const st=STEPS[S.i], n=C[id], pinned=S.sel===id;
  let pre=`commit  ${n.sha}\nparent  ${n.parent?C[n.parent].sha:'(none: root commit)'}`;
  if(n.parent2)pre+=`\nparent  ${C[n.parent2].sha}`;
  pre+=`\nauthor  you\nmessage ${n.msg}`;
  let note=VIZ.commitNote?(VIZ.commitNote(id,st,S.i)||''):'';
  if(!note){
    if(n.copyOf)
      note=`<p>A copy of ${C[n.copyOf].code} (<code>${C[n.copyOf].sha}</code>): identical changes, identical message, but the parent differs, so the hash differs. A commit's id covers its content and its entire history.</p>`;
    else if(st.ghost.includes(id))
      note=`<p>Unreachable: no branch or tag points here anymore. <code>git log</code> won't show it, the reflog still will (for 30 days by default), then garbage collection removes it.</p>`;
    else if(!n.parent)
      note=`<p>The root commit, the only one with no parent.</p>`;
  }
  body.innerHTML=`<div class="eyebrow">commit · ${pinned?'pinned':'hovering'}</div>
  <h1 class="t">${n.code} · ${esc(n.msg)}</h1>
  <pre>${esc(pre)}</pre>${note}
  ${pinned?`<div class="actions"><button class="ctl" onclick="select(null)">Back to step</button></div>`:''}`;
}
function renderRefCard(name){
  const refs=STEPS[S.i].refs;
  let target;
  if(name==='HEAD') target=refs.head.on?`${refs.head.on} (attached)`:C[refs.head.at].sha+' (detached)';
  else target=refs[name]?C[refs[name]].sha:'—';
  const text=(VIZ.refCards&&VIZ.refCards[name])||
    (name==='HEAD'
      ?`<p>HEAD is “where you are.” Normally it's attached to a branch, and committing moves that branch with you.</p>`
      :`<p>A branch is just a name pointing at one commit, a 41-byte file at <code>.git/refs/heads/${name}</code>. Nothing about the commits themselves says which branch they're “on.”</p>`);
  body.innerHTML=`<div class="eyebrow">ref · ${S.selRef?'pinned':'hovering'}</div>
  <h1 class="t">${name}</h1>
  <pre>${name==='HEAD'?'HEAD':'refs/heads/'+name}  →  ${esc(target)}</pre>${text}
  ${S.selRef?`<div class="actions"><button class="ctl" onclick="select(null)">Back to step</button></div>`:''}`;
}

/* ================= RAIL ================= */
function renderRail(){
  const r=document.getElementById('rail');
  if(STEPS.length>15){
    // long sandbox histories: a seekable meter instead of a dot per step
    const pct=STEPS.length>1?(S.i/(STEPS.length-1))*100:0;
    r.innerHTML=`<div class="meter" role="slider" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${S.i+1}"><span style="width:${pct}%"></span></div>`
      +`<span class="title">${S.i+1} / ${STEPS.length} · ${esc(STEPS[S.i].t)}</span>`;
    const m=r.querySelector('.meter');
    m.addEventListener('click',e=>{
      const rect=m.getBoundingClientRect();
      window.gotoStep(Math.round(((e.clientX-rect.left)/rect.width)*(STEPS.length-1)));
    });
  }else{
    r.innerHTML=STEPS.map((s,i)=>`<button class="ch ${i===S.i?'on':i<S.i?'done':''}" title="${esc(s.t)}" aria-label="Step ${i+1}: ${esc(s.t)}" onclick="gotoStep(${i})"></button>`).join('')
      +`<span class="title">${S.i+1} · ${esc(STEPS[S.i].t)}</span>`;
  }
  const cap=document.getElementById('cap'); if(cap)cap.textContent=STEPS[S.i].lede;
  const atStart=S.i===0, atEnd=S.i===STEPS.length-1;
  document.getElementById('btnBack').disabled=atStart;
  document.getElementById('btnNext').disabled=atEnd;
  const ebk=document.getElementById('ebk'), enx=document.getElementById('enx');
  if(ebk){ebk.disabled=atStart; enx.disabled=atEnd;}
}

/* ================= NAV ================= */
function select(id){S.sel=id;S.selRef=null;renderPanel();renderWorld();}
function gotoStep(i){
  i=clamp(i,0,STEPS.length-1);
  prevT=i===0?{op:Object.fromEntries(Object.keys(C).map(k=>[k,0])),gh:Object.fromEntries(Object.keys(C).map(k=>[k,0]))}:targetsOf(i-1);
  S.i=i;S.sel=null;S.selRef=null;S.hover=null;S.hoverRef=null;
  stepT0=performance.now();
  try{ // keep the URL shareable at this exact step
    const u=new URL(location.href);
    if(i>0)u.searchParams.set('step',i+1);else u.searchParams.delete('step');
    history.replaceState(null,'',u);
  }catch(e){}
  renderWorld();renderPanel();renderTerm();fitView(!firstBoot);firstBoot=false;
}
let termAnim=0;
function renderTerm(){
  if(VIZ.liveTerm)return; // the playground drives its own terminal while interactive
  const log=document.getElementById('tlog'); if(!log)return;
  termAnim++; const gen=termAnim;
  const lineHtml=l=>`<div>${ttyLine(l,l.startsWith('$')?'cmd':'out')}</div>`;
  let base='';
  for(let i=0;i<S.i;i++){const c=STEPS[i].cmd;if(c)base+=c.split('\n').map(lineHtml).join('');}
  const cur=STEPS[S.i].cmd?STEPS[S.i].cmd.split('\n'):[];
  const paint=h=>{log.innerHTML=h;log.scrollTop=log.scrollHeight;};
  if(REDUCED||!cur.length){paint(base+cur.map(lineHtml).join(''));return;}
  // type the current step's commands character by character
  let li=0, ci=0;
  (function tick(){
    if(gen!==termAnim||VIZ.liveTerm)return;
    let h=base;
    for(let k=0;k<li;k++)h+=lineHtml(cur[k]);
    if(li>=cur.length){paint(h);return;}
    const line=cur[li];
    if(line.startsWith('$')){
      if(ci<line.length){
        ci++;
        h+=`<div>${ttyLine(line.slice(0,ci),'cmd')}<span class="tk-cur">▌</span></div>`;
        paint(h); setTimeout(tick,ci<=2?160:24);
      }else{li++;ci=0;h+=lineHtml(line);paint(h);setTimeout(tick,150);}
    }else{li++;ci=0;h+=lineHtml(line);paint(h);setTimeout(tick,55);}
  })();
}
function nextStep(){if(S.i<STEPS.length-1)gotoStep(S.i+1);else setAuto(false);}
function prevStep(){gotoStep(S.i-1);}
function replayStep(){gotoStep(S.i);}
function setAuto(on){S.auto=on;document.getElementById('btnAuto').textContent=on?'‖ Stop':'▸ Play all';}
// inline onclick handlers reach these through window; any user navigation
// takes over from the ambient loop
function takeOver(){S.loop=false;if(S.auto)setAuto(false);}
window.gotoStep=i=>{takeOver();gotoStep(i);};
window.prevStep=()=>{takeOver();prevStep();};
window.nextStep=()=>{takeOver();nextStep();};
window.select=select;
if(window.GitBlocks){
  GitBlocks.play=o=>{S.loop=!!(o&&o.loop);gotoStep(0);setAuto(true);};
  GitBlocks.stop=takeOver;
}

document.getElementById('btnNext').onclick=()=>window.nextStep();
document.getElementById('btnBack').onclick=()=>window.prevStep();
document.getElementById('btnReplay').onclick=replayStep;
document.getElementById('zfit').onclick=()=>fitView(true);
document.getElementById('btnAuto').onclick=()=>{
  if(S.auto){takeOver();return;}
  if(S.i===STEPS.length-1)gotoStep(0);
  S.loop=true; setAuto(true);
};
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  if(e.key==='ArrowRight'||e.key==='Enter'||e.key===']'){e.preventDefault();window.nextStep();}
  else if(e.key==='ArrowLeft'||e.key==='['){e.preventDefault();window.prevStep();}
  else if(e.key==='r'){e.preventDefault();replayStep();}
  else if(e.key===' '){e.preventDefault();document.getElementById('btnAuto').click();}
  else if(e.key==='Escape'){select(null);}
},{signal:SIG});

/* ================= CAMERA ================= */
let camTween=null;
function applyView(){world.setAttribute('transform',`translate(${S.tx},${S.ty}) scale(${S.k})`);}
function setView(tx,ty,k,anim){
  camTween=null;
  if(anim&&!REDUCED)camTween={a:{tx:S.tx,ty:S.ty,k:S.k},b:{tx,ty,k},t0:performance.now(),dur:560};
  else{S.tx=tx;S.ty=ty;S.k=k;applyView();}
}
function camTick(){
  if(!camTween)return;
  let u=Math.min(1,(performance.now()-camTween.t0)/camTween.dur);u=ease(u);
  S.tx=lerp(camTween.a.tx,camTween.b.tx,u);S.ty=lerp(camTween.a.ty,camTween.b.ty,u);S.k=lerp(camTween.a.k,camTween.b.k,u);
  applyView();if(u>=1)camTween=null;
}
function fitView(anim){
  const st=STEPS[S.i], r=svg.getBoundingClientRect();
  if(r.width<80||r.height<80)return;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  [...st.present,...(st.future||[])].forEach(id=>{
    const n=C[id];
    [P(n.gx,n.gy,H),P(n.gx+W,n.gy,H),P(n.gx+W,n.gy+D,0),P(n.gx,n.gy+D,0)].forEach(p=>{
      x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);
    });
    const t=topC(id);y0=Math.min(y0,t[1]-118);y1=Math.max(y1,P(n.gx+W,n.gy+D,0)[1]+34);
  });
  const small=r.width<640;
  const pad=small?22:52;
  let k=clamp(Math.min((r.width-pad*2)/(x1-x0),(r.height-pad*2)/(y1-y0)),.2,1.5);
  if(!isFinite(k))return;
  let cx=(x0+x1)/2, cy=(y0+y1)/2;
  if(small&&k<.5){
    // phones: keep blocks readable and center on this step's action instead
    k=.5;
    const focus=(()=>{
      const ap=st.appear&&Object.keys(st.appear).pop();
      if(ap&&C[ap])return topC(ap);
      const rw=st.refWin&&Object.keys(st.refWin).find(n=>n!=='HEAD');
      const tgt=rw&&st.refs[rw];
      if(tgt&&C[tgt])return topC(tgt);
      const hc=st.refs.head&&(st.refs.head.on?st.refs[st.refs.head.on]:st.refs.head.at);
      if(hc&&C[hc])return topC(hc);
      return null;
    })();
    if(focus){cx=focus[0];cy=focus[1]-40;}
  }
  setView(r.width/2-cx*k, r.height/2-cy*k+10, k, anim);
}
function zoomAt(f,cx,cy){
  camTween=null;const nk=clamp(S.k*f,.3,3);
  S.tx=cx-(cx-S.tx)*(nk/S.k);S.ty=cy-(cy-S.ty)*(nk/S.k);S.k=nk;applyView();
}
svg.addEventListener('wheel',e=>{
  if(EMBED&&!e.ctrlKey)return; // inside an iframe, plain wheel scrolls the host page
  e.preventDefault();const r=svg.getBoundingClientRect();zoomAt(e.deltaY<0?1.1:.9,e.clientX-r.left,e.clientY-r.top);
},{passive:false});
let drag=null; const touches=new Map(); let pinch=null;
svg.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'){
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(touches.size===2){
      const [a,b]=[...touches.values()];
      pinch={d:Math.hypot(a.x-b.x,a.y-b.y),k:S.k}; drag=null;
    }
  }
  if(e.button!==0)return;
  camTween=null;
  if(touches.size<2)drag={x:e.clientX,y:e.clientY,tx:S.tx,ty:S.ty,moved:false};
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch'&&touches.has(e.pointerId)){
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&touches.size===2){
      const [a,b]=[...touches.values()];
      const rect=svg.getBoundingClientRect();
      const mx=(a.x+b.x)/2-rect.left, my=(a.y+b.y)/2-rect.top;
      const nd=Math.hypot(a.x-b.x,a.y-b.y);
      const nk=clamp(pinch.k*(nd/pinch.d),.3,3);
      S.tx=mx-(mx-S.tx)*(nk/S.k); S.ty=my-(my-S.ty)*(nk/S.k); S.k=nk;
      applyView(); return;
    }
  }
  if(!drag)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(dx,dy)>3){drag.moved=true;svg.classList.add('dragging');}
  S.tx=drag.tx+dx;S.ty=drag.ty+dy;applyView();
});
const endTouch=e=>{
  if(e.pointerType==='touch'){touches.delete(e.pointerId); if(touches.size<2)pinch=null;}
  if(drag&&!drag.moved)select(null);
  drag=null;svg.classList.remove('dragging');
};
svg.addEventListener('pointerup',endTouch);
svg.addEventListener('pointercancel',endTouch);
document.getElementById('zin').onclick=()=>{const r=svg.getBoundingClientRect();zoomAt(1.2,r.width/2,r.height/2);};
document.getElementById('zout').onclick=()=>{const r=svg.getBoundingClientRect();zoomAt(1/1.2,r.width/2,r.height/2);};
window.addEventListener('resize',()=>fitView(false),{signal:SIG});

/* ================= TIP ================= */
function showTip(e,text){tip.style.display='block';tip.textContent=text;moveTip(e);}
function moveTip(e){const r=svg.getBoundingClientRect();let x=e.clientX-r.left+14,y=e.clientY-r.top+14;if(x+290>r.width)x-=300;if(y+50>r.height)y-=60;tip.style.left=x+'px';tip.style.top=y+'px';}
function hideTip(){tip.style.display='none';}

/* ================= LOOP ================= */
let lastActive=true;
function tick(){
  if(gen!==bootGen)return; // a newer boot owns the page now
  camTick();
  const st=STEPS[S.i], dur=stepDur(st);
  const active=tSec()<dur+.05;
  if(active||lastActive)renderWorld();
  lastActive=active;
  const elapsed=(performance.now()-stepT0)/1000;
  if(S.auto&&!active&&elapsed>dur+3.4){
    if(S.i<STEPS.length-1)nextStep();
    else if(S.loop)gotoStep(0);
    else setAuto(false);
  }
  requestAnimationFrame(tick);
}

/* ================= LEGEND + ANIMATION LIST ================= */
document.getElementById('legend').innerHTML=(VIZ.legend||[])
  .map(([fam,l])=>`<span class="li">${cubeSvg(FAM[fam]||fam)}<span>${l}</span></span>`).join('');
const vizrow=document.getElementById('vizrow');
const chip=v=>{
  const on=v.name===VIZ.meta.name;
  return `<a class="nv${on?' on':''}" href="${v.file}" data-name="${v.name}"${on?' aria-current="page"':''}>${cubeSvg(FAM[v.fam],17)}<span>${v.label||v.name}</span></a>`;
};
const groups=[];
for(const v of SERIES){
  let g=groups[groups.length-1];
  if(!g||g.name!==v.group){g={name:v.group,items:[]};groups.push(g);}
  g.items.push(v);
}
vizrow.innerHTML=groups.map(g=>
  `<div class="vgroup"><span class="nvg">${g.name}</span><span class="vchips">${g.items.map(chip).join('')}</span></div>`
).join('');
if(location.protocol!=='file:'){
  // switch client-side: re-boot with the target's data instead of a page load
  vizrow.querySelectorAll('a.nv').forEach(a=>a.addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
    e.preventDefault();
    const name=a.dataset.name;
    if(name!==VIZ.meta.name)switchViz(name,a.getAttribute('href'));
  }));
  // warm the other data files so the first switch is instant
  (window.requestIdleCallback||(f=>setTimeout(f,400)))(async()=>{
    for(const s of SERIES){if(!VIZ_REG[s.name]){try{await loadVizData(s.name);}catch(e){}}}
  });
}

/* ================= BOOT ================= */
if(EMBED){
  document.body.classList.add('embed');
  document.getElementById('econtrols').innerHTML=
    `<button class="ctl" id="ebk" aria-label="Back">◂</button>`+
    `<button class="ctl" id="enx" aria-label="Next">▸</button>`+
    `<a class="ctl" href="${location.pathname}" target="_blank" title="Open the full walkthrough">⤢</a>`;
  document.getElementById('ebk').onclick=()=>window.prevStep();
  document.getElementById('enx').onclick=()=>window.nextStep();
}
gotoStep(clamp((parseInt(Q.get('step'))||1)-1,0,STEPS.length-1));
if(!EMBED){
  let seen=false; try{seen=!!localStorage.getItem('gb_hinted');}catch(e){}
  if(!seen){
    const hint=document.createElement('div');
    hint.id='ghint';
    hint.textContent='← → to step through · hover any block to inspect it';
    document.getElementById('canvasWrap').appendChild(hint);
    const dismiss=()=>{try{localStorage.setItem('gb_hinted','1');}catch(e){}
      hint.classList.add('gone'); setTimeout(()=>hint.remove(),600);
      document.removeEventListener('keydown',dismiss,true);
      document.removeEventListener('pointerdown',dismiss,true);};
    setTimeout(dismiss,9000);
    document.addEventListener('keydown',dismiss,true);
    document.addEventListener('pointerdown',dismiss,true);
  }
}
if(Q.has('loop')){S.loop=true;setAuto(true);}
else if(Q.has('autoplay'))setAuto(true);
else if(!VIZ.liveTerm&&!Q.has('noplay')&&!REDUCED){S.loop=true;setAuto(true);}
requestAnimationFrame(tick);
}

window.GitBlocks={boot,tty:ttyLine};
document.addEventListener('DOMContentLoaded',()=>{if(window.VIZ)boot(window.VIZ);});
})();
