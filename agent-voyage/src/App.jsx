import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const AIRPORTS = [
  { code:"GVA",name:"Genève-Cointrin" },{ code:"ZRH",name:"Zurich" },
  { code:"MXP",name:"Milan Malpensa" },{ code:"CDG",name:"Paris Charles de Gaulle" },
  { code:"LHR",name:"Londres Heathrow" },{ code:"BCN",name:"Barcelone" },
  { code:"FCO",name:"Rome Fiumicino" },{ code:"AMS",name:"Amsterdam Schiphol" },
  { code:"MAD",name:"Madrid Barajas" },{ code:"DXB",name:"Dubai" },
  { code:"JFK",name:"New York JFK" },{ code:"LAX",name:"Los Angeles" },
  { code:"BKK",name:"Bangkok Suvarnabhumi" },{ code:"SIN",name:"Singapour Changi" },
  { code:"OTHER",name:"Autre - saisie manuelle" },
];

const VIBES = [
  {id:"beach",label:"🏖 Plage & Mer"},{id:"city",label:"🏙 Ville & Culture"},
  {id:"nature",label:"🌿 Nature & Montagne"},{id:"party",label:"🎉 Fête & Nightlife"},
  {id:"gastro",label:"🍽 Gastronomie"},{id:"spa",label:"💆 Détente & Spa"},
  {id:"adventure",label:"🏄 Aventure & Sport"},{id:"romance",label:"💑 Romance"},
  {id:"luxury",label:"💎 Luxe & VIP"},{id:"family",label:"👨‍👩‍👧 Famille"},
];

const ACTIVITIES = [
  {id:"surf",label:"Surf"},{id:"golf",label:"Golf"},{id:"diving",label:"Plongée"},
  {id:"hiking",label:"Randonnée"},{id:"restaurants",label:"Restos étoilés"},
  {id:"shopping",label:"Shopping"},{id:"clubs",label:"Clubs & Bars"},
  {id:"yoga",label:"Yoga & Wellness"},{id:"museums",label:"Musées"},
  {id:"sailing",label:"Voile & Bateau"},{id:"skiing",label:"Ski"},
  {id:"snorkeling",label:"Snorkeling"},{id:"tennis",label:"Tennis"},{id:"safari",label:"Safari"},
];

const LOYALTY = [
  {id:"revolut_ultra",short:"Revolut Ultra"},
  {id:"amex_ch",short:"Amex"},
  {id:"ubs_infinite",short:"UBS Visa"},
  {id:"miles_more",short:"Miles & More"},
  {id:"marriott_bonvoy",short:"Marriott Bonvoy"},
  {id:"hilton_honors",short:"Hilton Honors"},
  {id:"world_of_hyatt",short:"World of Hyatt"},
  {id:"diners_club",short:"Diners Club"},
];

const POINTS_MARKS = [0,5000,10000,15000,20000,25000,30000,40000,50000,75000,100000];

const BAGGAGE_OPTIONS = [
  {id:"no_pref",label:"Pas de préférence"},
  {id:"cabin_only",label:"Cabine seulement"},
  {id:"1_checked_23",label:"1 bagage 23 kg"},
  {id:"2_checked_23",label:"2 bagages 23 kg"},
  {id:"sport",label:"Bagage sport / golf"},
];

const TIPS = [
  "Recherche des vols sur Kayak et Google Flights...","Consultation de Skyscanner et Momondo...",
  "Vérification des hôtels sur Booking.com...","Comparaison sur Airbnb et Hotels.com...",
  "Calcul des 3 scénarios de classe...","Conversion des prix en CHF...",
  "Analyse météo à destination...","Finalisation de la recommandation...",
];

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS D2 — improved contrast
// ═══════════════════════════════════════════════════════════════════

const C = {
  bg:"#0a0a0a", card:"#141414", card2:"#1c1c1c",
  input:"#202020", border:"#2e2e2e", borderH:"#444444",
  text:"#f5f0e8", muted:"#999999", faint:"#444444",
  gold:"#c9a96e", goldD:"#a07840",
  green:"#22c55e", red:"#ef4444",
  sans:"system-ui,-apple-system,sans-serif",
};

const INP = {
  width:"100%", boxSizing:"border-box",
  background:C.input, border:`1px solid ${C.border}`,
  borderRadius:"10px", color:C.text,
  fontSize:"14px", fontFamily:C.sans,
  padding:"13px 16px", outline:"none",
  WebkitAppearance:"none", appearance:"none",
};

const INP_RO = {...INP, color:C.muted, cursor:"default", background:C.card2};

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

const clean = t => t ? t.replace(/[—–]/g," - ") : "";

function wxEmoji(t) {
  const s = (t||"").toLowerCase();
  if(s.includes("orage")||s.includes("storm")) return "⛈️";
  if(s.includes("pluie")||s.includes("rain")) return "🌧️";
  if(s.includes("nuageux")||s.includes("couvert")) return "☁️";
  if(s.includes("partiellement")) return "⛅";
  if(s.includes("neige")||s.includes("snow")) return "❄️";
  if(s.includes("vent")||s.includes("wind")) return "💨";
  if(s.includes("soleil")||s.includes("ensoleillé")||s.includes("beau")||s.includes("sunny")) return "☀️";
  return "🌤️";
}

function extractImages(lines) {
  for(const l of lines){
    const m = l.match(/^IMAGES:\s*(.+)/i);
    if(m) return m[1].split("|").map(u=>u.trim()).filter(u=>u.startsWith("http"));
  }
  return [];
}

function parseSections(text) {
  const lines = clean(text).split("\n");
  const sections = []; let cur = null;
  for(const l of lines){
    const h2 = l.match(/^## (.+)/);
    if(h2){if(cur) sections.push(cur); cur={title:h2[1].trim(),lines:[]};}
    else if(cur) cur.lines.push(l);
  }
  if(cur) sections.push(cur);
  return sections;
}

function parseHotelBlocks(lines) {
  const blocks = []; let cur = null;
  for(const l of lines){
    const h3 = l.match(/^### (.+)/);
    if(h3){if(cur) blocks.push(cur); cur={name:h3[1].trim(),lines:[]};}
    else if(cur) cur.lines.push(l);
  }
  if(cur) blocks.push(cur);
  return blocks;
}

// Extract emoji + rest from section title
function titleParts(t) {
  const m = t.match(/^((?:[\u{1F300}-\u{1FFFF}][\uFE0F\u200D]*)+)\s*/u);
  if(m) return {icon:m[1], label:t.slice(m[0].length)};
  return {icon:"", label:t};
}

// ═══════════════════════════════════════════════════════════════════
// BASE COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Lbl({children, s={}}) {
  return <div style={{fontSize:"10px",fontWeight:"600",letterSpacing:"0.1em",color:C.muted,marginBottom:"6px",textTransform:"uppercase",fontFamily:C.sans,...s}}>{children}</div>;
}

function Chip({label, selected, onClick}) {
  return <button type="button" onClick={onClick} style={{padding:"7px 15px",borderRadius:"20px",border:`1px solid ${selected?C.gold:C.border}`,background:selected?"rgba(201,169,110,0.15)":"transparent",color:selected?C.gold:C.muted,fontSize:"12px",cursor:"pointer",fontFamily:C.sans,whiteSpace:"nowrap"}}>{label}</button>;
}

// ═══════════════════════════════════════════════════════════════════
// LOYALTY SELECTOR
// ═══════════════════════════════════════════════════════════════════

function LoyaltySelector({selected,onChange,points,onPoints}) {
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"7px",marginBottom:selected.length>0?"14px":"0"}}>
        {LOYALTY.map(p=>{
          const on = selected.includes(p.id);
          return <button key={p.id} onClick={()=>onChange(on?selected.filter(x=>x!==p.id):[...selected,p.id])} style={{padding:"6px 13px",borderRadius:"20px",border:`1px solid ${on?C.gold:C.border}`,background:on?"rgba(201,169,110,0.12)":"transparent",color:on?C.gold:C.muted,fontSize:"11px",cursor:"pointer",fontFamily:C.sans}}>{p.short}</button>;
        })}
      </div>
      {selected.length>0 && (
        <div style={{background:C.card2,borderRadius:"10px",padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <Lbl s={{marginBottom:0}}>Points disponibles</Lbl>
            <span style={{fontSize:"14px",fontWeight:"800",color:C.gold}}>{points>=100000?">100 000":points.toLocaleString("fr-CH")} pts</span>
          </div>
          <input type="range" min="0" max="10" step="1"
            value={Math.max(0,POINTS_MARKS.findIndex(v=>v===points))}
            onChange={e=>onPoints(POINTS_MARKS[+e.target.value]||0)}
            style={{width:"100%",accentColor:C.gold,cursor:"pointer"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"9px",color:C.muted,marginTop:"5px"}}>
            {["0","5k","10k","20k","30k","50k",">100k"].map(l=><span key={l}>{l}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INLINE MARKDOWN (dark D2)
// ═══════════════════════════════════════════════════════════════════

function MDInline({text, activeClass}) {
  if(!text) return null;
  const src = clean(text);
  const lnk = s =>
    s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
     .replace(/\*(.+?)\*/g,"<em>$1</em>")
     .replace(/`(.+?)`/g,`<code style="background:#252525;padding:1px 5px;font-family:monospace;font-size:11px;border-radius:3px">$1</code>`)
     .replace(/\[([^\]]+)\]\(([^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener" style="color:${C.gold};text-decoration:none;border-bottom:1px solid ${C.goldD}">$1 ↗</a>`);
  const lines = src.split("\n");
  const out=[]; let tbl=[],lst=[],lstOrd=false;
  const flushList=()=>{
    if(!lst.length) return;
    const Tag=lstOrd?"ol":"ul";
    out.push(<Tag key={`l${out.length}`} style={{margin:"0.4rem 0",paddingLeft:"1.3rem"}}>{lst.map((t,i)=><li key={i} style={{margin:"0.2rem 0",lineHeight:"1.6",fontSize:"13px",color:C.text}} dangerouslySetInnerHTML={{__html:lnk(t)}}/>)}</Tag>);
    lst=[]; lstOrd=false;
  };
  const flushTable=()=>{
    if(!tbl.length) return;
    const rows=tbl.filter(r=>!/^\|[\s:\-|]+\|$/.test(r.trim()));
    if(!rows.length){tbl=[];return;}
    const parse=r=>r.split("|").slice(1,-1).map(c=>c.trim());
    const [head,...body]=rows;
    out.push(<div key={`t${out.length}`} style={{overflowX:"auto",margin:"0.8rem 0"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
        <thead><tr>{parse(head).map((h,i)=><th key={i} style={{padding:"10px 14px",textAlign:"left",fontWeight:"700",background:"#1c1c1c",color:C.gold,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",border:`1px solid ${C.border}`,whiteSpace:"nowrap"}} dangerouslySetInnerHTML={{__html:lnk(h)}}/>)}</tr></thead>
        <tbody>{body.map((r,i)=>{
          const cells=parse(r);
          const isBiz=r.includes("💺")||r.toLowerCase().includes("business");
          const isMix=r.includes("🔀")||r.toLowerCase().includes("mixte")||r.toLowerCase().includes("optimal");
          const isEco=r.includes("🪑")||r.toLowerCase().includes("économ");
          let hl=false;
          if(activeClass==="business"&&isBiz) hl=true;
          if(activeClass==="mixte"&&isMix) hl=true;
          if(activeClass==="eco"&&isEco) hl=true;
          return <tr key={i} style={{background:hl?"rgba(201,169,110,0.1)":i%2===0?C.card:"#191919"}}>
            {cells.map((c,j)=>{
              const isP=/^\d[\d\s]+$/.test(c.trim())&&c.trim().replace(/\s/g,"").length>=3;
              return <td key={j} style={{padding:"10px 14px",border:`1px solid ${C.border}`,lineHeight:"1.5",fontSize:"13px",fontWeight:isP?"900":j===0?"600":"400",letterSpacing:isP?"-0.02em":"normal",color:hl&&isP?C.gold:C.text}} dangerouslySetInnerHTML={{__html:lnk(c)}}/>;
            })}
          </tr>;
        })}</tbody>
      </table>
    </div>);
    tbl=[];
  };
  for(let i=0;i<lines.length;i++){
    const l=lines[i];
    if(/^IMAGES:/i.test(l)||/^#{1,3} /.test(l)) continue;
    if(l.startsWith("|")){flushList();tbl.push(l);continue;}
    flushTable();
    if(/^[-*•] /.test(l)) lst.push(l.replace(/^[-*•] /,""));
    else if(/^\d+\. /.test(l)){lstOrd=true;lst.push(l.replace(/^\d+\. /,""));}
    else if(/^---+$/.test(l.trim())){flushList();out.push(<div key={i} style={{borderTop:`1px solid ${C.border}`,margin:"1.2rem 0"}}/>);}
    else if(l.trim()===""){flushList();out.push(<div key={i} style={{height:"0.35rem"}}/>);}
    else{flushList();out.push(<p key={i} style={{margin:"0.3rem 0",lineHeight:"1.75",fontSize:"13px",color:C.text}} dangerouslySetInnerHTML={{__html:lnk(l)}}/>);}
  }
  flushList();flushTable();
  return <>{out}</>;
}

// ═══════════════════════════════════════════════════════════════════
// PHOTO GRID
// ═══════════════════════════════════════════════════════════════════

function PhotoGrid({urls, name}) {
  const [failed, setFailed] = useState({});
  const [lb, setLb] = useState(null);
  const valid = urls.filter((_,i)=>!failed[i]);

  if(!urls.length || valid.length===0) {
    return (
      <div style={{height:"180px",background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:"12px 12px 0 0"}}>
        <div style={{fontSize:"36px",marginBottom:"8px"}}>🏨</div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:"13px",fontWeight:"600"}}>{name}</div>
        <div style={{color:"rgba(255,255,255,0.35)",fontSize:"11px",marginTop:"3px"}}>Photos non disponibles</div>
      </div>
    );
  }

  // Booking.com style: 1 large left + grid right
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"130px 130px",gap:"3px",overflow:"hidden",borderRadius:"12px 12px 0 0",cursor:"zoom-in"}} onClick={()=>setLb(0)}>
        <div style={{gridRow:"1/3",gridColumn:"1/2",overflow:"hidden"}}>
          <img src={valid[0]} alt="" referrerPolicy="no-referrer"
            onError={()=>setFailed(f=>({...f,[0]:true}))}
            style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        </div>
        {[1,2,3,4].map(i=>(
          valid[i] ? <div key={i} style={{overflow:"hidden",position:"relative"}}>
            <img src={valid[i]} alt="" referrerPolicy="no-referrer"
              onError={()=>setFailed(f=>({...f,[i]:true}))}
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            {i===4 && valid.length>5 && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"12px",fontWeight:"600"}}>+{valid.length-4} photos</div>}
          </div> : <div key={i} style={{background:C.card2}}/>
        ))}
      </div>
      {lb !== null && (
        <div onClick={()=>setLb(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.96)",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <img src={valid[lb]} alt="" referrerPolicy="no-referrer" style={{maxWidth:"90vw",maxHeight:"80vh",objectFit:"contain",borderRadius:"8px"}} onClick={e=>e.stopPropagation()}/>
          <div style={{display:"flex",gap:"6px",marginTop:"14px"}}>
            {valid.map((u,i)=><div key={i} onClick={e=>{e.stopPropagation();setLb(i);}} style={{width:"8px",height:"8px",borderRadius:"50%",background:i===lb?"#fff":"rgba(255,255,255,0.3)",cursor:"pointer"}}/>)}
          </div>
          <button onClick={()=>setLb(null)} style={{position:"absolute",top:"20px",right:"24px",background:"none",border:"none",color:"#fff",fontSize:"28px",cursor:"pointer"}}>×</button>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACCORDION CARD (no double emoji)
// ═══════════════════════════════════════════════════════════════════

function AccCard({title, children, defaultOpen=false, accent=false}) {
  const [open, setOpen] = useState(defaultOpen);
  const {icon, label} = titleParts(title);
  return (
    <div style={{background:C.card,border:`1px solid ${accent?C.gold:C.border}`,borderRadius:"12px",marginBottom:"8px",overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",background:"none",border:"none",cursor:"pointer",borderBottom:open?`1px solid ${C.border}`:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          {icon && <span style={{fontSize:"16px"}}>{icon}</span>}
          <span style={{fontSize:"11px",fontWeight:"700",letterSpacing:"0.12em",color:accent?C.gold:C.text,fontFamily:C.sans}}>{label}</span>
        </div>
        <span style={{color:C.muted,fontSize:"18px",fontWeight:"300",lineHeight:1}}>{open?"−":"+"}</span>
      </button>
      {open && <div style={{padding:"20px"}}>{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECAP DISPLAY — Kayak-inspired dashboard
// ═══════════════════════════════════════════════════════════════════

function RecapDisplay({lines, activeClass, prices}) {
  const text = lines.join(" ");
  // Extract key info
  const destMatch = text.match(/(?:Destination[:\s]+|vers\s+)([A-Za-zÀ-ÿ\s,]+?)(?:\s*\||\s*Dates|\s*Durée|\s*\d)/i);
  const dest = destMatch ? destMatch[1].trim() : null;
  const nightsMatch = text.match(/(\d+)\s*nuits?/i);
  const nights = nightsMatch ? nightsMatch[1] : null;
  const ratingMatch = text.match(/(\d+\.?\d*)\s*\/\s*10/);
  const hotelRating = ratingMatch ? ratingMatch[1] : null;
  const datesMatch = text.match(/(\d{1,2}[\/\s]\w+[\.\/\s]\d{2,4})\s*[-–—]\s*(\d{1,2}[\/\s]\w+[\.\/\s]\d{2,4})/i);

  const classPrice = activeClass==="business" ? prices.business : activeClass==="mixte" ? prices.mixte : prices.eco;
  const classEmoji = activeClass==="business" ? "💺" : activeClass==="mixte" ? "🔀" : "🪑";
  const classLabel = activeClass==="business" ? "Business" : activeClass==="mixte" ? "Mixte" : "Économie";

  return (
    <div>
      {/* Hero destination line */}
      <div style={{marginBottom:"20px"}}>
        {dest && <div style={{fontSize:"24px",fontWeight:"900",color:C.text,letterSpacing:"-0.02em",marginBottom:"4px"}}>{dest}</div>}
        {(nights||datesMatch) && (
          <div style={{fontSize:"14px",color:C.muted}}>
            {datesMatch ? `${datesMatch[1]} - ${datesMatch[2]}` : ""}{nights ? ` · ${nights} nuits` : ""}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:"8px",marginBottom:"20px"}}>
        {classPrice && (
          <div style={{background:C.card2,border:`1px solid ${C.gold}`,borderRadius:"10px",padding:"14px 12px",textAlign:"center"}}>
            <div style={{fontSize:"11px",color:C.gold,marginBottom:"4px",letterSpacing:"0.06em"}}>{classEmoji} {classLabel}</div>
            <div style={{fontSize:"22px",fontWeight:"900",color:C.gold,letterSpacing:"-0.02em"}}>{parseInt(classPrice.replace(/\s/g,"")).toLocaleString("fr-CH")}</div>
            <div style={{fontSize:"10px",color:C.muted}}>CHF total</div>
          </div>
        )}
        {nights && (
          <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 12px",textAlign:"center"}}>
            <div style={{fontSize:"20px",marginBottom:"4px"}}>🌙</div>
            <div style={{fontSize:"22px",fontWeight:"900",color:C.text}}>{nights}</div>
            <div style={{fontSize:"10px",color:C.muted}}>nuits</div>
          </div>
        )}
        {hotelRating && (
          <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 12px",textAlign:"center"}}>
            <div style={{fontSize:"20px",marginBottom:"4px"}}>⭐</div>
            <div style={{fontSize:"22px",fontWeight:"900",color:C.text}}>{hotelRating}</div>
            <div style={{fontSize:"10px",color:C.muted}}>/ 10 hôtel</div>
          </div>
        )}
        <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 12px",textAlign:"center"}}>
          <div style={{fontSize:"20px",marginBottom:"4px"}}>✈️</div>
          <div style={{fontSize:"14px",fontWeight:"700",color:C.text}}>GVA</div>
          <div style={{fontSize:"10px",color:C.muted}}>départ</div>
        </div>
      </div>

      {/* Full detail */}
      <MDInline text={lines.join("\n")} activeClass={activeClass}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FLIGHTS DISPLAY — Kayak-inspired
// ═══════════════════════════════════════════════════════════════════

function FlightDisplay({lines, activeClass, setActiveClass, prices}) {
  // Parse leg sections (### headers or bold headers)
  const legs = [];
  let cur = null;
  for(const l of lines) {
    const h3 = l.match(/^### (.+)/);
    const bold = l.match(/^\*\*(Vol \d+[^*]*)\*\*/);
    if(h3||bold) { if(cur) legs.push(cur); cur={title:(h3?h3[1]:bold[1]).trim(), lines:[]}; }
    else if(cur) cur.lines.push(l);
    else if(!cur && l.trim()) { cur={title:"Vols",lines:[l]}; }
  }
  if(cur) legs.push(cur);

  return (
    <div>
      {/* Class tabs */}
      <div style={{display:"flex",borderRadius:"10px",overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:"20px"}}>
        {[
          {id:"business",emoji:"💺",label:"Full Business",price:prices.business},
          {id:"mixte",emoji:"🔀",label:"Mixte",price:prices.mixte},
          {id:"eco",emoji:"🪑",label:"Économie",price:prices.eco},
        ].map((c,i)=>(
          <button key={c.id} onClick={()=>setActiveClass(c.id)} style={{flex:1,padding:"13px 8px",textAlign:"center",background:activeClass===c.id?C.gold:C.card2,color:activeClass===c.id?"#0a0a0a":C.muted,border:"none",borderLeft:i>0?`1px solid ${C.border}`:"none",cursor:"pointer",transition:"all 0.2s"}}>
            <div style={{fontSize:"12px",fontWeight:"700"}}>{c.emoji} {c.label}</div>
            {c.price&&<div style={{fontSize:"16px",fontWeight:"900",marginTop:"3px",letterSpacing:"-0.02em"}}>{parseInt(c.price.replace(/\s/g,"")).toLocaleString("fr-CH")} CHF</div>}
          </button>
        ))}
      </div>

      {/* Flight legs or raw content */}
      {legs.length>0 ? legs.map((leg,i)=>(
        <FlightLegCard key={i} title={leg.title} lines={leg.lines} activeClass={activeClass}/>
      )) : <MDInline text={lines.join("\n")} activeClass={activeClass}/>}
    </div>
  );
}

function FlightLegCard({title, lines, activeClass}) {
  const text = lines.join(" ");
  // Parse times
  const timeMatch = text.match(/(\d{2}:\d{2})/g)||[];
  const dep = timeMatch[0]||null;
  const arr = timeMatch[1]||null;
  // Parse company
  const compMatch = text.match(/(?:Compagnie|avec|sur)\s*[:·]?\s*([A-Za-z\s&]+?)(?:\s*\(|\s*\||\s*[-,]|\s*\d)/i);
  const company = compMatch ? compMatch[1].trim() : null;
  // Parse duration
  const durMatch = text.match(/(\d+h\d*(?:\s*min)?)/i);
  const duration = durMatch ? durMatch[1] : null;
  // Parse stops
  const stopsMatch = text.match(/(\d+)\s*escale/i);
  const stops = stopsMatch ? stopsMatch[1] : text.toLowerCase().includes("direct")?"0":null;
  // Parse price for active class
  const priceRe = activeClass==="business"?/business[^0-9]*(\d[\d\s]+)\s*CHF/i:activeClass==="eco"?/éco[^0-9]*(\d[\d\s]+)\s*CHF/i:/mix[^0-9]*(\d[\d\s]+)\s*CHF/i;
  const priceMatch = text.match(priceRe);
  const price = priceMatch ? priceMatch[1].trim() : null;
  // Parse link
  const linkMatch = text.match(/\[(?:Kayak|Réserver)[^\]]*\]\(([^)]+)\)/i);
  const link = linkMatch ? linkMatch[1] : null;
  // Parse baggage
  const bagMatch = text.match(/bagage[s]?\s*[:·]\s*([^,\n|]+)/i);
  const baggage = bagMatch ? bagMatch[1].trim() : null;

  return (
    <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"12px",marginBottom:"10px",overflow:"hidden"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,fontSize:"10px",fontWeight:"700",letterSpacing:"0.1em",color:C.muted}}>{title}</div>
      {(dep||arr||company) ? (
        <div style={{padding:"16px"}}>
          {/* Main flight info row */}
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
            {company && <div style={{fontSize:"13px",fontWeight:"700",color:C.text,minWidth:"100px"}}>{company}</div>}
            <div style={{display:"flex",alignItems:"center",gap:"8px",flex:1}}>
              {dep && <div style={{fontSize:"22px",fontWeight:"900",color:C.text}}>{dep}</div>}
              <div style={{flex:1,textAlign:"center"}}>
                {duration && <div style={{fontSize:"11px",color:C.muted,marginBottom:"2px"}}>{duration}</div>}
                <div style={{height:"1px",background:C.border,position:"relative"}}>
                  <div style={{position:"absolute",left:"50%",top:"-5px",transform:"translateX(-50%)",color:C.gold,fontSize:"12px"}}>→</div>
                </div>
                {stops!==null && <div style={{fontSize:"10px",color:stops==="0"?C.green:C.muted,marginTop:"2px",fontWeight:"600"}}>{stops==="0"?"Direct":`${stops} escale${stops!=="1"?"s":""}`}</div>}
              </div>
              {arr && <div style={{fontSize:"22px",fontWeight:"900",color:C.text}}>{arr}</div>}
            </div>
          </div>
          {/* Details row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:"12px"}}>
              {baggage && <span style={{fontSize:"11px",color:C.muted}}>🧳 {baggage}</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              {price && <div style={{fontSize:"18px",fontWeight:"900",color:C.gold}}>{price} CHF</div>}
              {link && <a href={link} target="_blank" rel="noopener" style={{fontSize:"11px",padding:"6px 12px",background:C.gold,color:"#0a0a0a",borderRadius:"6px",textDecoration:"none",fontWeight:"700",whiteSpace:"nowrap"}}>Réserver ↗</a>}
            </div>
          </div>
          {/* Full details */}
          <details style={{marginTop:"10px"}}>
            <summary style={{fontSize:"11px",color:C.muted,cursor:"pointer",listStyle:"none"}}>Voir les détails du vol ▾</summary>
            <div style={{marginTop:"10px"}}><MDInline text={lines.join("\n")} activeClass={activeClass}/></div>
          </details>
        </div>
      ) : (
        <div style={{padding:"16px"}}><MDInline text={lines.join("\n")} activeClass={activeClass}/></div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOTEL CARD — Booking/Hyatt inspired
// ═══════════════════════════════════════════════════════════════════

function HotelCard({name, lines}) {
  const [open, setOpen] = useState(true);
  const images = extractImages(lines);
  const content = lines.filter(l=>!/^IMAGES:/i.test(l)&&!/^### /.test(l));
  const text = content.join(" ");

  // Extract structured info
  const ratingMatch = text.match(/(?:Note|Avis)[^0-9]*(\d+\.?\d*)\s*\/\s*10/i)||text.match(/(\d+\.?\d*)\s*\/\s*10/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
  const starsMatch = text.match(/(★{3,5})/);
  const stars = starsMatch ? starsMatch[1].length : null;
  const priceNightMatch = text.match(/(\d[\d\s]+)\s*CHF\s*\/\s*nuit/i);
  const priceNight = priceNightMatch ? priceNightMatch[1].replace(/\s/g,"") : null;
  const priceTotalMatch = text.match(/(\d[\d\s]+)\s*CHF\s*(?:total|pour\s*\d)/i);
  const priceTotal = priceTotalMatch ? priceTotalMatch[1].replace(/\s/g,"") : null;
  const zoneMatch = text.match(/(?:Zone|Emplacement|Quartier)[^:]*:\s*([^,\n|]+)/i);
  const zone = zoneMatch ? zoneMatch[1].trim() : null;
  const bookingMatch = text.match(/\[(?:Booking|Réserver|Voir)[^\]]*\]\(([^)]+)\)/i);
  const bookingLink = bookingMatch ? bookingMatch[1] : null;
  // Extract amenities from bullet points
  const amenities = [];
  for(const l of content) {
    if(/^[-•✅✓]\s/.test(l)) amenities.push(l.replace(/^[-•✅✓]\s*/,"").trim().split(":")[0].trim());
    else if(l.includes("✅")||l.includes("✓")) {
      const items = l.split(/[✅✓]/).slice(1).map(s=>s.trim().split(/[:·]/)[0].trim()).filter(s=>s);
      amenities.push(...items);
    }
  }

  const ratingColor = rating>=9?"#16a34a":rating>=8?"#15803d":"#166534";
  const ratingLabel = rating>=9?"Excellent":rating>=8?"Très bien":rating>=7?"Bien":"";

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",marginBottom:"14px",overflow:"hidden"}}>
      {/* Header toggle */}
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"none",border:"none",cursor:"pointer",borderBottom:open?`1px solid ${C.border}`:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          {stars && <span style={{color:C.gold,fontSize:"12px"}}>{"★".repeat(stars)}</span>}
          <span style={{fontSize:"15px",fontWeight:"700",color:C.text}}>{name}</span>
        </div>
        <span style={{color:C.muted,fontSize:"16px"}}>{open?"−":"+"}</span>
      </button>

      {open && (
        <>
          {/* Photo grid */}
          <PhotoGrid urls={images} name={name}/>

          <div style={{padding:"18px"}}>
            {/* Rating + price header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
              <div>
                {zone && <div style={{fontSize:"12px",color:C.muted,marginBottom:"4px"}}>📍 {zone}</div>}
                {priceNight && (
                  <div style={{display:"flex",alignItems:"baseline",gap:"8px"}}>
                    <span style={{fontSize:"26px",fontWeight:"900",color:C.gold}}>{parseInt(priceNight).toLocaleString("fr-CH")} CHF</span>
                    <span style={{fontSize:"12px",color:C.muted}}>/ nuit</span>
                    {priceTotal && <span style={{fontSize:"13px",color:C.muted}}>· {parseInt(priceTotal).toLocaleString("fr-CH")} CHF total</span>}
                  </div>
                )}
              </div>
              {rating && (
                <div style={{background:ratingColor,borderRadius:"8px 8px 8px 0",padding:"10px 14px",textAlign:"center",minWidth:"54px"}}>
                  <div style={{fontSize:"20px",fontWeight:"900",color:"#fff"}}>{rating}</div>
                  <div style={{fontSize:"9px",color:"rgba(255,255,255,0.8)",marginTop:"1px"}}>{ratingLabel}</div>
                </div>
              )}
            </div>

            {/* Amenities chips */}
            {amenities.length>0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"14px"}}>
                {[...new Set(amenities)].slice(0,10).map((a,i)=>(
                  <span key={i} style={{fontSize:"11px",color:C.muted,background:C.card2,padding:"4px 10px",borderRadius:"12px",border:`1px solid ${C.border}`}}>✓ {a}</span>
                ))}
              </div>
            )}

            {/* Full content */}
            <MDInline text={content.join("\n")}/>

            {/* Book button */}
            {bookingLink && (
              <a href={bookingLink} target="_blank" rel="noopener" style={{display:"inline-block",marginTop:"14px",padding:"11px 20px",background:C.gold,color:"#0a0a0a",borderRadius:"8px",fontSize:"12px",fontWeight:"700",textDecoration:"none",letterSpacing:"0.05em"}}>
                Réserver ↗
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TOTAUX DISPLAY — clean 3-column
// ═══════════════════════════════════════════════════════════════════

function TotauxDisplay({lines, activeClass}) {
  const text = lines.join("\n");
  // Try to extract structured totals
  const extractNum = (pattern) => {
    const m = text.match(pattern);
    return m ? parseInt(m[1].replace(/\s/g,"")).toLocaleString("fr-CH") : "-";
  };
  const volsBiz = extractNum(/(?:vols?|flights?)[^|\n]*\|[^|]*\|[^|]*(\d[\d\s]+)[^|]*\|[^|]*(\d[\d\s]+)[^|]*\|[^|]*(\d[\d\s]+)/i);
  const totalBiz = extractNum(/business[^0-9]*(\d[\d\s]+)\s*CHF/i);
  const totalMix = extractNum(/mix[^0-9]*(\d[\d\s]+)\s*CHF/i);
  const totalEco = extractNum(/éco[^0-9]*(\d[\d\s]+)\s*CHF/i);

  const hasExtracted = totalBiz!=="-"||totalMix!=="-"||totalEco!=="-";

  if(hasExtracted) {
    return (
      <div>
        {/* Visual comparison */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"16px"}}>
          {[
            {id:"business",emoji:"💺",label:"Full Business",total:totalBiz},
            {id:"mixte",emoji:"🔀",label:"Mixte",total:totalMix},
            {id:"eco",emoji:"🪑",label:"Économie",total:totalEco},
          ].map(c=>(
            <div key={c.id} style={{background:activeClass===c.id?"rgba(201,169,110,0.12)":C.card2,border:`1px solid ${activeClass===c.id?C.gold:C.border}`,borderRadius:"10px",padding:"14px 12px",textAlign:"center"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:activeClass===c.id?C.gold:C.muted,marginBottom:"8px"}}>{c.emoji} {c.label}</div>
              <div style={{fontSize:"22px",fontWeight:"900",color:activeClass===c.id?C.gold:C.text,letterSpacing:"-0.02em"}}>{c.total}</div>
              <div style={{fontSize:"10px",color:C.muted,marginTop:"3px"}}>CHF total</div>
            </div>
          ))}
        </div>
        <MDInline text={lines.join("\n")} activeClass={activeClass}/>
      </div>
    );
  }
  return <MDInline text={lines.join("\n")} activeClass={activeClass}/>;
}

// ═══════════════════════════════════════════════════════════════════
// METEO DISPLAY — icons + slider
// ═══════════════════════════════════════════════════════════════════

function MeteoDisplay({lines}) {
  const text = lines.join("\n");
  const src = clean(text);
  const emoji = wxEmoji(src);
  const temps = (src.match(/(\d{1,2})°/g)||[]).map(t=>parseInt(t));
  const maxT = temps.length?Math.max(...temps):null;
  const minT = temps.length>1?Math.min(...temps):null;
  const seaM = src.match(/mer[^.]*?(\d{1,2})°/i);
  const seaT = seaM?seaM[1]:null;
  // Parse weekly periods for slider
  const periods = [];
  const weekMatches = [...src.matchAll(/(?:semaine|période|week)\s*(\d)?[^:\n]*[:\n]([^\n]+)/gi)];
  weekMatches.forEach((m,i)=>periods.push({label:`Sem. ${i+1}`,desc:m[2].trim()}));
  const [periodIdx, setPeriodIdx] = useState(0);

  // Clean the text lines (remove bullet points between text)
  const cleanLines = src.split("\n").map(l=>l.replace(/^[-•]\s*/,"").trim()).filter(l=>l);

  return (
    <div>
      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:"8px",marginBottom:"16px"}}>
        {maxT&&<div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 10px",textAlign:"center"}}>
          <div style={{fontSize:"28px",marginBottom:"4px"}}>{emoji}</div>
          <div style={{fontSize:"22px",fontWeight:"900",color:C.gold}}>{maxT}°</div>
          {minT&&<div style={{fontSize:"11px",color:C.muted}}>min {minT}°</div>}
          <div style={{fontSize:"10px",color:C.muted,marginTop:"2px"}}>Température</div>
        </div>}
        {seaT&&<div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 10px",textAlign:"center"}}>
          <div style={{fontSize:"28px",marginBottom:"4px"}}>🌊</div>
          <div style={{fontSize:"22px",fontWeight:"900",color:C.text}}>{seaT}°</div>
          <div style={{fontSize:"10px",color:C.muted,marginTop:"2px"}}>Mer</div>
        </div>}
        <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 10px",textAlign:"center"}}>
          <div style={{fontSize:"28px",marginBottom:"4px"}}>{src.toLowerCase().includes("rare")||src.toLowerCase().includes("sec")?"☀️":"💧"}</div>
          <div style={{fontSize:"13px",fontWeight:"700",color:C.text}}>{src.toLowerCase().includes("rare")||src.toLowerCase().includes("sec")?"Rares":"Modérées"}</div>
          <div style={{fontSize:"10px",color:C.muted,marginTop:"2px"}}>Précipitations</div>
        </div>
        <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 10px",textAlign:"center"}}>
          <div style={{fontSize:"28px",marginBottom:"4px"}}>🕶</div>
          <div style={{fontSize:"13px",fontWeight:"700",color:C.text}}>{src.toLowerCase().includes("élevé")||src.toLowerCase().includes("fort")?"Élevé":"Modéré"}</div>
          <div style={{fontSize:"10px",color:C.muted,marginTop:"2px"}}>UV</div>
        </div>
      </div>

      {/* Period slider */}
      {periods.length>1 && (
        <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px 16px",marginBottom:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <span style={{fontSize:"10px",color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Période sélectionnée</span>
            <span style={{fontSize:"12px",fontWeight:"700",color:C.text}}>{periods[periodIdx].label}</span>
          </div>
          <input type="range" min="0" max={periods.length-1} value={periodIdx} onChange={e=>setPeriodIdx(+e.target.value)} style={{width:"100%",accentColor:C.gold,cursor:"pointer",marginBottom:"8px"}}/>
          <p style={{fontSize:"13px",color:C.muted,lineHeight:"1.6",margin:0}}>{periods[periodIdx].desc}</p>
        </div>
      )}

      {/* Clean text content */}
      <div style={{lineHeight:"1.8"}}>
        {cleanLines.map((l,i)=>(
          l.trim() && <p key={i} style={{margin:"0 0 6px",fontSize:"13px",color:C.text}}>{l}</p>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CALENDRIER — timeline
// ═══════════════════════════════════════════════════════════════════

function CalendrierDisplay({lines}) {
  const text = lines.join("\n");
  // Parse day entries: "30/06 | Lieu | Activité" or "Jour 1 : ..."
  const entries = [];
  for(const l of lines) {
    const clean_l = clean(l);
    // Table row: | date | lieu | activité |
    if(l.startsWith("|") && !l.match(/^[|\s:-]+$/)) {
      const cells = l.split("|").slice(1,-1).map(c=>c.trim()).filter(c=>c);
      if(cells.length>=2 && !cells[0].toLowerCase().includes("date") && !cells[0].toLowerCase().includes("jour")) {
        entries.push({date:cells[0], lieu:cells[1], activite:cells[2]||""});
      }
    }
    // Bullet/text: "30 juin - Marbella - ..."
    else if(/^\d{1,2}\s*(?:juin|juil|août|sept|oct|nov|déc|jan|fév|mar|avr|mai)/i.test(clean_l.trim())) {
      const parts = clean_l.split(/\s*-\s*/);
      entries.push({date:parts[0]?.trim(), lieu:parts[1]?.trim()||"", activite:parts.slice(2).join(" - ").trim()});
    }
    // "Jour N : ..."
    else if(/^(?:Jour|Day)\s*\d+/i.test(clean_l.trim())) {
      const m = clean_l.match(/^((?:Jour|Day)\s*\d+)[:\s]+(.+)/i);
      if(m) entries.push({date:m[1].trim(), lieu:"", activite:m[2].trim()});
    }
  }

  if(entries.length>0) {
    return (
      <div style={{position:"relative"}}>
        {/* Timeline line */}
        <div style={{position:"absolute",left:"18px",top:"24px",bottom:"24px",width:"2px",background:C.border}}/>
        {entries.map((e,i)=>(
          <div key={i} style={{display:"flex",gap:"16px",marginBottom:"16px",position:"relative"}}>
            {/* Dot */}
            <div style={{width:"36px",height:"36px",borderRadius:"50%",background:i===0||i===entries.length-1?C.gold:C.card2,border:`2px solid ${i===0||i===entries.length-1?C.gold:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1}}>
              <span style={{fontSize:"12px"}}>{i===0?"🛫":i===entries.length-1?"🛬":"📍"}</span>
            </div>
            {/* Content */}
            <div style={{flex:1,background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"12px 14px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:C.gold,marginBottom:"2px",letterSpacing:"0.06em"}}>{e.date.toUpperCase()}</div>
              {e.lieu && <div style={{fontSize:"14px",fontWeight:"600",color:C.text,marginBottom:"2px"}}>{e.lieu}</div>}
              {e.activite && <div style={{fontSize:"12px",color:C.muted,lineHeight:"1.5"}}>{e.activite}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }
  // Fallback to cleaned text
  return (
    <div>
      {lines.map((l,i)=>{
        const cl = clean(l.replace(/^[-•]\s*/,"").trim());
        if(!cl||/^\|[\s:-]+\|/.test(cl)) return null;
        return <p key={i} style={{margin:"0 0 8px",fontSize:"13px",color:l.startsWith("|")||l.match(/^\d/)? C.text:C.muted,lineHeight:"1.6"}}>{cl}</p>;
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REVOLUT / FIDELITE DISPLAY
// ═══════════════════════════════════════════════════════════════════

function FideliteDisplay({lines}) {
  const src = clean(lines.join("\n"));
  const items = [];
  for(const l of lines) {
    const cl = clean(l.replace(/^[-•✅]\s*/,"").trim());
    if(cl && !cl.startsWith("|") && cl.length>5) items.push(cl);
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      {items.map((item,i)=>(
        <div key={i} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"12px 16px",fontSize:"13px",color:C.text,lineHeight:"1.6"}}>
          {item.includes("Lounge")?<span style={{color:C.gold}}>✈ Lounge - </span>:
           item.includes("miles")||item.includes("Miles")?<span style={{color:C.gold}}>⭐ Miles - </span>:
           item.includes("upgrade")||item.includes("Upgrade")?<span style={{color:C.gold}}>💺 Upgrade - </span>:
           <span style={{color:C.gold}}>💳 </span>}
          <span dangerouslySetInnerHTML={{__html:item.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")}}/>
        </div>
      ))}
      {items.length===0 && <MDInline text={lines.join("\n")}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS VIEW
// ═══════════════════════════════════════════════════════════════════

function ResultsView({text}) {
  const [activeClass, setActiveClass] = useState("mixte");
  const sections = parseSections(text);
  if(!sections.length) return <MDInline text={text}/>;

  // Extract prices for class tabs
  const totauxSec = sections.find(s=>/total|coût/i.test(s.title));
  const tt = totauxSec ? totauxSec.lines.join(" ") : "";
  const prices = {
    business: tt.match(/business[^0-9]*(\d[\d\s]+)/i)?.[1]?.trim() || null,
    mixte: tt.match(/mix[^0-9]*(\d[\d\s]+)/i)?.[1]?.trim() || null,
    eco: tt.match(/éco[^0-9]*(\d[\d\s]+)/i)?.[1]?.trim() || null,
  };

  return (
    <div>
      {sections.map((sec,i)=>{
        const isRecap = /récap/i.test(sec.title);
        const isVol = /^✈|^vols?/i.test(sec.title.split(" ").slice(-1)[0]) && !/revolut|astuce/i.test(sec.title);
        const isHotel = /héberg/i.test(sec.title);
        const isTotal = /total|coût/i.test(sec.title);
        const isMeteo = /météo|meteo/i.test(sec.title);
        const isCalendrier = /calendrier|planning/i.test(sec.title);
        const isRevolut = /revolut|astuce|fidél/i.test(sec.title);
        const isReco = /recommand/i.test(sec.title);

        // ALL closed except recap
        const defOpen = isRecap;

        const hotelBlocks = isHotel ? parseHotelBlocks(sec.lines) : [];

        return (
          <AccCard key={i} title={sec.title} defaultOpen={defOpen} accent={isTotal}>
            {isRecap ? (
              <RecapDisplay lines={sec.lines} activeClass={activeClass} prices={prices}/>
            ) : isVol ? (
              <FlightDisplay lines={sec.lines} activeClass={activeClass} setActiveClass={setActiveClass} prices={prices}/>
            ) : isHotel && hotelBlocks.length>0 ? (
              <div>
                {(()=>{const pre=[];for(const l of sec.lines){if(/^### /.test(l)) break;pre.push(l);}return pre.length?<MDInline text={pre.join("\n")} activeClass={activeClass}/>:null;})()}
                {hotelBlocks.map((b,j)=><HotelCard key={j} name={b.name} lines={b.lines}/>)}
              </div>
            ) : isTotal ? (
              <TotauxDisplay lines={sec.lines} activeClass={activeClass}/>
            ) : isMeteo ? (
              <MeteoDisplay lines={sec.lines}/>
            ) : isCalendrier ? (
              <CalendrierDisplay lines={sec.lines}/>
            ) : isRevolut ? (
              <FideliteDisplay lines={sec.lines}/>
            ) : (
              <MDInline text={sec.lines.join("\n")} activeClass={activeClass}/>
            )}
          </AccCard>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  // Body background fix
  useEffect(()=>{
    document.body.style.background="#0a0a0a";
    document.body.style.margin="0";
    document.documentElement.style.background="#0a0a0a";
  },[]);

  const [activeTab, setActiveTab] = useState("trips");
  const [loyaltyCards, setLoyaltyCards] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [from, setFrom] = useState("GVA");
  const [fromCustom, setFromCustom] = useState("");
  const [legs, setLegs] = useState([{to:"",depDate:"",retDate:""}]);
  const [travelers, setTravelers] = useState("1");
  const [baggage, setBaggage] = useState("no_pref");
  const [vibes, setVibes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [tipIdx, setTipIdx] = useState(0);
  const timer = useRef(null);

  useEffect(()=>{
    if(phase==="loading") timer.current=setInterval(()=>setTipIdx(i=>(i+1)%TIPS.length),2800);
    else{clearInterval(timer.current);setTipIdx(0);}
    return()=>clearInterval(timer.current);
  },[phase]);

  const addLeg=()=>{if(legs.length<5)setLegs(l=>[...l,{to:"",depDate:l[l.length-1].retDate||"",retDate:""}]);};
  const removeLeg=idx=>setLegs(l=>l.filter((_,i)=>i!==idx));
  const updateLeg=(idx,field,val)=>{
    setLegs(l=>{
      const n=l.map((leg,i)=>i===idx?{...leg,[field]:val}:leg);
      if(field==="retDate"&&idx+1<n.length) n[idx+1]={...n[idx+1],depDate:val};
      return n;
    });
  };
  const toggleVibe=id=>setVibes(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  const toggleAct=id=>setActivities(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);

  const buildPrompt=()=>{
    const airport=from==="OTHER"?fromCustom.toUpperCase():from;
    const vibeLabels=VIBES.filter(v=>vibes.includes(v.id)).map(v=>v.label).join(", ");
    const actLabels=ACTIVITIES.filter(a=>activities.includes(a.id)).map(a=>a.label).join(", ");
    const legLines=legs.filter(l=>l.to).map((l,i)=>{
      const fp=i===0?airport:(legs[i-1].to||airport);
      const parts=[`Vol ${i+1} : ${fp} -> ${l.to}`];
      if(l.depDate) parts.push(`départ ${l.depDate}`);
      if(l.retDate) parts.push(i===legs.length-1?`retour ${l.retDate}`:`arrivée ${l.retDate}`);
      return "✈️ "+parts.join(" - ");
    });
    const bagLabel=BAGGAGE_OPTIONS.find(b=>b.id===baggage)?.label||"";
    const loyaltyInfo=loyaltyCards.length>0
      ?`🎫 Programmes actifs : ${loyaltyCards.map(id=>LOYALTY.find(p=>p.id===id)?.short).join(", ")} - Points disponibles : ${loyaltyPoints>=100000?">100 000":loyaltyPoints.toLocaleString("fr-CH")} pts`:"";
    return [
      "Planifie ce voyage, recherche tous les prix en temps réel. Utiliser uniquement le tiret simple ( - ) jamais de tirets em ou en :",
      `Aéroport de base : ${airport}`,
      ...legLines,
      `Voyageurs : ${travelers}`,
      baggage!=="no_pref"?`Bagages : ${bagLabel}`:"",
      loyaltyInfo,
      vibeLabels?`Ambiance : ${vibeLabels}`:"",
      actLabels?`Activités : ${actLabels}`:"",
      notes?`Notes : ${notes}`:"",
      "",
      "Pour chaque hôtel : effectuer une recherche web pour trouver les URLs directes des photos (.jpg/.webp) depuis le CDN Booking.com (cf.bstatic.com), TripAdvisor CDN (dynamic-media-cdn.tripadvisor.com) ou site officiel. Inclure sur la ligne exacte : IMAGES: url1.jpg | url2.jpg | url3.jpg (uniquement des URLs finissant en .jpg/.webp/.png, pas des pages HTML). Tableau complet, 3 scénarios de classe, totaux CHF, liens Booking/Kayak.",
    ].filter(Boolean).join("\n");
  };

  const go=async()=>{
    if(!legs[0].to||!legs[0].depDate){setErr("Au minimum : une destination et une date de départ.");return;}
    if(from==="OTHER"&&!fromCustom.trim()){setErr("Merci d'entrer le code IATA de ton aéroport.");return;}
    setPhase("loading");setErr("");setResult("");
    try{
      const res=await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:buildPrompt()}]})});
      const data=await res.json();
      if(!res.ok||data.error) throw new Error(data.error||`Erreur ${res.status}`);
      setResult(data.text||"Aucun résultat.");setPhase("done");
    }catch(e){setErr(e.message);setPhase("error");}
  };

  const reset=()=>{setPhase("idle");setResult("");setErr("");};

  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"2rem 1.5rem",background:C.bg,minHeight:"100vh",fontFamily:C.sans}}>

      {/* HEADER — WDC logo */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px"}}>
        <div>
          <div style={{fontSize:"36px",fontWeight:"900",letterSpacing:"-0.04em",color:C.text,lineHeight:"1"}}>WDC</div>
          <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"0.18em",color:C.gold,marginTop:"1px"}}>AI TRAVEL</div>
        </div>
        <div style={{fontSize:"10px",color:C.muted,textAlign:"right",lineHeight:"1.9",marginTop:"4px"}}>
          <div>GVA - ZRH - MXP</div>
          <div>CHF - 4★ - 8+/10</div>
        </div>
      </div>

      {/* NAV TABS */}
      <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
        {[{id:"trips",label:"🗺 Trips"},{id:"vols",label:"✈️ Vols"},{id:"hotels",label:"🏨 Hébergements"}].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:"9px 18px",borderRadius:"20px",border:`1px solid ${activeTab===tab.id?C.gold:C.border}`,background:activeTab===tab.id?C.gold:"transparent",color:activeTab===tab.id?"#0a0a0a":C.muted,fontSize:"12px",fontWeight:activeTab===tab.id?"700":"500",cursor:"pointer",letterSpacing:"0.05em"}}>{tab.label}</button>
        ))}
      </div>

      {/* LOYALTY */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"18px 22px",marginBottom:"10px"}}>
        <Lbl>Programmes de fidélité</Lbl>
        <LoyaltySelector selected={loyaltyCards} onChange={setLoyaltyCards} points={loyaltyPoints} onPoints={setLoyaltyPoints}/>
      </div>

      {/* SEARCH FORM */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",overflow:"hidden",marginBottom:"10px"}}>
        {/* Voyageurs + bagages */}
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:"16px"}}>
          <div><Lbl>Voyageurs</Lbl>
            <select value={travelers} onChange={e=>setTravelers(e.target.value)} style={INP}>
              {[1,2,3,4,5,6,8,10].map(n=><option key={n} value={n}>{String(n).padStart(2,"0")} - {n===1?"personne":"personnes"}</option>)}
            </select>
          </div>
          <div><Lbl>Bagages</Lbl>
            <select value={baggage} onChange={e=>setBaggage(e.target.value)} style={INP}>
              {BAGGAGE_OPTIONS.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
        </div>

        {from==="OTHER"&&<div style={{padding:"14px 24px 0"}}><input value={fromCustom} onChange={e=>setFromCustom(e.target.value.toUpperCase())} placeholder="Code IATA - ex: LYS, NTE, ORY..." maxLength={4} style={{...INP,width:"200px",fontFamily:"monospace",letterSpacing:"0.12em"}}/></div>}

        <div style={{padding:"20px 24px 8px"}}>
          <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.2fr) 20px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) 36px",gap:"8px",marginBottom:"8px"}}>
            <Lbl s={{marginBottom:0}}>Depuis</Lbl><div/><Lbl s={{marginBottom:0}}>Vers</Lbl><Lbl s={{marginBottom:0}}>Date aller</Lbl><Lbl s={{marginBottom:0}}>Date retour</Lbl><div/>
          </div>
          {legs.map((leg,idx)=>(
            <div key={idx} style={{display:"grid",gridTemplateColumns:"minmax(0,1.2fr) 20px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) 36px",gap:"8px",alignItems:"center",marginBottom:"8px"}}>
              {idx===0
                ?<select value={from} onChange={e=>setFrom(e.target.value)} style={INP}>{AIRPORTS.map(a=><option key={a.code} value={a.code}>{a.code==="OTHER"?"✏ Autre":`${a.code} - ${a.name}`}</option>)}</select>
                :<div style={{...INP_RO,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{legs[idx-1].to||"-"}</div>
              }
              <div style={{textAlign:"center",color:C.gold,fontWeight:"900",fontSize:"16px"}}>→</div>
              <input value={leg.to} onChange={e=>updateLeg(idx,"to",e.target.value)} placeholder={["Marbella, Espagne","Chicago, USA","Costa Rica","Mykonos"][idx]||"Destination"} style={INP}/>
              <input type="date" value={leg.depDate} onChange={e=>updateLeg(idx,"depDate",e.target.value)} style={INP}/>
              <input type="date" value={leg.retDate} onChange={e=>updateLeg(idx,"retDate",e.target.value)} style={INP}/>
              {idx>0?<button onClick={()=>removeLeg(idx)} style={{width:"36px",height:"36px",border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",color:C.muted,fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"8px"}}>×</button>:<div/>}
            </div>
          ))}
          {legs.length<5&&<button onClick={addLeg} style={{fontSize:"11px",padding:"7px 16px",border:`1px dashed ${C.border}`,background:"transparent",cursor:"pointer",color:C.muted,borderRadius:"8px",marginTop:"4px",marginBottom:"8px"}}>+ Ajouter une étape ({legs.length}/5)</button>}
        </div>

        <div style={{borderTop:`1px solid ${C.border}`}}/>

        <div style={{padding:"20px 24px 14px"}}>
          <Lbl>Ambiance</Lbl>
          <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>{VIBES.map(v=><Chip key={v.id} label={v.label} selected={vibes.includes(v.id)} onClick={()=>toggleVibe(v.id)}/>)}</div>
        </div>
        <div style={{padding:"0 24px 14px"}}>
          <Lbl>Activités</Lbl>
          <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>{ACTIVITIES.map(a=><Chip key={a.id} label={a.label} selected={activities.includes(a.id)} onClick={()=>toggleAct(a.id)}/>)}</div>
        </div>
        <div style={{padding:"0 24px 20px"}}>
          <Lbl>Notes spécifiques</Lbl>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Budget max, occasion spéciale, compagnie aérienne préférée..." style={{...INP,minHeight:"52px",resize:"vertical"}}/>
        </div>

        {err&&<div style={{margin:"0 24px 16px",fontSize:"13px",color:"#ff7070",background:"rgba(255,100,100,0.1)",border:"1px solid rgba(255,100,100,0.25)",borderRadius:"8px",padding:"10px 14px"}}>⚠ {err}</div>}

        <div style={{padding:"0 24px 24px"}}>
          <button onClick={go} disabled={phase==="loading"} style={{width:"100%",padding:"16px",background:phase==="loading"?C.faint:C.gold,color:phase==="loading"?C.muted:"#0a0a0a",border:"none",borderRadius:"12px",cursor:phase==="loading"?"not-allowed":"pointer",fontSize:"12px",fontWeight:"800",letterSpacing:"0.18em",opacity:phase==="loading"?0.7:1}}>
            {phase==="loading"?"RECHERCHE EN COURS...":"LANCER LA RECHERCHE"}
          </button>
        </div>
      </div>

      {/* LOADING */}
      {phase==="loading"&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"3rem",textAlign:"center",marginTop:"10px"}}>
          <div style={{fontSize:"44px",marginBottom:"1rem"}}>✈️</div>
          <div style={{fontSize:"11px",fontWeight:"800",letterSpacing:"0.14em",color:C.text,marginBottom:"8px"}}>{TIPS[tipIdx].toUpperCase()}</div>
          <div style={{fontSize:"10px",color:C.muted,fontFamily:"monospace",letterSpacing:"0.08em"}}>KAYAK - BOOKING - AIRBNB - GOOGLE FLIGHTS - SKYSCANNER - MOMONDO</div>
          <div style={{display:"flex",justifyContent:"center",gap:"6px",marginTop:"1.5rem"}}>
            {TIPS.map((_,i)=><div key={i} style={{width:"5px",height:"5px",borderRadius:"50%",background:i===tipIdx?C.gold:C.border}}/>)}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase==="done"&&result&&(
        <div style={{marginTop:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:"12px"}}>
              <span style={{fontSize:"11px",fontWeight:"800",letterSpacing:"0.14em",color:C.text}}>RÉSULTATS</span>
              <span style={{fontSize:"10px",color:C.muted}}>{new Date().toLocaleDateString("fr-CH",{day:"numeric",month:"long",year:"numeric"})}</span>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>navigator.clipboard?.writeText(result)} style={{fontSize:"10px",fontWeight:"700",letterSpacing:"0.08em",padding:"6px 14px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:"6px",cursor:"pointer",color:C.muted}}>COPIER</button>
              <button onClick={reset} style={{fontSize:"10px",fontWeight:"700",letterSpacing:"0.08em",padding:"6px 14px",background:C.gold,border:"none",borderRadius:"6px",cursor:"pointer",color:"#0a0a0a"}}>NOUVELLE RECHERCHE</button>
            </div>
          </div>
          <ResultsView text={result}/>
        </div>
      )}

      <div style={{marginTop:"24px",textAlign:"center",fontSize:"10px",color:C.faint,letterSpacing:"0.1em",fontFamily:"monospace"}}>
        KAYAK - BOOKING - AIRBNB - GOOGLE FLIGHTS - SKYSCANNER - MOMONDO - EXPEDIA - OPODO
      </div>
    </div>
  );
}
