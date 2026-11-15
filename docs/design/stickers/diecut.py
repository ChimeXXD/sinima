import sys,os
from PIL import Image, ImageFilter
src,dst=sys.argv[1],sys.argv[2]
for f in sys.argv[3:]:
    im=Image.open(os.path.join(src,f+'.png')).convert('RGBA')
    w,h=im.size; pad=int(w*0.09)
    base=Image.new('RGBA',(w+2*pad,h+2*pad),(0,0,0,0)); base.paste(im,(pad,pad),im)
    a=base.split()[3].point(lambda v:255 if v>40 else 0)
    r=int(w*0.045)*2+1
    m=a.filter(ImageFilter.MaxFilter(r if r<=51 else 51))
    if r>51: m=m.filter(ImageFilter.MaxFilter(r-50 if (r-50)%2 else r-49))
    m=m.filter(ImageFilter.GaussianBlur(1.2))
    white=Image.new('RGBA',base.size,(255,255,255,0)); white.putalpha(m)
    out=Image.alpha_composite(white,base)
    bb=out.getbbox(); out=out.crop(bb)
    out.save(os.path.join(dst,f+'.png')); print(f,out.size)
