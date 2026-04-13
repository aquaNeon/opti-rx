/* ════════════════════════════════════════════════════════════════
   OptimizeRx — Scroll X Animation  v4
   Requires: GSAP 3.x + ScrollTrigger

   7-STATE MODEL
   ─────────────
   State 0  — Start    (empty scene, white bg)
   State 1  — X #1     assembles  (slide 0)
   State 2  — X #2     assembles  (slide 1)
   State 3  — X #3     assembles  (slide 2)
   State 4  — X #4     assembles  (slide 3) → dark bg transition
   State 5  — X #5     assembles  (slide 4)
   State 6  — Final    (all Xs gone → text + button)

   THREE DEPTH LAYERS visible simultaneously:
     front  scale 1.00  opacity 1.00   ← just assembled
     mid    scale 0.68  opacity 0.48   ← one slide back
     back   scale 0.48  opacity 0.18   ← two slides back
     gone   scale 0.34  opacity 0.00   ← three+ slides back / final

   TWO ANIMATION CHANNELS per slide:
   1. ASSEMBLY  (.x-half)  x: ±OFFSET → 0  (inward only, once)
   2. DEPTH     (.x-wrap)  scale + opacity + y (horizon vanish)

   TIMELINE  (6 transitions, one per state change)
   ───────────────────────────────────────────────
   p + 0.00 … p + 0.55   ASSEMBLE new halves + labels
   p + 0.15 … p + 1.00   DEPTH    all visible x-wraps step back
   p = 3                  BG       white → dark navy + atmo fade-in
   p = 5                  FINAL    push all Xs to gone, reveal text
   ════════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

(function () {

  /* ── Element lookup ────────────────────────────────────────── */
  const scene  = document.querySelector('[data-scroll-scene]');
  if (!scene) return;

  const atmo   = scene.querySelector('.scene-atmo');
  const slides = gsap.utils.toArray('[data-slide]',  scene);
  const dots   = gsap.utils.toArray('[data-dot]',    scene);
  const n      = slides.length;   // 6
  if (n < 2) return;

  /* ── Constants ─────────────────────────────────────────────── */
  const X_OFFSET   = 140;   // px — SVG half travel distance
  const TXT_OFFSET = 52;    // px — label pill travel distance

  /* Depth levels applied to .x-wrap.
     Negative y combined with scale-down = vanishing-point horizon. */
  const DEPTH = {
    front: { scale: 1.00, opacity: 1.00, y:   0 },
    mid:   { scale: 0.68, opacity: 0.48, y: -38 },
    back:  { scale: 0.48, opacity: 0.18, y: -68 },
    gone:  { scale: 0.34, opacity: 0.00, y: -88 },
  };

  /* ── Per-slide element references ──────────────────────────── */
  function refs(slide) {
    return {
      xwrap: slide.querySelector('.x-wrap'),
      xa:    slide.querySelectorAll('[data-anim="x-a"]'),
      xb:    slide.querySelectorAll('[data-anim="x-b"]'),
      left:  slide.querySelectorAll('[data-anim="left"]'),
      rght:  slide.querySelectorAll('[data-anim="right"]'),
    };
  }

  /* ── Initial states ────────────────────────────────────────────
     State 0 = completely empty scene: all slides hidden.
     x-wraps stay at scale:1/opacity:1 so GSAP depth tweens
     start from a clean baseline — only the halves are invisible. */
  gsap.set(scene, { backgroundColor: '#ffffff' });
  if (atmo) gsap.set(atmo, { opacity: 0 });

  slides.forEach((slide) => {
    const r = refs(slide);
    if (r.xwrap) gsap.set(r.xwrap, { scale: 1, opacity: 1, y: 0 });
    gsap.set(r.xa,   { x: -X_OFFSET,   opacity: 0    });
    gsap.set(r.xb,   { x:  X_OFFSET,   opacity: 0    });
    gsap.set(r.left, { x: -TXT_OFFSET, autoAlpha: 0  });
    gsap.set(r.rght, { x:  TXT_OFFSET, autoAlpha: 0  });
  });

  /* ── Master timeline ───────────────────────────────────────────
     6 transitions, one per state change (p = 0 … 5).             */
  const tl = gsap.timeline();

  for (let i = 0; i < n; i++) {
    const p   = i;
    const r_i = refs(slides[i]);

    /* ───────────────────────────────────────────────────────────
       Slides 0–4: assemble this slide's X then push existing back
       ─────────────────────────────────────────────────────────── */
    if (i < n - 1) {

      /* 1. ASSEMBLE — halves + labels converge inward to 0 */
      tl.to(r_i.xa,   { x: 0, opacity: 1,   duration: 0.55, ease: 'none' }, p);
      tl.to(r_i.xb,   { x: 0, opacity: 1,   duration: 0.55, ease: 'none' }, p);
      tl.to(r_i.left, { x: 0, autoAlpha: 1, duration: 0.55, ease: 'none' }, p);
      tl.to(r_i.rght, { x: 0, autoAlpha: 1, duration: 0.55, ease: 'none' }, p);

      /* 2. DEPTH — push assembled layers one level further back */
      const pushStart = p + 0.15;
      const pushDur   = 0.85;

      // slide i−1: front → mid
      if (i >= 1) {
        const rp = refs(slides[i - 1]);
        tl.to(rp.xwrap,              { ...DEPTH.mid, duration: pushDur, ease: 'none' }, pushStart);
        tl.to([rp.left, rp.rght],    { autoAlpha: 0, duration: 0.28,   ease: 'none' }, pushStart);
      }

      // slide i−2: mid → back
      if (i >= 2) {
        tl.to(refs(slides[i - 2]).xwrap, { ...DEPTH.back, duration: pushDur,       ease: 'none' }, pushStart);
      }

      // slide i−3: back → gone
      if (i >= 3) {
        tl.to(refs(slides[i - 3]).xwrap, { ...DEPTH.gone, duration: pushDur * 0.6, ease: 'none' }, pushStart);
      }

      /* 3. BACKGROUND — white → dark navy as X #4 (slide 3) enters */
      if (i === 3) {
        tl.to(scene, { backgroundColor: '#070916', duration: 0.7, ease: 'none' }, pushStart);
        if (atmo) tl.to(atmo, { opacity: 1, duration: 0.7, ease: 'none' }, pushStart);
      }

    /* ───────────────────────────────────────────────────────────
       Slide 5 (final): clear all Xs and reveal text + CTA
       ─────────────────────────────────────────────────────────── */
    } else {

      // Push every assembled X slide to gone simultaneously
      for (let j = 0; j < n - 1; j++) {
        const r_j = refs(slides[j]);
        tl.to(r_j.xwrap,           { ...DEPTH.gone, duration: 0.5, ease: 'none' }, p);
        tl.to([r_j.left, r_j.rght], { autoAlpha: 0, duration: 0.2, ease: 'none' }, p);
      }

      // Reveal final content after Xs clear
      tl.to(r_i.rght, { x: 0, autoAlpha: 1, duration: 0.6, ease: 'none' }, p + 0.38);
    }
  }

  /* ── ScrollTrigger ─────────────────────────────────────────── */
  ScrollTrigger.create({
    trigger:    scene,
    pin:        true,
    pinSpacing: true,
    start:      'top top',
    end:        () => `+=${n * window.innerHeight}`,  // 6 × 100vh
    scrub:      1.5,
    animation:  tl,

    onUpdate(self) {
      // Map progress 0–1 across n transitions → active dot 0–(n-1)
      const idx = Math.min(Math.round(self.progress * n), n - 1);
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    },
  });

  /* ── Dot click → scroll to that state ─────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const top = scene.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + i * window.innerHeight, behavior: 'smooth' });
    });
  });

  /* ── Resize ─────────────────────────────────────────────────── */
  let raf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => ScrollTrigger.refresh());
  });

})();
