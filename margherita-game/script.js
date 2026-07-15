const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const pointText = document.getElementById("point");
const timeText = document.getElementById("time");
const bestText = document.getElementById("best");
const startButton = document.getElementById("startButton");
const soundButton = document.getElementById("soundButton");
const message = document.getElementById("message");

let score = 0;
let time = 30;
let gameRunning = false;
let frame = 0;
let lastSecond = 0;
let soundOn = true;
let effects = [];
let sparkles = [];
let bestScore = Number(localStorage.getItem("margheritaBestScore") || 0);
bestText.textContent = bestScore;

const dogs = [
  {name:"マルゲリータ", img:new Image(), x:80, y:300, speed:3.4, jump:0, phase:0},
  {name:"こんぶ", img:new Image(), x:-150, y:205, speed:3.0, jump:0, phase:1.8},
  {name:"おかゆ", img:new Image(), x:-300, y:110, speed:3.2, jump:0, phase:3.5}
];

dogs[0].img.src = "assets/margherita.png";
dogs[1].img.src = "assets/konbu.png";
dogs[2].img.src = "assets/okayu.png";

const snacks = [
  {icon:"🦴", point:1},
  {icon:"🍪", point:2},
  {icon:"🧀", point:3},
  {icon:"🌭", point:5},
  {icon:"🍖", point:10},
  {icon:"🍠", point:15}
];

let snack = {x:650, y:240, item:snacks[0], pulse:0};

function playSound(){
  if(!soundOn) return;
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const a = new AudioCtx();
    const o = a.createOscillator();
    const g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.frequency.setValueAtTime(520,a.currentTime);
    o.frequency.exponentialRampToValueAtTime(820,a.currentTime+.08);
    g.gain.setValueAtTime(.1,a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.12);
    o.start(); o.stop(a.currentTime+.12);
  }catch(e){}
}

function drawBackground(){
  const sky=ctx.createLinearGradient(0,0,0,500);
  sky.addColorStop(0,"#9ee8ff");
  sky.addColorStop(1,"#e8fbff");
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,800,500);

  ctx.fillStyle="#fff4a8";
  ctx.beginPath();
  ctx.arc(690,80,45,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#7bd66f";
  ctx.fillRect(0,378,800,122);

  ctx.fillStyle="#4aaa45";
  for(let i=0;i<800;i+=40) ctx.fillRect(i,365,22,22);

  ctx.fillStyle="rgba(255,255,255,.92)";
  ctx.font="bold 28px sans-serif";
  ctx.textAlign="center";
  ctx.fillText("青彩堂ドッグラン",400,58);
  ctx.textAlign="left";
}

function drawSpeedLines(dog,bounce){
  if(!gameRunning) return;
  ctx.save();
  ctx.globalAlpha=.25;
  ctx.strokeStyle="#fff";
  ctx.lineWidth=4;

  for(let i=0;i<3;i++){
    const offset=i*14;
    ctx.beginPath();
    ctx.moveTo(dog.x-25-offset,dog.y+35+bounce+i*7);
    ctx.lineTo(dog.x-5-offset,dog.y+35+bounce+i*7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDog(dog){
  const run=frame*.28+dog.phase;
  const bounce=Math.sin(run*2)*6+dog.jump;
  const tilt=Math.sin(run)*.035;

  drawSpeedLines(dog,bounce);

  ctx.save();
  ctx.translate(dog.x+45,dog.y+45+bounce);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.arc(0,0,45,0,Math.PI*2);
  ctx.clip();

  if(dog.img.complete && dog.img.naturalWidth){
    ctx.drawImage(dog.img,-45,-45,90,90);
  }else{
    ctx.fillStyle="#f4c58a";
    ctx.fillRect(-45,-45,90,90);
    ctx.font="48px serif";
    ctx.fillText("🐶",-28,17);
  }
  ctx.restore();

  ctx.strokeStyle="#fff";
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.arc(dog.x+45,dog.y+45+bounce,45,0,Math.PI*2);
  ctx.stroke();

  ctx.fillStyle="#073b2a";
  ctx.font="bold 16px sans-serif";
  ctx.fillText(dog.name,dog.x+4,dog.y+110+bounce);
}

function drawSnack(){
  snack.pulse+=.08;
  const scale=1+Math.sin(snack.pulse)*.1;

  ctx.save();
  ctx.translate(snack.x+18,snack.y-15);
  ctx.scale(scale,scale);
  ctx.font="42px serif";
  ctx.textAlign="center";
  ctx.fillText(snack.item.icon,0,0);
  ctx.restore();
  ctx.textAlign="left";
}

function addEffect(x,y,point){
  effects.push({x,y,text:`+${point}`,life:55});
}

function drawEffects(){
  effects.forEach(e=>{
    const alpha=Math.max(0,e.life/55);
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.fillStyle="#ff6b00";
    ctx.strokeStyle="#fff";
    ctx.lineWidth=4;
    ctx.font="bold 30px sans-serif";
    ctx.strokeText(e.text,e.x,e.y);
    ctx.fillText(e.text,e.x,e.y);
    ctx.restore();

    e.y-=1.2;
    e.life--;
  });

  effects=effects.filter(e=>e.life>0);
}

function createSparkles(x,y,point){
  const symbols = point >= 10 ? ["🌟","✨","💫","⭐","🎉"] : ["✨","⭐","💫"];
  const count = point >= 10 ? 24 : 15;

  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=2+Math.random()*4.5;

    sparkles.push({
      x:x+18,
      y:y-15,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed-1.5,
      gravity:0.08+Math.random()*0.05,
      life:38+Math.random()*28,
      maxLife:66,
      size:15+Math.random()*18,
      spin:(Math.random()-.5)*0.25,
      rotation:Math.random()*Math.PI*2,
      symbol:symbols[Math.floor(Math.random()*symbols.length)]
    });
  }
}

function drawSparkles(){
  sparkles.forEach(s=>{
    const alpha=Math.max(0,s.life/s.maxLife);

    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(s.x,s.y);
    ctx.rotate(s.rotation);
    ctx.font=`${s.size}px serif`;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(s.symbol,0,0);
    ctx.restore();

    s.x+=s.vx;
    s.y+=s.vy;
    s.vy+=s.gravity;
    s.vx*=0.985;
    s.rotation+=s.spin;
    s.life--;
  });

  sparkles=sparkles.filter(s=>s.life>0);
  ctx.textAlign="left";
  ctx.textBaseline="alphabetic";
}

function resetSnack(){
  snack.x=Math.random()*630+80;
  snack.y=Math.random()*245+105;
  snack.item=snacks[Math.floor(Math.random()*snacks.length)];
  snack.pulse=0;
}

function moveDogs(){
  dogs.forEach(dog=>{
    dog.x+=dog.speed;

    if(dog.x>840) dog.x=-110;

    if(dog.jump<0){
      dog.jump+=1.4;
      if(dog.jump>0) dog.jump=0;
    }

    const bounce=Math.sin((frame*.28+dog.phase)*2)*6;
    const dx=(dog.x+45)-(snack.x+18);
    const dy=(dog.y+45+dog.jump+bounce)-(snack.y-15);

    if(Math.abs(dx)<50 && Math.abs(dy)<60){
      score+=snack.item.point;
      pointText.textContent=score;
      dog.jump=-28;

      addEffect(snack.x,snack.y,snack.item.point);
      createSparkles(snack.x,snack.y,snack.item.point);
      playSound();
      resetSnack();
    }
  });
}

function jump(){
  if(!gameRunning) return;

  dogs.forEach((dog,index)=>{
    setTimeout(()=>{
      if(dog.jump===0) dog.jump=-30;
    },index*60);
  });
}

function draw(){
  drawBackground();
  drawSnack();
  dogs.forEach(drawDog);
  drawEffects();
  drawSparkles();
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
  gameRunning=true;
  effects=[];
  sparkles=[];

  dogs[0].x=80;
  dogs[1].x=-150;
  dogs[2].x=-300;

  pointText.textContent=score;
  timeText.textContent=time;
  message.textContent="3匹でおやつをたくさん集めよう！";
  startButton.textContent="もう一度スタート";

  resetSnack();
}

function endGame(){
  gameRunning=false;

  if(score>bestScore){
    bestScore=score;
    localStorage.setItem("margheritaBestScore",String(bestScore));
    bestText.textContent=bestScore;
    message.textContent=`新記録！ スコア ${score} 点 🎉`;
  }else{
    message.textContent=`ゲーム終了！ スコア ${score} 点`;
  }
}

startButton.addEventListener("click",startGame);

soundButton.addEventListener("click",()=>{
  soundOn=!soundOn;
  soundButton.textContent=soundOn?"🔊 音あり":"🔇 音なし";
});

canvas.addEventListener("pointerdown",jump);

window.addEventListener("keydown",e=>{
  if(e.code==="Space"){
    e.preventDefault();
    jump();
  }
});

draw();
requestAnimationFrame(loop);
