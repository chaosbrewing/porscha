# Portrait asset slot

Photography for the site is declared in **`src/config/photography.ts`**.
The cover portrait and the bio portrait both point at a file in this
folder:

```
public/portrait/porscha.jpg
```

Replacing the photograph is a file swap — or, for a different file name
or crop, a one-line change to the `home-cover` / `porscha-portrait`
entries in that config. Nothing in the layout references the file
directly, and every slot reserves its declared aspect ratio whether or
not a photograph exists, so swapping one never moves the type around it.

Guidance for the image itself:

- Portrait orientation, roughly **4:5** (e.g. 1600×2000 px or larger).
- An editorial photograph — modelling/environmental, direct or
  three-quarter, natural or single-source light — not a cropped circular
  headshot.
- Keep the subject's head in the upper third; the cover crops with
  `object-position: 50% 22%`, tunable per slot via `focal`.
- JPEG/WebP around 300–600 KB is plenty; Next.js image optimization
  handles responsive sizes from there.

Slots still held (`src: null` in the registry) render a hatched plate
with the shot brief printed on it — clearly a reserved slot, never a
stock photo or a generated person.
