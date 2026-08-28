/* rebase — replay your commits on top of where main is now */
(function(){
const BASE=['A','B','M1','M2','F1','F2'];
window.VIZ={
meta:{name:'rebase', title:'rebase, replayed'},
branches:['main','feature'],
legend:[['paper','history'],['blue','your commits'],['rose','replayed copies']],
commits:{
  A:  {code:'A',  sha:'a1f0c3e', msg:'init: scaffold',  parent:null, gx:0,  gy:2},
  B:  {code:'B',  sha:'b7a41d2', msg:'add config',      parent:'A',  gx:4,  gy:2},
  M1: {code:'M1', sha:'c9d3e8f', msg:'fix flaky test',  parent:'B',  gx:8,  gy:2},
  M2: {code:'M2', sha:'d40b91c', msg:'bump deps',       parent:'M1', gx:12, gy:2},
  F1: {code:'F1', sha:'e8127f4', msg:'add login form',  parent:'B',  gx:9,  gy:8, fam:'blue'},
  F2: {code:'F2', sha:'f3c56aa', msg:'add sessions',    parent:'F1', gx:13, gy:8, fam:'blue'},
  F1p:{code:'F1′',sha:'91be07d', msg:'add login form',  parent:'M2', gx:16, gy:2, fam:'rose', copyOf:'F1'},
  F2p:{code:'F2′',sha:'7d20c4b', msg:'add sessions',    parent:'F1p',gx:20, gy:2, fam:'rose', copyOf:'F2'},
},
steps:[
{ t:'Just main',
  lede:'Every story starts on main: two commits, A and B.',
  story:`<p>main is <mark>a pointer to the newest commit</mark>, B, and nothing more. HEAD marks where you're standing. Each commit points back at its parent: the arrows are the history.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:['A','B'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', head:{on:'main'}},
  appear:{A:[0,.4],B:[.25,.7]} },

{ t:'You branch off',
  lede:'Creating a branch writes one small file. Nothing else happens.',
  story:`<p>feature is a second pointer to the same commit B. <mark>Nothing was copied</mark>. HEAD hops onto it, so your next commits will move feature and leave main alone.</p>`,
  cmd:'$ git switch -c feature',
  plumbing:`<pre># a branch is a 41-byte file:
$ cat .git/refs/heads/feature
b7a41d2…</pre>`,
  present:['A','B'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', feature:'B', head:{on:'feature'}},
  refWin:{HEAD:[.1,.55], feature:[.5,1]} },

{ t:'Your feature grows',
  lede:'Two commits later, feature points at F2.',
  story:`<p>Commits land wherever HEAD rides: F1 builds on B, F2 on F1, and <mark>committing moves the branch pointer with you</mark>. main hasn't budged from B.</p>`,
  cmd:'$ git commit -m "add login form"\n$ git commit -m "add sessions"',
  plumbing:null,
  present:['A','B','F1','F2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', feature:'F2', head:{on:'feature'}},
  appear:{F1:[.15,.65], F2:[.95,1.45]},
  refPath:{feature:['B','F1','F2'], HEAD:['B','F1','F2']},
  refWin:{feature:[.2,1.55], HEAD:[.2,1.55]} },

{ t:'Meanwhile, on main',
  lede:'While you worked, teammates landed M1 and M2 on main.',
  story:`<p>Their commits grow from B too, so now <mark>two histories grow from the same fork point</mark> and main's tip is no longer your base. Rebase exists to clean this up.</p>`,
  cmd:null,
  plumbing:`<pre>$ git log --oneline main..feature   # yours
f3c56aa add sessions
e8127f4 add login form
$ git log --oneline feature..main   # theirs
d40b91c bump deps
c9d3e8f fix flaky test</pre>`,
  present:BASE, dim:[], ghost:[], halo:[], notes:{B:'fork point'},
  refs:{main:'M2', feature:'F2', head:{on:'feature'}},
  appear:{M1:[.15,.65], M2:[.95,1.45]},
  refPath:{main:['B','M1','M2']},
  refWin:{main:[.2,1.55]} },

{ t:'The plan: replay, not move',
  lede:'“Rebase” means: replay my commits on top of where main is now.',
  story:`<p>Git finds the fork point (B), lists what's yours since then (F1, F2), and lines them up to replay onto main's tip (M2). <mark>Nothing has changed yet</mark>.</p>`,
  cmd:'$ git rebase main',
  plumbing:`<pre>$ git merge-base HEAD main
b7a41d2                        # B, the fork point
$ git rev-list --reverse main..HEAD
e8127f4                        # F1, replayed first
f3c56aa                        # F2, replayed second</pre>`,
  sub:'faint dashed outlines = where the copies will land',
  present:BASE, dim:[], ghost:[], halo:['F1','F2'], notes:{B:'fork point',M2:'new base'},
  future:['F1p','F2p'],
  refs:{main:'M2', feature:'F2', head:{on:'feature'}} },

{ t:'Rewind to the new base',
  lede:'Git starts by moving HEAD to main’s tip, detached.',
  story:`<p>HEAD now points at a commit instead of a branch. This is where the copies get built. <mark>feature hasn't moved</mark>, which is why <code>git rebase --abort</code> can always put things back.</p>`,
  cmd:null,
  plumbing:`<pre># equivalent of: git switch --detach main
# your old tip is saved first:
#   ORIG_HEAD -> f3c56aa   (and the reflog remembers too)</pre>`,
  present:BASE, dim:[], ghost:[], halo:['F1','F2'], notes:{M2:'new base'},
  future:['F1p','F2p'],
  refs:{main:'M2', feature:'F2', head:{at:'M2'}},
  refWin:{HEAD:[.15,.85]} },

{ t:'Replay F1 → F1′',
  lede:'Git takes what F1 changed and applies it on top of M2.',
  story:`<p>The result is a brand-new commit, F1′: same changes, same message, different parent. A commit's id hashes its content and its history, so <mark>F1′ gets a new hash</mark>. F1 is untouched.</p>`,
  cmd:null,
  plumbing:`<pre># each replay ≈ a cherry-pick:
#   diff(B→F1) applied onto d40b91c (M2)
#   committed with F1's stored message & author
#   -> new object, new sha: 91be07d</pre>`,
  present:[...BASE,'F1p'], dim:['F1'], ghost:[], halo:['F2'], notes:{F1p:'copy of F1'},
  future:['F2p'],
  refs:{main:'M2', feature:'F2', head:{at:'F1p'}},
  packet:{from:'F1', to:'F1p', label:'changes in F1', win:[.15,1.15]},
  appear:{F1p:[1.05,1.65]},
  refWin:{HEAD:[1.6,2.2]} },

{ t:'Replay F2 → F2′',
  lede:'Same move for F2, this time on top of F1′.',
  story:`<p>Replays happen <mark>oldest first, one commit at a time</mark>. Conflicts show up here, when an old patch no longer fits the new base: fix the files, <code>git add</code> them, <code>git rebase --continue</code>.</p>`,
  cmd:null,
  plumbing:`<pre># on conflict, rebase stops mid-replay:
#   fix files -> git add -> git rebase --continue
#   or bail out completely: git rebase --abort</pre>`,
  present:[...BASE,'F1p','F2p'], dim:['F1','F2'], ghost:[], halo:[], notes:{F2p:'copy of F2'},
  refs:{main:'M2', feature:'F2', head:{at:'F2p'}},
  packet:{from:'F2', to:'F2p', label:'changes in F2', win:[.15,1.15]},
  appear:{F2p:[1.05,1.65]},
  refWin:{HEAD:[1.6,2.2]} },

{ t:'feature catches up',
  lede:'Only now does the feature pointer move, straight to F2′.',
  story:`<p>Rebase finishes by pointing feature at the last copy and reattaching HEAD. <mark>main was never touched</mark>: rebase rewrites the branch you're on and nothing else.</p>`,
  cmd:null,
  plumbing:`<pre>$ git update-ref refs/heads/feature 7d20c4b
$ git symbolic-ref HEAD refs/heads/feature</pre>`,
  present:[...BASE,'F1p','F2p'], dim:['F1','F2'], ghost:[], halo:[], notes:{},
  refs:{main:'M2', feature:'F2p', head:{on:'feature'}},
  refWin:{feature:[.15,.85], HEAD:[.85,1.45]} },

{ t:'The strays',
  lede:'F1 and F2 still exist. No ref can reach them anymore.',
  story:`<p>No ref points at them, so they vanish from <code>git log</code>. The reflog remembers them for about 90 days, and <code>git branch rescue f3c56aa</code> would resurrect them any time before then. <mark>Rebase never edits or deletes old commits</mark>, it strands them.</p>`,
  cmd:null,
  plumbing:`<pre>$ git reflog feature
7d20c4b feature@{0}: rebase (finish)
f3c56aa feature@{1}: commit: add sessions   # still here</pre>`,
  present:[...BASE,'F1p','F2p'], dim:[], ghost:['F1','F2'], halo:[], notes:{},
  refs:{main:'M2', feature:'F2p', head:{on:'feature'}},
  ghostWin:{F1:[.1,.9], F2:[.25,1.05]} },

{ t:'A straight line',
  lede:'History now reads as if you’d started from M2 all along.',
  story:`<p>The trade is a linear story in exchange for new hashes, and it's where the golden rule comes from. <mark>Never rebase commits somebody else already has</mark>: their clones still hold F1 and F2, and your copies look like strangers next to them.</p>`,
  cmd:`$ git log --oneline
7d20c4b (HEAD -> feature) add sessions
91be07d add login form
d40b91c (main) bump deps
c9d3e8f fix flaky test
b7a41d2 add config
a1f0c3e init: scaffold`,
  plumbing:null,
  present:[...BASE,'F1p','F2p'], dim:[], ghost:['F1','F2'], halo:[], notes:{},
  refs:{main:'M2', feature:'F2p', head:{on:'feature'}} },
],
commitNote(id,st,i){
  const C=this.commits;
  if(st.dim.includes(id)&&st.present.includes(id+'p'))
    return `<p>Already replayed as ${C[id+'p'].code} (<code>${C[id+'p'].sha}</code>). This original is fully intact. Rebase never touched it.</p>`;
  if(id==='B'&&i>=3)
    return `<p>The merge-base: the last commit main and feature share. Rebase replays everything after this point.</p>`;
  if(id==='M2'&&!st.ghost.includes(id))
    return `<p>The tip of main, the base the copies are built on. main itself never moves during the whole rebase.</p>`;
  return '';
},
refCards:{
  main:`<p>A branch is just a name pointing at one commit, a 41-byte file at <code>.git/refs/heads/main</code>. Watch it through the whole rebase: it never moves, because rebase only ever rewrites the branch you're standing on.</p>`,
  feature:`<p>Your branch. It stays put through the detach and both replays, and only jumps to the last copy at the very end, which is why <code>git rebase --abort</code> is always safe until then.</p>`,
  HEAD:`<p>HEAD is “where you are.” Normally it's attached to a branch, and committing moves that branch. During a rebase it detaches and rides along the copies as they're built, reattaching to your branch at the end.</p>`,
},
refBlurbs:{
  main:'main: a branch is just a movable pointer to one commit',
  feature:'feature: your branch: a pointer that only moves at the very end',
  HEAD:'HEAD: where you are; detached = pointing at a commit, not a branch',
},
};
})();
