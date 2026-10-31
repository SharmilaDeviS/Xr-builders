import {
  AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FxService, ParticleStyle } from '../fx.service';

const BACKEND_URL = 'https://xr-builders-contact-backend.onrender.com/api/contact';

const NAME_PATTERN = /^[\p{L}][\p{L} .'-]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COUNTRY_CODE_PATTERN = /^(?:\+|\+?\d{1,3})$/;
const MOBILE_NUMBER_PATTERN = /^\d{6,15}$/;

/** Rejects values that are only spaces (Validators.required lets "   " through). */
function notBlank(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  return typeof v === 'string' && v.length > 0 && v.trim().length === 0 ? { blank: true } : null;
}

type ContactField = 'name' | 'email' | 'organisation' | 'countryCode' | 'mobileNumber' | 'inquiryType' | 'message';

@Component({
  selector: 'app-xr-builder',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './xr-builder.component.html',
  styleUrls: ['./xr-builder.component.css'],
})
export class XrBuilderComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private fx = inject(FxService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('cursor', { static: true }) cursorRef!: ElementRef<HTMLElement>;
  @ViewChild('cursorRing', { static: true }) ringRef!: ElementRef<HTMLElement>;

  /* ── page effects ── */
  particles: ParticleStyle[] = this.fx.createParticles(50, 'rgba(180,0,255,0.6)', 'rgba(0,255,136,0.6)');
  scrolled = false;
  private stopCursor?: () => void;
  private observer?: IntersectionObserver;

  /* ── contact form ── */
  readonly inquiryTypes = [
    'VR / AR Training Simulation',
    'Digital Twin Development',
    'Industrial Safety Training',
    'WebGL / eLearning Module',
    'Defence & Aviation XR',
    'Healthcare Simulation',
    'Architectural Visualization',
    'Multiplayer XR Platform',
    'Demo Request',
    'General Inquiry',
  ];

  contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, notBlank, Validators.minLength(2), Validators.maxLength(60), Validators.pattern(NAME_PATTERN)]],
    email: ['', [Validators.required, notBlank, Validators.maxLength(100), Validators.pattern(EMAIL_PATTERN)]],
    organisation: ['', [Validators.maxLength(100)]],
    countryCode: ['+', [Validators.pattern(COUNTRY_CODE_PATTERN)]],
    mobileNumber: ['', [Validators.pattern(MOBILE_NUMBER_PATTERN)]],
    inquiryType: [this.inquiryTypes[0], Validators.required],
    message: ['', [Validators.required, notBlank, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  submitted = false;
  sending = false;
  sent = false;
  submitError = '';
  private resetTimer?: ReturnType<typeof setTimeout>;

  private readonly messages: Partial<Record<ContactField, Record<string, string>>> = {
    name: {
      required: 'Please enter your name.',
      blank: 'Please enter your name.',
      minlength: 'Name must be at least 2 characters.',
      maxlength: 'Name is too long (max 60 characters).',
      pattern: "Name can only contain letters, spaces, . ' and -",
    },
    email: {
      required: 'Please enter your email address.',
      blank: 'Please enter your email address.',
      maxlength: 'Email is too long (max 100 characters).',
      pattern: 'Please enter a valid email address (e.g. you@company.com).',
    },
    organisation: {
      maxlength: 'Organisation name is too long (max 100 characters).',
    },
    countryCode: {
      pattern: 'Enter a country code with digits and an optional leading + (e.g. +91).',
    },
    mobileNumber: {
      pattern: 'Enter 6 to 15 digits only.',
    },
    message: {
      required: 'Please enter a message.',
      blank: 'Please enter a message.',
      minlength: 'Message must be at least 10 characters.',
      maxlength: 'Message is too long (max 1000 characters).',
    },
  };

  /* ── lifecycle ── */
  ngAfterViewInit(): void {
    this.stopCursor = this.fx.startCursor(this.cursorRef.nativeElement, this.ringRef.nativeElement);
    this.observer = this.fx.observeReveal(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.stopCursor?.();
    this.observer?.disconnect();
    clearTimeout(this.resetTimer);
  }

  /* ── nav ── */
  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 50;
  }

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToTop(event: Event): void {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── form helpers used by the template ── */
  showError(field: ContactField): boolean {
    const c = this.contactForm.controls[field];
    return c.invalid && (c.touched || c.dirty || this.submitted);
  }

  errorMessage(field: ContactField): string {
    const errors = this.contactForm.controls[field].errors;
    if (!errors) return '';
    const key = Object.keys(errors)[0];
    return this.messages[field]?.[key] ?? 'Invalid value.';
  }

  sanitizeCountryCode(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const input = event.target;
    const value = input.value.replace(/[^\d+]/g, '');
    const sanitized = value.startsWith('+')
      ? `+${value.slice(1).replace(/\+/g, '')}`
      : value.replace(/\+/g, '');
    this.contactForm.controls.countryCode.setValue(sanitized);
  }

  sanitizeMobileNumber(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const sanitized = event.target.value.replace(/\D/g, '');
    this.contactForm.controls.mobileNumber.setValue(sanitized);
  }

  onSubmit(): void {
    this.submitted = true;
    this.submitError = '';

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      // wait one tick so the .invalid classes are rendered, then focus the first bad field
      setTimeout(() =>
        this.host.nativeElement
          .querySelector<HTMLElement>('form input.invalid, form textarea.invalid')
          ?.focus()
      );
      return;
    }

    const v = this.contactForm.getRawValue();
    this.sending = true;

    this.http
      .post(BACKEND_URL, {
        name: v.name.trim(),
        email: v.email.trim(),
        organisation: v.organisation.trim(),
        countryCode: v.countryCode.trim() || '+',
        mobileNumber: v.mobileNumber.trim(),
        inquiryType: v.inquiryType,
        message: v.message.trim(),
      })
      .subscribe({
        next: () => {
          this.sending = false;
          this.sent = true;
          this.submitted = false;
          this.contactForm.reset({
            name: '', email: '', organisation: '', countryCode: '+', mobileNumber: '',
            inquiryType: v.inquiryType, message: '',
          });
          this.resetTimer = setTimeout(() => (this.sent = false), 6000);
        },
        error: (err) => {
          console.error('Contact form error:', err);
          this.sending = false;
          this.submitError =
            'Failed to send message. Please email us directly at contact@xrbuilders.net';
        },
      });
  }
}
