"""Assemble the fragments in src/ into index.html (home) and profile.html.

Run from anywhere:  python3 build.py
"""
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
    "paid": ["p01_routine", "p02_program", "p03_links", "features", "p05_important", "p06_guideline"],
    # free student: original web homepage order
    "free": ["s02_important", "s03_guideline", "features", "s05_freetrial", "s07_courses"],
}
SHARED = ["s08_app", "s09_call", "s10_community"]


def section(n, plan=None, first=False):
    attrs = f' data-plan="{plan}"' if plan else ""
    attrs += " data-first" if first else ""
    return f'      <section data-section="{n}"{attrs}>\n{frag(n)}\n      </section>'


sections = [section(n, plan, i == 0) for plan, names in PLANS.items() for i, n in enumerate(names)]
sections += [section(n) for n in SHARED]

HOME = f"""    <main class="page-main">
{chr(10).join(sections)}
    </main>
    <footer>
{frag("s11_footer")}
    </footer>"""


def page(title, active, body, greeting=False, bar=None, back="index.html"):
    # Same header and bottom navigation on every page; only the active tab differs
    nav = frag("bottom-nav").replace(
        f'class="bottom-nav-item" data-route="{active}"',
        f'class="bottom-nav-item is-active" aria-current="page" data-route="{active}"')
    assert 'aria-current="page"' in nav, active
    return f"""<!doctype html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11"></script>
  <link rel="stylesheet" href="styles.css">
  <script src="data/user.js"></script>
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
<body>
  <div class="page">
{pages.review_switch() if greeting else ""}
    <header class="page-nav{" page-nav--intro" if greeting else ""}{" page-nav--sub" if bar else ""}">
{pages.subpage_bar(bar, back) if bar else frag("s01_nav")}
    </header>
{frag("greeting") if greeting else ""}
{body}
  </div>
{nav}
  <script src="main.js"></script>
</body>
</html>
"""


for name, html in [
    ("index.html", page("Shikho | ঘরে বসে SSC/HSC'র A+ প্রস্তুতির বিশ্বস্ত প্রতিষ্ঠান", "home", HOME, greeting=True)),
    ("profile.html", page("প্রোফাইল | Shikho", "profile", frag("profile"))),
    # Pages behind the homepage links, with content from the live app
    ("important-classes.html", page("মোস্ট ইমপর্ট্যান্ট ক্লাস | Shikho", "home",
                                    pages.video_list("videos-important.json"), bar="মোস্ট ইমপর্ট্যান্ট ক্লাস")),
    ("guidelines.html", page("এক্সক্লুসিভ গাইডলাইন | Shikho", "home",
                             pages.video_list("videos-guideline.json"), bar="এক্সক্লুসিভ গাইডলাইন")),
    ("courses.html", page("কোর্স | Shikho", "courses", pages.courses_page(), bar="কোর্স")),
    ("course.html", page("Animated General Math | Shikho", "courses", pages.course_detail_page(),
                         bar="কোর্সের বিস্তারিত", back="courses.html")),
    ("shikho-ai.html", page("Shikho AI | Shikho", "ai", pages.ai_page(), bar="Shikho AI")),
]:
    open(os.path.join(ROOT, name), "w", encoding="utf-8").write(html)
    print(name, len(html))

