/**
 * CAMPBUZZ — Motion & Interaction Engine (v3 — Phase 2)
 * Pure visual effects layer — ZERO interference with app.js
 *
 * Effects:
 * - Cursor responsive glow (gold spotlight)
 * - Ripple on button click
 * - Subtle 3D card tilt (via MutationObserver on dynamic cards)
 * - Scroll reveal via IntersectionObserver
 * - Landing page stat counters
 * - Magnetic button hover
 * - Landing nav scroll state
 * - Staggered reveal animations
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── 1. CURSOR GLOW ─────────────────────────────────────────────
  const cursorGlow = document.getElementById('cursor-glow');
  let mouseX = -400, mouseY = -400;
  let glowX = -400, glowY = -400;

  if (cursorGlow && !prefersReducedMotion) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function animateCursor() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      cursorGlow.style.transform = `translate(${glowX - 200}px, ${glowY - 200}px)`;
      requestAnimationFrame(animateCursor);
    }

    animateCursor();
  }


  // ─── 2. RIPPLE CLICK EFFECT (Event Delegation) ──────────────────
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .btn-card-action, .filter-btn, .demo-user-card, .menu-item');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  }, { passive: true });


  // ─── 3. 3D CARD TILT ────────────────────────────────────────────
  const TILT_MAX = 4;

  function applyTilt(card, e) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const rotX = ((y - cy) / cy) * -TILT_MAX;
    const rotY = ((x - cx) / cx) * TILT_MAX;

    requestAnimationFrame(() => {
      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.015, 1.015, 1.015)`;
      card.style.transition = 'none';
    });
  }

  function resetTilt(card) {
    requestAnimationFrame(() => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s ease, border-color 0.25s ease';
    });
  }

  function attachTilt(card) {
    if (card._tiltAttached || prefersReducedMotion) return;
    card._tiltAttached = true;

    card.addEventListener('mousemove', (e) => applyTilt(card, e), { passive: true });
    card.addEventListener('mouseleave', () => resetTilt(card), { passive: true });
  }


  // ─── 4. SCROLL REVEAL (IntersectionObserver) ─────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.revealDelay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, parseInt(delay, 10));
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  function attachReveal(el, index) {
    if (el._revealAttached) return;
    el._revealAttached = true;
    el.classList.add('reveal');
    if (index !== undefined) {
      el.dataset.revealDelay = Math.min(index * 80, 400);
    }
    revealObserver.observe(el);
  }


  // ─── 5. MUTATIONOBSERVER — Hook new JS-injected cards ────────────
  const CARD_SELECTORS = [
    '.post-card', '.club-post-card', '.complaint-card',
    '.event-list-item', '.story-bubble', '.request-admin-card',
    '.feature-glass-card', '.testimonial-card', '.timeline-step',
    '.stat-showcase-item', '.preview-dashboard'
  ];

  const NO_TILT_SELECTORS = ['.event-list-item', '.story-bubble'];

  function processNode(node) {
    if (node.nodeType !== 1) return;

    CARD_SELECTORS.forEach(sel => {
      if (node.matches(sel)) {
        if (!NO_TILT_SELECTORS.includes(sel)) attachTilt(node);
        attachReveal(node);
      }
    });

    CARD_SELECTORS.forEach(sel => {
      node.querySelectorAll(sel).forEach((child, i) => {
        if (!NO_TILT_SELECTORS.includes(sel)) attachTilt(child);
        attachReveal(child, i);
      });
    });
  }

  const domObserver = new MutationObserver(mutations => {
    mutations.forEach(mut => {
      mut.addedNodes.forEach(processNode);
    });
  });

  domObserver.observe(document.body, { childList: true, subtree: true });


  // ─── 6. PARTICLE FIELD (gold glitter) ───────────────────────────
  const particleField = document.getElementById('particle-field');
  if (particleField && !particleField.children.length && !prefersReducedMotion) {
    const count = 32;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDuration = `${8 + Math.random() * 14}s`;
      p.style.animationDelay = `${Math.random() * 10}s`;
      p.style.opacity = `${0.15 + Math.random() * 0.45}`;
      const size = Math.random() > 0.7 ? 3 : 2;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      particleField.appendChild(p);
    }
  }


  // ─── 7. ANIMATED STAT COUNTERS ──────────────────────────────────
  function animateCounter(el, target) {
    const start = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    const diff = target - start;
    if (diff === 0) return;

    const duration = 800;
    const t0 = performance.now();
    const suffix = el.dataset.suffix || '';

    function step(now) {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + diff * eased).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('.stat-counter').forEach(el => {
    el.addEventListener('stat-update', (e) => animateCounter(el, e.detail.value));
  });


  // ─── 8. LANDING PAGE STAT COUNTERS ──────────────────────────────
  const landingStatObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        if (!isNaN(target)) animateCounter(el, target);
        landingStatObserver.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.landing-stat').forEach(el => {
    landingStatObserver.observe(el);
  });


  // ─── 9. LANDING NAV SCROLL STATE ────────────────────────────────
  const landingNav = document.querySelector('.landing-nav');
  const authPage = document.getElementById('auth-page');

  if (landingNav && authPage) {
    authPage.addEventListener('scroll', () => {
      landingNav.classList.toggle('scrolled', authPage.scrollTop > 40);
    }, { passive: true });
  }


  // ─── 10. MAGNETIC BUTTON HOVER ──────────────────────────────────
  const MAGNETIC_STRENGTH = 0.25;

  function attachMagnetic(el) {
    if (el._magneticAttached || prefersReducedMotion) return;
    el._magneticAttached = true;

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * MAGNETIC_STRENGTH;
      const dy = (e.clientY - cy) * MAGNETIC_STRENGTH;

      requestAnimationFrame(() => {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    }, { passive: true });
  }

  document.querySelectorAll('.btn-primary, .btn-glow, .btn-nav-cta').forEach(attachMagnetic);


  // ─── 11. INITIAL LANDING REVEALS ────────────────────────────────
  document.querySelectorAll('#auth-page .reveal').forEach((el, i) => {
    attachReveal(el, i);
  });

  document.querySelectorAll('.feature-glass-card, .testimonial-card, .timeline-step, .stat-showcase-item').forEach((el, i) => {
    attachReveal(el, i);
  });


  // ─── 12. SMOOTH ANCHOR SCROLLING (landing only) ─────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target || !authPage || !authPage.classList.contains('active')) return;

      e.preventDefault();
      const navHeight = landingNav ? landingNav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + authPage.scrollTop - navHeight - 16;

      authPage.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

})();
