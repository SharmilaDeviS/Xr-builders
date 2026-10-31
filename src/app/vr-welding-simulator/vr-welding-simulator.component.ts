import {
  AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FxService, ParticleStyle } from '../fx.service';

@Component({
  selector: 'app-vr-welding-simulator',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './vr-welding-simulator.component.html',
  styleUrls: ['./vr-welding-simulator.component.css'],
})
export class VrWeldingSimulatorComponent implements AfterViewInit, OnDestroy {
  private fx = inject(FxService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('cursor', { static: true }) cursorRef!: ElementRef<HTMLElement>;
  @ViewChild('cursorRing', { static: true }) ringRef!: ElementRef<HTMLElement>;

  // 45 particles, orange + green accents (as in the original VR page)
  particles: ParticleStyle[] = this.fx.createParticles(45, 'rgba(255,107,0,0.6)', 'rgba(0,255,136,0.6)');
  scrolled = false;

  private stopCursor?: () => void;
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.stopCursor = this.fx.startCursor(this.cursorRef.nativeElement, this.ringRef.nativeElement);
    this.observer = this.fx.observeReveal(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.stopCursor?.();
    this.observer?.disconnect();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 50;
  }
}
