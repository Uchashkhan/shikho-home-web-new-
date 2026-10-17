"""Templates for the pages behind the homepage links (built by build.py).

Content comes from the live app (app.shikho.dev / ai.shikho.com), collected into data/*.json.
Markup reuses the homepage's design system: white 20px-radius cards, the subject chip
style, Noto Sans Bengali type scale and the existing button colours.
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
F = "font-['Noto_Sans_Bengali']"
CARD = ("bg-white drop-shadow-[0px_1px_0.5px_rgba(0,0,0,0.04),0px_3px_1.5px_rgba(0,0,0,0.04),"
        "0px_24px_12px_rgba(0,0,0,0.04)] rounded-[20px]")
e = lambda s: html.escape(s or "", quote=True)


def data(name):
    return json.load(open(os.path.join(ROOT, "data", name), encoding="utf-8"))


PLAY = ('<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="#fff">'
        '<path d="M4 2.5v9a.6.6 0 0 0 .9.5l7.2-4.5a.6.6 0 0 0 0-1L4.9 2a.6.6 0 0 0-.9.5Z"/></svg>')
CHEVRON = ('<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
           'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>')


def subpage_bar(title, back="index.html"):
    """Sticky top bar for inner pages: back + title (replaces the homepage intro header)."""
    return f'''<div class="subpage-bar">
      <a href="{back}" class="subpage-back" data-back aria-label="ফিরে যাও">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
      </a>
      <h1 class="subpage-title">{e(title)}</h1>
    </div>'''


# ---------- Video list ("আরো দেখো" pages) ----------

def video_card(v):
    subject = (f'<span class="tag-pill">{e(v["subject"])}</span>' if v.get("subject") else "")
    return f'''<a href="#" class="video-card" data-route="video" data-subject="{e(v.get("subject") or "")}">
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
    cards = "\n        ".join(video_card(v) for v in d["videos"])
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
            <h2 class="course-title">{e(c["title"])}</h2>
            <p class="course-days">কোর্সের মেয়াদ {e(c["days"])} দিন</p>
          </div>
          <div class="course-foot">
            <span class="course-price-wrap">{price(c)}</span>
            <a {route} class="btn-primary">বিস্তারিত</a>
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
        <h3 class="detail-heading">ফিচারসমূহ</h3>
        <div class="flex flex-wrap gap-[8px]"><span class="tag-pill tag-pill--lg">Animated</span><span class="tag-pill tag-pill--lg">Course</span></div>
      </section>

      <section id="mentors" class="{CARD} detail-card">
        <h3 class="detail-heading">আমাদের মেন্টর</h3>
        <div class="flex flex-col gap-[16px]">
            {"".join(mentor(*m) for m in mentors)}
        </div>
      </section>

      <section id="syllabus" class="{CARD} detail-card">
        <h3 class="detail-heading">কোর্সের সিলেবাস</h3>
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
        <h3 class="detail-heading">কোর্সের বিস্তারিত</h3>
        <p class="detail-text">Animated course for SSC students</p>
      </section>

      <a href="#" class="{CARD} detail-card payment-help" data-route="paymentVideo">
        <span class="payment-video"><img src="assets/live/admission-video-play.jpg" alt="" width="1270" height="720" loading="lazy"><span class="video-play">{PLAY}</span></span>
        <span class="detail-heading">ভর্তির পেমেন্ট করবে কীভাবে?</span>
        <span class="detail-text">শিখো'র কোর্সে ভর্তির জন্য কীভাবে পেমেন্ট করবে, তা জানতে ভিডিওটি দেখে নাও</span>
      </a>

      <section>
        <h3 class="detail-heading px-[2px]">লেটেস্ট কোর্স</h3>
        <div class="course-row h-scroll">
          {latest_cards}
        </div>
      </section>

      <div class="enroll-bar">
        <span class="course-price-wrap"><span class="enroll-label">কোর্সের মূল্য</span>{price(c)}</span>
        <a href="#" class="btn-enroll" data-route="enroll">কোর্সে ভর্তি হও</a>
      </div>
    </main>'''


# ---------- Shikho AI tab (content from ai.shikho.com) ----------

def ai_page():
    packages = [
        ("লঞ্চ", "ফ্রি", "১০ দিনের মেয়াদ", "প্রতিদিন ১টি প্রশ্ন", "ফ্রিতে শুরু করো", False),
        ("স্টার্টার", "৳৪৯", "৩ দিনের মেয়াদ", "আনলিমিটেড প্রশ্ন", "এখনই কিনে নাও", False),
        ("বুস্ট", "৳৭৯", "৭ দিনের মেয়াদ", "আনলিমিটেড প্রশ্ন", "এখনই কিনে নাও", False),
        ("প্রো", "৳২৭৯", "৩০ দিনের মেয়াদ", "আনলিমিটেড প্রশ্ন", "এখনই কিনে নাও", True),
        ("এলিট", "৳৭৪৯", "৯০ দিনের মেয়াদ", "আনলিমিটেড প্রশ্ন", "এখনই কিনে নাও", False),
    ]
    tick = ('<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" '
            'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>')
    def pkg(name, price, days, q, cta, popular):
        feats = "".join(f"<li>{tick}{e(t)}</li>" for t in (days, q, "AI মডেল: Shikho AI Pro", "ছবি আপলোড করে প্রশ্ন"))
        badge = '<span class="pkg-badge">মোস্ট পপুলার</span>' if popular else ""
        return f'''<article class="{CARD} pkg{" pkg--popular" if popular else ""}">
            <div class="pkg-head"><span class="pkg-name">{e(name)}</span>{badge}</div>
            <p class="pkg-price">{e(price)}</p>
            <ul class="pkg-feats">{feats}</ul>
            <a href="#" class="{"btn-ai" if popular else "btn-secondary"}" data-route="aiPackage">{e(cta)}</a>
          </article>'''
    faq = [
        ("Shikho AI কী?", "Shikho AI বাংলাদেশের প্রথম NCTB'র কারিকুলাম অনুযায়ী বিষয়ভিত্তিক শিক্ষা সহায়ক কৃত্রিম বুদ্ধিমত্তা (AI), যা একাডেমিক যেকোনো প্রশ্নের সহজ ও দ্রুত সমাধান দেয়।"),
        ("কী ধরনের প্রশ্ন করা যায়?", "NCTB সিলেবাস অনুযায়ী বিষয়ভিত্তিক যেকোনো প্রশ্নের উত্তর দেয়। আপাতত গণিত, পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান ও ইংরেজির প্রশ্নের উত্তর সম্পূর্ণ বাংলায় দিচ্ছে। আগামীতে নতুন নতুন বিষয় যুক্ত করা হবে।"),
        ("Shikho AI শুধু উত্তর দেয়, নাকি আরও কিছু?", "শুধু উত্তরই দেয় না, বরং সহজভাবে ব্যাখ্যা, উদাহরণসহ উত্তর, শর্টকাট মেথড, সবই বলে দেয় পুরোপুরি বাংলায়। প্রতিটা প্রশ্নের ক্ষেত্রে ১০টি করে কনভার্সেশন করতে পারবে।"),
        ("Shikho AI কি সবসময় ১০০% সঠিক উত্তর দেয়?", "Shikho AI চেষ্টা করে সর্বোচ্চ সঠিক, বাংলাদেশি কারিকুলামভিত্তিক উত্তর দিতে। তবে যেহেতু এটি একটি AI টুল, মাঝে মাঝে ভুল বা অসম্পূর্ণ উত্তর আসতে পারে। উত্তর ভুল মনে হলে উত্তরের পাশে থাকা “ডাউনভোট” বাটনে ট্যাপ করো।"),
        ("Shikho AI ব্যবহারের জন্য কি আলাদা ফি দিতে হয়?", "হ্যাঁ, এটি একটি সাবস্ক্রিপশনভিত্তিক সার্ভিস। আনলিমিটেড প্রশ্নের জন্য ৩ দিন, ৭ দিন, ১ মাস ও ৩ মাসের প্যাকেজ আছে। বিকাশ, নগদ, রকেট কিংবা যেকোনো ডেবিট/ক্রেডিট কার্ড দিয়ে পেমেন্ট করা যায়।"),
        ("আমার তথ্য কি নিরাপদ?", "ছবির তথ্য ও প্রশ্ন নিরাপদ সার্ভারে থাকে, পরে মুছে ফেলা হয়। কোনো তৃতীয় পক্ষের সঙ্গে তথ্য শেয়ার করা হয় না।"),
    ]
    faqs = "\n        ".join(f'<details class="faq"><summary>{e(q)}{CHEVRON}</summary><p>{e(a)}</p></details>' for q, a in faq)
    steps = [("লিখে প্রশ্ন করো", "বাংলায়, ইংরেজিতে অথবা Banglish-এ টাইপ করে"),
             ("ছবি তুলে আপলোড করো", "বই বা খাতায় লেখা প্রশ্নের স্পষ্ট ছবি"),
             ("সেকেন্ডেই উত্তর পাও", "ব্যাখ্যা ও উদাহরণসহ, সম্পূর্ণ বাংলায়")]
    step_html = "\n          ".join(
        f'<li class="ai-step"><span class="ai-step-no">{n}</span><span><span class="ai-step-title">{e(t)}</span><span class="ai-step-sub">{e(s)}</span></span></li>'
        for n, (t, s) in zip("১২৩", steps))
    subjects = "".join(f'<span class="tag-pill tag-pill--lg">{s}</span>' for s in ("গণিত", "পদার্থবিজ্ঞান", "রসায়ন", "জীববিজ্ঞান", "ইংরেজি"))
    return f'''<main class="subpage-main ai-page">
      <section class="ai-hero">
        <img class="ai-hero-deco" src="assets/feat-ai-deco.svg" alt="" width="60" height="116">
        <div class="flex gap-[6px] items-center" role="img" aria-label="Shikho AI">
          <img src="assets/feat-ai-logo.svg" alt="" width="32" height="32">
          <img src="assets/feat-ai-wordmark.svg" alt="" width="71" height="12" class="mt-[6px]">
        </div>
        <p class="ai-hero-title">প্রশ্ন? থাকতেই পারে!<br>উত্তর? সেকেন্ডেই!</p>
        <p class="ai-hero-sub">দেশের প্রথম সম্পূর্ণ বাংলায় AI; জাতীয় কারিকুলাম অনুযায়ী সকল প্রশ্নের ইনস্ট্যান্ট উত্তর।</p>
        <div class="flex gap-[8px]">
          <a href="#" class="ai-hero-cta" data-route="aiChat">ফ্রি'তে ট্রাই করো</a>
          <a href="#packages" class="ai-hero-cta ai-hero-cta--ghost">প্যাকেজ দেখো</a>
        </div>
      </section>

      <ul class="ai-stats">
        <li><b>৫,০০০+</b>শিক্ষার্থী যুক্ত</li>
        <li><b>১ লক্ষ+</b>প্রশ্নের সমাধান</li>
        <li><b>১০,০০০+</b>ছবি দিয়ে সমাধান</li>
      </ul>

      <section class="{CARD} detail-card">
        <h3 class="detail-heading">কীভাবে প্রশ্ন করবে?</h3>
        <ol class="ai-steps">
          {step_html}
        </ol>
        <p class="detail-sub detail-sub--gap">যেসব বিষয়ে প্রশ্ন করা যায়</p>
        <div class="flex flex-wrap gap-[8px] mt-[8px]">{subjects}</div>
      </section>

      <section id="packages">
        <h3 class="detail-heading px-[2px]">সহজ ও সাশ্রয়ী প্যাকেজ</h3>
        <p class="detail-sub detail-sub--lead px-[2px]">প্রয়োজন অনুযায়ী প্যাকেজ বেছে নাও। সব প্যাকেজেই আছে Shikho AI ব্যবহারের সুবিধা।</p>
        <div class="pkg-row h-scroll">
          {"".join(pkg(*p) for p in packages)}
        </div>
      </section>

      <section class="{CARD} detail-card">
        <h3 class="detail-heading">সচরাচর পাওয়া প্রশ্নসমূহ</h3>
        {faqs}
      </section>

      <p class="ai-help">যেকোনো সহায়তায় কল করো <a href="tel:16780">16780</a> (সকাল ৯টা - রাত ১০টা)</p>
    </main>'''


# ---------- Prototype review switch: OLD / NEW design and ফ্রি / পেইড student ----------

def review_switch(version, plan=None):
    """Floating switch shown on the homepage (version="new") and on old/free.html + old/paid.html.

    NEW homepage: ফ্রি/পেইড switch in place (main.js, [data-plan-set]); OLD opens the matching
    original screen. OLD screens: links between the originals; NEW opens the matching new view.
    Hidden when the page is shown inside compare.html (?embed).
    """
    pressed = lambda on: f'aria-pressed="{"true" if on else "false"}"'
    if version == "new":
        plans = ('<button type="button" class="rs-btn" data-plan-set="free">ফ্রি</button>'
                 '<button type="button" class="rs-btn" data-plan-set="paid">পেইড</button>')
        versions = (f'<a class="rs-btn rs-old" href="old/free.html" data-rs-old {pressed(False)}>OLD</a>'
                    f'<span class="rs-btn rs-new" {pressed(True)}>NEW</span>')
    else:
        plans = (f'<a class="rs-btn" href="free.html" {pressed(plan == "free")}>ফ্রি</a>'
                 f'<a class="rs-btn" href="paid.html" {pressed(plan == "paid")}>পেইড</a>')
        versions = (f'<span class="rs-btn rs-old" {pressed(True)}>OLD</span>'
                    f'<a class="rs-btn rs-new" href="../index.html?{plan}" {pressed(False)}>NEW</a>')
    return f'''<!-- Prototype review switch (not part of the product UI) -->
<style>
  /* A slim strip fixed to the top of the mobile column; the page is pushed down by its height,
     and the old screens' sticky logo bar stays fixed just below it. It sits under the old burger menu. */
  :root {{ --rs-h: 44px; }}
  body {{ padding-top: var(--rs-h); }}
  .page-nav {{ top: var(--rs-h); }}
  .review-switch {{ position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: min(100vw, var(--page-width, 412px)); height: var(--rs-h); z-index: 90; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 8px; background: #222732; font-family: 'Noto Sans Bengali', sans-serif; }}
  .is-embedded body {{ padding-top: 0; }}
  .is-embedded .page-nav {{ top: 0; }}

  .rs-seg {{ display: flex; padding: 2px; border-radius: 999px; background: rgba(255,255,255,0.1); }}
  .rs-btn {{ display: inline-flex; align-items: center; justify-content: center; min-width: 52px; height: 32px; padding: 0 10px; border: 0; border-radius: 999px; background: none; color: #c9ccd3; font: 700 12px/32px 'Noto Sans Bengali', sans-serif; text-decoration: none; cursor: pointer; touch-action: manipulation; }}
  .rs-btn[aria-pressed="true"] {{ background: #fff; color: #222732; cursor: default; }}
  .rs-old[aria-pressed="true"] {{ background: #ffd7d7; }}
  .rs-new[aria-pressed="true"] {{ background: #d7f5df; }}
  .rs-btn:focus-visible {{ outline: 2px solid #e2008d; outline-offset: 2px; }}
  .is-embedded .review-switch {{ display: none; }}
</style>
<div class="review-switch" role="group" aria-label="প্রোটোটাইপ রিভিউ">
  <div class="rs-seg" role="group" aria-label="সংস্করণ">{versions}</div>
  <div class="rs-seg" role="group" aria-label="শিক্ষার্থী">{plans}</div>
</div>
<script>
  (function () {{
    if (new URLSearchParams(location.search).has('embed')) document.documentElement.classList.add('is-embedded');
    // NEW homepage: OLD opens the original screen for the plan currently shown
    var old = document.querySelector('[data-rs-old]');
    if (old) old.addEventListener('click', function (e) {{
      e.preventDefault();
      location.href = 'old/' + (document.documentElement.dataset.plan === 'paid' ? 'paid' : 'free') + '.html';
    }});
  }})();
</script>'''
