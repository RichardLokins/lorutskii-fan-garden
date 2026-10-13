const $ = s => document.querySelector(s);
const fmt = n => Number(n || 0).toLocaleString("ru-RU");
const local = {
  fans: () => Number(localStorage.getItem("lf_fans") || 0),
  marked: () => localStorage.getItem("lf_marked") === "1",
  votes: () => JSON.parse(localStorage.getItem("lf_votes") || '{"giggles":0,"chaos":0,"iconic":0,"cozy":0}'),
  messages: () => JSON.parse(localStorage.getItem("lf_messages") || "[]")
};
let dbOnline = false, state = {fans:0,votes:{giggles:0,chaos:0,iconic:0,cozy:0},messages:[],memes:[]};
const jokes = [
  "Модераторы, у нас тут +100 к уюту и -3 к пониманию происходящего 🌷",
  "Я пришёл на один стрим, а получил новую семью 💗",
  "Чат, ведём себя хорошо. Хотя бы следующие 7 секунд 🧁",
  "Это не прокрастинация, это поддержка культурного наследия в прямом эфире ✨",
  "Срочно: уровень милоты превышает допустимые нормы 🐣",
  "Кто принёс печеньки? Это важный сюжетный поворот 🍪",
  "Мой план на сегодня: дела, дела, lorutskii, ещё немного lorutskii 🌸",
  "Не шумим, котик стримит… ладно, шумим, но с любовью 🐈"
];
const secrets = [
  "Ты — маленькая часть большого и тёплого комьюнити 💗",
  "Пусть сегодняшний стрим подарит тебе улыбку 🌷",
  "Секретный уровень любви: бесконечность ♡",
  "Напоминание: ты молодец. Да, именно ты 🧁",
  "Пусть в чате сегодня будет побольше доброты 🦋"
];
const memePool = [
  ["🐣","Когда говоришь «последний стрим на сегодня»","и вдруг уже завтра утром"],
  ["🍓","Чат услышал слово «секрет»","чат уже нажал все кнопки"],
  ["🌈","Когда стример говорит «я спокойна»","музыка босса начинает играть"],
  ["🧋","Зашёл просто поздороваться","остался эмоционально на три сезона"],
  ["🐈","Мой уровень концентрации","пока lorutskii рассказывает историю"],
  ["💫","Когда случился легендарный момент","никто не записывал, конечно же"]
];
const labels = {giggles:"Легендарный смех",chaos:"Милый хаос",iconic:"Момент в историю",cozy:"Уютный вечер"};
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}
const cloud = window.LORUTSKII_CONFIG || {};
const cloudReady = Boolean(cloud.supabaseUrl && cloud.supabaseKey && !cloud.supabaseUrl.includes("YOUR_"));
async function api(path, body){
  if(path === "/api/status") return {databaseConfigured: cloudReady};
  if(!cloudReady) throw new Error("cloud_not_configured");
  const rpcNames = {"/api/state":"get_site_state", "/api/fan":"add_fan", "/api/vote":"add_vote", "/api/message":"add_message"};
  const rpc = rpcNames[path];
  if(!rpc) throw new Error("unknown_endpoint");
  const payload = path === "/api/vote" ? {option_name: body.option}
    : path === "/api/message" ? {nickname_input: body.nickname, message_input: body.message} : {};
  const response = await fetch(`${cloud.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: {"Content-Type":"application/json", "apikey":cloud.supabaseKey, "Authorization":`Bearer ${cloud.supabaseKey}`},
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(()=>null);
  if(!response.ok) throw new Error(data?.message || "request_failed");
  if(path === "/api/state") return data;
  if(path === "/api/fan") return {fans:Number(data)};
  if(path === "/api/vote") return {votes:data};
  if(path === "/api/message") return {message:data};
  return data;
}
function updateStats(){
  $("#fans").textContent=fmt(dbOnline?state.fans:local.fans());
  const v=dbOnline?state.votes:local.votes();
  $("#votesTotal").textContent=fmt(Object.values(v).reduce((a,b)=>a+Number(b||0),0));
  const count=dbOnline?state.fans:local.fans();
  document.querySelectorAll("[data-goal]").forEach(el=>el.style.width=Math.min(100,count/Number(el.dataset.goal)*100)+"%");
  document.querySelectorAll("[data-label]").forEach(el=>{const g=Number(el.dataset.label);el.textContent=Math.min(count,g)+" / "+g+" фанатов";});
}
function renderMessages(items){
  const host=$("#messages");host.replaceChildren();
  if(!items.length){const p=document.createElement("p");p.className="goal";p.textContent="Пока здесь тихо — стань первым, кто оставит доброе послание 🌷";host.append(p);return;}
  [...items].reverse().forEach(m=>{const article=document.createElement("article");article.className="message-card";const b=document.createElement("b");b.textContent="💌 "+(m.nickname||"анонимный фанат");const p=document.createElement("p");p.textContent=m.message||"";article.append(b,p);host.append(article);});
}
function pollStatus(){
  const vote=localStorage.getItem("lf_voted");
  document.querySelectorAll("[data-vote]").forEach(b=>b.disabled=!!vote);
  if(vote) $("#pollResult").textContent="Твой прогноз сохранён: "+(labels[vote]||"принято")+" 💫";
}
async function load(){
  try{const status=await api("/api/status");dbOnline=!!status.databaseConfigured;
    if(dbOnline){state=await api("/api/state");}
  }catch{dbOnline=false;}
  if(!dbOnline){state={fans:local.fans(),votes:local.votes(),messages:local.messages(),memes:[]};}
  updateStats();renderMessages(state.messages||[]);pollStatus();
  if(!dbOnline){$("#fanNote").textContent="Демо-режим: общий счётчик заработает после подключения базы данных.";}
}
$("#fanBtn").addEventListener("click",async()=>{
  if(local.marked()){toast("Ты уже оставил сердечко с этого браузера 💗");return;}
  const btn=$("#fanBtn");btn.disabled=true;
  try{
    if(dbOnline){const d=await api("/api/fan",{});state.fans=d.fans;}
    else {const n=local.fans()+1;localStorage.setItem("lf_fans",String(n));state.fans=n;}
    localStorage.setItem("lf_marked","1");$("#fanNote").textContent="Твоё сердечко расцвело в нашем садике! 🌸";toast("Спасибо, что ты здесь 💗");updateStats();
  }catch{toast("Не получилось сохранить отметку. Попробуй ещё раз.");}
  btn.disabled=false;
  if(local.marked())btn.textContent="💗 Ты уже оставил сердечко";
});
document.querySelectorAll("[data-vote]").forEach(btn=>btn.addEventListener("click",async()=>{
  if(localStorage.getItem("lf_voted"))return;
  const option=btn.dataset.vote;
  try{
    if(dbOnline){const d=await api("/api/vote",{option});state.votes=d.votes||state.votes;}
    else {const v=local.votes();v[option]=(v[option]||0)+1;localStorage.setItem("lf_votes",JSON.stringify(v));state.votes=v;}
    localStorage.setItem("lf_voted",option);pollStatus();updateStats();toast("Голос принят! Пусть сбудется ✨");
  }catch{toast("Не получилось записать голос. Попробуй ещё раз.");}
}));
$("#messageForm").addEventListener("submit",async e=>{
  e.preventDefault();const message=$("#messageText").value.trim();const nickname=$("#nickname").value.trim()||"анонимный фанат";
  if(message.length<2){$("#messageResult").textContent="Добавь чуть больше слов 💌";return;}
  const submit=e.submitter;submit.disabled=true;
  try{
    let item={nickname,message,created_at:new Date().toISOString()};
    if(dbOnline){const d=await api("/api/message",{nickname,message});item=d.message||item;state.messages=[...(state.messages||[]),item].slice(-30);}
    else {state.messages=[...local.messages(),item].slice(-30);localStorage.setItem("lf_messages",JSON.stringify(state.messages));}
    renderMessages(state.messages);$("#messageText").value="";$("#messageResult").textContent="Послание отправлено. Спасибо за доброту! 🌷";
  }catch{$("#messageResult").textContent="Не удалось отправить. Попробуй чуть позже.";}
  submit.disabled=false;
});
$("#secretBtn").addEventListener("click",()=>{$("#secretText").textContent=secrets[Math.floor(Math.random()*secrets.length)];});
$("#jokeBtn").addEventListener("click",()=>{$("#jokeText").textContent=jokes[Math.floor(Math.random()*jokes.length)];});
$("#newMeme").addEventListener("click",()=>{
  const pool=[...memePool].sort(()=>Math.random()-.5).slice(0,3),host=$("#memes");host.replaceChildren();
  pool.forEach(([emoji,title,caption])=>{const card=document.createElement("article");card.className="meme";const big=document.createElement("div");big.className="big";big.textContent=emoji;const bottom=document.createElement("div");const strong=document.createElement("strong");strong.textContent=title;const p=document.createElement("p");p.textContent=caption;bottom.append(strong,p);card.append(big,bottom);host.append(card);});
});
if(local.marked())$("#fanBtn").textContent="💗 Ты уже оставил сердечко";
load();
