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

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: "6px 13px", borderRadius: "20px", border: selected ? "1.5px solid #111" : "1px solid #d8d8d4", background: selected ? "#111" : "white", color: selected ? "white" : "#444", fontSize: "12px", cursor: "pointer", fontFamily: "system-ui, sans-serif", whiteSpace: "nowrap", transition: "all 0.15s ease", lineHeight: "1.4" }}>
      {label}
    </button>
  );
}

function MD({ text }) {
  if (!text) return null;
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:12px;font-family:monospace">$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#0055cc;text-decoration:none;border-bottom:1px solid #aac">$1 ↗</a>');
  const lines = text.split("\n");
  const out = [];
  let tbl = [], lst = [], lstOrdered = false;
  const flushList = () => {
    if (!lst.length) return;
    const Tag = lstOrdered ? "ol" : "ul";
    out.push(<Tag key={`l${out.length}`} style={{ margin: "0.4rem 0", paddingLeft: "1.5rem" }}>{lst.map((t, i) => <li key={i} style={{ margin: "0.2rem 0", lineHeight: "1.65", fontSize: "13.5px" }} dangerouslySetInnerHTML={{ __html: inline(t) }} />)}</Tag>);
    lst = []; lstOrdered = false;
  };
  const flushTable = () => {
    if (!tbl.length) return;
    const rows = tbl.filter((r) => !/^\|[\s:\-|]+\|$/.test(r.trim()));
    if (rows.length) {
      const parse = (r) => r.split("|").slice(1, -1).map((c) => c.trim());
      const [head, ...body] = rows;
      out.push(<div key={`t${out.length}`} style={{ overflowX: "auto", margin: "0.75rem 0", borderRadius: "7px", border: "1px solid #e4e4e0" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}><thead><tr style={{ background: "#f7f7f5" }}>{parse(head).map((h, i) => <th key={i} style={{ padding: "9px 12px", textAlign: "left", fontWeight: "600", borderBottom: "1px solid #e4e4e0", whiteSpace: "nowrap", fontSize: "12px", letterSpacing: "0.02em" }} dangerouslySetInnerHTML={{ __html: inline(h) }} />)}</tr></thead><tbody>{body.map((r, i) => <tr key={i} style={{ borderBottom: i < body.length - 1 ? "1px solid #f0f0ec" : "none", background: i % 2 === 0 ? "white" : "#fafaf8" }}>{parse(r).map((c, j) => <td key={j} style={{ padding: "8px 12px", lineHeight: "1.5", fontSize: "13px" }} dangerouslySetInnerHTML={{ __html: inline(c) }} />)}</tr>)}</tbody></table></div>);
    }
    tbl = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("|")) { flushList(); tbl.push(l); continue; }
    flushTable();
    const hm = l.match(/^(#{1,3})\s(.+)/);
    if (hm) { flushList(); const lvl = hm[1].length; const s = [{ fontSize: "20px", fontWeight: "700", margin: "1.6rem 0 0.5rem", borderBottom: "2px solid #e8e8e4", paddingBottom: "0.4rem" }, { fontSize: "16px", fontWeight: "600", margin: "1.3rem 0 0.4rem" }, { fontSize: "14px", fontWeight: "600", margin: "1rem 0 0.3rem", color: "#333" }][lvl - 1]; out.push(<div key={i} style={s}>{hm[2]}</div>); }
    else if (/^[-*•] /.test(l)) { lst.push(l.replace(/^[-*•] /, "")); }
    else if (/^\d+\. /.test(l)) { lstOrdered = true; lst.push(l.replace(/^\d+\. /, "")); }
    else if (/^---+$/.test(l.trim())) { flushList(); out.push(<hr key={i} style={{ border: "none", borderTop: "1px solid #e8e8e4", margin: "1rem 0" }} />); }
    else if (l.trim() === "") { flushList(); out.push(<div key={i} style={{ height: "0.35rem" }} />); }
    else { flushList(); out.push(<p key={i} style={{ margin: "0.25rem 0", lineHeight: "1.75", fontSize: "13.5px" }} dangerouslySetInnerHTML={{ __html: inline(l) }} />); }
  }
  flushList(); flushTable();
  return <>{out}</>;
}

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
    if (phase === "loading") { timer.current = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 2800); }
    else { clearInterval(timer.current); setTipIdx(0); }
    return () => clearInterval(timer.current);
  }, [phase]);

  const addStage = () => { if (stages.length < 5) setStages([...stages, { dest: "", arrival: "" }]); };
  const removeStage = (idx) => setStages(stages.filter((_, i) => i !== idx));
  const updateStage = (idx, field, val) => setStages(stages.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  const toggleVibe = (id) => setVibes((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
  const toggleActivity = (id) => setActivities((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);

  const buildPrompt = () => {
    const airport = from === "OTHER" ? fromCustom.toUpperCase() : from;
    const vibeLabels = VIBES.filter((v) => vibes.includes(v.id)).map((v) => v.label).join(", ");
    const activityLabels = ACTIVITIES.filter((a) => activities.includes(a.id)).map((a) => a.label).join(", ");
    const stageLines = stages.filter((s) => s.dest).map((s, i) => `📍 Étape ${i + 1} : ${s.dest}${s.arrival ? ` (arrivée le ${s.arrival})` : ""}`).join("\n");
    return ["Planifie ce voyage et recherche tous les prix en temps réel :", `🛫 Depuis : ${airport}`, `📅 Départ : ${depDate}`, stageLines, `🛬 Retour : ${retDate}`, `👥 Voyageurs : ${travelers}`, vibeLabels ? `🎯 Ambiance : ${vibeLabels}` : "", activityLabels ? `🏄 Activités : ${activityLabels}` : "", notes ? `📝 Notes : ${notes}` : "", "", "Recherche vols sur Kayak et hébergements sur Booking/Airbnb. Tableau complet avec 3 scénarios de classe, totaux CHF, liens. Adapte les hébergements à l'ambiance et activités souhaitées."].filter(Boolean).join("\n");
  };

  const go = async () => {
    if (!stages[0]?.dest || !depDate || !retDate) { setErr("Au minimum : destination étape 1, date de départ et date de retour."); return; }
    if (from === "OTHER" && !fromCustom.trim()) { setErr("Merci d'entrer le code IATA de ton aéroport (ex: LYS, NTE, ORY...)."); return; }
    setPhase("loading"); setErr(""); setResult("");
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: buildPrompt() }] }) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);
      setResult(data.text || "Aucun résultat."); setPhase("done");
    } catch (e) { setErr(e.message); setPhase("error"); }
  };

  const reset = () => { setPhase("idle"); setResult(""); setErr(""); };
  const lbl = { fontSize: "10px", fontWeight: "600", color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.08em", fontFamily: "system-ui, sans-serif" };
  const inp = { width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "2rem 1.25rem", fontFamily: "'Georgia', serif" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "10px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "400", margin: 0, letterSpacing: "-0.02em" }}>Agent Voyage</h1>
          <span style={{ fontSize: "12px", color: "#aaa", fontFamily: "monospace" }}>v2.1</span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[["✈", "GVA · ZRH · MXP"], ["🇨🇭", "CHF"], ["★", "4★ · 8+/10"], ["💳", "Revolut Ultra"], ["🔁", "≤ 2 escales"], ["⚡", "3 scénarios"]].map(([icon, label]) => (
            <span key={label} style={{ fontSize: "11px", padding: "3px 9px", border: "1px solid #ddd", borderRadius: "20px", color: "#555", background: "#fafaf8", fontFamily: "system-ui, sans-serif" }}>{icon} {label}</span>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid #e0e0da", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem", background: "#fafaf8" }}>
        {/* Aéroport + voyageurs */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,0.6fr)", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={lbl}>AÉROPORT DE DÉPART</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} style={inp}>
              {AIRPORTS.map((a) => <option key={a.code} value={a.code}>{a.code === "OTHER" ? "✏ Autre — saisie manuelle" : `${a.code} — ${a.name}`}</option>)}
            </select>
            {from === "OTHER" && <input value={fromCustom} onChange={(e) => setFromCustom(e.target.value.toUpperCase())} placeholder="Code IATA — ex: LYS, NTE, ORY, TXL..." maxLength={4} style={{ ...inp, marginTop: "8px", fontFamily: "monospace", letterSpacing: "0.1em" }} />}
          </div>
          <div>
            <label style={lbl}>VOYAGEURS</label>
            <select value={travelers} onChange={(e) => setTravelers(e.target.value)} style={inp}>
              {[1,2,3,4,5,6,8,10].map((n) => <option key={n} value={n}>{n} {n === 1 ? "personne" : "personnes"}</option>)}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "12px", marginBottom: "14px" }}>
          <div><label style={lbl}>DATE DE DÉPART *</label><input type="date" value={depDate} onChange={(e) => setDepDate(e.target.value)} style={inp} /></div>
          <div><label style={lbl}>DATE DE RETOUR *</label><input type="date" value={retDate} onChange={(e) => setRetDate(e.target.value)} style={inp} /></div>
        </div>

        {/* Étapes */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ ...lbl, marginBottom: "10px" }}>ÉTAPES DU VOYAGE *</label>
          {stages.map((stage, idx) => (
            <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "10px" }}>
              <div style={{ width: "24px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", color: "#bbb", fontFamily: "system-ui, sans-serif", flexShrink: 0 }}>{idx + 1}</div>
              <div style={{ flex: 1.6 }}>
                {idx === 0 && <div style={{ ...lbl, marginBottom: "4px" }}>DESTINATION</div>}
                <input value={stage.dest} onChange={(e) => updateStage(idx, "dest", e.target.value)} placeholder={["Marbella, Espagne", "Chicago, USA", "Santa Teresa, Costa Rica", "Mykonos, Grèce", "Tokyo, Japon"][idx] || "Destination"} style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                {idx === 0 && <div style={{ ...lbl, marginBottom: "4px" }}>DATE ARRIVÉE</div>}
                <input type="date" value={stage.arrival} onChange={(e) => updateStage(idx, "arrival", e.target.value)} style={inp} />
              </div>
              {idx > 0 && (
                <button onClick={() => removeStage(idx)} style={{ width: "36px", height: "36px", border: "1px solid #ddd", borderRadius: "6px", background: "white", cursor: "pointer", color: "#bbb", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
              )}
            </div>
          ))}
          {stages.length < 5 && (
            <button onClick={addStage} style={{ fontSize: "12px", padding: "6px 14px", border: "1px dashed #ccc", borderRadius: "8px", background: "transparent", cursor: "pointer", color: "#777", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "16px", lineHeight: "1" }}>+</span> Ajouter une étape {stages.length > 0 ? `(${stages.length}/5)` : ""}
            </button>
          )}
        </div>

        <div style={{ borderTop: "1px solid #e8e8e4", margin: "18px 0" }} />

        {/* Ambiance */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ ...lbl, marginBottom: "10px" }}>AMBIANCE RECHERCHÉE</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {VIBES.map((v) => <Chip key={v.id} label={v.label} selected={vibes.includes(v.id)} onClick={() => toggleVibe(v.id)} />)}
          </div>
        </div>

        {/* Activités */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ ...lbl, marginBottom: "10px" }}>ACTIVITÉS SOUHAITÉES</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {ACTIVITIES.map((a) => <Chip key={a.id} label={a.label} selected={activities.includes(a.id)} onClick={() => toggleActivity(a.id)} />)}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "14px" }}>
          <label style={lbl}>NOTES SPÉCIFIQUES</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Budget max, occasion spéciale, compagnie aérienne préférée, hôtel particulier..." style={{ ...inp, minHeight: "52px", resize: "vertical", fontFamily: "system-ui, sans-serif" }} />
        </div>

        {err && <div style={{ fontSize: "13px", color: "#c0392b", background: "#fdf2f2", border: "1px solid #f5c6c6", borderRadius: "7px", padding: "8px 12px", marginBottom: "14px", fontFamily: "system-ui, sans-serif" }}>⚠ {err}</div>}

        <button onClick={go} disabled={phase === "loading"} style={{ width: "100%", padding: "12px 16px", fontFamily: "Georgia, serif", fontSize: "15px", cursor: phase === "loading" ? "not-allowed" : "pointer", opacity: phase === "loading" ? 0.55 : 1, letterSpacing: "0.02em", border: "1.5px solid #111", borderRadius: "8px", background: phase === "loading" ? "#eee" : "#111", color: phase === "loading" ? "#888" : "white" }}>
          {phase === "loading" ? "Recherche en cours..." : "Rechercher vols + hôtels →"}
        </button>
      </div>

      {phase === "loading" && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "44px", marginBottom: "1rem" }}>✈️</div>
          <p style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 0.4rem", fontFamily: "system-ui, sans-serif" }}>{TIPS[tipIdx]}</p>
          <p style={{ fontSize: "12px", color: "#aaa", margin: "0 0 1.5rem", fontFamily: "monospace" }}>Kayak · Booking · Airbnb · Google Flights · Skyscanner · Momondo · Opodo</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>{TIPS.map((_, i) => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === tipIdx ? "#111" : "#ddd", transition: "background 0.3s" }} />)}</div>
        </div>
      )}

      {phase === "done" && result && (
        <div style={{ border: "1px solid #e0e0da", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#f7f7f5", borderBottom: "1px solid #e8e8e4", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", fontFamily: "system-ui, sans-serif" }}>Résultats</span>
              <span style={{ fontSize: "11px", color: "#999", fontFamily: "monospace" }}>{new Date().toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => navigator.clipboard?.writeText(result)} style={{ fontSize: "12px", padding: "4px 12px", fontFamily: "system-ui, sans-serif", border: "1px solid #ddd", borderRadius: "5px", background: "white", cursor: "pointer" }}>Copier</button>
              <button onClick={reset} style={{ fontSize: "12px", padding: "4px 12px", fontFamily: "system-ui, sans-serif", border: "1px solid #ddd", borderRadius: "5px", background: "white", cursor: "pointer" }}>Nouvelle recherche</button>
            </div>
          </div>
          <div style={{ padding: "1.5rem 1.5rem 2rem", background: "white" }}><MD text={result} /></div>
        </div>
      )}

      <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "11px", color: "#ccc", fontFamily: "monospace" }}>
        Kayak · Booking · Airbnb · Google Flights · Skyscanner · Momondo · Expedia · Opodo · TripAdvisor
      </div>
    </div>
  );
}
