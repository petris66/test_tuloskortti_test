"use strict";
const KEY="golfVoiceScorecardTestBuild02";
const MAX=4;
const pars=[4,4,3,5,4,4,5,3,4,4,3,4,5,4,4,3,5,4];
let state={players:1,names:["Petri","P2","P3","P4"],hole:1,scores:Array.from({length:18},()=>Array(4).fill("")),history:[],speak:true};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&x.scores)state={...state,...x}}catch(e){}}
function activePar(){return pars[state.hole-1]}
function setPar(p){pars[state.hole-1]=p;render()}
function render(){
 $("#holeNumber").textContent=state.hole;
 $$("#playerButtons .btn").forEach(b=>b.classList.toggle("active",+b.dataset.count===state.players));
 $$(".par-select .btn").forEach(b=>b.classList.toggle("active",+b.dataset.par===activePar()));
 $("#speakToggle").checked=state.speak;
 renderNames(); renderTable(); save();
}
function renderSetup(){
 $("#playerButtons").innerHTML=[1,2,3,4].map(n=>`<button class="btn ${n===state.players?"active":""}" data-count="${n}">${n}</button>`).join("");
 $("#playerButtons").onclick=e=>{const b=e.target.closest("[data-count]");if(b){state.players=+b.dataset.count;render()}};
}
function renderNames(){
 $("#nameInputs").innerHTML=Array.from({length:state.players},(_,i)=>`<input class="name-setup" data-i="${i}" maxlength="15" value="${esc(state.names[i])}" aria-label="Pelaaja ${i+1}">`).join("");
 $$(".name-setup").forEach(el=>el.onchange=()=>{state.names[+el.dataset.i]=el.value.trim()||`P${+el.dataset.i+1}`;render()});
}
function renderTable(){
 $("#thead").innerHTML=`<tr><th>Reikä</th><th>Par</th>${Array.from({length:state.players},(_,i)=>`<th><input class="name" data-name="${i}" value="${esc(state.names[i])}"></th>`).join("")}</tr>`;
 $("#tbody").innerHTML=Array.from({length:18},(_,h)=>`<tr class="${h+1===state.hole?"current-row":""}"><td><b>${h+1}</b></td><td>${pars[h]}</td>${Array.from({length:state.players},(_,p)=>`<td><input class="score" inputmode="numeric" data-h="${h}" data-p="${p}" value="${esc(state.scores[h][p])}"></td>`).join("")}</tr>`).join("");
 const totals=Array.from({length:state.players},(_,p)=>state.scores.reduce((a,r)=>a+(Number(r[p])||0),0));
 const rel=totals.map((t,p)=>{let played=0,par=0;state.scores.forEach((r,h)=>{if(r[p]!==""){played+=Number(r[p])||0;par+=pars[h]}});return played-par});
 $("#tfoot").innerHTML=`<tr class="total"><td colspan="2">Yhteensä</td>${totals.map((t,i)=>`<td>${t} <small>(${rel[i]>=0?"+":""}${rel[i]})</small></td>`).join("")}</tr>`;
 $$(".name").forEach(el=>el.onchange=()=>{state.names[+el.dataset.name]=el.value.trim()||`P${+el.dataset.name+1}`;render()});
 $$(".score").forEach(el=>el.onchange=()=>{const v=el.value.trim();state.scores[+el.dataset.h][+el.dataset.p]=/^(?:[1-9]|1\d|20)$/.test(v)?+v:"";save();renderTable()});
}
function norm(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.,!?;:]/g," ").replace(/\s+/g," ").trim()}
const nums={yksi:1,yks:1,ykkonen:1,kaksi:2,kaks:2,kakkonen:2,kolme:3,kolmonen:3,nelja:4,nelonen:4,nelkku:4,viisi:5,viis:5,viitonen:5,vitonen:5,kuusi:6,kuus:6,kuutonen:6,seitsemän:7,seitseman:7,seiska:7,kahdeksan:8,kasi:8,yska:9,yhdeksan:9,ysi:9,kymmenen:10,kymppi:10};
function numberFrom(words){for(const w of words){if(/^\d{1,2}$/.test(w)){const n=+w;if(n>=1&&n<=20)return n}if(nums[w])return nums[w]}return null}
function playerFrom(text){
 const n=norm(text);
 for(let i=0;i<state.players;i++){const name=norm(state.names[i]);if(name&&n.includes(name))return i}
 const m=n.match(/pelaaja\s*([1-4])/); if(m&&+m[1]<=state.players)return +m[1]-1;
 if(/\b(minulle|mulle|mina|mä|ma)\b/.test(n))return 0;
 return null;
}
function golfScore(text){
 const n=norm(text), p=activePar();
 if(/\balbatross\b/.test(n))return p-3;
 if(/\beagle\b/.test(n))return p-2;
 if(/\bbirdie\b|\bpirkku\b/.test(n))return p-1;
 if(/\bpar\b/.test(n))return p;
 if(/\b(triple|tripla|kolmoisbogi)\b/.test(n))return p+3;
 if(/\b(double bogey|double|tupla|tuplabogi)\b/.test(n))return p+2;
 if(/\b(bogey|bogi)\b/.test(n))return p+1;
 return numberFrom(n.split(" "));
}
function announce(msg){$("#status").innerHTML=msg;addLog($("#status").textContent);if(state.speak&&"speechSynthesis"in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance($("#status").textContent);u.lang="fi-FI";u.rate=1;speechSynthesis.speak(u)}}
function addLog(msg){const li=document.createElement("li");li.textContent=new Date().toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"})+" – "+msg;$("#log").prepend(li)}
function pushHistory(h,p,oldValue,newValue){state.history.push({h,p,oldValue,newValue});if(state.history.length>50)state.history.shift()}
function setScore(h,p,value,label){
 const old=state.scores[h][p];pushHistory(h,p,old,value);state.scores[h][p]=value;save();renderTable();
 announce(`<span class="heard">${esc(state.names[p])}: ${value} lyöntiä</span><br>${esc(label||"Tulos kirjattu")}, reikä ${h+1} (par ${pars[h]}).`);
}
function firstEmptyPlayer(h){for(let p=0;p<state.players;p++)if(state.scores[h][p]==="")return p;return 0}
function undo(){
 const x=state.history.pop();if(!x){announce("Ei peruttavaa kirjausta.");return}
 state.scores[x.h][x.p]=x.oldValue;state.hole=x.h+1;render();announce(`Peruttu. ${esc(state.names[x.p])}, reikä ${x.h+1}.`);
}
function processSpeech(raw){
 const n=norm(raw);if(!n)return;
 if(/\b(peru|undo|poista viimeinen)\b/.test(n)){undo();return}
 if(/\b(mika reika|mikä reikä)\b/.test(raw.toLowerCase())){announce(`Nyt pelataan reikää ${state.hole}, par ${activePar()}.`);return}
 let p=playerFrom(raw), h=state.hole-1;
 const correcting=/\b(korjaa|muuta|vaihda)\b/.test(n);
 if(p===null)p=correcting?Math.max(0,firstEmptyPlayer(h)-1):firstEmptyPlayer(h);
 const score=golfScore(raw);
 if(score===null||score<1||score>20){announce(`En saanut tulosta varmasti selville: “${esc(raw)}”. Sano esimerkiksi birdie, par, bogi tai numero.`);return}
 const term=score===activePar()-2?"Eagle":score===activePar()-1?"Birdie":score===activePar()?"Par":score===activePar()+1?"Bogi":score===activePar()+2?"Tuplabogi":"Tulos";
 setScore(h,p,score,correcting?"Korjaus tehty":term);
 const complete=state.scores[h].slice(0,state.players).every(v=>v!=="");
 if(complete&&state.hole<18){state.hole++;render();announce(`${term} kirjattu. Reikä ${h+1} valmis. Seuraava reikä ${state.hole}, par ${activePar()}.`)}
 else if(complete&&state.hole===18)announce(`Kierroksen kaikki tulokset on kirjattu. Tarkista tuloskortti.`);
}
function startVoice(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){announce("Tämä selain ei tue Web Speech -puheentunnistusta. Testaa pikapainikkeilla tai Chrome/Edge-selaimella HTTPS-osoitteessa.");return}
 const r=new SR();r.lang="fi-FI";r.interimResults=false;r.maxAlternatives=3;
 $("#voiceButton").classList.add("listening");$("#voiceButton").textContent="🎙️ Kuuntelen…";
 r.onresult=e=>{const text=e.results[0][0].transcript;announce(`Kuulin: <span class="heard">“${esc(text)}”</span>`);setTimeout(()=>processSpeech(text),250)};
 r.onerror=e=>announce(`Puheentunnistus epäonnistui (${esc(e.error)}). Kokeile uudelleen.`);
 r.onend=()=>{$("#voiceButton").classList.remove("listening");$("#voiceButton").textContent="🎤 Anna tulos puheella"};
 r.start();
}
load();renderSetup();render();
$(".par-select").onclick=e=>{const b=e.target.closest("[data-par]");if(b)setPar(+b.dataset.par)};
$("#voiceButton").onclick=startVoice;
$$(".quick-score").forEach(b=>b.onclick=()=>processSpeech(b.dataset.speech));
$("#speakToggle").onchange=e=>{state.speak=e.target.checked;save()};
$("#undoButton").onclick=undo;
$("#prevHole").onclick=()=>{state.hole=Math.max(1,state.hole-1);render()};
$("#nextHole").onclick=()=>{state.hole=Math.min(18,state.hole+1);render()};
$("#resetButton").onclick=()=>{if(confirm("Tyhjennetäänkö Test Build-02:n kierros?")){state.scores=Array.from({length:18},()=>Array(4).fill(""));state.history=[];state.hole=1;render();announce("Uusi testikierros aloitettu.")}};
