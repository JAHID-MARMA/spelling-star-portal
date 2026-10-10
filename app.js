
"use strict";




"use strict";
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function norm(s){return String(s||"").toLowerCase().replace(/[^a-z]/g,"");}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function grade(p){if(p>=80)return "A+";if(p>=70)return "A";if(p>=60)return "A-";if(p>=50)return "B";if(p>=40)return "C";if(p>=33)return "D";return "F";} /* Bangladesh school grade scale */
function nowStr(){return new Date().toLocaleString();}
/* Non-blocking inline message banner (replaces blocking alert()): never freezes the tab */
var _msgT=null;
function say(msg,kind){
  var b=$("msgBar");if(!b)return;
  b.className="msgBar show "+(kind||"warn");
  b.textContent=msg;
  window.scrollTo(0,0);
  if(_msgT)clearTimeout(_msgT);
  _msgT=setTimeout(function(){b.className="msgBar";},6000);
}

var CURRENT=null;
var HISTORY=[];
try{HISTORY=JSON.parse(localStorage.getItem("ss_history")||"[]");}catch(e){HISTORY=[];}

var VIEWS=["home","practice","worksheet","exam","history"];
function show(v){VIEWS.forEach(function(x){$("view-"+x).classList.toggle("hidden",x!==v);});document.querySelectorAll("nav button").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-v")===v);});if(v==="history")renderHistory();window.scrollTo(0,0);}

/* ---------- Students ---------- */
function allStudents(){
  return {reg:STUDENTS.filter(function(s){return s.r;})};
}
function studentPhotoSrc(st){
  try{var d=localStorage.getItem("ss_photo_"+st.id);if(d)return d;}catch(e){}
  return st.photo||"";
}
function photoHTML(st,px){
  var initials=String(st.n||"?").split(" ").map(function(w){return w.charAt(0);}).join("").slice(0,2).toUpperCase();
  var src=studentPhotoSrc(st);
  var img=src?'<img src="'+src+'" alt="" onerror="this.remove()">':'';
  return '<span class="phAvatar" style="width:'+px+'px;height:'+px+'px;font-size:'+Math.round(px*0.36)+'px">'+img+'<span>'+esc(initials)+'</span></span>';
}
function renderPhotoBox(){
  var h="";
  STUDENTS.forEach(function(st,i){
    h+="<div class='card' style='box-shadow:none;border:2px solid #dfe6f2;text-align:center;min-width:180px'>"+photoHTML(st,90)+
       "<div style='font-weight:700;margin-top:8px'>"+esc(st.n)+"<br><small>"+esc(st.id)+"</small></div>"+
       "<label class='btn ghost' style='margin-top:8px;cursor:pointer'>Set photo<input type='file' accept='image/*' data-i='"+i+"' class='phPick' style='display:none'></label></div>";
  });
  $("photoBox").innerHTML=h;
  document.querySelectorAll(".phPick").forEach(function(inp){
    inp.addEventListener("change",function(){
      var f=inp.files[0];if(!f)return;
      var st=STUDENTS[parseInt(inp.getAttribute("data-i"),10)];
      var rd=new FileReader();
      rd.onload=function(){
        var img=new Image();
        img.onload=function(){
          var c=document.createElement("canvas"),mx=420,sc=Math.min(1,mx/Math.max(img.width,img.height));
          c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
          c.getContext("2d").drawImage(img,0,0,c.width,c.height);
          try{localStorage.setItem("ss_photo_"+st.id,c.toDataURL("image/jpeg",0.8));}catch(e){say("Photo too large to save on this device.","warn");return;}
          renderPhotoBox();renderStudents();say("Photo saved for "+st.n+".","ok");
        };
        img.src=rd.result;
      };
      rd.readAsDataURL(f);
    });
  });
}
function renderStudents(){
  var g=allStudents(),h="";
  h+="<h3>Registered (Spelling Star cards)</h3><div class='grid'>";
  g.reg.forEach(function(s){h+="<button class='stu' data-n='"+esc(s.n)+"' data-id='"+esc(s.id)+"'>"+photoHTML(s,44)+"<span>"+esc(s.n)+"<small>"+esc(s.id)+"</small></span></button>";});
  h+="</div>";
  $("stuList").innerHTML=h;
  document.querySelectorAll(".stu").forEach(function(b){b.addEventListener("click",function(){setStudent(b.getAttribute("data-n"),b.getAttribute("data-id"));});});
  renderWSStu();
}
function setStudent(n,id){
  CURRENT={name:n,id:id||""};
  $("studentChip").textContent=n+(id?" · "+id:"");
  document.querySelectorAll(".stu").forEach(function(b){b.classList.toggle("sel",b.getAttribute("data-n")===n);});
}

/* ---------- Practice ---------- */
var PR=null;
function jumble(w){
  var a=w.split(""),out=w,tries=0;
  while(out.toLowerCase()===w.toLowerCase()&&tries<12){a=shuffle(a);out=a.join("");tries++;}
  return out;
}
function gapPattern(w){
  var L=w.length,pos=[],k,i;
  if(L<4){pos=[1];}
  else{k=Math.max(2,Math.round(L/3));var cand=[];for(i=1;i<L;i++)cand.push(i);cand=shuffle(cand);pos=cand.slice(0,k).sort(function(a,b){return a-b;});}
  var s="";for(i=0;i<L;i++){s+= (pos.indexOf(i)>=0?"_":w[i])+" ";}
  return s.trim();
}
function startPractice(){
  if(!CURRENT){say("Select a student first \u2014 name entry is mandatory for scoring.","warn");return;}
  var mode=$("pMode").value, count=parseInt($("pCount").value,10);
  var items, i;
  if(mode==="super"){items=shuffle(SUPER).slice(0,count);}
  else{items=shuffle(BANK).slice(0,count);}
  PR={mode:mode,items:items,idx:0,score:0,done:false,student:CURRENT?CURRENT.name:"Guest",sid:CURRENT?CURRENT.id:""};
  renderQ();
}
function qPrompt(it){
  if(PR.mode==="super"){return "<div class='clue'>Category: <b>"+esc(it.cat)+"</b><br>Clue: "+esc(it.c)+"</div>";}
  var clue="<div class='clue'><span class='bn'>"+esc(it.bn)+"</span><br>"+esc(it.en)+" <i>("+esc(it.pos)+")</i></div>";
  if(PR.mode==="jumbled"){return clue+"<div class='jumble'>"+esc(jumble(it.w))+"</div>";}
  if(PR.mode==="gaps"){return clue+"<div class='gaps'>"+esc(gapPattern(it.w))+"</div>";}
  return clue;
}
function renderQ(){
  var box=$("pBox");
  if(!PR){box.innerHTML="<p class='note'>Choose a mode and press Start Test.</p>";return;}
  PR.locked=false;
  if(PR.idx>=PR.items.length){finishPractice();return;}
  var it=PR.items[PR.idx];
  var h="<div class='scorebar'>"+esc(PR.student)+" · Question "+(PR.idx+1)+" / "+PR.items.length+" · Score: "+PR.score+"</div>";
  h+=qPrompt(it);
  if(PR.mode==="spelling"&&it.pron){h+="<button class='btn ghost' id='qHint'>Pronunciation hint</button><span id='hintTxt'></span>";}
  h+="<br><input type='text' class='ans' id='qAns' autocomplete='off' placeholder='Type the word'>";
  h+="<br><button class='btn gold big' id='qCheck'>Check</button><button class='btn ghost' id='qSkip'>Next (teacher)</button>";
  h+="<div class='fb' id='qFb'></div>";
  box.innerHTML=h;
  $("qAns").focus();
  $("qAns").addEventListener("keydown",function(e){if(e.key==="Enter")checkQ(false);});
  $("qCheck").addEventListener("click",function(){checkQ(false);});
  $("qSkip").addEventListener("click",function(){checkQ(true);});
  var hint=$("qHint");
  if(hint){hint.addEventListener("click",function(){$("hintTxt").textContent=" "+it.pron;});}
}
function checkQ(skip){
  if(PR.locked)return;
  PR.locked=true;
  var it=PR.items[PR.idx], given=$("qAns").value, ok=!skip&&norm(given)===norm(it.w), fb=$("qFb");
  if(ok)PR.score++;
  fb.className="fb "+(ok?"ok":"no");
  fb.innerHTML=(ok?"Correct! Well done.":"Not correct. The word is: <b>"+esc(it.w)+"</b>")+(it.ex?"<br><i>"+esc(it.ex)+"</i>":"");
  setTimeout(function(){PR.idx++;renderQ();},ok?900:2200);
}
function modeName(m){return {spelling:"Spelling",jumbled:"Jumbled Word",gaps:"Fill in the Gaps",super:"Super Word"}[m]||m;}
function finishPractice(){
  PR.done=true;
  var total=PR.items.length, pct=total?Math.round(PR.score*1000/total)/10:0;
  var card={date:nowStr(),student:PR.student,id:PR.sid,test:modeName(PR.mode)+" (Practice)",obtained:PR.score,total:total,pct:pct,grade:grade(pct)};
  HISTORY.push(card);
  try{localStorage.setItem("ss_history",JSON.stringify(HISTORY));}catch(e){}
  $("pBox").innerHTML=scoreCardHTML(card)+"<button class='btn gold' onclick='startPractice()'>New Test</button>";
}
function scoreCardHTML(c){
  return "<div class='card' style='box-shadow:none;border:2px solid #123A72'><h2>Score Card</h2>"+
  "<table><tr><th>Student</th><td>"+esc(c.student)+(c.id?" ("+esc(c.id)+")":"")+"</td></tr>"+
  "<tr><th>Date</th><td>"+esc(c.date)+"</td></tr>"+
  "<tr><th>Round / Test</th><td>"+esc(c.test)+"</td></tr>"+
  "<tr><th>Obtained</th><td>"+c.obtained+" / "+c.total+"</td></tr>"+
  "<tr><th>Percentage</th><td>"+c.pct+"%</td></tr>"+
  "<tr><th>Grade</th><td><b>"+esc(c.grade)+"</b> <span class='note'>(Bangladesh school grade scale)</span></td></tr></table></div>";
}

/* ---------- History ---------- */
function renderHistory(){
  var h="";
  if(!HISTORY.length){h="<p class='note'>No finished tests yet. Scores will appear here.</p>";}
  else{
    h="<table><tr><th>Date</th><th>Student</th><th>ID</th><th>Round / Test</th><th>Obtained</th><th>Total</th><th>%</th><th>Grade</th></tr>";
    HISTORY.slice().reverse().forEach(function(c){h+="<tr><td>"+esc(c.date)+"</td><td>"+esc(c.student)+"</td><td>"+esc(c.id)+"</td><td>"+esc(c.test)+"</td><td>"+c.obtained+"</td><td>"+c.total+"</td><td>"+c.pct+"</td><td>"+esc(c.grade)+"</td></tr>";});
    h+="</table>";
  }
  $("histBox").innerHTML=h;
}
function printHistory(){
  var h="<h2>Spelling Star — Score History</h2>"+$("histBox").innerHTML;
  doPrint(h);
}

/* ---------- Examiner / Tournament ---------- */
var EX=null;
function newExam(){
  CURQ=null;
  EX={roster:[],round:1,startRound:1,qPer:1,started:false,finished:false,asked:{},used:{},superUsed:{},audit:[],winner:null,qCount:0};
  renderExam();
}
function exAdd(n,id){
  if(!n)return;
  if(EX.roster.length>=100){say("Maximum 100 students.","warn");return;}
  if(EX.roster.some(function(s){return s.name===n&&s.id===(id||"");})){say(n+" is already in the roster.","warn");return;}
  EX.roster.push({name:n,id:id||"",alive:true,outRound:0,correct:0,wrongWord:"",order:EX.roster.length+1});
  renderExam();
}
function exAddStudents(){allStudents().reg.forEach(function(s){exAdd(s.n,s.id);});}
function aliveList(){return EX.roster.filter(function(s){return s.alive;});}
function exStart(){
  if(EX.roster.length<1){say("Add at least 1 student.","warn");return;}
  if(EX.roster.length===1){EX.started=true;EX.finished=true;EX.winner=EX.roster[0];renderExam();return;}
  EX.startRound=parseInt($("eStartRound").value,10)||1;
  EX.round=EX.startRound;
  EX.qPer=parseInt($("eQPer").value,10)||1;
  EX.started=true; EX.asked={}; EX.qCount=0;
  nextTurn(true);
  renderExam();
}
function exReset(){newExam();}
function bankItem(){
  var pool=BANK.filter(function(b){return !EX.used[b.w];});
  if(!pool.length){EX.used={};pool=BANK;}
  var it=pick(pool); EX.used[it.w]=1; return it;
}
function superItem(){
  var pool=SUPER.filter(function(s){return !EX.superUsed[s.w];});
  if(!pool.length){EX.superUsed={};pool=SUPER;}
  var it=pick(pool); EX.superUsed[it.w]=1; return it;
}
var CURQ=null;
function makeQ(){
  var it, prompt, ans;
  if(EX.round===4){it=superItem();prompt="<div class='clue'>Category: <b>"+esc(it.cat)+"</b><br>Clue: "+esc(it.c)+"</div>";ans=it.w;}
  else if(EX.round===1){it=bankItem();prompt="<div class='clue'><span class='bn'>"+esc(it.bn)+"</span><br>"+esc(it.en)+" <i>("+esc(it.pos)+")</i></div>";ans=it.w;}
  else if(EX.round===2){it=bankItem();prompt="<div class='clue'>"+esc(it.en)+"</div><div class='jumble'>"+esc(jumble(it.w))+"</div>";ans=it.w;}
  else{it=bankItem();prompt="<div class='clue'>"+esc(it.en)+"</div><div class='gaps'>"+esc(gapPattern(it.w))+"</div>";ans=it.w;}
  return {item:it,prompt:prompt,ans:ans};
}
function currentStudent(){
  var alive=aliveList();
  for(var i=0;i<alive.length;i++){var s=alive[i];if((EX.asked[s.order]||0)<EX.qPer)return s;}
  return null;
}
function nextTurn(first){
  var alive=aliveList();
  if(alive.length<=1){EX.finished=true;EX.winner=alive[0]||null;CURQ=null;return;}
  var s=currentStudent();
  if(!s){
    if(EX.round<4){EX.round++;}
    EX.asked={};
    s=currentStudent();
  }
  CURQ={student:s,q:makeQ()};
}
function exJudge(){
  if(!CURQ||EX.lock)return;
  var given=$("eAns").value, s=CURQ.student;
  if(!given.trim()&&!confirm("The answer box is empty. This will knock "+s.name+" OUT. Judge anyway?"))return;
  EX.lock=true;
  var ok=norm(given)===norm(CURQ.q.ans);
  EX.qCount++;
  EX.asked[s.order]=(EX.asked[s.order]||0)+1;
  if(ok){s.correct++;}
  else{s.alive=false;s.outRound=EX.round;s.wrongWord=CURQ.q.ans;}
  EX.audit.push({t:nowStr(),name:s.name,id:s.id,round:EX.round,word:CURQ.q.ans,given:given||"(no answer)",ok:ok});
  var alive=aliveList();
  if(alive.length<=1){EX.finished=true;EX.winner=alive[0]||null;CURQ=null;}
  else if(ok&&(EX.asked[s.order]||0)<EX.qPer){CURQ={student:s,q:makeQ()};}
  else{nextTurn(false);}
  renderExam(ok, given);
}
function exReplace(){
  if(!CURQ)return;
  EX.audit.push({t:nowStr(),name:CURQ.student.name,id:CURQ.student.id,round:EX.round,word:"(replaced) "+CURQ.q.ans,given:"— organizer replaced the word before the answer (ASSUMPTION: organizer decision)",ok:"replaced"});
  CURQ.q=makeQ();
  renderExam(null,null,true);
}
function ranking(){
  var out=EX.roster.filter(function(s){return !s.alive;});
  out.sort(function(a,b){return (b.outRound-a.outRound)||(b.correct-a.correct)||(a.order-b.order);});
  var list=[];
  if(EX.winner)list.push(EX.winner);
  return list.concat(out);
}
function renderExam(lastOk,lastGiven,keepFb){
  EX.lock=false;
  var box=$("eBox"), h="";
  h+="<div class='scorebar'>Roster: "+EX.roster.length+" / 100 · Alive: "+aliveList().length+" · Round: "+(EX.started?("Round "+EX.round+" — "+modeName(["","spelling","jumbled","gaps","super"][EX.round])):"not started")+"</div>";
  if(EX.started&&!EX.finished&&aliveList().length<=10&&aliveList().length>3){h+="<div class='banner'>TOP "+aliveList().length+" — final stage!</div>";}
  if(EX.started&&!EX.finished&&aliveList().length<=3&&aliveList().length>1){h+="<div class='banner'>TOP "+aliveList().length+"!</div>";}
  if(EX.finished&&EX.winner){h+="<div class='banner'>WINNER: "+esc(EX.winner.name)+(EX.winner.id?" ("+esc(EX.winner.id)+")":"")+"</div>";}
  if(CURQ&&EX.started&&!EX.finished){
    h+="<div class='card' style='box-shadow:none;border:2px solid #F59E0B'><h2>Now answering: "+esc(CURQ.student.name)+(CURQ.student.id?" · "+esc(CURQ.student.id):"")+"</h2>";
    h+=CURQ.q.prompt;
    h+="<br><input type='text' class='ans' id='eAns' autocomplete='off' placeholder='Type the answer exactly'>";
    h+="<br><button class='btn gold big' id='eJudge'>Judge Answer</button>";
    h+=" <button class='btn ghost' id='eReplace'>Replace word (organizer)</button>";
    h+="<div class='fb' id='eFb'></div></div>";
  }
  h+="<h3>Alive board</h3><div>";
  aliveList().forEach(function(s){h+="<span class='chip'>"+esc(s.name)+(s.id?" · "+esc(s.id):"")+" · ✓ "+s.correct+"</span>";});
  if(!aliveList().length)h+="<span class='note'>No students alive.</span>";
  h+="</div><h3>Eliminated board (one wrong = out)</h3><div>";
  EX.roster.filter(function(s){return !s.alive;}).forEach(function(s){h+="<span class='chip out'>"+esc(s.name)+" · out in Round "+s.outRound+" · word: "+esc(s.wrongWord)+"</span>";});
  if(!EX.roster.some(function(s){return !s.alive;}))h+="<span class='note'>Nobody is out yet.</span>";
  h+="</div>";
  if(EX.finished){
    h+="<h3>Final ranking</h3><table><tr><th>Rank</th><th>Student</th><th>ID</th><th>Result</th><th>Correct</th></tr>";
    ranking().forEach(function(s,i){h+="<tr><td>"+(i+1)+"</td><td>"+esc(s.name)+"</td><td>"+esc(s.id)+"</td><td>"+(s===EX.winner?"WINNER":"Out in Round "+s.outRound)+"</td><td>"+s.correct+"</td></tr>";});
    h+="</table><p class='note'>Tie rule (round reached, then correct answers, then entry order) is an ASSUMPTION — not an official rule.</p>";
  }
  if(EX.audit.length){
    h+="<h3>Audit trail</h3><table><tr><th>Time</th><th>Student</th><th>ID</th><th>Round</th><th>Word</th><th>Given</th><th>Verdict</th></tr>";
    EX.audit.slice().reverse().forEach(function(a){h+="<tr><td>"+esc(a.t)+"</td><td>"+esc(a.name)+"</td><td>"+esc(a.id)+"</td><td>"+a.round+"</td><td>"+esc(a.word)+"</td><td>"+esc(a.given)+"</td><td>"+(a.replaced?"REPLACED":(a.ok?"Correct":"OUT"))+"</td></tr>";});
    h+="</table>";
  }
  if(EX.finished&&lastOk!==null&&lastOk!==undefined){
    h="<div class='fb "+(lastOk?"ok":"no")+"' style='display:block'>"+(lastOk?"Correct! The tournament is complete.":"Wrong &mdash; the student is OUT. The tournament is complete.")+"</div>"+h;
  }
  box.innerHTML=h;
  var j=$("eJudge"), r=$("eReplace"), inp=$("eAns");
  if(j)j.addEventListener("click",exJudge);
  if(r)r.addEventListener("click",exReplace);
  if(inp){inp.focus();inp.addEventListener("keydown",function(e){if(e.key==="Enter")exJudge();});}
  var fb=$("eFb");
  if(fb&&lastOk!==null&&lastOk!==undefined&&!keepFb){fb.className="fb "+(lastOk?"ok":"no");fb.innerHTML=lastOk?"Correct!":"Wrong — the student is OUT.";}
}
function printExam(){
  var h="<h2>Spelling Star — Tournament Results</h2><p>Date: "+nowStr()+" · Rounds: Spelling, Jumbled Word, Fill in the Gaps, Super Word · Knockout: one wrong answer = out.</p>";
  h+="<h3>Final ranking</h3><table><tr><th>Rank</th><th>Student</th><th>ID</th><th>Result</th><th>Correct</th></tr>";
  ranking().forEach(function(s,i){h+="<tr><td>"+(i+1)+"</td><td>"+esc(s.name)+"</td><td>"+esc(s.id)+"</td><td>"+(s===EX.winner?"WINNER":"Out in Round "+s.outRound)+"</td><td>"+s.correct+"</td></tr>";});
  h+="</table><p>Tie rule used for this sheet (round reached, then correct answers, then entry order): ASSUMPTION — not an official Spelling Star rule. Pass/skip: none in official mode (ASSUMPTION). Word replacement before an answer is an organizer decision and is logged.</p>";
  h+="<h3>Audit trail</h3><table><tr><th>Time</th><th>Student</th><th>ID</th><th>Round</th><th>Word</th><th>Given</th><th>Verdict</th></tr>";
  EX.audit.forEach(function(a){h+="<tr><td>"+esc(a.t)+"</td><td>"+esc(a.name)+"</td><td>"+esc(a.id)+"</td><td>"+a.round+"</td><td>"+esc(a.word)+"</td><td>"+esc(a.given)+"</td><td>"+(a.replaced?"REPLACED":(a.ok?"Correct":"OUT"))+"</td></tr>";});
  h+="</table><p>Teacher's Signature: ______________________ &nbsp;&nbsp; Seal: ______________</p>";
  doPrint(h);
}

/* ---------- Worksheets ---------- */
function renderWSStu(){
  var h="";
  STUDENTS.forEach(function(s,i){h+="<option value='"+i+"'"+(i===0?" selected":"")+">"+esc(s.n)+(s.id?" &middot; "+esc(s.id):"")+"</option>";});
  $("wStu").innerHTML=h;
}
function wsItems(){
  var mode=$("wMode").value, count=parseInt($("wCount").value,10), items;
  if(mode==="super"){items=shuffle(SUPER).slice(0,count);}
  else{items=shuffle(BANK).slice(0,count);}
  return items;
}
function wsQuestionHTML(it,mode){
  var showBn=$("wBangla").checked, showDef=$("wDef").checked, showEx=$("wEx").checked;
  var q="",clue=[];
  if(mode==="jumbled"){q='<div class="wsWord">'+esc(jumble(it.w))+'</div>';}
  else if(mode==="gaps"){q='<div class="wsWord">'+esc(gapPattern(it.w))+'</div>';}
  else if(mode==="super"){q='<div class="wsWord">'+esc(it.cat)+'</div>';}
  else{q='<div class="wsWord">Write the correct spelling:</div>';}
  if(mode==="super"){if(showDef&&it.c)clue.push(esc(it.c));}
  else{
    if(showBn&&it.bn)clue.push('<span class="wsBn">'+esc(it.bn)+'</span>');
    if(showDef)clue.push(esc(it.en)+(it.pos?' <i>('+esc(it.pos)+')</i>':''));
    if(showEx&&it.ex)clue.push('<i>&ldquo;'+esc(it.ex)+'&rdquo;</i>');
  }
  return q+(clue.length?'<div class="wsClue">'+clue.join('<br>')+'</div>':'');
}
function wsAutoFont(rows){return rows>=20?12:rows>=15?13:rows>=10?14:16;}
function wsLiveInfo(){
  var n=Math.min(parseInt($("wCount").value,10)||10,($("wMode").value==="super"?SUPER:BANK).length);
  $("wLive").textContent="\uD83D\uDCC4 "+(($("wMode").value==="super"?SUPER:BANK).length)+" words in bank \u2022 worksheet will have exactly "+n+" rows.";
}
function genWorksheet(){
  var mode=$("wMode").value, items=wsItems(), stu=STUDENTS[parseInt($("wStu").value,10)]||{n:"",id:""};
  var rows=Math.max(1,parseInt($("wRows").value,10)||10);
  var fv=$("wFont").value, fs=(fv==="auto")?wsAutoFont(rows):(parseInt(fv,10)||14);
  var head="<div class='wsHead'><h2>Self Scale Academy</h2><div class='wsTitle'>Spelling Practice Worksheet \u2014 "+esc(modeName(mode))+"</div><div class='wsMeta'>Student: <b>"+esc(stu.n)+(stu.id?" ("+esc(stu.id)+")":"")+"</b> &nbsp; Date: __________ &nbsp; Score: ______ / "+items.length+"</div></div>";
  var h="<div class='wsWrap' style='font-size:"+fs+"px;font-family:\"Times New Roman\",Times,serif'>";
  for(var p=0;p<items.length;p+=rows){
    h+="<div class='wsPage'>"+(p===0?head:"");
    for(var i=p;i<Math.min(p+rows,items.length);i++){
      var it=items[i];
      h+="<div class='wsQ'><span class='wsN'>"+(i+1)+".</span><span class='wsP'>"+wsQuestionHTML(it,mode)+"</span><span class='wsA'></span></div>";
    }
    h+="<div class='wsFoot'>Prepared by Muhammad Jahid Hasan \u2014 Self Scale Academy &nbsp;|&nbsp; Page "+(Math.floor(p/rows)+1)+" of "+Math.ceil(items.length/rows)+"</div>";
    h+="</div>";
  }
  if($("wKey").checked){
    h+="<div class='wsKey'><h2>Answer Key \u2014 for the teacher only</h2><table><tr><th>No.</th><th>Word</th><th>Meaning</th></tr>";
    items.forEach(function(it,i){h+="<tr><td>"+(i+1)+"</td><td><b>"+esc(it.w)+"</b></td><td>"+esc((it.bn?it.bn+" \u2014 ":"")+(it.c||it.en||""))+"</td></tr>";});
    h+="</table></div>";
  }
  h+="</div>";
  $("printArea").innerHTML=h;
  $("wPrev").innerHTML=h;
  say("Worksheet is ready \u2014 press Print.","ok");
}


/* ---------- Results Platform (teacher only — one platform for all scores) ---------- */
var RES_ASC=false;
function resRows(){
  var f=$("resFilter").value;
  var rows=HISTORY.filter(function(c){return !f||c.student===f;});
  rows.sort(function(a,b){return RES_ASC?(HISTORY.indexOf(a)-HISTORY.indexOf(b)):(HISTORY.indexOf(b)-HISTORY.indexOf(a));});
  return rows;
}
function resTableHTML(rows){
  if(!rows.length)return "<p class='note'>No finished tests yet.</p>";
  var h="<table><tr><th>#</th><th>Date</th><th>Student</th><th>ID</th><th>Round / Test</th><th>Obtained</th><th>Total</th><th>%</th><th>Grade</th></tr>";
  rows.forEach(function(c,i){h+="<tr><td>"+(i+1)+"</td><td>"+esc(c.date)+"</td><td>"+esc(c.student)+"</td><td>"+esc(c.id)+"</td><td>"+esc(c.test)+"</td><td>"+c.obtained+"</td><td>"+c.total+"</td><td>"+c.pct+"</td><td><b>"+esc(c.grade)+"</b></td></tr>";});
  return h+"</table>";
}
function fillStudentSelects(){
  var opts=STUDENTS.map(function(s){return "<option value='"+esc(s.n)+"'>"+esc(s.n)+" ("+esc(s.id)+")</option>";}).join("");
  $("repStu").innerHTML=opts;
  $("certStu").innerHTML=opts;
  $("mkStu").innerHTML=opts;
  var rf=$("resFilter");var cur=rf.value;
  rf.innerHTML="<option value=''>All students</option>"+STUDENTS.map(function(s){return "<option value='"+esc(s.n)+"'>"+esc(s.n)+"</option>";}).join("");
  rf.value=cur;
  fillCertTests();
}
function renderResults(){
  fillStudentSelects();
  renderPhotoBox();
  $("resDash").innerHTML=resTableHTML(resRows())+"<p class='note'>Scores are saved on this device only.</p>";
}
function genReport(){
  var n=$("repStu").value;
  var list=HISTORY.filter(function(c){return c.student===n;});
  if(!list.length){$("repBox").innerHTML="<p class='note'>No tests recorded for "+esc(n)+" yet.</p>";return;}
  var st=STUDENTS.filter(function(s){return s.n===n;})[0]||{id:""};
  var best=list.reduce(function(a,b){return b.pct>a.pct?b:a;},list[0]);
  var avg=Math.round(list.reduce(function(a,b){return a+b.pct;},0)/list.length*10)/10;
  var first=list[0].pct,last=list[list.length-1].pct;
  var trend=last>first?"Improving \u2191":(last<first?"Needs work \u2193":"Steady \u2192");
  var h="<div class='wsHead' style=\"font-family:'Times New Roman',Times,serif\"><h2>Self Scale Academy</h2><div class='wsTitle'>Student Progress Report</div><div class='wsMeta'>Student: <b>"+esc(n)+"</b>"+(st.id?" ("+esc(st.id)+")":"")+"</div></div>";
  h+="<table><tr><th>Tests taken</th><td>"+list.length+"</td></tr><tr><th>Best score</th><td>"+best.pct+"% ("+esc(best.test)+", "+esc(best.date)+")</td></tr><tr><th>Average</th><td>"+avg+"%</td></tr><tr><th>Trend (first \u2192 last)</th><td><b>"+trend+"</b> ("+first+"% \u2192 "+last+"%)</td></tr></table>";
  h+="<h3>Dated test history</h3>"+resTableHTML(list.slice().reverse());
  h+="<p style='margin-top:26px'>Teacher's Signature: ______________________ &nbsp;&nbsp; Date: __________ &nbsp;&nbsp; Seal: __________</p>";
  $("repBox").innerHTML=h;
}
function addOfflineMark(){
  var n=$("mkStu").value, t=$("mkTest").value.trim(), ob=parseFloat($("mkOb").value), to=parseFloat($("mkTo").value);
  var err=$("mkErr");err.textContent="";
  var st=STUDENTS.filter(function(x){return x.n===n;})[0]||{id:""};
  if(!t){err.textContent="Write the test name.";return;}
  if(!(ob>=0)||!(to>0)||ob>to){err.textContent="Obtained / Total must be numbers, and Obtained \u2264 Total.";return;}
  var pct=Math.round(ob*1000/to)/10;
  HISTORY.push({date:nowStr(),student:n,id:st.id||"",test:t+" (Offline)",obtained:ob,total:to,pct:pct,grade:grade(pct)});
  try{localStorage.setItem("ss_history",JSON.stringify(HISTORY));}catch(e){}
  $("mkTest").value="";$("mkOb").value="";$("mkTo").value="";
  renderResults();say("Offline score added for "+n+".","ok");
}
function fillCertTests(){
  var n=$("certStu").value;
  var list=HISTORY.filter(function(c){return c.student===n;});
  var h="<option value=''>Overall Achievement</option>";
  list.forEach(function(c,i){h+="<option value='"+i+"'>"+esc(c.test)+" — "+esc(c.date)+" ("+c.obtained+"/"+c.total+")</option>";});
  $("certTest").innerHTML=h;
}
function certHTML(){
  var n=$("certStu").value;
  var st=STUDENTS.filter(function(s){return s.n===n;})[0]||{id:""};
  var list=HISTORY.filter(function(c){return c.student===n;});
  var ti=$("certTest").value, c=ti===""?null:list[parseInt(ti,10)];
  var line=c?("for outstanding performance in <b>"+esc(c.test)+"</b><br>Score: <b>"+c.obtained+" / "+c.total+" ("+c.pct+"% — Grade "+esc(c.grade)+")</b><br>Date: "+esc(c.date))
            :"for dedicated preparation and outstanding commitment<br>to the Spelling Star 2026 championship training";
  return "<div class='cert'><div style='font-size:40px'>\u2B50</div><h2>SELF SCALE ACADEMY</h2><h1>Certificate of Achievement</h1>"+
  "<p>This certificate is proudly presented to</p><div class='cname'>"+esc(n)+"</div>"+
  (st.id?"<p>Registration No. <b>"+esc(st.id)+"</b></p>":"")+
  "<p>"+line+"</p>"+
  "<div class='sig'><div>______________________<br><b>Muhammad Jahid Hasan</b><br>Owner &amp; Teacher</div><div>______________________<br>Date &amp; Seal</div></div></div>";
}
function genCert(){$("certBox").innerHTML=certHTML();}
function printCert(){doPrint(certHTML());}
function wsDocHTML(){return $("printArea").innerHTML||"";}
function dlWorksheetDoc(){
  if(!$("printArea").innerHTML){say("Generate the worksheet first.","warn");return;}
  dlDoc("Spelling_Worksheet_"+$("wMode").value+".doc",$("printArea").innerHTML);
}
function printReport(){doPrint("<div style=\"font-family:'Times New Roman',Times,serif\">"+$("repBox").innerHTML+"</div>");}
function printResults(){doPrint("<h2>Self Scale Academy — Results Dashboard</h2>"+resTableHTML(resRows()));}
function dlResultsCsv(){
  var rows=resRows();if(!rows.length){say("No scores to export yet.","warn");return;}
  var csv="Date,Student,ID,Test,Obtained,Total,Percent,Grade\n";
  rows.forEach(function(c){csv+="\""+String(c.date).replace(/"/g,'""')+"\",\""+c.student.replace(/"/g,'""')+"\",\""+String(c.id).replace(/"/g,'""')+"\",\""+String(c.test).replace(/"/g,'""')+"\","+c.obtained+","+c.total+","+c.pct+","+c.grade+"\n";});
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"}));a.download="SelfScaleAcademy_Results.csv";
  document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},800);
}

function dlDoc(filename,html){
  var doc='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>'+html+'</body></html>';
  var blob=new Blob(["\ufeff"+doc],{type:"application/msword"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;
  document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},800);
}
/* ---------- Print ---------- */

function doPrint(html){
  $("printArea").innerHTML=html;
  window.print();
}

/* ---------- Init ---------- */
document.querySelectorAll("nav button").forEach(function(b){b.addEventListener("click",function(){show(b.getAttribute("data-v"));});});
$("pStart").addEventListener("click",startPractice);
$("eAddReg").addEventListener("click",exAddStudents);
$("eStart").addEventListener("click",exStart);
$("eReset").addEventListener("click",exReset);
$("ePrint").addEventListener("click",function(){if(EX)printExam();});
$("hPrint").addEventListener("click",printHistory);
$("wGen").addEventListener("click",genWorksheet);
$("wDoc").addEventListener("click",dlWorksheetDoc);
["wMode","wCount"].forEach(function(id){$(id).addEventListener("change",wsLiveInfo);});
$("resCsv").addEventListener("click",dlResultsCsv);
$("resDoc").addEventListener("click",function(){if(resRows().length)dlDoc("SelfScaleAcademy_Results.doc","<h2>Self Scale Academy \u2014 Results Dashboard</h2>"+resTableHTML(resRows()));else say("No scores to export yet.","warn");});
$("repDoc").addEventListener("click",function(){if($("repBox").innerHTML)dlDoc("Progress_Report.doc",$("repBox").innerHTML);else say("Generate the report first.","warn");});
$("certDoc").addEventListener("click",function(){if($("certBox").innerHTML)dlDoc("Certificate.doc",$("certBox").innerHTML);else say("Generate the certificate first.","warn");});
$("mkAdd").addEventListener("click",addOfflineMark);
$("resSort").addEventListener("click",function(){RES_ASC=!RES_ASC;this.textContent=RES_ASC?"Newest first":"Oldest first";renderResults();});
$("resFilter").addEventListener("change",renderResults);
$("resPrint").addEventListener("click",printResults);
$("repGen").addEventListener("click",genReport);
$("repPrint").addEventListener("click",function(){if($("repBox").innerHTML)printReport();});
$("certStu").addEventListener("change",fillCertTests);
$("certGen").addEventListener("click",genCert);
$("certPrint").addEventListener("click",function(){if($("certBox").innerHTML)printCert();});
$("wPrint").addEventListener("click",function(){window.print();});
renderStudents();
wsLiveInfo();
var reg=allStudents().reg;
if(reg.length)setStudent(reg[0].n,reg[0].id);
newExam();
show("home");

