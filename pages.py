"""Templates for the pages behind the homepage links (built by build.py).

Content comes from the live app (app.shikho.dev / ai.shikho.com), collected into data/*.json.
Markup reuses the homepage's design system: white 20px-radius cards, the subject chip
style and the Fold design system (colour tokens, Inter Tight + Noto Sans Bengali type scale).
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
F = "font-fold"
CARD = "bg-white border border-[#EDEDED] border-solid rounded-[12px]"  # reference card: thin Slate border
e = lambda s: html.escape(s or "", quote=True)


def data(name):
    return json.load(open(os.path.join(ROOT, "data", name), encoding="utf-8"))


PLAY = ('<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="#fff">'
        '<path d="M4 2.5v9a.6.6 0 0 0 .9.5l7.2-4.5a.6.6 0 0 0 0-1L4.9 2a.6.6 0 0 0-.9.5Z"/></svg>')
CHEVRON = ('<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
           'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>')


def app_bar(title, back="index.html", optional_back=False):
    """bKash mini-app header on every page: back chevron, left-aligned title, and the
    "⋯ | ⊗" capsule on the right (menu and close-mini-app, as in the bKash app).
    optional_back: the homepage only shows the chevron when there is a page to go back to."""
    extra = " data-back-optional hidden" if optional_back else ""
    return f'''<div class="appbar">
      <a href="{back}" class="appbar-back" data-back{extra} aria-label="ফিরে যাও">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>
      </a>
      <h1 class="appbar-title"{' translate="no"' if title.startswith("Shikho") else ""}>{e(title)}</h1>
      <div class="appbar-pill">
        <button type="button" class="appbar-pill-btn" data-appbar-more aria-label="আরও অপশন" aria-haspopup="dialog">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
        </button>
        <span class="appbar-pill-sep" aria-hidden="true"></span>
        <button type="button" class="appbar-pill-btn" data-appbar-close aria-label="বন্ধ করো">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>
        </button>
      </div>
    </div>'''


# ---------- Video list ("আরো দেখো" pages) ----------

def video_card(v, href="#"):
    subject = (f'<span class="tag-pill">{e(v["subject"])}</span>' if v.get("subject") else "")
    return f'''<a href="{href}" class="video-card" data-subject="{e(v.get("subject") or "")}">
          <span class="video-thumb">
            <img src="{v["thumb"]}" alt="" width="640" height="360" loading="lazy">
            <span class="video-duration">{e(v["duration"])}</span>
            <span class="video-play">{PLAY}</span>
          </span>
          <span class="video-body">
            <span class="video-title">{e(v["title"])}</span>
            <span class="video-meta">
              <span class="video-teacher"><img src="{v["avatar"]}" alt="" width="24" height="24" loading="lazy">{e(" ".join(v["teacher"].split()))}</span>
              {subject}
            </span>
          </span>
        </a>'''


def chips(items):
    if not items:
        return ""
    out = []
    for i, (label, icon) in enumerate(items):
        img = f'<img src="{icon}" alt="" width="14" height="20">' if icon else ""
        out.append(f'<button type="button" class="chip{" is-active" if i == 0 else ""}" data-filter="{"" if i == 0 else e(label)}" aria-pressed="{"true" if i == 0 else "false"}">{img}{e(label)}</button>')
    return ('<div class="chip-row h-scroll" role="group" aria-label="বিষয় অনুযায়ী ফিল্টার">\n        '
            + "\n        ".join(out) + "\n      </div>")


def video_list(name):
    d = data(name)
    key = "important" if "important" in name else "guideline"  # list key in data/videos.js
    cards = "\n        ".join(video_card(v, f"watch.html?list={key}&amp;v={i}") for i, v in enumerate(d["videos"]))
    return f'''<main class="subpage-main">
      {chips(d["chips"])}
      <div class="video-list" data-filter-list>
        {cards}
      </div>
      <p class="filter-empty" hidden>এই বিষয়ের কোনো ক্লাস এখন নেই</p>
    </main>'''


# ---------- Courses tab ----------

def price(c, size=""):
    if c["old"]:
        return (f'<span class="course-price{size}">মাত্র ৳ {e(c["price"])}</span>'
                f'<s class="course-old">৳ {e(c["old"])}</s>')
    return f'<span class="course-price{size}">মাত্র ৳ {e(c["price"])}</span><span class="course-from">থেকে শুরু</span>'


def course_card(c, compact=False):
    route = 'href="course.html" data-route="course"' if c["detail"] else 'href="#" data-route="courseOther"'
    return f'''<article class="course-card{" course-card--compact" if compact else ""}">
          <img class="course-thumb" src="{c["thumb"]}" alt="" width="720" height="405" loading="lazy">
          <div class="course-body">
            <{"h3" if compact else "h2"} class="course-title">{e(c["title"])}</{"h3" if compact else "h2"}>
            <p class="course-days">কোর্সের মেয়াদ {e(c["days"])} দিন</p>
          </div>
          <div class="course-foot">
            <span class="course-price-wrap">{price(c)}</span>
            <a {route} class="btn-primary bk-chev">বিস্তারিত</a>
          </div>
        </article>'''


def courses_page():
    """কোর্স tab, content from app.shikho.com/student/my-courses: আমার কোর্স (enrolled; paid view only),
    অন্যান্য কোর্স (3-day trial), ফ্রি কোর্স. Same order as the live page."""
    d = data("my-courses.json")
    def card(c, badges, actions):
        tags = "".join(f'<span class="mc-badge mc-badge--{k}">{e(t)}</span>' for k, t in badges)
        return f'''<article class="mc-card" data-title="{e(c["title"])}" data-img="{c["thumb"]}">
          <div class="mc-thumb"><img src="{c["thumb"]}" alt="" width="720" height="405" loading="lazy">{f'<span class="mc-badges">{tags}</span>' if tags else ""}</div>
          <div class="mc-body">
            <h3 class="mc-title">{e(c["title"])}</h3>
            <div class="mc-actions">{actions}</div>
          </div>
        </article>'''
    cont = '<a href="#" class="btn-primary bk-chev mc-cta" data-route="courseOther">শেখা চালিয়ে যাও</a>'
    mine = "\n        ".join(card(c, [("done", "ভর্তি হয়েছো")] + ([("archive", "আর্কাইভ")] if c["archived"] else []), cont) for c in d["mine"])
    other = "\n        ".join(card(
        c, [("trial", "৩ দিন সবকিছু ফ্রি!")] if c["trial"] else [],
        ('<button type="button" class="btn-primary bk-chev mc-cta" data-sheet="trial">৩ দিন ফ্রিতে শিখো</button>' if c["trial"] else "")
        + '<button type="button" class="btn-secondary mc-cta" data-sheet="program">বিস্তারিত দেখো</button>') for c in d["other"])
    free = "\n        ".join(card(
        c, [("free", "সম্পুর্ন ফ্রি")],
        '<a href="#" class="btn-primary bk-chev mc-cta" data-route="courseOther">সম্পূর্ণ ফ্রি’তে শুরু করো</a>'
        '<a href="#" class="btn-secondary mc-cta" data-route="courseOther">বিস্তারিত দেখো</a>') for c in d["free"])
    return f'''<main class="subpage-main mc-page">
      <section class="mc-section mc-section--mine" aria-labelledby="mc-mine">
        <h2 class="mc-heading" id="mc-mine">আমার কোর্স</h2>
        {mine}
      </section>
      <section class="mc-section" aria-labelledby="mc-other">
        <h2 class="mc-heading" id="mc-other">অন্যান্য কোর্স</h2>
        {other}
      </section>
      <section class="mc-section" aria-labelledby="mc-free">
        <h2 class="mc-heading" id="mc-free">ফ্রি কোর্স</h2>
        {free}
      </section>
    </main>'''


# ---------- তোমার প্রোগ্রাম → শেখা চালিয়ে যাও ----------

# Runner icon of the homepage program card (src/p02_program.html), same Figma layers
RUNNER_ICON = """<div class="h-[60px] overflow-clip relative shrink-0 w-[61px]" aria-hidden="true" data-name="Icon">
          <div class="absolute inset-[0_0.15%_0_1.49%]"><img alt="" class="absolute block inset-0 max-w-none size-full" src="assets/p02-vector.svg"></div>
          <div class="absolute contents inset-[23.33%_23.1%_23.33%_24.44%]">
            <div class="absolute inset-[25.78%_23.1%_25.78%_24.44%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-1.469px] mask-size-[32px_32px]" style="mask-image: url(&quot;assets/p02-group.svg&quot;)"><img alt="" class="absolute block inset-0 max-w-none size-full" src="assets/p02-group1.svg"></div>
          </div>
          <div class="absolute inset-[0.04%_49.33%_0.04%_1.49%]"><img alt="" class="absolute block inset-0 max-w-none size-full" src="assets/p02-mask-group.svg"></div>
        </div>"""

ROW_CHEVRON = ('<svg class="profile-row-end" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" '
               'viewBox="0 0 15.19 10.69" fill="currentColor" style="transform: rotate(-90deg)"><path fill-rule="evenodd" '
               'clip-rule="evenodd" d="M2.5 0.25C2.83 -0.08 3.36 -0.08 3.69 0.25L7.59 4.15L11.5 0.25C11.83 -0.08 12.36 -0.08 '
               '12.69 0.25C13.02 0.58 13.02 1.11 12.69 1.44L8.19 5.94C7.86 6.27 7.33 6.27 7 5.94L2.5 1.44C2.17 1.11 2.17 0.58 '
               '2.5 0.25Z"/></svg>')


def program_page():
    """The program's current quarter, opened from the homepage card's শেখা চালিয়ে যাও. Content from
    app.shikho.dev/student/my-courses/[id]?type=academic&phaseId=…: the quarter, its subjects
    (live icons and tile colours) and two help links, laid out as bKash list rows."""
    subjects = [  # (name, icon, live tile colour)
        ("ইংরেজী ১ম পত্র", "english1.svg", "#30C4D8"), ("পদার্থবিজ্ঞান", "physics.svg", "#6070E9"),
        ("রসায়ন", "chemistry.svg", "#39BCF7"), ("সাধারণ গণিত", "math.svg", "#FF7B33"),
        ("উচ্চতর গণিত", "higher-math.svg", "#9736E3"), ("ভূগোল ও মহাকাশ", "geography.png", "#397077"),
        ("ইসলাম ও নৈতিক শিক্ষা", "islam.svg", "#397077"), ("বাংলা ১ম পত্র", "bangla1.svg", "#E74D4F"),
        ("জীববিজ্ঞান", "biology.svg", "#99563F"), ("তথ্য ও যোগাযোগ প্রযুক্তি", "ict.svg", "#43D1B9"),
    ]
    rows = "\n          ".join(
        f'''<a href="#" class="profile-row qp-row" data-route="programSubject">
            <span class="qp-tile" style="background:{c}"><img src="assets/subjects/{f}" alt="" width="37" height="37" loading="lazy"></span>
            <span class="profile-row-label">{e(n)}</span>{ROW_CHEVRON}
          </a>''' for n, f, c in subjects)
    return f'''<main class="subpage-main qp-page">
      <section class="qp-head" aria-labelledby="qp-quarter">
        {RUNNER_ICON}
        <div class="qp-head-text">
          <div class="qp-title"><h2 id="qp-quarter">কোয়ার্টার ৩</h2><span class="qp-tag"><i aria-hidden="true"></i>পড়ানো হচ্ছে</span></div>
          <p>সেপ্টেম্বর’ ২৬ - ডিসেম্বর’ ২৬</p>
        </div>
      </section>

      <section class="qp-section" aria-labelledby="qp-subjects">
        <h2 class="qp-h" id="qp-subjects">যেকোনো একটি বিষয় সিলেক্ট করো</h2>
        <nav class="rc-box profile-list qp-list" aria-labelledby="qp-subjects">
          {rows}
        </nav>
      </section>

      <nav class="rc-box profile-list qp-list" aria-label="প্রোগ্রামের সাহায্য">
        <a href="#" class="profile-row qp-row" data-route="quarterSyllabus">
          <span class="qp-ic"><img src="assets/subjects/quarter-syllabus.svg" alt="" width="35" height="40"></span>
          <span class="profile-row-label">কোয়ার্টারের সিলেবাস দেখে নাও</span>{ROW_CHEVRON}
        </a>
        <a href="#" class="profile-row qp-row" data-route="supportGroup">
          <span class="qp-ic"><img src="assets/subjects/facebook.svg" alt="" width="32" height="32"></span>
          <span class="profile-row-label">এই কোর্সের Facebook সাপোর্ট গ্রুপে জয়েন করে সব তথ্য জেনে নাও</span>{ROW_CHEVRON}
        </a>
      </nav>
    </main>'''


# ---------- Course detail (Animated General Math) ----------

def course_detail_page():
    d = data("courses.json")
    c = next(x for x in d["courses"] if x["detail"])
    chapters = ["সংখ্যার শ্রেণিবিন্যাস", "সেট ও ফাংশন", "বীজগাণিতিক রাশি", "সূচক ও লগারিদম",
                "এক চলকবিশিষ্ট সমীকরণ", "রেখা, কোণ ও ত্রিভুজ", "ব্যবহারিক জ্যামিতি", "বৃত্ত",
                "ত্রিকোণমিতিক অনুপাত", "দূরত্ব ও উচ্চতা", "বীজগাণিতিক অনুপাত ও সমানুপাত",
                "দুই চলকবিশিষ্ট সরল সহসমীকরণ", "সসীম ধারা", "অনুপাত, সদৃশতা ও প্রতিসমতা",
                "ক্ষেত্রফল সম্পর্কিত উপপাদ্য ও সম্পাদ্য", "পরিমিতি", "পরিসংখ্যান"]
    bn = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
    ch = "\n              ".join(
        f'<li><span class="chapter-no">অধ্যায় {str(i).zfill(2).translate(bn)}</span>{e(t)}</li>'
        for i, t in enumerate(chapters, 1))
    mentors = [
        ("Md Shahriar Rahman (TA)", None, ["Biology Specialist", "Doctor of Veterinary Medicine", "Teaching Assistant", "3 years of teaching experience"]),
        ("Nanjeeba Shaheed", "assets/live/mentor-bpcesuxvn42kd0tjyxeb.jpg", ["Management Specialist", "BBA in Management, University of Dhaka", "4+ years of Teaching Experience"]),
    ]
    def mentor(n, img, points):
        pic = (f'<img src="{img}" alt="" width="48" height="48">' if img else
               f'<span aria-hidden="true">{e(n[0])}</span>')
        li = "".join(f"<li>{e(p)}</li>" for p in points)
        return f'''<div class="mentor">
              <span class="mentor-pic">{pic}</span>
              <div class="min-w-0"><p class="mentor-name">{e(n)}</p><ul class="mentor-points">{li}</ul></div>
            </div>'''
    latest = [x for x in d["courses"] if not x["detail"] and x["old"]][:4]
    latest_cards = "\n          ".join(course_card(x, compact=True) for x in latest)
    return f'''<main class="subpage-main course-detail">
      <section class="course-hero">
        <img class="course-hero-img" src="{c["thumb"]}" alt="" width="720" height="480">
        <div class="course-hero-body">
          <h2 class="course-hero-title">{e(c["title"])}</h2>
          <p class="course-hero-meta"><span class="hero-tag">Animated</span>কোর্সের মেয়াদ {e(c["days"])} দিন</p>
        </div>
      </section>

      <nav class="course-tabs h-scroll" aria-label="কোর্সের তথ্য">
        <a href="#features" class="chip is-active">ফিচারসমূহ</a>
        <a href="#mentors" class="chip">মেন্টর</a>
        <a href="#syllabus" class="chip">সিলেবাস</a>
        <a href="#details" class="chip">কোর্সের বিস্তারিত</a>
      </nav>

      <section id="features" class="{CARD} detail-card">
        <h2 class="detail-heading">ফিচারসমূহ</h2>
        <div class="flex flex-wrap gap-[8px]"><span class="tag-pill tag-pill--lg">Animated</span><span class="tag-pill tag-pill--lg">Course</span></div>
      </section>

      <section id="mentors" class="{CARD} detail-card">
        <h2 class="detail-heading">আমাদের মেন্টর</h2>
        <div class="flex flex-col gap-[16px]">
            {"".join(mentor(*m) for m in mentors)}
        </div>
      </section>

      <section id="syllabus" class="{CARD} detail-card">
        <h2 class="detail-heading">কোর্সের সিলেবাস</h2>
        <details class="syllabus" open>
          <summary>সাধারণ গণিত <span class="syllabus-count">১৭টি অধ্যায়</span>{CHEVRON}</summary>
          <ol class="chapter-list">
              {ch}
          </ol>
        </details>
        <details class="syllabus">
          <summary>জীববিজ্ঞান {CHEVRON}</summary>
          <p class="syllabus-empty">এখনো কোনো অধ্যায় যোগ করা হয়নি</p>
        </details>
        <details class="syllabus">
          <summary>English {CHEVRON}</summary>
          <p class="syllabus-empty">এখনো কোনো অধ্যায় যোগ করা হয়নি</p>
        </details>
      </section>

      <section id="details" class="{CARD} detail-card">
        <h2 class="detail-heading">কোর্সের বিস্তারিত</h2>
        <p class="detail-text">Animated course for SSC students</p>
      </section>

      <a href="#" class="{CARD} detail-card payment-help" data-route="paymentVideo">
        <span class="payment-video"><img src="assets/live/admission-video-play.jpg" alt="" width="1270" height="720" loading="lazy"><span class="video-play">{PLAY}</span></span>
        <span class="detail-heading">ভর্তির পেমেন্ট করবে কীভাবে?</span>
        <span class="detail-text">শিখো’র কোর্সে ভর্তির জন্য কীভাবে পেমেন্ট করবে, তা জানতে ভিডিওটি দেখে নাও</span>
      </a>

      <section>
        <h2 class="detail-heading px-[2px]">লেটেস্ট কোর্স</h2>
        <div class="course-row h-scroll">
          {latest_cards}
        </div>
      </section>

      <div class="enroll-bar">
        <span class="course-price-wrap"><span class="enroll-label">কোর্সের মূল্য</span>{price(c)}</span>
        <button type="button" class="btn-enroll bk-chev" data-sheet="enroll" data-title="{e(c["title"])}" data-thumb="{c["thumb"]}" data-price="{e(c["price"])}" data-old="{e(c["old"] or "")}" data-days="{e(c["days"])}">কোর্সে ভর্তি হও</button>
      </div>
    </main>'''


# ---------- Prototype switch: ফ্রি / পেইড student ----------

def review_switch():
    """Prototype control (not part of the product UI): switches the homepage between the free
    and paid student views in place (main.js, [data-plan-set]). Floats beside the phone-width
    column; on a phone it sits at the left edge, vertically centred."""
    return '''<!-- Prototype switch (not part of the product UI) -->
<style>
  .review-switch { position: fixed; z-index: 120; top: 50%; transform: translateY(-50%);
    /* just outside the column's left edge when there is room, else hugging the screen edge */
    left: max(8px, calc(50% - var(--page-width, 412px) / 2 - 72px));
    padding: 4px; border-radius: 16px; background: #202020; box-shadow: 0 6px 20px rgba(0,0,0,.18); }
  .rs-seg { display: flex; flex-direction: column; gap: 2px; }
  .rs-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 52px; height: 36px; padding: 0 10px; border: 0; border-radius: 12px; background: none; color: #DDDDDD; font: 600 12px/36px 'Inter Tight', 'Noto Sans Bengali', sans-serif; cursor: pointer; }
  .rs-btn[aria-pressed="true"] { background: #fff; color: #202020; cursor: default; }
  .rs-btn:focus-visible { outline: 2px solid #E2136E; outline-offset: 2px; }
  .rs-cap { display: block; margin: 2px 0 4px; color: #707070; font: 500 10px/14px 'Inter Tight', 'Noto Sans Bengali', sans-serif; text-align: center; }
</style>
<div class="review-switch">
  <span class="rs-cap" aria-hidden="true">ভিউ</span>
  <div class="rs-seg" role="group" aria-label="শিক্ষার্থী (প্রোটোটাইপ)">
    <button type="button" class="rs-btn" data-plan-set="free">ফ্রি</button><button type="button" class="rs-btn" data-plan-set="paid">পেইড</button>
  </div>
</div>'''


# ---------- Journeys (shikho-bkash reference: watch, chapter exam, Shikho AI tab) ----------

def watch_page():
    """Video player + related list. Filled by watch.js from data/videos.js (?list=…&v=…)."""
    return '''<main class="watch-main" data-watch aria-live="polite"></main>'''


def exam_page():
    """Practice quiz: rules -> questions -> overview grid -> result sheet (exam.js)."""
    return '''<main class="exam" data-exam>
      <div class="exam-head" data-exam-head></div>
      <div class="exam-scroll" data-exam-body></div>
      <div class="exam-foot" data-exam-foot></div>
    </main>'''


def ai_chat_page():
    """Shikho AI doubt screen (reference AI tab). Behaviour in ai-chat.js."""
    send = ('<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">'
            '<path d="M3.4 20.4 21 12 3.4 3.6l-.1 6.5L15 12 3.3 13.9l.1 6.5Z"/></svg>')
    photo = ('<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
             'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="15" height="14" rx="2"/>'
             '<path d="m3 16 4-4 4 4 2-2 5 5"/><path d="M19 3v6M16 6h6"/></svg>')
    return f'''<main class="ai-screen" data-ai>
      <div class="ai-intro">
        <img src="assets/ai-bubbles.webp" alt="" width="100" height="87">
        <h2>ডাউট সল্ভ করতে প্রশ্ন করো</h2>
        <p>যেকোনো টপিকের ডাউট যত স্পষ্ট করে লিখবে, শিখো AI তত ভালোভাবে বুঝিয়ে দেবে।</p>
      </div>
      <div class="ai-chat" data-ai-chat aria-live="polite" hidden></div>

      <form class="ai-ask" data-ai-form>
        <label class="ai-subject">
          <span class="sr-only">বিষয়</span>
          <select name="subject"></select>
        </label>
        <div class="ai-box">
          <textarea name="q" rows="3" maxlength="500" placeholder="তোমার ডাউট লিখো" aria-label="তোমার ডাউট"></textarea>
          <div class="ai-box-foot">
            <span class="ai-count">ক্যারেক্টার লিমিট: <b data-ai-count>০/৫০০</b></span>
            <span class="ai-tools">
              <button type="button" class="ai-attach" data-ai-photo aria-label="ছবি যোগ করো">{photo}</button>
              <button type="submit" class="ai-send" aria-label="পাঠাও" disabled>{send}</button>
            </span>
          </div>
        </div>
        <p class="ai-note">প্রতিটি ডাউটের জন্য একবারই প্রশ্ন করতে পারবে, তাই সমস্যাটি স্পষ্ট করে লিখো।</p>
      </form>

      <div class="ai-popular" data-ai-popular>
        <h3>পপুলার ডাউট</h3>
        <div class="ai-prompts" data-ai-prompts></div>
      </div>

      <div class="ai-usage" data-ai-usage></div>
      <p class="ai-disclaimer">শিখো AI ভুল করতে পারে। গুরুত্বপূর্ণ তথ্য যাচাই করে নিও।</p>
    </main>'''


def signup_page():
    """Profile setup / sign-up (shikho-bkash reference .onboard). Behaviour in signup.js."""
    return '''<main class="onboard">
      <div class="ob-hero">
        <img class="ob-logo" src="assets/shikho-logo.svg" alt="Shikho" width="78" height="40">
        <h2 id="onboard-title">চলো শিখোতে তোমার<br><em>প্রোফাইল তৈরি করি</em></h2>
        <p>কয়েকটি তথ্য দাও, তোমার জন্য শেখাটা সাজিয়ে দেবো</p>
      </div>
      <form class="ob-form" data-signup novalidate aria-labelledby="onboard-title">
        <div class="field">
          <label for="ob-name">শিক্ষার্থীর নাম</label>
          <!-- Not prefilled: the bKash account holder is usually the parent, not the student -->
          <input id="ob-name" name="name" type="text" autocomplete="off" placeholder="নাম লেখো" maxlength="40" required aria-describedby="ob-name-hint">
          <small class="hint" id="ob-name-hint">যে পড়বে তার নাম লেখো</small>
        </div>
        <div class="field">
          <label for="ob-class">ক্লাস</label>
          <select id="ob-class" name="class" required></select>
        </div>
        <!-- Group only exists for class 9 and 10: revealed below Class when one of them is picked -->
        <div class="reveal" data-group-reveal inert>
          <div class="reveal-inner">
            <div class="field">
              <label for="ob-group">গ্রুপ</label>
              <select id="ob-group" name="group"></select>
            </div>
            <div class="field ob-batch">
              <span class="field-label" id="ob-batch-label">ব্যাচ</span>
              <div class="batch-chips" role="radiogroup" aria-labelledby="ob-batch-label" data-batch></div>
            </div>
          </div>
        </div>
        <div class="ob-actions">
          <button class="btn-primary btn-block ob-submit" type="submit" disabled>প্রোফাইল তৈরি করো</button>
        </div>
      </form>
    </main>'''


# Tab icons copied from live app.shikho.dev/student/profile (its grey fills switched to currentColor)
PI_TAB_ICONS = {
    'info': '<svg aria-hidden="true" class="pi-tab-icon" fill="currentColor" width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M15.9993 0C7.16394 0 0 7.16394 0 15.9993C0 24.8347 7.16394 32 15.9993 32C24.8347 32 32 24.8347 32 15.9993C32 7.16394 24.8347 0 15.9993 0ZM19.33 24.7968C18.5065 25.1219 17.8509 25.3684 17.3592 25.539C16.8689 25.7097 16.2987 25.795 15.6499 25.795C14.653 25.795 13.8768 25.5512 13.3242 25.065C12.7716 24.5787 12.4966 23.9624 12.4966 23.2134C12.4966 22.9222 12.5169 22.6242 12.5575 22.3208C12.5995 22.0174 12.6659 21.676 12.7567 21.2927L13.7874 17.6518C13.8782 17.3023 13.9567 16.9705 14.019 16.6617C14.0814 16.3501 14.1112 16.0643 14.1112 15.8043C14.1112 15.341 14.015 15.016 13.824 14.8331C13.6303 14.6502 13.2659 14.5608 12.7228 14.5608C12.4573 14.5608 12.1837 14.6001 11.9033 14.6828C11.6257 14.7681 11.3846 14.8453 11.1868 14.9211L11.459 13.7996C12.1336 13.5247 12.7797 13.289 13.396 13.0939C14.0123 12.8962 14.5947 12.7986 15.1433 12.7986C16.1334 12.7986 16.8974 13.0397 17.4351 13.5165C17.9701 13.9947 18.2397 14.6164 18.2397 15.3803C18.2397 15.5388 18.2207 15.8178 18.1841 16.216C18.1476 16.6156 18.0785 16.98 17.9782 17.3145L16.9529 20.9446C16.8689 21.2358 16.7944 21.569 16.7267 21.9415C16.6603 22.314 16.6278 22.5984 16.6278 22.7894C16.6278 23.2716 16.7348 23.6008 16.9515 23.7755C17.1655 23.9502 17.5407 24.0383 18.0717 24.0383C18.3223 24.0383 18.6027 23.9936 18.9196 23.9069C19.2339 23.8202 19.4614 23.743 19.605 23.6766L19.33 24.7968ZM19.1485 10.0626C18.6704 10.5068 18.0947 10.729 17.4215 10.729C16.7497 10.729 16.17 10.5068 15.6878 10.0626C15.2083 9.61829 14.9658 9.07784 14.9658 8.44665C14.9658 7.8168 15.2097 7.275 15.6878 6.82667C16.17 6.37697 16.7497 6.15348 17.4215 6.15348C18.0947 6.15348 18.6717 6.37697 19.1485 6.82667C19.6267 7.275 19.8664 7.8168 19.8664 8.44665C19.8664 9.0792 19.6267 9.61829 19.1485 10.0626Z"></path></svg>',
    'syllabus': '<svg aria-hidden="true" class="pi-tab-icon" width="17" height="26" viewBox="0 0 17 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.50533 3.24251V3.20086C7.50533 2.7509 7.87199 2.38423 8.32195 2.38423C8.77192 2.38423 9.13858 2.7509 9.13858 3.20086V3.24251C9.70042 3.29314 10.2443 3.3993 10.7718 3.54874V3.20086C10.7718 1.85016 9.67266 0.750977 8.32195 0.750977C6.97125 0.750977 5.87207 1.85016 5.87207 3.20086V3.54874C6.39961 3.3993 6.9443 3.29314 7.50533 3.24251Z" fill="currentColor"></path><path d="M1.13958 6.81309C2.20447 5.39297 3.6744 4.29951 5.38197 3.70582L4.91404 1.96477C4.69028 1.11466 3.79036 0.570785 2.91738 0.804341L1.33639 1.22735C0.913377 1.33923 0.560594 1.61035 0.342554 1.99008C0.123698 2.37145 0.0681671 2.81488 0.184128 3.23217L1.13958 6.81309Z" fill="currentColor"></path><path d="M15.5061 6.81261L16.4591 3.23986C16.5775 2.81521 16.5219 2.37178 16.3031 1.99042C16.085 1.61069 15.7323 1.33957 15.3125 1.22851L13.725 0.803042C12.87 0.57602 11.9545 1.11499 11.7324 1.96102L11.2637 3.70615C12.9704 4.29984 14.4412 5.39331 15.5061 6.81261Z" fill="currentColor"></path><path d="M8.32155 4.01758C3.81867 4.01758 0.155273 7.68097 0.155273 12.1839V23.6166C0.155273 24.5174 0.887789 25.2499 1.78853 25.2499H14.8546C15.7553 25.2499 16.4878 24.5174 16.4878 23.6166V12.1839C16.4878 7.68097 12.8244 4.01758 8.32155 4.01758ZM5.87167 8.10072C5.87167 7.64994 6.23752 7.28409 6.6883 7.28409H9.95481C10.4056 7.28409 10.7714 7.64994 10.7714 8.10072V10.5506C10.7714 11.0014 10.4056 11.3672 9.95481 11.3672H6.6883C6.23752 11.3672 5.87167 11.0014 5.87167 10.5506V8.10072ZM13.6296 21.1668C13.6296 21.8421 13.08 22.3917 12.4047 22.3917H4.23841C3.56306 22.3917 3.01347 21.8421 3.01347 21.1668V15.4504C3.01347 14.775 3.56306 14.2254 4.23841 14.2254H12.4047C13.08 14.2254 13.6296 14.775 13.6296 15.4504V21.1668Z" fill="currentColor"></path><path d="M4.5 6.875H12.375V12.125H4.5V6.875Z" fill="currentColor"></path><path d="M3.83008 21.167C3.83008 21.3924 4.013 21.5753 4.23839 21.5753H12.4047C12.6301 21.5753 12.813 21.3924 12.813 21.167V17.4922H3.83008V21.167Z" fill="currentColor"></path><path d="M12.4047 15.042H4.23839C4.013 15.042 3.83008 15.2249 3.83008 15.4503V16.6752H12.813V15.4503C12.813 15.2249 12.6301 15.042 12.4047 15.042Z" fill="currentColor"></path></svg>',
    'admission': '<svg aria-hidden="true" class="pi-tab-icon" fill="currentColor" width="18" height="24" viewBox="0 0 18 24" xmlns="http://www.w3.org/2000/svg"><path d="M3.32035 23.1998H14.6792C16.3032 23.1998 17.6284 21.8745 17.6284 20.2504V3.74911C17.6284 2.12512 16.3032 0.799805 14.6792 0.799805H3.32035C1.69635 0.799805 0.371094 2.12512 0.371094 3.74911V20.2504C0.371094 21.8745 1.69635 23.1998 3.32035 23.1998ZM2.23776 3.74911C2.23776 3.15182 2.72311 2.66647 3.32035 2.66647H14.6792C15.2764 2.66647 15.7618 3.15182 15.7618 3.74911V17.2731C15.7618 17.8705 15.2764 18.3558 14.6792 18.3558H3.32035C2.72311 18.3558 2.23776 17.8705 2.23776 17.2731V3.74911Z"></path><path d="M7.1612 10.9967C7.2266 11.034 7.26397 11.118 7.24528 11.2114L6.76928 14.0114C6.72256 14.3287 6.80642 14.646 7.02107 14.8794C7.2266 15.122 7.5251 15.262 7.85186 15.262H10.1385C10.8147 15.262 11.3178 14.6591 11.2211 14.002L10.7453 11.2114C10.7359 11.1367 10.7544 11.0434 10.8291 10.9967C11.7344 10.39 12.2759 9.37267 12.2759 8.27134C12.2759 4.28938 6.38891 3.7728 5.7612 7.73934C5.5559 9.02734 6.08773 10.2687 7.1612 10.9967Z"></path></svg>',
    'program': '<svg aria-hidden="true" class="pi-tab-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.4404 19.6857H10.4958C9.76908 19.6857 9.17976 19.0964 9.17976 18.3697V13.7151L11.0759 14.0804C11.7321 14.0804 12.0629 13.289 11.5996 12.8231L10.2788 11.5023L7.73208 8.95557C7.58551 8.81163 7.39826 8.73682 7.20839 8.73682C7.02114 8.73682 6.83433 8.81163 6.68776 8.95557L4.14108 11.5023L2.8207 12.8231C2.35739 13.289 2.68814 14.0804 3.34439 14.0804L5.24051 13.7151V19.9381C5.24051 21.9743 6.8912 23.6254 8.92776 23.6254H9.17976H15.5226C16.6304 23.6254 17.5246 22.7106 17.4914 21.5954C17.459 20.5169 16.5188 19.6857 15.4404 19.6857Z" fill="currentColor"></path><path d="M12.5597 8.31425H17.5043C18.231 8.31425 18.8203 8.90356 18.8203 9.63025V14.2848L16.9242 13.9195C16.268 13.9195 15.9372 14.7109 16.4005 15.1769L17.7213 16.4977L20.268 19.0444C20.4146 19.1883 20.6018 19.2631 20.7917 19.2631C20.979 19.2631 21.1658 19.1883 21.3123 19.0444L23.859 16.4977L25.1798 15.1769C25.6432 14.7109 25.3124 13.9195 24.6561 13.9195L22.76 14.2848V8.06225C22.76 6.02613 21.1093 4.375 19.0728 4.375H18.8208H12.4775C11.3697 4.375 10.4755 5.28981 10.5087 6.405C10.5411 7.483 11.4813 8.31425 12.5597 8.31425Z" fill="currentColor"></path></svg>',
}


def profile_info_page():
    """তোমার তথ্য (live app.shikho.dev/student/profile): tabs for personal details, syllabus,
    admission details and program change, styled like live's tab bar (icon + label, underline
    on the selected tab). Panels are filled by profile-info.js; free students get the same tabs,
    with empty states where they have no data."""
    tabs = [("info", "তোমার তথ্য"), ("syllabus", "সিলেবাস"),
            ("admission", "ভর্তির বিস্তারিত"), ("program", "প্রোগ্রাম পরিবর্তন")]
    bar = "".join(f'<button type="button" class="pi-tab" role="tab" id="tab-{k}" aria-controls="panel-{k}" '
                  f'aria-selected="false" tabindex="-1" data-tab="{k}">{PI_TAB_ICONS[k]}<span>{label}</span></button>'
                  for k, label in tabs)
    panels = "".join(f'<section class="pi-panel" role="tabpanel" id="panel-{k}" aria-labelledby="tab-{k}" '
                     f'data-panel="{k}" hidden></section>' for k, _ in tabs)
    return f'''<main class="pi-main" data-profile-info>
      <div class="pi-tabbar">
        <div class="pi-tabs h-scroll" role="tablist" aria-label="তোমার তথ্য">{bar}</div>
        <button type="button" class="pi-more" aria-label="আরও ট্যাব" aria-haspopup="menu" aria-expanded="false" aria-controls="pi-more-menu" hidden>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
        </button>
        <ul class="bk-menu align-right pi-more-menu" id="pi-more-menu" role="menu" aria-label="আরও ট্যাব" hidden></ul>
      </div>
      {panels}
    </main>'''


# ---------- ক্লাস রুটিন + রুটিন ক্যালেন্ডার (live /student/routine and /student/calendar) ----------

# The homepage routine's calendar glyph (assets/p01-calendar.svg, bKash Figma), inline so it can take currentColor
CAL_ICON = ('<svg aria-hidden="true" width="18" height="18" viewBox="2.25 -0.5 15 16"><path fill="currentColor" fill-rule="evenodd" '
            'clip-rule="evenodd" d="M12.7011 7.46417H6.84589C6.52409 7.46417 6.25724 7.20516 6.25724 6.87551C6.25724 6.55371 6.52409 '
            '6.28686 6.84589 6.28686H12.7011C13.0229 6.28686 13.2897 6.55371 13.2897 6.87551C13.2897 7.20516 13.0229 7.46417 12.7011 '
            '7.46417ZM10.2366 10.7371H6.84589C6.52409 10.7371 6.25724 10.4781 6.25724 10.1484C6.25724 9.8266 6.52409 9.5598 6.84589 '
            '9.5598H10.2366C10.5662 9.5598 10.8252 9.8266 10.8252 10.1484C10.8252 10.4781 10.5662 10.7371 10.2366 10.7371ZM15.5345 '
            '2.31538C15.0008 1.78167 14.2473 1.46772 13.3604 1.36568V0.58866C13.3604 0.26686 13.0935 0 12.7717 0C12.4421 0 12.183 '
            '0.26686 12.183 0.58866V2.61364C12.183 2.8491 12.3243 3.04532 12.5205 3.1395C12.4499 3.17875 12.3636 3.20229 12.2772 '
            '3.20229C11.9476 3.20229 11.6886 2.93544 11.6886 2.61364V1.46772C11.6886 1.38102 11.6183 1.31074 11.5316 1.31074H7.65431V0.58866'
            'C7.65431 0.26686 7.38746 0 7.06566 0C6.73601 0 6.477 0.26686 6.477 0.58866V2.61364C6.477 2.8491 6.61828 3.04532 6.8145 '
            '3.1395C6.74386 3.17875 6.65752 3.20229 6.57119 3.20229C6.24154 3.20229 5.98253 2.93544 5.98253 2.61364V1.55506C5.98253 '
            '1.45935 5.8975 1.38571 5.8034 1.40319C4.02935 1.73272 3 3.01645 3 4.98396V11.3807C3 13.7118 4.41278 15.1089 6.7674 '
            '15.1089H12.7403C15.0949 15.1089 16.4999 13.7353 16.4999 11.4278V4.98396C16.5077 3.87729 16.1702 2.95113 15.5345 2.31538Z"/></svg>')
CHEV = {d: (f'<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
            f'stroke-linecap="round" stroke-linejoin="round"><path d="{p}"/></svg>')
        for d, p in (("prev", "m15 6-6 6 6 6"), ("next", "m9 6 6 6-6 6"))}


def routine_page():
    """ক্লাস রুটিন (live /student/routine): week strip, then the picked day's classes and tests.
    Filled by routine.js; the calendar button opens the month view."""
    return f'''<main class="subpage-main rt-main" data-routine>
      <p class="rt-lead">তোমার প্রতিদিনের রুটিন দেখে নাও</p>
      <div class="rt-bar">
        <h2 class="rt-month" data-month aria-live="polite"></h2>
        <button type="button" class="rt-icon-btn" data-week-step="-1" aria-label="আগের সপ্তাহ">{CHEV["prev"]}</button>
        <button type="button" class="rt-icon-btn" data-week-step="1" aria-label="পরের সপ্তাহ">{CHEV["next"]}</button>
        <a href="calendar.html" data-route="calendar" class="rt-icon-btn rt-cal-btn" aria-label="রুটিন ক্যালেন্ডার">{CAL_ICON}</a>
      </div>
      <div class="rt-week" data-week role="group" aria-label="সপ্তাহের দিন"></div>
      <section class="rt-list" data-day-list aria-live="polite"></section>
    </main>'''


def calendar_page():
    """রুটিন ক্যালেন্ডার (live /student/calendar): month grid of classes, academic program or other
    courses. Filled by routine.js; tapping a class opens its details, tapping a date opens that day."""
    return f'''<main class="subpage-main cal-main" data-calendar>
      <div class="cal-bar">
        <button type="button" class="cal-arrow" data-month-step="-1" aria-label="আগের মাস">{CHEV["prev"]}</button>
        <h2 class="cal-month" data-month aria-live="polite"></h2>
        <button type="button" class="cal-arrow" data-month-step="1" aria-label="পরের মাস">{CHEV["next"]}</button>
      </div>
      <div class="cal-source" role="radiogroup" aria-label="কোন রুটিন" data-source>
        <button type="button" class="cal-radio" role="radio" aria-checked="true" value="program">একাডেমিক প্রোগ্রাম</button>
        <button type="button" class="cal-radio" role="radio" aria-checked="false" tabindex="-1" value="other">অন্যান্য কোর্স</button>
      </div>
      <div data-grid></div>
    </main>'''


def quiz_page():
    """প্র্যাকটিস কুইজ builder (Figma 180:18267): subjects -> chapters & topics -> question count ->
    summary sheet -> the quiz (exam.html?type=quiz). Steps are drawn by quiz.js."""
    return '''<main class="qz" data-quiz>
      <div class="qz-progress" role="progressbar" aria-label="কুইজ তৈরির ধাপ" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-qz-bar></i></div>
      <div class="qz-body" data-qz-body></div>
      <div class="qz-foot" data-qz-foot></div>
    </main>'''


def live_page():
    """Live class portal (shikho-bkash reference). Dark room under the bKash app bar: class title with
    the LIVE badge, the stream, viewer line, chat and the message box. Behaviour in live.js."""
    return '''<main class="live" data-live>
      <header class="live-head">
        <div class="live-title"><b>রসায়ন আমাদের জীবনে রসায়ন Live Class</b><small>রসায়ন · Sourav Saha</small></div>
        <span class="live-badge"><i aria-hidden="true"></i>LIVE</span>
      </header>
      <div class="live-video">
        <video src="assets/live-class/live-class.webm" poster="assets/live-class/live-class-poster.jpg" muted loop playsinline preload="none" aria-label="লাইভ ক্লাস ভিডিও"></video>
      </div>
      <p class="live-meta" data-live-meta></p>
      <div class="live-chat" data-live-chat role="log" aria-label="লাইভ চ্যাট"></div>
      <button type="button" class="live-jump" data-live-jump hidden>নতুন মেসেজ
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
      </button>
      <form class="live-compose" data-live-form>
        <div class="live-to">পাঠাও
          <button type="button" class="live-to-chip" data-live-to aria-label="কাকে পাঠাবে: শিক্ষক">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/></svg>
            <span data-live-to-label>শিক্ষক</span>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 13 13" fill="none"><path d="M4.875 9.75 8.125 6.5 4.875 3.25" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="live-row">
          <label class="live-input">
            <span class="sr-only">মেসেজ</span>
            <input name="msg" type="text" autocomplete="off" maxlength="200" placeholder="মেসেজ লেখো…">
            <button class="live-send" type="submit" aria-label="পাঠাও" disabled>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 4.5 21 12 4 19.5l2.5-7.5L4 4.5Z"/><path d="M6.5 12H12"/></svg>
            </button>
          </label>
          <button type="button" class="live-tool" data-live-hand aria-pressed="false" aria-label="হাত তোলো">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10.5v-6a1.5 1.5 0 0 1 3 0V11"/><path d="M14 10V6a1.5 1.5 0 0 1 3 0v7"/><path d="M8 11.5V9.5a1.5 1.5 0 0 0-3 0V14a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6v-4.5a1.5 1.5 0 0 0-3 0"/></svg>
          </button>
          <button type="button" class="live-tool" data-route="liveMenu" aria-label="আরও অপশন">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h14"/></svg>
          </button>
        </div>
      </form>
    </main>'''
