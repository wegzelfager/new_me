import { AfterViewInit, Component, Inject, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'new_me';
  private cleanups: Array<() => void> = [];

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initSmoothScroll();
    });
  }

  private initSmoothScroll(): void {
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (RM) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId: number | null = null;
    let isScrolling = false;

    // Keep positions synchronized if user drags scrollbar or resizes
    const onNativeScroll = () => {
      if (!isScrolling) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    };
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    this.cleanups.push(() => window.removeEventListener('scroll', onNativeScroll));

    const loop = () => {
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.5) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        isScrolling = false;
        rafId = null;
        return;
      }
      currentY += diff * 0.12;
      window.scrollTo(0, currentY);
      rafId = requestAnimationFrame(loop);
    };

    const onWheel = (e: WheelEvent) => {
      // Don't intercept pinch-to-zoom or dominant horizontal scroll
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      e.preventDefault();

      targetY = Math.max(0, Math.min(maxScroll, targetY + e.deltaY));

      if (!isScrolling) {
        isScrolling = true;
        currentY = window.scrollY;
        rafId = requestAnimationFrame(loop);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    this.cleanups.push(() => {
      window.removeEventListener('wheel', onWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    });

    // Smooth anchor navigation across portfolio (#work, #stack, etc.)
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (target) {
        const hash = target.getAttribute('href');
        if (hash && hash !== '#') {
          const el = document.querySelector(hash);
          if (el) {
            e.preventDefault();
            const top = el.getBoundingClientRect().top + window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            targetY = Math.max(0, Math.min(maxScroll, top));

            if (!isScrolling) {
              isScrolling = true;
              currentY = window.scrollY;
              rafId = requestAnimationFrame(loop);
            }
          }
        }
      }
    };
    document.addEventListener('click', onClick);
    this.cleanups.push(() => document.removeEventListener('click', onClick));

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
  }
}
