/* 魚塭三寶：虱目魚、草蝦（斑節蝦）、文蛤（ES5，three r128～r160 皆可用；故鄉魚塭與模型庫預覽頁共用）
   座標（程式內部）：頭朝 +x、背朝 +y；文蛤以殼頂（鉸合處）為原點、腹緣朝 -y、前端 +x、水管在後端 -x
   makeAquaculture(THREE) -> {
     milkfish:{ body, tail, TAIL_X, canvas },      // body 已含鰭與眼睛；與 tail 共用一個「貼圖＋頂點色」材質
     prawn:{ geo },                                 // 含 aLeg / aPivot 屬性（步足、腹肢、觸角可在 shader 擺動）
     clam:{ valveL, valveR, foot, siphon, mantle, closed, canvas },
     texture(canvas) -> CanvasTexture,
     rig(kind) -> { root, clips }                   // 節點動畫版（模型庫預覽與匯出 .glb 用；kind = milkfish | prawn | clam）
   } */
function makeAquaculture(THREE, opt) {
  opt = opt || {};
  var V3 = THREE.Vector3, TAU = Math.PI * 2;
  var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function sm(a, b, x) { var t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function fr(x) { return x - Math.floor(x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hash(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) { var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    return lerp(lerp(hash(ix, iy), hash(ix + 1, iy), fx), lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), fx), fy); }
  function M4(x, y, z, rx, ry, rz, sx, sy, sz) { var m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0));
    return m.compose(new V3(x || 0, y || 0, z || 0), q, new V3(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz)); }
  function mul() { var m = new THREE.Matrix4(); for (var i = 0; i < arguments.length; i++) m.multiply(arguments[i]); return m; }
  var _c = new THREE.Color();
  function col(h) { return new THREE.Color(h); }
  function solid(h) { var c = col(h); return function (x, y, z, o) { o.copy(c); }; }

  // ---- geometry helpers: every part = non-indexed geometry with position / normal / color / uv ----
  function finish(g, m, paint, uv) {
    g = g.index ? g.toNonIndexed() : g.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    var P = g.attributes.position, n = P.count, i;
    if (paint) { var C = new Float32Array(n * 3); for (i = 0; i < n; i++) { paint(P.getX(i), P.getY(i), P.getZ(i), _c); C[i * 3] = _c.r; C[i * 3 + 1] = _c.g; C[i * 3 + 2] = _c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(C, 3)); }
    if (uv) { var U = new Float32Array(n * 2); for (i = 0; i < n; i++) { U[i * 2] = uv[0]; U[i * 2 + 1] = uv[1]; } g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); }
    if (m) g.applyMatrix4(m);
    return g; }
  function surf(nu, nv, fn, paint, o) {
    o = o || {}; var n = (nu + 1) * (nv + 1), P = new Float32Array(n * 3), UV = new Float32Array(n * 2), C = new Float32Array(n * 3), p = new V3(), i, j, k = 0;
    for (i = 0; i <= nu; i++) for (j = 0; j <= nv; j++, k++) { var u = i / nu, v = j / nv; fn(u, v, p); P[k * 3] = p.x; P[k * 3 + 1] = p.y; P[k * 3 + 2] = p.z;
      UV[k * 2] = o.uv ? o.uv(u, v)[0] : u; UV[k * 2 + 1] = o.uv ? o.uv(u, v)[1] : v;
      if (paint) paint(u, v, p, _c); else _c.setRGB(1, 1, 1); C[k * 3] = _c.r; C[k * 3 + 1] = _c.g; C[k * 3 + 2] = _c.b; }
    var idx = [];
    for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) { var a = i * (nv + 1) + j, b = a + nv + 1;
      if (o.flip) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setIndex(idx); g.computeVertexNormals();
    var N = g.attributes.normal;
    function avg(list) { var x = 0, y = 0, z = 0, q; for (q = 0; q < list.length; q++) { x += N.getX(list[q]); y += N.getY(list[q]); z += N.getZ(list[q]); }
      var l = Math.sqrt(x * x + y * y + z * z) || 1; for (q = 0; q < list.length; q++) N.setXYZ(list[q], x / l, y / l, z / l); }
    if (o.closeV) for (i = 0; i <= nu; i++) avg([i * (nv + 1), i * (nv + 1) + nv]);
    var L; if (o.pole0) { L = []; for (j = 0; j <= nv; j++) L.push(j); avg(L); }
    if (o.pole1) { L = []; for (j = 0; j <= nv; j++) L.push(nu * (nv + 1) + j); avg(L); }
    if (o.m) g.applyMatrix4(o.m);
    return g.toNonIndexed(); }
  function merge(list, extra) {
    var n = 0, i; for (i = 0; i < list.length; i++) n += list[i].attributes.position.count;
    var P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), U = new Float32Array(n * 2), o = 0;
    for (i = 0; i < list.length; i++) { var g = list[i], c = g.attributes.position.count;
      P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3);
      if (g.attributes.color) C.set(g.attributes.color.array, o * 3); else C.fill(1, o * 3, (o + c) * 3);
      if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2); o += c; }
    var out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    out.setAttribute('color', new THREE.BufferAttribute(C, 3)); out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    if (extra) extra(out); out.computeBoundingSphere(); out.computeBoundingBox(); return out; }
  function mirrorZ(g) {   // mirrored copy with corrected winding
    g = g.clone(); var keys = Object.keys(g.attributes), i, k;
    var P = g.attributes.position, N = g.attributes.normal;
    for (i = 0; i < P.count; i++) { P.setZ(i, -P.getZ(i)); N.setZ(i, -N.getZ(i)); }
    for (k = 0; k < keys.length; k++) { var A = g.attributes[keys[k]], s = A.itemSize, arr = A.array, t;
      for (i = 0; i < A.count; i += 3) for (var q = 0; q < s; q++) { t = arr[(i + 1) * s + q]; arr[(i + 1) * s + q] = arr[(i + 2) * s + q]; arr[(i + 2) * s + q] = t; } }
    return g; }
  function tube(a, b, r0, r1, paint, seg, uv) {
    var d = b.clone().sub(a), len = d.length(), g = new THREE.CylinderGeometry(r1, r0, len, seg || 6, 1); g.translate(0, len / 2, 0);
    var q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.normalize());
    return finish(g, new THREE.Matrix4().compose(a, q, new V3(1, 1, 1)), typeof paint === 'function' ? paint : solid(paint), uv); }
  function shape(pts, curve) {   // pts: [[x,y],...] or builder fn(shape)
    var s = new THREE.Shape(); if (typeof pts === 'function') pts(s); else { s.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); }
    return new THREE.ShapeGeometry(s, curve || 8); }
  function bez(p0, p1, p2, t) { var a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; return new V3(a * p0.x + b * p1.x + c * p2.x, a * p0.y + b * p1.y + c * p2.y, a * p0.z + b * p1.z + c * p2.z); }

  // ---- canvas helpers (sRGB 0–255) ----
  function rgb(h) { return [(h >> 16) & 255, (h >> 8) & 255, h & 255]; }
  function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function canvas(w, h) { var c = (typeof document !== 'undefined') ? document.createElement('canvas') : null; if (c) { c.width = w; c.height = h; } return c; }
  function texture(cv) { var t = new THREE.CanvasTexture(cv); if (THREE.SRGBColorSpace && opt.colorSpace !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4; return t; }

  /* =========================================================
     虱目魚 Chanos chanos：側扁紡錘形、尖吻小口、背藍綠腹銀白、圓鱗細密、深叉形大尾鰭
     ========================================================= */
  var FX0 = -0.47, FX1 = 0.5, F_TOP = 16, F_W = 1024, F_H = 256 + F_TOP, F_WHITE = [0.5, 1 - 4 / F_H];
  function fH(u) { var h; if (u < 0.55) { var t = u / 0.55; h = 0.03 + 0.075 * Math.pow(Math.sin(t * Math.PI / 2), 1.4); }
    else { var s = (u - 0.55) / 0.45; h = 0.105 * Math.pow(Math.max(0, 1 - Math.pow(s, 2.4)), 0.55); }
    return h * Math.sqrt(sm(0, 0.035, u)); }
  function fW(u) { return fH(u) * (0.44 + 0.08 * sm(0.62, 0.95, u)); }
  function fishPt(u, v, p) { var a = v * TAU, s = Math.sin(a), c = Math.cos(a), h = fH(u), w = fW(u);
    p.set(lerp(FX0, FX1, u), h * s * (s < 0 ? 1.04 : 0.95) - 0.006 * sm(0.86, 1, u), w * c * (1 - 0.2 * Math.max(0, s) * Math.max(0, s))); }
  function fishCanvas() {
    var cv = canvas(F_W, F_H); if (!cv) return null; var g = cv.getContext('2d'), img = g.createImageData(F_W, F_H), D = img.data;
    var back = rgb(0x24434e), upper = rgb(0x4b7380), silver = rgb(0xc6d0d4), belly = rgb(0xf4f6f3), gold = rgb(0xd9cfa6), dark = rgb(0x6f7f86);
    for (var py = 0; py < F_H; py++) {
      var v = (F_H - 0.5 - py) / 256, ny = Math.sin(v * TAU), row;
      if (ny > 0.55) row = mixc(upper, back, sm(0.55, 0.95, ny)); else if (ny > 0.15) row = mixc(silver, upper, sm(0.15, 0.55, ny)); else row = mixc(silver, belly, sm(-0.1, -0.75, ny));
      for (var px = 0; px < F_W; px++) {
        var i = (py * F_W + px) * 4;
        if (py < F_TOP) { D[i] = D[i + 1] = D[i + 2] = 255; D[i + 3] = 255; continue; }
        var u = (px + 0.5) / F_W, c = row.slice(), b = 1;
        // 圓鱗：朝尾端的弧形鱗緣
        var k = (1 - sm(0.76, 0.81, u)) * sm(0.02, 0.08, u) * (1 - 0.55 * sm(0.75, 1, Math.abs(ny)));
        if (k > 0) { var X = u * 62, ix = Math.floor(X), Y = v * 34 + (ix % 2) * 0.5, fx = X - ix, fy = Y - Math.floor(Y), d = Math.sqrt(fx * fx * 1.6 + (fy - 0.5) * (fy - 0.5));
          b *= 1 - k * (0.11 * sm(0.5, 0.62, d) * (1 - sm(0.66, 0.74, d)) - 0.05 * fx); }
        // 側線
        if (u > 0.05 && u < 0.8 && Math.abs(ny - (0.2 + 0.08 * (1 - u))) < 0.018 && fr(u * 62) < 0.55) b *= 0.84;
        // 鰓蓋：弧形邊緣與帶金屬金的頭部
        var ue = 0.8 + 0.028 * (1 - ny * ny);
        if (u > ue - 0.004 && u < ue + 0.003 && Math.abs(ny) < 0.8) b *= 0.72;
        if (u > ue) { c = mixc(c, gold, 0.18 * (1 - sm(0.2, 0.8, Math.abs(ny)))); if (u > 0.965) c = mixc(c, dark, sm(0.965, 1, u) * 0.6); }
        b *= 0.97 + 0.06 * vnoise(u * 40, v * 20);
        D[i] = Math.min(255, c[0] * b); D[i + 1] = Math.min(255, c[1] * b); D[i + 2] = Math.min(255, c[2] * b); D[i + 3] = 255; } }
    g.putImageData(img, 0, 0); return cv; }
  function finPaint(base, tip, x0, y0, len) { var a = col(base), b = col(tip); return function (x, y, z, o) { o.copy(a).lerp(b, sm(0, 1, Math.sqrt((x - x0) * (x - x0) + (y - y0) * (y - y0)) / len)); }; }
  function buildMilkfish() {
    var skin = surf(64, 36, fishPt, null, { closeV: true, pole0: true, pole1: true, uv: function (u, v) { return [u, v * 256 / F_H]; } });
    var W = F_WHITE, parts = [skin];
    // 背鰭：鐮刀形
    parts.push(finish(shape(function (s) { s.moveTo(0.135, 0.09); s.quadraticCurveTo(0.11, 0.16, 0.062, 0.218); s.quadraticCurveTo(0.03, 0.14, -0.025, 0.092); s.lineTo(0.135, 0.09); }),
      null, finPaint(0x5d7883, 0x2c3d44, 0.06, 0.09, 0.13), W));
    // 臀鰭
    parts.push(finish(shape(function (s) { s.moveTo(-0.185, -0.074); s.quadraticCurveTo(-0.215, -0.12, -0.262, -0.135); s.quadraticCurveTo(-0.27, -0.1, -0.3, -0.058); s.lineTo(-0.185, -0.074); }),
      null, finPaint(0xb9c5c9, 0x7a8a90, -0.24, -0.068, 0.07), W));
    var pecShape = function (s) { s.moveTo(0.01, 0.012); s.quadraticCurveTo(-0.07, 0.024, -0.15, -0.004); s.quadraticCurveTo(-0.07, -0.014, 0.01, -0.012); s.lineTo(0.01, 0.012); };
    var pec = [], pivPec = [];
    for (var sd = 1; sd >= -1; sd -= 2) {
      // 腹鰭（靜態）
      parts.push(finish(shape(pecShape), mul(M4(-0.015, -0.094, sd * 0.014, sd * 0.55, sd * 0.25, -0.15), M4(0, 0, 0, 0, 0, 0, 0.7, 0.8, 1)), finPaint(0xdfe5e6, 0xa9b6ba, 0, 0, 0.11), W));
      // 胸鰭（可動）
      var pv = new V3(0.31, -0.056, sd * 0.034); pivPec.push(pv);
      pec.push(finish(shape(pecShape), mul(M4(pv.x, pv.y, pv.z, sd * 0.42, sd * 0.3, -0.18), M4(0, 0, 0, 0, 0, 0, 0.85, 1, 1)), finPaint(0xdde3e4, 0x9eadb2, 0, 0, 0.13), W));
      // 眼睛：大眼，外覆脂眼瞼（銀白虹膜＋黑瞳）
      var eye = new THREE.SphereGeometry(0.021, 18, 12);
      parts.push(finish(eye, M4(0.402, 0.012, sd * 0.0225, 0, sd > 0 ? 0.22 : Math.PI - 0.22, 0), function (x, y, z, o) { var t = z / 0.021;
        if (t > 0.62) o.set(0.02, 0.02, 0.025); else if (t > 0.3) o.copy(col(0xd8cda2)); else o.copy(col(0xdfe3e2)); }, W));
    }
    // 小口
    parts.push(finish(new THREE.SphereGeometry(1, 10, 6), M4(0.493, -0.009, 0, 0, 0, 0.1, 0.012, 0.0035, 0.016), solid(0x3b3f40), W));
    // 尾鰭：深叉形
    var tail = finish(shape(function (s) { s.moveTo(0.012, 0.03); s.quadraticCurveTo(-0.12, 0.07, -0.34, 0.236); s.quadraticCurveTo(-0.235, 0.09, -0.168, 0.0);
      s.quadraticCurveTo(-0.235, -0.09, -0.34, -0.236); s.quadraticCurveTo(-0.12, -0.07, 0.012, -0.03); s.lineTo(0.012, 0.03); }, 12), null, function (x, y, z, o) {
      var d = Math.sqrt(x * x + y * y * 0.6) / 0.34; o.copy(col(0xaab8bd)).lerp(col(0x5a6a70), sm(0.15, 0.75, d)).lerp(col(0x26323a), sm(0.82, 1.0, d) * 0.8); }, W);
    return { skinParts: parts, pec: pec, pivPec: pivPec, tail: tail, TAIL_X: -0.455 };
  }

  /* =========================================================
     草蝦（斑節蝦 Penaeus monodon）：深褐近黑、腹節黃白橫帶、額角上 7 齒下 3 齒、
     觸鬚長而有節紋、尾扇藍色鑲黃邊與紅緣、步足紅褐
     ========================================================= */
  function buildPrawn() {
    var items = [];   // {g, node, leg, pv}
    function add(g, node, leg, pv) { items.push({ g: g, node: node || 'body', leg: leg === undefined ? -1 : leg, pv: pv || new V3() }); }
    // 頭胸甲
    var cTop = col(0x262b2c), cSide = col(0x3a3e36), cBelly = col(0x8e8466), cMott = col(0x4a5560);
    add(surf(22, 26, function (u, v, p) { var a = v * TAU, s = Math.sin(a), c = Math.cos(a), x = lerp(0.02, 0.275, u);
      var h = 0.064 * Math.pow(Math.max(0, 1 - Math.pow(u, 2.6)), 0.45) * (1 - 0.1 * u), w = 0.058 * Math.pow(Math.max(0, 1 - Math.pow(u, 2.2)), 0.5);
      p.set(x, 0.034 + 0.016 * u + h * s * (s > 0 ? 1 : 0.8) + (s > 0 ? 0.007 * Math.pow(s, 10) : 0), w * c * (1 - 0.1 * Math.max(0, s))); },
      function (u, v, p, o) { var s = Math.sin(v * TAU); o.copy(cSide).lerp(cTop, sm(0.2, 0.8, s)).lerp(cBelly, sm(-0.3, -0.85, s));
        var n = vnoise(u * 9, v * 14); if (n > 0.6 && s > -0.3) o.lerp(cMott, (n - 0.6) * 1.6);
        if (Math.abs(s - 0.05 - 0.25 * u) < 0.06 && u > 0.25 && u < 0.85) o.lerp(col(0x6b6a48), 0.45);   // 頭胸甲側面淡色斜紋
        if (s > 0.97) o.lerp(col(0x7a6040), 0.5); if (Math.abs(u - 0.42 + 0.1 * s) < 0.015 && s > -0.2) o.multiplyScalar(0.6);   // 背脊、頸溝
      }, { closeV: true, pole1: true }));
    // 額角（鋸齒）
    var rp = [[0.248, 0.083]], tx;
    for (var t = 0; t < 7; t++) { tx = 0.26 + t * 0.016; rp.push([tx, 0.093 + t * 0.0004], [tx + 0.006, 0.1 + t * 0.0003], [tx + 0.009, 0.094]); }
    rp.push([0.395, 0.088], [0.36, 0.08]);
    for (t = 0; t < 3; t++) { tx = 0.345 - t * 0.022; rp.push([tx, 0.079], [tx - 0.006, 0.072], [tx - 0.011, 0.077]); }
    rp.push([0.26, 0.072]);
    add(finish(shape(rp), null, function (x, y, z, o) { o.copy(col(0x3a3a2e)).lerp(col(0x7a3c2a), sm(0.33, 0.395, x)); }));
    // 眼柄與複眼
    for (var sd = 1; sd >= -1; sd -= 2) {
      add(tube(new V3(0.266, 0.064, sd * 0.014), new V3(0.286, 0.071, sd * 0.034), 0.0075, 0.0065, 0x5a5440, 7));
      add(finish(new THREE.SphereGeometry(0.0135, 12, 9), M4(0.29, 0.073, sd * 0.04), function (x, y, z, o) { o.setRGB(0.03, 0.03, 0.03); if (y > 0.008 && x > 0.004) o.setRGB(0.25, 0.27, 0.3); }));
    }
    // 腹節六節
    var segs = [];
    for (var k = 0; k < 6; k++) {
      var r = 0.062 * (1 - k * 0.1), xk = 0.004 - k * 0.056 - (k === 5 ? 0.006 : 0), yk = 0.034 - k * k * 0.005, th = 0.085 * k, L = k === 5 ? 0.05 : 0.032;
      var m = M4(xk, yk, 0, 0, 0, th); segs.push({ m: m, r: r });
      (function (r, L) {
        add(surf(12, 24, function (u, v, p) { var a = v * TAU, s = Math.sin(a), c = Math.cos(a), h = r * (0.95 + 0.05 * sm(0, 0.35, u)) * (1 - 0.04 * sm(0.75, 1, u));
          p.set(lerp(-L, 0.03, u), h * s * (s > 0 ? 1 : 0.86), r * 0.95 * c * (1 + 0.24 * Math.max(0, -s)) * (s < -0.2 ? 0.96 : 1)); },
          function (u, v, p, o) { var s = Math.sin(v * TAU);
            var n = vnoise(u * 6 + v * 3, v * 18);
            if (u < (L > 0.04 ? 0.1 : 0.14)) o.copy(col(0xbfa862)).lerp(col(0xd8c88c), sm(0.5, 1, s) * 0.4); else o.copy(col(0x363a33)).lerp(col(0x1f2426), sm(0.1, 0.7, s)).lerp(col(0x445566), n * 0.25);
            if (u > 0.14 && u < 0.2 && L < 0.04) o.lerp(col(0x4c6a80), 0.45);
            if (s < -0.6) o.lerp(col(0xa89a76), sm(-0.6, -0.95, s) * 0.8); }, { closeV: true, m: m }), 'abd' + k);
      })(r, L);
    }
    // 尾節與尾肢（尾扇）
    var tm = mul(segs[5].m, M4(-0.05, -0.002, 0, 0, 0, 0.1));
    function fan(len, wid, ang, sd) { return finish(shape(function (s) { s.moveTo(0, 0.005); s.quadraticCurveTo(-len * 0.45, wid, -len, wid * 0.3); s.quadraticCurveTo(-len * 0.7, -wid * 0.4, 0, -0.005); s.lineTo(0, 0.005); }, 10),
      mul(tm, M4(0, -0.01, sd * 0.006, sd * 0.35, sd * ang, 0), M4(0, 0, 0, Math.PI / 2, 0, 0)), function (x, y, z, o) { var d = -x / len;
        o.copy(col(0x2c3836)).lerp(col(0x2b5a7c), sm(0.15, 0.55, d)).lerp(col(0xd8b44a), sm(0.72, 0.84, d) * 0.9).lerp(col(0xb0412c), sm(0.88, 1, d)); }); }
    for (sd = 1; sd >= -1; sd -= 2) { add(fan(0.16, 0.042, 0.42, sd), 'tel'); add(fan(0.145, 0.034, 0.16, sd), 'tel'); }
    add(finish(shape([[0, 0.013], [-0.14, 0.0], [0, -0.013]]), mul(tm, M4(0, -0.002, 0, Math.PI / 2 + 0.15, 0, 0)), function (x, y, z, o) { o.copy(col(0x3a4441)).lerp(col(0x8a3a28), sm(0.09, 0.14, -x)); }), 'tel');
    // 步足五對（前三對帶小螯），以根部為軸擺動
    var legCol = function (x0) { return function (x, y, z, o) { o.copy(col(0x8c6a4a)).lerp(col(0xb4723c), sm(0.0, -0.05, y)).lerp(col(0xd8a060), sm(-0.06, -0.085, y)); }; };
    for (sd = 1; sd >= -1; sd -= 2) for (k = 0; k < 5; k++) {
      var bx = 0.205 - k * 0.039, base = new V3(bx, 0.004, sd * 0.032), knee = new V3(bx + 0.03 - k * 0.006, -0.036, sd * 0.07), tip = new V3(bx + 0.03 - k * 0.016, -0.085, sd * 0.082);
      var ph = k + (sd > 0 ? 0 : 3.49), nm = 'leg' + k + (sd > 0 ? 'L' : 'R');
      add(tube(base, knee, 0.005, 0.0042, legCol(), 5), nm, ph, base); add(tube(knee, tip, 0.0038, 0.002, legCol(), 5), nm, ph, base);
      if (k < 3) { add(tube(tip, tip.clone().add(new V3(0.012, 0.004, 0)), 0.003, 0.0012, 0xd8a868, 4), nm, ph, base); add(tube(tip, tip.clone().add(new V3(0.011, -0.002, sd * 0.004)), 0.0028, 0.001, 0xd8a868, 4), nm, ph, base); }
    }
    // 第三顎足
    for (sd = 1; sd >= -1; sd -= 2) add(tube(new V3(0.245, -0.004, sd * 0.02), new V3(0.3, -0.03, sd * 0.03), 0.0042, 0.002, 0x9a6a46, 5));
    // 腹肢（游泳足）五對，接在各腹節下方
    var v0 = new V3();
    for (sd = 1; sd >= -1; sd -= 2) for (k = 0; k < 5; k++) {
      var b0 = new V3(-0.002, -segs[k].r * 0.78, sd * 0.024).applyMatrix4(segs[k].m), e0 = b0.clone().add(new V3(-0.016, -0.03, sd * 0.01)), nm2 = 'swm' + k + (sd > 0 ? 'L' : 'R');
      add(tube(b0, e0, 0.006, 0.004, 0xb5793f, 5), nm2, 10 + k, b0);
      add(finish(shape([[0, 0.006], [-0.03, 0.002], [-0.03, -0.002], [0, -0.006]]), mul(M4(e0.x, e0.y, e0.z, 0, 0, -1.9), M4(0, 0, 0, 0, sd * 0.25, 0)), function (x, y, z, o) { o.copy(col(0xc6844a)).lerp(col(0xe8c08a), sm(0, -0.03, x)); }), nm2, 10 + k, b0);
    }
    // 第一觸角（短，兩鞭）、觸角鱗片、第二觸角（長鞭有節紋，可擺動）
    for (sd = 1; sd >= -1; sd -= 2) {
      for (var f = 0; f < 2; f++) { var a0 = new V3(0.3, 0.06, sd * 0.012), a1 = new V3(0.37, 0.085 + f * 0.01, sd * (0.02 + f * 0.012)), a2 = new V3(0.4, 0.07 - f * 0.02, sd * (0.05 + f * 0.03)), last = a0;
        for (t = 1; t <= 5; t++) { var pt = bez(a0, a1, a2, t / 5); add(tube(last, pt, 0.0028, 0.002, 0x8c6040, 4)); last = pt; } }
      add(finish(shape(function (s) { s.moveTo(0, 0.004); s.quadraticCurveTo(0.05, 0.022, 0.095, 0.006); s.quadraticCurveTo(0.05, -0.008, 0, -0.004); s.lineTo(0, 0.004); }),
        M4(0.285, 0.036, sd * 0.038, sd * 1.25, sd * -0.2, 0.08), function (x, y, z, o) { o.copy(col(0x5c6050)).lerp(col(0xd0b884), sm(0.05, 0.095, x)); }));
      var b1 = new V3(0.292, 0.046, sd * 0.026), q1 = new V3(0.46, 0.13, sd * 0.13), q2 = new V3(-0.55, 0.075, sd * 0.3), prev = b1, ant = 'ant' + (sd > 0 ? 'L' : 'R');
      for (t = 1; t <= 18; t++) { var pp = bez(b1, q1, q2, t / 18); add(tube(prev, pp, 0.0045 * (1 - t / 22), 0.0045 * (1 - (t + 1) / 22), t % 2 ? 0x7a4632 : 0xc8955e, 4), ant, sd > 0 ? 20 : 21, b1); prev = pp; }
    }
    var nodes = [{ name: 'body', parent: null, pivot: new V3() }];
    for (k = 0; k < 6; k++) nodes.push({ name: 'abd' + k, parent: k ? 'abd' + (k - 1) : 'body', pivot: new V3(0.03, segs[k].r * 0.55, 0).applyMatrix4(segs[k].m) });
    nodes.push({ name: 'tel', parent: 'abd5', pivot: new V3(0, 0, 0).applyMatrix4(tm) });
    items.forEach(function (it) { if (!nodes.some(function (n) { return n.name === it.node; })) {
      var par = /^swm(\d)/.exec(it.node); nodes.push({ name: it.node, parent: par ? 'abd' + par[1] : 'body', pivot: it.pv.clone() }); } });
    var geo = merge(items.map(function (it) { return it.g; }), function (g) {
      var n = g.attributes.position.count, aLeg = new Float32Array(n), aPv = new Float32Array(n * 3), o = 0;
      items.forEach(function (it) { var c = it.g.attributes.position.count; for (var i = 0; i < c; i++) { aLeg[o + i] = it.leg; aPv[(o + i) * 3] = it.pv.x; aPv[(o + i) * 3 + 1] = it.pv.y; aPv[(o + i) * 3 + 2] = it.pv.z; } o += c; });
      g.setAttribute('aLeg', new THREE.BufferAttribute(aLeg, 1)); g.setAttribute('aPivot', new THREE.BufferAttribute(aPv, 3)); });
    return { geo: geo, items: items, nodes: nodes };
  }

  /* =========================================================
     文蛤（台灣文蛤 Meretrix lusoria）：圓三角形、殼頂偏前、殼面平滑有光澤、
     灰白至黃褐底色上有褐色鋸齒（山形）花紋與生長紋，後背緣紫褐
     ========================================================= */
  var K_TOP = 16, K_W = 256, K_H = 512 + K_TOP, K_WHITE = [0.5, 1 - 4 / K_H], UMBO = new V3(0.08, 0.02, 0), CD = 0.2;
  function margin(v, o) { var th = Math.PI / 2 - v * TAU, s = Math.sin(th), c = Math.cos(th), sp = Math.pow(Math.max(0, s), 1.25);
    var x = 0.5 * c * (1 - 0.8 * sp) + UMBO.x * sp; if (c < 0) x = UMBO.x * sp + (x - UMBO.x * sp) * 1.08;
    return o.set(x, -0.38 + (0.38 + UMBO.y) * s, 0); }
  var _m = new V3();
  function valvePt(u, v, p, inner) { margin(v, _m); var b = Math.pow(1 - u, 4);
    p.set(UMBO.x + (_m.x - UMBO.x) * u + 0.025 * b, UMBO.y + (_m.y - UMBO.y) * u + 0.03 * b,
      CD * Math.pow(Math.max(0, 1 - u * u), 0.55) * (0.06 + 0.94 * Math.sin(Math.PI / 2 * Math.min(1, u * 2.0))) * lerp(1, Math.pow(sm(0.02, 0.55, Math.hypot(_m.x - UMBO.x, _m.y - UMBO.y)), 0.7), sm(0, 0.6, u)));
    if (inner) { p.x = 0.02 + (p.x - 0.02) * 0.965; p.y = -0.37 + (p.y + 0.37) * 0.965; p.z = p.z * 0.84 + 0.002; } }
  function clamCanvas() {
    var cv = canvas(K_W, K_H); if (!cv) return null; var g = cv.getContext('2d'), img = g.createImageData(K_W, K_H), D = img.data;
    var pale = rgb(0xe6dcc6), base = rgb(0xcdb995), brown = rgb(0x6b4528), purple = rgb(0x6a4c58), rim = rgb(0x5b402c), band = rgb(0x9c7c5a), lilac = rgb(0xd9c6c8);
    for (var py = 0; py < K_H; py++) { var v = (K_H - 0.5 - py) / 512;
      for (var px = 0; px < K_W; px++) { var i = (py * K_W + px) * 4;
        if (py < K_TOP) { D[i] = D[i + 1] = D[i + 2] = 255; D[i + 3] = 255; continue; }
        var u = (px + 0.5) / K_W, c = mixc(pale, base, sm(0, 0.8, u)), b = 1;
        // 山形鋸齒花紋（在花紋斑塊內較濃）
        var patch = sm(0.3, 0.75, vnoise(v * 7, u * 3.5)), fq = 6 + 3 * vnoise(v * 3 + 7, 1.3), zig = Math.abs(fr(v * 17 + vnoise(u * 4, v * 9) * 0.6 + Math.abs(fr(u * fq) - 0.5) * 1.5) - 0.5);
        var mark = (1 - sm(0.04, 0.11, zig)) * patch * sm(0.12, 0.3, u), wash = sm(0.45, 0.8, vnoise(v * 4 + 3, u * 2)) * sm(0.2, 0.5, u);
        c = mixc(c, brown, mark * 0.6); c = mixc(c, band, wash * 0.35);
        // 生長紋與幾條明顯生長帶
        if (fr(u * 48) < 0.14) b *= 0.95;
        var gb = Math.exp(-Math.pow((u - 0.52) / 0.012, 2)) + Math.exp(-Math.pow((u - 0.74) / 0.01, 2)) + Math.exp(-Math.pow((u - 0.9) / 0.008, 2));
        c = mixc(c, band, cl(gb) * 0.45);
        // 後背緣紫褐、殼頂淡紫、腹緣深色邊
        c = mixc(c, purple, sm(0.8, 0.97, v) * sm(0.15, 0.5, u) * 0.6);
        c = mixc(c, lilac, (1 - sm(0.02, 0.12, u)) * 0.6);
        c = mixc(c, rim, sm(0.955, 0.995, u) * 0.75);
        b *= 0.96 + 0.08 * vnoise(u * 30, v * 50);
        D[i] = Math.min(255, c[0] * b); D[i + 1] = Math.min(255, c[1] * b); D[i + 2] = Math.min(255, c[2] * b); D[i + 3] = 255; } }
    g.putImageData(img, 0, 0); return cv; }
  function buildClam(lo) {
    var nu = lo ? 10 : 26, nv = lo ? 24 : 64, uvf = function (u, v) { return [u, v * 512 / K_H]; };
    var outer = surf(nu, nv, function (u, v, p) { valvePt(u, v, p, false); }, null, { pole0: true, uv: uvf });
    if (lo) return { outer: outer };
    var porc = col(0xf3efe8), scar = col(0xa58aa0);
    var inner = surf(nu, nv, function (u, v, p) { valvePt(u, v, p, true); }, function (u, v, p, o) { o.copy(porc).lerp(scar, sm(0.82, 0.98, v) * sm(0.5, 0.8, u) * 0.7).lerp(col(0xcfc0a8), sm(0.9, 1, u) * 0.5); },
      { pole0: true, flip: true, uv: function () { return K_WHITE; } });
    var rim = surf(2, nv, function (u, v, p) { var a = new V3(), b = new V3(); valvePt(1, v, a, false); valvePt(1, v, b, true); p.copy(a).lerp(b, u); }, function (u, v, p, o) { o.copy(col(0x8a6e58)).lerp(porc, u); },
      { flip: true, uv: function () { return K_WHITE; } });
    var valveL = merge([outer, inner, rim]), valveR = mirrorZ(valveL);
    var W = K_WHITE;
    // 斧足：舌狀，粉白
    var foot = merge([finish(new THREE.SphereGeometry(1, 18, 12), M4(0.18, 0, 0, 0, 0, 0, 0.22, 0.1, 0.07), function (x, y, z, o) { o.copy(col(0xf2dccb)).lerp(col(0xe2ad98), sm(0.1, 0.38, x)); }, W)]);
    // 水管：入水管與出水管同形，管口有一圈褐色觸毛
    var sp = [finish(new THREE.CylinderGeometry(0.03, 0.038, 0.26, 14, 6, true), M4(0, 0.13, 0), function (x, y, z, o) { o.copy(col(0xe0cfae)).lerp(col(0xa4825c), sm(0.08, 0.26, y) * 0.6); if (Math.abs(fr(y * 30) - 0.5) < 0.12) o.multiplyScalar(0.93); }, W),
      finish(new THREE.TorusGeometry(0.032, 0.007, 6, 14), M4(0, 0.262, 0, Math.PI / 2, 0, 0), solid(0x7e5e3e), W)];
    for (var i = 0; i < 12; i++) { var a = i / 12 * TAU, tip = new V3(Math.cos(a) * 0.05, 0.3, Math.sin(a) * 0.05); sp.push(tube(new V3(Math.cos(a) * 0.03, 0.262, Math.sin(a) * 0.03), tip, 0.0055, 0.0015, 0x5e4430, 4, W)); }
    var siphon = merge(sp);
    // 外套膜（開殼時在兩殼之間可見）
    var mp = []; for (i = 0; i <= 48; i++) { margin(i / 48, _m); mp.push([_m.x * 0.94 + UMBO.x * 0.06, _m.y * 0.94 + UMBO.y * 0.06]); }
    var mantle = merge([finish(shape(mp), null, function (x, y, z, o) { var ry = (y + 0.38) / 0.38; o.copy(col(0xc9b08a)).lerp(col(0x6e5034), sm(0.7, 0.98, Math.sqrt(x * x / 0.25 + ry * ry))); }, W)]);
    mantle = merge([mantle, mirrorZ(mantle)]);
    return { valveL: valveL, valveR: valveR, foot: foot, siphon: siphon, mantle: mantle };
  }
  function closedClam() { var lo = buildClam(true).outer; return merge([lo, mirrorZ(lo)]); }

  var mf = buildMilkfish(), pw = buildPrawn(), ck = buildClam(false);
  var fishCv = fishCanvas(), clamCv = clamCanvas();
  var out = {
    milkfish: { body: merge(mf.skinParts.concat(mf.pec)), tail: merge([mf.tail]), TAIL_X: mf.TAIL_X, canvas: fishCv, uvWhite: F_WHITE },
    prawn: { geo: pw.geo },
    clam: { valveL: ck.valveL, valveR: ck.valveR, foot: ck.foot, siphon: ck.siphon, mantle: ck.mantle, closed: closedClam(), canvas: clamCv, uvWhite: K_WHITE },
    texture: texture
  };

  /* ---------------- 節點動畫版（.glb） ---------------- */
  function sample(dur, n, fn) { var t = [], v = []; for (var i = 0; i <= n; i++) { t.push(dur * i / n); v.push(fn(i / n)); } return { t: t, v: v }; }
  out.rig = function (kind, ro) {
    ro = ro || {};
    var mats = ro.materials || {}, P = { milkfish: 'Milkfish_', prawn: 'Prawn_', clam: 'Clam_' }[kind];
    function stdMat(o) { return new THREE.MeshStandardMaterial(o); }
    var root = new THREE.Group(), inner = new THREE.Group(); root.name = P.replace('_', ''); inner.name = P + 'model'; root.add(inner);
    var nodes = {}, spec;
    function addNode(name, parent, pivot) { var g = new THREE.Group(); g.name = P + name; var par = parent ? nodes[parent] : null;
      g.position.copy(pivot).sub(par ? par.pivot : new V3()); (par ? par.g : inner).add(g); nodes[name] = { g: g, pivot: pivot.clone(), rest: g.position.clone() }; return g; }
    function addMesh(node, geo, mat, name) { var g = geo.clone(); g.translate(-nodes[node].pivot.x, -nodes[node].pivot.y, -nodes[node].pivot.z);
      var m = new THREE.Mesh(g, mat); m.name = P + (name || node) + '_mesh'; nodes[node].g.add(m); return m; }
    var clips = [];
    function Q(node, s, f, rest) { var q = new THREE.Quaternion(), e = new THREE.Euler(), vals = [], r = rest || [0, 0, 0];
      s.v.forEach(function (x) { var a = f(x); e.set(a[0] + r[0], a[1] + r[1], a[2] + r[2]); q.setFromEuler(e); vals.push(q.x, q.y, q.z, q.w); });
      return new THREE.QuaternionKeyframeTrack(P + node + '.quaternion', s.t, vals); }
    function Pos(node, s, f) { var r = nodes[node].rest, vals = []; s.v.forEach(function (x) { var a = f(x); vals.push(r.x + a[0], r.y + a[1], r.z + a[2]); });
      return new THREE.VectorKeyframeTrack(P + node + '.position', s.t, vals); }
    function Sc(node, s, f) { var vals = []; s.v.forEach(function (x) { var a = f(x); vals.push(a[0], a[1], a[2]); }); return new THREE.VectorKeyframeTrack(P + node + '.scale', s.t, vals); }
    function clip(name, dur, tracks) { clips.push(new THREE.AnimationClip(name, dur, tracks)); }

    if (kind === 'milkfish') {
      var tex = texture(fishCv); tex.flipY = true;
      var fm = mats.fish || stdMat({ map: tex, vertexColors: true, roughness: 0.32, metalness: 0.35, side: THREE.DoubleSide }); fm.name = 'milkfish';
      addNode('body', null, new V3()); addNode('tail', 'body', new V3(mf.TAIL_X, 0, 0)); addNode('pecL', 'body', mf.pivPec[0]); addNode('pecR', 'body', mf.pivPec[1]);
      addMesh('body', merge(mf.skinParts), fm); addMesh('tail', mf.tail, fm); addMesh('pecL', mf.pec[0], fm); addMesh('pecR', mf.pec[1], fm);
      var w;
      w = sample(1.0, 40, function (x) { return x; });
      clip('Swim', 1.0, [Q('tail', w, function (x) { return [0, 0.5 * Math.sin(x * TAU), 0]; }), Q('body', w, function (x) { return [0, -0.07 * Math.sin(x * TAU - 0.7), 0]; }),
        Q('pecL', w, function (x) { return [0, 0.22 * Math.sin(x * TAU * 2), 0]; }), Q('pecR', w, function (x) { return [0, -0.22 * Math.sin(x * TAU * 2), 0]; })]);
      w = sample(2.4, 48, function (x) { return x; });
      clip('Idle', 2.4, [Q('tail', w, function (x) { return [0, 0.16 * Math.sin(x * TAU * 2), 0]; }), Q('body', w, function (x) { return [0, -0.02 * Math.sin(x * TAU * 2 - 0.7), 0.03 * Math.sin(x * TAU)]; }),
        Pos('body', w, function (x) { return [0, 0.012 * Math.sin(x * TAU), 0]; }),
        Q('pecL', w, function (x) { return [0, 0.35 * Math.sin(x * TAU * 3), 0]; }), Q('pecR', w, function (x) { return [0, -0.35 * Math.sin(x * TAU * 3 + 0.5), 0]; })]);
      w = sample(1.8, 72, function (x) { return x; });
      clip('Jump', 1.8, [Q('tail', w, function (x) { var a = x < 0.2 ? 0.75 : x < 0.75 ? 0.35 : 0.5; return [0, a * Math.sin(x * TAU * (x < 0.2 ? 10 : 6)), 0]; }),
        Q('body', w, function (x) { var p = cl((x - 0.18) / 0.6); return [0.35 * Math.sin(Math.PI * p) * Math.sin(p * TAU), 0, (x < 0.18 ? 0.9 * sm(0, 0.18, x) : 0) + (x >= 0.18 && x < 0.78 ? 0.9 * (1 - 2 * p) : 0) + (x >= 0.78 ? -0.9 * (1 - sm(0.78, 1, x)) : 0)]; }),
        Pos('body', w, function (x) { var p = cl((x - 0.18) / 0.6), dip = x >= 0.78 ? -0.25 * Math.sin(Math.PI * cl((x - 0.78) / 0.22)) : 0; return [0.25 * Math.sin(Math.PI * p) + (x < 0.18 ? -0.08 * Math.sin(Math.PI * x / 0.18) : 0), 1.1 * 4 * p * (1 - p) + dip + (x < 0.18 ? -0.1 * Math.sin(Math.PI * x / 0.18) : 0), 0]; }),
        Q('pecL', w, function (x) { return [0, x > 0.18 && x < 0.78 ? -0.5 : 0.2 * Math.sin(x * 30), 0]; }), Q('pecR', w, function (x) { return [0, x > 0.18 && x < 0.78 ? 0.5 : -0.2 * Math.sin(x * 30), 0]; })]);
      root.rotation.y = -Math.PI / 2; root.scale.setScalar(0.35);
    } else if (kind === 'prawn') {
      var pm = mats.prawn || stdMat({ vertexColors: true, roughness: 0.42, metalness: 0.05, side: THREE.DoubleSide }); pm.name = 'prawn';
      pw.nodes.forEach(function (n) { addNode(n.name, n.parent, n.pivot); });
      var groups = {}; pw.items.forEach(function (it) { (groups[it.node] = groups[it.node] || []).push(it.g); });
      Object.keys(groups).forEach(function (k) { addMesh(k, merge(groups[k]), pm); });
      var legs = [], swims = []; for (var k2 = 0; k2 < 5; k2++) { legs.push(['leg' + k2 + 'L', k2], ['leg' + k2 + 'R', k2 + 3.49]); swims.push(['swm' + k2 + 'L', k2], ['swm' + k2 + 'R', k2]); }
      var antT = function (s, amp, sp) { return [Q('antL', s, function (x) { return [0, amp * Math.sin(x * TAU * sp), 0.05 * Math.sin(x * TAU * sp + 1)]; }), Q('antR', s, function (x) { return [0, amp * Math.sin(x * TAU * sp + 1.7), 0.05 * Math.sin(x * TAU * sp + 2.4)]; })]; };
      var s1 = sample(3.0, 60, function (x) { return x; }), tr = antT(s1, 0.12, 1);
      swims.forEach(function (q) { tr.push(Q(q[0], s1, function (x) { return [0, 0, 0.18 * Math.sin(x * TAU * 2 - q[1] * 1.1)]; })); });
      for (k2 = 0; k2 < 6; k2++) tr.push(Q('abd' + k2, s1, function (x) { return [0, 0, 0.015 * Math.sin(x * TAU)]; }));
      clip('Idle', 3.0, tr);
      var s2 = sample(1.2, 48, function (x) { return x; }); tr = antT(s2, 0.1, 1);
      legs.forEach(function (q) { tr.push(Q(q[0], s2, function (x) { return [0, 0, 0.32 * Math.sin(x * TAU - q[1] * 0.9)]; })); });
      swims.forEach(function (q) { tr.push(Q(q[0], s2, function (x) { return [0, 0, 0.12 * Math.sin(x * TAU * 2 - q[1] * 1.1)]; })); });
      tr.push(Pos('body', s2, function (x) { return [0, 0.003 * Math.sin(x * TAU * 2), 0]; }));
      clip('Walk', 1.2, tr);
      var s3 = sample(0.6, 36, function (x) { return x; }); tr = antT(s3, 0.05, 1);
      swims.forEach(function (q) { tr.push(Q(q[0], s3, function (x) { return [0, 0, 0.6 * Math.sin(x * TAU - q[1] * 1.1)]; })); });
      legs.forEach(function (q) { tr.push(Q(q[0], s3, function () { return [0, 0, -0.45]; })); });
      tr.push(Pos('body', s3, function (x) { return [0, 0.05 + 0.006 * Math.sin(x * TAU), 0]; }));
      clip('Swim', 0.6, tr);
      var s4 = sample(1.6, 96, function (x) { return x; }); tr = antT(s4, 0.05, 2);
      var curl = function (x) { return x < 0.08 ? sm(0, 0.08, x) : 1 - sm(0.08, 0.4, x); };
      for (k2 = 0; k2 < 6; k2++) tr.push(Q('abd' + k2, s4, function (x) { return [0, 0, 0.36 * curl(x)]; }));
      tr.push(Q('tel', s4, function (x) { return [0, 0, 0.5 * curl(x)]; }));
      tr.push(Pos('body', s4, function (x) { var b = sm(0, 0.35, x) * (1 - sm(0.45, 1, x)); return [-0.55 * b, 0.12 * Math.sin(Math.PI * cl(x / 0.6)), 0]; }));
      tr.push(Q('body', s4, function (x) { return [0, 0, -0.25 * Math.sin(Math.PI * cl(x / 0.5))]; }));
      legs.forEach(function (q) { tr.push(Q(q[0], s4, function (x) { return [0, 0, -0.5 * Math.sin(Math.PI * cl(x / 0.6))]; })); });
      clip('Flick', 1.6, tr);
      root.rotation.y = -Math.PI / 2; root.scale.setScalar(0.27);
    } else {
      var ctex = texture(clamCv); ctex.flipY = true;
      var cm = mats.clam || stdMat({ map: ctex, vertexColors: true, roughness: 0.28, metalness: 0.02, side: THREE.DoubleSide }); cm.name = 'clam';
      addNode('shell', null, new V3(0, -0.38, 0)); addNode('valveL', 'shell', new V3()); addNode('valveR', 'shell', new V3()); addNode('mantle', 'shell', new V3(0, -0.38, 0));
      addNode('foot', 'shell', new V3(0.12, -0.62, 0)); addNode('siphonIn', 'shell', new V3(-0.4, -0.2, 0.045)); addNode('siphonEx', 'shell', new V3(-0.38, -0.12, -0.04));
      addMesh('valveL', ck.valveL, cm); addMesh('valveR', ck.valveR, cm); addMesh('mantle', ck.mantle, cm); addMesh('foot', ck.foot, cm);
      var SIPH = ['siphonIn', 'siphonEx'];
      SIPH.forEach(function (n, j) { nodes[n].g.rotation.z = j ? 0.42 : 0.62; var m = new THREE.Mesh(ck.siphon.clone().scale(j ? 0.62 : 0.7, j ? 0.5 : 0.6, j ? 0.62 : 0.7), cm); m.name = P + n + '_mesh'; nodes[n].g.add(m); });
      var open = function (s, f) { return [Q('valveL', s, function (x) { return [-f(x), 0, 0]; }), Q('valveR', s, function (x) { return [f(x), 0, 0]; })]; };
      var ext = function (s, f) { return SIPH.map(function (n, j) { var pv = nodes[n].pivot; return Sc(n, s, function (x) { var e = Math.max(0.01, f(x, j)); return [0.5 + 0.5 * e, e, 0.5 + 0.5 * e]; }); }); };
      var ft = function (s, f) { return [Sc('foot', s, function (x) { var e = Math.max(0.01, f(x)); return [e, e, e]; })]; };
      var mant = function () { return []; };
      var c1 = sample(4, 40, function (x) { return x; });
      clip('Idle', 4, open(c1, function (x) { return 0.012 + 0.008 * Math.sin(x * TAU); }).concat(ext(c1, function () { return 0.01; }), ft(c1, function () { return 0.01; }), mant(c1, function () { return 0.01; })));
      var c2 = sample(4, 80, function (x) { return x; });
      clip('Filter', 4, open(c2, function (x) { return 0.13 + 0.012 * Math.sin(x * TAU * 2); }).concat(ext(c2, function (x, j) { return 1 + 0.07 * Math.sin(x * TAU * 2 + j * 2); }), ft(c2, function () { return 0.01; }),
        mant(c2, function () { return 1; })));
      var c3 = sample(3, 90, function (x) { return x; });
      clip('Open', 3, open(c3, function (x) { return 0.012 + 0.12 * sm(0, 0.25, x); }).concat(ext(c3, function (x, j) { return sm(0.2 + j * 0.06, 0.6 + j * 0.06, x); }), ft(c3, function () { return 0.01; }), mant(c3, function (x) { return sm(0.05, 0.3, x); })));
      var c4 = sample(1.4, 84, function (x) { return x; });
      clip('Snap', 1.4, open(c4, function (x) { return x < 0.1 ? 0.13 : 0.13 * (1 - sm(0.1, 0.16, x)) + (x > 0.16 ? 0.012 : 0); }).concat(ext(c4, function (x) { return 1 - sm(0.06, 0.16, x); }), ft(c4, function () { return 0.01; }),
        mant(c4, function (x) { return 1 - sm(0.08, 0.16, x); }), [Pos('shell', c4, function (x) { return [0, 0.06 * Math.sin(Math.PI * cl((x - 0.12) / 0.2)), 0]; })]));
      var c5 = sample(5, 150, function (x) { return x; });
      var fo = function (x) { return sm(0.05, 0.2, x) * (1 - sm(0.85, 0.97, x)); };
      clip('Dig', 5, open(c5, function (x) { return 0.012 + 0.07 * fo(x); }).concat(ext(c5, function () { return 0.01; }), mant(c5, function (x) { return fo(x); }),
        ft(c5, function (x) { var k = fo(x); return k * (0.8 + 0.25 * Math.sin(x * TAU * 4)); }),
        [Q('shell', c5, function (x) { return [0, 0, 0.18 * Math.sin(x * TAU * 4) * fo(x) - 0.5 * sm(0.15, 0.6, x) * (1 - sm(0.75, 0.97, x))]; }),
          Pos('shell', c5, function (x) { return [0.05 * sm(0.15, 0.6, x) * (1 - sm(0.75, 0.97, x)), -0.38 * sm(0.2, 0.75, x) * (1 - sm(0.8, 0.98, x)), 0]; })]));
      // 靜止姿勢＝閉殼
      SIPH.forEach(function (n) { nodes[n].g.scale.set(0.5, 0.01, 0.5); }); nodes.foot.g.scale.setScalar(0.01);
      root.rotation.y = -Math.PI / 2; root.scale.setScalar(0.056);
    }
    // 腳底（最低點）放在 y = 0
    root.updateMatrixWorld(true); var bb = new THREE.Box3().setFromObject(root); root.position.y = -bb.min.y;
    return { root: root, clips: clips };
  };
  return out;
}
if (typeof module !== 'undefined') module.exports = makeAquaculture;
