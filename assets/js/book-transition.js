/* ================================
   BOOK OPENING TRANSITION — Pure CSS 3D
   No Three.js dependency. Uses CSS transforms + perspective
   for a clean, elegant book-open animation.
   ================================ */

(function() {
  'use strict';

  var CONFIG = {
    enableTransition: true,
    debug: false
  };

  var overlay, flash, book3d;
  var isAnimating = false;

  function createTransitionElements() {
    overlay = document.createElement('div');
    overlay.className = 'book-transition-overlay';
    overlay.id = 'book-transition-overlay';

    flash = document.createElement('div');
    flash.className = 'page-flash';
    flash.id = 'page-flash';

    document.body.appendChild(overlay);
    document.body.appendChild(flash);
  }

  function create3DBook(color, title) {
    var book = document.createElement('div');
    book.className = 'book-3d';
    book.style.setProperty('--book-clr', color);

    // Back cover
    var back = document.createElement('div');
    back.className = 'back-cover';
    book.appendChild(back);

    // Spine
    var spine = document.createElement('div');
    spine.className = 'spine';
    book.appendChild(spine);

    // Pages block (visible stack between covers)
    var pages = document.createElement('div');
    pages.className = 'page-edges';
    book.appendChild(pages);

    // Front cover with title
    var front = document.createElement('div');
    front.className = 'front-cover';
    var titleEl = document.createElement('div');
    titleEl.className = 'cover-title';
    titleEl.textContent = title || '';
    front.appendChild(titleEl);
    book.appendChild(front);

    // Individual flip pages (3 pages — cleaner, less cluttered)
    for (var i = 0; i < 3; i++) {
      var page = document.createElement('div');
      page.className = 'flip-page';
      page.style.transform = 'translateZ(' + (-2 - i * 3) + 'px) rotateY(0deg)';
      page.dataset.index = i;

      var pageFront = document.createElement('div');
      pageFront.className = 'flip-page-front';
      page.appendChild(pageFront);

      var pageBack = document.createElement('div');
      pageBack.className = 'flip-page-back';
      page.appendChild(pageBack);

      book.appendChild(page);
    }

    return book;
  }

  function resetAnimation() {
    if (book3d && book3d.parentNode) {
      book3d.parentNode.removeChild(book3d);
    }
    overlay.classList.remove('active');
    flash.classList.remove('active');
    book3d = null;
    isAnimating = false;
    document.querySelectorAll('.book.opening').forEach(function(b) {
      b.classList.remove('opening');
    });
  }

  function animateBookOpen(bookElement, href) {
    if (isAnimating) return;
    isAnimating = true;

    var color = getComputedStyle(bookElement).getPropertyValue('--book-color').trim() || '#5b6a82';
    var spineText = bookElement.querySelector('.spine-text');
    var title = spineText ? spineText.textContent.trim() : '';

    bookElement.classList.add('opening');

    // Create the 3D book
    book3d = create3DBook(color, title);
    overlay.appendChild(book3d);

    // Phase 1: Darken background, book enters (scale up from shelf)
    requestAnimationFrame(function() {
      overlay.classList.add('active');
      book3d.classList.add('animate-enter');
    });

    // Phase 2: Open the front cover (after enter completes)
    setTimeout(function() {
      book3d.classList.remove('animate-enter');
      book3d.classList.add('animate-open');
      book3d.classList.add('cover-open');
    }, 650);

    // Phase 3: Enable page flip transitions, then flip pages sequentially
    setTimeout(function() {
      book3d.classList.add('pages-flip');
    }, 1100);

    var flipPages = book3d.querySelectorAll('.flip-page');
    var flipStart = 1250;
    var flipInterval = 250;
    for (var i = 0; i < flipPages.length; i++) {
      (function(page, delay) {
        setTimeout(function() {
          page.classList.add('flipped');
        }, delay);
      })(flipPages[i], flipStart + i * flipInterval);
    }

    // Phase 4: Flash white and fade out book
    var exitTime = flipStart + flipPages.length * flipInterval + 500;

    setTimeout(function() {
      flash.classList.add('active');
      book3d.classList.add('animate-exit');
    }, exitTime);

    // Phase 5: Navigate (or reset in debug mode)
    setTimeout(function() {
      if (CONFIG.debug) {
        setTimeout(resetAnimation, 1500);
      } else {
        window.location.href = href;
      }
    }, exitTime + 500);
  }

  function handleBookClick(event) {
    if (!CONFIG.enableTransition) return;
    var el = event.currentTarget;
    var href = el.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || !href.endsWith('.html')) return;
    event.preventDefault();
    animateBookOpen(el, href);
  }

  function init() {
    createTransitionElements();
    document.querySelectorAll('a.book').forEach(function(book) {
      var href = book.getAttribute('href');
      if (href && href.endsWith('.html') && !href.startsWith('http')) {
        book.addEventListener('click', handleBookClick);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.BookTransition = {
    config: CONFIG,
    enable: function() { CONFIG.enableTransition = true; },
    disable: function() { CONFIG.enableTransition = false; },
    reset: resetAnimation
  };
})();
