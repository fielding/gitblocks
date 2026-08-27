/* interactive rebase — squash the mess before anyone sees it */
(function(){
window.VIZ={
meta:{name:'interactive-rebase', title:'interactive rebase, tidied'},
branches:['main','feature'],
legend:[['paper','history'],['blue','the messy branch'],['rose','the squashed commit']],
commits:{
  A: {code:'A', sha:'a1f0c3e', msg:'init: scaffold',  parent:null, gx:0,  gy:2},
  B: {code:'B', sha:'b7a41d2', msg:'add config',      parent:'A',  gx:4,  gy:2},
  F1:{code:'F1',sha:'e8127f4', msg:'wip: login form', parent:'B',  gx:9,  gy:8, fam:'blue'},
  F2:{code:'F2',sha:'2b44c1e', msg:'more wip',        parent:'F1', gx:13, gy:8, fam:'blue'},
  F3:{code:'F3',sha:'77d05af', msg:'fix typo',        parent:'F2', gx:17, gy:8, fam:'blue'},
  SQ:{code:'S′',sha:'51f3a2b', msg:'add login form',  parent:'B',  gx:8,  gy:2, fam:'rose'},
},
steps:[
{ t:'A messy branch',
  lede:'Three commits of wip — one actual feature.',
  story:`<p>The history you make while working isn't the history worth keeping. Before this branch goes anywhere public, <mark>the mess is yours to rewrite</mark> — nobody else has these commits yet.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:['A','B','F1','F2','F3'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'B', feature:'F3', head:{on:'feature'}},
  appear:{A:[0,.3],B:[.15,.45],F1:[.3,.6],F2:[.45,.75],F3:[.6,.9]} },

{ t:'The todo list',
  lede:'Interactive rebase hands you the replay plan as a text file.',
  story:`<p>Every line is a commit, oldest first; every verb an instruction. Change the verbs, save, quit — <mark>the todo list is the plan</mark>, and git executes it top to bottom.</p>`,
  cmd:'$ git rebase -i main',
  plumbing:`<pre>pick   e8127f4 wip: login form
squash 2b44c1e more wip
squash 77d05af fix typo

# other verbs: reword, edit, drop —
# and reordering lines reorders history</pre>`,
  sub:'faint dashed outline = where the squashed commit will land',
  present:['A','B','F1','F2','F3'], dim:[], ghost:[], halo:['F1','F2','F3'], notes:{},
  future:['SQ'],
  refs:{main:'B', feature:'F3', head:{on:'feature'}} },

{ t:'Three become one',
  lede:'The replays fold into a single new commit on top of main.',
  story:`<p>Each <code>squash</code> melds a commit into the one before it, and you write one message for the result. <mark>New commit, new hash, clean story</mark> — the same rules as every rebase.</p>`,
  cmd:null, plumbing:null,
  present:['A','B','F1','F2','F3','SQ'], dim:['F1','F2','F3'], ghost:[], halo:[], notes:{SQ:'all three, squashed'},
  refs:{main:'B', feature:'F3', head:{at:'SQ'}},
  packets:[{from:'F1', to:'SQ', label:'wip: login form', win:[.15,.95]},
           {from:'F2', to:'SQ', label:'more wip',        win:[.4,1.2]},
           {from:'F3', to:'SQ', label:'fix typo',        win:[.65,1.45]}],
  appear:{SQ:[1.35,1.95]},
  refWin:{HEAD:[1.9,2.5]} },

{ t:'feature catches up; the mess ghosts out',
  lede:'The pointer jumps; the wip commits become strays.',
  story:`<p>The published history will say you wrote it clean on the first try. The reflog knows better, for ~90 days. <mark>Tidy before sharing, never after</mark> — after, it's the golden rule again.</p>`,
  cmd:null,
  plumbing:`<pre>$ git reflog feature
51f3a2b feature@{0}: rebase -i (finish)
77d05af feature@{1}: commit: fix typo    # all still here</pre>`,
  present:['A','B','F1','F2','F3','SQ'], dim:[], ghost:['F1','F2','F3'], halo:[], notes:{},
  refs:{main:'B', feature:'SQ', head:{on:'feature'}},
  refWin:{feature:[.15,.85], HEAD:[.85,1.45]},
  ghostWin:{F1:[.9,1.7], F2:[1.05,1.85], F3:[1.2,2]} },

{ t:'The daily driver',
  lede:'This is the rebase people actually run every day.',
  story:`<p>Squash the wip, reword the message, drop the debug commit, reorder the fix before the feature. <mark>rebase -i is a history editor</mark> — the same replay engine with you in the director's chair.</p>`,
  cmd:`$ git log --oneline
51f3a2b (HEAD -> feature) add login form
b7a41d2 (main) add config
a1f0c3e init: scaffold`,
  plumbing:null,
  present:['A','B','F1','F2','F3','SQ'], dim:[], ghost:['F1','F2','F3'], halo:[], notes:{},
  refs:{main:'B', feature:'SQ', head:{on:'feature'}} },
],
commitNote(id,st,i){
  const C=this.commits;
  if(id==='SQ')
    return `<p>One commit carrying all three patches, with the message you chose at the end. Its parent is main's tip — the wip history is simply not part of its ancestry.</p>`;
  if((id==='F1'||id==='F2'||id==='F3')&&st.present.includes('SQ'))
    return `<p>Folded into ${C.SQ.code} (<code>${C.SQ.sha}</code>) along with its siblings. The original survives only as reflog history.</p>`;
  return '';
},
refCards:{
  main:`<p>The base of the replay — untouched, as always. Interactive rebase rewrites your side only.</p>`,
  feature:`<p>Ends the day three commits shorter and one commit better. It only moves at the finish, so --abort is safe right up until then.</p>`,
  HEAD:`<p>Detaches and follows the todo list as git executes it — with squashes, it pauses for you to write the combined message.</p>`,
},
refBlurbs:{
  main:'main — the replay base; never moves',
  feature:'feature — jumps to the tidied commit at the end',
  HEAD:'HEAD — detached, executing the todo list',
},
};
})();
