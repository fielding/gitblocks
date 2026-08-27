/* revert — undo forward: a new commit that inverts an old one */
(function(){
window.VIZ={
meta:{name:'revert', title:'revert, undo forward'},
branches:['main'],
legend:[['paper','history'],['amber','the bad commit'],['sage','the antidote']],
commits:{
  A: {code:'A', sha:'a1f0c3e', msg:'init: scaffold',          parent:null, gx:0,  gy:2},
  B: {code:'B', sha:'b7a41d2', msg:'add config',              parent:'A',  gx:4,  gy:2},
  M1:{code:'M1',sha:'c9d3e8f', msg:'rewrite parser',          parent:'B',  gx:8,  gy:2, fam:'amber'},
  M2:{code:'M2',sha:'d40b91c', msg:'add docs',                parent:'M1', gx:12, gy:2},
  R: {code:'R', sha:'b52f7c1', msg:'revert "rewrite parser"', parent:'M2', gx:16, gy:2, fam:'sage'},
},
steps:[
{ t:'A bad commit, already shared',
  lede:'M1 broke things — and teammates already pulled it.',
  story:`<p>You could <a href="reset.html">reset</a> past it, but M1 left your machine days ago; rewinding now would strand everyone who built on it. <mark>Shared history can't be rewound</mark> — only added to.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:['A','B','M1','M2'], dim:[], ghost:[], halo:[], notes:{M1:'the bad one'},
  refs:{main:'M2', head:{on:'main'}},
  appear:{A:[0,.4],B:[.2,.6],M1:[.4,.8],M2:[.6,1]} },

{ t:'The ask: undo forward',
  lede:'Make a new commit whose changes are the exact inverse of M1’s.',
  story:`<p>Git computes M1's patch and flips it — every add becomes a delete, every delete an add — then applies that to your tip like any other change. <mark>An antidote, not an eraser</mark>.</p>`,
  cmd:'$ git revert c9d3e8f',
  plumbing:`<pre># the unit is a patch, applied backwards:
#   patch = diff b7a41d2..c9d3e8f   (M1)
#   applied in reverse onto d40b91c
# conflicts work like any replay:
#   fix -> git add -> git revert --continue</pre>`,
  sub:'faint dashed outline = where the antidote will land',
  present:['A','B','M1','M2'], dim:[], ghost:[], halo:['M1'], notes:{M1:'the bad one'},
  future:['R'],
  refs:{main:'M2', head:{on:'main'}} },

{ t:'The inverse patch lands',
  lede:'R undoes M1, three commits later.',
  story:`<p>Same replay machinery as <a href="cherry-pick.html">cherry-pick</a>, just backwards. main and HEAD advance to R like any ordinary commit — <mark>nothing detaches and nothing rewinds</mark>.</p>`,
  cmd:null, plumbing:null,
  present:['A','B','M1','M2','R'], dim:[], ghost:[], halo:[], notes:{R:'undoes M1'},
  refs:{main:'R', head:{on:'main'}},
  packet:{from:'M1', to:'R', label:'inverse of M1', win:[.15,1.15]},
  appear:{R:[1.05,1.65]},
  refWin:{main:[1.6,2.2], HEAD:[1.6,2.2]} },

{ t:'History tells the truth',
  lede:'The mistake and the fix are both on the record — nothing ghosts out.',
  story:`<p>Compare with <a href="reset.html">reset</a>'s strays: here every commit stays reachable. Anyone who pulled M1 just pulls R on top — <mark>nothing anyone has was rewritten</mark>.</p>`,
  cmd:`$ git log --oneline
b52f7c1 (HEAD -> main) revert "rewrite parser"
d40b91c add docs
c9d3e8f rewrite parser
b7a41d2 add config
a1f0c3e init: scaffold`,
  plumbing:null,
  present:['A','B','M1','M2','R'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'R', head:{on:'main'}} },

{ t:'reset or revert?',
  lede:'One rule of thumb covers it.',
  story:`<p><mark>Private history → reset. Shared history → revert.</mark> Reset makes the past prettier; revert makes the present correct. When in doubt, revert — it's the one that never breaks anybody else.</p>`,
  cmd:`reset    moves your branch pointer     private branches
revert   adds an inverse commit        anything shared`,
  plumbing:null,
  present:['A','B','M1','M2','R'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'R', head:{on:'main'}} },
],
commitNote(id,st,i){
  const C=this.commits;
  if(id==='R')
    return `<p>An ordinary commit whose diff is M1's (<code>${C.M1.sha}</code>) inverted. One parent, normal hash rules — the "undo" lives entirely in its content.</p>`;
  if(id==='M1')
    return `<p>Still fully reachable and unchanged — revert never touches the original. History shows the mistake honestly, then shows it fixed.</p>`;
  return '';
},
refCards:{
  main:`<p>Advances by one commit, exactly as if you'd made any other change. Revert is the undo that works entirely inside git's normal rules.</p>`,
  HEAD:`<p>Attached to main throughout — a revert is just "apply this inverse patch, then commit here."</p>`,
},
refBlurbs:{
  main:'main — advances to the antidote commit; nothing rewinds',
  HEAD:'HEAD — attached to main throughout',
},
};
})();
