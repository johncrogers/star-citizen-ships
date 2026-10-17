// Ship guide page: ship.html#<ship id>. Ship facts come from common.js (catalog + ships.data.js),
// and the guide content from guides/<ship id>.js (loaded on demand with a <script> tag so it works
// from file://). Ships without a guide still get the general controls cheatsheet.
(function () {
  const { esc, ships: allShips, Wishlist, onChange, renderPendingBanner, purchaseToggle, wishlistControl, thingsToKnow } = window.Wishlist;
  const common = window.SHIP_GUIDE_COMMON;
  const $ = (id) => document.getElementById(id);
  window.SHIP_GUIDES = window.SHIP_GUIDES || {};

  const wanted = () => {
    const groups = Wishlist.groups();
    return allShips
      .filter((s) => Wishlist.isWanted(s.id))
      .sort((a, b) => groups.indexOf(Wishlist.group(a.id)) - groups.indexOf(Wishlist.group(b.id)));
  };
  const currentId = () => decodeURIComponent(location.hash.slice(1)) || (wanted()[0] || allShips[0] || {}).id;

  function loadGuide(id) {
    return new Promise((resolve) => {
      if (window.SHIP_GUIDES[id]) return resolve(window.SHIP_GUIDES[id]);
      const el = document.createElement("script");
      el.src = `guides/${encodeURIComponent(id)}.js`;
      el.onload = () => resolve(window.SHIP_GUIDES[id] || null);
      el.onerror = () => resolve(null);
      document.head.appendChild(el);
    });
  }

  const keyTable = (rows, cols) =>
    rows.length
      ? `<table class="cheatsheet"><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr><td>${esc(r[0])}</td><td><kbd>${esc(r[1])}</kbd></td>${cols.length > 2 ? `<td class="muted">${esc(r[2] || "")}</td>` : ""}</tr>`)
          .join("")}</tbody></table>`
      : "";

  function renderFeature(f) {
    return `<section class="feature">
      <h4>${esc(f.name)}</h4>
      <p>${esc(f.what)}</p>
      ${f.steps && f.steps.length ? `<ol>${f.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}
      ${f.keys && f.keys.length ? `<div class="keys">${f.keys.map(([a, k]) => `<span><kbd>${esc(k)}</kbd> ${esc(a)}</span>`).join("")}</div>` : ""}
    </section>`;
  }

  // Prev/next walk the wishlist when this ship is on it, otherwise every ship.
  function renderPager(id) {
    const ships = Wishlist.isWanted(id) ? wanted() : allShips;
    const i = ships.findIndex((s) => s.id === id);
    const prev = ships[(i - 1 + ships.length) % ships.length];
    const next = ships[(i + 1) % ships.length];
    Object.assign($("prev"), { href: `#${prev.id}`, textContent: `‹ ${prev.name}` });
    Object.assign($("next"), { href: `#${next.id}`, textContent: `${next.name} ›` });
    $("back").href = `index.html#${id}`;
  }

  async function render() {
    const id = currentId();
    const ship = allShips.find((s) => s.id === id);
    renderPendingBanner($("pending"));
    if (!ship) {
      $("guide").innerHTML = `<p class="empty">Unknown ship "${esc(id)}". <a href="index.html">Back to the wishlist</a>.</p>`;
      return;
    }
    document.title = `${ship.name} · Ship Guide`;
    renderPager(id);
    const guide = await loadGuide(id);
    if (currentId() !== id) return; // user navigated while loading

    const commonSections = common
      ? common.sections
          .map((sec) => `<details class="common-sec"><summary>${esc(sec.title)}</summary>${keyTable(sec.rows, ["Action", "Key", "Notes"])}</details>`)
          .join("")
      : "";

    $("guide").innerHTML = `
      <div class="guide-hero">
        ${ship.image ? `<img src="${esc(ship.image)}" alt="${esc(ship.name)}">` : `<div class="noimg">No image yet</div>`}
        <div class="guide-title">
          <h1>${esc(ship.name)}</h1>
          <p class="sub">${esc(ship.manufacturer)} · ${esc(ship.role)} · <span class="tag status-${esc(ship.status)}">${esc(ship.status)}</span></p>
        </div>
      </div>
      <div class="toggles">${wishlistControl(ship)}${purchaseToggle(ship.id)}</div>
      ${guide ? `<p class="lead">${esc(guide.summary)}</p>` : ""}

      ${thingsToKnow(ship)}

      ${guide
        ? `<h3>Features</h3>
           <div class="features">${guide.features.map(renderFeature).join("")}</div>
           ${guide.cheatsheet && guide.cheatsheet.length ? `<h3>${esc(ship.name)} cheatsheet</h3>${keyTable(guide.cheatsheet, ["Action", "Key", "Notes"])}` : ""}`
        : `<p class="muted">${esc(ship.description)}</p>
           <p class="muted small">No ship-specific guide yet.${window.Wishlist.published ? "" : ` Create <code>guides/${esc(id)}.js</code> (copy another guide as a template).`}</p>`}

      ${commonSections
        ? `<h3>General controls</h3>
           <p class="muted small">Keyboard/mouse defaults for patch ${esc(common.patch)}. Bindings move between patches, so in-game Options → Keybindings is the authority.
           <a href="${esc(common.source)}" target="_blank" rel="noopener">Source ↗</a></p>
           ${commonSections}`
        : ""}

      ${guide && guide.sources && guide.sources.length
        ? `<h3>Sources</h3><ul class="sources">${guide.sources.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></li>`).join("")}</ul>`
        : ""}
    `;
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);
  // Only refresh the toggles, pager and banner so open <details> and scroll position survive.
  onChange(() => {
    const toggles = document.querySelector(".toggles");
    const ship = allShips.find((s) => s.id === currentId());
    if (toggles && ship) toggles.innerHTML = wishlistControl(ship) + purchaseToggle(ship.id);
    if (ship) renderPager(ship.id);
    renderPendingBanner($("pending"));
  });
  render();
})();
