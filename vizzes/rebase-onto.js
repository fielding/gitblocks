/* rebase --onto — transplant a slice of history to a new base */
(function(){
window.VIZ={
meta:{name:'rebase-onto', title:'rebase --onto, transplanted'},
branches:['main','api','oauth'],
legend:[['paper','history'],['amber','the abandoned base'],['blue','your branch'],['rose','copies']],
commits:{
  A:  {code:'A',  sha:'a1f0c3e', msg:'init: scaffold',        parent:null, gx:0,  gy:2},
  B:  {code:'B',  sha:'b7a41d2', msg:'add config',            parent:'A',  gx:4,  gy:2},
  M1: {code:'M1', sha:'c9d3e8f', msg:'fix flaky test',        parent:'B',  gx:8,  gy:2},
  P1: {code:'P1', sha:'e21a9c4', msg:'api sketch (superseded)',parent:'B', gx:8,  gy:7, fam:'amber'},
  Q1: {code:'Q1', sha:'5b17d3e', msg:'add oauth',             parent:'P1', gx:12, gy:7, fam:'blue'},
  Q2: {code:'Q2', sha:'90cc41a', msg:'oauth tests',           parent:'Q1', gx:16, gy:7, fam:'blue'},
  Q1p:{code:'Q1′',sha:'6e02b7f', msg:'add oauth',             parent:'M1', gx:12, gy:2, fam:'rose', copyOf:'Q1'},
  Q2p:{code:'Q2′',sha:'c4d81f9', msg:'oauth tests',           parent:'Q1p',gx:16, gy:2, fam:'rose', copyOf:'Q2'},
},
steps:[
{ t:'A branch on a branch',
  lede:'oauth was built on top of api — and api just got rejected.',
  story:`<p>You stacked your work: api first, oauth on top. Now api is abandoned but oauth is good. A plain <a href="rebase.html">rebase</a> onto main would <mark>drag api's commit along</mark> — you need a more precise cut.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:['A','B','M1','P1','Q1','Q2'], dim:[], ghost:[], halo:[], notes:{P1:'superseded'},
  refs:{main:'M1', api:'P1', oauth:'Q2', head:{on:'oauth'}},
  appear:{A:[0,.3],B:[.15,.45],M1:[.3,.6],P1:[.45,.75],Q1:[.6,.9],Q2:[.75,1.05]} },

{ t:'Three arguments, total control',
  lede:'Read it as: take what oauth has beyond api, and replay it on main.',
  story:`<p><code>--onto main</code> is the new base. <code>api</code> is the old base — everything up to it stays behind. <code>oauth</code> is what to move. <mark>You choose the cut point</mark>, not the merge-base.</p>`,
  cmd:'$ git rebase --onto main api oauth',
  plumbing:`<pre>$ git rev-list --reverse api..oauth   # what moves
5b17d3e   # Q1
90cc41a   # Q2
# P1 is on the api side of the cut: not replayed</pre>`,
  sub:'faint dashed outlines = where the copies will land',
  present:['A','B','M1','P1','Q1','Q2'], dim:[], ghost:[], halo:['Q1','Q2'], notes:{M1:'new base',P1:'old base — left behind'},
  future:['Q1p','Q2p'],
  refs:{main:'M1', api:'P1', oauth:'Q2', head:{on:'oauth'}} },

{ t:'Replay — skipping the dead base',
  lede:'Q1 and Q2 land on main. P1 stays behind.',
  story:`<p>Same copy machinery as every rebase — <mark>new parents, new hashes</mark> — but the cut you chose left api's commit out of the flight plan entirely.</p>`,
  cmd:null, plumbing:null,
  present:['A','B','M1','P1','Q1','Q2','Q1p','Q2p'], dim:['Q1','Q2'], ghost:[], halo:[], notes:{Q1p:'copy of Q1',Q2p:'copy of Q2'},
  refs:{main:'M1', api:'P1', oauth:'Q2', head:{at:'Q2p'}},
  packets:[{from:'Q1', to:'Q1p', label:'changes in Q1', win:[.15,1.05]},
           {from:'Q2', to:'Q2p', label:'changes in Q2', win:[.45,1.35]}],
  appear:{Q1p:[.95,1.55], Q2p:[1.25,1.85]},
  refWin:{HEAD:[1.8,2.4]} },

{ t:'oauth catches up; the originals ghost out',
  lede:'The pointer jumps to the copies; Q1 and Q2 become strays.',
  story:`<p>Same epilogue as every rebase: no ref reaches the originals now, and the reflog remembers them for ~90 days. api still holds P1 — <mark>delete that branch and its dead end goes too</mark>.</p>`,
  cmd:null,
  plumbing:`<pre>$ git branch -d api
error: not fully merged      # of course — it never landed
$ git branch -D api          # goodbye, sketch</pre>`,
  present:['A','B','M1','P1','Q1','Q2','Q1p','Q2p'], dim:[], ghost:['Q1','Q2'], halo:[], notes:{},
  refs:{main:'M1', api:'P1', oauth:'Q2p', head:{on:'oauth'}},
  refWin:{oauth:[.15,.85], HEAD:[.85,1.45]},
  ghostWin:{Q1:[.9,1.7], Q2:[1.05,1.85]} },

{ t:'The precision tool',
  lede:'--onto moves any slice of history to any new base.',
  story:`<p>Transplant a branch off a dead parent, split a stack, move a range between release lines — <mark>if rebase is a replay, --onto picks the reel and the projector</mark>.</p>`,
  cmd:`$ git log --oneline oauth
c4d81f9 (HEAD -> oauth) oauth tests
6e02b7f add oauth
c9d3e8f (main) fix flaky test
b7a41d2 add config
a1f0c3e init: scaffold`,
  plumbing:null,
  present:['A','B','M1','P1','Q1','Q2','Q1p','Q2p'], dim:[], ghost:['Q1','Q2'], halo:[], notes:{},
  refs:{main:'M1', api:'P1', oauth:'Q2p', head:{on:'oauth'}} },
],
commitNote(id,st,i){
  if(id==='P1')
    return `<p>The old base — deliberately left out of the replay. Still reachable through the api branch until you delete it.</p>`;
  if(id==='M1'&&i>=1)
    return `<p>The new base: <code>--onto main</code> resolves to main's tip, and the copies build from here.</p>`;
  return '';
},
refCards:{
  main:`<p>Only names the landing zone — --onto never moves the branch you're rebasing onto.</p>`,
  api:`<p>The rejected experiment. It marks the cut point (everything reachable from it stays behind) and keeps P1 alive until you delete it.</p>`,
  oauth:`<p>The branch being transplanted: it ends up pointing at the copies, its history now reading main → oauth with api gone from under it.</p>`,
  HEAD:`<p>Detaches and rides the copies during the replay, exactly like a plain rebase, then reattaches to oauth.</p>`,
},
refBlurbs:{
  main:'main — the landing zone; never moves',
  api:'api — the abandoned base and the cut point',
  oauth:'oauth — the branch being transplanted',
  HEAD:'HEAD — rides the copies, then reattaches to oauth',
},
};
})();
