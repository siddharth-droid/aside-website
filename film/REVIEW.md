# Review: Aside, "One frame, two ways"

Checked against SPEC.md with `npx hyperframes check` and snapshots at the QA frames (0, 1.6, 3, 6.4, 9.6, 10, 14.1, 16.6, 17.6, 19.2, 20.9, 22.4, 26.2, 28.5, 31.5 s).

Fixed after review
- Frame 0 was an empty board (it is the thumbnail): the email strip is on the board from frame 0.
- The hook and "same morning" left the right half empty: a camera now starts close on the email (scale 1.45, origin 0% 20%) and pulls back when the browser and the orb arrive.
- The rewritten sentence ran off its paper and under the keycaps: the sentence has room for three lines; the keys row moved right of Sam.
- Sam's face sat below the frame in the close shots: lifted so his sticker overlaps the email's empty lower edge.
- Torn pieces (the 17:30 tag) stayed half on screen: tears travel 2100 px.
- Reading text under the 28 px phone floor: raised to 28 px.
- Every sound effect has its own length; they no longer run to the end.

Kept, with reason
- "line unread" warnings: these lines are read aloud by the narrator (the pasted copy of the sentence, the chat text); the screen does not need to hold them for silent reading.
- One composition instead of one per scene: the film is one board that rebuilds itself, so its pieces share one stage. Studio still lists every piece.

Sound was measured, not heard: voice from edge-tts, Lyria bed at 0.14 under it, 27 CC0 effects on visible actions (credits in assets/sfx/CREDITS.md).
