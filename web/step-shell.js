// One opaque character at a time. The local shell burst masks the model change.
function sampleStepShell(m, data) {
 const phase=m.ultimatePhase||'normal',t=Math.max(0,Math.min(1,m.transformProgress||0));
 const transition=phase==='enter'||phase==='exit';
 const show=phase==='melee'||(phase==='enter'&&t>=.5)||(phase==='exit'&&t<.5);
 const moving=phase==='melee'&&(m.meleeWalking||m.state==='travel');
 const attacking=phase==='melee'&&!moving&&m.meleeCycle>0&&m.meleeCycle<m.meleeDuration;
 const clip=moving?data.walk:data.punch;
 let frame=0;
 // Position-driven steps show a whole gait during the short approach, starting at frame zero.
 if(moving)frame=m.meleeWalking?Math.min(clip.frames-1,Math.floor(Math.max(0,Math.min(1,(m.meleeAdvance||0)/Math.max(1,m.meleeReach)))*(clip.frames-1))):Math.floor(m.age*clip.fps)%clip.frames;
 else if(attacking)frame=Math.min(clip.frames-1,Math.floor(m.meleeCycle/m.meleeDuration*clip.frames));
 const cover=transition?Math.min(1,Math.pow(Math.sin(t*Math.PI),4)*1.5):0;
 const gait=m.meleeWalking?(m.meleeAdvance||0)/(data.rig?.stride||84):m.age;
 return {show,clip,frame,cover,gait,squash:transition?1-.06*Math.sin(t*Math.PI):1};
}
// Two independent legs, half a cycle apart. Stance feet move back at travel speed.
function stepShellLeg(phase,far=false){
 const p=((phase+(far?.5:0))%1+1)%1,stance=p<.5,u=stance?p*2:(p-.5)*2;
 const x=stance?21-42*u:-21+42*(u*u*(3-2*u)),lift=stance?0:10*Math.sin(Math.PI*u);
 const hx=far?9:-11,hy=-40+Math.cos(phase*Math.PI*4)*1.1,ax=hx+x,ay=-13-lift-(far?2:0);
 const dx=ax-hx,dy=ay-hy,d=Math.min(48.99,Math.hypot(dx,dy)),a=Math.atan2(dy,dx)-Math.acos(Math.max(-1,Math.min(1,(27*27+d*d-22*22)/(54*d))));
 return {hip:{x:hx,y:hy},knee:{x:hx+27*Math.cos(a),y:hy+27*Math.sin(a)},ankle:{x:ax,y:ay},stance};
}
function drawStepShellRig(phase){
 const rig=stepShellConfig.rig,img=stepShellImages.rig;
 const part=(id,x,y,angle,scale)=>{const p=rig.parts.find(p=>p.id===id);ctx.save();ctx.translate(124+x,572+y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.drawImage(img,p.x,p.y,p.w,p.h,-p.px,-p.py,p.w,p.h);ctx.restore();};
 const bone=(id,a,b)=>{const p=rig.parts.find(p=>p.id===id),dx=p.ex-p.px,dy=p.ey-p.py;part(id,a.x,a.y,Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(dy,dx),Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(dx,dy));};
 for(const far of [true,false]){const l=stepShellLeg(phase,far),prefix=far?'far':'near';bone(prefix+'Thigh',l.hip,l.knee);part(prefix+'Ankle',l.ankle.x,l.ankle.y,0,far?.14:.16);bone(prefix+'Shin',l.knee,l.ankle);part(prefix+'Foot',l.ankle.x,l.ankle.y,0,far?.124:.15);}
 part('body',0,-140+Math.cos(phase*Math.PI*4)*1.1,0,.22);
}
function drawStepShell(sample) {
 if(sample.clip.kind==='walk'&&stepShellConfig.rig){drawStepShellRig(sample.gait);return;}
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
