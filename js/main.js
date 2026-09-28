(function(){
  'use strict';
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ano no rodapé */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* topo com sombra ao rolar */
  var topo = document.getElementById('topo');
  function onScrollTopo(){ topo.classList.toggle('rolou', window.scrollY > 10); }

  /* menu mobile */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function fechaMenu(){ menu.classList.remove('aberto'); burger.setAttribute('aria-expanded','false'); burger.setAttribute('aria-label','Abrir menu'); document.body.style.overflow=''; }
  burger.addEventListener('click', function(){
    var abre = !menu.classList.contains('aberto');
    menu.classList.toggle('aberto', abre);
    burger.setAttribute('aria-expanded', abre);
    burger.setAttribute('aria-label', abre ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = abre ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', fechaMenu); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('aberto')) { fechaMenu(); burger.focus(); } });
  window.addEventListener('resize', function(){ if (window.innerWidth > 820) fechaMenu(); });

  /* link ativo no menu */
  var secoes = ['proposta','segmentos','diario','historia','estrutura'].map(function(id){ return document.getElementById(id); });
  var links = {};
  menu.querySelectorAll('a[href^="#"]').forEach(function(a){ links[a.getAttribute('href').slice(1)] = a; });

  /* reveal */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(ents){
      ents.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, {threshold: .2});
    document.querySelectorAll('.reveal, #valores').forEach(function(el){ io.observe(el); });

    var ioSec = new IntersectionObserver(function(ents){
      ents.forEach(function(e){
        var l = links[e.target.id];
        if (!l) return;
        if (e.isIntersecting) { Object.keys(links).forEach(function(k){ links[k].classList.remove('ativo'); }); l.classList.add('ativo'); }
      });
    }, {rootMargin: '-45% 0px -50% 0px'});
    secoes.forEach(function(s){ if (s) ioSec.observe(s); });
  } else {
    document.querySelectorAll('.reveal, #valores').forEach(function(el){ el.classList.add('on'); });
  }

  /* girassol cresce com a rolagem */
  var gir = document.querySelector('.girassol__svg');
  var passos = document.querySelector('.passos');
  function limita(v){ return Math.max(0, Math.min(1, v)); }
  var maxGir = 0;
  function cresce(){
    if (!gir) return;
    var r = passos.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = reduz ? 1 : limita((vh - r.top) / (vh * 0.55 + r.height * 0.6));
    p = Math.max(p, maxGir); maxGir = p;
    gir.style.setProperty('--caule', (300 - 300 * limita(p / 0.55)).toFixed(1));
    gir.style.setProperty('--folha', limita((p - 0.35) / 0.25).toFixed(3));
    gir.style.setProperty('--flor', limita((p - 0.6) / 0.35).toFixed(3));
  }

  /* número 35 enchendo */
  var num = document.querySelector('.num');
  var contou = false, maxNum = 0;
  function enche(){
    if (!num) return;
    var r = num.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = reduz ? 1 : limita((vh - r.top) / (vh * 0.8));
    p = Math.max(p, maxNum); maxNum = p;
    num.style.setProperty('--enche', (p * 100).toFixed(1) + '%');
    if (!contou && r.top < vh * 0.85) {
      contou = true;
      var alvo = +num.dataset.conta, ini = null;
      if (reduz) { num.textContent = alvo; return; }
      (function passo(t){
        if (!ini) ini = t;
        var k = Math.min(1, (t - ini) / 1400);
        num.textContent = Math.round(alvo * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(passo);
      })(performance.now());
    }
  }

  var tic = false;
  function rolou(){
    if (tic) return; tic = true;
    requestAnimationFrame(function(){ onScrollTopo(); cresce(); enche(); tic = false; });
  }
  window.addEventListener('scroll', rolou, {passive:true});
  window.addEventListener('resize', rolou);
  rolou();

  /* abas dos segmentos */
  var abas = Array.prototype.slice.call(document.querySelectorAll('.aba'));
  function ativa(aba, foca){
    abas.forEach(function(a){
      var sel = a === aba;
      a.setAttribute('aria-selected', sel);
      a.tabIndex = sel ? 0 : -1;
      document.getElementById(a.getAttribute('aria-controls')).hidden = !sel;
    });
    if (foca) aba.focus();
  }
  abas.forEach(function(a, i){
    a.addEventListener('click', function(){ ativa(a); });
    a.addEventListener('keydown', function(e){
      var n = null;
      if (e.key === 'ArrowRight') n = abas[(i + 1) % abas.length];
      if (e.key === 'ArrowLeft') n = abas[(i - 1 + abas.length) % abas.length];
      if (e.key === 'Home') n = abas[0];
      if (e.key === 'End') n = abas[abas.length - 1];
      if (n) { e.preventDefault(); ativa(n, true); }
    });
  });

  /* trilho do diário */
  var trilho = document.getElementById('trilho');
  document.querySelectorAll('.seta').forEach(function(b){
    b.addEventListener('click', function(){
      var c = trilho.querySelector('.cartao');
      var passo = c ? c.getBoundingClientRect().width + 22 : 330;
      trilho.scrollBy({left: passo * (+b.dataset.dir), behavior: reduz ? 'auto' : 'smooth'});
    });
  });
  /* arrastar com o mouse */
  var arr = false, x0 = 0, s0 = 0, moveu = false;
  trilho.addEventListener('mousedown', function(e){ arr = true; moveu = false; x0 = e.pageX; s0 = trilho.scrollLeft; trilho.style.scrollSnapType = 'none'; trilho.style.cursor = 'grabbing'; });
  window.addEventListener('mousemove', function(e){ if (!arr) return; var dx = e.pageX - x0; if (Math.abs(dx) > 4) moveu = true; trilho.scrollLeft = s0 - dx; });
  window.addEventListener('mouseup', function(){ if (!arr) return; arr = false; trilho.style.scrollSnapType = ''; trilho.style.cursor = ''; });
  trilho.addEventListener('click', function(e){ if (moveu) { e.preventDefault(); e.stopPropagation(); } }, true);
  trilho.querySelectorAll('img').forEach(function(i){ i.draggable = false; });

  /* ficha -> whatsapp */
  var ficha = document.getElementById('ficha');
  var erro = document.getElementById('erro');
  ficha.addEventListener('submit', function(e){
    e.preventDefault();
    var nome = ficha.nome.value.trim();
    var seg = ficha.segmento.value;
    ficha.nome.classList.toggle('invalido', !nome);
    ficha.segmento.classList.toggle('invalido', !seg);
    if (!nome || !seg) { erro.textContent = 'Preencha seu nome e o segmento de interesse.'; (nome ? ficha.segmento : ficha.nome).focus(); return; }
    erro.textContent = '';
    var aluno = ficha.aluno.value.trim();
    var quero = (ficha.querySelector('input[name="quero"]:checked') || {}).value || 'agendar uma visita';
    var msg = 'Olá! Me chamo ' + nome + ' e gostaria de ' + quero + ' no Colégio ADM.\n' +
      'Segmento: ' + seg + (aluno ? '\nAluno(a): ' + aluno : '') + '\n(Mensagem enviada pelo site)';
    var av = document.querySelector('.aviao');
    if (av && !reduz) { av.classList.remove('voa'); void av.offsetWidth; av.classList.add('voa'); }
    window.open('https://wa.me/5585996034409?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
  ['nome','segmento'].forEach(function(n){
    ficha[n].addEventListener('input', function(){ ficha[n].classList.remove('invalido'); });
    ficha[n].addEventListener('change', function(){ ficha[n].classList.remove('invalido'); });
  });
})();
