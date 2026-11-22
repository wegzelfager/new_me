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
ScrollTrigger.config({ ignoreMobileResize: true });

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroRoot') heroRoot!: ElementRef<HTMLElement>;

  private ctx: ReturnType<typeof gsap.context> | null = null;
  private cleanups: Array<() => void> = [];

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
    private el: ElementRef<HTMLElement>,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => this._init());
  }

  private _init(): void {
    const root = document.documentElement;
    const host = this.heroRoot?.nativeElement || this.el.nativeElement;
    this.ctx = gsap.context(() => {}, host);

    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CO = matchMedia('(pointer: coarse)').matches;

    const hero = host.querySelector<HTMLElement>('#hero')!;
    const dot = host.querySelector<HTMLElement>('#dot')!;
    const ring = host.querySelector<HTMLElement>('#ring')!;
    const role = host.querySelector<HTMLElement>('#role')!;
    const pw = host.querySelector<HTMLElement>('#pwrap')!;
    const glow = host.querySelector<HTMLElement>('#glow')!;

    let live = false;
    let seen = false;
    const m = { x: -999, y: -999 };

    // Duplicate name: solid copy behind portrait, outline copy in front
    const nm = host.querySelector<HTMLElement>('.name')!;
    const ol = nm.cloneNode(true) as HTMLElement;
    ol.classList.add('ol');
    ol.removeAttribute('aria-label');
    ol.setAttribute('aria-hidden', 'true');
    hero.append(ol);

    // Letter splitting — on mobile (CO) skip quickTo instances to save JS overhead
    type LetterEntry = {
      o: HTMLElement;
      i: HTMLElement;
      qx: (v: number) => void;
      qy: (v: number) => void;
      qr: (v: number) => void;
      cx: number;
      cy: number;
    };
    const L: LetterEntry[] = [];
    host.querySelectorAll<HTMLElement>('.name .ln').forEach(ln => {
      const t = ln.textContent || '';
      ln.textContent = '';
      [...t].forEach(c => {
        const o = document.createElement('span');
        const i = document.createElement('span');
        o.className = 'ch';
        i.className = 'ci';
        i.textContent = c;
        o.append(i);
        ln.append(o);
        if (!CO) {
          const q = (p: string) => gsap.quickTo(i, p, { duration: 0.7, ease: 'power3' }) as (v: number) => void;
          L.push({ o, i, qx: q('x'), qy: q('y'), qr: q('rotation'), cx: 0, cy: 0 });
        } else {
          // Mobile: push span refs but no quickTo — only needed for intro animation (chars array)
          const noop = (_v: number) => {};
          L.push({ o, i, qx: noop, qy: noop, qr: noop, cx: 0, cy: 0 });
        }
      });
    });

    // measure only needed on desktop (for push repulsion)
    const measure = CO ? () => {} : () => {
      L.forEach(l => {
        const r = l.o.getBoundingClientRect();
        l.cx = r.left + r.width / 2;
        l.cy = r.top + r.height / 2;
      });
    };

    // push only runs on desktop
    function push() {
      if (CO) return;
      const Rr = 300;
      const A = 64;
      L.forEach(l => {
        const dx = l.cx - m.x;
        const dy = l.cy - m.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / Rr) ** 1.5;
        l.qx(dx / d * f * A);
        l.qy(dy / d * f * A * 0.6);
        l.qr(dx / d * f * 9);
      });
    }

    // Cursor + parallax — only set up quickTo instances on desktop
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const qk = (elTarget: HTMLElement, p: string, d: number) =>
      gsap.quickTo(elTarget, p, { duration: d, ease: 'power3' }) as (v: number) => void;
    const qd = !CO ? [qk(dot, 'x', 0.1), qk(dot, 'y', 0.1)] : [(_v: number) => {}, (_v: number) => {}];
    const qr = !CO ? [qk(ring, 'x', 0.5), qk(ring, 'y', 0.5)] : [(_v: number) => {}, (_v: number) => {}];
    const qp = !CO ? [qk(pw, 'x', 1.2), qk(pw, 'y', 1.2)] : [(_v: number) => {}, (_v: number) => {}];
    const qg = !CO ? [qk(glow, 'x', 1.8), qk(glow, 'y', 1.8)] : [(_v: number) => {}, (_v: number) => {}];
    const qn = !CO ? Array.from(host.querySelectorAll<HTMLElement>('.name')).map(n => qk(n, 'x', 1.4)) : [];

    const onPointermove = (e: PointerEvent) => {
      if (CO) return; // skip all pointer tracking on touch devices
      m.x = e.clientX;
      m.y = e.clientY;
      qd[0](m.x);
      qd[1](m.y);
      qr[0](m.x);
      qr[1](m.y);
      if (!seen) {
        seen = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      if (live) {
        push();
        if (e.pointerType === 'mouse') {
          const nx = m.x / innerWidth - 0.5;
          const ny = m.y / innerHeight - 0.5;
          qp[0](nx * -26);
          qp[1](ny * -12);
          qg[0](nx * -90);
          qg[1](ny * -50);
          qn.forEach(q => q(nx * 34));
        }
      }
    };
    window.addEventListener('pointermove', onPointermove, { passive: true });
    this.cleanups.push(() => window.removeEventListener('pointermove', onPointermove));

    const onPointerleave = () => {
      if (CO) return;
      m.x = m.y = -999;
      if (live) push();
    };
    document.addEventListener('pointerleave', onPointerleave);
    this.cleanups.push(() => document.removeEventListener('pointerleave', onPointerleave));

    const onPointerover = (e: PointerEvent) => {
      if (CO) return;
      const t = e.target as HTMLElement;
      gsap.to(ring, { scale: t.closest('a,button') ? 1.7 : 1, duration: 0.3, overwrite: 'auto' });
    };
    document.addEventListener('pointerover', onPointerover);
    this.cleanups.push(() => document.removeEventListener('pointerover', onPointerover));

    let rt: ReturnType<typeof setTimeout> | undefined;
    const rel = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      clearTimeout(rt);
      rt = setTimeout(() => {
        m.x = m.y = -999;
        if (live) push();
      }, 350);
    };
    window.addEventListener('pointerup', rel);
    window.addEventListener('pointercancel', rel);
    this.cleanups.push(
      () => window.removeEventListener('pointerup', rel),
      () => window.removeEventListener('pointercancel', rel),
      () => clearTimeout(rt)
    );

    if (!CO) {
      host.querySelectorAll<HTMLElement>('.mag').forEach(el => {
        const onMagMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, {
            x: (e.clientX - r.left - r.width / 2) * 0.35,
            y: (e.clientY - r.top - r.height / 2) * 0.35,
            duration: 0.4,
            overwrite: 'auto',
          });
        };
        const onMagLeave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.35)' });
        };
        el.addEventListener('pointermove', onMagMove);
        el.addEventListener('pointerleave', onMagLeave);
        this.cleanups.push(() => {
          el.removeEventListener('pointermove', onMagMove);
          el.removeEventListener('pointerleave', onMagLeave);
        });
      });
    }

    // Clock
    const fm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });
    const ck = host.querySelector<HTMLElement>('#clock')!;
    const tick = () => {
      if (ck) ck.textContent = 'Cairo ' + fm.format(new Date());
    };
    tick();
    const clockInterval = setInterval(tick, 15000);
    this.cleanups.push(() => clearInterval(clockInterval));

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);
    this.cleanups.push(
      () => window.removeEventListener('resize', onResize),
      () => cancelAnimationFrame(raf)
    );

    document.fonts.ready.then(measure);

    // Marquee — CSS animation on mobile, GSAP on desktop
    const items = ['Angular', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'Stripe', 'Paymob', 'GSAP', 'Git automation', 'NASA Space Apps'];
    const set = items.map(t => '<span class="it">' + t + '</span>').join('');
    const track = host.querySelector<HTMLElement>('#track')!;
    if (track) {
      track.innerHTML = set + set + set + set;
      if (!RM) {
        if (CO) {
          // Mobile: pure CSS marquee — no JS RAF needed
          track.classList.add('css-marquee');
        } else {
          const mqAnim = gsap.to(track, { xPercent: -50, duration: 45, ease: 'none', repeat: -1 });
          this.cleanups.push(() => mqAnim.kill());
        }
      }
    }

    // Helpers
    const G = 'abcdefghijklmnopqrstuvwxyz{}[]<>/=+*#';
    function scr(elTarget: HTMLElement, txt: string, d: number) {
      const o = { p: 0 };
      return gsap.to(o, {
        p: 1,
        duration: d,
        ease: 'none',
        onUpdate() {
          const n = Math.floor(o.p * txt.length);
          elTarget.textContent = txt.slice(0, n) + [...txt.slice(n)].map(c => c === ' ' ? c : G[Math.random() * G.length | 0]).join('');
        },
      });
    }

    function typeTo(elTarget: HTMLElement, s: string, d: number) {
      const o = { n: 0 };
      return gsap.to(o, {
        n: s.length,
        duration: d,
        ease: 'none',
        onUpdate() {
          elTarget.textContent = s.slice(0, Math.round(o.n));
        },
      });
    }

    const roles = ['Full-stack developer in Cairo', 'MEAN stack engineer', 'Stripe and Paymob integrator', 'NASA Galactic Problem Solver'];
    let ri = 0;
    let nextRoleCall: ReturnType<typeof gsap.delayedCall> | null = null;
    const nextRole = () => {
      ri = (ri + 1) % roles.length;
      // Mobile: use simple typeTo (no per-frame scramble RAF), desktop: scramble effect
      if (CO) {
        typeTo(role, roles[ri], 0.7);
      } else {
        scr(role, roles[ri], 0.9);
      }
      nextRoleCall = gsap.delayedCall(3.2, nextRole);
    };
    this.cleanups.push(() => {
      if (nextRoleCall) nextRoleCall.kill();
    });

    // Intro timeline
    const chars = L.map(l => l.i);
    const ui = ['.top', '.tag', '.info', '.stack', '.badge'];
    const bootEl = host.querySelector<HTMLElement>('#boot')!;
    const cntEl = host.querySelector<HTMLElement>('#cnt')!;
    const btEl = host.querySelector<HTMLElement>('#bt')!;

    if (RM) {
      role.textContent = roles[0];
      live = true;
      if (bootEl) bootEl.remove();
      this._initExitTrigger(host);
    } else {
      gsap.set(chars, { yPercent: 125, rotation: 8, transformOrigin: '0% 100%' });
      gsap.set(ui, { autoAlpha: 0, y: 24 });
      gsap.set('.strip', { yPercent: 100 });
      gsap.set(pw, { yPercent: 102 });
      gsap.set(glow, { autoAlpha: 0, scale: 0.7 });

      const lines = ['$ git init cairo-portfolio', '$ git commit -m "hello, world"', '$ ng build && git push'];
      const rows = lines.map(() => {
        const d = document.createElement('div');
        btEl.appendChild(d);
        return d;
      });
      const cn = { n: 0 };
      const tl = gsap.timeline();

      tl.to(cn, {
        n: 100,
        duration: 2.1,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (cntEl) cntEl.textContent = String(Math.round(cn.n)).padStart(3, '0');
        },
      }, 0);

      rows.forEach((r, i) => tl.add(typeTo(r, lines[i], 0.5), 0.15 + i * 0.6));

      tl.to(bootEl, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=.25')
        .to('.strip', { yPercent: 0, duration: 1, ease: 'expo.out' }, '<.5')
        .to(chars, { yPercent: 0, rotation: 0, duration: 1.6, ease: 'expo.out', stagger: 0.045 }, '<.1')
        .to(glow, { autoAlpha: 1, scale: 1, duration: 2.4, ease: 'power2.out' }, '<.6')
        .to(pw, { yPercent: 0, duration: 2.2, ease: 'expo.out' }, '<.3')
        .to(ui, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }, '<.9')
        .add(CO ? typeTo(role, roles[0], 0.8) : scr(role, roles[0], 1.2), '<.2')
        .add(() => {
          gsap.set(host.querySelectorAll<HTMLElement>('.ln'), { overflow: 'visible' });
          gsap.set(chars, { transformOrigin: '50% 50%' });
          measure();
          live = true;
          nextRoleCall = gsap.delayedCall(2.4, nextRole);
          // Desktop only: JS glow breathing (mobile uses CSS animation)
          if (!CO) {
            const glowAnim = gsap.to(glow, { scale: 1.08, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
            this.cleanups.push(() => glowAnim.kill());
          }
        }, '>-.4')
        .eventCallback('onComplete', () => {
          this._initExitTrigger(host);
        });
    }
  }

  private _initExitTrigger(host: HTMLElement): void {
    const hero = host.querySelector<HTMLElement>('.hero')!;
    if (!hero) return;
    const q = (x: string) => hero.querySelectorAll<HTMLElement>(x);
    const isTouch = matchMedia('(pointer: coarse)').matches;
    const exitTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: host,
        start: 'top top',
        end: '+=100%',
        pin: true,
        pinSpacing: false,
        scrub: isTouch ? 0.2 : 0.35,
        refreshPriority: 1,
        anticipatePin: 1,
        fastScrollEnd: true,
        invalidateOnRefresh: true,
      },
    })
      .to(q('.ci'), { yPercent: -120, duration: 0.5, ease: 'power2.in', stagger: { each: 0.025 } }, 0)
      .to(q('.info, .stack, .tag, .badge'), { y: -40, autoAlpha: 0, duration: 0.35 }, 0)
      .to(q('.pwrap'), { yPercent: 25, duration: 1, ease: 'none' }, 0)
      .to(hero, { scale: 0.9, autoAlpha: 0.3, duration: 1 }, 0);

    this.cleanups.push(() => {
      exitTl.scrollTrigger?.kill();
      exitTl.kill();
    });
    ScrollTrigger.refresh();
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
  }
}
