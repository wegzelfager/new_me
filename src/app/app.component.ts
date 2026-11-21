import { AfterViewInit, Component, Inject, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Lenis from 'lenis';
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
  private lenis: Lenis | null = null;
  private tickerFn: ((time: number) => void) | null = null;
  private clickHandler: ((e: MouseEvent) => void) | null = null;

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
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      infinite: false,
    });
    this.lenis = lenis;

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis RAF loop via GSAP ticker
    this.tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(this.tickerFn);
    gsap.ticker.lagSmoothing(0);

    // Smooth anchor navigation across portfolio
    this.clickHandler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (target) {
        const hash = target.getAttribute('href');
        if (hash && hash !== '#') {
          const el = document.querySelector(hash);
          if (el) {
            e.preventDefault();
            lenis.scrollTo(el, { duration: 1.4 });
          }
        }
      }
    };
    document.addEventListener('click', this.clickHandler);

    // Refresh layout and triggers when fonts load
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
    }
    if (this.tickerFn) {
      gsap.ticker.remove(this.tickerFn);
    }
    this.lenis?.destroy();
  }
}
