import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const AIRPORTS = [
  { code: "GVA", name: "Genève-Cointrin" },
  { code: "ZRH", name: "Zurich" },
  { code: "MXP", name: "Milan Malpensa" },
  { code: "CDG", name: "Paris Charles de Gaulle" },
  { code: "LHR", name: "Londres Heathrow" },
  { code: "BCN", name: "Barcelone" },
  { code: "FCO", name: "Rome Fiumicino" },
  { code: "AMS", name: "Amsterdam Schiphol" },
  { code: "MAD", name: "Madrid Barajas" },
  { code: "DXB", name: "Dubai" },
  { code: "JFK", name: "New York JFK" },
  { code: "LAX", name: "Los Angeles" },
  { code: "BKK", name: "Bangkok Suvarnabhumi" },
  { code: "SIN", name: "Singapour Changi" },
  { code: "OTHER", name: "Autre - saisie manuelle" },
];

const VIBES = [
  { id: "beach", label: "🏖 Plage & Mer" },
  { id: "city", label: "🏙 Ville & Culture" },
  { id: "nature", label: "🌿 Nature & Montagne" },
  { id: "party", label: "🎉 Fête & Nightlife" },
  { id: "gastro", label: "🍽 Gastronomie" },
  { id: "spa", label: "💆 Détente & Spa" },
  { id: "adventure", label: "🏄 Aventure & Sport" },
  { id: "romance", label: "💑 Romance" },
  { id: "luxury", label: "💎 Luxe & VIP" },
  { id: "family", label: "👨‍👩‍👧 Famille" },
];

const ACTIVITIES = [
  { id: "surf", label: "Surf" },
  { id: "golf", label: "Golf" },
  { id: "diving", label: "Plongée" },
  { id: "hiking", label: "Randonnée" },
  { id: "restaurants", label: "Restos étoilés" },
  { id: "shopping", label: "Shopping" },
  { id: "clubs", label: "Clubs & Bars" },
  { id: "yoga", label: "Yoga & Wellness" },
  { id: "museums", label: "Musées" },
  { id: "sailing", label: "Voile & Bateau" },
  { id: "skiing", label: "Ski" },
  { id: "snorkeling", label: "Snorkeling" },
  { id: "tennis", label: "Tennis" },
  { id: "safari", label: "Safari" },
];

const LOYALTY_PROGRAMS = [
  { id: "revolut_ultra", short: "Revolut Ultra" },
  { id: "amex_ch", short: "Amex" },
  { id: "ubs_infinite", short: "UBS Visa" },
  { id: "miles_more", short: "Miles & More" },
  { id: "marriott_bonvoy", short: "Marriott Bonvoy" },
  { id: "hilton_honors", short: "Hilton Honors" },
  { id: "world_of_hyatt", short: "World of Hyatt" },
  { id: "diners_club", short: "Diners Club" },
];

const POINTS_MARKS = [0, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];

const BAGGAGE_OPTIONS = [
  { id: "no_pref", label: "Pas de préférence" },
  { id: "cabin_only", label: "Cabine seulement" },
  { id: "1_checked_23", label: "1 bagage 23 kg" },
  { id: "2_checked_23", label: "2 bagages 23 kg" },
  { id: "sport", label: "Bagage sport / golf" },
];

const TIPS = [
  "Recherche des vols sur Kayak et Google Flights...",
  "Consultation de Skyscanner et Momondo...",
  "Vérification des hôtels sur Booking.com...",
  "Comparaison des appartements Airbnb...",
  "Calcul des 3 scénarios de classe...",
  "Conversion des prix en CHF...",
  "Analyse météo à destination...",
  "Finalisation de la recommandation...",
];

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS D2 (dark luxury + Airbnb feel)
// ═══════════════════════════════════════════════════════════════════

const C = {
  bg:      "#0a0a0a",
  card:    "#141414",
  card2:   "#1a1a1a",
  input:   "#1e1e1e",
  border:  "#2a2a2a",
  borderH: "#3d3d3d",
  text:    "#f0ead8",
  muted:   "#666666",
  faint:   "#333333",
  gold:    "#c9a96e",
  goldD:   "#9a7a50",
  red:     "#e05050",
  sans:    "system-ui, -apple-system, sans-serif",
};

const INP = {
  width: "100%", boxSizing: "border-box",
  background: C.input, border: `1px solid ${C.border}`,
  borderRadius: "10px", color: C.text,
  fontSize: "14px", fontFamily: C.sans,
  padding: "13px 16px", outline: "none",
  WebkitAppearance: "none", appearance: "none",
};

const INP_RO = { ...INP, color: C.muted, cursor: "default", background: C.card2 };

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function clean(text) {
  return text ? text.replace(/[—–]/g, " - ") : "";
}

function weatherEmoji(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("orage") || t.includes("storm")) return "⛈️";
  if (t.includes("pluie") || t.includes("rain") || t.includes("pluvieux")) return "🌧️";
  if (t.includes("nuageux") || t.includes("couvert") || t.includes("cloud")) return "☁️";
  if (t.includes("partiellement") || t.includes("partly") || t.includes("quelques nuages")) return "⛅";
  if (t.includes("neige") || t.includes("snow")) return "❄️";
  if (t.includes("vent") || t.includes("wind")) return "💨";
  if (t.includes("brouillard") || t.includes("fog")) return "🌫️";
  if (t.includes("soleil") || t.includes("sunny") || t.includes("ensoleillé") || t.includes("clair") || t.includes("beau")) return "☀️";
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
  const sections = [];
  let current = null;
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) { if (current) sections.push(current); current = { title: h2[1].trim(), lines: [] }; }
    else if (current) current.lines.push(line);
  }
  if (current) sections.push(current);
  return sections;
}

function parseHotelBlocks(lines) {
  const blocks = [];
  let cur = null;
  for (const l of lines) {
    const h3 = l.match(/^### (.+)/);
    if (h3) { if (cur) blocks.push(cur); cur = { name: h3[1].trim(), lines: [] }; }
    else if (cur) cur.lines.push(l);
  }
  if (cur) blocks.push(cur);
  return blocks;
}

function extractClassPrices(sections) {
  const totauxSec = sections.find(s => /total|coût/i.test(s.title));
  if (!totauxSec) return {};
  const t = totauxSec.lines.join(" ");
  const nums = (pattern) => { const m = t.match(pattern); return m ? m[1].replace(/\s/g,"") : null; };
  return {
    business: nums(/business[^0-9]*([0-9][\d\s]{2,})/i),
    mixte: nums(/mix[^0-9]*([0-9][\d\s]{2,})/i),
    eco: nums(/éco[^0-9]*([0-9][\d\s]{2,})/i),
  };
}

// ═══════════════════════════════════════════════════════════════════
// BASE COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Lbl({ children, s = {} }) {
  return <div style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", color: C.muted, marginBottom: "6px", textTransform: "uppercase", fontFamily: C.sans, ...s }}>{children}</div>;
}

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "7px 15px", borderRadius: "20px",
      border: `1px solid ${selected ? C.gold : C.border}`,
      background: selected ? "rgba(201,169,110,0.14)" : "transparent",
      color: selected ? C.gold : C.muted,
      fontSize: "12px", cursor: "pointer", fontFamily: C.sans, whiteSpace: "nowrap", lineHeight: "1.4",
    }}>{label}</button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOYALTY SELECTOR
// ═══════════════════════════════════════════════════════════════════

function LoyaltySelector({ selected, onChange, points, onPoints }) {
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: selected.length > 0 ? "16px" : "0" }}>
        {LOYALTY_PROGRAMS.map(p => {
          const on = selected.includes(p.id);
          return (
            <button key={p.id} onClick={() => onChange(on ? selected.filter(x => x !== p.id) : [...selected, p.id])} style={{
              padding: "6px 13px", borderRadius: "20px",
              border: `1px solid ${on ? C.gold : C.border}`,
              background: on ? "rgba(201,169,110,0.12)" : "transparent",
              color: on ? C.gold : C.muted,
              fontSize: "11px", cursor: "pointer", fontFamily: C.sans, whiteSpace: "nowrap",
            }}>{p.short}</button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ background: C.card2, borderRadius: "10px", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <Lbl s={{ marginBottom: 0 }}>Points / miles disponibles</Lbl>
            <span style={{ fontSize: "14px", fontWeight: "800", color: C.gold }}>
              {points >= 100000 ? ">100 000" : points.toLocaleString("fr-CH")} pts
            </span>
          </div>
          <input type="range" min="0" max="10" step="1"
            value={POINTS_MARKS.findIndex(v => v === points) < 0 ? 0 : POINTS_MARKS.findIndex(v => v === points)}
            onChange={e => onPoints(POINTS_MARKS[+e.target.value] || 0)}
            style={{ width: "100%", accentColor: C.gold, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: C.muted, marginTop: "5px" }}>
            {["0", "5k", "10k", "20k", "30k", "50k", ">100k"].map(l => <span key={l}>{l}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// IMAGE GALLERY
// ═══════════════════════════════════════════════════════════════════

function ImageGallery({ urls }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [lb, setLb] = useState(false);
  if (!urls || !urls.length) return null;
  return (
    <>
      <div style={{ position: "relative", height: "220px", background: C.card2, borderRadius: "10px", overflow: "hidden", marginBottom: "10px" }}>
        {urls.map((url, i) => (
          <img key={i} src={url} alt="" referrerPolicy="no-referrer"
            onLoad={() => setLoaded(l => ({...l, [i]: true}))}
            onError={() => setLoaded(l => ({...l, [i]: false}))}
            onClick={() => setLb(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in", opacity: i === idx && loaded[i] !== false ? 1 : 0, transition: "opacity 0.3s", display: loaded[i] === false ? "none" : "block" }}
          />
        ))}
        {loaded[idx] === undefined && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: "11px" }}>Chargement des photos...</div>}
        {urls.length > 1 && <>
          <button onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={() => setIdx(i => (i + 1) % urls.length)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }}>
            {urls.map((_, i) => loaded[i] !== false && <div key={i} onClick={() => setIdx(i)} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,0.35)", cursor: "pointer" }} />)}
          </div>
          <div style={{ position: "absolute", bottom: "10px", right: "12px", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "10px", padding: "2px 8px", borderRadius: "10px" }}>{idx+1}/{urls.length}</div>
        </>}
      </div>
      {urls.length > 1 && (
        <div style={{ display: "flex", gap: "5px", marginBottom: "14px", overflowX: "auto" }}>
          {urls.map((url, i) => loaded[i] !== false && (
            <img key={i} src={url} alt="" referrerPolicy="no-referrer" onClick={() => setIdx(i)}
              style={{ width: "56px", height: "42px", objectFit: "cover", cursor: "pointer", flexShrink: 0, borderRadius: "5px", opacity: i === idx ? 1 : 0.45, border: i === idx ? `2px solid ${C.gold}` : "2px solid transparent" }}
              onError={() => setLoaded(l => ({...l, [i]: false}))} />
          ))}
        </div>
      )}
      {lb && (
        <div onClick={() => setLb(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={urls[idx]} alt="" referrerPolicy="no-referrer" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLb(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "32px", cursor: "pointer" }}>×</button>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INLINE MARKDOWN RENDERER (dark theme)
// ═══════════════════════════════════════════════════════════════════

function MDInline({ text, activeClass }) {
  if (!text) return null;
  const src = clean(text);
  const link = (s) =>
    s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
     .replace(/\*(.+?)\*/g, "<em>$1</em>")
     .replace(/`(.+?)`/g, `<code style="background:#252525;padding:1px 5px;font-family:monospace;font-size:11px;border-radius:3px">$1</code>`)
     .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener" style="color:${C.gold};text-decoration:none;border-bottom:1px solid ${C.goldD}">$1 ↗</a>`);

  const lines = src.split("\n");
  const out = [];
  let tbl = [], lst = [], lstOrd = false;

  const flushList = () => {
    if (!lst.length) return;
    const Tag = lstOrd ? "ol" : "ul";
    out.push(<Tag key={`l${out.length}`} style={{ margin: "0.5rem 0", paddingLeft: "1.4rem" }}>
      {lst.map((t, i) => <li key={i} style={{ margin: "0.2rem 0", lineHeight: "1.65", fontSize: "13px", color: C.text }} dangerouslySetInnerHTML={{ __html: link(t) }} />)}
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
      <div key={`t${out.length}`} style={{ overflowX: "auto", margin: "0.8rem 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead><tr>
            {parse(head).map((h, i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: "700", background: "#1c1c1c", color: C.gold, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${C.border}`, whiteSpace: "nowrap" }} dangerouslySetInnerHTML={{ __html: link(h) }} />)}
          </tr></thead>
          <tbody>{body.map((r, i) => {
            const cells = parse(r);
            const isBiz = r.includes("💺") || r.toLowerCase().includes("business");
            const isMix = r.includes("🔀") || r.toLowerCase().includes("optimal") || r.toLowerCase().includes("mixte");
            const isEco = r.includes("🪑") || r.toLowerCase().includes("économ");
            let highlight = false;
            if (activeClass === "business" && isBiz) highlight = true;
            if (activeClass === "mixte" && isMix) highlight = true;
            if (activeClass === "eco" && isEco) highlight = true;
            const bg = highlight ? "rgba(201,169,110,0.1)" : i % 2 === 0 ? "#141414" : "#191919";
            return <tr key={i} style={{ background: bg }}>{cells.map((c, j) => {
              const isP = /^\d[\d\s]+$/.test(c.trim()) && c.trim().replace(/\s/g,"").length >= 3;
              return <td key={j} style={{ padding: "10px 14px", border: `1px solid ${C.border}`, lineHeight: "1.5", fontSize: "13px", fontWeight: isP ? "900" : j===0 ? "600" : "400", letterSpacing: isP ? "-0.02em" : "normal", color: highlight && isP ? C.gold : C.text }} dangerouslySetInnerHTML={{ __html: link(c) }} />;
            })}</tr>;
          })}</tbody>
        </table>
      </div>
    );
    tbl = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^IMAGES:/i.test(l) || /^#{1,3} /.test(l)) continue;
    if (l.startsWith("|")) { flushList(); tbl.push(l); continue; }
    flushTable();
    if (/^[-*•] /.test(l)) lst.push(l.replace(/^[-*•] /,""));
    else if (/^\d+\. /.test(l)) { lstOrd = true; lst.push(l.replace(/^\d+\. /,"")); }
    else if (/^---+$/.test(l.trim())) { flushList(); out.push(<div key={i} style={{ borderTop: `1px solid ${C.border}`, margin: "1.2rem 0" }} />); }
    else if (l.trim() === "") { flushList(); out.push(<div key={i} style={{ height: "0.35rem" }} />); }
    else { flushList(); out.push(<p key={i} style={{ margin: "0.3rem 0", lineHeight: "1.75", fontSize: "13px", color: C.text }} dangerouslySetInnerHTML={{ __html: link(l) }} />); }
  }
  flushList(); flushTable();
  return <>{out}</>;
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function AccordionCard({ title, icon, children, defaultOpen, accent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: C.card, border: `1px solid ${accent ? C.gold : C.border}`, borderRadius: "12px", marginBottom: "8px", overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? `1px solid ${C.border}` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "15px" }}>{icon}</span>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", color: accent ? C.gold : C.text, fontFamily: C.sans }}>{title}</span>
        </div>
        <span style={{ color: C.muted, fontSize: "18px", fontWeight: "300", lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "20px" }}>{children}</div>}
    </div>
  );
}

function HotelBlock({ name, lines, activeClass }) {
  const [open, setOpen] = useState(true);
  const images = extractImages(lines);
  const content = lines.filter(l => !/^IMAGES:/i.test(l));
  return (
    <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "10px", marginBottom: "10px", overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? `1px solid ${C.border}` : "none" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: C.text }}>{name}</span>
        <span style={{ color: C.muted, fontSize: "16px" }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding: "16px" }}>
          {images.length > 0 && <ImageGallery urls={images} />}
          {images.length === 0 && (
            <div style={{ height: "120px", background: C.card, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", color: C.muted, fontSize: "12px" }}>
              🏨 Photos non disponibles
            </div>
          )}
          <MDInline text={content.join("\n")} activeClass={activeClass} />
        </div>
      )}
    </div>
  );
}

function MeteoCard({ text }) {
  if (!text) return null;
  const src = clean(text);
  const emoji = weatherEmoji(src);
  const temps = (src.match(/(\d{1,2})°/g) || []).map(t => parseInt(t));
  const maxT = temps.length ? Math.max(...temps) : null;
  const minT = temps.length > 1 ? Math.min(...temps) : null;
  const seaMatch = src.match(/mer[^.]*?(\d{1,2})°/i);
  const seaT = seaMatch ? seaMatch[1] : null;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "8px", marginBottom: "16px" }}>
        {maxT && (
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "4px" }}>{emoji}</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: C.gold }}>{maxT}°</div>
            {minT && <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>min {minT}°</div>}
            <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>Température</div>
          </div>
        )}
        {seaT && (
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "4px" }}>🌊</div>
            <div style={{ fontSize: "24px", fontWeight: "900", color: C.text }}>{seaT}°</div>
            <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>Mer</div>
          </div>
        )}
        <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "4px" }}>
            {src.toLowerCase().includes("rare") || src.toLowerCase().includes("sec") ? "☀️" : src.toLowerCase().includes("pluie") ? "🌧️" : "🌤️"}
          </div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>
            {src.toLowerCase().includes("rare") || src.toLowerCase().includes("sec") ? "Peu de pluie" : src.toLowerCase().includes("modér") ? "Pluie modérée" : "Variable"}
          </div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>Précipitations</div>
        </div>
        <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "4px" }}>🕶</div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>
            {src.toLowerCase().includes("élevé") || src.toLowerCase().includes("fort") ? "Élevé" : src.toLowerCase().includes("modér") ? "Modéré" : "Normal"}
          </div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>UV / Soleil</div>
        </div>
      </div>
      <MDInline text={src} />
    </div>
  );
}

function ResultsView({ text }) {
  const [activeClass, setActiveClass] = useState("mixte");
  const sections = parseSections(text);
  if (!sections.length) return <MDInline text={text} />;
  const prices = extractClassPrices(sections);

  return (
    <div>
      {/* Class selector */}
      <div style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: "16px" }}>
        {[
          { id: "business", emoji: "💺", label: "Full Business", price: prices.business },
          { id: "mixte", emoji: "🔀", label: "Mixte", price: prices.mixte },
          { id: "eco", emoji: "🪑", label: "Économie", price: prices.eco },
        ].map((c, i) => (
          <button key={c.id} onClick={() => setActiveClass(c.id)} style={{
            flex: 1, padding: "14px 8px", textAlign: "center",
            background: activeClass === c.id ? C.gold : C.card2,
            color: activeClass === c.id ? "#0a0a0a" : C.muted,
            border: "none", borderLeft: i > 0 ? `1px solid ${C.border}` : "none",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.04em" }}>{c.emoji} {c.label}</div>
            {c.price && <div style={{ fontSize: "17px", fontWeight: "900", marginTop: "3px", letterSpacing: "-0.02em" }}>
              {parseInt(c.price) > 0 ? parseInt(c.price).toLocaleString("fr-CH") : c.price} CHF
            </div>}
          </button>
        ))}
      </div>

      {/* Render sections */}
      {sections.map((sec, i) => {
        const isHotel = /héberg/i.test(sec.title);
        const isVol = /^✈|vols?$/i.test(sec.title.replace(/##\s*/,"").trim()) && !/revolut|astuce/i.test(sec.title);
        const isMeteo = /météo|meteo|temps/i.test(sec.title);
        const isTotal = /total|coût/i.test(sec.title);
        const isRecap = /récap/i.test(sec.title);
        const isRevolut = /revolut|astuce|fidél/i.test(sec.title);
        const isCalendrier = /calendrier|planning/i.test(sec.title);
        const isReco = /recommand/i.test(sec.title);

        const icon = isRecap ? "📋" : isVol ? "✈️" : isHotel ? "🏨" : isTotal ? "💰" : isMeteo ? "🌤️" : isRevolut ? "💳" : isReco ? "💡" : isCalendrier ? "📅" : "📄";
        const defaultOpen = !isVol && !isCalendrier;

        const hotelBlocks = isHotel ? parseHotelBlocks(sec.lines) : [];

        return (
          <AccordionCard key={i} title={sec.title} icon={icon} defaultOpen={defaultOpen} accent={isTotal}>
            {isHotel && hotelBlocks.length > 0 ? (
              <>
                {(() => { const pre = []; for (const l of sec.lines) { if (/^### /.test(l)) break; pre.push(l); } return pre.length ? <MDInline text={pre.join("\n")} activeClass={activeClass} /> : null; })()}
                {hotelBlocks.map((b, j) => <HotelBlock key={j} name={b.name} lines={b.lines} activeClass={activeClass} />)}
              </>
            ) : isMeteo ? (
              <MeteoCard text={sec.lines.join("\n")} />
            ) : (
              <MDInline text={sec.lines.join("\n")} activeClass={activeClass} />
            )}
          </AccordionCard>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  const [activeTab, setActiveTab] = useState("trips");
  const [loyaltyCards, setLoyaltyCards] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [from, setFrom] = useState("GVA");
  const [fromCustom, setFromCustom] = useState("");
  const [legs, setLegs] = useState([{ to: "", depDate: "", retDate: "" }]);
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

  useEffect(() => {
    if (phase === "loading") timer.current = setInterval(() => setTipIdx(i => (i+1) % TIPS.length), 2800);
    else { clearInterval(timer.current); setTipIdx(0); }
    return () => clearInterval(timer.current);
  }, [phase]);

  const addLeg = () => { if (legs.length < 5) setLegs(l => [...l, { to: "", depDate: l[l.length-1].retDate || "", retDate: "" }]); };
  const removeLeg = idx => setLegs(l => l.filter((_, i) => i !== idx));
  const updateLeg = (idx, field, val) => {
    setLegs(l => {
      const n = l.map((leg, i) => i === idx ? {...leg, [field]: val} : leg);
      if (field === "retDate" && idx+1 < n.length) n[idx+1] = {...n[idx+1], depDate: val};
      return n;
    });
  };
  const toggleVibe = id => setVibes(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const toggleAct = id => setActivities(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);

  const buildPrompt = () => {
    const airport = from === "OTHER" ? fromCustom.toUpperCase() : from;
    const vibeLabels = VIBES.filter(v => vibes.includes(v.id)).map(v => v.label).join(", ");
    const actLabels = ACTIVITIES.filter(a => activities.includes(a.id)).map(a => a.label).join(", ");
    const legLines = legs.filter(l => l.to).map((l, i) => {
      const fp = i === 0 ? airport : (legs[i-1].to || airport);
      const parts = [`Vol ${i+1} : ${fp} -> ${l.to}`];
      if (l.depDate) parts.push(`départ ${l.depDate}`);
      if (l.retDate) parts.push(i === legs.length-1 ? `retour ${l.retDate}` : `arrivée ${l.retDate}`);
      return "✈️ " + parts.join(" - ");
    });
    const baggageLabel = BAGGAGE_OPTIONS.find(b => b.id === baggage)?.label || "";
    const loyaltyInfo = loyaltyCards.length > 0
      ? `🎫 Programmes actifs : ${loyaltyCards.map(id => LOYALTY_PROGRAMS.find(p => p.id === id)?.short).join(", ")} - Points disponibles : ${loyaltyPoints >= 100000 ? ">100 000" : loyaltyPoints.toLocaleString("fr-CH")} pts`
      : "";

    return [
      "Planifie ce voyage, recherche tous les prix en temps réel et utilise le tiret simple ' - ' uniquement (jamais de tirets em ou en) :",
      `Aéroport de base : ${airport}`,
      ...legLines,
      `Voyageurs : ${travelers}`,
      baggage !== "no_pref" ? `Bagages : ${baggageLabel}` : "",
      loyaltyInfo,
      vibeLabels ? `Ambiance : ${vibeLabels}` : "",
      actLabels ? `Activités : ${actLabels}` : "",
      notes ? `Notes : ${notes}` : "",
      "",
      "Recherche vols sur Kayak et hébergements sur Booking/Airbnb. Tableau complet, 3 scénarios de classe, totaux CHF, liens. Adapte hébergements à l'ambiance. Pour chaque hôtel, cherche et inclus les URLs d'images réelles (Booking.com CDN ou TripAdvisor) sur la ligne IMAGES: url1 | url2 | url3.",
    ].filter(Boolean).join("\n");
  };

  const go = async () => {
    if (!legs[0].to || !legs[0].depDate) { setErr("Au minimum : une destination et une date de départ."); return; }
    if (from === "OTHER" && !fromCustom.trim()) { setErr("Merci d'entrer le code IATA de ton aéroport."); return; }
    setPhase("loading"); setErr(""); setResult("");
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: buildPrompt() }] }) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);
      setResult(data.text || "Aucun résultat."); setPhase("done");
    } catch (e) { setErr(e.message); setPhase("error"); }
  };

  const reset = () => { setPhase("idle"); setResult(""); setErr(""); };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem", background: C.bg, minHeight: "100vh", fontFamily: C.sans }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div style={{ borderLeft: `3px solid ${C.gold}`, paddingLeft: "14px" }}>
          <div style={{ fontSize: "32px", fontWeight: "900", letterSpacing: "-0.05em", color: C.text, lineHeight: "1" }}>VOYAGE</div>
          <div style={{ fontSize: "9px", color: C.faint, letterSpacing: "0.25em", marginTop: "3px" }}>PLANNING SYSTEM</div>
        </div>
        <div style={{ fontSize: "10px", color: C.muted, textAlign: "right", lineHeight: "1.8", marginTop: "4px" }}>
          <div>GVA - ZRH - MXP</div>
          <div>CHF - 4★ - 8+/10</div>
        </div>
      </div>

      {/* NAV TABS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[{ id:"trips", label:"🗺 Trips" }, { id:"vols", label:"✈️ Vols" }, { id:"hotels", label:"🏨 Hébergements" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "9px 18px", borderRadius: "20px",
            border: `1px solid ${activeTab === tab.id ? C.gold : C.border}`,
            background: activeTab === tab.id ? C.gold : "transparent",
            color: activeTab === tab.id ? "#0a0a0a" : C.muted,
            fontSize: "12px", fontWeight: activeTab === tab.id ? "700" : "500",
            cursor: "pointer", letterSpacing: "0.05em",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* LOYALTY SECTION */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px 22px", marginBottom: "10px" }}>
        <Lbl>Programmes de fidélité</Lbl>
        <LoyaltySelector selected={loyaltyCards} onChange={setLoyaltyCards} points={loyaltyPoints} onPoints={setLoyaltyPoints} />
      </div>

      {/* SEARCH FORM */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden" }}>

        {/* Top strip: voyageurs + bagages */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "16px" }}>
          <div>
            <Lbl>Voyageurs</Lbl>
            <select value={travelers} onChange={e => setTravelers(e.target.value)} style={INP}>
              {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{String(n).padStart(2,"0")} - {n===1?"personne":"personnes"}</option>)}
            </select>
          </div>
          <div>
            <Lbl>Bagages</Lbl>
            <select value={baggage} onChange={e => setBaggage(e.target.value)} style={INP}>
              {BAGGAGE_OPTIONS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
        </div>

        {/* Airport OTHER input */}
        {from === "OTHER" && (
          <div style={{ padding: "14px 24px 0" }}>
            <input value={fromCustom} onChange={e => setFromCustom(e.target.value.toUpperCase())}
              placeholder="Code IATA - ex: LYS, NTE, ORY..." maxLength={4}
              style={{ ...INP, width: "200px", fontFamily: "monospace", letterSpacing: "0.12em" }} />
          </div>
        )}

        {/* FLIGHT LEGS */}
        <div style={{ padding: "20px 24px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) 20px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) 36px", gap: "8px", marginBottom: "8px" }}>
            <Lbl s={{ marginBottom: 0 }}>Depuis</Lbl>
            <div />
            <Lbl s={{ marginBottom: 0 }}>Vers</Lbl>
            <Lbl s={{ marginBottom: 0 }}>Date aller</Lbl>
            <Lbl s={{ marginBottom: 0 }}>Date retour</Lbl>
            <div />
          </div>
          {legs.map((leg, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) 20px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) 36px", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              {idx === 0 ? (
                <select value={from} onChange={e => setFrom(e.target.value)} style={INP}>
                  {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code === "OTHER" ? "✏ Autre" : `${a.code} - ${a.name}`}</option>)}
                </select>
              ) : (
                <div style={{ ...INP_RO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{legs[idx-1].to || "-"}</div>
              )}
              <div style={{ textAlign: "center", color: C.gold, fontWeight: "900", fontSize: "16px" }}>→</div>
              <input value={leg.to} onChange={e => updateLeg(idx, "to", e.target.value)}
                placeholder={["Marbella, Espagne", "Chicago, USA", "Costa Rica", "Mykonos"][idx] || "Destination"}
                style={INP} />
              <input type="date" value={leg.depDate} onChange={e => updateLeg(idx, "depDate", e.target.value)} style={INP} />
              <input type="date" value={leg.retDate} onChange={e => updateLeg(idx, "retDate", e.target.value)} style={INP} />
              {idx > 0
                ? <button onClick={() => removeLeg(idx)} style={{ width: "36px", height: "36px", border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px" }}>×</button>
                : <div />
              }
            </div>
          ))}
          {legs.length < 5 && (
            <button onClick={addLeg} style={{ fontSize: "11px", padding: "7px 16px", border: `1px dashed ${C.border}`, background: "transparent", cursor: "pointer", color: C.muted, borderRadius: "8px", marginTop: "4px", marginBottom: "8px" }}>
              + Ajouter une étape ({legs.length}/5)
            </button>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${C.border}` }} />

        {/* VIBES */}
        <div style={{ padding: "20px 24px 14px" }}>
          <Lbl>Ambiance</Lbl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {VIBES.map(v => <Chip key={v.id} label={v.label} selected={vibes.includes(v.id)} onClick={() => toggleVibe(v.id)} />)}
          </div>
        </div>

        {/* ACTIVITIES */}
        <div style={{ padding: "0 24px 14px" }}>
          <Lbl>Activités</Lbl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {ACTIVITIES.map(a => <Chip key={a.id} label={a.label} selected={activities.includes(a.id)} onClick={() => toggleAct(a.id)} />)}
          </div>
        </div>

        {/* NOTES */}
        <div style={{ padding: "0 24px 20px" }}>
          <Lbl>Notes spécifiques</Lbl>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Budget max, occasion spéciale, compagnie préférée..."
            style={{ ...INP, minHeight: "56px", resize: "vertical" }} />
        </div>

        {err && <div style={{ margin: "0 24px 16px", fontSize: "13px", color: "#ff7070", background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: "8px", padding: "10px 14px" }}>⚠ {err}</div>}

        {/* CTA */}
        <div style={{ padding: "0 24px 24px" }}>
          <button onClick={go} disabled={phase==="loading"} style={{
            width: "100%", padding: "16px",
            background: phase === "loading" ? C.faint : C.gold,
            color: phase === "loading" ? C.muted : "#0a0a0a",
            border: "none", borderRadius: "12px",
            cursor: phase === "loading" ? "not-allowed" : "pointer",
            fontSize: "12px", fontWeight: "800", letterSpacing: "0.18em",
            opacity: phase === "loading" ? 0.7 : 1,
          }}>
            {phase === "loading" ? "RECHERCHE EN COURS..." : "LANCER LA RECHERCHE"}
          </button>
        </div>
      </div>

      {/* LOADING */}
      {phase === "loading" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "3rem", textAlign: "center", marginTop: "10px" }}>
          <div style={{ fontSize: "44px", marginBottom: "1rem" }}>✈️</div>
          <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.14em", color: C.text, marginBottom: "8px" }}>{TIPS[tipIdx].toUpperCase()}</div>
          <div style={{ fontSize: "10px", color: C.muted, fontFamily: "monospace", letterSpacing: "0.08em" }}>KAYAK - BOOKING - AIRBNB - GOOGLE FLIGHTS - SKYSCANNER - MOMONDO</div>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "1.5rem" }}>
            {TIPS.map((_, i) => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: i === tipIdx ? C.gold : C.border }} />)}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "done" && result && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.14em", color: C.text }}>RÉSULTATS</span>
              <span style={{ fontSize: "10px", color: C.muted }}>{new Date().toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => navigator.clipboard?.writeText(result)} style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", padding: "6px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", cursor: "pointer", color: C.muted }}>COPIER</button>
              <button onClick={reset} style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", padding: "6px 14px", background: C.gold, border: "none", borderRadius: "6px", cursor: "pointer", color: "#0a0a0a" }}>NOUVELLE RECHERCHE</button>
            </div>
          </div>
          <ResultsView text={result} />
        </div>
      )}

      <div style={{ marginTop: "24px", textAlign: "center", fontSize: "10px", color: C.faint, letterSpacing: "0.1em", fontFamily: "monospace" }}>
        KAYAK - BOOKING - AIRBNB - GOOGLE FLIGHTS - SKYSCANNER - MOMONDO - EXPEDIA - OPODO
      </div>
    </div>
  );
}
