/* squash merge — all of a branch's changes as one plain commit, lineage dropped */
(function(){
const ALL=['A','B','M1','M2','F1','F2'];
window.VIZ={
meta:{name:'squash-merge', title:'squash merge, one commit'},
branches:['main','feature'],
legend:[['paper','history'],['blue','feature'],['peach','the squash commit']],
commits:{
  A: {code:'A', sha:'a1f0c3e', msg:'init: scaffold',            parent:null, gx:0,  gy:2},
  B: {code:'B', sha:'b7a41d2', msg:'add config',                parent:'A',  gx:4,  gy:2},
  M1:{code:'M1',sha:'c9d3e8f', msg:'fix flaky test',            parent:'B',  gx:8,  gy:2},
  M2:{code:'M2',sha:'d40b91c', msg:'bump deps',                 parent:'M1', gx:12, gy:2},
  F1:{code:'F1',sha:'e8127f4', msg:'add login form',            parent:'B',  gx:9,  gy:8, fam:'blue'},
  F2:{code:'F2',sha:'f3c56aa', msg:'add sessions',              parent:'F1', gx:13, gy:8, fam:'blue'},
  S: {code:'S', sha:'8f31b6d', msg:'add login + sessions (#42)',parent:'M2', gx:16, gy:2, fam:'peach'},
},
steps:[
{ t:'The PR is ready',
  lede:'The same divergence as merge, except you want main to gain exactly one commit.',
  story:`<p>This is GitHub's <em>“Squash and merge”</em> button. feature's commit-by-commit history mattered while you worked, but main doesn't need it. <mark>Squash keeps the changes and drops the history</mark>.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:ALL, dim:[], ghost:[], halo:[], notes:{B:'fork point'},
  refs:{main:'M2', feature:'F2', head:{on:'main'}},
  appear:{A:[0,.35],B:[.15,.5],M1:[.3,.65],M2:[.45,.8],F1:[.6,.95],F2:[.75,1.1]} },

{ t:'The ask',
  lede:'Apply everything feature did, as one plain working-tree change.',
  story:`<p>Unlike a real <a href="merge.html">merge</a>, this plans an ordinary commit with <mark>one parent and no link to feature</mark>. The second command is yours to run, because squash only stages the changes.</p>`,
  cmd:'$ git merge --squash feature\n$ git commit -m "add login + sessions (#42)"',
  plumbing:`<pre>Squash commit -- not updating HEAD
Automatic merge went well; stopped before committing as requested
# = apply diff b7a41d2..f3c56aa to the tree, stage it
# no merge state, no second parent, no record of feature</pre>`,
  sub:'faint dashed outline = where the squash commit will land',
  present:ALL, dim:[], ghost:[], halo:['F1','F2'], notes:{B:'fork point'},
  future:['S'],
  refs:{main:'M2', feature:'F2', head:{on:'main'}} },

{ t:'Two commits become one',
  lede:'S carries all of feature’s changes. Its parent list mentions only main.',
  story:`<p>Both patches land in a single block. Check its card: one parent. <mark>Git records no relationship to feature at all</mark>, which is the point, and also the reason for the next step.</p>`,
  cmd:null, plumbing:null,
  present:[...ALL,'S'], dim:[], ghost:[], halo:[], notes:{S:'feature, squashed'},
  refs:{main:'S', feature:'F2', head:{on:'main'}},
  packets:[{from:'F1', to:'S', label:'changes in F1', win:[.15,1.05]},
           {from:'F2', to:'S', label:'changes in F2', win:[.35,1.25]}],
  appear:{S:[1.15,1.75]},
  refWin:{main:[1.8,2.4], HEAD:[1.8,2.4]} },

{ t:'The dangling branch',
  lede:'feature still points at F2, and git can’t tell it was merged.',
  story:`<p><code>git branch -d feature</code> will refuse: it checks reachability, and F1/F2 aren't reachable from main. You know the work landed, so <mark>delete it with -D once squashed</mark>. A squashed branch left around shows up in later merges as duplicate changes.</p>`,
  cmd:null,
  plumbing:`<pre>$ git branch -d feature
error: the branch 'feature' is not fully merged
hint: If you are sure you want to delete it, run 'git branch -D feature'
$ git branch -D feature      # you are sure: it landed as 8f31b6d
Deleted branch feature (was f3c56aa).</pre>`,
  present:[...ALL,'S'], dim:['F1','F2'], ghost:[], halo:[], notes:{},
  refs:{main:'S', feature:'F2', head:{on:'main'}} },

{ t:'Three ways to land a branch',
  lede:'Merge, squash, rebase: same changes, three different histories.',
  story:`<p><a href="merge.html">Merge</a> keeps the true shape. Squash keeps one clean commit and loses the lineage. <a href="rebase.html">Rebase</a>-then-<a href="fast-forward.html">fast-forward</a> keeps every commit but rewrites them. All three land the same changes; <mark>they differ only in what history claims happened</mark>.</p>`,
  cmd:`merge       true shape       + full history    - busy graph
squash      one commit       + clean main      - lineage lost
rebase+ff   linear commits   + readable log    - new hashes`,
  plumbing:null,
  present:[...ALL,'S'], dim:['F1','F2'], ghost:[], halo:[], notes:{},
  refs:{main:'S', feature:'F2', head:{on:'main'}} },
],
commitNote(id,st,i){
  const C=this.commits;
  if(id==='S')
    return `<p>All of feature's work in one snapshot, but only one parent (<code>${C.M2.sha}</code>). Unlike a merge commit, nothing here points back at F1 or F2.</p>`;
  if((id==='F1'||id==='F2')&&st.present.includes('S')&&i>=2)
    return `<p>Its changes live on inside S, but git doesn't know that: no parent link records it. Reachable only through the doomed feature branch.</p>`;
  return '';
},
refCards:{
  main:`<p>Advances to the squash commit like any ordinary commit. main's history stays perfectly linear, which is what the button is selling.</p>`,
  feature:`<p>Untouched, and now a trap: git can't prove it merged, so it needs -D to delete, and re-merging it later means duplicate changes.</p>`,
  HEAD:`<p>Attached to main throughout. The squash ends in a normal commit that you make yourself.</p>`,
},
refBlurbs:{
  main:'main: gains one plain commit with feature’s changes',
  feature:'feature: untouched, unlinked, and ready to be deleted with -D',
  HEAD:'HEAD: attached to main throughout',
},
};
})();
