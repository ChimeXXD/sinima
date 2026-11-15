const PAGE = await figma.getNodeByIdAsync("1:11"); await figma.setCurrentPageAsync(PAGE);
await Promise.all([["Inter","Regular"],["Inter","Medium"],["Inter","Semi Bold"]].map(([family,style])=>figma.loadFontAsync({family,style})));
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const toHex=c=>"#"+[c.r,c.g,c.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");
const solid=(h,o)=>({type:"SOLID",color:hex(h),opacity:o===undefined?1:o});
const norm=s=>s.replace(/\s+/g," ").trim();
const loadT=async t=>Promise.all(t.getRangeAllFontNames(0,t.characters.length).map(f=>figma.loadFontAsync(f)));
const INK="#18181B",MUTED="#71717A",LINE="#E4E4E7",W=1600,H=900,TOTAL=12;
const T=(chars,size,style,color,o={})=>{const t=figma.createText();t.fontName={family:"Inter",style};t.fontSize=size;t.characters=chars;t.fills=[solid(color)];if(o.lh)t.lineHeight={unit:"PERCENT",value:o.lh};if(o.width){t.resize(o.width,t.height);t.textAutoResize="HEIGHT";}return t;};
const put=(p,n,x,y)=>{p.appendChild(n);n.x=x;n.y=y;return n;};
const markNode=(s,h)=>{const vb=s.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);const w=h*vb[2]/vb[3];const n=figma.createNodeFromSvg(s.replace("<svg ","<svg width=\""+w.toFixed(2)+"\" height=\""+h.toFixed(2)+"\" "));n.name="Mark";n.fills=[];n.clipsContent=false;return n;};
// Copy that replaces Radesk's lorem ipsum: the longest line that fits where the lorem was.
const COPY=["Lagos showtimes, all in one place.","Every Lagos cinema's showtimes in one place. What's starting near you?","Every Lagos cinema's showtimes in one place: what's starting soon near you, and when to book.","Every Lagos cinema's showtimes in one place: what's starting soon near you, and whether to stay after the credits."];
const fitCopy=len=>COPY.filter(c=>c.length<=len+4).pop()||COPY[0];
const MAP=[["This is a notification for your app. You can put your text here.","Clayface starts in 15 min at Filmhouse Lekki. Tap to book."],["This is a notification for your app.","Clayface starts in 15 min at Filmhouse Lekki."],["Home | Radesk","Starting soon · Sinima"],["radesk.com/home","sinima-app.vercel.app"],["Radesk - Category","Sinima"],["Your text goes here.","Lagos showtimes, starting soon"],["www.radesk.com","sinima-app.vercel.app"],["radesk.com","sinima-app.vercel.app"],["@NameCompany · 2d","@sinima · 2d"],["@Radesk · 2d","@sinima · 2d"],["@Radesk","@sinima"],["Spain","Lagos"],["Joined January 2024","Joined November 2026"]];
const SRC=[["77:1440","Browser","The favicon in a browser tab at 16 px, beside the page name, and in the macOS menu bar."],["77:1524","macOS","In Finder, in a notification and in the Dock: the icon from 32 to 128 px on macOS's own backgrounds."],["77:1674","iOS","The App Store listing, the home screen and a lock-screen notification."],["77:1828","X","The profile picture and posts on X. X shows a business account's picture as a rounded square."],["77:1992","Instagram","Instagram crops the picture to a circle, so the mark must sit well inside it."]];
const results=[];
for(const K of KITS){
  const slide=(n,title)=>{const s=figma.createFrame();s.name=String(n).padStart(2,"0")+" · "+title;s.resize(W,H);s.cornerRadius=32;s.fills=[solid("#FFFFFF")];s.clipsContent=true;s.strokes=[solid(LINE)];s.strokeWeight=1;s.strokeAlign="INSIDE";
    put(s,T(String(n).padStart(2,"0"),20,"Medium",MUTED),96,72);put(s,T(title,44,"Semi Bold",INK),96,100);
    put(s,T("Sinima · logo kit · "+K.name,16,"Regular",MUTED),96,836);const pg=T(n+" / "+TOTAL,16,"Regular",MUTED);put(s,pg,W-96-pg.width,836);return s;};
  const row=await figma.getNodeByIdAsync(K.row);const strip=row.children.find(n=>n.name==="Slides");
  for(const s of strip.children.slice(0,7)){const pg=s.children.find(t=>t.type==="TEXT"&&/^\d+ \/ \d+$/.test(t.characters));if(pg){pg.characters=pg.characters.replace(/\/ \d+$/,"/ "+TOTAL);pg.x=W-96-pg.width;}}
  const comps=figma.createAutoLayout("HORIZONTAL",{name:"Components · "+K.name,itemSpacing:40});comps.fills=[];PAGE.appendChild(comps);
  const mkComp=(svg,name)=>{const m=markNode(svg,120);const c=figma.createComponent();c.name=name;c.resize(m.width,m.height);c.fills=[];c.appendChild(m);m.x=0;m.y=0;comps.appendChild(c);return c;};
  const cIcon=mkComp(K.icon,"Sinima mark · "+K.name+" · on icon"),cMono=mkComp(K.mono,"Sinima mark · "+K.name+" · one colour");
  comps.x=row.x+row.width+200;comps.y=row.y+100;
  const out=[];
  for(let k=0;k<SRC.length;k++){const [sid,title,desc]=SRC[k];const n=8+k;
    const s=slide(n,"In use · "+title);strip.appendChild(s);
    put(s,T(desc,22,"Regular",INK,{width:380,lh:140}),96,212);
    put(s,T("Mockups from the Radesk kit (UI8). Other apps, counts and the story photo are placeholders.",16,"Regular",MUTED,{width:380,lh:140}),96,740);
    const src=await figma.getNodeByIdAsync(sid);const c=src.clone();s.appendChild(c);c.name="Mockup · "+title;
    for(const ch of [...c.children])if(["GRID","FOOTER","LEFT SIDE TEXT"].includes(ch.name))ch.remove();
    c.fills=[];c.clipsContent=false;c.strokes=[];
    // 1. Swap Radesk's logo for ours, clear Radesk's overrides, fit it the way this logo sits in its own icon.
    let swapped=0;
    for(const i of c.findAllWithCriteria({types:["INSTANCE"]})){const mc=await i.getMainComponentAsync();if(!mc||!["LOGO MARK","LOGO MARK - UNICOLOR"].includes(mc.name))continue;
      const b0=i.absoluteBoundingBox,wasMask=i.isMask,wasVisible=i.visible;const isIcon=mc.name==="LOGO MARK";
      i.swapComponent(isIcon?cIcon:cMono);i.resetOverrides();i.isMask=wasMask;i.visible=wasVisible;
      const f=isIcon?(K.tile?1:K.s):0.67;const sc=Math.min(b0.width*f/i.width,b0.height*f/i.height);i.rescale(sc);
      const b1=i.absoluteBoundingBox;i.x+=(b0.x+b0.width/2)-(b1.x+b1.width/2);i.y+=(b0.y+b0.height/2)-(b1.y+b1.height/2);swapped++;}
    // 2. Radesk paints its icons with a white one-colour overlay (a masked group) and hides the coloured logo.
    //    In app icons show our coloured mark instead; elsewhere keep the one-colour version.
    for(const g of c.findAll(x=>x.type==="GROUP"&&x.name==="LOGO MARK - UNICOLOR")){const inst=g.children.find(x=>x.type==="INSTANCE");if(inst)inst.isMask=true;
      const colour=g.parent&&g.parent.children.find(x=>x.type==="INSTANCE"&&x!==inst);if(colour){g.visible=false;colour.visible=true;}}
    // 3. Radesk purple becomes this logo's brand colour; the icon gradient becomes the icon background.
    let recol=0;
    for(const nd of c.findAll(x=>"fills" in x&&Array.isArray(x.fills)&&x.fills.length)){let ch=false;const fl=nd.fills.map(p=>{
        if(p.type==="SOLID"&&toHex(p.color)==="#6232ff"){ch=true;recol++;return solid(K.brand,p.opacity);}
        if(p.type.startsWith("GRADIENT")&&p.gradientStops.map(st=>toHex(st.color)).join(">")==="#9e9ee4>#1a1aad"){ch=true;recol++;return solid(K.iconBg);}
        return p;});if(ch)nd.fills=fl;}
    // 4. Copy
    let txt=0;
    for(const t of c.findAllWithCriteria({types:["TEXT"]})){const s0=t.characters,n0=norm(s0);let s1=s0;
      if(/^Lorem ipsum/.test(n0))s1=fitCopy(n0.length);else{const m=MAP.find(([a])=>a===n0);if(m)s1=m[1];}
      if(s1===s0)s1=s0.replace(/Radesk/g,"Sinima").replace(/radesk/g,"sinima");
      if(s1!==s0){await loadT(t);t.characters=s1;txt++;}}
    // 5. Scale the mockup area (Radesk x 529–1941, y 63–945) into x 520–1504, y 200–800.
    const sc=Math.min(984/1412,600/882);c.rescale(sc);c.x=Math.round(520-529*sc);c.y=Math.round(200-63*sc);
    // 6. Scaling rounds text but not spacing: keep header rows on one line and short labels unwrapped.
    for(const f of c.findAll(x=>x.type==="FRAME"&&x.layoutWrap==="WRAP"&&x.children.length>=2&&x.children[0].type==="TEXT"&&x.children[1].type==="TEXT")){
      const [a,b]=f.children;const room=f.width-f.paddingLeft-f.paddingRight-b.width-f.itemSpacing-1;if(a.width>room){await loadT(a);a.resize(room,a.height);}}
    for(const t of c.findAllWithCriteria({types:["TEXT"]})){if(t.characters.length>12||t.textAutoResize!=="HEIGHT"||typeof t.fontSize!=="number")continue;
      if(t.height>t.fontSize*1.8){await loadT(t);const w=t.width;t.resize(w*1.25,t.height);t.textAutoResize="HEIGHT";t.x-=(t.width-w)/2;}}
    out.push({slide:s.id,swapped,recol,txt});}
  results.push({kit:K.name,out});}
return results;
