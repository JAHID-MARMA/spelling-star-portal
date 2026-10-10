
/* ===== ONLINE PORTAL: gate + roles + stage (single-file, no backend) ===== */
(function(){
"use strict";
VIEWS.push("stage");
window.stagePrint=function(){
  var el=document.getElementById("view-stage");
  doPrint("<h2>Spelling Star &mdash; Teacher's Stage Guide</h2>"+el.innerHTML);
};
var ADMIN_KEY="ssa_admin_hash", SESSION=null;
function gEl(id){return document.getElementById(id);}
function sha256hex(s){
  return crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)).then(function(b){
    var a=new Uint8Array(b),out="";
    for(var i=0;i<a.length;i++){out+=("0"+a[i].toString(16)).slice(-2);}
    return out;
  });
}
function getAdminHash(){try{return localStorage.getItem(ADMIN_KEY);}catch(e){return null;}}
var HIDE_STU=["eAddReg","eQPer","eStartRound","eReset","ePrint","pCount","pMode","wCount","wMode","wKey","wStu"];
function studentLogin(){
  var n=gEl("gName").value.trim(), r=gEl("gReg").value.trim(), err=gEl("gErr");
  err.textContent="";
  if(!n||!r){err.textContent="Please enter your full name and registration number.";return;}
  var hit=STUDENTS.find(function(s){return s.n.toLowerCase()===n.toLowerCase()&&s.id===r;});
  if(!hit){err.textContent="Name or registration number does not match. Please check with your teacher.";return;}
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
  sha256hex(pw).then(function(hx){
    if(hx===getAdminHash()){enterApp("admin",name,"");}
    else{err.textContent="Wrong password. Please try again.";}
  });
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
  }
  if(!gEl("devNote")){
    gEl("view-history").insertAdjacentHTML("beforeend","<p class=\"note\" id=\"devNote\">Scores are saved on this device only.</p>");
  }
}
function exitApp(){try{sessionStorage.removeItem("ssa_session");}catch(e){}location.reload();}
document.addEventListener("DOMContentLoaded",function(){
  document.body.classList.add("locked");
  gEl("gEnter").addEventListener("click",studentLogin);
  gEl("gName").addEventListener("keydown",function(e){if(e.key==="Enter")studentLogin();});
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
