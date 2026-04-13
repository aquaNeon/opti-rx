/* ════════════════════════════════════════════════════════════════
   OptimizeRx — Scroll X Animation  v3
   Requires: GSAP 3.x + ScrollTrigger

   ANIMATION MODEL
   ───────────────
   Each slide owns one .x-wrap with two .x-half images (left.svg
   and right.svg). All x-wraps sit at the same centre point in the
   viewport because every .slide is position:absolute over the others.

   THREE DEPTH LAYERS are always visible simultaneously, giving the
   perspective-recession illusion from the reference images:

     front  scale 1.00  opacity 1.00   ← current / assembling
     mid    scale 0.68  opacity 0.48   ← one slide back
     back   scale 0.48  opacity 0.18   ← two slides back
     gone   scale 0.34  opacity 0.00   ← three+ slides back (hidden)

   TWO SEPARATE ANIMATION CHANNELS per slide:

   1. ASSEMBLY  (.x-half images, data-anim="x-a" / "x-b")
      Left half:  x  −OFFSET → 0   (slides INWARD from left, once only)
      Right half: x  +OFFSET → 0   (slides INWARD from right, once only)
      opacity: 0 → 1 while converging so bars materialise as they meet.
      After assembly the halves NEVER travel outward — they stay at x:0
      while the wrap handles all further movement.

   2. DEPTH  (.x-wrap)
      front → mid → back → gone via scale + opacity on the whole wrap.
      The assembled halves ride along passively — zero additional motion.

   TIMELINE STRUCTURE  (1 unit per transition, n−1 transitions total)
   ──────────────────
     p + 0.00 … p + 0.55   ASSEMBLE  new halves + text slide to centre
     p + 0.15 … p + 1.00   DEPTH     all visible x-wraps step one level back
                            (overlap creates a smooth layered feel)

   WEBFLOW ATTRIBUTES
   ──────────────────
   data-scroll-scene   outer section wrapper
   data-slide          slide article (0-based index value)
   data-anim="x-a"     left  SVG half  → animates left  → 0
   data-anim="x-b"     right SVG half  → animates right → 0
   data-anim="left"    left  text label
   data-anim="right"   right text label
   data-anim="up"      badges (rise from below)
   data-dot            nav dot button
   ════════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

(function () {

  /* ── Element lookup ────────────────────────────────────────── */
  const scene  = document.querySelector('[data-scroll-scene]');
  if (!scene) return;

  const slides = gsap.utils.toArray('[data-slide]',  scene);
  const dots   = gsap.utils.toArray('[data-dot]',    scene);
  const n      = slides.length;
  if (n < 2) return;

  /* ── Constants ─────────────────────────────────────────────── */
  const X_OFFSET   = 140;   // px — how far each SVG half slides inward
  const TXT_OFFSET = 52;    // px — text label travel
  const UP_OFFSET  = 22;    // px — badge rise distance

  /* Depth levels applied to .x-wrap (the whole assembled X) */
  const DEPTH = {
    front: { scale: 1.00, opacity: 1.00 },
    mid:   { scale: 0.68, opacity: 0.48 },
    back:  { scale: 0.48, opacity: 0.18 },
    gone:  { scale: 0.34, opacity: 0.00 },
  };

  /* ── Per-slide element references ──────────────────────────── */
  function refs(slide) {
    return {
      xwrap: slide.querySelector('.x-wrap'),      // depth target
      xa:    slide.querySelectorAll('[data-anim="x-a"]'),  // left half
      xb:    slide.querySelectorAll('[data-anim="x-b"]'),  // right half
      left:  slide.querySelectorAll('[data-anim="left"]'),
      rght:  slide.querySelectorAll('[data-anim="right"]'),
      up:    slide.querySelectorAll('[data-anim="up"]'),
    };
  }

  /* ── Initial states ────────────────────────────────────────────
     Slide 0: assembled and at front depth, all text visible.
     Slides 1+: halves separated and invisible; x-wrap at full
     scale so there's a clean baseline for the depth animation.   */
  slides.forEach((slide, i) => {
    const r = refs(slide);
    if (i === 0) {
      gsap.set(r.xwrap,          { ...DEPTH.front });
      gsap.set([r.xa, r.xb],     { x: 0,            opacity: 1  });
      gsap.set([r.left, r.rght], { x: 0,             autoAlpha: 1 });
      gsap.set(r.up,             { y: 0,             autoAlpha: 1 });
    } else {
      /* x-wrap at scale:1, opacity:1 but halves invisible →
         the wrap appears empty until its halves assemble.        */
      gsap.set(r.xwrap,  { scale: 1,         opacity: 1 });
      gsap.set(r.xa,     { x: -X_OFFSET,     opacity: 0 });
      gsap.set(r.xb,     { x:  X_OFFSET,     opacity: 0 });
      gsap.set(r.left,   { x: -TXT_OFFSET,   autoAlpha: 0 });
      gsap.set(r.rght,   { x:  TXT_OFFSET,   autoAlpha: 0 });
      gsap.set(r.up,     { y:  UP_OFFSET,    autoAlpha: 0 });
    }
  });

  /* ── Master timeline ───────────────────────────────────────────
     For each transition i → i+1 at base position p = i:          */
  const tl = gsap.timeline();

  for (let i = 0; i < n - 1; i++) {
    const cur  = refs(slides[i]);
    const nxt  = refs(slides[i + 1]);
    const prev = i >= 1 ? refs(slides[i - 1]) : null;
    const old  = i >= 2 ? refs(slides[i - 2]) : null;
    const p    = i;

    /* ── 1.  ASSEMBLE: left/right halves + text converge to 0 ── */

    // Left SVG half slides in from the left
    tl.to(nxt.xa, { x: 0, opacity: 1, duration: 0.55, ease: 'none' }, p);

    // Right SVG half slides in from the right
    tl.to(nxt.xb, { x: 0, opacity: 1, duration: 0.55, ease: 'none' }, p);

    // Left label slides inward (never moves outward on exit — only fades)
    tl.to(nxt.left, { x: 0, autoAlpha: 1, duration: 0.55, ease: 'none' }, p);

    // Right label slides inward
    tl.to(nxt.rght, { x: 0, autoAlpha: 1, duration: 0.55, ease: 'none' }, p);

    // Badges rise up
    tl.to(nxt.up, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'none' }, p);

    /* ── 2.  DEPTH: step every visible X one level further back ─ */
    const pushStart = p + 0.15;
    const pushDur   = 0.85;

    // Current (front → mid) — assembled halves stay at x:0, wrap recedes
    tl.to(cur.xwrap, { ...DEPTH.mid, duration: pushDur, ease: 'none' }, pushStart);
    // Text of current fades in place — never travels outward
    tl.to([cur.left, cur.rght, cur.up], { autoAlpha: 0, duration: 0.28, ease: 'none' }, pushStart);

    // Previous (mid → back)
    if (prev) {
      tl.to(prev.xwrap, { ...DEPTH.back, duration: pushDur, ease: 'none' }, pushStart);
    }

    // Oldest (back → gone)
    if (old) {
      tl.to(old.xwrap, { ...DEPTH.gone, duration: pushDur * 0.6, ease: 'none' }, pushStart);
    }
  }

  /* ── ScrollTrigger ─────────────────────────────────────────── */
  ScrollTrigger.create({
    trigger:    scene,
    pin:        true,
    pinSpacing: true,
    start:      'top top',
    end:        () => `+=${(n - 1) * window.innerHeight}`,
    scrub:      1.5,        // weighted lag gives the "pushing back" weight
    animation:  tl,

    onUpdate(self) {
      const idx = Math.min(Math.round(self.progress * (n - 1)), n - 1);
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    },
  });

  /* ── Dot click → scroll to that slide ─────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const top   = scene.getBoundingClientRect().top + window.scrollY;
      const extra = (n - 1) * window.innerHeight;
      window.scrollTo({ top: top + (i / (n - 1)) * extra, behavior: 'smooth' });
    });
  });

  /* ── Resize ─────────────────────────────────────────────────── */
  let raf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => ScrollTrigger.refresh());
  });

})();
