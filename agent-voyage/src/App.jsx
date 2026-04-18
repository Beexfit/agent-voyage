import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// WDC AI TRAVEL v5 — parsers calibrated on actual API output
// ═══════════════════════════════════════════════════════════════

const AIRPORTS=[{code:"GVA",name:"Genève-Cointrin"},{code:"ZRH",name:"Zurich"},{code:"MXP",name:"Milan Malpensa"},{code:"CDG",name:"Paris CDG"},{code:"LHR",name:"Londres Heathrow"},{code:"BCN",name:"Barcelone"},{code:"FCO",name:"Rome Fiumicino"},{code:"AMS",name:"Amsterdam"},{code:"MAD",name:"Madrid"},{code:"DXB",name:"Dubai"},{code:"JFK",name:"New York JFK"},{code:"LAX",name:"Los Angeles"},{code:"BKK",name:"Bangkok"},{code:"SIN",name:"Singapour"},{code:"OTHER",name:"Autre"}];
const VIBES=[{id:"beach",label:"Plage"},{id:"city",label:"Ville"},{id:"nature",label:"Nature"},{id:"party",label:"Fête"},{id:"gastro",label:"Gastro"},{id:"spa",label:"Spa"},{id:"adventure",label:"Aventure"},{id:"romance",label:"Romance"},{id:"luxury",label:"Luxe"},{id:"family",label:"Famille"}];
const ACTIVITIES=[{id:"surf",label:"Surf"},{id:"golf",label:"Golf"},{id:"diving",label:"Plongée"},{id:"hiking",label:"Rando"},{id:"restaurants",label:"Restos"},{id:"shopping",label:"Shopping"},{id:"clubs",label:"Clubs"},{id:"yoga",label:"Yoga"},{id:"museums",label:"Musées"},{id:"sailing",label:"Voile"},{id:"snorkeling",label:"Snorkeling"},{id:"tennis",label:"Tennis"}];
const LOYALTY=[{id:"revolut_ultra",short:"Revolut Ultra"},{id:"amex_ch",short:"Amex"},{id:"ubs_infinite",short:"UBS Visa"},{id:"miles_more",short:"Miles & More"},{id:"marriott_bonvoy",short:"Marriott Bonvoy"},{id:"hilton_honors",short:"Hilton Honors"},{id:"world_of_hyatt",short:"World of Hyatt"},{id:"diners_club",short:"Diners Club"}];
const POINTS_MARKS=[0,5000,10000,15000,20000,25000,30000,40000,50000,75000,100000];
const BAGGAGE_OPTIONS=[{id:"no_pref",label:"Pas de préférence"},{id:"cabin_only",label:"Cabine seulement"},{id:"1_checked_23",label:"1 bagage 23 kg"},{id:"2_checked_23",label:"2 bagages 23 kg"},{id:"sport",label:"Bagage sport"}];
const TIPS=["Recherche des vols...","Consultation de Skyscanner...","Vérification des hôtels...","Comparaison Airbnb...","Calcul des scénarios...","Conversion CHF...","Analyse météo...","Finalisation..."];

const DARK={bg:"#0a0a0a",card:"#141414",card2:"#1c1c1c",input:"#202020",border:"#2a2218",text:"#f5f0e8",muted:"#999",faint:"#444",gold:"#c9a96e",goldD:"#a07840",goldBg:"rgba(201,169,110,0.06)",goldBg2:"rgba(201,169,110,0.12)",green:"#22c55e",red:"#ef4444",blue:"#5b9bd5"};
const LIGHT={bg:"#f5f3ef",card:"#ffffff",card2:"#f0ede7",input:"#faf9f7",border:"#e0dcd4",text:"#1a1a1a",muted:"#6a6560",faint:"#ccc",gold:"#a6872f",goldD:"#8a7535",goldBg:"rgba(166,135,47,0.06)",goldBg2:"rgba(166,135,47,0.12)",green:"#3a8f4a",red:"#c94444",blue:"#3a7abf"};
const FN="system-ui,-apple-system,sans-serif",MO="'SF Mono',monospace";
const fmt=n=>{try{const s=String(n).replace(/['\sCHFchf]/g,"").trim();const v=parseInt(s);return isNaN(v)?n:v.toLocaleString("fr-CH")}catch{return n}};

// ═══════════════════════════════════════════════════════════════
// TEXT PREPROCESSING — collapse multi-line table rows
// ═══════════════════════════════════════════════════════════════
function preprocess(raw){
  // Only step 1: collapse cited values (join non-pipe lines to pipe line above)
  let text=raw;
  for(let i=0;i<50;i++){const prev=text;text=text.replace(/(\|[^\n]*)\n\s*([^\n|#*\-][^\n]{0,80})/gm,"$1 $2");if(text===prev)break;}
  return text;
}

function parseSections(text){const pp=preprocess(text);const lines=pp.split("\n");const secs=[];let cur=null;for(const l of lines){const h2=l.match(/^## (.+)/);if(h2){if(cur)secs.push(cur);cur={title:h2[1].trim(),lines:[]};}else if(cur)cur.lines.push(l);}if(cur)secs.push(cur);return secs;}
function parseRows(lines){const rows=[];for(const l of lines){const s=l.trim();if(s.startsWith("|")&&s.endsWith("|")&&!s.match(/^[\|\s:\-]+$/)){const cells=s.split("|").slice(1,-1).map(c=>c.trim());if(cells.length>=2)rows.push(cells);}}return rows;}
// Flight parser: collects ALL cell values from pipe fragments, groups by column count
function parseFlightRows(lines){let colCount=8;const sep=lines.find(l=>/^\|[\s:\-|]+\|$/.test(l.trim()));if(sep)colCount=(sep.match(/\|/g)||[]).length-1;let pastSep=!sep;const allCells=[];for(const l of lines){const s=l.trim();if(/^\|[\s:\-|]+\|$/.test(s)){pastSep=true;continue;}if(!pastSep&&s.startsWith("|")){continue;}if(!pastSep||s.startsWith("#")||!s)continue;if(s.includes("|")){const parts=s.split("|");const cells=parts.slice(s.startsWith("|")?1:0).map(c=>c.trim());while(cells.length&&cells[cells.length-1]==="")cells.pop();allCells.push(...cells);}else if(allCells.length){allCells[allCells.length-1]+=" "+s;}}const rows=[];for(let i=0;i<allCells.length;i+=colCount){const r=allCells.slice(i,i+colCount);if(r.length>=3)rows.push(r);}return rows;}
function parseKV(lines){const d={};const rows=parseRows(lines);for(const r of rows){if(r.length>=2&&r[0])d[r[0]]=r[1];}return d;}
function titleIcon(t){const m=t.match(/^([\u{1F300}-\u{1FFFF}][\uFE0F\u200D]*)+\s*/u);return m?{icon:m[0].trim(),label:t.slice(m[0].length).trim()}:{icon:"",label:t};}
function inline(s){return(s||"").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,`<a href="$2" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">$1 ↗</a>`);}

// ── UI ──
function Sec({icon,title,children,t,open:defO=false,accent}){const[o,setO]=useState(defO);const{icon:ti,label}=typeof title==="string"?titleIcon(title):{icon:"",label:title};return(<div style={{background:t.card,border:`1px solid ${accent?t.gold:t.border}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}><button onClick={()=>setO(x=>!x)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",background:"none",border:"none",cursor:"pointer",borderBottom:o?`1px solid ${t.border}`:"none"}}><div style={{display:"flex",alignItems:"center",gap:10}}>{(icon||ti)&&<span style={{fontSize:16}}>{icon||ti}</span>}<span style={{fontSize:13,fontWeight:700,color:accent?t.gold:t.text,fontFamily:FN}}>{label}</span></div><span style={{color:t.muted,fontSize:16}}>{o?"−":"+"}</span></button>{o&&<div style={{padding:"14px 20px"}}>{children}</div>}</div>);}
function Lbl({children,t}){return<div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:t.muted,marginBottom:6,textTransform:"uppercase",fontFamily:FN}}>{children}</div>;}
function Chip({label,on,onClick,t}){return<button type="button" onClick={onClick} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${on?t.gold:t.border}`,background:on?t.goldBg2:"transparent",color:on?t.gold:t.muted,fontSize:12,cursor:"pointer",fontFamily:FN,whiteSpace:"nowrap"}}>{label}</button>;}
function Tabs({items,active,onChange,t}){return<div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{items.map((l,i)=><button key={i} onClick={()=>onChange(i)} style={{padding:"8px 16px",borderRadius:20,border:`1px solid ${i===active?t.gold:t.border}`,background:i===active?t.goldBg2:"transparent",color:i===active?t.gold:t.muted,fontSize:12,fontWeight:i===active?700:400,cursor:"pointer",fontFamily:FN}}>{l}</button>)}</div>;}

// ═══════════════════════════════════════════════════════════════
// RECAP — KV table format: | Critère | Détail |
// ═══════════════════════════════════════════════════════════════
function RecapDisplay({lines,t}){
  const rows=parseRows(lines);const isKV=rows[0]&&/crit|détail/i.test(rows[0].join(" "));
  const data=isKV?rows.slice(1):rows.slice(1); // skip header
  if(!data.length)return null;
  // Extract key info
  let nights=0,voy="1";
  for(const r of data){const all=r.join(" ");
    const nm=all.match(/(\d+)\s*nuit/g);if(nm)nm.forEach(x=>{const n=parseInt(x);if(!isNaN(n))nights+=n;});
    if(/personne|voyag/i.test(all)){const m=all.match(/(\d+)\s*personne/i)||all.match(/(\d+)\s*voyag/i);if(m)voy=m[1];}
  }
  // Also check header row for column-based format
  if(!nights&&rows[0]){const hdr=rows[0];for(let i=0;i<hdr.length;i++){if(/dur|nuit/i.test(hdr[i])){for(const r of data){const nm=(r[i]||"").match(/(\d+)/);if(nm)nights+=parseInt(nm[1])||0;}}if(/voyag|pers/i.test(hdr[i])){for(const r of data){const m=(r[i]||"").match(/(\d+)/);if(m)voy=m[1];}}}}
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <div style={{background:t.goldBg,border:`1px solid ${t.border}`,borderRadius:12,padding:"20px 16px",textAlign:"center"}}><div style={{fontSize:12,fontWeight:600,color:t.goldD,letterSpacing:"0.08em",marginBottom:8}}>NUITS</div><div style={{fontSize:32,fontWeight:900,color:t.text}}>{nights||"–"}</div></div>
      <div style={{background:`${t.blue}10`,border:`1px solid ${t.border}`,borderRadius:12,padding:"20px 16px",textAlign:"center"}}><div style={{fontSize:12,fontWeight:600,color:t.blue,letterSpacing:"0.08em",marginBottom:8}}>VOYAGEUR</div><div style={{fontSize:32,fontWeight:900,color:t.text}}>{voy}</div></div>
    </div>
    <div style={{borderRadius:12,border:`1px solid ${t.border}`,overflow:"hidden"}}>
      {isKV?data.map((r,i)=><div key={i} style={{display:"flex",borderBottom:i<data.length-1?`1px solid ${t.border}`:"none",padding:"12px 14px"}}><div style={{width:130,flexShrink:0,fontSize:13,fontWeight:600,color:t.text}}>{r[0]}</div><div style={{fontSize:13,color:t.muted,lineHeight:1.5}}>{r[1]}</div></div>)
      :<>{rows[0]&&<div style={{display:"flex",background:t.card2,borderBottom:`2px solid ${t.border}`}}>{rows[0].map((h,j)=><div key={j} style={{flex:1,padding:"10px 14px",fontSize:10,fontWeight:700,color:t.gold,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</div>)}</div>}{data.map((r,i)=><div key={i} style={{display:"flex",borderBottom:i<data.length-1?`1px solid ${t.border}`:"none"}}>{r.map((c,j)=><div key={j} style={{flex:1,padding:"12px 14px",fontSize:13,color:j===0?t.text:t.muted,fontWeight:j===0?600:400}}>{c}</div>)}</div>)}</>}
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// FLIGHTS — ### Vol N headers, 8-col tables, class tabs filter
// ═══════════════════════════════════════════════════════════════
function FlightDisplay({lines,t}){
  const[cls,setCls]=useState("business");
  // Split by ### Vol headers, use parseFlightRows for each section
  const vols=[];let cur=null;
  for(const l of lines){const h=l.match(/^###\s+(.+)/);if(h){if(cur)vols.push(cur);cur={title:h[1].trim(),lines:[]};}else if(cur)cur.lines.push(l);else if(!cur){cur={title:"",lines:[]};cur.lines.push(l);}}
  if(cur)vols.push(cur);
  // Parse rows for each vol section
  for(const vol of vols)vol.rows=parseFlightRows(vol.lines);

  const match=(scenario,c)=>{const s=scenario.toLowerCase();if(c==="business")return/business|💺/i.test(s)&&!/éco|eco|🔀/i.test(s);if(c==="mixte")return/mixte|🔀|éco.*biz|biz.*retour/i.test(s);return/économie|🪑|full éco/i.test(s);};
  const tabs=[{id:"business",e:"",l:"Business"},{id:"mixte",e:"",l:"Mixte"},{id:"eco",e:"",l:"Économie"}];

  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderRadius:12,overflow:"hidden",border:`1px solid ${t.border}`,marginBottom:20}}>{tabs.map((tab,i)=><button key={tab.id} onClick={()=>setCls(tab.id)} style={{padding:"14px 8px",textAlign:"center",background:cls===tab.id?t.goldBg2:t.card2,color:cls===tab.id?t.gold:t.muted,border:"none",borderBottom:cls===tab.id?`2px solid ${t.gold}`:"2px solid transparent",borderLeft:i>0?`1px solid ${t.border}`:"none",cursor:"pointer",fontFamily:FN,fontSize:12,fontWeight:700}}>{tab.l}</button>)}</div>
    {vols.filter(v=>v.rows.length>0).map((vol,vi)=>{
      const filtered=vol.rows.filter(r=>match(r[0]||"",cls));
      if(!filtered.length)return<div key={vi} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:20,marginBottom:12,textAlign:"center"}}>{vol.title&&<div style={{fontSize:12,fontWeight:700,color:t.gold,marginBottom:8}}>{vol.title}</div>}<div style={{color:t.muted,fontSize:13}}>Pas de vol dans cette classe</div></div>;
      return(<div key={vi} style={{marginBottom:16}}>
        {vol.title&&<div style={{padding:"12px 18px",background:t.goldBg,border:`1px solid ${t.border}`,borderRadius:"12px 12px 0 0"}}><span style={{fontSize:12,fontWeight:800,color:t.gold,letterSpacing:"0.06em"}}>{vol.title}</span></div>}
        {filtered.map((row,ri)=>{
          // Dynamic columns: 7 cols = Scénario|Compagnie|Routing|Durée|Escales|Prix|Lien
          //                  8 cols = Scénario|Compagnie|Routing|Départ/Arrivée|Durée|Escales|Prix|Lien
          const n=row.length;const has8=n>=8;
          const scenario=row[0]||"";const compagnie=row[1]||"";const routing=row[2]||"";
          const depArr=has8?(row[3]||""):"";
          const duree=row[has8?4:3]||"";const escales=row[has8?5:4]||"";
          const prix=row[has8?6:5]||"0";
          const linkCell=row[has8?7:6]||"";const linkM=linkCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
          const airports=routing.split(/[-→>]/).map(s=>s.trim()).filter(Boolean);
          const esc=parseInt(escales)||0;

          return(<div key={ri} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:vol.title?(ri===filtered.length-1?"0 0 12px 12px":"0"):"12px",padding:"20px",borderTop:vol.title||ri>0?"none":undefined}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div><div style={{fontSize:16,fontWeight:800,color:t.text}}>{compagnie}</div><div style={{fontSize:11,color:t.muted,marginTop:2}}>{depArr}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:24,fontWeight:900,color:t.gold,fontFamily:MO}}>{fmt(prix)}</div><div style={{fontSize:11,color:t.muted}}>CHF / pers</div></div>
            </div>
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"16px 20px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:18,fontWeight:800,color:t.text,fontFamily:MO}}>{airports[0]||""}</div>
                <div style={{flex:1,display:"flex",alignItems:"center",margin:"0 12px"}}><div style={{flex:1,height:1,background:t.border}}/>{esc>0&&<div style={{padding:"2px 10px",borderRadius:20,background:t.goldBg2,border:`1px solid ${t.gold}40`,fontSize:10,fontWeight:600,color:t.gold,margin:"0 8px",whiteSpace:"nowrap"}}>{esc} escale{esc>1?"s":""}</div>}<div style={{flex:1,height:1,background:t.border}}/></div>
                <div style={{fontSize:18,fontWeight:800,color:t.text,fontFamily:MO}}>{airports[airports.length-1]||""}</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:t.muted}}>{routing}</span><span style={{fontSize:12,fontWeight:600,color:t.text}}>⏱ {duree}</span></div>
            </div>
            {linkM&&<a href={linkM[2]} target="_blank" rel="noopener" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",background:t.gold,color:"#0a0a0a",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none"}}>{linkM[1]} ↗</a>}
          </div>);
        })}
      </div>);
    })}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// HOTELS — ### City (dates) → #### Hotel → IMAGES: → KV table
// ═══════════════════════════════════════════════════════════════
function HotelCard({name,lines,t}){
  const[open,setOpen]=useState(true);
  // Extract IMAGES: line
  let imgs=[];for(const l of lines){const m=l.match(/^IMAGES:\s*(.+)/i);if(m){imgs=m[1].split("|").map(u=>u.trim()).filter(u=>u.startsWith("http"));break;}}
  // KV data
  const kv={};const rows=parseRows(lines);for(const r of rows){if(r.length>=2)kv[r[0].toLowerCase()]=r[1];}
  const get=k=>{for(const[key,val]of Object.entries(kv)){if(key.includes(k))return val;}return"";};
  const stars=(get("étoile")||get("etoile")||"").replace(/[^★]/g,"").length||0;
  const note=get("note");const noteNum=note.match(/(\d+\.?\d*)/)?.[1]||"";
  const zone=get("zone")||get("emplac");const chambre=get("chambre");
  const equip=get("équip")||get("equip");const prixNuit=get("prix/nuit")||get("prix_nuit");
  const prixTotal=get("prix total")||get("prix_total");
  const pN=prixNuit.match(/(\d[\d'\s]*)/)?.[1]?.replace(/['\s]/g,"")||"";
  const pT=prixTotal.match(/(\d[\d'\s]*)/)?.[1]?.replace(/['\s]/g,"")||"";
  const petitDej=get("petit");const piscine=get("piscine");const spa=get("spa");const vue=get("vue");
  const lien=get("lien")||"";const linkM=lien.match(/\[([^\]]+)\]\(([^)]+)\)/);
  // Prose (non-table, non-IMAGES)
  const prose=lines.filter(l=>{const s=l.trim();return s&&!/^\|/.test(s)&&!/^#/.test(s)&&!/^IMAGES:/i.test(s)&&!/^http/i.test(s);}).slice(0,3);
  // Chips
  // Build chips - aim for 5-6 indicators minimum
  const chips=[];
  // From equipements field
  if(equip)equip.split(",").forEach(s=>{const v=s.trim();if(v.length>2)chips.push(v);});
  // Dedicated fields
  if(piscine&&!/non/i.test(piscine)){const detail=piscine.replace(/oui\s*[-–]?\s*/i,"").trim();chips.push(detail||"Piscine");}
  if(spa&&!/non/i.test(spa)){const detail=spa.replace(/oui\s*[-–]?\s*/i,"").trim();chips.push(detail||"Spa");}
  if(petitDej){if(/inclus|gratuit|oui/i.test(petitDej))chips.push("Petit-déjeuner inclus");else if(/option/i.test(petitDej))chips.push("Petit-déjeuner en option");}
  if(vue)chips.push(vue.split(",")[0].substring(0,35));
  if(chambre&&!chips.some(c=>/chambre/i.test(c)))chips.push(chambre.split(",")[0].substring(0,35));
  // Fallback extras if <5 chips: infer from hotel name and description
  const allText=(prose.join(" ")+" "+equip+" "+name).toLowerCase();
  if(chips.length<6&&/wifi|wi-fi/i.test(allText)&&!chips.some(c=>/wifi/i.test(c)))chips.push("WiFi gratuit");
  if(chips.length<6&&/climati/i.test(allText)&&!chips.some(c=>/clim/i.test(c)))chips.push("Climatisation");
  if(chips.length<6&&/fitness|gym|sport/i.test(allText)&&!chips.some(c=>/fitness|gym/i.test(c)))chips.push("Fitness center");
  if(chips.length<6&&/concierge/i.test(allText))chips.push("Conciergerie");
  if(chips.length<6&&/restaurant/i.test(allText)&&!chips.some(c=>/restau/i.test(c)))chips.push("Restaurant");
  if(chips.length<6&&/bar/i.test(allText)&&!chips.some(c=>/bar/i.test(c)))chips.push("Bar");
  if(chips.length<6)chips.push("Lit double");
  if(chips.length<6)chips.push("Salle de bain privée");
  const rN=parseFloat(noteNum||"0");const rC=rN>=9?"#16a34a":rN>=8?"#1d8348":"#2e7d32";
  // Image: try API url first, then picsum.photos (always works)
  const seed=encodeURIComponent(name.replace(/[^\w]/g,"").substring(0,20));
  const fallbackImg=`https://picsum.photos/seed/${seed}/800/400`;
  const[imgSrc,setImgSrc]=useState(imgs[0]||fallbackImg);
  const[imgFail,setImgFail]=useState(0);
  const onImgErr=()=>{if(imgFail===0&&imgs[0]){setImgSrc(fallbackImg);setImgFail(1);}else{setImgFail(2);}};

  return(<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
    <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"none",border:"none",cursor:"pointer",borderBottom:open?`1px solid ${t.border}`:"none"}}><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>{stars>0&&<span style={{color:t.gold,fontSize:12}}>{"★".repeat(stars)}</span>}<span style={{fontSize:15,fontWeight:700,color:t.text}}>{name}</span></div><span style={{color:t.muted,fontSize:16}}>{open?"−":"+"}</span></button>
    {open&&<>
      <div style={{height:200,overflow:"hidden",position:"relative"}}>
        {imgFail<2?<img src={imgSrc} alt={name} onError={onImgErr} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#1a1f3c,#0f3460)",color:"rgba(255,255,255,0.5)",fontSize:12,textAlign:"center"}}><div>Photos sur le site officiel</div></div>}
        {imgs.length>1&&<div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.7)",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#fff"}}>{imgs.length} photos</div>}
      </div>
      <div style={{padding:"16px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:12}}>
          <div style={{flex:1,minWidth:180}}>{zone&&<div style={{fontSize:13,color:t.muted,marginBottom:6}}>{zone}</div>}{pN&&<div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}><span style={{fontSize:26,fontWeight:900,color:t.gold,fontFamily:MO}}>{fmt(pN)}</span><span style={{fontSize:13,color:t.muted}}>CHF / nuit</span>{pT&&<span style={{fontSize:13,color:t.muted}}>· {fmt(pT)} CHF total</span>}</div>}</div>
          {noteNum&&<div style={{background:rC,borderRadius:"10px 10px 10px 0",padding:"10px 14px",textAlign:"center",minWidth:50}}><div style={{fontSize:20,fontWeight:900,color:"#fff"}}>{noteNum}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.8)"}}>/ 10</div></div>}
        </div>
        {chambre&&<div style={{display:"inline-flex",fontSize:12,color:t.green,background:`${t.green}15`,border:`1px solid ${t.green}30`,borderRadius:20,padding:"4px 12px",marginBottom:12}}>✓ {chambre}</div>}
        {prose.length>0&&<p style={{fontSize:13,color:t.muted,lineHeight:1.7,margin:"8px 0 14px"}} dangerouslySetInnerHTML={{__html:inline(prose.join(" ").replace(/\*\*/g,""))}}/>}
        {chips.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{chips.slice(0,8).map((c,i)=><span key={i} style={{fontSize:11,color:t.muted,background:t.card,border:`1px solid ${t.border}`,padding:"5px 12px",borderRadius:20}}>✓ {c}</span>)}</div>}
        {linkM&&<a href={linkM[2]} target="_blank" rel="noopener" style={{display:"inline-block",padding:"12px 22px",background:t.gold,color:"#0a0a0a",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none"}}>Réserver ↗</a>}
      </div>
    </>}
  </div>);
}

function HebergementDisplay({lines,t}){
  const[destIdx,setDestIdx]=useState(0);
  const dests=[];let curD=null;let curH=null;
  for(const l of lines){const h3=l.match(/^###\s+([^#]+)/);const h4=l.match(/^####\s+(.+)/);
    if(h3&&!h4){if(curH&&curD){curD.hotels.push(curH);curH=null;}if(curD)dests.push(curD);curD={name:h3[1].trim(),hotels:[]};}
    else if(h4){if(curH&&curD)curD.hotels.push(curH);curH={name:h4[1].trim(),lines:[]};}
    else if(curH)curH.lines.push(l);
    else if(curD)(curD.lines=curD.lines||[]).push(l);
  }
  if(curH&&curD)curD.hotels.push(curH);if(curD)dests.push(curD);
  // Fallback: ### = hotels directly
  if(!dests.length||dests.every(d=>!d.hotels||!d.hotels.length)){const hs=[];let h=null;for(const l of lines){const hm=l.match(/^###\s+(.+)/);if(hm){if(h)hs.push(h);h={name:hm[1].trim(),lines:[]};}else if(h)h.lines.push(l);}if(h)hs.push(h);if(hs.length){dests.length=0;dests.push({name:"",hotels:hs});}}
  const hasTabs=dests.length>1;const active=dests[destIdx]||dests[0]||{hotels:[]};
  return(<div>{hasTabs&&<Tabs items={dests.map(d=>d.name)} active={destIdx} onChange={setDestIdx} t={t}/>}{(active.hotels||[]).map((h,i)=><HotelCard key={`${destIdx}-${i}`} name={h.name} lines={h.lines} t={t}/>)}</div>);
}

// ═══════════════════════════════════════════════════════════════
// TOTAUX — 3 scenario tabs + breakdown + activities
// ═══════════════════════════════════════════════════════════════
function TotauxDisplay({lines,t}){
  const rows=parseRows(lines);const header=rows[0];const data=rows.slice(1);
  const[idx,setIdx]=useState(0);
  if(!data.length)return null;const active=data[idx]||data[0];
  const totalVal=parseInt(String(active[active.length-1]||"0").replace(/['\sCHFchf]/g,""))||0;
  const actEst=Math.round(totalVal*0.12/100)*100;
  // Parse individual cost columns (skip scenario name and total)
  const costs=[];
  if(header)for(let i=1;i<header.length-1;i++){const val=active[i]||"";if(val){const num=parseInt(String(val).replace(/[^\d]/g,""))||0;const detail=val.match(/\(([^)]+)\)/)?.[1]||"";costs.push({label:header[i],value:num,detail,raw:val});}}

  return(<div>
    {/* === SCENARIO TABS === */}
    <div style={{display:"grid",gridTemplateColumns:`repeat(${data.length},1fr)`,gap:0,marginBottom:24}}>
      {data.map((r,i)=>{const on=i===idx;const total=r[r.length-1]||"";const name=(r[0]||"").replace(/💺|🔀|🪑/g,"").trim();
      return<button key={i} onClick={()=>setIdx(i)} style={{padding:"20px 12px",textAlign:"center",background:on?t.card2:t.card,border:`1px solid ${on?t.gold:t.border}`,borderRadius:i===0?"14px 0 0 14px":i===data.length-1?"0 14px 14px 0":"0",cursor:"pointer",position:"relative",borderLeft:i>0?"none":undefined}}>
        {on&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:t.gold,borderRadius:i===0?"14px 0 0 0":i===data.length-1?"0 14px 0 0":"0"}}/>}
        <div style={{fontSize:10,fontWeight:600,color:on?t.gold:t.muted,letterSpacing:"0.06em",lineHeight:1.4,marginBottom:8}}>{name.toUpperCase()}</div>
        <div style={{fontSize:26,fontWeight:900,color:on?t.gold:t.muted,fontFamily:MO}}>{fmt(total)}</div>
        <div style={{fontSize:10,color:on?t.gold:t.muted,marginTop:2}}>CHF total</div>
      </button>})}
    </div>

    {/* === BREAKDOWN CARD === */}
    <div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:14,overflow:"hidden"}}>
      {costs.map((c,i)=>{
        const pct=totalVal>0?Math.round(c.value/totalVal*100):0;
        const barColor=i===0?t.gold:i===1?t.blue:"#9b59b6";
        return<div key={i} style={{padding:"18px 22px",borderBottom:`1px solid ${t.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontSize:13,fontWeight:600,color:t.text}}>{c.label.replace(/CHF/gi,"").trim()}</div>{c.detail&&<div style={{fontSize:11,color:t.muted,marginTop:2}}>{c.detail}</div>}</div>
            <div style={{textAlign:"right"}}><span style={{fontSize:18,fontWeight:800,color:t.text,fontFamily:MO}}>{fmt(c.value)}</span><span style={{fontSize:12,color:t.muted,marginLeft:4}}>CHF</span></div>
          </div>
          <div style={{height:4,background:t.border,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:2}}/></div>
        </div>;
      })}

      {/* TOTAL */}
      <div style={{padding:"20px 22px",background:t.goldBg,display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${t.border}`}}>
        <div style={{fontSize:14,fontWeight:800,color:t.gold,letterSpacing:"0.04em"}}>TOTAL</div>
        <div><span style={{fontSize:28,fontWeight:900,color:t.gold,fontFamily:MO}}>{fmt(totalVal)}</span><span style={{fontSize:14,color:t.gold,marginLeft:6}}>CHF</span></div>
      </div>

      {/* ACTIVITIES ESTIMATE */}
      {actEst>0&&<div style={{padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:13,fontWeight:500,color:t.muted}}>Budget activités estimé</div><div style={{fontSize:10,color:t.faint,marginTop:2}}>Restaurants, excursions, transports locaux (~12%)</div></div>
        <div><span style={{fontSize:15,fontWeight:700,color:t.muted,fontFamily:MO}}>~{fmt(actEst)}</span><span style={{fontSize:11,color:t.muted,marginLeft:4}}>CHF</span></div>
      </div>}
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// MÉTÉO — ### City (Month) tabs
// ═══════════════════════════════════════════════════════════════
function MeteoDisplay({lines,t}){
  const[idx,setIdx]=useState(0);const dests=[];let cur=null;
  for(const l of lines){const h=l.match(/^###\s+(.+)/);if(h){if(cur)dests.push(cur);cur={name:h[1].trim(),lines:[]};}else{if(!cur)cur={name:"",lines:[]};cur.lines.push(l);}}
  if(cur)dests.push(cur);
  // Also split by **City ...** bold
  if(dests.length<=1){const all=(dests[0]||{lines}).lines||lines;const nd=[];let cd=null;
  for(const l of all){const bm=l.match(/^\*\*([A-ZÀ-Ÿ][^*]+)\*\*\s*[:\-]/);if(bm){if(cd&&cd.lines.length)nd.push(cd);cd={name:bm[1].trim(),lines:[l]};}else if(cd)cd.lines.push(l);}
  if(cd&&cd.lines.length)nd.push(cd);if(nd.length>1){dests.length=0;dests.push(...nd);}}
  const filtered=dests.filter(d=>d.name||dests.length===1);if(!filtered.length&&dests.length)filtered.push(dests[0]);
  const active=filtered[idx]||filtered[0]||{lines:[]};const src=active.lines.join("\n");
  const temps=(src.match(/(\d{1,2})°/g)||[]).map(x=>parseInt(x)).filter(x=>x>0&&x<50);
  const maxT=temps.length?Math.max(...temps):null;const minT=temps.length>1?Math.min(...temps):null;
  const seaM=src.match(/(?:mer|ocean|eau)[^.]*?(\d{1,2})°/i);const seaT=seaM?seaM[1]:null;
  const prose=active.lines.filter(l=>{const s=l.trim();return s&&!/^###/.test(s)&&!/^\|/.test(s)&&s.length>5;});
  return(<div>
    {filtered.length>1&&<Tabs items={filtered.map(d=>d.name||"Météo")} active={idx} onChange={setIdx} t={t}/>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      {maxT&&<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:600,color:t.goldD,letterSpacing:"0.08em",marginBottom:8}}>TEMP.</div><div style={{fontSize:24,fontWeight:900,color:t.gold,fontFamily:MO}}>{maxT}°</div>{minT&&minT!==maxT&&<div style={{fontSize:11,color:t.muted,marginTop:2}}>min {minT}°</div>}</div>}
      {seaT&&<div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:600,color:t.blue,letterSpacing:"0.08em",marginBottom:8}}>MER</div><div style={{fontSize:24,fontWeight:900,color:t.blue,fontFamily:MO}}>{seaT}°</div></div>}
      <div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:600,color:t.muted,letterSpacing:"0.08em",marginBottom:8}}>PLUIE</div><div style={{fontSize:13,fontWeight:700,color:t.text}}>{/rare|sec|aucun/i.test(src)?"Rares":"Modérées"}</div></div>
      <div style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px 12px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:600,color:t.muted,letterSpacing:"0.08em",marginBottom:8}}>UV</div><div style={{fontSize:13,fontWeight:700,color:t.text}}>{/élevé|fort/i.test(src)?"Élevé":"Modéré"}</div></div>
    </div>
    {prose.map((l,i)=><p key={i} style={{margin:"0 0 6px",fontSize:13,color:t.muted,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:inline(l)}}/>)}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// CALENDRIER — **date**: activity  OR  **date:** activity
// ═══════════════════════════════════════════════════════════════
function CalendrierDisplay({lines,t}){
  const entries=[];let currentGroup="";
  // First: try to parse as table (| Date | Lieu | Activité |)
  const tableRows=parseRows(lines);
  if(tableRows.length>1){
    const hdr=tableRows[0];const data=tableRows.slice(1);
    // Skip header if it looks like column names
    const isHdr=/date|jour|lieu|activ/i.test(hdr.join(" "));
    const rows=isHdr?data:tableRows;
    for(const r of rows){const date=r[0]||"";const rest=r.slice(1).filter(c=>c).join(" - ");entries.push({date:date.trim(),act:rest.trim()});}
  }
  // Then: parse bold/bullet formats
  if(!entries.length){for(const l of lines){const s=l.trim();if(!s||/^\|/.test(s))continue;
    const hdr=s.match(/^\*\*([^*]+)\*\*\s*$/);
    if(hdr){entries.push({date:hdr[1].trim(),act:"",isHeader:true});continue;}
    const bold=s.match(/^\*\*([^*]+)\*\*\s*[:\-·]?\s*(.*)/);
    if(bold){const date=bold[1].replace(/[:\-·]\s*$/,"").trim();const act=bold[2]?.trim()||"";if(date.length>2)entries.push({date,act});continue;}
    const bullet=s.match(/^[-•]\s*(.+?)\s*:\s*(.*)/);
    if(bullet&&bullet[1].length>2){entries.push({date:bullet[1].trim(),act:bullet[2].trim()});continue;}
  }}
  if(!entries.length)return<div style={{color:t.muted,fontSize:13}}>Calendrier non disponible</div>;
  const[openI,setOpenI]=useState(null);const colors=[t.gold,"#e05555",t.blue,"#9b59b6",t.green,"#e67e22"];
  return(<div style={{position:"relative"}}><div style={{position:"absolute",left:19,top:30,bottom:30,width:2,background:t.border}}/>
    {entries.map((e,i)=>{
      // Section header
      if(e.isHeader)return<div key={i} style={{display:"flex",gap:12,marginBottom:12,position:"relative"}}><div style={{width:40,height:40,borderRadius:"50%",background:t.gold,border:`2px solid ${t.gold}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,marginTop:4}}><span style={{fontSize:12,fontWeight:800,color:"#0a0a0a"}}>★</span></div><div style={{flex:1,padding:"12px 16px",background:t.goldBg2,border:`1px solid ${t.gold}`,borderRadius:12}}><div style={{fontSize:12,fontWeight:800,color:t.gold,letterSpacing:"0.06em"}}>{e.date.toUpperCase()}</div></div></div>;
      const c=colors[i%colors.length];const isO=openI===i;
    return<div key={i} style={{display:"flex",gap:12,marginBottom:8,position:"relative"}}>
      <div style={{width:40,height:40,borderRadius:"50%",background:t.card2,border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,marginTop:4}}><span style={{fontSize:12,fontWeight:800,color:c}}>{i+1}</span></div>
      <div style={{flex:1}}>
        <button onClick={()=>setOpenI(isO?null:i)} style={{width:"100%",textAlign:"left",background:t.card2,border:`1px solid ${t.border}`,borderRadius:isO?"12px 12px 0 0":"12px",padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}><div style={{fontSize:11,fontWeight:800,color:c,letterSpacing:"0.06em"}}>{e.date.toUpperCase()}</div>{e.act&&<div style={{fontSize:13,color:t.muted,lineHeight:1.5,marginTop:3}} dangerouslySetInnerHTML={{__html:inline(e.act)}}/>}</div>
          <span style={{color:t.muted,fontSize:12,marginLeft:8,flexShrink:0}}>{isO?"▲":"▼"}</span>
        </button>
        {isO&&<div style={{background:t.card,border:`1px solid ${t.border}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:16}}><div style={{fontSize:12,fontWeight:700,color:t.gold,marginBottom:8}}>ACTIVITÉS SUGGÉRÉES</div><div style={{fontSize:13,color:t.muted,lineHeight:1.7}}>Utilisez le chat pour demander des suggestions d'activités détaillées pour cette période.</div></div>}
      </div>
    </div>;})}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// RECO + FIDELITE
// ═══════════════════════════════════════════════════════════════
function RecoDisplay({lines,t}){return<div style={{background:t.goldBg,border:`1px solid ${t.gold}25`,borderRadius:12,padding:20}}><div style={{fontSize:13,color:t.muted,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:inline(lines.filter(l=>l.trim()).join(" "))}}/></div>;}
function FideliteDisplay({lines,t}){return<div style={{display:"flex",flexDirection:"column",gap:8}}>{lines.filter(l=>l.trim().length>5&&!/^#/.test(l.trim())).map((l,i)=><div key={i} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:10,padding:"14px 16px",fontSize:13,color:t.muted,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:inline(l)}}/>)}</div>;}

// ═══════════════════════════════════════════════════════════════
// RESULTS VIEW + RAW TEXT
// ═══════════════════════════════════════════════════════════════
function ResultsView({text,t}){
  const[showSrc,setShowSrc]=useState(false);
  const sections=parseSections(text);
  if(!sections.length)return<p style={{color:t.muted,whiteSpace:"pre-wrap"}}>{text}</p>;
  return(<div>
    <div style={{marginBottom:14,border:`2px solid ${t.gold}`,borderRadius:12,overflow:"hidden"}}>
      <button onClick={()=>setShowSrc(!showSrc)} style={{width:"100%",padding:"14px 18px",background:t.goldBg2,border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:700,color:t.gold}}>📋 Texte brut de l'API</span><span style={{color:t.gold,fontSize:14}}>{showSrc?"▲":"▼"}</span></button>
      {showSrc&&<div style={{padding:14}}><div style={{fontSize:11,color:t.muted,marginBottom:8}}>Clique dans le champ puis copie tout</div><textarea readOnly value={text} style={{width:"100%",minHeight:400,background:t.input,border:`1px solid ${t.border}`,borderRadius:8,color:t.text,fontSize:11,fontFamily:MO,padding:12,boxSizing:"border-box",resize:"vertical"}} onClick={e=>e.target.select()}/></div>}
    </div>
    {sections.map((sec,i)=>{const ti=sec.title.toLowerCase();const isR=/récap/i.test(ti);const isV=/vols?\b/i.test(ti)&&!/revolut|astuce|fidél/i.test(ti);const isH=/héberg/i.test(ti);const isT=/total|coût/i.test(ti);const isM=/météo|meteo/i.test(ti);const isC=/calendrier|planning/i.test(ti);const isRe=/recommand/i.test(ti);const isF=/revolut|astuce|fidél/i.test(ti);
    return(<Sec key={i} title={sec.title} t={t} open={isR||isV||isH} accent={isT}>{isR?<RecapDisplay lines={sec.lines} t={t}/>:isV?<FlightDisplay lines={sec.lines} t={t}/>:isH?<HebergementDisplay lines={sec.lines} t={t}/>:isT?<TotauxDisplay lines={sec.lines} t={t}/>:isM?<MeteoDisplay lines={sec.lines} t={t}/>:isC?<CalendrierDisplay lines={sec.lines} t={t}/>:isRe?<RecoDisplay lines={sec.lines} t={t}/>:isF?<FideliteDisplay lines={sec.lines} t={t}/>:<div>{sec.lines.filter(l=>l.trim()).map((l,j)=><p key={j} style={{margin:"0 0 6px",fontSize:13,color:t.muted,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:inline(l)}}/>)}</div>}</Sec>);})}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════
function ChatWidget({t}){const[open,setOpen]=useState(false);const[msgs,setMsgs]=useState([{role:"assistant",content:"Questions sur les vols, hôtels ou activités ?"}]);const[input,setInput]=useState("");const[ld,setLd]=useState(false);const endRef=useRef(null);useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
const send=async()=>{if(!input.trim()||ld)return;const u={role:"user",content:input};setMsgs(p=>[...p,u]);setInput("");setLd(true);try{const res=await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[...msgs,u]})});const data=await res.json();setMsgs(p=>[...p,{role:"assistant",content:data.text||"Erreur."}]);}catch{setMsgs(p=>[...p,{role:"assistant",content:"Erreur de connexion."}]);}setLd(false);};
const W=typeof window!=="undefined"&&window.innerWidth<700;
if(!open)return<button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:20,right:20,width:52,height:52,borderRadius:"50%",background:t.gold,border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,zIndex:1000}}>💬</button>;
return(<div style={{position:"fixed",bottom:20,right:W?16:20,width:W?"calc(100vw - 32px)":"360px",height:W?"calc(100vh - 100px)":"480px",background:t.card,border:`1px solid ${t.border}`,borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:1000}}><div style={{padding:"14px 18px",borderBottom:`1px solid ${t.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:t.goldBg}}><span style={{fontSize:13,fontWeight:700,color:t.gold}}>💬 Assistant</span><button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:t.muted,fontSize:18,cursor:"pointer"}}>×</button></div><div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>{msgs.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?t.gold:t.card2,color:m.role==="user"?"#0a0a0a":t.text,fontSize:13,lineHeight:1.6}}>{m.content}</div>)}{ld&&<div style={{padding:"10px 14px",borderRadius:14,background:t.card2,color:t.muted}}>...</div>}<div ref={endRef}/></div><div style={{padding:"10px 14px",borderTop:`1px solid ${t.border}`,display:"flex",gap:8}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Question..." style={{flex:1,padding:"10px 14px",background:t.input,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:13,outline:"none"}}/><button onClick={send} disabled={ld} style={{padding:"10px 16px",background:t.gold,border:"none",borderRadius:10,color:"#0a0a0a",fontWeight:700,cursor:"pointer"}}>↑</button></div></div>);}

// ═══════════════════════════════════════════════════════════════
// FORM COMPONENTS
// ═══════════════════════════════════════════════════════════════
function LoyaltySelector({selected,onChange,points,onPoints,t}){return(<div><div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:selected.length>0?14:0}}>{LOYALTY.map(p=>{const on=selected.includes(p.id);return<button key={p.id} onClick={()=>onChange(on?selected.filter(x=>x!==p.id):[...selected,p.id])} style={{padding:"6px 13px",borderRadius:20,border:`1px solid ${on?t.gold:t.border}`,background:on?t.goldBg2:"transparent",color:on?t.gold:t.muted,fontSize:11,cursor:"pointer"}}>{p.short}</button>;})}</div>{selected.length>0&&<div style={{background:t.card2,borderRadius:10,padding:"14px 16px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><Lbl t={t}>Points</Lbl><span style={{fontSize:14,fontWeight:800,color:t.gold,fontFamily:MO}}>{points>=100000?">100k":points.toLocaleString("fr-CH")} pts</span></div><input type="range" min="0" max="10" step="1" value={Math.max(0,POINTS_MARKS.findIndex(v=>v===points))} onChange={e=>onPoints(POINTS_MARKS[+e.target.value]||0)} style={{width:"100%",accentColor:t.gold}}/></div>}</div>);}

function DateCell({value,onChange,flex,onFlex,t}){return(<div>
  <input type="date" value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:t.input,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:14,padding:"13px 14px",outline:"none",minHeight:48,colorScheme:"dark"}}/>
  <div style={{display:"flex",gap:5,marginTop:5}}>
    <button onClick={()=>onFlex(0)} style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:10,border:`1px solid ${flex===0?t.gold:t.border}`,background:flex===0?t.goldBg2:"transparent",color:flex===0?t.gold:t.muted,cursor:"pointer"}}>EXACT</button>
    <button onClick={()=>onFlex(flex===0?3:flex)} style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:10,border:`1px solid ${flex>0?t.gold:t.border}`,background:flex>0?t.goldBg2:"transparent",color:flex>0?t.gold:t.muted,cursor:"pointer"}}>{flex>0?`± ${flex}j`:"± JOURS"}</button>
  </div>
  {flex>0&&<div style={{marginTop:7,padding:"8px 12px",background:t.card2,borderRadius:8}}><input type="range" min="1" max="21" value={flex} onChange={e=>onFlex(+e.target.value)} style={{width:"100%",accentColor:t.gold}}/><div style={{textAlign:"right",fontSize:11,color:t.gold,fontWeight:700}}>± {flex}j</div></div>}
</div>);}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App(){
  const[isDark,setIsDark]=useState(true);const t=isDark?DARK:LIGHT;
  useEffect(()=>{document.body.style.background=t.bg;document.body.style.margin="0";document.documentElement.style.background=t.bg;},[t.bg]);
  const[activeTab,setActiveTab]=useState("trips");const[formOpen,setFormOpen]=useState(true);
  const[loyaltyCards,setLoyaltyCards]=useState([]);const[loyaltyPoints,setLoyaltyPoints]=useState(0);
  const[from,setFrom]=useState("GVA");const[fromCustom,setFromCustom]=useState("");
  const[legs,setLegs]=useState([{to:"",d1:"",d2:"",f1:0,f2:0}]);
  const[travelers,setTravelers]=useState("1");const[baggage,setBaggage]=useState("no_pref");
  const[vibes,setVibes]=useState([]);const[acts,setActs]=useState([]);const[notes,setNotes]=useState("");
  const[phase,setPhase]=useState("idle");const[result,setResult]=useState("");const[err,setErr]=useState("");const[tipIdx,setTipIdx]=useState(0);
  const timer=useRef(null);
  useEffect(()=>{if(phase==="loading")timer.current=setInterval(()=>setTipIdx(i=>(i+1)%TIPS.length),2800);else{clearInterval(timer.current);setTipIdx(0);}return()=>clearInterval(timer.current);},[phase]);
  const addLeg=()=>{if(legs.length<5)setLegs(l=>[...l,{to:"",d1:l[l.length-1].d2||"",d2:"",f1:0,f2:0}]);};
  const removeLeg=i=>setLegs(l=>l.filter((_,j)=>j!==i));
  const uLeg=(i,f,v)=>{setLegs(l=>{const n=[...l];n[i]={...n[i],[f]:v};if(f==="d2"&&i+1<n.length)n[i+1]={...n[i+1],d1:v};return n;});};
  const INP={width:"100%",boxSizing:"border-box",background:t.input,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:14,fontFamily:FN,padding:"13px 14px",outline:"none"};

  const buildPrompt=()=>{const ap=from==="OTHER"?fromCustom.toUpperCase():from;const ll=legs.filter(l=>l.to).map((l,i)=>{const fp=i===0?ap:(legs[i-1].to||ap);const p=[`Vol ${i+1} : ${fp} -> ${l.to}`];if(l.d1)p.push(`départ ${l.d1}${l.f1>0?` (±${l.f1}j)`:""}`);if(l.d2)p.push(i===legs.length-1?`retour ${l.d2}${l.f2>0?` (±${l.f2}j)`:""}`:`arrivée ${l.d2}${l.f2>0?` (±${l.f2}j)`:""}`);return"✈️ "+p.join(" - ");});return["Planifie ce voyage :",`Aéroport : ${ap}`,...ll,`Voyageurs : ${travelers}`,baggage!=="no_pref"?`Bagages : ${BAGGAGE_OPTIONS.find(b=>b.id===baggage)?.label}`:"",loyaltyCards.length?`Fidélité : ${loyaltyCards.map(id=>LOYALTY.find(p=>p.id===id)?.short).join(", ")}`:"",vibes.length?`Ambiance : ${VIBES.filter(v=>vibes.includes(v.id)).map(v=>v.label).join(", ")}`:"",acts.length?`Activités : ${ACTIVITIES.filter(a=>acts.includes(a.id)).map(a=>a.label).join(", ")}`:"",notes?`Notes : ${notes}`:"","","FORMAT: Utiliser | comme début ET fin de chaque ligne de tableau. Pour les hébergements multi-destination: ### Ville (dates) puis #### Nom Hôtel. Pour la météo: ### Ville (Mois). Inclure IMAGES: url1 | url2 pour chaque hôtel. 3 scénarios de vol, totaux CHF."].filter(Boolean).join("\n");};
  const go=async()=>{if(!legs[0].to||!legs[0].d1){setErr("Destination et date requises.");return;}setPhase("loading");setErr("");setResult("");try{const res=await fetch("/api/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:buildPrompt()}]})});const data=await res.json();if(!res.ok||data.error)throw new Error(data.error||`Erreur ${res.status}`);setResult(data.text||"Aucun résultat.");setPhase("done");setFormOpen(false);}catch(e){setErr(e.message);setPhase("error");}};
  const reset=()=>{setPhase("idle");setResult("");setErr("");setFormOpen(true);};

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"1rem",background:t.bg,minHeight:"100vh",fontFamily:FN}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,letterSpacing:"-0.04em",color:t.text,lineHeight:1}}>WDC</div><div style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",color:t.gold,marginTop:3}}>AI TRAVEL</div></div>
        <button onClick={()=>setIsDark(!isDark)} style={{width:40,height:40,borderRadius:"50%",border:`1px solid ${t.border}`,background:t.card,color:t.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{isDark?"☀️":"🌙"}</button>
      </div>

      {/* Collapsible form when results shown */}
      {phase==="done"&&result&&<button onClick={()=>setFormOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",background:t.card,border:`1px solid ${t.border}`,borderRadius:formOpen?"14px 14px 0 0":14,cursor:"pointer",marginBottom:formOpen?0:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:13,fontWeight:600,color:t.text}}>Modifier la recherche</span></div>
        <span style={{color:t.muted}}>{formOpen?"−":"+"}</span>
      </button>}

      {(formOpen||phase!=="done")&&<div style={{background:phase==="done"?t.card:"transparent",border:phase==="done"?`1px solid ${t.border}`:"none",borderTop:phase==="done"?"none":undefined,borderRadius:phase==="done"?"0 0 14px 14px":0,padding:phase==="done"?"14px 0 0":0,marginBottom:10}}>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",padding:phase==="done"?"0 14px":"0"}}>{[{id:"trips",label:"Trips"},{id:"vols",label:"Vols"},{id:"hotels",label:"Hôtels"}].map(tab=><button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:"8px 16px",borderRadius:20,border:`1px solid ${activeTab===tab.id?t.gold:t.border}`,background:activeTab===tab.id?t.gold:"transparent",color:activeTab===tab.id?"#0a0a0a":t.muted,fontSize:12,fontWeight:activeTab===tab.id?700:500,cursor:"pointer"}}>{tab.label}</button>)}</div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:14,padding:"14px 18px",marginBottom:10}}><Lbl t={t}>Fidélité</Lbl><LoyaltySelector selected={loyaltyCards} onChange={setLoyaltyCards} points={loyaltyPoints} onPoints={setLoyaltyPoints} t={t}/></div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${t.border}`,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><Lbl t={t}>Voyageurs</Lbl><select value={travelers} onChange={e=>setTravelers(e.target.value)} style={INP}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} pers.</option>)}</select></div><div><Lbl t={t}>Bagages</Lbl><select value={baggage} onChange={e=>setBaggage(e.target.value)} style={INP}>{BAGGAGE_OPTIONS.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select></div></div>
          <div style={{padding:"14px 18px"}}>
            {legs.map((leg,idx)=><div key={idx} style={{marginBottom:12,padding:14,background:t.card2,borderRadius:12,border:`1px solid ${t.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:11,fontWeight:700,color:t.gold}}>ÉTAPE {idx+1}</span>{idx>0&&<button onClick={()=>removeLeg(idx)} style={{width:26,height:26,border:`1px solid ${t.border}`,background:"transparent",cursor:"pointer",color:t.muted,fontSize:14,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 24px 1fr",gap:6,alignItems:"end",marginBottom:10}}>
                <div><Lbl t={t}>Depuis</Lbl>{idx===0?<select value={from} onChange={e=>setFrom(e.target.value)} style={INP}>{AIRPORTS.map(a=><option key={a.code} value={a.code}>{a.code==="OTHER"?"Autre":`${a.code} - ${a.name}`}</option>)}</select>:<div style={{...INP,color:t.muted,background:t.card2}}>{legs[idx-1].to||"-"}</div>}</div>
                <div style={{textAlign:"center",color:t.gold,fontWeight:900,fontSize:16,paddingBottom:14}}>→</div>
                <div><Lbl t={t}>Vers</Lbl><input value={leg.to} onChange={e=>uLeg(idx,"to",e.target.value)} placeholder="Destination" style={INP}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><Lbl t={t}>Date aller</Lbl><DateCell value={leg.d1} onChange={v=>uLeg(idx,"d1",v)} flex={leg.f1} onFlex={v=>uLeg(idx,"f1",v)} t={t}/></div>
                <div><Lbl t={t}>Date retour</Lbl><DateCell value={leg.d2} onChange={v=>uLeg(idx,"d2",v)} flex={leg.f2} onFlex={v=>uLeg(idx,"f2",v)} t={t}/></div>
              </div>
            </div>)}
            {legs.length<5&&<button onClick={addLeg} style={{fontSize:11,padding:"7px 16px",border:`1px dashed ${t.border}`,background:"transparent",cursor:"pointer",color:t.muted,borderRadius:8,marginBottom:8}}>+ Étape ({legs.length}/5)</button>}
          </div>
          <div style={{borderTop:`1px solid ${t.border}`}}/>
          <div style={{padding:"14px 18px"}}><Lbl t={t}>Ambiance</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{VIBES.map(v=><Chip key={v.id} label={v.label} on={vibes.includes(v.id)} onClick={()=>setVibes(x=>x.includes(v.id)?x.filter(z=>z!==v.id):[...x,v.id])} t={t}/>)}</div></div>
          <div style={{padding:"0 18px 14px"}}><Lbl t={t}>Activités</Lbl><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ACTIVITIES.map(a=><Chip key={a.id} label={a.label} on={acts.includes(a.id)} onClick={()=>setActs(x=>x.includes(a.id)?x.filter(z=>z!==a.id):[...x,a.id])} t={t}/>)}</div></div>
          <div style={{padding:"0 18px 14px"}}><Lbl t={t}>Notes</Lbl><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Budget, préférences..." style={{...INP,minHeight:50,resize:"vertical"}}/></div>
          {err&&<div style={{margin:"0 18px 14px",fontSize:13,color:"#ff7070",background:"rgba(255,100,100,0.1)",borderRadius:8,padding:"10px 14px"}}>⚠ {err}</div>}
          <div style={{padding:"0 18px 18px"}}><button onClick={go} disabled={phase==="loading"} style={{width:"100%",padding:16,background:phase==="loading"?t.faint:`linear-gradient(135deg,${t.gold},#d4b85c)`,color:phase==="loading"?t.muted:"#0a0a0a",border:"none",borderRadius:12,cursor:phase==="loading"?"not-allowed":"pointer",fontSize:12,fontWeight:800,letterSpacing:"0.18em"}}>{phase==="loading"?"RECHERCHE...":"LANCER LA RECHERCHE"}</button></div>
        </div>
      </div>}

      {phase==="loading"&&<div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:16,padding:"3rem",textAlign:"center",marginTop:10}}><div style={{fontSize:44,marginBottom:"1rem"}}>✈️</div><div style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:t.text}}>{TIPS[tipIdx].toUpperCase()}</div></div>}

      {phase==="done"&&result&&<div style={{marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div><span style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:t.text}}>RÉSULTATS</span><span style={{fontSize:10,color:t.muted,marginLeft:12}}>{new Date().toLocaleDateString("fr-CH",{day:"numeric",month:"long",year:"numeric"})}</span></div>
          <button onClick={reset} style={{fontSize:10,fontWeight:700,padding:"6px 14px",background:t.gold,border:"none",borderRadius:6,cursor:"pointer",color:"#0a0a0a"}}>NOUVELLE RECHERCHE</button>
        </div>
        <ResultsView text={result} t={t}/>
      </div>}

      <div style={{marginTop:24,textAlign:"center",fontSize:10,color:t.faint,letterSpacing:"0.1em",fontFamily:MO}}>KAYAK · BOOKING · GOOGLE FLIGHTS · SKYSCANNER</div>
      <ChatWidget t={t}/>
    </div>
  );
}
