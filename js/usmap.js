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
  const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (ev) => { root.attr("transform", ev.transform); layer.selectAll("circle").attr("stroke-width", 1 / ev.transform.k); });
  svg.call(zoom);
  svg.on("dblclick.zoom", null);
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

  function reset() { svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity); }
  return { update, reset, proj };
};
