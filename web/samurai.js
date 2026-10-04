(function(root){
 'use strict';
 const stages=[['walk',40/18],['ready',.2],['slash',12/18],['ready',.12],['series',29/24],['ready',.25],['walk',40/18],['ready',.3]];
 const duration=stages.reduce((n,s)=>n+s[1],0);
 function sample(data,time){
  let t=((time%duration)+duration)%duration,offset=0,index=0;
  for(;index<stages.length-1&&t>=stages[index][1];index++){t-=stages[index][1];offset+=stages[index][1];}
  const state=stages[index][0],clip=data.clips.find(c=>c.name===(state==='ready'?'walk':state));
  const frame=state==='ready'?0:state==='walk'?Math.floor(t*clip.fps+1e-7)%20:Math.min(clip.frames.length-1,Math.floor(t*clip.fps));
  const f=clip.frames[frame],angle=f.angle;
  // Body, hand and sword share one sample; never rotate the sword ahead of a held body frame.
  let distance=0;for(let i=0;i<index;i++)if(stages[i][0]==='walk')distance+=stages[i][1]*52.5;if(state==='walk')distance+=t*52.5;
  return{state,clip,frame,f,angle,distance,time:t,index,offset};
 }
 function draw(ctx,data,images,s,x,y,height,weapon=true){
  const k=height/360*s.clip.scale,f=s.f,img=images[s.clip.name],left=x-f.anchorX*k,top=y-f.anchorY*k;
  ctx.drawImage(img,f.x,f.y,f.w,f.h,left,top,f.w*k,f.h*k);
  if(!weapon)return;
  const w=data.weapon,hx=left+f.gripX*k,hy=top+f.gripY*k,ws=w.scale*height/360;
  ctx.save();ctx.translate(hx,hy);ctx.rotate(s.angle*Math.PI/180);ctx.scale(ws,ws);ctx.drawImage(images.katana,-w.gripX,-w.gripY);ctx.restore();
  // Restore only the visible fingers over the handle, using the identical source frame.
  ctx.save();ctx.beginPath();ctx.ellipse(hx,hy,10*k,9*k,0,0,Math.PI*2);ctx.clip();ctx.drawImage(img,f.x,f.y,f.w,f.h,left,top,f.w*k,f.h*k);ctx.restore();
 }
 function restoreEyes(pixels,original,width,clip){
  let count=0;const snapshot=new Uint8ClampedArray(pixels);
  for(const f of clip.frames){
   const end=Math.floor(f.y+f.anchorY-.70*360/clip.scale);
   for(let y=f.y;y<end;y++)for(let x=f.x;x<f.x+f.w;x++){
    const p=(y*width+x)*4,source=original||pixels,r=source[p],g=source[p+1],b=source[p+2];
    // Only neutral, light eye pixels in the head region. Orange shell, dark pupils and exterior alpha stay intact.
    if((original||pixels[p+3]>20)&&r>110&&g>100&&b>95&&Math.max(r,g,b)-Math.min(r,g,b)<65){
     let dark=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const q=((y+dy)*width+x+dx)*4;if(x+dx>=f.x&&x+dx<f.x+f.w&&y+dy>=f.y&&snapshot[q+3]>200&&Math.max(snapshot[q],snapshot[q+1],snapshot[q+2])<85)dark++;}
     if(dark>=5){pixels[p]=pixels[p+1]=pixels[p+2]=12;pixels[p+3]=255;continue;}
     if(pixels[p+3]<255)count++;pixels[p]=r;pixels[p+1]=g;pixels[p+2]=b;pixels[p+3]=255;
    }
   }
   // Recover keyed-out black eye interiors inside the surviving eye outline.
   const eyeSource=original||snapshot;
   for(const eye of f.pupils||[])for(const row of eye.seal||[]){
    for(let x=row.left;x<=row.right;x++){const p=((f.y+row.y)*width+f.x+x)*4;
     pixels[p]=eyeSource[p];pixels[p+1]=eyeSource[p+1];pixels[p+2]=eyeSource[p+2];pixels[p+3]=255;
     if(Math.max(eyeSource[p],eyeSource[p+1],eyeSource[p+2])<110)pixels[p]=pixels[p+1]=pixels[p+2]=12;
    }
   }
   for(const eye of f.pupils||[]){
    for(let y=Math.max(f.y,Math.floor(f.y+eye.y-eye.ry));y<Math.min(f.y+f.h,Math.ceil(f.y+eye.y+eye.ry));y++)for(let x=Math.max(f.x,Math.floor(f.x+eye.x-eye.rx));x<Math.min(f.x+f.w,Math.ceil(f.x+eye.x+eye.rx));x++){
     if(((x-f.x-eye.x)/eye.rx)**2+((y-f.y-eye.y)/eye.ry)**2>1)continue;const p=(y*width+x)*4;
     // Pupil masks follow each eye. Keep the orange eyelid and exterior silhouette intact.
     if(pixels[p+3]>20&&Math.max(pixels[p],pixels[p+1],pixels[p+2])-Math.min(pixels[p],pixels[p+1],pixels[p+2])<80){pixels[p]=pixels[p+1]=pixels[p+2]=12;pixels[p+3]=255;}
    }
   }
  }return count;
 }
 function prepareEyes(image,original,clip){
  const out=document.createElement('canvas');out.width=image.naturalWidth;out.height=image.naturalHeight;
  const c=out.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const clean=c.getImageData(0,0,out.width,out.height);let raw=null;
  if(original){c.clearRect(0,0,out.width,out.height);c.drawImage(original,0,0);raw=c.getImageData(0,0,out.width,out.height).data;}
  restoreEyes(clean.data,raw,out.width,clip);c.putImageData(clean,0,0);return out;
 }
 function combatSample(m,data){
  const moving=m.meleeWalking||m.meleeIdleActive,attacking=!moving&&m.meleeCycle>0&&m.meleeCycle<m.meleeDuration;
  const name=moving?'walk':attacking&&m.meleeAttackIndex%2?'series':'slash',clip=data.clips.find(c=>c.name===name);let frame=0;
  if(moving)frame=Math.floor((m.meleeIdleActive?m.meleeIdleTime:m.meleeWalkTime)*18)%20;
  else if(attacking){const impact=name==='slash'?6:15,t=m.meleeCycle;frame=t<m.meleeImpact?Math.floor(t/m.meleeImpact*impact+1e-7):Math.min(clip.frames.length-1,impact+Math.floor((t-m.meleeImpact)/(m.meleeDuration-m.meleeImpact)*(clip.frames.length-impact)+1e-7));}
  const f=clip.frames[frame];return{state:moving?'walk':attacking?name:'ready',clip,frame,f,angle:f.angle};
 }
 const api={sample,draw,duration,stages,restoreEyes,prepareEyes,combatSample};if(typeof module!=='undefined')module.exports=api;root.SamuraiBrine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
