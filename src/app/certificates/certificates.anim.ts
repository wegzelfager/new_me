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

  const isTouch = matchMedia('(pointer: coarse)').matches;
  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: '(min-width: 801px) and (prefers-reduced-motion: no-preference)',
      isMobile: '(max-width: 800px) and (prefers-reduced-motion: no-preference)',
    },
    (context) => {
      const { isMobile } = context.conditions;
      const off = [];
      section.classList.add('cert--pinned');

      // 1) Section top radius animation
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

      // 3) Initial sheet poses:
      // All sheets start with 100% solid opacity and clean zIndex hierarchy
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

        // Smooth scroll active rail pill into view on mobile
        if (isMobile && railBtns[idx]) {
          railBtns[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        // Only active top card receives interactions
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

      // 4) Timeline scrub
      // Pin section with touch-tuned scrub
      const pinDistance = window.innerHeight * 0.8 * (n - 1) * (isMobile ? 1.25 : 1.5);

      const tl = gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${pinDistance}`,
          pin: true,
          scrub: isTouch ? 0.25 : 0.6,
          anticipatePin: 1,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(n - 1, Math.round(self.progress * (n - 1)));
            updateActiveUI(idx);
          },
        },
      });

      // Rotating seals across the entire scroll
      if (seals.length) {
        tl.to(seals, { rotation: 720, duration: n - 1, ease: 'none', transformOrigin: '50% 50%' }, 0);
      }

      // Sheet flight choreography:
      // On mobile: cards fly up-and-out (slight X tilt, mostly Y) staying within the clipped stage
      // On desktop: cards fly up and outward with more horizontal spread
      // In both: the card remains 100% solid and opaque until 70% cleared
      for (let step = 0; step < n - 1; step++) {
        const exitingSheet = sheets[step];
        const exitX = step % 2 === 0 ? 15 : -15;
        const exitY = -130;
        const exitRot = step % 2 === 0 ? 8 : -8;

        // 1. Movement of the exiting sheet
        tl.to(
          exitingSheet,
          {
            xPercent: exitX,
            yPercent: exitY,
            rotation: exitRot,
            duration: 1,
            ease: 'power1.inOut',
          },
          step
        );

        // 2. Opacity fade occurs ONLY at the end of flight, preventing any bleed-through
        tl.to(
          exitingSheet,
          {
            autoAlpha: 0,
            duration: 0.3,
            ease: 'power2.in',
          },
          step + 0.7
        );

        // 3. Promote remaining sheets in stack
        for (let remaining = step + 1; remaining < n; remaining++) {
          const depth = remaining - (step + 1);
          const targetY = depth * 20;
          const targetScale = 1 - depth * 0.05;
          const targetRot = depth === 0 ? 0 : (depth % 2 === 1 ? -2.2 : 2.2);

          tl.to(
            sheets[remaining],
            {
              y: targetY,
              scale: targetScale,
              rotation: targetRot,
              duration: 1,
              ease: 'power1.inOut',
            },
            step
          );
        }
      }

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
      if (!isMobile && matchMedia('(hover: hover)').matches && stackEl) {
        gsap.set(stackWrap, { perspective: 900 });
        const rx = gsap.quickTo(stackEl, 'rotationX', { duration: 0.5, ease: 'power3' });
        const ry = gsap.quickTo(stackEl, 'rotationY', { duration: 0.5, ease: 'power3' });

        const onMouseMove = (e) => {
          const r = stackEl.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          rx(-ny * 10);
          ry(nx * 12);
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
    }
  );

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  return () => mm.revert();
}
