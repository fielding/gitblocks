/* cherry-pick — take one commit's changes, leave its branch behind */
(function(){
const ALL=['A','B','M1','M2','F1','F2'];
window.VIZ={
meta:{name:'cherry-pick', title:'cherry-pick, one commit'},
branches:['main','feature'],
legend:[['paper','history'],['blue','feature'],['peach','the copy']],
commits:{
  A:  {code:'A',  sha:'a1f0c3e', msg:'init: scaffold',  parent:null, gx:0,  gy:2},
  B:  {code:'B',  sha:'b7a41d2', msg:'add config',      parent:'A',  gx:4,  gy:2},
  M1: {code:'M1', sha:'c9d3e8f', msg:'fix flaky test',  parent:'B',  gx:8,  gy:2},
  M2: {code:'M2', sha:'d40b91c', msg:'bump deps',       parent:'M1', gx:12, gy:2},
  F1: {code:'F1', sha:'e8127f4', msg:'wip: login form', parent:'B',  gx:9,  gy:8, fam:'blue'},
  F2: {code:'F2', sha:'f3c56aa', msg:'fix session bug', parent:'F1', gx:13, gy:8, fam:'blue'},
  F2p:{code:'F2′',sha:'4c81d20', msg:'fix session bug', parent:'M2', gx:16, gy:2, fam:'peach', copyOf:'F2'},
},
steps:[
{ t:'One commit, over there',
  lede:'main needs the session fix — but not the half-done login form.',
  story:`<p>F2 has exactly what you want; F1 isn't ready to ship. Merging or rebasing would bring both. <mark>Cherry-pick takes one commit's changes</mark> and applies them where you stand.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:ALL, dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'M2', feature:'F2', head:{on:'main'}},
  appear:{A:[0,.35],B:[.15,.5],M1:[.3,.65],M2:[.45,.8],F1:[.6,.95],F2:[.75,1.1]} },

{ t:'The ask',
  lede:'“Replay what F2 changed, right here on top of main.”',
  story:`<p>Git computes the diff F1→F2 — that one commit's change and nothing else — and prepares to apply it on M2. <mark>F2 itself will not move</mark>; nothing on feature is touched.</p>`,
  cmd:'$ git switch main\n$ git cherry-pick f3c56aa',
  plumbing:`<pre># the unit being picked is a CHANGE, not a snapshot:
#   patch = diff e8127f4..f3c56aa   (F1 -> F2)
# applied onto d40b91c (M2)</pre>`,
  sub:'faint dashed outline = where the copy will land',
  present:ALL, dim:[], ghost:[], halo:['F2'], notes:{M2:'applied here'},
  future:['F2p'],
  refs:{main:'M2', feature:'F2', head:{on:'main'}} },

{ t:'Replay F2 → F2′',
  lede:'The change lands as a brand-new commit with a new hash.',
  story:`<p>Same patch, same message — different parent, so a different id. Sound familiar? <mark>A cherry-pick is a one-commit rebase</mark>, and a <a href="rebase.html">rebase</a> is cherry-picks in a loop. main commits directly, so HEAD stays attached and rides along.</p>`,
  cmd:null,
  plumbing:`<pre># conflicts work like any replay:
#   fix files -> git add -> git cherry-pick --continue
#   or back out: git cherry-pick --abort
# -x appends "(cherry picked from f3c56aa)" to the message</pre>`,
  present:[...ALL,'F2p'], dim:[], ghost:[], halo:[], notes:{F2p:'copy of F2'},
  refs:{main:'F2p', feature:'F2', head:{on:'main'}},
  packet:{from:'F2', to:'F2p', label:'changes in F2', win:[.15,1.15]},
  appear:{F2p:[1.05,1.65]},
  refWin:{main:[1.6,2.2], HEAD:[1.6,2.2]} },

{ t:'Now it exists twice',
  lede:'The same change is now two different commits.',
  story:`<p>feature still holds the original; main holds the copy. If feature gets merged later, git compares <em>patches</em>, not hashes, and usually skips the duplicate — but <mark>history will honestly show it landed twice</mark>.</p>`,
  cmd:null,
  plumbing:`<pre>$ git patch-id   # same patch-id, different sha
f3c56aa -> 8d02…e1   (original, on feature)
4c81d20 -> 8d02…e1   (copy, on main)
# rebase and rev-list use this to spot duplicates</pre>`,
  present:[...ALL,'F2p'], dim:[], ghost:[], halo:['F2','F2p'], notes:{F2p:'copy of F2'},
  refs:{main:'F2p', feature:'F2', head:{on:'main'}} },

{ t:'When to reach for it',
  lede:'Hotfixes, backports, rescuing one good commit from a dead branch.',
  story:`<p>Cherry-pick shines when you want <mark>a change without its branch</mark>. If you catch yourself picking many commits in order, that's a rebase — let git run the loop for you.</p>`,
  cmd:`$ git log --oneline main
4c81d20 (HEAD -> main) fix session bug
d40b91c bump deps
c9d3e8f fix flaky test
b7a41d2 add config
a1f0c3e init: scaffold`,
  plumbing:null,
  present:[...ALL,'F2p'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'F2p', feature:'F2', head:{on:'main'}} },
],
commitNote(id,st,i){
  const C=this.commits;
  if(id==='F2'&&st.present.includes('F2p'))
    return `<p>The original — fully intact and still reachable from feature. Its change now also lives on main as <code>${C.F2p.sha}</code>.</p>`;
  if(id==='F1')
    return `<p>The commit you deliberately left behind — this is the whole reason to cherry-pick instead of merging feature.</p>`;
  if(id==='M2'&&i>=1)
    return `<p>Where you stood when you picked: the copy is built directly on top of this commit.</p>`;
  return '';
},
refCards:{
  main:`<p>Your current branch. Because cherry-pick commits directly onto it, main advances to the new copy as soon as the pick lands — no separate “catch up” step like a rebase has.</p>`,
  feature:`<p>The donor branch. Cherry-pick only reads from it; it never moves, and F1 stays safely unpublished on it.</p>`,
  HEAD:`<p>Attached to main the whole time — a cherry-pick is just “apply this patch, then commit here,” and committing moves the branch you're on.</p>`,
},
refBlurbs:{
  main:'main — advances to the copy the moment the pick lands',
  feature:'feature — the donor branch; cherry-pick never moves it',
  HEAD:'HEAD — attached to main throughout',
},
};
})();
