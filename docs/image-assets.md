# Generated website image assets

Created 2026-09-25 with the built-in image_gen tool. Original artifacts copied to output/imagegen; WebP copies use format compression only, without content edits. Concept art, not actual offices/products/client work.

P-0004 approved 2026-09-25. Preserved production copies: `public/images/brand-connections.webp` (115,010 bytes) and `public/images/creative-materials.webp` (91,240 bytes). Both preserve the generated 1536×1024 dimensions. At that release the connection artwork appeared on home/about, and materials on home/business/careers. P-0006 now uses the connection artwork only on Company as explicitly labeled brand concept art; the unused materials asset is retained for rollback/reuse. Original prompts below are preserved for future revisions.

## P-0006 / v2.2.0 — provided operational captures

Approved 2026-09-30. These three captures already existed in the provided company
deck and in the approved P-0006 preview. This update received no new product image
attachment, so no new raster generation or editing was performed. The original
screens, product labels, prices and logos were not changed. Ivory frames, balanced
contain crops and factual captions apply the approved site tone without fabricating
products. Deck prices/assortment are historical reference, not a live catalog.

| Source / deck page | Public copy | Dimensions / bytes | Current placement |
|---|---|---|---|
| `tmp/p5-assets/product-portfolio.webp`, p34 | `public/images/commerce/product-portfolio.webp` | 1200×1000 / 75,336 | Home PET chapter, Business PET |
| `tmp/p5-assets/store-screen.webp`, p33 | `public/images/commerce/store-screen.webp` | 646×1400 / 84,234 | Business own-store example |
| `tmp/p5-assets/content-hub.webp`, p35 | `public/images/commerce/content-hub.webp` | 1200×675 / 42,096 | Home In Action |

Source and public copy SHA-256 are identical:

- portfolio: `5c21e8818b64a47e5b77a7d55225617ebc4f5667f569ce7435c0f9f77312098d`
- store: `8689e486597425cfffd104b1bd18696cd7f119a25953da60dfd67ef1736b8baf`
- hub: `c61dd93007ca09e68ab2fa8029258efb2d502220ec2879257c190be630079062`

PRINT, exhibitions and workplace are described with editorial operational panels,
not fabricated warehouse/employee/product photographs. New actual product images
must follow `docs/image-workflow.md` and active rule R-0001.

## brand-connections

- Original: `output/imagegen/brand-connections.png`
- Web: `output/imagegen/brand-connections.webp` (1536×1024)
- Intended placement: home parallax brand panel and about editorial image

Prompt:

Use case: stylized-concept. Asset type: wide editorial image for the ONSHIVE Korean business website, a visual about connecting strategy, creativity and commerce. Generate a refined photoreal 3D still life, landscape 3:2 framing. A single wide matte honey-gold ribbon curves through and connects three sculptural objects: an ivory paper arch, a charcoal brushed-metal cylinder and a translucent warm amber glass slab, all on a warm ivory architectural plinth. Confident asymmetrical composition, sculptural geometry, tactile paper edges, satin metal, real amber caustics, physically plausible contact shadows. Strong late-afternoon sidelight from upper left, a warm minimalist art-gallery setting. Palette strictly warm off-white #f5f4ef, near charcoal #191b18, muted honey gold #d6a223 and soft stone. Objects span the middle and right, left third quiet ivory negative space for separate HTML typography. Sophisticated architectural editorial photography, medium-format clarity, subtle film grain, very high material realism. No people, no office, no computer screens, no text, no letters, no logos, no watermarks, no hexagons, no stock handshakes. This is a brand concept artwork, not a photograph of a real company location.

## creative-materials

- Original: `output/imagegen/creative-materials.png`
- Web: `output/imagegen/creative-materials.webp` (1536×1024)
- Intended placement: business materials showcase and careers editorial image

Prompt:

Use case: product-mockup. Asset type: wide conceptual image for a premium Korean branding and ecommerce company website ONSHIVE, to accompany business services and creative culture. Generate a sophisticated editorial still-life photograph in landscape 3:2 framing. On a warm ivory studio table, an artfully composed set of completely unbranded cream packaging boxes, thick blank paper samples, a folded charcoal card, a small translucent amber glass sphere and a single broad mustard-gold paper strip weaving through the composition. One large upright blank cream packaging form on the right, smaller geometric packaging forms staggered near the middle, elegant diagonal long shadows on the left. Tangible paper fibres, slightly imperfect folds, satin surfaces, precisely controlled natural window light. Quiet confident creative studio atmosphere, medium-format product photography, premium magazine art direction. Palette warm off-white #f5f4ef, charcoal #191b18 and honey gold #d6a223 only. Fill the image with a balanced substantial arrangement and enough calm negative space; no people, no actual office claims, no readable text, no brands, no screens, no watermark, no hexagons, no fake typography. Conceptual branding materials only.
