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
// بيمنع ريفريش الـ ScrollTrigger كل ما شريط المتصفح يظهر/يختفي على الموبايل
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
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ngZone.runOutsideAngular(() => this._init());
  }

  private _init(): void {
    const root = document.documentElement;
    const host = this.heroRoot.nativeElement;
    this.ctx = gsap.context(() => {}, host);

    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COARSE = matchMedia('(pointer: coarse)').matches;

    // ---- canvas bg ----
    const cv = host.querySelector<HTMLCanvasElement>('#bg')!;
    const cx = cv.getContext('2d')!;
    const dot = host.querySelector<HTMLElement>('#dot')!;
    const ring = host.querySelector<HTMLElement>('#ring')!;
    const roleEl = host.querySelector<HTMLElement>('#role')!;
    const person = host.querySelector<HTMLElement>('#pwrap')!;

    let W = 0, H = 0, C: Record<string, string> = {}, live = false, seen = false;
    // على اللمس منبدأ برا الشاشة عشان مفيش node تتهايلايت من غير لمس
    const m = COARSE ? { x: -999, y: -999 } : { x: innerWidth / 2, y: innerHeight / 2 };

    // قيم التأثير بتصغر على الشاشات الصغيرة
    const small = () => W < 768;
    const PUSH_R = () => (small() ? 150 : 240);
    const PUSH_AMP = () => (small() ? 44 : 72);
    const HOVER_R = () => (small() ? 140 : 190);

    function size() {
      const d = Math.min(devicePixelRatio || 1, 2);
      const nw = cv.clientWidth || innerWidth;
      const nh = cv.clientHeight || innerHeight;
      if (nw === W && nh === H && cv.width) return;
      W = nw; H = nh;
      cv.width = W * d; cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
    }
    function colors() {
      const s = getComputedStyle(root), g = (k: string) => s.getPropertyValue(k).trim();
      C = { bg: g('--bg'), ink: g('--ink'), acc: g('--acc') };
    }
    size(); colors();

    // ---- letter splitting ----
    type LetterEntry = { o: HTMLElement; i: HTMLElement; qx: (v: number) => void; qy: (v: number) => void; qr: (v: number) => void; cx: number; cy: number };
    const L: LetterEntry[] = [];
    host.querySelectorAll<HTMLElement>('.ln').forEach(ln => {
      const t = ln.textContent!; ln.textContent = '';
      [...t].forEach(c => {
        const o = document.createElement('span'), i = document.createElement('span');
        o.className = 'ch'; i.className = 'ci'; i.textContent = c; o.append(i); ln.append(o);
        const q = (p: string) => gsap.quickTo(i, p, { duration: .6, ease: 'power3' }) as (v: number) => void;
        L.push({ o, i, qx: q('x'), qy: q('y'), qr: q('rotation'), cx: 0, cy: 0 });
      });
    });
    const measure = () => L.forEach(l => { const r = l.o.getBoundingClientRect(); l.cx = r.left + r.width / 2; l.cy = r.top + r.height / 2; });
    function push() {
      const R = PUSH_R(), A = PUSH_AMP();
      L.forEach(l => {
        const dx = l.cx - m.x, dy = l.cy - m.y, d = Math.hypot(dx, dy) || 1, f = Math.max(0, 1 - d / R);
        l.qx(dx / d * f * A); l.qy(dy / d * f * A); l.qr(dx / d * f * 18);
      });
    }

    // ---- git graph ----
    const N = 7, ly = (i: number) => H * (.1 + .8 * i / (N - 1));
    type Node = { x: number; l: number; h: number; y: number };
    type Pulse = { x: number; y: number; r: number; a: number };
    const chain: Node[] = [], free: Node[] = [], pulses: Pulse[] = [];
    let last: Node | undefined;
    function spawn() { const l = last ? Math.max(0, Math.min(N - 1, last.l + (Math.random() * 5 | 0) - 2)) : 3; chain.push(last = { x: last ? last.x + 90 + Math.random() * 80 : -120, l, h: 0, y: 0 }); }
    while (!last || last.x < W + 200) spawn();

    const ticker = (t: number, dt: number) => {
      const sp = RM ? 0 : 44 * Math.min(dt, 50) / 1000;
      const HR = HOVER_R();
      cx.clearRect(0, 0, W, H); cx.lineCap = 'round';
      cx.strokeStyle = C['ink']; cx.globalAlpha = .13; cx.lineWidth = 1; cx.beginPath();
      for (let i = 0; i < N; i++) { cx.moveTo(0, ly(i)); cx.lineTo(W, ly(i)); } cx.stroke();
      chain.forEach(n => n.x -= sp); free.forEach(n => n.x -= sp);
      while (chain[0].x < -220) chain.shift();
      while (last!.x < W + 180) spawn();
      for (let i = free.length; i--;) if (free[i].x < -40) free.splice(i, 1);
      cx.globalAlpha = .5; cx.lineWidth = 2.5; cx.beginPath();
      chain.forEach((n, i) => { n.y = ly(n.l); if (i) { const a = chain[i - 1], mx = (a.x! + n.x) / 2; cx.moveTo(a.x!, a.y!); cx.bezierCurveTo(mx, a.y!, mx, n.y, n.x, n.y); } });
      cx.stroke();
      chain.concat(free).forEach(n => {
        const d = Math.hypot(n.x - m.x, n.y - m.y), tg = d < HR ? 1 - d / HR : 0; n.h += (tg - n.h) * .14;
        if (n.h > .03) { cx.globalAlpha = n.h * .55; cx.beginPath(); cx.moveTo(m.x, m.y); cx.lineTo(n.x, n.y); cx.strokeStyle = C['ink']; cx.stroke(); }
        cx.globalAlpha = 1; cx.beginPath(); cx.arc(n.x, n.y, 5 + n.h * 9, 0, 6.283); cx.fillStyle = n.h > .35 ? C['acc'] : C['bg']; cx.strokeStyle = C['ink']; cx.fill(); cx.stroke();
      });
      pulses.forEach(p => { cx.globalAlpha = p.a; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.strokeStyle = C['ink']; cx.stroke(); });
      cx.globalAlpha = 1;
    };
    gsap.ticker.add(ticker);
    this.cleanups.push(() => gsap.ticker.remove(ticker));

    // ---- cursor ----
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const qd = { x: gsap.quickTo(dot, 'x', { duration: .1 }) as (v: number) => void, y: gsap.quickTo(dot, 'y', { duration: .1 }) as (v: number) => void };
    const qr = { x: gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }) as (v: number) => void, y: gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' }) as (v: number) => void };
    const qp = { x: gsap.quickTo(person, 'x', { duration: 1.2, ease: 'power3' }) as (v: number) => void, y: gsap.quickTo(person, 'y', { duration: 1.2, ease: 'power3' }) as (v: number) => void };

    const onPointermove = (e: PointerEvent) => {
      m.x = e.clientX; m.y = e.clientY;
      if (!COARSE) { qd.x(m.x); qd.y(m.y); qr.x(m.x); qr.y(m.y); }
      if (!seen && !COARSE) { seen = true; gsap.to([dot, ring], { opacity: 1, duration: .3 }); }
      if (live) {
        push();
        // الـ parallax للماوس بس
        if (e.pointerType === 'mouse') { qp.x((m.x / W - .5) * -28); qp.y((m.y / H - .5) * -16); }
      }
    };
    const onPointerleave = () => { m.x = m.y = -999; if (live) push(); };
    const onPointerover = (e: PointerEvent) => {
      if (COARSE) return;
      const k = (e.target as Element).closest('a,button') ? 1.8 : (e.target as Element).closest('h1') ? 2.8 : 1;
      gsap.to(ring, { scale: k, duration: .3, overwrite: 'auto' });
    };
    const onPointerdown = (e: PointerEvent) => {
      if ((e.target as Element).closest('a,button')) return;
      m.x = e.clientX; m.y = e.clientY;
      if (live && e.pointerType !== 'mouse') push();
      const p: Pulse = { x: e.clientX, y: e.clientY, r: 6, a: 1 }; pulses.push(p); free.push({ x: p.x, y: p.y, l: 0, h: 1 });
      const maxR = small() ? 110 : 170;
      gsap.to(p, { r: maxR, a: 0, duration: 1.3, ease: 'expo.out', onComplete: () => pulses.splice(pulses.indexOf(p), 1) });
    };
    // على اللمس: بعد رفع الإصبع الحروف ترجع مكانها
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const onPointerRelease = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => { m.x = m.y = -999; if (live) push(); }, 350);
    };
    window.addEventListener('pointermove', onPointermove, { passive: true });
    root.addEventListener('pointerleave', onPointerleave);
    document.addEventListener('pointerover', onPointerover as EventListener);
    window.addEventListener('pointerdown', onPointerdown, { passive: true });
    window.addEventListener('pointerup', onPointerRelease);
    window.addEventListener('pointercancel', onPointerRelease);
    this.cleanups.push(
      () => window.removeEventListener('pointermove', onPointermove),
      () => root.removeEventListener('pointerleave', onPointerleave),
      () => document.removeEventListener('pointerover', onPointerover as EventListener),
      () => window.removeEventListener('pointerdown', onPointerdown),
      () => window.removeEventListener('pointerup', onPointerRelease),
      () => window.removeEventListener('pointercancel', onPointerRelease),
      () => clearTimeout(releaseTimer),
    );

    // ---- magnetic buttons (ماوس بس) ----
    if (!COARSE) {
      host.querySelectorAll<HTMLElement>('.mag').forEach(el => {
        const onMagMove = (e: PointerEvent) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .35, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, overwrite: 'auto' }); };
        const onMagLeave = () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.35)' });
        el.addEventListener('pointermove', onMagMove);
        el.addEventListener('pointerleave', onMagLeave);
        this.cleanups.push(() => { el.removeEventListener('pointermove', onMagMove); el.removeEventListener('pointerleave', onMagLeave); });
      });
    }

    // ---- theme + clock ----
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onMqChange = () => colors();
    mq.addEventListener('change', onMqChange);
    this.cleanups.push(() => mq.removeEventListener('change', onMqChange));

    const tgBtn = host.querySelector<HTMLButtonElement>('#tg')!;
    tgBtn.onclick = () => { root.dataset['theme'] = (root.dataset['theme'] || (mq.matches ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark'; colors(); };

    const fm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });
    const clockEl = host.querySelector<HTMLElement>('#clock')!;
    const tick = () => clockEl.textContent = 'Cairo ' + fm.format(new Date()); tick();
    const clockInterval = setInterval(tick, 15000);
    this.cleanups.push(() => clearInterval(clockInterval));

    // ---- resize / orientation (بـ rAF عشان ميتكررش كتير) ----
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { size(); measure(); });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    this.cleanups.push(
      () => window.removeEventListener('resize', onResize),
      () => window.removeEventListener('orientationchange', onResize),
      () => cancelAnimationFrame(raf),
    );

    document.fonts.ready.then(measure);

    // ---- marquee ----
    const items = ['Angular', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'Stripe', 'Paymob', 'GSAP', 'Git automation', 'NASA Space Apps 1st place'];
    const set = items.map(t => '<span class="it">' + t + '</span>').join('');
    const tr = host.querySelector<HTMLElement>('#track')!;
    tr.innerHTML = set + set + set + set;
    let mq2: ReturnType<typeof gsap.to> | undefined;
    if (!RM) {
      mq2 = gsap.to(tr, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
      ScrollTrigger.create({
        onUpdate: s => {
          mq2?.timeScale(1 + Math.min(Math.abs(s.getVelocity()) / 200, 12));
          if (mq2) gsap.to(mq2, { timeScale: 1, duration: 1, overwrite: true });
        },
      });
    }

    // ---- helpers ----
    const G = 'abcdefghijklmnopqrstuvwxyz{}[]<>/=+*#';
    function scr(el: HTMLElement, txt: string, d: number) {
      const o = { p: 0 };
      return gsap.to(o, { p: 1, duration: d, ease: 'none', onUpdate() { const n = Math.floor(o.p * txt.length); el.textContent = txt.slice(0, n) + [...txt.slice(n)].map(c => c === ' ' ? c : G[Math.random() * G.length | 0]).join(''); } });
    }
    function typeTo(el: HTMLElement, s: string, d: number) {
      const o = { n: 0 };
      return gsap.to(o, { n: s.length, duration: d, ease: 'none', onUpdate() { el.textContent = s.slice(0, Math.round(o.n)); } });
    }
    function arrows() {
      const tl = gsap.timeline();
      host.querySelectorAll<SVGGElement>('.arrows g').forEach((g, i) => {
        const tx = g.querySelector<SVGTextElement>('text')!, ps = g.querySelectorAll<SVGPathElement>('path');
        tl.add(typeTo(tx as unknown as HTMLElement, tx.dataset['t']!, .6), i * .55)
          .to(ps, { strokeDashoffset: 0, duration: (j: number) => j ? .35 : .9, ease: 'power2.inOut', stagger: .85 }, i * .55 + .3);
      });
      return tl;
    }

    const roles = ['Full-stack developer in Cairo', 'MEAN stack engineer', 'Stripe and Paymob integrator', 'NASA Space Apps 1st place'];
    let ri = 0;
    let nextRoleCall: ReturnType<typeof gsap.delayedCall> | null = null;
    function nextRole() { ri = (ri + 1) % roles.length; scr(roleEl, roles[ri], .9); nextRoleCall = gsap.delayedCall(3.2, nextRole); }

    // ---- boot sequence ----
    const chars = L.map(l => l.i);
    if (RM) { roleEl.textContent = roles[0]; live = true; }
    else {
      gsap.set(chars, { yPercent: 115, rotation: 14 });
      gsap.set(['.top', '.aside', '.strip', cv], { autoAlpha: 0 });
      gsap.set(person, { yPercent: 105 });
      host.querySelectorAll<SVGTextElement>('.arrows text').forEach(x => { x.dataset['t'] = x.textContent!; x.textContent = ''; });
      host.querySelectorAll<SVGPathElement>('.arrows path').forEach(p => {
        let l = 0; try { l = p.getTotalLength(); } catch (e) {}
        gsap.set(p, { strokeDasharray: l, strokeDashoffset: l + 4 });
      });
      const bootEl = host.querySelector<HTMLElement>('#boot')!;
      const btEl = host.querySelector<HTMLElement>('#bt')!;
      const lines = ['$ git init cairo-portfolio', '$ git commit -m "hello, world"', '$ ng build && git push', 'Shipped. Opening site.'];
      const rows = lines.map(() => { const d = document.createElement('div'); btEl.appendChild(d); return d; });
      const tl = gsap.timeline();
      rows.forEach((r, i) => tl.add(typeTo(r, lines[i], .45), i ? '+=.12' : 0));
      tl.to(bootEl, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=.35')
        .to(cv, { autoAlpha: 1, duration: 1.4, ease: 'power2.out' }, '<.4')
        .to(chars, { yPercent: 0, rotation: 0, duration: 1.3, ease: 'expo.out', stagger: .05 }, '<.35')
        .to(['.top', '.aside', '.strip'], { autoAlpha: 1, duration: .8, ease: 'power2.out', stagger: .12 }, '<.6')
        .add(scr(roleEl, roles[0], 1.2), '<')
        .to(person, { yPercent: 0, duration: 1.7, ease: 'expo.out' }, '<1')
        .add(() => { gsap.set('.ln', { overflow: 'visible' }); measure(); live = true; nextRoleCall = gsap.delayedCall(2.4, nextRole); }, '<.6')
        .add(arrows(), '<.8')
        .eventCallback('onComplete', () => {
          const root = host;
          const hero = root.querySelector<HTMLElement>('.hero')!;
          const q = (x: string) => hero.querySelectorAll<HTMLElement>(x);
          gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: '+=100%',
              pin: true,
              pinSpacing: false,
              scrub: 0.5,
              refreshPriority: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
            .to(q('.ci'), { yPercent: -120, duration: 0.5, ease: 'power2.in', stagger: { each: 0.025 } }, 0)
            .to(q('.aside'), { y: -40, autoAlpha: 0, duration: 0.35 }, 0)
            .to(q('.arrows'), { autoAlpha: 0, duration: 0.25 }, 0)
            .to(q('.pwrap'), { yPercent: 28, duration: 0.9, ease: 'power1.in' }, 0)
            .to(hero, { scale: 0.9, autoAlpha: 0.3, duration: 1 }, 0);
          ScrollTrigger.refresh();
        });
    }
    this.cleanups.push(() => { if (nextRoleCall) nextRoleCall.kill(); });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
  }
}