"""Generate Aside website art with Google's Gemini image models.

Usage:
  python art/gen.py <shot-id>            render one shot from art/shots.json
  python art/gen.py --all                render every shot that has no output yet
  python art/gen.py <shot-id> --model gemini-3.1-flash-image   (cheaper draft)

Needs GEMINI_API_KEY in the environment. Each image is billed to that key.
Outputs land in art/out/<shot-id>.png (and art/out/<shot-id>.json with the prompt used).
"""
import base64, json, os, sys, urllib.request, urllib.error, pathlib, time

ROOT = pathlib.Path(__file__).resolve().parent
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_MODEL = "gemini-3-pro-image"


def load_shots():
    return json.loads((ROOT / "shots.json").read_text(encoding="utf-8"))


def part_for_image(path):
    p = ROOT / path
    mime = "image/png" if p.suffix.lower() == ".png" else "image/jpeg"
    return {"inline_data": {"mime_type": mime, "data": base64.b64encode(p.read_bytes()).decode()}}


def render(shot_id, shots, model):
    cfg = shots["shots"][shot_id]
    style = shots["styles"][cfg["style"]]
    prompt = f"{cfg['prompt']}\n\nStyle: {style}\n\nRules: {shots['rules']}"
    parts = [{"text": prompt}] + [part_for_image(r) for r in cfg.get("refs", [])]
    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": cfg.get("aspect", "16:9")}},
    }
    req = urllib.request.Request(
        API.format(model=model), data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]},
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        print(f"{shot_id}: HTTP {e.code} from {model}: {e.read().decode(errors='replace')[:600]}")
        return
    out = ROOT / "out"
    out.mkdir(exist_ok=True)
    saved = False
    for cand in data.get("candidates", []):
        for p in cand.get("content", {}).get("parts", []):
            blob = p.get("inline_data") or p.get("inlineData")
            if blob:
                (out / f"{shot_id}.png").write_bytes(base64.b64decode(blob["data"]))
                saved = True
    (out / f"{shot_id}.json").write_text(json.dumps({"model": model, "prompt": prompt, "usage": data.get("usageMetadata")}, indent=2), encoding="utf-8")
    print(f"{shot_id}: {'saved' if saved else 'NO IMAGE ' + json.dumps(data)[:400]} in {time.time() - t0:.0f}s")


def main():
    args = sys.argv[1:]
    model = DEFAULT_MODEL
    if "--model" in args:
        i = args.index("--model"); model = args[i + 1]; del args[i:i + 2]
    shots = load_shots()
    ids = [k for k in shots["shots"] if not (ROOT / "out" / f"{k}.png").exists()] if args == ["--all"] else args
    for k in ids:
        render(k, shots, model)


if __name__ == "__main__":
    main()
