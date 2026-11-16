/* 銅鑄童子擊鼓／舉鼓（ES5，導覽 three r147 與預覽頁共用）
   童子：大頭圓臉、總角雙髻繫帶、交領短衫束腰、燈籠褲小靴，站在圓形銅座上
   A 型「舉鼓」：雙手把鼓高舉過頭；B 型「擊鼓」：鼓架前弓步，雙手持槌
   每型拆成 body / armL / armR / drum 幾何（已含頂點色），可用 InstancedMesh 大量擺放並單獨擺動手臂
   makeTongzi(THREE) -> { A:{body,armL,armR,drum}, B:{...}, mat, SH:[shoulder L, R], PIV } */
function makeTongzi(THREE, opt) {
  opt = opt || {};
  var V3 = THREE.Vector3, TAU = Math.PI * 2;
  var C_BASE = [1, 1, 1], C_DARK = [0.62, 0.56, 0.5], C_GOLD = [1.28, 1.12, 0.78], C_SKIN = [1.12, 1.04, 0.9], C_DRUM = [1.18, 1.08, 0.86];
  var parts;
  function push(g, col, m) { g = g.index ? g.toNonIndexed() : g; if (m) g.applyMatrix4(m); var n = g.attributes.position.count, c = new Float32Array(n * 3); for (var i = 0; i < n; i++) { c[i * 3] = col[0]; c[i * 3 + 1] = col[1]; c[i * 3 + 2] = col[2]; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2)); parts.push(g); }
  function M4(x, y, z, rx, ry, rz, sx, sy, sz) { var m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)); m.compose(new V3(x, y, z), q, new V3(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz)); return m; }
  var SPH = new THREE.SphereGeometry(1, 14, 10);
  function S(col, x, y, z, sx, sy, sz, rx, ry, rz) { push(SPH.clone(), col, M4(x, y, z, rx, ry, rz, sx, sy, sz)); }
  function Cy(col, rt, rb, h, x, y, z, rx, ry, rz, seg) { push(new THREE.CylinderGeometry(rt, rb, h, seg || 12), col, M4(x, y, z, rx, ry, rz)); }
  function LA(col, pts, sx, sz, y) { var g = new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 18); push(g, col, M4(0, y || 0, 0, 0, 0, 0, sx, 1, sz)); }
  function limb(col, a, b, r0, r1, seg) { var d = b.clone().sub(a), len = d.length(), g = new THREE.CylinderGeometry(r1, r0, len, seg || 9); g.translate(0, len / 2, 0);
    var q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize()); var m = new THREE.Matrix4().compose(a, q, new V3(1, 1, 1)); push(g, col, m); }
  function bake() { var pos = [], nor = [], col = [], uv = [], i, j; for (i = 0; i < parts.length; i++) { var g = parts[i]; if (!g.attributes.normal) g.computeVertexNormals(); var P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color, U = g.attributes.uv;
      for (j = 0; j < P.count; j++) { pos.push(P.getX(j), P.getY(j), P.getZ(j)); nor.push(N.getX(j), N.getY(j), N.getZ(j)); col.push(C.getX(j), C.getY(j), C.getZ(j)); uv.push(U.getX(j), U.getY(j)); } }
    var o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); o.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); o.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); o.computeBoundingSphere(); parts = []; return o; }
  // ---- shared: head, torso, base ----
  function head() {
    S(C_SKIN, 0, 0.95, 0.01, 0.125, 0.13, 0.12); S(C_SKIN, -0.055, 0.905, 0.075, 0.04, 0.032, 0.035); S(C_SKIN, 0.055, 0.905, 0.075, 0.04, 0.032, 0.035);   // round face, chubby cheeks
    S(C_SKIN, 0, 0.93, 0.125, 0.018, 0.016, 0.016);   // nose
    for (var s = -1; s <= 1; s += 2) { var ey = new THREE.TorusGeometry(0.017, 0.0045, 4, 10, Math.PI); push(ey, C_DARK, M4(s * 0.043, 0.952, 0.112, 0, 0, 0));   // smiling closed eyes
      push(new THREE.TorusGeometry(0.022, 0.003, 4, 10, Math.PI * 0.8), C_DARK, M4(s * 0.045, 0.99, 0.106, 0, 0, Math.PI * 0.1)); S(C_SKIN, s * 0.122, 0.945, 0, 0.02, 0.035, 0.022); }
    var sm = new THREE.TorusGeometry(0.03, 0.006, 5, 10, Math.PI); push(sm, C_DARK, M4(0, 0.895, 0.112, 0, 0, Math.PI, 1, 0.8, 1));   // smile
    var cap = new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI * 0.55); push(cap, C_DARK, M4(0, 0.97, -0.015, -0.55, 0, 0, 0.13, 0.13, 0.125));
    S(C_DARK, 0, 1.06, 0.07, 0.06, 0.025, 0.03, 0.4);   // fringe
    for (s = -1; s <= 1; s += 2) { S(C_DARK, s * 0.085, 1.075, -0.01, 0.048, 0.046, 0.046); Cy(C_GOLD, 0.03, 0.03, 0.018, s * 0.07, 1.04, -0.01, 0, 0, s * 0.5);   // 總角 twin buns + ties
      push(new THREE.BoxGeometry(0.02, 0.09, 0.006), C_GOLD, M4(s * 0.1, 1.0, -0.06, 0.3, 0, s * 0.4)); }
    Cy(C_SKIN, 0.045, 0.05, 0.06, 0, 0.8, 0); }
  function torso(wide) {
    LA(C_BASE, [[wide ? 0.19 : 0.17, 0.34], [0.165, 0.45], [0.145, 0.56], [0.14, 0.62]], 1, 0.85);
    LA(C_BASE, [[0.14, 0.6], [0.145, 0.68], [0.135, 0.75], [0.09, 0.8]], 1.05, 0.82);
    Cy(C_GOLD, 0.15, 0.15, 0.04, 0, 0.56, 0, 0, 0, 0, 16); S(C_GOLD, -0.03, 0.56, 0.13, 0.03, 0.022, 0.018); S(C_GOLD, 0.03, 0.56, 0.13, 0.03, 0.022, 0.018);
    push(new THREE.BoxGeometry(0.02, 0.12, 0.006), C_GOLD, M4(-0.015, 0.49, 0.135, 0.15, 0, 0.15)); push(new THREE.BoxGeometry(0.02, 0.1, 0.006), C_GOLD, M4(0.02, 0.5, 0.135, 0.15, 0, -0.2));
    limb(C_GOLD, new V3(0.06, 0.79, 0.07), new V3(-0.06, 0.6, 0.12), 0.012, 0.012, 5);   // 交領
    Cy(C_BASE, 0.32, 0.34, 0.06, 0, 0.03, 0, 0, 0, 0, 24); Cy(C_GOLD, 0.335, 0.335, 0.012, 0, 0.062, 0, 0, 0, 0, 24); }
  function legs(stance) {
    for (var s = -1; s <= 1; s += 2) { var hip = new V3(s * 0.065, 0.4, 0), kn = new V3(s * (0.08 + stance * 0.05), 0.22, 0.02 + (s > 0 ? stance * 0.05 : -stance * 0.03)), an = new V3(s * (0.09 + stance * 0.08), 0.1, s > 0 ? stance * 0.08 : -stance * 0.04);
      limb(C_BASE, hip, kn, 0.07, 0.068); limb(C_BASE, kn, an, 0.068, 0.05); S(C_DARK, an.x, 0.1, an.z + 0.03, 0.05, 0.035, 0.08); } }
  function hand(p) { S(C_SKIN, p.x, p.y, p.z, 0.032, 0.036, 0.03); }
  function drumBody(r, L, cx, cy, cz, rx, ry, rz) {   // barrel drum, skins facing ±local y
    var pts = [], n = 8; for (var i = 0; i <= n; i++) { var t = i / n; pts.push(new THREE.Vector2(r * (1 + 0.12 * Math.sin(Math.PI * t)), -L / 2 + L * t)); }
    var m = M4(cx, cy, cz, rx, ry, rz); push(new THREE.LatheGeometry(pts, 20), C_BASE, m);
    for (var s = -1; s <= 1; s += 2) { var sk = new THREE.CircleGeometry(r * 0.99, 20); sk.rotateX(-s * Math.PI / 2); sk.translate(0, s * (L / 2 + 0.001), 0); push(sk, C_DRUM, m);
      for (var k = 0; k < 14; k++) { var a = k / 14 * TAU, st = new THREE.SphereGeometry(r * 0.05, 5, 4); st.translate(Math.cos(a) * r * 1.01, s * (L / 2 - r * 0.08), Math.sin(a) * r * 1.01); push(st, C_GOLD, m); } }
    var ring = new THREE.TorusGeometry(r * 1.13, r * 0.03, 5, 20); ring.rotateX(Math.PI / 2); push(ring, C_GOLD, m); }
  var SH = [new V3(0.155, 0.74, 0), new V3(-0.155, 0.74, 0)];
  var out = {};
  // ---- A 舉鼓：雙手將鼓高舉過頭（手臂與鼓一起動，樞紐在肩高中點） ----
  parts = []; legs(0.15); torso(false); head(); out.A = { body: bake() };
  var hA = [new V3(0.24, 1.27, 0.03), new V3(-0.24, 1.27, 0.03)];
  for (var k = 0; k < 2; k++) { var sh = SH[k], hd = hA[k], el = sh.clone().lerp(hd, 0.5).add(new V3(k ? -0.08 : 0.08, -0.02, 0.02));
    limb(C_BASE, sh, el, 0.055, 0.05); limb(C_BASE, el, hd, 0.05, 0.042); S(C_BASE, sh.x, sh.y, sh.z, 0.06, 0.06, 0.06); hand(hd); out.A[k ? 'armR' : 'armL'] = bake(); }
  drumBody(0.2, 0.24, 0, 1.33, 0.03, Math.PI / 2, 0, 0); out.A.drum = bake();
  // ---- B 擊鼓：鼓架上斜放堂鼓，童子弓步雙手持槌（手臂各自以肩為軸揮動） ----
  parts = []; legs(0.6); torso(true); head();
  var dc = new V3(0, 0.6, 0.42);
  for (var t = 0; t < 3; t++) { var a = t / 3 * TAU + Math.PI / 2; limb([0.8, 0.7, 0.6], new V3(dc.x + Math.cos(a) * 0.08, 0.5, dc.z + Math.sin(a) * 0.08), new V3(dc.x + Math.cos(a) * 0.26, 0.0, dc.z + Math.sin(a) * 0.26), 0.02, 0.025, 6); }
  drumBody(0.22, 0.22, dc.x, dc.y, dc.z, -0.75, 0, 0); out.B = { body: bake() };
  for (k = 0; k < 2; k++) { var sh2 = SH[k], el2 = sh2.clone().add(new V3(k ? -0.06 : 0.06, -0.14, 0.12)), hd2 = sh2.clone().add(new V3(k ? 0.07 : -0.07, -0.13, 0.3));
    limb(C_BASE, sh2, el2, 0.055, 0.05); limb(C_BASE, el2, hd2, 0.05, 0.042); S(C_BASE, sh2.x, sh2.y, sh2.z, 0.06, 0.06, 0.06); hand(hd2);
    limb([0.8, 0.66, 0.5], hd2, hd2.clone().add(new V3(k ? 0.05 : -0.05, -0.02, 0.24)), 0.012, 0.01, 6); S(C_GOLD, hd2.x + (k ? 0.05 : -0.05), hd2.y - 0.02, hd2.z + 0.25, 0.022, 0.022, 0.022);
    out.B[k ? 'armR' : 'armL'] = bake(); }
  out.B.drum = null;
  out.mat = new THREE.MeshLambertMaterial({ color: opt.color || 0xa07a46, vertexColors: true, emissive: 0x1a1006 });
  out.SH = SH; out.PIV = new V3(0, 0.74, 0);
  return out;
}

/* 童子群：以 InstancedMesh 擺放，點擊時單一童子擊鼓／舉鼓搖鼓；三連點觸發「鼓陣齊鳴」
   list: [{x,y,z,ry,type:'A'|'B'}]  opt: {drum: function(freq, vol), scale, onWave} */
function makeTongziGroup(THREE, T, list, opt) {
  opt = opt || {};
  var group = new THREE.Group(), SC = opt.scale || 1, ims = {}, idx = { A: [], B: [] }, slot = [], d = new THREE.Object3D(), i;
  for (i = 0; i < list.length; i++) { var it = list[i]; slot.push(idx[it.type].length); idx[it.type].push(i); it.t = -1; it.f = 90 + (i % 5) * 14; it.base = null; }
  ['A', 'B'].forEach(function (ty) { var n = idx[ty].length; if (!n) return; ims[ty] = {};
    ['body', 'armL', 'armR', 'drum'].forEach(function (pn) { var g = T[ty][pn]; if (!g) return; var im = new THREE.InstancedMesh(g, T.mat, n); im.frustumCulled = false; im.userData.tzType = ty; im.userData.tzIdx = idx[ty]; group.add(im); ims[ty][pn] = im; }); });
  var mBase = new THREE.Matrix4(), mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), mC = new THREE.Matrix4(), q = new THREE.Quaternion(), E = new THREE.Euler();
  function baseM(it) { d.position.set(it.x, it.y, it.z); d.rotation.set(0, it.ry, 0); d.scale.set(SC, SC, SC); d.updateMatrix(); return d.matrix.clone(); }
  function pivotRot(base, p, rx, rz, lift) { mA.makeTranslation(p.x, p.y + (lift || 0), p.z); q.setFromEuler(E.set(rx || 0, 0, rz || 0)); mB.makeRotationFromQuaternion(q); mC.makeTranslation(-p.x, -p.y, -p.z); return base.clone().multiply(mA).multiply(mB).multiply(mC); }
  function pose(k) { var it = list[k], s = slot[k], P = ims[it.type], b = it.base || (it.base = baseM(it)), t = it.t;
    if (it.type === 'B') { var aL = -0.35, aR = -0.35;
      if (t >= 0) { var u = t / 0.5; aL = -0.12 - 1.05 * (0.5 + 0.5 * Math.cos(TAU2 * u)); aR = -0.12 - 1.05 * (0.5 + 0.5 * Math.cos(TAU2 * (u + 0.5))); }
      P.armL.setMatrixAt(s, pivotRot(b, T.SH[0], aL, 0)); P.armR.setMatrixAt(s, pivotRot(b, T.SH[1], aR, 0)); }
    else { var sw = 0, lf = 0; if (t >= 0) { sw = Math.sin(t * 7.5) * 0.28 * Math.min(1, t * 3, (2.2 - t) * 3); lf = Math.abs(Math.sin(t * 7.5)) * 0.05; }
      var m = pivotRot(b, T.PIV, 0, sw, lf); P.armL.setMatrixAt(s, m); P.armR.setMatrixAt(s, m); P.drum.setMatrixAt(s, m); }
    P.body.setMatrixAt(s, b); }
  var TAU2 = Math.PI * 2;
  for (i = 0; i < list.length; i++) pose(i);
  function dirty(ty) { var P = ims[ty]; for (var k in P) P[k].instanceMatrix.needsUpdate = true; }
  dirty('A'); dirty('B');
  var taps = [];
  function play(k, delay) { var it = list[k]; if (delay) { setTimeout(function () { play(k); }, delay); return; } if (it.t >= 0) return; it.t = 0; it.lastU = 0; }
  function tap(h) { var o = h.object; if (!o.userData.tzIdx || h.instanceId === undefined) return false; var k = o.userData.tzIdx[h.instanceId]; play(k);
    var now = Date.now(); taps.push(now); taps = taps.filter(function (x) { return now - x < 2200; });
    if (taps.length >= 3) { taps = []; var c = list[k]; for (var j = 0; j < list.length; j++) if (j !== k) { var dx = list[j].x - c.x, dz = list[j].z - c.z; play(j, 300 + Math.sqrt(dx * dx + dz * dz) * 90); } if (opt.onWave) opt.onWave(); }
    return true; }
  function tick(dt) { var dA = false, dB = false;
    for (var k = 0; k < list.length; k++) { var it = list[k]; if (it.t < 0) continue; var t0 = it.t; it.t += dt;
      if (it.type === 'B') { for (var arm = 0; arm < 2; arm++) { var u0 = t0 / 0.5 + arm * 0.5 + 0.5, u1 = it.t / 0.5 + arm * 0.5 + 0.5; if (Math.floor(u0) !== Math.floor(u1) && it.t < 2.05 && opt.drum) opt.drum(it.f * (arm ? 1.12 : 1), 0.4); } dB = true; }
      else { if (Math.floor(t0 * 7.5 / Math.PI) !== Math.floor(it.t * 7.5 / Math.PI) && it.t < 2.1 && opt.drum) opt.drum(it.f * 0.8, 0.35); dA = true; }
      if (it.t > 2.2) it.t = -1;
      pose(k); }
    if (dA) dirty('A'); if (dB) dirty('B'); }
  return { group: group, tick: tick, tap: tap, play: play, meshes: ims };
}
