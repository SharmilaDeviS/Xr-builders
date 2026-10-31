import { Injectable, NgZone } from '@angular/core';

/** Inline style map used for each floating particle. */
export type ParticleStyle = Record<string, string>;

/**
 * Visual effects shared by both pages:
 *  - custom neon cursor + trailing ring
 *  - floating background particles
 *  - scroll-reveal animation
 */
@Injectable({ providedIn: 'root' })
export class FxService {
  constructor(private zone: NgZone) {}

  /** Same randomisation as the original script: 2-3px dots, cyan by default, 2 accent colours. */
  createParticles(count: number, accentA: string, accentB: string): ParticleStyle[] {
    return Array.from({ length: count }, () => {
      const size = (Math.random() > 0.7 ? 3 : 2) + 'px';
      const style: ParticleStyle = {
        left: Math.random() * 100 + '%',
        'animation-duration': 8 + Math.random() * 12 + 's',
        'animation-delay': Math.random() * 10 + 's',
        width: size,
        height: size,
      };
      if (Math.random() > 0.6) style['background'] = accentA;
      if (Math.random() > 0.8) style['background'] = accentB;
      return style;
    });
  }

  /** Starts the custom cursor. Returns a cleanup function to call in ngOnDestroy. */
  startCursor(cursor: HTMLElement, ring: HTMLElement): () => void {
    const hoverSelector = 'a,button,.panel';
    let mx = 0, my = 0, rx = 0, ry = 0, raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx - 8 + 'px';
      cursor.style.top = my - 8 + 'px';
    };
    const grow = () => {
      cursor.style.transform = 'scale(2)';
      ring.style.width = ring.style.height = '60px';
    };
    const shrink = () => {
      cursor.style.transform = 'scale(1)';
      ring.style.width = ring.style.height = '40px';
    };
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.(hoverSelector)) grow();
    };
    const onOut = (e: MouseEvent) => {
      const to = e.relatedTarget as Element | null;
      if (!to || !to.closest?.(hoverSelector)) shrink();
    };
    const loop = () => {
      rx += (mx - rx - 20) * 0.12;
      ry += (my - ry - 20) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      raf = requestAnimationFrame(loop);
    };

    // Run outside Angular so mouse-move / animation frames don't trigger change detection.
    this.zone.runOutsideAngular(() => {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseover', onOver);
      document.addEventListener('mouseout', onOut);
      loop();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }

  /** Adds the `visible` class to every `.reveal` element inside `root` as it scrolls into view. */
  observeReveal(root: HTMLElement): IntersectionObserver {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 80);
        });
      },
      { threshold: 0.08 }
    );
    root.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return obs;
  }
}
