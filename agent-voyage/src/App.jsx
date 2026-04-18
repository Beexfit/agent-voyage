import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// WDC AI TRAVEL — RESULTS VIEW (Redesigned)
// Dark + Gold premium aesthetic
// ═══════════════════════════════════════════════════════════════

// ── DESIGN TOKENS ──
const T = {
  bg: "#0a0a0a",
  card: "#141414",
  cardBorder: "#2a2218",
  gold: "#c9a84c",
  goldDim: "#8a7535",
  goldBg: "rgba(201,168,76,0.06)",
  goldBg2: "rgba(201,168,76,0.12)",
  text: "#e8e4dc",
  textDim: "#9a9590",
  textMuted: "#5e5a55",
  white: "#fff",
  red: "#e05555",
  green: "#5eb86c",
  blue: "#5b9bd5",
  radius: 14,
  radiusSm: 8,
  font: "'DM Sans', 'Helvetica Neue', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', monospace",
};

// ── SAMPLE DATA (from your screenshots — replace with real data) ──
const SAMPLE = {
  recap: {
    dates: "05-08 juillet 2026 (±3 jours) – 19-22 juillet 2026 (±3 jours)",
    destination: "Honolulu, Hawaï",
    duree: "14-17 nuits",
    voyageurs: 1,
  },
  vols: {
    fullBusiness: [
      {
        compagnie: "Air Canada",
        routing: "GVA → YVR → HNL",
        duree: "20-24h",
        escales: 2,
        prix: 7920,
        lien: "https://kayak.com",
      },
    ],
    mixte: [
      {
        compagnie: "United / Swiss",
        routing: "GVA → ZRH → SFO → HNL",
        duree: "22-26h",
        escales: 2,
        prix: 5400,
        lien: "https://kayak.com",
        label: "Éco aller + Biz retour",
      },
    ],
    economie: [
      {
        compagnie: "Multiple Airlines",
        routing: "GVA → FRA → LAX → HNL",
        duree: "24-28h",
        escales: 2,
        prix: 2340,
        lien: "https://kayak.com",
      },
    ],
  },
  hotels: [
    {
      nom: "Halekulani Hotel",
      etoiles: 5,
      prix: 980,
      total: 27720,
      note: "9.5/10",
      source: "TripAdvisor",
      photo: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=400&fit=crop",
      description: "Légende vivante de Waikiki depuis 1917. Situé en front de mer avec une vue imprenable sur Diamond Head.",
      room: "Ocean Front King · 39 m² + lanai 9 m²",
      amenities: ["Piscine orchidée mosaïque 1.2M", "Spa complet", "Fitness center", "Restaurant gastronomique", "Service plage", "WiFi gratuit"],
    },
    {
      nom: "Halepuna Waikiki by Halekulani",
      etoiles: 4,
      prix: 170,
      total: 16380,
      note: "9.2/10",
      source: "Booking.com",
      photo: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop",
      description: "L'excellence Halekulani à prix plus accessible. Cœur de Waikiki, 2 min à pied de la plage.",
      room: "King room avec balcon",
      amenities: ["Piscine infinity", "Jacuzzi", "Pool bar", "Fitness studio", "Halekulani Bakery", "WiFi gratuit"],
    },
  ],
  totaux: [
    { scenario: "Luxe Intégral", detail: "Business + Halekulani", vols: 7920, hotel: 27720, transferts: 200, total: 35840 },
    { scenario: "Premium", detail: "Mixte + Halepuna", vols: 5400, hotel: 16380, transferts: 200, total: 21980 },
    { scenario: "Optimisé", detail: "Éco + Halepuna", vols: 2340, hotel: 16380, transferts: 200, total: 18920 },
  ],
  meteo: {
    tempMax: 30,
    tempMin: 26,
    mer: 26,
    precip: "Modérées",
    uv: "Modéré",
    soleil: 12.9,
    pluie: "2-8 jours",
    description: "Conditions excellentes en juillet 2026 : températures de 25-30°C, eau de mer à 26°C, seulement 2-8 jours de pluie, 12.9h de soleil quotidien. Période idéale pour les activités de plage et extérieures avec risque de pluie faible (23%).",
  },
  recommandation: {
    titre: "Scénario Premium",
    detail: "Vol mixte éco/business + Halepuna Waikiki pour 21'980 CHF.",
    texte: "Halepuna offre l'excellence du service Halekulani à prix plus accessible, avec emplacement parfait à 2 min de Waikiki Beach. Le vol mixte optimise confort/budget avec business au retour après des vacances relaxantes.",
  },
  calendrier: [
    {
      dates: "05-08 JUILLET",
      icon: "✈️",
      titre: "Voyage aller",
      desc: "Départ GVA, arrivée HNL, installation",
      activites: ["Check-in hôtel", "Première balade Waikiki Beach", "Dîner au restaurant de l'hôtel"],
    },
    {
      dates: "06-19 JUILLET",
      icon: "🏖️",
      titre: "Séjour à Honolulu",
      desc: "Exploration, plage et détente",
      activites: [
        "Randonnée Diamond Head (lever de soleil)",
        "Snorkeling à Hanauma Bay",
        "Surf lesson à Waikiki",
        "North Shore — Pipeline & Sunset Beach",
        "Pearl Harbor Memorial",
        "Polynesian Cultural Center",
        "Kayak Lanikai Beach",
        "Coucher de soleil Tantalus Lookout",
        "Shopping Ala Moana Center",
        "Luau traditionnel hawaïen",
      ],
    },
    {
      dates: "19-22 JUILLET",
      icon: "🛫",
      titre: "Derniers moments & retour",
      desc: "Derniers moments, vol retour vers GVA",
      activites: ["Dernière matinée plage", "Achat souvenirs", "Check-out & transfert aéroport", "Vol retour vers Genève"],
    },
  ],
};

// ── ICONS (inline SVG) ──
const Icons = {
  moon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  user: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  plane: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  ),
  hotel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21h18M3 7v14M21 7v14M6 11h4M14 11h4M6 15h4M14 15h4M9 7V3h6v4" />
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={T.gold} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  sun: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  waves: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="1.5">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  ),
  rain: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="1.5">
      <path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  lightbulb: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.5">
      <path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  link: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  ),
  chevron: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  minus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  dollar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.5">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  pool: "🏊",
  spa: "💆",
  gym: "🏋️",
  restaurant: "🍽️",
  beach: "🏖️",
  wifi: "📶",
};

// ── UTILITY ──
const fmt = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");

// ── SECTION WRAPPER ──
function Section({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.cardBorder}`,
      borderRadius: T.radius,
      marginBottom: 20,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: T.text,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 600, fontFamily: T.font }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          {title}
        </span>
        <span style={{ color: T.textMuted, transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }}>
          {Icons.minus}
        </span>
      </button>
      {open && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
    </div>
  );
}

// ── PILL / TAG ──
function Tag({ children, color = T.gold }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 500,
      color: color,
      background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: 20,
      padding: "2px 10px",
      fontFamily: T.font,
    }}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1. RÉCAPITULATIF
// ═══════════════════════════════════════════════════════════════
function RecapDisplay({ data }) {
  const d = data || SAMPLE.recap;
  return (
    <Section icon="📋" title="Récapitulatif">
      {/* Big stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{
          background: T.goldBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: T.radiusSm,
          padding: "20px 16px",
          textAlign: "center",
        }}>
          {Icons.moon}
          <div style={{ fontSize: 32, fontWeight: 700, color: T.text, fontFamily: T.font, marginTop: 4 }}>
            {d.duree?.split("-")[1]?.replace(/\D/g, "") || "17"}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, fontFamily: T.font }}>nuits</div>
        </div>
        <div style={{
          background: "rgba(91,155,213,0.06)",
          border: `1px solid ${T.cardBorder}`,
          borderRadius: T.radiusSm,
          padding: "20px 16px",
          textAlign: "center",
        }}>
          {Icons.user}
          <div style={{ fontSize: 32, fontWeight: 700, color: T.text, fontFamily: T.font, marginTop: 4 }}>
            {d.voyageurs}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, fontFamily: T.font }}>voyageur{d.voyageurs > 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Detail rows */}
      {[
        { label: "Dates", value: d.dates },
        { label: "Destination", value: d.destination },
        { label: "Durée", value: d.duree },
        { label: "Voyageurs", value: `${d.voyageurs} personne${d.voyageurs > 1 ? "s" : ""}` },
      ].map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            borderBottom: i < 3 ? `1px solid ${T.cardBorder}` : "none",
            padding: "12px 0",
          }}
        >
          <div style={{
            width: 120,
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 600,
            color: T.text,
            fontFamily: T.font,
          }}>
            {row.label}
          </div>
          <div style={{ fontSize: 13, color: T.textDim, fontFamily: T.font, lineHeight: 1.5 }}>
            {row.value}
          </div>
        </div>
      ))}
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. VOLS
// ═══════════════════════════════════════════════════════════════
function FlightCard({ flight, category }) {
  const catColors = {
    "Full Business": T.gold,
    "Mixte": "#c97acc",
    "Économie": T.green,
  };
  const color = catColors[category] || T.gold;

  return (
    <div style={{
      background: T.bg,
      border: `1px solid ${T.cardBorder}`,
      borderRadius: T.radiusSm,
      padding: 16,
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.font }}>
            {flight.compagnie}
          </div>
          {flight.label && (
            <Tag color={color}>{flight.label}</Tag>
          )}
        </div>
        <a
          href={flight.lien}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 500,
            color: T.gold,
            textDecoration: "none",
            background: T.goldBg,
            border: `1px solid ${T.gold}40`,
            borderRadius: 20,
            padding: "4px 12px",
          }}
        >
          Kayak {Icons.link}
        </a>
      </div>

      {/* Flight details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Routing", value: flight.routing },
          { label: "Durée", value: flight.duree },
          { label: "Escales", value: flight.escales },
          { label: "Prix / pers", value: `${fmt(flight.prix)} CHF`, highlight: true },
        ].map((item, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textMuted, fontFamily: T.font, marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: item.highlight ? 700 : 500,
              color: item.highlight ? T.gold : T.text,
              fontFamily: item.highlight ? T.fontMono : T.font,
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlightDisplay({ data }) {
  const d = data || SAMPLE.vols;
  const tabs = [
    { key: "fullBusiness", label: "Full Business", icon: "💺", color: T.gold },
    { key: "mixte", label: "Mixte", icon: "🔀", color: "#c97acc" },
    { key: "economie", label: "Économie", icon: "🪑", color: T.green },
  ];
  const [active, setActive] = useState("fullBusiness");
  const flights = d[active] || [];
  const catLabel = tabs.find((t) => t.key === active)?.label || "";

  return (
    <Section icon="✈️" title="Vols">
      {/* Tabs */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        background: T.bg,
        borderRadius: T.radiusSm,
        border: `1px solid ${T.cardBorder}`,
        marginBottom: 16,
        overflow: "hidden",
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            style={{
              padding: "12px 8px",
              background: active === tab.key ? T.goldBg2 : "transparent",
              border: "none",
              borderBottom: active === tab.key ? `2px solid ${T.gold}` : "2px solid transparent",
              cursor: "pointer",
              color: active === tab.key ? T.gold : T.textDim,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: T.font,
              transition: "all 0.2s",
            }}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        padding: "8px 16px",
        marginBottom: 4,
      }}>
        {["COMPAGNIE", "ROUTING", "DURÉE", "ESCALES", "PRIX/PERS CHF"].map((h) => (
          <div key={h} style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: T.goldDim,
            fontFamily: T.font,
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Flight cards */}
      {flights.map((f, i) => (
        <FlightCard key={i} flight={f} category={catLabel} />
      ))}

      <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, marginTop: 8 }}>
        *Prix convertis en CHF avec taux USD/CHF = 0.78
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. HÉBERGEMENTS
// ═══════════════════════════════════════════════════════════════
function HotelCard({ hotel }) {
  const [imgError, setImgError] = useState(false);
  const stars = Array.from({ length: hotel.etoiles }, (_, i) => i);

  return (
    <div style={{
      background: T.bg,
      border: `1px solid ${T.cardBorder}`,
      borderRadius: T.radiusSm,
      overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: T.goldBg,
        borderBottom: `1px solid ${T.cardBorder}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", gap: 1 }}>{stars.map((i) => <span key={i}>{Icons.star}</span>)}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.font }}>{hotel.nom}</span>
        </div>
        <Tag>{hotel.note} ({hotel.source})</Tag>
      </div>

      {/* Photo */}
      <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
        {!imgError ? (
          <img
            src={hotel.photo}
            alt={hotel.nom}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1a1520 0%, #0d1520 100%)",
            color: T.textMuted,
            fontSize: 13,
            fontFamily: T.font,
          }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🏨</span>
              Consulter le site officiel pour les photos
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: T.gold, fontFamily: T.fontMono }}>
            {fmt(hotel.prix)}
          </span>
          <span style={{ fontSize: 13, color: T.textDim, fontFamily: T.font }}>CHF / nuit</span>
          <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>
            · {fmt(hotel.total)} CHF total
          </span>
        </div>

        {/* Room type */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: T.green,
          background: `${T.green}15`,
          border: `1px solid ${T.green}30`,
          borderRadius: 20,
          padding: "3px 10px",
          marginBottom: 12,
          fontFamily: T.font,
        }}>
          {Icons.check} {hotel.room}
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13,
          color: T.textDim,
          lineHeight: 1.6,
          fontFamily: T.font,
          margin: "0 0 14px 0",
        }}>
          {hotel.description}
        </p>

        {/* Amenities */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {hotel.amenities.map((a, i) => (
            <span key={i} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: T.textDim,
              background: `${T.text}08`,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: 20,
              padding: "3px 10px",
              fontFamily: T.font,
            }}>
              {Icons.check} {a}
            </span>
          ))}
        </div>

        {/* Book button */}
        <a
          href="#"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 16,
            padding: "8px 20px",
            background: T.gold,
            color: T.bg,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: T.font,
            borderRadius: T.radiusSm,
            textDecoration: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Réserver {Icons.link}
        </a>
      </div>
    </div>
  );
}

function HebergementDisplay({ data }) {
  const hotels = data || SAMPLE.hotels;
  return (
    <Section icon="🏨" title="Hébergements">
      {hotels.map((h, i) => (
        <HotelCard key={i} hotel={h} />
      ))}
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. TOTAUX
// ═══════════════════════════════════════════════════════════════
function TotauxDisplay({ data }) {
  const rows = data || SAMPLE.totaux;
  return (
    <Section icon={<span style={{ display: "flex" }}>{Icons.dollar}</span>} title="Totaux en CHF">
      {/* Desktop table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px", fontFamily: T.font }}>
          <thead>
            <tr>
              {["SCÉNARIO", "VOLS CHF", "HÉBERGEMENTS CHF", "TRANSFERTS CHF", "TOTAL CHF"].map((h) => (
                <th key={h} style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: T.goldDim,
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: `1px solid ${T.cardBorder}`,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: i === 0 ? T.goldBg : "transparent" }}>
                <td style={{ padding: "12px", fontSize: 13, fontWeight: 600, color: T.text, borderRadius: `${T.radiusSm}px 0 0 ${T.radiusSm}px` }}>
                  {r.scenario}
                  <div style={{ fontSize: 11, fontWeight: 400, color: T.textMuted, marginTop: 2 }}>{r.detail}</div>
                </td>
                <td style={{ padding: "12px", fontSize: 13, color: T.textDim, fontFamily: T.fontMono }}>{fmt(r.vols)}</td>
                <td style={{ padding: "12px", fontSize: 13, color: T.textDim, fontFamily: T.fontMono }}>{fmt(r.hotel)}</td>
                <td style={{ padding: "12px", fontSize: 13, color: T.textDim, fontFamily: T.fontMono }}>{fmt(r.transferts)}</td>
                <td style={{
                  padding: "12px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: i === 0 ? T.gold : T.text,
                  fontFamily: T.fontMono,
                  borderRadius: `0 ${T.radiusSm}px ${T.radiusSm}px 0`,
                }}>
                  {fmt(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. MÉTÉO
// ═══════════════════════════════════════════════════════════════
function MeteoDisplay({ data }) {
  const d = data || SAMPLE.meteo;
  const [selectedMonth, setSelectedMonth] = useState("juillet");
  const months = ["juin", "juillet", "août", "septembre"];

  return (
    <Section icon="☀️" title="Météo">
      {/* Month selector */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
      }}>
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: selectedMonth === m ? `1px solid ${T.gold}` : `1px solid ${T.cardBorder}`,
              background: selectedMonth === m ? T.goldBg2 : "transparent",
              color: selectedMonth === m ? T.gold : T.textDim,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: T.font,
              textTransform: "capitalize",
              transition: "all 0.2s",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Weather cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { icon: Icons.sun, value: `${d.tempMax}°`, sub: `min ${d.tempMin}°`, label: "Température" },
          { icon: Icons.waves, value: `${d.mer}°`, sub: null, label: "Mer" },
          { icon: Icons.rain, value: d.precip, sub: d.pluie, label: "Précipitations" },
          { icon: Icons.shield, value: d.uv, sub: null, label: "UV" },
        ].map((card, i) => (
          <div key={i} style={{
            background: T.bg,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: T.radiusSm,
            padding: "16px 12px",
            textAlign: "center",
          }}>
            <div style={{ marginBottom: 8 }}>{card.icon}</div>
            <div style={{
              fontSize: i < 2 ? 26 : 14,
              fontWeight: 700,
              color: i === 0 ? T.gold : i === 1 ? T.blue : T.text,
              fontFamily: i < 2 ? T.fontMono : T.font,
            }}>
              {card.value}
            </div>
            {card.sub && (
              <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
                {card.sub}
              </div>
            )}
            <div style={{ fontSize: 11, color: T.textDim, fontFamily: T.font, marginTop: 4 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 13,
        color: T.textDim,
        lineHeight: 1.6,
        fontFamily: T.font,
        padding: "12px 16px",
        background: T.bg,
        borderRadius: T.radiusSm,
        border: `1px solid ${T.cardBorder}`,
      }}>
        {d.description}
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. RECOMMANDATION
// ═══════════════════════════════════════════════════════════════
function RecommandationDisplay({ data }) {
  const d = data || SAMPLE.recommandation;
  return (
    <Section icon={<span style={{ display: "flex" }}>{Icons.lightbulb}</span>} title="Recommandation">
      <div style={{
        background: T.goldBg,
        border: `1px solid ${T.gold}25`,
        borderRadius: T.radiusSm,
        padding: 20,
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: T.gold,
          fontFamily: T.font,
          marginBottom: 8,
        }}>
          {d.titre} — {d.detail}
        </div>
        <div style={{
          fontSize: 13,
          color: T.textDim,
          lineHeight: 1.7,
          fontFamily: T.font,
        }}>
          {d.texte}
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. CALENDRIER
// ═══════════════════════════════════════════════════════════════
function CalendrierDisplay({ data }) {
  const items = data || SAMPLE.calendrier;
  const phaseColors = [T.gold, "#e05555", T.blue];

  return (
    <Section icon={<span style={{ display: "flex" }}>{Icons.calendar}</span>} title="Calendrier">
      <div style={{ position: "relative", paddingLeft: 40 }}>
        {/* Timeline line */}
        <div style={{
          position: "absolute",
          left: 18,
          top: 0,
          bottom: 0,
          width: 2,
          background: `linear-gradient(to bottom, ${T.gold}, ${T.blue})`,
          borderRadius: 1,
        }} />

        {items.map((item, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 20 }}>
            {/* Timeline dot */}
            <div style={{
              position: "absolute",
              left: -28,
              top: 8,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: T.card,
              border: `2px solid ${phaseColors[i] || T.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
            }}>
              {item.icon}
            </div>

            {/* Card */}
            <div style={{
              background: T.bg,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: T.radiusSm,
              overflow: "hidden",
            }}>
              {/* Date header */}
              <div style={{
                padding: "10px 16px",
                background: `${phaseColors[i] || T.gold}15`,
                borderBottom: `1px solid ${T.cardBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: phaseColors[i] || T.gold,
                    fontFamily: T.font,
                  }}>
                    {item.dates}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font, marginTop: 2 }}>
                    {item.titre}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ padding: "12px 16px" }}>
                <div style={{ fontSize: 12, color: T.textDim, fontFamily: T.font, marginBottom: 10 }}>
                  {item.desc}
                </div>

                {/* Activities */}
                {item.activites && item.activites.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {item.activites.map((act, j) => (
                      <div key={j} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        color: T.text,
                        fontFamily: T.font,
                        padding: "6px 10px",
                        background: `${T.text}05`,
                        borderRadius: 6,
                        borderLeft: `2px solid ${phaseColors[i] || T.gold}30`,
                      }}>
                        <span style={{ color: T.textMuted, fontSize: 11, fontFamily: T.fontMono, minWidth: 16 }}>
                          {String(j + 1).padStart(2, "0")}
                        </span>
                        {act}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// RESULTS VIEW — Main component
// ═══════════════════════════════════════════════════════════════
function ResultsView({ results }) {
  const r = results || {};
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: `1px solid ${T.cardBorder}`,
      }}>
        <div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: T.gold,
            fontFamily: T.font,
          }}>
            RÉSULTATS
          </span>
          <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginLeft: 12 }}>
            {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            padding: "6px 16px",
            border: `1px solid ${T.cardBorder}`,
            borderRadius: 6,
            background: "transparent",
            color: T.textDim,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: T.font,
          }}>
            COPIER
          </button>
          <button style={{
            padding: "6px 16px",
            border: `1px solid ${T.gold}`,
            borderRadius: 6,
            background: T.goldBg,
            color: T.gold,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: T.font,
          }}>
            NOUVELLE RECHERCHE
          </button>
        </div>
      </div>

      <RecapDisplay data={r.recap} />
      <FlightDisplay data={r.vols} />
      <HebergementDisplay data={r.hotels} />
      <TotauxDisplay data={r.totaux} />
      <MeteoDisplay data={r.meteo} />
      <RecommandationDisplay data={r.recommandation} />
      <CalendrierDisplay data={r.calendrier} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      padding: "32px 20px",
      fontFamily: T.font,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <ResultsView />
    </div>
  );
}
