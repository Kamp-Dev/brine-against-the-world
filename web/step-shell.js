// One opaque character at a time. The local shell burst masks the model change.
function sampleStepShell(m, data) {
 const phase=m.ultimatePhase||'normal',t=Math.max(0,Math.min(1,m.transformProgress||0));
 const transition=phase==='enter'||phase==='exit';
 const show=phase==='melee'||(phase==='enter'&&t>=.5)||(phase==='exit'&&t<.5);
 const moving=phase==='melee'&&(m.meleeWalking||m.state==='travel');
 const attacking=phase==='melee'&&!moving&&m.meleeCycle>0&&m.meleeCycle<m.meleeDuration;
 const clip=data.punch;
 let frame=0;
 if(attacking)frame=Math.min(clip.frames-1,Math.floor(m.meleeCycle/m.meleeDuration*clip.frames));
 const cover=transition?Math.min(1,Math.pow(Math.sin(t*Math.PI),4)*1.5):0;
 return {show,clip,frame,cover,squash:transition?1-.06*Math.sin(t*Math.PI):1};
}
function drawStepShell(sample) {
 const a=sample.clip,b=a.frameBounds?.[sample.frame]||a.renderBounds,height=a.height||stepShellConfig.height,k=height/b.h,img=stepShellImages[a.kind];
 ctx.drawImage(img,(sample.frame%a.columns)*a.cellWidth+b.x,Math.floor(sample.frame/a.columns)*a.cellHeight+b.y,b.w,b.h,124-b.w*k/2,572-height,b.w*k,height);
}
function drawTransformation(sample) {
 if(sample.cover<=.005)return;
 const points=[];
 for(let i=0;i<20;i++){const angle=i*Math.PI/10,r=i%2?1:.86;points.push([124+Math.cos(angle)*94*r*sample.cover,506+Math.sin(angle)*92*r*sample.cover]);}
 path(points,'#d96738','#182627',3);
 for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;ctx.save();ctx.translate(124+Math.cos(angle)*104*sample.cover,506+Math.sin(angle)*97*sample.cover);ctx.rotate(angle);path([[-5,-2],[4,-4],[8,2],[-3,4]],'#eed8a6','#25332e',1.5);ctx.restore();}
}

// A short, wordless ink burst anchored to the fist at contact.
function drawComicImpact(e){
 const t=(e.duration-e.life)/.34;if(t<0||t>=1)return;
 const size=24+28*Math.sin(Math.min(1,t*2)*Math.PI/2),fade=Math.pow(1-t,.65);
 ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=fade;
 const star=(radius,n,turn,fill)=>{const p=[];for(let i=0;i<n*2;i++){const a=turn+i*Math.PI/n,r=radius*(i%2?.42:1)*(1+.1*Math.sin(i*4.7));p.push([Math.cos(a)*r,Math.sin(a)*r*.82]);}path(p,fill,'#182627',2.5);};
 star(size,9,.13,'#bf4b2b');star(size*.72,7,-.24,'#f0b64f');star(size*(t<.13?.51:.32),6,.2,'#fff2cd');
 for(let i=0;i<8;i++){const a=i*Math.PI/4+.14,d=25+52*t,r=(1-t)*6;ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.8);ctx.rotate(a+t);path([[-r,-r*.5],[r*1.7,0],[-r,r*.5]],i%2?'#f0b64f':'#fff2cd','#182627',1.4);ctx.restore();}ctx.restore();
}
