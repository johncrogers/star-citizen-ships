// My fleet: which careers and roles my owned and wanted ships cover, and what it costs in USD to
// upgrade a pledged ship to each wanted ship.
(function () {
  const { esc, fmt, ships, shipById, Purchases, Wishlist } = window.Wishlist;
  const Compare = window.ShipCompare;

  const KEY = "sc-ships-wishlist:fleet";
  const opts = { base: null, concept: false, targets: "wanted" };
  try { Object.assign(opts, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(opts)); } catch (e) { /* storage unavailable */ } };
  const clip = (t, px) => { const n = Math.floor((px - 14) / 6.4); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
  const usd = (s) => (s && s.pledge && s.pledge.usd) || null;
  const CAREER_ORDER = ["Combat", "Transporter", "Industrial", "Exploration", "Support", "Multi-Role", "Competition", "Ground"];

  // "Heavy Fighter / Bomber" -> ["Heavy Fighter", "Bomber"]; "Starter / Light Freight" -> ["Light Freight"].
  const rolesOf = (s) => String(s.role || "").split("/").map((r) => r.trim()).filter((r) => r && r !== "—" && !/^starter$/i.test(r));

  // ── Coverage ───────────────────────────────────────────────────────────────
  function coverage() {
    const pool = ships.filter((s) => opts.concept || s.status !== "in-concept");
    const careers = new Map();
    for (const s of pool) {
      const c = s.career || "Other";
      if (!careers.has(c)) careers.set(c, new Map());
      for (const r of rolesOf(s)) {
        const m = careers.get(c);
        if (!m.has(r)) m.set(r, { role: r, ships: [], owned: [], wanted: [] });
        const cell = m.get(r);
        cell.ships.push(s);
        if (Purchases.isPurchased(s.id)) cell.owned.push(s);
        else if (Wishlist.isWanted(s.id)) cell.wanted.push(s);
      }
    }
    return [...careers]
      .sort(([a], [b]) => ((CAREER_ORDER.indexOf(a) + 1 || 99) - (CAREER_ORDER.indexOf(b) + 1 || 99)) || a.localeCompare(b))
      .map(([career, m]) => ({ career, cells: [...m.values()].sort((a, b) => b.ships.length - a.ships.length || a.role.localeCompare(b.role)) }));
  }

  function coverageCard() {
    const rows = coverage();
    const cells = rows.flatMap((r) => r.cells);
    const owned = cells.filter((c) => c.owned.length).length;
    const wanted = cells.filter((c) => !c.owned.length && c.wanted.length).length;
    const careersOwned = rows.filter((r) => r.cells.some((c) => c.owned.length)).length;
    const careersWanted = rows.filter((r) => r.cells.some((c) => c.owned.length || c.wanted.length)).length;
    const chip = (career, c) => {
      const st = c.owned.length ? "owned" : c.wanted.length ? "wanted" : "none";
      const names = (list) => list.map((s) => s.name).join(", ");
      const tip = `${career} · ${c.role}: ${c.ships.length} ship${c.ships.length > 1 ? "s" : ""}${c.owned.length ? `. Owned: ${names(c.owned)}` : ""}${c.wanted.length ? `. Wanted: ${names(c.wanted)}` : ""}`;
      const q = `career:"${career}" role:"${c.role}"`;
      return `<a class="fc-chip ${st}" href="?q=${encodeURIComponent(q)}" title="${esc(tip)}" data-fleet-query="${esc(q)}">${esc(c.role)} <span>${c.owned.length ? `${c.owned.length}✓` : c.wanted.length ? `${c.wanted.length}★` : c.ships.length}</span></a>`;
    };
    return `<div class="cmp-card">
      <h3>Fleet coverage</h3>
      <p class="muted">Every career and role in the game. Green: you own a ship for it. Blue: one's on your wishlist. Gray: neither (the number is how many ships fill it). Click a role to list its ships.</p>
      <div class="fc-tiles">
        <div class="tile"><span>Careers you own a ship in</span><strong>${careersOwned} of ${rows.length}</strong><small>${careersWanted} with your wishlist</small></div>
        <div class="tile"><span>Roles covered</span><strong>${owned} of ${cells.length}</strong><small>${owned + wanted} with your wishlist</small></div>
      </div>
      <div class="legend"><span><i class="fc-key owned"></i>Owned</span><span><i class="fc-key wanted"></i>Wanted</span><span><i class="fc-key none"></i>Neither</span>
        <label class="fc-check"><input type="checkbox" data-fleet="concept"${opts.concept ? " checked" : ""}> Include concept ships</label></div>
      <div class="fc-grid">${rows.map((r) => `<div class="fc-row"><div class="fc-career">${esc(r.career)}</div><div class="fc-cells">${r.cells.map((c) => chip(r.career, c)).join("")}</div></div>`).join("")}</div>
    </div>`;
  }

  // ── Upgrade ladder ─────────────────────────────────────────────────────────
  function ladderCard(width) {
    const pledged = ships.filter((s) => Purchases.isPledged(s.id) && usd(s));
    const onStore = ships.filter((s) => usd(s)).sort((a, b) => usd(a) - usd(b) || a.name.localeCompare(b.name));
    const base = shipById.get(opts.base) && usd(shipById.get(opts.base)) ? shipById.get(opts.base) : pledged[0] || null;
    const pool = opts.targets === "wanted" ? ships.filter((s) => Wishlist.isWanted(s.id) && !Purchases.isPurchased(s.id))
      : Compare.ids().map((id) => shipById.get(id)).filter(Boolean);
    const picker = `<label>From <select data-fleet="base">
        ${!base ? `<option value="" selected>Pick a ship…</option>` : ""}
        ${pledged.length ? `<optgroup label="My pledged ships">${pledged.map((s) => `<option value="${esc(s.id)}"${base && s.id === base.id ? " selected" : ""}>${esc(s.name)} · $${fmt(usd(s))}</option>`).join("")}</optgroup>` : ""}
        <optgroup label="Any ship on the store">${onStore.map((s) => `<option value="${esc(s.id)}"${base && s.id === base.id && !pledged.includes(s) ? " selected" : ""}>${esc(s.name)} · $${fmt(usd(s))}</option>`).join("")}</optgroup>
      </select></label>
      <label>To <select data-fleet="targets">
        <option value="wanted"${opts.targets === "wanted" ? " selected" : ""}>My wanted ships</option>
        <option value="compare"${opts.targets === "compare" ? " selected" : ""}>Ships in Compare</option>
      </select></label>`;
    const head = `<div class="cmp-card"><h3>Pledge upgrade ladder</h3>
      <p class="muted">What it costs in real money to upgrade a pledged ship to each ship you want: the difference in pledge store price (USD). Upgrades only go up in price.</p>
      <div class="vm-controls">${picker}</div>`;
    if (!base) return `${head}<p class="muted">${pledged.length ? "" : "You haven't marked any ship as pledged. Tick \"Pledged\" on a ship you own on the RSI store, or pick any ship above to see what upgrades from it would cost."}</p></div>`;

    const rows = pool.filter((s) => s.id !== base.id).map((s) => ({ s, up: Compare.upgrade(base, s) }));
    const ok = rows.filter((r) => r.up.ok).sort((a, b) => a.up.usd - b.up.usd);
    const bad = rows.filter((r) => !r.up.ok);
    const note = Purchases.isPledged(base.id) ? "" : `<p class="note">You haven't marked ${esc(base.name)} as pledged, so this shows what upgrades would cost if you had it on the store.</p>`;
    if (!ok.length) return `${head}${note}<p class="muted">None of these ships can be an upgrade from ${esc(base.name)} ($${fmt(usd(base))}).</p>${badList(bad)}</div>`;

    // Floating bars on a USD axis: from the base ship's price to each target's.
    const W = Math.max(320, width), rowH = 28, pad = { l: W < 560 ? 110 : 170, r: 76, t: 8, b: 30 };
    const H = pad.t + (ok.length + 1) * rowH + pad.b;
    const lo = 0, hi = Math.max(...ok.map((r) => usd(r.s))) * 1.05;
    const sx = (v) => pad.l + ((v - lo) / (hi - lo)) * (W - pad.l - pad.r);
    const step = [10, 25, 50, 100, 250, 500, 1000, 2500].find((k) => hi / k <= 8) || 5000;
    const ticks = [];
    for (let v = 0; v <= hi; v += step) ticks.push(v);
    const y0 = pad.t + rowH / 2;
    const baseRow = `<text class="vm-name" x="${pad.l - 10}" y="${y0 + 4}" text-anchor="end">${esc(clip(base.name, pad.l))}</text>
      <rect class="ul-base" x="${pad.l}" y="${y0 - 5}" width="${Math.max(2, sx(usd(base)) - pad.l)}" height="10" rx="4"/>
      <text class="vm-tick" x="${sx(usd(base)) + 8}" y="${y0 + 4}">$${fmt(usd(base))} ${Purchases.isPledged(base.id) ? "pledged" : ""}</text>`;
    let prev = usd(base);
    const bars = ok.map((r, i) => {
      const y = pad.t + (i + 1) * rowH + rowH / 2;
      const x0 = sx(usd(base)), x1 = sx(usd(r.s));
      const stepCost = usd(r.s) - prev;
      prev = usd(r.s);
      const tip = `${base.name} → ${r.s.name}: $${fmt(r.up.usd)} (${r.s.name} is $${fmt(usd(r.s))}). From the ship below it: +$${fmt(stepCost)}.${r.up.issues.filter((x) => x.level === "info").map((x) => " " + x.text).join("")}`;
      return `<a href="#${esc(r.s.id)}" class="ul-row" data-tip="${esc(tip)}">
        <rect class="vm-hit" x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}" fill="transparent"/>
        <text class="vm-name" x="${pad.l - 10}" y="${y + 4}" text-anchor="end">${esc(clip(r.s.name, pad.l))}</text>
        <line class="ul-guide" x1="${pad.l}" x2="${x0}" y1="${y}" y2="${y}"/>
        <rect class="ul-bar" x="${x0}" y="${y - 5}" width="${Math.max(2, x1 - x0)}" height="10" rx="4"/>
        <text class="ul-val" x="${x1 + 8}" y="${y + 4}">+$${fmt(r.up.usd)}${r.up.issues.some((x) => x.level === "info" && /ground|concept/i.test(x.text)) ? " *" : ""}</text></a>`;
    }).join("");
    const grid = ticks.map((v) => `<line class="vm-grid" x1="${sx(v)}" x2="${sx(v)}" y1="${pad.t}" y2="${H - pad.b}"/><text class="vm-tick" x="${sx(v)}" y="${H - pad.b + 16}" text-anchor="middle">$${fmt(v)}</text>`).join("");
    const svg = `<svg class="vm-svg ul-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Upgrade costs from ${esc(base.name)}">${grid}${baseRow}${bars}</svg>`;

    // The same ships as a step-by-step path: upgrade to each in turn, cheapest first.
    let total = 0, last = usd(base);
    const steps = ok.map((r) => {
      const add = usd(r.s) - last;
      last = usd(r.s);
      total += add;
      return `<tr><td><a href="#${esc(r.s.id)}">${esc(r.s.name)}</a></td><td class="num">$${fmt(usd(r.s))}</td><td class="num">+$${fmt(add)}</td><td class="num">$${fmt(total)}</td></tr>`;
    }).join("");
    return `${head}${note}
      <div class="ul-plot">${svg}</div>
      <div class="vm-tip" role="tooltip" hidden></div>
      <p class="note">Gray: what you've already paid for ${esc(base.name)}. Blue: the extra to upgrade to each ship. Hover for details, click to open the ship.${ok.some((r) => r.up.issues.some((x) => /ground|concept/i.test(x.text))) ? " * goes between a ground vehicle and a ship, or to a concept ship: check the RSI upgrade store." : ""} Warbond and sale upgrades can cost less.</p>
      <h3>Step by step</h3>
      <p class="muted">If you upgrade through each ship in turn, cheapest first, each step costs the difference from the one before. The running total is the same as upgrading straight to that ship.</p>
      <div class="cmp-scroll"><table><thead><tr><th>Upgrade to</th><th class="num">Store price</th><th class="num">This step</th><th class="num">Total so far</th></tr></thead><tbody>
        <tr class="muted"><td>${esc(base.name)} (start)</td><td class="num">$${fmt(usd(base))}</td><td class="num">—</td><td class="num">$0</td></tr>${steps}</tbody></table></div>
      ${badList(bad)}
    </div>`;
  }

  function badList(bad) {
    if (!bad.length) return "";
    return `<h3>Can't upgrade to</h3><ul class="plain">${bad.map((r) => `<li><a href="#${esc(r.s.id)}">${esc(r.s.name)}</a>: <span class="muted">${esc((r.up.issues.find((x) => x.level === "warn") || {}).text || "no store price")}</span></li>`).join("")}</ul>`;
  }

  function render(el) {
    el.innerHTML = coverageCard() + ladderCard((el.clientWidth || 1000) - 42);
  }

  function bind(el, rerender, openQuery) {
    el.addEventListener("change", (e) => {
      const k = e.target.dataset.fleet;
      if (!k) return;
      if (k === "concept") opts.concept = e.target.checked;
      else opts[k] = e.target.value;
      save();
      rerender();
    });
    el.addEventListener("click", (e) => {
      const a = e.target.closest("[data-fleet-query]");
      if (!a) return;
      e.preventDefault();
      openQuery(a.dataset.fleetQuery);
    });
    const show = (e) => {
      const tip = el.querySelector(".vm-tip");
      if (!tip) return;
      const row = e.target.closest && e.target.closest(".ul-row");
      if (!row) { tip.hidden = true; return; }
      const card = tip.closest(".cmp-card").getBoundingClientRect();
      const r = row.querySelector(".ul-bar").getBoundingClientRect();
      tip.textContent = row.dataset.tip;
      tip.hidden = false;
      tip.style.left = `${Math.max(8, Math.min(r.right - card.left - tip.offsetWidth / 2, card.width - tip.offsetWidth - 8))}px`;
      tip.style.top = `${r.top - card.top - tip.offsetHeight - 6}px`;
    };
    el.addEventListener("mouseover", show);
    el.addEventListener("focusin", show);
    el.addEventListener("mouseleave", () => { const t = el.querySelector(".vm-tip"); if (t) t.hidden = true; });
  }

  window.Fleet = { render, bind };
})();
