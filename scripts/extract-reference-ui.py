"""Extract approved UI artwork; borders use nine-slice rendering, text stays live."""
from pathlib import Path
from PIL import Image
import sys

source=Image.open(sys.argv[1]).convert('RGBA')
out=Path(__file__).resolve().parents[1]/'web/ui/reference'
out.mkdir(parents=True,exist_ok=True)
regions={
 'header':(0,0,1024,114),'paper':(420,578,660,608),
 'teal':(576,22,756,83),'row-frame':(35,614,968,716),
 'panel-frame':(17,560,982,946),'button-frame':(805,632,958,704),
 'banner-frame':(17,462,1008,559),'action-frame':(15,364,331,455),
 'salmon-frame':(338,363,671,455),'salmon':(900,1135,960,1170),
 'nav-frame':(17,1390,210,1524),'build-title':(29,475,393,548),
 'hp-frame':(26,124,267,241),'tideglass-color':(840,475,896,548)
}
for name,box in regions.items():source.crop(box).save(out/(name+'.png'))
icons={
 'road':((65,1399,165,1464),'light'),'gear':((275,1403,359,1465),'light'),
 'build':((452,1399,550,1468),'orange'),'voyage':((645,1399,748,1466),'light'),
 'harbor':((858,1399,949,1468),'light'),'damage':((50,624,145,708),'dark'),
 'shell':((56,731,143,817),'dark'),'speed':((53,837,144,924),'dark'),
 'focus':((62,1020,143,1096),'dark'),'power':((50,1190,145,1261),'dark'),
 'hull':((60,1280,147,1358),'dark'),'volley':((354,381,443,438),'light'),
 'push':((39,383,134,434),'light'),'form':((698,376,752,443),'light'),
 'salvage':((645,482,700,539),'light'),'tideglass':((843,477,893,547),'light')
}
for name,(box,kind) in icons.items():
 im=source.crop(box);pixels=im.load()
 for y in range(im.height):
  for x in range(im.width):
   r,g,b,a=pixels[x,y]
   visible=(max(r,g,b)<105) if kind=='dark' else (r>150 and r>g*1.25) if kind=='orange' else (r>165 and g>160 and b>125)
   pixels[x,y]=(255,255,255,255 if visible else 0)
 im.save(out/('icon-'+name+'.png'))
print('Extracted',len(regions)+len(icons),'UI assets from the approved reference.')

