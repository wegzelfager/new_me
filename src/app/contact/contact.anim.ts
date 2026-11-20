// @ts-nocheck  (plain-JS style on purpose: the same file powers the live preview)
export function initContact(host, gsap, ScrollTrigger) {
  const q = (s, r = host) => r.querySelector(s);
  const qa = (s, r = host) => Array.from(r.querySelectorAll(s));

  // words -> masked spans (also inside <em>)
  const split = el => {
    const out = [];
    const walk = n => Array.from(n.childNodes).forEach(c => {
      if (c.nodeType !== 3) return walk(c);
      const f = document.createDocumentFragment();
      (c.textContent || '').split(/(\s+)/).forEach(t => {
        if (!t.trim()) return void f.append(t);
        const s = document.createElement('span'), i = document.createElement('span');
        s.className = 'ctm'; i.className = 'ctmi'; i.textContent = t;
        s.append(i); out.push(i); f.append(s);
      });
      c.replaceWith(f);
    });
    walk(el);
    return out;
  };

  const section = q('.ct'), pin = q('#ct-pin'), term = q('.ct-term');
  const cur = q('.ct-cur'), ok = q('.ct-ok'), big = q('.ct-big');
  const lines = qa('.ct-ln'), ts = lines.map(l => q('.ct-t', l));
  const full = ts.map(t => t.textContent);
  const words = split(q('.ct-head'));
  const outs = [q('.ct-mail'), ...qa('.ct-soc a'), q('.ct-note')];
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const off = [];
    section.classList.add('ct--pin');

    // hidden start state (reverted automatically)
    ts.forEach(t => (t.textContent = ''));
    gsap.set(lines, { autoAlpha: 0 });
    gsap.set(ok, { autoAlpha: 0, y: 10 });
    gsap.set(term, { autoAlpha: 0, y: 80, rotation: 4 });
    gsap.set(words, { yPercent: 110, rotation: 6 });
    gsap.set(outs, { autoAlpha: 0, yPercent: 60 });

    // 1) rounded top corners flatten as the section docks
    gsap.fromTo(section, { '--r': '64px' }, {
      '--r': '0px', ease: 'none',
      scrollTrigger: { trigger: host, start: 'top bottom', end: 'top top', scrub: true },
    });
    // 2) giant outlined "hello()" drifts sideways
    gsap.fromTo(big, { xPercent: 25 }, {
      xPercent: -35, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom bottom', scrub: true },
    });

    // 3) pinned story: scroll types the git commands, "pushes" the terminal away, reveals the CTA
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: pin, start: 'top top', end: '+=260%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
    });
    tl.to(term, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.5, ease: 'power3.out' });
    lines.forEach((l, i) => {
      const o = { n: 0 };
      tl.to(l, { autoAlpha: 1, duration: 0.05 }).to(o, {
        n: full[i].length,
        duration: full[i].length * 0.03,
        onUpdate: () => {
          ts[i].textContent = full[i].slice(0, Math.round(o.n));
          ts[i].after(cur);
        },
      });
    });
    tl.to(ok, { autoAlpha: 1, y: 0, duration: 0.3 })
      .to(term, { yPercent: -130, rotation: -5, scale: 0.85, autoAlpha: 0, duration: 0.8, ease: 'power3.in' }, '+=0.4')
      .to(words, { yPercent: 0, rotation: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }, '<0.35')
      .to(outs, { autoAlpha: 1, yPercent: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out' }, '>-0.2');

    // 4) marquee that speeds up with scroll velocity
    const mq = gsap.to(q('.ct-mq-in'), { xPercent: -50, ease: 'none', duration: 22, repeat: -1 });
    ScrollTrigger.create({
      trigger: section, start: 'top bottom', end: 'bottom top',
      onUpdate: s => gsap.to(mq, {
        timeScale: 1 + Math.abs(s.getVelocity()) / 250, duration: 0.2, overwrite: true,
        onComplete: () => gsap.to(mq, { timeScale: 1, duration: 1 }),
      }),
    });

    // 5) magnetic links (mouse devices only)
    if (matchMedia('(hover: hover)').matches) {
      outs.slice(0, -1).forEach((el, i) => {
        const k = i ? 0.3 : 0.12;
        const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
        const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
        const mv = e => {
          const r = el.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * k);
          y((e.clientY - r.top - r.height / 2) * k);
        };
        const lv = () => { x(0); y(0); };
        el.addEventListener('mousemove', mv);
        el.addEventListener('mouseleave', lv);
        off.push(() => { el.removeEventListener('mousemove', mv); el.removeEventListener('mouseleave', lv); });
      });
    }

    return () => {
      off.forEach(f => f());
      section.classList.remove('ct--pin');
      ts.forEach((t, i) => (t.textContent = full[i]));
      q('.ct-body').append(cur);
    };
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  return () => mm.revert();
}
