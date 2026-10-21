/* Digital Darkroom: one continuous sequence built from the four interaction studies in /studies.
   Pick photo -> 1 Enlarger -> 2 Focus -> 3 Expose -> 4 Develop -> Save / Make another print.
   The photo pipeline, step gestures, thresholds and timings are carried over from the studies unchanged;
   each study's "Try again" exit now advances to the next step, and one sheet of paper (#paper) persists throughout. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var AR_MIN = 0.75, AR_MAX = 1.6, LONG = 720, EXPORT_LONG = 2400;
  var ADVANCE_MS = 2000; // how long a step's "complete" message shows before the next action appears

  /* ---------- Photo pipeline (shared by all studies) ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function drawScene(c) {
    var W = c.width, H = c.height, ctx = c.getContext('2d'), rand = rng(7), i, x, y;
    var g = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    g.addColorStop(0, '#2b2b2b'); g.addColorStop(1, '#d6d6d6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var rg = ctx.createRadialGradient(340, 200, 10, 340, 200, 170);
    rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.arc(340, 200, 38, 0, Math.PI * 2); ctx.fill();
    function ridge(base, amp, color, s) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
      for (x = 0; x <= W; x += 6) {
        y = base - amp * (Math.sin(x * .012 + s) + .5 * Math.sin(x * .031 + s * 2) + .25 * Math.sin(x * .07 + s * 3));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
    ridge(340, 50, '#a0a0a0', 1); ridge(395, 45, '#707070', 3); ridge(440, 30, '#454545', 5);
    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 3;
    [[190, 110], [214, 98], [236, 118]].forEach(function (b) {
      ctx.beginPath(); ctx.moveTo(b[0] - 9, b[1] + 3); ctx.quadraticCurveTo(b[0] - 4, b[1] - 6, b[0], b[1]);
      ctx.quadraticCurveTo(b[0] + 4, b[1] - 6, b[0] + 9, b[1] + 3); ctx.stroke();
    });
    ridge(505, 16, '#171717', 9);
    ctx.fillStyle = '#0e0e0e'; ctx.fillRect(106, 420, 8, 90);
    for (i = 0; i < 5; i++) {
      var y0 = 300 + i * 40, w = 46 + i * 20;
      ctx.beginPath(); ctx.moveTo(110, y0); ctx.lineTo(110 - w / 2, y0 + 64); ctx.lineTo(110 + w / 2, y0 + 64); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(300, 458, 76, 46);
    ctx.beginPath(); ctx.moveTo(290, 458); ctx.lineTo(338, 422); ctx.lineTo(386, 458); ctx.closePath(); ctx.fill();
    ctx.fillRect(358, 424, 10, 24);
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(322, 474, 15, 15);
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(328.5, 474, 2, 15); ctx.fillRect(322, 480.5, 15, 2);
    var img = ctx.getImageData(0, 0, W, H), d = img.data, n;
    for (i = 0; i < d.length; i += 4) { n = (rand() - .5) * 36; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  function toGray(c) {
    var x = c.getContext('2d'), im = x.getImageData(0, 0, c.width, c.height), d = im.data, i, l;
    for (i = 0; i < d.length; i += 4) {
      l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      l = (l - 128) * 1.08 + 128;
      l = l < 0 ? 0 : (l > 255 ? 255 : l);
      d[i] = d[i + 1] = d[i + 2] = l;
    }
    x.putImageData(im, 0, 0);
  }
  function fromImage(img, long) {
    var sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height;
    var ar = sw / sh, cx = 0, cy = 0, cw = sw, ch = sh, w, h;
    if (ar < AR_MIN) { ch = sw / AR_MIN; cy = (sh - ch) / 2; ar = AR_MIN; }
    else if (ar > AR_MAX) { cw = sh * AR_MAX; cx = (sw - cw) / 2; ar = AR_MAX; }
    var k = Math.min(1, long / Math.max(cw, ch));
    w = Math.max(1, Math.round(cw * k)); h = Math.max(1, Math.round(ch * k));
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(img, cx, cy, cw, ch, 0, 0, w, h);
    toGray(c);
    return c;
  }
  /* Film look: clumped (not per-pixel) grain that is strongest in the midtones, plus a faint lift in the blacks and a soft shoulder in the highlights */
  function grainify(c, amp, cell, seed) {
    var w = c.width, h = c.height, x = c.getContext('2d'), r = rng(seed), i;
    var nw = Math.max(2, Math.round(w / cell)), nh = Math.max(2, Math.round(h / cell));
    var n = document.createElement('canvas'); n.width = nw; n.height = nh;
    var nx = n.getContext('2d'), ni = nx.createImageData(nw, nh), nd = ni.data, v;
    for (i = 0; i < nd.length; i += 4) {
      v = 128 + (r() + r() + r() - 1.5) * 2 * 42;
      nd[i] = nd[i + 1] = nd[i + 2] = v < 0 ? 0 : (v > 255 ? 255 : v); nd[i + 3] = 255;
    }
    nx.putImageData(ni, 0, 0);
    var g = document.createElement('canvas'); g.width = w; g.height = h;
    var gx = g.getContext('2d'); gx.imageSmoothingEnabled = true; gx.imageSmoothingQuality = 'high';
    gx.drawImage(n, 0, 0, w, h);
    var gd = gx.getImageData(0, 0, w, h).data, im = x.getImageData(0, 0, w, h), d = im.data, l, wt;
    for (i = 0; i < d.length; i += 4) {
      l = d[i];
      l = 5 + l * 0.955;                                   // faint base fog in the blacks, soft whites
      wt = 0.45 + 0.55 * (1 - Math.abs(l - 128) / 128);    // more grain in the midtones
      l += ((gd[i] - 128) / 128) * amp * wt;
      l = l < 0 ? 0 : (l > 255 ? 255 : l);
      d[i] = d[i + 1] = d[i + 2] = l;
    }
    x.putImageData(im, 0, 0);
  }
  function copyCanvas(src) {
    var c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  }

  /* The negative is projected onto the paper (#photo); the paper itself carries the latent positive (#print) */
  var app = $('app'), photo = $('photo'), print = $('print'), exportSrc = null;
  function setPhoto(src, hi) {
    exportSrc = hi || src;
    var w = src.width, h = src.height, i;
    var neg = copyCanvas(src), nx = neg.getContext('2d'), im = nx.getImageData(0, 0, w, h), d = im.data;
    for (i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; }
    nx.putImageData(im, 0, 0);
    photo.width = w; photo.height = h; photo.getContext('2d').drawImage(neg, 0, 0);
    var pos = copyCanvas(src); grainify(pos, 30, 2, 11);
    print.width = w; print.height = h; print.getContext('2d').drawImage(pos, 0, 0);
    app.style.setProperty('--ar', (w / h).toFixed(4));
  }
  function sampleCanvas() { var c = document.createElement('canvas'); c.width = 480; c.height = 600; drawScene(c); return c; }

  /* ---------- Starting state: pick a photo ---------- */
  var intro = $('intro'), room = $('room'), err = $('err'), fileInput = $('file');
  function handleFile(file) {
    if (intro.hidden) return;
    if (!file || (file.type && file.type.indexOf('image/') !== 0)) { err.textContent = 'That file is not an image. Try a JPEG or PNG.'; return; }
    err.textContent = 'Loading the photo…';
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      try { setPhoto(fromImage(img, LONG), fromImage(img, EXPORT_LONG)); err.textContent = ''; startSequence(); }
      catch (e) { err.textContent = 'That photo could not be opened. Try another one.'; }
    };
    img.onerror = function () { URL.revokeObjectURL(url); err.textContent = 'That photo could not be opened. Try another one.'; };
    img.src = url;
  }
  $('use-sample').addEventListener('click', function () { setPhoto(sampleCanvas()); startSequence(); });
  $('choose').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () { var f = fileInput.files && fileInput.files[0]; fileInput.value = ''; handleFile(f); });
  document.addEventListener('dragover', function (e) { e.preventDefault(); if (!intro.hidden) document.body.classList.add('dragging'); });
  document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) document.body.classList.remove('dragging'); });
  document.addEventListener('drop', function (e) {
    e.preventDefault(); document.body.classList.remove('dragging');
    handleFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
  });

  /* ---------- Sequence helpers ---------- */
  var lamp = $('lamp'), flood = $('flood'), brand = $('brand'), stepName = $('stepname'), stepHint = $('stephint');
  var done = $('done'), doneMsg = $('done-msg'), doneSub = $('done-sub'), saveBtn = $('save'), saveNote = $('save-note'), again = $('again');
  var paper = $('paper'), easel = $('easel'), bench = $('bench'), tray = $('tray'), grab = $('grab');
  var controls = document.querySelector('.controls');
  var dots = Array.prototype.slice.call(document.querySelectorAll('#dots li')), timers = [], STEP = 0;
  var reduce = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); timers = []; }
  function fadeIn(el) { el.hidden = false; el.classList.remove('fadein'); void el.offsetWidth; el.classList.add('fadein'); }
  function setDots(complete) {
    dots.forEach(function (li) {
      var k = +li.getAttribute('data-i');
      li.className = k < STEP ? 'done' : (k === STEP ? (complete ? 'done' : 'current') : '');
    });
  }
  function enterStep(n, title, hint) {
    STEP = n;
    brand.textContent = 'Digital Darkroom · Step ' + n + ' of 4';
    done.hidden = true; setDots(false);
    stepName.textContent = title; stepHint.textContent = hint;
  }
  /* A step's success message; the next action becomes available once it has been read */
  function completeStep(ctl, title, sub, next) {
    ctl.hidden = true;
    stepName.textContent = title; stepHint.textContent = '';
    doneMsg.textContent = title; doneSub.textContent = sub;
    saveBtn.hidden = true; saveNote.hidden = true; again.hidden = true;
    setDots(true);
    fadeIn(done);
    later(next, ADVANCE_MS);
  }

  /* ---------- Step 1: Enlarger (tap the switch) ---------- */
  var sw = $('lamp-switch'), swLbl = $('sw-lbl'), ctl1 = $('ctl-1');
  function enterEnlarger() {
    enterStep(1, 'Turn on the enlarger', '');
    sw.setAttribute('aria-checked', 'false'); swLbl.textContent = 'OFF';
    fadeIn(ctl1);
  }
  sw.addEventListener('click', function () {
    if (STEP !== 1 || sw.getAttribute('aria-checked') === 'true') return;
    sw.setAttribute('aria-checked', 'true'); swLbl.textContent = 'ON';
    lamp.style.opacity = 1;
    paper.classList.add('lit');
    photo.style.filter = 'blur(16px) brightness(.6)';
    later(function () { completeStep(ctl1, 'Enlarger on', 'The negative is lit and waiting to be focused.', enterFocus); }, 1300);
  });

  /* ---------- Step 2: Focus (drag slider into 69–75, then lock) ---------- */
  var TARGET = 72, TOL = 3;
  var focus = $('focus'), focusState = $('focus-state'), lockBtn = $('lock-focus'), ctl2 = $('ctl-2');
  function focusBlur() {
    var d = Math.abs(+focus.value - TARGET);
    return d <= TOL ? 0 : Math.min(16, 0.6 + (d - TOL) * 0.45);
  }
  function enterFocus() {
    enterStep(2, 'Focus the image', '');
    focus.disabled = false; lockBtn.disabled = false; focus.value = 8; focusState.textContent = ''; syncFill();
    photo.style.filter = 'blur(' + focusBlur().toFixed(1) + 'px) brightness(.6)';
    fadeIn(ctl2);
  }
  function syncFill() { focus.style.setProperty('--sl-pct', focus.value + '%'); }

  focus.addEventListener('input', function () {
    syncFill();
    if (STEP !== 2) return;
    photo.style.transition = 'filter .08s linear';
    photo.style.filter = 'blur(' + focusBlur().toFixed(1) + 'px) brightness(.6)';
    focusState.textContent = '';
  });
  lockBtn.addEventListener('click', function () {
    if (STEP !== 2 || lockBtn.disabled) return;
    if (focusBlur() > 0) { focusState.textContent = 'Not sharp yet. Keep adjusting, then lock again.'; return; }
    focus.disabled = true; lockBtn.disabled = true; focusState.textContent = 'Focus locked.';
    later(function () { completeStep(ctl2, 'Focus locked', 'The negative is sharp and ready to be exposed.', enterExpose); }, 1100);
  });

  /* ---------- Step 3: Expose (press and hold the bulb for 5 s total) ---------- */
  var EXPOSE_S = 5;
  var bulb = $('bulb'), prog = $('bulb-prog'), expRead = $('exp-read'), ctl3 = $('ctl-3');
  var expP = 0, holding = false, raf = 0, lastT = 0, exposed = false;
  function paintExposure() {
    photo.style.transition = 'filter .12s linear';
    photo.style.filter = 'blur(0px) brightness(' + (0.6 + 0.75 * expP).toFixed(3) + ')';
    flood.style.transition = 'opacity .25s ease';
    flood.style.opacity = holding ? (0.06 + 0.24 * expP).toFixed(3) : 0;
    prog.style.strokeDashoffset = (1 - expP).toFixed(4);
    expRead.textContent = (EXPOSE_S * (1 - expP)).toFixed(1) + ' s';
  }
  function tick(now) {
    raf = 0;
    if (!holding || exposed) return;
    var dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    expP = Math.min(1, expP + dt / EXPOSE_S);
    paintExposure();
    if (expP >= 1) { finishExpose(); return; }
    raf = requestAnimationFrame(tick);
  }
  function startHold() {
    if (STEP !== 3 || holding || exposed) return;
    holding = true; bulb.classList.add('on');
    stepHint.textContent = 'Keep holding. The paper is being exposed.';
    paintExposure(); lastT = performance.now();
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function stopHold() {
    if (!holding) return;
    holding = false; bulb.classList.remove('on');
    if (!exposed) { stepHint.textContent = 'The light went out. Hold the bulb again to keep exposing.'; paintExposure(); }
  }
  bulb.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    try { bulb.setPointerCapture(e.pointerId); } catch (er) {}
    startHold();
  });
  bulb.addEventListener('pointerup', stopHold);
  bulb.addEventListener('pointercancel', stopHold);
  bulb.addEventListener('lostpointercapture', stopHold);
  bulb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  bulb.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
  bulb.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stopHold(); });
  bulb.addEventListener('blur', stopHold);
  window.addEventListener('blur', stopHold);
  function enterExpose() {
    enterStep(3, 'Expose', '');
    expP = 0; holding = false; exposed = false;
    bulb.disabled = false; bulb.classList.remove('on');
    prog.style.strokeDashoffset = 1; expRead.textContent = EXPOSE_S.toFixed(1) + ' s';
    photo.style.filter = 'blur(0px) brightness(.6)';
    fadeIn(ctl3);
  }
  function finishExpose() {
    exposed = true; holding = false;
    bulb.classList.remove('on'); bulb.disabled = true; expRead.textContent = '0.0 s';
    flood.style.transition = 'opacity .6s ease'; flood.style.opacity = 0;
    later(function () { completeStep(ctl3, 'Paper exposed', 'The image is now on the paper, waiting for the developer.', enterDevelop); }, 900);
  }

  /* ---------- Step 4: Develop (drag the same paper into the tray, wait 9 s) ---------- */
  var DEVELOP_MS = 9000;
  var ctl4 = $('ctl-4'), devText = $('dev-text'), devBarWrap = $('dev-bar-wrap'), devFill = $('dev-fill');
  var tx = 0, ty = 0, drag = null, placed = false, canDrag = false;

  /* Handoff from the enlarger: the lamp goes off, the projection fades from the paper, and the
     same sheet slides off the easel to sit beside the developer tray (FLIP, so it never jumps) */
  function enterDevelop() {
    enterStep(4, 'Develop', 'The enlarger is off. The exposed paper is under the safelight.');
    tx = 0; ty = 0; drag = null; placed = false; canDrag = false;
    photo.style.transition = ''; photo.style.opacity = 0;
    lamp.style.transition = ''; lamp.style.opacity = .35;
    paper.classList.remove('lit'); paper.classList.add('safelight');
    later(function () {
      var before = easel.getBoundingClientRect();
      easel.style.transition = 'none';
      bench.classList.add('develop');
      tray.hidden = false; tray.classList.add('arrive');
      var after = easel.getBoundingClientRect();
      var DUR = reduce() ? 200 : 900;
      easel.animate([
        { transformOrigin: '0 0', transform: 'translate(' + (before.left - after.left) + 'px,' + (before.top - after.top) + 'px) scale(' + (before.width / after.width) + ')' },
        { transformOrigin: '0 0', transform: 'none' }
      ], { duration: DUR, easing: 'cubic-bezier(.3,.7,.2,1)' });
      later(function () {
        easel.style.transition = '';
        canDrag = true;
        paper.classList.add('draggable');
        paper.setAttribute('tabindex', '0'); paper.setAttribute('role', 'button');
        paper.setAttribute('aria-label', 'Exposed photographic paper. Drag it into the developer tray, or press Enter to place it.');
        grab.hidden = false;
        stepHint.textContent = ''; devText.textContent = '';
        fadeIn(ctl4);
      }, DUR);
    }, 900);
  }

  function applyMove(lift) {
    paper.style.transform = 'translate(' + tx + 'px,' + ty + 'px)' + (lift ? ' scale(1.04)' : '');
  }
  function centerInTray() {
    var pr = paper.getBoundingClientRect(), tr = tray.getBoundingClientRect();
    var cx = pr.left + pr.width / 2, cy = pr.top + pr.height / 2;
    return cx > tr.left && cx < tr.right && cy > tr.top && cy < tr.bottom;
  }
  paper.addEventListener('pointerdown', function (e) {
    if (!canDrag || placed) return;
    e.preventDefault();
    paper.setPointerCapture(e.pointerId);
    drag = { x: e.clientX - tx, y: e.clientY - ty };
    paper.style.transition = 'none';
    paper.classList.add('lifted');
    applyMove(true);
  });
  paper.addEventListener('pointermove', function (e) {
    if (!drag) return;
    tx = e.clientX - drag.x; ty = e.clientY - drag.y;
    applyMove(true);
    tray.classList.toggle('ready', centerInTray());
  });
  function endDrag() {
    if (!drag) return;
    drag = null;
    paper.classList.remove('lifted');
    var inside = centerInTray();
    tray.classList.remove('ready');
    if (inside) { dropInTray(); }
    else {
      tx = 0; ty = 0;
      paper.style.transition = 'transform .35s ease';
      applyMove(false);
    }
  }
  paper.addEventListener('pointerup', endDrag);
  paper.addEventListener('pointercancel', endDrag);
  paper.addEventListener('contextmenu', function (e) { if (canDrag) e.preventDefault(); });
  paper.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && canDrag && !placed) { e.preventDefault(); dropInTray(); }
  });

  function dropInTray() {
    if (placed) return;
    placed = true;
    var pr = paper.getBoundingClientRect(), tr = tray.getBoundingClientRect();
    tx += (tr.left + tr.width / 2) - (pr.left + pr.width / 2);
    ty += (tr.top + tr.height / 2) - (pr.top + pr.height / 2);
    paper.style.transition = 'transform .45s ease';
    applyMove(false);
    paper.classList.add('in-tray');
    paper.removeAttribute('tabindex');
    grab.hidden = true;
    tray.classList.add('active');
    later(startDeveloping, 500);
  }

  function startDeveloping() {
    stepHint.textContent = 'Keep the paper in the tray. The negative is turning positive.';
    devText.textContent = 'Developing…';
    devBarWrap.hidden = false;
    devFill.style.transition = 'width ' + DEVELOP_MS + 'ms linear';
    devFill.style.width = '100%';
    paper.classList.add('developing');
    tray.classList.add('agitating');
    paper.classList.add('agitating');
    later(upgradePrint, 800);
    later(reveal, DEVELOP_MS + 300);
  }

  /* While the print develops, quietly swap in a sharper version so it holds up when it is shown large */
  function upgradePrint() {
    var c = renderFinal(1800);
    if (c.width <= print.width && c.height <= print.height) return;
    print.width = c.width; print.height = c.height;
    print.getContext('2d').drawImage(c, 0, 0);
  }

  /* The finish: lift the print out of the tray, glide it to the middle of the page, scale it up, settle with a light sweep */
  function reveal() {
    tray.classList.remove('agitating', 'arrive'); paper.classList.remove('agitating');
    ctl4.hidden = true;
    stepHint.textContent = 'Lifting the print out of the developer.';
    var rm = reduce();
    var vh = window.innerHeight;
    var pr = paper.getBoundingClientRect(), ar = app.getBoundingClientRect(), br = bench.getBoundingClientRect();
    /* size the print so it and the ending panel (Save, Make another print) fit in one screen:
       below the header when there is room, otherwise scrolled up to the top of the bench */
    var panelH = measureFinalPanel(), below = 20 + 24 + panelH + 16;
    var avail = vh - br.top - 8 - below, scroll = false;
    if (br.top < 0 || avail < vh * 0.45) { scroll = true; avail = vh * 0.94 - 8 - below; }
    var sc = Math.max(1, Math.min(ar.width / pr.width, avail / pr.height));
    var dx = (ar.left + ar.width / 2) - (pr.left + pr.width / 2);
    var dy = (br.top + 8 + pr.height * sc / 2) - (pr.top + pr.height / 2);
    var DUR = rm ? 500 : 3000;

    /* room for the big print: the bench grows and pushes the controls down */
    bench.style.transition = 'min-height 1.5s cubic-bezier(.3,.7,.2,1)';
    bench.style.minHeight = Math.ceil(pr.height * sc + 20) + 'px';
    controls.style.minHeight = (panelH + 4) + 'px';   // hold the ending panel's space so the page can scroll to fit it

    tray.style.transition = 'opacity 1.2s ease .15s, transform 1.4s ease';
    tray.style.opacity = 0; tray.style.transform = 'translateY(10px)';
    lamp.style.transition = 'opacity 2.4s ease'; lamp.style.opacity = 1;

    paper.classList.add('revealed');
    var t = function (x, y, k, r) { return 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + k.toFixed(3) + ') rotate(' + r + 'deg)'; };
    paper.animate([
      { transform: t(tx, ty, 1, 0),                                                  offset: 0,    easing: 'cubic-bezier(.3,0,.2,1)' },
      { transform: t(tx, ty - 70, 1.1, -2.5),                                        offset: .27,  easing: 'cubic-bezier(.45,.05,.2,1)' },
      { transform: t(tx + dx * .55, ty + dy * .35 - 40, 1 + (sc - 1) * .45, 1.2),    offset: .62,  easing: 'cubic-bezier(.2,.7,.25,1)' },
      { transform: t(tx + dx, ty + dy, sc * 1.015, -.3),                             offset: .9,   easing: 'ease-out' },
      { transform: t(tx + dx, ty + dy, sc, 0),                                       offset: 1 }
    ], { duration: DUR, fill: 'forwards' });
    paper.animate([
      { boxShadow: '0 6px 18px rgba(0,0,0,.5)' },
      { boxShadow: '0 22px 46px rgba(0,0,0,.6)', offset: .3 },
      { boxShadow: '0 34px 90px rgba(0,0,0,.75)' }
    ], { duration: DUR, fill: 'forwards' });

    /* on short screens, bring the bench to the top so the print and the ending panel fit together */
    if (scroll) later(function () {
      var want = br.top + window.scrollY - vh * 0.06;
      if (Math.abs(want - window.scrollY) > 4) window.scrollTo({ top: want, behavior: rm ? 'auto' : 'smooth' });
    }, rm ? 0 : 1500);

    later(function () { paper.classList.add('sheen'); }, DUR - 400);
    later(finish, DUR + 250);
  }

  /* ---------- Ending: save the print, or make another ---------- */
  function fillFinalPanel() {
    doneMsg.textContent = 'Photograph developed'; doneSub.textContent = 'Your print is ready.';
    saveBtn.hidden = !canSave; saveBtn.disabled = false; saveNote.hidden = false; saveNote.textContent = '';
    again.hidden = false;
  }
  /* height of the ending panel, measured off-screen before the print is sized */
  function measureFinalPanel() {
    fillFinalPanel();
    done.style.visibility = 'hidden'; done.hidden = false;
    var h = done.getBoundingClientRect().height;
    done.hidden = true; done.style.visibility = '';
    return Math.ceil(h);
  }
  function finish() {
    stepName.textContent = 'Photograph developed'; stepHint.textContent = '';
    fillFinalPanel();
    setDots(true);
    fadeIn(done);
  }

  var dl = null, canSave = true;
  try {
    if (window.claude && window.claude.use) {
      canSave = false;
      window.claude.use('downloads').then(function (d) { dl = d; canSave = !!d; }, function () {});
    }
  } catch (e) {}
  function renderFinal(longEdge) {
    var k = Math.min(1, longEdge / Math.max(exportSrc.width, exportSrc.height));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(exportSrc.width * k)); c.height = Math.max(1, Math.round(exportSrc.height * k));
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(exportSrc, 0, 0, c.width, c.height);
    grainify(c, 28, Math.max(2, Math.max(c.width, c.height) / 600), 11);
    return c;
  }
  saveBtn.addEventListener('click', function () {
    saveBtn.disabled = true; saveNote.textContent = 'Preparing the print…';
    renderFinal(EXPORT_LONG).toBlob(function (blob) {
      if (!blob) { saveNote.textContent = 'The print could not be prepared.'; saveBtn.disabled = false; return; }
      if (dl) {
        dl.save({ filename: 'digital-darkroom-print.jpg', data: blob }).then(
          function () { saveNote.textContent = 'Saved.'; saveBtn.disabled = false; },
          function (er) {
            saveNote.textContent = (er && er.code === 'declined') ? 'Not saved.' : 'Saving is not available here.';
            saveBtn.disabled = false;
          });
      } else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'digital-darkroom-print.jpg';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        saveNote.textContent = ''; saveBtn.disabled = false;
      }
    }, 'image/jpeg', 0.92);
  });

  /* ---------- Start and reset ---------- */
  /* Put the room back to its dark starting state with a fresh, unexposed sheet on the easel */
  function resetRoom() {
    clearTimers();
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    STEP = 0; holding = false; exposed = false; expP = 0;
    tx = 0; ty = 0; drag = null; placed = false; canDrag = false;
    lamp.style.transition = 'none'; lamp.style.opacity = 0;
    flood.style.transition = 'none'; flood.style.opacity = 0;
    paper.getAnimations().forEach(function (an) { an.cancel(); });
    easel.getAnimations().forEach(function (an) { an.cancel(); });
    paper.className = 'paper';
    paper.style.transition = 'none'; paper.style.transform = '';
    paper.removeAttribute('tabindex'); paper.removeAttribute('role');
    paper.setAttribute('aria-label', 'Photographic paper on the easel');
    grab.hidden = true;
    photo.style.transition = 'none'; photo.style.opacity = 1; photo.style.filter = 'blur(16px) brightness(.16)';
    bench.classList.remove('develop'); bench.style.transition = ''; bench.style.minHeight = ''; controls.style.minHeight = '';
    easel.style.transition = '';
    tray.hidden = true; tray.className = 'tray'; tray.style.transition = ''; tray.style.opacity = ''; tray.style.transform = '';
    devBarWrap.hidden = true; devFill.style.transition = 'none'; devFill.style.width = '0';
    [ctl1, ctl2, ctl3, ctl4, done].forEach(function (el) { el.hidden = true; });
    void paper.offsetWidth;
    photo.style.transition = ''; lamp.style.transition = ''; paper.style.transition = '';
  }
  function startSequence() {
    resetRoom();
    intro.hidden = true;
    fadeIn(room);
    window.scrollTo(0, 0);
    enterEnlarger();
  }
  again.addEventListener('click', function () {
    resetRoom();
    room.hidden = true;
    brand.textContent = 'Digital Darkroom';
    err.textContent = '';
    intro.hidden = false;
    window.scrollTo(0, 0);
  });
})();
