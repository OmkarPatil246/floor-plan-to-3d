// src/pages/ContactPage.jsx — Redesigned Contact page (white, EmailJS integration)
// Two-column layout: validated form + info panel
// EmailJS sends form data to vivekdalavi7521@gmail.com without a backend
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

// ────────────────────────────────────────────────────────────
// EmailJS Configuration
// ────────────────────────────────────────────────────────────
//
// HOW TO SET UP (3 steps):
//
//  1. Create a free account at https://www.emailjs.com
//
//  2. Add an Email Service:
//     → Dashboard → Email Services → Add New Service → Gmail
//     → Connect your Gmail account (vivekdalavi7521@gmail.com)
//     → Copy the Service ID (e.g. "service_xxxxxxx")
//
//  3. Create an Email Template:
//     → Dashboard → Email Templates → Create New Template
//     → In the template body, use these variables:
//         {{name}}    — sender's name
//         {{email}}   — sender's email
//         {{subject}} — subject line
//         {{message}} — message body
//     → Set "To Email" to your receiving email address
//     → Copy the Template ID (e.g. "template_xxxxxxx")
//
//  4. Copy your Public Key:
//     → Dashboard → Account → API Keys → Public Key
//
//  Paste all three values below:
// ────────────────────────────────────────────────────────────

const EMAILJS_SERVICE_ID  = 'service_e2blkf9';
const EMAILJS_TEMPLATE_ID = 'template_4mldipu';
const EMAILJS_PUBLIC_KEY  = 'edOzetw4p8fok_oS6';

// Basic email regex for client-side validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const pageRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', subject: 'General', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [statusMsg, setStatusMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  // Lazily load EmailJS SDK via CDN (no npm dependency required)
  const emailjsRef = useRef(null);

  useEffect(() => {
    // Load EmailJS SDK dynamically
    if (!window.emailjs) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      script.async = true;
      script.onload = () => {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
        emailjsRef.current = window.emailjs;
      };
      document.head.appendChild(script);
    } else {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
      emailjsRef.current = window.emailjs;
    }
  }, []);

  // GSAP scroll reveal
  useEffect(() => {
    const section = pageRef.current;
    if (!section) return;
    const items = section.querySelectorAll('.reveal');
    items.forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.6, delay: i * 0.06,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el, start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  }, []);

  // ── Handle input changes ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error on input
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ── Validate fields ──
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Please enter your name.';
    if (!form.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.message.trim()) newErrors.message = 'Please enter a message.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Validate single field on blur ──
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    if (name === 'name' && !value.trim()) newErrors.name = 'Please enter your name.';
    else if (name === 'name') delete newErrors.name;

    if (name === 'email') {
      if (!value.trim()) newErrors.email = 'Please enter your email address.';
      else if (!EMAIL_REGEX.test(value.trim())) newErrors.email = 'Please enter a valid email address.';
      else delete newErrors.email;
    }

    if (name === 'message' && !value.trim()) newErrors.message = 'Please enter a message.';
    else if (name === 'message') delete newErrors.message;

    setErrors(newErrors);
  };

  // ── Submit handler ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setStatusMsg('');

    // Honeypot check — if filled, silently "succeed" (it's a bot)
    if (honeypot) {
      setStatus('success');
      setStatusMsg("Message sent — we'll get back to you soon!");
      setForm({ name: '', email: '', subject: 'General', message: '' });
      return;
    }

    if (!validate()) return;

    setSending(true);

    try {
      if (!emailjsRef.current) {
        throw new Error('EmailJS not loaded');
      }

      await emailjsRef.current.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          title: form.subject,
          message: form.message.trim(),
        },
        EMAILJS_PUBLIC_KEY
      );

      setStatus('success');
      setStatusMsg("Message sent — we'll get back to you soon!");
      setForm({ name: '', email: '', subject: 'General', message: '' });
      setErrors({});
    } catch (err) {
      console.error('EmailJS error:', err?.text || err?.message || err);
      setStatus('error');
      setStatusMsg('Something went wrong. Please try again or email us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div ref={pageRef} className="page-shell page-shell--light">

      {/* ═══════════ HERO ═══════════ */}
      <section className="contact-hero-section">
        <div className="about-container">
          <h1 className="about-heading-xl reveal">Get in touch</h1>
          <p className="about-body-lg reveal" style={{ maxWidth: 520, margin: '0 auto' }}>
            Have a question, feedback, or want to partner with us? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* ═══════════ FORM + INFO ═══════════ */}
      <section className="about-section" style={{ paddingTop: 0 }}>
        <div className="about-container">
          <div className="contact-layout-v2">

            {/* LEFT — Form */}
            <div className="reveal">
              {/* Status message (aria-live for accessibility) */}
              {status && (
                <div
                  className={`contact-status-msg contact-status-msg--${status}`}
                  role="status"
                  aria-live="polite"
                >
                  {status === 'success' ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 9l2.25 2.25L12 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="6" x2="9" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="13" r="0.75" fill="currentColor"/></svg>
                  )}
                  {statusMsg}
                </div>
              )}

              <form className="contact-form-v2" onSubmit={handleSubmit} noValidate>
                {/* Honeypot — invisible to humans, catches bots */}
                <div style={{ position: 'absolute', left: -9999, opacity: 0 }} aria-hidden="true">
                  <label htmlFor="hp-field">Leave this empty</label>
                  <input
                    type="text"
                    id="hp-field"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Name + Email row */}
                <div className="contact-form-row">
                  <div className={`contact-form-group${errors.name ? ' contact-form-group--error' : ''}`}>
                    <label htmlFor="contact-name">Name <span aria-hidden="true">*</span></label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Jane Doe"
                      required
                      autoComplete="name"
                    />
                    {errors.name && <span className="contact-field-error" aria-live="polite">{errors.name}</span>}
                  </div>

                  <div className={`contact-form-group${errors.email ? ' contact-form-group--error' : ''}`}>
                    <label htmlFor="contact-email">Email <span aria-hidden="true">*</span></label>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="jane@example.com"
                      required
                      autoComplete="email"
                    />
                    {errors.email && <span className="contact-field-error" aria-live="polite">{errors.email}</span>}
                  </div>
                </div>

                {/* Subject dropdown */}
                <div className="contact-form-group">
                  <label htmlFor="contact-subject">Subject</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Support">Support</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Bug Report">Bug Report</option>
                  </select>
                </div>

                {/* Message */}
                <div className={`contact-form-group${errors.message ? ' contact-form-group--error' : ''}`}>
                  <label htmlFor="contact-message">Message <span aria-hidden="true">*</span></label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows="6"
                    value={form.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Tell us how we can help…"
                    required
                  />
                  {errors.message && <span className="contact-field-error" aria-live="polite">{errors.message}</span>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={`btn-primary contact-submit-btn${sending ? ' contact-submit-btn--loading' : ''}`}
                  disabled={sending}
                >
                  <span className="contact-submit-btn__text">
                    Send Message
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {sending && <span className="contact-submit-btn__spinner" aria-hidden="true" />}
                </button>
              </form>
            </div>

            {/* RIGHT — Info Panel */}
            <div className="contact-info-panel reveal">
              {/* Email */}
              <div className="contact-info-card">
                <div className="contact-info-card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polyline points="22,4 12,13 2,4" />
                  </svg>
                </div>
                <h3 className="contact-info-card__title">Email</h3>
                <p className="contact-info-card__text">
                  <a href="mailto:vivekdalavi7521@gmail.com">vivekdalavi7521@gmail.com</a>
                </p>
              </div>

              {/* Response time */}
              <div className="contact-info-card">
                <div className="contact-info-card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                <h3 className="contact-info-card__title">Response Time</h3>
                <p className="contact-info-card__text">
                  We typically reply within 24–48 hours. For urgent issues, include "Urgent" in the subject line.
                </p>
              </div>

              {/* Social */}
              <div className="contact-info-card">
                <div className="contact-info-card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15,3 21,3 21,9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                <h3 className="contact-info-card__title">Connect</h3>
                <p className="contact-info-card__text">Follow us for updates and announcements.</p>
                <div className="contact-socials-row">
                  <a href="#" className="contact-social-btn" aria-label="Twitter / X">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.5v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                    </svg>
                  </a>
                  <a href="#" className="contact-social-btn" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>
                  <a href="#" className="contact-social-btn" aria-label="GitHub">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                    </svg>
                  </a>
                  <a href="#" className="contact-social-btn" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="5" />
                      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
