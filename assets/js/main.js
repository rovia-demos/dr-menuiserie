(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var motion = document.documentElement.classList.contains('motion');

  // Hauteur d'écran mesurée une fois ; recalculée seulement si la largeur change (rotation)
  var lastW = innerWidth, onWidth = [];
  addEventListener('resize', function () {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    document.documentElement.style.setProperty('--vh', innerHeight / 100 + 'px');
    onWidth.forEach(function (f) { f(); });
  });

  // Vidéo du haut de page : chargée après la photo, coupée si « réduire les animations » ou économie de données
  var video = $('.hero__video');
  var saveData = navigator.connection && navigator.connection.saveData;
  var pause = $('.hero__pause');
  pause.addEventListener('click', function () {
    var stop = !video.paused;
    if (stop) video.pause(); else video.play();
    pause.classList.toggle('is-paused', stop);
    pause.setAttribute('aria-label', stop ? 'Relancer la vidéo' : 'Mettre la vidéo en pause');
  });
  if (video && motion && !saveData) {
    var startVideo = function () {
      video.src = innerWidth < 768 ? video.dataset.srcMobile : video.dataset.srcDesktop;
      video.addEventListener('playing', function () { video.classList.add('is-playing'); pause.hidden = false; }, { once: true });
      var p = video.play(); if (p && p.catch) p.catch(function () {});
    };
    if (document.readyState === 'complete') setTimeout(startVideo, 200);
    else addEventListener('load', function () { setTimeout(startVideo, 200); });
  }

  // En-tête transparent tant qu'on est sur la photo du haut
  var header = $('.header'), hero = $('.hero');
  var topWatch = document.createElement('div');
  topWatch.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none';
  hero.appendChild(topWatch);
  new IntersectionObserver(function (en) { header.classList.toggle('is-top', en[0].isIntersecting); }).observe(topWatch);

  // Menu mobile
  var burger = $('.burger'), nav = $('#menu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Apparitions au défilement
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal').forEach(function (el) {
    var sib = el.parentElement ? $$(':scope > .reveal', el.parentElement).indexOf(el) : 0;
    el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
    io.observe(el);
  });

  // Barre de contact mobile : visible seulement après les boutons du haut
  var bar = $('.mobile-bar'), heroCta = $('#hero-cta');
  new IntersectionObserver(function (en) {
    bar.classList.toggle('is-on', !en[0].isIntersecting && en[0].boundingClientRect.top < 0);
  }).observe(heroCta);

  // Choix rapide du type de projet
  var select = $('#f-projet');
  $$('[data-projet]').forEach(function (a) {
    a.addEventListener('click', function () { select.value = a.dataset.projet; });
  });

  // Services : la photo de gauche suit le texte lu (ordinateur)
  var list = $('.services__list'), shots = $$('.services__frame img');
  var setService = function (i) {
    shots.forEach(function (im) { im.classList.toggle('is-on', im.dataset.s === i); });
    $$('.service', list).forEach(function (s) { s.classList.toggle('is-on', s.dataset.s === i); });
    $$('.services__nav a').forEach(function (a) { a.classList.toggle('is-on', a.dataset.s === i); });
  };
  list.classList.add('is-live');
  setService('0');
  var sio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) setService(en.target.dataset.s); });
  }, { rootMargin: '-50% 0px -50% 0px' }); // le texte qui passe au milieu de l'écran choisit la photo
  $$('.service', list).forEach(function (s) { sio.observe(s); });

  // Onglets (comparateur et avant/après) : flèches du clavier
  var tabKeys = function (tabs, pick) {
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        var n = tabs[(i + d + tabs.length) % tabs.length];
        n.focus(); pick(n);
      });
    });
  };
  var matTabs = $$('.seg [role="tab"]');
  tabKeys(matTabs, function (t) {
    matTabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
  });

  // Avant / après
  var stage = $('.ba__stage'), range = $('.ba__range');
  var after = $('.ba__after'), before = $('.ba__before img'), cap = $('.ba__cap');
  var setPos = function (v) { v = Math.max(0, Math.min(100, v)); range.value = v; stage.style.setProperty('--pos', v + '%'); };
  range.addEventListener('input', function () { setPos(+range.value); });
  // glisser au doigt ou à la souris n'importe où sur la photo
  var dragging = false;
  var fromEvent = function (e) { var r = stage.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100); };
  stage.addEventListener('pointerdown', function (e) { dragging = true; stage.setPointerCapture(e.pointerId); fromEvent(e); });
  stage.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
  stage.addEventListener('pointerup', function () { dragging = false; });
  stage.addEventListener('pointercancel', function () { dragging = false; });
  stage.addEventListener('click', function () { range.focus({ preventScroll: true }); });
  var pairs = {
    fenetre: { r: 'portrait', a: 'portefenetre-brique', b: 'ap-fenetre-avant', alt: ['Avant : vieilles portes-fenêtres en bois, peinture écaillée et simple vitrage', 'Après : porte-fenêtre neuve double vitrage, piliers en brique'], cap: 'Vieilles portes-fenêtres en bois remplacées par une menuiserie double vitrage, plus claire et bien plus isolante.' },
    cuisine: { r: 'landscape', a: 'cuisine-blanche', b: 'ap-cuisine-avant', alt: ['Avant : cuisine des années 90 en chêne foncé et carrelage', 'Après : cuisine blanche sur mesure avec îlot en bois clair'], cap: 'Une cuisine des années 90 transformée en cuisine sur mesure, avec un grand îlot en bois.' },
    terrasse: { r: 'landscape', a: 'terrasse-maison', b: 'ap-terrasse-avant', alt: ['Avant : pelouse sèche et dalles devant la maison', 'Après : terrasse en bois avec table et olivier'], cap: 'Un coin de pelouse fatigué devenu une terrasse en bois, de plain-pied avec la maison.' },
    porte: { r: 'portrait', a: 'porte-grise', b: 'ap-porte-avant', alt: ['Avant : vieille porte en bois vernie et abîmée', 'Après : porte d\'entrée gris anthracite avec auvent vitré'], cap: 'Une vieille porte en bois remplacée par une porte d\'entrée isolante, avec auvent vitré.' }
  };
  var src = function (n, w) { return 'assets/img/' + n + '-' + w + '.webp'; };
  var baTabs = $$('.ba__tabs [role="tab"]');
  tabKeys(baTabs, function (btn) {
    var p = pairs[btn.dataset.ba];
    baTabs.forEach(function (t) { var on = t === btn; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    stage.dataset.ratio = p.r;
    var sz = p.r === 'portrait' ? '(min-width: 960px) 560px, 100vw' : '(min-width: 1000px) 980px, 100vw';
    [[before, p.b, p.alt[0]], [after, p.a, p.alt[1]]].forEach(function (x) {
      x[0].sizes = sz;
      x[0].srcset = src(x[1], 800) + ' 800w, ' + src(x[1], 1600) + ' 1600w';
      x[0].src = src(x[1], 1600);
      x[0].alt = x[2];
    });
    cap.textContent = p.cap;
    setPos(50);
    stage.classList.remove('is-swap'); void stage.offsetWidth; stage.classList.add('is-swap');
  });
  // petit glissement d'invitation la première fois
  if (motion) {
    var hint = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      hint.disconnect();
      var t0 = null;
      var anim = function (t) {
        if (!t0) t0 = t;
        var p = (t - t0) / 1700;
        if (p >= 1 || dragging) return;
        stage.style.setProperty('--pos', (50 + Math.sin(p * Math.PI * 2) * 16) + '%');
        requestAnimationFrame(anim);
      };
      setTimeout(function () { requestAnimationFrame(anim); }, 500);
    }, { threshold: 0.6 });
    hint.observe(stage);
  }

  // Réalisations : filtres, peu de photos au départ, grille carrée sans trou
  var grid = $('#galerie'), items = $$('li', grid), more = $('#voir-plus'), expanded = false, filter = 'tout';
  var firstCount = function () { return innerWidth < 640 ? 6 : 8; };
  var cols = function () { return parseInt(getComputedStyle(grid).getPropertyValue('--cols'), 10) || 2; };
  var fillLastRow = function () {
    var vis = items.filter(function (li) { return !li.hidden; });
    items.forEach(function (li) { li.classList.remove('is-wide'); li.style.gridColumn = ''; li.style.height = ''; });
    var c = cols(), rest = vis.length % c;
    if (!rest || !vis.length) return;
    // la dernière photo s'élargit pour combler la ligne incomplète
    var last = vis[vis.length - 1];
    last.classList.add('is-wide');
    last.style.gridColumn = 'span ' + (c - rest + 1);
    if (rest === 1) last.style.height = vis[0].offsetWidth + 'px';
  };
  var applyFilter = function (pop) {
    var n = 0;
    items.forEach(function (li) {
      var match = filter === 'tout' || li.dataset.c === filter;
      var show = match && (expanded || filter !== 'tout' || n < firstCount());
      if (match) n++;
      if (show && li.hidden && pop && motion) { li.classList.remove('is-pop'); void li.offsetWidth; li.classList.add('is-pop'); }
      li.hidden = !show;
    });
    more.parentElement.hidden = filter !== 'tout' || expanded;
    fillLastRow();
  };
  applyFilter(false);
  onWidth.push(function () { applyFilter(false); });
  more.addEventListener('click', function () {
    expanded = true; applyFilter(true);
    var next = items[firstCount()]; if (next) $('button', next).focus({ preventScroll: true });
  });
  $$('.filters button').forEach(function (b, _, all) {
    b.addEventListener('click', function () {
      all.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      filter = b.dataset.f;
      items.forEach(function (li) { li.hidden = true; });
      applyFilter(true);
    });
  });

  // Visionneuse
  var lb = $('#lightbox'), lbImg = $('img', lb), cur = 0;
  var visible = function () { return items.filter(function (li) { return !li.hidden; }); };
  var show = function (i) {
    var v = visible(); cur = (i + v.length) % v.length;
    var b = $('button', v[cur]), im = $('img', b);
    lbImg.src = b.dataset.big; lbImg.alt = im.alt;
  };
  items.forEach(function (li) {
    $('button', li).addEventListener('click', function () { show(visible().indexOf(li)); lb.showModal(); });
  });
  $('.lightbox__close', lb).addEventListener('click', function () { lb.close(); });
  $('.lightbox__prev', lb).addEventListener('click', function () { show(cur - 1); });
  $('.lightbox__next', lb).addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });

  // Ouvert maintenant ? (EXEMPLE – à remplacer : horaires lundi-vendredi 8h-18h)
  try {
    var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var day = get('weekday').replace('.', ''), h = +get('hour') + get('minute') / 60;
    var open = ['lun', 'mar', 'mer', 'jeu', 'ven'].indexOf(day) > -1 && h >= 8 && h < 18;
    var now = $('#ouvert');
    now.textContent = open ? 'Joignable en ce moment, jusqu\'à 18h' : 'En dehors des horaires : laissez-nous un message';
    now.classList.toggle('is-closed', !open);
    now.hidden = false;
  } catch (e) { /* les horaires du pied de page suffisent */ }

  // Photo jointe : afficher le nom du fichier
  var file = $('#f-photo'), fileTxt = $('.file__txt');
  file.addEventListener('change', function () {
    fileTxt.textContent = file.files.length ? file.files[0].name : 'Ajouter une photo';
  });

  // Formulaire de démonstration : confirmation sans aucun envoi
  var form = $('#form-devis'), err = $('#form-err'), ok = $('#form-ok');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fields = $$('[required]', form);
    fields.forEach(function (f) { f.classList.remove('is-bad'); f.removeAttribute('aria-invalid'); });
    var bad = fields.filter(function (f) { return !f.checkValidity() || !f.value.trim(); });
    if (bad.length) {
      bad.forEach(function (f) { f.classList.add('is-bad'); f.setAttribute('aria-invalid', 'true'); });
      err.hidden = false;
      bad[0].focus();
      return;
    }
    err.hidden = true;
    form.hidden = true;
    ok.hidden = false;
    ok.focus();
  });
  $$('input, select, textarea', form).forEach(function (f) {
    f.addEventListener('input', function () { if (f.checkValidity() && f.value.trim()) { f.classList.remove('is-bad'); f.removeAttribute('aria-invalid'); } });
  });

  var y = $('#annee'); if (y) y.textContent = new Date().getFullYear();
  window.DR_READY = true;
})();
