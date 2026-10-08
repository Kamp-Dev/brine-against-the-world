/* Distance-driven layers: world travel moves left; paused/combat distance stays still. */
(function(root){
'use strict';
const layers=[{speed:.12,period:720,y:158,height:440},{speed:.43,period:960,y:340,height:250},{speed:1.12,period:700,y:550,height:96}];
function tiles(distance,layer,width=640){const travel=distance*layer.speed,first=Math.floor(travel/layer.period),offset=travel-first*layer.period;return Array.from({length:Math.ceil(width/layer.period)+2},(_,i)=>({x:(i-1)*layer.period-offset,index:first+i-1}));}
function repeat(c,d,l,paint){for(const t of tiles(d,l)){c.save();c.translate(t.x,l.y);paint(c,l,t.index);c.restore();}}
function structure(c,l,d){
 // Sparse foreground pipes/supports, on their own transparent depth plane.
 const dark=d===1?'#163a38':'#3a352c',light=d===1?'#5b7a69':'#8e6c46';
 c.lineJoin='round';c.strokeStyle=dark;c.lineWidth=6;
 for(const x of [38,720]){c.fillStyle=dark;c.fillRect(x,65,16,185);c.fillStyle=light;c.fillRect(x+4,69,6,176);for(const y of [87,188]){c.fillStyle=light;c.fillRect(x-6,y,28,9);c.strokeRect(x-6,y,28,9);}c.beginPath();c.moveTo(x+8,65);c.lineTo(x+8,35);c.lineTo(x+44,12);c.stroke();}
}
function ground(c,l,d){
 const stone=d===1;c.fillStyle=stone?'#263c36':'#332f28';c.fillRect(0,0,l.period+1,l.height);c.fillStyle=stone?'#82947a':'#8a714d';c.fillRect(0,0,l.period+1,18);c.strokeStyle='#172c2b';c.lineWidth=3;c.beginPath();c.moveTo(0,1);c.lineTo(l.period+1,1);c.moveTo(0,18);c.lineTo(l.period+1,18);c.moveTo(0,49);c.lineTo(l.period+1,49);c.stroke();
 for(let x=0;x<l.period;x+=100){c.beginPath();c.moveTo(x,0);c.lineTo(x+9,18);c.lineTo(x+9,49);c.stroke();c.fillStyle=stone?'#4e6758':'#60513b';c.fillRect(x+13,24,79,19);if(stone){c.beginPath();c.moveTo(x+36,1);c.lineTo(x+42,7);c.lineTo(x+37,12);c.stroke();}else{for(const dx of [18,85]){c.fillStyle='#c09c61';c.beginPath();c.arc(x+dx,8,2.5,0,Math.PI*2);c.fill();}c.strokeStyle='#443f31';for(let dx=23;dx<80;dx+=18){c.beginPath();c.moveTo(x+dx,2);c.lineTo(x+dx+12,15);c.stroke();}c.strokeStyle='#172c2b';}}
}
function draw(c,m,scene,original,parallax,growth){
 const d=Math.max(0,Math.min(2,m.route));if(!scene?.naturalWidth)return false;
 repeat(c,m.distance,layers[0],(c,l,index)=>{if(index%2){c.translate(l.period,0);c.scale(-1,1);}c.drawImage(scene,0,0,l.period+1,l.height);});
 if(d===0&&original?.['harbor-quay']?.naturalWidth&&original?.['harbor-deck']?.naturalWidth){
  if(growth){c.save();c.translate(-m.distance*.12%720,249);growth(c,m);c.restore();}
  for(const l of parallax.layers.slice(1))repeat(c,m.distance,l,(c,l,index)=>{if(index%2){c.translate(l.period,0);c.scale(-1,1);}c.drawImage(original[l.image],0,0,l.period+1,l.height);});
 }else{
  repeat(c,m.distance,layers[1],(c,l)=>structure(c,l,d));
  repeat(c,m.distance,layers[2],(c,l)=>ground(c,l,d));
 }
 return true;
}
const api={layers,tiles,draw};if(typeof module!=='undefined')module.exports=api;else root.BrineParallax=api;
})(typeof globalThis!=='undefined'?globalThis:this);
