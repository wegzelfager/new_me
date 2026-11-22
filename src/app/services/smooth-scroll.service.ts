import { Injectable, Inject, PLATFORM_ID, NgZone, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * SmoothScrollService
 * -------------------
 * Uses Lenis for smooth wheel interpolation on desktop.
 * Mobile (pointer:coarse) keeps 100% native momentum — syncTouch: false.
 *
 * WHY Lenis is now safe (was not safe before):
 *   BEFORE: Hero used GSAP pin:true which repositioned the hero element
 *           from JS every frame. Lenis also runs from JS RAF. Two JS loops
 *           fighting for scroll position → compositor/main-thread desync → tearing.
 *   NOW:    Hero is CSS position:sticky — the compositor handles it without
 *           any JS. Lenis only controls the native scrollTop and fires
 *           ScrollTrigger.update. No conflict.
 */
@Injectable({
  providedIn: 'root',
})
export class SmoothScrollService implements OnDestroy {
  private lenis: Lenis | null = null;
  private rafId: ((time: number) => void) | null = null;
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

    ScrollTrigger.config({ ignoreMobileResize: true });

    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    // Mobile: 100% native scroll. Lenis only on desktop.
    if (RM || isTouch) return;

    this.ngZone.runOutsideAngular(() => {
      this.lenis = new Lenis({
        // No JS animation loop override — autoRaf:false means WE drive it
        // via gsap.ticker so it stays in sync with GSAP ScrollTrigger
        autoRaf: false,
        // lerp: how "springy" the smooth scroll feels (0 = instant, 1 = never arrives)
        // 0.08 = buttery smooth, not laggy
        lerp: 0.08,
        smoothWheel: true,
        // CRITICAL: syncTouch:false keeps mobile NATIVE even if Lenis is active
        syncTouch: false,
        // Wheel multiplier — 1 = same as native, slightly lower = less overshoot
        wheelMultiplier: 0.9,
      });

      // Wire Lenis scroll events into ScrollTrigger so scrub timelines stay in sync
      this.lenis.on('scroll', ScrollTrigger.update);

      // Drive Lenis from GSAP ticker (same RAF loop as ScrollTrigger)
      this.rafId = (time: number) => this.lenis?.raf(time * 1000);
      gsap.ticker.add(this.rafId);

      // Prevent GSAP ticker lag-compensation from causing jumps
      gsap.ticker.lagSmoothing(0);
    });
  }

  public stop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLocked = true;
    if (this.lenis) {
      this.lenis.stop();
    } else {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
  }

  public start(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLocked = false;
    if (this.lenis) {
      this.lenis.start();
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  public scrollTo(target: HTMLElement | number, behavior: ScrollBehavior = 'smooth'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.lenis) {
      this.lenis.scrollTo(target as any, { lerp: 0.08 });
    } else if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior });
    } else {
      (target as HTMLElement).scrollIntoView({ behavior });
    }
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      gsap.ticker.remove(this.rafId);
      this.rafId = null;
    }
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    if (this.isLocked && isPlatformBrowser(this.platformId)) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }
}
