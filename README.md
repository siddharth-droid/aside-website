# Aside website

Marketing site for [Aside](https://github.com/siddharth-droid/aside), a quick-answer orb for Windows.

Plain HTML, CSS and JS with no build step. The 3D orb (`orb3d.js`) is a three.js port of the app's `OrbGL` shader; three.js is vendored in `vendor/`.

## Run locally

```sh
python -m http.server 8765
```

Then open http://localhost:8765/. It needs to be served over http (ES modules don't load from `file://`).

## Deploy

Any static host works: point Vercel, Netlify or GitHub Pages at the repo root.
