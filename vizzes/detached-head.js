/* detached HEAD — time travel, safely */
(function(){
window.VIZ={
meta:{name:'detached-head', title:'detached HEAD, time travel'},
branches:['main','experiment'],
legend:[['paper','history'],['sage','made while detached']],
commits:{
  A: {code:'A', sha:'a1f0c3e', msg:'init: scaffold', parent:null, gx:0,  gy:2},
  B: {code:'B', sha:'b7a41d2', msg:'add config',     parent:'A',  gx:4,  gy:2},
  M1:{code:'M1',sha:'c9d3e8f', msg:'fix flaky test', parent:'B',  gx:8,  gy:2},
  M2:{code:'M2',sha:'d40b91c', msg:'bump deps',      parent:'M1', gx:12, gy:2},
  E1:{code:'E1',sha:'a77c3d9', msg:'try an idea',    parent:'B',  gx:10, gy:6, fam:'sage'},
},
steps:[
{ t:'Something worth revisiting',
  lede:'Four commits of history — and a question about how B behaved.',
  story:`<p>Maybe a bug appeared somewhere after B, maybe you're just curious what the old version did. Either way you want to <mark>stand in the past for a while</mark> — without disturbing the present.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:['A','B','M1','M2'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'M2', head:{on:'main'}},
  appear:{A:[0,.35],B:[.15,.5],M1:[.3,.65],M2:[.45,.8]} },

{ t:'Visiting the past',
  lede:'HEAD moves to B — alone. main stays where it was.',
  story:`<p>This is the state git warns you about in scary all-caps. All it means: <mark>HEAD points at a commit instead of a branch</mark>. Nothing is broken; you've stepped off the timeline to look around.</p>`,
  cmd:'$ git switch --detach b7a41d2',
  plumbing:`<pre>You are in 'detached HEAD' state. You can look around, make
experimental changes and commit them...
# git's scariest message, translated:
#   "no branch will follow you here"</pre>`,
  present:['A','B','M1','M2'], dim:[], ghost:[], halo:[], notes:{B:'you are here'},
  refs:{main:'M2', head:{at:'B'}},
  refWin:{HEAD:[.15,.95]},
  refPath:{HEAD:['M2','M1','B']} },

{ t:'Look around — everything works',
  lede:'Your files are exactly as they were at B.',
  story:`<p>Build it, run the tests, bisect a bug, read old code — visiting is the whole point. Looking is completely safe: <mark>a checkout never changes history</mark>, only your working tree.</p>`,
  cmd:null, plumbing:null,
  present:['A','B','M1','M2'], dim:[], ghost:[], halo:[], notes:{B:'you are here'},
  refs:{main:'M2', head:{at:'B'}} },

{ t:'Committing while detached',
  lede:'The commit works — but no branch moves with you.',
  story:`<p>E1's parent is B, and HEAD rides along as always. But look at the tags: <mark>no branch points at E1</mark>. It belongs to nobody — reachable only through HEAD itself.</p>`,
  cmd:'$ git commit -m "try an idea"',
  plumbing:null,
  present:['A','B','M1','M2','E1'], dim:[], ghost:[], halo:[], notes:{E1:'no branch owns this'},
  refs:{main:'M2', head:{at:'E1'}},
  appear:{E1:[.15,.75]},
  refWin:{HEAD:[.6,1.2]} },

{ t:'Name it before you leave',
  lede:'A branch is born at E1; HEAD attaches. The work is safe.',
  story:`<p>Had you switched back to main first, E1 would've become a stray the moment HEAD left — findable in the reflog, invisible everywhere else. <mark>One cheap pointer makes it permanent</mark>.</p>`,
  cmd:'$ git switch -c experiment',
  plumbing:`<pre># forgot, and already left? the reflog has you:
$ git reflog | head -2
d40b91c HEAD@{0}: checkout: moving to main
a77c3d9 HEAD@{1}: commit: try an idea
$ git branch experiment a77c3d9</pre>`,
  present:['A','B','M1','M2','E1'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'M2', experiment:'E1', head:{on:'experiment'}},
  refWin:{experiment:[.15,.7], HEAD:[.6,1.15]} },

{ t:'Back to the present',
  lede:'HEAD flies home; experiment holds the idea.',
  story:`<p>That's the whole lifecycle: detach to visit, commit if inspiration strikes, <mark>name it if it's worth keeping</mark>, switch back. The past is a fine place to visit — you just don't live there.</p>`,
  cmd:'$ git switch main',
  plumbing:null,
  present:['A','B','M1','M2','E1'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'M2', experiment:'E1', head:{on:'main'}},
  refWin:{HEAD:[.15,.9]} },
],
commitNote(id,st,i){
  if(id==='E1'&&!st.refs.experiment)
    return `<p>A perfectly normal commit with no branch pointing at it. If HEAD leaves now, only the reflog remembers it exists.</p>`;
  if(id==='E1')
    return `<p>Safe now — the experiment branch owns it. Made from a detached HEAD, kept by an ordinary pointer.</p>`;
  if(id==='B'&&i<=2)
    return `<p>An ordinary old commit — being visited doesn't change it. Detached just means HEAD names this commit directly.</p>`;
  return '';
},
refCards:{
  main:`<p>Completely unaffected by the whole trip — detaching, committing, and returning never moved it. Branches only move when you commit while attached to them.</p>`,
  experiment:`<p>Born in step 4 with <code>git switch -c</code> — a 41-byte pointer that turns an orphan commit into a keeper.</p>`,
  HEAD:`<p>The traveler. Attached, it drags a branch along with every commit; detached, it walks alone and anything it builds needs naming before it leaves.</p>`,
},
refBlurbs:{
  main:'main — never moves during the whole trip',
  experiment:'experiment — the pointer that saves the detached work',
  HEAD:'HEAD — detached: pointing straight at a commit, no branch attached',
},
};
})();
