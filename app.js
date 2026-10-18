// Ships wishlist viewer. Ship records come from common.js (catalog.data.js merged with ships.data.js).
(function () {
  const {
    esc, fmt, ships, availability, availabilityLabel, bestPrice,
    Purchases, Wishlist, onChange, renderPendingBanner, purchaseToggle, wishlistControl, thingsToKnow, tagClass,
  } = window.Wishlist;
  const Filters = window.ShipFilters;
  const Compare = window.ShipCompare;
  // "New Deal — Teasa Spaceport, Lorville, Hurston (Stanton)" -> search the locations app for it.
  const locationsHref = ((window.SITE || {}).links || []).find((l) => l.id === "locations")?.href;
  const componentsHref = ((window.SITE || {}).links || []).find((l) => l.id === "components")?.href;
  const shopLink = (label) => {
    if (!locationsHref) return esc(label);
    const [shop, rest = ""] = label.split(" — ");
    const place = rest.replace(/\s*\([^)]*\)\s*$/, "").split(",")[0].trim();
    const q = [shop, place].filter(Boolean).map((x) => `"${x}"`).join(" ");
    return `<a href="${esc(locationsHref)}?q=${encodeURIComponent(q)}" title="Where it is and how to get there">${esc(label)}</a>`;
  };
  const catalogMeta = window.SHIP_CATALOG_META || {};
  const meta = window.SHIPS_META || {};

  const SCOPE_KEY = "sc-ships-wishlist:scope";
  let savedScope = "wishlist";
  try { savedScope = localStorage.getItem(SCOPE_KEY) || "wishlist"; } catch (e) { /* storage unavailable */ }
  const state = { scope: savedScope, query: "", category: "", availability: "", owned: "", sort: "list", selected: null };

  const $ = (id) => document.getElementById(id);

  // Search text doesn't depend on user state, so build it once.
  const haystacks = new Map(
    ships.map((s) => [
      s.id,
      [
        s.name, s.manufacturer, s.career, s.role, s.size, s.description, s.notes,
        s.acquisition.method, s.acquisition.notes,
        ...(s.thingsToKnow || []).map((t) => t.text),
        ...s.acquisition.buy.map((b) => b.location),
        ...s.acquisition.rent.map((r) => r.location),
      ].join(" ").toLowerCase(),
    ])
  );

  // In the wishlist, ships are grouped by my wishlist group; in "All ships", by the game's career.
  const categoryOf = (s) => (state.scope === "wishlist" ? Wishlist.group(s.id) : s.career);
  const categories = () => {
    if (state.scope === "wishlist") return Wishlist.groups();
    const counts = {};
    ships.forEach((s) => (counts[s.career] = (counts[s.career] || 0) + 1));
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  };
  const inScope = () => (state.scope === "wishlist" ? ships.filter((s) => Wishlist.isWanted(s.id)) : ships);

  const ownedMatches = (s) => {
    if (!state.owned) return true;
    if (state.owned === "wanted") return !Purchases.isPurchased(s.id);
    if (state.owned === "pledged") return Purchases.isPledged(s.id);
    if (state.owned === "bought") return Purchases.isBought(s.id);
    return Purchases.isPurchased(s.id);
  };

  function filtered() {
    const terms = Filters.parse(state.query);
    const out = inScope().filter(
      (s) =>
        (!state.category || categoryOf(s) === state.category) &&
        (!state.availability || availability(s) === state.availability) &&
        ownedMatches(s) &&
        Filters.matches(terms, s, haystacks.get(s.id))
    );
    const priceKey = (s, dir) => bestPrice(s) ?? (dir > 0 ? Infinity : -Infinity);
    if (state.sort === "list" && state.scope === "wishlist") {
      // Group order, then the order ships were added within the group.
      const groups = Wishlist.groups();
      const ids = Object.keys(Wishlist.all());
      out.sort((a, b) => groups.indexOf(Wishlist.group(a.id)) - groups.indexOf(Wishlist.group(b.id)) || ids.indexOf(a.id) - ids.indexOf(b.id));
    }
    if (state.sort === "price-asc") out.sort((a, b) => priceKey(a, 1) - priceKey(b, 1));
    if (state.sort === "price-desc") out.sort((a, b) => priceKey(b, -1) - priceKey(a, -1));
    if (state.sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort.startsWith("stat:")) {
      // Highest first; ships with no data for the stat go last.
      const field = Filters.numField(state.sort.slice(5));
      const val = (s) => {
        const v = field.get(s);
        return v == null ? -Infinity : Array.isArray(v) ? v[1] : v;
      };
      out.sort((a, b) => val(b) - val(a) || a.name.localeCompare(b.name));
    }
    if (state.sort === "manufacturer") out.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name));
    return out;
  }

  function renderScope() {
    const wanted = ships.filter((s) => Wishlist.isWanted(s.id)).length;
    $("scope").innerHTML = [
      ["wishlist", "My wishlist", wanted],
      ["all", "All ships", ships.length],
      ["compare", "Compare &amp; upgrade", Compare.ids().length],
    ]
      .map(([k, label, n]) => `<button class="tab${state.scope === k ? " on" : ""}" data-scope="${k}">${label} <span>${n}</span></button>`)
      .join("");
  }

  function renderChips() {
    const pool = inScope();
    const cats = categories();
    if (state.category && !cats.includes(state.category)) state.category = "";
    $("categoryChips").innerHTML = ["", ...cats]
      .map((c) => {
        const count = c ? pool.filter((s) => categoryOf(s) === c).length : pool.length;
        return `<button class="chip${state.category === c ? " on" : ""}" data-cat="${esc(c)}">${esc(c || "All")} <span>${count}</span></button>`;
      })
      .join("");
  }

  function renderList() {
    const items = filtered();
    if (state.selected && !items.some((s) => s.id === state.selected)) state.selected = null;
    if (!state.selected && items.length) state.selected = items[0].id;

    // Show the numbers being filtered or sorted on, so rows are easy to compare.
    const shownKeys = Filters.numericKeys(Filters.parse(state.query));
    if (state.sort.startsWith("stat:") && !shownKeys.includes(state.sort.slice(5))) shownKeys.push(state.sort.slice(5));
    const shownFields = shownKeys.filter((k) => k !== "price").map(Filters.numField);
    const statLine = (s) => {
      const parts = shownFields.map((f) => Filters.formatValue(f, s) || `${f.label} ?`);
      return parts.length ? `<span class="row-stats">${parts.map(esc).join(" · ")}</span>` : "";
    };

    // Rendering ~300 rows is fast, but cap it so typing stays snappy on slow machines.
    const LIMIT = 400;
    $("list").innerHTML = items.length
      ? items
          .slice(0, LIMIT)
          .map((s) => {
            const a = availability(s);
            const price = bestPrice(s);
            const owned = Purchases.isPurchased(s.id);
            const pledged = Purchases.isPledged(s.id);
            const bought = Purchases.isBought(s.id);
            const wanted = Wishlist.isWanted(s.id);
            const comparing = Compare.has(s.id);
            const cat = categoryOf(s);
            return `<li class="row${s.id === state.selected ? " active" : ""}${owned ? " owned" : ""}">
              <span class="row-controls">
                <span class="ctl-stack">
                  <button type="button" class="star${wanted ? " on" : ""}" data-wish="${esc(s.id)}" title="${wanted ? "Remove from" : "Add to"} wishlist" aria-label="${wanted ? "Remove" : "Add"} ${esc(s.name)} ${wanted ? "from" : "to"} wishlist">${wanted ? "★" : "☆"}</button>
                  <button type="button" class="cmp-mini${comparing ? " on" : ""}" data-compare="${esc(s.id)}"${!comparing && Compare.full() ? " disabled" : ""} title="${comparing ? "Remove from compare" : Compare.full() ? `Compare holds up to ${Compare.MAX} ships` : "Add to compare"}" aria-label="${comparing ? "Remove" : "Add"} ${esc(s.name)} ${comparing ? "from" : "to"} compare">⇄</button>
                </span>
                <span class="ctl-stack">
                  <label class="own-mini" title="Bought in-game with aUEC"><input type="checkbox" data-purchase="${esc(s.id)}" data-how="aUEC"${bought ? " checked" : ""} aria-label="Bought ${esc(s.name)} in-game">UEC</label>
                  <label class="own-mini pledge" title="Pledged with real money"><input type="checkbox" data-purchase="${esc(s.id)}" data-how="pledge"${pledged ? " checked" : ""} aria-label="Pledged ${esc(s.name)}">$</label>
                </span>
              </span>
              <a href="#${esc(s.id)}" class="row-link">
                <div class="row-main">
                  <strong>${esc(s.name)}</strong>
                  <span class="sub">${esc(s.manufacturer)} · ${esc(s.role)}</span>
                  ${statLine(s)}
                </div>
                <div class="row-side">
                  <span class="${tagClass(cat)}">${esc(cat)}</span>
                  <span class="price ${a}">${price != null ? fmt(price) + " aUEC" : availabilityLabel[a]}</span>
                </div>
              </a>
            </li>`;
          })
          .join("") + (items.length > LIMIT ? `<li class="empty">${items.length - LIMIT} more. Narrow the search to see them.</li>` : "")
      : `<li class="empty">${state.scope === "wishlist" && !state.query ? "Nothing here yet. Switch to All ships and tap ☆ to add some." : "No ships match."}</li>`;

    const pool = inScope();
    const purchasedCount = pool.filter((s) => Purchases.isPurchased(s.id)).length;
    const buyable = items.filter((s) => !Purchases.isPurchased(s.id) && bestPrice(s) != null);
    const total = buyable.reduce((sum, s) => sum + bestPrice(s), 0);
    $("total").innerHTML = `
      <span>${purchasedCount} / ${pool.length} owned · ${buyable.length} shown still to buy in-game for</span>
      <strong>${fmt(total)} aUEC</strong>`;
  }

  function statRow(label, value, unit) {
    if (value == null || value === "") return "";
    const v = typeof value === "number" ? fmt(value) : esc(value);
    return `<div class="stat"><dt>${esc(label)}</dt><dd>${v}${unit ? ` <small>${unit}</small>` : ""}</dd></div>`;
  }

  function renderDetail() {
    const s = ships.find((x) => x.id === state.selected);
    if (!s) {
      $("detail").innerHTML = `<p class="empty">Select a ship.</p>`;
      return;
    }
    const a = availability(s);
    const st = s.stats || {};
    const acq = s.acquisition;
    const best = bestPrice(s);

    const buyRows = acq.buy
      .slice()
      .sort((x, y) => x.price - y.price)
      .map((b) => `<tr${b.price === best ? ' class="best"' : ""}><td>${shopLink(b.location)}</td><td class="num">${fmt(b.price)}</td></tr>`)
      .join("");
    const rentRows = acq.rent
      .slice()
      .sort((x, y) => x.pricePerDay - y.pricePerDay)
      .map((r) => `<tr><td>${shopLink(r.location)}</td><td class="num">${fmt(r.pricePerDay)} / day</td></tr>`)
      .join("");

    const links = [
      `<a href="ship.html#${esc(s.id)}" class="guide-link">${s.curated ? "Ship guide &amp; cheatsheet" : "Controls cheatsheet"} →</a>`,
      componentsHref && s.className && s.status !== "in-concept" && `<a href="${esc(componentsHref)}#plan=${encodeURIComponent(s.id)}" title="Swap weapons and components, and see what it costs">Plan loadout →</a>`,
      s.links.cstone && `<a href="${esc(s.links.cstone)}" target="_blank" rel="noopener">cstone ↗</a>`,
      s.links.wiki && `<a href="${esc(s.links.wiki)}" target="_blank" rel="noopener">Wiki ↗</a>`,
      s.pledge.url && `<a href="${esc(s.pledge.url)}" target="_blank" rel="noopener">RSI pledge ↗</a>`,
    ].filter(Boolean).join("");

    const pledge = s.pledge.usd ? `$${fmt(s.pledge.usd)} USD${s.pledge.loaner ? ` · loaner: ${esc(s.pledge.loaner)}` : ""}` : "Not sold on the pledge store";
    const badgeCat = Wishlist.isWanted(s.id) ? Wishlist.group(s.id) : s.career;

    $("detail").innerHTML = `
      <div class="hero">
        ${s.image
          ? `<img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'noimg',textContent:'No image'}))">`
          : `<div class="noimg">No image yet</div>`}
      </div>
      <div class="detail-head">
        <div>
          <h2>${esc(s.name)}</h2>
          <p class="sub">${esc(s.manufacturer)} · ${esc(s.role)} · ${esc(s.size)}${s.career && s.career !== badgeCat ? ` · ${esc(s.career)}` : ""}</p>
        </div>
        <div class="badges">
          <span class="${tagClass(badgeCat)}">${esc(badgeCat)}</span>
          <span class="tag status-${esc(s.status)}">${esc(s.status)}</span>
        </div>
      </div>
      <div class="toggles">${wishlistControl(s)}${purchaseToggle(s.id)}${Compare.toggleHtml(s.id)}</div>
      <p>${esc(s.description)}</p>
      <nav class="links">${links}</nav>

      ${thingsToKnow(s)}

      <h3>How to get it</h3>
      <dl class="kv">
        <div><dt>Method</dt><dd><span class="price ${a}">${esc(acq.method)}</span></dd></div>
        ${acq.requirements ? `<div><dt>Requirements</dt><dd>${esc(acq.requirements)}</dd></div>` : ""}
        <div><dt>Pledge</dt><dd>${pledge}</dd></div>
      </dl>
      ${Compare.upgradeSummary(s)}
      ${buyRows ? `<table><thead><tr><th>Buy location</th><th class="num">aUEC</th></tr></thead><tbody>${buyRows}</tbody></table>` : ""}
      ${rentRows ? `<table><thead><tr><th>Rental location</th><th class="num">aUEC</th></tr></thead><tbody>${rentRows}</tbody></table>` : ""}
      ${acq.notes ? `<p class="note">${esc(acq.notes)}</p>` : ""}

      <h3>Key stats</h3>
      <dl class="stats">
        ${statRow("Crew", st.crew)}
        ${statRow("Cargo", st.cargoScu, "SCU")}
        ${statRow("Length", st.lengthM, "m")}
        ${statRow("SCM speed", st.scm, "m/s")}
        ${statRow("Max speed", st.maxSpeed, "m/s")}
        ${statRow("Shield HP", st.shieldHp)}
        ${statRow("Hull HP", st.hullHp)}
        ${statRow("Pilot DPS", st.pilotDps)}
        ${statRow("Medical", st.medical)}
        ${statRow("Mining hold", st.oreScu, "SCU")}
        ${statRow("Turret DPS", st.turretDps)}
        ${statRow("Turrets", st.mannedTurrets || st.remoteTurrets ? `${st.mannedTurrets || 0} manned · ${st.remoteTurrets || 0} remote` : null)}
        ${statRow("Quantum range", st.qtRangeGm, "Gm")}
        ${statRow("Claim time", st.claimMin, "min")}
        ${statRow("Width × height", st.beamM && st.heightM ? `${fmt(st.beamM)} × ${fmt(st.heightM)}` : null, "m")}
        ${statRow("Mass", st.massT, "t")}
        ${statRow("EM / IR signature", st.emSig && st.irSig ? `${fmt(st.emSig)} / ${fmt(st.irSig)}` : null)}
      </dl>

      <h3>My notes</h3>
      <p class="${s.notes ? "" : "muted"}">${s.notes ? esc(s.notes) : window.Wishlist.published ? "No notes yet." : "No notes yet. Add a record for this ship in ships.data.js."}</p>
    `;
  }

  const PANEL_KEY = "sc-ships-wishlist:filters-open";
  let panelOpen = false;
  try { panelOpen = localStorage.getItem(PANEL_KEY) === "1"; } catch (e) { /* storage unavailable */ }

  function renderFilters() {
    const panel = $("filterPanel");
    const terms = Filters.parse(state.query);
    const structured = terms.filter((t) => t.kind !== "free").length;
    $("filtersToggle").innerHTML = `Filters${structured ? ` <span class="count">${structured}</span>` : ""}`;
    $("filtersToggle").setAttribute("aria-expanded", String(panelOpen));
    $("filtersToggle").classList.toggle("on", panelOpen);
    panel.hidden = !panelOpen;
    // Don't redraw the panel under the user's cursor; its controls already show what they typed.
    if (panelOpen && !panel.contains(document.activeElement)) Filters.renderPanel(panel, ships, state.query);

    $("activeFilters").innerHTML = terms.length
      ? terms
          .map((t) => `<button type="button" class="filter-chip${t.kind === "free" ? " free" : ""}${t.neg ? " neg" : ""}" data-remove-term="${esc(t.raw)}" title="Remove">${esc(Filters.termLabel(t))} <span aria-hidden="true">×</span></button>`)
          .join("") + (terms.length > 1 ? `<button type="button" class="filter-chip clear" data-clear-filters>Clear all</button>` : "")
      : "";
  }

  function setQuery(q) {
    state.query = q;
    $("search").value = q;
    render();
    saveQueryToUrl();
  }

  // Keep the search in the address bar (index.html?q=...) so filtered views can be bookmarked.
  function saveQueryToUrl() {
    const url = new URL(location.href);
    if (state.query.trim()) url.searchParams.set("q", state.query.trim());
    else url.searchParams.delete("q");
    try { history.replaceState(null, "", url); } catch (e) { /* some browsers block this on file:// */ }
  }

  const comparing = () => state.scope === "compare";

  // In the Compare tab the address bar holds the ships (#compare=a,b), so the view can be bookmarked.
  function syncCompareHash() {
    const hash = comparing() ? `#compare=${Compare.ids().join(",")}` : state.selected ? `#${state.selected}` : "";
    if (location.hash === hash) return;
    try { history.replaceState(null, "", hash || location.pathname + location.search); } catch (e) { /* blocked on some file:// pages */ }
  }

  let shownDetail = null;
  function render() {
    document.body.classList.toggle("compare-mode", comparing());
    renderScope();
    $("compareTray").innerHTML = comparing() ? "" : Compare.trayHtml();
    renderPendingBanner($("pending"));
    if (comparing()) {
      Compare.render($("compareView"));
      syncCompareHash();
      return;
    }
    renderFilters();
    renderChips();
    renderList();
    renderDetail();
    if (state.selected !== shownDetail) {
      $("detail").scrollTop = 0;
      shownDetail = state.selected;
    }
  }

  function setScope(scope) {
    state.scope = scope;
    state.category = "";
    try { localStorage.setItem(SCOPE_KEY, scope); } catch (e) { /* storage unavailable */ }
  }

  function selectFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id.startsWith("compare")) {
      const list = id.replace(/^compare=?/, "").split(",").filter(Boolean);
      if (list.length) Compare.setAll(list);
      setScope("compare");
      return;
    }
    if (!id || !ships.some((s) => s.id === id)) return;
    state.selected = id;
    // Opening a ship from the Compare tab goes back to the list.
    if (comparing()) setScope(Wishlist.isWanted(id) ? "wishlist" : "all");
    // Linking to a ship that isn't on the wishlist: show it in "All ships" with filters cleared.
    if (state.scope === "wishlist" && !Wishlist.isWanted(id)) setScope("all");
    if (!filtered().some((s) => s.id === id)) {
      state.query = $("search").value = "";
      state.category = state.availability = state.owned = "";
      $("availability").value = $("owned").value = "";
    }
  }

  const gathered = catalogMeta.gathered || meta.gathered || "?";
  $("meta").textContent = `${ships.length} vehicles · data for patch ${catalogMeta.patch || meta.patch || "?"} · gathered ${gathered} · prices are crowdsourced, so check cstone before buying`;
  $("search").addEventListener("input", (e) => { state.query = e.target.value; render(); saveQueryToUrl(); });
  $("siteLinks").innerHTML = ((window.SITE || {}).links || [])
    .map((l) => `<a href="${esc(l.href)}">${esc(l.label)} →</a>`)
    .join("");
  $("filtersToggle").addEventListener("click", () => {
    panelOpen = !panelOpen;
    try { localStorage.setItem(PANEL_KEY, panelOpen ? "1" : "0"); } catch (e) { /* storage unavailable */ }
    render();
  });
  Filters.bindPanel($("filterPanel"), () => state.query, setQuery);
  $("activeFilters").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.hasAttribute("data-clear-filters")) setQuery("");
    else if (btn.dataset.removeTerm != null) setQuery(Filters.removeTerm(state.query, btn.dataset.removeTerm));
  });
  $("availability").addEventListener("change", (e) => { state.availability = e.target.value; render(); });
  $("owned").addEventListener("change", (e) => { state.owned = e.target.value; render(); });
  $("sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("scope").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-scope]");
    if (!btn) return;
    setScope(btn.dataset.scope);
    render();
    syncCompareHash();
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-open-compare], button[data-upgrade-to]");
    if (!btn) return;
    if (btn.dataset.upgradeTo) Compare.setUpgrade(null, btn.dataset.upgradeTo);
    setScope("compare");
    render();
    window.scrollTo(0, 0);
  });
  Compare.onChange(render);
  $("categoryChips").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    state.category = btn.dataset.cat;
    render();
  });
  const scrollToSelected = () => {
    const row = document.querySelector(".row.active");
    if (row) row.scrollIntoView({ block: "nearest" });
  };
  window.addEventListener("hashchange", () => { selectFromHash(); render(); scrollToSelected(); });
  onChange(render);

  const initialQuery = new URLSearchParams(location.search).get("q");
  if (initialQuery) state.query = $("search").value = initialQuery;
  selectFromHash();
  render();
  if (location.hash) scrollToSelected();
})();
