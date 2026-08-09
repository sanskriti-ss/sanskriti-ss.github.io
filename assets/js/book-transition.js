/* ================================
   BOOK OPENING TRANSITION — Pure CSS 3D
   Pulls from clicked shelf book, opens cover, turns pages, soft dissolve.
   ================================ */

(function() {
  'use strict';

  var CONFIG = {
    enableTransition: true,
    debug: false
  };

  var overlay, flash, book3d, stage;
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

    var back = document.createElement('div');
    back.className = 'back-cover';
    book.appendChild(back);

    var spine = document.createElement('div');
    spine.className = 'spine';
    book.appendChild(spine);

    var pages = document.createElement('div');
    pages.className = 'page-edges';
    book.appendChild(pages);

    var front = document.createElement('div');
    front.className = 'front-cover';
    var titleEl = document.createElement('div');
    titleEl.className = 'cover-title';
    titleEl.textContent = title || '';
    front.appendChild(titleEl);
    book.appendChild(front);

    for (var i = 0; i < 4; i++) {
      var page = document.createElement('div');
      page.className = 'flip-page';
      page.style.transform = 'translateZ(' + (-2 - i * 2.5) + 'px) rotateY(0deg)';
      page.dataset.index = String(i);

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
    if (stage && stage.parentNode) {
      stage.parentNode.removeChild(stage);
    }
    overlay.classList.remove('active');
    flash.classList.remove('active');
    book3d = null;
    stage = null;
    isAnimating = false;
    document.querySelectorAll('.book.opening').forEach(function(b) {
      b.classList.remove('opening');
    });
  }

  function setOriginFromBook(bookElement) {
    var rect = bookElement.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var vx = window.innerWidth / 2;
    var vy = window.innerHeight / 2;
    var ox = cx - vx;
    var oy = cy - vy;
    var os = Math.max(0.12, Math.min(0.28, Math.max(rect.width, rect.height) / 340));

    book3d.style.setProperty('--ox', ox + 'px');
    book3d.style.setProperty('--oy', oy + 'px');
    book3d.style.setProperty('--os', String(os));
  }

  function animateBookOpen(bookElement, href) {
    if (isAnimating) return;
    isAnimating = true;

    var color = getComputedStyle(bookElement).getPropertyValue('--book-color').trim() || '#5b6a82';
    var spineText = bookElement.querySelector('.spine-text');
    var title = spineText ? spineText.textContent.trim() : '';

    bookElement.classList.add('opening');

    stage = document.createElement('div');
    stage.className = 'book-stage';
    book3d = create3DBook(color, title);
    setOriginFromBook(bookElement);
    stage.appendChild(book3d);
    overlay.appendChild(stage);

    requestAnimationFrame(function() {
      overlay.classList.add('active');
      book3d.classList.add('animate-enter');
    });

    // Settle, then open cover
    setTimeout(function() {
      if (!book3d) return;
      book3d.classList.remove('animate-enter');
      book3d.classList.add('animate-open');
      book3d.classList.add('cover-open');
    }, 740);

    // Enable page flips
    setTimeout(function() {
      if (!book3d) return;
      book3d.classList.add('pages-flip');
    }, 1140);

    var flipPages = book3d.querySelectorAll('.flip-page');
    var flipStart = 1240;
    var flipInterval = 170;
    for (var i = 0; i < flipPages.length; i++) {
      (function(page, delay) {
        setTimeout(function() {
          if (page) page.classList.add('flipped');
        }, delay);
      })(flipPages[i], flipStart + i * flipInterval);
    }

    var exitTime = flipStart + flipPages.length * flipInterval + 280;

    setTimeout(function() {
      if (!book3d) return;
      flash.classList.add('active');
      book3d.classList.add('animate-exit');
    }, exitTime);

    setTimeout(function() {
      if (CONFIG.debug) {
        setTimeout(resetAnimation, 1200);
      } else {
        window.location.href = href;
      }
    }, exitTime + 420);
  }

  function handleBookClick(event) {
    if (!CONFIG.enableTransition) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var el = event.currentTarget;
    var href = el.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || !href.endsWith('.html')) {
      return;
    }

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
