const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
const pointText=document.getElementById("point");
const timeText=document.getElementById("time");
const startButton=document.getElementById("startButton");

let score=0,time=30,gameRunning=false,frame=0,lastSecond=0;

const dogs=[
{name:"マルゲリータ",img:new Image(),x:80,y:300,baseY:300,speed:3.2,jump:0},
{name:"こんぶ",img:new Image(),x:30,y:205,baseY:205,speed:2.7,jump:0},
{name:"おかゆ",img:new Image(),x:10,y:110,baseY:110,speed:3.0,jump:0}
];

dogs[0].img.src="assets/margherita.png";
dogs[1].img.src="assets/konbu.png";
dogs[2].img.src="assets/okayu.png";

const snacks=["bone","meat","cheese","cookie"];
let snack={x:650,y:240,item:"🦴"};

function drawBackground(){
ctx.fillStyle="#bdefff";
ctx.fillRect(0,0,800,500);
ctx.fillStyle="#fff7b3";
ctx.beginPath();
ctx.arc(690,80,45,0,Math.PI*2);
ctx.fill();
ctx.fillStyle="#7bd66f";
ctx.fillRect(0,378,800,122);
ctx.fillStyle="#4aaa45";
for(let i=0;i<800;i+=40){ctx.fillRect(i,365,22,22);}
ctx.fillStyle="#fff";
ctx.font="bold 28px Yu Gothic";
ctx.fillText("青彩堂ドッグラン",280,58);
}

function drawDog(dog){
const bounce=Math.sin(frame*0.18)*8+dog.jump;
ctx.save();
ctx.beginPath();
ctx.arc(dog.x+45,dog.y+45+bounce,45,0,Math.PI*2);
ctx.clip();
ctx.drawImage(dog.img,dog.x,dog.y+bounce,90,90);
ctx.restore();
ctx.strokeStyle="#fff";
ctx.lineWidth=4;
ctx.beginPath();
ctx.arc(dog.x+45,dog.y+45+bounce,45,0,Math.PI*2);
ctx.stroke();
ctx.fillStyle="#073b2a";
ctx.font="bold 16px Yu Gothic";
ctx.fillText(dog.name,dog.x+8,dog.y+110+bounce);
}

function drawSnack(){
const mark={
  bone:"🦴",
  meat:"🍖",
  cheese:"🧀",
  cookie:"🍪"
};

ctx.font="42px serif";
ctx.fillText(mark[snack.item] || "🦴", snack.x, snack.y);
}
function resetSnack(){
snack.x=Math.random()*630+80;
snack.y=Math.random()*245+105;
snack.item=snacks[Math.floor(Math.random()*snacks.length)];
}

function moveDogs(){
dogs.forEach(dog=>{
dog.x+=dog.speed;
if(dog.x>840)dog.x=-110;
if(dog.jump<0)dog.jump+=1;
const dx=(dog.x+45)-(snack.x+15);
const dy=(dog.y+45+dog.jump)-(snack.y-15);
if(Math.abs(dx)<48&&Math.abs(dy)<58){
score++;
pointText.textContent=score;
dog.jump=-24;
resetSnack();
}
});
}

function drawStartText(){
drawBackground();
drawSnack();
dogs.forEach(drawDog);
}

function drawGameOver(){
ctx.fillStyle="rgba(0,0,0,.6)";
ctx.fillRect(0,0,800,500);
ctx.fillStyle="#fff";
ctx.font="bold 38px Yu Gothic";
ctx.fillText("ゲーム終了！",290,215);
ctx.font="bold 30px Yu Gothic";
ctx.fillText("スコア："+score,335,270);
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
requestAnimationFrame(gameLoop);
}

function startGame(){
score=0;
time=30;
frame=0;
lastSecond=0;
pointText.textContent=0;
timeText.textContent=30;
dogs[0].x=80;
dogs[1].x=30;
dogs[2].x=10;
dogs.forEach(d=>d.jump=0);
resetSnack();
gameRunning=true;
requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click",startGame);
document.addEventListener("keydown",e=>{if(e.code==="Space")dogs.forEach(d=>d.jump=-28);});
canvas.addEventListener("click",()=>dogs.forEach(d=>d.jump=-28));

drawStartText();