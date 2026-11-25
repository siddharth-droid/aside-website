"""Narration for the Aside film, with a time for every word.

  python film/src/voice.py [voice] [rate]

Uses edge-tts (free Microsoft neural voices, no key; the script text is sent to Microsoft to be spoken).
Writes film/assets/voice.mp3 and film/src/words.json ([{word, start, end}] in seconds).
"""
import asyncio, json, pathlib, sys
import edge_tts

HERE = pathlib.Path(__file__).resolve().parent
VOICE = sys.argv[1] if len(sys.argv) > 1 else "en-US-AndrewMultilingualNeural"
RATE = sys.argv[2] if len(sys.argv) > 2 else "+4%"


async def main():
    text = (HERE / "script.txt").read_text(encoding="utf-8").replace("\n", " ").strip()
    out = HERE.parent / "assets"
    out.mkdir(exist_ok=True)
    com = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    words = []
    with open(out / "voice.mp3", "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                s = chunk["offset"] / 1e7
                words.append({"word": chunk["text"], "start": round(s, 3), "end": round(s + chunk["duration"] / 1e7, 3)})
    (HERE / "words.json").write_text(json.dumps(words, indent=1), encoding="utf-8")
    print(f"{len(words)} words, ends at {words[-1]['end']:.2f}s with {VOICE} {RATE}")


asyncio.run(main())
