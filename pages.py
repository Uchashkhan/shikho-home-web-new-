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
    """Pink app bar on every page (reference: shikho-bkash .appbar): back arrow + centred title.
    optional_back: the homepage only shows the arrow when there is a page to go back to."""
    extra = " data-back-optional hidden" if optional_back else ""
    return f'''<div class="appbar">
      <a href="{back}" class="appbar-back" data-back{extra} aria-label="ফিরে যাও">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H4"/><path d="m10 6-6 6 6 6"/></svg>
      </a>
      <h1 class="appbar-title"{' translate="no"' if title.startswith("Shikho") else ""}>{e(title)}</h1>
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
    d = data("courses.json")
    cards = "\n        ".join(course_card(c) for c in d["courses"])
    return f'''<main class="subpage-main">
      <p class="page-lead">{e(d["title"])}</p>
      <div class="course-list">
        {cards}
      </div>
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
    """Fixed strip at the top of the homepage that switches between the free and paid
    student views in place (main.js, [data-plan-set]). Not part of the product UI."""
    return '''<!-- Prototype switch (not part of the product UI) -->
<style>
  /* A slim strip fixed to the top of the mobile column; the page is pushed down by its height */
  :root { --rs-h: 44px; }
  /* the strip covers the notch area, so the pink bar below it needs no safe-area padding */
  body { padding-top: calc(var(--rs-h) + env(safe-area-inset-top)); }
  .page-nav { top: calc(var(--rs-h) + env(safe-area-inset-top)); height: var(--appbar-h); } /* pink app bar sticks just below this strip */
  .page-nav .appbar { height: var(--appbar-h); padding-top: 0; }
  .page-nav .appbar-back { top: 0; }
  .review-switch { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: min(100vw, var(--page-width, 412px)); height: calc(var(--rs-h) + env(safe-area-inset-top)); padding-top: env(safe-area-inset-top) !important; z-index: 90; display: flex; align-items: center; justify-content: center; padding: 0 8px; background: #202020; font-family: 'Inter Tight', 'Noto Sans Bengali', sans-serif; }
  .rs-seg { display: flex; padding: 2px; border-radius: 999px; background: rgba(255,255,255,0.1); }
  .rs-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 52px; height: 32px; padding: 0 10px; border: 0; border-radius: 999px; background: none; color: #DDDDDD; font: 600 12px/32px 'Inter Tight', 'Noto Sans Bengali', sans-serif; cursor: pointer; touch-action: manipulation; }
  .rs-btn[aria-pressed="true"] { background: #fff; color: #202020; cursor: default; }
  .rs-btn:focus-visible { outline: 2px solid #E2136E; outline-offset: 2px; }
</style>
<div class="review-switch">
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
