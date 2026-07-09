const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
const pointText=document.getElementById("point");
const timeText=document.getElementById("time");
const startButton=document.getElementById("startButton");

let score = 0,
    time = 30,
    gameRunning = false,
    frame = 0,
    lastSecond = 0;

let level = 1;
let levelMessage = "";
let bestScore=localStorage.getItem("bestScore")||0;
let effects=[];
let clouds=[{x:80,y:70},{x:420,y:95},{x:650,y:55}];

const dogs=[
{name:"マルゲリータ",img:new Image(),x:80,y:300,speed:3.2,jump:0},
{name:"こんぶ",img:new Image(),x:-150,y:205,speed:2.7,jump:0},
{name:"おかゆ",img:new Image(),x:-300,y:110,speed:3.0,jump:0}
];

dogs[0].img.src="assets/margherita.png";
dogs[1].img.src="assets/konbu.png";
dogs[2].img.src="assets/okayu.png";

const snacks=[
  {icon:"🦴", point:1},
  {icon:"🍪", point:2},
  {icon:"🧀", point:3},
  {icon:"🌭", point:5},
  {icon:"🍖", point:10}
];
let snack={x:650,y:240,item:snacks[0]};

function playWan(){
try{
const a=new AudioContext();
const o=a.createOscillator();
const g=a.createGain();
o.connect(g);g.connect(a.destination);
o.frequency.value=520;
g.gain.value=0.08;
o.start();
o.stop(a.currentTime+0.08);
}catch(e){}
}

function drawBackground(){
ctx.fillStyle="#bdefff";
ctx.fillRect(0,0,800,500);

clouds.forEach(c=>{
c.x+=0.25;
if(c.x>860)c.x=-120;
ctx.fillStyle="rgba(255,255,255,.8)";
ctx.beginPath();
ctx.arc(c.x,c.y,25,0,Math.PI*2);
ctx.arc(c.x+30,c.y+5,30,0,Math.PI*2);
ctx.arc(c.x+65,c.y,24,0,Math.PI*2);
ctx.fill();
});

ctx.fillStyle="#fff7b3";
ctx.beginPath();
ctx.arc(690,80,45,0,Math.PI*2);
ctx.fill();

ctx.fillStyle="#7bd66f";
ctx.fillRect(0,378,800,122);

ctx.fillStyle="#4aaa45";
for(let i=0;i<800;i+=40){
ctx.fillRect(i,365,22,22);
}

ctx.fillStyle="#fff";
ctx.font="bold 28px sans-serif";
ctx.fillText("青彩堂ドッグラン",280,58);

ctx.fillStyle="#073b2a";
ctx.font="bold 18px sans-serif";
ctx.fillText("最高スコア："+bestScore,20,35);
}

function drawDog(dog){
const bounce=Math.sin(frame*.18)*8+dog.jump;

ctx.save();
ctx.beginPath();
ctx.arc(dog.x+45,dog.y+45+bounce,45,0,Math.PI*2);
ctx.clip();
if(dog.img.complete){
ctx.drawImage(dog.img,dog.x,dog.y+bounce,90,90);
}
ctx.restore();

ctx.strokeStyle="#fff";
ctx.lineWidth=4;
ctx.beginPath();
ctx.arc(dog.x+45,dog.y+45+bounce,45,0,Math.PI*2);
ctx.stroke();

ctx.fillStyle="#073b2a";
ctx.font="bold 16px sans-serif";
ctx.fillText(dog.name,dog.x+8,dog.y+110+bounce);
}

function drawSnack(){
ctx.fillStyle="#fff";
ctx.beginPath();
ctx.arc(snack.x+25,snack.y-15,38,0,Math.PI*2);
ctx.fill();

ctx.strokeStyle="#c99a2e";
ctx.lineWidth=4;
ctx.stroke();

ctx.font="32px serif";
ctx.fillText(snack.item.icon,snack.x+7,snack.y-4);

ctx.fillStyle="#073b2a";
ctx.font="bold 14px sans-serif";
ctx.fillText(snack.item.point+"点",snack.x+6,snack.y+20);
}

function resetSnack(){
snack.x=Math.random()*630+80;
snack.y=Math.random()*245+105;
snack.item=snacks[Math.floor(Math.random()*snacks.length)];
}

function addEffect(x,y){
effects.push({x:x,y:y,dx:0,dy:-1.5,life:35,text:"+1"});
}

function drawEffects(){
effects.forEach(e=>{
ctx.fillStyle="yellow";
ctx.font="bold 34px sans-serif";
ctx.fillText(e.text,e.x,e.y);
e.x+=e.dx;
e.y+=e.dy;
e.life--;
});
effects=effects.filter(e=>e.life>0);

if(levelMessage){
ctx.fillStyle="orange";
ctx.font="bold 46px sans-serif";
ctx.textAlign = "center";
ctx.fillText(levelMessage, canvas.width / 2, 100);
}

function moveDogs(){
dogs.forEach(dog=>{
dog.x+=dog.speed;
if(dog.x>840)dog.x=-110;
if(dog.jump<0)dog.jump+=1;

const dx=(dog.x+45)-(snack.x+15);
const dy=(dog.y+45+dog.jump)-(snack.y-15);

if(Math.abs(dx)<48&&Math.abs(dy)<58){
score += snack.item.point;
pointText.textContent = score;
if(score >= 20 && level === 1){
    level = 2;
    levelMessage = "LEVEL 2!";
    dogs.forEach(d => d.speed = 4);
    setTimeout(()=>{ levelMessage = ""; },1500);
}

if(score >= 50 && level === 2){
    level = 3;
    levelMessage = "LEVEL 3!";
    dogs.forEach(d => d.speed = 5);
    setTimeout(()=>{ levelMessage = ""; },1500);
}

if(score >= 100 && level === 3){
    level = 4;
    levelMessage = "LEVEL MAX!";
    dogs.forEach(d => d.speed = 6);
    setTimeout(()=>{ levelMessage = ""; },1500);
}
addEffect(snack.x+15,snack.y-30);
dog.jump=-24;
playWan();
resetSnack();
}
});
}

function drawStartText(){
drawBackground();

dogs[0].x=180;dogs[0].y=260;
dogs[1].x=340;dogs[1].y=260;
dogs[2].x=500;dogs[2].y=260;

dogs.forEach(drawDog);

ctx.fillStyle="rgba(0,0,0,.35)";
ctx.fillRect(0,0,800,500);

ctx.fillStyle="#fff";
ctx.font="bold 34px sans-serif";
ctx.fillText("ゲームスタートを押してね！",210,245);
}

function drawGameOver(){
if(score>bestScore){
bestScore=score;
localStorage.setItem("bestScore",bestScore);
}

ctx.fillStyle="rgba(0,0,0,.6)";
ctx.fillRect(0,0,800,500);

ctx.fillStyle="#fff";
ctx.font="bold 38px sans-serif";
ctx.fillText("ゲーム終了！",290,200);

ctx.font="bold 30px sans-serif";
ctx.fillText("スコア："+score,335,260);
ctx.fillText("最高："+bestScore,335,310);
}

function gameLoop(ts){
if(!gameRunning)return;

frame++;

if(!lastSecond)lastSecond=ts;

if(ts-lastSecond>=1000){
time--;
timeText.textContent=time;
lastSecond=ts;

if(time<=0){
gameRunning=false;
drawGameOver();
return;
}
}

drawBackground();
drawSnack();
dogs.forEach(drawDog);
moveDogs();
drawEffects();

requestAnimationFrame(gameLoop);
}

function startGame(){
score=0;
level = 1;
levelMessage = "";
time=30;
frame=0;
lastSecond=0;

pointText.textContent=0;
timeText.textContent=30;

dogs[0].x=80;dogs[0].y=300;
dogs[1].x=-150;dogs[1].y=205;
dogs[2].x=-300;dogs[2].y=110;

dogs.forEach(d=>d.jump=0);
resetSnack();

gameRunning=true;
requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click",startGame);

document.addEventListener("keydown",e=>{
if(e.code==="Space"){
dogs.forEach(d=>d.jump=-28);
}
});

canvas.addEventListener("click",()=>{
dogs.forEach(d=>d.jump=-28);
});

drawStartText();