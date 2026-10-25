/* Pen trail: the cursor leaves a soft ink line that fades as it dries.
   Fine pointers only, and off for people who prefer reduced motion. */
(function () {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var LIFE = 900;          // ms before a point has fully faded
  var COLOR = '47,109,168'; // --accent, as rgb
  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var dpr = 1, pts = [], running = false;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  addEventListener('resize', size);

  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (!running) { running = true; requestAnimationFrame(draw); }
  }, { passive: true });
  // Scrolling moves the page under the ink, so start a fresh stroke.
  addEventListener('scroll', function () { pts = []; }, { passive: true });
  document.addEventListener('mouseleave', function () { pts = []; });

  function draw(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], b = pts[i], c = pts[i + 1];
      var life = 1 - (now - b.t) / LIFE;              // 1 = fresh ink, 0 = dry
      var speed = Math.hypot(c.x - a.x, c.y - a.y);
      ctx.lineWidth = Math.max(0.9, (3.4 - Math.min(speed, 60) / 30) * life);  // faster = thinner, like a real pen
      ctx.strokeStyle = 'rgba(' + COLOR + ',' + (0.55 * life).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
      ctx.stroke();
    }
    if (pts.length) requestAnimationFrame(draw);
    else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
})();
