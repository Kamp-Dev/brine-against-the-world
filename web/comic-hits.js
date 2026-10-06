/* Hand-inked impact lettering. Presentation never changes combat timing or damage. */
function drawComicDamageNumbers(c,effects,format){
 const hits=effects.filter(e=>e.type==='hit').slice(-3);
 for(let i=0;i<hits.length;i++){
  const e=hits[i],age=e.duration-e.life,t=Math.max(0,age/e.duration),crit=e.critTier||0;
  const lane=e.numberLane||0,x=Math.max(90,Math.min(420,(e.targetX??e.x)+lane*63));
  const y=Math.max(330,(e.targetY??440)-18-Math.abs(lane)*27-t*42);
  const pop=age<.1?.65+age*5:1.15-Math.min(.15,(age-.1)*.7);
  c.save();c.translate(x,y);c.globalAlpha=Math.min(1,e.life/.28);c.scale(pop,pop);c.rotate(crit?-.09:lane*.035);
  if(crit){
   c.beginPath();for(let n=0;n<24;n++){const a=n*Math.PI/12,r=n%2?.72:1,px=Math.cos(a)*54*r,py=Math.sin(a)*33*r;n?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fillStyle=crit>1?'#ef7850':'#efbb60';c.strokeStyle='#08252d';c.lineWidth=4;c.fill();c.stroke();
   c.save();c.clip();c.fillStyle='#08252d33';for(let dx=-50;dx<55;dx+=7)for(let dy=-30;dy<35;dy+=7){c.beginPath();c.arc(dx,dy,1,0,Math.PI*2);c.fill();}c.restore();
   c.font='12px Bangers';c.textAlign='center';c.textBaseline='middle';c.lineWidth=2.5;c.strokeStyle='#fff2ce';c.strokeText(crit>1?'DOUBLE CRIT!':'CRIT!',0,-19);c.fillStyle='#08252d';c.fillText(crit>1?'DOUBLE CRIT!':'CRIT!',0,-19);
  }
  c.font=(crit?'32':'25')+'px Bangers';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.strokeStyle='#08252d';c.lineWidth=crit?5:4;
  const text=format(e.damage);c.strokeText(text,1,crit?6:1,crit?91:90);c.fillStyle='#fff2ce';c.fillText(text,0,crit?5:0,crit?91:90);
  c.restore();
 }
}

