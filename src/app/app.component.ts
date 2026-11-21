import { AfterViewInit, Component, Inject, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import LocomotiveScroll from 'locomotive-scroll';
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
  private locomotiveScroll: LocomotiveScroll | null = null;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initLocomotiveScroll();
    });
  }

  private initLocomotiveScroll(): void {
    this.locomotiveScroll = new LocomotiveScroll({
      lenisOptions: {
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      },
      scrollCallback: () => {
        ScrollTrigger.update();
      },
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }
  }

  ngOnDestroy(): void {
    this.locomotiveScroll?.destroy();
  }
}
