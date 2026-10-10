
/* ===== ONLINE PORTAL: gate + roles + stage (single-file, no backend) ===== */
(function(){
"use strict";
VIEWS.push("stage");
VIEWS.push("results");
VIEWS.push("settings");
VIEWS.push("pages");
window.stagePrint=function(){
  var el=document.getElementById("view-stage");
  doPrint("<h2>Spelling Star &mdash; Teacher's Stage Guide</h2>"+el.innerHTML);
};
var ADMIN_KEY="ssa_admin_hash", SESSION=null;
function gEl(id){return document.getElementById(id);}
/* Pure-JS SHA-256 (public-domain style implementation) - used so the admin
   password works in EVERY browser, including ones without crypto.subtle
   (older browsers, in-app webviews, non-HTTPS). Output matches SHA-256. */
function sha256hex(ascii){
  ascii=unescape(encodeURIComponent(ascii));
  function rr(v,a){return (v>>>a)|(v<<(32-a));}
  var maxWord=Math.pow(2,32),result="";
  var words=[],asciiBitLength=ascii.length*8;
  var hash=sha256hex.h=sha256hex.h||[],k=sha256hex.k=sha256hex.k||[];
  var primeCounter=k.length,isComposite={};
  for(var candidate=2;primeCounter<64;candidate++){
    if(!isComposite[candidate]){
      for(var i=0;i<313;i+=candidate){isComposite[i]=candidate;}
      hash[primeCounter]=(Math.pow(candidate,0.5)*maxWord)|0;
      k[primeCounter++]=(Math.pow(candidate,1/3)*maxWord)|0;
    }
  }
  ascii+="\x80";
  while(ascii.length%64-56)ascii+="\x00";
  for(var i=0;i<ascii.length;i++){
    var j=ascii.charCodeAt(i);
    if(j>>8)return; // ASCII only
    words[i>>2]|=j<<((3-i)%4)*8;
  }
  words[words.length]=((asciiBitLength/maxWord)|0);
  words[words.length]=(asciiBitLength);
  for(var j=0;j<words.length;){
    var w=words.slice(j,j+=16),oldHash=hash;
    hash=hash.slice(0,8);
    for(var i=0;i<64;i++){
      var w15=w[i-15],w2=w[i-2];
      var a=hash[0],e=hash[4];
      var temp1=hash[7]
        +(rr(e,6)^rr(e,11)^rr(e,25))
        +((e&hash[5])^((~e)&hash[6]))
        +k[i]
        +(w[i]=(i<16)?w[i]:(w[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
      var temp2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
      hash=[(temp1+temp2)|0].concat(hash);
      hash[4]=(hash[4]+temp1)|0;
    }
    for(var i=0;i<8;i++){hash[i]=(hash[i]+oldHash[i])|0;}
  }
  for(var i=0;i<8;i++){
    for(var j=3;j+1;j--){
      var b=(hash[i]>>(j*8))&255;
      result+=((b<16)?"0":"")+b.toString(16);
    }
  }
  return result;
}
function getAdminHash(){try{return localStorage.getItem(ADMIN_KEY);}catch(e){return null;}}
var HIDE_STU=["eAddReg","eQPer","eStartRound","eReset","ePrint","wStu"];
/* Student gate = two separate steps. Step 1: NAME only. Step 2: REGISTRATION NO. only. */
var G_NAME=null;
function gateStep1Next(){
  var n=gEl("gName").value.trim(), err=gEl("gErr");
  err.textContent="";
  if(!n){err.textContent="Please enter your full name.";return;}
  var hit=STUDENTS.find(function(s){return s.n.toLowerCase()===n.toLowerCase();});
  if(!hit){err.textContent="We can't find this name on our registered list. Please check with your teacher.";return;}
  G_NAME=hit.n;
  gEl("gateStep1").classList.add("hidden");
  gEl("gateStep2").classList.remove("hidden");
  gEl("gWho").textContent="Welcome, "+G_NAME+" — now enter your registration number.";
  gEl("gReg").value="";
  gEl("gReg").focus();
}
function gateBack(){
  G_NAME=null;
  gEl("gateStep2").classList.add("hidden");
  gEl("gateStep1").classList.remove("hidden");
  gEl("gErr").textContent="";
}
function studentLogin(){
  var r=gEl("gReg").value.trim(), err=gEl("gErr");
  err.textContent="";
  if(!G_NAME){gateBack();return;}
  if(!r){err.textContent="Please enter your registration number.";return;}
  var hit=STUDENTS.find(function(s){return s.n.toLowerCase()===G_NAME.toLowerCase();});
  if(!hit||hit.id!==r){err.textContent="That registration number does not match "+G_NAME+". Please try again.";return;}
  enterApp("student",hit.n,hit.id);
}
function teacherOpen(){
  gEl("gateHome").classList.add("hidden");gEl("gateTeacher").classList.remove("hidden");
  var hash=getAdminHash(),form=gEl("tchForm"),notset=gEl("tchNotSet");
  gEl("tchErr").textContent="";
  if(!hash){form.classList.add("hidden");notset.classList.remove("hidden");}
  else{form.classList.remove("hidden");notset.classList.add("hidden");}
}
function teacherBack(){gEl("gateTeacher").classList.add("hidden");gEl("gateHome").classList.remove("hidden");}
function teacherLogin(){
  var err=gEl("tchErr");err.textContent="";
  var name=gEl("tchName").value.trim()||"Muhammad Jahid Hasan";
  var pw=gEl("tchPass").value;
  if(!pw){err.textContent="Password is required.";return;}
  var hx;
  try{hx=sha256hex(pw);}catch(e){err.textContent="Password check failed on this device. Please try again.";return;}
  if(hx===getAdminHash()){enterApp("admin",name,"");}
  else{err.textContent="Wrong password. Please try again.";}
}
function enterApp(role,name,id){
  SESSION={role:role,name:name,id:id};
  try{sessionStorage.setItem("ssa_session",JSON.stringify(SESSION));}catch(e){}
  document.body.classList.remove("locked");
  gEl("gate").style.display="none";
  gEl("navExit").style.display="";
  if(role==="student"){
    document.body.classList.add("student-mode");
    setStudent(name,id);
    gEl("studentChip").textContent=name+" \u00B7 "+id;
    gEl("stuList").innerHTML="<h3>Welcome, "+esc(name)+"</h3><p class=\"note\">Registration no. "+esc(id)+". Your scores appear under Score History (saved on this device).</p>";
    var examNav=document.querySelector('nav button[data-v="exam"]');if(examNav)examNav.style.display="none";
    HIDE_STU.forEach(function(x){var e=gEl(x);if(e)e.classList.add("adminOnly");});
    var idx=STUDENTS.findIndex(function(s){return s.n===name&&s.id===id;});
    var ws=gEl("wStu");if(ws&&idx>=0)ws.selectedIndex=idx;
    renderHistory=function(){
      var list=HISTORY.filter(function(c){return c.student===name&&c.id===id;});
      var h="";
      if(!list.length){h="<p class='note'>No finished tests yet. Your scores will appear here.</p>";}
      else{
        h="<table><tr><th>Date</th><th>Round / Test</th><th>Obtained</th><th>Total</th><th>%</th><th>Grade</th></tr>";
        list.slice().reverse().forEach(function(c){h+="<tr><td>"+esc(c.date)+"</td><td>"+esc(c.test)+"</td><td>"+c.obtained+"</td><td>"+c.total+"</td><td>"+c.pct+"</td><td>"+esc(c.grade)+"</td></tr>";});
        h+="</table>";
      }
      gEl("histBox").innerHTML=h;
    };
    show("practice");
  }else{
    document.body.classList.add("admin-mode");
    gEl("studentChip").textContent=name+" (Teacher)";
    if(typeof renderResults==="function")renderResults();
    show("results");
  }
  if(!gEl("devNote")){
    gEl("view-history").insertAdjacentHTML("beforeend","<p class=\"note\" id=\"devNote\">Scores are saved on this device only.</p>");
  }
}
function exitApp(){try{sessionStorage.removeItem("ssa_session");}catch(e){}location.reload();}
document.addEventListener("DOMContentLoaded",function(){
  document.body.classList.add("locked");
  gEl("gNext").addEventListener("click",gateStep1Next);
  gEl("gName").addEventListener("keydown",function(e){if(e.key==="Enter")gateStep1Next();});
  gEl("gBack").addEventListener("click",gateBack);
  gEl("gEnter").addEventListener("click",studentLogin);
  gEl("gReg").addEventListener("keydown",function(e){if(e.key==="Enter")studentLogin();});
  gEl("gTeacher").addEventListener("click",teacherOpen);
  gEl("tchBack").addEventListener("click",teacherBack);
  gEl("tchLogin").addEventListener("click",teacherLogin);
  gEl("tchPass").addEventListener("keydown",function(e){if(e.key==="Enter")teacherLogin();});
  gEl("navExit").addEventListener("click",exitApp);
  var s=null;try{s=JSON.parse(sessionStorage.getItem("ssa_session")||"null");}catch(e){}
  if(s&&s.role&&(s.role==="student"||s.role==="admin")){
    if(s.role==="admin"){enterApp("admin",s.name,s.id||"");}
    else{
      var hit=STUDENTS.find(function(x){return x.n.toLowerCase()===String(s.name).toLowerCase()&&x.id===s.id;});
      if(hit)enterApp("student",hit.n,hit.id);
    }
  }
});
})();
