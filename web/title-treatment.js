(function(){
 const host=document.getElementById('loading-title');
 if(!host)return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let video;
 function update(){
  if(motion.matches){if(video){video.pause();video.remove();video=null;}return;}
  if(video)return;
  video=document.createElement('video');
  video.muted=true;video.playsInline=true;video.preload='none';
  video.setAttribute('aria-hidden','true');
  video.src='ui/title/brine-comic-title.mp4';
  video.addEventListener('playing',()=>host.classList.add('title-playing'));
  video.addEventListener('error',()=>host.classList.remove('title-playing'));
  host.append(video);
  video.play().catch(()=>host.classList.remove('title-playing'));
 }
 motion.addEventListener('change',()=>{host.classList.remove('title-playing');update();});
 new MutationObserver(()=>{
  if(document.getElementById('loading').hidden&&video){video.pause();}
 }).observe(document.getElementById('loading'),{attributes:true,attributeFilter:['hidden']});
 update();
})();
