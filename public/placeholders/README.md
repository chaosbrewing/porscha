# Placeholder images

Every file in this folder is a deliberate stand-in: an abstract
composition in the site palette, never a stock photo or a generated
person. Each one is referenced from a content file under
`src/content/`, so replacing an image is a matter of dropping the real
file in and updating that one path.

| File | Used by | Replace with |
| --- | --- | --- |
| `making-studio.svg` | `src/content/site/making.ts` — the "Making is how I think" interlude on `/me` | A landscape studio, workbench or in-progress artwork photograph, at least 2400×1500. Warm, natural light. Text sits over the lower-left, so keep that area quiet. |
| `ending-landscape.svg` | `src/content/site/links.ts` — the ending on `/me` | A restrained environmental photograph or landscape (ocean, coast, a walk), at least 2400×1200. No people in focus. |
| `fragment-paint.svg` | `src/content/site/fragments.ts` | A portrait-orientation (4:5) photograph of paint, brushes, a canvas detail or a work in progress. |
| `fragment-photo.svg` | `src/content/site/fragments.ts` | A landscape (3:2) photograph — a street, an object, a place. Something Porscha photographed. |
| `fragment-object.svg` | `src/content/site/fragments.ts` | A square (1:1) photograph of an object, a sketch or something from the desk. |

Guidance for the real images:

- Export without EXIF or location metadata.
- JPEG or WebP, around 300–800 KB for full-bleed images; smaller for
  fragments. Next.js image optimisation handles responsive sizes.
- Keep the stated aspect ratios so the layouts hold without cropping
  surprises. Images are never stretched.
