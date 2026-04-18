import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// WDC AI TRAVEL — v3 (fixed parsers + responsive + dest tabs)
// ═══════════════════════════════════════════════════════════════

// ── CONSTANTS ──
const AIRPORTS=[{code:"GVA",name:"Genève-Cointrin"},{code:"ZRH",name:"Zurich"},{code:"MXP",name:"Milan Malpensa"},{code:"CDG",name:"Paris CDG"},{code:"LHR",name:"Londres Heathrow"},{code:"BCN",name:"Barcelone"},{code:"FCO",name:"Rome Fiumicino"},{code:"AMS",name:"Amsterdam"},{code:"MAD",name:"Madrid"},{code:"DXB",name:"Dubai"},{code:"JFK",name:"New York JFK"},{code:"LAX",name:"Los Angeles"},{code:"BKK",name:"Bangkok"},{code:"SIN",name:"Singapour"},{code:"OTHER",name:"Autre"}];
const VIBES=[{id:"beach",label:"🏖 Plage & Mer"},{id:"city",label:"🏙 Ville & Culture"},{id:"nature",label:"🌿 Nature & Montagne"},{id:"party",label:"🎉 Fête & Nightlife"},{id:"gastro",label:"🍽 Gastronomie"},{id:"spa",label:"💆 Détente & Spa"},{id:"adventure",label:"🏄 Aventure & Sport"},{id:"romance",label:"💑 Romance"},{id:"luxury",label:"💎 Luxe & VIP"},{id:"family",label:"👨‍👩‍👧 Famille"}];
const ACTIVITIES=[{id:"surf",label:"Surf"},{id:"golf",label:"Golf"},{id:"diving",label:"Plongée"},{id:"hiking",label:"Randonnée"},{id:"restaurants",label:"Restos étoilés"},{id:"shopping",label:"Shopping"},{id:"clubs",label:"Clubs & Bars"},{id:"yoga",label:"Yoga & Wellness"},{id:"museums",label:"Musées"},{id:"sailing",label:"Voile & Bateau"},{id:"skiing",label:"Ski"},{id:"snorkeling",label:"Snorkeling"},{id:"tennis",label:"Tennis"},{id:"safari",label:"Safari"}];
const LOYALTY=[{id:"revolut_ultra",short:"Revolut Ultra"},{id:"amex_ch",short:"Amex"},{id:"ubs_infinite",short:"UBS Visa"},{id:"miles_more",short:"Miles & More"},{id:"marriott_bonvoy",short:"Marriott Bonvoy"},{id:"hilton_honors",short:"Hilton Honors"},{id:"world_of_hyatt",short:"World of Hyatt"},{id:"diners_club",short:"Diners Club"}];
const POINTS_MARKS=[0,5000,10000,15000,20000,25000,30000,40000,50000,75000,100000];
const BAGGAGE_OPTIONS=[{id:"no_pref",label:"Pas de préférence"},{id:"cabin_only",label:"Cabine seulement"},{id:"1_checked_23",label:"1 bagage 23 kg"},{id:"2_checked_23",label:"2 bagages 23 kg"},{id:"sport",label:"Bagage sport / golf"}];
const TIPS=["Recherche des vols sur Kayak et Google Flights...","Consultation de Skyscanner et Momondo...","Vérification des hôtels sur Booking.com...","Comparaison sur Airbnb et Hotels.com...","Calcul des 3 scénarios de classe...","Conversion des prix en CHF...","Analyse météo à destination...","Finalisation de la recommandation..."];

// ── THEMES ──
const DARK={bg:"#0a0a0a",card:"#141414",card2:"#1c1c1c",input:"#202020",border:"#2a2218",text:"#f5f0e8",muted:"#999",faint:"#444",gold:"#c9a96e",goldD:"#a07840",goldBg:"rgba(201,169,110,0.06)",goldBg2:"rgba(201,169,110,0.12)",green:"#22c55e",red:"#ef4444",blue:"#5b9bd5"};
const LIGHT={bg:"#f5f3ef",card:"#ffffff",card2:"#f0ede7",input:"#faf9f7",border:"#e0dcd4",text:"#1a1a1a",muted:"#6a6560",faint:"#ccc",gold:"#a6872f",goldD:"#8a7535",goldBg:"rgba(166,135,47,0.06)",goldBg2:"rgba(166,135,47,0.12)",green:"#3a8f4a",red:"#c94444",blue:"#3a7abf"};
const FN="'DM Sans','Helvetica Neue',system-ui,sans-serif";
const MN="'JetBrains Mono','SF Mono',monospace";
const fmt=n=>{try{return parseInt(String(n).replace(/['\s]/g,"")).toLocaleString("fr-CH")}catch{return n}};

// ── RESPONSIVE HOOK ──
function useW(){const[w,setW]=useState(typeof window!=="undefined"?window.innerWidth:900);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;}

// ── PARSE UTILITIES ──
function clean(t){if(!t)return"";const ls=t.replace(/[—–]/g," - ").split("\n");const o=[];for(const l of ls){const s=l.trim();const p=o.length>0?o[o.length-1]:null;if(p&&!p.trim().startsWith("|")&&!p.trim().startsWith("#")&&(/^[,;]/.test(s)||/^\.\s/.test(s)||/^\.$/.test(s)||(s.length>0&&s.length<=4&&!/^[|#\-*✅•\d]/.test(s)))){o[o.length-1]=o[o.length-1].trimEnd()+(s.startsWith(",")||s.startsWith(".")||s.startsWith(";")?"":" ")+s;}else o.push(l);}return o.join("\n");}
function renderInline(s){return(s||"").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">$1 ↗</a>`);}
function parseSections(text){const lines=clean(text).split("\n");const secs=[];let cur=null;for(const l of lines){const h2=l.match(/^## (.+)/);if(h2){if(cur)secs.push(cur);cur={title:h2[1].trim(),lines:[]};}else if(cur)cur.lines.push(l);}if(cur)secs.push(cur);return secs;}
function titleParts(t){const m=t.match(/^([\u{1F300}-\u{1FFFF}][\uFE0F\u200D]*)+\s*/u);if(m)return{icon:m[0].trim(),label:t.slice(m[0].length).trim()};return{icon:"",label:t};}

// Parse markdown table rows into array of cell arrays
function parseTableRows(lines){const rows=[];for(const l of lines){if(l.trim().startsWith("|")&&!l.trim().match(/^[\|\s:\-]+$/)){const cells=l.split("|").slice(1,-1).map(c=>c.trim());if(cells.length>=2)rows.push(cells);}}return rows;}

// Parse key-value table (Critère|Détail)
function parseKV(lines){const d={};for(const l of lines){if(l.trim().startsWith("|")&&!l.trim().match(/^[\|\s:\-]+$/)){const cells=l.split("|").slice(1,-1).map(c=>c.trim());if(cells.length>=2&&cells[0]&&cells[1]){d[cells[0].toLowerCase().replace(/[éèê]/g,"e").replace(/[àâ]/g,"a").replace(/\//g,"_").replace(/\s+/g,"_").replace(/[^a-z_]/g,"")]=cells[1];}}}return d;}

// ── SHARED UI ──
function Sec({icon,title,children,t,defaultOpen=false,accent=false,mob}){const[o,setO]=useState(defaultOpen);const{icon:ti,label}=typeof title==="string"?titleParts(title):{icon:"",label:title};return(<div style={{background:t.card,border:`1px solid ${accent?t.gold:t.border}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}><button onClick={()=>setO(x=>!x)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:mob?"14px 16px":"16px 20px",background:"none",border:"none",cursor:"pointer",borderBottom:o?`1px solid ${t.border}`:"none"}}><div style={{display:"flex",alignItems:"center",gap:10}}>{(icon||ti)&&<span style={{fontSize:16}}>{icon||ti}</span>}<span style={{fontSize:13,fontWeight:700,color:accent?t.gold:t.text,fontFamily:FN}}>{label}</span></div><span style={{color:t.muted,fontSize:18,fontWeight:300}}>{o?"−":"+"}</span></button>{o&&<div style={{padding:mob?"14px 16px":"18px 22px"}}>{children}</div>}</div>);}
function Lbl({children,t}){return<div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:t.muted,marginBottom:6,textTransform:"uppercase",fontFamily:FN}}>{children}</div>;}
function ChipBtn({label,selected,onClick,t}){return<button type="button" onClick={onClick} style={{padding:"7px 15px",borderRadius:20,border:`1px solid ${selected?t.gold:t.border}`,background:selected?t.goldBg2:"transparent",color:selected?t.gold:t.muted,fontSize:12,cursor:"pointer",fontFamily:FN,whiteSpace:"nowrap"}}>{label}</button>;}
function Tag({children,t,color}){const c=color||t.gold;return<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:500,color:c,background:`${c}15`,border:`1px solid ${c}30`,borderRadius:20,padding:"2px 10px",fontFamily:FN}}>{children}</span>;}

// ═══════════════════════════════════════════════════════════════
// RESULT DISPLAY COMPONENTS — based on actual API markdown format
// ═══════════════════════════════════════════════════════════════

// ── RECAP ──
function RecapDisplay({lines,t,mob}){const rows=parseTableRows(lines);const header=rows[0];const data=rows.slice(1);if(!data.length)return null;
return(<div><div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:16}}><div style={{background:t.goldBg,border:`1px solid ${t.border}`,borderRadius:12,padding:"20px 16px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>🌙</div><div style={{fontSize:32,fontWeight:900,color:t.text,fontFamily:FN}}>{data.reduce((s,r)=>{const m=(r[2]||"").match(/(\d+)/);return s+(m?parseInt(m[1]):0);},0)||"–"}</div><div style={{fontSize:12,color:t.muted}}>nuits</div></div><div style={{background:`${t.blue}10`,border:`1px solid ${t.border}`,borderRadius:12,padding:"20px 16px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:4}}>👤</div><div style={{fontSize:32,fontWeight:900,color:t.text,fontFamily:FN}}>{data[0]?.[3]?.match(/(\d+)/)?.[1]||"1"}</div><div style={{fontSize:12,color:t.muted}}>voyageur</div></div></div>
{/* Table */}
<div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${t.border}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:FN}}>{header&&<thead><tr style={{background:t.card2}}>{header.map((h,i)=><th key={i} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:t.gold,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:`2px solid ${t.border}`}}>{h}</th>)}</tr></thead>}<tbody>{data.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${t.border}`}}>{r.map((c,j)=><td key={j} style={{padding:"12px 14px",color:j===0?t.text:t.muted,fontWeight:j===0?600:400}}>{c}</td>)}</tr>)}</tbody></table></div></div>);}

// ── FLIGHTS ──
function FlightDisplay({lines,t,mob}){
  // Split by ### Vol N: headers
  const volSections=[];let cur=null;const otherLines=[];
  for(const l of lines){const h3=l.match(/^###\s+(.+)/);if(h3){if(cur)volSections.push(cur);cur={title:h3[1].trim(),lines:[]};}else if(cur)cur.lines.push(l);else otherLines.push(l);}
  if(cur)volSections.push(cur);
  // If no ### sections, treat all as one section
  if(!volSections.length)volSections.push({title:"",lines});

  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    {volSections.map((vol,vi)=>{
      const rows=parseTableRows(vol.lines);
      const header=rows[0];
      const data=rows.slice(1);
      // Extract link from markdown [text](url) in last column
      const parseLink=cell=>{const m=(cell||"").match(/\[([^\]]+)\]\(([^)]+)\)/);return m?{label:m[1],url:m[2]}:null;};
      return(<div key={vi} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,overflow:"hidden"}}>
        {vol.title&&<div style={{padding:"12px 18px",borderBottom:`1px solid ${t.border}`,background:t.goldBg}}><span style={{fontSize:12,fontWeight:800,color:t.gold,letterSpacing:"0.06em",fontFamily:FN}}>{vol.title}</span></div>}
        <div style={{padding:mob?"12px":"16px 18px"}}>
          {data.map((row,ri)=>{
            const scenario=row[0]||"";const compagnie=row[1]||"";const routing=row[2]||"";const duree=row[3]||"";const escales=row[4]||"";const prix=row[5]||"";const link=parseLink(row[6]);
            const isBiz=/business|💺/i.test(scenario);const isMix=/mixte|🔀|éco.*biz|biz.*retour/i.test(scenario);
            const color=isBiz?t.gold:isMix?"#c97acc":t.green;
            return(<div key={ri} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:mob?"12px":"14px 16px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                <div><Tag t={t} color={color}>{scenario.replace(/\|/g,"").trim()}</Tag><span style={{fontSize:14,fontWeight:700,color:t.text,fontFamily:FN,marginLeft:10}}>{compagnie.replace(/\n/g," ").trim()}</span></div>
                {link&&<a href={link.url} target="_blank" rel="noopener" style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:t.gold,textDecoration:"none",background:t.goldBg,border:`1px solid ${t.gold}40`,borderRadius:20,padding:"4px 14px"}}>{link.label} ↗</a>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:8}}>
                {[{l:"Routing",v:routing},{l:"Durée",v:duree},{l:"Escales",v:escales},{l:"Prix/pers",v:prix.includes("CHF")?prix:`${fmt(prix)} CHF`,h:true}].map((x,j)=><div key={j}><div style={{fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",color:t.muted,fontFamily:FN,marginBottom:3}}>{x.l}</div><div style={{fontSize:13,fontWeight:x.h?800:500,color:x.h?t.gold:t.text,fontFamily:x.h?MN:FN}}>{x.v}</div></div>)}
              </div>
            </div>);
          })}
        </div>
      </div>);
    })}
  </div>);
}

// ── HOTEL CARD ──
function HotelCard({name,lines,t,mob}){
  const[open,setOpen]=useState(true);
  const kv=parseKV(lines);
  const stars=(kv.etoiles||"").replace(/[^★]/g,"").length||0;
  const note=kv.note||"";const noteNum=note.match(/(\d+\.?\d*)/)?.[1]||"";
  const zone=kv.zone||kv.emplacement||"";
  const chambre=kv.chambre||"";
  const prixNuit=kv.prix_nuit||"";const prixTotal=kv.prix_total||"";
  const prixN=prixNuit.match(/(\d[\d'\s]*)/)?.[1]?.replace(/['\s]/g,"")||"";
  const prixT=prixTotal.match(/(\d[\d'\s]*)/)?.[1]?.replace(/['\s]/g,"")||"";
  const equipements=kv.equipements||"";
  const petitDej=kv["petit-dejeuner"]||kv.petit_dejeuner||"";
  const piscine=kv.piscine||"";const spa=kv.spa||"";const vue=kv.vue||"";
  const lien=kv.lien||"";const linkM=lien.match(/\[([^\]]+)\]\(([^)]+)\)/);

  // Prose lines (non-table)
  const prose=lines.filter(l=>{const s=l.trim();return s&&!/^\|/.test(s)&&!/^#{1,4}\s/.test(s)&&!/^IMAGES:/i.test(s);}).slice(0,3);

  // Amenity chips
  const chips=[equipements&&...equipements.split(",").map(s=>s.trim()).filter(s=>s.length>1),piscine&&!/non/i.test(piscine)&&"Piscine",spa&&!/non/i.test(spa)&&"Spa",petitDej&&!/non|option/i.test(petitDej)&&"Petit-déjeuner inclus",vue&&vue.split(",")[0]?.trim()].flat().filter(Boolean).slice(0,8);

  const rN=parseFloat(noteNum||"0");const rC=rN>=9?"#16a34a":rN>=8?"#1d8348":"#2e7d32";

  return(<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"none",border:"none",cursor:"pointer",borderBottom:open?`1px solid ${t.border}`:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>{stars>0&&<span style={{color:t.gold,fontSize:12}}>{"★".repeat(stars)}</span>}<span style={{fontSize:15,fontWeight:700,color:t.text,fontFamily:FN}}>{name}</span></div>
      <span style={{color:t.muted,fontSize:16}}>{open?"−":"+"}</span>
    </button>
    {open&&<div style={{padding:mob?"14px":"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:12}}>
        <div>{zone&&<div style={{fontSize:13,color:t.muted,marginBottom:4}}>📍 {zone}</div>}{prixN&&<div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:4,flexWrap:"wrap"}}><span style={{fontSize:28,fontWeight:900,color:t.gold,fontFamily:MN}}>{fmt(prixN)}</span><span style={{fontSize:13,color:t.muted}}>CHF / nuit</span>{prixT&&<span style={{fontSize:13,color:t.muted}}>· {fmt(prixT)} CHF total</span>}</div>}</div>
        {noteNum&&<div style={{background:rC,borderRadius:"10px 10px 10px 0",padding:"10px 14px",textAlign:"center",minWidth:50}}><div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{noteNum}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.8)"}}>/ 10</div></div>}
      </div>
      {chambre&&<div style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,color:t.green,background:`${t.green}15`,border:`1px solid ${t.green}30`,borderRadius:20,padding:"3px 10px",marginBottom:12,fontFamily:FN}}>✓ {chambre}</div>}
      {prose.length>0&&<p style={{fontSize:13,color:t.muted,lineHeight:1.7,margin:"0 0 14px"}} dangerouslySetInnerHTML={{__html:renderInline(prose.join(" ").replace(/\*\*/g,""))}}/>}
      {chips.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{chips.map((c,i)=><span key={i} style={{fontSize:12,color:t.muted,background:t.card,border:`1px solid ${t.border}`,padding:"5px 12px",borderRadius:20,fontFamily:FN}}>✓ {c}</span>)}</div>}
      {linkM&&<a href={linkM[2]} target="_blank" rel="noopener" style={{display:"inline-block",padding:"12px 22px",background:t.gold,color:"#0a0a0a",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none"}}>Réserver ↗</a>}
    </div>}
  </div>);
}

// ── HÉBERGEMENTS (with destination tabs) ──
function HebergementDisplay({lines,t,mob}){
  // Split by destination headers: ### City (dates) or #### Hotel
  const dests=[];let curDest=null;let curHotel=null;
  for(const l of lines){
    const h3=l.match(/^###\s+([^#].*)/);const h4=l.match(/^####\s+(.+)/);
    if(h3&&!h4){if(curHotel&&curDest)curDest.hotels.push(curHotel);curHotel=null;if(curDest)dests.push(curDest);curDest={name:h3[1].trim(),hotels:[],lines:[]};}
    else if(h4){if(curHotel&&curDest)curDest.hotels.push(curHotel);curHotel={name:h4[1].trim(),lines:[]};}
    else if(curHotel)curHotel.lines.push(l);
    else if(curDest)curDest.lines.push(l);
  }
  if(curHotel&&curDest)curDest.hotels.push(curHotel);
  if(curDest)dests.push(curDest);

  // If no destination grouping, try ### as hotel names directly
  if(!dests.length){let h=null;const hotels=[];for(const l of lines){const hm=l.match(/^###\s+(.+)/);if(hm){if(h)hotels.push(h);h={name:hm[1].trim(),lines:[]};}else if(h)h.lines.push(l);}if(h)hotels.push(h);if(hotels.length)dests.push({name:"",hotels,lines:[]});}

  const[destIdx,setDestIdx]=useState(0);
  const hasTabs=dests.length>1;
  const activeDest=dests[destIdx]||dests[0];

  return(<div>
    {hasTabs&&<div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{dests.map((d,i)=><button key={i} onClick={()=>setDestIdx(i)} style={{padding:"8px 16px",borderRadius:20,border:`1px solid ${i===destIdx?t.gold:t.border}`,background:i===destIdx?t.goldBg2:"transparent",color:i===destIdx?t.gold:t.muted,fontSize:12,fontWeight:i===destIdx?700:400,cursor:"pointer",fontFamily:FN}}>{d.name||`Destination ${i+1}`}</button>)}</div>}
    {activeDest&&activeDest.hotels.map((h,i)=><HotelCard key={`${destIdx}-${i}`} name={h.name} lines={h.lines} t={t} mob={mob}/>)}
  </div>);
}

// ── TOTAUX ──
function TotauxDisplay({lines,t,mob}){const rows=parseTableRows(lines);const header=rows[0];const data=rows.slice(1);if(!data.length)return null;
return(<div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${t.border}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:mob?12:13,fontFamily:FN}}>{header&&<thead><tr style={{background:t.card2}}>{header.map((h,i)=><th key={i} style={{padding:mob?"8px 10px":"10px 14px",textAlign:"left",fontWeight:700,color:t.gold,fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",borderBottom:`2px solid ${t.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>}<tbody>{data.map((r,i)=><tr key={i} style={{background:i===0?t.goldBg:"transparent",borderBottom:`1px solid ${t.border}`}}>{r.map((c,j)=><td key={j} style={{padding:mob?"8px 10px":"12px 14px",color:j===r.length-1?t.gold:j===0?t.text:t.muted,fontWeight:j===0||j===r.length-1?700:400,fontFamily:j>0?MN:FN,whiteSpace:"nowrap"}}>{j>0?fmt(c):c}</td>)}</tr>)}</tbody></table></div>);}

// ── MÉTÉO (with destination tabs) ──
function MeteoDisplay({lines,t,mob}){
  const[destIdx,setDestIdx]=useState(0);
  // Split by ### destination headers
  const dests=[];let cur=null;
  for(const l of lines){const h3=l.match(/^###\s+(.+)/);if(h3){if(cur)dests.push(cur);cur={name:h3[1].trim(),lines:[]};}else if(cur)cur.lines.push(l);else{if(!cur)cur={name:"",lines:[]};cur.lines.push(l);}}
  if(cur)dests.push(cur);
  if(!dests.length)dests.push({name:"",lines});

  const hasTabs=dests.length>1;
  const active=dests[destIdx]||dests[0];
  const src=clean(active.lines.join("\n"));
  const temps=(src.match(/(\d{1,2})°/g)||[]).map(x=>parseInt(x)).filter(x=>x>0&&x<50);
  const maxT=temps.length?Math.max(...temps):null;
  const minT=temps.length>1?Math.min(...temps):null;
  const seaM=src.match(/(?:mer|ocean|eau)[^.]*?(\d{1,2})°/i);const seaT=seaM?seaM[1]:null;
  const prose=active.lines.filter(l=>{const s=l.trim();return s&&!/^###/.test(s)&&!/^\|/.test(s);});

  return(<div>
    {hasTabs&&<div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{dests.map((d,i)=><button key={i} onClick={()=>setDestIdx(i)} style={{padding:"8px 16px",borderRadius:20,border:`1px solid ${i===destIdx?t.gold:t.border}`,background:i===destIdx?t.goldBg2:"transparent",color:i===destIdx?t.gold:t.muted,fontSize:12,fontWeight:i===destIdx?700:400,cursor:"pointer",fontFamily:FN}}>{d.name||"Météo"}</button>)}</div>}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {maxT&&<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>☀️</div><div style={{fontSize:24,fontWeight:900,color:t.gold,fontFamily:MN}}>{maxT}°</div>{minT&&minT!==maxT&&<div style={{fontSize:11,color:t.muted,marginTop:2}}>min {minT}°</div>}<div style={{fontSize:10,color:t.muted,marginTop:3}}>Température</div></div>}
      {seaT&&<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>🌊</div><div style={{fontSize:24,fontWeight:900,color:t.blue,fontFamily:MN}}>{seaT}°</div><div style={{fontSize:10,color:t.muted,marginTop:3}}>Mer</div></div>}
      <div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>{/rare|sec|aucun.*pluie|minimal/i.test(src)?"☀️":"🌦️"}</div><div style={{fontSize:13,fontWeight:700,color:t.text}}>{/rare|sec|aucun.*pluie|minimal/i.test(src)?"Rares":"Modérées"}</div><div style={{fontSize:10,color:t.muted,marginTop:3}}>Précipitations</div></div>
      <div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>🕶</div><div style={{fontSize:13,fontWeight:700,color:t.text}}>{/élevé|fort|intense/i.test(src)?"Élevé":"Modéré"}</div><div style={{fontSize:10,color:t.muted,marginTop:3}}>UV</div></div>
    </div>
    {prose.map((l,i)=><p key={i} style={{margin:"0 0 6px",fontSize:13,color:t.muted,lineHeight:1.7,fontFamily:FN}} dangerouslySetInnerHTML={{__html:renderInline(l)}}/>)}
  </div>);
}

// ── CALENDRIER ──
function CalendrierDisplay({lines,t,mob}){const entries=[];for(const l of lines){const s=clean(l).trim();if(!s)continue;const bold=s.match(/^\*\*([^*]+)\*\*\s*[:\-·]\s*(.*)/);if(bold){entries.push({date:bold[1].trim(),act:bold[2].trim()});continue;}}
if(!entries.length){// Fallback: lines starting with dates
for(const l of lines){const s=l.trim();if(!s)continue;const dm=s.match(/^(\d{1,2}(?:er)?\s*(?:[-–]\s*\d{1,2})?\s*(?:jan|fév|mar|avr|mai|juin|juil|août|sept|oct|nov|déc)[a-zûé]*(?:\s+\d{4})?)\s*[:\-·]\s*(.*)/i);if(dm)entries.push({date:dm[1].trim(),act:dm[2].trim()});}}
if(!entries.length)return null;
const colors=[t.gold,"#e05555",t.blue,"#9b59b6",t.green,"#e67e22"];
return(<div style={{position:"relative"}}><div style={{position:"absolute",left:19,top:30,bottom:30,width:2,background:t.border}}/>{entries.map((e,i)=>{const isEnd=i===0||i===entries.length-1;const c=colors[i%colors.length];return<div key={i} style={{display:"flex",gap:mob?10:16,marginBottom:12,position:"relative"}}><div style={{width:40,height:40,borderRadius:"50%",background:isEnd?t.gold:t.card2,border:`2px solid ${isEnd?t.gold:c}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,marginTop:4}}><span style={{fontSize:14}}>{i===0?"🛫":i===entries.length-1?"🛬":"📍"}</span></div><div style={{flex:1,background:t.card2,border:`1px solid ${isEnd?t.gold:t.border}`,borderRadius:12,padding:"12px 16px"}}><div style={{fontSize:11,fontWeight:800,color:c,letterSpacing:"0.06em",marginBottom:3,fontFamily:FN}}>{e.date.toUpperCase()}</div><div style={{fontSize:13,color:t.muted,lineHeight:1.5}} dangerouslySetInnerHTML={{__html:renderInline(e.act)}}/></div></div>;})}</div>);}

// ── RECOMMANDATION ──
function RecoDisplay({lines,t}){const text=lines.filter(l=>l.trim()).map(l=>l.trim()).join(" ");return(<div style={{background:t.goldBg,border:`1px solid ${t.gold}25`,borderRadius:12,padding:20}}><div style={{fontSize:13,color:t.muted,lineHeight:1.7,fontFamily:FN}} dangerouslySetInnerHTML={{__html:renderInline(text)}}/></div>);}

// ── FIDÉLITÉ ──
function FideliteDisplay({lines,t}){const items=lines.filter(l=>l.trim()&&!/^#{1,4}/.test(l.trim())).map(l=>l.trim());return(<div style={{display:"flex",flexDirection:"column",gap:8}}>{items.filter(l=>l.length>5).map((item,i)=><div key={i} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:10,padding:"14px 16px",fontSize:13,color:t.muted,lineHeight:1.7}}><span style={{color:t.gold,marginRight:6}}>💳</span><span dangerouslySetInnerHTML={{__html:renderInline(item)}}/></div>)}</div>);}

// ═══════════════════════════════════════════════════════════════
// RESULTS VIEW — dispatcher
// ═══════════════════════════════════════════════════════════════
function ResultsView({text,t,mob}){const sections=parseSections(text);if(!sections.length)return<p style={{color:t.muted}}>{text}</p>;
return(<div>{sections.map((sec,i)=>{const ti=sec.title.toLowerCase();const isRecap=/récap/i.test(ti);const isVol=/vols?\b/i.test(ti)&&!/revolut|astuce|fidél/i.test(ti);const isHotel=/héberg/i.test(ti);const isTotal=/total|coût/i.test(ti);const isMeteo=/météo|meteo/i.test(ti);const isCal=/calendrier|planning/i.test(ti);const isReco=/recommand/i.test(ti);const isRev=/revolut|astuce|fidél/i.test(ti);
return(<Sec key={i} title={sec.title} t={t} mob={mob} defaultOpen={isRecap||isVol||isHotel} accent={isTotal}>{isRecap?<RecapDisplay lines={sec.lines} t={t} mob={mob}/>:isVol?<FlightDisplay lines={sec.lines} t={t} mob={mob}/>:isHotel?<HebergementDisplay lines={sec.lines} t={t} mob={mob}/>:isTotal?<TotauxDisplay lines={sec.lines} t={t} mob={mob}/>:isMeteo?<MeteoDisplay lines={sec.lines} t={t} mob={mob}/>:isCal?<CalendrierDisplay lines={sec.lines} t={t} mob={mob}/>:isReco?<RecoDisplay lines={sec.lines} t={t}/>:isRev?<FideliteDisplay lines={sec.lines} t={t}/>:<div>{sec.lines.filter(l=>l.trim()).map((l,j)=><p key={j} style={{margin:"0 0 6px",fontSize:13,color:t.muted,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:renderInline(l)}}/>)}</div>}</Sec>);})}</div>);}

// ═══════════════════════════════════════════════════════════════
// CHAT WIDGET
// ═══════════════════════════════════════════════════════════════
function ChatWidget({t,mob}){const[open,setOpen]=useState(false);const[msgs,setMsgs]=useState([{role:"assistant",content:"Posez-moi vos questions sur les vols, hôtels ou activités."}]);const[input,setInput]=useState("");const[loading,setLoading]=useState(false);const endRef=useRef(null);useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
const send=async()=>{if(!input.trim()||loading)return;const userMsg={role:"user",content:input};setMsgs(p=>[...p,userMsg]);setInput("");setLoading(true);try{const res=await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...msgs,userMsg]})});const data=await res.json();setMsgs(p=>[...p,{role:"assistant",content:data.text||"Désolé, erreur."}]);}catch{setMsgs(p=>[...p,{role:"assistant",content:"Erreur de connexion."}]);}setLoading(false);};
if(!open)return<button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:20,right:20,width:52,height:52,borderRadius:"50%",background:t.gold,border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,zIndex:1000,color:"#0a0a0a"}}>💬</button>;
const W=mob?`calc(100vw - 32px)`:"360px";
return(<div style={{position:"fixed",bottom:20,right:mob?16:20,width:W,height:mob?`calc(100vh - 100px)`:"480px",background:t.card,border:`1px solid ${t.border}`,borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:1000}}><div style={{padding:"14px 18px",borderBottom:`1px solid ${t.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:t.goldBg}}><span style={{fontSize:13,fontWeight:700,color:t.gold,fontFamily:FN}}>💬 Assistant voyage</span><button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:t.muted,fontSize:18,cursor:"pointer"}}>×</button></div><div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>{msgs.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?t.gold:t.card2,color:m.role==="user"?"#0a0a0a":t.text,fontSize:13,lineHeight:1.6,fontFamily:FN}}>{m.content}</div>)}{loading&&<div style={{alignSelf:"flex-start",padding:"10px 14px",borderRadius:14,background:t.card2,color:t.muted,fontSize:13}}>...</div>}<div ref={endRef}/></div><div style={{padding:"10px 14px",borderTop:`1px solid ${t.border}`,display:"flex",gap:8}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Votre question..." style={{flex:1,padding:"10px 14px",background:t.input,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:13,fontFamily:FN,outline:"none"}}/><button onClick={send} disabled={loading} style={{padding:"10px 16px",background:t.gold,border:"none",borderRadius:10,color:"#0a0a0a",fontWeight:700,cursor:"pointer",fontSize:13}}>↑</button></div></div>);}

// ═══════════════════════════════════════════════════════════════
// FORM COMPONENTS
// ═══════════════════════════════════════════════════════════════
function LoyaltySelector({selected,onChange,points,onPoints,t}){return(<div><div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:selected.length>0?14:0}}>{LOYALTY.map(p=>{const on=selected.includes(p.id);return<button key={p.id} onClick={()=>onChange(on?selected.filter(x=>x!==p.id):[...selected,p.id])} style={{padding:"6px 13px",borderRadius:20,border:`1px solid ${on?t.gold:t.border}`,background:on?t.goldBg2:"transparent",color:on?t.gold:t.muted,fontSize:11,cursor:"pointer",fontFamily:FN}}>{p.short}</button>;})}</div>{selected.length>0&&<div style={{background:t.card2,borderRadius:10,padding:"14px 16px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><Lbl t={t}>Points disponibles</Lbl><span style={{fontSize:14,fontWeight:800,color:t.gold,fontFamily:MN}}>{points>=100000?">100k":points.toLocaleString("fr-CH")} pts</span></div><input type="range" min="0" max="10" step="1" value={Math.max(0,POINTS_MARKS.findIndex(v=>v===points))} onChange={e=>onPoints(POINTS_MARKS[+e.target.value]||0)} style={{width:"100%",accentColor:t.gold,cursor:"pointer"}}/></div>}</div>);}

function DateFlexCell({value,onChange,flex,onFlexChange,t}){const S={width:"100%",boxSizing:"border-box",background:t.input,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:14,fontFamily:FN,padding:"13px 16px",outline:"none"};return(<div><input type="date" value={value} onChange={e=>onChange(e.target.value)} style={S}/><div style={{display:"flex",alignItems:"center",marginTop:5,gap:5}}><button onClick={()=>onFlexChange(0)} style={{fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:10,border:`1px solid ${flex===0?t.gold:t.border}`,background:flex===0?t.goldBg2:"transparent",color:flex===0?t.gold:t.muted,cursor:"pointer",whiteSpace:"nowrap"}}>EXACT</button><button onClick={()=>onFlexChange(flex===0?3:flex)} style={{fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:10,border:`1px solid ${flex>0?t.gold:t.border}`,background:flex>0?t.goldBg2:"transparent",color:flex>0?t.gold:t.muted,cursor:"pointer",whiteSpace:"nowrap"}}>{flex>0?`± ${flex}j`:"± JOURS"}</button></div>{flex>0&&<div style={{marginTop:7,padding:"10px 12px",background:t.card2,borderRadius:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,color:t.muted}}>FLEXIBILITÉ</span><span style={{fontSize:12,fontWeight:800,color:t.gold,fontFamily:MN}}>± {flex}j</span></div><input type="range" min="1" max="21" step="1" value={flex} onChange={e=>onFlexChange(+e.target.value)} style={{width:"100%",accentColor:t.gold,cursor:"pointer"}}/></div>}</div>);}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App(){
  const w=useW();const mob=w<700;
  const[isDark,setIsDark]=useState(true);const[showRaw,setShowRaw]=useState(false);const t=isDark?DARK:LIGHT;
  useEffect(()=>{document.body.style.background=t.bg;document.body.style.margin="0";document.documentElement.style.background=t.bg;},[t.bg]);
  const[activeTab,setActiveTab]=useState("trips");
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

  const buildPrompt=()=>{const airport=from==="OTHER"?fromCustom.toUpperCase():from;const vibeLabels=VIBES.filter(v=>vibes.includes(v.id)).map(v=>v.label).join(", ");const actLabels=ACTIVITIES.filter(a=>activities.includes(a.id)).map(a=>a.label).join(", ");const legLines=legs.filter(l=>l.to).map((l,i)=>{const fp=i===0?airport:(legs[i-1].to||airport);const parts=[`Vol ${i+1} : ${fp} -> ${l.to}`];if(l.depDate)parts.push(`départ ${l.depDate}${l.depFlex>0?` (flexible ±${l.depFlex} jours)`:""}`);if(l.retDate)parts.push(i===legs.length-1?`retour ${l.retDate}${l.retFlex>0?` (flexible ±${l.retFlex} jours)`:""}`:`arrivée ${l.retDate}${l.retFlex>0?` (flexible ±${l.retFlex} jours)`:""}`);return"✈️ "+parts.join(" - ");});const bagLabel=BAGGAGE_OPTIONS.find(b=>b.id===baggage)?.label||"";const loyaltyInfo=loyaltyCards.length>0?`🎫 Programmes : ${loyaltyCards.map(id=>LOYALTY.find(p=>p.id===id)?.short).join(", ")} - ${loyaltyPoints>=100000?">100k":loyaltyPoints.toLocaleString("fr-CH")} pts`:"";return["Planifie ce voyage, recherche tous les prix en temps réel. Utiliser uniquement le tiret simple ( - ) :",`Aéroport de base : ${airport}`,...legLines,`Voyageurs : ${travelers}`,baggage!=="no_pref"?`Bagages : ${bagLabel}`:"",loyaltyInfo,vibeLabels?`Ambiance : ${vibeLabels}`:"",actLabels?`Activités : ${actLabels}`:"",notes?`Notes : ${notes}`:"","","Tableau complet par vol, 3 scénarios de classe, totaux CHF, liens Booking/Kayak."].filter(Boolean).join("\n");};
  const go=async()=>{if(!legs[0].to||!legs[0].depDate){setErr("Au minimum : une destination et une date de départ.");return;}if(from==="OTHER"&&!fromCustom.trim()){setErr("Merci d'entrer le code IATA.");return;}setPhase("loading");setErr("");setResult("");try{const res=await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:buildPrompt()}]})});const data=await res.json();if(!res.ok||data.error)throw new Error(data.error||`Erreur ${res.status}`);setResult(data.text||"Aucun résultat.");setPhase("done");}catch(e){setErr(e.message);setPhase("error");}};
  const reset=()=>{setPhase("idle");setResult("");setErr("");setShowRaw(false);};

  // Mobile-friendly grid for form
  const formGrid=mob?"1fr":"minmax(0,1.2fr) 20px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) 36px";

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:mob?"1rem":"2rem 1.5rem",background:t.bg,minHeight:"100vh",fontFamily:FN,transition:"background 0.3s"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Theme toggle */}
      <div style={{position:"fixed",top:16,right:16,zIndex:1001}}><button onClick={()=>setIsDark(!isDark)} style={{width:40,height:40,borderRadius:"50%",border:`1px solid ${t.border}`,background:t.card,color:t.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",fontSize:16}}>{isDark?"☀️":"🌙"}</button></div>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div><div style={{fontSize:mob?28:36,fontWeight:900,letterSpacing:"-0.04em",color:t.text,lineHeight:1}}>WDC</div><div style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",color:t.gold,marginTop:1}}>AI TRAVEL</div></div>
        {!mob&&<div style={{fontSize:10,color:t.muted,textAlign:"right",lineHeight:1.9,marginTop:4}}><div>GVA - ZRH - MXP</div><div>CHF - 4★ - 8+/10</div></div>}
      </div>

      {phase!=="done"&&<>
        {/* Nav tabs */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>{[{id:"trips",label:"🗺 Trips"},{id:"vols",label:"✈️ Vols"},{id:"hotels",label:"🏨 Hébergements"}].map(tab=><button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:"9px 18px",borderRadius:20,border:`1px solid ${activeTab===tab.id?t.gold:t.border}`,background:activeTab===tab.id?t.gold:"transparent",color:activeTab===tab.id?"#0a0a0a":t.muted,fontSize:12,fontWeight:activeTab===tab.id?700:500,cursor:"pointer",fontFamily:FN}}>{tab.label}</button>)}</div>

        {/* Loyalty */}
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:mob?"14px 16px":"18px 22px",marginBottom:10}}><Lbl t={t}>Programmes de fidélité</Lbl><LoyaltySelector selected={loyaltyCards} onChange={setLoyaltyCards} points={loyaltyPoints} onPoints={setLoyaltyPoints} t={t}/></div>

        {/* Form */}
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:mob?"14px 16px":"20px 24px",borderBottom:`1px solid ${t.border}`,display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1.5fr",gap:16}}>
            <div><Lbl t={t}>Voyageurs</Lbl><select value={travelers} onChange={e=>setTravelers(e.target.value)} style={INP}>{[1,2,3,4,5,6,8,10].map(n=><option key={n} value={n}>{n} pers.</option>)}</select></div>
            <div><Lbl t={t}>Bagages</Lbl><select value={baggage} onChange={e=>setBaggage(e.target.value)} style={INP}>{BAGGAGE_OPTIONS.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select></div>
          </div>

          <div style={{padding:mob?"14px 16px":"20px 24px 8px"}}>
            {/* Mobile: stacked layout */}
            {mob?legs.map((leg,idx)=><div key={idx} style={{marginBottom:16,padding:16,background:t.card2,borderRadius:12,border:`1px solid ${t.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:11,fontWeight:700,color:t.gold,fontFamily:FN}}>ÉTAPE {idx+1}</span>{idx>0&&<button onClick={()=>removeLeg(idx)} style={{width:28,height:28,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",color:t.muted,fontSize:16,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}</div>
              <div style={{marginBottom:8}}><Lbl t={t}>Depuis</Lbl>{idx===0?<select value={from} onChange={e=>setFrom(e.target.value)} style={INP}>{AIRPORTS.map(a=><option key={a.code} value={a.code}>{a.code==="OTHER"?"Autre":`${a.code} - ${a.name}`}</option>)}</select>:<div style={{...INP_RO}}>{legs[idx-1].to||"-"}</div>}</div>
              <div style={{marginBottom:8}}><Lbl t={t}>Vers</Lbl><input value={leg.to} onChange={e=>updateLeg(idx,"to",e.target.value)} placeholder="Destination" style={INP}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><Lbl t={t}>Aller</Lbl><DateFlexCell value={leg.depDate} onChange={v=>updateLeg(idx,"depDate",v)} flex={leg.depFlex||0} onFlexChange={v=>updateLeg(idx,"depFlex",v)} t={t}/></div><div><Lbl t={t}>Retour</Lbl><DateFlexCell value={leg.retDate} onChange={v=>updateLeg(idx,"retDate",v)} flex={leg.retFlex||0} onFlexChange={v=>updateLeg(idx,"retFlex",v)} t={t}/></div></div>
            </div>)
            :<>{/* Desktop: grid layout */}
              <div style={{display:"grid",gridTemplateColumns:formGrid,gap:8,marginBottom:8}}><Lbl t={t}>Depuis</Lbl><div/><Lbl t={t}>Vers</Lbl><Lbl t={t}>Date aller</Lbl><Lbl t={t}>Date retour</Lbl><div/></div>
              {legs.map((leg,idx)=><div key={idx} style={{display:"grid",gridTemplateColumns:formGrid,gap:8,alignItems:"flex-start",marginBottom:8}}>
                {idx===0?<select value={from} onChange={e=>setFrom(e.target.value)} style={INP}>{AIRPORTS.map(a=><option key={a.code} value={a.code}>{a.code==="OTHER"?"✏ Autre":`${a.code} - ${a.name}`}</option>)}</select>:<div style={{...INP_RO,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{legs[idx-1].to||"-"}</div>}
                <div style={{textAlign:"center",color:t.gold,fontWeight:900,fontSize:16,paddingTop:13}}>→</div>
                <input value={leg.to} onChange={e=>updateLeg(idx,"to",e.target.value)} placeholder={["Marbella","Chicago","Costa Rica"][idx]||"Destination"} style={INP}/>
                <DateFlexCell value={leg.depDate} onChange={v=>updateLeg(idx,"depDate",v)} flex={leg.depFlex||0} onFlexChange={v=>updateLeg(idx,"depFlex",v)} t={t}/>
                <DateFlexCell value={leg.retDate} onChange={v=>updateLeg(idx,"retDate",v)} flex={leg.retFlex||0} onFlexChange={v=>updateLeg(idx,"retFlex",v)} t={t}/>
                {idx>0?<button onClick={()=>removeLeg(idx)} style={{width:36,height:36,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",color:t.muted,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8}}>×</button>:<div/>}
              </div>)}
            </>}
            {legs.length<5&&<button onClick={addLeg} style={{fontSize:11,padding:"7px 16px",border:`1px dashed ${t.border}`,background:"transparent",cursor:"pointer",color:t.muted,borderRadius:8,marginTop:4,marginBottom:8,fontFamily:FN}}>+ Ajouter une étape ({legs.length}/5)</button>}
          </div>
          <div style={{borderTop:`1px solid ${t.border}`}}/>
          <div style={{padding:mob?"14px 16px":"20px 24px 14px"}}><Lbl t={t}>Ambiance</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{VIBES.map(v=><ChipBtn key={v.id} label={v.label} selected={vibes.includes(v.id)} onClick={()=>setVibes(x=>x.includes(v.id)?x.filter(z=>z!==v.id):[...x,v.id])} t={t}/>)}</div></div>
          <div style={{padding:mob?"0 16px 14px":"0 24px 14px"}}><Lbl t={t}>Activités</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{ACTIVITIES.map(a=><ChipBtn key={a.id} label={a.label} selected={activities.includes(a.id)} onClick={()=>setActivities(x=>x.includes(a.id)?x.filter(z=>z!==a.id):[...x,a.id])} t={t}/>)}</div></div>
          <div style={{padding:mob?"0 16px 16px":"0 24px 20px"}}><Lbl t={t}>Notes spécifiques</Lbl><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Budget max, occasion spéciale..." style={{...INP,minHeight:52,resize:"vertical"}}/></div>
          {err&&<div style={{margin:mob?"0 16px 16px":"0 24px 16px",fontSize:13,color:"#ff7070",background:"rgba(255,100,100,0.1)",border:"1px solid rgba(255,100,100,0.25)",borderRadius:8,padding:"10px 14px"}}>⚠ {err}</div>}
          <div style={{padding:mob?"0 16px 16px":"0 24px 24px"}}><button onClick={go} disabled={phase==="loading"} style={{width:"100%",padding:16,background:phase==="loading"?t.faint:`linear-gradient(135deg,${t.gold},#d4b85c)`,color:phase==="loading"?t.muted:"#0a0a0a",border:"none",borderRadius:12,cursor:phase==="loading"?"not-allowed":"pointer",fontSize:12,fontWeight:800,letterSpacing:"0.18em",fontFamily:FN}}>{phase==="loading"?"RECHERCHE EN COURS...":"LANCER LA RECHERCHE"}</button></div>
        </div>
      </>}

      {/* Loading */}
      {phase==="loading"&&<div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:"3rem",textAlign:"center",marginTop:10}}><div style={{fontSize:44,marginBottom:"1rem"}}>✈️</div><div style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:t.text,marginBottom:8,fontFamily:FN}}>{TIPS[tipIdx].toUpperCase()}</div><div style={{display:"flex",justifyContent:"center",gap:6,marginTop:"1.5rem"}}>{TIPS.map((_,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===tipIdx?t.gold:t.border}}/>)}</div></div>}

      {/* Results */}
      {phase==="done"&&result&&<div style={{marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"baseline",gap:12}}><span style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:t.text,fontFamily:FN}}>RÉSULTATS</span><span style={{fontSize:10,color:t.muted}}>{new Date().toLocaleDateString("fr-CH",{day:"numeric",month:"long",year:"numeric"})}</span></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>setShowRaw(!showRaw)} style={{fontSize:10,fontWeight:700,padding:"6px 14px",background:"transparent",border:`1px solid ${showRaw?t.gold:t.border}`,borderRadius:6,cursor:"pointer",color:showRaw?t.gold:t.muted,fontFamily:FN}}>📋 BRUT</button><button onClick={()=>navigator.clipboard?.writeText(result)} style={{fontSize:10,fontWeight:700,padding:"6px 14px",background:"transparent",border:`1px solid ${t.border}`,borderRadius:6,cursor:"pointer",color:t.muted,fontFamily:FN}}>COPIER</button><button onClick={reset} style={{fontSize:10,fontWeight:700,padding:"6px 14px",background:t.gold,border:"none",borderRadius:6,cursor:"pointer",color:"#0a0a0a",fontFamily:FN}}>NOUVELLE RECHERCHE</button></div>
        </div>
        {showRaw&&<div style={{marginBottom:16,background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:16}}><div style={{fontSize:11,fontWeight:700,color:t.gold,marginBottom:8,fontFamily:FN}}>TEXTE BRUT — Copie et envoie-le sur Claude</div><textarea readOnly value={result} style={{width:"100%",minHeight:300,background:t.input,border:`1px solid ${t.border}`,borderRadius:8,color:t.text,fontSize:12,fontFamily:MN,padding:12,boxSizing:"border-box",resize:"vertical"}} onClick={e=>e.target.select()}/></div>}
        <ResultsView text={result} t={t} mob={mob}/>
      </div>}

      <div style={{marginTop:24,textAlign:"center",fontSize:10,color:t.faint,letterSpacing:"0.1em",fontFamily:MN}}>KAYAK · BOOKING · GOOGLE FLIGHTS · SKYSCANNER · MOMONDO · EXPEDIA</div>
      <ChatWidget t={t} mob={mob}/>
    </div>
  );
}
