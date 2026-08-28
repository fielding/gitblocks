/* fast-forward — a merge with nothing to merge: the pointer just slides */
(function(){
window.VIZ={
meta:{name:'fast-forward', title:'fast-forward, just a pointer'},
branches:['main','feature'],
legend:[['paper','history'],['blue','feature (strictly ahead)']],
commits:{
  A:  {code:'A',  sha:'a1f0c3e', msg:'init: scaffold',  parent:null, gx:0,  gy:2},
  B:  {code:'B',  sha:'b7a41d2', msg:'add config',      parent:'A',  gx:4,  gy:2},
  F1: {code:'F1', sha:'e8127f4', msg:'add login form',  parent:'B',  gx:9,  gy:8, fam:'blue'},
  F2: {code:'F2', sha:'f3c56aa', msg:'add sessions',    parent:'F1', gx:13, gy:8, fam:'blue'},
},
steps:[
{ t:'Ahead, not diverged',
  lede:'feature is strictly ahead: main never moved after the fork.',
  story:`<p>Every commit main has, feature also has: B is an ancestor of F2. There are <mark>no two histories to combine</mark>. One is simply further along.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:['A','B','F1','F2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', feature:'F2', head:{on:'main'}},
  appear:{A:[0,.4],B:[.2,.6],F1:[.4,.8],F2:[.6,1]} },

{ t:'The ask',
  lede:'The command says merge, but there is nothing to combine.',
  story:`<p>Git finds the merge base first. Here it's B, which is also main's own tip. <mark>When your tip is the merge base</mark>, the other branch already contains everything you have, and no merge commit is needed.</p>`,
  cmd:'$ git switch main\n$ git merge feature',
  plumbing:`<pre>$ git merge-base main feature
b7a41d2            # = main's tip -> fast-forward possible
$ git merge feature
Updating b7a41d2..f3c56aa
Fast-forward</pre>`,
  present:['A','B','F1','F2'], dim:[], ghost:[], halo:['F2'], notes:{B:'main’s tip = merge base'},
  refs:{main:'B', feature:'F2', head:{on:'main'}} },

{ t:'Fast-forward',
  lede:'main just slides forward along the existing commits.',
  story:`<p>No new commit, no copies, no second parent: <mark>one pointer moves and the command is done</mark>. main now points into what looked like “feature's lane”, because branches aren't places, just names on commits.</p>`,
  cmd:null,
  plumbing:`<pre># literally all that changed:
$ git update-ref refs/heads/main f3c56aa
# both branches now name the same commit</pre>`,
  present:['A','B','F1','F2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'F2', feature:'F2', head:{on:'main'}},
  refPath:{main:['B','F1','F2'], HEAD:['B','F1','F2']},
  refWin:{main:[.15,1.35], HEAD:[.15,1.35]} },

{ t:'Why rebase-then-merge stays linear',
  lede:'After a rebase, the merge is always a fast-forward.',
  story:`<p>Linear-history workflows rely on this: <a href="rebase.html">rebase</a> first, so your branch is strictly ahead and the merge reduces to a pointer slide. To record the fork anyway, <mark><code>git merge --no-ff</code> forces a real merge commit</mark> (see <a href="merge.html">merge</a>).</p>`,
  cmd:`$ git log --oneline
f3c56aa (HEAD -> main, feature) add sessions
e8127f4 add login form
b7a41d2 add config
a1f0c3e init: scaffold`,
  plumbing:null,
  present:['A','B','F1','F2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'F2', feature:'F2', head:{on:'main'}} },
],
commitNote(id,st,i){
  if(id==='B'&&i>=1)
    return `<p>Main's tip and the merge base at once, which is the coincidence that makes a fast-forward possible. Nothing on main needs preserving. It's all behind feature already.</p>`;
  return '';
},
refCards:{
  main:`<p>The only thing this whole operation changes: one pointer, sliding forward along commits that already existed. Its history afterward is exactly feature's history.</p>`,
  feature:`<p>Doesn't move at all. After the fast-forward both names point at F2. The branch is now fully merged and safe to delete.</p>`,
  HEAD:`<p>Attached to main throughout. It slides along with the fast-forward like any branch movement.</p>`,
},
refBlurbs:{
  main:'main: slides forward along existing commits; nothing else changes',
  feature:'feature: never moves; afterwards both names share one commit',
  HEAD:'HEAD: attached to main throughout',
},
};
})();
