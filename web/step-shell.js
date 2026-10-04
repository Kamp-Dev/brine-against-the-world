// Runtime color key: only cream pixels connected to the frame border are hidden.
// Closed outlines protect the similarly colored chest and eyes; original art stays intact.
function keyStepShellBackground(pixels,width,height,cw,ch){
 const seen=new Uint8Array(width*height),queue=new Int32Array(cw*ch);
 for(let oy=0;oy<height;oy+=ch)for(let ox=0;ox<width;ox+=cw){
  let head=0,tail=0;
  const push=(x,y)=>{const i=y*width+x,p=i*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];if(!seen[i]&&r>210&&g>198&&b>165&&r-g<30&&r-b<65){seen[i]=1;queue[tail++]=i;}};
  for(let x=ox;x<ox+cw;x++){push(x,oy);push(x,oy+ch-1);}for(let y=oy;y<oy+ch;y++){push(ox,y);push(ox+cw-1,y);}
  // Enclosed gaps beside the arms and between the feet need their own backdrop seeds.
  for(let y=oy+230;y<oy+ch;y++)for(let x=ox;x<ox+cw;x++){const p=(y*width+x)*4;if((x-ox<330||x-ox>480||y-oy>365)&&pixels[p]>239&&pixels[p+1]>231&&pixels[p+2]>216)push(x,y);}
  while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);pixels[i*4+3]=0;if(x>ox)push(x-1,y);if(x<ox+cw-1)push(x+1,y);if(y>oy)push(x,y-1);if(y<oy+ch-1)push(x,y+1);}
 }
}
function prepareStepShellImage(image,clip){
 if(!clip.backgroundKey)return image;
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);
 keyStepShellBackground(pixels.data,canvas.width,canvas.height,clip.cellWidth,clip.cellHeight);c.putImageData(pixels,0,0);return canvas;
}
// One opaque character at a time. The local shell burst masks the model change.
function sampleStepShell(m, data) {
 const phase=m.ultimatePhase||'normal',t=Math.max(0,Math.min(1,m.transformProgress||0));
 const transition=phase==='enter'||phase==='exit';
 const show=phase==='melee'||(phase==='enter'&&t>=.5)||(phase==='exit'&&t<.5);
 const waiting=phase==='melee'&&['reward','lower','travel'].includes(m.state)&&!(m.meleeCycle>0&&m.meleeCycle<m.meleeDuration);
 const moving=phase==='melee'&&(m.meleeWalking||waiting||m.meleeIdleActive);
 const attacking=phase==='melee'&&!moving&&m.meleeCycle>0&&m.meleeCycle<m.meleeDuration;
 const clip=moving?data.walk:data.punch;
 let frame=0;
 // Complete two steps on approach; the partial trailing step is excluded from the idle loop.
 const loopFrames=clip.loopFrames||clip.frames;
 if(moving)frame=m.meleeWalking&&!m.meleeIdleActive?Math.min(clip.frames-1,Math.floor(Math.max(0,Math.min(1,(m.meleeAdvance||0)/Math.max(1,m.meleeReach)))*loopFrames)):Math.floor((m.meleeIdleTime||0)*clip.fps)%loopFrames;
 else if(attacking)frame=Math.min(clip.frames-1,Math.floor(m.meleeCycle/m.meleeDuration*clip.frames));
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
 const power=e.power||1,t=(e.duration-e.life)/(.22+.08*power);if(t<0||t>=1)return;
 const size=(24+28*Math.sin(Math.min(1,t*3)*Math.PI/2))*power,fade=Math.pow(1-t,.65);
 ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=fade;
 const star=(radius,n,turn,fill)=>{const p=[];for(let i=0;i<n*2;i++){const a=turn+i*Math.PI/n,r=radius*(i%2?.42:1)*(1+.1*Math.sin(i*4.7));p.push([Math.cos(a)*r,Math.sin(a)*r*.82]);}path(p,fill,'#182627',2.5);};
 star(size*1.12,11,.06,'#121d21');star(size,9,.13,'#bf4b2b');star(size*.77,7,-.24,'#f0b64f');star(size*(t<.16?.63:.38),6,.2,'#fff2cd');
 for(let i=0;i<8;i++){const a=i*Math.PI/4+.14,d=(25+62*t)*power,r=(1-t)*7*power;ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.8);ctx.rotate(a+t);path([[-r,-r*.5],[r*2.7,0],[-r,r*.5]],i%2?'#f0b64f':'#fff2cd','#182627',2);ctx.restore();}ctx.restore();
}
