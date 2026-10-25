// trialsofterror.com: one composition on every screen (the user, on the moto: keep the layout made on the PC). The page is
// laid out at the approved 1086 px and scaled to the screen's WIDTH (--z, body zoom): it always fills the width, never
// with side bars (the user rejected shrinking to fit the height). Text and tap targets keep readable minimums through
// calc(… / var(--z)) in site.css; .fit marks a phone held upright. Runs before the page paints, so it never jumps.
(function () {
  var root = document.documentElement;
  var lastW = 0;
  function fit() {
    var w = root.clientWidth;
    root.style.setProperty('--z', String(Math.min(1, w / 1086)));
    root.classList.toggle('fit', w <= 700 && window.innerHeight > w);
    lastW = w;
  }
  fit();
  // only a width change rescales: the address bar showing or hiding never resizes the page under the reader's finger
  window.addEventListener('resize', function () { if (root.clientWidth !== lastW) fit(); });
})();
