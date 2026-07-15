const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const pointText = document.getElementById("point");
const timeText = document.getElementById("time");
const bestText = document.getElementById("best");
const startButton = document.getElementById("startButton");
const soundButton = document.getElementById("soundButton");
const message = document.getElementById("message");

const W = canvas.width;
const H = canvas.height;

let score = 0;
let time = 30;
let gameRunning = false;
let frame = 0;
let lastSecond = 0;
let soundOn = true;
let effects = [];
let bestScore = Number(localStorage.getItem("margheritaBestScoreV2") || 0);

bestText.textContent = bestScore;

const dogs = [
  {name:"マルゲリータ",img:new Image(),x:150,y:382,speed:4.4,jump:0,phase:0},
  {name:"こんぶ",img:new Image(),x:390,y:258,speed:4.0,jump:0,phase:1.7},
  {name:"おかゆ",img:new Image(),x:630,y:134,speed:4.2,jump:0,phase:3.2}
];

dogs[0].img.src = "assets/margherita.png";
dogs[1].img.src = "assets/konbu.png";
dogs[2].img.src = "assets/okayu.png";

const snacks = [
  {icon:"🦴",point:1},
  {icon:"🍪",point:2},
  {icon:"🧀",point:3},
  {icon:"🌭",point:5},
  {icon:"🍖",point:10},
  {icon:"🍠",point:15}
];

let snack = {x:760,y:265,item:snacks[0],pulse:0};

function playSound(){
  if(!soundOn) return;
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    const audio=new AudioCtx();
    const oscillator=audio.createOscillator();
    const gain=audio.createGain();
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.frequency.setValueAtTime(520,audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(860,audio.currentTime+.09);
    gain.gain.setValueAtTime(.08,audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.14);
    oscillator.start();
    oscillator.stop(audio.currentTime+.14);
  }catch(error){}
}

function roundRect(x,y,w,h,r,fill){
  ctx.beginPath();
  ctx.roundRect(x,y,w,h,r);
  ctx.fillStyle=fill;
  ctx.fill();
}

function drawBackground(){
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,"#89dcff");
  sky.addColorStop(1,"#dff8ff");
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle="#fff5a7";
  ctx.beginPath();
  ctx.arc(W-95,80,48,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="rgba(255,255,255,.75)";
  ctx.beginPath();
  ctx.arc(125,85,28,0,Math.PI*2);
  ctx.arc(160,80,38,0,Math.PI*2);
  ctx.arc(198,88,27,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#76d170";
  ctx.fillRect(0,H-118,W,118);

  ctx.fillStyle="#45aa47";
  for(let i=0;i<W;i+=48){
    ctx.fillRect(i,H-138,27,27);
  }

  ctx.fillStyle="rgba(255,255,255,.93)";
  ctx.font="bold 31px sans-serif";
  ctx.textAlign="center";
  ctx.fillText("青彩堂ドッグラン",W/2,55);
  ctx.textAlign="left";
}

function drawDog(dog){
  const run=frame*.29+dog.phase;
  const bounce=Math.sin(run*2)*6+dog.jump;
  const tilt=Math.sin(run)*.035;
  const size=92;

  if(gameRunning){
    ctx.save();
    ctx.globalAlpha=.26;
    ctx.strokeStyle="#fff";
    ctx.lineWidth=5;
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.moveTo(dog.x-32-i*17,dog.y+45+bounce+i*8);
      ctx.lineTo(dog.x-8-i*17,dog.y+45+bounce+i*8);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(dog.x+size/2,dog.y+size/2+bounce);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.arc(0,0,size/2,0,Math.PI*2);
  ctx.clip();

  if(dog.img.complete&&dog.img.naturalWidth){
    ctx.drawImage(dog.img,-size/2,-size/2,size,size);
  }else{
    ctx.fillStyle="#f4c58a";
    ctx.fillRect(-size/2,-size/2,size,size);
    ctx.font="50px serif";
    ctx.fillText("🐶",-28,18);
  }
  ctx.restore();

  ctx.strokeStyle="#fff";
  ctx.lineWidth=5;
  ctx.beginPath();
  ctx.arc(dog.x+size/2,dog.y+size/2+bounce,size/2,0,Math.PI*2);
  ctx.stroke();

  roundRect(dog.x-4,dog.y+99+bounce,100,26,13,"rgba(255,255,255,.88)");
  ctx.fillStyle="#174960";
  ctx.font="bold 15px sans-serif";
  ctx.textAlign="center";
  ctx.fillText(dog.name,dog.x+46,dog.y+118+bounce);
  ctx.textAlign="left";
}

function drawSnack(){
  snack.pulse+=.08;
  const scale=1+Math.sin(snack.pulse)*.1;
  ctx.save();
  ctx.translate(snack.x,snack.y);
  ctx.scale(scale,scale);
  ctx.font="49px serif";
  ctx.textAlign="center";
  ctx.fillText(snack.item.icon,0,0);
  ctx.restore();
  ctx.textAlign="left";
}

function addEffect(x,y,point){
  effects.push({x,y,text:`+${point}`,life:55});
}

function drawEffects(){
  effects.forEach(effect=>{
    const alpha=Math.max(0,effect.life/55);
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.fillStyle="#ff6800";
    ctx.strokeStyle="#fff";
    ctx.lineWidth=5;
    ctx.font="bold 33px sans-serif";
    ctx.textAlign="center";
    ctx.strokeText(effect.text,effect.x,effect.y);
    ctx.fillText(effect.text,effect.x,effect.y);
    ctx.restore();
    effect.y-=1.4;
    effect.life--;
  });
  effects=effects.filter(effect=>effect.life>0);
}

function resetSnack(){
  snack.x=Math.random()*(W-230)+135;
  snack.y=Math.random()*(H-270)+125;
  snack.item=snacks[Math.floor(Math.random()*snacks.length)];
  snack.pulse=0;
}

function resetDogs(){
  dogs[0].x=110;
  dogs[1].x=365;
  dogs[2].x=620;
  dogs.forEach(dog=>dog.jump=0);
}

function moveDogs(){
  dogs.forEach(dog=>{
    dog.x+=dog.speed;
    if(dog.x>W+30) dog.x=-115;

    if(dog.jump<0){
      dog.jump+=1.55;
      if(dog.jump>0) dog.jump=0;
    }

    const bounce=Math.sin((frame*.29+dog.phase)*2)*6;
    const dx=(dog.x+46)-snack.x;
    const dy=(dog.y+46+dog.jump+bounce)-snack.y;

    if(Math.abs(dx)<55&&Math.abs(dy)<62){
      score+=snack.item.point;
      pointText.textContent=score;
      dog.jump=-30;
      addEffect(snack.x,snack.y,snack.item.point);
      playSound();
      resetSnack();
    }
  });
}

function jump(){
  if(!gameRunning) return;
  dogs.forEach((dog,index)=>{
    setTimeout(()=>{
      if(dog.jump===0) dog.jump=-32;
    },index*55);
  });
}

function draw(){
  drawBackground();
  drawSnack();
  dogs.forEach(drawDog);
  drawEffects();

  if(!gameRunning){
    ctx.save();
    ctx.fillStyle="rgba(0,75,120,.10)";
    ctx.fillRect(0,0,W,H);
    roundRect(W/2-155,H/2-44,310,78,25,"rgba(255,255,255,.91)");
    ctx.fillStyle="#087bc1";
    ctx.font="bold 29px sans-serif";
    ctx.textAlign="center";
    ctx.fillText("ゲームスタートを押してね！",W/2,H/2+5);
    ctx.restore();
  }
}

function loop(timestamp){
  draw();

  if(gameRunning){
    moveDogs();
    frame++;

    if(!lastSecond) lastSecond=timestamp;

    if(timestamp-lastSecond>=1000){
      time--;
      timeText.textContent=time;
      lastSecond=timestamp;

      if(time<=0) endGame();
    }
  }
  requestAnimationFrame(loop);
}

function startGame(){
  score=0;
  time=30;
  frame=0;
  lastSecond=0;
  effects=[];
  gameRunning=true;
  resetDogs();
  resetSnack();

  pointText.textContent=score;
  timeText.textContent=time;
  message.textContent="画面をタップして3匹をジャンプさせよう！";
  startButton.textContent="もう一度スタート";
}

function endGame(){
  gameRunning=false;

  if(score>bestScore){
    bestScore=score;
    localStorage.setItem("margheritaBestScoreV2",String(bestScore));
    bestText.textContent=bestScore;
    message.textContent=`新記録！ スコア ${score}点 🎉`;
  }else{
    message.textContent=`ゲーム終了！ スコア ${score}点`;
  }
}

startButton.addEventListener("click",startGame);
soundButton.addEventListener("click",()=>{
  soundOn=!soundOn;
  soundButton.textContent=soundOn?"🔊 音あり":"🔇 音なし";
});
canvas.addEventListener("pointerdown",jump);
window.addEventListener("keydown",event=>{
  if(event.code==="Space"){
    event.preventDefault();
    jump();
  }
});

resetDogs();
resetSnack();
draw();
requestAnimationFrame(loop);

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("service-worker.js").catch(()=>{});
  });
}
