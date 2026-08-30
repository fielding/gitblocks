/* basics — commits, branches, HEAD: the grammar everything else uses */
(function(){
window.VIZ={
meta:{name:'basics', title:'commits & branches'},
branches:['main','feature'],
legend:[['paper','main'],['blue','branch work']],
commits:{
  A: {code:'A', sha:'a1f0c3e', msg:'init: scaffold',  parent:null, gx:0, gy:2},
  B: {code:'B', sha:'b7a41d2', msg:'add config',      parent:'A',  gx:4, gy:2},
  F1:{code:'F1',sha:'e8127f4', msg:'add login form',  parent:'B',  gx:9, gy:8, fam:'blue'},
},
steps:[
{ t:'The first commit',
  lede:'A commit is a snapshot of everything, plus an arrow to what came before.',
  story:`<p>A is the root, the only commit with no arrow. The tag floating above it is main, <mark>a name pointing at one commit</mark>. HEAD marks where you're standing.</p>`,
  sub:'hover any block or tag to inspect it · → steps forward',
  cmd:'$ git init\n$ git commit -m "init: scaffold"',
  plumbing:null,
  present:['A'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'A', head:{on:'main'}},
  appear:{A:[.1,.6]},
  refWin:{main:[.5,1.05], HEAD:[.5,1.05]} },

{ t:'Committing moves your branch',
  lede:'B lands, and main slides forward to it on its own.',
  story:`<p>While HEAD is attached, every commit you make means <mark>the branch you're on moves with you</mark>. You didn't move main yourself. The commit did.</p>`,
  cmd:'$ git commit -m "add config"',
  plumbing:`<pre>$ git cat-file -p HEAD
tree 2c7e50d…       # the snapshot
parent a1f0c3e      # the arrow
author you …
committer you …

add config</pre>`,
  present:['A','B'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', head:{on:'main'}},
  appear:{B:[.1,.7]},
  refWin:{main:[.5,1.1], HEAD:[.5,1.1]} },

{ t:'A branch costs nothing',
  lede:'feature is a second name for the same commit. Nothing was copied.',
  story:`<p>Both tags point at B. Git wrote a 41-byte file, and that's the whole branch. HEAD hops onto feature, so <mark>your next commit will move feature and leave main alone</mark>.</p>`,
  cmd:'$ git switch -c feature',
  plumbing:`<pre>$ cat .git/refs/heads/feature
b7a41d2…    # a branch is literally just this</pre>`,
  present:['A','B'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', feature:'B', head:{on:'feature'}},
  refWin:{HEAD:[.1,.55], feature:[.5,1]} },

{ t:'Work lands where HEAD rides',
  lede:'F1 grows from B and feature follows it. main hasn’t budged.',
  story:`<p>The lanes are just drawing. F1 isn't "inside" feature: <mark>a commit belongs to every branch that can reach it</mark>, and "being on a branch" only means a name points your way.</p>`,
  cmd:'$ git commit -m "add login form"',
  plumbing:null,
  present:['A','B','F1'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', feature:'F1', head:{on:'feature'}},
  appear:{F1:[.1,.7]},
  refWin:{feature:[.5,1.1], HEAD:[.5,1.1]} },

{ t:'Switching is teleporting',
  lede:'HEAD hops back to main, and your files become B’s snapshot again.',
  story:`<p>Nothing about the graph changed. Switching only moves HEAD and rewrites your working files to match. <mark>Branches are cheap enough to make one per idea</mark>.</p>`,
  cmd:'$ git switch main',
  plumbing:null,
  present:['A','B','F1'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', feature:'F1', head:{on:'main'}},
  refWin:{HEAD:[.15,.85]} },

{ t:'You know the grammar now',
  lede:'Blocks never move and tags do. Everything else on this site is built from those two facts.',
  story:`<p>From here: <a href="fast-forward.html">fast-forward</a> (the simplest merge), then <a href="merge.html">merge</a>, then <a href="rebase.html">rebase</a>. Or skip straight to <a href="playground.html">the sandbox</a> and <mark>type these commands yourself</mark>.</p>`,
  cmd:`$ git log --oneline --all
e8127f4 (feature) add login form
b7a41d2 (HEAD -> main) add config
a1f0c3e init: scaffold`,
  plumbing:null,
  present:['A','B','F1'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', feature:'F1', head:{on:'main'}} },
],
commitNote(id,st,i){
  if(id==='A')return `<p>The root commit, the one with no parent arrow. Every other commit in every animation ultimately points back here.</p>`;
  return '';
},
refCards:{
  main:`<p>The default branch. Nothing special about it beyond the name. It moves when you commit while HEAD is attached to it, and only then.</p>`,
  feature:`<p>Born as a 41-byte pointer to B. It "contains" whatever commits can be reached walking backwards from wherever it points.</p>`,
  HEAD:`<p>Where you are. Attached to a branch, it drags that branch along with each commit. That one rule explains most of git.</p>`,
},
refBlurbs:{
  main:'main: a name pointing at one commit, nothing more',
  feature:'feature: a second name; branches are pointers, not folders',
  HEAD:'HEAD: where you are; commits land wherever it points',
},
};
})();
