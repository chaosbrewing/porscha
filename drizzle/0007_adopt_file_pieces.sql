-- Adopt the file-backed gallery pieces into the console.
--
-- Until now these 32 pieces lived as Markdown under src/content/gallery
-- with their images under public/art. Rows here make the console the
-- owner of their content (origin = 'console') so title, category, year,
-- alt text and image are all editable there. The image files stay where
-- they are, served as static assets; replacing one from the console
-- simply points the row at a new upload.
--
-- Idempotent: an existing row for the slug (an overlay carrying hidden /
-- featured / position) keeps those flags and adopts the content.
INSERT INTO "gallery_items" ("slug", "title", "category", "year", "media_path", "alt", "aspect", "body", "origin")
VALUES
  ('adrift', 'Adrift', 'canvas', '2026', '/art/adrift.jpg', 'A red-and-white lighthouse braces against towering white surf while lightning forks through a brown-black sky.', '2000/1992', NULL, 'console'),
  ('amidst-chaos', 'Amidst Chaos', 'canvas', '2026', '/art/amidst-chaos.jpg', 'A weathered barrel tumbles through churning turquoise water under a pale, foaming sky.', '2000/1475', NULL, 'console'),
  ('crow', 'Crow', 'canvas', '2025', '/art/crow.jpg', 'A hunched black crow with a red beak, built from heavy strokes, against slashes of pink, magenta and teal.', '1500/2000', NULL, 'console'),
  ('dark-alley', 'Dark Alley', 'canvas', '2025', '/art/dark-alley.jpg', 'A cascade of gold impasto pours down from a pale white form over a dark, wine-flecked ground.', '1556/2000', NULL, 'console'),
  ('desperate-sunset', 'Desperate Sunset', 'canvas', '2026', '/art/desperate-sunset.jpg', 'A lone figure walks toward a pale sun between dark headlands across a pink sea, while a corked bottle drifts in the foreground.', '1276/2000', NULL, 'console'),
  ('flamingo', 'Flamingo', 'canvas', '2025', '/art/flamingo.jpg', 'A pink impasto flamingo on a dark stem rises from a patch of blue, set in a mottled field of mauve, grey and yellow.', '1500/2000', NULL, 'console'),
  ('high-underwater', 'High Underwater', 'canvas', '2025', '/art/high-underwater.jpg', 'Two pink, heavy-lidded eyes in a dark brown face, tangled under a net of pale white and sand-coloured lines.', '2000/1290', NULL, 'console'),
  ('hummingbird', 'Hummingbird', 'canvas', '2025', '/art/hummingbird.jpg', 'A hummingbird in thick strokes of blue and white, wings raised, against a ground of dark red, orange and black.', '1404/2000', NULL, 'console'),
  ('jean-bag-v1', 'JeanBag v1', 'textile', '2025', '/art/jean-bag-v1.jpg', 'A slouchy shoulder bag sewn from reworked jeans, with frayed seams, a pocket, and a panel of pink lace.', '1500/2000', NULL, 'console'),
  ('light-flow', 'Light Flow', 'canvas', '2026', '/art/light-flow.jpg', 'A luminous white-gold waterfall of light pours down through dark storm clouds lit orange and red from within.', '1453/2000', NULL, 'console'),
  ('look-up', 'Look up', 'canvas', '2026', '/art/look-up.jpg', 'Two bloodshot, tear-filled eyes beneath dark brows, a tear caught on the lower lashes and another running down the cheek.', '2000/1315', NULL, 'console'),
  ('lust', 'Lust', 'canvas', '2025', '/art/lust.jpg', 'A wide brown-lidded eye with a dark green iris, the white streaked red and pink, lashes flicked in black.', '2000/1481', NULL, 'console'),
  ('modelling-01', 'Modelling 01', 'modelling', NULL, '/art/modelling-01.jpg', 'Close portrait against a dark backdrop: long auburn hair with a fringe, red lips, a red halter strap.', '1333/2000', NULL, 'console'),
  ('modelling-02', 'Modelling 02', 'modelling', NULL, '/art/modelling-02.jpg', 'Looking back over one shoulder, long copper hair, a white off-the-shoulder top, a watch and a clover bracelet.', '1333/2000', NULL, 'console'),
  ('modelling-03', 'Modelling 03', 'modelling', NULL, '/art/modelling-03.jpg', 'Close portrait in warm red light, a fringe and long dark hair, turned toward the camera.', '1333/2000', NULL, 'console'),
  ('modelling-04', 'Modelling 04', 'modelling', NULL, '/art/modelling-04.jpg', 'Leaning against a granite column outdoors in a pale denim strapless top, short dark hair with a bleached fringe.', '1054/1588', NULL, 'console'),
  ('modelling-05', 'Modelling 05', 'modelling', NULL, '/art/modelling-05.jpg', 'Seated at a stone ledge with a black handbag, chin resting on one hand, city towers soft behind.', '1058/1596', NULL, 'console'),
  ('modelling-06', 'Modelling 06', 'modelling', NULL, '/art/modelling-06.jpg', 'Standing in a turquoise denim dress and matching heels, a long red braid, trees and a stone bench behind.', '856/1378', NULL, 'console'),
  ('modelling-07', 'Modelling 07', 'modelling', NULL, '/art/modelling-07.jpg', 'Leaning on a railing in sunlight, dark sunglasses, a black cropped jacket over an orange dress.', '1333/2000', NULL, 'console'),
  ('modelling-08', 'Modelling 08', 'modelling', NULL, '/art/modelling-08.jpg', 'Seen through black railings, standing before red slats and glass towers, in profile with sunglasses.', '1333/2000', NULL, 'console'),
  ('modelling-09', 'Modelling 09', 'modelling', NULL, '/art/modelling-09.jpg', 'Seated at a small round cafe table in a black jacket and orange dress, glancing over one shoulder.', '1333/2000', NULL, 'console'),
  ('modelling-10', 'Modelling 10', 'modelling', NULL, '/art/modelling-10.jpg', 'At a cafe table outside behind iron railings, sunglasses on, an iced coffee and a black handbag beside.', '1333/2000', NULL, 'console'),
  ('modelling-11', 'Modelling 11', 'modelling', NULL, '/art/modelling-11.jpg', 'Studio profile on grey: slicked-back burgundy hair, a black backless one-piece, looking up.', '941/1513', NULL, 'console'),
  ('modelling-12', 'Modelling 12', 'modelling', NULL, '/art/modelling-12.jpg', 'Seated in a blue velvet armchair against a warm wall, burgundy bob, leopard-print two-piece.', '941/1672', NULL, 'console'),
  ('modelling-13', 'Modelling 13', 'modelling', NULL, '/art/modelling-13.jpg', 'Reclining across a velvet chair against a mottled wall, burgundy hair, one hand raised to the head.', '1122/1402', NULL, 'console'),
  ('modelling-14', 'Modelling 14', 'modelling', NULL, '/art/modelling-14.jpg', 'In a photo studio between lights, wet burgundy hair, a red mesh bodysuit, looking back over one shoulder.', '989/1591', NULL, 'console'),
  ('modelling-15', 'Modelling 15', 'modelling', NULL, '/art/modelling-15.jpg', 'Studio portrait on grey, burgundy waves, a white and red string two-piece, one hand at the collarbone.', '1086/1448', NULL, 'console'),
  ('phoenix', 'Phoenix', 'canvas', '2025', '/art/phoenix.jpg', 'A burst of red and orange impasto flame rises from black, crowned by swirls of blue and white.', '1458/2000', NULL, 'console'),
  ('pleading', 'Pleading', 'canvas', '2026', '/art/pleading.jpg', 'A close-up of a wide, bloodshot eye with a deep teal iris, painted in loose strokes of pink, white and red.', '2000/1565', NULL, 'console'),
  ('poisoned', 'Poisoned', 'canvas', '2025', '/art/poisoned.jpg', 'A figure in a thick red impasto gown, arms and pearls picked out in white, against a dark green and grey ground.', '1539/2000', NULL, 'console'),
  ('rebirth', 'Rebirth', 'canvas', '2025', '/art/rebirth.jpg', 'A bird-like burst of red, ochre and yellow impasto rises through black and cold blue, wings flung wide.', '1553/2000', NULL, 'console'),
  ('self-reflection', 'Self Reflection', 'canvas', '2025', '/art/self-reflection.jpg', 'A large blue-grey eye ringed with pink; inside the iris a small dark-haired figure looks back out.', '2000/1530', NULL, 'console')
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "category" = EXCLUDED."category",
  "year" = EXCLUDED."year",
  "media_path" = EXCLUDED."media_path",
  "alt" = EXCLUDED."alt",
  "aspect" = EXCLUDED."aspect",
  "body" = EXCLUDED."body",
  "origin" = 'console',
  "updated_at" = now();
