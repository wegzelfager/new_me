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

interface SkillItem {
  hash: string;
  label: string;
  title: string;
  description: string;
  tags: string[];
}

@Component({
  selector: 'app-stack',
  templateUrl: './stack.component.html',
  styleUrls: ['./stack.component.scss'],
})
export class StackComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stackHost', { static: true }) stackHost!: ElementRef<HTMLElement>;

  private ctx: ReturnType<typeof gsap.context> | null = null;
  private cleanups: Array<() => void> = [];

  readonly skills: SkillItem[] = [
    {
      hash: 'a3f9c21',
      label: 'client',
      title: 'Angular × GSAP',
      description:
        'Component-driven Angular with RxJS state and lazy routes, plus ScrollTrigger motion that feels designed, not templated.',
      tags: ['Angular', 'RxJS', 'TypeScript', 'JavaScript (ES6+)', 'GSAP', 'ScrollTrigger'],
    },
    {
      hash: 'b2e1f30',
      label: 'api',
      title: 'Node.js + Express',
      description:
        'Clean REST APIs with JWT auth, validation and rate limiting, in layers that stay readable as the project grows.',
      tags: ['Node.js', 'Express', 'JWT', 'REST'],
    },
    {
      hash: '7bd04e8',
      label: 'cache',
      title: 'Redis',
      description:
        'Caching hot reads, sessions and rate limits, so the database only gets the requests that truly need it.',
      tags: ['Redis', 'Caching', 'Sessions', 'Rate limiting'],
    },
    {
      hash: 'c9d3a17',
      label: 'data',
      title: 'MongoDB + PostgreSQL',
      description:
        'Document or relational, picked per problem. Schemas, indexes and aggregations designed around how the data is actually read.',
      tags: ['MongoDB', 'PostgreSQL', 'Indexes', 'Aggregations'],
    },
    {
      hash: 'e41c9a0',
      label: 'money',
      title: 'Payment Gateways',
      description:
        'Stripe and Paymob checkout flows with webhooks, retries and idempotency, so money lands once and failures end in clean states.',
      tags: ['Stripe', 'Paymob', 'Webhooks', 'Idempotency'],
    },
    {
      hash: 'f7a2b64',
      label: 'deploy',
      title: 'PM2 Deployments',
      description:
        'Production processes in cluster mode with zero-downtime reloads, logs and auto-restarts, so it stays up while I ship.',
      tags: ['PM2', 'Cluster mode', 'Zero downtime', 'Logs'],
    },
  ];

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => this.initReel());
  }

  private initReel(): void {
    const host = this.stackHost.nativeElement;
    const q = <T extends HTMLElement>(sel: string) => host.querySelector<T>(sel);
    const qa = <T extends HTMLElement>(sel: string) => Array.from(host.querySelectorAll<T>(sel));

    const skEl = q<HTMLElement>('.sk');
    const stEl = q<HTMLElement>('#st');
    const reelEl = q<HTMLElement>('#reel');
    const tx = qa<HTMLElement>('.tx');
    const sc = qa<HTMLElement>('.sc');
    const sg = qa<HTMLButtonElement>('.sg');
    const cs = q<HTMLElement>('.cs');
    const N = tx.length;

    if (!skEl || !reelEl || N === 0) return;

    // Statement word splitting
    if (stEl) {
      const splitNode = (node: Node) => {
        Array.from(node.childNodes).forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent || '';
            const frag = document.createDocumentFragment();
            text.split(/(\s+)/).forEach(chunk => {
              if (!chunk.trim()) {
                frag.append(chunk);
                return;
              }
              const s = document.createElement('span');
              s.className = 'w';
              s.textContent = chunk;
              frag.append(s);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            splitNode(child);
          }
        });
      };
      splitNode(stEl);
    }

    // Title word splitting
    qa<HTMLElement>('.ttl').forEach(h => {
      const words = (h.textContent || '').trim().split(/\s+/);
      h.innerHTML = words.map(w => `<span class="m"><span class="mi">${w}</span></span>`).join(' ');
    });

    // Scene 0: Real GSAP Eases Curves
    const E = ['expo.out', 'back.out(2.2)', 'elastic.out(1,.4)'];
    const EN = ['expo.out', 'back.out', 'elastic.out'];
    const EC = ['#ffd23f', 'var(--ink)', 'var(--mut)'];
    const pt = (easeName: string, t: number): [number, number] => [
      20 + t * 360,
      250 - (gsap.parseEase(easeName)(t) as number) * 190,
    ];

    const s0 = q<HTMLElement>('#s0');
    if (s0) {
      const paths = E.map((ease, i) => {
        let d = '';
        for (let k = 0; k <= 70; k++) {
          const p = pt(ease, k / 70);
          d += (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
        }
        return (
          '<path pathLength="1" d="' +
          d +
          '" style="fill:none;stroke:' +
          EC[i] +
          ';stroke-width:3;stroke-linecap:round;stroke-dasharray:1"/><circle r="6" cx="20" cy="250" style="fill:' +
          EC[i] +
          '"/><text x="380" y="' +
          (24 + i * 16) +
          '" text-anchor="end" font-size="11" style="fill:' +
          EC[i] +
          '">' +
          EN[i] +
          '</text>'
        );
      }).join('');

      s0.innerHTML =
        '<svg viewBox="0 0 400 280"><path d="M20 250H380M20 250V20" style="stroke:var(--hair);fill:none"/>' +
        paths +
        '</svg><p class="cap">same motion, three personalities</p>';
    }

    // Per-scene scrubbed animation builders
    const B: Array<(e: HTMLElement) => gsap.core.Timeline> = [
      (e: HTMLElement) => {
        const P = Array.from(e.querySelectorAll<SVGPathElement>('path[pathLength]'));
        const D = Array.from(e.querySelectorAll<SVGCircleElement>('circle'));
        const o = { t: 0 };
        return gsap
          .timeline({ defaults: { ease: 'none' } })
          .fromTo(P, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1 }, 0)
          .fromTo(
            o,
            { t: 0 },
            {
              t: 1,
              duration: 1,
              onUpdate: () => {
                D.forEach((d, i) => {
                  const p = pt(E[i], o.t);
                  d.setAttribute('cx', p[0].toFixed(1));
                  d.setAttribute('cy', p[1].toFixed(1));
                });
              },
            },
            0
          );
      },
      (e: HTMLElement) => {
        const lg = Array.from(e.querySelectorAll<HTMLElement>('.lg'));
        const bad = e.querySelector<HTMLElement>('.bad');
        const tl = gsap
          .timeline()
          .from(lg, { opacity: 0, y: 16, stagger: 0.15, duration: 0.25, ease: 'power2.out' });
        if (bad) {
          tl.from(bad, { scale: 0, duration: 0.2, ease: 'back.out(4)' }, '>-.05');
        }
        return tl;
      },
      (e: HTMLElement) => {
        const b = Array.from(e.querySelectorAll<HTMLElement>('.big-num'));
        const l = Array.from(e.querySelectorAll<HTMLElement>('.ln'));
        const o = { a: 0, b: 0 };
        return gsap
          .timeline()
          .fromTo(l[0], { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.inOut' }, 0)
          .fromTo(
            o,
            { a: 0 },
            {
              a: 48,
              duration: 1,
              ease: 'power2.inOut',
              onUpdate: () => {
                if (b[0]) b[0].textContent = Math.round(o.a) + 'ms';
              },
            },
            0
          )
          .fromTo(l[1], { scaleX: 0 }, { scaleX: 0.03, duration: 0.35, ease: 'expo.out' }, 1.15)
          .fromTo(
            o,
            { b: 0 },
            {
              b: 0.4,
              duration: 0.35,
              onUpdate: () => {
                if (b[1]) b[1].textContent = o.b.toFixed(1) + 'ms';
              },
            },
            1.15
          );
      },
      (e: HTMLElement) => {
        const c = Array.from(e.querySelectorAll<HTMLElement>('.c'));
        const u = Array.from(e.querySelectorAll<HTMLElement>('u'));
        const k = Array.from(e.querySelectorAll<HTMLElement>('.k'));
        return gsap
          .timeline()
          .to(c[1], { opacity: 0.25, duration: 0.2 }, 0)
          .to(u[0], { scaleX: 1, duration: 0.4 }, 0)
          .to(k[0], { color: '#0d0d2b', duration: 0.1 }, 0.2)
          .to(c[1], { opacity: 1, duration: 0.2 }, 0.7)
          .to(c[0], { opacity: 0.25, duration: 0.2 }, 0.7)
          .to(u[1], { scaleX: 1, duration: 0.4 }, 0.7)
          .to(k[1], { color: '#0d0d2b', duration: 0.1 }, 0.9);
      },
      (e: HTMLElement) => {
        const t = gsap.timeline({ defaults: { ease: 'none' } });
        const path = e.querySelector<SVGPathElement>('path[pathLength]');
        const circles = Array.from(e.querySelectorAll<SVGCircleElement>('circle'));
        const dp = e.querySelector<SVGTextElement>('.dp');
        if (path) {
          t.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1 }, 0);
        }
        circles.forEach((x, i) => {
          t.fromTo(x, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.08 }, (i / 3) * 0.92);
        });
        if (dp) {
          t.fromTo(dp, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 1.05);
        }
        return t;
      },
      (e: HTMLElement) => {
        const W = Array.from(e.querySelectorAll<HTMLElement>('.ws i'));
        const a = e.querySelector<HTMLElement>('.a');
        const b = e.querySelector<HTMLElement>('.b');
        const t = gsap.timeline();
        if (a && b) {
          t.to(a, { opacity: 0, duration: 0.05 }, 0).to(b, { opacity: 1, duration: 0.05 }, 0);
        }
        W.forEach((w, i) => {
          t.to(w, { scale: 0.5, opacity: 0.3, duration: 0.12 }, i * 0.3)
           .to(w, { scale: 1, opacity: 1, duration: 0.15 }, i * 0.3 + 0.15);
        });
        if (a && b) {
          t.to(b, { opacity: 0, duration: 0.05 }, 1.25).to(a, { opacity: 1, duration: 0.05 }, 1.25);
        }
        return t;
      },
    ];

    // GSAP context and matchMedia setup
    this.ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // 1. Scrub statement illumination
        if (stEl) {
          const wSpans = Array.from(stEl.querySelectorAll<HTMLElement>('.w'));
          gsap.fromTo(
            wSpans,
            { opacity: 0.14 },
            {
              opacity: 1,
              ease: 'none',
              stagger: 0.12,
              scrollTrigger: {
                trigger: stEl,
                start: 'top 82%',
                end: 'bottom 50%',
                scrub: 0.4,
              },
            }
          );
        }

        // 3. Initial states
        gsap.set(tx.slice(1), { autoAlpha: 0 });
        gsap.set(sc.slice(1), { autoAlpha: 0 });

        // 4. Master Timeline
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: reelEl,
            start: 'top top',
            end: () => '+=' + window.innerHeight * N * 0.55,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            snap: {
              snapTo: 'labels',
              duration: { min: 0.25, max: 0.7 },
              delay: 0.08,
              ease: 'power2.inOut',
            },
          },
        });

        tl.addLabel('p0', 0);
        const s0Span = sg[0]?.querySelector<HTMLElement>('span');
        if (s0Span) tl.set(s0Span, { opacity: 1 }, 0);

        for (let k = 0; k < N; k++) {
          const a = Math.max(0, k - 0.3);
          tl.add(B[k](sc[k]).duration(k + 0.5 - a), a);

          const si = sg[k]?.querySelector<HTMLElement>('i');
          const sl = sg[k]?.querySelector<HTMLElement>('span');

          if (si) {
            tl.fromTo(
              si,
              { scaleX: 0 },
              { scaleX: 1, duration: k ? 1 : 0.55, ease: 'none' },
              k ? k - 0.45 : 0
            );
          }
          if (k && sl) {
            tl.to(sl, { opacity: 1, duration: 0.2 }, k - 0.45);
          }
          if (k < N - 1 && sl) {
            tl.to(sl, { opacity: 0.45, duration: 0.2 }, k + 0.45);
          }

          if (!k) continue;

          const s = k - 0.45;
          const prevMi = Array.from(tx[k - 1].querySelectorAll<HTMLElement>('.mi'));
          const prevO = Array.from(tx[k - 1].querySelectorAll<HTMLElement>('.o'));
          const currMi = Array.from(tx[k].querySelectorAll<HTMLElement>('.mi'));
          const currO = Array.from(tx[k].querySelectorAll<HTMLElement>('.o'));

          tl.addLabel('p' + k, k)
            .to(prevMi, { yPercent: -110, duration: 0.3, stagger: 0.03, ease: 'power2.in' }, s)
            .to(prevO, { autoAlpha: 0, y: -18, duration: 0.25, stagger: 0.03, ease: 'power2.in' }, s)
            .set(tx[k - 1], { autoAlpha: 0 }, s + 0.4)
            .set(tx[k], { autoAlpha: 1 }, s + 0.2)
            .fromTo(currMi, { yPercent: 110 }, { yPercent: 0, duration: 0.45, stagger: 0.04, ease: 'power3.out' }, s + 0.2)
            .fromTo(currO, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out' }, s + 0.3)
            .to(sc[k - 1], { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power2.in' }, s)
            .fromTo(sc[k], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, s + 0.25);

          if (cs) {
            tl.to(cs, { yPercent: -(100 / N) * k, duration: 0.4, ease: 'power3.inOut' }, s);
          }
        }

        tl.to({}, { duration: 0.01 }, N - 0.4);

        // One-time intro on first title words
        const firstMi = Array.from(tx[0].querySelectorAll<HTMLElement>('.mi'));
        gsap.from(firstMi, {
          yPercent: 110,
          duration: 1.1,
          stagger: 0.06,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: reelEl,
            start: 'top 70%',
            once: true,
          },
        });

        // Click on segment progress bar
        const go = (k: number) => {
          const st = tl.scrollTrigger;
          if (!st) return;
          const targetScroll = st.start + (k / tl.duration()) * (st.end - st.start);
          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        };

        sg.forEach((btn, k) => {
          const clickHandler = () => go(k);
          btn.addEventListener('click', clickHandler);
          this.cleanups.push(() => btn.removeEventListener('click', clickHandler));
        });

        if (typeof document !== 'undefined' && document.fonts?.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh());
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(tx, { autoAlpha: 1, clearProps: 'transform' });
        gsap.set(sc, { autoAlpha: 1, clearProps: 'transform' });
      });
    }, host);
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    this.ctx?.revert();
  }
}
