/* reset — move a branch pointer; the commits stay where they are */
(function(){
window.VIZ={
meta:{name:'reset', title:'reset, rewound'},
branches:['main'],
legend:[['paper','history'],['amber','the commits you regret']],
commits:{
  A:  {code:'A',  sha:'a1f0c3e', msg:'init: scaffold',   parent:null, gx:0,  gy:2},
  B:  {code:'B',  sha:'b7a41d2', msg:'add config',       parent:'A',  gx:4,  gy:2},
  M1: {code:'M1', sha:'c9d3e8f', msg:'rewrite parser',   parent:'B',  gx:8,  gy:2, fam:'amber'},
  M2: {code:'M2', sha:'d40b91c', msg:'parser fixes',     parent:'M1', gx:12, gy:2, fam:'amber'},
},
steps:[
{ t:'Two commits you regret',
  lede:'main is four commits long, and the last two were a mistake.',
  story:`<p>The parser rewrite (M1) was a dead end and M2 tried to patch it up. You don't want revert commits piled on top — you want main to <mark>act like the last two never happened</mark>.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:['A','B','M1','M2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'M2', head:{on:'main'}},
  appear:{A:[0,.4],B:[.2,.6],M1:[.4,.8],M2:[.6,1]} },

{ t:'The ask: point me back there',
  lede:'Reset means: move my branch to this commit.',
  story:`<p>That's the entire command. A branch is a pointer, and reset <mark>re-points it — nothing else in history changes</mark>. The flags (<code>--soft</code>, <code>--mixed</code>, <code>--hard</code>) decide what happens to your files, not to the graph.</p>`,
  cmd:'$ git reset --hard b7a41d2',
  plumbing:`<pre># "back two commits" spellings that mean the same thing:
$ git reset --hard HEAD~2
$ git reset --hard b7a41d2</pre>`,
  present:['A','B','M1','M2'], dim:[], ghost:[], halo:['M1','M2'], notes:{B:'the target'},
  refs:{main:'M2', head:{on:'main'}} },

{ t:'The pointer walks back',
  lede:'main slides from M2 back to B; HEAD rides along.',
  story:`<p>No commit was edited or deleted — every sha on screen is unchanged. Git also notes where you were: <mark>ORIG_HEAD still names M2</mark>, so the move is reversible on the spot.</p>`,
  cmd:null,
  plumbing:`<pre># saved automatically before the move:
#   ORIG_HEAD -> d40b91c
# change your mind:
$ git reset --hard ORIG_HEAD</pre>`,
  present:['A','B','M1','M2'], dim:['M1','M2'], ghost:[], halo:[], notes:{B:'the target'},
  refs:{main:'B', head:{on:'main'}},
  refPath:{main:['M2','M1','B'], HEAD:['M2','M1','B']},
  refWin:{main:[.15,1.2], HEAD:[.15,1.2]} },

{ t:'The strays',
  lede:'M1 and M2 are unreachable — abandoned, not erased.',
  story:`<p>The same afterlife <a href="rebase.html">rebase</a> leaves behind: invisible to <code>git log</code>, alive in the reflog for ~90 days. <mark>Committed work is almost never truly lost</mark> — the reflog remembers where every ref has been.</p>`,
  cmd:null,
  plumbing:`<pre>$ git reflog main
b7a41d2 main@{0}: reset: moving to b7a41d2
d40b91c main@{1}: commit: parser fixes      # still here
$ git branch rescue d40b91c   # resurrect any time</pre>`,
  present:['A','B','M1','M2'], dim:[], ghost:['M1','M2'], halo:[], notes:{},
  refs:{main:'B', head:{on:'main'}},
  ghostWin:{M1:[.1,.9], M2:[.25,1.05]} },

{ t:'soft, mixed, hard',
  lede:'The graph move is identical — the flag picks what your files do.',
  story:`<p><code>--soft</code> keeps the undone work staged, <code>--mixed</code> (the default) keeps it in your files unstaged, <code>--hard</code> discards it. <mark>Only --hard can cost you uncommitted work</mark> — the committed kind is always in the reflog.</p>`,
  cmd:`             branch   index     working tree
--soft       moves    keeps     keeps
--mixed      moves    resets    keeps
--hard       moves    resets    resets`,
  plumbing:null,
  present:['A','B','M1','M2'], dim:[], ghost:['M1','M2'], halo:[], notes:{},
  refs:{main:'B', head:{on:'main'}} },
],
commitNote(id,st,i){
  if((id==='M1'||id==='M2')&&st.ghost.includes(id))
    return `<p>Unreachable, not deleted: no ref points here anymore, but the object is intact. <code>git branch rescue ${this.commits[id].sha}</code> brings it back until garbage collection (~90 days).</p>`;
  if(id==='B'&&i>=1)
    return `<p>The reset target — after the move, main says this is the newest thing that ever happened.</p>`;
  return '';
},
refCards:{
  main:`<p>Reset is the one command whose whole job is moving this pointer — anywhere, forward or back. The commits never move; reachability is what changes.</p>`,
  HEAD:`<p>Attached to main throughout — <code>git reset</code> moves the branch and HEAD follows, unlike <code>git switch --detach</code>, which moves only HEAD.</p>`,
},
refBlurbs:{
  main:'main — reset re-points this, and only this',
  HEAD:'HEAD — attached; it follows main wherever reset points it',
},
};
})();
