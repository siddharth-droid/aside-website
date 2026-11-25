"""Build film/index.html (the HyperFrames composition) from the narration's word times.

  python film/src/build.py

Every cue is pinned to a spoken word in src/words.json (from voice.py), so re-voicing the script re-times the film.
The cast is inlined from assets/cast/*.svg (exported from the site's cast.js).
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
FILM = HERE.parent
WORDS = json.loads((HERE / "words.json").read_text(encoding="utf-8"))


def W(word, n=1, at="start"):
    """Time of the n-th occurrence of a spoken word (case and punctuation ignored)."""
    k = 0
    for w in WORDS:
        if re.sub(r"[^a-z0-9']", "", w["word"].lower()) == word.lower():
            k += 1
            if k == n:
                return round(w[at], 3)
    raise KeyError(f"{word} #{n}")


END_VOICE = WORDS[-1]["end"]
DUR = round(END_VOICE + 2.3, 2)


def svg(name):
    s = (FILM / "assets" / "cast" / f"{name}.svg").read_text(encoding="utf-8")
    return s.replace("<svg ", '<svg class="face" ', 1)


def clip(id, start, end, inner, cls="", style="", z=1):
    return (f'<div id="{id}" class="clip piece {cls}" data-start="{start:.3f}" data-duration="{max(0.05, end - start):.3f}" '
            f'data-track-index="1" style="z-index:{z};{style}"><div class="in" id="{id}-in">{inner}</div></div>')


# ---------- times ----------
T = {
    "tag": W("nine"), "sam": W("sam"), "circle": W("sentence"),
    "copy": W("copy"), "browser": W("open"), "tabs": W("find"), "paste": W("paste"), "explain": W("explain"),
    "wait": W("wait"), "answer": W("copy", 2), "switch": W("switch"), "findplace": W("find", 2),
    "eight": W("eight"), "two": W("two"),
    "rip": W("same"), "morning": W("morning"),
    "select": W("select"), "press": W("press"), "trigger": W("trigger"), "rewrite": W("rewrite"), "putback": W("put"),
    "three": W("three"), "sam2": W("sam", 2),
    "ade": W("ade's"), "explained": W("explained"), "tom": W("tom's"), "translated": W("translated"),
    "same3": W("same", 3), "three2": W("three", 2), "keys2": W("keys", 2),
    "keep": W("keep"), "ask": W("ask"),
}
ACT1_END = T["rip"] + 0.55     # the old way is torn off by here
ACT2_END = T["ade"] + 0.45     # Sam's board leaves
ACT3_END = T["keep"] + 0.35

pieces = []
add = pieces.append

# ---------- Act 1: the hook and the old way ----------
add(clip("tag", T["tag"], DUR, '<span>09:12</span>', "tag", "left:120px;top:96px;", 5))
add(clip("mail", 0, ACT2_END, f'''
  <div class="mail__head"><b>To</b> Marta Lindqvist <i>·</i> Re: Thursday's launch review</div>
  <p>Thanks for sending the deck over.</p>
  <p class="mail__sent"><span id="sentOld" class="sent"><span id="selBar" class="selbar"></span>Per my last email, the copy deadline was Monday and we still don't have the final pricing page.</span><span id="sentNew" class="sent sent--new">The copy deadline was Monday, and we're still waiting on the final pricing page. Could we have it by Wednesday?</span></p>
  <svg id="ring" class="ring" viewBox="0 0 900 220" preserveAspectRatio="none"><path d="M60 120 C40 40 300 12 520 20 C760 28 880 60 860 130 C840 200 560 214 330 206 C140 198 40 176 70 104" /></svg>''',
    "mail torn", "left:120px;top:250px;width:930px;", 4))
add(clip("sam", T["sam"], ACT2_END,
    f'<div class="sticker sam-n">{svg("sam-neutral")}</div><div class="sticker sam-f">{svg("sam-frustrated")}</div><div class="sticker sam-r">{svg("sam-relieved")}</div>',
    "cast", "left:140px;top:545px;width:330px;", 6))

browser = f'''<div class="br__bar"><i></i><i></i><i></i><span class="br__url"></span></div>
  <div class="br__tabs"><span></span><span></span><span class="is-on"></span><span></span><span></span><span></span></div>
  <div class="br__chat">
    <div id="chatIn" class="br__in"><span id="chatPaste">Per my last email, the copy deadline was Monday and we still don't have the final pricing page.</span> <span id="chatExplain">It's to Marta. Make it less passive-aggressive?</span></div>
    <div id="chatWait" class="br__wait"><i></i><i></i><i></i></div>
    <div id="chatAns" class="br__ans">The copy deadline was Monday, and we're still waiting on the final pricing page. Could we have it by Wednesday?</div>
  </div>'''
add(clip("browser", T["browser"], ACT1_END, browser, "browser torn", "left:1100px;top:230px;width:700px;height:600px;", 7))
add(clip("tabring", T["tabs"] + 0.2, ACT1_END, '<svg viewBox="0 0 160 70"><path d="M14 38 C10 10 130 4 148 30 C160 56 40 70 18 50"/></svg>', "tabring", "left:1290px;top:300px;width:170px;", 9))
add(clip("copy1", T["copy"], ACT1_END, '<span class="key">Ctrl</span><span class="key">C</span>', "keys", "left:780px;top:520px;", 8))
add(clip("copy2", T["answer"], ACT1_END, '<span class="key">Ctrl</span><span class="key">C</span>', "keys", "left:1500px;top:720px;", 9))
add(clip("stamp1", T["browser"] + 0.25, ACT1_END, '<span>app switch</span>', "stamp", "left:1080px;top:210px;", 11))
add(clip("stamp2", T["switch"], ACT1_END, '<span>app switch</span>', "stamp", "left:700px;top:215px;", 11))
add(clip("arrow1", T["browser"] + 0.1, ACT1_END, '<svg viewBox="0 0 300 160"><path class="draw" d="M10 140 C80 20 200 10 290 60"/><path class="head" d="M262 44 L292 62 L258 76"/></svg>', "arrow", "left:880px;top:110px;width:300px;", 10))
add(clip("arrow2", T["switch"] + 0.1, ACT1_END, '<svg viewBox="0 0 300 160"><path class="draw" d="M290 20 C220 150 100 160 10 110"/><path class="head" d="M40 92 L10 110 L44 126"/></svg>', "arrow", "left:900px;top:600px;width:300px;", 10))
add(clip("lens", T["findplace"], ACT1_END, '<svg viewBox="0 0 120 120"><circle cx="50" cy="50" r="36"/><path d="M76 76 L112 112"/></svg>', "lens", "left:300px;top:380px;width:150px;", 12))
add(clip("counter", T["copy"], ACT1_END, '<span class="counter__l">step</span><span id="cnt" class="counter__n">01</span><span class="counter__of">/08</span>', "counter", "left:1480px;top:96px;", 12))
add(clip("dim", T["eight"] - 0.1, ACT1_END, "", "dim", "left:0;top:0;width:1920px;height:1080px;", 13))
add(clip("big8", T["eight"], ACT1_END, '<span class="r r--ink">8 steps</span>', "ransom", "left:420px;top:330px;", 14))
add(clip("big2", T["two"], ACT1_END, '<span class="r r--red">2 app switches</span>', "ransom", "left:700px;top:560px;", 14))

# ---------- Act 2: same morning, with Aside ----------
add(clip("orb", T["press"], ACT2_END,
    '<img id="orbIdle" src="assets/orb/orb-idle-left.png" alt=""><img id="orbThink" src="assets/orb/orb-thinking.png" alt=""><img id="orbHappy" src="assets/orb/orb-happy.png" alt="">',
    "orb", "left:1440px;top:120px;width:560px;height:560px;", 8))
add(clip("panel", T["rewrite"], T["putback"] + 0.5, '''<span class="panel__q">Rewrite the selection</span>
  <b>The copy deadline was Monday, and we're still waiting on the final pricing page.</b><span class="panel__b">Could we have it by Wednesday?</span>
  <span class="panel__acts"><i>Copy</i><i class="on">Replace selection</i></span>''', "panel", "left:1130px;top:420px;width:640px;", 9))
add(clip("k1", T["trigger"], ACT2_END, '<span class="key">Alt</span><b>+</b><span class="key">Mouse 5</span>', "keys keys--big", "left:540px;top:690px;", 8))
add(clip("k2", T["rewrite"], ACT2_END, '<span class="key">Ctrl</span><span class="key">R</span>', "keys keys--big", "left:950px;top:690px;", 8))
add(clip("k3", T["putback"], ACT2_END, '<span class="key">Ctrl</span><span class="key">Enter</span>', "keys keys--big", "left:1210px;top:690px;", 8))
add(clip("three", T["three"], ACT2_END, '<span class="r r--yellow">3 keys.</span>', "ransom", "left:600px;top:830px;", 9))

# ---------- Act 3: Ade and Tom ----------
add(clip("ade", T["ade"], ACT3_END, f'''<div class="echo__who">{svg("ade-thinking")}</div><div class="echo__who echo__who--done">{svg("ade-surprised")}</div>
  <p class="echo__t">11:40 · Ade</p>
  <p class="echo__code">Uncaught TypeError: Cannot read properties of undefined (reading 'map')</p>
  <div class="echo__ans" id="adeAns"><b>items is undefined the first time the list draws.</b> Start from an empty list: useState([]).</div>
  <div class="keys echo__keys" id="adeKeys"><span class="key">Alt</span><b>+</b><span class="key">Mouse 5</span><span class="key">Enter</span><span class="key">Ctrl Shift C</span></div>''',
    "echo torn", "left:110px;top:220px;width:820px;", 6))
add(clip("tom", T["tom"], ACT3_END, f'''<div class="echo__who">{svg("tom-frustrated")}</div><div class="echo__who echo__who--done">{svg("tom-happy")}</div>
  <p class="echo__t">17:30 · Tom</p>
  <p class="echo__de" lang="de">Ihr Antrag wurde eingereicht. Bitte laden Sie innerhalb von 14 Tagen eine Kopie Ihres Ausweises hoch.</p>
  <div class="echo__ans" id="tomAns"><b>Your application was submitted.</b> Please upload a copy of your ID within 14 days.</div>
  <div class="keys echo__keys" id="tomKeys"><span class="key">Alt</span><b>+</b><span class="key">Mouse 5</span><span class="key">Ctrl T</span><span class="key">Ctrl Shift C</span></div>''',
    "echo torn", "left:990px;top:250px;width:820px;", 6))

# ---------- Act 4: the line ----------
add(clip("keep", T["keep"], DUR, '<span class="r r--ink">Keep</span> <span class="r r--yellow">working.</span>', "ransom ransom--end", "left:150px;top:300px;", 10))
add(clip("askaside", T["ask"], DUR, '<span class="r r--red">Ask</span> <span class="r r--blue">Aside.</span>', "ransom ransom--end", "left:190px;top:500px;", 10))
add(clip("dl", T["ask"] + 0.6, DUR, '<span>Free for Windows · bring your own key</span>', "dl", "left:200px;top:760px;", 10))
add(clip("orbEnd", T["ask"] + 0.15, DUR, '<img src="assets/orb/orb-happy.png" alt="">', "orbend", "left:1080px;top:180px;width:840px;height:840px;", 9))

# ---------- sound ----------
SFX = [("slap", T["tag"]), ("slap", T["sam"]), ("marker", T["circle"]), ("key", T["copy"]), ("whoosh", T["browser"]),
       ("slap", T["browser"] + 0.25), ("key", T["paste"]), ("key", T["answer"]), ("slap", T["switch"]), ("whoosh", T["findplace"]),
       ("slap", T["eight"]), ("slap", T["two"]), ("rip", T["rip"]), ("slap", T["morning"]), ("whoosh", T["press"]),
       ("key", T["trigger"]), ("key", T["rewrite"]), ("key", T["putback"]), ("slap", T["three"]), ("whoosh", T["ade"]),
       ("slap", T["explained"]), ("whoosh", T["tom"]), ("slap", T["translated"]), ("key", T["three2"]), ("key", T["keys2"]),
       ("slap", T["keep"]), ("slap", T["ask"])]
audio = [f'<audio id="vo" class="clip" src="assets/voice.mp3" data-start="0" data-duration="{END_VOICE + 0.3:.3f}" data-track-index="20" data-volume="1"></audio>',
         f'<audio id="bgm" class="clip" src="assets/bgm/track.wav" data-start="0" data-duration="{DUR:.3f}" data-track-index="21" data-volume="0.14" data-fade-out="1.5"></audio>']
ext = {"slap": "mp3", "rip": "mp3", "key": "mp3", "marker": "mp3", "whoosh": "mp3"}
LEN = {"slap": 0.4, "rip": 0.4, "key": 0.45, "marker": 0.85, "whoosh": 1.4}
for i, (name, t) in enumerate(SFX):
    vol = {"whoosh": 0.35, "key": 0.6, "slap": 0.55, "rip": 0.8, "marker": 0.6}[name]
    audio.append(f'<audio id="sfx{i:02d}" class="clip" src="assets/sfx/{name}.{ext[name]}" data-start="{t:.3f}" data-duration="{LEN[name]}" data-track-index="{22 + i % 3}" data-volume="{vol}"></audio>')

# ---------- the timeline script ----------
script = f"""
const T = {json.dumps(T)};
const tl = gsap.timeline({{ paused: true }});
const $ = (s) => document.querySelector(s);
const slap = (sel, t, rot = 0) => tl.fromTo(sel + "-in", {{ scale: 1.14, rotation: rot + 5, opacity: 0 }}, {{ scale: 1, rotation: rot, opacity: 1, duration: 0.23, ease: "back.out(2.2)" }}, t);
const tear = (sels, t) => sels.forEach((s, i) => tl.to(s + "-in", {{ x: 2100, y: -80 + i * 12, rotation: 18 + i * 3, duration: 0.45, ease: "power3.in" }}, t + i * 0.067));
const punch = (sel, t) => {{ tl.to(sel, {{ scale: 1.25, duration: 0.04 }}, t); tl.to(sel, {{ scale: 1, duration: 0.22, ease: "back.out(3)" }}, t + 0.04); }};
const swap = (show, hide, t) => {{ tl.set(show, {{ opacity: 1 }}, t); tl.set(hide, {{ opacity: 0 }}, t); }};

// resting angles for every piece (paper is never square)
const rest = {{ "#tag": -4, "#mail": -1, "#sam": 2, "#browser": 2.5, "#copy1": -6, "#copy2": 5, "#stamp1": -9, "#stamp2": 7, "#counter": 3, "#big8": -3, "#big2": 2,
  "#panel": -1.5, "#k1": -3, "#k2": 4, "#k3": -2, "#three": -4, "#ade": -1.5, "#tom": 1.8, "#keep": -2, "#askaside": 2, "#dl": -1 }};

// Act 1
slap("#tag", T.tag, rest["#tag"]);
tl.set("#mail-in", {{ rotation: rest["#mail"] }}, 0);
slap("#sam", T.sam, rest["#sam"]);
tl.fromTo("#ring path", {{ strokeDashoffset: 2400 }}, {{ strokeDashoffset: 0, duration: 0.75, ease: "power1.inOut" }}, T.circle);
tl.to("#ring", {{ opacity: 0, duration: 0.2 }}, T.copy - 0.3);
slap("#copy1", T.copy, rest["#copy1"]);
slap("#counter", T.copy, rest["#counter"]);
slap("#browser", T.browser, rest["#browser"]);
tl.fromTo("#arrow1 .draw", {{ strokeDashoffset: 600 }}, {{ strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }}, T.browser + 0.1);
tl.fromTo("#arrow1 .head", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.05 }}, T.browser + 0.4);
slap("#stamp1", T.browser + 0.25, rest["#stamp1"]);
tl.fromTo("#tabring path", {{ strokeDashoffset: 500 }}, {{ strokeDashoffset: 0, duration: 0.4 }}, T.tabs + 0.2);
tl.fromTo("#chatPaste", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.08 }}, T.paste);
tl.fromTo("#chatExplain", {{ clipPath: "inset(0 100% 0 0)" }}, {{ clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "none" }}, T.explain);
tl.fromTo("#chatWait", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.05 }}, T.wait);
tl.fromTo("#chatWait i", {{ y: 0 }}, {{ y: -10, duration: 0.15, stagger: 0.1, yoyo: true, repeat: 3, ease: "sine.inOut" }}, T.wait);
tl.to("#chatWait", {{ opacity: 0, duration: 0.05 }}, T.answer - 0.05);
tl.fromTo("#chatAns", {{ opacity: 0, y: 12 }}, {{ opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }}, T.answer - 0.05);
slap("#copy2", T.answer, rest["#copy2"]);
slap("#stamp2", T.switch, rest["#stamp2"]);
tl.fromTo("#arrow2 .draw", {{ strokeDashoffset: 600 }}, {{ strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }}, T.switch + 0.1);
tl.fromTo("#arrow2 .head", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.05 }}, T.switch + 0.4);
tl.fromTo("#lens-in", {{ x: 0, opacity: 0 }}, {{ x: 420, opacity: 1, duration: 0.9, ease: "sine.inOut" }}, T.findplace);
swap(".sam-f", ".sam-n", T.wait);
const steps = [T.copy, T.browser, T.tabs, T.paste, T.wait, T.answer, T.switch, T.findplace];
steps.forEach((t, i) => {{ tl.set("#cnt", {{ textContent: String(i + 1).padStart(2, "0") }}, t); tl.fromTo("#cnt", {{ scale: 1.3 }}, {{ scale: 1, duration: 0.18, ease: "back.out(3)" }}, t); }});
tl.fromTo("#dim-in", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.15 }}, T.eight - 0.1);
slap("#big8", T.eight, rest["#big8"]);
slap("#big2", T.two, rest["#big2"]);
// the rip: everything from the old way tears off to the right
tear(["#big2", "#big8", "#browser", "#stamp1", "#stamp2", "#counter", "#copy2", "#copy1", "#arrow1", "#arrow2", "#tabring", "#lens"], T.rip);
tl.to("#dim-in", {{ opacity: 0, duration: 0.25 }}, T.rip + 0.15);
swap(".sam-n", ".sam-f", T.rip + 0.3);
punch("#tag-in", T.morning);

// Act 2
tl.fromTo("#selBar", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.5, ease: "none" }}, T.select);
tl.fromTo("#orb-in", {{ x: 520 }}, {{ x: 0, duration: 0.55, ease: "power3.out" }}, T.press);
swap("#orbThink", "#orbIdle", T.rewrite);
slap("#k1", T.trigger, rest["#k1"]);
slap("#k2", T.rewrite, rest["#k2"]);
tl.fromTo("#panel-in", {{ scale: 0.3, opacity: 0, transformOrigin: "100% 0%" }}, {{ scale: 1, opacity: 1, rotation: rest["#panel"], duration: 0.35, ease: "power3.out" }}, T.rewrite + 0.1);
swap("#orbHappy", "#orbThink", T.rewrite + 0.55);
slap("#k3", T.putback, rest["#k3"]);
tl.to("#panel-in", {{ scale: 0.2, opacity: 0, duration: 0.3, ease: "power3.in" }}, T.putback + 0.12);
tl.set("#sentOld", {{ opacity: 0 }}, T.putback + 0.3);
tl.set("#sentNew", {{ opacity: 1 }}, T.putback + 0.3);
tl.fromTo("#sentNew", {{ backgroundColor: "rgba(79,196,187,0.45)" }}, {{ backgroundColor: "rgba(79,196,187,0.12)", duration: 1.6 }}, T.putback + 0.3);
slap("#three", T.three, rest["#three"]);
swap(".sam-r", ".sam-n", T.sam2);
// Sam's board slides out to the left, Ade's and Tom's slap in
tl.to(["#mail-in", "#sam-in", "#k1-in", "#k2-in", "#k3-in", "#three-in", "#tag-in"], {{ x: -1500, rotation: -12, duration: 0.42, ease: "power3.in", stagger: 0.03 }}, T.ade - 0.15);
tl.to("#orb-in", {{ x: 520, duration: 0.4, ease: "power3.in" }}, T.ade - 0.15);
tl.set("#tag-in", {{ x: 0, rotation: rest["#tag"] }}, T.ade + 0.4);
tl.set("#tag span", {{ textContent: "11:40" }}, T.ade + 0.4);
tl.set("#tag-in", {{ opacity: 1 }}, T.ade + 0.4); punch("#tag-in", T.ade + 0.4);
tl.set("#tag span", {{ textContent: "17:30" }}, T.tom);
punch("#tag-in", T.tom);

// Act 3
slap("#ade", T.ade, rest["#ade"]);
tl.fromTo("#adeAns", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }}, T.explained);
swap("#ade .echo__who--done", "#ade .echo__who:not(.echo__who--done)", T.explained);
slap("#tom", T.tom, rest["#tom"]);
tl.fromTo("#tomAns", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }}, T.translated);
swap("#tom .echo__who--done", "#tom .echo__who:not(.echo__who--done)", T.translated);
tl.fromTo("#adeKeys .key, #adeKeys b", {{ scale: 1.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.18, stagger: 0.08, ease: "back.out(3)" }}, T.three2);
tl.fromTo("#tomKeys .key, #tomKeys b", {{ scale: 1.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.18, stagger: 0.08, ease: "back.out(3)" }}, T.keys2);
tear(["#tom", "#ade", "#tag"], T.keep - 0.25);

// Act 4
slap("#keep", T.keep, rest["#keep"]);
slap("#askaside", T.ask, rest["#askaside"]);
tl.fromTo("#orbEnd-in", {{ y: 700 }}, {{ y: 0, duration: 0.9, ease: "power3.out" }}, T.ask + 0.15);
slap("#dl", T.ask + 0.6, rest["#dl"]);

// the board drifts closer through each act (a slow push, never while a line is read on its own)
tl.set("#board", {{ transformOrigin: "0% 20%" }}, 0);
tl.fromTo("#board", {{ scale: 1.45 }}, {{ scale: 1.52, duration: T.browser - 0.25, ease: "sine.inOut" }}, 0);
tl.to("#board", {{ scale: 1, duration: 0.6, ease: "power3.inOut" }}, T.browser - 0.25);
tl.to("#board", {{ scale: 1.03, duration: T.rip - T.browser - 0.4, ease: "sine.inOut" }}, T.browser + 0.35);
tl.to("#board", {{ scale: 1.42, duration: 0.7, ease: "power3.inOut" }}, T.rip + 0.45);
tl.to("#board", {{ scale: 1, duration: 0.55, ease: "power3.inOut" }}, T.press - 0.2);
tl.to("#board", {{ scale: 1.03, duration: T.ade - T.press - 0.5, ease: "sine.inOut" }}, T.press + 0.35);
tl.to("#board", {{ scale: 1, duration: 0.4, ease: "power2.out" }}, T.ade);

// paper boil: stickers shiver on twos, like hand-moved cut-outs
[["#sam .face", 0, {DUR}], ["#ade .face", T.ade, T.keep], ["#tom .face", T.tom, T.keep]].forEach(([sel, a, b]) => {{
  for (let t = a, k = 0; t < b; t += 0.267, k++) tl.set(sel, {{ rotation: [0, 0.7, -0.5, 0.3][k % 4], x: [0, 1, -1, 0][k % 4] }}, t);
}});

window.__timelines["main"] = tl;
tl.seek(0);
"""

html = (FILM / "src" / "template.html").read_text(encoding="utf-8")
html = html.replace("{{DUR}}", f"{DUR:.2f}").replace("{{PIECES}}", "\n".join(pieces)).replace("{{AUDIO}}", "\n".join(audio)).replace("{{SCRIPT}}", script)
(FILM / "index.html").write_text(html, encoding="utf-8")
print(f"index.html: {DUR:.2f}s, {len(pieces)} pieces, {len(SFX)} sound cues")
