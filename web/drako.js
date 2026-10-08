/* Optional sprite sampler. No combat or progression values are changed. */
(function(root){
 const clips={idle:'Drako-Idle-idle',walk:'Drako-idle',jab:'Drako-Jab-idle',throw:'Drako-Throw-idle',cast:'Drako-Spell-Casting-idle',spell:'Spell-Cast-idle'};
 function frameAt(frames,seconds,loop=true){
  const total=frames.reduce((n,f)=>n+(f.duration||125),0);
  let ms=Math.max(0,seconds)*1000;ms=loop?ms%total:Math.min(ms,total-1);
  for(const f of frames){ms-=f.duration||125;if(ms<0)return f;}return frames[frames.length-1];
 }
 function autoClip(m){if(m.state==='travel'||m.meleeWalking)return 'walk';if(m.ultimateActive&&m.ultimatePhase==='melee')return 'jab';if(m.state==='fight'&&m.sinceShot<Math.min(.8,m.interval||.9))return m.burst>0?'cast':'throw';return 'idle';}
 if(typeof module!=='undefined')module.exports={clips,frameAt,autoClip};
 if(typeof document==='undefined')return;
 const base='characters/drako/',assets={};let selected='brine',mode='auto',loaded=false,loading=null,start=0;
 try{selected=localStorage.getItem('brine-test-character')==='drako'?'drako':'brine';}catch{}
 const panel=document.createElement('section');panel.id='drako-sampler';
 panel.innerHTML='<h2>CHARACTER TEST</h2><label for="character-choice">PLAY AS</label><select id="character-choice"><option value="brine">Brine — original</option><option value="drako">Drako — sprite test</option></select><div id="drako-options" hidden><label for="drako-animation">ANIMATION PREVIEW</label><select id="drako-animation"><option value="auto">Automatic — follow battle</option><option value="idle">Idle</option><option value="walk">Walk</option><option value="jab">Jab</option><option value="throw">Throw</option><option value="cast">Spell casting</option><option value="spell">Spell effect</option></select><p>Cosmetic test: your equipment, damage and progress stay the same. Manual previews loop even while paused. Choose Automatic to follow combat.</p></div><p id="drako-status" role="status"></p>';
 document.getElementById('deck-settings').prepend(panel);
 const choice=panel.querySelector('#character-choice'),options=panel.querySelector('#drako-options'),status=panel.querySelector('#drako-status');choice.value=selected;
 function load(){if(loaded)return Promise.resolve();if(loading)return loading;
  loading=Promise.all(Object.entries(clips).map(async([id,file])=>{
   const response=await fetch(base+file+'.json');if(!response.ok)throw Error('Missing '+id+' animation');
   const data=await response.json(),image=new Image();image.src=base+data.meta.image;await image.decode();
   assets[id]={image,frames:Object.values(data.frames)};
  })).then(()=>{loaded=true;}).finally(()=>{loading=null;});return loading;
 }
 async function select(){options.hidden=selected!=='drako';status.textContent=selected==='drako'?'Loading Drako sprites…':'';
  if(selected==='drako')try{await load();if(selected==='drako')status.textContent='Drako ready · 6 animation sequences';}catch{if(selected==='drako'){selected='brine';choice.value='brine';options.hidden=true;status.textContent='Could not load Drako. Choose Drako again to retry.';}}
  try{localStorage.setItem('brine-test-character',selected);}catch{}
 }
 choice.onchange=()=>{selected=choice.value;mode='auto';panel.querySelector('#drako-animation').value=mode;start=performance.now()/1000;select();};
 panel.querySelector('#drako-animation').onchange=e=>{mode=e.target.value;start=performance.now()/1000;};select();
 function sprite(c,id,time,x,y,height,loop=true){const a=assets[id],f=frameAt(a.frames,time,loop).frame,w=height*f.w/f.h;c.drawImage(a.image,f.x,f.y,f.w,f.h,x-w/2,y-height,w,height);}
 const originalActor=actor;
 actor=function(){if(selected!=='drako'||!loaded)return originalActor();
  const manual=mode!=='auto',id=manual?mode:autoClip(model),time=manual?performance.now()/1000-start:model.time;
  const x=124+(model.meleeAdvance||0);ctx.save();
  if(id==='spell'){sprite(ctx,'idle',time,x,578,145);sprite(ctx,'spell',time,x+65,515,85);}
  else {const clipTime=manual?time:id==='jab'?model.meleeCycle/Math.max(.1,model.meleeDuration):['throw','cast'].includes(id)?model.sinceShot/Math.max(.1,Math.min(.8,model.interval||.9)):time;sprite(ctx,id,clipTime,x,578,145,manual||['idle','walk'].includes(id));}
  ctx.restore();
 };
 const originalProjectile=drawShopProjectile;
 drawShopProjectile=function(c,shot,travel){if(selected!=='drako'||!loaded)return originalProjectile(c,shot,travel);sprite(c,'spell',shot.age||0,0,22,44);return true;};
 const originalRefresh=refresh;refresh=function(){originalRefresh();if(selected==='drako'&&loaded){const name=document.getElementById('ref-player-name');if(name)name.textContent='DRAKO · LV '+model.level;}};
 root.BrineDrako={get selected(){return selected;},get loaded(){return loaded;}};
})(typeof globalThis!=='undefined'?globalThis:this);
