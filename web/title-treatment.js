(function(){
 const host=document.getElementById('loading-title'),loading=document.getElementById('loading');
 if(!host||!loading)return;
 let finishIntro;
 window.BrineTitleReady=new Promise(resolve=>{finishIntro=resolve;});
 const button=document.createElement('button');
 button.type='button';button.className='title-play';button.textContent='SKIP INTRO';
 host.after(button);
 const video=document.createElement('video');
 video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.autoplay=true;
 video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');
 video.src='ui/title/brine-comic-title.mp4';
 let finished=false;
 function complete(){if(finished)return;finished=true;clearTimeout(timeout);finishIntro();button.textContent='REPLAY TITLE ANIMATION';}
 const timeout=setTimeout(complete,6000);
 video.addEventListener('playing',()=>host.classList.add('title-playing'));
 video.addEventListener('ended',complete);
 video.addEventListener('error',()=>{host.classList.remove('title-playing');complete();});
 host.append(video);
 button.addEventListener('click',()=>{
  if(!finished){video.pause();host.classList.remove('title-playing');complete();return;}
  video.currentTime=0;video.play().catch(()=>host.classList.remove('title-playing'));
 });
 new MutationObserver(()=>{if(loading.hidden)video.pause();}).observe(loading,{attributes:true,attributeFilter:['hidden']});
 video.play().catch(()=>{host.classList.remove('title-playing');complete();button.textContent='PLAY TITLE ANIMATION';});
})();
