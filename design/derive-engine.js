(function(){
if (customElements.get('derive-road')) return;
const SPEED=380, WIND=560, DAMP=1.5, IMPULSE=210, PXM=8;
const base={bandStyle:'bands',vergeW:10,edge:'curb',curbW:9,stripe:24,shadow:'rgba(0,0,0,.25)',scoreWeight:'400',scoreSize:64,labelFont:'"DM Sans"'};
const summer=Object.assign({},base,{ground:'#9fd062',band:'#95c757',verge:'#e9d9a2',asphalt:'#5d6169',line:'#f6f2e4',curbA:'#e5432f',curbB:'#fbf7ee',warnA:'#ffc21a',warnB:'#2a2a2a',mark:'#ffc21a',car:'#2563eb',carAccent:'#ffffff',glass:'#1b2440',lamp:'#fff6c8',shadow:'rgba(28,52,18,.28)',track:'rgba(40,40,45,.3)',decor:'summer',trees:['#3d8c3a','#4f9e40','#2f7a34'],hi:'#7cc35c',hay:'#f0d27a',wind:'rgba(255,253,240,.9)',dust:['#e6d29a','#d4bd7c','#f2e6c0'],spark:['#ffb020','#ffe066'],score:'#ffffff',scoreShadow:'#24401a',scoreFont:'"Bowlby One"',sign:'#ffc21a',signInk:'#2a2a2a'});
const THEMES={
summer,
'summer-night':Object.assign({},summer,{ground:'#1d3a33',band:'#1a342e',verge:'#3b3a2d',asphalt:'#2b2e37',line:'#c9ccbd',curbA:'#c2372c',curbB:'#d6d3c8',trees:['#14302a','#193a32','#102822'],hi:'#22493d',hay:'#4a4630',wind:'rgba(200,230,255,.4)',dust:['#4a4a3c','#5a5846','#3c3c30'],shadow:'rgba(0,0,0,.35)',track:'rgba(0,0,0,.35)',headlights:'rgba(255,240,190,.32)',vignette:'rgba(3,9,16,.66)',scoreShadow:'#000000',car:'#3b7bff'}),
neon:Object.assign({},base,{ground:'#0c0720',band:'#24184f',bandStyle:'grid',verge:null,asphalt:'#140e2e',line:'#ff3ea5',edge:'glow',curbW:4,edgeColor:'#2ef2ff',warnA:'#ffd400',mark:'#ffd400',car:'#ff2e88',carAccent:'#2ef2ff',glass:'#1a0f3a',lamp:'#e9fdff',glow:true,shadow:'rgba(0,0,0,.5)',track:'rgba(46,242,255,.28)',decor:'neon',blocks:['#17103a','#1d1446','#140d33'],blockLine:['#7a3cff','#ff2e88','#2ef2ff'],wind:'rgba(126,249,255,.6)',dust:['#ff2e88','#2ef2ff','#7a3cff'],spark:['#ffd400','#fff3a0'],score:'#ffffff',scoreGlow:'#ff2e88',scoreFont:'"Unbounded"',scoreWeight:'800',scoreSize:58,headlights:'rgba(140,250,255,.22)',vignette:'rgba(5,2,15,.55)',sign:'#ffd400',signInk:'#0c0720',labelFont:'"JetBrains Mono"'}),
};
THEMES['neon-dawn']=Object.assign({},THEMES.neon,{ground:'#f4ecff',band:'#e2d1fb',asphalt:'#2a2150',edgeColor:'#00b3d6',warnA:'#ff9d00',mark:'#ff9d00',glass:'#2a2150',blocks:['#e9dcfc','#efe4fd','#e4d5fa'],blockLine:['#a77bff','#ff7ab8','#4fd6ee'],wind:'rgba(122,60,255,.4)',track:'rgba(42,33,80,.25)',shadow:'rgba(60,30,120,.2)',score:'#2a2150',scoreGlow:'rgba(255,122,184,.9)',headlights:null,vignette:null,dust:['#ff7ab8','#4fd6ee','#a77bff'],spark:['#ff9d00','#ffd400'],sign:'#ff9d00',signInk:'#2a2150'});
THEMES.retro=Object.assign({},base,{ground:'#efe5cf',band:'#e7dbc0',verge:null,asphalt:'#2e2a25',line:'#f1b42f',curbW:12,stripe:32,curbA:'#e9572b',curbB:'#f6efdf',warnA:'#f1b42f',warnB:'#2e2a25',mark:'#f1b42f',car:'#13807a',carAccent:'#f6efdf',glass:'#2e2a25',lamp:'#f6efdf',shadow:null,track:'rgba(246,239,223,.16)',decor:'retro',shapes:['#2f5d3f','#f1b42f','#e9572b','#3d6e4c','#2f5d3f'],wind:'rgba(46,42,37,.5)',dust:['#d9c9a6','#2e2a25','#e9572b'],spark:['#e9572b','#f1b42f'],score:'#2e2a25',scoreFont:'"Big Shoulders Display"',scoreWeight:'900',scoreSize:92,sign:'#f1b42f',signInk:'#2e2a25',labelFont:'"IBM Plex Mono"'});
THEMES['retro-night']=Object.assign({},THEMES.retro,{ground:'#1e1a2b',band:'#231e33',asphalt:'#0e0c15',curbB:'#e9dfc8',car:'#3fbcaf',glass:'#0e0c15',shapes:['#2d2843','#383152','#2d2843','#4a3f6b','#e9572b'],wind:'rgba(233,223,200,.35)',track:'rgba(233,223,200,.12)',score:'#e9dfc8',headlights:'rgba(241,180,47,.22)',dust:['#383152','#4a3f6b','#e9572b'],signInk:'#0e0c15'});

function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function hash(i,seed){let h=Math.imul(i|0,374761393)+Math.imul(seed|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}

class Road{
  constructor(seed){this.r=rng(seed*7919+13);this.SP=300;this.xs=[0,0,0,0,0];this.nar=[];this.lastNar=0;this.BW=152;this.NW=90;}
  ensure(i){const r=this.r;while(this.xs.length<=i+1){const k=this.xs.length,p=this.xs[k-1];let x=p;if(r()>0.28)x=p+(r()<0.5?-1:1)*(60+r()*90);this.xs.push(x);
    if(k>6&&k-this.lastNar>4&&r()<0.24){const len=1+Math.floor(r()*2);this.nar.push([k*this.SP,(k+len)*this.SP]);this.lastNar=k+len;}}}
  gen(y){this.ensure(Math.floor(Math.max(0,y)/this.SP)+3);}
  cx(y){if(y<0)return 0;const i=Math.floor(y/this.SP);this.ensure(i+1);const t=y/this.SP-i,a=this.xs[i],b=this.xs[i+1];return a+(b-a)*(1-Math.cos(Math.PI*t))/2;}
  nf(y){let f=0;for(const n of this.nar){const a=n[0],b=n[1];if(y<a-140||y>b+140)continue;let g=y<a?1-(a-y)/140:y>b?1-(y-b)/140:1;g=g*g*(3-2*g);if(g>f)f=g;}return f;}
  hw(y){return (this.BW-(this.BW-this.NW)*this.nf(y))/2;}
  approach(y){for(const n of this.nar){if(y>n[0]-460&&y<n[0]-130)return true;}return false;}
}

class DeriveRoad extends HTMLElement{
  static get observedAttributes(){return['theme','wind','speed','distance','seed','mode'];}
  constructor(){super();this._f=this.frame.bind(this);this.ws=1;this.spd=1;this.visible=true;}
  connectedCallback(){
    if(this._init)return;this._init=true;
    Object.assign(this.style,{display:'block',position:'absolute',inset:'0',overflow:'hidden'});
    const cv=document.createElement('canvas');Object.assign(cv.style,{width:'100%',height:'100%',display:'block',touchAction:'manipulation',cursor:'pointer',userSelect:'none'});
    this.appendChild(cv);this.cv=cv;this.ctx=cv.getContext('2d');
    this.readAttrs();
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this);
    this.io=new IntersectionObserver(es=>{this.visible=es[0].isIntersecting;});this.io.observe(this);
    cv.addEventListener('pointerdown',e=>{e.preventDefault();this.onTap();});
    this.resize();this.start();
    if(document.fonts)document.fonts.ready.then(()=>{if(this.mode==='frozen')this.render();});
    this.raf=requestAnimationFrame(this._f);
  }
  disconnectedCallback(){cancelAnimationFrame(this.raf);this.ro&&this.ro.disconnect();this.io&&this.io.disconnect();this._init=false;}
  attributeChangedCallback(){if(!this._init)return;const m=this.mode,t=this.getAttribute('theme');this.readAttrs();if(this.mode==='frozen'||m!==this.mode)this.start();}
  readAttrs(){
    this.th=THEMES[this.getAttribute('theme')]||summer;
    const w=this.getAttribute('wind');this.ws=(w==='left'||w==='gauche')?-1:1;
    this.spd=parseFloat(this.getAttribute('speed'))||1;
    this.mode=this.getAttribute('mode')||'demo';
    this.seed=parseInt(this.getAttribute('seed'))||1;
  }
  resize(){this.W=this.clientWidth||390;this.H=this.clientHeight||844;const d=Math.min(window.devicePixelRatio||1,2);this.cv.width=Math.round(this.W*d);this.cv.height=Math.round(this.H*d);this.ctx.setTransform(d,0,0,d,0,0);if(this.mode==='frozen'&&this.car)this.render();}
  start(){this.runs=0;this.auto=true;this.reset();if(this.mode==='frozen')this.setupFrozen();}
  reset(){
    this.runs++;const r=rng(this.seed*31+this.runs*977);this.r=r;
    this.road=new Road(this.seed*101+this.runs);
    this.car={wy:0,x:0,vx:0,ang:0};this.camX=0;this.tracks=[];this.parts=[];this.crashed=false;this.t=0;this.cool=0;this.ct=0;
    this.lapseAt=9+r()*14;
    this.wp=[];for(let i=0;i<16;i++)this.wp.push({x:r()*(this.W||390),y:r()*(this.H||844),l:6+r()*12,s:r()});
  }
  onTap(){
    if(this.mode==='frozen')return;
    if(this.auto){this.auto=false;this.reset();return;}
    if(this.crashed){if(this.ct>0.5&&!this.hasAttribute('managed'))this.reset();return;}
    this.tap();
  }
  play(){this.auto=false;this.reset();}
  demo(){this.auto=true;this.reset();}
  tap(){if(this.crashed)return;this.car.vx-=this.ws*IMPULSE;}
  crash(){
    const c=this.car,R=this.road;
    if(this.sim){c.x=R.cx(c.wy);c.vx=0;return;}
    this.crashed=true;this.ct=0;this.cs=SPEED*this.spd*0.55;
    const side=Math.sign(c.x-R.cx(c.wy))||1;this.spin=side*(2.6+this.r()*2.2);c.vx*=0.6;
    const th=this.th,r=this.r;
    for(let i=0;i<20;i++){const a=r()*Math.PI*2,s=40+r()*150;this.parts.push({k:'dust',x:c.x,y:c.wy,vx:Math.cos(a)*s+side*60,vy:Math.sin(a)*s+this.cs*0.4,r:6+r()*10,life:0,max:0.9+r()*0.9,col:th.dust[i%th.dust.length]});}
    if(!this.auto)this.dispatchEvent(new CustomEvent('dr-crash',{bubbles:true,detail:{m:Math.floor(c.wy/PXM)}}));
    for(let i=0;i<24;i++){const a=(r()-0.5)*2.4+(side>0?0:Math.PI),s=220+r()*320;this.parts.push({k:th.glow?'shard':'spark',x:c.x+side*10,y:c.wy+10,vx:Math.cos(a)*s,vy:Math.abs(Math.sin(a))*s*0.6+this.cs*0.5,r:2+r()*3,life:0,max:0.25+r()*0.45,col:th.spark[i%th.spark.length]});}
  }
  ai(dt,noLapse){
    this.cool-=dt;const c=this.car,R=this.road,S=SPEED*this.spd;
    if(!noLapse&&this.t>this.lapseAt&&(R.nf(c.wy+40)>0.6||this.t>this.lapseAt+12))return;
    const L=0.26,px=c.x+c.vx*L+0.5*this.ws*WIND*L*L,tx=R.cx(c.wy+S*L);
    if((px-tx)*this.ws>5&&this.cool<=0){this.tap();this.cool=0.09;}
  }
  step(dt,noLapse){
    const c=this.car,R=this.road,S=SPEED*this.spd;this.t+=dt;
    R.gen(c.wy+this.H+800);
    let scroll;
    if(!this.crashed){
      if(this.auto)this.ai(dt,noLapse);
      c.wy+=S*dt;c.vx+=this.ws*WIND*dt;c.vx*=Math.exp(-DAMP*dt);c.x+=c.vx*dt;
      const ta=Math.atan2(c.vx,S)*0.85;c.ang+=(ta-c.ang)*Math.min(1,dt*14);
      if(Math.abs(c.x-R.cx(c.wy))>R.hw(c.wy)+3)this.crash();
      scroll=S;
    }else{
      const k=Math.exp(-2.6*dt);this.cs*=k;c.wy+=this.cs*dt;c.vx*=k;c.x+=c.vx*dt;this.spin*=k;c.ang+=this.spin*dt;this.ct+=dt;scroll=this.cs;
      if(this.auto&&this.ct>1.7&&!this.frozenHold)this.reset();
      if(!this.auto&&this.ct>7&&!this.hasAttribute('managed')){this.auto=true;this.reset();}
    }
    const sn=Math.sin(c.ang),cs=Math.cos(c.ang),rx=c.x-sn*14,ry=c.wy-cs*14,last=this.tracks[this.tracks.length-1];
    if(!last||Math.hypot(rx-last.cx,ry-last.cy)>6){if(!this.crashed||this.cs>30)this.tracks.push({cx:rx,cy:ry,lx:rx-cs*10,ly:ry+sn*10,rx:rx+cs*10,ry:ry-sn*10,a:Math.min(1,0.25+Math.abs(c.ang)*3+(this.crashed?0.8:0))});if(this.tracks.length>150)this.tracks.shift();}
    for(const p of this.parts){p.life+=dt;const d=Math.exp(-(p.k==='dust'?2.2:1.2)*dt);p.vx*=d;p.vy*=d;p.x+=p.vx*dt;p.y+=p.vy*dt;}
    this.parts=this.parts.filter(p=>p.life<p.max);
    const tgt=c.x*0.55+R.cx(c.wy+260)*0.45;this.camX+=(tgt-this.camX)*Math.min(1,dt*3);
    for(const w of this.wp){w.x+=this.ws*(120+w.s*150)*dt;w.y+=scroll*dt*(0.85+w.s*0.25);
      if(w.y>this.H+20||w.x<-30||w.x>this.W+30){w.y=-10-this.r()*80;w.x=this.r()*this.W;}}
  }
  setupFrozen(){
    const R=this.road,c=this.car,target=(parseFloat(this.getAttribute('distance'))||1500)*PXM;
    R.gen(target+3000);let crashY=target;for(const n of R.nar){if(n[0]>=target){crashY=n[0]+50;break;}}
    this.sim=true;const dt=1/60;let n=0;while(c.wy<crashY&&n<20000){this.step(dt,true);n++;}
    this.sim=false;c.x=R.cx(c.wy)+this.ws*(R.hw(c.wy)+4);c.vx=this.ws*220;this.crash();
    this.frozenHold=true;for(let i=0;i<20;i++)this.step(dt,true);
    this.camX=c.x*0.55+R.cx(c.wy+260)*0.45;this.render();
  }
  frame(ts){
    this.raf=requestAnimationFrame(this._f);
    const dt=Math.min(0.033,(ts-(this.last||ts))/1000);this.last=ts;
    if(!this.visible||this.mode==='frozen'||!this.car)return;
    this.step(dt);this.render();
  }
  render(){
    const c=this.ctx,W=this.W,H=this.H,th=this.th,R=this.road,car=this.car;if(!W)return;
    const cSY=H*0.67,camX=this.camX,sx=x=>x-camX+W/2,sy=y=>cSY-(y-car.wy);
    c.save();
    if(this.crashed&&this.ct<0.5&&this.mode!=='frozen'){const a=12*(1-this.ct/0.5);c.translate((Math.random()-0.5)*a,(Math.random()-0.5)*a);}
    c.fillStyle=th.ground;c.fillRect(-20,-20,W+40,H+40);
    const y0=car.wy-(H-cSY)-60,y1=car.wy+cSY+60;
    if(th.bandStyle==='bands'){c.fillStyle=th.band;for(let k=Math.floor(y0/160);k*160<y1;k++){c.fillRect(-20,sy(k*160+80),W+40,80);}}
    else{c.strokeStyle=th.band;c.lineWidth=1.5;c.beginPath();for(let k=Math.floor(y0/56);k*56<y1;k++){const y=sy(k*56);c.moveTo(0,y);c.lineTo(W,y);}const gx0=Math.floor((camX-W/2)/56);for(let k=gx0;k<gx0+W/56+2;k++){const x=sx(k*56);c.moveTo(x,0);c.lineTo(x,H);}c.stroke();}
    const st=8,ys=[],cx=[],hw=[],nf=[];
    for(let y=Math.floor(y0/st)*st;y<=y1;y+=st){ys.push(y);cx.push(R.cx(y));hw.push(R.hw(y));nf.push(R.nf(y));}
    const n=ys.length;
    const poly=o=>{c.beginPath();for(let i=0;i<n;i++)c.lineTo(sx(cx[i]-hw[i]-o),sy(ys[i]));for(let i=n-1;i>=0;i--)c.lineTo(sx(cx[i]+hw[i]+o),sy(ys[i]));c.closePath();};
    // decor
    const CH=90;
    for(let k=Math.floor((y0-120)/CH);k*CH<y1+120;k++){for(let j=0;j<3;j++){const id=k*3+j,h=hash(id,this.seed+this.runs*17);if(h>0.62)continue;
      const wy=k*CH+hash(id+11,this.seed)*CH,side=hash(id+23,this.seed)<0.5?-1:1,sz=10+hash(id+37,this.seed)*16,d=24+hash(id+41,this.seed)*200;
      const hwm=Math.max(R.hw(wy-sz*2),R.hw(wy),R.hw(wy+sz*2));
      const ex=side<0?Math.min(R.cx(wy-sz*2),R.cx(wy),R.cx(wy+sz*2))-hwm:Math.max(R.cx(wy-sz*2),R.cx(wy),R.cx(wy+sz*2))+hwm;
      this.decor(sx(ex+side*(d+sz+(th.vergeW||0))),sy(wy),sz,hash(id+53,this.seed));}}
    if(th.verge){c.fillStyle=th.verge;poly(th.vergeW);c.fill();}
    c.fillStyle=th.asphalt;poly(0);c.fill();
    const cw=th.curbW;
    if(th.edge==='curb'){
      const P={a:new Path2D(),b:new Path2D(),wa:new Path2D(),wb:new Path2D()};
      for(let i=0;i<n-1;i++){const idx=Math.floor(ys[i]/th.stripe)%2,w=nf[i]>0.5,p=w?(idx?P.wa:P.wb):(idx?P.a:P.b);
        const ya=sy(ys[i]),yb=sy(ys[i+1])-0.5;
        for(const s of[-1,1]){const xa=sx(cx[i]+s*hw[i]),xb=sx(cx[i+1]+s*hw[i+1]);p.moveTo(xa,ya);p.lineTo(xa-s*cw,ya);p.lineTo(xb-s*cw,yb);p.lineTo(xb,yb);p.closePath();}}
      c.fillStyle=th.curbA;c.fill(P.a);c.fillStyle=th.curbB;c.fill(P.b);c.fillStyle=th.warnA;c.fill(P.wa);c.fillStyle=th.warnB;c.fill(P.wb);
    }else{
      for(const warn of[false,true]){const p=new Path2D();for(const s of[-1,1]){let on=false;for(let i=0;i<n;i++){const ok=(nf[i]>0.5)===warn;const x=sx(cx[i]+s*(hw[i]-2)),y=sy(ys[i]);if(ok){on?p.lineTo(x,y):p.moveTo(x,y);on=true;}else on=false;}}
        const col=warn?th.warnA:th.edgeColor;c.strokeStyle=col;c.lineJoin='round';
        c.globalAlpha=0.16;c.lineWidth=14;c.stroke(p);c.globalAlpha=0.4;c.lineWidth=7;c.stroke(p);c.globalAlpha=1;c.lineWidth=3;c.stroke(p);}
    }
    // centre line
    c.strokeStyle=th.line;c.lineWidth=th.decor==='retro'?5:3.5;c.lineCap='butt';c.beginPath();
    for(let i=0;i<n-1;i++){if(Math.floor(ys[i]/48)%2||nf[i]>0.4)continue;c.moveTo(sx(cx[i]),sy(ys[i]));c.lineTo(sx(cx[i+1]),sy(ys[i+1]));}c.stroke();
    // approach chevrons
    c.strokeStyle=th.mark;c.lineWidth=6;c.beginPath();
    for(let y=Math.ceil(y0/56)*56;y<y1;y+=56){if(!R.approach(y))continue;const x=R.cx(y),h=R.hw(y),Y=sy(y);
      c.moveTo(sx(x-h+cw+3),Y);c.lineTo(sx(x-h*0.38),Y-30);c.moveTo(sx(x+h-cw-3),Y);c.lineTo(sx(x+h*0.38),Y-30);}c.stroke();
    // signs
    for(const nr of R.nar){const y=nr[0]-360;if(y<y0||y>y1)continue;const x=R.cx(y),h=R.hw(y),Y=sy(y);for(const s of[-1,1])this.sign(sx(x+s*(h+cw+(th.vergeW||0)+26)),Y);}
    // tracks
    c.strokeStyle=th.track;c.lineWidth=3;c.lineCap='round';
    for(let i=1;i<this.tracks.length;i++){const a=this.tracks[i-1],b=this.tracks[i];c.globalAlpha=b.a*(0.3+0.7*i/this.tracks.length);c.beginPath();c.moveTo(sx(a.lx),sy(a.ly));c.lineTo(sx(b.lx),sy(b.ly));c.moveTo(sx(a.rx),sy(a.ry));c.lineTo(sx(b.rx),sy(b.ry));c.stroke();}
    c.globalAlpha=1;
    // wind
    c.strokeStyle=th.wind;c.lineWidth=th.decor==='neon'?1.5:2;c.beginPath();
    for(const w of this.wp){const vx=this.ws*(120+w.s*150),vy=SPEED*(0.85+w.s*0.25),m=Math.hypot(vx,vy),l=th.decor==='neon'?w.l*1.8:w.l;c.moveTo(w.x,w.y);c.lineTo(w.x-vx/m*l,w.y-vy/m*l);}c.stroke();
    if(th.vignette){const g=c.createRadialGradient(sx(car.x),cSY-60,120,sx(car.x),cSY-60,640);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,th.vignette);c.fillStyle=g;c.fillRect(-20,-20,W+40,H+40);}
    const csx=sx(car.x);
    if(th.headlights){c.save();c.translate(csx,cSY);c.rotate(car.ang);c.globalCompositeOperation='lighter';const g=c.createLinearGradient(0,-22,0,-260);g.addColorStop(0,th.headlights);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.moveTo(-9,-22);c.lineTo(9,-22);c.lineTo(80,-260);c.lineTo(-80,-260);c.closePath();c.fill();c.restore();}
    // particles
    for(const p of this.parts){const t=p.life/p.max,X=sx(p.x),Y=sy(p.y);
      if(p.k==='dust'){c.globalAlpha=(1-t)*0.85;c.fillStyle=p.col;c.beginPath();c.arc(X,Y,p.r*(1+t*2.2),0,7);c.fill();}
      else if(p.k==='shard'){c.globalAlpha=1-t;c.fillStyle=p.col;c.save();c.translate(X,Y);c.rotate(p.life*9);c.fillRect(-p.r,-p.r,p.r*2,p.r*2);c.restore();}
      else{c.globalAlpha=1-t;c.strokeStyle=p.col;c.lineWidth=2.2;c.beginPath();c.moveTo(X,Y);c.lineTo(X-p.vx*0.035,Y+p.vy*0.035);c.stroke();}}
    c.globalAlpha=1;
    this.drawCar(csx,cSY,car.ang);
    if(this.mode!=='frozen'&&this.getAttribute('hud')!=='0'){
      const m=Math.floor(car.wy/PXM).toLocaleString('fr-FR');
      c.textAlign='center';c.textBaseline='alphabetic';c.font=`${th.scoreWeight} ${th.scoreSize}px ${th.scoreFont}, sans-serif`;
      const Y=th.decor==='retro'?132:118;
      if(th.scoreGlow){c.shadowColor=th.scoreGlow;c.shadowBlur=20;}else if(th.scoreShadow){c.fillStyle=th.scoreShadow;c.fillText(m,W/2,Y+5);}
      c.fillStyle=th.score;c.fillText(m,W/2,Y);c.shadowBlur=0;
      c.font=`600 12px ${th.labelFont}, monospace`;if('letterSpacing' in c)c.letterSpacing='3px';c.globalAlpha=0.85;c.fillText('MÈTRES',W/2,Y+24);c.globalAlpha=1;if('letterSpacing' in c)c.letterSpacing='0px';
      if(!this.auto&&this.crashed&&this.ct>0.6&&!this.hasAttribute('managed')){c.font=`700 16px ${th.labelFont}, sans-serif`;c.fillStyle=th.score;c.fillText('Tape pour rejouer',W/2,H-110);}
    }
    c.restore();
  }
  sign(x,y){const c=this.ctx,th=this.th;if(th.shadow){c.fillStyle=th.shadow;c.beginPath();c.moveTo(x+5,y-12);c.lineTo(x+20,y+14);c.lineTo(x-10,y+14);c.fill();}
    c.fillStyle=th.sign;c.strokeStyle=th.signInk;c.lineWidth=2.5;c.lineJoin='round';c.beginPath();c.moveTo(x,y-16);c.lineTo(x+16,y+11);c.lineTo(x-16,y+11);c.closePath();c.fill();c.stroke();
    c.lineWidth=2.5;c.beginPath();c.moveTo(x-4,y-5);c.lineTo(x-2,y+6);c.moveTo(x+4,y-5);c.lineTo(x+2,y+6);c.stroke();}
  decor(x,y,s,h){
    const c=this.ctx,th=this.th;if(x<-60||x>this.W+60)return;
    if(th.decor==='summer'){
      if(h<0.14){c.fillStyle=th.shadow;c.beginPath();c.arc(x+5,y+5,s*0.7,0,7);c.fill();c.fillStyle=th.hay;c.beginPath();c.arc(x,y,s*0.7,0,7);c.fill();c.strokeStyle=th.shadow;c.lineWidth=1.5;c.beginPath();c.arc(x,y,s*0.4,0,7);c.stroke();return;}
      const r=h<0.4?s*0.6:s;c.fillStyle=th.shadow;c.beginPath();c.arc(x+r*0.35,y+r*0.35,r,0,7);c.fill();
      c.fillStyle=th.trees[Math.floor(h*30)%3];c.beginPath();c.arc(x,y,r,0,7);c.fill();c.fillStyle=th.hi;c.beginPath();c.arc(x-r*0.3,y-r*0.3,r*0.45,0,7);c.fill();
    }else if(th.decor==='neon'){
      if(h<0.35){c.fillStyle=th.blockLine[2];c.globalAlpha=0.25;c.beginPath();c.arc(x,y,7,0,7);c.fill();c.globalAlpha=1;c.beginPath();c.arc(x,y,2.5,0,7);c.fill();return;}
      const w=s*2.4,hh=s*(1.6+h*2);c.fillStyle=th.blocks[Math.floor(h*20)%3];c.fillRect(x-w/2,y-hh/2,w,hh);
      c.strokeStyle=th.blockLine[Math.floor(h*40)%3];c.lineWidth=1.5;c.strokeRect(x-w/2+.75,y-hh/2+.75,w-1.5,hh-1.5);
      c.fillStyle=c.strokeStyle;c.globalAlpha=0.6;for(let i=0;i<3;i++)c.fillRect(x-w/2+5,y-hh/2+6+i*8,w*0.35,2);c.globalAlpha=1;
    }else{
      const col=th.shapes[Math.floor(h*50)%th.shapes.length];c.fillStyle=col;
      if(h<0.3){c.beginPath();c.moveTo(x,y-s*1.1);c.lineTo(x+s*0.75,y+s*0.7);c.lineTo(x-s*0.75,y+s*0.7);c.closePath();c.fill();}
      else if(h<0.45){c.beginPath();c.arc(x,y+s*0.3,s*0.8,Math.PI,0);c.closePath();c.fill();}
      else{c.beginPath();c.arc(x,y,s*0.85,0,7);c.fill();}
    }
  }
  drawCar(x,y,a){
    const c=this.ctx,th=this.th;c.save();c.translate(x,y);c.rotate(a);
    const body=()=>{c.beginPath();c.moveTo(0,-25);
      c.bezierCurveTo(7,-25,10.5,-24,11,-20);c.lineTo(12.5,-17);c.lineTo(12.5,-8);c.lineTo(11,-4);c.lineTo(11,6);c.lineTo(13,9);c.lineTo(13,19);
      c.bezierCurveTo(13,23,10,24.5,0,24.5);c.bezierCurveTo(-10,24.5,-13,23,-13,19);c.lineTo(-13,9);c.lineTo(-11,6);c.lineTo(-11,-4);c.lineTo(-12.5,-8);c.lineTo(-12.5,-17);c.lineTo(-11,-20);
      c.bezierCurveTo(-10.5,-24,-7,-25,0,-25);c.closePath();};
    if(th.shadow){c.save();c.translate(4,5);c.fillStyle=th.shadow;body();c.fill();c.restore();}
    if(th.glow){c.strokeStyle=th.car;c.globalAlpha=0.35;c.lineWidth=8;body();c.stroke();c.globalAlpha=1;}
    c.fillStyle='#16161a';rr(c,-14.5,-18.5,5,10,1.8);c.fill();rr(c,9.5,-18.5,5,10,1.8);c.fill();rr(c,-15,8.5,5.5,11,1.8);c.fill();rr(c,9.5,8.5,5.5,11,1.8);c.fill();
    c.fillStyle=th.car;body();c.fill();
    c.save();body();c.clip();
    c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-13,-25,3,50);c.fillRect(10,-25,3,50);
    c.fillStyle=th.carAccent;c.fillRect(-5,-25,3.4,50);c.fillRect(1.6,-25,3.4,50);
    c.restore();
    c.fillStyle='#1d1d22';rr(c,-12,21.5,24,4,1.5);c.fill();
    c.fillStyle=th.glass;c.beginPath();c.moveTo(-8.5,-8);c.quadraticCurveTo(0,-11.5,8.5,-8);c.lineTo(7.5,-1.5);c.lineTo(-7.5,-1.5);c.closePath();c.fill();
    c.beginPath();c.moveTo(-7,10);c.lineTo(7,10);c.lineTo(8,15);c.quadraticCurveTo(0,16.5,-8,15);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.moveTo(-5.5,-8.6);c.lineTo(-2,-9.4);c.lineTo(-4.5,-2.5);c.lineTo(-6.5,-2.5);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.14)';rr(c,-7.5,-1.5,15,11.5,2);c.fill();
    c.fillStyle=th.car;c.beginPath();c.ellipse(-12.5,-5,2.4,1.5,-0.3,0,7);c.fill();c.beginPath();c.ellipse(12.5,-5,2.4,1.5,0.3,0,7);c.fill();
    c.fillStyle='#ffffff';c.beginPath();c.arc(0,4.2,4.2,0,7);c.fill();c.fillStyle=th.car;c.font='800 6px "DM Sans",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('7',0,4.6);
    c.fillStyle=th.lamp;c.beginPath();c.ellipse(-7,-22.6,2.6,1.6,-0.35,0,7);c.fill();c.beginPath();c.ellipse(7,-22.6,2.6,1.6,0.35,0,7);c.fill();
    c.fillStyle='#ff3b3b';rr(c,-10.5,19.5,5,2,1);c.fill();rr(c,5.5,19.5,5,2,1);c.fill();
    c.restore();
  }
}
customElements.define('derive-road',DeriveRoad);
})();
