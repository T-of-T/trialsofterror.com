// trialsofterror.com: one composition on every screen (the user, on the moto: keep the layout made on the PC). The page is
// laid out at the approved 1086 px and scaled to the screen's WIDTH (--z, body zoom) on phones and small windows (the user
// rejected shrinking to fit the height there). Wider than 1086 px it scales up until the whole hero fits the first screen,
// feet included (WEBSITE-BIG-SCREEN-B-AND-POLISH-20261025: B), never below 1x; any width left over is the hero's side
// scenery (.wide), never bars. Text and tap targets keep readable minimums through
// calc(… / var(--z)) in site.css; .fit marks a phone held upright. Runs before the page paints, so it never jumps.
(function () {
  var root = document.documentElement;
  var lastW = 0, lastH = 0;
  function fit() {
    var w = root.clientWidth, h = window.innerHeight;
    var z = w / 1086;
    if (w > 1086) z = Math.max(1, Math.min(z, h / 724));
    root.style.setProperty('--z', String(z));
    root.classList.toggle('fit', w <= 700 && h > w);
    root.classList.toggle('wide', w / z > 1087);
    // how far the hero's painted sides reach past the column on each side, to the screen's edges (layout px)
    root.style.setProperty('--side', Math.max(0, (w / z - 1086) / 2) + 'px');
    lastW = w;
    lastH = h;
  }
  fit();
  // on phones only a width change rescales (the address bar showing or hiding never resizes the page under the reader's
  // finger); a big screen's window also rescales when its height changes, so the hero keeps fitting
  window.addEventListener('resize', function () {
    if (root.clientWidth !== lastW || (root.clientWidth > 1086 && window.innerHeight !== lastH)) fit();
  });
})();
