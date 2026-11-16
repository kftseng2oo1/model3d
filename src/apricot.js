/* 杏樹程式模型（ES5，可同時用在導覽 three r147 與預覽頁 r160）
   依真實杏樹：深色枝條層層分岔、白花（暗紅花萼、黃蕊）一簇簇綴在枝上，整棵通透。
   makeApricot(THREE, opt) -> { trunk, sprays, farTrunk, farCrown, barkMat, sprayMat, crownMat } */
function makeApricot(THREE, opt) {
  opt = opt || {};
  var seed = opt.seed || 11, lite = !!opt.lite;
  var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  var V3 = THREE.Vector3, TAU = 6.2832;
  function tex(w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); return t; }
  function flower(g, x, y, r, bud) {   // one apricot blossom seen roughly face-on
    if (bud) { g.fillStyle = '#7a1f2a'; g.beginPath(); g.ellipse(x, y + r * 0.35, r * 0.45, r * 0.4, 0, 0, TAU); g.fill(); g.fillStyle = '#f6c6d0'; g.beginPath(); g.ellipse(x, y - r * 0.05, r * 0.42, r * 0.5, 0, 0, TAU); g.fill(); return; }
    var rot = rnd() * TAU, p;
    g.fillStyle = '#7a1f2a'; for (p = 0; p < 5; p++) { var a = rot + (p + 0.5) / 5 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.3, r * 0.16, a, 0, TAU); g.fill(); }   // red sepals peeking out
    for (p = 0; p < 5; p++) { var b = rot + p / 5 * TAU; var gr = g.createRadialGradient(x, y, r * 0.1, x + Math.cos(b) * r * 0.5, y + Math.sin(b) * r * 0.5, r * 0.6);
      gr.addColorStop(0, '#ffe8ee'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#fbf3f4'); g.fillStyle = gr;
      g.beginPath(); g.ellipse(x + Math.cos(b) * r * 0.5, y + Math.sin(b) * r * 0.5, r * 0.5, r * 0.42, b, 0, TAU); g.fill(); }
    g.fillStyle = '#e88a9a'; g.beginPath(); g.arc(x, y, r * 0.2, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(240,200,120,.9)'; g.lineWidth = 0.8; g.fillStyle = '#f2c64a';
    for (p = 0; p < 14; p++) { var c = rnd() * TAU, l = r * (0.3 + rnd() * 0.25); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(c) * l, y + Math.sin(c) * l); g.stroke(); g.beginPath(); g.arc(x + Math.cos(c) * l, y + Math.sin(c) * l, 1.4, 0, TAU); g.fill(); }
  }
  // ---- textures ----
  var barkTex = tex(64, 128, function (g, w, h) { g.fillStyle = '#3e3029'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 160; i++) { var v = 40 + rnd() * 40; g.fillStyle = 'rgba(' + (v + 25) + ',' + (v + 12) + ',' + v + ',.5)'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4, 8 + rnd() * 26); } });
  barkTex.wrapS = barkTex.wrapT = THREE.RepeatWrapping;
  // 2x2 atlas of blossom sprays (transparent), each with a short twig
  var sprayTex = tex(256, 256, function (g, w, h) {
    g.clearRect(0, 0, w, h);
    for (var q = 0; q < 4; q++) {
      var ox = (q % 2) * 128, oy = Math.floor(q / 2) * 128;
      g.strokeStyle = '#3a2a22'; g.lineWidth = 3; g.beginPath(); g.moveTo(ox + 64, oy + 124); g.quadraticCurveTo(ox + 54 + rnd() * 20, oy + 64, ox + 60 + rnd() * 10, oy + 8); g.stroke();
      var n = q === 3 ? 4 : 5 + q;
      for (var k = 0; k < n; k++) { var y = oy + 14 + rnd() * 96, x = ox + 64 + (rnd() - 0.5) * 70 * (1 - Math.abs(y - oy - 64) / 110); flower(g, x, y, 13 + rnd() * 6, q === 3 ? rnd() < 0.6 : rnd() < 0.15); }
    }
  });
  // painted see-through crown for distant trees
  var crownTex = tex(256, 256, function (g, w, h) {
    g.clearRect(0, 0, w, h);
    function br(x, y, a, len, wd, d) { var x2 = x + Math.cos(a) * len, y2 = y - Math.sin(a) * len; g.strokeStyle = '#3a2a22'; g.lineWidth = wd; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      if (d > 0) { var n = d > 2 ? 3 : 2; for (var i = 0; i < n; i++) br(x2, y2, a + (i - (n - 1) / 2) * 0.55 + (rnd() - 0.5) * 0.3, len * 0.72, wd * 0.62, d - 1); }
      else for (var k = 0; k < 6; k++) { var t = rnd(); var px = x + (x2 - x) * t + (rnd() - 0.5) * 10, py = y + (y2 - y) * t + (rnd() - 0.5) * 10; g.fillStyle = rnd() < 0.2 ? '#f2b8c4' : (rnd() < 0.5 ? '#fff4f6' : '#fde4ea'); g.beginPath(); g.arc(px, py, 3.5 + rnd() * 3, 0, TAU); g.fill(); } }
    for (var s = 0; s < 4; s++) br(128, 250, Math.PI / 2 + (s - 1.5) * 0.45, 70, 10, 4);
  });
  var barkMat = new THREE.MeshLambertMaterial({ map: barkTex });
  var sprayMat = new THREE.MeshLambertMaterial({ map: sprayTex, emissive: 0x9a8a8c, emissiveMap: sprayTex, alphaTest: 0.5, side: THREE.DoubleSide, vertexColors: true });
  var crownMat = new THREE.MeshLambertMaterial({ map: crownTex, emissive: 0x8a7a7c, emissiveMap: crownTex, alphaTest: 0.45, side: THREE.DoubleSide, vertexColors: true });
  [barkTex, sprayTex, crownTex].forEach(function (t) { if (opt.colorSpace) t.colorSpace = opt.colorSpace; if (opt.srgb && THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding; });

  // ---- helpers ----
  function merge(list) {
    var pos = [], nor = [], uv = [], col = [], hasCol = false, i, j;
    for (i = 0; i < list.length; i++) if (list[i].attributes.color) hasCol = true;
    for (i = 0; i < list.length; i++) { var g = list[i].index ? list[i].toNonIndexed() : list[i], P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color;
      for (j = 0; j < P.count; j++) { pos.push(P.getX(j), P.getY(j), P.getZ(j)); nor.push(N.getX(j), N.getY(j), N.getZ(j)); uv.push(U ? U.getX(j) : 0, U ? U.getY(j) : 0); if (hasCol) { if (C) col.push(C.getX(j), C.getY(j), C.getZ(j)); else col.push(1, 1, 1); } } }
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (hasCol) out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    out.computeBoundingSphere(); return out;
  }
  function tube(a, b, bend, r0, r1, radial, segs) {
    var mid = a.clone().lerp(b, 0.5).add(bend), curve = new THREE.QuadraticBezierCurve3(a, mid, b), g = new THREE.TubeGeometry(curve, segs, 1, radial, false), P = g.attributes.position;
    for (var i = 0; i <= segs; i++) { var c = curve.getPoint(i / segs), r = r0 + (r1 - r0) * (i / segs); for (var j = 0; j <= radial; j++) { var k = i * (radial + 1) + j, v = new V3(P.getX(k), P.getY(k), P.getZ(k)).sub(c).multiplyScalar(r).add(c); P.setXYZ(k, v.x, v.y, v.z); } }
    var U = g.attributes.uv; for (i = 0; i < U.count; i++) U.setXY(i, U.getX(i) * 4, U.getY(i));
    g.computeVertexNormals(); return g;
  }
  var cards = [];
  function card(pos, size, up) {   // one blossom spray, roughly following the twig direction
    var pl = new THREE.PlaneGeometry(size, size), q = Math.floor(rnd() * 4), i;
    var U = pl.attributes.uv; for (i = 0; i < U.count; i++) U.setXY(i, (q % 2) * 0.5 + U.getX(i) * 0.5, (1 - Math.floor(q / 2)) * 0.5 + U.getY(i) * 0.5);
    pl.rotateZ((rnd() - 0.5) * 1.2);
    var face = new V3(rnd() - 0.5, (rnd() - 0.5) * 0.6, rnd() - 0.5).normalize();
    pl.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), face));
    pl.translate(pos.x, pos.y, pos.z);
    var w = 0.9 + rnd() * 0.1, cl = []; for (i = 0; i < 4; i++) cl.push(w, w, w); pl.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    cards.push(pl);
  }
  // ---- grow the near tree ----
  var parts = [];
  var RAD = lite ? [6, 4, 4, 3, 3] : [7, 5, 4, 4, 3], SEG = lite ? [3, 2, 2, 1, 1] : [4, 3, 2, 2, 1];
  function grow(start, dir, len, r, depth) {
    var bend = new V3((rnd() - 0.5) * len * 0.25, len * 0.05, (rnd() - 0.5) * len * 0.25), end = start.clone().addScaledVector(dir, len);
    var lvl = 4 - depth; parts.push(tube(start, end, bend, r, r * 0.68, RAD[lvl] || 3, SEG[lvl] || 1));
    if (depth <= 1) {   // blossoms along the finer branches
      var n = depth === 0 ? (lite ? 3 : 4) : (lite ? 1 : 2);
      for (var k = 0; k < n; k++) { var t = 0.3 + rnd() * 0.75; card(start.clone().lerp(end, Math.min(1, t)).add(new V3((rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.12)), 0.34 + rnd() * 0.2, dir); }
    }
    if (depth === 0) return;
    var kids = depth >= 3 ? 3 : (depth === 2 ? 3 : 2);
    for (var i = 0; i < kids; i++) {
      var axis = new V3(rnd() - 0.5, 0, rnd() - 0.5).normalize(), spread = 0.45 + rnd() * 0.35;
      var nd = dir.clone().applyAxisAngle(axis, spread * (i === 0 && depth > 2 ? 0.3 : 1)).add(new V3(0, 0.25, 0)).normalize();
      if (nd.y < 0.05) nd.y = 0.05;
      grow(end, nd.normalize(), len * (0.66 + rnd() * 0.12), r * 0.62, depth - 1);
    }
  }
  var lean = new V3((rnd() - 0.5) * 0.18, 1, (rnd() - 0.5) * 0.18).normalize();
  var forkAt = lean.clone().multiplyScalar(1.15);
  parts.push(tube(new V3(0, -0.1, 0), forkAt, new V3(0.06, 0, -0.04), 0.15, 0.12, RAD[0], SEG[0]));
  var scaff = lite ? 3 : 4, a0 = rnd() * TAU;
  for (var s = 0; s < scaff; s++) { var a = a0 + s / scaff * TAU + (rnd() - 0.5) * 0.4, el = 0.6 + rnd() * 0.35;
    grow(forkAt, new V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)), 0.85 + rnd() * 0.25, 0.1, 3); }
  var trunk = merge(parts), sprays = merge(cards);

  // ---- far tree: trunk + three crossed painted crowns (see-through) ----
  var crowns = [];
  for (var c = 0; c < 3; c++) { var pl = new THREE.PlaneGeometry(3.6, 3.0); pl.translate(0, 2.4, 0); pl.rotateY(c / 3 * Math.PI); var cl = []; for (var i = 0; i < 4; i++) cl.push(1, 1, 1); pl.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); crowns.push(pl); }
  var farCrown = merge(crowns), farTrunk = merge([tube(new V3(0, -0.1, 0), new V3(0, 1.2, 0), new V3(0, 0, 0), 0.15, 0.11, 4, 1)]);
  return { trunk: trunk, sprays: sprays, farTrunk: farTrunk, farCrown: farCrown, barkMat: barkMat, sprayMat: sprayMat, crownMat: crownMat };
}
