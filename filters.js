// Search filters for the wishlist viewer.
//
// The search box is the single source of truth. Plain words match anywhere (name, role, notes,
// shop locations...). Structured terms filter on a quality:
//   cargo>=32  price<2m  crew<=1  maker:drake  loc:"new deal"  size:small  is:rentable  -is:concept
// The Filters panel just writes these terms into the search box, so typing and clicking stay in sync.
(function () {
  const { esc, fmt, availability, availabilityLabel, bestPrice, Purchases, Wishlist } = window.Wishlist;

  // ── Qualities ──────────────────────────────────────────────────────────────
  // Numeric getters return a number, a [low, high] range (crew), or null when unknown.
  // Ships with an unknown value never match a numeric filter.
  const nums = (s) => String(s ?? "").match(/\d+(\.\d+)?/g)?.map(Number) || [];
  const crewRange = (s) => {
    const n = nums(s.stats?.crew);
    if (!n.length) return null;
    // "up to 8" means it can be flown with 1.
    return /up to/i.test(s.stats.crew) ? [1, n[n.length - 1]] : [n[0], n[n.length - 1]];
  };
  const minRent = (s) => (s.acquisition.rent.length ? Math.min(...s.acquisition.rent.map((r) => r.pricePerDay)) : null);
  const medTier = (s) => {
    const n = String(s.stats?.medical || "").match(/T(\d)/g);
    return n ? Math.max(...n.map((t) => +t.slice(1))) : null;
  };
  const stat = (k) => (s) => (s.stats && s.stats[k] != null && s.stats[k] !== "" ? s.stats[k] : null);
  const turretCount = (s) => {
    const st = s.stats || {};
    return st.mannedTurrets || st.remoteTurrets ? (st.mannedTurrets || 0) + (st.remoteTurrets || 0) : null;
  };

  const NUMERIC = [
    { key: "price", aliases: ["cost", "auec", "buy"], label: "Price", unit: "aUEC", get: bestPrice, panel: true },
    { key: "rent", aliases: ["rental"], label: "Rent / day", unit: "aUEC", get: minRent, panel: true },
    { key: "pledge", aliases: ["usd", "msrp"], label: "Pledge", unit: "USD", get: (s) => s.pledge?.usd || null, panel: true },
    { key: "crew", aliases: [], label: "Crew", unit: "", get: crewRange, panel: true },
    { key: "cargo", aliases: ["scu"], label: "Cargo", unit: "SCU", get: stat("cargoScu"), panel: true },
    { key: "ore", aliases: ["mining"], label: "Mining hold", unit: "SCU", get: stat("oreScu"), panel: true },
    { key: "length", aliases: ["len"], label: "Length", unit: "m", get: stat("lengthM"), panel: true },
    { key: "beam", aliases: ["width"], label: "Width", unit: "m", get: stat("beamM") },
    { key: "height", aliases: [], label: "Height", unit: "m", get: stat("heightM") },
    { key: "mass", aliases: [], label: "Mass", unit: "t", get: stat("massT") },
    { key: "scm", aliases: ["speed"], label: "SCM speed", unit: "m/s", get: stat("scm"), panel: true },
    { key: "max", aliases: ["maxspeed", "top"], label: "Max speed", unit: "m/s", get: stat("maxSpeed"), panel: true },
    { key: "shield", aliases: ["shields"], label: "Shield HP", unit: "", get: stat("shieldHp"), panel: true },
    { key: "hull", aliases: ["hp"], label: "Hull HP", unit: "", get: stat("hullHp"), panel: true },
    { key: "dps", aliases: ["pilotdps"], label: "Pilot DPS", unit: "", get: stat("pilotDps"), panel: true },
    { key: "turretdps", aliases: [], label: "Turret DPS", unit: "", get: stat("turretDps"), panel: true },
    { key: "turrets", aliases: ["turret"], label: "Turrets", unit: "", get: turretCount },
    { key: "qt", aliases: ["quantum", "range"], label: "Quantum range", unit: "Gm", get: stat("qtRangeGm"), panel: true },
    { key: "claim", aliases: ["insurance"], label: "Claim time", unit: "min", get: stat("claimMin"), panel: true },
    { key: "med", aliases: ["medical", "medbay"], label: "Medbed tier", unit: "", get: medTier },
    { key: "em", aliases: [], label: "EM signature", unit: "", get: stat("emSig") },
    { key: "ir", aliases: [], label: "IR signature", unit: "", get: stat("irSig") },
  ];

  const allLocations = (s) => [...s.acquisition.buy, ...s.acquisition.rent].map((x) => x.location).join(" | ");
  const TEXT = [
    { key: "maker", aliases: ["manufacturer", "manu", "brand", "mfr"], label: "Maker", get: (s) => s.manufacturer },
    { key: "career", aliases: ["cat", "category", "kind"], label: "Career", get: (s) => s.career },
    { key: "role", aliases: ["focus"], label: "Role", get: (s) => s.role },
    { key: "size", aliases: [], label: "Size", get: (s) => s.size, exact: true },
    { key: "type", aliases: [], label: "Type", get: (s) => s.type, exact: true },
    { key: "status", aliases: [], label: "Status", get: (s) => s.status },
    { key: "loc", aliases: ["location", "shop", "at", "system"], label: "Sold/rented at", get: allLocations },
    { key: "group", aliases: ["wishlist"], label: "Wishlist group", get: (s) => (Wishlist.isWanted(s.id) ? Wishlist.group(s.id) : "") },
    { key: "avail", aliases: ["availability", "get"], label: "Availability", get: (s) => `${availability(s)} ${availabilityLabel[availability(s)]} ${s.acquisition.method}` },
    { key: "loaner", aliases: [], label: "Loaner", get: (s) => s.pledge?.loaner || "" },
    { key: "name", aliases: [], label: "Name", get: (s) => s.name },
  ];

  // is:/has: flags. Each maps to a test.
  const FLAGS = {
    ground: { label: "Ground vehicle", test: (s) => s.type === "ground" },
    ship: { label: "Spaceship", test: (s) => s.type !== "ground" },
    concept: { label: "In concept", test: (s) => s.status === "in-concept" },
    flyable: { label: "Flight-ready", test: (s) => s.status !== "in-concept", aliases: ["flight-ready", "ready", "ingame"] },
    buyable: { label: "Buyable for aUEC", test: (s) => s.acquisition.buy.length > 0, aliases: ["buy", "sold"] },
    rentable: { label: "Rentable", test: (s) => s.acquisition.rent.length > 0, aliases: ["rent", "rental"] },
    pledge: { label: "On the pledge store", test: (s) => !!s.pledge?.usd },
    wikelo: { label: "Wikelo trade", test: (s) => /wikelo/i.test(`${s.name} ${s.acquisition.method}`) },
    wanted: { label: "On my wishlist", test: (s) => Wishlist.isWanted(s.id), aliases: ["wishlist", "wish"] },
    owned: { label: "Purchased", test: (s) => Purchases.isPurchased(s.id), aliases: ["purchased", "bought"] },
    researched: { label: "Has my research / guide", test: (s) => !!s.curated, aliases: ["curated", "guide", "notes"] },
    medical: { label: "Has a medbed", test: (s) => medTier(s) != null, aliases: ["medbay", "med", "medbed"] },
    loaner: { label: "Comes with a loaner", test: (s) => !!s.pledge?.loaner },
    turrets: { label: "Has turrets", test: (s) => turretCount(s) != null, aliases: ["turret"] },
    shields: { label: "Has shields", test: (s) => (s.stats?.shieldHp || 0) > 0, aliases: ["shield"] },
    quantum: { label: "Has a quantum drive", test: (s) => (s.stats?.qtRangeGm || 0) > 0, aliases: ["qt"] },
    cargo: { label: "Has a cargo hold", test: (s) => (s.stats?.cargoScu || 0) > 0 },
    mining: { label: "Mining hold", test: (s) => (s.stats?.oreScu || 0) > 0, aliases: ["ore"] },
    weapons: { label: "Has pilot weapons", test: (s) => (s.stats?.pilotDps || 0) > 0, aliases: ["guns"] },
  };

  const byName = new Map();
  for (const f of NUMERIC) [f.key, ...f.aliases].forEach((k) => byName.set(k, { ...f, kind: "num", key: f.key }));
  for (const f of TEXT) [f.key, ...f.aliases].forEach((k) => byName.set(k, { ...f, kind: "text", key: f.key }));
  const flagByName = new Map();
  for (const [k, f] of Object.entries(FLAGS)) [k, ...(f.aliases || [])].forEach((a) => flagByName.set(a, { ...f, key: k }));

  // ── Parsing ────────────────────────────────────────────────────────────────
  // "2m" → 2000000, "500k" → 500000, "1,250" → 1250
  function parseNum(v) {
    const m = String(v).trim().toLowerCase().replace(/,/g, "").match(/^(\d+(?:\.\d+)?)([km]?)$/);
    if (!m) return null;
    return +m[1] * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : 1);
  }
  const unquote = (v) => v.replace(/^"(.*)"$/, "$1");

  function tokenize(q) {
    return q.match(/-?[^\s"]*"[^"]*"?|\S+/g) || [];
  }

  // Each term → { raw, neg, kind: "num"|"text"|"flag"|"free", field, op, value, lo, hi }
  function parseTerm(raw) {
    let t = raw;
    const neg = t.startsWith("-") && t.length > 1;
    if (neg) t = t.slice(1);
    const m = t.match(/^([a-z][a-z-]*)(>=|<=|>|<|=|:)(.+)$/i);
    if (m) {
      const name = m[1].toLowerCase();
      const op = m[2];
      const value = unquote(m[3]);
      if ((name === "is" || name === "has") && op === ":") {
        const flag = flagByName.get(value.toLowerCase());
        if (flag) return { raw, neg, kind: "flag", field: flag, value: flag.key };
      }
      const field = byName.get(name);
      if (field && field.kind === "num") {
        const range = value.match(/^([\d.,]+[km]?)(?:-|\.\.)([\d.,]+[km]?)$/i);
        if (range && (op === ":" || op === "=")) {
          const lo = parseNum(range[1]);
          const hi = parseNum(range[2]);
          if (lo != null && hi != null) return { raw, neg, kind: "num", field, op: "range", lo, hi };
        }
        const n = parseNum(value);
        if (n != null) return { raw, neg, kind: "num", field, op: op === ":" ? "=" : op, lo: n, hi: n };
      }
      if (field && field.kind === "text" && (op === ":" || op === "=")) {
        return { raw, neg, kind: "text", field, op, value: value.toLowerCase() };
      }
    }
    return { raw, neg, kind: "free", value: unquote(t).toLowerCase() };
  }

  const parse = (q) => tokenize(q).map(parseTerm).filter((t) => t.kind !== "free" || t.value);

  function testNum(t, s) {
    const v = t.field.get(s);
    if (v == null) return false;
    const [lo, hi] = Array.isArray(v) ? v : [v, v];
    // Ranges (crew "1–4") match if any value in the range satisfies the comparison.
    switch (t.op) {
      case ">=": return hi >= t.lo;
      case ">": return hi > t.lo;
      case "<=": return lo <= t.lo;
      case "<": return lo < t.lo;
      case "=": return lo <= t.lo && t.lo <= hi;
      case "range": return hi >= t.lo && lo <= t.hi;
    }
    return false;
  }

  function testTerm(t, s, haystack) {
    let ok;
    if (t.kind === "num") ok = testNum(t, s);
    else if (t.kind === "flag") ok = t.field.test(s);
    else if (t.kind === "text") {
      const v = String(t.field.get(s) || "").toLowerCase();
      ok = t.field.exact ? v === t.value || v.split(/[\s/]+/).includes(t.value) : v.includes(t.value);
    } else ok = haystack.includes(t.value);
    return t.neg ? !ok : ok;
  }

  const matches = (terms, s, haystack) => terms.every((t) => testTerm(t, s, haystack));

  // ── Editing the query from the panel ───────────────────────────────────────
  const quote = (v) => (/\s/.test(v) ? `"${v}"` : v);
  const shortNum = (n) => (n >= 1e6 && n % 1e5 === 0 ? `${n / 1e6}m` : n >= 1e3 && n % 100 === 0 ? `${n / 1e3}k` : String(n));

  // Replace the terms that `isMine` picks out with `newTerms`, keeping everything else.
  function rewrite(q, isMine, newTerms) {
    const kept = tokenize(q).filter((raw) => !isMine(parseTerm(raw)));
    return [...kept, ...newTerms.filter(Boolean)].join(" ").trim();
  }
  const setText = (q, key, value) =>
    rewrite(q, (t) => t.kind === "text" && t.field.key === key && !t.neg, [value ? `${key}:${quote(value)}` : ""]);
  const setFlag = (q, key, on) => rewrite(q, (t) => t.kind === "flag" && t.field.key === key && !t.neg, [on ? `is:${key}` : ""]);
  const setBound = (q, key, side, value) => {
    const n = parseNum(value);
    const own = (t) => t.kind === "num" && t.field.key === key && !t.neg;
    // A "scm:200-300" range term holds both bounds: split it so the other side survives.
    const range = parse(q).find((t) => own(t) && t.op === "range");
    const keep = range ? (side === "min" ? `${key}<=${shortNum(range.hi)}` : `${key}>=${shortNum(range.lo)}`) : "";
    const mine = (t) => own(t) && (t.op === "range" || (side === "min" ? [">=", ">"] : ["<=", "<"]).includes(t.op));
    return rewrite(q, mine, [keep, n != null ? `${key}${side === "min" ? ">=" : "<="}${shortNum(n)}` : ""]);
  };
  const removeTerm = (q, raw) => {
    const toks = tokenize(q);
    const i = toks.indexOf(raw);
    if (i >= 0) toks.splice(i, 1);
    return toks.join(" ");
  };

  // ── Labels ─────────────────────────────────────────────────────────────────
  const OPS = { ">=": "≥", "<=": "≤", ">": ">", "<": "<", "=": "=" };
  function termLabel(t) {
    const not = t.neg ? "not " : "";
    if (t.kind === "flag") return t.neg ? `not ${t.field.label.replace(/^./, (c) => c.toLowerCase())}` : t.field.label;
    if (t.kind === "text") {
      const system = t.field.key === "loc" && t.value.match(/^\((.+)\)$/);
      if (system) return `${not}Sold/rented in ${system[1].replace(/^./, (c) => c.toUpperCase())}`;
      return `${t.field.label}: ${not}${t.value}`;
    }
    if (t.kind === "num") {
      const u = t.field.unit ? ` ${t.field.unit}` : "";
      const v = t.op === "range" ? `${fmt(t.lo)}–${fmt(t.hi)}` : `${OPS[t.op]} ${fmt(t.lo)}`;
      return `${not}${t.field.label} ${v}${u}`;
    }
    return `${not}“${t.value}”`;
  }

  // Numeric fields the query filters on (the list shows these values on each row).
  const numericKeys = (terms) => [...new Set(terms.filter((t) => t.kind === "num").map((t) => t.field.key))];
  const numField = (key) => NUMERIC.find((f) => f.key === key);
  function formatValue(field, s) {
    const v = field.get(s);
    if (v == null) return null;
    const txt = Array.isArray(v) ? (v[0] === v[1] ? fmt(v[0]) : `${fmt(v[0])}–${fmt(v[1])}`) : fmt(v);
    return `${field.label} ${txt}${field.unit ? " " + field.unit : ""}`;
  }

  // ── Panel ──────────────────────────────────────────────────────────────────
  const SELECTS = [
    { key: "maker", label: "Maker", values: (ships) => ships.map((s) => s.manufacturer) },
    { key: "career", label: "Career", values: (ships) => ships.map((s) => s.career) },
    { key: "size", label: "Size", values: (ships) => ships.map((s) => s.size).filter((v) => v && v !== "—") },
    // Shop locations end in "(System)", so match on that to avoid "Pyro Gateway (Stanton)".
    { key: "loc", label: "Sold in", options: [["(stanton)", "Stanton"], ["(pyro)", "Pyro"], ["(nyx)", "Nyx"]] },
  ];
  const PANEL_FLAGS = ["ship", "ground", "flyable", "buyable", "rentable", "pledge", "loaner", "medical", "quantum", "turrets", "mining", "researched"];

  const EXAMPLES = [
    ["Solo cargo haulers under 3M", "cargo>=32 crew<=1 price<3m"],
    ["Rentable fighters", "career:combat is:rentable"],
    ["Medbeds you can buy in Pyro", "is:medical loc:pyro"],
    ["Fast and cheap", "scm>=250 price<1m"],
    ["Big guns, no concepts", "dps>=5000 -is:concept"],
    ["Small Drake ships", "maker:drake size:small"],
  ];

  function renderPanel(el, ships, q) {
    const terms = parse(q);
    const textVal = (key) => (terms.find((t) => t.kind === "text" && t.field.key === key && !t.neg) || {}).value || "";
    const bound = (key, side) => {
      const t = terms.find(
        (t) => t.kind === "num" && t.field.key === key && !t.neg && (side === "min" ? [">=", ">", "range"] : ["<=", "<", "range"]).includes(t.op)
      );
      return t ? shortNum(t.op === "range" ? (side === "min" ? t.lo : t.hi) : t.lo) : "";
    };
    const flagOn = (key) => terms.some((t) => t.kind === "flag" && t.field.key === key && !t.neg);

    const counts = (arr) => {
      const c = {};
      arr.forEach((v) => (c[v] = (c[v] || 0) + 1));
      return Object.keys(c).sort((a, b) => a.localeCompare(b));
    };
    const extent = (f) => {
      const vals = ships.map(f.get).filter((v) => v != null).flat();
      return vals.length ? [Math.min(...vals), Math.max(...vals)] : null;
    };

    el.innerHTML = `
      <div class="fp-section fp-selects">
        ${SELECTS.map((sel) => {
          const cur = textVal(sel.key);
          const opts = sel.options || counts(sel.values(ships)).map((o) => [o, o]);
          const known = opts.some(([v]) => v.toLowerCase() === cur);
          return `<label><span>${sel.label}</span>
            <select data-fp-text="${sel.key}">
              <option value="">Any</option>
              ${opts.map(([v, l]) => `<option value="${esc(v)}"${v.toLowerCase() === cur ? " selected" : ""}>${esc(l)}</option>`).join("")}
              ${cur && !known ? `<option selected value="${esc(cur)}">${esc(cur)}</option>` : ""}
            </select></label>`;
        }).join("")}
      </div>
      <div class="fp-section fp-flags">
        ${PANEL_FLAGS.map((k) => `<label class="fp-flag"><input type="checkbox" data-fp-flag="${k}"${flagOn(k) ? " checked" : ""}> ${esc(FLAGS[k].label)}</label>`).join("")}
      </div>
      <div class="fp-section fp-ranges">
        ${NUMERIC.filter((f) => f.panel).map((f) => {
          const ext = extent(f);
          const ph = ext ? [shortNum(Math.floor(ext[0])), shortNum(Math.ceil(ext[1]))] : ["min", "max"];
          return `<div class="fp-range">
            <span>${esc(f.label)}${f.unit ? ` <small>${esc(f.unit)}</small>` : ""}</span>
            <input inputmode="decimal" data-fp-num="${f.key}" data-side="min" value="${esc(bound(f.key, "min"))}" placeholder="${esc(ph[0])}" aria-label="${esc(f.label)} minimum">
            <em>–</em>
            <input inputmode="decimal" data-fp-num="${f.key}" data-side="max" value="${esc(bound(f.key, "max"))}" placeholder="${esc(ph[1])}" aria-label="${esc(f.label)} maximum">
          </div>`;
        }).join("")}
      </div>
      <details class="fp-help">
        <summary>Type filters into the search box</summary>
        <p>Plain words match anywhere. Add terms to filter on a quality. Prefix any term with <code>-</code> to exclude. Numbers take <code>k</code> and <code>m</code> (<code>2.5m</code>). Ships with no data for a number are left out when you filter on it.</p>
        <table class="fp-syntax">
          <tr><td><code>cargo&gt;=32</code> <code>price&lt;2m</code> <code>scm:200-300</code></td><td>Numbers: ${NUMERIC.map((f) => `<code>${f.key}</code>`).join(" ")}</td></tr>
          <tr><td><code>maker:drake</code> <code>loc:"new deal"</code></td><td>Text: ${TEXT.map((f) => `<code>${f.key}</code>`).join(" ")}</td></tr>
          <tr><td><code>is:rentable</code> <code>-is:concept</code></td><td>Flags: ${Object.keys(FLAGS).map((k) => `<code>${k}</code>`).join(" ")}</td></tr>
        </table>
        <p>Try: ${EXAMPLES.map(([label, ex]) => `<button type="button" class="ghost fp-example" data-fp-example="${esc(ex)}" title="${esc(ex)}">${esc(label)}</button>`).join(" ")}</p>
      </details>
    `;
  }

  // Wire the panel: every control change produces a new query string.
  function bindPanel(el, getQuery, setQuery) {
    el.addEventListener("change", (e) => {
      const t = e.target;
      const q = getQuery();
      if (t.dataset.fpText) setQuery(setText(q, t.dataset.fpText, t.value));
      else if (t.dataset.fpFlag) setQuery(setFlag(q, t.dataset.fpFlag, t.checked));
      else if (t.dataset.fpNum) setQuery(setBound(q, t.dataset.fpNum, t.dataset.side, t.value));
    });
    el.addEventListener("click", (e) => {
      const ex = e.target.closest("[data-fp-example]");
      if (!ex) return;
      ex.blur(); // let the panel re-render to show the example's values
      setQuery(ex.dataset.fpExample);
    });
  }

  window.ShipFilters = {
    parse, matches, termLabel, removeTerm, renderPanel, bindPanel,
    numericKeys, numField, formatValue, NUMERIC,
  };
})();
