// @ts-nocheck (plain-JS style for portable animation logic)
export function initCertificates(host, gsap, ScrollTrigger, onIndexChange) {
  const q = (s, r = host) => r.querySelector(s);
  const qa = (s, r = host) => Array.from(r.querySelectorAll(s));

  const section = q('#cert-section');
  const pin = q('#cert-pin');
  const stackWrap = q('#cert-stack-wrap');
  const stackEl = q('#cert-stack');
  const sheets = qa('.cert-sheet');
  const seals = qa('.cert-seal-spin');
  const railBtns = qa('.cert-rail-item');
  const counterEl = q('#cert-count-num');
  const titleWords = qa('.cmi');

  const n = sheets.length;
  if (!section || !pin || n === 0) return () => {};

  const mm = gsap.matchMedia();
  const cleanups = [];

  // ─────────────────────────────────────────────────────────────
  // DESKTOP  (≥801px) : pin + scrub + tilt — untouched behaviour
  // ─────────────────────────────────────────────────────────────
  mm.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('cert--pinned');

    // Top-corner radius animation as section docks to viewport top
    gsap.fromTo(
      section,
      { '--r': '64px' },
      {
        '--r': '0px',
        ease: 'none',
        scrollTrigger: {
          trigger: host,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      }
    );

    // Title word reveal
    gsap.set(titleWords, { yPercent: 110, rotation: 6 });
    gsap.to(titleWords, {
      yPercent: 0,
      rotation: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: q('.cert-title'),
        start: 'top 85%',
        once: true,
      },
    });

    // Initial sheet stack poses
    sheets.forEach((sheet, i) => {
      gsap.set(sheet, {
        y: i * 20,
        x: 0,
        scale: 1 - i * 0.05,
        rotation: i === 0 ? 0 : (i % 2 === 1 ? -2.2 : 2.2),
        autoAlpha: 1,
        zIndex: 10 - i,
        transformOrigin: '50% 100%',
        pointerEvents: i === 0 ? 'auto' : 'none',
      });
    });

    let curIdx = 0;
    const updateActiveUI = (idx) => {
      if (idx === curIdx) return;
      curIdx = idx;
      if (onIndexChange) onIndexChange(idx);
      railBtns.forEach((btn, i) => {
        const active = i === idx;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-current', active ? 'true' : 'false');
      });
      sheets.forEach((sheet, i) => {
        sheet.style.pointerEvents = i === idx ? 'auto' : 'none';
      });
      if (counterEl) {
        counterEl.textContent = `0${idx + 1}`;
        gsap.fromTo(
          counterEl,
          { yPercent: 40, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', overwrite: true }
        );
      }
    };

    const pinDistance = window.innerHeight * 0.8 * (n - 1) * 1.5;

    const tl = gsap.timeline({
      defaults: { ease: 'power1.inOut' },
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${pinDistance}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.min(n - 1, Math.round(self.progress * (n - 1)));
          updateActiveUI(idx);
        },
      },
    });

    // Rotating seals across the entire desktop scroll
    if (seals.length) {
      tl.to(seals, { rotation: 720, duration: n - 1, ease: 'none', transformOrigin: '50% 50%' }, 0);
    }

    // Sheet flight choreography (desktop: fly up with slight horizontal spread)
    for (let step = 0; step < n - 1; step++) {
      const exitX = step % 2 === 0 ? 20 : -20;
      tl.to(sheets[step], { xPercent: exitX, yPercent: -130, rotation: step % 2 === 0 ? 8 : -8, duration: 1 }, step);
      tl.to(sheets[step], { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, step + 0.7);
      for (let rem = step + 1; rem < n; rem++) {
        const depth = rem - (step + 1);
        tl.to(sheets[rem], {
          y: depth * 20,
          scale: 1 - depth * 0.05,
          rotation: depth === 0 ? 0 : (depth % 2 === 1 ? -2.2 : 2.2),
          duration: 1,
        }, step);
      }
    }

    // Desktop scroll-to-certificate handler
    const onScrollToCert = (e) => {
      const idx = e.detail?.index;
      if (typeof idx !== 'number') return;
      const st = tl.scrollTrigger;
      if (!st) return;
      window.scrollTo({ top: st.start + (st.end - st.start) * (idx / (n - 1)), behavior: 'smooth' });
    };
    window.addEventListener('scroll-to-certificate', onScrollToCert);
    cleanups.push(() => window.removeEventListener('scroll-to-certificate', onScrollToCert));

    // Pointer tilt
    if (matchMedia('(hover: hover)').matches && stackEl) {
      gsap.set(stackWrap, { perspective: 900 });
      const rx = gsap.quickTo(stackEl, 'rotationX', { duration: 0.5, ease: 'power3' });
      const ry = gsap.quickTo(stackEl, 'rotationY', { duration: 0.5, ease: 'power3' });
      const onMM = (e) => {
        const r = stackEl.getBoundingClientRect();
        rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
        ry(((e.clientX - r.left) / r.width - 0.5) * 12);
      };
      const onML = () => { rx(0); ry(0); };
      stackWrap.addEventListener('mousemove', onMM);
      stackWrap.addEventListener('mouseleave', onML);
      cleanups.push(() => {
        stackWrap.removeEventListener('mousemove', onMM);
        stackWrap.removeEventListener('mouseleave', onML);
      });
    }

    return () => {
      cleanups.forEach(fn => fn());
      section.classList.remove('cert--pinned');
      sheets.forEach(s => gsap.set(s, { clearProps: 'all' }));
      seals.forEach(s => gsap.set(s, { clearProps: 'all' }));
    };
  });

  // ─────────────────────────────────────────────────────────────
  // MOBILE  (≤800px) : NO pin, NO scrub — tap/swipe deck
  // ─────────────────────────────────────────────────────────────
  mm.add('(max-width: 800px) and (prefers-reduced-motion: no-preference)', () => {

    // Mark section so CSS knows we're in mobile-deck mode
    section.classList.add('cert--mobile-deck');

    // Title reveal (one-shot, fires when title enters viewport)
    gsap.set(titleWords, { yPercent: 110, rotation: 4 });
    gsap.to(titleWords, {
      yPercent: 0,
      rotation: 0,
      duration: 0.75,
      stagger: 0.07,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: q('.cert-title'),
        start: 'top 88%',
        once: true,
      },
    });

    // ── Deck layout: grid stacking ──────────────────────────────
    // All sheets occupy grid-area 1/1 so the tallest drives height.
    // Initial z-stack offsets are CSS-only (transform via dataset).
    // We set gsap transform baseline so GSAP owns the transform.

    const PEEK   = 10;   // px each background card peeks down
    const SCALE  = 0.04; // scale step per depth level
    const ROT    = 2.0;  // rotation step per depth level

    const setPose = (sheet, depth, instant = false) => {
      const props = {
        y: depth * PEEK,
        scale: 1 - depth * SCALE,
        rotation: depth === 0 ? 0 : (depth % 2 === 1 ? -ROT : ROT),
        xPercent: 0,
        autoAlpha: 1,
        zIndex: n - depth,
        transformOrigin: '50% 100%',
        ease: 'power2.out',
      };
      if (instant) {
        gsap.set(sheet, props);
      } else {
        gsap.to(sheet, { ...props, duration: 0.4 });
      }
    };

    // Initialise all sheets at their depth positions
    sheets.forEach((sheet, i) => {
      setPose(sheet, i, true);
      sheet.style.pointerEvents = i === 0 ? 'auto' : 'none';
    });

    let activeIdx = 0;

    const goTo = (nextIdx) => {
      if (nextIdx === activeIdx || nextIdx < 0 || nextIdx >= n) return;

      const prev = activeIdx;
      activeIdx = nextIdx;

      // Update Angular binding (triggers *ngFor class changes in template)
      if (onIndexChange) onIndexChange(activeIdx);

      // Update rail pill states
      railBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === activeIdx);
        btn.setAttribute('aria-current', i === activeIdx ? 'true' : 'false');
      });

      if (counterEl) {
        counterEl.textContent = `0${activeIdx + 1}`;
      }

      // Re-order deck: shift sheets so activeIdx is on top
      // We rotate the logical order: slice from activeIdx → wrap
      const order = sheets.map((_, i) => (i - activeIdx + n) % n);

      sheets.forEach((sheet, i) => {
        const depth = order[i];
        setPose(sheet, depth);
        sheet.style.pointerEvents = i === activeIdx ? 'auto' : 'none';
      });
    };

    // Rail pill click → switch card (no page scroll)
    const onScrollToCert = (e) => {
      const idx = e.detail?.index;
      if (typeof idx === 'number') goTo(idx);
    };
    window.addEventListener('scroll-to-certificate', onScrollToCert);

    // Swipe on the top card: minimal gesture detection
    let touchStartX = 0;
    let touchStartY = 0;
    if (stackEl) {
      const onTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      };
      const onTouchEnd = (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        // Only horizontal swipes (abs dx > 36 and larger than vertical)
        if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) {
            goTo((activeIdx + 1) % n);         // swipe left → next
          } else {
            goTo((activeIdx - 1 + n) % n);     // swipe right → prev
          }
        }
      };
      stackEl.addEventListener('touchstart', onTouchStart, { passive: true });
      stackEl.addEventListener('touchend', onTouchEnd, { passive: true });
      cleanups.push(() => {
        stackEl.removeEventListener('touchstart', onTouchStart);
        stackEl.removeEventListener('touchend', onTouchEnd);
      });
    }

    return () => {
      cleanups.forEach(fn => fn());
      window.removeEventListener('scroll-to-certificate', onScrollToCert);
      section.classList.remove('cert--mobile-deck');
      sheets.forEach(s => gsap.set(s, { clearProps: 'all' }));
      seals.forEach(s => gsap.set(s, { clearProps: 'all' }));
    };
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  return () => mm.revert();
}
