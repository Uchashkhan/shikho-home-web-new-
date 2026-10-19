"""Assemble the fragments in src/ into index.html (home) and profile.html.

Run from anywhere:  python3 build.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pages  # noqa: E402  (templates for the inner pages)

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
frag = lambda n: open(os.path.join(SRC, n + ".html"), encoding="utf-8").read()

# Homepage sections per plan. Only the signed-in student's plan is shown (see the
# plan script in <head>); the shared sections follow either one.
# (the animated-lessons and standalone Shikho AI cards are replaced by "features")
PLANS = {
    # paid (enrolled) student: Figma 130:3454 in the new layout
    "paid": ["p01_routine", "features", "s02_important", "s03_guideline"],
    # free student: original web homepage order
    "free": ["s02_important", "s03_guideline", "features", "s05_freetrial", "s07_courses"],
}
SHARED = ["s09_call", "s10_community"]


def div_end(s, start):
    """End index of the <div> element starting at `start` (balanced)."""
    import re
    depth = 0
    for m in re.finditer(r'<div\b|</div>', s[start:]):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0:
            return start + m.end()
    return len(s)


def prioritize(html):
    """Above the fold: carousel slides that start on screen get fetchpriority="high" images."""
    import re
    out, pos = [], 0
    for m in re.finditer(r'<div class="absolute [^"]*\bleft-\[(-?[\d.]+)px\][^"]*"', html):
        if m.start() < pos or not (-320 < float(m.group(1)) < 412):
            continue
        end = div_end(html, m.start())
        out += [html[pos:m.start()], re.sub(r'<img(?![^>]*fetchpriority)', '<img fetchpriority="high"', html[m.start():end])]
        pos = end
    return ''.join(out) + html[pos:]


def lazy(html):
    """Below-the-fold images load as they come near the screen (the first section stays eager)."""
    import re
    return re.sub(r'<img(?![^>]*\bloading=)', '<img loading="lazy" decoding="async"', html)


def section(n, plan=None, first=False):
    attrs = f' data-plan="{plan}"' if plan else ""
    attrs += " data-first" if first else ""
    body = prioritize(frag(n)) if first else lazy(frag(n))
    return f'      <section data-section="{n}"{attrs}>\n{body}\n      </section>'


sections = [section(n, plan, i == 0) for plan, names in PLANS.items() for i, n in enumerate(names)]
sections += [section(n) for n in SHARED]

HOME = f"""    <main class="page-main">
{chr(10).join(sections)}
    </main>
    <footer>
{lazy(frag("s11_footer"))}
    </footer>"""


def page(title, active, body, greeting=False, bar="Shikho", back="index.html", nav_on=True, scripts=()):
    # Same header and bottom navigation on every page; only the active tab differs.
    # nav=False: full-screen journeys (video, quiz) hide the tab bar but keep its toast.
    nav = frag("bottom-nav").replace(
        f'class="bottom-nav-item" data-route="{active}"',
        f'class="bottom-nav-item is-active" aria-current="page" data-route="{active}"')
    assert 'aria-current="page"' in nav, active
    extra = "".join(f'  <script src="{x}"></script>\n' for x in scripts)
    if not nav_on:
        nav = nav[nav.index('<div id="proto-toast"'):]
    return f"""<!doctype html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="theme-color" content="#E2136E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11"></script>
  <link rel="stylesheet" href="styles.css">
  <script src="data/user.js"></script>
  <script>
    // App-like page transitions: tab ↔ tab crossfades, opening a page pushes it in, back slides it out
    window.addEventListener('pagereveal', function (e) {{
      var a = window.navigation && navigation.activation;
      if (!e.viewTransition || !a || !a.from) return;
      if (a.navigationType === 'reload') return e.viewTransition.skipTransition();
      var TABS = ['index.html', 'courses.html', 'ai-chat.html', 'profile.html'];
      var page = function (u) {{ var p = new URL(u).pathname.split('/').pop(); return p || 'index.html'; }};
      var from = page(a.from.url), to = page(a.entry.url);
      var type = TABS.indexOf(from) > -1 && TABS.indexOf(to) > -1 ? 'tab'
        : a.navigationType === 'traverse' && a.entry.index < a.from.index ? 'back'
        : TABS.indexOf(to) > -1 ? 'back' : 'forward';
      e.viewTransition.types.add(type);
      document.documentElement.dataset.navTransition = type; // which animation ran
      // clip the slide to the page column's real edges (scrollbar-safe)
      var col = document.querySelector('.page');
      if (col) {{
        var r = col.getBoundingClientRect();
        document.documentElement.style.setProperty('--vt-l', r.left + 'px');
        document.documentElement.style.setProperty('--vt-w', r.width + 'px');
      }}
    }});
  </script>
  <script>
    // Paid (enrolled) or free homepage, decided before first paint. ?paid / ?free preview either.
    (function () {{
      var q = new URLSearchParams(location.search);
      var user = q.has('guest') ? null : window.SHIKHO_USER;
      var paid = q.has('paid') || (!q.has('free') && !!(user && user.enrolled));
      document.documentElement.dataset.plan = paid ? 'paid' : 'free';
    }})();
  </script>
</head>
<body{"" if nav_on else ' class="no-nav"'}>
  <a class="skip-link" href="#main">মূল কন্টেন্টে যাও</a>
  <div class="page">
{pages.review_switch() if greeting else ""}
    <header class="page-nav">
{pages.app_bar(bar, back, optional_back=greeting)}
    </header>
{frag("greeting") if greeting else ""}
{body.replace("<main ", '<main id="main" tabindex="-1" ', 1)}
  </div>
{nav}
  <script src="data/videos.js"></script>
  <script src="main.js"></script>
  <script src="sheet.js"></script>
{extra}</body>
</html>
"""


VIDEO_LISTS = {
    "important": ("videos-important.json", "মোস্ট ইমপর্ট্যান্ট ক্লাস", "রিলেটেড মোস্ট ইমপর্ট্যান্ট ক্লাস"),
    "guideline": ("videos-guideline.json", "এক্সক্লুসিভ গাইডলাইন", "আরও এক্সক্লুসিভ গাইডলাইন"),
}
videos = {k: {"title": t, "related": r, "chips": pages.data(f)["chips"], "videos": pages.data(f)["videos"]}
          for k, (f, t, r) in VIDEO_LISTS.items()}
open(os.path.join(ROOT, "data", "videos.js"), "w", encoding="utf-8").write(
    "// Generated by build.py from data/videos-*.json: lists behind the video player (watch.html)\n"
    "window.SHIKHO_VIDEOS = " + json.dumps(videos, ensure_ascii=False, indent=1) + ";\n")

for name, html in [
    ("index.html", page("Shikho | ঘরে বসে SSC/HSC'র A+ প্রস্তুতির বিশ্বস্ত প্রতিষ্ঠান", "home", HOME, greeting=True)),
    ("profile.html", page("প্রোফাইল | Shikho", "profile", frag("profile"), bar="প্রোফাইল")),
    # Pages behind the homepage links, with content from the live app
    ("important-classes.html", page("মোস্ট ইমপর্ট্যান্ট ক্লাস | Shikho", "home",
                                    pages.video_list("videos-important.json"), bar="মোস্ট ইমপর্ট্যান্ট ক্লাস")),
    ("guidelines.html", page("এক্সক্লুসিভ গাইডলাইন | Shikho", "home",
                             pages.video_list("videos-guideline.json"), bar="এক্সক্লুসিভ গাইডলাইন")),
    ("courses.html", page("কোর্স | Shikho", "courses", pages.courses_page(), bar="কোর্স")),
    ("course.html", page("Animated General Math | Shikho", "courses", pages.course_detail_page(),
                         bar="কোর্সের বিস্তারিত", back="courses.html")),
    # Journeys (layout and copy follow the shikho-bkash reference prototype)
    ("watch.html", page("ক্লাস | Shikho", "home", pages.watch_page(), bar="মোস্ট ইমপর্ট্যান্ট ক্লাস",
                        nav_on=False, scripts=("watch.js",))),
    ("exam.html", page("প্র্যাকটিস কুইজ | Shikho", "home", pages.exam_page(), bar="প্র্যাকটিস কুইজ",
                       nav_on=False, scripts=("exam.js",))),
    ("signup.html", page("প্রোফাইল তৈরি | Shikho", "home", pages.signup_page(), bar="Shikho",
                         nav_on=False, scripts=("signup.js",))),
    ("ai-chat.html", page("ডাউট সল্ভ | Shikho AI", "ai", pages.ai_chat_page(), bar="শিখো AI",
                          scripts=("ai-chat.js",))),
]:
    open(os.path.join(ROOT, name), "w", encoding="utf-8").write(html)
    print(name, len(html))

