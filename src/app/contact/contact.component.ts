import { AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initContact } from './contact.anim';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ctHost', { static: true }) host!: ElementRef<HTMLElement>;
  private off: (() => void) | null = null;

  constructor(private zone: NgZone, @Inject(PLATFORM_ID) private pid: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.pid)) return;
    this.zone.runOutsideAngular(() => (this.off = initContact(this.host.nativeElement, gsap, ScrollTrigger)));
  }

  ngOnDestroy(): void {
    this.off?.();
  }
}
