/* ================================
   BOOK OPENING TRANSITION - Three.js
   Origin at spine (left edge). Spine stays left. Cover opens left, under pages.
   ================================ */

(function() {
  'use strict';

  const CONFIG = {
    animationDuration: 4200,
    enableTransition: true,
    debug: false
  };

  let scene, camera, renderer, bookGroup;

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

  function createBook(THREE, bookColor) {
    // When open: [front cover, flat] [spine] [back cover + pages]. Origin at spine center.
    const thickness = 0.26;
    const coverW = 1.15;
    const height = 2;
    const spineW = 0.14;
    const halfT = thickness / 2;
    const halfH = height / 2;

    const mat = function(opts) {
      return new THREE.MeshStandardMaterial(Object.assign({
        side: THREE.DoubleSide,
        metalness: 0.08,
        roughness: 0.85
      }, opts));
    };

    const group = new THREE.Group();

    // --- SPINE: solid box with visible width between front and back when open.
    const spineGeom = new THREE.BoxGeometry(spineW, height, thickness);
    const spineMesh = new THREE.Mesh(spineGeom, mat({ color: bookColor }));
    spineMesh.position.set(0, 0, 0);
    spineMesh.userData.name = 'spine';
    group.add(spineMesh);

    // --- BODY: back to the RIGHT of spine (x from spineW/2 to spineW/2+coverW)
    const backGeom = new THREE.PlaneGeometry(coverW, height);
    const backMesh = new THREE.Mesh(backGeom, mat({ color: bookColor }));
    backMesh.position.set(spineW / 2 + coverW / 2, 0, -halfT);
    backMesh.rotation.y = Math.PI;
    group.add(backMesh);

    const topGeom = new THREE.PlaneGeometry(coverW + spineW, thickness);
    const topMesh = new THREE.Mesh(topGeom, mat({ color: bookColor }));
    topMesh.position.set(spineW / 2 + coverW / 2, halfH + halfT/2, 0);
    topMesh.rotation.x = -Math.PI / 2;
    group.add(topMesh);

    const bottomMesh = new THREE.Mesh(topGeom.clone(), mat({ color: bookColor }));
    bottomMesh.position.set(spineW / 2 + coverW / 2, -halfH - halfT/2, 0);
    bottomMesh.rotation.x = Math.PI / 2;
    group.add(bottomMesh);

    const rightGeom = new THREE.PlaneGeometry(thickness, height);
    const rightMesh = new THREE.Mesh(rightGeom, mat({ color: bookColor }));
    rightMesh.position.set(spineW + coverW, 0, 0);
    rightMesh.rotation.y = -Math.PI / 2;
    group.add(rightMesh);

    // --- PAGES INTERIOR: hidden until opening stage
    const pagesGeom = new THREE.PlaneGeometry(coverW * 0.88, height * 0.92);
    const pagesMesh = new THREE.Mesh(pagesGeom, mat({ color: 0xe8e2d8, metalness: 0, roughness: 1 }));
    pagesMesh.position.set(spineW / 2 + coverW / 2, 0, halfT - 0.05);
    pagesMesh.visible = false;
    group.add(pagesMesh);

    // --- FLIP PAGES: pivot centered at spine (x=0). Pages extend from right edge of spine.
    const pageW = coverW;
    const pageH = height * 0.92;
    const pageGeom = new THREE.PlaneGeometry(pageW, pageH);
    const flipPageGroups = [];
    for (var i = 0; i < 5; i++) {
      var pg = new THREE.Group();
      pg.position.set(0, 0, halfT - 0.01 - i * 0.008);
      pg.visible = false;
      var page = new THREE.Mesh(pageGeom, mat({ color: 0xf2efe6, metalness: 0, roughness: 1 }));
      page.position.set(spineW / 2 + pageW / 2, 0, 0);
      page.rotation.y = -Math.PI / 2;
      page.renderOrder = 100 + i;
      pg.add(page);
      flipPageGroups.push(pg);
      group.add(pg);
    }

    // --- FRONT COVER: hinges at spine (x=0). When open, swings LEFT (to negative X).
    const hingeGroup = new THREE.Group();
    hingeGroup.position.set(0, 0, halfT);

    const frontGeom = new THREE.PlaneGeometry(coverW, height);
    const frontMesh = new THREE.Mesh(frontGeom, mat({ color: bookColor }));
    frontMesh.position.set(coverW / 2, 0, 0);
    frontMesh.renderOrder = 1;
    hingeGroup.add(frontMesh);
    group.add(hingeGroup);

    return { group, hingeGroup, flipPageGroups, spineMesh: spineMesh, pagesMesh: pagesMesh, coverW: coverW, spineW: spineW };
  }

  function initThree(container, bookColor) {
    var THREE = window.THREE;
    if (!THREE) return null;

    scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = 5;
    camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
      frustum, -frustum,
      0.1, 100
    );
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(3, 2, 4);
    scene.add(dir);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    const result = createBook(THREE, bookColor);
    bookGroup = result.group;
    scene.add(bookGroup);
    return result;
  }

  function screenToWorld(x, y) {
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = 5;
    return {
      x: ((x / window.innerWidth) * 2 - 1) * frustum * aspect,
      y: (-(y / window.innerHeight) * 2 + 1) * frustum
    };
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateBookOpen(bookElement, href) {
    const overlay = document.getElementById('book-transition-overlay');
    if (!overlay) return;

    const rect = bookElement.getBoundingClientRect();
    const bookColor = getComputedStyle(bookElement).getPropertyValue('--book-color').trim() || '#5b6a82';

    var container = document.createElement('div');
    container.id = 'book-transition-canvas-container';
    container.className = 'book-transition-canvas-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:10001;pointer-events:none;';
    overlay.appendChild(container);
    overlay.classList.add('active');

    var result = initThree(container, bookColor);
    if (!result) {
      var flash = document.getElementById('page-flash');
      if (flash) flash.classList.add('active');
      setTimeout(function() { window.location.href = href; }, 400);
      return;
    }

    var hingeGroup = result.hingeGroup;
    var flipPageGroups = result.flipPageGroups;
    var spineMesh = result.spineMesh;
    var pagesMesh = result.pagesMesh;
    var bookOffsetX = -(result.spineW / 2 + result.coverW / 2);
    bookElement.classList.add('opening');

    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var start = screenToWorld(cx, cy);
    var scale = Math.min(rect.width, rect.height) / 200;

    // Shelf: spine faces camera. Front: front faces camera, spine on LEFT (offset book so spine is left of center)
    bookGroup.position.set(start.x, start.y, 0);
    bookGroup.scale.setScalar(scale * 0.5);
    bookGroup.rotation.y = -Math.PI / 2;
    bookGroup.rotation.x = 0.03;

    const duration = CONFIG.animationDuration;
    const startTime = performance.now();

    const T1 = 0.18, T2 = 0.38, T3 = 0.58, T4 = 0.80;

    function update() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      if (t < T1) {
        var s = easeOutCubic(t / T1);
        spineMesh.visible = true;
        pagesMesh.visible = false;
        flipPageGroups.forEach(function(pg) { pg.visible = false; });
        bookGroup.position.x = start.x + (bookOffsetX - start.x) * s;
        bookGroup.position.y = start.y + (0 - start.y) * s;
        bookGroup.scale.setScalar((scale * 0.5) + (0.9 - scale * 0.5) * s);
      } else if (t < T2) {
        var s = easeOutCubic((t - T1) / (T2 - T1));
        spineMesh.visible = false;
        pagesMesh.visible = false;
        flipPageGroups.forEach(function(pg) { pg.visible = false; });
        bookGroup.rotation.y = -Math.PI / 2 + (0 - (-Math.PI / 2)) * s;
        bookGroup.rotation.x = 0.03 - 0.03 * s;
        bookGroup.position.set(bookOffsetX, 0, 0);
        bookGroup.scale.setScalar(0.9);
      } else if (t < T3) {
        spineMesh.visible = true;
        pagesMesh.visible = true;
        flipPageGroups.forEach(function(pg) { pg.visible = true; });
        var s = easeOutCubic((t - T2) / (T3 - T2));
        hingeGroup.rotation.y = (-Math.PI) * s;
      } else if (t < T4) {
        spineMesh.visible = true;
        var phaseLen = T4 - T3;
        const pagePhase = (t - T3) / phaseLen;
        flipPageGroups.forEach(function(pg, i) {
          const localT = (pagePhase * (flipPageGroups.length + 0.5)) - i;
          const ps = Math.max(0, Math.min(1, localT));
          pg.rotation.y = (-Math.PI / 2) * easeOutCubic(ps);
        });
      } else {
        spineMesh.visible = true;
        var s = (t - T4) / (1 - T4);
        bookGroup.scale.setScalar(0.9 + 2.2 * s);
        scene.traverse(function(obj) {
          if (obj.isMesh && obj.material) {
            obj.material.transparent = true;
            if (obj.material.opacity === undefined) obj.material.opacity = 1;
            obj.material.opacity = Math.max(0, 1 - s * 1.2);
          }
        });
      }

      renderer.render(scene, camera);
      if (t < 1) requestAnimationFrame(update);
      else window.location.href = href;
    }

    setTimeout(function() {
      var flash = document.getElementById('page-flash');
      if (flash) flash.classList.add('active');
    }, duration * 0.9);

    renderer.render(scene, camera);
    requestAnimationFrame(update);
  }

  function handleBookClick(event) {
    if (!CONFIG.enableTransition) return;
    const el = event.currentTarget;
    const href = el.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || !href.endsWith('.html')) return;
    event.preventDefault();
    animateBookOpen(el, href);
  }

  function init() {
    createTransitionElements();
    document.querySelectorAll('a.book').forEach(function(book) {
      const href = book.getAttribute('href');
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
    disable: function() { CONFIG.enableTransition = false; }
  };
})();
