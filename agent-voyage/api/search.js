// Vercel serverless — Sky Scrapper (Skyscanner) flights + Claude assembly
export const config = { maxDuration: 300 };

const RAPID_HOST = 'sky-scrapper.p.rapidapi.com';
const REVOLUT_AIRLINES = ['EK','EY','AF','KL','BA','SQ','QR','AV']; // 1:1 transfer partners

// ═══════════════════════════════════════════════════════════════
// SKY SCRAPPER API — Location resolution + Flight search
// ═══════════════════════════════════════════════════════════════
async function resolveLocation(query, apiKey) {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(`https://${RAPID_HOST}/api/v1/flights/searchAirport?query=${q}&locale=en-US`, {
      headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': RAPID_HOST }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const loc = data?.data?.[0];
    if (loc) return { skyId: loc.skyId, entityId: loc.entityId, name: loc.presentation?.suggestionTitle || query };
    return null;
  } catch { return null; }
}

async function searchFlights({ originSkyId, originEntityId, destSkyId, destEntityId, date, adults, cabin, apiKey }) {
  try {
    const params = new URLSearchParams({
      originSkyId, destinationSkyId: destSkyId,
      originEntityId, destinationEntityId: destEntityId,
      date, adults: String(adults || 1),
      cabinClass: cabin, // economy, premium_economy, business, first
      currency: 'CHF', market: 'CH', countryCode: 'CH',
      sortBy: 'best', limit: '10'
    });
    const res = await fetch(`https://${RAPID_HOST}/api/v2/flights/searchFlightsWebComplete?${params}`, {
      headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': RAPID_HOST }
    });
    if (!res.ok) { console.error('Sky Scrapper error:', res.status); return []; }
    const data = await res.json();
    return parseFlightResults(data);
  } catch (e) { console.error('searchFlights error:', e.message); return []; }
}

function parseFlightResults(data) {
  const results = [];
  const itineraries = data?.data?.itineraries || [];
  for (const itin of itineraries) {
    const legs = itin.legs || [];
    if (!legs.length) continue;
    const leg = legs[0]; // one-way search = 1 leg
    const stops = (leg.stopCount ?? leg.segments?.length - 1) || 0;
    const segments = leg.segments || [];
    const airlines = [...new Set(segments.map(s => s.marketingCarrier?.alternateId || s.operatingCarrier?.alternateId || ''))].filter(Boolean);
    const routing = segments.map(s => s.origin?.flightPlaceId || s.origin?.displayCode || '').concat(segments[segments.length - 1]?.destination?.flightPlaceId || segments[segments.length - 1]?.destination?.displayCode || '').filter(Boolean).join('-');
    const dep = leg.departure?.slice(11, 16) || segments[0]?.departure?.slice(11, 16) || '';
    const arr = leg.arrival?.slice(11, 16) || segments[segments.length - 1]?.arrival?.slice(11, 16) || '';
    const durMin = leg.durationInMinutes || 0;
    const durH = Math.floor(durMin / 60);
    const durM = durMin % 60;
    const price = itin.price?.raw || itin.price?.formatted?.replace(/[^\d.]/g, '') || 0;
    const deepLink = itin.price?.url || itin.deepLink || itin.url || '';
    const isSelfTransfer = leg.isSelfTransfer || segments.some(s => s.isSelfTransfer) || false;
    const isRevolutPartner = airlines.some(a => REVOLUT_AIRLINES.includes(a));

    results.push({
      airlines: airlines.join('/'),
      routing,
      dep, arr,
      duration: `${durH}h${durM > 0 ? String(durM).padStart(2, '0') : '00'}`,
      stops,
      price: Math.round(parseFloat(price) || 0),
      deepLink,
      isSelfTransfer,
      isRevolutPartner,
    });
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// FLIGHT FILTERING — max 1 stop, 2 only if 30%+ cheaper
// ═══════════════════════════════════════════════════════════════
function filterFlights(flights) {
  // Remove self-transfer (baggage re-check)
  const noSelfTransfer = flights.filter(f => !f.isSelfTransfer);
  const pool = noSelfTransfer.length > 0 ? noSelfTransfer : flights;

  // Separate by stops
  const max1 = pool.filter(f => f.stops <= 1);
  const has2 = pool.filter(f => f.stops === 2);

  if (max1.length === 0) {
    // No 0-1 stop options — allow 2 stops
    return has2.sort((a, b) => a.price - b.price).slice(0, 5);
  }

  const best1Price = Math.min(...max1.map(f => f.price));
  // Include 2-stop flights only if 30%+ cheaper
  const cheap2 = has2.filter(f => f.price < best1Price * 0.7);

  const combined = [...max1, ...cheap2];
  // Sort: Revolut partners first at same price range, then by price
  combined.sort((a, b) => {
    if (a.isRevolutPartner && !b.isRevolutPartner && a.price <= b.price * 1.1) return -1;
    if (!a.isRevolutPartner && b.isRevolutPartner && b.price <= a.price * 1.1) return 1;
    return a.price - b.price;
  });

  return combined.slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════
// ORCHESTRATION — Search all segments, build markdown
// ═══════════════════════════════════════════════════════════════
async function searchAllSegments(legs, travelers, apiKey) {
  const results = [];

  for (const leg of legs) {
    console.log(`Resolving: ${leg.from} → ${leg.to}`);
    const origin = await resolveLocation(leg.from, apiKey);
    const dest = await resolveLocation(leg.to, apiKey);

    if (!origin || !dest) {
      console.error(`Could not resolve: ${leg.from} or ${leg.to}`);
      results.push({ from: leg.from, to: leg.to, date: leg.date, eco: [], biz: [], error: 'Location not found' });
      continue;
    }

    // Search economy
    const ecoRaw = await searchFlights({
      originSkyId: origin.skyId, originEntityId: origin.entityId,
      destSkyId: dest.skyId, destEntityId: dest.entityId,
      date: leg.date, adults: travelers, cabin: 'economy', apiKey
    });

    // Search business
    const bizRaw = await searchFlights({
      originSkyId: origin.skyId, originEntityId: origin.entityId,
      destSkyId: dest.skyId, destEntityId: dest.entityId,
      date: leg.date, adults: travelers, cabin: 'business', apiKey
    });

    const eco = filterFlights(ecoRaw);
    const biz = filterFlights(bizRaw);

    results.push({
      from: origin.name || leg.from,
      to: dest.name || leg.to,
      fromCode: origin.skyId,
      toCode: dest.skyId,
      date: leg.date,
      eco, biz
    });
  }

  return results;
}

function buildFlightMD(segments) {
  let md = '';
  for (const seg of segments) {
    md += `\n### ${seg.fromCode || seg.from} vers ${seg.toCode || seg.to} (${seg.date})\n\n`;

    if (seg.error) {
      md += `Destination non trouvée. Claude doit chercher les vols via web search.\n`;
      continue;
    }

    md += `| Scénario | Compagnie | Routing | Horaires | Durée | Escales | Prix CHF | Lien |\n|---|---|---|---|---|---|---|---|\n`;

    // Best business
    if (seg.biz.length > 0) {
      const b = seg.biz[0];
      md += `| 💺 Business | ${b.airlines} | ${b.routing} | ${b.dep}-${b.arr} | ${b.duration} | ${b.stops} | ${b.price} | [Réserver](${b.deepLink || '#'}) |\n`;
    }

    // Mixte: eco on short, biz on long (or avg price)
    if (seg.eco.length > 0 && seg.biz.length > 0) {
      const e = seg.eco[0];
      const mixPrice = Math.round((e.price + seg.biz[0].price) / 2);
      md += `| 🔀 Mixte | ${e.airlines} | ${e.routing} | ${e.dep}-${e.arr} | ${e.duration} | ${e.stops} | ${mixPrice} | [Réserver](${e.deepLink || '#'}) |\n`;
    }

    // Best economy
    if (seg.eco.length > 0) {
      const e = seg.eco[0];
      md += `| 🪑 Économie | ${e.airlines} | ${e.routing} | ${e.dep}-${e.arr} | ${e.duration} | ${e.stops} | ${e.price} | [Réserver](${e.deepLink || '#'}) |\n`;
    }

    // Alternative options
    const altEco = seg.eco.slice(1, 4);
    const altBiz = seg.biz.slice(1, 3);
    if (altEco.length > 0) {
      md += `\nAutres options économie :\n`;
      for (const o of altEco) md += `- ${o.airlines} ${o.routing} ${o.dep}-${o.arr} ${o.duration} ${o.stops}esc. ${o.price} CHF${o.isRevolutPartner ? ' (Revolut Ultra partner)' : ''} [Voir](${o.deepLink || '#'})\n`;
    }
    if (altBiz.length > 0) {
      md += `\nAutres options business :\n`;
      for (const o of altBiz) md += `- ${o.airlines} ${o.routing} ${o.dep}-${o.arr} ${o.duration} ${o.stops}esc. ${o.price} CHF${o.isRevolutPartner ? ' (Revolut Ultra partner)' : ''} [Voir](${o.deepLink || '#'})\n`;
    }
  }
  return md;
}

// ═══════════════════════════════════════════════════════════════
// CLAUDE PROMPT
// ═══════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `Tu es un agent expert en planification de voyages pour un utilisateur basé à Genève, Suisse.

PROFIL VOYAGEUR :
- Aéroports : GVA priorité, ZRH/MXP alternatives
- TOUS les prix en CHF (convertir EUR x 0.923, USD x 0.90, GBP x 1.15)
- Revolut Ultra : lounge, miles transférables 1:1 vers Emirates/Etihad/AF-KLM/BA/Singapore/Qatar
- Max 2 escales, destinations sûres uniquement

HÉBERGEMENTS - sélection stricte :
Critères éliminatoires : Lit double, SdB privée, WiFi, Clim, Note >= 8.0/10, 4 étoiles minimum
Priorité : 1) Critères 2) Positionnement 3) Meilleur prix
2 options par destination : "confort" (meilleur prix) et "premium"
Séjours 7+ nuits : prix/nuit critique, pas de luxe excessif sauf si demandé
Lien Booking : https://www.booking.com/searchresults.html?ss=NOM+HOTEL+VILLE

FORMAT DE RÉPONSE - RESPECTER EXACTEMENT :

## 📋 Récapitulatif

| Critère | Détail |
|---|---|
| Dates | dates exactes |
| Destinations | ville 1, ville 2 |
| Durées | X nuits ville 1, Y nuits ville 2 |
| Voyageurs | N personne(s) |

NE PAS ajouter de ligne "Total". Indiquer le nombre EXACT de nuits.

## ✈️ Vols

CHAQUE segment DOIT avoir son propre ### et son propre tableau avec EXACTEMENT ces 7 colonnes :

### GVA vers AGP (date)

| Scénario | Compagnie | Routing | Durée | Escales | Prix/pers CHF | Lien |
|---|---|---|---|---|---|---|
| 💺 Business | Swiss | GVA-AGP | 2h25 | 0 | 450 | [Kayak Business](https://www.kayak.com/flights/GVA-AGP/2026-07-01?sort=bestflight_a&fs=cabin=b) |
| 🔀 Mixte | easyJet | GVA-AGP | 2h30 | 0 | 200 | [Kayak](https://www.kayak.com/flights/GVA-AGP/2026-07-01?sort=bestflight_a) |
| 🪑 Économie | easyJet | GVA-AGP | 2h30 | 0 | 89 | [Kayak Éco](https://www.kayak.com/flights/GVA-AGP/2026-07-01?sort=bestflight_a&fs=cabin=e) |

RÈGLES DE PRIX :
- Chercher le prix RÉEL pour les DATES EXACTES demandées, pas un prix "à partir de" ni une estimation
- Chercher sur Kayak, Google Flights, Skyscanner pour chaque segment avec la date précise
- Si le prix exact pour la date n'est pas trouvable, indiquer le prix trouvé ET préciser "(prix indicatif, vérifier sur le lien)" dans la cellule
- NE JAMAIS inventer un prix. NE JAMAIS arrondir. Mettre le prix exact trouvé
- Convertir en CHF si trouvé en EUR/USD/GBP

RÈGLES VOLS ABSOLUES :
- TOUJOURS 3 lignes par segment : 💺 Business, 🔀 Mixte, 🪑 Économie
- TOUJOURS 7 colonnes : Scénario | Compagnie | Routing | Durée | Escales | Prix/pers CHF | Lien
- Routing TOUJOURS en format CODE-CODE (ex: GVA-AGP, pas "Genève vers Malaga")
- Prix TOUJOURS en CHF (nombre seul, pas "CHF 450" ni "450 CHF" ni "45 USD")
- Escales : nombre (0, 1, 2), pas "Direct" ni "1 escale Madrid"
- Lien : TOUJOURS un lien Kayak avec dates et classe préremplis au format :
  https://www.kayak.com/flights/CODE1-CODE2/YYYY-MM-DD?sort=bestflight_a&fs=cabin=b (business)
  https://www.kayak.com/flights/CODE1-CODE2/YYYY-MM-DD?sort=bestflight_a&fs=cabin=e (éco)
  NE JAMAIS mettre de lien vers swiss.com, airfrance.com, lufthansa.com ou tout autre site de compagnie aérienne
- NE PAS mettre ** dans les cellules
- NE PAS créer de tableaux transposés (colonnes = options)
- NE PAS mettre de texte libre entre les lignes du tableau
- NE PAS créer de segments séparés pour les vols domestiques/connexions internes (ex: SJO-TMU). Les mentionner dans une note sous le tableau du segment principal. Créer UNIQUEMENT les segments correspondant aux étapes demandées par l'utilisateur

## 🏨 Hébergements

### Ville (dates)

#### Nom exact de l'hôtel

| Critère | Détail |
|---|---|
| Étoiles | ★★★★★ |
| Note | X.X/10 (source) |
| Zone | Quartier, position |
| Chambre | Type, superficie |
| Équipements | Liste |
| Petit-déjeuner | Inclus / En option / Non |
| Piscine | Oui/Non + détails |
| Spa | Oui/Non + détails |
| Vue | Type de vue |
| Prix/nuit | XXX CHF |
| Prix total | XXXX CHF (X nuits) |
| Lien | [Booking.com](url) |

## 💰 Totaux en CHF

| Scénario | Vols CHF | Hébergements CHF | Transferts CHF | TOTAL CHF |
|---|---|---|---|---|
| 💺 Business + Hôtel Premium | XXXX | XXXX | XXX | XXXXX |
| 🔀 Mixte + Hôtel Confort | XXXX | XXXX | XXX | XXXXX |
| 🪑 Économie + Hôtel Confort | XXXX | XXXX | XXX | XXXXX |

NE PAS mettre ** dans les cellules.

## 🌤️ Météo

### Ville (Mois)

Températures, pluie, mer, conditions.

## 💡 Recommandation

Option recommandée avec justification.

## 📅 Calendrier

| Date | Lieu | Activité |
|---|---|---|
| 1er juillet | Ville | Description activité |

NE PAS utiliser le format **date** : activité. Utiliser un TABLEAU.

## 💳 Astuce Revolut Ultra

**Lounges** : détails lounges disponibles
**Miles** : opportunités de transfert
**Upgrades** : possibilités d'upgrade`;

// ═══════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY manquante.' });

  const { messages, legs, travelers } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages requis' });

  try {
    // ── 1. Search flights via Sky Scrapper ──
    let flightMD = '';
    const rapidKey = process.env.RAPIDAPI_KEY;
    if (rapidKey && legs && legs.length > 0) {
      console.log(`Searching ${legs.length} segments via Sky Scrapper...`);
      const segments = await searchAllSegments(legs, travelers || 1, rapidKey);
      flightMD = buildFlightMD(segments);
      console.log('Flight search complete.');
    }

    // ── 2. Build prompt with real flight data ──
    let content = messages[0]?.content || '';
    if (flightMD) {
      content += `\n\n═══ VOLS SKYSCANNER - PRIX RÉELS ET LIENS DIRECTS ═══${flightMD}\n═══ FIN DONNÉES VOLS ═══\nIntègre ces vols. Compare avec Kayak/Opodo/Google Flights si possible. Affiche le meilleur prix trouvé.`;
    }

    // ── 3. Claude assembly (hotels, weather, calendar, points) ──
    let allMsgs = [{ role: 'user', content }];
    let finalText = '';
    for (let turn = 0; turn < 5; turn++) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 6000, system: SYSTEM_PROMPT, tools: [{ type: 'web_search_20250305', name: 'web_search' }], messages: allMsgs }),
      });
      const data = await r.json();
      if (data.error) return res.status(500).json({ error: data.error.message });
      const texts = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
      if (texts) finalText = texts;
      if (data.stop_reason === 'end_turn') break;
      if (data.stop_reason === 'tool_use') {
        allMsgs.push({ role: 'assistant', content: data.content });
        const uses = (data.content || []).filter(b => b.type === 'tool_use');
        if (!uses.length) break;
        allMsgs.push({ role: 'user', content: uses.map(u => ({ type: 'tool_result', tool_use_id: u.id, content: 'Search completed.' })) });
      } else break;
    }
    return res.status(200).json({ text: finalText || 'Aucun résultat.' });
  } catch (err) {
    console.error('Erreur:', err);
    return res.status(500).json({ error: err.message });
  }
}
