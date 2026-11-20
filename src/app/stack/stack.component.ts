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

interface CommitItem {
  hash: string;
  title: string;
  target: number;
}

interface ToolItem {
  name: string;
  commits: number[];
}

@Component({
  selector: 'app-stack',
  templateUrl: './stack.component.html',
  styleUrls: ['./stack.component.scss'],
})
export class StackComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stackHost', { static: true }) stackHost!: ElementRef<HTMLElement>;

  private ctx: ReturnType<typeof gsap.context> | null = null;
  private cleanups: Array<() => void> = [];

  readonly commits: Record<number, CommitItem> = {
    1: { hash: 'a3f9c21', title: 'Checkout that actually gets paid', target: 0 },
    2: { hash: '7bd04e8', title: 'Engineering teams, tracked on autopilot', target: 1 },
    3: { hash: 'e41c9a0', title: 'A hackathon build that took 1st place', target: 2 },
  };

  readonly tools: ToolItem[] = [
    { name: 'Angular', commits: [1, 2] },
    { name: 'Node.js', commits: [1] },
    { name: 'Express', commits: [2] },
    { name: 'MongoDB', commits: [2] },
    { name: 'Stripe', commits: [1] },
    { name: 'Paymob', commits: [1] },
    { name: 'Git automation', commits: [2] },
    { name: 'NASA Space Apps', commits: [3] },
  ];

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => this.initStack());
  }

  private initStack(): void {
    const host = this.stackHost.nativeElement;
    const stackEl = host.querySelector<HTMLElement>('.stack')!;
    const stmtEl = host.querySelector<HTMLElement>('#sk-statement')!;
    const gridEl = host.querySelector<HTMLElement>('.sk-grid')!;
    const rows = Array.from(host.querySelectorAll<HTMLButtonElement>('.sk-row'));
    const cmdEl = host.querySelector<HTMLElement>('#sk-cmd')!;
    const resultsEl = host.querySelector<HTMLElement>('#sk-results')!;
    const scrollBtn = host.querySelector<HTMLButtonElement>('#sk-scroll-btn')!;
    const termWrap = host.querySelector<HTMLElement>('.sk-terminal-wrap')!;
    const termCard = host.querySelector<HTMLElement>('.sk-terminal')!;

    let activeTl: gsap.core.Timeline | null = null;
    let currentTargetIndex = 0;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Splits text into word spans
    const splitWords = (el: HTMLElement): HTMLElement[] => {
      const out: HTMLElement[] = [];
      const text = el.textContent || '';
      el.textContent = '';
      text.split(/(\s+)/).forEach(chunk => {
        if (!chunk.trim()) {
          el.append(chunk);
          return;
        }
        const s = document.createElement('span');
        s.className = 'sk-w';
        s.textContent = chunk;
        el.append(s);
        out.push(s);
      });
      return out;
    };

    const selectTool = (toolName: string, userTriggered = false) => {
      const tool = this.tools.find(t => t.name === toolName);
      if (!tool) return;

      rows.forEach(r => {
        const match = r.dataset['tool'] === toolName;
        r.setAttribute('aria-pressed', match ? 'true' : 'false');
        r.setAttribute('aria-selected', match ? 'true' : 'false');
      });

      currentTargetIndex = tool.commits[0] - 1;

      if (userTriggered && window.innerWidth <= 800) {
        termWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (activeTl) {
        activeTl.kill();
        activeTl = null;
      }

      const cmdText = `git log --grep="${toolName}" --oneline`;
      const commitsData = tool.commits.map(c => this.commits[c]);

      if (isReduced) {
        cmdEl.textContent = cmdText;
        resultsEl.innerHTML = commitsData
          .map(
            c => `
          <li class="sk-commit-item">
            <span class="sk-hash-pill">${c.hash}</span>
            <span class="sk-commit-title">${c.title}</span>
          </li>
        `,
          )
          .join('');
        gsap.set(scrollBtn, { autoAlpha: 1, y: 0 });
        return;
      }

      cmdEl.textContent = '';
      resultsEl.innerHTML = '';
      gsap.set(scrollBtn, { autoAlpha: 1, y: 0 });

      activeTl = gsap.timeline();
      const typer = { p: 0 };
      activeTl
        .to(typer, {
          p: 1,
          duration: 0.38,
          ease: 'none',
          onUpdate() {
            const l = Math.round(typer.p * cmdText.length);
            cmdEl.textContent = cmdText.slice(0, l);
          },
        })
        .add(() => {
          resultsEl.innerHTML = commitsData
            .map(
              c => `
            <li class="sk-commit-item">
              <span class="sk-hash-pill">${c.hash}</span>
              <span class="sk-commit-title">${c.title}</span>
            </li>
          `,
            )
            .join('');
          const items = resultsEl.querySelectorAll('.sk-commit-item');
          gsap.fromTo(
            items,
            { autoAlpha: 0, x: -14 },
            { autoAlpha: 1, x: 0, duration: 0.28, stagger: 0.06, ease: 'power2.out' },
          );
        })
        .fromTo(
          scrollBtn,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' },
          '+=0.1',
        );
    };

    rows.forEach(r => {
      const clickHandler = () => selectTool(r.dataset['tool'] || '', true);
      r.addEventListener('click', clickHandler);
      this.cleanups.push(() => r.removeEventListener('click', clickHandler));
    });

    const scrollHandler = () => {
      const chaps = document.querySelectorAll('.chap');
      const target = chaps[currentTargetIndex];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    scrollBtn.addEventListener('click', scrollHandler);
    this.cleanups.push(() => scrollBtn.removeEventListener('click', scrollHandler));

    // Default selection
    selectTool('Angular', false);

    // GSAP context & matchMedia
    this.ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // 1) Card border-radius scrub over Section 02 (Work)
        gsap.fromTo(
          stackEl,
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

        // 2) Statement words scrubbed illumination
        const words = splitWords(stmtEl);
        gsap.fromTo(
          words,
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.12,
            scrollTrigger: {
              trigger: stmtEl,
              start: 'top 82%',
              end: 'bottom 50%',
              scrub: 0.4,
            },
          },
        );

        // 3) Orchestrated entrance of rows + terminal
        gsap
          .timeline({
            scrollTrigger: {
              trigger: gridEl,
              start: 'top 65%',
              toggleActions: 'play none none reverse',
            },
          })
          .from(rows, {
            yPercent: 70,
            autoAlpha: 0,
            duration: 0.85,
            stagger: 0.05,
            ease: 'expo.out',
          })
          .from(
            termCard,
            {
              y: 60,
              rotation: 3,
              autoAlpha: 0,
              duration: 1,
              ease: 'expo.out',
            },
            '<.1',
          );

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
