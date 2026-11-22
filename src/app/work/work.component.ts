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

      // Statement word reveal: smooth opacity transition as soon as section appears
      const statementEl = $('#statement');
      if (statementEl) {
        gsap.fromTo(
          split(statementEl),
          { opacity: 0.25 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.08,
            scrollTrigger: {
              trigger: statementEl,
              start: 'top 85%',
              end: 'bottom 50%',
              scrub: 0.3,
            },
          },
        );
      }

      // Rail fill
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

      const chapterData: Array<{
        ch: HTMLElement;
        card: HTMLElement | null;
        vis: HTMLElement | null;
        big: HTMLElement | null;
      }> = [];

      const cards: HTMLElement[] = [];

      $$('.chap').forEach((ch) => {
        const node = $('.node', ch);
        const card = $('.card', ch);
        const vis = $('.vis', ch);
        const big = $('.big', ch);
        const ttlEl = $('.ttl', ch);
        const ttl = ttlEl ? split(ttlEl, true) : [];
        const bars = $$('.bars i', ch);
        const rings = $$('.ring', ch);
        const amt = ch.querySelector<HTMLElement>('[data-to]');

        if (card) cards.push(card);
        chapterData.push({ ch, card, vis, big });

        // Dynamic will-change: only active while chapter is near viewport
        ScrollTrigger.create({
          trigger: ch,
          start: 'top bottom+=150px',
          end: 'bottom top-=150px',
          onToggle: (self) => {
            if (card) {
              card.style.willChange = self.isActive ? 'transform' : 'auto';
            }
          },
        });

        const isMobile = matchMedia('(max-width: 800px)').matches || matchMedia('(pointer: coarse)').matches;

        // Entrance timeline for all devices — prompt entrance on mobile (top 85%) so content never lags
        const tl = gsap.timeline({
          defaults: { ease: 'expo.out' },
          scrollTrigger: {
            trigger: ch,
            start: isMobile ? 'top 85%' : 'top 75%',
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
        if (card) tl.from(card, { y: 80, scale: 0.95, autoAlpha: 0, duration: 1 }, '<-.5');

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
      });

      // Desktop-only scrubbed effects: Card rotateX/Y, vis parallax, and big parallax
      // Limited to pointer: fine and min-width: 801px
      mm.add('(min-width: 801px) and (pointer: fine)', () => {
        // Merge the 3 scrubbed ScrollTriggers per chapter into ONE timeline with ONE trigger
        chapterData.forEach(({ ch, vis, card, big }, i) => {
          const scrubTl = gsap.timeline({
            scrollTrigger: {
              trigger: ch,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          });
          if (vis) scrubTl.fromTo(vis, { yPercent: 8 + i * 4 }, { yPercent: -(8 + i * 4), ease: 'none' }, 0);
          if (card) scrubTl.fromTo(card, { rotateY: -8, rotateX: 3 }, { rotateY: 8, rotateX: -3, ease: 'none' }, 0);
          if (big) scrubTl.fromTo(big, { xPercent: -10 }, { xPercent: 10, ease: 'none' }, 0);
        });
      });

      // Head section entrance
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

      // Single debounced ScrollTrigger refresh after fonts & window load
      let refreshTimer: ReturnType<typeof setTimeout> | undefined;
      const debouncedRefresh = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
      };

      if (document.fonts?.ready) {
        document.fonts.ready.then(debouncedRefresh);
      }
      window.addEventListener('load', debouncedRefresh, { once: true });
      this.cleanups.push(() => {
        clearTimeout(refreshTimer);
        window.removeEventListener('load', debouncedRefresh);
      });
    }, host);
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    this.ctx?.revert();
  }
}
