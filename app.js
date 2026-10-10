
"use strict";




"use strict";
function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function norm(s){return String(s||"").toLowerCase().replace(/[^a-z]/g,"");}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function grade(p){if(p>=90)return "A+";if(p>=80)return "A";if(p>=70)return "A-";if(p>=60)return "B";if(p>=50)return "C";return "F";}
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
function renderStudents(){
  var g=allStudents(),h="";
  h+="<h3>Registered (Spelling Star cards)</h3><div class='grid'>";
  g.reg.forEach(function(s){h+="<button class='stu' data-n='"+esc(s.n)+"' data-id='"+esc(s.id)+"'>"+esc(s.n)+"<small>"+esc(s.id)+"</small></button>";});
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
  "<tr><th>Grade</th><td><b>"+esc(c.grade)+"</b> <span class='note'>(grade scale: teacher scale, ASSUMPTION)</span></td></tr></table></div>";
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
function wsClue(it,mode){
  if(mode==="super"){return "Category: "+it.cat+" \u2014 Clue: "+it.c;}
  if(mode==="jumbled"){return "Unscramble: "+jumble(it.w)+" \u2014 ("+it.en+")";}
  if(mode==="gaps"){return "Fill in the gaps: "+gapPattern(it.w)+" \u2014 ("+it.en+")";}
  return it.bn+" \u2014 "+it.en+" ("+it.pos+")";
}
function genWorksheet(){
  var mode=$("wMode").value, items=wsItems(), stu=STUDENTS[parseInt($("wStu").value,10)]||{n:"",id:""};
  var h="<div class='wsHead'><h2>Notun Kuri English Version School</h2><div class='wsTitle'>Spelling Practice Worksheet \u2014 "+esc(modeName(mode))+"</div><div class='wsMeta'>Student: <b>"+esc(stu.n)+(stu.id?" ("+esc(stu.id)+")":"")+"</b> &nbsp; Date: __________ &nbsp; Score: ______ / "+items.length+"</div></div>";
  h+="<div class='wsBody'>";
  items.forEach(function(it,i){h+="<div class='wsQ'><span class='wsN'>"+(i+1)+".</span><span class='wsP'>"+esc(wsClue(it,mode))+"</span><span class='wsA'></span></div>";});
  h+="</div>";
  if($("wKey").checked){
    h+="<div class='wsKey'><h2>Answer Key \u2014 for the teacher only</h2><table><tr><th>No.</th><th>Word</th><th>Meaning</th></tr>";
    items.forEach(function(it,i){h+="<tr><td>"+(i+1)+"</td><td><b>"+esc(it.w)+"</b></td><td>"+esc(it.c||it.en||"")+"</td></tr>";});
    h+="</table></div>";
  }
  $("printArea").innerHTML=h;
  say("Worksheet is ready \u2014 press Print.","ok");
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
$("wPrint").addEventListener("click",function(){window.print();});
renderStudents();
var reg=allStudents().reg;
if(reg.length)setStudent(reg[0].n,reg[0].id);
newExam();
show("home");

