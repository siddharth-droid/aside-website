// Aside website. Every answer on this page is prewritten for the demo.
import { createOrb3D, hasWebGL2 } from "./orb3d.js?v=26";
import { person } from "./cast.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 60) : ms));

/* =================== The orb: one orb, moving between slots =================== */

let out = false;
const slotEls = { desk: $("#slotHero"), trySlot: $("#slotTry"), close: $("#slotClose") };
// It lives at the right edge of the page, the way it lives at the right edge of Windows. It steps into
// the demo desktop, sits beside the Real moments panel, and rises at the end of the page.
function target() {
  const vw = innerWidth, vh = innerHeight;
  const s = slotEls.desk.getBoundingClientRect();
  const sy = s.top + s.height / 2;
  if (s.width && sy > vh * 0.12 && sy < vh * 0.88) return { key: "desk", x: s.left + s.width / 2, y: sy, size: s.width };

  const ts = slotEls.trySlot && slotEls.trySlot.getBoundingClientRect();
  if (ts && ts.width) {
    const ty = ts.top + ts.height / 2;
    if (ty > vh * 0.08 && ty < vh * 0.92) return { key: "try", x: ts.left + ts.width / 2, y: ty, size: ts.width, bob: true };
  }

  // The finale: the orb rises from the bottom of the page like a sun.
  const c = slotEls.close.getBoundingClientRect();
  if (c.width && c.top < vh * 0.85 && c.bottom > vh * 0.3) {
    // Sized so its top clears the download button and its eyes stay above the fold.
    if (vw <= 760) { // on a phone the footer sits under it, so it rises whole
      const size = Math.min(c.width * 0.8, c.height - 24);
      return { key: "close", x: c.left + c.width / 2, y: c.top + c.height / 2, size };
    }
    const size = Math.max(160, Math.min(c.width, vh * 0.62, (c.height - 24) / 0.62));
    return { key: "close", x: c.left + c.width / 2, y: c.bottom - size * 0.12, size };
  }
  const size = vw < 920 ? 48 : 64;
  return { key: out ? "edge-out" : "edge", x: vw - (out ? 24 + size / 2 : 0), y: vh / 2, size, bob: out, docked: !out };
}

const dock = $("#dock");
const cssOrb = $("#orb");
let gl = null;
if (hasWebGL2()) {
  const light = $("#orbLight");
  const lerp = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255);
  const onFrame = (p, col, visible) => {
    // The orb is the page's light source: a soft pool of its own light follows it.
    const reach = Math.max(360, Math.min(p.size * 3.2, 2000));
    light.style.transform = `translate(${p.x - reach / 2}px, ${p.y - reach / 2}px)`;
    light.style.width = light.style.height = reach + "px";
    light.style.setProperty("--light", `${lerp(col[3])}, ${lerp(col[4])}, ${lerp(col[5])}`);
    light.style.opacity = visible ? Math.min(1, 0.55 + (col[6] - 1) * 0.6 + (col[8] - 1) * 0.3) : 0;
  };
  // At the page edge the orb looks at what the section is showing, not at a cursor that may be on the scrollbar.
  // The hero and the finale have no focus: there, its eyes follow your cursor.
  const FOCUS = {
    work: () => $(".dwin.is-active"),
    why: () => $("#raceGrid"),
    try: () => (current && current.el) || $("#tryWin"),
    show: () => $("#app"),
    more: () => $(".bento"),
    privacy: () => $(".receipt"),
    faq: () => $(".qa"),
  };
  const focus = () => {
    const f = FOCUS[section];
    const el = f && f();
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: Math.min(Math.max(r.top + r.height / 2, 80), innerHeight - 80) };
  };
  try { gl = createOrb3D($("#orbCanvas"), { target, reduced, onFrame, focus, look: "paper" }); } catch (e) { console.warn("3D orb unavailable, using the CSS orb", e); gl = null; }
}
const cloneOrb = (into) => { const c = cssOrb.cloneNode(true); c.removeAttribute("id"); into.append(c); return c; };
if (!gl) {
  document.documentElement.classList.add("no-gl");
  // Static copies of the CSS orb fill the big slots.
  cloneOrb(slotEls.close);
  if (slotEls.trySlot) cloneOrb(slotEls.trySlot);
}
// The cast (cast.js): the same three people on the cards, in the race and in the film.
function drawCast(el, face) { el.innerHTML = person(el.dataset.who, face || el.dataset.face); }
$$(".cast").forEach((el) => drawCast(el));

const CSS_MOOD = {
  idle: ["#ffd27a", "#f5a742", 1, 0, 1, ""],
  happy: ["#fff1c9", "#ff9e6b", 1.25, 0, 1, "orb--happy"],
  curious: ["#c4f5ec", "#4fc4bb", 1, 0, 1.25, ""],
  thinking: ["#f2c98a", "#c9894a", 0.6, 0, 1, "orb--swirl orb--thinking"],
  screenshot: ["#ffb8a8", "#ff7f6e", 1.1, 0, 1, "orb--screenshot"],
};
function paintCssOrb(el, m) {
  const [c, e, b, tilt, r, cls] = CSS_MOOD[m];
  el.className = "orb " + cls;
  el.style.setProperty("--core-center", c);
  el.style.setProperty("--core-edge", e);
  el.style.setProperty("--strength", Math.min(100, b * 1.35 * 80) + "%");
  el.style.setProperty("--tilt", tilt + "deg");
  el.style.setProperty("--r-scale", r);
}
const Orb = {
  mood: "idle",
  setMood(m) {
    this.mood = m;
    if (gl) return gl.setMood(m);
    for (const el of [cssOrb, ...$$(".finale__slot .orb")]) paintCssOrb(el, m);
  },
  // It slides out of the edge only where the page leaves room for it beside the content.
  setOut(v) { out = v && innerWidth >= 1240; dock.classList.toggle("is-out", out); },
  hold(pt) { if (gl) gl.holdGaze(pt); },
  center() {
    if (gl) return gl.center() || { x: innerWidth, y: innerHeight / 2 };
    const r = dock.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  },
};
Orb.setMood("idle");

/* =================== Shared: streamed words =================== */

function words(text, cls, startMs = 0) {
  const p = document.createElement("p");
  p.className = cls;
  text.split(/(?<=\s)/).forEach((w, i) => {
    const s = document.createElement("span");
    s.className = "w";
    s.textContent = w;
    s.style.animationDelay = (reduced ? 0 : startMs + i * 30) + "ms";
    p.append(s);
  });
  return p;
}
function renderInto(el, [h, b]) {
  el.textContent = "";
  el.append(words(h, "h"));
  if (b) el.append(words(b, "b", h.split(/\s+/).length * 30));
  return (h + " " + (b || "")).split(/\s+/).length * 30 + 240;
}

/* =================== Hero: the live desktop =================== */

const desk = $("#desk");
const deskScreen = $(".desk__screen", desk);
const dpanel = $("#dpanel");
const dExcerpt = $("#dExcerpt");
const dQ = $("#dQ");
const dText = $("#dText");
const dKeys = $("#dKeys");
const dCursor = $("#dCursor");
const dCopy = $("#dCopy");
const dReplace = $("#dReplace");
const tabs = $$(".scene-tab");
const playBtn = $("#playPause");
const controls = $(".desk__controls");

const SCENES = {
  mail: {
    act: "infer", key: ["Enter"], q: "", replace: true,
    ans: ["The copy deadline was Monday, and we're still waiting on the final pricing page.", "Could we have it by Wednesday?"],
  },
  code: {
    act: "infer", key: ["Enter"], q: "", replace: false,
    ans: ["items is undefined the first time the list draws, so there's nothing to call map on.", "loadOrders hasn't finished yet on the first render. Start from an empty list: useState([])."],
  },
  web: {
    act: "infer", key: ["Enter"], q: "", replace: false,
    ans: ["Your application was submitted. Please upload a copy of your ID within 14 days.", ""],
  },
};
const ORDER = ["mail", "code", "web"];
const original = {};
$$(".hl", desk).forEach((h) => (original[h.dataset.hl] = h.textContent));

let token = { dead: true };
let paused = false;
let heroVisible = false;
let heroIdx = 0;

const step = async (tok, ms) => { await sleep(ms); if (tok.dead || !heroVisible) { tok.dead = true; throw tok; } };
// The hero only drives the orb while the hero is what you're looking at.
const HeroOrb = {
  setMood: (m) => { if (section === "top" || section === "work") Orb.setMood(m); },
  hold: (p) => { if (section === "work") Orb.hold(p); },
};
const phaseEls = $$("#phases li");
const phase = (n) => {
  phaseEls.forEach((li) => li.classList.toggle("is-on", +li.dataset.phase === n));
  // The person on the playing card reacts: stuck before, relieved once the answer is used.
  const cast = $('.scene-tab[aria-selected="true"] .cast');
  if (cast && (n === 0 || n === 5)) drawCast(cast, n === 5 ? cast.dataset.done : cast.dataset.face);
};

function keys(list) {
  dKeys.textContent = "";
  list.forEach((k, i) => {
    if (i) { const s = document.createElement("span"); s.textContent = "+"; dKeys.append(s); }
    const kb = document.createElement("kbd"); kb.textContent = k; dKeys.append(kb);
  });
  dKeys.classList.add("is-on");
  clearTimeout(keys.t);
  keys.t = setTimeout(() => dKeys.classList.remove("is-on"), 1100);
}
function cursorTo(x, y, ms = 700) {
  dCursor.style.setProperty("--cdur", ms + "ms");
  dCursor.style.setProperty("--cx", x + "px");
  dCursor.style.setProperty("--cy", y + "px");
}
function resetScene(name) {
  HeroOrb.hold(null);
  $$(".dwin", desk).forEach((w) => w.classList.toggle("is-active", w.dataset.scene === name));
  $$(".hl", desk).forEach((h) => { h.classList.remove("is-sel", "is-new"); h.textContent = original[h.dataset.hl]; });
  dpanel.className = "dpanel";
  $$("span", dpanel).forEach((s) => s.classList.remove("is-on"));
  dCopy.firstChild.textContent = "Copy ";
  tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.scene === name)));
  phase(0);
}
function showFinal(name) {
  const sc = SCENES[name];
  resetScene(name);
  const hl = $(`.hl[data-hl="${name}"]`, desk);
  hl.classList.add("is-sel");
  dExcerpt.textContent = hl.textContent;
  dQ.textContent = sc.q;
  dText.textContent = "";
  const hp = document.createElement("p"); hp.className = "h"; hp.textContent = sc.ans[0]; dText.append(hp);
  if (sc.ans[1]) { const bp = document.createElement("p"); bp.className = "b"; bp.textContent = sc.ans[1]; dText.append(bp); }
  dReplace.hidden = !sc.replace;
  dpanel.classList.add("is-open", "has-answer", "has-acts");
  phase(5);
  HeroOrb.setMood("happy");
}

async function playScene(name, tok) {
  const sc = SCENES[name];
  resetScene(name);
  HeroOrb.setMood("idle");
  const hl = $(`.hl[data-hl="${name}"]`, desk);
  const d = deskScreen.getBoundingClientRect();
  await step(tok, 500);
  const rects = hl.getClientRects();
  const a = rects[0], z = rects[rects.length - 1];
  cursorTo(a.left - d.left - 2, a.top - d.top + a.height * 0.4, 800);
  await step(tok, 900);
  hl.classList.add("is-sel");
  cursorTo(z.right - d.left, z.top - d.top + z.height * 0.4, 900);
  const lookAtSel = () => { const r = hl.getBoundingClientRect(); HeroOrb.hold({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); };
  lookAtSel();
  await step(tok, 1050);
  keys(["Alt", "Mouse 5"]);
  phase(1);
  await step(tok, 350);
  HeroOrb.setMood("curious");
  dExcerpt.textContent = hl.textContent;
  dpanel.classList.add("is-open");
  phase(2);
  await step(tok, 1300);
  keys(sc.key);
  const chip = $(`.dpanel__chips [data-a="${sc.act}"]`, dpanel);
  chip.classList.add("is-on");
  phase(3);
  await step(tok, 450);
  HeroOrb.setMood("thinking");
  dQ.textContent = sc.q;
  dText.textContent = "";
  dpanel.classList.add("has-answer");
  await step(tok, 1100);
  HeroOrb.setMood("happy");
  { const r = dText.getBoundingClientRect(); HeroOrb.hold({ x: r.left + r.width * 0.4, y: r.top + 20 }); }
  phase(4);
  const dur = renderInto(dText, sc.ans);
  await step(tok, dur);
  dReplace.hidden = !sc.replace;
  dpanel.classList.add("has-acts");
  await step(tok, 1400);
  if (sc.replace) {
    keys(["Ctrl Enter"]);
    dReplace.classList.add("is-on");
    phase(5);
    await step(tok, 450);
    hl.textContent = sc.ans.filter(Boolean).join(" ");
    hl.classList.remove("is-sel");
    hl.classList.add("is-new");
    lookAtSel();
    dpanel.classList.remove("is-open");
  } else {
    keys(["Ctrl Shift C"]);
    dCopy.classList.add("is-on");
    phase(5);
    dCopy.firstChild.textContent = "Copied ";
    await step(tok, 1000);
    keys(["Esc"]);
    await step(tok, 250);
    dpanel.classList.remove("is-open");
    hl.classList.remove("is-sel");
  }
  phase(6);
  HeroOrb.setMood("idle");
  await step(tok, 1400);
  HeroOrb.hold(null);
  await step(tok, 800);
}

async function runHero(fromIdx) {
  token.dead = true;
  const tok = (token = { dead: false });
  heroIdx = fromIdx;
  controls.classList.add("is-playing");
  try {
    for (;;) {
      if (!heroVisible || paused) { tok.dead = true; break; }
      const name = ORDER[heroIdx];
      controls.style.setProperty("--scene-ms", "13000ms");
      // restart the progress bar
      tabs.forEach((t) => (t.style.animation = "none"));
      void controls.offsetWidth;
      tabs.forEach((t) => (t.style.animation = ""));
      await playScene(name, tok);
      heroIdx = (heroIdx + 1) % ORDER.length;
    }
  } catch (e) { if (e !== tok) throw e; }
  controls.classList.remove("is-playing");
}

tabs.forEach((t, i) => t.addEventListener("click", () => {
  if (reduced) return showFinal(t.dataset.scene);
  paused = false; playBtn.classList.remove("is-paused"); playBtn.setAttribute("aria-label", "Pause the demo");
  runHero(i);
}));
playBtn.addEventListener("click", () => {
  paused = !paused;
  playBtn.classList.toggle("is-paused", paused);
  playBtn.setAttribute("aria-label", paused ? "Play the demo" : "Pause the demo");
  if (paused) { token.dead = true; controls.classList.remove("is-playing"); }
  else runHero(heroIdx);
});
new IntersectionObserver(([en]) => {
  const was = heroVisible;
  heroVisible = en.isIntersecting;
  if (heroVisible && !was && !paused && !reduced) runHero(heroIdx);
}, { threshold: 0.25 }).observe(desk);

if (reduced) { showFinal("mail"); paused = true; playBtn.classList.add("is-paused"); }
else cursorTo(deskScreen.clientWidth * 0.7, deskScreen.clientHeight * 0.8, 0); // it starts once the desk is in view

/* =================== Race: a chat tab vs Aside =================== */

const raceA = $$('[data-race="a"] li');
const raceB = $$('[data-race="b"] li');
let raceTok = { dead: true };
async function race() {
  raceTok.dead = true;
  const tok = (raceTok = { dead: false });
  [...raceA, ...raceB].forEach((l) => l.classList.remove("is-done", "is-now"));
  $("#raceDone").classList.remove("is-on");
  const n = (k, w) => `${k} ${w}${k === 1 ? "" : w === "switch" ? "es" : "s"}`;
  const show = (id, st, swc) => ($(id).textContent = `${n(st, "step")} · ${n(swc, "app switch").replace("app switchs", "app switches")}`);
  show("#raceCountA", 0, 0); show("#raceCountB", 0, 0);
  let sw = 0;
  for (let i = 0; i < raceA.length; i++) {
    await sleep(i ? 700 : 300);
    if (tok.dead) return;
    raceA.forEach((l) => l.classList.remove("is-now"));
    raceA[i].classList.add("is-done", "is-now");
    if (raceA[i].hasAttribute("data-switch")) sw++;
    show("#raceCountA", i + 1, sw);
    if (i < raceB.length) {
      raceB.forEach((l) => l.classList.remove("is-now"));
      raceB[i].classList.add("is-done", "is-now");
      show("#raceCountB", i + 1, 0);
      if (i === raceB.length - 1) { $("#raceDone").classList.add("is-on"); raceB[i].classList.remove("is-now"); }
    }
  }
  raceA.forEach((l) => l.classList.remove("is-now"));
}
let raced = false;
new IntersectionObserver(([en]) => { if (en.isIntersecting && !raced) { raced = true; race(); } }, { threshold: 0.45 }).observe($("#raceGrid"));
$("#raceAgain").addEventListener("click", race);

/* =================== Try it, by job =================== */

const JOBS = {
  slack: {
    title: "#product-launch · Slack",
    first: "s1",
    html: `<div class="sl-msg"><div class="sl-meta"><b>Devon</b> <span>10:14 AM</span></div><p>Hey, did you ever send over the updated launch deck?</p></div>
<div class="sl-msg"><div class="sl-meta"><b>Priya</b> <span>10:16 AM</span></div><p><span class="s" data-s="s2">I can check GDPR terms by Thu 2pm. Sam is holding the blog post until Marta confirms tier names.</span></p></div>
<div class="sl-compose"><span class="sl-compose__tag">Message #product-launch</span><p><span class="s" data-s="s1">I already sent the updated deck twice, please actually check the thread before pinging me again.</span></p></div>`,
    ans: {
      s1: {
        kind: "replace",
        q: "Soften before sending",
        lines: ["Resharing the updated deck from earlier in the thread so it's right here.", "Let me know if you need anything else before review."],
      },
      s2: {
        kind: "explain",
        q: "Action items",
        lines: ["Two blockers left before the blog post goes live.", "Priya reviews GDPR terms by Thu 2pm, and Marta needs to confirm tier names for Sam."],
      },
    },
  },
  excel: {
    title: "Q4-pricing.xlsx · Excel",
    first: "e1",
    html: `<div class="xl-bar"><span>fx</span><span class="s" data-s="e1">=VLOOKUP(A2, Prices!B:C, 2, FALSE)</span></div>
<table class="xl-grid">
  <thead><tr><th></th><th>A · SKU</th><th>B · Plan</th><th>C · Qty</th><th>D · Price</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>PRO-M</td><td>Pro Monthly</td><td>12</td><td>$29.00</td></tr>
    <tr class="xl-active"><td>2</td><td>ENT-Y</td><td>Enterprise</td><td>40</td><td id="xlCell" class="xl-err">#N/A</td></tr>
    <tr><td>3</td><td>ADD-S</td><td>Extra Seat</td><td>8</td><td><span class="s" data-s="e2">=IF(C3&gt;10, C3*8, C3*10)</span></td></tr>
  </tbody>
</table>`,
    ans: {
      e1: {
        kind: "replace",
        q: "Fix broken formula",
        lines: ["=XLOOKUP(A2, Prices!C:C, Prices!B:B, \"Not found\")", "VLOOKUP can't look left. XLOOKUP matches A2 in column C and returns column B cleanly."],
        replaceText: "=XLOOKUP(A2, Prices!C:C, Prices!B:B, \"Not found\")",
        afterReplace: () => {
          const cell = $("#xlCell");
          if (cell) { cell.textContent = "$49.00"; cell.classList.remove("xl-err"); cell.classList.add("xl-ok"); }
        },
      },
      e2: {
        kind: "explain",
        q: "Explain formula",
        lines: ["Charges $8 per seat over 10 seats, otherwise $10.", "For 8 seats in C3, this evaluates to $80."],
      },
    },
  },
  lease: {
    title: "Apartment-Lease-2026.pdf",
    first: "l1",
    html: `<div class="pdf-sheet">
<p class="pdf-sec">SECTION 14 · RENEWAL AND NOTICE</p>
<p><span class="s" data-s="l1">Unless Lessee delivers written notice of non-renewal by certified mail at least sixty (60) calendar days prior to the Expiration Date, this Agreement shall automatically renew for a successive twelve (12) month term at a rental rate increased by up to 8%.</span></p>
<p><span class="s" data-s="l2">Lessee waives any claim to interest accrued on the Security Deposit except where expressly mandated by municipal statute.</span></p>
</div>`,
    ans: {
      l1: {
        kind: "explain",
        q: "Spot the catch",
        lines: ["Catch: your lease auto-renews for a full year unless you send certified mail 60 days early.", "They can also raise rent up to 8% automatically if you miss that window."],
      },
      l2: {
        kind: "explain",
        q: "Plain English",
        lines: ["You won't earn interest on your security deposit unless local city law forces them to pay it.", ""],
      },
    },
  },
  bill: {
    title: "AWS Cost Explorer · October",
    first: "b1",
    html: `<p class="muted">You can't select a chart. Drag the orb over it (click below to recapture).</p>
<div class="bill-card s" data-s="b1" data-capture="true">
  <i class="bc tl"></i><i class="bc tr"></i><i class="bc bl"></i><i class="bc br"></i>
  <div class="bill-head"><span>Monthly Spend by Service</span><b>$208.40</b></div>
  <div class="bill-row"><span>VPC NAT Gateway</span><div class="bill-track"><i style="width:68%;background:#d43a0a"></i></div><b>$142.10</b></div>
  <div class="bill-row"><span>EC2 Compute</span><div class="bill-track"><i style="width:18%"></i></div><b>$36.80</b></div>
  <div class="bill-row"><span>RDS Postgres</span><div class="bill-track"><i style="width:10%"></i></div><b>$21.20</b></div>
  <div class="bill-row"><span>S3 + CloudFront</span><div class="bill-track"><i style="width:4%"></i></div><b>$8.30</b></div>
</div>`,
    ans: {
      b1: {
        kind: "capture",
        q: "Captured region",
        lines: ["NAT Gateway is 68% of your bill ($142.10). Everything else combined is $66.", "Adding a free S3/DynamoDB VPC Gateway Endpoint usually cuts most NAT data processing charges."],
      },
    },
  },
  terminal: {
    title: "Windows PowerShell · shop-web",
    first: "t1",
    html: `<div class="ps-term">
<p class="ps-cmd">PS D:\\shop-web&gt; git pull origin main</p>
<p class="ps-err"><span class="s" data-s="t1">fatal: refusing to merge unrelated histories</span></p>
<p class="ps-cmd" style="margin-top:16px">PS D:\\shop-web&gt; pnpm dev</p>
<p class="ps-err"><span class="s" data-s="t2">pnpm.ps1 cannot be loaded because running scripts is disabled on this system. (PSSecurityException)</span></p>
</div>`,
    ans: {
      t1: {
        kind: "explain",
        q: "Fix Git error",
        lines: ["Your local repo and remote started from separate initial commits.", "Run: git pull origin main --allow-unrelated-histories"],
      },
      t2: {
        kind: "explain",
        q: "Fix PowerShell policy (remembered: Windows)",
        lines: ["PowerShell is blocking local script shims for your user.", "Run once: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned"],
      },
    },
  },
};

const tryDoc = $("#tryDoc");
const note = $("#note");
const noteCtxLabel = $("#noteCtxLabel");
const noteExcerpt = $("#noteExcerpt");
const noteQ = $("#noteQ");
const noteStatus = $("#noteStatus");
const noteText = $("#noteText");
const noteActs = $("#noteActs");
const copyBtn = $("#noteCopy");
const replaceBtn = $("#noteReplace");
const chips = $$("#noteChips .chip");
let job = "slack";
let current = null;
let lastAnswer = "";
let lastReplace = "";
let run = 0;

function showInstant(el) {
  const entry = JOBS[job].ans[el.dataset.s];
  if (!entry) return;
  $$(".s.is-sel", tryDoc).forEach((s) => s.classList.remove("is-sel"));
  el.classList.add("is-sel");
  const isCapture = el.dataset.capture === "true";
  current = { el, sid: el.dataset.s, isCapture };
  noteCtxLabel.textContent = isCapture ? "Your capture" : "Your selection";
  noteExcerpt.textContent = isCapture ? "Monthly Spend by Service ($208.40 chart)" : el.textContent.trim();
  noteQ.textContent = entry.q;
  noteStatus.textContent = "";
  noteText.textContent = "";
  const hp = document.createElement("p"); hp.className = "h"; hp.textContent = entry.lines[0]; noteText.append(hp);
  if (entry.lines[1]) { const bp = document.createElement("p"); bp.className = "b"; bp.textContent = entry.lines[1]; noteText.append(bp); }
  lastAnswer = entry.lines.filter(Boolean).join(" ");
  lastReplace = entry.replaceText || lastAnswer;
  replaceBtn.hidden = entry.kind !== "replace";
  noteActs.hidden = false;
  note.dataset.state = "answer";
  if (section === "try") Orb.setMood(isCapture ? "screenshot" : "happy");
}

function loadJob(name, animateFirst = false) {
  job = name;
  run++;
  $$(".job").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.job === name)));
  $("#tryTitle").textContent = JOBS[name].title;
  tryDoc.innerHTML = JOBS[name].html;
  $$(".s", tryDoc).forEach((s) => { s.tabIndex = 0; s.setAttribute("role", "button"); s.setAttribute("aria-label", "Ask Aside about: " + s.textContent.trim().slice(0, 80)); });
  const firstEl = $(`.s[data-s="${JOBS[name].first}"]`, tryDoc) || $(".s", tryDoc);
  if (firstEl) {
    if (animateFirst) selectAndAsk(firstEl);
    else showInstant(firstEl);
  }
}
$$(".job").forEach((b) => b.addEventListener("click", () => loadJob(b.dataset.job, true)));

function selectAndAsk(el) {
  run++;
  $$(".s.is-sel", tryDoc).forEach((s) => s.classList.remove("is-sel"));
  el.classList.add("is-sel");
  const isCapture = el.dataset.capture === "true";
  current = { el, sid: el.dataset.s, isCapture };
  noteCtxLabel.textContent = isCapture ? "Your capture" : "Your selection";
  noteExcerpt.textContent = isCapture ? "Monthly Spend by Service ($208.40 chart)" : el.textContent.trim();
  Orb.setMood(isCapture ? "screenshot" : "curious");
  ask();
}
function selectUnknown(text) {
  run++;
  $$(".s.is-sel", tryDoc).forEach((s) => s.classList.remove("is-sel"));
  current = null;
  note.dataset.state = "unknown";
  noteQ.textContent = "“" + (text.length > 60 ? text.slice(0, 57) + "…" : text) + "”";
  noteActs.hidden = true;
  noteText.textContent = "";
  const h = document.createElement("p"); h.className = "h"; h.textContent = "This page only has answers for the highlighted items."; noteText.append(h);
  const b = document.createElement("p"); b.className = "b"; b.textContent = "In Aside, you can select any text or drag the orb over anything on screen."; noteText.append(b);
  Orb.setMood("curious");
}
async function ask() {
  if (!current) return;
  const entry = JOBS[job].ans[current.sid];
  if (!entry) return;
  const id = ++run;
  note.dataset.state = "thinking";
  noteQ.textContent = entry.q;
  noteText.textContent = "";
  noteActs.hidden = true;
  noteStatus.textContent = "Thinking";
  Orb.setMood(current.isCapture ? "screenshot" : "thinking");
  await sleep(600);
  if (id !== run) return;
  noteStatus.textContent = "";
  note.dataset.state = "answer";
  Orb.setMood("happy");
  const dur = renderInto(noteText, entry.lines);
  lastAnswer = entry.lines.filter(Boolean).join(" ");
  lastReplace = entry.replaceText || lastAnswer;
  replaceBtn.hidden = entry.kind !== "replace";
  await sleep(dur);
  if (id !== run) return;
  noteActs.hidden = false;
  await sleep(1600);
  if (id === run) Orb.setMood("idle");
}
async function replaceSel() {
  if (!current || replaceBtn.hidden) return;
  const entry = JOBS[job].ans[current.sid];
  run++;
  const el = current.el;
  el.textContent = lastReplace;
  el.classList.remove("is-sel", "s");
  ["role", "tabindex", "aria-label"].forEach((a) => el.removeAttribute(a));
  el.classList.add("is-new");
  if (entry && entry.afterReplace) entry.afterReplace();
  current = null;
  dismiss("Replaced in place.");
}
async function dismiss(msg) {
  run++;
  $$(".s.is-sel", tryDoc).forEach((s) => s.classList.remove("is-sel"));
  current = null;
  noteActs.hidden = true;
  if (msg) {
    note.dataset.state = "unknown";
    noteQ.textContent = msg;
    noteText.textContent = "";
    const p = document.createElement("p"); p.className = "b";
    p.textContent = $$(".s", tryDoc).length ? "Click another item, or switch apps above." : "Done with this one. Try another app above.";
    noteText.append(p);
  } else note.dataset.state = "empty";
  Orb.setMood("happy");
}
tryDoc.addEventListener("mouseup", () => {
  const sel = getSelection();
  const text = sel.toString().trim();
  if (!text) return;
  const s = sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest(".s");
  if (s) selectAndAsk(s); else selectUnknown(text);
});
tryDoc.addEventListener("click", (e) => { const s = e.target.closest(".s"); if (s && getSelection().isCollapsed) selectAndAsk(s); });
tryDoc.addEventListener("keydown", (e) => {
  const s = e.target.closest && e.target.closest(".s");
  if (!s || (e.key !== "Enter" && e.key !== " ")) return;
  e.preventDefault();
  selectAndAsk(s);
});
chips.forEach((b) => b.addEventListener("click", () => ask()));
replaceBtn.addEventListener("click", replaceSel);
copyBtn.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(lastReplace); } catch { /* the label still confirms */ }
  copyBtn.firstChild.textContent = "Copied ";
  setTimeout(() => (copyBtn.firstChild.textContent = "Copy "), 1500);
});
addEventListener("keydown", (e) => {
  if (section !== "try") return;
  if (e.key === "Escape" && note.dataset.state !== "empty") dismiss();
  else if (e.key === "Enter" && !e.ctrlKey && current && note.dataset.state === "chips") { e.preventDefault(); ask(); }
  else if (e.key === "Enter" && e.ctrlKey && !replaceBtn.hidden && note.dataset.state === "answer") { e.preventDefault(); replaceSel(); }
});

/* =================== Moods: live interactive orbs that watch each other =================== */

const moodList = $("#moodList");
const moodBtns = $$(".mood");
const moodOrbs = moodBtns.map((b) => {
  const host = $(".mood__orb", b);
  const orb = cloneOrb(host);
  paintCssOrb(orb, b.dataset.mood);
  return { btn: b, orb, mood: b.dataset.mood };
});

function aimOrb(orb, dx, dy) {
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, d / 160);
  orb.style.setProperty("--lx", (dx / d) * k * 4.5 + "px");
  orb.style.setProperty("--ly", (dy / d) * k * 3.5 + "px");
}

function lookAtPoint(x, y) {
  moodOrbs.forEach(({ orb, mood }) => {
    if (mood === "happy" || mood === "screenshot") return;
    const r = orb.getBoundingClientRect();
    aimOrb(orb, x - (r.left + r.width / 2), y - (r.top + r.height / 2));
  });
}

let hoveredMood = null;
function showMood(m, btn) {
  hoveredMood = m;
  moodBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.mood === m));
  Orb.setMood(m || "idle");
  if (btn) {
    const r = $(".mood__orb", btn).getBoundingClientRect();
    lookAtPoint(r.left + r.width / 2, r.top + r.height / 2);
  }
}

moodBtns.forEach((b) => {
  b.addEventListener("pointerenter", () => showMood(b.dataset.mood, b));
  b.addEventListener("focus", () => showMood(b.dataset.mood, b));
  b.addEventListener("click", () => showMood(b.dataset.mood, b));
});
moodList.addEventListener("pointermove", (e) => {
  if (!reduced) lookAtPoint(e.clientX, e.clientY);
});
moodList.addEventListener("pointerleave", () => showMood(null));

// When nobody is hovering, the orbs quietly glance at each other.
if (!reduced) {
  let stepIdx = 0;
  const glance = () => {
    if (hoveredMood) return;
    const patterns = [
      { idle: [-4, 0], thinking: [1, -3], curious: [4, 0] },
      { idle: [4, 0], thinking: [-4, 0], curious: [-4, 0] },
      { idle: [0, 0], thinking: [4, -1], curious: [4, 0] },
      { idle: [-3, 1], thinking: [-3, -2], curious: [-3, 1] },
    ];
    const p = patterns[stepIdx++ % patterns.length];
    moodOrbs.forEach(({ orb, mood }) => {
      const xy = p[mood] || [0, 0];
      orb.style.setProperty("--lx", xy[0] + "px");
      orb.style.setProperty("--ly", xy[1] + "px");
    });
  };
  glance();
  setInterval(glance, 2400);
}

/* =================== Hero: the orb is pleased when you reach for the download =================== */

// The headline's pill is the product in miniature: a tiny orb that goes through one question's moods.
const pillOrb = cloneOrb($("#pillOrb"));
paintCssOrb(pillOrb, "idle");
(async () => {
  if (reduced) return;
  const beats = [["idle", 2200], ["curious", 1200], ["thinking", 1400], ["happy", 2000]];
  for (let i = 0; ; i = (i + 1) % beats.length) {
    paintCssOrb(pillOrb, beats[i][0]);
    await new Promise((r) => setTimeout(r, beats[i][1]));
  }
})();

const heroDl = $("#heroDl");
heroDl.addEventListener("pointerenter", () => { if (section === "top") Orb.setMood("happy"); });
heroDl.addEventListener("pointerleave", () => { if (section === "top") Orb.setMood("idle"); });

// The finale: the orb has risen and simply enjoys it, happy, its eyes following your cursor.
// Its own observer, so a jump straight to the end (End key, a footer link) still lands on a happy orb.
let footRaf = 0;
const finaleHappy = () => {
  cancelAnimationFrame(footRaf);
  footRaf = requestAnimationFrame(() => {
    if ($(".foot__links a[data-mood]:hover") || (document.activeElement && document.activeElement.closest && document.activeElement.closest(".foot__links"))) return;
    Orb.hold(null);
    Orb.setMood("happy");
  });
};
const topNav = $(".nav");
new IntersectionObserver(([en]) => {
  if (topNav) topNav.classList.toggle("is-hidden", en.isIntersecting);
  if (en.isIntersecting) finaleHappy();
}, { threshold: 0.25 }).observe($("#download"));

// Each footer link gets the face that matches it: curious at the source, eyes closed for privacy
// (it doesn't look), thinking for questions. Leaving puts it back to happy, following your cursor.
$$(".foot__links a[data-mood]").forEach((a) => {
  const look = () => {
    cancelAnimationFrame(footRaf);
    const r = a.getBoundingClientRect();
    Orb.hold({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    Orb.setMood(a.dataset.mood);
  };
  a.addEventListener("pointerenter", look);
  a.addEventListener("focus", look);
  a.addEventListener("pointerleave", finaleHappy);
  a.addEventListener("blur", finaleHappy);
});

/* =================== Capture and show me =================== */

const app = $("#app");
const frame = $("#frame");
const halo = $("#halo");
const haloLabel = $("#haloLabel");
const drop = $("#dropFile");
const dialog = $("#dialog");
const tFile = $("#tFile");
const tPng = $("#tPng");
const stepbarText = $("#stepbarText");
const stepNext = $("#stepNext");
const TARGETS = [{ el: tFile, label: "File" }, { el: $("#tExport"), label: "Export…" }, { el: tPng, label: "PNG" }];
let showStep = -1, showDone = false, showStarted = false, pointRun = 0;

function uiFor(i) {
  drop.classList.toggle("is-open", i === 1);
  tFile.classList.toggle("is-open", i === 1);
  dialog.classList.toggle("is-open", i >= 2);
  tPng.classList.toggle("is-picked", showDone);
}
function placeHalo(el) {
  const a = app.getBoundingClientRect(), r = el.getBoundingClientRect();
  const left = r.left - a.left - 6;
  Object.assign(halo.style, { left: left + "px", top: r.top - a.top - 6 + "px", width: r.width + 12 + "px", height: r.height + 12 + "px" });
  halo.classList.toggle("halo--left", left < 36);
}
const sparkLayer = $("#sparkLayer"), spark = $("#spark"), sparkPath = $("#sparkPath");
function flySpark(x1, y1) {
  return new Promise((resolve) => {
    if (reduced) return resolve();
    const c = Orb.center();
    const x0 = c.x - (c.size || 64) * 0.3, y0 = c.y;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const bow = Math.min(90, Math.hypot(x1 - x0, y1 - y0) * 0.18) * (y1 >= y0 ? 1 : -1);
    sparkLayer.setAttribute("viewBox", `0 0 ${innerWidth} ${innerHeight}`);
    sparkPath.setAttribute("d", `M${x0} ${y0} Q${mx} ${my + bow} ${x1} ${y1}`);
    const len = sparkPath.getTotalLength(), t0 = performance.now();
    spark.style.opacity = 1;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    (function f(now) {
      const t = Math.min(1, (now - t0) / 650);
      const p = sparkPath.getPointAtLength(ease(t) * len);
      spark.setAttribute("cx", p.x); spark.setAttribute("cy", p.y); spark.setAttribute("r", 4 - t * 1.5);
      if (t < 1) requestAnimationFrame(f); else { spark.style.opacity = 0; resolve(); }
    })(t0);
  });
}
async function pointTo(i) {
  const id = ++pointRun;
  showStep = i;
  uiFor(i);
  halo.classList.remove("is-on"); halo.classList.add("is-off");
  stepbarText.textContent = `Step ${i + 1} of 3 · click the lit item to go on`;
  stepNext.firstChild.textContent = "Next ";
  await new Promise(requestAnimationFrame);
  const r = TARGETS[i].el.getBoundingClientRect();
  const pt = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  Orb.hold(pt);
  await flySpark(pt.x, pt.y);
  if (id !== pointRun) return;
  placeHalo(TARGETS[i].el);
  haloLabel.innerHTML = `<b>${i + 1}</b>${TARGETS[i].label}`;
  halo.classList.remove("is-off"); void halo.offsetWidth; halo.classList.add("is-on");
}
async function finishShow() {
  pointRun++;
  showDone = true;
  uiFor(2);
  stepbarText.textContent = "Done. PNG is picked; export when you're ready.";
  stepNext.firstChild.textContent = "Again ";
  Orb.hold(null);
  Orb.setMood("happy");
  await sleep(700);
  halo.classList.remove("is-on"); halo.classList.add("is-off");
}
async function startShow() {
  const id = ++pointRun;
  showDone = false; showStep = -1;
  uiFor(0);
  halo.classList.remove("is-on");
  Orb.setOut(true);
  Orb.setMood("screenshot");
  frame.classList.add("is-on");
  stepbarText.textContent = "Captured. Working out the steps…";
  await sleep(1100);
  if (id !== pointRun) return;
  frame.classList.remove("is-on");
  Orb.setMood("curious");
  await sleep(300);
  if (id === pointRun) pointTo(0);
}
TARGETS.forEach((t, i) => t.el.addEventListener("click", () => { if (showStep !== i || showDone) return; if (i === 2) finishShow(); else pointTo(i + 1); }));
stepNext.addEventListener("click", () => { if (showDone || showStep < 0) return startShow(); if (showStep === 2) finishShow(); else pointTo(showStep + 1); });
$("#stepBack").addEventListener("click", () => { if (showDone) { showDone = false; return pointTo(2); } if (showStep > 0) pointTo(showStep - 1); });
addEventListener("resize", () => { if (showStep >= 0 && !showDone) placeHalo(TARGETS[showStep].el); });

/* =================== Memory =================== */

const memList = $("#memList");
$("#memSwitch").addEventListener("change", (e) => memList.classList.toggle("is-off", !e.target.checked));
memList.addEventListener("click", async (e) => {
  const b = e.target.closest(".mem__btn");
  if (!b) return;
  const li = b.closest("li");
  if (b.hasAttribute("data-forget")) {
    li.classList.add("is-gone");
    await sleep(260);
    li.remove();
    if (!memList.children.length) $("#memEmpty").hidden = false;
    return;
  }
  const p = $("p", li);
  p.contentEditable = "true";
  p.focus();
  getSelection().selectAllChildren(p);
  p.addEventListener("blur", () => { p.contentEditable = "false"; $(".mem__date", li).textContent = "Edited just now"; }, { once: true });
  p.addEventListener("keydown", (k) => { if (k.key === "Enter") { k.preventDefault(); p.blur(); } });
});

/* =================== Which section is under the reading line =================== */

var section = "top";
const secObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const prev = section;
    section = en.target.id;
    if (prev === section) return;
    if (section !== "top") Orb.hold(null);
    switch (section) {
      case "top": case "work": Orb.setOut(false); Orb.setMood("idle"); break; // the demo timeline drives it from here
      case "try": Orb.setOut(note.dataset.state !== "empty"); Orb.setMood("idle"); break;
      case "show":
        if (!showStarted) { showStarted = true; startShow(); }
        else { Orb.setOut(true); Orb.setMood(showDone ? "happy" : "curious"); }
        break;
      case "download": Orb.setOut(false); Orb.setMood("happy"); break;
      default: Orb.setOut(false); Orb.setMood("idle");
    }
  });
}, { rootMargin: "-50% 0px -50% 0px" });
$$("main section").forEach((s) => secObs.observe(s));

loadJob("slack");
