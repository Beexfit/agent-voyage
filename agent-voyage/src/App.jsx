import { useState, useRef, useEffect } from "react";

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
  { code: "OTHER", name: "Autre — saisie manuelle" },
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

const DEFAULT_OPEN = new Set([
  "📋 Récapitulatif", "✈️ Vols", "🏨 Hébergements",
  "💰 Totaux en CHF", "💡 Recommandation", "💳 Astuce Revolut Ultra",
]);

const C = {
  bg: "#f8f7f4", white: "#ffffff", black: "#111111",
  border: "#1a1a1a", borderLight: "#dedad4",
  red: "#c8102e", muted: "#888888", faint: "#cccccc",
  sans: "system-ui, -apple-system, sans-serif",
};

const IS = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid #1a1a1a", borderRadius: "0",
  background: "#ffffff", color: "#111111",
  fontSize: "13px", fontWeight: "600",
  fontFamily: "system-ui, -apple-system, sans-serif",
  padding: "9px 11px", outline: "none",
  letterSpacing: "-0.01em",
  WebkitAppearance: "none", appearance: "none",
};

const IS_RO = {
  ...IS, background: "#f8f7f4", color: "#888888",
  border: "1px solid #dedad4", cursor: "default",
};

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "6px 14px", borderRadius: "20px",
      border: selected ? "1.5px solid #111111" : "1px solid #dedad4",
      background: selected ? "#111111" : "#ffffff",
      color: selected ? "#ffffff" : "#555",
      fontSize: "12px", cursor: "pointer",
      fontFamily: "system-ui, sans-serif",
      whiteSpace: "nowrap", lineHeight: "1.4",
    }}>
      {label}
    </button>
  );
}

function Lbl({ children, style = {} }) {
  return (
    <div style={{
      fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em",
      color: "#888888", fontFamily: "system-ui, sans-serif",
      marginBottom: "5px", textTransform: "uppercase", ...style,
    }}>
      {children}
    </div>
  );
}

function ImageGallery({ urls }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [lightbox, setLightbox] = useState(false);
  if (!urls || !urls.length) return null;
  return (
    <>
      <div style={{ position: "relative", marginBottom: "10px", background: "#f0ede8", height: "200px", overflow: "hidden" }}>
        {urls.map((url, i) => (
          <img key={i} src={url} alt=""
            onLoad={() => setLoaded(l => ({ ...l, [i]: true }))}
            onError={() => setLoaded(l => ({ ...l, [i]: false }))}
            onClick={() => setLightbox(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in", opacity: i === idx && loaded[i] !== false ? 1 : 0, transition: "opacity 0.3s", display: loaded[i] === false ? "none" : "block" }}
          />
        ))}
        {loaded[idx] === undefined && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "11px" }}>Chargement...</div>}
        {urls.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", width: "26px", height: "26px", cursor: "pointer", fontSize: "14px" }}>‹</button>
            <button onClick={() => setIdx(i => (i + 1) % urls.length)} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", width: "26px", height: "26px", cursor: "pointer", fontSize: "14px" }}>›</button>
            <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }}>
              {urls.map((_, i) => loaded[i] !== false && <div key={i} onClick={() => setIdx(i)} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer" }} />)}
            </div>
          </>
        )}
        <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "9px", padding: "2px 6px" }}>{idx + 1} / {urls.length}</div>
      </div>
      {urls.length > 1 && (
        <div style={{ display: "flex", gap: "4px", marginBottom: "12px", overflowX: "auto" }}>
          {urls.map((url, i) => loaded[i] !== false && <img key={i} src={url} alt="" onClick={() => setIdx(i)} style={{ width: "52px", height: "38px", objectFit: "cover", cursor: "pointer", flexShrink: 0, opacity: i === idx ? 1 : 0.5, border: i === idx ? "1.5px solid #111" : "1.5px solid transparent" }} onError={() => setLoaded(l => ({ ...l, [i]: false }))} />)}
        </div>
      )}
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={urls[idx]} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "28px", cursor: "pointer" }}>×</button>
        </div>
      )}
    </>
  );
}

function AccordionSection({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #dedad4" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", background: "none", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.14em", color: "#111111", fontFamily: "system-ui, sans-serif" }}>{title}</span>
        <span style={{ fontSize: "18px", color: "#888888", fontWeight: "300", lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ paddingBottom: "20px" }}>{children}</div>}
    </div>
  );
}

function HotelBlock({ name, lines }) {
  const [open, setOpen] = useState(true);
  const images = (() => { for (const l of lines) { const m = l.match(/^IMAGES:\s*(.+)/i); if (m) return m[1].split("|").map(u => u.trim()).filter(u => u.startsWith("http")); } return []; })();
  const contentLines = lines.filter(l => !/^IMAGES:/i.test(l));
  return (
    <div style={{ border: "1px solid #dedad4", marginBottom: "10px" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: "#f8f7f4", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#111111" }}>{name}</span>
        <span style={{ fontSize: "16px", color: "#888888", fontWeight: "300" }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "0 14px 14px" }}>{images.length > 0 && <ImageGallery urls={images} />}<MDInline text={contentLines.join("\n")} /></div>}
    </div>
  );
}

function MDInline({ text }) {
  if (!text) return null;
  const inline = s =>
    s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
     .replace(/\*(.+?)\*/g, "<em>$1</em>")
     .replace(/`(.+?)`/g, '<code style="background:#f0ede8;padding:1px 5px;font-family:monospace;font-size:11px;border:1px solid #dedad4">$1</code>')
     .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#c8102e;text-decoration:none;font-weight:600;border-bottom:1px solid #f0b0b0">$1 ↗</a>');
  const lines = text.split("\n");
  const out = [];
  let tbl = [], lst = [], lstOrd = false;
  const flushList = () => {
    if (!lst.length) return;
    const Tag = lstOrd ? "ol" : "ul";
    out.push(<Tag key={`l${out.length}`} style={{ margin: "0.5rem 0", paddingLeft: "1.4rem" }}>{lst.map((t, i) => <li key={i} style={{ margin: "0.25rem 0", lineHeight: "1.65", fontSize: "13px" }} dangerouslySetInnerHTML={{ __html: inline(t) }} />)}</Tag>);
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
          <thead><tr>{parse(head).map((h, i) => <th key={i} style={{ padding: "9px 12px", textAlign: "left", fontWeight: "700", background: "#111111", color: "#ffffff", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid #111111", whiteSpace: "nowrap" }} dangerouslySetInnerHTML={{ __html: inline(h) }} />)}</tr></thead>
          <tbody>{body.map((r, i) => { const cells = parse(r); const isOpt = r.includes("🔀") || r.toLowerCase().includes("optimal") || r.toLowerCase().includes("recommand"); return <tr key={i} style={{ background: isOpt ? "#fdf8f8" : i % 2 === 0 ? "#ffffff" : "#fafaf6" }}>{cells.map((c, j) => { const isPrice = /^\d[\d\s]+$/.test(c.trim()) && c.trim().replace(/\s/g,"").length >= 3; return <td key={j} style={{ padding: "9px 12px", border: "1px solid #dedad4", lineHeight: "1.5", fontSize: "13px", fontWeight: isPrice ? "900" : j === 0 ? "600" : "400", letterSpacing: isPrice ? "-0.02em" : "normal", color: isPrice && isOpt ? "#c8102e" : "#111111" }} dangerouslySetInnerHTML={{ __html: inline(c) }} />; })}</tr>; })}</tbody>
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
    if (/^[-*•] /.test(l)) { lst.push(l.replace(/^[-*•] /,"")); }
    else if (/^\d+\. /.test(l)) { lstOrd = true; lst.push(l.replace(/^\d+\. /,"")); }
    else if (/^---+$/.test(l.trim())) { flushList(); out.push(<div key={i} style={{ borderTop: "2px solid #111111", margin: "1.2rem 0" }} />); }
    else if (l.trim() === "") { flushList(); out.push(<div key={i} style={{ height: "0.4rem" }} />); }
    else { flushList(); out.push(<p key={i} style={{ margin: "0.3rem 0", lineHeight: "1.75", fontSize: "13px", color: "#111111" }} dangerouslySetInnerHTML={{ __html: inline(l) }} />); }
  }
  flushList(); flushTable();
  return <>{out}</>;
}

function ResultsDisplay({ text }) {
  const lines = text.split("\n");
  const sections = [];
  let current = null;
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) { if (current) sections.push(current); current = { title: h2[1].trim(), lines: [] }; }
    else if (current) current.lines.push(line);
  }
  if (current) sections.push(current);
  if (!sections.length) return <MDInline text={text} />;
  return (
    <div>
      {sections.map((section, i) => {
        const isHotel = /héberg/i.test(section.title);
        let hotelBlocks = [];
        if (isHotel) {
          let cur = null;
          for (const l of section.lines) {
            const h3 = l.match(/^### (.+)/);
            if (h3) { if (cur) hotelBlocks.push(cur); cur = { name: h3[1].trim(), lines: [] }; }
            else if (cur) cur.lines.push(l);
          }
          if (cur) hotelBlocks.push(cur);
        }
        return (
          <AccordionSection key={i} title={section.title} defaultOpen={DEFAULT_OPEN.has(section.title)}>
            {isHotel && hotelBlocks.length > 0 ? (
              <>
                {(() => { const pre = []; for (const l of section.lines) { if (/^### /.test(l)) break; pre.push(l); } return pre.length ? <MDInline text={pre.join("\n")} /> : null; })()}
                {hotelBlocks.map((b, j) => <HotelBlock key={j} name={b.name} lines={b.lines} />)}
              </>
            ) : <MDInline text={section.lines.join("\n")} />}
          </AccordionSection>
        );
      })}
    </div>
  );
}

export default function App() {
  const [from, setFrom] = useState("GVA");
  const [fromCustom, setFromCustom] = useState("");
  const [legs, setLegs] = useState([{ to: "", depDate: "", retDate: "" }]);
  const [travelers, setTravelers] = useState("1");
  const [vibes, setVibes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [tipIdx, setTipIdx] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (phase === "loading") timer.current = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 2800);
    else { clearInterval(timer.current); setTipIdx(0); }
    return () => clearInterval(timer.current);
  }, [phase]);

  const addLeg = () => { if (legs.length >= 5) return; setLegs(l => [...l, { to: "", depDate: l[l.length - 1].retDate || "", retDate: "" }]); };
  const removeLeg = idx => setLegs(l => l.filter((_, i) => i !== idx));
  const updateLeg = (idx, field, val) => {
    setLegs(l => {
      const next = l.map((leg, i) => i === idx ? { ...leg, [field]: val } : leg);
      if (field === "retDate" && idx + 1 < next.length) next[idx + 1] = { ...next[idx + 1], depDate: val };
      return next;
    });
  };
  const toggleVibe = id => setVibes(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const toggleAct  = id => setActivities(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);

  const buildPrompt = () => {
    const airport = from === "OTHER" ? fromCustom.toUpperCase() : from;
    const vibeLabels = VIBES.filter(v => vibes.includes(v.id)).map(v => v.label).join(", ");
    const actLabels  = ACTIVITIES.filter(a => activities.includes(a.id)).map(a => a.label).join(", ");
    const legLines = legs.filter(l => l.to).map((l, i) => {
      const fromPt = i === 0 ? airport : (legs[i - 1].to || airport);
      const parts = [`✈️ Vol ${i + 1} : ${fromPt} → ${l.to}`];
      if (l.depDate) parts.push(`départ le ${l.depDate}`);
      if (l.retDate) parts.push(i === legs.length - 1 ? `retour le ${l.retDate}` : `arrivée le ${l.retDate}`);
      return parts.join(" · ");
    });
    return ["Planifie ce voyage et recherche tous les prix en temps réel :", `🛫 Aéroport de base : ${airport}`, ...legLines, `👥 Voyageurs : ${travelers}`, vibeLabels ? `🎯 Ambiance : ${vibeLabels}` : "", actLabels ? `🏄 Activités : ${actLabels}` : "", notes ? `📝 Notes : ${notes}` : "", "", "Recherche vols sur Kayak et hébergements sur Booking/Airbnb. Fournis le tableau complet avec 3 scénarios de classe, totaux CHF, liens. Adapte les hébergements à l'ambiance souhaitée."].filter(Boolean).join("\n");
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
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem", background: "#f8f7f4", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <div style={{ borderLeft: "3px solid #c8102e", paddingLeft: "14px" }}>
          <div style={{ fontSize: "34px", fontWeight: "900", letterSpacing: "-0.05em", color: "#111111", lineHeight: "1" }}>VOYAGE</div>
          <div style={{ fontSize: "10px", color: "#cccccc", letterSpacing: "0.22em", marginTop: "4px" }}>PLANNING SYSTEM</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", marginTop: "4px" }}>
          {["GVA · ZRH · MXP", "CHF · 4★ · 8+/10", "Revolut Ultra"].map(t => <span key={t} style={{ fontSize: "10px", color: "#888888", letterSpacing: "0.06em" }}>{t}</span>)}
        </div>
      </div>

      {/* Form */}
      <div style={{ background: "#ffffff", border: "1px solid #dedad4", marginBottom: "2px" }}>
        <div style={{ padding: "24px 28px" }}>

          {/* Voyageurs */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Lbl style={{ marginBottom: 0 }}>Voyageurs</Lbl>
              <select value={travelers} onChange={e => setTravelers(e.target.value)} style={{ ...IS, width: "180px", padding: "7px 11px" }}>
                {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{String(n).padStart(2,"0")} — {n === 1 ? "personne" : "personnes"}</option>)}
              </select>
            </div>
          </div>

          {/* "Autre" custom airport input */}
          {from === "OTHER" && (
            <div style={{ marginBottom: "8px" }}>
              <input value={fromCustom} onChange={e => setFromCustom(e.target.value.toUpperCase())}
                placeholder="Code IATA — ex: LYS, NTE, ORY..." maxLength={4}
                style={{ ...IS, width: "220px", fontFamily: "monospace", letterSpacing: "0.12em" }} />
            </div>
          )}

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) 24px minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) 36px", gap: "6px", marginBottom: "6px" }}>
            <Lbl style={{ marginBottom: 0 }}>Depuis</Lbl>
            <div />
            <Lbl style={{ marginBottom: 0 }}>Vers</Lbl>
            <Lbl style={{ marginBottom: 0 }}>Date aller</Lbl>
            <Lbl style={{ marginBottom: 0 }}>Date retour</Lbl>
            <div />
          </div>

          {/* Legs */}
          {legs.map((leg, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) 24px minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) 36px", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
              {idx === 0 ? (
                <select value={from} onChange={e => setFrom(e.target.value)} style={IS}>
                  {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code === "OTHER" ? "✏ Autre" : `${a.code} — ${a.name}`}</option>)}
                </select>
              ) : (
                <div style={{ ...IS_RO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {legs[idx - 1].to || "—"}
                </div>
              )}
              <div style={{ textAlign: "center", color: "#c8102e", fontWeight: "900", fontSize: "15px" }}>→</div>
              <input value={leg.to} onChange={e => updateLeg(idx, "to", e.target.value)}
                placeholder={["Marbella, Espagne", "Chicago, USA", "Santa Teresa, CR", "Mykonos, Grèce"][idx] || "Destination"}
                style={IS} />
              <input type="date" value={leg.depDate} onChange={e => updateLeg(idx, "depDate", e.target.value)} style={IS} />
              <input type="date" value={leg.retDate} onChange={e => updateLeg(idx, "retDate", e.target.value)} style={IS} />
              {idx > 0 ? (
                <button onClick={() => removeLeg(idx)} style={{ width: "36px", height: "36px", border: "1px solid #dedad4", background: "#ffffff", cursor: "pointer", color: "#cccccc", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              ) : <div />}
            </div>
          ))}

          {legs.length < 5 && (
            <button onClick={addLeg} style={{ fontSize: "11px", padding: "5px 14px", border: "1px dashed #dedad4", background: "transparent", cursor: "pointer", color: "#888888", marginTop: "4px" }}>
              + Ajouter une étape ({legs.length}/5)
            </button>
          )}

          <div style={{ borderTop: "2px solid #111111", margin: "24px 0" }} />

          {/* Vibes */}
          <div style={{ marginBottom: "14px" }}>
            <Lbl>Ambiance recherchée</Lbl>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {VIBES.map(v => <Chip key={v.id} label={v.label} selected={vibes.includes(v.id)} onClick={() => toggleVibe(v.id)} />)}
            </div>
          </div>

          {/* Activities */}
          <div style={{ marginBottom: "14px" }}>
            <Lbl>Activités souhaitées</Lbl>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {ACTIVITIES.map(a => <Chip key={a.id} label={a.label} selected={activities.includes(a.id)} onClick={() => toggleAct(a.id)} />)}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "20px" }}>
            <Lbl>Notes spécifiques</Lbl>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Budget max, occasion spéciale, compagnie aérienne préférée, hôtel en particulier..."
              style={{ ...IS, minHeight: "56px", resize: "vertical", fontWeight: "400", fontSize: "13px" }} />
          </div>

          {err && <div style={{ fontSize: "13px", color: "#c8102e", background: "#fef5f5", border: "1px solid #c8102e", padding: "10px 14px", marginBottom: "16px" }}>⚠ {err}</div>}

          <button onClick={go} disabled={phase === "loading"}
            style={{ width: "100%", padding: "15px", background: phase === "loading" ? "#666666" : "#111111", color: "#ffffff", border: "none", cursor: phase === "loading" ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: "800", letterSpacing: "0.2em", opacity: phase === "loading" ? 0.65 : 1 }}>
            {phase === "loading" ? "RECHERCHE EN COURS..." : "LANCER LA RECHERCHE"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {phase === "loading" && (
        <div style={{ background: "#ffffff", border: "1px solid #dedad4", borderTop: "3px solid #c8102e", padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "1rem" }}>✈️</div>
          <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.14em", color: "#111111", marginBottom: "8px" }}>{TIPS[tipIdx].toUpperCase()}</div>
          <div style={{ fontSize: "10px", color: "#cccccc", fontFamily: "monospace", letterSpacing: "0.08em" }}>KAYAK · BOOKING · AIRBNB · GOOGLE FLIGHTS · SKYSCANNER · MOMONDO</div>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "1.5rem" }}>
            {TIPS.map((_, i) => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: i === tipIdx ? "#111111" : "#dedad4" }} />)}
          </div>
        </div>
      )}

      {/* Results */}
      {phase === "done" && result && (
        <div style={{ background: "#ffffff", border: "1px solid #dedad4", borderTop: "3px solid #c8102e" }}>
          <div style={{ padding: "12px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #111111", background: "#f8f7f4" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.14em", color: "#111111" }}>RÉSULTATS</span>
              <span style={{ fontSize: "10px", color: "#888888", letterSpacing: "0.1em" }}>
                {new Date().toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => navigator.clipboard?.writeText(result)} style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", padding: "5px 14px", background: "transparent", border: "1px solid #1a1a1a", cursor: "pointer", color: "#111111" }}>COPIER</button>
              <button onClick={reset} style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", padding: "5px 14px", background: "#111111", border: "1px solid #111111", cursor: "pointer", color: "#ffffff" }}>NOUVELLE RECHERCHE</button>
            </div>
          </div>
          <div style={{ padding: "4px 28px 28px" }}>
            <ResultsDisplay text={result} />
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: "#dedad4", letterSpacing: "0.12em", fontFamily: "monospace" }}>
        KAYAK · BOOKING · AIRBNB · GOOGLE FLIGHTS · SKYSCANNER · MOMONDO · EXPEDIA · OPODO
      </div>
    </div>
  );
}
