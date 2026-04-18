import { useState, useRef, useEffect } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

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

// Sections open by default
const DEFAULT_OPEN = new Set(["📋 Récapitulatif", "✈️ Vols", "🏨 Hébergements", "💰 Totaux en CHF", "💡 Recommandation", "💳 Astuce Revolut Ultra"]);

// ── Design tokens D1 ─────────────────────────────────────────────────────────
const C = {
  bg: "#f8f7f4",
  white: "#ffffff",
  black: "#111111",
  border: "#1a1a1a",
  borderLight: "#dedad4",
  red: "#c8102e",
  muted: "#888888",
  faint: "#cccccc",
  sans: "system-ui, -apple-system, sans-serif",
};

// ── Shared input style ────────────────────────────────────────────────────────
const IS = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${C.border}`,
  borderRadius: "0",
  background: C.white,
  color: C.black,
  fontSize: "14px",
  fontWeight: "700",
  fontFamily: C.sans,
  padding: "9px 11px",
  outline: "none",
  letterSpacing: "-0.01em",
  WebkitAppearance: "none",
  appearance: "none",
};

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "6px 14px", borderRadius: "20px",
      border: selected ? `1.5px solid ${C.black}` : `1px solid ${C.borderLight}`,
      background: selected ? C.black : C.white,
      color: selected ? C.white : "#555",
      fontSize: "12px", cursor: "pointer", fontFamily: C.sans,
      whiteSpace: "nowrap", lineHeight: "1.4",
      transition: "border 0.12s, background 0.12s, color 0.12s",
    }}>
      {label}
    </button>
  );
}

// ── Label uppercase ───────────────────────────────────────────────────────────
function Lbl({ children }) {
  return (
    <div style={{
      fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em",
      color: C.muted, fontFamily: C.sans, marginBottom: "6px", textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

// ── Image gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ urls }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [lightbox, setLightbox] = useState(false);
  if (!urls || !urls.length) return null;

  const validUrls = urls.filter((_, i) => loaded[i] !== false);

  return (
    <>
      <div style={{ position: "relative", marginBottom: "12px", background: "#f0ede8", height: "220px", overflow: "hidden" }}>
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            onLoad={() => setLoaded(l => ({ ...l, [i]: true }))}
            onError={() => setLoaded(l => ({ ...l, [i]: false }))}
            onClick={() => setLightbox(true)}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", cursor: "zoom-in",
              opacity: i === idx && loaded[i] !== false ? 1 : 0,
              transition: "opacity 0.3s",
              display: loaded[i] === false ? "none" : "block",
            }}
          />
        ))}
        {loaded[idx] === undefined && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontSize: "12px", fontFamily: C.sans }}>
            Chargement...
          </div>
        )}
        {urls.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)}
              style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", width: "28px", height: "28px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ‹
            </button>
            <button onClick={() => setIdx(i => (i + 1) % urls.length)}
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", width: "28px", height: "28px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ›
            </button>
            <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }}>
              {urls.map((_, i) => loaded[i] !== false && (
                <div key={i} onClick={() => setIdx(i)} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === idx ? C.white : "rgba(255,255,255,0.45)", cursor: "pointer" }} />
              ))}
            </div>
          </>
        )}
        <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "9px", padding: "2px 6px", fontFamily: C.sans, letterSpacing: "0.08em" }}>
          {idx + 1} / {urls.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {urls.length > 1 && (
        <div style={{ display: "flex", gap: "4px", marginBottom: "14px", overflowX: "auto" }}>
          {urls.map((url, i) => loaded[i] !== false && (
            <img key={i} src={url} alt="" onClick={() => setIdx(i)}
              style={{ width: "56px", height: "40px", objectFit: "cover", cursor: "pointer", opacity: i === idx ? 1 : 0.5, flexShrink: 0, border: i === idx ? `1.5px solid ${C.black}` : "1.5px solid transparent" }}
              onError={() => setLoaded(l => ({ ...l, [i]: false }))}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={urls[idx]} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(false)}
            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "28px", cursor: "pointer" }}>
            ×
          </button>
        </div>
      )}
    </>
  );
}

// ── Accordion section ─────────────────────────────────────────────────────────
function AccordionSection({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  // Strip emoji from title for display key
  const cleanTitle = title.replace(/[^\w\s&]/g, "").trim();

  return (
    <div style={{ borderBottom: `1px solid ${C.borderLight}` }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0.14em", color: C.black, fontFamily: C.sans }}>
          {title}
        </span>
        <span style={{ fontSize: "18px", color: C.muted, fontWeight: "300", lineHeight: 1 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div style={{ paddingBottom: "20px" }}>{children}</div>}
    </div>
  );
}

// ── Inline markdown renderer ──────────────────────────────────────────────────
function MDInline({ text }) {
  if (!text) return null;

  const inline = (s) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, `<code style="background:#f0ede8;padding:1px 5px;font-family:monospace;font-size:11px;border:1px solid #dedad4">$1</code>`)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener" style="color:${C.red};text-decoration:none;font-weight:600;border-bottom:1px solid #f0b0b0">$1 ↗</a>`);

  const lines = text.split("\n");
  const out = [];
  let tbl = [], lst = [], lstOrdered = false;

  const flushList = () => {
    if (!lst.length) return;
    const Tag = lstOrdered ? "ol" : "ul";
    out.push(
      <Tag key={`l${out.length}`} style={{ margin: "0.5rem 0", paddingLeft: "1.4rem" }}>
        {lst.map((t, i) => (
          <li key={i} style={{ margin: "0.25rem 0", lineHeight: "1.65", fontSize: "13px", fontFamily: C.sans }}
            dangerouslySetInnerHTML={{ __html: inline(t) }} />
        ))}
      </Tag>
    );
    lst = []; lstOrdered = false;
  };

  const flushTable = () => {
    if (!tbl.length) return;
    const rows = tbl.filter(r => !/^\|[\s:\-|]+\|$/.test(r.trim()));
    if (!rows.length) { tbl = []; return; }
    const parse = r => r.split("|").slice(1, -1).map(c => c.trim());
    const [head, ...body] = rows;
    out.push(
      <div key={`t${out.length}`} style={{ overflowX: "auto", margin: "0.8rem 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: C.sans }}>
          <thead>
            <tr>
              {parse(head).map((h, i) => (
                <th key={i} style={{ padding: "9px 12px", textAlign: "left", fontWeight: "700", background: C.black, color: C.white, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${C.black}`, whiteSpace: "nowrap" }}
                  dangerouslySetInnerHTML={{ __html: inline(h) }} />
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, i) => {
              const cells = parse(r);
              const isOpt = r.includes("🔀") || r.toLowerCase().includes("optimal") || r.toLowerCase().includes("recommand");
              return (
                <tr key={i} style={{ background: isOpt ? "#fdf8f8" : i % 2 === 0 ? C.white : "#fafaf6" }}>
                  {cells.map((c, j) => {
                    const isPrice = /^\d[\d\s]+$/.test(c.trim()) && c.trim().replace(/\s/g, "").length >= 3;
                    return (
                      <td key={j} style={{ padding: "9px 12px", border: `1px solid ${C.borderLight}`, lineHeight: "1.5", fontSize: "13px", fontWeight: isPrice ? "900" : j === 0 ? "600" : "400", letterSpacing: isPrice ? "-0.02em" : "normal", color: isPrice && isOpt ? C.red : C.black }}
                        dangerouslySetInnerHTML={{ __html: inline(c) }} />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tbl = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Skip IMAGES: lines — handled by parent
    if (/^IMAGES:/i.test(l)) continue;
    // Skip ## and ### — handled by parent
    if (/^#{1,3} /.test(l)) continue;

    if (l.startsWith("|")) { flushList(); tbl.push(l); continue; }
    flushTable();

    if (/^[-*•] /.test(l)) { lst.push(l.replace(/^[-*•] /, "")); }
    else if (/^\d+\. /.test(l)) { lstOrdered = true; lst.push(l.replace(/^\d+\. /, "")); }
    else if (/^---+$/.test(l.trim())) { flushList(); out.push(<div key={i} style={{ borderTop: `2px solid ${C.black}`, margin: "1.2rem 0" }} />); }
    else if (l.trim() === "") { flushList(); out.push(<div key={i} style={{ height: "0.4rem" }} />); }
    else { flushList(); out.push(<p key={i} style={{ margin: "0.3rem 0", lineHeight: "1.75", fontSize: "13px", fontFamily: C.sans, color: C.black }} dangerouslySetInnerHTML={{ __html: inline(l) }} />); }
  }
  flushList(); flushTable();
  return <>{out}</>;
}

// ── Parse raw markdown into sections ─────────────────────────────────────────
function parseSections(text) {
  const lines = text.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (current) sections.push(current);
      current = { title: h2[1].trim(), lines: [] };
    } else {
      if (current) current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

// ── Parse hotel sub-sections (### headers within a section) ──────────────────
function parseHotelBlocks(lines) {
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      if (current) blocks.push(current);
      current = { name: h3[1].trim(), lines: [] };
    } else {
      if (current) current.lines.push(line);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

// ── Extract image URLs from IMAGES: lines ────────────────────────────────────
function extractImages(lines) {
  for (const line of lines) {
    const m = line.match(/^IMAGES:\s*(.+)/i);
    if (m) {
      return m[1].split("|").map(u => u.trim()).filter(u => u.startsWith("http"));
    }
  }
  return [];
}

// ── Hotel block renderer ──────────────────────────────────────────────────────
function HotelBlock({ name, lines }) {
  const [open, setOpen] = useState(true);
  const images = extractImages(lines);
  const contentLines = lines.filter(l => !/^IMAGES:/i.test(l));

  return (
    <div style={{ border: `1px solid ${C.borderLight}`, marginBottom: "12px" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 14px", background: C.bg, border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: C.black, letterSpacing: "-0.01em" }}>{name}</span>
        <span style={{ fontSize: "16px", color: C.muted, fontWeight: "300" }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          {images.length > 0 && <ImageGallery urls={images} />}
          <MDInline text={contentLines.join("\n")} />
        </div>
      )}
    </div>
  );
}

// ── Full results renderer ─────────────────────────────────────────────────────
function ResultsDisplay({ text }) {
  const sections = parseSections(text);
  if (!sections.length) return <MDInline text={text} />;

  return (
    <div>
      {sections.map((section, i) => {
        const isHotelSection = /héberg/i.test(section.title);
        const hotelBlocks = isHotelSection ? parseHotelBlocks(section.lines) : [];
        const isOpen = DEFAULT_OPEN.has(section.title);

        return (
          <AccordionSection key={i} title={section.title} defaultOpen={isOpen}>
            {isHotelSection && hotelBlocks.length > 0 ? (
              <>
                {/* Render any content before the first ### */}
                {(() => {
                  const preLines = [];
                  for (const l of section.lines) {
                    if (/^### /.test(l)) break;
                    preLines.push(l);
                  }
                  return preLines.length > 0 ? <MDInline text={preLines.join("\n")} /> : null;
                })()}
                {hotelBlocks.map((block, j) => (
                  <HotelBlock key={j} name={block.name} lines={block.lines} />
                ))}
              </>
            ) : (
              <MDInline text={section.lines.join("\n")} />
            )}
          </AccordionSection>
        );
      })}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [from, setFrom] = useState("GVA");
  const [fromCustom, setFromCustom] = useState("");
  const [stages, setStages] = useState([{ dest: "", arrival: "" }]);
  const [depDate, setDepDate] = useState("");
  const [retDate, setRetDate] = useState("");
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
    if (phase === "loading") {
      timer.current = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 2800);
    } else {
      clearInterval(timer.current);
      setTipIdx(0);
    }
    return () => clearInterval(timer.current);
  }, [phase]);

  const addStage = () => { if (stages.length < 5) setStages(s => [...s, { dest: "", arrival: "" }]); };
  const removeStage = (idx) => setStages(s => s.filter((_, i) => i !== idx));
  const updateStage = (idx, f, v) => setStages(s => s.map((item, i) => i === idx ? { ...item, [f]: v } : item));
  const toggleVibe = (id) => setVibes(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const toggleAct = (id) => setActivities(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);

  const buildPrompt = () => {
    const airport = from === "OTHER" ? fromCustom.toUpperCase() : from;
    const vibeLabels = VIBES.filter(v => vibes.includes(v.id)).map(v => v.label).join(", ");
    const actLabels = ACTIVITIES.filter(a => activities.includes(a.id)).map(a => a.label).join(", ");
    const stageLines = stages.filter(s => s.dest).map((s, i) => `📍 Étape ${i + 1} : ${s.dest}${s.arrival ? ` (arrivée le ${s.arrival})` : ""}`).join("\n");
    return [
      "Planifie ce voyage et recherche tous les prix en temps réel :",
      `🛫 Depuis : ${airport}`,
      `📅 Départ : ${depDate}`,
      stageLines,
      `🛬 Retour : ${retDate}`,
      `👥 Voyageurs : ${travelers}`,
      vibeLabels ? `🎯 Ambiance : ${vibeLabels}` : "",
      actLabels ? `🏄 Activités : ${actLabels}` : "",
      notes ? `📝 Notes : ${notes}` : "",
      "",
      "Recherche vols sur Kayak et hébergements sur Booking/Airbnb. Fournis le tableau complet avec 3 scénarios de classe, totaux CHF, liens. Adapte les hébergements à l'ambiance souhaitée.",
    ].filter(Boolean).join("\n");
  };

  const go = async () => {
    if (!stages[0]?.dest || !depDate || !retDate) {
      setErr("Au minimum : destination étape 1, date de départ et date de retour."); return;
    }
    if (from === "OTHER" && !fromCustom.trim()) {
      setErr("Merci d'entrer le code IATA de ton aéroport."); return;
    }
    setPhase("loading"); setErr(""); setResult("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: buildPrompt() }] }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);
      setResult(data.text || "Aucun résultat."); setPhase("done");
    } catch (e) {
      setErr(e.message); setPhase("error");
    }
  };

  const reset = () => { setPhase("idle"); setResult(""); setErr(""); };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem 1.5rem", background: C.bg, minHeight: "100vh", fontFamily: C.sans }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <div style={{ borderLeft: `3px solid ${C.red}`, paddingLeft: "14px" }}>
          <div style={{ fontSize: "34px", fontWeight: "900", letterSpacing: "-0.05em", color: C.black, lineHeight: "1" }}>VOYAGE</div>
          <div style={{ fontSize: "10px", color: C.faint, letterSpacing: "0.22em", marginTop: "4px" }}>PLANNING SYSTEM</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", marginTop: "4px" }}>
          {["GVA · ZRH · MXP", "CHF · 4★ · 8+/10", "Revolut Ultra"].map(t => (
            <span key={t} style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.06em" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ background: C.white, border: `1px solid ${C.borderLight}`, marginBottom: "2px" }}>
        <div style={{ padding: "24px 28px" }}>

          {/* Airport + Travelers */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: "16px" }}>
              <div>
                <Lbl>Aéroport de départ</Lbl>
                <select value={from} onChange={e => setFrom(e.target.value)} style={IS}>
                  {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code === "OTHER" ? "✏  Autre — saisie manuelle" : `${a.code} — ${a.name}`}</option>)}
                </select>
                {from === "OTHER" && (
                  <input value={fromCustom} onChange={e => setFromCustom(e.target.value.toUpperCase())}
                    placeholder="Code IATA — ex: LYS, NTE, ORY..." maxLength={4}
                    style={{ ...IS, marginTop: "6px", fontFamily: "monospace", letterSpacing: "0.12em" }} />
                )}
              </div>
              <div>
                <Lbl>Voyageurs</Lbl>
                <select value={travelers} onChange={e => setTravelers(e.target.value)} style={IS}>
                  {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{String(n).padStart(2,"0")} — {n === 1 ? "personne" : "personnes"}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <Lbl>Date de départ *</Lbl>
                <input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} style={IS} />
              </div>
              <div>
                <Lbl>Date de retour *</Lbl>
                <input type="date" value={retDate} onChange={e => setRetDate(e.target.value)} style={IS} />
              </div>
            </div>
          </div>

          {/* Stages */}
          <div style={{ marginBottom: "20px" }}>
            <Lbl>Étapes du voyage *</Lbl>
            {stages.map((stage, idx) => (
              <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: C.faint, width: "20px", textAlign: "center", fontWeight: "700", flexShrink: 0 }}>{idx + 1}</span>
                <input value={stage.dest} onChange={e => updateStage(idx, "dest", e.target.value)}
                  placeholder={["Marbella, Espagne", "Chicago, USA", "Santa Teresa, Costa Rica", "Mykonos, Grèce", "Tokyo, Japon"][idx] || "Destination"}
                  style={{ ...IS, flex: "1.6" }} />
                <input type="date" value={stage.arrival} onChange={e => updateStage(idx, "arrival", e.target.value)}
                  style={{ ...IS, flex: "1" }} />
                {idx > 0 && (
                  <button onClick={() => removeStage(idx)}
                    style={{ width: "36px", height: "36px", border: `1px solid ${C.borderLight}`, background: C.white, cursor: "pointer", color: C.faint, fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    ×
                  </button>
                )}
              </div>
            ))}
            {stages.length < 5 && (
              <button onClick={addStage}
                style={{ fontSize: "11px", padding: "5px 14px", border: `1px dashed ${C.borderLight}`, background: "transparent", cursor: "pointer", color: C.muted, fontFamily: C.sans, marginLeft: "28px" }}>
                + Ajouter une étape ({stages.length}/5)
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: `2px solid ${C.black}`, margin: "24px 0" }} />

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

          {err && (
            <div style={{ fontSize: "13px", color: C.red, background: "#fef5f5", border: `1px solid ${C.red}`, padding: "10px 14px", marginBottom: "16px" }}>
              ⚠ {err}
            </div>
          )}

          <button onClick={go} disabled={phase === "loading"}
            style={{ width: "100%", padding: "15px", background: phase === "loading" ? "#666" : C.black, color: C.white, border: "none", cursor: phase === "loading" ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: "800", letterSpacing: "0.2em", fontFamily: C.sans, opacity: phase === "loading" ? 0.65 : 1 }}>
            {phase === "loading" ? "RECHERCHE EN COURS..." : "LANCER LA RECHERCHE"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {phase === "loading" && (
        <div style={{ background: C.white, border: `1px solid ${C.borderLight}`, borderTop: `3px solid ${C.red}`, padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "1rem" }}>✈️</div>
          <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.14em", color: C.black, marginBottom: "8px" }}>
            {TIPS[tipIdx].toUpperCase()}
          </div>
          <div style={{ fontSize: "10px", color: C.faint, fontFamily: "monospace", letterSpacing: "0.08em" }}>
            KAYAK · BOOKING · AIRBNB · GOOGLE FLIGHTS · SKYSCANNER · MOMONDO
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "1.5rem" }}>
            {TIPS.map((_, i) => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: i === tipIdx ? C.black : C.borderLight }} />)}
          </div>
        </div>
      )}

      {/* Results */}
      {phase === "done" && result && (
        <div style={{ background: C.white, border: `1px solid ${C.borderLight}`, borderTop: `3px solid ${C.red}` }}>
          <div style={{ padding: "12px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${C.black}`, background: C.bg }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.14em", color: C.black }}>RÉSULTATS</span>
              <span style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em" }}>
                {new Date().toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => navigator.clipboard?.writeText(result)}
                style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", padding: "5px 14px", background: "transparent", border: `1px solid ${C.border}`, cursor: "pointer", color: C.black }}>
                COPIER
              </button>
              <button onClick={reset}
                style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", padding: "5px 14px", background: C.black, border: `1px solid ${C.black}`, cursor: "pointer", color: C.white }}>
                NOUVELLE RECHERCHE
              </button>
            </div>
          </div>
          <div style={{ padding: "4px 28px 28px" }}>
            <ResultsDisplay text={result} />
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "10px", color: C.borderLight, letterSpacing: "0.12em", fontFamily: "monospace" }}>
        KAYAK · BOOKING · AIRBNB · GOOGLE FLIGHTS · SKYSCANNER · MOMONDO · EXPEDIA · OPODO
      </div>
    </div>
  );
}
