/* CoursPrint v1.0 - Impression native du navigateur, sans PDF autonome. */
(function (global) {
  'use strict';
  function init(options) {
    options = options || {};
    var nav = document.querySelector(options.toolbar || 'header nav');
    if (!nav || nav.querySelector('.coursprint-button')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'coursprint-button';
    button.textContent = 'PDF';
    button.title = 'Imprimer ou enregistrer le cours au format PDF';
    button.setAttribute('aria-label', button.title);
    button.addEventListener('click', function () { printCourse(options); });
    nav.insertBefore(button, nav.firstChild);
  }
  function isExercise(details) {
    var summary = details.querySelector(':scope > summary');
    var title = summary ? summary.textContent.trim() : '';
    return details.matches('.nested-exercise, .nested, .quiz-standard, .diagnostic-cas, .dns-quiz-6, [data-coursprint-exclude]')
      || /^(je me teste|exercice|quiz|qcm)\b/i.test(title)
      || /diagnostic professionnel/i.test(title);
  }
  function printCourse(options) {
    var source = document.querySelector(options.content || 'main');
    if (!source) { console.error('CoursPrint : zone de cours introuvable.'); return; }
    var frame = document.createElement('iframe');
    frame.className = 'coursprint-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:700px;border:0;opacity:0;pointer-events:none';
    var doc = document.implementation.createHTMLDocument(document.title);
    doc.documentElement.lang = document.documentElement.lang || 'fr';
    var base = doc.createElement('base');
    base.href = document.baseURI;
    doc.head.appendChild(base);
    document.querySelectorAll('head style, head link[rel="stylesheet"]').forEach(function (el) {
      doc.head.appendChild(el.cloneNode(true));
    });
    var style = doc.createElement('style');
    style.textContent = [
      ':root{color-scheme:light!important;--ink:#172b44!important;--bg:#fff!important;--line:#d1d5db!important}',
      'html,body{background:#fff!important;color:#172b44!important;margin:0!important;max-width:none!important}',
      'header{background:#fff!important;color:#172b44!important;padding:0 0 12px!important}',
      'header h1{font-size:23px!important;text-align:left!important;margin:0!important}',
      'header nav,footer,.toolbar,.actions,.projection-float,.version-fixe,.coursprint-button{display:none!important}',
      'main{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}',
      'details{display:block!important;overflow:visible!important;background:#fff!important;color:#172b44!important;break-inside:auto!important;margin:0 0 12px!important;border:0!important}',
      'details > summary{display:list-item!important;color:#172b44!important;background:#fff!important;font-size:19px!important;padding:9px 0!important;break-after:avoid!important;cursor:default!important}',
      'details > .inside{display:block!important;border:0!important;padding:0 0 8px!important}',
      '.panel,.example,.dns-structure,.dns-parcours,.technical{break-inside:avoid-page}',
      'button,input,select,textarea,[role="button"],.qcmcore-host,.diagcore-host,.diagcore,.dns-parcours-controls,[data-coursprint-exclude]{display:none!important}',
      'img,svg,table,pre,figure{max-width:100%!important;break-inside:avoid-page}',
      'pre{white-space:pre-wrap!important;overflow-wrap:anywhere!important}',
      '.bandeau-cours{display:none!important}',
      '*{box-shadow:none!important;animation:none!important;transition:none!important}',
      '@page{size:A4;margin:14mm}',
      '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}a{color:#172b44!important}}'
    ].join('\n');
    doc.head.appendChild(style);
    var head = doc.createElement('header');
    var title = doc.createElement('h1');
    title.textContent = options.title || (document.querySelector('header h1') || {}).textContent || document.title;
    head.appendChild(title);
    doc.body.appendChild(head);
    var content = source.cloneNode(true);
    content.querySelectorAll('script,nav,footer,.projection-float,.version-fixe,[data-coursprint-exclude]').forEach(function (el) { el.remove(); });
    Array.from(content.querySelectorAll('details')).reverse().forEach(function (item) {
      if (isExercise(item)) item.remove();
      else item.open = true;
    });
    content.querySelectorAll('button,input,select,textarea,.qcmcore-host,.diagcore-host').forEach(function (el) { el.remove(); });
    content.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; });
    doc.body.appendChild(content);
    var cleaned = false;
    function cleanup() { if (!cleaned) { cleaned = true; frame.remove(); } }
    frame.addEventListener('load', function () {
      var win = frame.contentWindow;
      if (!win) { cleanup(); return; }
      win.addEventListener('afterprint', function () { setTimeout(cleanup, 500); }, { once: true });
      var images = Array.from(win.document.images);
      Promise.all(images.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.addEventListener('load', resolve, { once:true });
          img.addEventListener('error', resolve, { once:true });
        });
      })).then(function () {
        setTimeout(function () {
          try { win.focus(); win.print(); }
          catch (error) { console.error('CoursPrint : impression impossible.', error); cleanup(); }
        }, 250);
      });
      setTimeout(cleanup, 120000);
    }, { once: true });
    document.body.appendChild(frame);
    frame.contentDocument.open();
    frame.contentDocument.write('<!doctype html>\n' + doc.documentElement.outerHTML);
    frame.contentDocument.close();
  }
  global.CoursPrint = Object.freeze({ init: init, print: printCourse, version: '1.0.0' });
})(window);
