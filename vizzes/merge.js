/* merge — one new commit with two parents; nothing rewritten */
(function(){
const ALL=['A','B','M1','M2','F1','F2'];
window.VIZ={
meta:{name:'merge', title:'merge, two parents'},
branches:['main','feature'],
legend:[['paper','history'],['blue','feature'],['sage','the merge commit']],
commits:{
  A:  {code:'A',  sha:'a1f0c3e', msg:'init: scaffold',  parent:null, gx:0,  gy:2},
  B:  {code:'B',  sha:'b7a41d2', msg:'add config',      parent:'A',  gx:4,  gy:2},
  M1: {code:'M1', sha:'c9d3e8f', msg:'fix flaky test',  parent:'B',  gx:8,  gy:2},
  M2: {code:'M2', sha:'d40b91c', msg:'bump deps',       parent:'M1', gx:12, gy:2},
  F1: {code:'F1', sha:'e8127f4', msg:'add login form',  parent:'B',  gx:9,  gy:8, fam:'blue'},
  F2: {code:'F2', sha:'f3c56aa', msg:'add sessions',    parent:'F1', gx:13, gy:8, fam:'blue'},
  M3: {code:'M3', sha:'9e442af', msg:"Merge branch 'feature'",   parent:'M2', parent2:'F2', gx:16, gy:2, fam:'sage'},
},
steps:[
{ t:'Two branches, one fork',
  lede:'The same divergence rebase starts from, seen from main this time.',
  story:`<p>feature grew F1 and F2 while main collected M1 and M2 (the <a href="rebase.html">rebase animation</a> builds this up step by step). Now you're integrating: HEAD is on main, and <mark>feature is ready to come in</mark>.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:ALL, dim:[], ghost:[], halo:[], notes:{B:'fork point'},
  refs:{main:'M2', feature:'F2', head:{on:'main'}},
  appear:{A:[0,.35],B:[.15,.5],M1:[.3,.65],M2:[.45,.8],F1:[.6,.95],F2:[.75,1.1]} },

{ t:'The ask',
  lede:'Merge means: make one commit that has both histories behind it.',
  story:`<p>Nothing gets copied and nothing gets a new hash. Git plans a single <mark>new commit with two parents</mark>: one line of descent back through main, one back through feature.</p>`,
  cmd:'$ git switch main\n$ git merge feature',
  plumbing:`<pre># fast-forward is impossible here: main has its own
# commits since B, so a real merge commit is needed.
# (when it isn't needed, see the fast-forward animation)</pre>`,
  sub:'faint dashed outline = where the merge commit will land',
  present:ALL, dim:[], ghost:[], halo:['M2','F2'], notes:{B:'merge base'},
  future:['M3'],
  refs:{main:'M2', feature:'F2', head:{on:'main'}} },

{ t:'Three points make a merge',
  lede:'Git compares both tips against the commit where they forked.',
  story:`<p>The merge base is B, the last commit both sides share. Git takes the diff B→M2 (ours) and the diff B→F2 (theirs) and combines them. <mark>Conflicts appear only where the two diffs touch the same lines</mark>.</p>`,
  cmd:null,
  plumbing:`<pre>$ git merge-base main feature
b7a41d2                        # B
# ours:   diff b7a41d2..d40b91c
# theirs: diff b7a41d2..f3c56aa
# combined tree -> the new commit's snapshot</pre>`,
  present:ALL, dim:[], ghost:[], halo:['M2','F2'], notes:{B:'merge base',M2:'ours',F2:'theirs'},
  future:['M3'],
  refs:{main:'M2', feature:'F2', head:{on:'main'}} },

{ t:'A commit with two parents',
  lede:'The combined result lands as M3: an ordinary commit, plus one extra parent.',
  story:`<p>Both torches land in one place: M3's snapshot holds the combined work, and its parent list holds <mark>both M2 and F2</mark>. Every commit that was ever on either branch is now reachable from here.</p>`,
  cmd:null,
  plumbing:`<pre>$ git cat-file -p 9e442af
tree    …combined snapshot…
parent  d40b91c              # ours
parent  f3c56aa              # theirs</pre>`,
  present:[...ALL,'M3'], dim:[], ghost:[], halo:[], notes:{M3:'two parents'},
  refs:{main:'M2', feature:'F2', head:{on:'main'}},
  packets:[{from:'M2', to:'M3', label:'ours',   win:[.15,1.05]},
           {from:'F2', to:'M3', label:'theirs', win:[.35,1.25]}],
  appear:{M3:[1.15,1.75]} },

{ t:'main moves up, feature stays',
  lede:'main advances to M3. feature still points exactly where it did.',
  story:`<p>No commit changed identity: every sha is the same as before the merge. <mark>Merge adds one commit and moves one pointer</mark>. No copies, no strays.</p>`,
  cmd:null,
  plumbing:`<pre>$ git update-ref refs/heads/main 9e442af
# feature is untouched; delete it when you're done:
$ git branch -d feature      # safe: fully merged</pre>`,
  present:[...ALL,'M3'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'M3', feature:'F2', head:{on:'main'}},
  refWin:{main:[.15,.85], HEAD:[.15,.85]} },

{ t:'History keeps the fork',
  lede:'The graph stays honest: you can still see there were two lines of work.',
  story:`<p>Compare the <a href="rebase.html">rebase</a> ending: <mark>merge keeps the true shape</mark>, at the cost of a busier graph. Rebase would have rewritten your commits to pretend you started from M2. Merge writes down what actually happened.</p>`,
  cmd:`$ git log --oneline --graph
*   9e442af (HEAD -> main) Merge branch 'feature'
|\\
| * f3c56aa (feature) add sessions
| * e8127f4 add login form
* | d40b91c bump deps
* | c9d3e8f fix flaky test
|/
* b7a41d2 add config
* a1f0c3e init: scaffold`,
  plumbing:null,
  present:[...ALL,'M3'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'M3', feature:'F2', head:{on:'main'}} },
],
commitNote(id,st,i){
  const C=this.commits;
  if(id==='M3')
    return `<p>The merge commit: an ordinary commit whose parent list has two entries: <code>${C.M2.sha}</code> from main's line and <code>${C.F2.sha}</code> from feature's. Walking history from here reaches every commit of both branches.</p>`;
  if(id==='B'&&i>=1)
    return `<p>The merge base: the last commit both branches share. Both sides' changes are measured against this point.</p>`;
  if(id==='M2'&&i>=1&&i<=3) return `<p>“Ours” is the tip of the branch you're standing on. It becomes the merge commit's first parent.</p>`;
  if(id==='F2'&&i>=1&&i<=3) return `<p>“Theirs” is the tip being merged in. It becomes the merge commit's second parent.</p>`;
  return '';
},
refCards:{
  main:`<p>The integrating branch. It moves once, at the very end, from M2 to the new merge commit. Everything else in the graph keeps its identity.</p>`,
  feature:`<p>Completely untouched by the merge: it still points at F2 afterward. That's why it's safe to <code>git branch -d feature</code> once merged: its commits are reachable from main.</p>`,
  HEAD:`<p>Attached to main the whole time. A merge never detaches HEAD. Even on conflict, you're still on your branch, fixing files.</p>`,
},
refBlurbs:{
  main:'main: moves once, to the merge commit at the end',
  feature:'feature: untouched by the merge; still points at F2',
  HEAD:'HEAD: attached to main throughout',
},
};
})();
