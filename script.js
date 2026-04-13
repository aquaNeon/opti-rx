/* ════════════════════════════════════════════════════════════════
   OptimizeRx — Scroll X Animation
   Requires: GSAP 3.x + ScrollTrigger plugin

   HOW IT WORKS
   ─────────────
   • The section is pinned for (numSlides − 1) × 100 vh of scroll.
   • A single GSAP timeline drives all transitions. ScrollTrigger
     maps the pinned scroll distance to that timeline (scrub).
   • Per transition (1 unit of timeline time):
       0.00 → 0.45  EXIT current slide   (elements slide out to sides)
       0.55 → 1.00  ENTER next slide     (elements slide in from sides)
     The 0.10-unit gap is a clean beat between exit and entry.
   • X bars travel X_OFFSET px; text labels travel TXT_OFFSET px.
     This layered offset creates a parallax depth between the X
     graphic and the surrounding copy.

   WEBFLOW DATA ATTRIBUTES
   ────────────────────────
   data-scroll-scene    → outer section wrapper
   data-slide           → each slide article  (value = 0-based index)
   data-anim="x-a"      → X bar  \  (animates from/to left)
   data-anim="x-b"      → X bar  /  (animates from/to right)
   data-anim="left"     → left text label
   data-anim="right"    → right text label
   data-anim="up"       → badges / elements that fade + rise from below
   data-dot             → nav dot button    (value = slide index)
   ════════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

(function () {

  /* ── Locate elements ───────────────────────────────────────── */
  const scene  = document.querySelector('[data-scroll-scene]');
  if (!scene) return;

  const slides = gsap.utils.toArray('[data-slide]',  scene);
  const dots   = gsap.utils.toArray('[data-dot]',    scene);
  const n      = slides.length;
  if (n < 2) return;

  /* ── Travel offsets ────────────────────────────────────────────
     X bars use a larger offset so the two halves look clearly
     split before they meet. Because .x-wrap has overflow:hidden,
     bars are clipped at the container edge during the travel —
     making them look like they emerge from inside the X box.
     Text labels use a shorter, gentler travel.
     Badges (data-anim="up") fade and rise slightly from below.  */
  const X_OFFSET   = 130;   // px — X bar travel (left bar goes −, right bar +)
  const TXT_OFFSET = 50;    // px — text label travel
  const UP_OFFSET  = 24;    // px — badge fade-up distance

  /* ── Helper: get animated child elements of a slide ─────────── */
  function anims(slide) {
    return {
      xa:   slide.querySelectorAll('[data-anim="x-a"]'),
      xb:   slide.querySelectorAll('[data-anim="x-b"]'),
      left: slide.querySelectorAll('[data-anim="left"]'),
      rght: slide.querySelectorAll('[data-anim="right"]'),
      up:   slide.querySelectorAll('[data-anim="up"]'),
    };
  }

  /* ── Initial states ────────────────────────────────────────────
     Slide 0 is already assembled and visible.
     All other slides have their elements offset and invisible.   */
  slides.forEach((slide, i) => {
    const a = anims(slide);
    if (i === 0) {
      // Slide 0 is fully assembled at rest position
      gsap.set([a.xa, a.xb, a.left, a.rght], { x: 0,         autoAlpha: 1 });
      gsap.set(a.up,                           { y: 0,         autoAlpha: 1 });
    } else {
      // Other slides wait off to the sides at their respective travel distances
      // (text at TXT_OFFSET, X bars at X_OFFSET — matches the enter tween deltas)
      gsap.set(a.xa,   { x: -X_OFFSET,   autoAlpha: 0 });
      gsap.set(a.xb,   { x:  X_OFFSET,   autoAlpha: 0 });
      gsap.set(a.left, { x: -TXT_OFFSET, autoAlpha: 0 });
      gsap.set(a.rght, { x:  TXT_OFFSET, autoAlpha: 0 });
      gsap.set(a.up,   { y:  UP_OFFSET,  autoAlpha: 0 });
    }
  });

  /* ── Master timeline ───────────────────────────────────────── */
  const tl = gsap.timeline();

  for (let i = 0; i < n - 1; i++) {
    const cur = anims(slides[i]);
    const nxt = anims(slides[i + 1]);
    const p   = i;               // base timeline position

    /* ── EXIT current ──────────────────────────────────────── */

    // X bar \ slides back to the left
    tl.to(cur.xa, {
      x: -X_OFFSET, autoAlpha: 0,
      duration: 0.45, ease: 'none',
    }, p);

    // X bar / slides back to the right
    tl.to(cur.xb, {
      x:  X_OFFSET, autoAlpha: 0,
      duration: 0.45, ease: 'none',
    }, p);

    // Left text fades and drifts left (shorter travel)
    tl.to(cur.left, {
      x: -TXT_OFFSET, autoAlpha: 0,
      duration: 0.45, ease: 'none',
    }, p);

    // Right text fades and drifts right
    tl.to(cur.rght, {
      x:  TXT_OFFSET, autoAlpha: 0,
      duration: 0.45, ease: 'none',
    }, p);

    // Badges fade and drop down
    tl.to(cur.up, {
      y: UP_OFFSET, autoAlpha: 0,
      duration: 0.45, ease: 'none',
    }, p);

    /* ── ENTER next ────────────────────────────────────────── */
    // (nxt elements start hidden at ±offset — set by initial state
    //  or left there by a previous exit tween)

    // X bar \ comes in from the left
    tl.to(nxt.xa, {
      x: 0, autoAlpha: 1,
      duration: 0.45, ease: 'none',
    }, p + 0.55);

    // X bar / comes in from the right
    tl.to(nxt.xb, {
      x: 0, autoAlpha: 1,
      duration: 0.45, ease: 'none',
    }, p + 0.55);

    // Left text drifts in from the left
    tl.to(nxt.left, {
      x: 0, autoAlpha: 1,
      duration: 0.45, ease: 'none',
    }, p + 0.55);

    // Right text drifts in from the right
    tl.to(nxt.rght, {
      x: 0, autoAlpha: 1,
      duration: 0.45, ease: 'none',
    }, p + 0.55);

    // Badges rise up into position
    tl.to(nxt.up, {
      y: 0, autoAlpha: 1,
      duration: 0.45, ease: 'none',
    }, p + 0.55);
  }

  /* ── ScrollTrigger: pin the section, scrub the timeline ─────── */
  ScrollTrigger.create({
    trigger:    scene,
    pin:        true,
    pinSpacing: true,
    start:      'top top',
    // Total pinned scroll = (n-1) full viewport heights
    end:        () => `+=${(n - 1) * window.innerHeight}`,
    // scrub value (seconds) = how long the playhead chases the scroll.
    // Higher = more inertia / "weighted" feel.
    scrub:      1.5,
    animation:  tl,

    onUpdate(self) {
      // Highlight the dot that corresponds to the current slide
      const raw    = self.progress * (n - 1);
      const active = Math.min(Math.round(raw), n - 1);
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
    },
  });

  /* ── Dot click → smooth-scroll to that slide ────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const sceneTop   = scene.getBoundingClientRect().top + window.scrollY;
      const totalExtra = (n - 1) * window.innerHeight;
      const target     = sceneTop + (i / (n - 1)) * totalExtra;
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });

  /* ── Refresh on resize so pin dimensions stay accurate ──────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  });

})();
