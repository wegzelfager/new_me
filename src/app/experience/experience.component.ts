import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Release {
  hash: string;
  ver: string;
  kind: string;
  role: string;
  org: string;
  when: string;
  desc: string;
  tags: string[];
  stat: { to: number; dec: number; pre: string; suf: string; text: string; label: string };
  diff: { sign: '+' | '−'; text: string }[];
}

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss'],
})
export class ExperienceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('xpHost', { static: true }) xpHost!: ElementRef<HTMLElement>;

  private ctx: ReturnType<typeof gsap.context> | null = null;
  private cleanups: Array<() => void> = [];

  readonly releases: Release[] = [
    {
      hash: 'd90b3a4 · chore: foundations',
      ver: 'v0.1.0',
      kind: 'training',
      role: 'Advanced Software Engineering',
      org: 'Digital Egypt Pioneers Initiative',
      when: 'Sep 2024 – Jul 2025',
      desc: 'A year inside the DEPI advanced track, building the engineering foundations everything after it runs on.',
      tags: ['Software Engineering', 'Architecture', 'Agile'],
      stat: { to: 11, dec: 0, pre: '', suf: ' mo', text: '11 mo', label: 'months on the advanced track' },
      diff: [
        { sign: '+', text: 'advanced software engineering' },
        { sign: '+', text: 'software architecture' },
      ],
    },
    {
      hash: '4f12e7c · chore: security',
      ver: 'v0.2.0',
      kind: 'training',
      role: 'Backend & Web Security',
      org: 'National Telecommunication Institute',
      when: 'Jul 2025 – Aug 2025',
      desc: 'An intensive NTI program on backend engineering and the security habits that production web apps need.',
      tags: ['Backend', 'Web Security'],
      stat: { to: 2, dec: 0, pre: '', suf: ' mo', text: '2 mo', label: 'months, backend and web security' },
      diff: [
        { sign: '+', text: 'backend engineering' },
        { sign: '+', text: 'web security' },
      ],
    },
    {
      hash: 'b82a6d3 · feat: banking',
      ver: 'v1.0.0',
      kind: 'contract',
      role: 'Full Stack Developer',
      org: 'Agricultural Bank of Egypt',
      when: 'Aug 2025 – Feb 2026',
      desc: 'Enterprise Angular and Node.js apps for internal banking operations, locked down with RBAC and secure authentication.',
      tags: ['Angular', 'Node.js', 'Express', 'MongoDB', 'MySQL'],
      stat: { to: 25, dec: 0, pre: '+', suf: '%', text: '+25%', label: 'data retrieval efficiency' },
      diff: [
        { sign: '+', text: 'granular RBAC and secure auth' },
        { sign: '+', text: 'legacy pipelines moved to MongoDB and MySQL' },
        { sign: '−', text: 'redundant query overhead' },
      ],
    },
    {
      hash: '9ce03f1 · feat: freelance',
      ver: 'HEAD',
      kind: 'live',
      role: 'Full Stack Developer',
      org: 'Freelance, international clients',
      when: 'Jul 2024 – now',
      desc: 'Production Angular and Node.js apps shipped on sprint timelines, with payment infrastructure and webhooks built to stay up.',
      tags: ['Angular', 'Node.js', 'Stripe', 'Paymob'],
      stat: { to: 99.9, dec: 1, pre: '', suf: '%', text: '99.9%', label: 'uptime on transaction pipelines' },
      diff: [
        { sign: '+', text: 'Stripe and Paymob billing automation' },
        { sign: '+', text: 'webhook handlers' },
        { sign: '−', text: '30% average API latency' },
      ],
    },
  ];

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => this.init());
  }

  private init(): void {
    const host = this.xpHost.nativeElement;
    const q = (s: string, r: ParentNode = host) => r.querySelector<HTMLElement>(s)!;
    const qa = (s: string, r: ParentNode = host) => Array.from(r.querySelectorAll<HTMLElement>(s));

    // Splits text (also inside nested tags) into word spans; mask = overflow-hidden wrapper + inner span
    const split = (el: HTMLElement, mask = false): HTMLElement[] => {
      const out: HTMLElement[] = [];
      const walk = (n: Node): void =>
        Array.from(n.childNodes).forEach(c => {
          if (c.nodeType !== 3) return walk(c);
          const f = document.createDocumentFragment();
          (c.textContent || '').split(/(\s+)/).forEach(t => {
            if (!t.trim()) return void f.append(t);
            const s = document.createElement('span');
            s.className = mask ? 'xm' : 'xw';
            let i = s;
            if (mask) {
              i = document.createElement('span');
              i.className = 'xmi';
              s.append(i);
            }
            i.textContent = t;
            out.push(i);
            f.append(s);
          });
          c.replaceWith(f);
        });
      walk(el);
      return out;
    };

    const section = q('.xp');
    const pin = q('#xp-pin');
    const track = q('#xp-track');
    const fill = q('.xp-rail-fill');
    const verEl = q('#xp-ver');
    const cntEl = q('#xp-cnt');
    const panels = qa('.xp-panel');
    const stops = qa('.xp-stop');
    const words = split(q('#xp-statement'));
    const per = panels.map(p => ({
      ttl: split(q('.xp-ttl', p), true),
      hash: q('.xp-hash', p),
      card: q('.xp-card', p),
      stat: q('[data-to]', p),
      diff: qa('.xp-diff li', p),
      big: q('.xp-big', p),
    }));
    const finals = per.map(p => p.stat.textContent || '');
    const n = per.length;

    const fmt = (el: HTMLElement, v: number) =>
      `${el.dataset['pre'] || ''}${v.toFixed(Number(el.dataset['dec'] || 0))}${el.dataset['suf'] || ''}`;

    // Hidden start state, restored automatically when the media query stops matching
    const prime = (isDesk: boolean) =>
      per.forEach(p => {
        if (isDesk) {
          gsap.set(p.ttl, { yPercent: 110, rotation: 6 });
          gsap.set(p.card, { autoAlpha: 0, y: 70, rotation: 5 });
          gsap.set([p.hash, ...p.diff], { autoAlpha: 0, x: -20 });
        }
        p.stat.textContent = fmt(p.stat, 0);
      });
    const restore = () => per.forEach((p, i) => (p.stat.textContent = finals[i]));

    this.ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      this.cleanups.push(() => mm.revert());

      mm.add(
        { ok: '(prefers-reduced-motion: no-preference)', desk: '(min-width: 801px)' },
        ctx => {
          const c = (ctx.conditions || {}) as Record<string, boolean>;
          if (!c['ok']) return;

          const done = new Set<number>();
          let reset: (() => void) | null = null;

          // One orchestrated moment per release: title, card, diff lines and the counter
          const reveal = (i: number) => {
            if (done.has(i)) return;
            done.add(i);
            ctx.add!(() => {
              const p = per[i];
              const o = { v: 0 };
              const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

              if (c['desk']) {
                tl.to(p.hash, { x: 0, autoAlpha: 1, duration: 0.7 }, 0)
                  .to(p.ttl, { yPercent: 0, rotation: 0, duration: 1.1, stagger: 0.07 }, 0.1)
                  .to(p.card, { y: 0, rotation: 0, autoAlpha: 1, duration: 1.3 }, 0.25)
                  .to(p.diff, { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.12 }, 0.8);
              }

              tl.to(
                o,
                {
                  v: Number(p.stat.dataset['to']),
                  duration: 1.5,
                  ease: 'power2.out',
                  onUpdate: () => (p.stat.textContent = fmt(p.stat, o.v)),
                  onComplete: () => (p.stat.textContent = finals[i]),
                },
                c['desk'] ? 0.35 : 0.1,
              );
            });
          };

          prime(!!c['desk']);

          // Section arrives: the rounded top corners flatten as it docks
          gsap.fromTo(
            section,
            { '--r': '64px' },
            {
              '--r': '0px',
              ease: 'none',
              scrollTrigger: { trigger: host, start: 'top bottom', end: 'top top', scrub: true },
            },
          );

          gsap.fromTo(
            words,
            { opacity: 0.14 },
            {
              opacity: 1,
              ease: 'none',
              stagger: 0.12,
              scrollTrigger: { trigger: q('#xp-statement'), start: 'top 82%', end: 'bottom 50%', scrub: 0.4 },
            },
          );

          if (c['desk']) {
            // Desktop: pin the stage and turn vertical scroll into a horizontal release train
            section.classList.add('xp--h');
            const dist = () => Math.max(0, track.scrollWidth - pin.clientWidth);
            const skews = per.map(p => gsap.quickTo(p.card, 'skewX', { duration: 0.5, ease: 'power3' }));
            const setSkew = (v: number) => skews.forEach(s => s(v));
            const clamp = gsap.utils.clamp(-6, 6);
            let cur = -1;

            const setActive = (i: number) => {
              if (i === cur) return;
              cur = i;
              panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
              stops.forEach((s, k) => s.classList.toggle('on', k <= i));
              verEl.textContent = this.releases[i].ver;
              cntEl.textContent = `${i + 1} / ${n}`;
              gsap.to(fill, { scaleX: i / (n - 1), duration: 0.7, ease: 'expo.out', overwrite: true });
            };
            setActive(0);

            ScrollTrigger.create({
              trigger: pin,
              start: 'top 70%',
              once: true,
              onEnter: () => reveal(0),
            });

            gsap
              .timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                  trigger: pin,
                  start: 'top top',
                  end: () => `+=${dist() * 1.2}`,
                  pin: true,
                  scrub: 0.8,
                  anticipatePin: 1,
                  invalidateOnRefresh: true,
                  onUpdate: self => {
                    const i = Math.min(n - 1, Math.round(self.progress * (n - 1)));
                    setActive(i);
                    reveal(i);
                    setSkew(clamp(self.getVelocity() / -400));
                  },
                },
              })
              .to(track, { x: () => -dist() }, 0)
              .fromTo(
                per.map(p => p.big),
                { xPercent: 40 },
                { xPercent: -40 },
                0,
              );

            reset = () => setSkew(0);
            ScrollTrigger.addEventListener('scrollEnd', reset);
          } else {
            // Mobile: interactive release carousel
            const mobTabs = qa('.xp-mob-tab');
            const mobCnt = q('#xp-mob-cnt');
            const dots = Array.from((q('#xp-mob-dots') || host).querySelectorAll<HTMLElement>('span'));
            let activeIdx = -1;

            const updateMobileUI = (idx: number) => {
              if (idx === activeIdx) return;
              activeIdx = idx;
              mobTabs.forEach((t, k) => t.classList.toggle('active', k === idx));
              dots.forEach((d, k) => d.classList.toggle('on', k === idx));
              if (mobCnt) mobCnt.textContent = `${idx + 1} / ${n}`;
              reveal(idx);
            };

            const scrollToPanel = (idx: number) => {
              if (!panels[idx]) return;
              const target = panels[idx];
              const offset = target.offsetLeft - (track.clientWidth - target.clientWidth) / 2;
              track.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
              updateMobileUI(idx);
            };

            mobTabs.forEach((tab, i) => {
              const handler = () => scrollToPanel(i);
              tab.addEventListener('click', handler);
              this.cleanups.push(() => tab.removeEventListener('click', handler));
            });

            dots.forEach((dot, i) => {
              const handler = () => scrollToPanel(i);
              dot.addEventListener('click', handler);
              this.cleanups.push(() => dot.removeEventListener('click', handler));
            });

            let ticking = false;
            const onScroll = () => {
              if (!ticking) {
                requestAnimationFrame(() => {
                  const trackCenter = track.scrollLeft + track.clientWidth / 2;
                  let closest = 0;
                  let minDist = Infinity;
                  panels.forEach((p, idx) => {
                    const center = p.offsetLeft + p.clientWidth / 2;
                    const d = Math.abs(trackCenter - center);
                    if (d < minDist) {
                      minDist = d;
                      closest = idx;
                    }
                  });
                  updateMobileUI(closest);
                  ticking = false;
                });
                ticking = true;
              }
            };

            track.addEventListener('scroll', onScroll, { passive: true });
            this.cleanups.push(() => track.removeEventListener('scroll', onScroll));

            ScrollTrigger.create({
              trigger: track,
              start: 'top 85%',
              once: true,
              onEnter: () => updateMobileUI(0),
            });
          }

          if (document.fonts?.ready) {
            document.fonts.ready.then(() => ScrollTrigger.refresh());
          }

          return () => {
            if (reset) ScrollTrigger.removeEventListener('scrollEnd', reset);
            section.classList.remove('xp--h');
            panels.forEach(p => p.classList.remove('is-active'));
            restore();
          };
        },
      );
    }, host);
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    this.ctx?.revert();
  }
}
