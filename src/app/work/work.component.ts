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

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss'],
})
export class WorkComponent implements AfterViewInit, OnDestroy {
  @ViewChild('workHost', { static: true }) workHost!: ElementRef<HTMLElement>;

  private ctx: ReturnType<typeof gsap.context> | null = null;
  private cleanups: Array<() => void> = [];

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => this.initAnimations());
  }

  private initAnimations(): void {
    const host = this.workHost.nativeElement;
    const $ = (s: string, r: Element = host) => r.querySelector<HTMLElement>(s);
    const $$ = (s: string, r: Element = host) => Array.from(r.querySelectorAll<HTMLElement>(s));

    const split = (el: HTMLElement, mask = false): HTMLElement[] => {
      const out: HTMLElement[] = [];
      const walk = (n: Node) => {
        Array.from(n.childNodes).forEach(c => {
          if (c.nodeType !== 3) return walk(c);
          const f = document.createDocumentFragment();
          (c.textContent || '').split(/(\s+)/).forEach(t => {
            if (!t.trim()) return void f.append(t);
            const s = document.createElement('span');
            s.className = mask ? 'm' : 'w';
            if (mask) {
              const i = document.createElement('span');
              i.className = 'mi';
              i.textContent = t;
              s.append(i);
              out.push(i);
            } else {
              s.textContent = t;
              out.push(s);
            }
            f.append(s);
          });
          c.replaceWith(f);
        });
      };
      walk(el);
      return out;
    };

    this.ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const clamp = gsap.utils.clamp(-7, 7);

        const workEl = host.querySelector<HTMLElement>('.work');
        if (workEl) {
          gsap.fromTo(
            workEl,
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
            },
          );
        }

        const statementEl = $('#statement');
        if (statementEl) {
          gsap.fromTo(
            split(statementEl),
            { opacity: 0.14 },
            {
              opacity: 1,
              ease: 'none',
              stagger: 0.12,
              scrollTrigger: {
                trigger: statementEl,
                start: 'top 82%',
                end: 'bottom 50%',
                scrub: 0.4,
              },
            },
          );
        }

        const railFill = $('.rail-fill');
        const chainEl = $('#chain');
        if (railFill && chainEl) {
          gsap.to(railFill, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: chainEl,
              start: 'top 60%',
              end: 'bottom 60%',
              scrub: 0.3,
            },
          });
        }

        const cards: HTMLElement[] = [];
        $$('.chap').forEach((ch, i) => {
          const node = $('.node', ch);
          const card = $('.card', ch);
          const vis = $('.vis', ch);
          const big = $('.big', ch);
          const ttlEl = $('.ttl', ch);
          const ttl = ttlEl ? split(ttlEl, true) : [];
          const bars = $$('.bars i', ch);
          const rings = $$('.ring', ch);
          const amt = ch.querySelector<HTMLElement>('[data-to]');
          const st = () => ({ trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true });
          if (card) cards.push(card);

          const tl = gsap.timeline({
            defaults: { ease: 'expo.out' },
            scrollTrigger: {
              trigger: ch,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
              onEnter: () => node?.classList.add('on'),
              onLeaveBack: () => node?.classList.remove('on'),
            },
          });

          if (node) tl.from(node, { scale: 0, duration: 0.6, ease: 'back.out(3)' });
          const hashEl = $('.hash', ch);
          if (hashEl) tl.from(hashEl, { x: -24, autoAlpha: 0, duration: 0.7 }, '<.1');
          if (ttl.length) tl.from(ttl, { yPercent: 110, rotation: 6, duration: 1.1, stagger: 0.07 }, '<.1');
          const descEl = $('.desc', ch);
          const tags = $$('.tags span', ch);
          const fadeItems = descEl ? [descEl, ...tags] : tags;
          if (fadeItems.length) tl.from(fadeItems, { y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.07 }, '<.3');
          if (card) tl.from(card, { y: 120, rotation: 6, scale: 0.92, autoAlpha: 0, duration: 1.3 }, '<-.5');

          if (amt) {
            const targetVal = Number(amt.dataset['to'] || 0);
            const o = { v: 0 };
            tl.to(
              o,
              {
                v: targetVal,
                duration: 1.8,
                ease: 'power2.out',
                onUpdate: () => {
                  amt.textContent = Math.round(o.v).toLocaleString('en-US');
                },
              },
              '<.3',
            );
            const okEl = $('.ok', ch);
            if (okEl) tl.from(okEl, { autoAlpha: 0, y: 12, duration: 0.6 }, '>-.1');
          }

          if (bars.length) {
            tl.from(bars, { scaleY: 0, duration: 0.9, stagger: 0.05, ease: 'back.out(1.6)' }, '<.3');
          }

          if (rings.length) {
            tl.from(rings, { scale: 0, duration: 1.3, stagger: 0.15 }, '<.3');
            const firstEl = $('.first', ch);
            if (firstEl) tl.from(firstEl, { scale: 0.3, rotation: -14, autoAlpha: 0, duration: 1.1 }, '<.2');
            if (rings[1]) gsap.to(rings[1], { rotation: 360, duration: 50, ease: 'none', repeat: -1 });
          }

          if (vis) gsap.fromTo(vis, { yPercent: 8 + i * 4 }, { yPercent: -(8 + i * 4), ease: 'none', scrollTrigger: st() });
          if (card) gsap.fromTo(card, { rotateY: -9, rotateX: 4 }, { rotateY: 9, rotateX: -4, ease: 'none', scrollTrigger: st() });
          if (big) gsap.fromTo(big, { xPercent: -10 }, { xPercent: 10, ease: 'none', scrollTrigger: st() });
        });

        const skews = cards.map(c => gsap.quickTo(c, 'skewY', { duration: 0.5, ease: 'power3' }));
        const setSkew = (v: number) => skews.forEach(s => s(v));
        ScrollTrigger.create({
          onUpdate: self => setSkew(clamp(self.getVelocity() / -300)),
        });
        const resetSkew = () => setSkew(0);
        ScrollTrigger.addEventListener('scrollEnd', resetSkew);
        this.cleanups.push(() => ScrollTrigger.removeEventListener('scrollEnd', resetSkew));

        const headEl = $('.head');
        if (headEl) {
          gsap.from($$('.head .node, .head-title, .merge'), {
            y: 35,
            autoAlpha: 0,
            stagger: 0.12,
            duration: 0.9,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: headEl,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          });
        }

        if (document.fonts?.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh());
        }
      });
    }, host);
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    this.ctx?.revert();
  }
}
