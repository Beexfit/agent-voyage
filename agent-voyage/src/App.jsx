import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// WDC AI TRAVEL v4 — fixed tabs, flight cards, calendar, responsive
// ═══════════════════════════════════════════════════════════════

const AIRPORTS=[{code:"GVA",name:"Genève-Cointrin"},{code:"ZRH",name:"Zurich"},{code:"MXP",name:"Milan Malpensa"},{code:"CDG",name:"Paris CDG"},{code:"LHR",name:"Londres Heathrow"},{code:"BCN",name:"Barcelone"},{code:"FCO",name:"Rome Fiumicino"},{code:"AMS",name:"Amsterdam"},{code:"MAD",name:"Madrid"},{code:"DXB",name:"Dubai"},{code:"JFK",name:"New York JFK"},{code:"LAX",name:"Los Angeles"},{code:"BKK",name:"Bangkok"},{code:"SIN",name:"Singapour"},{code:"OTHER",name:"Autre"}];
const VIBES=[{id:"beach",label:"🏖 Plage & Mer"},{id:"city",label:"🏙 Ville & Culture"},{id:"nature",label:"🌿 Nature & Montagne"},{id:"party",label:"🎉 Fête & Nightlife"},{id:"gastro",label:"🍽 Gastronomie"},{id:"spa",label:"💆 Détente & Spa"},{id:"adventure",label:"🏄 Aventure & Sport"},{id:"romance",label:"💑 Romance"},{id:"luxury",label:"💎 Luxe & VIP"},{id:"family",label:"👨‍👩‍👧 Famille"}];
const ACTIVITIES=[{id:"surf",label:"Surf"},{id:"golf",label:"Golf"},{id:"diving",label:"Plongée"},{id:"hiking",label:"Randonnée"},{id:"restaurants",label:"Restos étoilés"},{id:"shopping",label:"Shopping"},{id:"clubs",label:"Clubs & Bars"},{id:"yoga",label:"Yoga & Wellness"},{id:"museums",label:"Musées"},{id:"sailing",label:"Voile & Bateau"},{id:"skiing",label:"Ski"},{id:"snorkeling",label:"Snorkeling"},{id:"tennis",label:"Tennis"},{id:"safari",label:"Safari"}];
const LOYALTY=[{id:"revolut_ultra",short:"Revolut Ultra"},{id:"amex_ch",short:"Amex"},{id:"ubs_infinite",short:"UBS Visa"},{id:"miles_more",short:"Miles & More"},{id:"marriott_bonvoy",short:"Marriott Bonvoy"},{id:"hilton_honors",short:"Hilton Honors"},{id:"world_of_hyatt",short:"World of Hyatt"},{id:"diners_club",short:"Diners Club"}];
const POINTS_MARKS=[0,5000,10000,15000,20000,25000,30000,40000,50000,75000,100000];
const BAGGAGE_OPTIONS=[{id:"no_pref",label:"Pas de préférence"},{id:"cabin_only",label:"Cabine seulement"},{id:"1_checked_23",label:"1 bagage 23 kg"},{id:"2_checked_23",label:"2 bagages 23 kg"},{id:"sport",label:"Bagage sport / golf"}];
const TIPS=["Recherche des vols sur Kayak...","Consultation de Skyscanner...","Vérification des hôtels...","Comparaison sur Airbnb...","Calcul des scénarios...","Conversion en CHF...","Analyse météo...","Finalisation..."];

const DARK={bg:"#0a0a0a",card:"#141414",card2:"#1c1c1c",input:"#202020",border:"#2a2218",text:"#f5f0e8",muted:"#999",faint:"#444",gold:"#c9a96e",goldD:"#a07840",goldBg:"rgba(201,169,110,0.06)",goldBg2:"rgba(201,169,110,0.12)",green:"#22c55e",red:"#ef4444",blue:"#5b9bd5"};
const LIGHT={bg:"#f5f3ef",card:"#ffffff",card2:"#f0ede7",input:"#faf9f7",border:"#e0dcd4",text:"#1a1a1a",muted:"#6a6560",faint:"#ccc",gold:"#a6872f",goldD:"#8a7535",goldBg:"rgba(166,135,47,0.06)",goldBg2:"rgba(166,135,47,0.12)",green:"#3a8f4a",red:"#c94444",blue:"#3a7abf"};
const FN="'DM Sans','Helvetica Neue',system-ui,sans-serif",MN="'JetBrains Mono','SF Mono',monospace";
const fmt=n=>{try{const s=String(n).replace(/['\s]/g,"").replace(/CHF/gi,"").trim();const v=parseInt(s);return isNaN(v)?n:v.toLocaleString("fr-CH")}catch{return n}};

// ── RESPONSIVE HOOK ──
function useW(){const[w,setW]=useState(typeof window!=="undefined"?window.innerWidth:900);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;}

// ── PARSERS ──
function clean(t){if(!t)return"";return t.replace(/[—–]/g," - ");}
function renderInline(s){return(s||"").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">$1 ↗</a>`);}
function parseSections(text){const lines=clean(text).split("\n");const secs=[];let cur=null;for(const l of lines){const h2=l.match(/^## (.+)/);if(h2){if(cur)secs.push(cur);cur={title:h2[1].trim(),lines:[]};}else if(cur)cur.lines.push(l);}if(cur)secs.push(cur);return secs;}
function titleParts(t){const m=t.match(/^([\u{1F300}-\u{1FFFF}][\uFE0F\u200D]*)+\s*/u);return m?{icon:m[0].trim(),label:t.slice(m[0].length).trim()}:{icon:"",label:t};}
// Preprocess lines: join broken table rows (API sometimes puts newlines inside cells)
function fixTableLines(lines){const out=[];for(let i=0;i<lines.length;i++){const l=lines[i];if(l.trim().startsWith("|")){let row=l;while(i+1<lines.length&&!lines[i+1].trim().startsWith("|")&&!lines[i+1].trim().startsWith("#")&&!lines[i+1].trim().startsWith("*")&&lines[i+1].trim()!==""){i++;row=row.trimEnd()+" "+lines[i].trim();}out.push(row);}else out.push(l);}return out;}
function parseTableRows(lines){const fixed=fixTableLines(lines);const rows=[];for(const l of fixed){const s=l.trim();if(s.startsWith("|")&&!s.match(/^[\|\s:\-]+$/)){const cells=s.split("|").slice(1,-1).map(c=>c.trim().replace(/\s+/g," "));if(cells.length>=2)rows.push(cells);}}return rows;}
function parseKV(lines){const fixed=fixTableLines(lines);const d={};for(const l of fixed){const s=l.trim();if(s.startsWith("|")&&!s.match(/^[\|\s:\-]+$/)){const cells=s.split("|").slice(1,-1).map(c=>c.trim().replace(/\s+/g," "));if(cells.length>=2&&cells[0])d[cells[0]]=cells[1];}}return d;}

// ── UI PRIMITIVES ──
function Sec({icon,title,children,t,defaultOpen=false,accent=false,mob}){const[o,setO]=useState(defaultOpen);const{icon:ti,label}=typeof title==="string"?titleParts(title):{icon:"",label:title};return(<div style={{background:t.card,border:`1px solid ${accent?t.gold:t.border}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}><button onClick={()=>setO(x=>!x)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",background:"none",border:"none",cursor:"pointer",borderBottom:o?`1px solid ${t.border}`:"none"}}><div style={{display:"flex",alignItems:"center",gap:10}}>{(icon||ti)&&<span style={{fontSize:16}}>{icon||ti}</span>}<span style={{fontSize:13,fontWeight:700,color:accent?t.gold:t.text,fontFamily:FN}}>{label}</span></div><span style={{color:t.muted,fontSize:18,fontWeight:300}}>{o?"−":"+"}</span></button>{o&&<div style={{padding:"14px 20px"}}>{children}</div>}</div>);}
function Lbl({children,t}){return<div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:t.muted,marginBottom:6,textTransform:"uppercase",fontFamily:FN}}>{children}</div>;}
function ChipBtn({label,selected,onClick,t}){return<button type="button" onClick={onClick} style={{padding:"7px 15px",borderRadius:20,border:`1px solid ${selected?t.gold:t.border}`,background:selected?t.goldBg2:"transparent",color:selected?t.gold:t.muted,fontSize:12,cursor:"pointer",fontFamily:FN,whiteSpace:"nowrap"}}>{label}</button>;}
function DestTab({labels,active,onChange,t}){return<div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{labels.map((l,i)=><button key={i} onClick={()=>onChange(i)} style={{padding:"8px 16px",borderRadius:20,border:`1px solid ${i===active?t.gold:t.border}`,background:i===active?t.goldBg2:"transparent",color:i===active?t.gold:t.muted,fontSize:12,fontWeight:i===active?700:400,cursor:"pointer",fontFamily:FN}}>{l}</button>)}</div>;}

// ═══════════════════════════════════════════════════════════════
// FLIGHT DISPLAY — tabs filter by class, Kayak-style cards
// ═══════════════════════════════════════════════════════════════
function FlightDisplay({lines,t,mob}){
  const[activeClass,setActiveClass]=useState("business");
  // Parse Vol sections
  const vols=[];let cur=null;
  for(const l of lines){const h=l.match(/^###\s+(.+)/);if(h){if(cur)vols.push(cur);cur={title:h[1].trim(),rows:[],lines:[]};}else if(cur){cur.lines.push(l);const s=l.trim();if(s.startsWith("|")&&!s.match(/^[\|\s:\-]+$/)){const cells=s.split("|").slice(1,-1).map(c=>c.trim());if(cells.length>=6&&!/scénario/i.test(cells[0]))cur.rows.push(cells);}}}
  if(cur)vols.push(cur);
  // If no ### found, parse all lines as one section
  if(!vols.length){const rows=[];for(const l of lines){const s=l.trim();if(s.startsWith("|")&&!s.match(/^[\|\s:\-]+$/)){const cells=s.split("|").slice(1,-1).map(c=>c.trim());if(cells.length>=6&&!/scénario/i.test(cells[0]))rows.push(cells);}}if(rows.length)vols.push({title:"",rows,lines});}

  // Filter function
  const classMatch=(scenario,cls)=>{const s=scenario.toLowerCase();if(cls==="business")return/business|💺/i.test(s)&&!/éco|eco|🔀/i.test(s);if(cls==="mixte")return/mixte|🔀|éco.*biz|biz.*retour/i.test(s);return/économie|🪑|full éco/i.test(s);};
  const parseLink=cell=>{const m=(cell||"").match(/\[([^\]]+)\]\(([^)]+)\)/);return m?{label:m[1],url:m[2]}:null;};

  const tabs=[{id:"business",emoji:"💺",label:"Full Business"},{id:"mixte",emoji:"🔀",label:"Mixte"},{id:"eco",emoji:"🪑",label:"Économie"}];

  return(<div>
    {/* Class tabs */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderRadius:12,overflow:"hidden",border:`1px solid ${t.border}`,marginBottom:20}}>{tabs.map((tab,i)=><button key={tab.id} onClick={()=>setActiveClass(tab.id)} style={{padding:"14px 8px",textAlign:"center",background:activeClass===tab.id?t.goldBg2:t.card2,color:activeClass===tab.id?t.gold:t.muted,border:"none",borderBottom:activeClass===tab.id?`2px solid ${t.gold}`:"2px solid transparent",borderLeft:i>0?`1px solid ${t.border}`:"none",cursor:"pointer",fontFamily:FN,fontSize:13,fontWeight:700}}>{tab.emoji} {tab.label}</button>)}</div>

    {/* Per-leg cards */}
    {vols.map((vol,vi)=>{
      const filtered=vol.rows.filter(r=>classMatch(r[0]||"",activeClass));
      if(!filtered.length)return<div key={vi} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:20,marginBottom:12,textAlign:"center"}}>{vol.title&&<div style={{fontSize:12,fontWeight:700,color:t.gold,marginBottom:8,fontFamily:FN}}>{vol.title}</div>}<div style={{color:t.muted,fontSize:13}}>Pas de vol disponible dans cette classe pour ce trajet</div></div>;
      return(<div key={vi} style={{marginBottom:16}}>
        {vol.title&&<div style={{padding:"12px 18px",background:t.goldBg,border:`1px solid ${t.border}`,borderRadius:"12px 12px 0 0",borderBottom:"none"}}><span style={{fontSize:12,fontWeight:800,color:t.gold,letterSpacing:"0.06em",fontFamily:FN}}>{vol.title}</span></div>}
        {filtered.map((row,ri)=>{
          const[scenario,compagnie,routing,duree,escales,prix,...rest]=row;
          const link=parseLink(rest.join("|"));
          const stops=routing||"";const airports=stops.split(/[-→>]/).map(s=>s.trim()).filter(Boolean);
          return(<div key={ri} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:vol.title?ri===filtered.length-1?"0 0 12px 12px":"0":"12px",padding:mob?"16px":"20px 24px",borderTop:vol.title||ri>0?"none":undefined,marginBottom:ri<filtered.length-1?0:0}}>
            {/* Top: Airline + Price */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div><div style={{fontSize:16,fontWeight:800,color:t.text,fontFamily:FN}}>{(compagnie||"").replace(/\n/g," ").trim()}</div><div style={{fontSize:11,color:t.muted,marginTop:2}}>{scenario.replace(/💺|🔀|🪑/g,"").trim()}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:24,fontWeight:900,color:t.gold,fontFamily:MN}}>{fmt(prix)}</div><div style={{fontSize:11,color:t.muted}}>CHF / pers</div></div>
            </div>
            {/* Route visualization */}
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:mob?"14px":"16px 20px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:18,fontWeight:800,color:t.text,fontFamily:MN}}>{airports[0]||""}</div>
                <div style={{flex:1,display:"flex",alignItems:"center",margin:"0 12px"}}><div style={{flex:1,height:1,background:t.border}}/>{parseInt(escales)>0&&<div style={{padding:"2px 10px",borderRadius:20,background:t.goldBg2,border:`1px solid ${t.gold}40`,fontSize:10,fontWeight:600,color:t.gold,margin:"0 8px",whiteSpace:"nowrap"}}>{escales} escale{parseInt(escales)>1?"s":""}</div>}<div style={{flex:1,height:1,background:t.border}}/></div>
                <div style={{fontSize:18,fontWeight:800,color:t.text,fontFamily:MN}}>{airports[airports.length-1]||""}</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:11,color:t.muted}}>{routing}</div><div style={{fontSize:12,fontWeight:600,color:t.text}}>⏱ {duree}</div></div>
            </div>
            {/* Link */}
            {link&&<a href={link.url} target="_blank" rel="noopener" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",background:t.gold,color:"#0a0a0a",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none",fontFamily:FN}}>Voir sur {link.label} ↗</a>}
          </div>);
        })}
      </div>);
    })}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// HOTEL DISPLAY — destination tabs + cards
// ═══════════════════════════════════════════════════════════════
function HebergementDisplay({lines,t,mob}){
  const[destIdx,setDestIdx]=useState(0);
  // Parse: ### = destination, #### = hotel
  const dests=[];let curDest=null;let curHotel=null;
  for(const l of lines){
    const h3=l.match(/^###\s+([^#\n]+)/);const h4=l.match(/^####\s+(.+)/);
    if(h3&&!h4){if(curHotel&&curDest){curDest.hotels.push(curHotel);curHotel=null;}if(curDest)dests.push(curDest);curDest={name:h3[1].trim(),hotels:[]};}
    else if(h4){if(curHotel&&curDest)curDest.hotels.push(curHotel);curHotel={name:h4[1].trim(),lines:[]};}
    else if(curHotel)curHotel.lines.push(l);
    else if(curDest&&!curHotel)curDest.lines=(curDest.lines||[]).concat(l);
  }
  if(curHotel&&curDest)curDest.hotels.push(curHotel);
  if(curDest)dests.push(curDest);

  // Fallback: if no ####, ### are hotels directly (single destination)
  if(!dests.length||dests.every(d=>!d.hotels.length)){
    const hotels=[];let h=null;
    for(const l of lines){const hm=l.match(/^###\s+(.+)/);if(hm){if(h)hotels.push(h);h={name:hm[1].trim(),lines:[]};}else if(h)h.lines.push(l);}
    if(h)hotels.push(h);
    if(hotels.length){dests.length=0;dests.push({name:"",hotels});}
  }

  const hasTabs=dests.length>1;
  const active=dests[destIdx]||dests[0]||{hotels:[]};

  return(<div>
    {hasTabs&&<DestTab labels={dests.map(d=>d.name||"Destination")} active={destIdx} onChange={setDestIdx} t={t}/>}
    {active.hotels.map((h,i)=><HotelCardV2 key={`${destIdx}-${i}`} name={h.name} lines={h.lines} t={t} mob={mob}/>)}
  </div>);
}

function HotelCardV2({name,lines,t,mob}){
  const[open,setOpen]=useState(true);
  const kv=parseKV(lines);
  const get=k=>{for(const[key,val]of Object.entries(kv)){if(key.toLowerCase().includes(k))return val;}return"";};
  const stars=(get("étoile")||get("etoile")||"").replace(/[^★]/g,"").length||0;
  const note=get("note");const noteNum=note.match(/(\d+\.?\d*)/)?.[1]||"";
  const zone=get("zone")||get("emplacement");const chambre=get("chambre");
  const equipements=get("équipement")||get("equipement");
  const prixNuit=get("prix/nuit")||get("prix_nuit");const prixTotal=get("prix total")||get("prix_total");
  const pN=prixNuit.match(/(\d[\d'\s]*)/)?.[1]?.replace(/['\s]/g,"")||"";
  const pT=prixTotal.match(/(\d[\d'\s]*)/)?.[1]?.replace(/['\s]/g,"")||"";
  const petitDej=get("petit");const piscine=get("piscine");const spa=get("spa");const vue=get("vue");
  const lien=get("lien")||"";const linkM=lien.match(/\[([^\]]+)\]\(([^)]+)\)/);
  // Prose
  const prose=lines.filter(l=>{const s=l.trim();return s&&!/^\|/.test(s)&&!/^#{1,4}/.test(s);}).slice(0,3);
  // Chips - no emojis
  const chips=[];
  if(equipements)equipements.split(",").forEach(s=>{const v=s.trim();if(v.length>1)chips.push(v);});
  if(piscine&&!/non/i.test(piscine))chips.push("Piscine");
  if(spa&&!/non/i.test(spa))chips.push("Spa");
  if(petitDej&&/gratuit|inclus|oui/i.test(petitDej))chips.push("Petit-déj inclus");
  if(vue)chips.push(vue.split(",")[0].trim().substring(0,30));
  const rN=parseFloat(noteNum||"0");const rC=rN>=9?"#16a34a":rN>=8?"#1d8348":"#2e7d32";
  // Image: Unsplash fallback based on hotel name
  const imgQuery=encodeURIComponent(name.replace(/[^\w\s]/g,"").trim());
  const imgUrl=`https://source.unsplash.com/800x400/?hotel,${imgQuery}`;
  const[imgErr,setImgErr]=useState(false);

  return(<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"none",border:"none",cursor:"pointer",borderBottom:open?`1px solid ${t.border}`:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>{stars>0&&<span style={{color:t.gold,fontSize:12}}>{"★".repeat(stars)}</span>}<span style={{fontSize:15,fontWeight:700,color:t.text,fontFamily:FN}}>{name}</span></div>
      <span style={{color:t.muted,fontSize:16}}>{open?"−":"+"}</span>
    </button>
    {open&&<>
      {/* Hotel image */}
      <div style={{height:180,overflow:"hidden"}}>
        {!imgErr?<img src={imgUrl} alt={name} onError={()=>setImgErr(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#1a1f3c 0%,#0f3460 50%,#1a1f3c 100%)",color:"rgba(255,255,255,0.5)",fontSize:12,textAlign:"center"}}><div><span style={{fontSize:32,display:"block",marginBottom:6}}>🏨</span>Consulter le site pour les photos</div></div>}
      </div>
      <div style={{padding:"16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:12}}>
        <div style={{flex:1,minWidth:200}}>
          {zone&&<div style={{fontSize:13,color:t.muted,marginBottom:6}}>{zone}</div>}
          {pN&&<div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}><span style={{fontSize:28,fontWeight:900,color:t.gold,fontFamily:MN}}>{fmt(pN)}</span><span style={{fontSize:13,color:t.muted}}>CHF / nuit</span>{pT&&<span style={{fontSize:13,color:t.muted}}>· {fmt(pT)} CHF total</span>}</div>}
        </div>
        {noteNum&&<div style={{background:rC,borderRadius:"10px 10px 10px 0",padding:"10px 14px",textAlign:"center",minWidth:50}}><div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{noteNum}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.8)"}}>/ 10</div></div>}
      </div>
      {chambre&&<div style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,color:t.green,background:`${t.green}15`,border:`1px solid ${t.green}30`,borderRadius:20,padding:"4px 12px",marginBottom:12,fontFamily:FN}}>✓ {chambre}</div>}
      {prose.length>0&&<p style={{fontSize:13,color:t.muted,lineHeight:1.7,margin:"8px 0 14px"}} dangerouslySetInnerHTML={{__html:renderInline(prose.join(" ").replace(/\*\*/g,""))}}/>}
      {chips.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{chips.slice(0,8).map((c,i)=><span key={i} style={{fontSize:11,color:t.muted,background:t.card,border:`1px solid ${t.border}`,padding:"5px 12px",borderRadius:20,fontFamily:FN}}>✓ {c}</span>)}</div>}
      {linkM&&<a href={linkM[2]} target="_blank" rel="noopener" style={{display:"inline-block",padding:"12px 22px",background:t.gold,color:"#0a0a0a",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none"}}>Réserver ↗</a>}
    </div></>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// OTHER DISPLAY COMPONENTS
// ═══════════════════════════════════════════════════════════════

function RecapDisplay({lines,t,mob}){const rows=parseTableRows(lines);const header=rows[0];const data=rows.slice(1);if(!data.length)return null;const totalNights=data.reduce((s,r)=>{const m=(r[2]||"").match(/(\d+)/);return s+(m?parseInt(m[1]):0);},0);
return(<div><div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:16}}><div style={{background:t.goldBg,border:`1px solid ${t.border}`,borderRadius:12,padding:"20px 16px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>🌙</div><div style={{fontSize:32,fontWeight:900,color:t.text,fontFamily:FN}}>{totalNights||"–"}</div><div style={{fontSize:12,color:t.muted}}>nuits</div></div><div style={{background:`${t.blue}10`,border:`1px solid ${t.border}`,borderRadius:12,padding:"20px 16px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>👤</div><div style={{fontSize:32,fontWeight:900,color:t.text,fontFamily:FN}}>{data[0]?.[3]?.match(/(\d+)/)?.[1]||"1"}</div><div style={{fontSize:12,color:t.muted}}>voyageur</div></div></div><div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${t.border}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:FN}}>{header&&<thead><tr style={{background:t.card2}}>{header.map((h,i)=><th key={i} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:t.gold,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`2px solid ${t.border}`}}>{h}</th>)}</tr></thead>}<tbody>{data.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${t.border}`}}>{r.map((c,j)=><td key={j} style={{padding:"12px 14px",color:j===0?t.text:t.muted,fontWeight:j===0?600:400}}>{c}</td>)}</tr>)}</tbody></table></div></div>);}

function TotauxDisplay({lines,t,mob}){const rows=parseTableRows(lines);const header=rows[0];const data=rows.slice(1);if(!data.length)return null;
const[activeIdx,setActiveIdx]=useState(0);const active=data[activeIdx]||data[0];
// Estimate activities budget based on total (roughly 10-15% of trip cost)
const totalVal=parseInt(String(active[active.length-1]||"0").replace(/['\s]/g,"").replace(/CHF/gi,""))||0;
const actEst=Math.round(totalVal*0.12/100)*100;
return(<div>
  {/* Scenario tabs */}
  <div style={{display:"grid",gridTemplateColumns:`repeat(${data.length},1fr)`,borderRadius:12,overflow:"hidden",border:`1px solid ${t.border}`,marginBottom:20}}>{data.map((r,i)=>{const isActive=i===activeIdx;const total=r[r.length-1]||"";return<button key={i} onClick={()=>setActiveIdx(i)} style={{padding:"14px 8px",textAlign:"center",background:isActive?t.goldBg2:t.card2,color:isActive?t.gold:t.muted,border:"none",borderBottom:isActive?`2px solid ${t.gold}`:"2px solid transparent",borderLeft:i>0?`1px solid ${t.border}`:"none",cursor:"pointer",fontFamily:FN}}><div style={{fontSize:11,fontWeight:700,lineHeight:1.4}}>{(r[0]||"").substring(0,25)}</div><div style={{fontSize:20,fontWeight:900,marginTop:4,fontFamily:MN}}>{fmt(total)}</div><div style={{fontSize:10,marginTop:2}}>CHF</div></button>})}</div>
  {/* Breakdown */}
  <div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,overflow:"hidden"}}>
    {header&&active&&header.slice(1).map((h,i)=>{const val=active[i+1]||"";if(!val)return null;const isTotal=i===header.length-2;return<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:isTotal?"none":`1px solid ${t.border}`,background:isTotal?t.goldBg:"transparent"}}><span style={{fontSize:13,fontWeight:isTotal?700:400,color:isTotal?t.gold:t.text,fontFamily:FN}}>{h}</span><span style={{fontSize:isTotal?20:14,fontWeight:isTotal?900:600,color:isTotal?t.gold:t.text,fontFamily:MN}}>{fmt(val)} CHF</span></div>;})}
    {/* Activities estimate */}
    {actEst>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderTop:`1px solid ${t.border}`,background:t.goldBg}}><div><span style={{fontSize:13,fontWeight:600,color:t.text,fontFamily:FN}}>Activités estimées</span><div style={{fontSize:10,color:t.muted,marginTop:2}}>Restaurants, excursions, transports locaux</div></div><span style={{fontSize:14,fontWeight:700,color:t.muted,fontFamily:MN}}>~{fmt(actEst)} CHF</span></div>}
  </div>
</div>);}

function MeteoDisplay({lines,t,mob}){
  const[destIdx,setDestIdx]=useState(0);
  const dests=[];let cur=null;
  for(const l of lines){const h=l.match(/^###\s+(.+)/);if(h){if(cur)dests.push(cur);cur={name:h[1].trim(),lines:[]};}else{if(!cur)cur={name:"",lines:[]};cur.lines.push(l);}}
  if(cur)dests.push(cur);
  // Also try splitting by **City (dates)** bold headers if no ### found
  if(dests.length<=1&&dests[0]){const all=dests[0].lines;const newDests=[];let cd=null;
  for(const l of all){const bm=l.match(/^\*\*([A-ZÀ-Ÿ][^*]+)\*\*\s*[:\-]/);if(bm){if(cd&&cd.lines.length)newDests.push(cd);cd={name:bm[1].trim(),lines:[l]};}else if(cd)cd.lines.push(l);else if(!cd){cd={name:"",lines:[l]};}}
  if(cd&&cd.lines.length)newDests.push(cd);if(newDests.length>1){dests.length=0;dests.push(...newDests);}}

  const hasTabs=dests.length>1;const active=dests[destIdx]||dests[0]||{lines:[]};
  const src=active.lines.join("\n");
  const temps=(src.match(/(\d{1,2})°/g)||[]).map(x=>parseInt(x)).filter(x=>x>0&&x<50);
  const maxT=temps.length?Math.max(...temps):null;const minT=temps.length>1?Math.min(...temps):null;
  const seaM=src.match(/(?:mer|ocean|eau)[^.]*?(\d{1,2})°/i);const seaT=seaM?seaM[1]:null;
  const prose=active.lines.filter(l=>{const s=l.trim();return s&&!/^###/.test(s)&&!/^\|/.test(s)&&s.length>5;});

  return(<div>
    {hasTabs&&<DestTab labels={dests.map(d=>d.name||"Météo")} active={destIdx} onChange={setDestIdx} t={t}/>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {maxT&&<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>☀️</div><div style={{fontSize:24,fontWeight:900,color:t.gold,fontFamily:MN}}>{maxT}°</div>{minT&&minT!==maxT&&<div style={{fontSize:11,color:t.muted,marginTop:2}}>min {minT}°</div>}<div style={{fontSize:10,color:t.muted,marginTop:3}}>Température</div></div>}
      {seaT&&<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>🌊</div><div style={{fontSize:24,fontWeight:900,color:t.blue,fontFamily:MN}}>{seaT}°</div><div style={{fontSize:10,color:t.muted,marginTop:3}}>Mer</div></div>}
      <div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>{/rare|sec|aucun.*pluie|minimal/i.test(src)?"☀️":"🌦️"}</div><div style={{fontSize:13,fontWeight:700,color:t.text}}>{/rare|sec|aucun.*pluie|minimal/i.test(src)?"Rares":"Modérées"}</div><div style={{fontSize:10,color:t.muted,marginTop:3}}>Précipitations</div></div>
      <div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>🕶</div><div style={{fontSize:13,fontWeight:700,color:t.text}}>{/élevé|fort|intense/i.test(src)?"Élevé":"Modéré"}</div><div style={{fontSize:10,color:t.muted,marginTop:3}}>UV</div></div>
    </div>
    {prose.map((l,i)=><p key={i} style={{margin:"0 0 6px",fontSize:13,color:t.muted,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:renderInline(l)}}/>)}
  </div>);
}

function CalendrierDisplay({lines,t,mob}){
  const entries=[];for(const l of lines){const s=clean(l).trim();if(!s)continue;const bold=s.match(/^\*\*([^*]+)\*\*\s*[:\-·]\s*(.*)/);if(bold)entries.push({date:bold[1].trim(),act:bold[2].trim()});}
  if(!entries.length)return null;
  const[openIdx,setOpenIdx]=useState(null);
  const colors=[t.gold,"#e05555",t.blue,"#9b59b6",t.green,"#e67e22"];

  return(<div style={{position:"relative"}}><div style={{position:"absolute",left:19,top:30,bottom:30,width:2,background:t.border}}/>
    {entries.map((e,i)=>{const isEnd=i===0||i===entries.length-1;const c=colors[i%colors.length];const isOpen=openIdx===i;
    return<div key={i} style={{display:"flex",gap:mob?10:16,marginBottom:12,position:"relative"}}>
      <div style={{width:40,height:40,borderRadius:"50%",background:isEnd?t.gold:t.card2,border:`2px solid ${isEnd?t.gold:c}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,marginTop:4}}><span style={{fontSize:14}}>{i===0?"🛫":i===entries.length-1?"🛬":"📍"}</span></div>
      <div style={{flex:1}}>
        <button onClick={()=>setOpenIdx(isOpen?null:i)} style={{width:"100%",textAlign:"left",background:t.card2,border:`1px solid ${isEnd?t.gold:t.border}`,borderRadius:isOpen?"12px 12px 0 0":"12px",padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:11,fontWeight:800,color:c,letterSpacing:"0.06em",fontFamily:FN}}>{e.date.toUpperCase()}</div><div style={{fontSize:13,color:t.muted,lineHeight:1.5,marginTop:2}} dangerouslySetInnerHTML={{__html:renderInline(e.act)}}/></div>
          <span style={{color:t.muted,fontSize:14,marginLeft:8}}>{isOpen?"▲":"▼"}</span>
        </button>
        {isOpen&&<div style={{background:t.card,border:`1px solid ${t.border}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:t.gold,marginBottom:10,fontFamily:FN}}>ACTIVITÉS SUGGÉRÉES</div>
          <div style={{fontSize:13,color:t.muted,lineHeight:1.7}}>Les activités détaillées seront générées lors de la prochaine recherche. Utilisez le chat 💬 en bas à droite pour demander des suggestions d'activités pour cette période.</div>
        </div>}
      </div>
    </div>;})}
  </div>);
}

function RecoDisplay({lines,t}){const text=lines.filter(l=>l.trim()).join(" ");return(<div style={{background:t.goldBg,border:`1px solid ${t.gold}25`,borderRadius:12,padding:20}}><div style={{fontSize:13,color:t.muted,lineHeight:1.7,fontFamily:FN}} dangerouslySetInnerHTML={{__html:renderInline(text)}}/></div>);}
function FideliteDisplay({lines,t}){const items=lines.filter(l=>l.trim()&&!/^#{1,4}/.test(l.trim()));return(<div style={{display:"flex",flexDirection:"column",gap:8}}>{items.filter(l=>l.trim().length>5).map((item,i)=><div key={i} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:10,padding:"14px 16px",fontSize:13,color:t.muted,lineHeight:1.7}}><span style={{color:t.gold,marginRight:6}}>💳</span><span dangerouslySetInnerHTML={{__html:renderInline(item)}}/></div>)}</div>);}

// ═══════════════════════════════════════════════════════════════
// RESULTS VIEW
// ═══════════════════════════════════════════════════════════════
function ResultsView({text,t,mob}){const sections=parseSections(text);if(!sections.length)return<p style={{color:t.muted}}>{text}</p>;
return(<div>{sections.map((sec,i)=>{const ti=sec.title.toLowerCase();const isR=/récap/i.test(ti);const isV=/vols?\b/i.test(ti)&&!/revolut|astuce|fidél/i.test(ti);const isH=/héberg/i.test(ti);const isT=/total|coût/i.test(ti);const isM=/météo|meteo/i.test(ti);const isC=/calendrier|planning/i.test(ti);const isRe=/recommand/i.test(ti);const isF=/revolut|astuce|fidél/i.test(ti);
return(<Sec key={i} title={sec.title} t={t} mob={mob} defaultOpen={isR||isV||isH} accent={isT}>{isR?<RecapDisplay lines={sec.lines} t={t} mob={mob}/>:isV?<FlightDisplay lines={sec.lines} t={t} mob={mob}/>:isH?<HebergementDisplay lines={sec.lines} t={t} mob={mob}/>:isT?<TotauxDisplay lines={sec.lines} t={t} mob={mob}/>:isM?<MeteoDisplay lines={sec.lines} t={t} mob={mob}/>:isC?<CalendrierDisplay lines={sec.lines} t={t} mob={mob}/>:isRe?<RecoDisplay lines={sec.lines} t={t}/>:isF?<FideliteDisplay lines={sec.lines} t={t}/>:<div>{sec.lines.filter(l=>l.trim()).map((l,j)=><p key={j} style={{margin:"0 0 6px",fontSize:13,color:t.muted,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:renderInline(l)}}/>)}</div>}</Sec>);})}</div>);}

// ═══════════════════════════════════════════════════════════════
// CHAT + FORM COMPONENTS (unchanged from v3)
// ═══════════════════════════════════════════════════════════════
function ChatWidget({t,mob}){const[open,setOpen]=useState(false);const[msgs,setMsgs]=useState([{role:"assistant",content:"Posez-moi vos questions sur les vols, hôtels ou activités."}]);const[input,setInput]=useState("");const[loading,setLoading]=useState(false);const endRef=useRef(null);useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
const send=async()=>{if(!input.trim()||loading)return;const u={role:"user",content:input};setMsgs(p=>[...p,u]);setInput("");setLoading(true);try{const res=await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...msgs,u]})});const data=await res.json();setMsgs(p=>[...p,{role:"assistant",content:data.text||"Erreur."}]);}catch{setMsgs(p=>[...p,{role:"assistant",content:"Erreur de connexion."}]);}setLoading(false);};
if(!open)return<button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:20,right:20,width:52,height:52,borderRadius:"50%",background:t.gold,border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,zIndex:1000}}>💬</button>;
return(<div style={{position:"fixed",bottom:20,right:mob?16:20,width:mob?"calc(100vw - 32px)":"360px",height:mob?"calc(100vh - 100px)":"480px",background:t.card,border:`1px solid ${t.border}`,borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:1000}}><div style={{padding:"14px 18px",borderBottom:`1px solid ${t.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:t.goldBg}}><span style={{fontSize:13,fontWeight:700,color:t.gold,fontFamily:FN}}>💬 Assistant</span><button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:t.muted,fontSize:18,cursor:"pointer"}}>×</button></div><div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>{msgs.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?t.gold:t.card2,color:m.role==="user"?"#0a0a0a":t.text,fontSize:13,lineHeight:1.6}}>{m.content}</div>)}{loading&&<div style={{padding:"10px 14px",borderRadius:14,background:t.card2,color:t.muted,fontSize:13}}>...</div>}<div ref={endRef}/></div><div style={{padding:"10px 14px",borderTop:`1px solid ${t.border}`,display:"flex",gap:8}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Question..." style={{flex:1,padding:"10px 14px",background:t.input,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:13,fontFamily:FN,outline:"none"}}/><button onClick={send} disabled={loading} style={{padding:"10px 16px",background:t.gold,border:"none",borderRadius:10,color:"#0a0a0a",fontWeight:700,cursor:"pointer"}}>↑</button></div></div>);}

function LoyaltySelector({selected,onChange,points,onPoints,t}){return(<div><div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:selected.length>0?14:0}}>{LOYALTY.map(p=>{const on=selected.includes(p.id);return<button key={p.id} onClick={()=>onChange(on?selected.filter(x=>x!==p.id):[...selected,p.id])} style={{padding:"6px 13px",borderRadius:20,border:`1px solid ${on?t.gold:t.border}`,background:on?t.goldBg2:"transparent",color:on?t.gold:t.muted,fontSize:11,cursor:"pointer",fontFamily:FN}}>{p.short}</button>;})}</div>{selected.length>0&&<div style={{background:t.card2,borderRadius:10,padding:"14px 16px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><Lbl t={t}>Points</Lbl><span style={{fontSize:14,fontWeight:800,color:t.gold,fontFamily:MN}}>{points>=100000?">100k":points.toLocaleString("fr-CH")} pts</span></div><input type="range" min="0" max="10" step="1" value={Math.max(0,POINTS_MARKS.findIndex(v=>v===points))} onChange={e=>onPoints(POINTS_MARKS[+e.target.value]||0)} style={{width:"100%",accentColor:t.gold}}/></div>}</div>);}

function DateFlexCell({value,onChange,flex,onFlexChange,t}){const S={width:"100%",boxSizing:"border-box",background:t.input,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:14,fontFamily:FN,padding:"13px 16px",outline:"none"};return(<div><input type="date" value={value} onChange={e=>onChange(e.target.value)} style={S}/><div style={{display:"flex",alignItems:"center",marginTop:5,gap:5}}><button onClick={()=>onFlexChange(0)} style={{fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:10,border:`1px solid ${flex===0?t.gold:t.border}`,background:flex===0?t.goldBg2:"transparent",color:flex===0?t.gold:t.muted,cursor:"pointer",whiteSpace:"nowrap"}}>EXACT</button><button onClick={()=>onFlexChange(flex===0?3:flex)} style={{fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:10,border:`1px solid ${flex>0?t.gold:t.border}`,background:flex>0?t.goldBg2:"transparent",color:flex>0?t.gold:t.muted,cursor:"pointer",whiteSpace:"nowrap"}}>{flex>0?`± ${flex}j`:"± JOURS"}</button></div>{flex>0&&<div style={{marginTop:7,padding:"10px 12px",background:t.card2,borderRadius:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:t.muted}}>FLEX</span><span style={{fontSize:12,fontWeight:800,color:t.gold,fontFamily:MN}}>± {flex}j</span></div><input type="range" min="1" max="21" value={flex} onChange={e=>onFlexChange(+e.target.value)} style={{width:"100%",accentColor:t.gold}}/></div>}</div>);}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App(){
  const w=useW();const mob=w<700;
  const[isDark,setIsDark]=useState(true);const t=isDark?DARK:LIGHT;
  useEffect(()=>{document.body.style.background=t.bg;document.body.style.margin="0";document.documentElement.style.background=t.bg;},[t.bg]);
  const[activeTab,setActiveTab]=useState("trips");const[formOpen,setFormOpen]=useState(true);
  const[loyaltyCards,setLoyaltyCards]=useState([]);const[loyaltyPoints,setLoyaltyPoints]=useState(0);
  const[from,setFrom]=useState("GVA");const[fromCustom,setFromCustom]=useState("");
  const[legs,setLegs]=useState([{to:"",depDate:"",retDate:"",depFlex:0,retFlex:0}]);
  const[travelers,setTravelers]=useState("1");const[baggage,setBaggage]=useState("no_pref");
  const[vibes,setVibes]=useState([]);const[activities,setActivities]=useState([]);const[notes,setNotes]=useState("");
  const[phase,setPhase]=useState("idle");const[result,setResult]=useState("");const[err,setErr]=useState("");const[tipIdx,setTipIdx]=useState(0);
  const timer=useRef(null);
  useEffect(()=>{if(phase==="loading")timer.current=setInterval(()=>setTipIdx(i=>(i+1)%TIPS.length),2800);else{clearInterval(timer.current);setTipIdx(0);}return()=>clearInterval(timer.current);},[phase]);
  const addLeg=()=>{if(legs.length<5)setLegs(l=>[...l,{to:"",depDate:l[l.length-1].retDate||"",retDate:"",depFlex:0,retFlex:0}]);};
  const removeLeg=idx=>setLegs(l=>l.filter((_,i)=>i!==idx));
  const updateLeg=(idx,field,val)=>{setLegs(l=>{const n=l.map((leg,i)=>i===idx?{...leg,[field]:val}:leg);if(field==="retDate"&&idx+1<n.length)n[idx+1]={...n[idx+1],depDate:val};return n;});};
  const INP={width:"100%",boxSizing:"border-box",background:t.input,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:14,fontFamily:FN,padding:"13px 16px",outline:"none",WebkitAppearance:"none",appearance:"none"};
  const INP_RO={...INP,color:t.muted,cursor:"default",background:t.card2};

  const buildPrompt=()=>{const airport=from==="OTHER"?fromCustom.toUpperCase():from;const vibeLabels=VIBES.filter(v=>vibes.includes(v.id)).map(v=>v.label).join(", ");const actLabels=ACTIVITIES.filter(a=>activities.includes(a.id)).map(a=>a.label).join(", ");const legLines=legs.filter(l=>l.to).map((l,i)=>{const fp=i===0?airport:(legs[i-1].to||airport);const parts=[`Vol ${i+1} : ${fp} -> ${l.to}`];if(l.depDate)parts.push(`départ ${l.depDate}${l.depFlex>0?` (flexible ±${l.depFlex} jours)`:""}`);if(l.retDate)parts.push(i===legs.length-1?`retour ${l.retDate}${l.retFlex>0?` (flexible ±${l.retFlex} jours)`:""}`:`arrivée ${l.retDate}${l.retFlex>0?` (flexible ±${l.retFlex} jours)`:""}`);return"✈️ "+parts.join(" - ");});const bagLabel=BAGGAGE_OPTIONS.find(b=>b.id===baggage)?.label||"";const loyaltyInfo=loyaltyCards.length>0?`🎫 Programmes : ${loyaltyCards.map(id=>LOYALTY.find(p=>p.id===id)?.short).join(", ")} - ${loyaltyPoints>=100000?">100k":loyaltyPoints.toLocaleString("fr-CH")} pts`:"";return["Planifie ce voyage, recherche tous les prix en temps réel :",`Aéroport de base : ${airport}`,...legLines,`Voyageurs : ${travelers}`,baggage!=="no_pref"?`Bagages : ${bagLabel}`:"",loyaltyInfo,vibeLabels?`Ambiance : ${vibeLabels}`:"",actLabels?`Activités : ${actLabels}`:"",notes?`Notes : ${notes}`:"","","FORMAT OBLIGATOIRE : Pour chaque vol, inclure heure de départ et heure d'arrivée dans le tableau. Pour la météo multi-destination, utiliser ### Ville (Mois) comme sous-titres. Pour les hébergements multi-destination, utiliser ### Ville (dates) puis #### Nom Hôtel. Tableau complet par vol avec 3 scénarios, totaux CHF, liens Booking/Kayak."].filter(Boolean).join("\n");};
  const go=async()=>{if(!legs[0].to||!legs[0].depDate){setErr("Destination et date requises.");return;}if(from==="OTHER"&&!fromCustom.trim()){setErr("Code IATA requis.");return;}setPhase("loading");setErr("");setResult("");try{const res=await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:buildPrompt()}]})});const data=await res.json();if(!res.ok||data.error)throw new Error(data.error||`Erreur ${res.status}`);setResult(data.text||"Aucun résultat.");setPhase("done");setFormOpen(false);}catch(e){setErr(e.message);setPhase("error");}};
  const reset=()=>{setPhase("idle");setResult("");setErr("");setFormOpen(true);};

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"1rem 1rem",background:t.bg,minHeight:"100vh",fontFamily:FN,transition:"background 0.3s"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,letterSpacing:"-0.04em",color:t.text,lineHeight:1}}>WDC</div><div style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",color:t.gold,marginTop:3}}>AI TRAVEL</div></div>
        <button onClick={()=>setIsDark(!isDark)} style={{width:40,height:40,borderRadius:"50%",border:`1px solid ${t.border}`,background:t.card,color:t.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",fontSize:16,flexShrink:0}}>{isDark?"☀️":"🌙"}</button>
      </div>

      {/* Form - always visible, collapsed accordion when results shown */}
      {phase==="done"&&result&&<button onClick={()=>setFormOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",background:t.card,border:`1px solid ${t.border}`,borderRadius:formOpen?"14px 14px 0 0":14,cursor:"pointer",marginBottom:formOpen?0:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14}}>🔍</span><span style={{fontSize:13,fontWeight:600,color:t.text,fontFamily:FN}}>Modifier la recherche</span></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>{!formOpen&&<span style={{fontSize:11,color:t.muted,fontFamily:FN,maxWidth:250,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{legs.filter(l=>l.to).map((l,i)=>i===0?`${from==="OTHER"?fromCustom:from} → ${l.to}`:l.to).join(" → ")}</span>}<span style={{color:t.muted,fontSize:16}}>{formOpen?"−":"+"}</span></div>
      </button>}
      {(formOpen||phase!=="done")&&<div style={{background:phase==="done"?t.card:"transparent",border:phase==="done"?`1px solid ${t.border}`:"none",borderTop:phase==="done"?"none":undefined,borderRadius:phase==="done"?"0 0 14px 14px":0,padding:phase==="done"?"10px 0 0":0,marginBottom:10,overflow:"hidden"}}>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",padding:phase==="done"?"0 20px":"0"}}>{[{id:"trips",label:"🗺 Trips"},{id:"vols",label:"✈️ Vols"},{id:"hotels",label:"🏨 Hébergements"}].map(tab=><button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:"9px 18px",borderRadius:20,border:`1px solid ${activeTab===tab.id?t.gold:t.border}`,background:activeTab===tab.id?t.gold:"transparent",color:activeTab===tab.id?"#0a0a0a":t.muted,fontSize:12,fontWeight:activeTab===tab.id?700:500,cursor:"pointer",fontFamily:FN}}>{tab.label}</button>)}</div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:"14px 20px",marginBottom:10}}><Lbl t={t}>Programmes de fidélité</Lbl><LoyaltySelector selected={loyaltyCards} onChange={setLoyaltyCards} points={loyaltyPoints} onPoints={setLoyaltyPoints} t={t}/></div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${t.border}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><Lbl t={t}>Voyageurs</Lbl><select value={travelers} onChange={e=>setTravelers(e.target.value)} style={INP}>{[1,2,3,4,5,6,8,10].map(n=><option key={n} value={n}>{n} pers.</option>)}</select></div><div><Lbl t={t}>Bagages</Lbl><select value={baggage} onChange={e=>setBaggage(e.target.value)} style={INP}>{BAGGAGE_OPTIONS.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select></div></div>
          <div style={{padding:"14px 20px 8px"}}>
            {legs.map((leg,idx)=><div key={idx} style={{marginBottom:12,padding:16,background:t.card2,borderRadius:12,border:`1px solid ${t.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:11,fontWeight:700,color:t.gold,fontFamily:FN}}>ÉTAPE {idx+1}</span>{idx>0&&<button onClick={()=>removeLeg(idx)} style={{width:28,height:28,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",color:t.muted,fontSize:16,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 20px 1fr",gap:8,alignItems:"end",marginBottom:10}}>
                <div><Lbl t={t}>Depuis</Lbl>{idx===0?<select value={from} onChange={e=>setFrom(e.target.value)} style={INP}>{AIRPORTS.map(a=><option key={a.code} value={a.code}>{a.code==="OTHER"?"Autre":`${a.code} - ${a.name}`}</option>)}</select>:<div style={INP_RO}>{legs[idx-1].to||"-"}</div>}</div>
                <div style={{textAlign:"center",color:t.gold,fontWeight:900,fontSize:16,paddingBottom:14}}>→</div>
                <div><Lbl t={t}>Vers</Lbl><input value={leg.to} onChange={e=>updateLeg(idx,"to",e.target.value)} placeholder={["Marbella","Chicago","Costa Rica"][idx]||"Destination"} style={INP}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><Lbl t={t}>Date aller</Lbl><DateFlexCell value={leg.depDate} onChange={v=>updateLeg(idx,"depDate",v)} flex={leg.depFlex||0} onFlexChange={v=>updateLeg(idx,"depFlex",v)} t={t}/></div>
                <div><Lbl t={t}>Date retour</Lbl><DateFlexCell value={leg.retDate} onChange={v=>updateLeg(idx,"retDate",v)} flex={leg.retFlex||0} onFlexChange={v=>updateLeg(idx,"retFlex",v)} t={t}/></div>
              </div>
            </div>)}
            {legs.length<5&&<button onClick={addLeg} style={{fontSize:11,padding:"7px 16px",border:`1px dashed ${t.border}`,background:"transparent",cursor:"pointer",color:t.muted,borderRadius:8,marginTop:4,marginBottom:8,fontFamily:FN}}>+ Étape ({legs.length}/5)</button>}
          </div>
          <div style={{borderTop:`1px solid ${t.border}`}}/>
          <div style={{padding:"14px 20px"}}><Lbl t={t}>Ambiance</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{VIBES.map(v=><ChipBtn key={v.id} label={v.label} selected={vibes.includes(v.id)} onClick={()=>setVibes(x=>x.includes(v.id)?x.filter(z=>z!==v.id):[...x,v.id])} t={t}/>)}</div></div>
          <div style={{padding:"0 20px 14px"}}><Lbl t={t}>Activités</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{ACTIVITIES.map(a=><ChipBtn key={a.id} label={a.label} selected={activities.includes(a.id)} onClick={()=>setActivities(x=>x.includes(a.id)?x.filter(z=>z!==a.id):[...x,a.id])} t={t}/>)}</div></div>
          <div style={{padding:"0 20px 16px"}}><Lbl t={t}>Notes</Lbl><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Budget, occasion..." style={{...INP,minHeight:52,resize:"vertical"}}/></div>
          {err&&<div style={{margin:"0 20px 14px",fontSize:13,color:"#ff7070",background:"rgba(255,100,100,0.1)",borderRadius:8,padding:"10px 14px"}}>⚠ {err}</div>}
          <div style={{padding:"0 20px 20px"}}><button onClick={go} disabled={phase==="loading"} style={{width:"100%",padding:16,background:phase==="loading"?t.faint:`linear-gradient(135deg,${t.gold},#d4b85c)`,color:phase==="loading"?t.muted:"#0a0a0a",border:"none",borderRadius:12,cursor:phase==="loading"?"not-allowed":"pointer",fontSize:12,fontWeight:800,letterSpacing:"0.18em",fontFamily:FN}}>{phase==="loading"?"RECHERCHE...":"LANCER LA RECHERCHE"}</button></div>
        </div>
      </div>}

      {phase==="loading"&&<div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:"3rem",textAlign:"center",marginTop:10}}><div style={{fontSize:44,marginBottom:"1rem"}}>✈️</div><div style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:t.text,fontFamily:FN}}>{TIPS[tipIdx].toUpperCase()}</div><div style={{display:"flex",justifyContent:"center",gap:6,marginTop:"1.5rem"}}>{TIPS.map((_,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===tipIdx?t.gold:t.border}}/>)}</div></div>}

      {phase==="done"&&result&&<div style={{marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div><span style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:t.text,fontFamily:FN}}>RÉSULTATS</span><span style={{fontSize:10,color:t.muted,marginLeft:12}}>{new Date().toLocaleDateString("fr-CH",{day:"numeric",month:"long",year:"numeric"})}</span></div>
          <button onClick={reset} style={{fontSize:10,fontWeight:700,padding:"6px 14px",background:t.gold,border:"none",borderRadius:6,cursor:"pointer",color:"#0a0a0a",fontFamily:FN}}>NOUVELLE RECHERCHE</button>
        </div>
        <ResultsView text={result} t={t} mob={mob}/>
      </div>}

      <div style={{marginTop:24,textAlign:"center",fontSize:10,color:t.faint,letterSpacing:"0.1em",fontFamily:MN}}>KAYAK · BOOKING · GOOGLE FLIGHTS · SKYSCANNER</div>
      <ChatWidget t={t} mob={mob}/>
    </div>
  );
}
