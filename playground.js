/* playground — an open-ended git sandbox: type commands, watch the blocks.
   The repo model is deterministic, so a session replays exactly from its
   command list — which is how ?s= share links work. */
(function(){
'use strict';

/* ---------- state ---------- */
let repo={
  commits:{A:{parents:[]}, B:{parents:['A']}},
  branches:{main:'B'},
  tags:{},
  head:{on:'main'},
};
let meta={A:{depth:0,lane:0}, B:{depth:1,lane:0}};
let children={A:1,B:0};
let branchLane={main:0}, laneOwner={0:'main'}, occupied={'0:0':1,'1:0':1};
let nextLane=1, seq=0, shaN=0;
const hist=[];        // undo snapshots
const cmdHistory=[];  // mutating commands (the shareable session)
const typed=[];       // everything typed (for arrow-key recall)
let replaying=false;

const V={
  meta:{name:'playground', title:'the sandbox'},
  branches:['main'],
  legend:[['paper','main'],['blue','branch work'],['rose','rewritten'],['sage','merges & reverts'],['peach','picked & squashed']],
  liveTerm:true,
  commits:{
    A:{code:'A',sha:'a1f0c3e',msg:'init: scaffold',parent:null,gx:0,gy:2},
    B:{code:'B',sha:'b7a41d2',msg:'add config',parent:'A',gx:4,gy:2},
  },
  steps:[{
    t:'The sandbox',
    lede:'A live repo — type git commands in the terminal and watch the blocks.',
    story:`<p>Two commits, one branch, HEAD attached: the same world every animation starts from, now yours to drive. <mark>Type <code>help</code> below</mark> to see what this sandbox speaks, and <code>share</code> to copy a link that replays your whole session.</p>`,
    cmd:null, plumbing:null,
    present:['A','B'], dim:[], ghost:[], halo:[], notes:{},
    refs:{main:'B', head:{on:'main'}},
    appear:{A:[0,.4],B:[.25,.7]},
  }],
  refBlurbs:{HEAD:'HEAD — where you are; commits land wherever it points'},
  commitNote(id){ return ''; },
};
window.VIZ=V;

/* ---------- repo helpers ---------- */
const parentsOf=id=>repo.commits[id].parents;
const headTarget=()=>repo.head.on?repo.branches[repo.head.on]:repo.head.at;
function reachableFrom(starts){
  const seen=new Set(), q=[...starts];
  while(q.length){const id=q.pop(); if(!id||seen.has(id))continue; seen.add(id); q.push(...parentsOf(id));}
  return seen;
}
const isAncestor=(a,b)=>reachableFrom([b]).has(a);
function unreachableIds(){
  const tips=[...Object.values(repo.branches), ...Object.values(repo.tags), headTarget()];
  const ok=reachableFrom(tips);
  return Object.keys(repo.commits).filter(id=>!ok.has(id));
}
function mkSha(){
  for(;;){
    shaN++;
    let x=(shaN*2654435761)>>>0; x=((x^(x>>>13))*2246822519)>>>0;
    const s=('0000000'+x.toString(16)).slice(-7);
    if(!Object.values(V.commits).some(c=>c.sha===s))return s;
  }
}
function resolveRef(tok){
  const m=String(tok).match(/^([^~^]+)((?:[~^]\d*)*)$/); if(!m)return null;
  let id=null; const base=m[1];
  if(base==='HEAD')id=headTarget();
  else if(repo.branches[base]!==undefined)id=repo.branches[base];
  else if(repo.tags[base]!==undefined)id=repo.tags[base];
  else{
    const hits=Object.keys(repo.commits).filter(k=>k===base||V.commits[k].sha.startsWith(base.toLowerCase()));
    if(hits.length===1)id=hits[0]; else return null;
  }
  const re=/([~^])(\d*)/g; let mm;
  while((mm=re.exec(m[2]||''))){
    const n=mm[2]===''?1:parseInt(mm[2],10);
    if(mm[1]==='~'){for(let i=0;i<n&&id;i++)id=parentsOf(id)[0]||null;}
    else id=parentsOf(id)[n-1]||null;
    if(!id)return null;
  }
  return id;
}
function chainBetween(anc,desc){ // [anc,...,desc] along parent links, or null
  const path=[];
  (function walk(id,acc){
    if(path.length)return;
    if(id===anc){path.push(...acc,id);return;}
    for(const p of parentsOf(id))walk(p,[...acc,id]);
  })(desc,[]);
  return path.length?path.reverse():null;
}

/* ---------- visual bookkeeping ---------- */
let addedThisCmd=[];
function newCommit({msg,parents,fam,code,copyOf}){
  seq++;
  const id='S'+seq;
  const depth=parents.length?Math.max(...parents.map(p=>meta[p].depth))+1:0;
  // lanes belong to branches: a branch keeps its row; new branches get a new one
  const who=repo.head.on??null;
  let lane;
  if(who!==null&&branchLane[who]!==undefined)lane=branchLane[who];
  else if(parents.length&&(laneOwner[meta[parents[0]].lane]===undefined||laneOwner[meta[parents[0]].lane]===who))lane=meta[parents[0]].lane;
  else lane=nextLane++;
  while(occupied[depth+':'+lane])lane=nextLane++;
  occupied[depth+':'+lane]=1;
  if(who!==null){branchLane[who]=lane;laneOwner[lane]=laneOwner[lane]??who;}
  meta[id]={depth,lane};
  parents.forEach(p=>children[p]=(children[p]||0)+1);
  children[id]=0;
  repo.commits[id]={parents:[...parents]};
  V.commits[id]={code:code||('C'+seq),sha:mkSha(),msg,parent:parents[0]||null,parent2:parents[1]||null,
    gx:depth*4+lane, gy:2+lane*6, fam, copyOf};
  addedThisCmd.push(id);
  return id;
}
function snap(line){
  hist.push({repo:structuredClone(repo),meta:structuredClone(meta),children:{...children},
             branchLane:{...branchLane},laneOwner:{...laneOwner},occupied:{...occupied},
             nextLane,seq,shaN,line});
  addedThisCmd=[];
  cmdHistory.push(line);
}
function refSnapshot(){
  const r={};
  for(const b in repo.branches)r[b]=repo.branches[b];
  for(const g in repo.tags)r[g]=repo.tags[g];
  r.head=repo.head.on?{on:repo.head.on}:{at:repo.head.at};
  return r;
}
function pushStep(o){
  V.branches=Object.keys(repo.branches);
  V.tags=Object.keys(repo.tags);
  const cmd=curLine?('$ '+curLine+(outBuf&&outBuf.length?'\n'+outBuf.join('\n'):'')):null;
  V.steps.push({
    t:o.t, lede:o.lede||'', story:o.story||'', cmd, plumbing:null,
    present:Object.keys(V.commits), dim:[], ghost:unreachableIds(), halo:o.halo||[], notes:o.notes||{},
    refs:refSnapshot(), ...(o.anim||{}),
  });
  if(!replaying)window.gotoStep(V.steps.length-1);
}

/* ---------- terminal ---------- */
let tlog, tin;
function tprint(text,cls){
  const kind=cls==='tc'?'cmd':cls==='te'?'err':'out';
  for(const line of String(text).split('\n')){
    const d=document.createElement('div');
    if(window.GitBlocks&&GitBlocks.tty)d.innerHTML=GitBlocks.tty(line,kind);
    else d.textContent=line;
    tlog.appendChild(d);
  }
  tlog.scrollTop=tlog.scrollHeight;
}
let outBuf=null, curLine=null;
const say=t=>{tprint(t,'to'); if(outBuf)outBuf.push(...String(t).split('\n'));};
const sayErr=t=>tprint(t,'te');

function tokenize(line){
  const out=[]; const re=/"([^"]*)"|'([^']*)'|(\S+)/g; let m;
  while((m=re.exec(line)))out.push(m[1]??m[2]??m[3]);
  return out;
}

/* ---------- commands ---------- */
const HELP=`sandbox git — a real-enough repo with no files (so merges never conflict)
  git commit -m "msg" [--amend]
  git branch            git branch <name> [ref]     git branch -d|-D <name>
  git switch <branch>   git switch -c <name> [ref]  git switch --detach <ref>
  git checkout …        (same moves, older spelling)
  git merge <ref> [--no-ff | --squash]
  git rebase <upstream>            git rebase --onto <new> <old>
  git cherry-pick <ref>            git revert <ref>
  git reset [--soft|--mixed|--hard] <ref>
  git tag [name|-d name]           git branch -m [old] new
  git log [--all]   git show <ref>   git status   git reflog
  refs: names, shas, tags, HEAD, HEAD~2, main^ …
aliases: g=git · c=commit · co=checkout · sw=switch · br=branch · l=log · s=status · cp=cherry-pick
also:  help · undo · clear · share  (copies a link that replays this session)`;

function currentFam(){ return repo.head.on==='main'?'paper':repo.head.on?'blue':'sage'; }
function decorate(id){
  const d=[];
  for(const g in repo.tags)if(repo.tags[g]===id)d.push('tag: '+g);
  if(headTarget()===id)d.push(repo.head.on?`HEAD -> ${repo.head.on}`:'HEAD');
  for(const b in repo.branches)if(repo.branches[b]===id&&b!==repo.head.on)d.push(b);
  else if(repo.branches[b]===id&&b===repo.head.on&&!d.length)d.push(b);
  return d.length?` (${d.join(', ')})`:'';
}

function cmdCommit(args,line){
  const amend=args.includes('--amend');
  let msg=null; const mi=args.indexOf('-m');
  if(mi>-1)msg=args[mi+1];
  if(msg===undefined){sayErr('fatal: -m needs a message in quotes');return;}
  if(amend){
    const old=headTarget(); const op=parentsOf(old);
    snap(line);
    const id=newCommit({msg:msg??V.commits[old].msg,parents:[...op],fam:'rose',code:V.commits[old].code+'′',copyOf:old});
    if(repo.head.on)repo.branches[repo.head.on]=id; else repo.head.at=id;
    say(`[${repo.head.on||'detached HEAD'} ${V.commits[id].sha}] ${V.commits[id].msg} (amend)`);
    pushStep({t:'git commit --amend',lede:`${V.commits[old].code} replaced by ${V.commits[id].code} — same parent, new hash.`,
      story:`<p>The old tip is abandoned, not edited — see <a href="amend.html">amend</a>.</p>`,
      anim:{packet:{from:old,to:id,label:'changes + fixes',win:[.1,.9]},appear:{[id]:[.8,1.4]},
            refWin:{[repo.head.on||'HEAD']:[1.3,1.9],HEAD:[1.3,1.9]}}});
    return;
  }
  if(msg===null)msg='work in progress';
  snap(line);
  const parent=headTarget();
  const id=newCommit({msg,parents:[parent],fam:currentFam()});
  if(repo.head.on)repo.branches[repo.head.on]=id; else repo.head.at=id;
  say(`[${repo.head.on||'detached HEAD'} ${V.commits[id].sha}] ${msg}`);
  pushStep({t:'git commit',lede:`${V.commits[id].code} lands; ${repo.head.on?repo.head.on+' moves with you':'HEAD advances (detached — no branch follows)'}.`,
    anim:{appear:{[id]:[.1,.7]},refWin:{[repo.head.on||'HEAD']:[.5,1.1],HEAD:[.5,1.1]}}});
}

function cmdBranch(args,line){
  if(!args.length){
    for(const b in repo.branches)say(`${b===repo.head.on?'* ':'  '}${b}`);
    if(!repo.head.on)say(`* (HEAD detached at ${V.commits[headTarget()].sha})`);
    return;
  }
  if(args[0]==='-d'||args[0]==='-D'){
    const name=args[1];
    if(!repo.branches[name]){sayErr(`error: branch '${name}' not found`);return;}
    if(name===repo.head.on){sayErr(`error: cannot delete '${name}': checked out`);return;}
    if(args[0]==='-d'&&!isAncestor(repo.branches[name],headTarget())){
      sayErr(`error: the branch '${name}' is not fully merged\nhint: use -D if you're sure (its commits may become strays)`);return;
    }
    snap(line);
    say(`Deleted branch ${name} (was ${V.commits[repo.branches[name]].sha}).`);
    delete repo.branches[name];
    pushStep({t:'git branch '+args[0],lede:`${name} is gone — any commits only it could reach are strays now.`});
    return;
  }
  if(args[0]==='-m'||args[0]==='-M'){
    const [oldName,newName]=args.length>2?[args[1],args[2]]:[repo.head.on,args[1]];
    if(!oldName||repo.branches[oldName]===undefined){sayErr(`error: branch '${oldName??''}' not found`);return;}
    if(!newName||repo.branches[newName]!==undefined||!/^[A-Za-z][\w\/.-]*$/.test(newName)){sayErr(`fatal: bad new name '${newName??''}'`);return;}
    snap(line);
    repo.branches[newName]=repo.branches[oldName]; delete repo.branches[oldName];
    if(branchLane[oldName]!==undefined){branchLane[newName]=branchLane[oldName]; delete branchLane[oldName];}
    for(const l in laneOwner)if(laneOwner[l]===oldName)laneOwner[l]=newName;
    if(repo.head.on===oldName)repo.head={on:newName};
    say(`renamed ${oldName} -> ${newName} (same pointer, new name)`);
    pushStep({t:'git branch -m',lede:`${oldName} is now ${newName}. The commit it points at didn't blink.`,
      anim:{refWin:{[newName]:[.15,.7]}}});
    return;
  }
  const name=args[0];
  if(!/^[A-Za-z][\w\/.-]*$/.test(name)||name==='HEAD'||name==='head'){sayErr(`fatal: '${name}' is not a valid branch name`);return;}
  if(repo.branches[name]!==undefined){sayErr(`fatal: a branch named '${name}' already exists`);return;}
  const at=args[1]?resolveRef(args[1]):headTarget();
  if(!at){sayErr(`fatal: not a valid object name: '${args[1]}'`);return;}
  snap(line);
  repo.branches[name]=at;
  pushStep({t:'git branch '+name,lede:`A new pointer at ${V.commits[at].code} — nothing else happened. HEAD didn't move.`,
    anim:{refWin:{[name]:[.15,.7]}}});
}

function cmdSwitch(args,line,viaCheckout){
  if(args[0]==='-c'||args[0]==='-b'){
    const name=args[1];
    if(!name||!/^[A-Za-z][\w\/.-]*$/.test(name)||repo.branches[name]!==undefined||name==='HEAD'){sayErr(`fatal: can't create branch '${name??''}'`);return;}
    const at=args[2]?resolveRef(args[2]):headTarget();
    if(!at){sayErr(`fatal: not a valid object name: '${args[2]}'`);return;}
    snap(line);
    repo.branches[name]=at; repo.head={on:name};
    say(`Switched to a new branch '${name}'`);
    pushStep({t:`git ${viaCheckout?'checkout -b':'switch -c'} ${name}`,lede:`${name} is born at ${V.commits[at].code}; HEAD attaches to it.`,
      anim:{refWin:{[name]:[.15,.7],HEAD:[.6,1.15]}}});
    return;
  }
  if(args[0]==='--detach'){
    const at=resolveRef(args[1]??'HEAD');
    if(!at){sayErr(`fatal: not a valid object name: '${args[1]}'`);return;}
    snap(line);
    repo.head={at};
    say(`HEAD is now at ${V.commits[at].sha} ${V.commits[at].msg}`);
    pushStep({t:'git switch --detach',lede:`HEAD points straight at ${V.commits[at].code} — no branch will follow your commits.`,
      anim:{refWin:{HEAD:[.15,.85]}}});
    return;
  }
  const name=args[0];
  if(repo.branches[name]!==undefined){
    snap(line);
    repo.head={on:name};
    say(`Switched to branch '${name}'`);
    pushStep({t:'git switch '+name,lede:`HEAD hops to ${name}; your files become ${V.commits[repo.branches[name]].code}'s snapshot.`,
      anim:{refWin:{HEAD:[.15,.85]}}});
    return;
  }
  const at=resolveRef(name);
  if(at&&viaCheckout){
    snap(line);
    repo.head={at};
    say(`Note: switching to '${name}' detaches HEAD (see the detached-head animation)`);
    pushStep({t:'git checkout '+name,lede:`Checked out a commit, not a branch — HEAD is detached at ${V.commits[at].code}.`,
      anim:{refWin:{HEAD:[.15,.85]}}});
    return;
  }
  sayErr(`fatal: invalid reference: ${name}${at?`\nhint: to check out a commit, use git switch --detach ${name}`:''}`);
}

function cmdMerge(args,line){
  const noff=args.includes('--no-ff'), squash=args.includes('--squash');
  const tok=args.find(a=>!a.startsWith('-'));
  const target=tok&&resolveRef(tok);
  if(!target){sayErr(`merge: ${tok??'(nothing)'} - not something we can merge`);return;}
  if(!repo.head.on){sayErr('fatal: merging with a detached HEAD is above this sandbox\'s pay grade');return;}
  const ours=headTarget();
  if(isAncestor(target,ours)){say('Already up to date.');return;}
  if(isAncestor(ours,target)&&!noff&&!squash){
    snap(line);
    const path=chainBetween(ours,target);
    repo.branches[repo.head.on]=target;
    say(`Updating ${V.commits[ours].sha}..${V.commits[target].sha}\nFast-forward (no new commit — just the pointer)`);
    pushStep({t:'git merge '+tok,lede:`Fast-forward: ${repo.head.on} slides along existing commits to ${V.commits[target].code}.`,
      anim:{refPath:{[repo.head.on]:path,HEAD:path},refWin:{[repo.head.on]:[.15,1.2],HEAD:[.15,1.2]}}});
    return;
  }
  snap(line);
  if(squash){
    const id=newCommit({msg:`squash '${tok}'`,parents:[ours],fam:'peach'});
    repo.branches[repo.head.on]=id;
    say(`Squash commit created as ${V.commits[id].sha} (the sandbox commits it for you)\nnote: no parent link to '${tok}' — see squash-merge`);
    pushStep({t:'git merge --squash',lede:`All of ${tok}'s changes as one plain commit — one parent, lineage dropped.`,
      anim:{packets:[{from:target,to:id,label:`all of ${tok}`,win:[.15,1.05]}],appear:{[id]:[.95,1.55]},
            refWin:{[repo.head.on]:[1.5,2.1],HEAD:[1.5,2.1]}}});
    return;
  }
  const id=newCommit({msg:`merge ${tok}`,parents:[ours,target],fam:'sage'});
  repo.branches[repo.head.on]=id;
  say(`Merge made by the 'ort' strategy. (no files here — merges never conflict)`);
  pushStep({t:'git merge '+tok,lede:`${V.commits[id].code} has two parents: your line and ${tok}'s. Nothing was rewritten.`,
    anim:{packets:[{from:ours,to:id,label:'ours',win:[.15,1.05]},{from:target,to:id,label:'theirs',win:[.35,1.25]}],
          appear:{[id]:[1.15,1.75]},refWin:{[repo.head.on]:[1.7,2.3],HEAD:[1.7,2.3]}}});
}

function cmdRebase(args,line){
  if(!repo.head.on){sayErr('fatal: this sandbox rebases branches, not detached HEADs');return;}
  const inter=args.includes('-i')||args.includes('--interactive');
  args=args.filter(a=>a!=='-i'&&a!=='--interactive');
  let base,cutTok,baseTok;
  if(args[0]==='--onto'){ baseTok=args[1]; cutTok=args[2]; }
  else { baseTok=args[0]; cutTok=args[0]; }
  base=baseTok&&resolveRef(baseTok);
  const cut=cutTok&&resolveRef(cutTok);
  if(!base||!cut){sayErr(`fatal: invalid upstream '${baseTok??''}'`);return;}
  const ours=headTarget();
  const skip=reachableFrom([cut]);
  const range=[...reachableFrom([ours])].filter(id=>!skip.has(id)).sort((a,b)=>meta[a].depth-meta[b].depth);
  if(range.some(id=>parentsOf(id).length>1)){sayErr('sandbox: rebasing merge commits is not supported (real git: --rebase-merges)');return;}
  if(!range.length){
    if(ours===base){say('Current branch is up to date.');return;}
    snap(line);
    const path=chainBetween(ours,base);
    repo.branches[repo.head.on]=base;
    say('Fast-forwarded to '+(baseTok||'upstream')+'.');
    pushStep({t:'git rebase '+baseTok,lede:'Nothing to replay — the branch just fast-forwards.',
      anim:path?{refPath:{[repo.head.on]:path,HEAD:path},refWin:{[repo.head.on]:[.15,1.2],HEAD:[.15,1.2]}}:{refWin:{[repo.head.on]:[.15,.9],HEAD:[.15,.9]}}});
    return;
  }
  snap(line);
  if(inter&&range.length>1){
    // sandbox auto-squashes the todo list into one commit
    say('# real git opens the todo in your editor; the sandbox squashes it for you:');
    range.forEach((src,i)=>say(`${i===0?'pick  ':'squash'} ${V.commits[src].sha} ${V.commits[src].msg}`));
    const first=range[0];
    const id=newCommit({msg:V.commits[first].msg,parents:[base],fam:'rose',code:'S′'});
    repo.branches[repo.head.on]=id;
    say(`Successfully rebased and updated refs/heads/${repo.head.on}.`);
    say(`(${range.length} commits squashed into ${V.commits[id].sha} — the originals are strays now)`);
    const packets=range.map((src,i)=>({from:src,to:id,label:V.commits[src].msg.slice(0,18),win:[.15+i*.25,.95+i*.25]}));
    const dur=.95+(range.length-1)*.25;
    pushStep({t:'git rebase -i '+(baseTok||''),
      lede:`${range.length} commits fold into one — squash is the daily-driver rebase.`,
      anim:{packets,appear:{[id]:[dur-.1,dur+.5]},refWin:{[repo.head.on]:[dur+.6,dur+1.2],HEAD:[dur+.6,dur+1.2]}}});
    return;
  }
  let tip=base; const packets=[],appear={};
  range.forEach((src,i)=>{
    const id=newCommit({msg:V.commits[src].msg,parents:[tip],fam:'rose',code:V.commits[src].code+'′',copyOf:src});
    packets.push({from:src,to:id,label:'replay '+V.commits[src].code,win:[.15+i*.35,1.05+i*.35]});
    appear[id]=[.95+i*.35,1.55+i*.35];
    tip=id;
  });
  repo.branches[repo.head.on]=tip;
  const dur=1.05+(range.length-1)*.35;
  say(`Successfully rebased and updated refs/heads/${repo.head.on}.\n(${range.length} commit${range.length>1?'s':''} replayed as new copies — the originals are strays now)`);
  pushStep({t:'git rebase '+(args[0]==='--onto'?'--onto '+baseTok:baseTok),
    lede:`${range.length} commit${range.length>1?'s':''} replayed onto ${V.commits[base].code} — copies, not moves.`,
    anim:{packets,appear,refWin:{[repo.head.on]:[dur+.4,dur+1],HEAD:[dur+.4,dur+1]}}});
}

function cmdCherryPick(args,line){
  const id0=args[0]&&resolveRef(args[0]);
  if(!id0){sayErr(`fatal: bad revision '${args[0]??''}'`);return;}
  if(parentsOf(id0).length>1){sayErr('sandbox: cherry-picking merges needs -m in real git; not supported here');return;}
  snap(line);
  const parent=headTarget();
  const id=newCommit({msg:V.commits[id0].msg,parents:[parent],fam:'peach',code:V.commits[id0].code+'′',copyOf:id0});
  if(repo.head.on)repo.branches[repo.head.on]=id; else repo.head.at=id;
  say(`[${repo.head.on||'detached HEAD'} ${V.commits[id].sha}] ${V.commits[id].msg}\n(same patch as ${V.commits[id0].sha}, new hash)`);
  pushStep({t:'git cherry-pick '+args[0],lede:`${V.commits[id0].code}'s changes, replayed here as ${V.commits[id].code}. The original didn't move.`,
    anim:{packet:{from:id0,to:id,label:'changes in '+V.commits[id0].code,win:[.15,1.05]},appear:{[id]:[.95,1.55]},
          refWin:{[repo.head.on||'HEAD']:[1.5,2.1],HEAD:[1.5,2.1]}}});
}

function cmdReset(args,line){
  const mode=['--hard','--soft','--mixed'].find(f=>args.includes(f))||'--mixed';
  const tok=args.find(a=>!a.startsWith('-'));
  if(!repo.head.on){sayErr('fatal: reset needs a branch under HEAD in this sandbox');return;}
  const target=tok&&resolveRef(tok);
  if(!target){sayErr(`fatal: not a valid object name: '${tok??''}'`);return;}
  const from=headTarget();
  if(from===target){say('(already there — nothing moved)');return;}
  snap(line);
  const path=chainBetween(target,from); // walking backwards, if it is backwards
  repo.branches[repo.head.on]=target;
  say(`HEAD is now at ${V.commits[target].sha} ${V.commits[target].msg}\n(${mode}: the graph move is identical — flags only decide what happens to files)`);
  pushStep({t:'git reset '+mode,lede:`${repo.head.on} re-points to ${V.commits[target].code}; abandoned commits become strays.`,
    anim:path?{refPath:{[repo.head.on]:[...path].reverse(),HEAD:[...path].reverse()},refWin:{[repo.head.on]:[.15,1.2],HEAD:[.15,1.2]}}
             :{refWin:{[repo.head.on]:[.15,.9],HEAD:[.15,.9]}}});
}

function cmdRevert(args,line){
  const id0=args[0]&&resolveRef(args[0]);
  if(!id0){sayErr(`fatal: bad revision '${args[0]??''}'`);return;}
  if(parentsOf(id0).length>1){sayErr('sandbox: reverting merges needs -m in real git; not supported here');return;}
  if(!repo.head.on){sayErr('sandbox: revert while detached — attach to a branch first');return;}
  snap(line);
  const parent=headTarget();
  const id=newCommit({msg:`revert "${V.commits[id0].msg}"`,parents:[parent],fam:'sage'});
  repo.branches[repo.head.on]=id;
  say(`[${repo.head.on} ${V.commits[id].sha}] revert "${V.commits[id0].msg}"\n(an inverse commit — nothing was rewound; see revert)`);
  pushStep({t:'git revert '+args[0],lede:`${V.commits[id].code} undoes ${V.commits[id0].code} by adding its inverse. History keeps both.`,
    anim:{packet:{from:id0,to:id,label:'inverse of '+V.commits[id0].code,win:[.15,1.05]},appear:{[id]:[.95,1.55]},
          refWin:{[repo.head.on]:[1.5,2.1],HEAD:[1.5,2.1]}}});
}

function cmdLog(args){
  if(args.includes('--graph'))say('# the graph is the big colorful thing above ↑');
  const all=args.includes('--all');
  const tips=all?[...Object.values(repo.branches),headTarget()]:[headTarget()];
  const ids=[...reachableFrom(tips)].sort((a,b)=>meta[b].depth-meta[a].depth||(a<b?-1:1));
  ids.slice(0,20).forEach(id=>say(`${V.commits[id].sha}${decorate(id)} ${V.commits[id].msg}`));
  if(ids.length>20)say(`… (${ids.length-20} more)`);
}
function cmdStatus(){
  say(repo.head.on?`On branch ${repo.head.on}`:`HEAD detached at ${V.commits[headTarget()].sha}`);
  say('nothing to commit (this sandbox has no working tree)');
}

function cmdTag(args,line){
  if(!args.length){
    const names=Object.keys(repo.tags);
    if(!names.length)say('(no tags yet — git tag <name> plants one where HEAD is)');
    else names.sort().forEach(n=>say(n));
    return;
  }
  if(args[0]==='-d'){
    const n=args[1];
    if(repo.tags[n]===undefined){sayErr(`error: tag '${n??''}' not found`);return;}
    snap(line);
    say(`Deleted tag '${n}' (was ${V.commits[repo.tags[n]].sha})`);
    delete repo.tags[n];
    pushStep({t:'git tag -d '+n,lede:`The ${n} tag is gone; the commit it marked is unbothered.`});
    return;
  }
  const name=args[0];
  if(!/^[A-Za-z][\w\/.-]*$/.test(name)||repo.tags[name]!==undefined||repo.branches[name]!==undefined){sayErr(`fatal: tag '${name}' is invalid or already taken`);return;}
  const at=args[1]?resolveRef(args[1]):headTarget();
  if(!at){sayErr(`fatal: not a valid object name: '${args[1]}'`);return;}
  snap(line);
  repo.tags[name]=at;
  say(`tag '${name}' -> ${V.commits[at].sha}`);
  pushStep({t:'git tag '+name,lede:`A tag is a ref that never moves — ${name} will point at ${V.commits[at].code} forever.`,
    anim:{refWin:{[name]:[.15,.7]}}});
}
function cmdShow(args){
  const id=resolveRef(args[0]??'HEAD');
  if(!id){sayErr(`fatal: bad revision '${args[0]??''}'`);return;}
  const c=V.commits[id];
  say(`commit ${c.sha}${decorate(id)}`);
  const ps=parentsOf(id);
  if(ps.length)say('parent '+ps.map(p=>V.commits[p].sha).join(', '));
  say('        '+c.msg);
}
function cmdReflog(){
  if(!cmdHistory.length){say('(nothing yet — the reflog fills as you work)');return;}
  const states=[...hist.slice(1).map(h=>h.repo), repo];
  const t=s=>s.head.on?s.branches[s.head.on]:s.head.at;
  let n=0;
  for(let j=cmdHistory.length-1;j>=0&&n<12;j--,n++){
    say(`${V.commits[t(states[j])].sha} HEAD@{${n}}: ${cmdHistory[j]}`);
  }
  if(cmdHistory.length>12)say(`… (${cmdHistory.length-12} more)`);
}

/* ---------- share ---------- */
const b64e=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d=s=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
function share(){
  const u=new URL(location.pathname,location.href);
  if(cmdHistory.length)u.searchParams.set('s',b64e(JSON.stringify(cmdHistory)));
  navigator.clipboard.writeText(u.href).then(
    ()=>say(`# session link copied (${cmdHistory.length} command${cmdHistory.length===1?'':'s'} — it plays back on a loop for whoever opens it)`),
    ()=>say('# copy this: '+u.href));
}

/* ---------- dispatch ---------- */
function run(line){
  line=line.trim(); if(!line)return;
  if(!replaying&&window.GitBlocks&&GitBlocks.stop){GitBlocks.stop();V.liveTerm=true;} // typing takes over from a looping replay
  tprint('$ '+line,'tc');
  const argv=tokenize(line);
  const c0=argv[0];
  if(c0==='help'){say(HELP);return;}
  if(c0==='clear'){tlog.innerHTML='';return;}
  if(c0==='share'){share();return;}
  if(c0==='undo'){
    if(!hist.length){sayErr('nothing to undo');return;}
    const h=hist.pop();
    for(const id of Object.keys(V.commits))if(!h.repo.commits[id]){delete V.commits[id];delete meta[id];}
    repo=h.repo; meta=h.meta; children=h.children; nextLane=h.nextLane; seq=h.seq; shaN=h.shaN;
    branchLane=h.branchLane; laneOwner=h.laneOwner; occupied=h.occupied;
    cmdHistory.pop(); V.steps.pop(); V.branches=Object.keys(repo.branches);
    say('undid: '+h.line);
    window.gotoStep(V.steps.length-1);
    return;
  }
  if(c0!=='git'&&c0!=='g'){sayErr(`${c0}: command not found (this terminal only speaks git — try 'help')`);return;}
  curLine=line; outBuf=[];
  const ALIAS={c:'commit',co:'checkout',l:'log',s:'status',sw:'switch',br:'branch',cp:'cherry-pick'};
  const sub=ALIAS[argv[1]]||argv[1], rest=argv.slice(2);
  try{
    switch(sub){
      case 'commit': cmdCommit(rest,line); break;
      case 'branch': cmdBranch(rest,line); break;
      case 'switch': cmdSwitch(rest,line,false); break;
      case 'checkout': cmdSwitch(rest,line,true); break;
      case 'merge': cmdMerge(rest,line); break;
      case 'rebase': cmdRebase(rest,line); break;
      case 'cherry-pick': cmdCherryPick(rest,line); break;
      case 'reset': cmdReset(rest,line); break;
      case 'revert': cmdRevert(rest,line); break;
      case 'log': cmdLog(rest); break;
      case 'tag': cmdTag(rest,line); break;
      case 'show': cmdShow(rest); break;
      case 'reflog': cmdReflog(); break;
      case 'status': cmdStatus(); break;
      case 'init': say('already initialized — the sandbox starts with two commits'); break;
      case 'push': case 'pull': case 'fetch':
        say(`no network in the sandbox — see the fetch-pull animation for how syncing works`); break;
      case 'stash': case 'bisect':
        say(`git ${sub} isn't in the sandbox (yet)`); break;
      default: sayErr(`git: '${sub??''}' is not a sandbox command — try 'help'`);
    }
  }catch(e){ sayErr('sandbox error: '+e.message); }
  finally{ curLine=null; outBuf=null; }
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  tlog=document.getElementById('tlog');
  const tline=document.createElement('div');
  tline.id='tline';
  document.getElementById('term').appendChild(tline);
  tline.innerHTML=`<span class="tp">$</span><input id="tin" autocomplete="off" spellcheck="false"
    placeholder='git commit -m "try me" — or: help'>
    <button class="ctl" id="tshare" title="copy a link that replays this session">⧉ share</button>`;
  tin=document.getElementById('tin');
  document.getElementById('tshare').onclick=share;
  say('# a live git sandbox. help = commands · share = copy a replayable link');
  let hi=-1;
  tin.addEventListener('keydown',e=>{
    if(e.key==='Enter'){const v=tin.value; typed.push(v); hi=typed.length; tin.value=''; run(v);}
    else if(e.key==='ArrowUp'){e.preventDefault(); if(hi>0){hi--; tin.value=typed[hi]??'';}}
    else if(e.key==='ArrowDown'){e.preventDefault(); if(hi<typed.length){hi++; tin.value=typed[hi]??'';}}
    e.stopPropagation();
  });
  // replay a shared session
  const s=new URLSearchParams(location.search).get('s');
  if(s){
    try{
      const cmds=JSON.parse(b64d(s));
      if(Array.isArray(cmds)&&cmds.length){
        say(`# replaying a shared session (${cmds.length} commands)…`);
        replaying=true;
        for(const c of cmds)if(typeof c==='string')run(c);
        replaying=false;
        if(V.steps.length>1){
          V.liveTerm=false; tlog.innerHTML='';
          GitBlocks.play({loop:true});
        }else window.gotoStep(V.steps.length-1);
      }
    }catch(e){ sayErr('# could not read the shared session in this link'); }
  }
  tin.focus();
});
})();
