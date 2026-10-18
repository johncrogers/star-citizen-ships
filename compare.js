// Compare tab: up to 4 ships side by side, and an upgrade calculator (real-money cost to upgrade
// one pledged ship to another, plus the in-game aUEC difference).
// Reads only the merged ship records from common.js. The ships being compared are a browser-only
// convenience (localStorage + the #compare=a,b URL), not saved to a file.
(function () {
  const { esc, fmt, ships, shipById, availability, availabilityLabel, bestPrice, Purchases, ownedLabel } = window.Wishlist;

  const MAX = 4;
  const LIST_KEY = "sc-ships-wishlist:compare";
  const CALC_KEY = "sc-ships-wishlist:upgrade";
  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; }
  };
  const store = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  };

  let ids = (load(LIST_KEY, []) || []).filter((id) => shipById.has(id)).slice(0, MAX);
  let calc = load(CALC_KEY, {}) || {};
  // Each ship keeps its chart color while it's in compare, even when the baseline changes.
  const SLOTS_KEY = "sc-ships-wishlist:compare-colors";
  let slots = load(SLOTS_KEY, {}) || {};
  function assignSlots() {
    for (const id of Object.keys(slots)) if (!ids.includes(id)) delete slots[id];
    for (const id of ids) {
      if (slots[id] != null) continue;
      const used = new Set(Object.values(slots));
      slots[id] = [0, 1, 2, 3].find((n) => !used.has(n));
    }
  }
  assignSlots();
  const slotOf = (id) => slots[id] ?? 0;
  const swatch = (id) => `<span class="swatch s${slotOf(id)}" aria-hidden="true"></span>`;
  const listeners = [];
  const changed = () => {
    assignSlots();
    store(LIST_KEY, ids);
    store(CALC_KEY, calc);
    store(SLOTS_KEY, slots);
    listeners.forEach((fn) => fn());
  };

  const Compare = {
    MAX,
    ids: () => ids.slice(),
    has: (id) => ids.includes(id),
    full: () => ids.length >= MAX,
    toggle(id) {
      if (ids.includes(id)) ids = ids.filter((x) => x !== id);
      else if (ids.length < MAX && shipById.has(id)) ids = [...ids, id];
      changed();
    },
    setAll(list) {
      ids = [...new Set(list)].filter((id) => shipById.has(id)).slice(0, MAX);
      changed();
    },
    // The baseline is the first column. Every other column shows its difference from it.
    setBaseline(id) {
      if (!ids.includes(id)) return;
      ids = [id, ...ids.filter((x) => x !== id)];
      changed();
    },
    clear() {
      ids = [];
      changed();
    },
    setUpgrade(from, to) {
      calc = { from: from ?? calc.from, to: to ?? calc.to };
      changed();
    },
    onChange: (fn) => listeners.push(fn),
  };

  // ── Upgrade maths ──────────────────────────────────────────────────────────
  // RSI upgrades cost the difference between the two ships' standard store prices, and only go
  // to a more expensive ship. Returns { usd, auec, ok, issues: [{ level, text }] }.
  const usd = (s) => s?.pledge?.usd || null;
  const money = (n) => `$${fmt(n)}`;
  const signed = (n, f = fmt) => (n > 0 ? `+${f(n)}` : n < 0 ? `−${f(-n)}` : "±0");

  function upgrade(from, to) {
    const issues = [];
    const warn = (text) => issues.push({ level: "warn", text });
    const info = (text) => issues.push({ level: "info", text });
    if (from.id === to.id) {
      warn("Pick two different ships.");
      return { usd: null, auec: null, ok: false, issues };
    }
    const fu = usd(from);
    const tu = usd(to);
    if (!fu) warn(`${from.name} isn't sold on the pledge store, so there's no store price to upgrade from.`);
    if (!tu) warn(`${to.name} isn't sold on the pledge store, so you can't upgrade to it.`);
    const cost = fu && tu ? tu - fu : null;
    if (cost != null && cost <= 0) {
      warn(`${to.name} costs ${cost === 0 ? "the same as" : "less than"} ${from.name}. Upgrades only go to a more expensive ship.`);
    }
    if ((from.type === "ground") !== (to.type === "ground")) {
      info("This upgrade goes between a ground vehicle and a spaceship. RSI may not offer it (unverified), so check the upgrade store before you count on it.");
    }
    if (to.status === "in-concept") info(`${to.name} is still in concept. You can pledge for it, but you can't fly it yet.`);
    if (!Purchases.isPledged(from.id)) {
      info(`You haven't marked ${from.name} as pledged. You can only upgrade ships you own on the pledge store, not ones bought with aUEC.`);
    }
    const fa = bestPrice(from);
    const ta = bestPrice(to);
    return {
      usd: cost,
      auec: fa != null && ta != null ? ta - fa : null,
      ok: cost != null && cost > 0,
      issues,
    };
  }

  // Lines for a ship's detail panel: what upgrading from each of my pledged ships would cost.
  function upgradeSummary(ship) {
    const pledged = ships.filter((s) => s.id !== ship.id && Purchases.isPledged(s.id));
    const calcLink = `<button type="button" class="linklike" data-upgrade-to="${esc(ship.id)}">Open the upgrade calculator →</button>`;
    if (!usd(ship)) return "";
    if (!pledged.length) {
      return `<p class="muted small">Mark ships you own as <strong>Pledged</strong> to see what upgrading from them to this ship would cost. ${calcLink}</p>`;
    }
    const rows = pledged
      .map((p) => ({ p, u: upgrade(p, ship) }))
      .sort((a, b) => (a.u.ok === b.u.ok ? (a.u.usd ?? 1e9) - (b.u.usd ?? 1e9) : a.u.ok ? -1 : 1))
      .map(({ p, u }) => `<tr${u.ok ? "" : ' class="muted"'}>
        <td>${esc(p.name)} <small class="muted">${usd(p) ? money(usd(p)) : "not on store"}</small></td>
        <td class="num">${u.ok ? `<strong>${money(u.usd)}</strong>` : u.usd != null ? "Costs more" : "Not possible"}</td>
        <td class="num">${u.auec != null ? `${signed(u.auec)} aUEC` : "—"}</td>
      </tr>`)
      .join("");
    return `<table class="upgrade-from"><thead><tr><th>Upgrade from my pledged ship</th><th class="num">USD</th><th class="num">In-game diff.</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="small">${calcLink}</p>`;
  }

  // ── Compare table ──────────────────────────────────────────────────────────
  const stat = (k) => (s) => {
    const v = s.stats?.[k];
    return v == null || v === "" ? null : v;
  };
  const minRent = (s) => (s.acquisition.rent.length ? Math.min(...s.acquisition.rent.map((r) => r.pricePerDay)) : null);
  const turrets = (s) => {
    const st = s.stats || {};
    return st.mannedTurrets || st.remoteTurrets ? `${st.mannedTurrets || 0} manned · ${st.remoteTurrets || 0} remote` : null;
  };

  // better: "high" or "low" marks the best value with a star and colors the differences.
  // Rows without `better` still show differences, in a neutral color.
  const GROUPS = [
    ["Price", [
      { label: "Pledge store", get: usd, show: money, diff: (d) => signed(d, money) },
      { label: "Upgrade from baseline", upgrade: true },
      { label: "In-game, cheapest", get: bestPrice, unit: "aUEC" },
      { label: "Rent / day", get: minRent, unit: "aUEC" },
      { label: "How to get it", text: (s) => availabilityLabel[availability(s)] },
      { label: "I own it", text: (s) => ownedLabel(s.id) || "—" },
    ]],
    ["Basics", [
      { label: "Manufacturer", text: (s) => s.manufacturer },
      { label: "Role", text: (s) => s.role },
      { label: "Size", text: (s) => s.size },
      { label: "Status", text: (s) => s.status },
      { label: "Crew", text: (s) => s.stats?.crew },
    ]],
    ["Flight", [
      { label: "SCM speed", get: stat("scm"), unit: "m/s", better: "high" },
      { label: "Max speed", get: stat("maxSpeed"), unit: "m/s", better: "high" },
      { label: "Quantum range", get: stat("qtRangeGm"), unit: "Gm", better: "high" },
    ]],
    ["Combat", [
      { label: "Pilot DPS", get: stat("pilotDps"), better: "high" },
      { label: "Turret DPS", get: stat("turretDps"), better: "high" },
      { label: "Shield HP", get: stat("shieldHp"), better: "high" },
      { label: "Hull HP", get: stat("hullHp"), better: "high" },
      { label: "Turrets", text: turrets },
    ]],
    ["Cargo & support", [
      { label: "Cargo", get: stat("cargoScu"), unit: "SCU", better: "high" },
      { label: "Mining hold", get: stat("oreScu"), unit: "SCU", better: "high" },
      { label: "Medical", text: (s) => s.stats?.medical },
      { label: "Loaner", text: (s) => s.pledge?.loaner },
    ]],
    ["Size & insurance", [
      { label: "Length", get: stat("lengthM"), unit: "m" },
      { label: "Width", get: stat("beamM"), unit: "m" },
      { label: "Height", get: stat("heightM"), unit: "m" },
      { label: "Mass", get: stat("massT"), unit: "t" },
      { label: "Claim time", get: stat("claimMin"), unit: "min", better: "low" },
    ]],
    ["Signatures (lower hides better)", [
      { label: "EM signature", get: stat("emSig"), better: "low" },
      { label: "IR signature", get: stat("irSig"), better: "low" },
    ]],
  ];

  function rowHtml(row, cols) {
    const base = cols[0];
    if (row.upgrade) {
      if (cols.length < 2) return "";
      const cells = cols.map((s, i) => {
        if (i === 0) return `<td class="num muted">baseline</td>`;
        const u = upgrade(base, s);
        const why = u.issues.filter((x) => x.level === "warn").map((x) => x.text).join(" ");
        return u.ok
          ? `<td class="num"><strong class="up-ok">${money(u.usd)}</strong></td>`
          : `<td class="num muted" title="${esc(why)}">${u.usd != null ? "Costs less" : "Not possible"}</td>`;
      });
      return `<tr><th scope="row">${esc(row.label)}</th>${cells.join("")}</tr>`;
    }
    if (row.text) {
      const vals = cols.map((s) => row.text(s));
      if (vals.every((v) => v == null || v === "" || v === "—")) return "";
      return `<tr><th scope="row">${esc(row.label)}</th>${vals.map((v) => `<td>${v ? esc(v) : '<span class="muted">—</span>'}</td>`).join("")}</tr>`;
    }
    const vals = cols.map((s) => row.get(s));
    const known = vals.filter((v) => v != null);
    if (!known.length) return "";
    let best = null;
    if (row.better && known.length > 1 && new Set(known).size > 1) {
      best = row.better === "high" ? Math.max(...known) : Math.min(...known);
    }
    const show = row.show || ((v) => fmt(v));
    const unit = row.unit ? ` <small>${row.unit}</small>` : "";
    const cells = vals.map((v, i) => {
      if (v == null) return `<td class="num muted">—</td>`;
      let diff = "";
      if (i > 0 && vals[0] != null && v !== vals[0]) {
        const d = v - vals[0];
        const good = row.better ? (row.better === "high") === d > 0 : null;
        const shown = row.diff ? row.diff(d) : signed(Math.round(d * 100) / 100);
        diff = `<span class="diff${good == null ? "" : good ? " good" : " bad"}">${shown}</span>`;
      }
      const star = v === best ? `<span class="best-star" title="Best">★</span> ` : "";
      return `<td class="num${v === best ? " best" : ""}">${star}${show(v)}${unit}${diff}</td>`;
    });
    return `<tr><th scope="row">${esc(row.label)}</th>${cells.join("")}</tr>`;
  }

  function tableHtml(cols) {
    const head = cols
      .map((s, i) => `<th scope="col" class="cmp-col">
        <a href="#${esc(s.id)}" class="cmp-thumb" title="Open ${esc(s.name)}">${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</a>
        <a href="#${esc(s.id)}" class="cmp-name">${swatch(s.id)}${esc(s.name)}</a>
        <span class="cmp-actions">
          ${i === 0 ? `<span class="tag">Baseline</span>` : `<button type="button" class="ghost mini" data-baseline="${esc(s.id)}" title="Compare the other ships against this one">Make baseline</button>`}
          <button type="button" class="ghost mini" data-compare="${esc(s.id)}" title="Remove from compare" aria-label="Remove ${esc(s.name)}">×</button>
        </span>
      </th>`)
      .join("");
    const body = GROUPS.map(([group, rows]) => {
      const html = rows.map((r) => rowHtml(r, cols)).join("");
      return html ? `<tr class="cmp-group"><th colspan="${cols.length + 1}">${esc(group)}</th></tr>${html}` : "";
    }).join("");
    return `<div class="cmp-scroll"><table class="cmp-table"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  // ── Stat charts ────────────────────────────────────────────────────────────
  // One small bar chart per stat. Each ship's bar wears its color (see slots above); values and
  // names stay in text colors. better: "high" | "low" stars the best value.
  const CHARTS = [
    ["Flight", [
      { label: "SCM speed", key: "scm", unit: "m/s", better: "high" },
      { label: "Max speed", key: "maxSpeed", unit: "m/s", better: "high" },
      { label: "Boost speed", key: "boostSpeed", unit: "m/s", better: "high" },
      { label: "0 to SCM speed", key: "zeroToScmS", unit: "s", better: "low" },
      { label: "Pitch", key: "pitch", unit: "°/s", better: "high" },
      { label: "Yaw", key: "yaw", unit: "°/s", better: "high" },
      { label: "Roll", key: "roll", unit: "°/s", better: "high" },
    ]],
    ["Combat", [
      { label: "Pilot DPS", key: "pilotDps", better: "high" },
      { label: "Pilot sustained DPS", key: "pilotSustainedDps", better: "high", note: "before overheating" },
      { label: "Pilot alpha", key: "pilotAlpha", better: "high", note: "damage per volley" },
      { label: "Turret DPS", key: "turretDps", better: "high" },
      { label: "Missile damage", key: "missileDamage", better: "high", note: "full load" },
      { label: "Missiles", key: "missileCount", better: "high" },
      { label: "Shield HP", key: "shieldHp", better: "high" },
      { label: "Shield regen", key: "shieldRegen", unit: "HP/s", better: "high" },
      { label: "Hull HP", key: "hullHp", better: "high" },
    ]],
    ["Travel", [
      { label: "Quantum speed", key: "qtSpeedMms", unit: "Mm/s", better: "high" },
      { label: "Quantum spool time", key: "qtSpoolS", unit: "s", better: "low" },
      { label: "Quantum range", key: "qtRangeGm", unit: "Gm", better: "high" },
      { label: "Quantum fuel", key: "quantumFuel", better: "high" },
      { label: "Hydrogen fuel", key: "hydrogenFuel", better: "high" },
    ]],
    ["Cargo & crew", [
      { label: "Cargo", key: "cargoScu", unit: "SCU", better: "high" },
      { label: "Mining hold", key: "oreScu", unit: "SCU", better: "high" },
      { label: "Personal storage", key: "storageScu", unit: "SCU", better: "high" },
      { label: "Largest cargo box", key: "maxBoxScu", unit: "SCU", better: "high" },
      { label: "Beds", key: "beds", better: "high" },
    ]],
    ["Stealth & insurance", [
      { label: "EM signature", key: "emSig", better: "low" },
      { label: "IR signature", key: "irSig", better: "low" },
      { label: "Claim time", key: "claimMin", unit: "min", better: "low" },
    ]],
  ];

  function chartHtml(c, cols) {
    const vals = cols.map((s) => {
      const v = s.stats?.[c.key];
      return typeof v === "number" ? v : null;
    });
    const known = vals.filter((v) => v != null);
    if (!known.length) return "";
    const max = Math.max(...known);
    const best = known.length > 1 && new Set(known).size > 1 ? (c.better === "low" ? Math.min(...known) : Math.max(...known)) : null;
    const unit = c.unit ? ` ${c.unit}` : "";
    const rows = cols.map((s, i) => {
      const v = vals[i];
      // Tiny non-zero values still get a visible sliver; zero gets no bar.
      const pct = !v || !max ? 0 : Math.max(1.5, (v / max) * 100);
      const vs = i > 0 && v != null && vals[0] != null && v !== vals[0] ? ` (${signed(Math.round((v - vals[0]) * 10) / 10)} vs ${cols[0].name})` : "";
      const tip = v == null ? `${s.name}: no data` : `${s.name}: ${fmt(v)}${unit}${vs}`;
      return `<div class="bar-row" title="${esc(tip)}">
        <span class="bar-name">${esc(s.name)}</span>
        <span class="bar-track">${v == null ? "" : `<span class="bar s${slotOf(s.id)}" style="width:${pct.toFixed(1)}%"></span>`}</span>
        <span class="bar-val${v === best ? " best" : ""}">${v == null ? '<span class="muted">—</span>' : `${v === best ? '<span class="best-star" aria-label="Best">★</span> ' : ""}${fmt(v)}`}</span>
      </div>`;
    }).join("");
    const sub = [c.unit, c.better === "low" ? "lower is better" : "", c.note].filter(Boolean).join(" · ");
    return `<figure class="chart">
      <figcaption><strong>${esc(c.label)}</strong>${sub ? ` <small>${esc(sub)}</small>` : ""}</figcaption>
      ${rows}
    </figure>`;
  }

  function chartsHtml(cols) {
    const legend = `<div class="legend">${cols.map((s) => `<span>${swatch(s.id)}${esc(s.name)}</span>`).join("")}</div>`;
    const groups = CHARTS.map(([group, charts]) => {
      const html = charts.map((c) => chartHtml(c, cols)).join("");
      return html ? `<h4 class="chart-group">${esc(group)}</h4><div class="charts">${html}</div>` : "";
    }).join("");
    return `<section class="cmp-card">
      <h3>Stats compared</h3>
      ${legend}
      ${groups || '<p class="muted">No stats for these ships yet.</p>'}
      <p class="note small">Stats come from the Star Citizen Wiki API for patch ${esc((window.SHIP_CATALOG_META || {}).patch || "?")}. Concept ships have little or no data. Hover a bar for the exact value and its difference from ${esc(cols[0].name)}.</p>
    </section>`;
  }

  // ── Features, loadout, guides, things to know ──────────────────────────────
  // Capabilities are keys in each ship's `features` list (from the refresh script).
  const FEATURES = [
    ["quantum", "Quantum drive"],
    ["vtol", "VTOL thrusters"],
    ["bed", "Bed (log out on board)", (s) => s.stats?.beds && `${s.stats.beds} bed${s.stats.beds > 1 ? "s" : ""}`],
    ["medbed", "Medical bed", (s) => s.stats?.medical],
    ["ejection", "Ejection seats"],
    ["escapePods", "Escape pods"],
    ["jumpSeats", "Jump seats"],
    ["tractor", "Tractor beam"],
    ["mining", "Mining"],
    ["salvage", "Salvage"],
    ["refuel", "Refueling"],
    ["interdiction", "Quantum interdiction"],
    ["emp", "EMP"],
    ["torpedoes", "Torpedoes"],
    ["pdc", "Point defense turrets"],
    ["dockingCollar", "Docking collar"],
    ["snubHangar", "Snub hangar"],
  ];
  // Capabilities that come from stats rather than the features list.
  const DERIVED = [
    ["Cargo hold", (s) => s.stats?.cargoScu > 0 && `${fmt(s.stats.cargoScu)} SCU${s.stats.maxBoxScu ? ` · boxes up to ${s.stats.maxBoxScu} SCU` : ""}`],
    ["Shields", (s) => s.stats?.shieldHp > 0 && `${fmt(s.stats.shieldHp)} HP`],
    ["Turrets", (s) => (s.stats?.mannedTurrets || s.stats?.remoteTurrets) && `${s.stats.mannedTurrets || 0} manned · ${s.stats.remoteTurrets || 0} remote`],
    ["Missiles", (s) => s.stats?.missileCount && `${s.stats.missileCount}`],
    ["Countermeasures", (s) => s.stats?.countermeasures && `${s.stats.countermeasures} launchers`],
    ["Comes with a loaner", (s) => s.pledge?.loaner],
  ];
  const yes = (detail) => `<span class="yes"><span class="yes-icon" aria-hidden="true">✓</span> ${detail ? esc(detail) : "Yes"}</span>`;
  const no = `<span class="muted" aria-label="No">—</span>`;
  const headRow = (cols) => `<thead><tr><th></th>${cols.map((s) => `<th scope="col" class="cmp-col">${swatch(s.id)}${esc(s.name)}</th>`).join("")}</tr></thead>`;

  function featuresHtml(cols) {
    const rows = [
      ...FEATURES.map(([key, label, detail]) => [label, (s) => (s.features || []).includes(key) && ((detail && detail(s)) || true)]),
      ...DERIVED,
    ]
      .map(([label, get]) => {
        const vals = cols.map(get);
        if (!vals.some(Boolean)) return "";
        return `<tr><th scope="row">${esc(label)}</th>${vals.map((v) => `<td>${v ? yes(v === true ? "" : v) : no}</td>`).join("")}</tr>`;
      })
      .join("");
    const noData = cols.filter((s) => s.status === "in-concept" && !(s.features || []).length);
    return `<section class="cmp-card">
      <h3>Capabilities</h3>
      ${rows ? `<div class="cmp-scroll"><table class="cmp-table">${headRow(cols)}<tbody>${rows}</tbody></table></div>` : '<p class="muted">None of these ships have any listed capabilities.</p>'}
      <p class="note small">Read from the game data, so it can miss things the data doesn't describe, like vehicle bays and ramps.
        Only capabilities at least one of these ships has are shown.${noData.length ? ` No data for ${noData.map((s) => esc(s.name)).join(", ")} (not in the game yet).` : ""}</p>
    </section>`;
  }

  const LOADOUT = [
    ["Guns", (s) => s.loadout?.guns],
    ["Turrets", (s) => s.loadout?.turrets],
    ["Missiles & bombs", (s) => s.loadout?.missiles],
    ["Components", (s) => s.loadout?.systems],
  ];
  function loadoutHtml(cols) {
    const rows = LOADOUT.map(([label, get]) => {
      const vals = cols.map(get);
      if (!vals.some((v) => v && v.length)) return "";
      return `<tr><th scope="row">${esc(label)}</th>${vals
        .map((v) => `<td>${v && v.length ? `<ul class="plain">${v.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : no}</td>`)
        .join("")}</tr>`;
    }).join("");
    if (!rows) return "";
    return `<section class="cmp-card">
      <h3>Weapons &amp; loadout</h3>
      <div class="cmp-scroll"><table class="cmp-table loadout">${headRow(cols)}<tbody>${rows}</tbody></table></div>
      <p class="note small">The stock loadout. Sizes are hardpoint sizes (S1–S10). Gimbal mounts hold a gun one size smaller.</p>
    </section>`;
  }

  // Ship guides live in guides/<id>.js and only load on ship.html, so fetch them here on demand
  // with a script tag (works from file://). Ships without a guide simply fail to load one.
  const guideState = new Map(); // id -> "loading" | "loaded" | "missing"
  function ensureGuide(s) {
    if (!s.curated || guideState.has(s.id)) return;
    guideState.set(s.id, "loading");
    const tag = document.createElement("script");
    tag.src = `guides/${encodeURIComponent(s.id)}.js`;
    tag.onload = () => { guideState.set(s.id, "loaded"); changed(); };
    tag.onerror = () => { guideState.set(s.id, "missing"); changed(); };
    document.head.appendChild(tag);
  }
  const guideOf = (s) => (window.SHIP_GUIDES || {})[s.id];

  function columnsHtml(cols, cell) {
    return `<div class="cmp-scroll"><div class="cmp-cols" style="--cols:${cols.length}">${cols
      .map((s) => `<div class="cmp-colbox"><h4>${swatch(s.id)}${esc(s.name)}</h4>${cell(s)}</div>`)
      .join("")}</div></div>`;
  }

  function guidesHtml(cols) {
    cols.forEach(ensureGuide);
    if (!cols.some((s) => s.curated)) {
      return `<section class="cmp-card"><h3>Guide features</h3><p class="muted small">None of these ships has a guide yet. Ships you research get one (see the README).</p></section>`;
    }
    const cell = (s) => {
      const g = guideOf(s);
      if (!g) {
        const st = guideState.get(s.id);
        return `<p class="muted small">${st === "loading" ? "Loading…" : "No guide for this ship yet."}</p>`;
      }
      return `${g.summary ? `<p class="small">${esc(g.summary)}</p>` : ""}
        <ul class="feature-list">${(g.features || []).map((f) => `<li><strong>${esc(f.name)}</strong><span>${esc(f.what || "")}</span></li>`).join("")}</ul>
        <a class="small" href="ship.html#${esc(s.id)}">Full guide →</a>`;
    };
    return `<section class="cmp-card"><h3>Guide features</h3>${columnsHtml(cols, cell)}</section>`;
  }

  function ttkHtml(cols) {
    if (!cols.some((s) => (s.thingsToKnow || []).length)) {
      return `<section class="cmp-card"><h3>Things to know</h3><p class="muted small">No notes for these ships yet. Researched ships get Things to know in ships.data.js.</p></section>`;
    }
    const cell = (s) => {
      const items = s.thingsToKnow || [];
      return items.length
        ? `<ul class="ttk">${items.map((t) => `<li class="ttk-${t.level === "warn" ? "warn" : "info"}"><span class="ttk-icon">${t.level === "warn" ? "!" : "i"}</span>${esc(t.text)}</li>`).join("")}</ul>`
        : `<p class="muted small">Nothing noted yet.</p>`;
    };
    return `<section class="cmp-card"><h3>Things to know</h3>${columnsHtml(cols, cell)}</section>`;
  }

  // ── Upgrade calculator ─────────────────────────────────────────────────────
  const byName = [...ships].sort((a, b) => a.name.localeCompare(b.name));
  const optionLabel = (s) => `${s.name} · ${usd(s) ? money(usd(s)) : "not on store"}`;

  function shipSelect(name, selected) {
    const pledged = byName.filter((s) => Purchases.isPledged(s.id));
    const comparing = ids.map((id) => shipById.get(id));
    const onStore = byName.filter((s) => usd(s)).sort((a, b) => usd(a) - usd(b) || a.name.localeCompare(b.name));
    const notOnStore = byName.filter((s) => !usd(s));
    const group = (label, list) =>
      list.length
        ? `<optgroup label="${esc(label)}">${list.map((s) => `<option value="${esc(s.id)}"${s.id === selected ? " selected" : ""}>${esc(optionLabel(s))}</option>`).join("")}</optgroup>`
        : "";
    // The same ship can appear in several groups; only mark the first copy as selected.
    let html = [
      group("My pledged ships", pledged),
      group("Comparing", comparing),
      group("On the pledge store, cheapest first", onStore),
      group("Not on the pledge store", notOnStore),
    ].join("");
    let seen = false;
    html = html.replace(/ selected/g, () => (seen ? "" : ((seen = true), " selected")));
    return `<select data-upgrade-pick="${name}" aria-label="Upgrade ${name}">${html}</select>`;
  }

  // Sensible defaults: from my first pledged ship (or the baseline), to the next ship in compare.
  function calcPair() {
    let from = shipById.get(calc.from);
    let to = shipById.get(calc.to);
    const pledged = byName.filter((s) => Purchases.isPledged(s.id));
    if (!from) from = pledged[0] || shipById.get(ids[0]) || byName.find((s) => usd(s));
    if (!to) to = ids.map((id) => shipById.get(id)).find((s) => s.id !== from.id) || byName.find((s) => usd(s) > (usd(from) || 0)) || from;
    return [from, to];
  }

  function calcHtml() {
    const [from, to] = calcPair();
    const u = upgrade(from, to);
    const usdLine = u.ok
      ? `<strong>${money(u.usd)}</strong><span>USD to upgrade · ${money(usd(from))} → ${money(usd(to))}</span>`
      : `<strong class="muted">Not possible</strong><span>${usd(from) && usd(to) ? `${money(usd(from))} → ${money(usd(to))}` : "Needs both ships on the pledge store"}</span>`;
    const auecLine = u.auec != null
      ? `<strong>${signed(u.auec)} aUEC</strong><span>in-game price difference at the cheapest shops</span>`
      : `<strong class="muted">—</strong><span>in-game: ${bestPrice(from) == null ? `${esc(from.name)} isn't` : `${esc(to.name)} isn't`} sold for aUEC</span>`;
    const issues = u.issues.length
      ? `<ul class="ttk">${u.issues.map((t) => `<li class="ttk-${t.level}"><span class="ttk-icon">${t.level === "warn" ? "!" : "i"}</span>${esc(t.text)}</li>`).join("")}</ul>`
      : "";
    return `<section class="cmp-card">
      <h3>Upgrade calculator</h3>
      <div class="up-pick">
        <label>From ${shipSelect("from", from.id)}</label>
        <button type="button" class="ghost mini" data-upgrade-swap title="Swap">⇄</button>
        <label>To ${shipSelect("to", to.id)}</label>
        <span class="up-add">
          ${[from, to].filter((s) => !ids.includes(s.id)).length && !Compare.full()
            ? `<button type="button" class="ghost mini" data-compare-pair="${esc(from.id)},${esc(to.id)}">Add both to the table</button>`
            : ""}
        </span>
      </div>
      <div class="up-result">
        <div class="up-figure">${usdLine}</div>
        <div class="up-figure">${auecLine}</div>
      </div>
      ${issues}
      <p class="note small">Uses RSI's standard store prices (from the Star Citizen Wiki API), before tax.
        Sales and warbond upgrades can cost less, and some ships are only sold during sales.
        Upgrading replaces the ship you upgrade from in your hangar.</p>
    </section>`;
  }

  function render(el) {
    const cols = ids.map((id) => shipById.get(id));
    const picker = Compare.full()
      ? `<span class="muted small">Compare holds up to ${MAX} ships. Remove one to add another.</span>`
      : `<input type="search" list="cmpShipNames" data-compare-add placeholder="Add a ship to compare…" autocomplete="off" aria-label="Add a ship to compare">
         <datalist id="cmpShipNames">${byName.filter((s) => !ids.includes(s.id)).map((s) => `<option value="${esc(s.name)}"></option>`).join("")}</datalist>`;
    el.innerHTML = `
      ${calcHtml()}
      <section class="cmp-card">
        <div class="cmp-head">
          <h3>Side by side</h3>
          ${picker}
          ${cols.length ? `<button type="button" class="ghost mini" data-compare-clear>Clear</button>` : ""}
        </div>
        ${cols.length
          ? `${cols.length === 1 ? `<p class="muted small">Add another ship to see the differences.</p>` : `<p class="muted small">Differences are against the baseline (first column). ★ marks the best value.</p>`}${tableHtml(cols)}`
          : `<p class="empty">No ships picked yet. Click <strong>⇄</strong> next to a ship in the list (or <strong>Compare</strong> on its detail panel), or add one above.</p>`}
      </section>
      ${cols.length ? chartsHtml(cols) + featuresHtml(cols) + loadoutHtml(cols) + guidesHtml(cols) + ttkHtml(cols) : ""}`;
  }

  // Slim bar above the list showing what's in compare, with a way to open it.
  function trayHtml() {
    if (!ids.length) return "";
    return `<span class="muted">Comparing</span>
      ${ids.map((id) => `<span class="tray-ship">${esc(shipById.get(id).name)}<button type="button" class="linklike" data-compare="${esc(id)}" aria-label="Remove ${esc(shipById.get(id).name)}">×</button></span>`).join("")}
      <button type="button" data-open-compare>Compare ${ids.length > 1 ? ids.length + " ships" : ""} →</button>
      <button type="button" class="ghost mini" data-compare-clear>Clear</button>`;
  }

  // Compare button for a ship's detail panel.
  function toggleHtml(id) {
    const on = ids.includes(id);
    const disabled = !on && Compare.full();
    return `<button type="button" class="cmp-toggle${on ? " on" : ""}" data-compare="${esc(id)}"${disabled ? ` disabled title="Compare holds up to ${MAX} ships"` : ""}>${on ? "✓ Comparing" : "⇄ Compare"}</button>`;
  }

  // ── Events (delegated, so re-rendering never loses them) ───────────────────
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.compare) Compare.toggle(t.dataset.compare);
    else if (t.dataset.baseline) Compare.setBaseline(t.dataset.baseline);
    else if (t.hasAttribute("data-compare-clear")) Compare.clear();
    else if (t.hasAttribute("data-upgrade-swap")) {
      const [from, to] = calcPair();
      Compare.setUpgrade(to.id, from.id);
    } else if (t.dataset.comparePair) {
      const add = t.dataset.comparePair.split(",").filter((id) => !ids.includes(id));
      Compare.setAll([...ids, ...add]);
    }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset?.upgradePick === "from") Compare.setUpgrade(t.value, null);
    if (t.dataset?.upgradePick === "to") Compare.setUpgrade(null, t.value);
    if (t.hasAttribute?.("data-compare-add") && !addByName(t.value)) t.value = "";
  });
  // Picking a suggestion from the datalist fires "input" without a typed character.
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.hasAttribute?.("data-compare-add") && (!e.inputType || e.inputType === "insertReplacementText")) addByName(t.value);
  });
  function addByName(value) {
    const s = byName.find((x) => x.name.toLowerCase() === value.trim().toLowerCase());
    if (!s || ids.includes(s.id)) return false;
    Compare.toggle(s.id);
    return true;
  }

  window.ShipCompare = { ...Compare, upgrade, upgradeSummary, render, trayHtml, toggleHtml };
})();
