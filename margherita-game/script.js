const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
const pointText=document.getElementById("point");
const timeText=document.getElementById("time");
const bestText=document.getElementById("best");
const lifeText=document.getElementById("life");
const coinText=document.getElementById("coins");
const startButton=document.getElementById("startButton");
const soundButton=document.getElementById("soundButton");
const message=document.getElementById("message");
const playerNameInput=document.getElementById("playerName");
const rankingButton=document.getElementById("rankingButton");
const rankingPanel=document.getElementById("rankingPanel");
const rankingList=document.getElementById("rankingList");
const closeRanking=document.getElementById("closeRanking");
const resetRankingButton=document.getElementById("resetRanking");
const RANKING_KEY="onepugRankingV5";
const characterCards=[...document.querySelectorAll(".character-card")];
const selectedCharacterText=document.getElementById("selectedCharacterText");
const openingScreen=document.getElementById("openingScreen");
const openingStartButton=document.getElementById("openingStartButton");
const jumpButton=document.getElementById("jumpButton");
const bgmButton=document.getElementById("bgmButton");
const seasonButtons=[...document.querySelectorAll(".season-btn")];
const CHARACTER_KEY="onepugSelectedCharacterV6";

const characterSettings={
  margherita:{
    name:"マルゲリータ",
    image:"assets/margherita.png",
    speed:3.4,
    jumpPower:-42,
    maxLives:3,
    ability:"ジャンプが高い"
  },
  okayu:{
    name:"おかゆ",
    image:"assets/okayu.png",
    speed:4.5,
    jumpPower:-30,
    maxLives:3,
    ability:"走るスピードが速い"
  },
  konbu:{
    name:"こんぶ",
    image:"assets/konbu.png",
    speed:3.0,
    jumpPower:-30,
    maxLives:4,
    ability:"ライフが4つ"
  }
};

let selectedCharacter=localStorage.getItem(CHARACTER_KEY)||"margherita";
let selectedSeason=localStorage.getItem("onepugSeasonV7")||"auto";
let bgmOn=true;
let bgmContext=null;
let bgmTimer=null;
let bgmStep=0;
let maxLives=characterSettings[selectedCharacter].maxLives;

let score=0,time=45,lives=3,coins=0,gameRunning=false,frame=0,lastSecond=0,soundOn=true;
let effects=[],particles=[];
let hitCooldown=0,feverMode=false,feverFrames=0,feverUsed=false;
let bestScore=Number(localStorage.getItem("onepugBestScoreV4")||0);
bestText.textContent=bestScore;

const playerDog={
  name:"",
  img:new Image(),
  x:70,
  y:250,
  speed:3.4,
  jump:0,
  phase:0,
  jumpPower:-30
};
const dogs=[playerDog];

function applySelectedCharacter(){
  const setting=characterSettings[selectedCharacter];
  playerDog.name=setting.name;
  playerDog.img=new Image();
  playerDog.img.src=setting.image;
  playerDog.speed=setting.speed;
  playerDog.jumpPower=setting.jumpPower;
  maxLives=setting.maxLives;

  openingStartButton.addEventListener("click",()=>{
  openingScreen.classList.add("hide");
  localStorage.setItem("onepugOpeningSeenV7","1");
});

jumpButton.addEventListener("click",jump);

bgmButton.addEventListener("click",()=>{
  bgmOn=!bgmOn;
  bgmButton.textContent=bgmOn?"🎵 BGMあり":"🔇 BGMなし";
  if(bgmOn)startBgm();else stopBgm();
});

seasonButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    selectedSeason=btn.dataset.season;
    localStorage.setItem("onepugSeasonV7",selectedSeason);
    updateSeasonButtons();
  });
});

characterCards.forEach(card=>{
    card.classList.toggle("selected",card.dataset.character===selectedCharacter);
  });
  selectedCharacterText.textContent=`選択中：${setting.name}（${setting.ability}）`;
}

const normalSnacks=[
  {icon:"🦴",point:1},{icon:"🍪",point:2},{icon:"🧀",point:3},
  {icon:"🌭",point:5},{icon:"🍖",point:10},{icon:"🍠",point:15}
];
const feverSnacks=[
  {icon:"🍠",point:20},{icon:"🥩",point:30},{icon:"🍖",point:15},{icon:"🌭",point:10}
];

let snack={x:650,y:230,item:normalSnacks[0],pulse:0};
let bomb={x:760,y:310,active:false,speed:2.5,timer:0,pulse:0};
let rabbit={x:760,y:335,active:false,speed:2.3,timer:0,bounce:0};
let goldenBone={x:620,y:160,active:false,timer:0,pulse:0};
let coin={x:700,y:220,active:false,timer:0,pulse:0};
let chest={x:690,y:290,active:false,timer:0,pulse:0};
let boss={x:860,y:175,active:false,speed:1.35,hits:0,phase:0};


function loadRanking(){
  try{
    const data=JSON.parse(localStorage.getItem(RANKING_KEY)||"[]");
    return Array.isArray(data)?data:[];
  }catch(e){
    return [];
  }
}

function saveRanking(name,newScore,newCoins){
  const cleanName=(name||"ゲスト").trim().slice(0,10)||"ゲスト";
  const list=loadRanking();
  list.push({
    name:cleanName,
    score:Number(newScore)||0,
    coins:Number(newCoins)||0,
    date:new Date().toLocaleDateString("ja-JP")
  });
  list.sort((a,b)=>b.score-a.score||b.coins-a.coins);
  const top5=list.slice(0,5);
  localStorage.setItem(RANKING_KEY,JSON.stringify(top5));
  return top5;
}

function renderRanking(){
  const list=loadRanking();
  rankingList.innerHTML="";
  if(list.length===0){
    const li=document.createElement("li");
    li.textContent="まだ記録がありません";
    rankingList.appendChild(li);
    return;
  }
  list.forEach((item,index)=>{
    const li=document.createElement("li");
    li.textContent=`${index+1}位　${item.name}　${item.score}点　🪙${item.coins}`;
    rankingList.appendChild(li);
  });
}

function openRankingPanel(){
  renderRanking();
  rankingPanel.classList.add("open");
}

function closeRankingPanel(){
  rankingPanel.classList.remove("open");
}


function getSeason(){
  if(selectedSeason!=="auto") return selectedSeason;
  const month=new Date().getMonth()+1;
  if(month>=3&&month<=5)return "spring";
  if(month>=6&&month<=8)return "summer";
  if(month>=9&&month<=11)return "autumn";
  return "winter";
}

function updateSeasonButtons(){
  seasonButtons.forEach(btn=>btn.classList.toggle("selected",btn.dataset.season===selectedSeason));
}

function startBgm(){
  if(!bgmOn||bgmTimer)return;
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    bgmContext=bgmContext||new AudioCtx();
    const notes=[261.63,329.63,392.00,329.63,293.66,349.23,440.00,349.23];
    bgmTimer=setInterval(()=>{
      if(!bgmOn||!gameRunning)return;
      const osc=bgmContext.createOscillator();
      const gain=bgmContext.createGain();
      osc.connect(gain);gain.connect(bgmContext.destination);
      osc.type="sine";
      osc.frequency.value=notes[bgmStep%notes.length];
      gain.gain.setValueAtTime(.075,bgmContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,bgmContext.currentTime+.26);
      osc.start();osc.stop(bgmContext.currentTime+.27);
      bgmStep++;
    },280);
  }catch(e){}
}

function stopBgm(){
  if(bgmTimer){clearInterval(bgmTimer);bgmTimer=null}
}

function updateHud(){
  pointText.textContent=score;
  timeText.textContent=time;
  lifeText.textContent="❤️".repeat(Math.max(0,lives))+"🖤".repeat(Math.max(0,maxLives-lives));
  coinText.textContent=coins;
}

function playTone(a,b,d,v=.08){
  if(!soundOn)return;
  try{
    const A=window.AudioContext||window.webkitAudioContext;
    const ac=new A(),o=ac.createOscillator(),g=ac.createGain();
    o.connect(g);g.connect(ac.destination);
    o.frequency.setValueAtTime(a,ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(1,b),ac.currentTime+d);
    g.gain.setValueAtTime(v,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);
    o.start();o.stop(ac.currentTime+d);
  }catch(e){}
}

function addEffect(x,y,text,color="#ff6b00",size=30){
  effects.push({x,y,text,color,size,life:60,maxLife:60});
}
function burst(x,y,big=false){
  const symbols=big?["🌈","🌟","✨","💫","⭐","🎉"]:["✨","⭐","💫"];
  const count=big?38:16;
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,s=2+Math.random()*(big?6:4);
    particles.push({
      x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,
      gravity:.07,life:45+Math.random()*25,maxLife:70,
      size:15+Math.random()*20,symbol:symbols[Math.floor(Math.random()*symbols.length)]
    });
  }
}

function drawBackground(){
  const season=getSeason();
  const palettes={
    spring:["#ffd6e7","#f8c4d8"],
    summer:["#9ee8ff","#f7e77f"],
    autumn:["#f5b06b","#9e5742"],
    winter:["#c9e9ff","#eaf6ff"]
  };
  let [top,bottom]=palettes[season];
  if(time<=5){top="#18213d";bottom="#3d315f"}
  else if(time<=15){top="#f2a16e";bottom="#844d63"}
  if(feverMode){top=`hsl(${(frame*4)%360},90%,72%)`;bottom=`hsl(${(frame*4+150)%360},90%,72%)`}

  const g=ctx.createLinearGradient(0,0,0,500);
  g.addColorStop(0,top);g.addColorStop(1,bottom);
  ctx.fillStyle=g;ctx.fillRect(0,0,800,500);

  if(time<=5){
    ctx.fillStyle="#fff";
    for(let i=0;i<25;i++)ctx.fillRect((i*97)%800,(i*43)%180+20,3,3);
  }

  ctx.fillStyle="#9a6335";ctx.fillRect(0,380,800,120);
  ctx.strokeStyle="#6d4527";ctx.lineWidth=2;
  for(let x=0;x<800;x+=80){ctx.beginPath();ctx.moveTo(x,380);ctx.lineTo(x,500);ctx.stroke()}

  ctx.fillStyle="#6b4226";ctx.fillRect(48,78,180,110);
  ctx.fillStyle="#fff8e8";ctx.fillRect(63,93,150,80);
  ctx.fillStyle="#8b5a2b";ctx.font="bold 30px sans-serif";ctx.textAlign="center";ctx.fillText("ワンパグ",138,145);

  ctx.fillStyle="#754829";ctx.fillRect(545,70,205,90);
  ctx.fillStyle="#f8f1df";ctx.fillRect(560,85,175,60);
  ctx.fillStyle="#6b4226";ctx.font="bold 21px sans-serif";ctx.fillText("ONE PUG CAFE",648,123);

  for(const x of [175,410,640]){
    ctx.fillStyle="#8d5a34";ctx.fillRect(x,300,95,14);ctx.fillRect(x+42,314,10,56);
    ctx.fillStyle="#c9844d";ctx.fillRect(x-24,335,34,12);ctx.fillRect(x+86,335,34,12);
  }

  ctx.fillStyle="#2f8f4e";ctx.beginPath();ctx.arc(760,300,34,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#7b4d28";ctx.fillRect(752,325,16,45);

  if(!feverMode&&time>15){
    const season=getSeason();
    const symbol={spring:"🌸",summer:"🌻",autumn:"🍁",winter:"❄️"}[season];
    ctx.font="28px serif";
    for(let i=0;i<10;i++){
      const x=(i*91+frame*.35)%850-25;
      const y=65+(i*47)%250;
      ctx.fillText(symbol,x,y);
    }
  }

  ctx.fillStyle="rgba(255,255,255,.92)";ctx.font="bold 25px sans-serif";ctx.textAlign="center";
  let title="☕ ワンパグカフェ ☕";
  if(feverMode)title="🌈 ワンパグ・フィーバー 🌈";
  else if(time<=5)title="🌙 ラスト5秒！ 🌙";
  else if(time<=15)title="🌇 夕方ステージ 🌇";
  ctx.fillText(title,400,42);ctx.textAlign="left";
}

function drawDog(d){
  const run=frame*.28+d.phase,bounce=Math.sin(run*2)*6+d.jump,tilt=Math.sin(run)*.035;
  if(gameRunning){
    ctx.save();ctx.globalAlpha=feverMode?.55:.25;ctx.strokeStyle=feverMode?"#fff600":"#fff";ctx.lineWidth=feverMode?6:4;
    for(let i=0;i<(feverMode?5:3);i++){
      ctx.beginPath();ctx.moveTo(d.x-25-i*14,d.y+35+bounce+i*7);ctx.lineTo(d.x-5-i*14,d.y+35+bounce+i*7);ctx.stroke();
    }ctx.restore();
  }
  ctx.save();ctx.translate(d.x+45,d.y+45+bounce);ctx.rotate(tilt);ctx.beginPath();ctx.arc(0,0,45,0,Math.PI*2);ctx.clip();
  if(d.img.complete&&d.img.naturalWidth)ctx.drawImage(d.img,-45,-45,90,90);
  else{ctx.fillStyle="#f4c58a";ctx.fillRect(-45,-45,90,90);ctx.font="48px serif";ctx.fillText("🐶",-28,17)}
  ctx.restore();
  ctx.strokeStyle=hitCooldown>0?"#ff3b30":(feverMode?"#fff600":"#fff");ctx.lineWidth=feverMode?7:4;
  ctx.beginPath();ctx.arc(d.x+45,d.y+45+bounce,45,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#073b2a";ctx.font="bold 16px sans-serif";ctx.fillText(d.name,d.x+4,d.y+110+bounce);
}

function drawEmoji(obj,emoji,size,label,color){
  if(!obj.active)return;
  obj.pulse=(obj.pulse||0)+.12;
  const s=1+Math.sin(obj.pulse)*.12;
  ctx.save();ctx.translate(obj.x,obj.y);ctx.scale(s,s);ctx.font=`${size}px serif`;ctx.textAlign="center";ctx.fillText(emoji,0,0);ctx.restore();
  if(label){ctx.fillStyle=color;ctx.font="bold 15px sans-serif";ctx.textAlign="center";ctx.fillText(label,obj.x,obj.y+30);ctx.textAlign="left"}
}

function drawRabbit(){
  if(!rabbit.active)return;
  rabbit.bounce+=.2;
  const y=rabbit.y+Math.sin(rabbit.bounce)*10;
  ctx.font="54px serif";ctx.textAlign="center";ctx.fillText("🐰",rabbit.x,y);
  ctx.fillStyle="#d40000";ctx.font="bold 15px sans-serif";ctx.fillText("-10",rabbit.x,y+34);ctx.textAlign="left";
}

function drawBoss(){
  if(!boss.active)return;
  boss.phase+=.08;
  const y=boss.y+Math.sin(boss.phase)*30;
  ctx.save();ctx.globalAlpha=.92;ctx.font="110px serif";ctx.textAlign="center";ctx.fillText("🐶",boss.x,y);
  ctx.fillStyle="#6b0000";ctx.font="bold 20px sans-serif";ctx.fillText(`ボスパグ  ${3-boss.hits}/3`,boss.x,y+65);ctx.restore();ctx.textAlign="left";
}

function drawEffects(){
  effects.forEach(e=>{
    ctx.save();ctx.globalAlpha=Math.max(0,e.life/e.maxLife);ctx.fillStyle=e.color;ctx.strokeStyle="#fff";ctx.lineWidth=4;
    ctx.font=`bold ${e.size}px sans-serif`;ctx.textAlign="center";ctx.strokeText(e.text,e.x,e.y);ctx.fillText(e.text,e.x,e.y);ctx.restore();
    e.y-=1.1;e.life--;
  });effects=effects.filter(e=>e.life>0);ctx.textAlign="left";
}
function drawParticles(){
  particles.forEach(p=>{
    ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.font=`${p.size}px serif`;ctx.textAlign="center";ctx.fillText(p.symbol,p.x,p.y);ctx.restore();
    p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.vx*=.985;p.life--;
  });particles=particles.filter(p=>p.life>0);ctx.textAlign="left";
}

function resetSnack(){
  const list=feverMode?feverSnacks:normalSnacks;
  snack.x=Math.random()*620+90;snack.y=Math.random()*235+115;
  snack.item=list[Math.floor(Math.random()*list.length)];snack.pulse=0;
}
function spawnBomb(){bomb.x=780;bomb.y=Math.random()*230+120;bomb.speed=2.3+Math.random()*1.2;bomb.active=true;bomb.timer=0}
function spawnRabbit(){rabbit.x=780;rabbit.y=315+Math.random()*45;rabbit.speed=2.2+Math.random();rabbit.active=true;rabbit.timer=0}
function spawnGoldenBone(){goldenBone.x=Math.random()*580+110;goldenBone.y=Math.random()*210+120;goldenBone.active=true;goldenBone.timer=0;goldenBone.pulse=0}
function spawnCoin(){coin.x=Math.random()*580+110;coin.y=Math.random()*210+120;coin.active=true;coin.timer=0;coin.pulse=0}
function spawnChest(){chest.x=Math.random()*560+120;chest.y=Math.random()*190+150;chest.active=true;chest.timer=0;chest.pulse=0}

function moveObjects(){
  if(bomb.active){bomb.x-=bomb.speed;if(bomb.x<-60){bomb.active=false;bomb.timer=0}}else if(++bomb.timer>260)spawnBomb();
  if(rabbit.active){rabbit.x-=rabbit.speed;if(rabbit.x<-60){rabbit.active=false;rabbit.timer=0}}else if(++rabbit.timer>330)spawnRabbit();
  if(!goldenBone.active&&++goldenBone.timer>650)spawnGoldenBone();
  if(!coin.active&&++coin.timer>220)spawnCoin();
  if(!chest.active&&++chest.timer>520)spawnChest();

  if(boss.active){
    boss.x-=boss.speed;
    if(boss.x<-100)boss.x=900;
  }
}

function startFever(){
  if(feverMode||feverUsed)return;
  feverMode=true;feverUsed=true;feverFrames=600;
  addEffect(400,250,"🌈 ワンパグ フィーバー!! 🌈","#ff1493",38);burst(400,250,true);playTone(380,1200,.45,.14);
  message.textContent="10秒間、得点2倍！";
}
function applyChest(){
  const r=Math.floor(Math.random()*4);
  if(r===0){score+=50;addEffect(chest.x,chest.y,"+50","#d19000");message.textContent="宝箱から50点！"}
  if(r===1){lives=Math.min(3,lives+1);addEffect(chest.x,chest.y,"LIFE UP","#e30055");message.textContent="ライフ回復！"}
  if(r===2){feverUsed=false;startFever();message.textContent="宝箱からフィーバー！"}
  if(r===3){bomb.active=false;bomb.timer=-300;addEffect(chest.x,chest.y,"NO BOMB","#2476ff");message.textContent="爆弾がしばらく消えた！"}
  updateHud();burst(chest.x,chest.y,true);playTone(500,1200,.35,.12);
}

function collision(cx,cy,x,y,rx=55,ry=62){return Math.abs(cx-x)<rx&&Math.abs(cy-y)<ry}

function moveDogs(){
  dogs.forEach(d=>{
    d.x+=d.speed*(feverMode?1.5:1);
    if(d.x>840)d.x=-110;
    if(d.jump<0){d.jump+=1.4;if(d.jump>0)d.jump=0}
    const bounce=Math.sin((frame*.28+d.phase)*2)*6,cx=d.x+45,cy=d.y+45+d.jump+bounce;

    if(collision(cx,cy,snack.x+18,snack.y-15,50,60)){
      const earned=snack.item.point*(feverMode?2:1);
      score+=earned;d.jump=-28;addEffect(snack.x,snack.y,`+${earned}`,feverMode?"#ff00c8":"#ff6b00");burst(snack.x,snack.y,feverMode);
      playTone(520,820,.12,.09);resetSnack();
      if(score>=30)startFever();
    }
    if(rabbit.active&&collision(cx,cy,rabbit.x,rabbit.y,55,65)){
      score=Math.max(0,score-10);rabbit.active=false;rabbit.timer=0;d.x-=70;addEffect(rabbit.x,rabbit.y,"-10","#d40000");message.textContent="うさぎに当たって10点減点！";playTone(240,90,.22,.12);
    }
    if(goldenBone.active&&collision(cx,cy,goldenBone.x,goldenBone.y,60,65)){
      score+=100;goldenBone.active=false;goldenBone.timer=0;addEffect(goldenBone.x,goldenBone.y,"JACKPOT +100","#d19000",38);burst(goldenBone.x,goldenBone.y,true);playTone(500,1600,.6,.15);
    }
    if(coin.active&&collision(cx,cy,coin.x,coin.y,55,60)){
      coins++;coin.active=false;coin.timer=0;addEffect(coin.x,coin.y,"+1 COIN","#c58a00");playTone(700,1100,.12,.08);
    }
    if(chest.active&&collision(cx,cy,chest.x,chest.y,60,65)){
      chest.active=false;chest.timer=0;applyChest();
    }
    if(bomb.active&&hitCooldown===0&&collision(cx,cy,bomb.x,bomb.y-14,52,62)){
      lives--;hitCooldown=75;d.x-=80;bomb.active=false;bomb.timer=0;addEffect(bomb.x,bomb.y,"-1 LIFE","#e30000");burst(bomb.x,bomb.y,true);playTone(180,55,.32,.17);
      message.textContent=`爆弾に当たった！残りライフ${lives}`;
      if(lives<=0)endGame("爆弾");
    }
    if(boss.active&&hitCooldown===0&&collision(cx,cy,boss.x,boss.y+Math.sin(boss.phase)*30,75,95)){
      boss.hits++;hitCooldown=90;d.x-=100;lives--;addEffect(boss.x,boss.y,"BOSS HIT","#900000",34);burst(boss.x,boss.y,true);playTone(150,45,.4,.18);
      if(boss.hits>=3||lives<=0)endGame("ボスパグ");
    }
  });

  if(hitCooldown>0)hitCooldown--;
  if(feverMode&&--feverFrames<=0){feverMode=false;message.textContent="フィーバー終了！"}
  if(score>=100&&!boss.active){boss.active=true;boss.x=900;boss.hits=0;message.textContent="👑 ボスパグ登場！3回当たると終了！"}
  updateHud();
}

function jump(){
  if(!gameRunning)return;
  dogs.forEach((d,i)=>setTimeout(()=>{if(d.jump===0)d.jump=d.jumpPower},i*60));
}

function draw(){
  drawBackground();
  drawEmoji(snack,snack.item.icon,feverMode?54:44,"","");
  drawEmoji(bomb,"💣",56,"キケン！","#c40000");
  drawRabbit();
  drawEmoji(goldenBone,"🦴",60,"GOLD 100","#a87300");
  drawEmoji(coin,"🪙",48,"COIN","#a87300");
  drawEmoji(chest,"🎁",54,"宝箱","#7b3eb8");
  drawBoss();
  dogs.forEach(drawDog);
  drawEffects();
  drawParticles();
}

function loop(ts){
  draw();
  if(gameRunning){
    moveObjects();moveDogs();frame++;
    if(!lastSecond)lastSecond=ts;
    if(ts-lastSecond>=1000){
      time--;lastSecond=ts;updateHud();
      if(time<=0)endGame("タイムアップ");
    }
  }
  requestAnimationFrame(loop);
}

function startGame(){
  if(!playerNameInput.value.trim()) playerNameInput.value="ゲスト";
  localStorage.setItem("onepugPlayerName",playerNameInput.value.trim().slice(0,10));
  applySelectedCharacter();
  score=0;time=45;lives=maxLives;coins=0;gameRunning=true;frame=0;lastSecond=0;effects=[];particles=[];
  hitCooldown=0;feverMode=false;feverFrames=0;feverUsed=false;
  playerDog.x=70;playerDog.y=250;playerDog.jump=0;
  bomb.active=false;bomb.timer=0;rabbit.active=false;rabbit.timer=0;goldenBone.active=false;goldenBone.timer=0;
  coin.active=false;coin.timer=0;chest.active=false;chest.timer=0;boss.active=false;boss.hits=0;
  resetSnack();spawnBomb();spawnRabbit();spawnCoin();
  updateHud();message.textContent="30点でフィーバー、100点でボス登場！";startButton.textContent="もう一度スタート";startBgm();
}

function endGame(reason){
  if(!gameRunning)return;
  gameRunning=false;boss.active=false;bomb.active=false;rabbit.active=false;stopBgm();
  if(score>bestScore){bestScore=score;localStorage.setItem("onepugBestScoreV4",String(bestScore));bestText.textContent=bestScore}
  const playerName=(playerNameInput.value||"ゲスト").trim().slice(0,10)||"ゲスト";
  const ranking=saveRanking(playerName,score,coins);
  const rank=ranking.findIndex(item=>item.name===playerName&&item.score===score&&item.coins===coins)+1;
  message.textContent=`ゲーム終了（${reason}） ${playerName}／${characterSettings[selectedCharacter].name}：${score}点・コイン${coins}枚${rank>0?`／第${rank}位！`:""}`;
  addEffect(400,250,"GAME OVER","#d40000",44);
  setTimeout(openRankingPanel,700);
}

startButton.addEventListener("click",startGame);
soundButton.addEventListener("click",()=>{soundOn=!soundOn;soundButton.textContent=soundOn?"🔊 音あり":"🔇 音なし"});
rankingButton.addEventListener("click",openRankingPanel);
closeRanking.addEventListener("click",closeRankingPanel);
rankingPanel.addEventListener("click",e=>{if(e.target===rankingPanel)closeRankingPanel()});
resetRankingButton.addEventListener("click",()=>{
  if(confirm("ランキングを全部消しますか？")){
    localStorage.removeItem(RANKING_KEY);
    renderRanking();
  }
});
characterCards.forEach(card=>{
  card.addEventListener("click",()=>{
    if(gameRunning){
      message.textContent="キャラクター変更は次のゲームから反映されます";
    }
    selectedCharacter=card.dataset.character;
    localStorage.setItem(CHARACTER_KEY,selectedCharacter);
    applySelectedCharacter();
    updateHud();
  });
});
canvas.addEventListener("pointerdown",jump);
window.addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();jump()}});

playerNameInput.value=localStorage.getItem("onepugPlayerName")||"ゲスト";
applySelectedCharacter();
updateSeasonButtons();
lives=maxLives;
if(localStorage.getItem("onepugOpeningSeenV7")==="1"){
  openingScreen.classList.add("hide");
}
updateHud();resetSnack();renderRanking();draw();requestAnimationFrame(loop);
