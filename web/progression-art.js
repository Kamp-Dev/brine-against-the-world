// Approved restoration atlases. Each cell is one persistent restoration level.
let harborArtClip=0;
const harborArtNames=['workshop','ferry','lighthouse'];
const harborArtFrames=[{y:240,h:540},{y:240,h:660},{y:70,h:880}];
const harborArtImages=harborArtNames.map(name=>{const im=new Image();im.src=`restoration/${name}.png`;return im;});
function harborBuildingArt(i,level,width=130,height=112){
 const l=Math.max(0,Math.min(3,level|0)),f=harborArtFrames[i];
 if(!l)return `<svg viewBox="0 0 130 112" width="${width}" height="${height}" role="img" aria-label="Unrestored ${harborArtNames[i]}"><path fill="none" stroke="#8aa89b" stroke-width="2" stroke-dasharray="4 3" d="M10 95V50L65 20L120 50V95ZM5 99H125"/><text x="65" y="80" text-anchor="middle" fill="#f2dba7" font-size="11">NOT RESTORED</text></svg>`;
 const clip='harbor-cell-'+(++harborArtClip);
 return `<svg viewBox="${(l-1)*512} ${f.y} 512 ${f.h}" width="${width}" height="${height}" preserveAspectRatio="xMidYMax meet" overflow="hidden" role="img" aria-label="${harborArtNames[i]} restoration level ${l}"><defs><clipPath id="${clip}"><rect x="${(l-1)*512}" y="${f.y}" width="512" height="${f.h}"/></clipPath></defs><image clip-path="url(#${clip})" href="restoration/${harborArtNames[i]}.png" width="1536" height="1024"/></svg>`;
}
function harborDrawing(p){return `<div class="harbor-buildings" style="display:flex;align-items:end;gap:6px;padding:12px 5px;background:#16434b">${harborArtNames.map((name,i)=>`<div style="flex:1;min-width:0;text-align:center;color:#fff0c8">${harborBuildingArt(i,p.build[i],'100%',112)}<div style="font:12px Bangers,sans-serif;text-transform:uppercase">${name} ${p.build[i]}/3</div></div>`).join('')}</div>`;}
function drawHarborGrowth(c,m){const p=m.progress;if(!p)return;c.save();c.beginPath();c.rect(5,120,440,210);c.clip();for(let i=0;i<3;i++){
 const l=Math.max(0,Math.min(3,p.build[i]|0)),im=harborArtImages[i];if(!l||!im.complete||!im.naturalWidth)continue;
 const f=harborArtFrames[i],w=[94,80,69][i],h=w*f.h/512;
 // Wrapping matches the distant scenery layer; the quay covers structural bases.
 const x=((90+i*170-m.distance*.12)%600+600)%600-70;
 c.drawImage(im,(l-1)*512,f.y,512,f.h,x,(i===1?309:264)-h,w,h);
}
if(p.district[m.route]){c.fillStyle='#f19a76';if(m.route===0){c.fillRect(415,140,2,60);c.beginPath();c.moveTo(417,140);c.lineTo(440,150);c.lineTo(417,161);c.fill();}else if(m.route===1){c.fillStyle='#375e5b';c.fillRect(417,155,13,48);c.fillStyle='#ffe0a0';c.beginPath();c.arc(423,151,8,0,7);c.fill();}else{c.fillStyle='#b5aa87';c.beginPath();c.moveTo(412,202);c.lineTo(418,155);c.lineTo(425,141);c.lineTo(432,155);c.lineTo(438,202);c.closePath();c.fill();c.stroke();c.fillStyle='#f09a76';c.fillRect(420,169,10,4);}}c.restore();}
// UI overlay: isolate text settings and render after combat effects.
function drawCaptainBadge(c,m){if(!m.boss)return;c.save();c.fillStyle='#092329';c.fillRect(151,140,148,36);c.fillStyle='#b95735';c.fillRect(154,143,142,30);c.textAlign='center';c.textBaseline='top';c.fillStyle='#fff0c6';c.font='bold 8px "Barlow Condensed"';c.fillText('CAPTAIN',225,146,132);c.font='bold 12px "Barlow Condensed"';c.fillText(BrineProgression.captains[m.route].name.toUpperCase(),225,156,132);c.restore();}
