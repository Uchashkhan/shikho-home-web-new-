"""Bundle the whole prototype into ONE offline file: shikho-standalone.html

    python3 build.py && python3 build_standalone.py      (needs internet once: fonts + Tailwind)

How it works: the file is a small app shell. Every page (index.html, watch.html, …), script,
stylesheet, image and font is embedded once. A page is shown in a full-window iframe built from
those parts (scripts/styles/images become blob: URLs), so each screen still gets a fresh document
like the multi-page site. Page scripts are rewritten to talk to the shell instead of the real
`location` / `history` (a page living in an iframe has no file URL of its own); the shell keeps
the browser history and plays the same slide/crossfade transitions inside the 412px column.
"""
import base64, json, os, re, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'shikho-standalone.html')
CACHE = os.path.join(ROOT, '.cache')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;500;600&display=swap'
KEEP_FONTS = {('Inter Tight', 'latin'), ('Inter Tight', 'latin-ext'), ('Noto Sans Bengali', 'bengali')}
TAILWIND = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11'
PAGES = ['signup.html', 'index.html', 'courses.html', 'course.html', 'ai-chat.html', 'profile.html',
         'important-classes.html', 'guidelines.html', 'watch.html', 'exam.html']
FILES = ['styles.css', 'main.js', 'sheet.js', 'watch.js', 'exam.js', 'ai-chat.js', 'signup.js',
         'data/user.js', 'data/videos.js']
MIME = {'webp': 'image/webp', 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'svg': 'image/svg+xml'}
ASSET_RE = re.compile(r'assets/[A-Za-z0-9_./-]+\.(?:webp|png|jpg|jpeg|svg)')


def fetch(url, name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA})).read()
        open(path, 'wb').write(data)
    return open(path, 'rb').read()


def font_css():
    css = fetch(FONTS_CSS, 'fonts.css').decode()
    faces = []
    for subset, block in re.findall(r'/\* ([\w-]+) \*/\s*(@font-face \{.*?\})', css, re.S):
        family = re.search(r"font-family: '([^']+)'", block).group(1)
        if (family, subset) not in KEEP_FONTS:
            continue
        url = re.search(r'url\((https://[^)]+\.woff2)\)', block).group(1)
        woff = fetch(url, re.sub(r'\W', '_', url[-60:]))
        faces.append(block.replace(url, 'data:font/woff2;base64,' + base64.b64encode(woff).decode()))
    return '\n'.join(faces)


# Page scripts -> shell: the iframe page has no real URL, so these go through __loc / __go / __hist
REWRITES = [
    (r"performance\.getEntriesByType\('navigation'\)\[0\]", '__loc.nav'),
    (r'location\.href = ([^;]+);', r'__go(\1);'),
    (r'location\.replace\(', '__go.replace('),
    (r'location\.reload\(\)', '__go.reload()'),
    (r'location\.(search|pathname|origin|href)\b', r'__loc.\1'),
    (r'document\.referrer', '__loc.referrer'),
    (r'history\.(length|state)\b', r'__hist.\1'),
    (r'history\.(back|pushState|replaceState)\(', r'__hist.\1('),
]


def rewrite(js):
    for a, b in REWRITES:
        js = re.sub(a, b, js)
    return js


# Runs first in every page: the page's view of its URL, and navigation that asks the shell
SHIM = r'''<script>
(function () {
  var shell = parent.__shikho;
  var st = shell.state();
  window.__loc = {
    origin: 'https://shikho.app', pathname: '/' + st.page, search: st.search,
    get href() { return this.origin + this.pathname + this.search; },
    referrer: st.referrer, nav: { type: 'navigate' }
  };
  window.__go = function (url) { shell.go(String(url)); };
  window.__go.replace = function (url) { shell.go(String(url), { replace: true }); };
  window.__go.reload = function () { shell.reload(); };
  window.__hist = {
    get length() { return shell.depth(); }, get state() { return st.state; },
    back: function () { shell.back(); },
    pushState: function (s, t, url) { st.state = s; shell.inPage(String(url), s, false); __loc.search = shell.state().search; },
    replaceState: function (s, t, url) { st.state = s; shell.inPage(String(url), s, true); __loc.search = shell.state().search; }
  };
  // Links to other pages open in the shell (after the page's own handlers had their say)
  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (/^[\w-]+\.html(\?[^#]*)?(#.*)?$/.test(href)) { e.preventDefault(); shell.go(href); }
  });
})();
</script>'''


SHELL = r'''<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Shikho · bKash prototype</title>
<meta name="theme-color" content="#FFFFFF">
<style>
  html, body { margin: 0; height: 100%; background: #fff; overflow: hidden; }
  #stage { position: fixed; inset: 0; }
  #stage iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #fff; }
  /* slides stay inside the phone-width column */
  #stage.moving { clip-path: inset(0 calc((100% - min(100%, 412px)) / 2)); }
</style>
</head>
<body>
<div id="stage"></div>
<script id="bundle" type="application/json">__BUNDLE__</script>
<script>
(function () {
  var B = JSON.parse(document.getElementById('bundle').textContent);
  var b64 = function (s, type) {
    var bin = atob(s), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([u], { type: type }));
  };
  var ASSET = {};
  Object.keys(B.assets).forEach(function (p) { ASSET[p] = b64(B.assets[p][1], B.assets[p][0]); });
  var withAssets = function (t) { return t.replace(/assets\/[A-Za-z0-9_.\/-]+\.(?:webp|png|jpg|jpeg|svg)/g, function (p) { return ASSET[p] || p; }); };
  var FILE = {};
  Object.keys(B.files).forEach(function (n) {
    var type = /\.css$/.test(n) ? 'text/css' : 'text/javascript';
    FILE[n] = URL.createObjectURL(new Blob([withAssets(B.files[n])], { type: type }));
  });
  var compose = function (page) {
    var html = withAssets(B.pages[page]);
    html = html.replace(/(src|href)="([^"]+)"/g, function (m, attr, v) { return FILE[v] ? attr + '="' + FILE[v] + '"' : m; });
    return html.replace('<head>', '<head>' + B.shim);
  };

  var TABS = ['index.html', 'courses.html', 'ai-chat.html', 'profile.html'];
  var stage = document.getElementById('stage');
  var cur = null;             // { page, search, state, referrer }
  var frame = null;
  var parse = function (url) {
    var m = String(url).replace(/^https:\/\/shikho\.app\//, '').match(/^([\w-]+\.html)?(\?[^#]*)?/);
    return { page: (m && m[1]) || (cur && cur.page) || 'index.html', search: (m && m[2]) || '' };
  };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(entry, type) {
    var old = frame;
    var f = document.createElement('iframe');
    f.title = 'Shikho';
    cur = entry;
    frame = f;
    f.srcdoc = compose(entry.page);
    stage.appendChild(f);
    var W = Math.min(innerWidth, 412);
    f.addEventListener('load', function () {
      try { f.contentWindow.focus(); } catch (e) {}
      document.title = f.contentDocument.title || document.title;
      if (!old) return;
      if (reduce || !type) { old.remove(); return; }
      stage.classList.add(type === 'tab' ? 'fading' : 'moving');
      var ease = 'cubic-bezier(.2,.8,.2,1)', a, b;
      if (type === 'tab') {
        a = old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
        b = f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 60, fill: 'backwards' });
      } else if (type === 'forward') {
        a = old.animate([{ transform: 'none' }, { transform: 'translateX(-' + W + 'px)' }], { duration: 320, easing: ease, fill: 'forwards' });
        b = f.animate([{ transform: 'translateX(' + W + 'px)' }, { transform: 'none' }], { duration: 320, easing: ease });
      } else {
        stage.appendChild(old); // old page slides out on top
        a = old.animate([{ transform: 'none' }, { transform: 'translateX(' + W + 'px)' }], { duration: 320, easing: ease, fill: 'forwards' });
        b = f.animate([{ transform: 'translateX(-' + W + 'px)' }, { transform: 'none' }], { duration: 320, easing: ease });
      }
      Promise.all([a.finished, b.finished]).then(function () { old.remove(); stage.classList.remove('moving', 'fading'); });
    }, { once: true });
  }

  var typeFor = function (from, to, back) {
    if (TABS.indexOf(from) > -1 && TABS.indexOf(to) > -1) return 'tab';
    return back || TABS.indexOf(to) > -1 ? 'back' : 'forward';
  };
  var hashOf = function (e) { return '#' + e.page + e.search; };

  window.__shikho = {
    state: function () { return cur; },
    depth: function () { return history.length; },
    go: function (url, opts) {
      opts = opts || {};
      var t = parse(url);
      var entry = { page: t.page, search: t.search, state: null, referrer: cur ? 'https://shikho.app/' + cur.page : '' };
      var type = typeFor(cur && cur.page, entry.page, false);
      if (opts.replace) history.replaceState(entry, '', hashOf(entry)); else history.pushState(entry, '', hashOf(entry));
      show(entry, type);
    },
    reload: function () { this.go('signup.html', { replace: true }); }, // a refresh starts at registration
    back: function () { history.back(); },
    inPage: function (url, s, replace) {
      var t = parse(url);
      cur = { page: cur.page, search: t.search, state: s, referrer: cur.referrer, inPage: true };
      if (replace) history.replaceState(cur, '', hashOf(cur)); else history.pushState(cur, '', hashOf(cur));
    }
  };

  addEventListener('popstate', function (e) {
    var entry = e.state || { page: 'signup.html', search: '', state: null, referrer: '' };
    if (cur && entry.page === cur.page && (entry.inPage || cur.inPage)) {
      // same screen, different in-page state (e.g. the next video): let the page re-render
      cur = entry;
      try {
        var w = frame.contentWindow;
        w.__loc.search = entry.search;
        w.dispatchEvent(new w.PopStateEvent('popstate', { state: entry.state }));
      } catch (err) {}
      return;
    }
    var from = cur && cur.page;
    show(Object.assign({}, entry, { referrer: from ? 'https://shikho.app/' + from : '' }), typeFor(from, entry.page, true));
  });

  // Opening the file (or refreshing it) starts at registration, like the site
  var first = { page: 'signup.html', search: '', state: null, referrer: '' };
  history.replaceState(first, '', hashOf(first));
  show(first, null);
})();
</script>
</body>
</html>
'''


def main():
    tailwind = fetch(TAILWIND, 'tailwind-browser-4.1.11.js').decode()
    files = {n: open(os.path.join(ROOT, n), encoding='utf-8').read() for n in FILES}
    files = {n: (rewrite(t) if n.endswith('.js') else t) for n, t in files.items()}
    files['tailwind.js'] = tailwind
    files['fonts.css'] = font_css()

    pages, used = {}, set()
    for p in PAGES:
        html = open(os.path.join(ROOT, p), encoding='utf-8').read()
        html = re.sub(r'\s*<link rel="preconnect"[^>]*>', '', html)
        html = re.sub(r'<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet">', '<link rel="stylesheet" href="fonts.css">', html)
        html = html.replace(f'<script src="{TAILWIND}"></script>', '<script src="tailwind.js"></script>')
        html = rewrite(html)
        pages[p] = html
        used |= set(ASSET_RE.findall(html))
    for t in files.values():
        used |= set(ASSET_RE.findall(t))

    assets = {}
    for a in sorted(used):
        path = os.path.join(ROOT, a)
        if os.path.exists(path):
            assets[a] = [MIME[a.rsplit('.', 1)[1]], base64.b64encode(open(path, 'rb').read()).decode()]
        else:
            print('missing asset (left as is):', a)

    bundle = json.dumps({'pages': pages, 'files': files, 'assets': assets, 'shim': SHIM}, ensure_ascii=False)
    bundle = bundle.replace('</', '<\\/')  # keep the JSON from closing its <script> early
    open(OUT, 'w', encoding='utf-8').write(SHELL.replace('__BUNDLE__', bundle))
    print(f'{os.path.basename(OUT)}: {os.path.getsize(OUT) / 1e6:.1f} MB, {len(pages)} pages, {len(assets)} images')


if __name__ == '__main__':
    main()
