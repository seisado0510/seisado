const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
const pointText=document.getElementById("point");
const timeText=document.getElementById("time");
const bestText=document.getElementById("best");
const lifeText=document.getElementById("life");
const startButton=document.getElementById("startButton");
const soundButton=document.getElementById("soundButton");
const message=document.getElementById("message");

let score=0,time=30,lives=3,gameRunning=false,frame=0,lastSecond=0,soundOn=true;
let effects=[],sparkles=[],explosions=[];
let hitCooldown=0,bombRespawnTimer=0,feverMode=false,feverTimer=0,feverBannerTimer=0;
let rabbitTimer=0,goldenBoneTimer=0,jackpotTimer=0;
let bestScore=Number(localStorage.getItem("margheritaBestScore")||0);
bestText.textContent=bestScore;

const dogs=[
{name:"マルゲリータ",img:new Image(),x:80,y:300,speed:3.4,jump:0,phase:0},
{name:"こんぶ",img:new Image(),x:-150,y:205,speed:3.0,jump:0,phase:1.8},
{name:"おかゆ",img:new Image(),x:-300,y:110,speed:3.2,jump:0,phase:3.5}
];
dogs[0].img.src="assets/margherita.png";
dogs[1].img.src="assets/konbu.png";
dogs[2].img.src="assets/okayu.png";

const normalSnacks=[
{icon:"🦴",point:1},{icon:"🍪",point:2},{icon:"🧀",point:3},
{icon:"🌭",point:5},{icon:"🍖",point:10},{icon:"🍠",point:15}
];
const feverSnacks=[
{icon:"🍠",point:30},{icon:"🥩",point:50},{icon:"🍖",point:20},{icon:"🌭",point:10}
];

let snack={x:650,y:240,item:normalSnacks[0],pulse:0};
let bomb={x:720,y:320,active:false,pulse:0,speed:2.6};
let rabbit={x:760,y:345,active:false,speed:2.2,bounce:0};
let goldenBone={x:650,y:180,active:false,pulse:0};

function updateLife(){lifeText.textContent="❤️".repeat(lives)+"🖤".repeat(3-lives)}

function playTone(a,b,d,v=.1){
 if(!soundOn)return;
 try{
  const A=window.AudioContext||window.webkitAudioContext,c=new A(),o=c.createOscillator(),g=c.createGain();
  o.connect(g);g.connect(c.destination);
  o.frequency.setValueAtTime(a,c.currentTime);
  o.frequency.exponentialRampToValueAtTime(b,c.currentTime+d);
  g.gain.setValueAtTime(v,c.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);
  o.start();o.stop(c.currentTime+d);
 }catch(e){}
}
const playSnackSound=()=>playTone(520,820,.12,.1);
const playBombSound=()=>playTone(180,55,.32,.18);
const playFeverSound=()=>playTone(380,1200,.45,.14);
const playJackpotSound=()=>playTone(500,1600,.65,.16);

function drawCafeBackground(){
 const wall=ctx.createLinearGradient(0,0,0,500);
 wall.addColorStop(0,feverMode?"#ffe0ff":"#f8dfc1");
 wall.addColorStop(1,feverMode?"#e0ffff":"#f3cfa7");
 ctx.fillStyle=wall;ctx.fillRect(0,0,800,500);

 ctx.fillStyle="#9a6335";ctx.fillRect(0,380,800,120);
 for(let i=0;i<800;i+=80){
  ctx.strokeStyle="#6d4527";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(i,380);ctx.lineTo(i,500);ctx.stroke();
 }

 ctx.fillStyle="#6b4226";ctx.fillRect(55,85,165,110);
 ctx.fillStyle="#fff8e8";ctx.fillRect(70,100,135,80);
 ctx.fillStyle="#8b5a2b";ctx.font="bold 30px sans-serif";ctx.textAlign="center";
 ctx.fillText("ワンパグ",137,150);

 ctx.fillStyle="#7a4c2b";ctx.fillRect(540,70,210,90);
 ctx.fillStyle="#f8f1df";ctx.fillRect(555,85,180,60);
 ctx.fillStyle="#6b4226";ctx.font="bold 22px sans-serif";ctx.fillText("ONE PUG CAFE",645,123);

 for(const x of [190,430,650]){
  ctx.fillStyle="#8d5a34";ctx.fillRect(x,300,90,14);
  ctx.fillRect(x+40,314,10,56);
  ctx.fillStyle="#c9844d";ctx.fillRect(x-25,335,34,12);
  ctx.fillRect(x+82,335,34,12);
 }

 ctx.fillStyle="#2f8f4e";ctx.beginPath();ctx.arc(760,300,35,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#7b4d28";ctx.fillRect(752,325,16,45);

 ctx.fillStyle="rgba(255,255,255,.92)";
 ctx.font="bold 26px sans-serif";ctx.fillText(feverMode?"🌈 カフェ・フィーバー 🌈":"☕ ワンパグカフェ ☕",400,45);
 ctx.textAlign="left";
}

function drawDog(dog){
 const run=frame*.28+dog.phase,bounce=Math.sin(run*2)*6+dog.jump,tilt=Math.sin(run)*.035;
 if(gameRunning){
  ctx.save();ctx.globalAlpha=feverMode?.55:.25;ctx.strokeStyle=feverMode?"#fff600":"#fff";ctx.lineWidth=feverMode?6:4;
  for(let i=0;i<(feverMode?5:3);i++){
   ctx.beginPath();ctx.moveTo(dog.x-25-i*14,dog.y+35+bounce+i*7);ctx.lineTo(dog.x-5-i*14,dog.y+35+bounce+i*7);ctx.stroke();
  }ctx.restore();
 }
 ctx.save();ctx.translate(dog.x+45,dog.y+45+bounce);ctx.rotate(tilt);ctx.beginPath();ctx.arc(0,0,45,0,Math.PI*2);ctx.clip();
 if(dog.img.complete&&dog.img.naturalWidth)ctx.drawImage(dog.img,-45,-45,90,90);
 else{ctx.fillStyle="#f4c58a";ctx.fillRect(-45,-45,90,90);ctx.font="48px serif";ctx.fillText("🐶",-28,17)}
 ctx.restore();
 ctx.strokeStyle=hitCooldown>0?"#ff3b30":(feverMode?"#fff600":"#fff");ctx.lineWidth=feverMode?7:4;
 ctx.beginPath();ctx.arc(dog.x+45,dog.y+45+bounce,45,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle="#073b2a";ctx.font="bold 16px sans-serif";ctx.fillText(dog.name,dog.x+4,dog.y+110+bounce);
}

function drawSnack(){
 snack.pulse+=feverMode?.14:.08;
 const s=1+Math.sin(snack.pulse)*(feverMode?.18:.1);
 ctx.save();ctx.translate(snack.x+18,snack.y-15);ctx.scale(s,s);ctx.font=feverMode?"54px serif":"42px serif";ctx.textAlign="center";
 ctx.fillText(snack.item.icon,0,0);ctx.restore();ctx.textAlign="left";
}

function drawBomb(){
 if(!bomb.active)return;
 bomb.pulse+=.14;const s=1+Math.sin(bomb.pulse)*.12;
 ctx.save();ctx.translate(bomb.x,bomb.y);ctx.scale(s,s);ctx.strokeStyle="#ff2d2d";ctx.lineWidth=6;
 ctx.beginPath();ctx.arc(0,-14,34,0,Math.PI*2);ctx.stroke();ctx.font="56px serif";ctx.textAlign="center";ctx.fillText("💣",0,0);ctx.restore();
 ctx.fillStyle="#c40000";ctx.font="bold 16px sans-serif";ctx.textAlign="center";ctx.fillText("キケン！",bomb.x,bomb.y+28);ctx.textAlign="left";
}

function drawRabbit(){
 if(!rabbit.active)return;
 rabbit.bounce+=.2;
 const y=rabbit.y+Math.sin(rabbit.bounce)*10;
 ctx.font="54px serif";ctx.textAlign="center";ctx.fillText("🐰",rabbit.x,y);
 ctx.fillStyle="#d45b8f";ctx.font="bold 15px sans-serif";ctx.fillText("+20",rabbit.x,y+34);ctx.textAlign="left";
}

function drawGoldenBone(){
 if(!goldenBone.active)return;
 goldenBone.pulse+=.15;const s=1+Math.sin(goldenBone.pulse)*.2;
 ctx.save();ctx.translate(goldenBone.x,goldenBone.y);ctx.scale(s,s);
 ctx.shadowBlur=24;ctx.shadowColor="#ffd700";ctx.font="58px serif";ctx.textAlign="center";ctx.fillText("🦴",0,0);ctx.restore();
 ctx.fillStyle="#a87300";ctx.font="bold 17px sans-serif";ctx.textAlign="center";ctx.fillText("GOLD 100",goldenBone.x,goldenBone.y+35);ctx.textAlign="left";
}

function addEffect(x,y,text,color="#ff6b00"){effects.push({x,y,text,life:55,color})}
function drawEffects(){
 effects.forEach(e=>{
  const a=Math.max(0,e.life/55);ctx.save();ctx.globalAlpha=a;ctx.fillStyle=e.color;ctx.strokeStyle="#fff";ctx.lineWidth=4;
  ctx.font="bold 30px sans-serif";ctx.textAlign="center";ctx.strokeText(e.text,e.x,e.y);ctx.fillText(e.text,e.x,e.y);ctx.restore();
  e.y-=1.2;e.life--;
 });effects=effects.filter(e=>e.life>0);ctx.textAlign="left";
}

function createSparkles(x,y,big=false){
 const symbols=big?["🌈","🌟","✨","💫","⭐","🎉"]:["✨","⭐","💫"];
 const count=big?45:18;
 for(let i=0;i<count;i++){
  const a=Math.random()*Math.PI*2,s=2+Math.random()*(big?7:4.5);
  sparkles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,gravity:.08,life:45+Math.random()*30,maxLife:75,size:16+Math.random()*22,symbol:symbols[Math.floor(Math.random()*symbols.length)]});
 }
}
function drawSparkles(){
 sparkles.forEach(s=>{
  ctx.save();ctx.globalAlpha=Math.max(0,s.life/s.maxLife);ctx.font=`${s.size}px serif`;ctx.textAlign="center";ctx.fillText(s.symbol,s.x,s.y);ctx.restore();
  s.x+=s.vx;s.y+=s.vy;s.vy+=s.gravity;s.vx*=.985;s.life--;
 });sparkles=sparkles.filter(s=>s.life>0);ctx.textAlign="left";
}

function createExplosion(x,y){
 for(let i=0;i<18;i++){
  const a=Math.random()*Math.PI*2,s=2.5+Math.random()*5;
  explosions.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:30+Math.random()*25,maxLife:55,size:20+Math.random()*22,symbol:["💥","🔥","💨","⚡"][Math.floor(Math.random()*4)]});
 }
}
function drawExplosions(){
 explosions.forEach(e=>{
  ctx.save();ctx.globalAlpha=Math.max(0,e.life/e.maxLife);ctx.font=`${e.size}px serif`;ctx.textAlign="center";ctx.fillText(e.symbol,e.x,e.y);ctx.restore();
  e.x+=e.vx;e.y+=e.vy;e.vx*=.97;e.vy*=.97;e.life--;
 });explosions=explosions.filter(e=>e.life>0);ctx.textAlign="left";
}

function drawBanner(){
 if(feverBannerTimer>0){
  ctx.save();ctx.fillStyle="rgba(255,255,255,.9)";ctx.strokeStyle="#ff4bd8";ctx.lineWidth=8;ctx.beginPath();ctx.roundRect(120,190,560,120,30);ctx.fill();ctx.stroke();
  ctx.fillStyle="#ff1493";ctx.font="bold 38px sans-serif";ctx.textAlign="center";ctx.fillText("🎊 ワンパグ フィーバー!! 🎊",400,260);ctx.restore();feverBannerTimer--;
 }
 if(jackpotTimer>0){
  ctx.save();ctx.fillStyle="rgba(255,255,255,.94)";ctx.strokeStyle="#ffd700";ctx.lineWidth=10;ctx.beginPath();ctx.roundRect(130,170,540,150,35);ctx.fill();ctx.stroke();
  ctx.fillStyle="#d19000";ctx.font="bold 48px sans-serif";ctx.textAlign="center";ctx.fillText("🎉 JACKPOT!! 🎉",400,240);
  ctx.font="bold 28px sans-serif";ctx.fillText("+100 POINT",400,285);ctx.restore();jackpotTimer--;
 }
}

function resetSnack(){
 const list=feverMode?feverSnacks:normalSnacks;
 snack.x=Math.random()*630+80;snack.y=Math.random()*245+105;snack.item=list[Math.floor(Math.random()*list.length)];snack.pulse=0;
}
function resetBomb(){bomb.x=760;bomb.y=Math.random()*230+125;bomb.active=true;bomb.pulse=0;bomb.speed=feverMode?3.6:(2.2+Math.random()*1.2);bombRespawnTimer=0}
function resetRabbit(){rabbit.x=760;rabbit.y=320+Math.random()*35;rabbit.active=true;rabbit.speed=2+Math.random()*1.2;rabbitTimer=0}
function resetGoldenBone(){goldenBone.x=Math.random()*600+100;goldenBone.y=Math.random()*220+120;goldenBone.active=true;goldenBone.pulse=0;goldenBoneTimer=0}

function moveSpecials(){
 if(!rabbit.active){rabbitTimer++;if(rabbitTimer>360)resetRabbit()}else{rabbit.x-=rabbit.speed;if(rabbit.x<-50){rabbit.active=false;rabbitTimer=0}}
 if(!goldenBone.active){goldenBoneTimer++;if(goldenBoneTimer>600)resetGoldenBone()}
}

function moveBomb(){
 if(!bomb.active){bombRespawnTimer++;if(bombRespawnTimer>=300)resetBomb();return}
 bomb.x-=bomb.speed;if(bomb.x<-50){bomb.active=false;bombRespawnTimer=240}
}

function startFever(){
 if(feverMode)return;feverMode=true;feverTimer=600;feverBannerTimer=120;playFeverSound();message.textContent="ワンパグ・フィーバー！10秒間、得点2倍！";resetSnack();
}
function endFever(){feverMode=false;feverTimer=0;message.textContent="フィーバー終了！";resetSnack()}

function moveDogs(){
 dogs.forEach(dog=>{
  dog.x+=dog.speed*(feverMode?1.5:1);if(dog.x>840)dog.x=-110;
  if(dog.jump<0){dog.jump+=1.4;if(dog.jump>0)dog.jump=0}
  const bounce=Math.sin((frame*.28+dog.phase)*2)*6,cx=dog.x+45,cy=dog.y+45+dog.jump+bounce;

  if(Math.abs(cx-(snack.x+18))<50&&Math.abs(cy-(snack.y-15))<60){
   const earned=snack.item.point*(feverMode?2:1);score+=earned;pointText.textContent=score;dog.jump=-28;
   addEffect(snack.x,snack.y,`+${earned}`,feverMode?"#ff00c8":"#ff6b00");createSparkles(snack.x,snack.y,feverMode);playSnackSound();resetSnack();
   if(score>=30&&!feverMode&&feverTimer===0)startFever();
  }

  if(rabbit.active&&Math.abs(cx-rabbit.x)<55&&Math.abs(cy-rabbit.y)<65){
   score+=20;pointText.textContent=score;rabbit.active=false;rabbitTimer=0;addEffect(rabbit.x,rabbit.y,"+20","#d45b8f");createSparkles(rabbit.x,rabbit.y,true);playSnackSound();
  }

  if(goldenBone.active&&Math.abs(cx-goldenBone.x)<60&&Math.abs(cy-goldenBone.y)<65){
   score+=100;pointText.textContent=score;goldenBone.active=false;goldenBoneTimer=0;jackpotTimer=150;
   addEffect(goldenBone.x,goldenBone.y,"+100","#d19000");createSparkles(goldenBone.x,goldenBone.y,true);playJackpotSound();
  }

  if(bomb.active&&hitCooldown===0&&Math.abs(cx-bomb.x)<52&&Math.abs(cy-(bomb.y-14))<62){
   lives--;updateLife();hitCooldown=75;dog.x-=80;createExplosion(bomb.x,bomb.y);addEffect(bomb.x,bomb.y,"-1 LIFE","#e30000");playBombSound();bomb.active=false;bombRespawnTimer=0;
   if(lives<=0)endGame(true);else message.textContent=`爆弾に当たった！残りライフ${lives}`;
  }
 });
 if(hitCooldown>0)hitCooldown--;
 if(feverMode){feverTimer--;if(feverTimer<=0)endFever()}
}

function jump(){if(!gameRunning)return;dogs.forEach((d,i)=>setTimeout(()=>{if(d.jump===0)d.jump=-30},i*60))}
function draw(){drawCafeBackground();drawSnack();drawBomb();drawRabbit();drawGoldenBone();dogs.forEach(drawDog);drawEffects();drawSparkles();drawExplosions();drawBanner()}

function loop(ts){
 draw();
 if(gameRunning){
  moveBomb();moveSpecials();moveDogs();frame++;
  if(!lastSecond)lastSecond=ts;
  if(ts-lastSecond>=1000){time--;timeText.textContent=time;lastSecond=ts;if(time<=0)endGame(false)}
 }
 requestAnimationFrame(loop);
}

function startGame(){
 score=0;time=30;lives=3;frame=0;lastSecond=0;gameRunning=true;effects=[];sparkles=[];explosions=[];hitCooldown=0;bombRespawnTimer=0;
 feverMode=false;feverTimer=0;feverBannerTimer=0;rabbitTimer=0;goldenBoneTimer=0;jackpotTimer=0;
 dogs[0].x=80;dogs[1].x=-150;dogs[2].x=-300;
 pointText.textContent=score;timeText.textContent=time;updateLife();message.textContent="うさぎ20点、金の骨100点！";startButton.textContent="もう一度スタート";
 resetSnack();resetBomb();resetRabbit();resetGoldenBone();
}

function endGame(byBomb=false){
 gameRunning=false;bomb.active=false;rabbit.active=false;goldenBone.active=false;feverMode=false;
 if(score>bestScore){bestScore=score;localStorage.setItem("margheritaBestScore",String(bestScore));bestText.textContent=bestScore}
 message.textContent=byBomb?`ゲームオーバー！スコア${score}点 💥`:`タイムアップ！スコア${score}点`;
}

startButton.addEventListener("click",startGame);
soundButton.addEventListener("click",()=>{soundOn=!soundOn;soundButton.textContent=soundOn?"🔊 音あり":"🔇 音なし"});
canvas.addEventListener("pointerdown",jump);
window.addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();jump()}});

updateLife();draw();requestAnimationFrame(loop);
