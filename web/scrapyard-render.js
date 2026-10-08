// Cropped frames are recolored and bounded in memory; source artwork stays intact.
const shopPaintCache=new Map();let shopPaintBytes=0,shopPaintSelection='';
function shopPaintFrame(image,paint,sx=0,sy=0,sw=image.naturalWidth||image.width,sh=image.naturalHeight||image.height){
 const color=BrineShop.paints.find(p=>p.id===paint)?.color;if(!color)return {image,sx,sy,sw,sh};
 const name=image===walk?'walk':image===fire?'fire':Object.keys(stepShellImages).find(k=>stepShellImages[k]===image)+'step'+Object.keys(samuraiImages).find(k=>samuraiImages[k]===image)+(image.src||'');
 const key=[name,paint,sx,sy,sw,sh].join(':');let output=shopPaintCache.get(key);
 if(!output){output=document.createElement('canvas');output.width=sw;output.height=sh;const c=output.getContext('2d',{willReadFrequently:true});c.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);const pixels=c.getImageData(0,0,sw,sh);BrineShop.recolor(pixels.data,color);c.putImageData(pixels,0,0);const bytes=sw*sh*4;while(shopPaintBytes+bytes>48*1024*1024&&shopPaintCache.size){const first=shopPaintCache.keys().next().value,old=shopPaintCache.get(first);shopPaintBytes-=old.width*old.height*4;shopPaintCache.delete(first);}shopPaintCache.set(key,output);shopPaintBytes+=bytes;}
 return {image:output,sx:0,sy:0,sw,sh};
}
const shopDrawImage=ctx.drawImage.bind(ctx);
ctx.drawImage=function(image,...a){
 const shop=model.shop;if(!shop)return shopDrawImage(image,...a);
 const selection=shop.shell+':'+shop.weaponPaint;if(selection!==shopPaintSelection){shopPaintCache.clear();shopPaintBytes=0;shopPaintSelection=selection;}
 const shell=image===walk||image===fire||Object.values(stepShellImages).includes(image)||Object.entries(samuraiImages).some(([k,v])=>k!=='katana'&&k!=='original'&&v===image);
 const weapon=Object.values(weaponImages).includes(image)||image===samuraiImages.katana;
 const paint=shell?shop.shell:weapon?shop.weaponPaint:'rust';
 if(paint==='rust')return shopDrawImage(image,...a);
 const f=a.length===8?shopPaintFrame(image,paint,...a.slice(0,4)):shopPaintFrame(image,paint);
 return a.length===8?shopDrawImage(f.image,0,0,f.sw,f.sh,...a.slice(4)):shopDrawImage(f.image,...a);
};
const shopEffects=effects;effects=function(){shopEffects();for(const e of (globalThis.brineCombatVisual?.accents||[])){if(e.type==='confetti-burst'){ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=Math.min(1,e.life/.16);drawConfettiFrame(ctx,4+Math.min(3,Math.floor((1-e.life/e.duration)*4)));ctx.restore();continue;}if(e.type!=='shop-mod')continue;ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=e.life/e.duration;ctx.strokeStyle='#092e36';ctx.lineWidth=2;const t=1-e.life/e.duration;for(let n=0;n<7;n++){const a=n*6.283/7,x=Math.cos(a)*(12+t*35),y=Math.sin(a)*(12+t*35);ctx.fillStyle=e.mod==='duck'?'#f2cf69':n%2?'#ee805d':'#9acac0';ctx.beginPath();ctx.arc(x,y,e.mod==='whoopee'?5:3,0,7);ctx.fill();ctx.stroke();}ctx.restore();}};

// Supplied projectile sheets are loaded alongside the battle artwork.
const shopProjectileImages={};
function drawConfettiFrame(c,index){
 const im=shopProjectileImages.confetti,art=BrineProjectileArt.confetti;if(!im?.complete||!im.naturalWidth||!art)return false;
 const f=art.frames[index],k=80/art.size;
 c.drawImage(im,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k+10,f.w*k,f.h*k);return true;
}
function drawShopProjectile(c,shot,travel){
 const mod=shot.shopMod;if(!mod)return false;
 if(mod==='confetti'){const progress=Math.min(1,travel/Math.max(1,model.enemyX-23-shot.startX));return drawConfettiFrame(c,Math.min(3,Math.floor(progress*4)));}
 const im=shopProjectileImages[mod],art=BrineProjectileArt[mod];if(!im?.complete||!im.naturalWidth||!art)return false;
 const age=shot.age||travel/shot.speed,phase=Math.floor(age*24),index=mod==='whoopee'?(phase%14<8?phase%14:14-phase%14):phase%8;
 const f=art.frames[index],size=mod==='sinker'?37:39,k=size/art.size;
 // Eight supplied views provide the tumble; bob and squash add motion between views.
 const progress=Math.min(1,travel/Math.max(1,model.enemyX-23-shot.startX)),hop=Math.sin(progress*Math.PI)*(mod==='duck'?12:5);
 c.save();c.translate(0,-hop);c.rotate(Math.sin(age*18)*.08);if(mod==='whoopee')c.scale(1+Math.sin(age*25)*.07,1-Math.sin(age*25)*.07);
 c.strokeStyle=mod==='whoopee'?'#ed91b6':'#f6e2b8';c.lineWidth=1.5;c.beginPath();c.moveTo(-size*.65,-5);c.lineTo(-size*.9-5,-5);c.moveTo(-size*.6,5);c.lineTo(-size*.85,5);c.stroke();
 c.drawImage(im,f.x,f.y,f.w,f.h,-f.w*k/2,-f.h*k/2,f.w*k,f.h*k);c.restore();return true;
}
const shopDamageNumbers=drawComicDamageNumbers;
drawComicDamageNumbers=function(c,effects,format){
 shopDamageNumbers(c,effects,format);const now=performance.now();
 model.shopCaptions=(model.shopCaptions||[]).filter(e=>now-e.at<1300);
 for(const e of model.shopCaptions.slice(globalThis.brineVisualMode==='calm'?-1:-2)){const age=(now-e.at)/1000,t=age/1.3,brick=e.mod==='sinker',x=Math.max(100,Math.min(415,e.x-(brick?0:65))),y=Math.max(315,e.y-(brick?70:36))-t*25;
  c.save();c.translate(x,y);c.rotate(-.1);const pop=age<.12?.7+age*3:1;c.scale(pop,pop);c.globalAlpha=Math.min(1,(1.3-age)/.25);c.font='24px Bangers, "Segoe UI Emoji", sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=5;c.strokeStyle='#08252d';const text=brick?'!!':e.mod==='duck'?'Quack':'Pfft 💨';c.strokeText(text,0,0);c.fillStyle=brick?'#ff9864':e.mod==='duck'?'#ffdc66':'#ff9cc8';c.fillText(text,0,0);c.restore();
 }
};
