/* ==========================================================================
   SG INGENIEROS · script.js
   Sin librerías externas: todo es JavaScript propio.
   Módulos: configuración · cargador · encabezado/menú · revelado · escena 3D del
   hero (canvas) · scroll con inercia (manifiesto, expansión de imagen, galería
   anclada, método) · casa en corte · visor de fotos · inclinación 3D · formulario
   a WhatsApp.
   ========================================================================== */
(function () {
  'use strict';
  window.__sgOk = true;

  /* ---------------------------------------------------------------------- *
   * 1. CONFIGURACIÓN
   * ---------------------------------------------------------------------- */
  // Número de WhatsApp a 10 dígitos, sin +52 ni espacios. Vacío = el botón flotante
  // y el envío del formulario se ocultan y aparece un aviso elegante.
  var WHATSAPP_NUMBER = '';
  var NOMBRE_NEGOCIO = 'SG Ingenieros';

  var doc = document;
  var root = doc.documentElement;
  var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FINE = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function pad(n, l) { var s = String(Math.round(n)); while (s.length < l) { s = '0' + s; } return s; }

  function waUrl(text) {
    var d = String(WHATSAPP_NUMBER || '').replace(/\D/g, '');
    if (!d) { return ''; }
    if (d.length === 10) { d = '52' + d; }
    return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  /* ---------------------------------------------------------------------- *
   * 2. CARGADOR (máx. ~2 s; el CSS tiene un respaldo si este código falla)
   * ---------------------------------------------------------------------- */
  var loader = $('#loader');
  var ldDone = false;
  function finishLoader() {
    if (ldDone) { return; }
    ldDone = true;
    root.classList.add('is-ready');
    if (loader) {
      loader.classList.add('is-done');
      setTimeout(function () { if (loader && loader.parentNode) { loader.parentNode.removeChild(loader); } }, 700);
    }
  }
  (function initLoader() {
    if (!loader || RM) { finishLoader(); return; }
    var num = $('#ld-num');
    var txt = $('#ld-text');
    var frases = ['Trazando plano', 'Midiendo cotas', 'Energizando circuitos', 'Listo para construir'];
    var t0 = performance.now();
    var DUR = 1500;
    function tick(now) {
      var t = clamp((now - t0) / DUR, 0, 1);
      if (num) { num.textContent = Math.round(easeOut(t) * 100); }
      if (txt) { txt.textContent = frases[Math.min(frases.length - 1, Math.floor(t * frases.length))]; }
      if (t < 1) { requestAnimationFrame(tick); } else { setTimeout(finishLoader, 120); }
    }
    requestAnimationFrame(tick);
    setTimeout(finishLoader, 1950);
  })();

  /* ---------------------------------------------------------------------- *
   * 3. ENCABEZADO Y MENÚ MÓVIL
   * ---------------------------------------------------------------------- */
  var header = $('.site-header');
  var menu = $('#menu');
  var burger = $('#burger');
  function setMenu(open) {
    if (!menu || !burger) { return; }
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    root.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    $$('nav a span', menu).forEach(function (s) { s.setAttribute('aria-hidden', 'true'); });   // el número "01" no se lee con el nombre del enlace
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 960) { setMenu(false); } });
  }

  /* ---------------------------------------------------------------------- *
   * 4. REVELADO AL ENTRAR EN PANTALLA + CONTADORES + NAV ACTIVA
   * ---------------------------------------------------------------------- */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !RM) {
    var ioReveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ioReveal.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { ioReveal.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  var counters = $$('[data-count]');
  function runCount(el) {
    var end = parseFloat(el.getAttribute('data-count')) || 0;
    var t0 = performance.now();
    var dur = 1700;
    function step(now) {
      var t = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(end * easeOut(t));
      if (t < 1) { requestAnimationFrame(step); }
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !RM) {
    counters.forEach(function (el) { el.textContent = '0'; });
    var ioCount = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); ioCount.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { ioCount.observe(el); });
  }

  if ('IntersectionObserver' in window) {
    var navLinks = $$('.nav a');
    var ioNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = '#' + en.target.id;
          navLinks.forEach(function (a) {
            if (a.getAttribute('href') === id) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });   // franja central: funciona también con la galería anclada (muy alta)
    ['servicios', 'obras', 'metodo', 'por-que', 'faq', 'contacto'].forEach(function (id) {
      var s = doc.getElementById(id);
      if (s) { ioNav.observe(s); }
    });
  }

  /* ---------------------------------------------------------------------- *
   * 5. ESCENA 3D DEL HERO (canvas 2D con proyección en perspectiva propia)
   *    Una casa de dos niveles en alambre gira sin parar; por sus
   *    instalaciones corren pulsos de electricidad (naranja) y agua (azul),
   *    un plano de escaneo sube y baja y la rejilla emite ondas.
   * ---------------------------------------------------------------------- */
  function HeroScene(canvas, stage) {
    var ctx = canvas.getContext('2d');
    if (!ctx) { return null; }

    var V = [];
    var E = [];
    var P = [];
    var W = 0, H = 0, dpr = 1, u = 40, ox = 0, oy = 0, mobile = false;
    var t = 0, last = 0, raf = 0, running = false, introT = 0, intro = 0, fade = 0;
    var mx = 0.5, my = 0.5, mxS = 0.5, myS = 0.5, yaw = 0, pitch = -0.36;
    var CX = 0.8, CY = 1.5;
    var COL = ['120,175,255', '255,138,61', '95,200,255'];
    var particles = [];
    var hudYaw = $('#hud-yaw');
    var frameN = 0;
    var staticMode = false;

    function box(x0, y0, z0, x1, y1, z1, tag) {
      var i = V.length;
      V.push([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (p) {
        E.push([i + p[0], i + p[1], tag]);
      });
    }
    function poly(pts, tag, closed) {
      var i = V.length;
      pts.forEach(function (p) { V.push(p); });
      for (var k = 0; k < pts.length - 1; k++) { E.push([i + k, i + k + 1, tag]); }
      if (closed) { E.push([i + pts.length - 1, i, tag]); }
      return i;
    }
    function ring(cx, cy, cz, r, n, tag) {
      var pts = [];
      for (var k = 0; k < n; k++) {
        var a = (k / n) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r]);
      }
      return poly(pts, tag, true);
    }
    function seg(a, b, tag) { poly([a, b], tag, false); }

    /* --- Geometría de la casa --- */
    box(-2.7, -0.16, -2.1, 2.7, 0, 2.1, 0);               // losa de cimentación
    box(-2, 0, -1.5, 2, 2.6, 1.5, 0);                     // cuerpo de la casa
    poly([[-2, 1.3, -1.5], [2, 1.3, -1.5], [2, 1.3, 1.5], [-2, 1.3, 1.5]], 0, true); // entrepiso
    box(-2.1, 2.6, -1.6, 2.1, 2.9, 1.6, 0);               // pretil de azotea
    // tinaco
    var a0 = ring(-1, 3.15, 0.2, 0.5, 16, 0);
    var a1 = ring(-1, 4.0, 0.2, 0.5, 16, 0);
    [0, 4, 8, 12].forEach(function (k) {
      E.push([a0 + k, a1 + k, 0]);
      var p = V[a0 + k];
      seg([p[0], 2.9, p[2]], p, 0);
    });
    ring(-1, 4.12, 0.2, 0.28, 12, 0);
    // calentador solar
    var s0 = poly([[0.4, 2.95, 0.55], [1.7, 2.95, 0.55], [1.7, 3.6, -0.5], [0.4, 3.6, -0.5]], 1, true);
    for (var k = 1; k < 6; k++) {
      var sx = 0.4 + k * (1.3 / 6);
      seg([sx, 2.95, 0.55], [sx, 3.6, -0.5], 1);
    }
    // ventanas, puerta y tablero medidor
    poly([[-1.6, 1.65, 1.5], [-0.6, 1.65, 1.5], [-0.6, 2.3, 1.5], [-1.6, 2.3, 1.5]], 0, true);
    poly([[0.6, 1.65, 1.5], [1.6, 1.65, 1.5], [1.6, 2.3, 1.5], [0.6, 2.3, 1.5]], 0, true);
    poly([[-1.6, 0.5, 1.5], [-0.6, 0.5, 1.5], [-0.6, 1.0, 1.5], [-1.6, 1.0, 1.5]], 0, true);
    poly([[0.2, 0, 1.5], [0.9, 0, 1.5], [0.9, 1.15, 1.5], [0.2, 1.15, 1.5]], 0, true);
    poly([[2, 0.6, -0.1], [2, 0.6, 0.8], [2, 1.25, 0.8], [2, 1.25, -0.1]], 1, true);
    // cisterna enterrada
    box(2.9, -1.1, -0.75, 4.3, -0.16, 0.75, 2);
    poly([[2.9, -0.55, -0.75], [4.3, -0.55, -0.75], [4.3, -0.55, 0.75], [2.9, -0.55, 0.75]], 2, true);

    /* --- Recorridos de las instalaciones --- */
    function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2]; return Math.sqrt(dx * dx + dy * dy + dz * dz); }
    function makePath(pts) {
      var segs = [], total = 0;
      for (var i = 0; i < pts.length - 1; i++) { var d = dist(pts[i], pts[i + 1]); segs.push(d); total += d; }
      return { pts: pts, segs: segs, total: total };
    }
    function at(path, s) {
      s = ((s % path.total) + path.total) % path.total;
      var i = 0;
      while (i < path.segs.length - 1 && s > path.segs[i]) { s -= path.segs[i]; i++; }
      var a = path.pts[i], b = path.pts[i + 1], k = path.segs[i] ? s / path.segs[i] : 0;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    var elecPath = makePath([[2.02, 0.95, 0.35], [2.02, 2.9, 0.35], [1.0, 2.9, 0.35]]);
    var waterPath = makePath([[2.9, -0.55, 0], [-1, -0.55, 0], [-1, 2.9, 0.2], [-1, 3.15, 0.2]]);
    var pulses = [];
    [[elecPath, 1.5, 1], [waterPath, 1.2, 2]].forEach(function (d) {
      for (var k = 0; k < 5; k++) { pulses.push({ path: d[0], speed: d[1], off: (k * d[0].total) / 5, tag: d[2] }); }
    });

    /* --- Proyección en perspectiva --- */
    function proj(p) {
      var x = p[0] - CX, y = p[1] - CY, z = p[2];
      var cs = Math.cos(yaw), sn = Math.sin(yaw);
      var X = x * cs + z * sn;
      var Z = -x * sn + z * cs;
      var cp = Math.cos(pitch), sp = Math.sin(pitch);
      var Y = y * cp - Z * sp;
      var Z2 = y * sp + Z * cp;
      var f = 13 / (13 + Z2);
      return [ox + X * u * f, oy - Y * u * f, Z2];
    }

    function initParticles() {
      var n = mobile ? 26 : 56;
      particles = [];
      for (var i = 0; i < n; i++) {
        particles.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.12, vy: -0.05 - Math.random() * 0.18, r: 0.8 + Math.random() * 1.8, a: 0.2 + Math.random() * 0.6 });
      }
    }

    function resize() {
      var r = stage.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mobile = window.innerWidth < 960;
      u = mobile ? Math.min(W * 0.098, H * 0.17) : Math.min(W * 0.088, H * 0.15);
      ox = W * (mobile ? 0.5 : 0.56);   // en escritorio la casa se corre a la derecha para no pisar el texto
      oy = H * (mobile ? 0.6 : 0.56);
      initParticles();
      if (staticMode) { draw(); }
    }

    function drawGrid() {
      ctx.lineWidth = 1;
      for (var g = -9; g <= 9; g++) {
        var a = (1 - Math.abs(g) / 10) * 0.17 * Math.max(0.25, intro);
        ctx.strokeStyle = 'rgba(111,168,255,' + a.toFixed(3) + ')';
        var p1 = proj([-9, 0, g]), p2 = proj([9, 0, g]);
        ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
        p1 = proj([g, 0, -9]); p2 = proj([g, 0, 9]);
        ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
      }
    }

    function drawRipple() {
      var p = (t * 0.4) % 1;
      var r = 1.5 + p * 8;
      ctx.beginPath();
      for (var i = 0; i <= 64; i++) {
        var a = (i / 64) * Math.PI * 2;
        var q = proj([Math.cos(a) * r, 0, Math.sin(a) * r]);
        if (i === 0) { ctx.moveTo(q[0], q[1]); } else { ctx.lineTo(q[0], q[1]); }
      }
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255,138,61,' + ((1 - p) * 0.4 * fade).toFixed(3) + ')';
      ctx.stroke();
    }

    function drawEdges() {
      var n = E.length;
      var k = intro * (n + 14);
      ctx.lineCap = 'round';
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 0; i < n; i++) {
          var pr = clamp((k - i) / 14, 0, 1);
          if (pr <= 0) { continue; }
          var e = E[i], A = P[e[0]], B = P[e[1]];
          var al = clamp(1 - ((A[2] + B[2]) / 2 + 2.5) * 0.08, 0.3, 1);
          var c = COL[e[2]];
          ctx.beginPath();
          ctx.moveTo(A[0], A[1]);
          ctx.lineTo(A[0] + (B[0] - A[0]) * pr, A[1] + (B[1] - A[1]) * pr);
          if (pass === 0) { ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(' + c + ',' + (al * 0.09).toFixed(3) + ')'; }
          else { ctx.lineWidth = 1.3; ctx.strokeStyle = 'rgba(' + c + ',' + (al * 0.95).toFixed(3) + ')'; }
          ctx.stroke();
        }
      }
    }

    function strokePath(path, col, alpha) {
      ctx.beginPath();
      for (var i = 0; i < path.pts.length; i++) {
        var q = proj(path.pts[i]);
        if (i === 0) { ctx.moveTo(q[0], q[1]); } else { ctx.lineTo(q[0], q[1]); }
      }
      ctx.strokeStyle = 'rgba(' + col + ',' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    function drawPaths() {
      if (fade <= 0) { return; }
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -t * 18;
      strokePath(elecPath, COL[1], 0.7 * fade);
      strokePath(waterPath, COL[2], 0.7 * fade);
      ctx.setLineDash([]);
    }

    function drawScan() {
      if (fade <= 0) { return; }
      var sy = -0.2 + (Math.sin(t * 0.75) * 0.5 + 0.5) * 4.4;
      var pts = [[-2.35, sy, -1.85], [2.35, sy, -1.85], [2.35, sy, 1.85], [-2.35, sy, 1.85]].map(function (p) { return proj(p); });
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < 4; i++) { ctx.lineTo(pts[i][0], pts[i][1]); }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,138,61,' + (0.07 * fade).toFixed(3) + ')';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255,138,61,' + (0.65 * fade).toFixed(3) + ')';
      ctx.stroke();
    }

    function drawPulses() {
      if (fade <= 0) { return; }
      for (var i = 0; i < pulses.length; i++) {
        var pu = pulses[i], c = COL[pu.tag], s = pu.off + t * pu.speed;
        for (var k = 0; k < 7; k++) {
          var q = proj(at(pu.path, s - k * 0.11));
          ctx.fillStyle = 'rgba(' + c + ',' + ((1 - k / 7) * 0.9 * fade).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(q[0], q[1], (k === 0 ? 3.2 : 2.4) * (1 - k * 0.08), 0, 6.283);
          ctx.fill();
        }
        var h = proj(at(pu.path, s));
        var gr = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 14);
        gr.addColorStop(0, 'rgba(' + c + ',' + (0.55 * fade).toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = gr;
        ctx.fillRect(h[0] - 14, h[1] - 14, 28, 28);
      }
    }

    function drawParticles() {
      var i, j, p;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        if (p.x < -6) { p.x = W + 6; }
        if (p.x > W + 6) { p.x = -6; }
        ctx.fillStyle = 'rgba(150,195,255,' + (p.a * 0.7).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.lineWidth = 0.6;
      for (i = 0; i < particles.length; i++) {
        for (j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 9216) {
            ctx.strokeStyle = 'rgba(111,168,255,' + ((1 - Math.sqrt(d2) / 96) * 0.2).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, u * 6.5);
      g.addColorStop(0, 'rgba(47,111,203,0.30)');
      g.addColorStop(1, 'rgba(47,111,203,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      yaw = t * 0.2 - 0.55 + (mxS - 0.5) * 1.0;
      pitch = -0.36 + (myS - 0.5) * 0.2;
      for (var i = 0; i < V.length; i++) { P[i] = proj(V[i]); }

      ctx.globalCompositeOperation = 'lighter';
      drawParticles();
      drawGrid();
      drawRipple();
      drawEdges();
      drawPaths();
      drawScan();
      drawPulses();
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      if (!running) { return; }
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (!introT && root.classList.contains('is-ready')) { introT = t; }
      intro = introT ? clamp((t - introT) / 3.4, 0, 1) : 0;
      fade = clamp((intro - 0.6) * 2.5, 0, 1);
      mxS += (mx - mxS) * 0.05;
      myS += (my - myS) * 0.05;
      draw();
      frameN++;
      if (hudYaw && frameN % 8 === 0) {
        hudYaw.textContent = pad((((yaw * 180) / Math.PI) % 360 + 360) % 360, 3);
      }
    }

    function start() {
      if (running || staticMode) { return; }
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function setPointer(nx, ny) { mx = clamp(nx, 0, 1); my = clamp(ny, 0, 1); }

    resize();
    if (typeof ResizeObserver !== 'undefined') { new ResizeObserver(resize).observe(stage); }
    window.addEventListener('resize', resize);

    if (RM) {
      staticMode = true; t = 1.6; intro = 1; fade = 1;
      draw();
    }
    return { start: start, stop: stop, setPointer: setPointer };
  }

  var hero = $('.hero');
  var canvas = $('#scene');
  var scene = null;
  if (hero && canvas) {
    try { scene = HeroScene(canvas, canvas.parentNode); } catch (err) { scene = null; }
    if (scene && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { scene.start(); } else { scene.stop(); } });
      }, { threshold: 0 }).observe(hero);
    } else if (scene) { scene.start(); }

    // Puntero sobre el hero: orienta la escena, mueve la mira y actualiza las cotas
    var hudX = $('#hud-x');
    var hudY = $('#hud-y');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (scene) { scene.setPointer(x / r.width, y / r.height); }
      if (FINE) {
        hero.style.setProperty('--cx', x.toFixed(0) + 'px');
        hero.style.setProperty('--cy', y.toFixed(0) + 'px');
        if (hudX) { hudX.textContent = pad(x, 3); }
        if (hudY) { hudY.textContent = pad(y, 3); }
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------- *
   * 6. TEXTO DEL MANIFIESTO: palabras que se encienden con el scroll
   * ---------------------------------------------------------------------- */
  var manText = $('#man-text');
  var words = [];
  if (manText) {
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var parts = ch.nodeValue.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) { return; }
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); }
            else {
              var s = doc.createElement('span');
              s.className = 'w';
              s.textContent = p;
              if (/invisible|tranquilidad/i.test(p)) { s.style.color = '#c2480a'; }
              frag.appendChild(s);
              words.push(s);
            }
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) { wrap(ch); }
      });
    })(manText);
    if (RM) { words.forEach(function (w) { w.style.setProperty('--t', '1'); }); }
  }
  var wordLast = [];

  /* ---------------------------------------------------------------------- *
   * 7. BUCLE DE SCROLL CON INERCIA (lectura → cálculo → escritura)
   *    Progreso de página, hero, manifiesto, expansión de imagen, galería
   *    anclada y línea del método. Los valores se suavizan con lerp para que
   *    todo se sienta lento y fluido.
   * ---------------------------------------------------------------------- */
  var progressEl = $('.sp');
  var heroCopy = $('.hero-copy');
  var zoom = $('#expansion');
  var gal = $('#obras');
  var galPin = gal ? $('.gal-pin', gal) : null;
  var galTrack = $('#gal-track');
  var galCount = $('#gal-count');
  var steps = $('#steps');
  var stepEls = $$('.step');
  var cur = { man: 0, zoom: 0, gal: 0, proc: 0 };
  var pinned = false;
  var galMax = 0;

  function sm(key, target) {
    cur[key] += (target - cur[key]) * (RM ? 1 : 0.1);
    if (Math.abs(target - cur[key]) < 0.0004) { cur[key] = target; }
    return cur[key];
  }

  function setupGallery() {
    if (!gal || !galTrack || !galPin) { return; }
    var want = !RM && window.innerWidth >= 960;
    if (want) {
      gal.classList.add('is-pinned');
      galMax = Math.max(0, galTrack.scrollWidth - window.innerWidth);
      gal.style.setProperty('--gal-h', (galMax + window.innerHeight) + 'px');
      pinned = true;
    } else {
      gal.classList.remove('is-pinned');
      gal.style.removeProperty('--gal-h');
      galTrack.style.removeProperty('--gx');
      pinned = false;
    }
  }
  setupGallery();

  function frameLoop() {
    requestAnimationFrame(frameLoop);
    var vh = window.innerHeight;
    var sy = window.pageYOffset || root.scrollTop || 0;

    // --- Lectura de geometría ---
    var docH = root.scrollHeight;
    var heroH = hero ? hero.offsetHeight : 1;
    var mR = manText ? manText.getBoundingClientRect() : null;
    var zR = zoom ? zoom.getBoundingClientRect() : null;
    var gR = pinned && galPin ? galPin.getBoundingClientRect() : null;
    var sR = steps ? steps.getBoundingClientRect() : null;
    var stepTops = stepEls.map(function (s) { return s.getBoundingClientRect().top; });

    // --- Escritura ---
    if (progressEl) { progressEl.style.setProperty('--sp', (sy / Math.max(1, docH - vh)).toFixed(4)); }
    if (header) { header.classList.toggle('is-scrolled', sy > 24); }

    if (heroCopy && !RM) {
      var hp = clamp(sy / heroH, 0, 1);
      heroCopy.style.transform = 'translate3d(0,' + (hp * 50).toFixed(1) + 'px,0)';
      heroCopy.style.opacity = (1 - hp * 1.25).toFixed(3);
    }

    if (mR && words.length && !RM) {
      var mp = sm('man', clamp((vh * 0.85 - mR.top) / (vh * 0.55), 0, 1));
      var n = words.length;
      for (var i = 0; i < n; i++) {
        var tv = clamp(mp * (n + 6) - i, 0, 1);
        if (wordLast[i] === undefined || Math.abs(wordLast[i] - tv) > 0.01) {
          words[i].style.setProperty('--t', tv.toFixed(2));
          wordLast[i] = tv;
        }
      }
    }

    if (zR && !RM) {
      var total = zR.height - vh;
      var zp = total > 0 ? clamp(-zR.top / total, 0, 1) : 1;
      var pz = easeInOut(clamp(sm('zoom', zp) * 1.4, 0, 1));
      zoom.style.setProperty('--p', pz.toFixed(4));
      zoom.classList.toggle('is-open', pz > 0.72);
    } else if (zoom && RM) {
      zoom.classList.add('is-open');
    }

    if (gR) {
      var gt = gR.height - vh;
      var gp = gt > 0 ? clamp(-gR.top / gt, 0, 1) : 0;
      var g = sm('gal', gp);
      galTrack.style.setProperty('--gx', (-g * galMax).toFixed(1) + 'px');
      gal.style.setProperty('--gp', g.toFixed(4));
      if (galCount) { galCount.textContent = pad(Math.min(12, Math.floor(g * 12) + 1), 2); }
    }

    if (sR && steps) {
      var pp = sm('proc', clamp((vh * 0.62 - sR.top - 30) / Math.max(1, sR.height - 60), 0, 1));
      steps.style.setProperty('--pl', pp.toFixed(4));
      for (var s = 0; s < stepEls.length; s++) {
        var on = stepTops[s] + 40 < vh * 0.62;
        if (on !== stepEls[s].classList.contains('is-on')) { stepEls[s].classList.toggle('is-on', on); }
      }
    }
  }
  requestAnimationFrame(frameLoop);

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupGallery, 150);
  });
  window.addEventListener('load', setupGallery);

  /* ---------------------------------------------------------------------- *
   * 8. CASA EN CORTE: puntos interactivos, pestañas y ciclo automático
   * ---------------------------------------------------------------------- */
  var sys = $('#servicios');
  if (sys) {
    var tabsBox = $('.tabs', sys);
    var tabs = $$('.tab', sys);
    var panels = $$('.panel', sys);
    var hsAll = $$('.hs', sys);
    var zones = $$('.zone', sys);
    var house = $('#house');
    var keys = tabs.map(function (tb) { return tb.getAttribute('data-k'); });
    var manual = false;
    var inView = false;
    var hover = false;

    // Largo real de cada trazo para animar el dibujo (no depende de pathLength, que falla en algunos navegadores)
    $$('.dr', house).forEach(function (el, i) {
      el.style.setProperty('--i', i);
      try {
        var len = Math.ceil(el.getTotalLength()) + 2;
        el.style.setProperty('--L', len);
        el.style.setProperty('--O', len + 2);
      } catch (err) { /* sin medida: el CSS usa un valor de respaldo */ }
    });

    var syncPause = function () { sys.classList.toggle('is-paused', !inView || hover); };
    syncPause();

    var revealTab = function (tab) {
      var box = tab.parentNode;
      if (box.scrollWidth > box.clientWidth) {
        var left = tab.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft - (box.clientWidth - tab.offsetWidth) / 2;
        box.scrollTo({ left: left, behavior: RM ? 'auto' : 'smooth' });
      }
    };

    var activate = function (k, byUser) {
      var idx = keys.indexOf(k);
      if (idx < 0) { return; }
      tabs.forEach(function (tb, i) {
        var on = i === idx;
        tb.classList.toggle('is-active', on);
        tb.setAttribute('aria-selected', on ? 'true' : 'false');
        tb.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-k') === k); });
      hsAll.forEach(function (h) { h.classList.toggle('is-active', h.getAttribute('data-k') === k); });
      zones.forEach(function (z) { z.classList.toggle('is-on', z.getAttribute('data-z') === k); });
      revealTab(tabs[idx]);
      if (byUser && !manual) { manual = true; tabsBox.classList.add('is-manual'); }
    };
    var nextTab = function () {
      var idx = keys.indexOf($('.tab.is-active', sys).getAttribute('data-k'));
      activate(keys[(idx + 1) % keys.length], false);
    };

    tabs.forEach(function (tb, i) {
      tb.addEventListener('click', function () { activate(tb.getAttribute('data-k'), true); });
      tb.addEventListener('keydown', function (e) {
        var to = -1;
        if (e.key === 'ArrowRight') { to = (i + 1) % tabs.length; }
        if (e.key === 'ArrowLeft') { to = (i - 1 + tabs.length) % tabs.length; }
        if (to >= 0) { e.preventDefault(); activate(keys[to], true); tabs[to].focus(); }
      });
      var bar = $('.tbar', tb);
      if (bar && !RM) {
        bar.addEventListener('animationend', function () { if (!manual) { nextTab(); } });
      }
    });
    hsAll.forEach(function (h) {
      var go = function () {
        activate(h.getAttribute('data-k'), true);
        if (window.innerWidth < 960) {
          var ap = $('.panel.is-active', sys);
          if (ap) {
            var r = ap.getBoundingClientRect();
            if (r.top > window.innerHeight * 0.75 || r.top < 0) { ap.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }
          }
        }
      };
      h.addEventListener('click', go);
      h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      h.addEventListener('pointerenter', function () { hover = true; syncPause(); });
      h.addEventListener('pointerleave', function () { hover = false; syncPause(); });
    });
    var rightCol = $('.sys-right', sys);
    if (rightCol) {
      rightCol.addEventListener('pointerenter', function () { hover = true; syncPause(); });
      rightCol.addEventListener('pointerleave', function () { hover = false; syncPause(); });
    }

    activate(keys[0], false);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { inView = en.isIntersecting; syncPause(); });
      }, { threshold: 0.25 }).observe(sys);
      var ioHouse = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { house.classList.add('is-drawn'); ioHouse.disconnect(); }
        });
      }, { threshold: 0.2 });
      ioHouse.observe(house);
    } else {
      inView = true; syncPause(); house.classList.add('is-drawn');
    }

    // Las fotos de los paneles ocultos se descargan cuando el usuario está por llegar a la sección,
    // así al cambiar de pestaña la imagen ya está lista (los paneles con display:none no cargan en modo lazy)
    var panelImgs = $$('.panel-media img', sys);
    var loadPanelImgs = function () { panelImgs.forEach(function (im) { im.loading = 'eager'; }); };
    if ('IntersectionObserver' in window) {
      var ioImgs = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) { loadPanelImgs(); ioImgs.disconnect(); }
      }, { rootMargin: '900px 0px' });
      ioImgs.observe(sys);
    } else { loadPanelImgs(); }
  }

  // Botones "Quiero ..." que preseleccionan el servicio en el formulario

  var selServicio = $('#f-servicio');
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (selServicio) { selServicio.value = a.getAttribute('data-service'); }
    });
  });

  /* ---------------------------------------------------------------------- *
   * 9. VISOR DE FOTOS (bitácora de obra)
   * ---------------------------------------------------------------------- */
  var lb = $('#lightbox');
  var cards = $$('.g-card');
  if (lb && cards.length) {
    var lbImg = $('#lb-img');
    var lbCap = $('#lb-cap');
    var lbIdx = 0;
    var lastFocus = null;
    var showLb = function (i) {
      lbIdx = (i + cards.length) % cards.length;
      var c = cards[lbIdx];
      var im = $('img', c);
      lbImg.src = im.getAttribute('src');
      lbImg.alt = im.getAttribute('alt') || '';
      lbCap.textContent = c.getAttribute('data-cap') || '';
    };
    var openLb = function (i) {
      lastFocus = doc.activeElement;
      showLb(i);
      lb.hidden = false;
      root.classList.add('lb-open');
      requestAnimationFrame(function () { lb.classList.add('is-open'); });
      $('.lb-close', lb).focus();
    };
    var closeLb = function () {
      lb.classList.remove('is-open');
      root.classList.remove('lb-open');
      setTimeout(function () { lb.hidden = true; }, 400);
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    };
    cards.forEach(function (c, i) { c.addEventListener('click', function () { openLb(i); }); });
    $('.lb-close', lb).addEventListener('click', closeLb);
    $('.lb-prev', lb).addEventListener('click', function () { showLb(lbIdx - 1); });
    $('.lb-next', lb).addEventListener('click', function () { showLb(lbIdx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) { closeLb(); } });
    doc.addEventListener('keydown', function (e) {
      if (lb.hidden) { return; }
      if (e.key === 'Escape') { closeLb(); }
      if (e.key === 'ArrowLeft') { showLb(lbIdx - 1); }
      if (e.key === 'ArrowRight') { showLb(lbIdx + 1); }
      if (e.key === 'Tab') {
        var f = $$('.lb-btn', lb);
        var first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && doc.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------------------------------------------------------------------- *
   * 10. INCLINACIÓN 3D EN TARJETAS Y BOTONES MAGNÉTICOS (solo puntero fino)
   * ---------------------------------------------------------------------- */
  if (FINE && !RM) {
    $$('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', ((0.5 - y) * 9).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((x - 0.5) * 11).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(0) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(0) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--tx', (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(1) + 'px');
        b.style.setProperty('--ty', (((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () {
        b.style.setProperty('--tx', '0px');
        b.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ---------------------------------------------------------------------- *
   * 11. WHATSAPP: botón flotante y formulario
   * ---------------------------------------------------------------------- */
  var waBtn = $('#wa-float');
  var form = $('#form-contacto');
  var pending = $('#wa-pending');
  var baseUrl = waUrl('Hola, quiero información sobre los servicios de ' + NOMBRE_NEGOCIO + '.');
  if (baseUrl) {
    if (waBtn) { waBtn.href = baseUrl; waBtn.hidden = false; }
  } else {
    root.classList.add('no-wa');
    if (form) { form.hidden = true; }
    if (pending) { pending.hidden = false; }
    if (waBtn) { waBtn.hidden = true; }
  }

  if (form) {
    var setBad = function (el, msg) {
      var f = el.closest('.field');
      if (!f) { return; }
      f.classList.add('is-bad');
      var er = $('.err', f);
      if (er) { er.textContent = msg; }
    };
    var setOk = function (el) {
      var f = el.closest('.field');
      if (!f) { return; }
      f.classList.remove('is-bad');
      var er = $('.err', f);
      if (er) { er.textContent = ''; }
    };
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { setOk(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = form.elements['nombre'];
      var servicio = form.elements['servicio'];
      var zona = form.elements['zona'];
      var mensaje = form.elements['mensaje'];
      var ok = true;
      if (!nombre.value.trim()) { setBad(nombre, 'Dinos cómo te llamas.'); ok = false; } else { setOk(nombre); }
      if (!servicio.value) { setBad(servicio, 'Elige el servicio que necesitas.'); ok = false; } else { setOk(servicio); }
      if (mensaje.value.trim().length < 8) { setBad(mensaje, 'Cuéntanos un poco más del trabajo.'); ok = false; } else { setOk(mensaje); }
      if (!ok) { return; }
      var texto = 'Hola, soy ' + nombre.value.trim() + '. Me interesa: ' + servicio.value + '.' +
        (zona.value.trim() ? ' Zona del trabajo: ' + zona.value.trim() + '.' : '') +
        ' Detalles: ' + mensaje.value.trim() +
        ' (Mensaje enviado desde el sitio web de ' + NOMBRE_NEGOCIO + ')';
      var url = waUrl(texto);
      if (url) { window.open(url, '_blank', 'noopener'); }
    });
  }

  /* ---------------------------------------------------------------------- *
   * 12. DETALLES
   * ---------------------------------------------------------------------- */
  var year = String(new Date().getFullYear());
  var y1 = $('#foot-year');
  var y2 = $('#foot-year2');
  if (y1) { y1.textContent = year; }
  if (y2) { y2.textContent = year; }
})();
