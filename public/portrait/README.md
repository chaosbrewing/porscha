# Portrait asset slot

The homepage hero renders Porscha's editorial portrait from this folder.

**Drop the portrait here as:**

```
public/portrait/porscha.jpg
```

(`porscha.png` or `porscha.webp` also work — the hero picks the first one
it finds, in that order.)

Guidance for the image itself:

- Portrait orientation, roughly **4:5** (e.g. 1600×2000 px or larger).
- An editorial photograph — environmental, in the workshop, natural light —
  not a cropped circular headshot.
- Keep the subject's head in the upper half; the hero crops gently on
  small screens with `object-position: top`.
- JPEG/WebP around 300–600 KB is plenty; Next.js image optimization
  handles responsive sizes from there.

Until a real portrait exists, the hero shows a clearly intentional
placeholder composition (never a stock photo or a generated person) plus
this note in development.
