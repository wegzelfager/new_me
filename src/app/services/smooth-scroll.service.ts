import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * SmoothScrollService — Native compositor-driven scrolling
 * ---------------------------------------------------------
 * Zero JS animation loops, zero virtual scroll lags, zero interception.
 *
 * The CSS sticky curtain (Hero sticky + Work overlay) is driven directly
 * by the browser GPU compositor on the real window.scrollY at full monitor
 * refresh rate (60/120/144/240Hz).
 *
 * Any JS scroll interception (Lenis or ScrollTrigger.normalizeScroll)
 * introduces event lag and micro-stutters during trackpad / mouse-wheel
 * scrolling. Pure native scrolling ensures maximum smoothness with zero
 * thread synchronization tearing.
 */
@Injectable({
  providedIn: 'root',
})
export class SmoothScrollService implements OnDestroy {
  private isLocked = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
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
      limitCallbacks: true,
    });
  }

  public stop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLocked = true;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  public start(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLocked = false;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  public scrollTo(target: HTMLElement | number, behavior: ScrollBehavior = 'smooth'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior });
    }
  }

  ngOnDestroy(): void {
    if (this.isLocked && isPlatformBrowser(this.platformId)) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }
}
