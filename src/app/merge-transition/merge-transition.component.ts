import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-merge-transition',
  templateUrl: './merge-transition.component.html',
  styleUrls: ['./merge-transition.component.scss'],
})
export class MergeTransitionComponent implements AfterViewInit, OnDestroy {
  private ctx: ReturnType<typeof gsap.context> | null = null;
  private cleanups: Array<() => void> = [];

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
    private el: ElementRef<HTMLElement>,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => this.initTransition());
  }

  private initTransition(): void {
    const host = this.el.nativeElement;
    const $ = <T extends HTMLElement>(s: string) => host.querySelector<T>(s);
    const $$ = <T extends HTMLElement>(s: string) => Array.from(host.querySelectorAll<T>(s));

    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CO = matchMedia('(pointer: coarse)').matches;
    const Rmax = () => Math.hypot(window.innerWidth, window.innerHeight) / 2 + 40;

    // Split headline #mt into masked words
    const mt = $('#mt');
    if (mt) {
      const walk = (n: Node) => {
        Array.from(n.childNodes).forEach(c => {
          if (c.nodeType !== Node.TEXT_NODE) return walk(c);
          const f = document.createDocumentFragment();
          (c.textContent || '').split(/(\s+)/).forEach(t => {
            if (!t.trim()) return void f.append(t);
            const m = document.createElement('span');
            const i = document.createElement('span');
            m.className = 'm';
            i.className = 'mi';
            i.textContent = t;
            m.append(i);
            f.append(m);
          });
          c.replaceWith(f);
        });
      };
      walk(mt);
    }
    const words = $$('#mt .mi');

    const lt = $('#lt');
    const ring = $('#ring');
    const o = { r: 0 };
    let mx = 0;
    let my = 0;

    const paint = () => {
      if (!lt || !ring) return;
      lt.style.clipPath = 'circle(' + o.r + 'px at ' + mx.toFixed(1) + 'px ' + my.toFixed(1) + 'px)';
      const d = o.r * 2;
      ring.style.width = ring.style.height = d + 'px';
      ring.style.left = mx.toFixed(1) + 'px';
      ring.style.top = my.toFixed(1) + 'px';
      ring.style.opacity = o.r < 6 || o.r > Rmax() - 30 ? '0' : '1';
    };

    const type = (tl: gsap.core.Timeline, el: HTMLElement | null, s: string, at: number, d: number) => {
      if (!el) return;
      const p = { n: 0 };
      tl.to(
        p,
        {
          n: s.length,
          duration: d,
          ease: 'none',
          onUpdate: () => {
            el.textContent = s.slice(0, Math.round(p.n));
          },
        },
        at
      );
    };

    this.ctx = gsap.context(() => {
      if (!RM) {
        const T = $('#tr')!;
        const svg = host.querySelector<SVGSVGElement>('#g')!;
        const PA = host.querySelector<SVGPathElement>('.pA')!;
        const PB = host.querySelector<SVGPathElement>('.pB')!;
        const PM = host.querySelector<SVGPathElement>('.pM')!;
        const base = host.querySelector<SVGPathElement>('.base')!;
        const nds = Array.from(host.querySelectorAll<SVGCircleElement>('.nd'));
        const mg = host.querySelector<SVGCircleElement>('.mg')!;
        const KA = host.querySelector<HTMLElement>('.tk.w')!;
        const KB = host.querySelector<HTMLElement>('.tk.s')!;
        const KM = host.querySelector<HTMLElement>('.tk.m')!;

        // Always vertical (top to bottom flow)
        let U = 0, V = 0, cu = 0, cv = 0;
        let LA = 0, LB = 0, LM = 0;
        let fr: number[] = [];
        const g = { a: 0, b: 0, m: 0 };
        const c1 = (v: number) => Math.max(0, Math.min(1, v));
        // Vertical mapping: u is vertical (Y), v is horizontal (X)
        const X = (u: number, v: number): [number, number] => [v, u];
        const S = (u: number, v: number) => X(u, v).map(n => n.toFixed(1)).join(' ');

        function layout() {
          const W = T.clientWidth;
          const H = T.clientHeight;
          U = H;
          V = W;
          cu = U * 0.46;
          cv = V * 0.50;
          svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

          // On narrow screens clamp spread so both branches stay on-screen
          const maxSpread = (cv - 20); // never push branch past left/right edge
          const spread = Math.min(V * 0.22, 200, maxSpread);
          const vA = Math.max(20, cv - spread);
          const vB = Math.min(V - 20, cv + spread);

          const br = (v: number) =>
            'M' + S(0, v) + 'L' + S(U * 0.18, v) + 'C' + S(U * 0.34, v) + ' ' + S(U * 0.32, cv) + ' ' + S(cu, cv);

          PA.setAttribute('d', br(vA));
          PB.setAttribute('d', br(vB));
          PM.setAttribute('d', 'M' + S(cu, cv) + 'L' + S(U * 0.90, cv));
          base.setAttribute('d', br(vA) + br(vB) + 'M' + S(cu, cv) + 'L' + S(U, cv));

          [
            [0.07, vA],
            [0.14, vA],
            [0.07, vB],
            [0.14, vB],
            [0.62, cv],
            [0.76, cv],
          ].forEach(([f, v], i) => {
            const [x, y] = X(U * f, v);
            nds[i].setAttribute('cx', x.toString());
            nds[i].setAttribute('cy', y.toString());
          });

          const [cxPos, cyPos] = X(cu, cv);
          mx = cxPos;
          my = cyPos;
          mg.setAttribute('cx', mx.toString());
          mg.setAttribute('cy', my.toString());

          LA = PA.getTotalLength();
          LB = PB.getTotalLength();
          LM = PM.getTotalLength();
          fr = [
            (0.07 * U) / LA,
            (0.14 * U) / LA,
            (0.07 * U) / LB,
            (0.14 * U) / LB,
            (0.62 * U - cu) / LM,
            (0.76 * U - cu) / LM,
          ];
        }

        function render() {
          PA.style.strokeDashoffset = (1 - c1(g.a + 0.03)).toString();
          PB.style.strokeDashoffset = (1 - c1(g.b + 0.03)).toString();
          PM.style.strokeDashoffset = (1 - c1(g.m + 0.01)).toString();

          let q = PA.getPointAtLength(LA * g.a);
          gsap.set(KA, { x: q.x, y: q.y });
          q = PB.getPointAtLength(LB * g.b);
          gsap.set(KB, { x: q.x, y: q.y });
          q = PM.getPointAtLength(LM * g.m);
          gsap.set(KM, { x: q.x, y: q.y });

          nds.forEach((n, i) =>
            gsap.set(n, { scale: c1(((i < 2 ? g.a : i < 4 ? g.b : g.m) - fr[i]) / 0.05) })
          );
        }

        layout();
        gsap.set('.tk', { xPercent: -50, yPercent: -50, scale: 0 });
        render();

        const onRefreshInit = () => {
          layout();
          render();
          paint();
        };
        ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
        this.cleanups.push(() => ScrollTrigger.removeEventListener('refreshInit', onRefreshInit));

        gsap.set(words, { yPercent: 115, rotation: 5 });

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '#tr',
            start: 'top top',
            end: CO ? '+=180%' : '+=280%',   // shorter scroll on mobile = less jank
            pin: true,
            scrub: CO ? 1 : 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 3,
          },
        });

        tl.fromTo('.tk.w, .tk.s', { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: 0.25 }, 0)
          .to(g, { a: 1, duration: 3, ease: 'power1.inOut', onUpdate: render }, 0.2)
          .to(g, { b: 1, duration: 3, ease: 'power1.inOut', onUpdate: render }, 0.5)
          .to('.tk.w, .tk.s', { scale: 0, duration: 0.5, ease: 'power2.in' }, 3.4)
          .fromTo('.mg', { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(4)' }, 3.5)
          .fromTo('.tk.m', { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 3.7)
          .to(g, { m: 1, duration: 1.6, ease: 'power2.out', onUpdate: render }, 3.8);

        type(tl, $('#t1'), '$ git merge stack', 0.2, 1.3);
        type(tl, $('#t2'), 'Merge made by the ‘ort’ strategy.', 3.6, 1.1);
        type(tl, $('#t3'), '6 skills · 5 projects · 0 conflicts', 4.8, 1.1);

        tl.to('.gr, .term', { scale: 0.9, autoAlpha: 0, duration: 1.6, ease: 'power2.in' }, 6.4)
          .to('.tk.m', { autoAlpha: 0, duration: 1.2 }, 6.4)
          .to('.mg', { scale: 1.6, duration: 0.6, ease: 'power2.in' }, 6);

        if (CO) {
          // Mobile: skip JS clip-path (expensive) — fade lt in with CSS opacity instead
          tl.to('#lt', { autoAlpha: 1, duration: 2, ease: 'power2.inOut' }, 6.2)
            .fromTo('#big', { xPercent: 6 }, { xPercent: -14, duration: 4 }, 6.2)
            .fromTo('.chip', { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(3)' }, 7.4)
            .to(words, { yPercent: 0, rotation: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 }, 7.6)
            .fromTo('.msg p', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 8.4)
            .to({}, { duration: 1 }, 9.2);
          // hide ring on mobile — no clip-path expansion
          const ringEl = $('#ring');
          if (ringEl) ringEl.style.display = 'none';
        } else {
          tl.to(o, { r: () => Rmax(), duration: 3, ease: 'power2.in', onUpdate: paint }, 6.2)
            .fromTo('#big', { xPercent: 6 }, { xPercent: -14, duration: 4 }, 6.2)
            .fromTo('.chip', { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(3)' }, 8.4)
            .to(words, { yPercent: 0, rotation: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 }, 8.6)
            .fromTo('.msg p', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 9.4)
            .to({}, { duration: 1 }, 10.2);
        }
      } else {
        o.r = 9999;
        paint();
        gsap.set(words, { yPercent: 0 });
      }

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    }, host);
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
  }
}
