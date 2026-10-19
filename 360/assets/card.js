/* Tarjeta 360 Consulting. La URL se adapta automáticamente al alojamiento. */
(function () {
  'use strict';

  var fallbackUrl = 'https://jmorales290791.github.io/tarjeta/360/';
  var pageUrl;
  try {
    var current = new URL(window.location.href);
    var localHost = /^(localhost|127\.0\.0\.1|\[::1\]|terminal\.local)$/.test(current.hostname);
    if (/^https?:$/.test(current.protocol) && !localHost) {
      current.search = '';
      current.hash = '';
      current.pathname = current.pathname.replace(/index\.html$/i, '');
      pageUrl = current.href;
    } else {
      pageUrl = fallbackUrl;
    }
  } catch (error) {
    pageUrl = fallbackUrl;
  }

  var card = document.getElementById('card');
  var cardInner = document.getElementById('cardInner');
  var scene = document.getElementById('scene');
  var front = document.getElementById('frontFace');
  var back = document.getElementById('backFace');
  var qrBtn = document.getElementById('qrBtn');
  var backBtn = document.getElementById('backBtn');
  var toast = document.getElementById('toast');
  var shareDialog = document.getElementById('shareDialog');
  var shareInput = document.getElementById('shareLink');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var toastTimer;

  document.getElementById('yr').textContent = new Date().getFullYear();
  document.getElementById('cardLink').href = pageUrl;
  shareInput.value = pageUrl;

  function notify(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = window.setTimeout(function () { toast.classList.remove('visible'); }, 3500);
  }

  /* El QR se genera localmente y abre esta tarjeta, sin servicios externos. */
  var qrReady = false;
  function renderQr() {
    if (qrReady) return;
    var container = document.getElementById('qr');
    try {
      if (!window.QRCode) throw new Error('QR library unavailable');
      container.textContent = '';
      new window.QRCode(container, {
        text: pageUrl,
        width: 184,
        height: 184,
        colorDark: '#111114',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H
      });
      qrReady = true;
    } catch (error) {
      container.textContent = 'Abre la tarjeta con el enlace de abajo.';
    }
  }

  function flip(showBack) {
    if (showBack) renderQr();
    card.style.transform = '';
    scene.style.animationPlayState = showBack ? 'paused' : '';
    cardInner.classList.toggle('flip', showBack);
    front.inert = showBack;
    back.inert = !showBack;
    front.setAttribute('aria-hidden', String(showBack));
    back.setAttribute('aria-hidden', String(!showBack));
    qrBtn.setAttribute('aria-expanded', String(showBack));
    (showBack ? backBtn : qrBtn).focus({ preventScroll: true });
  }
  qrBtn.addEventListener('click', function () { flip(true); });
  backBtn.addEventListener('click', function () { flip(false); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !shareDialog.open && cardInner.classList.contains('flip')) flip(false);
  });

  /* Inclinación y flotación originales, con soporte para movimiento reducido. */
  scene.addEventListener('pointermove', function (event) {
    if (reducedMotion.matches || event.pointerType !== 'mouse' || cardInner.classList.contains('flip')) return;
    var bounds = scene.getBoundingClientRect();
    var x = (event.clientX - bounds.left) / bounds.width - .5;
    var y = (event.clientY - bounds.top) / bounds.height - .5;
    card.style.transform = 'rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg)';
  });
  scene.addEventListener('pointerleave', function () { card.style.transform = ''; });

  /* Compartir desde el menú del teléfono; copiar enlace en otros equipos. */
  function showShareDialog() {
    if (!shareDialog.open) shareDialog.showModal();
    shareInput.focus();
    shareInput.select();
  }

  async function copyLink() {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(pageUrl);
      if (shareDialog.open) shareDialog.close();
      notify('Enlace de la tarjeta copiado');
      return true;
    } catch (error) {
      showShareDialog();
      return false;
    }
  }

  document.getElementById('shareBtn').addEventListener('click', async function () {
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: 'Báktara Arceo · 360 Consulting',
          text: 'Mi tarjeta digital · Transformation Consultant',
          url: pageUrl
        });
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    }
    await copyLink();
  });

  document.getElementById('copyBtn').addEventListener('click', async function () {
    if (await copyLink()) return;
    try {
      shareInput.focus();
      shareInput.select();
      shareInput.setSelectionRange(0, shareInput.value.length);
      if (document.execCommand('copy')) {
        shareDialog.close();
        notify('Enlace de la tarjeta copiado');
        return;
      }
    } catch (error) { /* El enlace permanece seleccionado para copiarlo manualmente. */ }
    notify('Mantén pulsado el enlace o usa Ctrl/Cmd + C para copiarlo');
  });

  /* Three.js conserva el fondo 3D de la tarjeta original con la paleta 360. */
  (function background3d() {
    var canvas = document.getElementById('bg3d');
    if (!window.THREE || reducedMotion.matches) return;
    var renderer;
    try {
      renderer = new window.THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (error) {
      canvas.hidden = true;
      return;
    }
    var THREE = window.THREE;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var world = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, .1, 100);
    camera.position.z = 6;
    var count = 450;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < positions.length; i++) positions[i] = (Math.random() - .5) * 22;
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xf234b2, size: .028, transparent: true, opacity: .5 }));
    var ico = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), new THREE.MeshBasicMaterial({ color: 0x9a8295, wireframe: true, transparent: true, opacity: .12 }));
    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), new THREE.MeshBasicMaterial({ color: 0xf234b2, wireframe: true, transparent: true, opacity: .15 }));
    world.add(points, ico, core);
    var mx = 0, my = 0, frameId;
    function resize() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    function animate(time) {
      if (document.hidden || reducedMotion.matches) { frameId = null; return; }
      points.rotation.y = time * .00004;
      points.rotation.x = time * .00002;
      ico.rotation.y = time * .0002;
      ico.rotation.x = time * .00012;
      core.rotation.y = -time * .0003;
      core.rotation.z = time * .0002;
      camera.position.x += (mx * 1.6 - camera.position.x) * .04;
      camera.position.y += (-my * 1.6 - camera.position.y) * .04;
      camera.lookAt(world.position);
      renderer.render(world, camera);
      frameId = window.requestAnimationFrame(animate);
    }
    function resume() {
      if (document.hidden || reducedMotion.matches) {
        if (frameId != null) window.cancelAnimationFrame(frameId);
        frameId = null;
      } else if (frameId == null) frameId = window.requestAnimationFrame(animate);
    }
    window.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      mx = event.clientX / window.innerWidth - .5;
      my = event.clientY / window.innerHeight - .5;
    }, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', resume);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', resume);
    resize();
    resume();
  })();
})();
