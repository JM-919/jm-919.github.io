/* dream.js —— 全局指针流光拖尾 + 星尘（Canvas 2D，无依赖） */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('dream-canvas');
  if (!canvas || reduce) return;

  var ctx = canvas.getContext('2d');
  var DPR = Math.min(devicePixelRatio || 1, 2);
  var W = 0, H = 0, raf = 0, last = performance.now(), idleSince = performance.now();
  var pointer = { x: innerWidth / 2, y: innerHeight * 0.35, has: false, amt: 0 };
  var parts = [];
  var HALO = ['124,92,255', '236,72,153', '34,211,238', '167,139,250', '250,204,21'];

  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  function spawn(n, x, y, power) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = Math.random() * 1.1;
      parts.push({
        x: x + Math.cos(a) * 8, y: y + Math.sin(a) * 8,
        vx: Math.cos(a) * s * (power || 1), vy: Math.sin(a) * s * (power || 1) - 0.25,
        r: 6 + Math.random() * 22,
        life: 1, decay: 0.008 + Math.random() * 0.012,
        c: HALO[(Math.random() * HALO.length) | 0]
      });
    }
    if (parts.length > 320) parts.splice(0, parts.length - 320);
    idleSince = 0;
  }

  function move(x, y) {
    var dx = x - pointer.x, dy = y - pointer.y, d = Math.hypot(dx, dy);
    pointer.x = x; pointer.y = y; pointer.has = true;
    pointer.amt = Math.min(1, pointer.amt + 0.35);
    spawn(Math.max(1, Math.min(3, (d / 22) | 0) + 1), x, y, 1);
    idleSince = 0;
  }

  addEventListener('pointermove', function (e) { move(e.clientX, e.clientY); }, { passive: true });
  addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
  addEventListener('pointerdown', function (e) { spawn(18, e.clientX, e.clientY, 2.2); }, { passive: true });
  addEventListener('pointerleave', function () { pointer.has = false; }, { passive: true });

  function frame(now) {
    var dt = Math.min(2.5, (now - last) / 16.667); last = now;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.985; p.vy = p.vy * 0.985 - 0.006 * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      var r = p.r * (1.25 - p.life * 0.5);
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, 'rgba(' + p.c + ',' + (0.5 * p.life).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(' + p.c + ',' + (0.16 * p.life).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + p.c + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
    }

    if (pointer.has) {
      var size = 190 + pointer.amt * 70;
      var g2 = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, size);
      g2.addColorStop(0, 'rgba(255,214,255,' + (0.16 * pointer.amt).toFixed(3) + ')');
      g2.addColorStop(0.4, 'rgba(167,139,250,' + (0.10 * pointer.amt).toFixed(3) + ')');
      g2.addColorStop(1, 'rgba(124,92,255,0)');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, size, 0, 6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    pointer.amt *= 0.94;

    if (!parts.length && !pointer.has) {
      if (!idleSince) idleSince = now;
      if (now - idleSince > 700) { raf = 0; return; }
    }
    raf = requestAnimationFrame(frame);
  }

  function ensure() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  addEventListener('pointermove', ensure, { passive: true });
  addEventListener('touchmove', ensure, { passive: true });
  addEventListener('pointerdown', ensure, { passive: true });
  addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else ensure();
  });

  var lastScroll = scrollY;
  addEventListener('scroll', function () {
    var d = Math.abs(scrollY - lastScroll); lastScroll = scrollY;
    if (d > 40) { spawn(1, Math.random() * W, scrollY > 0 ? H * 0.85 : H * 0.2, 0.6); ensure(); }
  }, { passive: true });
})();
