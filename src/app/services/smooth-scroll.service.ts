import { Injectable, Inject, PLATFORM_ID, NgZone, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * SmoothScrollService
 * -------------------
 * Uses pure native scroll (compositor-driven, zero JS animation loop).
 * On desktop: leverages ScrollTrigger.normalizeScroll for consistent
 * wheel delta normalisation without hijacking the scroll position.
 * On mobile: pure native momentum — nothing to do.
 *
 * We deliberately dropped Lenis because its RAF-based interpolation
 * runs on the main thread and causes compositor/main-thread desync
 * ("tearing") with GSAP ScrollTrigger scrub timelines.
 */
@Injectable({
  providedIn: 'root',
})
export class SmoothScrollService implements OnDestroy {
  private normalizer: ReturnType<typeof ScrollTrigger.normalizeScroll> | null = null;
  private isLocked = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.init();
    }
  }

  private init(): void {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    ScrollTrigger.config({
      ignoreMobileResize: true,
      // Prevent blurry text on Firefox during scrub
      limitCallbacks: true,
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    if (prefersReducedMotion || isTouch) {
      // Mobile / reduced-motion: pure native scroll, nothing needed.
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      // normalizeScroll smooths out inconsistent wheel delta across browsers
      // and OS momentum without hijacking scroll position from the compositor.
      this.normalizer = ScrollTrigger.normalizeScroll({
        allowNestedScroll: true,
        lockAxis: false,
        // Let touch devices keep native momentum
        type: 'wheel,touch,pointer',
      });
    });
  }

  /**
   * Stop scrolling (during boot loader).
   * Native: sets overflow hidden since we have no Lenis.
   */
  public stop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLocked = true;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Resume scrolling after boot loader finishes.
   */
  public start(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLocked = false;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  /**
   * Scroll to a target element or y-offset.
   */
  public scrollTo(target: HTMLElement | number, behavior: ScrollBehavior = 'smooth'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior });
    } else {
      target.scrollIntoView({ behavior });
    }
  }

  ngOnDestroy(): void {
    if (this.normalizer) {
      this.normalizer.kill();
      this.normalizer = null;
    }
    if (this.isLocked && isPlatformBrowser(this.platformId)) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }
}
