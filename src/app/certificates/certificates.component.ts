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
import { initCertificates } from './certificates.anim';

gsap.registerPlugin(ScrollTrigger);

export interface CertificateChip {
  ver: string;
  label: string;
  org: string;
}

export interface CertificateSheet {
  id: string;
  type: 'sheet' | 'finale';
  title: string;
  issuer: string;
  tag: string;
  date: string;
  body: string;
  colorTheme: 'yellow' | 'lilac' | 'offwhite' | 'navy';
  chips?: CertificateChip[];
}

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.scss'],
})
export class CertificatesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('certHost', { static: true }) certHost!: ElementRef<HTMLElement>;

  activeIndex = 0;
  private off: (() => void) | null = null;

  // Single typed data array, nothing hard-coded in template
  readonly sheets: CertificateSheet[] = [
    {
      id: 'nasa-space-apps',
      type: 'sheet',
      title: 'NASA International Space Apps Challenge 2025',
      issuer: 'NASA Space Apps Cairo',
      tag: 'Participation Certificate',
      date: '2025',
      body: '"Galactic Problem Solver" participation certificate, a multidisciplinary team tackling real-world challenges with open NASA data.',
      colorTheme: 'yellow',
    },
    {
      id: 'google-iti',
      type: 'sheet',
      title: 'Build with AI: Masr Edition',
      issuer: 'Google & ITI',
      tag: 'Attendance Certificate',
      date: 'May 2026',
      body: "Virtual sessions on Google's AI technologies and integrating generative AI APIs into development workflows.",
      colorTheme: 'lilac',
    },
    {
      id: 'depi-english',
      type: 'sheet',
      title: 'DEPI Business English Track, Level 2',
      issuer: 'Berlitz',
      tag: 'Berlitz Certified',
      date: 'DEPI · Level 2', // TODO(ali): confirm exact date range when certificate dates are verified
      body: 'Professional communication skills for the workplace.',
      colorTheme: 'offwhite',
    },
    {
      id: 'timeline-certs',
      type: 'finale',
      title: 'Four more live in the timeline.',
      issuer: '$ git tag --list',
      tag: 'Timeline Proof',
      date: '4 Credentials',
      body: 'Training certifications and internship proofs attached directly to their release commits in the timeline.',
      colorTheme: 'navy',
      chips: [
        { ver: 'v2.0', label: 'NTI MEAN-Stack (93.5%)', org: 'NTI' },
        { ver: 'v1.2', label: 'Backend & API Training', org: 'Ain Shams' },
        { ver: 'v1.1', label: 'Bank Internship', org: 'Agricultural Bank' },
        { ver: 'v1.0', label: 'Angular Frontend', org: 'DEPI' },
      ],
    },
  ];

  readonly railLabels = ['Space Apps', 'Build with AI', 'Business English', '+4 in the timeline'];

  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) private pid: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.pid)) return;
    this.zone.runOutsideAngular(() => {
      this.off = initCertificates(this.certHost.nativeElement, gsap, ScrollTrigger, (idx: number) => {
        this.zone.run(() => {
          this.activeIndex = idx;
        });
      });
    });
  }

  onRailClick(i: number): void {
    window.dispatchEvent(new CustomEvent('scroll-to-certificate', { detail: { index: i } }));
  }

  onChipClick(e: MouseEvent, ver: string): void {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('activate-release', { detail: { ver } }));
  }

  ngOnDestroy(): void {
    this.off?.();
  }
}
