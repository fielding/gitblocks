/* fetch vs pull — the bookmark, the download, and the integrate */
(function(){
window.VIZ={
meta:{name:'fetch-pull', title:'fetch vs pull'},
branches:['main','origin/main'],
legend:[['paper','your history'],['sage','fetched from origin']],
commits:{
  A: {code:'A', sha:'a1f0c3e', msg:'init: scaffold', parent:null, gx:0,  gy:2},
  B: {code:'B', sha:'b7a41d2', msg:'add config',     parent:'A',  gx:4,  gy:2},
  R1:{code:'R1',sha:'c9d3e8f', msg:'fix flaky test', parent:'B',  gx:8,  gy:2, fam:'sage'},
  R2:{code:'R2',sha:'d40b91c', msg:'bump deps',      parent:'R1', gx:12, gy:2, fam:'sage'},
},
steps:[
{ t:'Your clone has a bookmark',
  lede:'origin/main is your last known position of the server — nothing more.',
  story:`<p>Two pointers on one commit: main is yours; origin/main is your <em>memory</em> of theirs. That memory updates <mark>only when you talk to the server</mark> — git never checks the network on its own.</p>`,
  sub:'dashed tag = remote-tracking ref, your bookmark of the server',
  cmd:null, plumbing:null,
  present:['A','B'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', 'origin/main':'B', head:{on:'main'}},
  appear:{A:[0,.4],B:[.25,.7]} },

{ t:'Meanwhile, on the server',
  lede:'Teammates pushed two commits. Your repo has no idea.',
  story:`<p>The faint outlines are real commits on origin that <mark>your clone hasn't heard about</mark>. Nothing on your screen is wrong — it's out of date, silently. This is how "git says I'm up to date" lies to you.</p>`,
  cmd:null,
  plumbing:`<pre># "up to date" means: up to date WITH YOUR BOOKMARK
$ git status
Your branch is up to date with 'origin/main'.
# ...which is itself out of date. fetch fixes the bookmark.</pre>`,
  present:['A','B'], dim:[], ghost:[], halo:[], notes:{},
  future:['R1','R2'],
  refs:{main:'B', 'origin/main':'B', head:{on:'main'}} },

{ t:'fetch: download, don’t touch',
  lede:'The new commits arrive; only the bookmark moves.',
  story:`<p>main didn't move. HEAD didn't move. Your files didn't change. <mark>Fetch is always safe</mark> — it downloads objects, advances origin/main, and that is the entire operation.</p>`,
  cmd:'$ git fetch',
  plumbing:`<pre>From github.com:you/repo
   b7a41d2..d40b91c  main -> origin/main
# now look before you leap:
$ git log --oneline main..origin/main
d40b91c bump deps
c9d3e8f fix flaky test</pre>`,
  present:['A','B','R1','R2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', 'origin/main':'R2', head:{on:'main'}},
  appear:{R1:[.15,.65], R2:[.55,1.05]},
  refPath:{'origin/main':['B','R1','R2']},
  refWin:{'origin/main':[.2,1.3]} },

{ t:'Integrate when ready',
  lede:'Here it’s a fast-forward: main slides up to the bookmark.',
  story:`<p>And that's all <mark>pull is: fetch + merge</mark>, run back to back (or fetch + rebase, with <code>pull.rebase</code>). Pull isn't a different kind of sync — it's this page without the pause in the middle.</p>`,
  cmd:'$ git merge origin/main',
  plumbing:`<pre>Updating b7a41d2..d40b91c
Fast-forward
# diverged instead? then this step is a real merge —
# or a rebase of your commits onto origin/main</pre>`,
  present:['A','B','R1','R2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'R2', 'origin/main':'R2', head:{on:'main'}},
  refPath:{main:['B','R1','R2'], HEAD:['B','R1','R2']},
  refWin:{main:[.15,1.2], HEAD:[.15,1.2]} },

{ t:'Why the pause matters',
  lede:'Fetch first lets you look before anything touches your work.',
  story:`<p>Pull mid-task can drop a merge — or conflicts — into your lap. Fetch never can. <mark>Fetch often, integrate deliberately</mark>; and set <code>pull.rebase = true</code> if you like your history linear.</p>`,
  cmd:`fetch          updates origin/main          always safe
merge / pull   moves main (+ your files)    do it on purpose`,
  plumbing:null,
  present:['A','B','R1','R2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'R2', 'origin/main':'R2', head:{on:'main'}} },
],
commitNote(id,st,i){
  if((id==='R1'||id==='R2'))
    return `<p>Written by a teammate, downloaded by fetch. It arrived as a normal commit object — "remote" is where it came from, not a property it keeps.</p>`;
  return '';
},
refCards:{
  main:`<p>Your branch. Fetch never touches it — it only moves when you merge, rebase, or pull (which is just those two commands in a trench coat).</p>`,
  'origin/main':`<p>A remote-tracking ref: read-only from your side, updated by fetch/pull/push. It's how git compares your position to the server's without a network call.</p>`,
  HEAD:`<p>Attached to main throughout — syncing is about the two branch pointers; HEAD just rides your side of it.</p>`,
},
refBlurbs:{
  main:'main — yours; only moves when you integrate',
  'origin/main':'origin/main — your bookmark of the server; fetch moves this',
  HEAD:'HEAD — attached to main throughout',
},
};
})();
