/* ================================
   BOOK OPENING TRANSITION - JavaScript
   ================================ */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    animationDuration: 3000,
    enableTransition: true,
    debug: false
  };

  // Create overlay elements
  function createTransitionElements() {
    const overlay = document.createElement('div');
    overlay.className = 'book-transition-overlay';
    overlay.id = 'book-transition-overlay';
    
    const flash = document.createElement('div');
    flash.className = 'page-flash';
    flash.id = 'page-flash';
    
    document.body.appendChild(overlay);
    document.body.appendChild(flash);
  }

  // Create a proper 3D book structure
  function createAnimatedBook(bookElement) {
    const rect = bookElement.getBoundingClientRect();
    const bookColor = getComputedStyle(bookElement).getPropertyValue('--book-color').trim() || '#5b6a82';
    const spineText = bookElement.querySelector('.spine-text')?.textContent || '';
    
    const book = document.createElement('div');
    book.className = 'animated-book';
    book.style.cssText = `
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      --spine-depth: ${rect.width}px;
    `;
    
    // Darker and lighter versions of the color
    const darkerColor = `color-mix(in srgb, ${bookColor} 70%, black)`;
    const lighterColor = `color-mix(in srgb, ${bookColor} 85%, white)`;
    
    // Build the 3D book structure matching CSS class names
    book.innerHTML = `
      <div class="book-body">
        <!-- Spine (visible on shelf) -->
        <div class="book-face-spine" style="background: linear-gradient(to right, 
          ${darkerColor},
          ${bookColor},
          ${lighterColor},
          ${bookColor},
          ${darkerColor});">
          <span class="spine-text">${spineText}</span>
        </div>
        
        <!-- Front Cover (swings open) -->
        <div class="book-face-front">
          <div class="book-face-front-outer" style="background: linear-gradient(135deg, 
            ${darkerColor},
            ${bookColor} 30%,
            ${lighterColor} 70%,
            ${bookColor});"></div>
          <div class="book-face-front-inner"></div>
        </div>
        
        <!-- Back Cover -->
        <div class="book-face-back" style="background: linear-gradient(135deg, 
          ${darkerColor},
          ${bookColor});"></div>
        
        <!-- Pages -->
        <div class="book-pages"></div>
      </div>
    `;
    
    return book;
  }

  // Run the book opening animation
  function animateBookOpen(bookElement, href) {
    const overlay = document.getElementById('book-transition-overlay');
    if (!overlay) return;
    
    // Create and add animated book
    const animatedBook = createAnimatedBook(bookElement);
    overlay.appendChild(animatedBook);
    overlay.classList.add('active');
    
    // Add pulse to original
    bookElement.classList.add('opening');
    
    // Force reflow
    animatedBook.offsetHeight;
    
    // Stage 1: Slide out from shelf (after small delay)
    setTimeout(() => {
      if (CONFIG.debug) console.log('Stage 1: Sliding out');
      animatedBook.classList.add('stage-1');
    }, 100);
    
    // Stage 2: Move to center and rotate to face viewer
    setTimeout(() => {
      if (CONFIG.debug) console.log('Stage 2: Moving to center');
      animatedBook.classList.add('stage-2');
    }, 600);
    
    // Stage 3: Open the front cover
    setTimeout(() => {
      if (CONFIG.debug) console.log('Stage 3: Opening cover');
      animatedBook.classList.add('stage-3');
    }, 1800);
    
    // Stage 4: Expand and flash to white
    setTimeout(() => {
      if (CONFIG.debug) console.log('Stage 4: Expanding');
      const flash = document.getElementById('page-flash');
      if (flash) flash.classList.add('active');
      animatedBook.classList.add('stage-4');
    }, 2500);
    
    // Navigate to new page
    setTimeout(() => {
      if (CONFIG.debug) console.log('Navigating to:', href);
      window.location.href = href;
    }, CONFIG.animationDuration);
  }

  // Handle book clicks
  function handleBookClick(event) {
    if (!CONFIG.enableTransition) return;
    
    const bookElement = event.currentTarget;
    const href = bookElement.getAttribute('href');
    
    // Only apply to internal .html links
    if (!href || 
        href.startsWith('http') || 
        href.startsWith('mailto:') || 
        href.startsWith('#') ||
        !href.endsWith('.html')) {
      return;
    }
    
    event.preventDefault();
    animateBookOpen(bookElement, href);
  }

  // Initialize
  function init() {
    createTransitionElements();
    
    // Find all internal book links
    const bookLinks = document.querySelectorAll('a.book');
    
    bookLinks.forEach(book => {
      const href = book.getAttribute('href');
      // Only add transition to internal links
      if (href && href.endsWith('.html') && !href.startsWith('http')) {
        book.addEventListener('click', handleBookClick);
      }
    });
    
    if (CONFIG.debug) {
      console.log(`Book transition initialized for internal links`);
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.BookTransition = {
    config: CONFIG,
    enable: () => { CONFIG.enableTransition = true; },
    disable: () => { CONFIG.enableTransition = false; },
    debug: (val) => { CONFIG.debug = val; }
  };

})();
