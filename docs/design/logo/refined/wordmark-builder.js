// use_figma script: draws the Sinima wordmark as vector components on the Logo Options page.
// The name is drawn, not typed: Manrope Bold's own outlines (read from Figma), re-spaced by hand,
// with the i's rebuilt from shapes so their dots can change. Ran once on Sun 15 Nov 2026; component ids are in gen.mjs.
const PAGE=await figma.getNodeByIdAsync("1:11");await figma.setCurrentPageAsync(PAGE);
await figma.loadFontAsync({family:"Manrope",style:"Bold"});
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h,o)=>({type:"SOLID",color:hex(h),opacity:o===undefined?1:o});
const INK="#18181B";
// Font units (Manrope Bold at 1000). Box: y 318 (eye-dot top) to 1081 (S overshoot). Cap height 346, x-height 526, baseline 1066.
const TOP=318,BW=3072,BH=763,U=0.1;
// Ink left edges. Gaps: S–i 92, stem to stem 112 (Manrope sets 120–130), m–a 80.
const X={S:0,i1:672.5,n:905,i2:1513.5,m:1746,a:2596};
const glyph=async ch=>{const t=figma.createText();t.fontName={family:"Manrope",style:"Bold"};t.fontSize=1000;t.characters=ch;PAGE.appendChild(t);t.x=-60000;t.y=-60000;
  const v=figma.flatten([t]);const g={d:v.vectorPaths.map(p=>p.data).join(" "),y:v.y+60000};v.remove();return g;};
const G={S:await glyph("S"),n:await glyph("n"),m:await glyph("m"),a:await glyph("a")};
const base=["S","n","m","a"].map(k=>'<path transform="translate('+X[k]+' '+(G[k].y-TOP)+')" d="'+G[k].d+'"/>');
// Manrope's i is two rectangles: a 120.5 × 540 stem and a 120.5 × 110.5 dot, 82 above the x-height.
const stems=[X.i1,X.i2].map(x=>'<rect x="'+x+'" y="'+(526-TOP)+'" width="120.5" height="540"/>');
const dots={
  drawn:[X.i1,X.i2].map(x=>'<rect x="'+x+'" y="'+(333.5-TOP)+'" width="120.5" height="110.5"/>'),
  // The mark's eyes are 14 × 21 (2:3): the dots become 92 × 138 ovals, 70 above the x-height.
  eyes:[X.i1,X.i2].map(x=>'<ellipse cx="'+(x+60.25)+'" cy="'+(387-TOP)+'" rx="46" ry="69"/>'),
  tilted:[X.i1,X.i2].map(x=>'<ellipse transform="rotate(-8 '+(x+60.25)+' '+(387-TOP)+')" cx="'+(x+60.25)+'" cy="'+(387-TOP)+'" rx="46" ry="69"/>')};
const svg=k=>'<svg xmlns="http://www.w3.org/2000/svg" width="'+BW*U+'" height="'+BH*U+'" viewBox="0 0 '+BW+' '+BH+'" fill="#18181B">'+base.join("")+stems.join("")+dots[k].join("")+'</svg>';
const holder=figma.createAutoLayout("HORIZONTAL",{name:"Components · Wordmark",itemSpacing:40});holder.fills=[];PAGE.appendChild(holder);holder.x=-1800;holder.y=1300;
const comp={};
for(const [k,label] of [["drawn","drawn"],["eyes","eye dots"],["tilted","eye dots, tilted"]]){
  const f=figma.createNodeFromSvg(svg(k));const v=figma.flatten([...f.children],f);v.name="Wordmark";v.fills=[solid(INK)];
  // The component box is the full 3072 × 763 box for every variant, so all three sit on the same baseline.
  const c=figma.createComponent();c.name="Sinima wordmark · "+label;c.resize(BW*U,BH*U);c.fills=[];c.clipsContent=false;
  const vx=v.x,vy=v.y;c.appendChild(v);v.x=vx;v.y=vy;f.remove();holder.appendChild(c);
  c.description="Sinima's wordmark as one vector path (no font). Built from Manrope Bold outlines, re-spaced by hand"+(k==="drawn"?".":"; the i-dots are 2:3 ovals like the mark's eyes"+(k==="tilted"?", turned 8° like the mark.":"."));comp[k]=c;}
// In a lockup, an instance at height fs × 0.763 has the same cap height as Manrope Bold set at fs (see gen.mjs).
// The comparison slide "Wordmark · drawn, not typed" (x −1800, y 320) was built in the same call from these instances.
return Object.fromEntries(Object.entries(comp).map(([k,c])=>[k,c.id]));
