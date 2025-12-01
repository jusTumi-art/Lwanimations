/* ==========================================================================
   Lwanimations - script.js
   Single-file vanilla JS: organized by sections with clear comments.
   Assumes script is loaded with `defer`.
   ========================================================================== */

(function () {
  'use strict';

  /* -------------------
     Utilities & Helpers
     ------------------- */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const noop = () => {};

  // Simple debounce
  function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // Lock/unlock scroll for modals / menus
  function lockScroll() { 
    document.documentElement.style.overflow = 'hidden'; 
    document.body.style.overflow = 'hidden'; 
  }
  
  function unlockScroll() { 
    document.documentElement.style.overflow = ''; 
    document.body.style.overflow = ''; 
  }

  // Focus trap for modal-like elements
  function trapFocus(container) {
    if (!container) return () => {};
    const focusable = qsa('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])', container)
      .filter(n => !n.hasAttribute('disabled'));
    if (!focusable.length) return () => {};
    const first = focusable[0], last = focusable[focusable.length - 1];
    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    container.addEventListener('keydown', handler);
    // return cleanup function
    return () => container.removeEventListener('keydown', handler);
  }

  /* -------------------
     Init: Entry point
     ------------------- */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    console.log('Lwanimations JS initialized');
    initMobileMenu();
    initLightbox();
    initFormValidation();
    initScrollAnimations();
    initStickerGallery();
    initLazyLoad();
    initSearch();
    initMicroInteractions();
    
    // Remove problematic features that don't have HTML support
    // initCarousel(); // Removed - no carousel HTML structure
    // initCharacter(); // Removed - no character container
  }

  /* -------------------
     Mobile Menu - FIXED
     ------------------- */
  function initMobileMenu() {
    const toggle = qs('.mobile-nav-toggle');
    const nav = qs('nav ul');
    
    if (!toggle || !nav) {
      console.log('Mobile menu elements not found');
      return;
    }

    // Click toggles menu
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.toggle('menu-open');
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      isOpen ? lockScroll() : unlockScroll();
      
      if (isOpen) {
        // Move focus to first link
        const firstLink = nav.querySelector('a');
        firstLink && firstLink.focus();
      } else {
        toggle.focus();
      }
    });

    // Close when clicking a nav link
    qsa('nav ul li a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        unlockScroll();
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.classList.contains('menu-open')) return;
      const inside = nav.contains(e.target) || toggle.contains(e.target);
      if (!inside) {
        nav.classList.remove('menu-open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        unlockScroll();
      }
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('menu-open')) {
        nav.classList.remove('menu-open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        unlockScroll();
        toggle.focus();
      }
    });
  }

  /* -------------------
     Lightbox (Gallery Modal) - FIXED
     ------------------- */
  function initLightbox() {
    const selectors = '.gallery img, .art-preview img, .image-frame img, .link-card img, .product-image';
    const thumbs = qsa(selectors);
    
    if (!thumbs.length) {
      console.log('No lightbox images found');
      return;
    }

    // Build modal once
    const modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Image gallery');
    modal.innerHTML = `
      <div class="lightbox-overlay" data-lightbox="overlay"></div>
      <div class="lightbox-content" role="document">
        <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
        <button class="lightbox-prev" aria-label="Previous image">‹</button>
        <div class="lightbox-imgwrap">
          <img id="lightbox-image" src="" alt="">
        </div>
        <p id="lightbox-title" class="lightbox-caption" aria-live="polite"></p>
        <button class="lightbox-next" aria-label="Next image">›</button>
      </div>`;
    document.body.appendChild(modal);

    const overlay = qs('.lightbox-overlay', modal);
    const closeBtn = qs('.lightbox-close', modal);
    const prevBtn = qs('.lightbox-prev', modal);
    const nextBtn = qs('.lightbox-next', modal);
    const imgEl = qs('#lightbox-image', modal);
    const caption = qs('#lightbox-title', modal);

    // Build images array - handle both data-full and regular src
    const images = thumbs.map(t => ({ 
      src: t.dataset.full || t.src, 
      alt: t.alt || '',
      title: t.title || ''
    }));

    let currentIndex = 0;
    let removeTrap = noop;
    let lastFocused = null;

    function openLightbox(i) {
      currentIndex = i;
      const item = images[currentIndex];
      imgEl.src = item.src;
      imgEl.alt = item.alt;
      caption.textContent = item.alt || item.title || '';
      modal.classList.add('open');
      lockScroll();
      lastFocused = document.activeElement;
      closeBtn.focus();
      removeTrap = trapFocus(modal);
    }

    function closeLightbox() {
      modal.classList.remove('open');
      unlockScroll();
      removeTrap();
      lastFocused && lastFocused.focus();
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % images.length;
      updateImage();
    }
    
    function showPrev() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateImage();
    }
    
    function updateImage() {
      const item = images[currentIndex];
      imgEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.src = item.src;
        imgEl.alt = item.alt;
        caption.textContent = item.alt || item.title || '';
        imgEl.style.opacity = '1';
      }, 180);
    }

    // Attach clicks to thumbs
    thumbs.forEach((thumb, idx) => {
      thumb.style.cursor = 'zoom-in';
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', `View larger version of ${thumb.alt || 'image'}`);
      
      thumb.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox(idx);
      });
      
      // Keyboard support
      thumb.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter' || e.key === ' ') { 
          e.preventDefault(); 
          openLightbox(idx); 
        } 
      });
    });

    // Event listeners
    on(closeBtn, 'click', closeLightbox);
    on(overlay, 'click', closeLightbox);
    on(prevBtn, 'click', showPrev);
    on(nextBtn, 'click', showNext);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    });
  }

  /* -------------------
     Form Validation - FIXED
     ------------------- */
  function initFormValidation() {
    const form = qs('#contact-form') || qs('form');
    if (!form) {
      console.log('No form found for validation');
      return;
    }

    const nameInput = qs('#name', form) || qs('[name="name"]', form);
    const emailInput = qs('#email', form) || qs('[name="email"]', form);
    const messageInput = qs('#message', form) || qs('[name="message"]', form);
    
    if (!nameInput || !emailInput || !messageInput) {
      console.log('Form inputs not found');
      return;
    }

    function showError(input, msg) {
      if (!input) return;
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      let err = input.nextElementSibling;
      
      if (!err || !err.classList.contains('error-message')) {
        err = document.createElement('span'); 
        err.className = 'error-message';
        input.insertAdjacentElement('afterend', err);
      }
      
      err.textContent = msg;
      err.classList.add('show');
      err.setAttribute('role', 'alert');
    }

    function clearError(input) {
      if (!input) return;
      input.classList.remove('invalid');
      input.setAttribute('aria-invalid', 'false');
      const err = input.nextElementSibling;
      if (err && err.classList.contains('error-message')) { 
        err.textContent = ''; 
        err.classList.remove('show'); 
      }
    }

    // Real-time validation
    nameInput.addEventListener('blur', () => {
      clearError(nameInput);
      if (nameInput.value.trim() === '') {
        showError(nameInput, 'Please enter your name');
      }
    });

    emailInput.addEventListener('blur', () => {
      clearError(emailInput);
      const emailVal = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        showError(emailInput, 'Please enter a valid email');
      }
    });

    messageInput.addEventListener('blur', () => {
      clearError(messageInput);
      if (messageInput.value.trim().length < 5) {
        showError(messageInput, 'Message must be at least 5 characters');
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      
      // Clear previous errors
      [nameInput, emailInput, messageInput].forEach(clearError);

      // Validate name
      if (nameInput.value.trim() === '') { 
        showError(nameInput, 'Please enter your name'); 
        valid = false; 
      }

      // Validate email
      const emailVal = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) { 
        showError(emailInput, 'Please enter a valid email'); 
        valid = false; 
      }

      // Validate message
      if (messageInput.value.trim().length < 5) { 
        showError(messageInput, 'Message must be at least 5 characters'); 
        valid = false; 
      }

      if (!valid) {
        // Focus first invalid field
        const firstInvalid = form.querySelector('.invalid');
        firstInvalid && firstInvalid.focus();
        return;
      }

      // Form is valid - show success
      let success = qs('#success-message', form);
      if (!success) {
        success = document.createElement('div'); 
        success.id = 'success-message'; 
        success.className = 'success-message';
        form.appendChild(success);
      }
      
      success.textContent = 'Thank you! Your message was sent successfully.';
      success.classList.add('show');
      
      // Reset form
      form.reset();
      
      // Hide success message after 4 seconds
      setTimeout(() => {
        success.classList.remove('show');
      }, 4000);
    });
  }

  /* -------------------
     Scroll animations (IntersectionObserver) - FIXED
     ------------------- */
  function initScrollAnimations() {
    const elements = qsa('section, .link-card, .section-header, .gallery-item, .product-card');
    
    if (!elements.length) {
      console.log('No elements found for scroll animations');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve after animation to improve performance
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => {
      // Skip hero section - it should be immediately visible
      if (el.classList.contains('hero')) {
        el.classList.add('visible');
        return;
      }
      observer.observe(el);
    });
  }

  /* -------------------
     Sticker Pack Gallery - FIXED
     ------------------- */
  function initStickerGallery() {
    const main = qs('#sticker-main-image');
    const thumbs = qsa('.sticker-thumb');
    
    if (!main || !thumbs.length) {
      console.log('Sticker gallery elements not found');
      return;
    }

    thumbs.forEach(thumb => {
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', `View ${thumb.alt || 'sticker'}`);
      
      thumb.addEventListener('click', () => {
        // Remove active class from all thumbs
        thumbs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked thumb
        thumb.classList.add('active');
        
        // Fade transition for main image
        main.style.opacity = '0';
        setTimeout(() => {
          main.src = thumb.dataset.full || thumb.src;
          main.alt = thumb.alt || '';
          main.style.opacity = '1';
        }, 200);
      });
      
      // Keyboard support
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          thumb.click();
        }
      });
    });

    // Activate first thumbnail by default
    if (thumbs.length > 0) {
      thumbs[0].classList.add('active');
    }
  }

  /* -------------------
     Lazy Load Images - FIXED
     ------------------- */
  function initLazyLoad() {
    // Use native lazy loading if supported
    if ('loading' in HTMLImageElement.prototype) {
      qsa('img[data-src]').forEach(img => {
        img.setAttribute('loading', 'lazy');
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
      });
      return;
    }

    // Fallback for older browsers
    const lazyImgs = qsa('img[data-src]');
    if (!lazyImgs.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '100px' });

    lazyImgs.forEach(img => observer.observe(img));
  }

  /* -------------------
     Client-side Search - FIXED
     ------------------- */
  function initSearch() {
    const search = qs('#gallery-search') || qs('#product-search');
    if (!search) {
      console.log('Search input not found');
      return;
    }

    const items = qsa('.link-card, .gallery-item, .product-card');
    if (!items.length) {
      console.log('No searchable items found');
      return;
    }

    function doSearch(value) {
      const query = (value || '').toLowerCase().trim();
      let visibleCount = 0;
      
      items.forEach(item => {
        const title = (qs('h3', item)?.textContent || '').toLowerCase();
        const desc = (qs('p', item)?.textContent || '').toLowerCase();
        const tags = (item.dataset.tags || '').toLowerCase();
        
        const matches = !query || 
          title.includes(query) || 
          desc.includes(query) || 
          tags.includes(query);
        
        item.style.display = matches ? '' : 'none';
        if (matches) {
          item.classList.add('visible');
          visibleCount++;
        }
      });

      // Handle no results message
      let noResults = qs('.no-results');
      if (visibleCount === 0 && query) {
        if (!noResults) {
          noResults = document.createElement('p');
          noResults.className = 'no-results';
          noResults.textContent = 'No items match your search.';
          // Insert after the search input's container
          const searchContainer = search.closest('.search-container') || search.parentElement;
          searchContainer.insertAdjacentElement('afterend', noResults);
        }
      } else if (noResults) {
        noResults.remove();
      }
    }

    // Debounced search
    search.addEventListener('input', debounce((e) => {
      doSearch(e.target.value);
    }, 250));

    // Clear search on escape
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        search.value = '';
        doSearch('');
        search.blur();
      }
    });
  }

  /* -------------------
     Micro-interactions - FIXED
     ------------------- */
  function initMicroInteractions() {
    // Ripple effect for buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    // Smooth scrolling for anchor links
    qsa('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;
        
        const target = qs(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

})();