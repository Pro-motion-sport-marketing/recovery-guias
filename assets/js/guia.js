/* Recovery · Guías — interactividad (mejora progresiva: sin JS la guía se lee completa) */
(function () {
  var hoy = new Date().toISOString().slice(0, 10);
  var CLAVE = 'recovery-guia-' + location.pathname + '-' + hoy;
  var guardado = {};
  try { guardado = JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) {}
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(guardado)); } catch (e) {} }

  /* ---------- Series ---------- */
  var paneles = [].slice.call(document.querySelectorAll('.panel[data-series]'));
  var totalSeries = 0;
  paneles.forEach(function (p) { totalSeries += +p.dataset.series; });
  var barraDia = document.querySelector('[data-barra-dia]');
  var textoDia = document.querySelector('[data-total-dia]');
  var cajaDia = document.querySelector('.progreso-dia');

  function contar() {
    var hechas = 0;
    paneles.forEach(function (p) {
      var n = (guardado[p.dataset.ejercicio] || []).filter(Boolean).length;
      hechas += n;
      var c = p.querySelector('[data-cuenta]');
      if (c) c.textContent = n + ' de ' + p.dataset.series + ' series';
    });
    if (barraDia) barraDia.style.width = (totalSeries ? hechas / totalSeries * 100 : 0) + '%';
    if (textoDia) textoDia.textContent = hechas === totalSeries ? '¡Rutina completa! 💪' : hechas + ' / ' + totalSeries + ' series';
  }

  paneles.forEach(function (p) {
    var id = p.dataset.ejercicio, n = +p.dataset.series;
    var estado = guardado[id] || (guardado[id] = []);
    var caja = p.querySelector('.series');
    for (var i = 0; i < n; i++) {
      (function (i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'serie'; b.textContent = i + 1;
        b.setAttribute('aria-label', 'Serie ' + (i + 1));
        b.setAttribute('aria-pressed', estado[i] ? 'true' : 'false');
        b.addEventListener('click', function () {
          estado[i] = !estado[i];
          b.setAttribute('aria-pressed', estado[i] ? 'true' : 'false');
          guardar(); contar();
          if (estado[i] && navigator.vibrate) navigator.vibrate(25);
        });
        caja.appendChild(b);
      })(i);
    }
    p.marcarSiguiente = function () {
      var j = estado.findIndex(function (x, k) { return !x; });
      if (j === -1) j = estado.length < n ? estado.length : -1;
      if (j > -1 && j < n) caja.children[j].click();
    };
  });
  contar();

  /* La barra de progreso aparece cuando estás en los ejercicios */
  var zonaEj = document.getElementById('ejercicios');
  if (cajaDia && zonaEj && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      cajaDia.classList.toggle('visible', e[0].isIntersecting);
    }, { rootMargin: '-30% 0px -30% 0px' }).observe(zonaEj);
  }

  /* ---------- Temporizador isométrico: 45 s + 2 min de descanso ---------- */
  var panelIso = document.querySelector('.panel[data-ejercicio="iso"]');
  if (panelIso) {
    var btn = panelIso.querySelector('[data-iniciar]');
    var tTxt = panelIso.querySelector('[data-tiempo]');
    var fTxt = panelIso.querySelector('[data-fase]');
    var est = panelIso.querySelector('[data-estado]');
    var arco = panelIso.querySelector('.avance');
    var LARGO = 264, reloj = null;
    function pintar(rest, tot) { tTxt.textContent = rest; arco.style.strokeDashoffset = LARGO * (1 - rest / tot); }
    function parar() { clearInterval(reloj); reloj = null; }
    function fase(nombre, seg, alTerminar) {
      var rest = seg; fTxt.textContent = nombre; pintar(rest, seg);
      reloj = setInterval(function () {
        rest--; pintar(Math.max(rest, 0), seg);
        if (rest <= 3 && rest > 0 && navigator.vibrate) navigator.vibrate(40);
        if (rest <= 0) { parar(); alTerminar(); }
      }, 1000);
    }
    btn.addEventListener('click', function () {
      if (reloj) { parar(); fTxt.textContent = 'pausa'; btn.textContent = 'Iniciar serie'; est.textContent = 'Detenido. Cuando quieras, vuelve a empezar.'; pintar(45, 45); return; }
      btn.textContent = 'Detener';
      est.textContent = 'Empuja y mantén. La rodilla no se mueve.';
      fase('aguanta', 45, function () {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        panelIso.marcarSiguiente();
        est.textContent = '¡Serie lista! Descansa 2 minutos.';
        fase('descanso', 120, function () {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          btn.textContent = 'Iniciar siguiente serie';
          est.textContent = 'Descanso terminado. Vamos con la siguiente.';
          fTxt.textContent = 'listo'; pintar(45, 45);
        });
      });
    });
  }

  /* ---------- Semáforo del dolor ---------- */
  var rango = document.querySelector('[data-dolor]');
  if (rango) {
    var val = document.querySelector('[data-valor]');
    var msg = document.querySelector('[data-mensaje]');
    var zonas = [].slice.call(document.querySelectorAll('[data-zona]'));
    var textos = [
      'Molestia ligera. Es normal: puedes seguir con la dosis.',
      'Molestia moderada. Baja el peso o el rango y observa cómo responde mañana.',
      'Detente por hoy. Si no cede en 24 a 48 horas, escríbenos para una valoración.'
    ];
    function leer() {
      var v = +rango.value, z = v <= 3 ? 0 : v <= 5 ? 1 : 2;
      val.textContent = v; msg.textContent = textos[z];
      zonas.forEach(function (el, i) { el.classList.toggle('activa', i === z); });
    }
    rango.addEventListener('input', leer); leer();
  }

  /* ---------- Compartir ---------- */
  var comp = document.querySelector('[data-compartir]');
  if (comp) comp.addEventListener('click', function () {
    var datos = { title: document.title, text: '3 ejercicios que pueden ayudar a tu rodilla · Recovery', url: location.href.split('#')[0] };
    if (navigator.share) { navigator.share(datos).catch(function () {}); return; }
    try { navigator.clipboard.writeText(datos.url); comp.textContent = 'Enlace copiado ✓'; } catch (e) { prompt('Copia el enlace:', datos.url); }
  });

  /* ---------- Menú: sección activa ---------- */
  var enlaces = [].slice.call(document.querySelectorAll('.barra nav a[href^="#"]'));
  if ('IntersectionObserver' in window && enlaces.length) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        enlaces.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('activo', on);
          if (on && a.scrollIntoView) a.parentNode.scrollTo({ left: a.offsetLeft - 40, behavior: 'smooth' });
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    enlaces.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
  }

  /* Videos: solo se reproducen cuando están en pantalla (ahorra datos y batería) */
  var vids = [].slice.call(document.querySelectorAll('.marco video'));
  if ('IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p) p.catch(function () {}); } else e.target.pause(); });
    }, { threshold: .25 });
    vids.forEach(function (v) { vo.observe(v); });
  }
})();
