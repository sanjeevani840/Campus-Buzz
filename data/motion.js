/**
 * CAMPBUZZ — Motion & Interaction Engine (v2)
 * Pure visual effects layer — ZERO interference with app.js
 *
 * Effects:
 * - Cursor responsive glow
 * - Ripple on button click
 * - Subtle 3D card tilt (via MutationObserver on dynamic cards)
 * - Scroll reveal via IntersectionObserver
 */

(function () {
  'use strict';

  // ─── 1. CURSOR GLOW ─────────────────────────────────────────────
  const cursorGlow = document.getElementById('cursor-glow');
  let mouseX = -400, mouseY = -400;
  let glowX = -400, glowY = -400;
  let rafId = null;

  if (cursorGlow) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      // Smooth interpolation (lerp) at 8% per frame → silky trail
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;

      cursorGlow.style.transform = `translate(${glowX - 200}px, ${glowY - 200}px)`;
      rafId = requestAnimationFrame(animateCursor);
    }

    animateCursor();
  }


  // ─── 2. RIPPLE CLICK EFFECT (Event Delegation) ──────────────────
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .btn-card-action, .filter-btn');
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
  const TILT_MAX = 3; // degrees — subtle, premium

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
    if (card._tiltAttached) return;
    card._tiltAttached = true;

    card.addEventListener('mousemove', (e) => applyTilt(card, e), { passive: true });
    card.addEventListener('mouseleave', () => resetTilt(card), { passive: true });
  }


  // ─── 4. SCROLL REVEAL (IntersectionObserver) ─────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  function attachReveal(el) {
    if (el._revealAttached) return;
    el._revealAttached = true;
    el.classList.add('reveal');
    revealObserver.observe(el);
  }


  // ─── 5. MUTATIONOBSERVER — Hook new JS-injected cards ────────────
  const CARD_SELECTORS = ['.post-card', '.club-post-card', '.complaint-card', '.event-list-item', '.story-bubble', '.request-admin-card'];

  function processNode(node) {
    if (node.nodeType !== 1) return;

    CARD_SELECTORS.forEach(sel => {
      if (node.matches(sel)) {
        if (sel !== '.event-list-item' && sel !== '.story-bubble') {
          attachTilt(node);
        }
        attachReveal(node);
      }
    });

    // Also search within the added node for matches
    CARD_SELECTORS.forEach(sel => {
      node.querySelectorAll(sel).forEach(child => {
        if (sel !== '.event-list-item' && sel !== '.story-bubble') {
          attachTilt(child);
        }
        attachReveal(child);
      });
    });
  }

  const domObserver = new MutationObserver(mutations => {
    mutations.forEach(mut => {
      mut.addedNodes.forEach(processNode);
    });
  });

  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });


  // ─── 6. PARTICLE FIELD (lightweight glitter) ─────────────────────
  const particleField = document.getElementById('particle-field');
  if (particleField && !particleField.children.length) {
    const count = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 28;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDuration = `${8 + Math.random() * 14}s`;
      p.style.animationDelay = `${Math.random() * 10}s`;
      p.style.opacity = `${0.2 + Math.random() * 0.5}`;
      particleField.appendChild(p);
    }
  }


  // ─── 7. ANIMATED STAT COUNTERS ──────────────────────────────────
  function animateCounter(el, target) {
    const start = parseInt(el.textContent, 10) || 0;
    const diff = target - start;
    if (diff === 0) return;

    const duration = 650;
    const t0 = performance.now();

    function step(now) {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + diff * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('.stat-counter').forEach(el => {
    el.addEventListener('stat-update', (e) => animateCounter(el, e.detail.value));
  });

})();
