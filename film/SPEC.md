# SPEC: Aside, "One frame, two ways"

GOAL:    The viewer feels the chat-tab round trip as a pile-up, then feels it vanish: three keys, and Sam never left the email. They remember "Keep working. Ask Aside."
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps.
TIME:    31.9 s x 30 = 957 frames. The narration (film/assets/voice.mp3, edge-tts en-US-AndrewMultilingualNeural +12%) is the clock: every cue is pinned to a word in src/words.json.
LOOK:    One kraft board (#e9dfca) with a 6 px halftone dot screen at 12% ink. Pieces are torn newsprint (#f7f2e7) with a 1.5% torn edge,
         shadow 5 px 8 px 14 px at 28% warm black. Ink #141210 for every word read. Accents, one focus per moment: red #e2412f (cost: stamps,
         marker), yellow #f2c230 (counts), blue #2f5bd3 (the answer), teal #4fc4bb at 34% (the rewrite landing), amber selection rgba(245,167,66,.5).
         Ransom headlines: Apfel Grotezk 700 at 120-160 px, Instrument Serif italic, Doto 800; each word on its own paper with a 3 px 4 px hard shadow.
         Body text on pieces: Apfel Grotezk 500, 36-44 px. The Aside panel keeps the app's Ink look: #1b1b1e, radius 24 px, Georgia 700 headline.
OBJECTS: an email strip that reads as mail (To line, subject, body); a browser window (three dots, tab row, chat box); red "app switch" stamps;
         keycaps (white, 2 px ink border, 4 px ink bottom); Sam, Ade and Tom from cast.js (white sticker edge 8 px); the real orb renders.
MOTION:  Paper slaps, never fades: scale 1.14 -> 1.0, rotation +5 deg -> rest, 7 frames, back.out(2.2). Exits are torn away: x +1300, rotation 18 deg,
         12 frames, power3.in, staggered 2 frames. Selection sweeps left to right in 15 frames linear. The board drifts 3.5% closer over each act
         (sine.inOut). Faces swap on a cut, no tween.
SHOTS:   f0-110 hook: "09:12" tag slaps on "Nine", Sam on "Sam", red marker circles the sentence on "sentence".
         f110-450 old way: one piece per verb (copy, browser, tabs, paste, explain, wait, answer, switch back, find), counter 01-08, two app-switch stamps,
           Sam frustrated on "Wait"; "8 steps / 2 app switches" slaps on its words.
         f450-505 rip: everything from the old way tears off right on "Same sentence"; "09:12" punches again on "Same morning".
         f505-690 Aside: selection on "Select", orb slides in from the right edge and keycaps stamp on "Press your trigger", the Ink panel opens on
           "Rewrite", folds back and the rewrite lands in teal on "Put it back", "3 keys." on "Three", Sam relieved on "Sam".
         f690-840 echoes: Ade's card on "Ade's", answer on "explained"; Tom's card on "Tom's", answer on "translated"; their keycaps on "three keys".
         f840-957 end: "Keep working." on "Keep", "Ask Aside." on "Ask", the happy orb rises; hold.
SOUND:   Lyria bed (pizzicato and marimba, 112 bpm) at 0.14 under the voice, fading over the last 1.5 s. CC0 effects only on visible actions: slap on
         each paper landing, marker on the circle, key clack on each keycap, whoosh on large moves, rip on the tear.
BANNED:  a dark void; glows except the orb's own; fades as entrances; everything centred; text moving while read; three cards in a row;
         a corner logo; captions duplicating the narration word for word.
QA:      f40 (tag, strip, marker starting), f300 (pile mid-way, counter 04-05), f420 (8 steps headline), f530 (clean board, selection),
         f600 (panel open, keycaps), f640 (rewrite landed teal, 3 keys), f780 (Ade + Tom cards with answers), f930 (end card held).
