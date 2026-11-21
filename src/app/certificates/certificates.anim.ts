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

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const off = [];
    section.classList.add('cert--pinned');

    // 1) Rounded top corners animate --r from 64px to 0px as section docks
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

    // 2) Title word reveal
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

    // 3) Initial sheet poses: sheet i at depth i
    sheets.forEach((sheet, i) => {
      gsap.set(sheet, {
        y: i * 20,
        scale: 1 - i * 0.05,
        rotation: i === 0 ? 0 : (i % 2 === 1 ? -2.2 : 2.2),
        autoAlpha: i <= 2 ? 1 : 0,
        zIndex: 10 - i,
        transformOrigin: '50% 100%',
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

      if (counterEl) {
        counterEl.textContent = `0${idx + 1}`;
        gsap.fromTo(
          counterEl,
          { yPercent: 40, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', overwrite: true }
        );
      }
    };

    // 4) Pinned stage timeline with ScrollTrigger
    // Pin section for about 80% of viewport height of scroll per sheet
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
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.min(n - 1, Math.round(self.progress * (n - 1)));
          updateActiveUI(idx);
        },
      },
    });

    // Rotating seals across the entire scroll (720deg, svgOrigin "50 50")
    if (seals.length) {
      tl.to(seals, { rotation: 720, duration: n - 1, ease: 'none', svgOrigin: '50 50' }, 0);
    }

    // Sheet flight choreography:
    // Step 0: Sheet 0 flies out, Sheet 1 -> depth 0, Sheet 2 -> depth 1, Sheet 3 -> depth 2
    tl.to(sheets[0], { yPercent: -130, xPercent: 25, rotation: 10, autoAlpha: 0, duration: 1 }, 0)
      .to(sheets[1], { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 1 }, 0)
      .to(sheets[2], { y: 20, scale: 0.95, rotation: -2.2, autoAlpha: 1, duration: 1 }, 0)
      .to(sheets[3], { y: 40, scale: 0.9, rotation: 2.2, autoAlpha: 1, duration: 1 }, 0);

    // Step 1: Sheet 1 flies out, Sheet 2 -> depth 0, Sheet 3 -> depth 1
    tl.to(sheets[1], { yPercent: -130, xPercent: -25, rotation: -10, autoAlpha: 0, duration: 1 }, 1)
      .to(sheets[2], { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 1 }, 1)
      .to(sheets[3], { y: 20, scale: 0.95, rotation: -2.2, autoAlpha: 1, duration: 1 }, 1);

    // Step 2: Sheet 2 flies out, Sheet 3 -> depth 0
    tl.to(sheets[2], { yPercent: -130, xPercent: 25, rotation: 10, autoAlpha: 0, duration: 1 }, 2)
      .to(sheets[3], { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 1 }, 2);

    // Rail navigation click handling
    const onScrollToCert = (e) => {
      const idx = e.detail?.index;
      if (typeof idx !== 'number') return;
      const st = tl.scrollTrigger;
      if (!st) return;
      const targetScroll = st.start + (st.end - st.start) * (idx / (n - 1));
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    };
    window.addEventListener('scroll-to-certificate', onScrollToCert);
    off.push(() => window.removeEventListener('scroll-to-certificate', onScrollToCert));

    // 5) Pointer tilt on mouse devices only
    if (matchMedia('(hover: hover)').matches && stackEl) {
      gsap.set(stackWrap, { perspective: 900 });
      const rx = gsap.quickTo(stackEl, 'rotationX', { duration: 0.5, ease: 'power3' });
      const ry = gsap.quickTo(stackEl, 'rotationY', { duration: 0.5, ease: 'power3' });

      const onMouseMove = (e) => {
        const r = stackEl.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        rx(-ny * 10); // +-5deg
        ry(nx * 12);  // +-6deg
      };
      const onMouseLeave = () => {
        rx(0);
        ry(0);
      };

      stackWrap.addEventListener('mousemove', onMouseMove);
      stackWrap.addEventListener('mouseleave', onMouseLeave);
      off.push(() => {
        stackWrap.removeEventListener('mousemove', onMouseMove);
        stackWrap.removeEventListener('mouseleave', onMouseLeave);
      });
    }

    return () => {
      off.forEach((fn) => fn());
      section.classList.remove('cert--pinned');
      sheets.forEach((s) => gsap.set(s, { clearProps: 'all' }));
      seals.forEach((s) => gsap.set(s, { clearProps: 'all' }));
    };
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  return () => mm.revert();
}
