const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
const pointText=document.getElementById("point");
const timeText=document.getElementById("time");
const startButton=document.getElementById("startButton");

let score=0,time=30,gameRunning=false,frame=0,lastSecond=0;
let bestScore=localStorage.getItem("bestScore")||0;
let clouds=[{x:80,y:70},{x:420,y:95},{x:650,y:55}];
let effects=[];

const dogs=[
{name:"マルゲリータ",img:new Image(),x:80,y:300,baseY:300,speed:3.2,jump:0},
{name:"こんぶ",img:new Image(),x:-150,y:205,baseY:205,speed:2.7,jump:0},
{name:"おかゆ",img:new Image(),x:-300,y:110,baseY:110,speed:3.0,jump:0}
];

dogs[0].img.src="assets/margherita.png";
dogs[1].img.src="assets/konbu.png";
dogs[2].img.src="assets/okayu.png";

const snacks=["🦴","🍖","🍪","🌭"];
let snack={x:650,y:240,item:"🦴"};

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
c.x+=0.25;if(c.x>860)c.x=-120;
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
for(let i=0;i<800;i+=40){ctx.fillRect(i,365,22,22);}

ctx.fillStyle="#ffffff";
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
if(dog.img.complete){ctx.drawImage(dog.img,dog.x,dog.y+bounce,90,90);}
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
ctx.fillText(snack.item,snack.x+7,snack.y-4);
}

function resetSnack(){
snack.x=Math.random()*630+80;
snack.y=Math.random()*245+105;
snack.item=snacks[Math.floor(Math.random()*snacks.length)];
}

function addEffect(x,y){
for(let i=0;i<12;i++){
effects.push({x:x,y:y,dx:(Math.random()-.5)*6,dy:(Math.random()-.5)*6,life:25});
}
}

function drawEffects(){
    effects.forEach(e=>{
        // キラキラ
        ctx.fillStyle="gold";
        ctx.beginPath();
        ctx.arc(e.x,e.y,4,0,Math.PI*2);
        ctx.fill();

        // +1
        ctx.fillStyle="yellow";
        ctx.font="bold 22px sans-serif";
        ctx.fillText("+1",e.x-8,e.y-15);

        e.x+=e.dx;
        e.y+=e.dy;
        e.life--;
    });

    effects=effects.filter(e=>e.life>0);
}