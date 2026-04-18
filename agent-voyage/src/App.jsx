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
// UTILITIES — clean() joins orphan commas/periods from API output
// ═══════════════════════════════════════════════════════════════════

function clean(text) {
  if (!text) return "";
  const lines = text.replace(/[—–]/g, " - ").split("\n");
  const out = [];
  for (const line of lines) {
    const t = line.trim();
    const prev = out.length > 0 ? out[out.length - 1] : null;
    // Join orphan punctuation lines to the previous line
    if (prev !== null && !prev.trim().startsWith("|") && !prev.trim().startsWith("#") && (
      /^[,;]/.test(t) ||
      /^\.\s/.test(t) ||
      /^\.$/.test(t) ||
      (t.length > 0 && t.length <= 4 && !/^[|#\-*✅•\d]/.test(t) && t !== "")
    )) {
      out[out.length - 1] = out[out.length - 1].trimEnd() + (t.startsWith(",") || t.startsWith(".") || t.startsWith(";") ? "" : " ") + t;
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}

function wxEmoji(t) {
  const s = (t || "").toLowerCase();
  if (s.includes("orage") || s.includes("storm")) return "⛈️";
  if (s.includes("pluie") || s.includes("rain")) return "🌧️";
  if (s.includes("nuageux") || s.includes("couvert")) return "☁️";
  if (s.includes("partiellement")) return "⛅";
  if (s.includes("neige") || s.includes("snow")) return "❄️";
  if (s.includes("vent") || s.includes("wind")) return "💨";
  if (s.includes("soleil") || s.includes("ensoleillé") || s.includes("beau") || s.includes("sunny")) return "☀️";
  return "🌤️";
}

function extractImages(lines) {
  for (const l of lines) {
    const m = l.match(/^IMAGES:\s*(.+)/i);
    if (m) return m[1].split("|").map(u => u.trim()).filter(u => u.startsWith("http"));
  }
  return [];
}

function parseSections(text) {
  const lines = clean(text).split("\n");
  const sections = []; let cur = null;
  for (const l of lines) {
    const h2 = l.match(/^## (.+)/);
    if (h2) { if (cur) sections.push(cur); cur = { title: h2[1].trim(), lines: [] }; }
    else if (cur) cur.lines.push(l);
  }
  if (cur) sections.push(cur);
  return sections;
}

function parseHotelBlocks(lines) {
  const blocks = []; let cur = null;
  for (const l of lines) {
    const h3 = l.match(/^### (.+)/);
    if (h3) {
      if (cur) blocks.push(cur);
      const name = h3[1].trim();
      const isHeader = /\(\d+\s*nuits?\)/i.test(name) || /^[A-Z\s\-,]{4,}$/.test(name);
      cur = { name, lines: [], isHeader };
    } else if (cur) cur.lines.push(l);
  }
  if (cur) blocks.push(cur);
  return blocks;
}

// Parse a CRITÈRE|DÉTAIL table into a dict
function parseTable(lines) {
  const data = {};
  for (const l of lines) {
    if (l.startsWith("|") && !l.match(/^[\|\s:\-]+$/)) {
      const cells = l.split("|").slice(1, -1).map(c => c.trim());
      if (cells.length >= 2 && cells[0] && cells[1]) {
        const key = cells[0].toLowerCase()
          .replace(/[éèê]/g, "e").replace(/[àâ]/g, "a")
          .replace(/[îï]/g, "i").replace(/\s+/g, "_").replace(/[^a-z_\/]/g, "");
        data[key] = cells[1];
      }
    }
  }
  return data;
}

// Extract title icon
function titleParts(t) {
  const m = t.match(/^([\u{1F300}-\u{1FFFF}][\uFE0F\u200D]*)+\s*/u);
  if (m) return { icon: m[0].trim(), label: t.slice(m[0].length).trim() };
  return { icon: "", label: t };
}

// Inline markdown for prose
function renderInline(s) {
  return (s || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener" style="color:#c9a96e;text-decoration:none;border-bottom:1px solid #a07840">$1 ↗</a>`);
}

// ═══════════════════════════════════════════════════════════════════
// PROSE BLOCK — renders clean paragraphs (no table mess)
// ═══════════════════════════════════════════════════════════════════

function ProseBlock({ lines }) {
  const cleaned = clean(lines.join("\n")).split("\n").filter(l => {
    const t = l.trim();
    if (!t || t === "|" || /^\|[\s:\-|]+\|$/.test(t)) return false;
    if (/^IMAGES:/i.test(t)) return false;
    if (/^#{1,4}\s/.test(t)) return false;
    return true;
  });

  const out = [];
  let tbl = [], lst = [], lstOrd = false;

  const flushList = () => {
    if (!lst.length) return;
    const Tag = lstOrd ? "ol" : "ul";
    out.push(<Tag key={`l${out.length}`} style={{ margin: "0.4rem 0", paddingLeft: "1.4rem" }}>
      {lst.map((t, i) => <li key={i} style={{ margin: "0.2rem 0", lineHeight: "1.65", fontSize: "14px", color: C.muted }} dangerouslySetInnerHTML={{ __html: renderInline(t) }} />)}
    </Tag>);
    lst = []; lstOrd = false;
  };

  const flushTable = () => {
    if (!tbl.length) return;
    const rows = tbl.filter(r => !/^\|[\s:\-|]+\|$/.test(r.trim()));
    if (!rows.length) { tbl = []; return; }
    const parse = r => r.split("|").slice(1, -1).map(c => c.trim());
    const [head, ...body] = rows;
    out.push(
      <div key={`t${out.length}`} style={{ overflowX: "auto", margin: "1rem 0", borderRadius: "10px", overflow: "hidden", border: `1px solid ${C.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead><tr style={{ background: "#1c1c1c" }}>
            {parse(head).map((h, i) => <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontWeight: "700", color: C.gold, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `2px solid ${C.border}` }} dangerouslySetInnerHTML={{ __html: renderInline(h) }} />)}
          </tr></thead>
          <tbody>{body.map((r, i) => {
            const cells = parse(r);
            return <tr key={i} style={{ background: i % 2 === 0 ? C.card : C.card2, borderBottom: `1px solid ${C.border}` }}>
              {cells.map((c, j) => <td key={j} style={{ padding: "11px 16px", fontSize: "13px", color: j === 0 ? C.text : C.muted, fontWeight: j === 0 ? "600" : "400" }} dangerouslySetInnerHTML={{ __html: renderInline(c) }} />)}
            </tr>;
          })}</tbody>
        </table>
      </div>
    );
    tbl = [];
  };

  for (let i = 0; i < cleaned.length; i++) {
    const l = cleaned[i];
    if (l.startsWith("|")) { flushList(); tbl.push(l); continue; }
    flushTable();
    if (/^[-*•] /.test(l)) { lst.push(l.replace(/^[-*•] /, "")); }
    else if (/^\d+\. /.test(l)) { lstOrd = true; lst.push(l.replace(/^\d+\. /, "")); }
    else if (/^---+$/.test(l.trim())) { flushList(); out.push(<hr key={i} style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "1rem 0" }} />); }
    else if (l.trim() === "") { flushList(); out.push(<div key={i} style={{ height: "0.5rem" }} />); }
    else {
      flushList();
      const isHeader = l.trim().startsWith("**") && l.trim().endsWith("**");
      out.push(<p key={i} style={{ margin: "0 0 8px", lineHeight: "1.75", fontSize: "14px", color: isHeader ? C.text : C.muted, fontWeight: isHeader ? "600" : "400" }} dangerouslySetInnerHTML={{ __html: renderInline(l) }} />);
    }
  }
  flushList(); flushTable();
  return <>{out}</>;
}

// ═══════════════════════════════════════════════════════════════════
// ACCORDION CARD
// ═══════════════════════════════════════════════════════════════════

function AccCard({ title, children, defaultOpen = false, accent = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const { icon, label } = titleParts(title);
  return (
    <div style={{ background: C.card, border: `1px solid ${accent ? C.gold : C.border}`, borderRadius: "14px", marginBottom: "8px", overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? `1px solid ${C.border}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {icon && <span style={{ fontSize: "16px" }}>{icon}</span>}
          <span style={{ fontSize: "13px", fontWeight: "700", color: accent ? C.gold : C.text, letterSpacing: "0.01em" }}>{label}</span>
        </div>
        <span style={{ color: C.muted, fontSize: "20px", fontWeight: "300", lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "22px" }}>{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PHOTO GRID — Booking.com style
// ═══════════════════════════════════════════════════════════════════

function PhotoGrid({ urls, name }) {
  const [failed, setFailed] = useState({});
  const [lb, setLb] = useState(null);
  const valid = (urls || []).filter((_, i) => !failed[i]);

  if (!urls || urls.length === 0 || valid.length === 0) {
    return (
      <div style={{ height: "200px", background: `linear-gradient(135deg, #1a1f3c 0%, #0f3460 50%, #1a1f3c 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "12px 12px 0 0" }}>
        <div style={{ fontSize: "40px", marginBottom: "8px", opacity: 0.6 }}>🏨</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Photos non disponibles</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gridTemplateRows: "140px 140px", gap: "3px", overflow: "hidden", cursor: "zoom-in" }} onClick={() => setLb(0)}>
        <div style={{ gridRow: "1/3", overflow: "hidden" }}>
          <img src={valid[0]} alt="" referrerPolicy="no-referrer" onError={() => setFailed(f => ({ ...f, [0]: true }))} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        {[1, 2, 3, 4].map(i => valid[i] ? (
          <div key={i} style={{ overflow: "hidden", position: "relative" }}>
            <img src={valid[i]} alt="" referrerPolicy="no-referrer" onError={() => setFailed(f => ({ ...f, [i]: true }))} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {i === 4 && valid.length > 5 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: "700" }}>+{valid.length - 4} photos</div>}
          </div>
        ) : <div key={i} style={{ background: C.card2 }} />)}
      </div>
      {lb !== null && (
        <div onClick={() => setLb(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={valid[lb]} alt="" referrerPolicy="no-referrer" style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "8px" }} onClick={e => e.stopPropagation()} />
          <div style={{ position: "absolute", bottom: "24px", display: "flex", gap: "6px" }}>
            {valid.map((_, i) => <div key={i} onClick={e => { e.stopPropagation(); setLb(i); }} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === lb ? "#fff" : "rgba(255,255,255,0.3)", cursor: "pointer" }} />)}
          </div>
          <button onClick={() => setLb(null)} style={{ position: "absolute", top: "20px", right: "24px", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontSize: "20px" }}>×</button>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECAP DISPLAY — clean hero summary
// ═══════════════════════════════════════════════════════════════════

function RecapDisplay({ lines, activeClass, prices }) {
  const all = clean(lines.join(" "));
  const raw = clean(lines.join("\n"));

  // Extract destinations
  const destMatch = all.match(/(?:Destination[s]?[:\s]+|vers?\s+)([A-ZÀ-Ÿa-zà-ÿ\s,→]+?)(?:\s*\||\s*Dates|\s*Durée|\s*\d{1,2})/i);
  const dest = destMatch ? destMatch[1].trim().replace(/\s*-\s*$/,"") : null;

  // Extract nights
  const nightsMatch = all.match(/(\d+)\s*nuits?/i);
  const nights = nightsMatch ? nightsMatch[1] : null;

  // Extract hotel rating
  const ratingMatch = all.match(/(\d+\.?\d*)\/10/);
  const hotelRating = ratingMatch ? ratingMatch[1] : null;

  // Extract travelers
  const travMatch = all.match(/(\d+)\s*(?:personne|voyageur)/i);
  const travelers = travMatch ? travMatch[1] : null;

  // Extract dates
  const datesMatch = all.match(/(\d{1,2}[\/\s]\w+\s*\d{0,4})\s*[-–—]\s*(\d{1,2}[\/\s]\w+\s*\d{0,4})/i);

  const classPrice = activeClass === "business" ? prices.business : activeClass === "mixte" ? prices.mixte : prices.eco;
  const classEmoji = activeClass === "business" ? "💺" : activeClass === "mixte" ? "🔀" : "🪑";
  const classLabel = activeClass === "business" ? "Full Business" : activeClass === "mixte" ? "Mixte" : "Économie";

  // Get clean prose from the section (no tables)
  const proseLines = lines.filter(l => {
    const t = l.trim();
    if (!t || t === "|" || /^\|[\s:\-|]+\|$/.test(t)) return false;
    if (/^IMAGES:/i.test(t) || /^#{1,4}\s/.test(t)) return false;
    return true;
  });

  return (
    <div>
      {/* Hero */}
      {dest && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "26px", fontWeight: "900", color: C.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{dest}</div>
          {datesMatch && <div style={{ fontSize: "14px", color: C.muted, marginTop: "4px" }}>{datesMatch[1]} - {datesMatch[2]}{nights ? ` · ${nights} nuits` : ""}</div>}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "22px" }}>
        {classPrice && (
          <div style={{ flex: "1", minWidth: "120px", background: "rgba(201,169,110,0.1)", border: `2px solid ${C.gold}`, borderRadius: "12px", padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", color: C.gold, fontWeight: "700", letterSpacing: "0.1em", marginBottom: "6px" }}>{classEmoji} {classLabel.toUpperCase()}</div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: C.gold, letterSpacing: "-0.02em" }}>{parseInt((classPrice || "0").replace(/\s/g, "")).toLocaleString("fr-CH")}</div>
            <div style={{ fontSize: "11px", color: C.goldD, marginTop: "3px" }}>CHF total</div>
          </div>
        )}
        {[
          nights && { icon: "🌙", value: nights, label: "nuits" },
          hotelRating && { icon: "⭐", value: hotelRating, label: "/ 10 hôtel" },
          travelers && { icon: "👤", value: travelers, label: travelers === "1" ? "voyageur" : "voyageurs" },
        ].filter(Boolean).map((s, i) => (
          <div key={i} style={{ flex: "1", minWidth: "90px", background: C.card2, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: C.text }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: C.muted, marginTop: "3px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Clean prose details */}
      <ProseBlock lines={proseLines} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FLIGHT DISPLAY — clean Kayak-inspired
// ═══════════════════════════════════════════════════════════════════

function FlightDisplay({ lines, activeClass, setActiveClass, prices }) {
  // Parse sub-sections by ### or **LEG** headers
  const legs = [];
  let cur = null;
  for (const l of lines) {
    const h3 = l.match(/^### (.+)/);
    const bold = l.match(/^\*\*(LEG|Vol|Leg)\s*\d+[^*]*\*\*/i);
    const plain = l.match(/^(LEG|Leg)\s*\d+\s*[:·-]\s*(.+)/i);
    if (h3 || bold || plain) {
      if (cur) legs.push(cur);
      const title = h3 ? h3[1] : bold ? l.replace(/\*\*/g, "") : l;
      cur = { title: title.trim(), lines: [] };
    } else if (cur) { cur.lines.push(l); }
  }
  if (cur) legs.push(cur);

  return (
    <div>
      {/* Class tabs */}
      <div style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: "20px" }}>
        {[
          { id: "business", emoji: "💺", label: "Full Business", price: prices.business },
          { id: "mixte", emoji: "🔀", label: "Mixte", price: prices.mixte },
          { id: "eco", emoji: "🪑", label: "Économie", price: prices.eco },
        ].map((c, i) => (
          <button key={c.id} onClick={() => setActiveClass(c.id)} style={{ flex: 1, padding: "14px 8px", textAlign: "center", background: activeClass === c.id ? C.gold : C.card2, color: activeClass === c.id ? "#0a0a0a" : C.muted, border: "none", borderLeft: i > 0 ? `1px solid ${C.border}` : "none", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ fontSize: "12px", fontWeight: "700" }}>{c.emoji} {c.label}</div>
            {c.price && <div style={{ fontSize: "17px", fontWeight: "900", marginTop: "3px", letterSpacing: "-0.02em" }}>{parseInt((c.price || "0").replace(/\s/g, "")).toLocaleString("fr-CH")} CHF</div>}
          </button>
        ))}
      </div>

      {/* Legs */}
      {legs.length > 1 ? legs.map((leg, i) => (
        <div key={i} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "12px", marginBottom: "8px", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, background: "rgba(201,169,110,0.05)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: C.gold, letterSpacing: "0.08em" }}>{leg.title}</span>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <ProseBlock lines={leg.lines} />
          </div>
        </div>
      )) : <ProseBlock lines={lines} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOTEL CARD — Booking.com inspired, no raw tables
// ═══════════════════════════════════════════════════════════════════

function DestinationHeader({ name }) {
  return <div style={{ padding: "8px 0 12px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.12em", color: C.gold, borderBottom: `1px solid ${C.border}`, marginBottom: "14px" }}>{name.toUpperCase()}</div>;
}

function HotelCard({ name, lines }) {
  const [open, setOpen] = useState(true);
  const images = extractImages(lines);

  // Parse the CRITÈRE|DÉTAIL table
  const td = parseTable(lines);
  const rating = (td["note"] || "").match(/(\d+\.?\d*)/)?.[1] || null;
  const stars = (td["etoiles"] || "").replace(/[^★]/g, "").length || null;
  const zone = td["zone"] || td["emplacement"] || null;
  const room = td["chambre"] || null;
  const amenities = (td["equipements"] || "").split(",").map(s => s.trim()).filter(s => s && s.length > 1).slice(0, 6);
  const piscine = td["piscine"] && /oui|yes/i.test(td["piscine"]);
  const spa = td["spa"] && /oui|yes/i.test(td["spa"]);
  const vue = td["vue"] || null;
  const petitdej = td["petit-dejeuner"] || td["petit_dejeuner"] || null;
  const priceNight = (td["prix/nuit"] || td["prix_nuit"] || "").match(/(\d[\d\s]+)/)?.[1]?.replace(/\s/g, "");
  const priceTotal = (td["prix_total"] || td["prix total"] || "").match(/(\d[\d\s]+)/)?.[1]?.replace(/\s/g, "");

  // Find booking link — look for [Booking...](url) in table OR lines
  let bookingLink = null;
  const allText = lines.join(" ");
  const linkMatch = allText.match(/\[(?:Booking|Réserver)[^\]]*\]\(([^)]+)\)/i);
  if (linkMatch) bookingLink = linkMatch[1];

  // Prose lines — exclude table rows, IMAGES, links-only lines, raw URLs
  const proseLines = lines.filter(l => {
    const t = l.trim();
    if (!t || /^IMAGES:/i.test(t) || /^#{1,4}\s/.test(t)) return false;
    if (/^\|/.test(t)) return false;
    if (/^(https?:)?\/\//.test(t)) return false; // raw URLs
    if (/^\[Site officiel\]|^\[Booking/.test(t)) return false;
    return true;
  }).slice(0, 5); // max 5 prose lines for the recap

  // Amenity chips
  const chips = [
    ...amenities.map(a => ({ label: a })),
    piscine && { label: "Piscine" },
    spa && { label: "Spa" },
    vue && { label: vue.split(",")[0].trim() },
    petitdej && !petitdej.toLowerCase().includes("non") && { label: "Petit-déjeuner" },
    room && { label: room.split(",")[0].trim() },
  ].filter(Boolean);

  const ratingNum = parseFloat(rating || "0");
  const ratingColor = ratingNum >= 9 ? "#16a34a" : ratingNum >= 8 ? "#1d8348" : "#2e7d32";
  const ratingLabel = ratingNum >= 9 ? "Excellent" : ratingNum >= 8 ? "Très bien" : ratingNum >= 7 ? "Bien" : "";

  return (
    <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "14px", marginBottom: "14px", overflow: "hidden" }}>
      {/* Collapse toggle */}
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? `1px solid ${C.border}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {stars > 0 && <span style={{ color: C.gold, fontSize: "12px", letterSpacing: "-1px" }}>{"★".repeat(stars)}</span>}
          <span style={{ fontSize: "15px", fontWeight: "700", color: C.text }}>{name}</span>
        </div>
        <span style={{ color: C.muted, fontSize: "16px" }}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <>
          {/* Photo grid */}
          <PhotoGrid urls={images} name={name} />

          <div style={{ padding: "20px" }}>
            {/* Header row: zone + rating */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                {zone && <div style={{ fontSize: "13px", color: C.muted, marginBottom: "4px" }}>📍 {zone}</div>}
                {priceNight && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                    <span style={{ fontSize: "28px", fontWeight: "900", color: C.gold, letterSpacing: "-0.02em" }}>{parseInt(priceNight).toLocaleString("fr-CH")}</span>
                    <span style={{ fontSize: "13px", color: C.muted }}>CHF / nuit</span>
                    {priceTotal && <span style={{ fontSize: "13px", color: C.muted }}>· {parseInt(priceTotal).toLocaleString("fr-CH")} CHF total</span>}
                  </div>
                )}
              </div>
              {rating && (
                <div style={{ background: ratingColor, borderRadius: "10px 10px 10px 0", padding: "10px 14px", textAlign: "center", minWidth: "56px", flexShrink: 0 }}>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#fff" }}>{rating}</div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)", marginTop: "1px" }}>{ratingLabel}</div>
                </div>
              )}
            </div>

            {/* Prose recap */}
            {proseLines.length > 0 && (
              <p style={{ fontSize: "13px", color: C.muted, lineHeight: "1.7", margin: "0 0 16px" }}
                dangerouslySetInnerHTML={{ __html: renderInline(proseLines.join(" ").replace(/\*\*(.+?)\*\*/g, "$1")) }} />
            )}

            {/* Amenity chips */}
            {chips.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
                {chips.map((c, i) => (
                  <span key={i} style={{ fontSize: "12px", color: C.muted, background: C.card, border: `1px solid ${C.border}`, padding: "5px 12px", borderRadius: "20px" }}>
                    ✓ {c.label}
                  </span>
                ))}
              </div>
            )}

            {/* Book button */}
            {bookingLink && (
              <a href={bookingLink} target="_blank" rel="noopener" style={{ display: "inline-block", padding: "12px 22px", background: C.gold, color: "#0a0a0a", borderRadius: "10px", fontSize: "13px", fontWeight: "700", textDecoration: "none", letterSpacing: "0.03em" }}>
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
// TOTAUX DISPLAY — 3 visual cards + clean breakdown
// ═══════════════════════════════════════════════════════════════════

function TotauxDisplay({ lines, activeClass }) {
  const text = lines.join(" ");

  // Better price extraction — find the TOTAL row in the table
  const totalRow = lines.find(l => /total/i.test(l) && l.startsWith("|"));
  let bizTotal, mixTotal, ecoTotal;
  if (totalRow) {
    const cells = totalRow.split("|").slice(1, -1).map(c => c.trim().replace(/\s/g, "")).filter(c => /\d{3,}/.test(c));
    if (cells.length >= 3) { bizTotal = cells[0]; mixTotal = cells[1]; ecoTotal = cells[2]; }
    else if (cells.length >= 2) { bizTotal = cells[0]; mixTotal = cells[1]; }
  }

  // Fallback: scan for largest numbers near scenario names
  const get = (p) => { const m = text.match(p); return m ? parseInt(m[1].replace(/\s/g, "")).toLocaleString("fr-CH") : null; };
  if (!bizTotal) bizTotal = get(/(?:Full\s*)?Business[^\d]*(\d[\d\s]{2,})/i);
  if (!mixTotal) mixTotal = get(/Mixte[^\d]*(\d[\d\s]{2,})/i) || get(/mix[^\d]*(\d[\d\s]{2,})/i);
  if (!ecoTotal) ecoTotal = get(/[EÉ]co[^\d]*(\d[\d\s]{2,})/i);

  const fmtN = v => { try { return parseInt((v || "0").replace(/\s/g, "")).toLocaleString("fr-CH"); } catch { return v || "-"; } };

  return (
    <div>
      {/* 3 scenario cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {[
          { id: "business", emoji: "💺", label: "Full Business", total: bizTotal },
          { id: "mixte", emoji: "🔀", label: "Mixte", total: mixTotal },
          { id: "eco", emoji: "🪑", label: "Économie", total: ecoTotal },
        ].map(c => {
          const active = activeClass === c.id;
          return (
            <div key={c.id} style={{ background: active ? "rgba(201,169,110,0.1)" : C.card2, border: `2px solid ${active ? C.gold : C.border}`, borderRadius: "12px", padding: "18px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: active ? C.gold : C.muted, marginBottom: "8px", letterSpacing: "0.06em" }}>{c.emoji} {c.label.toUpperCase()}</div>
              <div style={{ fontSize: "26px", fontWeight: "900", color: active ? C.gold : C.text, letterSpacing: "-0.02em" }}>{c.total ? fmtN(c.total) : "-"}</div>
              <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>CHF</div>
            </div>
          );
        })}
      </div>

      {/* Detail breakdown table */}
      <ProseBlock lines={lines} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// METEO DISPLAY — icons + destination selector + clean text
// ═══════════════════════════════════════════════════════════════════

function MeteoDisplay({ lines }) {
  const [destIdx, setDestIdx] = useState(0);
  const src = clean(lines.join("\n"));

  // Try to split by destination if multi-destination
  const destBlocks = [];
  let curBlock = { dest: null, lines: [] };
  for (const l of lines) {
    const destHeader = l.match(/^\*\*([A-ZÀ-Ÿa-zà-ÿ\s]+(?:juillet|juin|août|sept)?[^*]*)\*\*\s*[:\-]/i)
      || l.match(/^##?\s*([A-ZÀ-Ÿa-zà-ÿ\s]{3,})\s*[\(:]/) ;
    if (destHeader && destBlocks.length > 0) {
      if (curBlock.lines.length > 0) destBlocks.push(curBlock);
      curBlock = { dest: destHeader[1].trim(), lines: [l] };
    } else {
      curBlock.lines.push(l);
    }
  }
  if (curBlock.lines.length > 0) destBlocks.push(curBlock);

  const hasDests = destBlocks.length > 1 && destBlocks[0].dest;
  const activeSrc = hasDests ? clean(destBlocks[destIdx].lines.join("\n")) : src;

  const emoji = wxEmoji(activeSrc);
  const temps = (activeSrc.match(/(\d{1,2})°/g) || []).map(t => parseInt(t)).filter(t => t > 0 && t < 50);
  const maxT = temps.length ? Math.max(...temps) : null;
  const minT = temps.length > 1 ? Math.min(...temps) : null;
  const seaM = activeSrc.match(/(?:mer|ocean|eau)[^.]*?(\d{1,2})°/i);
  const seaT = seaM ? seaM[1] : null;

  // Clean prose lines — no bullets, no periods on own line, join sentences
  const cleanProse = clean(activeSrc).split("\n")
    .map(l => l.replace(/^[-•*]\s*/, "").trim())
    .filter(l => l && l.length > 3 && !/^\|/.test(l) && l !== ".")
    .map(l => l.replace(/\*\*(.+?)\*\*/g, "$1"));

  return (
    <div>
      {/* Destination selector */}
      {hasDests && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
          {destBlocks.map((b, i) => (
            <button key={i} onClick={() => setDestIdx(i)} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${i === destIdx ? C.gold : C.border}`, background: i === destIdx ? "rgba(201,169,110,0.15)" : "transparent", color: i === destIdx ? C.gold : C.muted, fontSize: "12px", cursor: "pointer", fontWeight: i === destIdx ? "700" : "400" }}>
              {b.dest || `Destination ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "8px", marginBottom: "18px" }}>
        {maxT && (
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>{emoji}</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: C.gold }}>{maxT}°</div>
            {minT && <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>min {minT}°</div>}
            <div style={{ fontSize: "10px", color: C.muted, marginTop: "3px" }}>Température</div>
          </div>
        )}
        {seaT && (
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🌊</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: C.text }}>{seaT}°</div>
            <div style={{ fontSize: "10px", color: C.muted, marginTop: "3px" }}>Mer</div>
          </div>
        )}
        <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "6px" }}>{activeSrc.toLowerCase().includes("rare") || activeSrc.toLowerCase().includes("sec") ? "☀️" : "🌦️"}</div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>{activeSrc.toLowerCase().includes("rare") || activeSrc.toLowerCase().includes("sec") ? "Rares" : "Modérées"}</div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "3px" }}>Précipitations</div>
        </div>
        <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "6px" }}>🕶</div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>{activeSrc.toLowerCase().includes("élevé") || activeSrc.toLowerCase().includes("fort") ? "Élevé" : "Modéré"}</div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "3px" }}>UV</div>
        </div>
      </div>

      {/* Prose */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {cleanProse.map((l, i) => (
          <p key={i} style={{ margin: 0, fontSize: "14px", color: C.muted, lineHeight: "1.7" }}
            dangerouslySetInnerHTML={{ __html: renderInline(l) }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CALENDRIER — proper timeline
// ═══════════════════════════════════════════════════════════════════

function CalendrierDisplay({ lines }) {
  const entries = [];

  for (const l of lines) {
    const t = clean(l).trim();
    if (!t || /^\|[\s:\-|]+\|$/.test(t)) continue;

    // **date** : activity
    const bold = t.match(/^\*\*([^*]+)\*\*\s*[:\-·]\s*(.*)/);
    if (bold) { entries.push({ date: bold[1].trim(), lieu: "", activite: bold[2].trim() }); continue; }

    // Table row | date | lieu | activité
    if (t.startsWith("|")) {
      const cells = t.split("|").slice(1, -1).map(c => c.trim()).filter(c => c);
      if (cells.length >= 2 && !/^(?:date|jour|day)/i.test(cells[0])) {
        entries.push({ date: cells[0], lieu: cells[1], activite: cells[2] || "" }); continue;
      }
    }

    // "30 juin - Lieu - Activité" or "30 juin : Activité"
    const datePrefix = t.match(/^(\d{1,2}(?:\s*[-\/]\s*\d{1,2})?\s+(?:jan|fév|mar|avr|mai|juin|juil|août|sept|oct|nov|déc|january|february|march|april|may|june|july|august|september|october|november|december)[a-z]*(?:\s+\d{4})?)\s*[:\-·]\s*(.*)/i);
    if (datePrefix) { entries.push({ date: datePrefix[1].trim(), lieu: "", activite: datePrefix[2].trim() }); continue; }

    // "Jour N : ..."
    const jourN = t.match(/^(?:Jour|Day)\s*(\d+)\s*[:\-·]\s*(.*)/i);
    if (jourN) { entries.push({ date: `Jour ${jourN[1]}`, lieu: "", activite: jourN[2].trim() }); }
  }

  if (entries.length === 0) {
    return <ProseBlock lines={lines} />;
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: "19px", top: "30px", bottom: "30px", width: "2px", background: C.border }} />
      {entries.map((e, i) => {
        const isFirst = i === 0, isLast = i === entries.length - 1;
        const isTransit = /vol|flight|transit|départ|arrivée/i.test(e.activite + e.lieu);
        return (
          <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "12px", position: "relative" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: isFirst || isLast ? C.gold : isTransit ? "#1c3a5c" : C.card2, border: `2px solid ${isFirst || isLast ? C.gold : isTransit ? "#2563eb" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, marginTop: "4px" }}>
              <span style={{ fontSize: "14px" }}>{isFirst ? "🛫" : isLast ? "🛬" : isTransit ? "✈️" : "📍"}</span>
            </div>
            <div style={{ flex: 1, background: C.card2, border: `1px solid ${isFirst || isLast ? C.gold : C.border}`, borderRadius: "12px", padding: "12px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: "800", color: C.gold, letterSpacing: "0.06em", marginBottom: "3px" }}>{e.date.toUpperCase()}</div>
              {e.lieu && <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "2px" }}>{e.lieu}</div>}
              {e.activite && <div style={{ fontSize: "13px", color: C.muted, lineHeight: "1.5" }} dangerouslySetInnerHTML={{ __html: renderInline(e.activite) }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FIDELITE / RECOMMANDATION — clean prose cards
// ═══════════════════════════════════════════════════════════════════

function FideliteDisplay({ lines }) {
  const src = clean(lines.join("\n"));
  const cleanLines = src.split("\n").filter(l => l.trim() && l.trim() !== "|" && !/^\|[\s:-]+\|/.test(l.trim())).map(l => l.replace(/^[-•✅]\s*/, "").trim());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {cleanLines.filter(l => l.length > 5 && !l.startsWith("|")).map((item, i) => (
        <div key={i} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px", fontSize: "13px", color: C.muted, lineHeight: "1.7" }}>
          {/lounge/i.test(item) ? <span style={{ color: C.gold, marginRight: "6px" }}>✈</span> : /mile|award/i.test(item) ? <span style={{ color: C.gold, marginRight: "6px" }}>⭐</span> : /upgrade/i.test(item) ? <span style={{ color: C.gold, marginRight: "6px" }}>💺</span> : <span style={{ color: C.gold, marginRight: "6px" }}>💳</span>}
          <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS VIEW
// ═══════════════════════════════════════════════════════════════════

function ResultsView({ text }) {
  const [activeClass, setActiveClass] = useState("mixte");
  const sections = parseSections(text);
  if (!sections.length) return <ProseBlock lines={text.split("\n")} />;

  // Extract prices for tabs from Totaux section
  const tt = (sections.find(s => /total|coût/i.test(s.title))?.lines || []).join(" ");
  const prices = {
    business: tt.match(/business[^\d]*(\d[\d\s]{2,})/i)?.[1]?.trim() || null,
    mixte: tt.match(/mixte[^\d]*(\d[\d\s]{2,})/i)?.[1]?.trim() || tt.match(/mix[^\d]*(\d[\d\s]{2,})/i)?.[1]?.trim() || null,
    eco: tt.match(/[eé]co[^\d]*(\d[\d\s]{2,})/i)?.[1]?.trim() || null,
  };

  return (
    <div>
      {sections.map((sec, i) => {
        const isRecap = /récap/i.test(sec.title);
        const isVol = /vols?/i.test(sec.title) && !/revolut|astuce|fidél/i.test(sec.title);
        const isHotel = /héberg/i.test(sec.title);
        const isTotal = /total|coût/i.test(sec.title);
        const isMeteo = /météo|meteo/i.test(sec.title);
        const isCalendrier = /calendrier|planning/i.test(sec.title);
        const isRevolut = /revolut|astuce|fidél/i.test(sec.title);

        const hotelBlocks = isHotel ? parseHotelBlocks(sec.lines) : [];

        return (
          <AccCard key={i} title={sec.title} defaultOpen={isRecap} accent={isTotal}>
            {isRecap ? (
              <RecapDisplay lines={sec.lines} activeClass={activeClass} prices={prices} />
            ) : isVol ? (
              <FlightDisplay lines={sec.lines} activeClass={activeClass} setActiveClass={setActiveClass} prices={prices} />
            ) : isHotel && hotelBlocks.length > 0 ? (
              <div>
                {hotelBlocks.map((b, j) => b.isHeader
                  ? <DestinationHeader key={j} name={b.name} />
                  : <HotelCard key={j} name={b.name} lines={b.lines} />
                )}
              </div>
            ) : isTotal ? (
              <TotauxDisplay lines={sec.lines} activeClass={activeClass} />
            ) : isMeteo ? (
              <MeteoDisplay lines={sec.lines} />
            ) : isCalendrier ? (
              <CalendrierDisplay lines={sec.lines} />
            ) : isRevolut ? (
              <FideliteDisplay lines={sec.lines} />
            ) : (
              <ProseBlock lines={sec.lines} />
            )}
          </AccCard>
        );
      })}
    </div>
  );
}


// DATE FLEX CELL — date input + exact/±jours toggle + slider
// ═══════════════════════════════════════════════════════════════════

function DateFlexCell({value, onChange, flex, onFlexChange}) {
  return (
    <div>
      <input type="date" value={value} onChange={e=>onChange(e.target.value)} style={INP}/>
      <div style={{display:"flex",alignItems:"center",marginTop:"5px",gap:"5px"}}>
        <button onClick={()=>onFlexChange(0)} style={{
          fontSize:"9px",fontWeight:"700",padding:"3px 7px",
          borderRadius:"10px",border:`1px solid ${flex===0?C.gold:C.border}`,
          background:flex===0?"rgba(201,169,110,0.15)":"transparent",
          color:flex===0?C.gold:C.muted,cursor:"pointer",letterSpacing:"0.05em",whiteSpace:"nowrap",
        }}>EXACT</button>
        <button onClick={()=>onFlexChange(flex===0?3:flex)} style={{
          fontSize:"9px",fontWeight:"700",padding:"3px 7px",
          borderRadius:"10px",border:`1px solid ${flex>0?C.gold:C.border}`,
          background:flex>0?"rgba(201,169,110,0.15)":"transparent",
          color:flex>0?C.gold:C.muted,cursor:"pointer",letterSpacing:"0.05em",whiteSpace:"nowrap",
        }}>{flex>0?`± ${flex}j`:"± JOURS"}</button>
      </div>
      {flex>0&&(
        <div style={{marginTop:"7px",padding:"10px 12px",background:C.card2,borderRadius:"8px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
            <span style={{fontSize:"10px",color:C.muted,letterSpacing:"0.06em"}}>FLEXIBILITÉ</span>
            <span style={{fontSize:"12px",fontWeight:"800",color:C.gold}}>± {flex} jour{flex>1?"s":""}</span>
          </div>
          <input type="range" min="1" max="21" step="1" value={flex}
            onChange={e=>onFlexChange(+e.target.value)}
            style={{width:"100%",accentColor:C.gold,cursor:"pointer"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"9px",color:C.muted,marginTop:"4px"}}>
            <span>± 1j</span><span>± 7j</span><span>± 14j</span><span>± 21j</span>
          </div>
        </div>
      )}
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
  const [legs, setLegs] = useState([{to:"",depDate:"",retDate:"",depFlex:0,retFlex:0}]);
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

  const addLeg=()=>{if(legs.length<5)setLegs(l=>[...l,{to:"",depDate:l[l.length-1].retDate||"",retDate:"",depFlex:0,retFlex:0}]);};
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
      if(l.depDate) parts.push(`départ ${l.depDate}${l.depFlex>0?` (flexible ±${l.depFlex} jours, chercher le meilleur prix dans cette plage)`:""}`);
      if(l.retDate) parts.push(i===legs.length-1?`retour ${l.retDate}${l.retFlex>0?` (flexible ±${l.retFlex} jours)`:""}`:`arrivée ${l.retDate}${l.retFlex>0?` (flexible ±${l.retFlex} jours)`:""}`);
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
            <div key={idx} style={{display:"grid",gridTemplateColumns:"minmax(0,1.2fr) 20px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) 36px",gap:"8px",alignItems:"flex-start",marginBottom:"8px"}}>
              {idx===0
                ?<select value={from} onChange={e=>setFrom(e.target.value)} style={INP}>{AIRPORTS.map(a=><option key={a.code} value={a.code}>{a.code==="OTHER"?"✏ Autre":`${a.code} - ${a.name}`}</option>)}</select>
                :<div style={{...INP_RO,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{legs[idx-1].to||"-"}</div>
              }
              <div style={{textAlign:"center",color:C.gold,fontWeight:"900",fontSize:"16px",paddingTop:"13px"}}>→</div>
              <input value={leg.to} onChange={e=>updateLeg(idx,"to",e.target.value)} placeholder={["Marbella, Espagne","Chicago, USA","Costa Rica","Mykonos"][idx]||"Destination"} style={INP}/>
              <DateFlexCell value={leg.depDate} onChange={v=>updateLeg(idx,"depDate",v)} flex={leg.depFlex||0} onFlexChange={v=>updateLeg(idx,"depFlex",v)}/>
              <DateFlexCell value={leg.retDate} onChange={v=>updateLeg(idx,"retDate",v)} flex={leg.retFlex||0} onFlexChange={v=>updateLeg(idx,"retFlex",v)}/>
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
