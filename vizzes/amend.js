/* amend — replace the tip with a corrected copy */
(function(){
window.VIZ={
meta:{name:'amend', title:'amend, replaced'},
branches:['main'],
legend:[['paper','history'],['blue','the tip you just made'],['rose','its replacement']],
commits:{
  A:  {code:'A',  sha:'a1f0c3e', msg:'init: scaffold', parent:null, gx:0, gy:2},
  B:  {code:'B',  sha:'b7a41d2', msg:'add config',     parent:'A',  gx:4, gy:2},
  T1: {code:'T1', sha:'e8127f4', msg:'add login form', parent:'B',  gx:8, gy:2, fam:'blue'},
  T1p:{code:'T1′',sha:'3d90f2a', msg:'add login form', parent:'B',  gx:10,gy:6, fam:'rose', copyOf:'T1'},
},
steps:[
{ t:'One commit too soon',
  lede:'You just committed the login form and forgot the stylesheet.',
  story:`<p>The commit is fine, just incomplete, and it hasn't left your machine. A "fix: add forgotten file" commit would work, but <mark>amend can make it as if you never forgot</mark>.</p>`,
  sub:'tags float above the commit they point to',
  cmd:null, plumbing:null,
  present:['A','B','T1'], dim:[], ghost:[], halo:[], notes:{},
  refs:{main:'T1', head:{on:'main'}},
  appear:{A:[0,.4],B:[.25,.65],T1:[.5,.9]} },

{ t:'The ask',
  lede:'Amend builds a replacement tip rather than editing the old one.',
  story:`<p>Git takes T1's changes plus what you just staged and writes a brand-new commit with <mark>the same parent as T1</mark>. Editing in place is impossible, because the content is part of the hash.</p>`,
  cmd:'$ git add style.css\n$ git commit --amend',
  plumbing:`<pre># message-only fix:  git commit --amend -m "better words"
# keep the message:  git commit --amend --no-edit</pre>`,
  sub:'faint dashed outline = where the replacement will land',
  present:['A','B','T1'], dim:[], ghost:[], halo:['T1'], notes:{},
  future:['T1p'],
  refs:{main:'T1', head:{on:'main'}} },

{ t:'Replace, don’t edit',
  lede:'T1′ lands beside T1 with the same parent and a new hash.',
  story:`<p>main and HEAD jump straight across. Nothing was ever "modified." <mark>Amend is a one-commit rebase</mark> whose new base happens to equal the old one.</p>`,
  cmd:null, plumbing:null,
  present:['A','B','T1','T1p'], dim:['T1'], ghost:[], halo:[], notes:{T1p:'copy of T1, completed'},
  refs:{main:'T1p', head:{on:'main'}},
  packet:{from:'T1', to:'T1p', label:'changes + the fix', win:[.15,1.05]},
  appear:{T1p:[.95,1.55]},
  refWin:{main:[1.5,2.1], HEAD:[1.5,2.1]} },

{ t:'The old tip is a stray',
  lede:'T1 is unreachable. The reflog keeps it for about 90 days.',
  story:`<p>The rule that follows: <mark>never amend a commit you've pushed</mark>. Teammates would hold T1 while you hold T1′, the same split <a href="rebase.html">rebase</a>'s golden rule warns about, one commit big.</p>`,
  cmd:`$ git log --oneline
3d90f2a (HEAD -> main) add login form
b7a41d2 add config
a1f0c3e init: scaffold`,
  plumbing:`<pre>$ git reflog main
3d90f2a main@{0}: commit (amend): add login form
e8127f4 main@{1}: commit: add login form   # still here</pre>`,
  present:['A','B','T1','T1p'], dim:[], ghost:['T1'], halo:[], notes:{},
  refs:{main:'T1p', head:{on:'main'}},
  ghostWin:{T1:[.1,.9]} },
],
commitNote(id,st,i){
  const C=this.commits;
  if(id==='T1'&&st.present.includes('T1p'))
    return `<p>The abandoned original. It shares a parent with its replacement: amend doesn't stack a fix on top, it starts over from the same spot.</p>`;
  return '';
},
refCards:{
  main:`<p>Jumps sideways, not forward: from the old tip to its replacement. History length is unchanged, which is the whole appeal.</p>`,
  HEAD:`<p>Attached to main throughout. The amend commits directly on your branch.</p>`,
},
refBlurbs:{
  main:'main: jumps sideways to the replacement tip',
  HEAD:'HEAD: attached to main throughout',
},
};
})();
