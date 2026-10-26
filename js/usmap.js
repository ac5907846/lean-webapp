// A U.S. map (Albers USA) with state outlines, zoom, and one circle per point. Points are redrawn with
// `update(points, style)` where style(d) returns {fill, stroke, r, opacity}; transitions carry between states.
window.USMap = function (svgEl, topo) {
  const svg = d3.select(svgEl);
  const W = 975, H = 610;
  const proj = d3.geoAlbersUsa().scale(1300).translate([W / 2, H / 2]);
  const path = d3.geoPath(proj);
  const states = topojson.feature(topo, topo.objects.states);
  const root = svg.append("g");
  root.append("path").datum(topojson.feature(topo, topo.objects.nation)).attr("d", path).attr("fill", "#f3f1ea").attr("stroke", "none");
  root.append("path").datum(topojson.mesh(topo, topo.objects.states, (a, b) => a !== b)).attr("d", path).attr("fill", "none").attr("stroke", "#fff").attr("stroke-width", 1);
  root.append("path").datum(states).attr("d", path).attr("fill", "none").attr("stroke", "#cfcbbf").attr("stroke-width", .6);
  const layer = root.append("g");
  // zoom by the + and - buttons (owner 2026-10-08: smoother than the wheel); dragging still pans, the wheel scrolls the page
  const zoom = d3.zoom().scaleExtent([1, 8]).filter((ev) => ev.type !== "wheel" && !ev.button)
    .on("zoom", (ev) => { root.attr("transform", ev.transform); layer.selectAll("circle").attr("stroke-width", 1 / ev.transform.k); });
  svg.call(zoom);
  svg.on("dblclick.zoom", null);
  const wrap = svgEl.parentElement;
  if (wrap && !wrap.querySelector(".zoombtns")) {
    const box = document.createElement("div"); box.className = "zoombtns";
    box.innerHTML = '<button type="button" title="Zoom in">+</button><button type="button" title="Zoom out">\u2212</button><button type="button" title="Whole country">\u2302</button>';
    wrap.appendChild(box);
    const [bin, bout, bhome] = box.querySelectorAll("button");
    // a short eased glide between the current transform and the target (a transition on the svg does not run here)
    let glideTimer = null;
    function glide(target, ms = 350) {
      const from = d3.zoomTransform(svgEl), t0 = performance.now();
      if (glideTimer) glideTimer.stop();
      if (M.reduced) { zoom.transform(svg, target); return; }
      glideTimer = { stop() { clearInterval(this.id); }, id: setInterval(() => {      // an interval, not rAF: runs even in a background tab
        const u = Math.min(1, (performance.now() - t0) / ms), e = 1 - Math.pow(1 - u, 3);
        zoom.transform(svg, d3.zoomIdentity.translate(from.x + (target.x - from.x) * e, from.y + (target.y - from.y) * e).scale(from.k + (target.k - from.k) * e));
        if (u >= 1) glideTimer.stop();
      }, 16) };
    }
    function scaled(f) {                                     // the transform after scaling by f about the map centre
      const t = d3.zoomTransform(svgEl), k = Math.max(1, Math.min(8, t.k * f)), cx = W / 2, cy = H / 2;
      return d3.zoomIdentity.translate(cx - (cx - t.x) * k / t.k, cy - (cy - t.y) * k / t.k).scale(k);
    }
    bin.addEventListener("click", () => glide(scaled(1.6)));
    bout.addEventListener("click", () => glide(scaled(1 / 1.6)));
    bhome.addEventListener("click", () => glide(d3.zoomIdentity, 450));
  }
  let cache = new Map();

  function project(d) {
    if (d._xy !== undefined) return d._xy;
    const p = d.lat != null && d.lon != null ? proj([d.lon, d.lat]) : null;
    d._xy = p || null;
    return d._xy;
  }

  // points: array with lat/lon and an id; style(d) -> {fill, stroke, r, opacity, hidden}
  function update(points, style, { ms = 500, tip = null, onClick = null } = {}) {
    const pts = points.filter((d) => project(d));
    const sel = layer.selectAll("circle").data(pts, (d) => d.id);
    const t = d3.transition().duration(M.reduced ? 0 : ms);
    sel.exit().transition(t).attr("r", 0).remove();
    const enter = sel.enter().append("circle").attr("cx", (d) => project(d)[0]).attr("cy", (d) => project(d)[1]).attr("r", 0).attr("stroke-width", 1);
    const all = enter.merge(sel);
    if (tip) all.on("mousemove", (ev, d) => C.showTip(ev, tip(d))).on("mouseleave", C.hideTip);
    if (onClick) all.style("cursor", "pointer").on("click", (ev, d) => onClick(d));
    all.each(function (d) { const s = style(d); d3.select(this).transition(t).attr("r", s.hidden ? 0 : s.r).attr("fill", s.fill).attr("stroke", s.stroke).attr("opacity", s.opacity ?? 1); });
    // draw the emphasized points on top
    all.sort((a, b) => (style(a).z || 0) - (style(b).z || 0));
  }

  function reset() { zoom.transform(svg, d3.zoomIdentity); }
  return { update, reset, proj };
};
