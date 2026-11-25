"""Generate the website's illustrations for free with FLUX.1-dev on a public Hugging Face Space.

Usage:
  python art/flux.py hero writer        render these shots from art/flux.json
  python art/flux.py --all              render every shot with no output yet
  python art/flux.py hero --seed 12     try another seed for one shot

Needs `pip install gradio_client`. Uses Hugging Face's free GPU quota (set HF_TOKEN for a bigger one).
Outputs: art/out/<shot>.webp. Then run art/compose.py to place the real orb and export web sizes.
"""
import json, pathlib, shutil, sys, time
from gradio_client import Client

ROOT = pathlib.Path(__file__).resolve().parent
SPACE = "black-forest-labs/FLUX.1-dev"


def main():
    args = sys.argv[1:]
    seed = None
    if "--seed" in args:
        i = args.index("--seed"); seed = int(args[i + 1]); del args[i:i + 2]
    cfg = json.loads((ROOT / "flux.json").read_text(encoding="utf-8"))
    out = ROOT / "out"; out.mkdir(exist_ok=True)
    ids = [k for k in cfg["shots"] if not (out / f"{k}.webp").exists()] if args == ["--all"] else args
    client = Client(SPACE, verbose=False)
    for k in ids:
        s = cfg["shots"][k]
        prompt = f"{s['prompt']}\n\n{cfg['style']}"
        t0 = time.time()
        try:
            img, used = client.predict(prompt=prompt, seed=seed if seed is not None else s["seed"], randomize_seed=False,
                                       width=s["w"], height=s["h"], guidance_scale=3.5, num_inference_steps=28, api_name="/infer")
        except Exception as e:  # quota or queue errors come back as exceptions
            print(f"{k}: FAILED {str(e)[:300]}"); continue
        shutil.copy(img, out / f"{k}.webp")
        print(f"{k}: saved (seed {used}) in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
