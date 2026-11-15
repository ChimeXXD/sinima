// Rebuild slides 1–7 of one or more logo kits in their existing Figma rows: node gen.mjs 0,6,1 > kits.js
// The slides from 8 on ("In use", see inuse-builder.js) stay as they are.
import { LOGOS, render } from "./marks.mjs";

// Figma ids on the Logo Options page: each kit's row, and the wordmark components (drawn by wordmark-builder.js).
const ROWS = ["94:2", "96:2", "97:2", "98:2", "99:2", "99:357", "108:1112"];
const WORDMARK = { drawn: "112:1279", eyes: "112:1291" };
const kits = process.argv[2].split(",").map(Number).map((i) => {
const L = LOGOS[i];

// Pre-render every SVG the slides need, so the Figma side only places them.
const svg = {};
for (const k of ["light", "dark", "brand", "monoDark", "monoLight"]) svg[k] = render(L, L.v[k]);
svg.up = render(L, L.v.dark, { upright: true });
const bad = { bg: L.v.light.bg, B: "#E0457B", F: "#FFD23F", A: "#22C55E", C: L.v.light.bg, T: "#E0457B", W: "#22C55E" };
svg.mis = render(L, bad);
let iconSvg = render(L, { ...L.icon, C: L.icon.C ?? L.icon.bg });
if (L.icon.grad) {
  const [a, b, c] = L.icon.grad;
  iconSvg = iconSvg.replace(/fill="#A79BF3"/, 'fill="url(#g)"').replace(/<g /, `<defs><radialGradient id="g" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${a}"/><stop offset="0.45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs><g `);
}
svg.icon = iconSvg;

const data = {
  i, name: L.name, tag: L.tag, idea: L.idea, changes: L.changes, build: L.build, rot: L.rot, x: L.x, xName: L.xName,
  vb: L.vb, vbUp: L.vbUp, guides: L.guides, palette: L.palette, v: L.v, icon: { bg: L.icon.bg }, iconScale: L.iconScale, tile: !!L.tile, svg,
  row: ROWS[i], wm: WORDMARK[L.wordmark ?? "drawn"],
};
return data;
});

const BUILDER = String.raw`
const WM=await figma.getNodeByIdAsync(D.wm);
// The name is a drawn vector (a component), never live text. Sized so its cap height matches Manrope Bold at fs.
const wordmark=(fs,col)=>{const i=WM.createInstance();i.name="Wordmark";i.rescale(fs*0.763/i.height);i.children[0].fills=[solid(col)];return i;};
const PAGE = await figma.getNodeByIdAsync("1:11"); await figma.setCurrentPageAsync(PAGE);
await Promise.all([["Inter","Regular"],["Inter","Medium"],["Inter","Semi Bold"],["Manrope","Bold"]].map(([family,style])=>figma.loadFontAsync({family,style})));
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h,o)=>({type:"SOLID",color:hex(h),opacity:o===undefined?1:o});
const INK="#18181B", MUTED="#71717A", LINE="#E4E4E7", W=1600, H=900;
const T=(chars,size,style,color,o={})=>{const t=figma.createText();t.fontName={family:o.family||"Inter",style};t.fontSize=size;t.characters=chars;t.fills=[solid(color)];
  if(o.ls!==undefined)t.letterSpacing={unit:"PERCENT",value:o.ls};if(o.lh)t.lineHeight={unit:"PERCENT",value:o.lh};
  if(o.width){t.resize(o.width,t.height);t.textAutoResize="HEIGHT";}return t;};
const put=(parent,n,x,y)=>{parent.appendChild(n);n.x=x;n.y=y;return n;};
const markNode=(s,h)=>{const vb=s.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);const w=h*vb[2]/vb[3];
  const n=figma.createNodeFromSvg(s.replace("<svg ","<svg width=\""+w.toFixed(2)+"\" height=\""+h.toFixed(2)+"\" "));n.name="Mark";n.fills=[];n.clipsContent=false;return n;};
const lockup=(kind,h,vk,s)=>{const v=D.v[vk]||D.v.light;const f=figma.createAutoLayout(kind==="v"?"VERTICAL":"HORIZONTAL",{name:"Lockup · "+(kind==="v"?"vertical":"horizontal"),itemSpacing:Math.round(h*(kind==="v"?0.2:0.3))});
  f.fills=[];f.counterAxisAlignItems="CENTER";f.appendChild(markNode(s||D.svg[vk],h));
  f.appendChild(wordmark(h*(kind==="v"?0.42:0.58),v.W));return f;};
const centre=(parent,n,cx,cy)=>{parent.appendChild(n);n.x=Math.round(cx-n.width/2);n.y=Math.round(cy-n.height/2);return n;};
const rect=(parent,x,y,w,h,fill,r,stroke)=>{const n=figma.createRectangle();n.resize(w,h);n.fills=fill?[solid(fill)]:[];if(r)n.cornerRadius=r;if(stroke){n.strokes=[solid(stroke)];n.strokeWeight=1;n.strokeAlign="INSIDE";}return put(parent,n,x,y);};
const panel=(parent,x,y,w,h,fill,name)=>{const p=figma.createFrame();p.name=name||"Panel";p.resize(w,h);p.cornerRadius=24;p.fills=[solid(fill)];p.clipsContent=true;
  if(fill.toUpperCase()==="#FFFFFF"){p.strokes=[solid(LINE)];p.strokeWeight=1;p.strokeAlign="INSIDE";}return put(parent,p,x,y);};
const line=(parent,x1,y1,x2,y2,col,o,dash)=>{const v=figma.createVector();v.vectorPaths=[{windingRule:"NONE",data:"M 0 0 L "+(x2-x1)+" "+(y2-y1)}];v.strokes=[solid(col,o)];v.strokeWeight=1;if(dash)v.dashPattern=dash;v.fills=[];return put(parent,v,x1,y1);};
const slide=(n,title,bg)=>{const s=figma.createFrame();s.name=String(n).padStart(2,"0")+" · "+title;s.resize(W,H);s.cornerRadius=32;s.fills=[solid(bg||"#FFFFFF")];s.clipsContent=true;
  s.strokes=[solid(LINE)];s.strokeWeight=1;s.strokeAlign="INSIDE";
  put(s,T(String(n).padStart(2,"0"),20,"Medium",MUTED),96,72);put(s,T(title,44,"Semi Bold",INK),96,100);
  put(s,T("Sinima · logo kit · "+D.name,16,"Regular",MUTED),96,836);const pg=T(n+" / 12",16,"Regular",MUTED);put(s,pg,W-96-pg.width,836);return s;};
// Misuse examples work on a vector copy. Keep it a group: flattening merges the colours. Masks must be alpha masks to survive restyling.
const vector=async(node)=>{const s=await node.exportAsync({format:"SVG_STRING"});const f=figma.createNodeFromSvg(s);const g=figma.group([...f.children],PAGE);f.remove();node.remove();
  for(const m of g.findAll(x=>x.isMask))m.maskType="ALPHA";return g;};
const out={slides:[]};

// Kit row
const row=await figma.getNodeByIdAsync(D.row);const strip=row.children.find(n=>n.name==="Slides");
for(const old of strip.children.slice(0,7))old.remove();

// 1 · Concept
{const s=slide(1,"Concept");strip.appendChild(s);
  put(s,T(D.tag,20,"Medium",MUTED),96,212);put(s,T(D.name,72,"Semi Bold",INK,{ls:-2}),96,244);
  put(s,T(D.idea,24,"Regular",INK,{width:560,lh:140}),96,350);
  put(s,T("Refined",20,"Semi Bold",INK),96,520);
  let y=556;for(const c of D.changes){const t=put(s,T("— "+c,19,"Regular","#3F3F46",{width:560,lh:140}),96,y);y+=t.height+8;}
  const p=panel(s,760,96,744,704,D.v.light.bg,"Logo");centre(p,lockup("h",150,"light"),372,352);out.slides.push(s.id);}

// 2 · Construction
{const s=slide(2,"Construction");strip.appendChild(s);
  put(s,T("Built on a 4-unit grid. Every edge, curve and centre sits on a guide.",22,"Regular",INK,{width:560,lh:140}),96,212);
  let y=320;for(const b of D.build){const t=put(s,T("— "+b,19,"Regular","#3F3F46",{width:560,lh:140}),96,y);y+=t.height+10;}
  if(D.rot)put(s,T("Shown upright here; the finished mark turns "+D.rot+"° anticlockwise.",18,"Medium",MUTED,{width:560,lh:140}),96,y+16);
  const PW=744,PH=704,p=panel(s,760,96,PW,PH,D.v.dark.bg,"Grid");
  const vb=D.vbUp,mh=Math.min(400,520*vb[3]/vb[2]),sc=mh/vb[3],mw=vb[2]*sc,ox=(PW-mw)/2-vb[0]*sc,oy=(PH-mh)/2-vb[1]*sc;
  const m=markNode(D.svg.up,mh);put(p,m,(PW-mw)/2,(PH-mh)/2);
  const gc=D.v.dark.W;
  for(const gx of D.guides.v)line(p,ox+gx*sc,0,ox+gx*sc,PH,gc,0.35,[6,6]);
  for(const gy of D.guides.h)line(p,0,oy+gy*sc,PW,oy+gy*sc,gc,0.35,[6,6]);
  for(const [cx,cy,r] of D.guides.c){const e=figma.createEllipse();e.resize(2*r*sc,2*r*sc);e.fills=[];e.strokes=[solid(gc,0.7)];e.strokeWeight=1.5;e.dashPattern=[4,4];put(p,e,ox+(cx-r)*sc,oy+(cy-r)*sc);}
  const unit=T("1 unit = "+sc.toFixed(1)+" px here",14,"Medium",gc);unit.opacity=0.6;put(p,unit,24,PH-40);out.slides.push(s.id);}

// 3 · Lockups
{const s=slide(3,"Lockups");strip.appendChild(s);
  const cards=[["Horizontal · the main lockup",96,780,()=>lockup("h",110,"light")],["Vertical · square spaces",896,300,()=>lockup("v",104,"light")],["Mark · icons and small sizes",1216,288,()=>markNode(D.svg.light,D.tile?150:130)]];
  for(const [label,x,w,mk] of cards){const p=panel(s,x,212,w,460,D.v.light.bg,label);centre(p,mk(),w/2,230);put(s,T(label,19,"Medium",INK),x,692);}
  put(s,T("Mark to name: 0.3 × the mark's height. In the vertical lockup the name sits 0.2 × below.",18,"Regular",MUTED,{width:1100}),96,740);out.slides.push(s.id);}

// 4 · Clear space and minimum size
{const s=slide(4,"Clear space and size");strip.appendChild(s);
  const p=panel(s,96,212,1408,430,D.v.light.bg,"Clear space");
  const mh=120,lk=lockup("h",mh,"light");centre(p,lk,704,215);
  const px=D.x*mh/D.vb[3],bx=lk.x-px,by=lk.y-px,bw=lk.width+2*px,bh=lk.height+2*px;
  const box=figma.createRectangle();box.resize(bw,bh);box.fills=[];box.strokes=[solid(INK,0.45)];box.strokeWeight=1;box.dashPattern=[6,6];put(p,box,bx,by);
  rect(p,lk.x,lk.y,lk.width,lk.height,null,0,"#A1A1AA");
  for(const [cx,cy] of [[bx,by],[bx+bw-px,by],[bx,by+bh-px],[bx+bw-px,by+bh-px]]){const q=rect(p,cx,cy,px,px,INK,4);q.opacity=0.08;const t=T("x",16,"Medium",INK);centre(p,t,cx+px/2,cy+px/2);}
  put(s,T(D.xName+". Keep x clear on every side.",20,"Medium",INK),96,664);
  const minH=20,ml=lockup("h",minH,"light");ml.name="Minimum lockup";put(s,ml,96,724);
  const mk=markNode(D.svg.light,16);mk.name="Minimum mark";put(s,mk,96+ml.width+80,726);
  put(s,T("Smallest lockup: "+Math.round(ml.width)+" px wide on screen (mark 20 px tall), 25 mm in print.   Mark alone: 16 px, the favicon.",16,"Regular",MUTED,{width:1300}),96,770);out.slides.push(s.id);}

// 5 · Colour
{const s=slide(5,"Colour");strip.appendChild(s);
  D.palette.forEach(([name,h,use],k)=>{const x=96+k*360;const c=hex(h);rect(s,x,212,340,120,h,16,0.2126*c.r+0.7152*c.g+0.0722*c.b>0.85?LINE:null);
    put(s,T(name,20,"Semi Bold",INK),x,346);put(s,T(h.toUpperCase(),16,"Medium",MUTED),x,374);put(s,T(use,16,"Regular",MUTED,{width:330}),x,398);});
  const vs=[["light","On light"],["dark","On dark"],["brand","On the brand colour"],["monoDark","One colour, dark"],["monoLight","One colour, light"]];
  vs.forEach(([k,label],j)=>{const x=96+j*286;const p=panel(s,x,470,270,280,D.v[k].bg,label);centre(p,lockup("h",52,k),135,140);put(s,T(label,16,"Medium",INK),x,764);});
  out.slides.push(s.id);}

// 6 · Misuse
{const s=slide(6,"Misuse");strip.appendChild(s);
  const tiles=[];for(let r=0;r<2;r++)for(let c=0;c<3;c++)tiles.push([96+c*480,212+r*296]);
  const cap=["Don't stretch or squash it","Don't rotate it","Don't change its colours","Don't outline it","Don't add shadows or glows","Don't place it on busy or low-contrast backgrounds"];
  for(let k=0;k<6;k++){const [x,y]=tiles[k];const bg=k===5?(D.tile?D.v.light.T:D.v.light.B):D.v.light.bg; // a tiled mark sits on its own tile colourconst p=panel(s,x,y,448,236,bg,cap[k]);
    let n=k===2?lockup("h",64,"light",D.svg.mis):lockup("h",64,"light");
    if(k===2){n.findAll(t=>t.name==="Wordmark"&&t.type==="INSTANCE").forEach(t=>t.children[0].fills=[solid("#22C55E")]);}
    if(k===0||k===3||k===4){put(p,n,0,0);n=await vector(n);p.appendChild(n);
      if(k===0){n.resize(n.width*1.45,n.height*0.68);}
      if(k===3)for(const v of n.findAll(x=>"fills" in x&&x.type!=="GROUP")){if(v.isMask||(v.parent&&v.parent.isMask))continue;v.fills=[];v.strokes=[solid(INK)];v.strokeWeight=1.5;}
      if(k===4)n.effects=[{type:"DROP_SHADOW",color:{r:0,g:0,b:0,a:0.45},offset:{x:0,y:10},radius:18,spread:0,visible:true,blendMode:"NORMAL",showShadowBehindNode:false}];}
    if(k===5){for(const [cx,cy,r,o] of [[60,40,120,0.5],[380,200,150,0.35],[250,-40,90,0.25]]){const e=figma.createEllipse();e.resize(2*r,2*r);e.fills=[solid(D.v.light.bg,o)];put(p,e,cx-r,cy-r);}}
    centre(p,n,224,118);if(k===1){n.rotation=-16;const tb=p.absoluteBoundingBox,nb=n.absoluteBoundingBox;n.x+=(tb.x+tb.width/2)-(nb.x+nb.width/2);n.y+=(tb.y+tb.height/2)-(nb.y+nb.height/2);}
    put(s,T("✕  "+cap[k],17,"Medium","#B42318"),x,y+246);}
  out.slides.push(s.id);}

// 7 · App icon
{const s=slide(7,"App icon");strip.appendChild(s);
  const icon=(size)=>{const f=figma.createFrame();f.name="Icon "+size;f.resize(size,size);f.cornerRadius=size*0.2237;f.cornerSmoothing=0.6;f.fills=[solid(D.icon.bg)];f.clipsContent=true;
    const m=markNode(D.svg.icon,size*D.iconScale);centre(f,m,size/2,size/2);return f;};
  put(s,icon(256),96,212);put(s,T("1024 × 1024 · App Store, shown at 256",16,"Medium",MUTED),96,480);
  let x=420;for(const z of [180,120,60,40,32,16]){const ic=icon(z);put(s,ic,x,468-z);put(s,T(String(z),14,"Medium",MUTED),x,480);x+=z+40;}
  const home=panel(s,96,540,880,260,"#1C1C22","Home screen");
  [0,1,2,3,4].forEach(k=>{const ix=60+k*164;if(k===2){put(home,icon(84),ix,60);const lb=T("Sinima",15,"Medium","#FFFFFF");put(home,lb,ix+42-lb.width/2,156);}
    else{const g=figma.createRectangle();g.resize(84,84);g.cornerRadius=84*0.2237;g.cornerSmoothing=0.6;g.fills=[solid("#3A3A44")];put(home,g,ix,60);}});
  const tab=panel(s,1040,600,464,64,"#ECECF1","Browser tab");tab.cornerRadius=14;put(tab,icon(16),24,24);put(tab,T("Sinima · Starting soon in Lekki",16,"Medium","#1D1D1F"),52,21);
  const gn=T("Grey squares stand in for other apps.",14,"Regular","#FFFFFF");gn.opacity=0.5;put(home,gn,60,214);
  out.slides.push(s.id);}

for(let k=0;k<7;k++)strip.insertChild(k,await figma.getNodeByIdAsync(out.slides[k]));
out.row=row.id;out.n=strip.children.length;results.push(out);`;

// Long path data repeats across variants: send each once.
const DICT = [];
for (const data of kits) for (const k of Object.keys(data.svg)) data.svg[k] = data.svg[k].replace(/ d="([^"]{60,})"/g, (m, d) => { let j = DICT.indexOf(d); if (j < 0) { DICT.push(d); j = DICT.length - 1; } return ` d="§${j}§"`; });
process.stdout.write(`const DICT=${JSON.stringify(DICT)};\nconst KITS=${JSON.stringify(kits)};\nfor(const D of KITS)for(const k in D.svg)D.svg[k]=D.svg[k].replace(/§(\\d+)§/g,(m,j)=>DICT[j]);\nconst results=[];\nfor(const D of KITS){${BUILDER}}\nreturn results;`);
