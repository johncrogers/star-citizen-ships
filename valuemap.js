// Value map: every ship as a dot, price across and one capability up. Ships on the "best value"
// line give more of that capability than anything cheaper. Wanted and owned ships are colored.
(function () {
  const { esc, fmt, ships, bestPrice, Purchases, Wishlist } = window.Wishlist;

  // Capabilities to plot. `log` starts the axis in log scale (values span several orders).
  const METRICS = [
    ["cargoScu", "Cargo", "SCU", true],
    ["pilotDps", "Pilot DPS", "", false],
    ["turretDps", "Turret DPS", "", false],
    ["shieldHp", "Shield HP", "", true],
    ["hullHp", "Hull HP", "", true],
    ["missileDamage", "Missile damage", "", true],
    ["qtRangeGm", "Quantum range", "Gm", false],
    ["qtSpeedMms", "Quantum speed", "Mm/s", false],
    ["scm", "SCM speed", "m/s", false],
    ["boostSpeed", "Boost speed", "m/s", false],
    ["storageScu", "Personal storage", "SCU", false],
    ["beds", "Beds", "", false],
  ].map(([key, label, unit, log]) => ({ key, label, unit, log }));
  const PRICES = {
    auec: { label: "In-game price", unit: "aUEC", get: (s) => bestPrice(s) },
    usd: { label: "Pledge price", unit: "USD", get: (s) => (s.pledge && s.pledge.usd) || null },
  };

  const KEY = "sc-ships-wishlist:value-map";
  let opts = { metric: "cargoScu", price: "auec", career: "", ground: false, logY: null };
  try { opts = { ...opts, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(opts)); } catch (e) { /* storage unavailable */ } };
  const metric = () => METRICS.find((m) => m.key === opts.metric) || METRICS[0];
  const logY = () => (opts.logY == null ? metric().log : opts.logY);

  // "Pilot DPS" -> "pilot DPS": lowercase only the first letter, so acronyms survive.
  const lower = (t) => t.replace(/^./, (c) => c.toLowerCase());
  const status = (s) => (Purchases.isPurchased(s.id) ? "owned" : Wishlist.isWanted(s.id) ? "wanted" : "other");
  const short = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : `${+n.toFixed(n < 10 ? 1 : 0)}`);
  const money = (n) => (opts.price === "usd" ? `$${fmt(n)}` : `${fmt(n)} aUEC`);

  function points() {
    const m = metric(), p = PRICES[opts.price];
    return ships
      .filter((s) => (opts.ground || s.type !== "ground") && (!opts.career || s.career === opts.career))
      .map((s) => ({ s, x: p.get(s), y: s.stats[m.key], st: status(s) }))
      .filter((d) => d.x > 0 && typeof d.y === "number" && d.y > 0);
  }

  // Best value: sorted by price, each ship that beats everything cheaper.
  function frontier(pts) {
    const out = [];
    let best = -Infinity;
    for (const d of [...pts].sort((a, b) => a.x - b.x || b.y - a.y)) {
      if (d.y > best) { out.push(d); best = d.y; }
    }
    return out;
  }

  // Log ticks at 1, 2, 5 per decade; linear ticks at round steps.
  function logTicks(lo, hi) {
    const out = [];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++)
      for (const m of [1, 2, 5]) { const v = m * 10 ** e; if (v >= lo && v <= hi) out.push(v); }
    return out.length > 9 ? out.filter((v) => /^1/.test(String(v))) : out;
  }
  function linTicks(lo, hi) {
    const raw = (hi - lo) / 5;
    const mag = 10 ** Math.floor(Math.log10(raw || 1));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => raw <= k);
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
    return out;
  }

  function plot(pts, front, width) {
    const W = Math.max(320, width), H = W < 600 ? 340 : 440;
    const pad = { l: 56, r: 16, t: 12, b: 40 };
    const xs = pts.map((d) => d.x), ys = pts.map((d) => d.y);
    const x0 = Math.min(...xs) / 1.3, x1 = Math.max(...xs) * 1.3;
    const ly = logY();
    const y0 = ly ? Math.min(...ys) / 1.4 : 0, y1 = ly ? Math.max(...ys) * 1.4 : Math.max(...ys) * 1.06;
    const sx = (v) => pad.l + ((Math.log10(v) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0))) * (W - pad.l - pad.r);
    const sy = ly
      ? (v) => H - pad.b - ((Math.log10(v) - Math.log10(y0)) / (Math.log10(y1) - Math.log10(y0))) * (H - pad.t - pad.b)
      : (v) => H - pad.b - ((v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
    const m = metric(), p = PRICES[opts.price];

    const xt = logTicks(x0, x1), yt = ly ? logTicks(y0, y1) : linTicks(y0, y1);
    const grid = yt.map((v) => `<line class="vm-grid" x1="${pad.l}" x2="${W - pad.r}" y1="${sy(v)}" y2="${sy(v)}"/>
        <text class="vm-tick" x="${pad.l - 6}" y="${sy(v) + 4}" text-anchor="end">${short(v)}</text>`).join("") +
      xt.map((v) => `<text class="vm-tick" x="${sx(v)}" y="${H - pad.b + 16}" text-anchor="middle">${opts.price === "usd" ? "$" : ""}${short(v)}</text>`).join("");
    const axes = `<line class="vm-axis" x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/>
      <text class="vm-label" x="${(pad.l + W - pad.r) / 2}" y="${H - 6}" text-anchor="middle">${esc(p.label)} (${esc(p.unit)}, log scale)</text>
      <text class="vm-label" transform="translate(13 ${(pad.t + H - pad.b) / 2}) rotate(-90)" text-anchor="middle">${esc(m.label)}${m.unit ? ` (${esc(m.unit)})` : ""}${ly ? ", log scale" : ""}</text>`;

    // Step line: best value so far as price goes up.
    let path = "";
    front.forEach((d, i) => {
      const X = sx(d.x), Y = sy(d.y);
      path += i ? ` H${X} V${Y}` : `M${X} ${Y}`;
    });
    path += ` H${W - pad.r}`;

    const order = { other: 0, wanted: 1, owned: 2 };
    const frontSet = new Set(front);
    const dots = [...pts].sort((a, b) => order[a.st] - order[b.st]).map((d) => {
      const tip = `${d.s.name} · ${money(d.x)} · ${fmt(d.y)}${m.unit ? " " + m.unit : ""} ${lower(m.label)}${frontSet.has(d) ? " · best value" : ""}${d.st !== "other" ? ` · ${d.st}` : ""}`;
      return `<a href="#${esc(d.s.id)}" class="vm-pt ${d.st}${frontSet.has(d) ? " front" : ""}" data-tip="${esc(tip)}">
        <circle class="vm-hit" cx="${sx(d.x)}" cy="${sy(d.y)}" r="9"/>
        <circle class="vm-dot" cx="${sx(d.x)}" cy="${sy(d.y)}" r="${d.st === "other" ? 3.5 : 5}"/></a>`;
    }).join("");

    // Name only the ships I own or want, and keep labels from piling up.
    const placed = [];
    const labels = pts.filter((d) => d.st !== "other").sort((a, b) => b.y - a.y).map((d) => {
      const X = sx(d.x) + 8, Y = sy(d.y) + 4;
      const w = d.s.name.length * 6.4;
      const right = X + w > W - pad.r;
      const box = right ? [X - 16 - w, Y - 10, X - 16, Y + 2] : [X, Y - 10, X + w, Y + 2];
      if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return "";
      placed.push(box);
      return `<text class="vm-name" x="${right ? X - 16 : X}" y="${Y}" text-anchor="${right ? "end" : "start"}">${esc(d.s.name)}</text>`;
    }).join("");

    return `<svg class="vm-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(m.label)} against ${esc(lower(p.label))} for ${pts.length} ships">
      ${grid}${axes}<path class="vm-front" d="${path}"/>${dots}${labels}</svg>`;
  }

  function render(el) {
    const pts = points();
    const front = frontier(pts);
    const m = metric(), p = PRICES[opts.price];
    const careers = [...new Set(ships.map((s) => s.career).filter(Boolean))].sort();
    const missing = ships.filter((s) => (opts.ground || s.type !== "ground") && (!opts.career || s.career === opts.career)).length - pts.length;
    // Most of the capability per unit of money.
    const perMoney = opts.price === "usd" ? 100 : 100000;
    const ranked = [...pts].sort((a, b) => b.y / b.x - a.y / a.x).slice(0, 10);
    const yours = pts.filter((d) => d.st !== "other").sort((a, b) => b.y / b.x - a.y / a.x);
    const rank = new Map([...pts].sort((a, b) => b.y / b.x - a.y / a.x).map((d, i) => [d, i + 1]));
    const row = (d) => `<tr class="${d.st}"><td><a href="#${esc(d.s.id)}">${esc(d.s.name)}</a>${d.st !== "other" ? ` <small class="vm-st ${d.st}">${d.st}</small>` : ""}</td>
      <td class="num">${money(d.x)}</td><td class="num">${fmt(d.y)}</td><td class="num">${fmt(+((d.y / d.x) * perMoney).toPrecision(3))}</td><td class="num muted">#${rank.get(d)}</td></tr>`;
    const head = `<thead><tr><th>Ship</th><th class="num">${esc(p.unit)}</th><th class="num">${esc(m.label)}</th><th class="num">per ${opts.price === "usd" ? "$100" : "100k aUEC"}</th><th class="num">Rank</th></tr></thead>`;

    const prevWidth = el.querySelector(".vm-plot")?.clientWidth;
    el.innerHTML = `<div class="cmp-card vm">
      <h3>Value map</h3>
      <p class="muted">Each dot is a ship. The further up and to the left, the more you get for the money. The line joins the best value at each price: ships on it beat everything cheaper.</p>
      <div class="vm-controls">
        <label>Compare <select data-vm="metric">${METRICS.map((x) => `<option value="${x.key}"${x.key === m.key ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        <label>against <select data-vm="price">${Object.entries(PRICES).map(([k, x]) => `<option value="${k}"${k === opts.price ? " selected" : ""}>${esc(x.label)}</option>`).join("")}</select></label>
        <label>Career <select data-vm="career"><option value="">All</option>${careers.map((c) => `<option${c === opts.career ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
        <label class="vm-check"><input type="checkbox" data-vm="logY"${logY() ? " checked" : ""}> Log scale up</label>
        <label class="vm-check"><input type="checkbox" data-vm="ground"${opts.ground ? " checked" : ""}> Ground vehicles</label>
      </div>
      <div class="legend vm-legend">
        <span><i class="vm-key owned"></i>Owned</span><span><i class="vm-key wanted"></i>Wanted</span><span><i class="vm-key other"></i>Other</span><span><i class="vm-key line"></i>Best value line</span>
      </div>
      <div class="vm-plot">${pts.length ? "" : `<p class="empty">No ships have both a ${esc(lower(p.label))} and ${esc(lower(m.label))}.</p>`}</div>
      <div class="vm-tip" role="tooltip" hidden></div>
      <p class="note">${pts.length} ships shown. ${missing > 0 ? `${missing} have no ${esc(lower(p.label))} or no ${esc(lower(m.label))}, so they're left out. ` : ""}${opts.price === "auec" ? "In-game price is the cheapest shop." : "Pledge price is the RSI store price in USD."}</p>
    </div>
    <div class="vm-tables">
      <div class="cmp-card"><h3>Most ${esc(lower(m.label))} for the money</h3>
        <div class="cmp-scroll"><table class="vm-table">${head}<tbody>${ranked.map(row).join("")}</tbody></table></div></div>
      <div class="cmp-card"><h3>Your ships</h3>
        ${yours.length ? `<div class="cmp-scroll"><table class="vm-table">${head}<tbody>${yours.map(row).join("")}</tbody></table></div>` : `<p class="muted">None of your owned or wanted ships are in this view.</p>`}</div>
    </div>`;
    const box = el.querySelector(".vm-plot");
    if (pts.length) box.innerHTML = plot(pts, front, box.clientWidth || prevWidth || 900);
  }

  function bind(el, rerender) {
    el.addEventListener("change", (e) => {
      const k = e.target.dataset.vm;
      if (!k) return;
      if (k === "metric") { opts.metric = e.target.value; opts.logY = null; }
      else if (k === "logY" || k === "ground") opts[k] = e.target.checked;
      else opts[k] = e.target.value;
      save();
      rerender();
    });
    // Tooltip follows the hovered or focused dot.
    const show = (e) => {
      const pt = e.target.closest(".vm-pt");
      const tip = el.querySelector(".vm-tip");
      if (!tip) return;
      if (!pt) { tip.hidden = true; return; }
      const card = el.querySelector(".vm").getBoundingClientRect();
      const r = pt.querySelector(".vm-dot").getBoundingClientRect();
      tip.textContent = pt.dataset.tip;
      tip.hidden = false;
      const left = Math.min(r.left - card.left + 12, card.width - tip.offsetWidth - 8);
      tip.style.left = `${Math.max(8, left)}px`;
      tip.style.top = `${r.top - card.top - tip.offsetHeight - 8}px`;
    };
    el.addEventListener("mouseover", show);
    el.addEventListener("focusin", show);
    el.addEventListener("mouseleave", () => { const t = el.querySelector(".vm-tip"); if (t) t.hidden = true; });
    let timer;
    window.addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(() => { if (el.offsetParent) rerender(); }, 150); });
  }

  window.ValueMap = { render, bind };
})();
